import { useState, useMemo } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext } from '@/contexts/DataContext';
import TaskCard from '@/components/tasks/TaskCard';
import TaskDialog from '@/components/tasks/TaskDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Task } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Tasks = () => {
  const { user } = useAuthContext();
  const { tasks, users, approveExtension, rejectExtension, updateTask, deleteTask } = useDataContext();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [acceptanceFilter, setAcceptanceFilter] = useState<string>('all');

  // Extension approval dialog
  const [extensionDialogOpen, setExtensionDialogOpen] = useState(false);
  const [extensionTask, setExtensionTask] = useState<Task | null>(null);
  const [customDeadline, setCustomDeadline] = useState('');

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Role-based filtering
    if (user?.role === 'team_leader') {
      filtered = filtered.filter(t => t.teamId === user.teamId);
    } else if (user?.role === 'user') {
      filtered = filtered.filter(t => t.assignedUserId === user.id);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    // Acceptance status filter
    if (acceptanceFilter !== 'all') {
      filtered = filtered.filter(t => t.acceptanceStatus === acceptanceFilter);
    }

    return filtered;
  }, [tasks, user, searchQuery, statusFilter, priorityFilter, acceptanceFilter]);

  const tasksByStatus = useMemo(() => ({
    pending: filteredTasks.filter(t => t.status === 'pending'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
  }), [filteredTasks]);

  // Tasks needing attention (for team leader)
  const extensionRequests = useMemo(() => 
    tasks.filter(t => 
      t.acceptanceStatus === 'extension_requested' && 
      (user?.role === 'admin' || t.teamId === user?.teamId)
    ), 
    [tasks, user]
  );

  const rejectedTasks = useMemo(() => 
    tasks.filter(t => 
      t.acceptanceStatus === 'rejected' && 
      (user?.role === 'admin' || t.teamId === user?.teamId)
    ), 
    [tasks, user]
  );

  const getUser = (userId: string) => users.find(u => u.id === userId);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDialogMode(user?.role === 'user' ? 'view' : 'edit');
    setDialogOpen(true);
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleExtensionClick = (task: Task) => {
    setExtensionTask(task);
    setCustomDeadline(task.requestedDeadline || task.deadline);
    setExtensionDialogOpen(true);
  };

  const handleApproveExtension = () => {
    if (!extensionTask || !user) return;
    approveExtension(extensionTask.id, user.id, customDeadline);
    toast({
      title: 'Extension Approved',
      description: 'The deadline has been updated.',
    });
    setExtensionDialogOpen(false);
  };

  const handleRejectExtension = () => {
    if (!extensionTask || !user) return;
    rejectExtension(extensionTask.id, user.id);
    toast({
      title: 'Extension Rejected',
      description: 'The user has been notified.',
    });
    setExtensionDialogOpen(false);
  };

  const handleReassignRejected = (task: Task) => {
    setSelectedTask(task);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleDeleteRejected = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this rejected task?')) {
      deleteTask(taskId, user?.id);
      toast({
        title: 'Task Deleted',
        description: 'The rejected task has been removed.',
      });
    }
  };

  const canCreateTask = user?.role === 'admin' || user?.role === 'team_leader';
  const showWorkflowAlerts = (user?.role === 'admin' || user?.role === 'team_leader') && 
    (extensionRequests.length > 0 || rejectedTasks.length > 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">
            {user?.role === 'user' ? 'Your assigned tasks' : 'Manage and track all tasks'}
          </p>
        </div>
        {canCreateTask && (
          <Button onClick={handleCreateTask}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        )}
      </div>

      {/* Workflow Alerts */}
      {showWorkflowAlerts && (
        <div className="space-y-3">
          {/* Extension Requests */}
          {extensionRequests.length > 0 && (
            <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <h3 className="font-semibold">Extension Requests ({extensionRequests.length})</h3>
              </div>
              <div className="space-y-2">
                {extensionRequests.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {getUser(task.assignedUserId)?.name} requests: {task.extensionReason}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleExtensionClick(task)}>
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejected Tasks */}
          {rejectedTasks.length > 0 && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold">Rejected Tasks ({rejectedTasks.length})</h3>
              </div>
              <div className="space-y-2">
                {rejectedTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Rejected by {getUser(task.assignedUserId)?.name}: {task.rejectionReason}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleReassignRejected(task)}>
                        Reassign
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteRejected(task.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={acceptanceFilter} onValueChange={setAcceptanceFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Acceptance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Acceptance</SelectItem>
            <SelectItem value="pending">Pending Acceptance</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="extension_requested">Extension Requested</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="w-3 h-3 rounded-full bg-muted-foreground" />
            <h3 className="font-semibold">Pending</h3>
            <span className="text-sm text-muted-foreground">({tasksByStatus.pending.length})</span>
          </div>
          <div className="space-y-3">
            {tasksByStatus.pending.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                assignedUser={getUser(task.assignedUserId)}
                onClick={() => handleTaskClick(task)}
              />
            ))}
            {tasksByStatus.pending.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No pending tasks
              </p>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <h3 className="font-semibold">In Progress</h3>
            <span className="text-sm text-muted-foreground">({tasksByStatus.in_progress.length})</span>
          </div>
          <div className="space-y-3">
            {tasksByStatus.in_progress.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                assignedUser={getUser(task.assignedUserId)}
                onClick={() => handleTaskClick(task)}
              />
            ))}
            {tasksByStatus.in_progress.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No tasks in progress
              </p>
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="w-3 h-3 rounded-full bg-success" />
            <h3 className="font-semibold">Completed</h3>
            <span className="text-sm text-muted-foreground">({tasksByStatus.completed.length})</span>
          </div>
          <div className="space-y-3">
            {tasksByStatus.completed.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                assignedUser={getUser(task.assignedUserId)}
                onClick={() => handleTaskClick(task)}
              />
            ))}
            {tasksByStatus.completed.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No completed tasks
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
        mode={dialogMode}
      />

      {/* Extension Review Dialog */}
      <Dialog open={extensionDialogOpen} onOpenChange={setExtensionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Extension Request</DialogTitle>
            <DialogDescription>
              Review and approve or reject the deadline extension request.
            </DialogDescription>
          </DialogHeader>
          
          {extensionTask && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium">{extensionTask.title}</p>
                <p className="text-sm text-muted-foreground">
                  Requested by: {getUser(extensionTask.assignedUserId)?.name}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Current deadline:</span>{' '}
                  {extensionTask.deadline}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Requested deadline:</span>{' '}
                  {extensionTask.requestedDeadline}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Reason:</span>{' '}
                  {extensionTask.extensionReason}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Approve with deadline (optional adjustment)</Label>
                <Input
                  type="date"
                  value={customDeadline}
                  onChange={(e) => setCustomDeadline(e.target.value)}
                  min={extensionTask.deadline}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="destructive" onClick={handleRejectExtension}>
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button onClick={handleApproveExtension}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;

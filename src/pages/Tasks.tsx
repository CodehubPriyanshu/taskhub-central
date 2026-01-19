import { useState, useMemo } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext } from '@/contexts/DataContext';
import TaskCard from '@/components/tasks/TaskCard';
import TaskDialog from '@/components/tasks/TaskDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';
import { Task } from '@/types';

const Tasks = () => {
  const { user } = useAuthContext();
  const { tasks, users } = useDataContext();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

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

    return filtered;
  }, [tasks, user, searchQuery, statusFilter, priorityFilter]);

  const tasksByStatus = useMemo(() => ({
    pending: filteredTasks.filter(t => t.status === 'pending'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
  }), [filteredTasks]);

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

  const canCreateTask = user?.role === 'admin' || user?.role === 'team_leader';

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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
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
    </div>
  );
};

export default Tasks;

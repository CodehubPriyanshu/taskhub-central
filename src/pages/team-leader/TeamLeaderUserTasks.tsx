import { useState, useMemo } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Search, 
  User, 
  Users, 
  Calendar, 
  Pencil,
  Eye,
  Check,
  X
} from 'lucide-react';
import { Task, User as UserType } from '@/types';
import { useToast } from '@/hooks/use-toast';

const TeamLeaderUserTasks = () => {
  const { user: currentUser } = useAuthContext();
  const { 
    tasks, 
    users, 
    teams, 
    createTask, 
    updateTask, 
    deleteTask,
    approveTaskEdit,
    rejectTaskEdit
  } = useDataContext();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Task creation/edit form state
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    assignedUserId: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'pending' as 'pending' | 'in_progress' | 'completed',
    startDate: '',
    deadline: '',
  });

  // Filter tasks created by this team leader for their users
  const teamLeaderTasks = useMemo(() => {
    return tasks.filter(task => {
      // Get the team of the current user (team leader)
      const currentUserTeam = teams.find(t => t.leaderId === currentUser?.id);
      
      // Return tasks created by this team leader for users in their team
      return task.createdById === currentUser?.id && 
             currentUserTeam?.id === task.teamId;
    });
  }, [tasks, currentUser?.id, teams]);

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    let filtered = [...teamLeaderTasks];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
  }, [teamLeaderTasks, searchQuery, statusFilter, priorityFilter]);

  // Get users under this team leader
  const getUsersUnderLeader = () => {
    const currentUserTeam = teams.find(t => t.leaderId === currentUser?.id);
    if (!currentUserTeam) return [];
    
    return users.filter(u => 
      u.teamId === currentUserTeam.id && 
      u.role === 'user' &&
      u.id !== currentUser?.id // Exclude the team leader themselves
    );
  };

  // Handle task click
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDialogMode('view');
    setDialogOpen(true);
  };

  // Handle task edit
  const handleTaskEdit = (task: Task) => {
    setSelectedTask(task);
    setDialogMode('edit');
    
    // Set form data to task values
    setTaskFormData({
      title: task.title,
      description: task.description || '',
      assignedUserId: task.assignedUserId,
      priority: task.priority,
      status: task.status,
      startDate: task.startDate,
      deadline: task.deadline,
    });
    
    setDialogOpen(true);
  };

  // Handle create task
  const handleCreateTask = () => {
    setSelectedTask(null);
    setDialogMode('create');
    // Reset form data
    setTaskFormData({
      title: '',
      description: '',
      assignedUserId: '',
      priority: 'medium',
      status: 'pending',
      startDate: new Date().toISOString().split('T')[0],
      deadline: '',
    });
    setDialogOpen(true);
  };

  // Handle task form submit
  const handleTaskFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskFormData.title || !taskFormData.assignedUserId || !taskFormData.deadline) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (dialogMode === 'create') {
      // Create new task
      createTask(
        {
          title: taskFormData.title,
          description: taskFormData.description,
          assignedUserId: taskFormData.assignedUserId,
          priority: taskFormData.priority,
          status: taskFormData.status,
          startDate: taskFormData.startDate,
          deadline: taskFormData.deadline,
          teamId: teams.find(t => t.leaderId === currentUser?.id)?.id || '',
        },
        currentUser!.id // Current team leader creates the task
      );

      toast({
        title: 'Task Created',
        description: `Task "${taskFormData.title}" created successfully`,
      });
    } else if (selectedTask) {
      // Update existing task
      updateTask(
        selectedTask.id,
        {
          title: taskFormData.title,
          description: taskFormData.description,
          assignedUserId: taskFormData.assignedUserId,
          priority: taskFormData.priority,
          status: taskFormData.status,
          startDate: taskFormData.startDate,
          deadline: taskFormData.deadline,
        },
        currentUser?.id
      );

      toast({
        title: 'Task Updated',
        description: `Task "${taskFormData.title}" updated successfully`,
      });
    }

    setDialogOpen(false);
  };

  // Handle approve edit request
  const handleApproveEdit = (task: Task) => {
    if (!currentUser) return;
    
    approveTaskEdit(task.id, currentUser.id);
    toast({
      title: 'Edit Request Approved',
      description: 'The edit request has been approved',
    });
  };

  // Handle reject edit request
  const handleRejectEdit = (task: Task) => {
    if (!currentUser) return;
    
    rejectTaskEdit(task.id, currentUser.id);
    toast({
      title: 'Edit Request Rejected',
      description: 'The edit request has been rejected',
    });
  };

  // Get user by ID
  const getUser = (userId: string) => users.find(u => u.id === userId);

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', label: 'Pending' },
      in_progress: { variant: 'default', label: 'In Progress' },
      completed: { variant: 'outline', label: 'Completed' },
    };
    
    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      high: { variant: 'destructive', label: 'High' },
      medium: { variant: 'default', label: 'Medium' },
      low: { variant: 'secondary', label: 'Low' },
    };
    
    const c = config[priority] || config.medium;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  // Get request status badge
  const getRequestStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    
    const config: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending Approval' },
      approved: { variant: 'outline', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    };
    
    const c = config[status] || config.pending;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Tasks</h1>
          <p className="text-muted-foreground">Manage tasks for your team members</p>
        </div>
        <Button onClick={handleCreateTask}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teamLeaderTasks.length}</p>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                <Check className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {teamLeaderTasks.filter(t => t.status === 'completed').length}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {teamLeaderTasks.filter(t => t.editRequestStatus === 'pending').length}
                </p>
                <p className="text-xs text-muted-foreground">Edit Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Edit Request</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => {
                  const assignedUser = getUser(task.assignedUserId);
                  
                  return (
                    <TableRow key={task.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium">{task.title}</div>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {task.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-xs">
                            {assignedUser?.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{assignedUser?.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(task.status)}
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(task.priority)}
                      </TableCell>
                      <TableCell>{new Date(task.deadline).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {getRequestStatusBadge(task.editRequestStatus)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {task.editRequestStatus === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveEdit(task)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectEdit(task)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTaskEdit(task)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTaskClick(task)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Task Creation/Edit Dialog */}
      <Dialog open={dialogOpen && (dialogMode === 'create' || dialogMode === 'edit')} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'create' ? 'Create New Task' : 'Edit Task'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTaskFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={taskFormData.title}
                onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                placeholder="Enter task title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={taskFormData.description}
                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedUser">Assign To *</Label>
                <Select
                  value={taskFormData.assignedUserId}
                  onValueChange={(value) => setTaskFormData({ ...taskFormData, assignedUserId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {getUsersUnderLeader().map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={taskFormData.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setTaskFormData({ ...taskFormData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={taskFormData.status}
                  onValueChange={(value: 'pending' | 'in_progress' | 'completed') => 
                    setTaskFormData({ ...taskFormData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="deadline"
                    type="date"
                    value={taskFormData.deadline}
                    onChange={(e) => setTaskFormData({ ...taskFormData, deadline: e.target.value })}
                    className="pl-9"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={taskFormData.startDate}
                  onChange={(e) => setTaskFormData({ ...taskFormData, startDate: e.target.value })}
                  className="pl-9"
                  max={taskFormData.deadline}
                />
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{dialogMode === 'create' ? 'Create Task' : 'Save Changes'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamLeaderUserTasks;
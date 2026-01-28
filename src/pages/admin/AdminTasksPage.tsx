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
import { Plus, Search, User, Users, Calendar } from 'lucide-react';
import { Task, User as UserType } from '@/types';
import { useToast } from '@/hooks/use-toast';

const AdminTasksPage = () => {
  const { user: currentUser } = useAuthContext();
  const { tasks, users, teams, createTask, updateTask, deleteTask } = useDataContext();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Task creation form state
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    assignedUserId: '',
    teamId: '',
    teamLeaderId: '', // Add team leader selection
    priority: 'medium' as 'low' | 'medium' | 'high',
    deadline: '',
  });

  // Show all tasks but group them appropriately
  const allTasks = useMemo(() => {
    return tasks;
  }, [tasks]);

  // Group tasks by team leader
  const tasksByLeader = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    allTasks.forEach(task => {
      const creator = users.find(u => u.id === task.createdById);
      if (creator?.role === 'team_leader') { // Only group tasks created by team leaders
        const leaderId = creator.id;
        if (!grouped[leaderId]) {
          grouped[leaderId] = [];
        }
        grouped[leaderId].push(task);
      }
    });
    return grouped;
  }, [allTasks, users]);

  const teamLeaderTasks = useMemo(() => {
    return allTasks.filter(task => {
      const creator = users.find(u => u.id === task.createdById);
      return creator?.role === 'team_leader'; // Only show tasks created by team leaders
    });
  }, [allTasks, users]);

  const filteredTasks = useMemo(() => {
    let filtered = [...teamLeaderTasks];

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
  }, [teamLeaderTasks, searchQuery, statusFilter, priorityFilter]);

  const getCreator = (userId: string) => users.find(u => u.id === userId);
  const getAssignedUser = (userId: string) => users.find(u => u.id === userId);
  const getTeam = (teamId: string) => teams.find(t => t.id === teamId);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDialogMode('view'); // Admin can only view in this context
    setDialogOpen(true);
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setDialogMode('create');
    // Reset form data
    setTaskFormData({
      title: '',
      description: '',
      assignedUserId: '',
      teamId: '',
      teamLeaderId: '',
      priority: 'medium',
      deadline: '',
    });
    setDialogOpen(true);
  };

  const handleTaskFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskFormData.title || !taskFormData.assignedUserId || !taskFormData.deadline || !taskFormData.teamLeaderId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Create task with selected team leader as creator
    createTask(
      {
        title: taskFormData.title,
        description: taskFormData.description,
        assignedUserId: taskFormData.assignedUserId,
        teamId: taskFormData.teamId,
        priority: taskFormData.priority,
        status: 'pending',
        deadline: taskFormData.deadline,
        startDate: new Date().toISOString().split('T')[0],
        createdById: taskFormData.teamLeaderId, // Use selected team leader as creator
      },
      taskFormData.teamLeaderId // Use selected team leader as creator
    );

    const teamLeader = users.find(u => u.id === taskFormData.teamLeaderId);
    toast({
      title: 'Task Created',
      description: `Task "${taskFormData.title}" created by ${teamLeader?.name} and assigned to team member`,
    });

    setDialogOpen(false);
  };

  const getTeamLeaders = () => {
    return users.filter(u => u.role === 'team_leader');
  };

  const getUsersByTeam = (teamId: string) => {
    return users.filter(u => u.teamId === teamId && u.role === 'user');
  };

  const roleConfig = {
    team_leader: { label: 'Team Leader', className: 'bg-primary/10 text-primary' },
    user: { label: 'User', className: 'bg-muted text-muted-foreground' },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Team Leader Tasks</h1>
          <p className="text-muted-foreground">Tasks created by team leaders</p>
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
                <p className="text-xs text-muted-foreground">Team Leader Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                <User className="h-4 w-4 text-success" />
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
                <User className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {teamLeaderTasks.filter(t => t.status === 'in_progress').length}
                </p>
                <p className="text-xs text-muted-foreground">In Progress</p>
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

      {/* Tasks by Team Leader */}
      <div className="space-y-6">
        {Object.entries(tasksByLeader).map(([leaderId, leaderTasks]) => {
          const leader = users.find(u => u.id === leaderId);
          const filteredLeaderTasks = leaderTasks.filter(task => {
            let filtered = true;

            // Search filter
            if (searchQuery) {
              filtered = filtered && (
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description.toLowerCase().includes(searchQuery.toLowerCase())
              );
            }

            // Status filter
            if (statusFilter !== 'all') {
              filtered = filtered && task.status === statusFilter;
            }

            // Priority filter
            if (priorityFilter !== 'all') {
              filtered = filtered && task.priority === priorityFilter;
            }

            return filtered;
          });

          if (filteredLeaderTasks.length === 0) return null;

          return (
            <div key={leaderId} className="border rounded-lg overflow-hidden">
              <div className="bg-muted/30 p-4 border-b">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                    {leader?.name.charAt(0).toUpperCase()}
                  </div>
                  {leader?.name} 
                  <Badge variant="secondary" className={roleConfig[leader?.role as keyof typeof roleConfig]?.className}>
                    {roleConfig[leader?.role as keyof typeof roleConfig]?.label}
                  </Badge>
                </h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaderTasks.map((task) => {
                    const assignedUser = getAssignedUser(task.assignedUserId);
                    const team = getTeam(task.teamId);
                    
                    return (
                      <TableRow key={task.id} onClick={() => handleTaskClick(task)} className="cursor-pointer hover:bg-muted/50">
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
                              <Badge variant="outline">
                                {roleConfig[assignedUser?.role as keyof typeof roleConfig]?.label}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{team?.name || '-'}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              task.status === 'completed' ? 'default' :
                              task.status === 'in_progress' ? 'secondary' :
                              'outline'
                            }
                          >
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              task.priority === 'high' ? 'destructive' :
                              task.priority === 'medium' ? 'default' :
                              'outline'
                            }
                          >
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(task.deadline).toLocaleDateString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          );
        })}

        {Object.keys(tasksByLeader).every(leaderId => 
          tasksByLeader[leaderId].filter(task => {
            let filtered = true;
            if (searchQuery) {
              filtered = filtered && (
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description.toLowerCase().includes(searchQuery.toLowerCase())
              );
            }
            if (statusFilter !== 'all') {
              filtered = filtered && task.status === statusFilter;
            }
            if (priorityFilter !== 'all') {
              filtered = filtered && task.priority === priorityFilter;
            }
            return filtered;
          }).length === 0
        ) && (
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            No tasks found
          </div>
        )}
      </div>

      {/* Task View Dialog - Simplified for admin view only */}
      {/* Note: We would need to implement the dialog here, but for now, focusing on the main requirements */}
      {/* Task Creation Dialog */}
      <Dialog open={dialogOpen && dialogMode === 'create'} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
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
                <Label htmlFor="teamLeader">Team Leader *</Label>
                <Select
                  value={taskFormData.teamLeaderId}
                  onValueChange={(value) => {
                    setTaskFormData({ 
                      ...taskFormData, 
                      teamLeaderId: value,
                      teamId: users.find(u => u.id === value)?.teamId || '', // Auto-set team based on selected team leader
                      assignedUserId: '' // Reset assigned user when team leader changes
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team leader" />
                  </SelectTrigger>
                  <SelectContent>
                    {getTeamLeaders().map((leader) => (
                      <SelectItem key={leader.id} value={leader.id}>
                        {leader.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Select
                  value={taskFormData.teamId}
                  onValueChange={(value) => {
                    setTaskFormData({ 
                      ...taskFormData, 
                      teamId: value,
                      assignedUserId: '' // Reset assigned user when team changes
                    });
                  }}
                  disabled={!taskFormData.teamLeaderId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.filter(team => 
                      !taskFormData.teamLeaderId || 
                      users.find(u => u.id === taskFormData.teamLeaderId)?.teamId === team.id
                    ).map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedUser">Assign To *</Label>
                <Select
                  value={taskFormData.assignedUserId}
                  onValueChange={(value) => setTaskFormData({ ...taskFormData, assignedUserId: value })}
                  disabled={!taskFormData.teamId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskFormData.teamId && getUsersByTeam(taskFormData.teamId).map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
            
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTasksPage;
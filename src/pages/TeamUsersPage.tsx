import { useState, useMemo } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Search, 
  Eye, 
  ClipboardList, 
  History, 
  Users,
  UserCheck,
  UserX,
  Mail,
  Phone
} from 'lucide-react';
import { User, Task } from '@/types';

const TeamUsersPage = () => {
  const { user } = useAuthContext();
  const { users, tasks, teams } = useDataContext();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogMode, setDialogMode] = useState<'details' | 'history' | null>(null);

  // Get the team leader's team
  const myTeam = useMemo(() => {
    return teams.find(t => t.leaderId === user?.id);
  }, [teams, user?.id]);

  // Get only users from the team leader's team (strict data isolation)
  const teamUsers = useMemo(() => {
    if (!myTeam) return [];
    return users.filter(u => u.teamId === myTeam.id && u.id !== user?.id);
  }, [users, myTeam, user?.id]);

  // Get task statistics for each user
  const getUserTaskStats = (userId: string) => {
    const userTasks = tasks.filter(t => t.assignedUserId === userId);
    return {
      total: userTasks.length,
      pending: userTasks.filter(t => t.status === 'pending').length,
      inProgress: userTasks.filter(t => t.status === 'in_progress').length,
      completed: userTasks.filter(t => t.status === 'completed').length,
    };
  };

  // Get user's task history
  const getUserTaskHistory = (userId: string): Task[] => {
    return tasks.filter(t => t.assignedUserId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  };

  // Filter users based on search and status
  const filteredUsers = useMemo(() => {
    return teamUsers.filter(u => {
      const matchesSearch = 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (statusFilter === 'all') return matchesSearch;
      if (statusFilter === 'active') return matchesSearch && u.isActive;
      if (statusFilter === 'inactive') return matchesSearch && !u.isActive;
      
      // Filter by task status
      const stats = getUserTaskStats(u.id);
      if (statusFilter === 'has_pending') return matchesSearch && stats.pending > 0;
      if (statusFilter === 'has_in_progress') return matchesSearch && stats.inProgress > 0;
      if (statusFilter === 'has_completed') return matchesSearch && stats.completed > 0;
      if (statusFilter === 'no_tasks') return matchesSearch && stats.total === 0;
      
      return matchesSearch;
    });
  }, [teamUsers, searchQuery, statusFilter]);

  const handleViewDetails = (u: User) => {
    setSelectedUser(u);
    setDialogMode('details');
  };

  const handleAssignTask = (u: User) => {
    // Navigate to tasks page with user pre-selected
    navigate('/tasks', { state: { assignToUser: u.id } });
  };

  const handleViewHistory = (u: User) => {
    setSelectedUser(u);
    setDialogMode('history');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      in_progress: 'default',
      completed: 'outline',
    };
    const labels: Record<string, string> = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  // Role-based access: Only Team Leaders can access this page
  if (user?.role !== 'team_leader') {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              This page is only accessible to Team Leaders.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage users in {myTeam?.name || 'your team'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm py-1.5 px-3">
            <Users className="h-4 w-4 mr-2" />
            {teamUsers.length} Member{teamUsers.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="has_pending">Has Pending Tasks</SelectItem>
                <SelectItem value="has_in_progress">Has In Progress Tasks</SelectItem>
                <SelectItem value="has_completed">Has Completed Tasks</SelectItem>
                <SelectItem value="no_tasks">No Tasks Assigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {teamUsers.length === 0 
                ? 'No users assigned to your team' 
                : 'No users match your search'}
            </h3>
            <p className="text-muted-foreground">
              {teamUsers.length === 0 
                ? 'Contact an Admin to add members to your team.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Team Members ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">Tasks</TableHead>
                  <TableHead className="text-center">Task Status</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((teamUser) => {
                  const stats = getUserTaskStats(teamUser.id);
                  return (
                    <TableRow key={teamUser.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {teamUser.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium">{teamUser.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {teamUser.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {teamUser.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold">{stats.total}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            {stats.pending} P
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {stats.inProgress} IP
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {stats.completed} C
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {teamUser.isActive ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <UserX className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(teamUser)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAssignTask(teamUser)}
                            title="Assign Task"
                          >
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewHistory(teamUser)}
                            title="View Task History"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* User Details Dialog */}
      <Dialog open={dialogMode === 'details'} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View information about this team member
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-primary">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <Badge variant="outline" className="capitalize mt-1">
                    {selectedUser.role.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedUser.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Not available</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Team: {myTeam?.name || 'N/A'}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Task Summary</h4>
                {(() => {
                  const stats = getUserTaskStats(selectedUser.id);
                  return (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-muted">
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                        <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{stats.pending}</div>
                        <div className="text-xs text-yellow-700 dark:text-yellow-300">Pending</div>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                        <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{stats.inProgress}</div>
                        <div className="text-xs text-blue-700 dark:text-blue-300">In Progress</div>
                      </div>
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                        <div className="text-2xl font-bold text-green-800 dark:text-green-200">{stats.completed}</div>
                        <div className="text-xs text-green-700 dark:text-green-300">Completed</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex-1" 
                  onClick={() => handleAssignTask(selectedUser)}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Assign Task
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setDialogMode('history');
                  }}
                >
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Task History Dialog */}
      <Dialog open={dialogMode === 'history'} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task History</DialogTitle>
            <DialogDescription>
              {selectedUser?.name}'s task history
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              {getUserTaskHistory(selectedUser.id).length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No tasks assigned yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getUserTaskHistory(selectedUser.id).map((task) => (
                    <Card key={task.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{task.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {task.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              Due: {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(task.status)}
                          <Badge 
                            variant={
                              task.priority === 'high' ? 'destructive' : 
                              task.priority === 'medium' ? 'default' : 'secondary'
                            }
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamUsersPage;

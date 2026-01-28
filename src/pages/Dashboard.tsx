import { useMemo } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext } from '@/contexts/DataContext';
import StatCard from '@/components/dashboard/StatCard';
import TaskCard from '@/components/tasks/TaskCard';
import { Badge } from '@/components/ui/badge';
import { 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Users,
  UsersRound,
  XCircle,
  AlertTriangle,
  Calendar,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { isPast, format } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuthContext();
  const { tasks, users, teams } = useDataContext();

  const filteredTasks = useMemo(() => {
    if (user?.role === 'admin') {
      return tasks;
    } else if (user?.role === 'team_leader') {
      return tasks.filter(t => t.teamId === user.teamId);
    } else {
      return tasks.filter(t => t.assignedUserId === user?.id);
    }
  }, [tasks, user]);

  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const pending = filteredTasks.filter(t => t.status === 'pending').length;
    const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length;
    const completed = filteredTasks.filter(t => t.status === 'completed').length;
    const overdue = filteredTasks.filter(t => 
      isPast(new Date(t.deadline)) && t.status !== 'completed'
    ).length;
    const pendingAcceptance = filteredTasks.filter(t => t.acceptanceStatus === 'pending').length;
    const rejected = filteredTasks.filter(t => t.acceptanceStatus === 'rejected').length;
    const extensionRequested = filteredTasks.filter(t => t.acceptanceStatus === 'extension_requested').length;

    return { total, pending, inProgress, completed, overdue, pendingAcceptance, rejected, extensionRequested };
  }, [filteredTasks]);

  const recentTasks = useMemo(() => {
    return [...filteredTasks]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }, [filteredTasks]);



  const getUser = (userId: string) => users.find(u => u.id === userId);
  const getUserTeam = () => teams.find(t => t.id === user?.teamId);

  const isAdmin = user?.role === 'admin';
  const isTeamLeader = user?.role === 'team_leader';

  // Team leader stats
  const teamMembers = useMemo(() => {
    if (!isTeamLeader) return [];
    return users.filter(u => u.teamId === user?.teamId && u.role === 'user');
  }, [users, user, isTeamLeader]);

  const tasksCreatedByMe = useMemo(() => {
    return tasks.filter(t => t.createdById === user?.id);
  }, [tasks, user]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! 
            {isTeamLeader && getUserTeam() && ` - ${getUserTeam()?.name}`}
          </p>
        </div>
        {isTeamLeader && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Joined: {user?.createdAt && format(new Date(user.createdAt), 'MMM dd, yyyy')}</span>
          </div>
        )}
      </div>

      {/* User Personal Info Card (Team Leader / User) */}
      {!isAdmin && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{user?.name}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {user?.role === 'team_leader' ? 'Team Leader' : 'User'}
                  </Badge>
                  {getUserTeam() && (
                    <Badge variant="secondary" className="text-xs">
                      <Building2 className="h-3 w-3 mr-1" />
                      {getUserTeam()?.name}
                    </Badge>
                  )}
                </div>
              </div>
              {isTeamLeader && (
                <div className="text-right">
                  <p className="text-2xl font-bold">{teamMembers.length}</p>
                  <p className="text-xs text-muted-foreground">Team Members</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tasks"
          value={stats.total}
          icon={CheckSquare}
          variant="primary"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Overdue"
          value={stats.overdue}
          icon={AlertCircle}
          variant="destructive"
        />
      </div>

      {/* Workflow Stats (visible to Admin and Team Leader) */}
      {(isAdmin || isTeamLeader) && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className={stats.pendingAcceptance > 0 ? 'border-muted-foreground/30' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Awaiting Acceptance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pendingAcceptance}</div>
              <p className="text-xs text-muted-foreground">Tasks waiting for user response</p>
            </CardContent>
          </Card>
          
          <Card className={stats.rejected > 0 ? 'border-destructive/30' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                Rejected Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">Tasks rejected by assignees</p>
            </CardContent>
          </Card>

          <Card className={stats.extensionRequested > 0 ? 'border-warning/30' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Extension Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{stats.extensionRequested}</div>
              <p className="text-xs text-muted-foreground">Pending deadline extensions</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin Extra Stats */}
      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            title="Total Users"
            value={users.filter(u => u.role !== 'admin' && u.isActive).length}
            icon={Users}
          />
          <StatCard
            title="Total Teams"
            value={teams.length}
            icon={UsersRound}
          />
        </div>
      )}

      {/* Team Leader - Tasks I Created */}
      {isTeamLeader && tasksCreatedByMe.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tasks I Created</CardTitle>
            <CardDescription>Tasks you've assigned to your team members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tasksCreatedByMe.slice(0, 6).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  assignedUser={getUser(task.assignedUserId)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Tasks</CardTitle>
          <CardDescription>
            {user?.role === 'user' ? 'Tasks assigned to you' : 'Latest task activity'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No tasks yet. {user?.role !== 'user' && 'Create your first task to get started!'}
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  assignedUser={getUser(task.assignedUserId)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      

      {/* Task Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pending}</div>
            <div className="w-full bg-muted rounded-full h-2 mt-3">
              <div 
                className="bg-muted-foreground rounded-full h-2 transition-all"
                style={{ width: `${stats.total ? (stats.pending / stats.total) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.inProgress}</div>
            <div className="w-full bg-muted rounded-full h-2 mt-3">
              <div 
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${stats.total ? (stats.inProgress / stats.total) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completed}</div>
            <div className="w-full bg-muted rounded-full h-2 mt-3">
              <div 
                className="bg-success rounded-full h-2 transition-all"
                style={{ width: `${stats.total ? (stats.completed / stats.total) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

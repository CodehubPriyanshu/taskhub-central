import { useMemo } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext } from '@/contexts/DataContext';
import StatCard from '@/components/dashboard/StatCard';
import TaskCard from '@/components/tasks/TaskCard';
import { 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Users,
  UsersRound
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isPast } from 'date-fns';

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

    return { total, pending, inProgress, completed, overdue };
  }, [filteredTasks]);

  const recentTasks = useMemo(() => {
    return [...filteredTasks]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }, [filteredTasks]);

  const getUser = (userId: string) => users.find(u => u.id === userId);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}! Here's what's happening.
        </p>
      </div>

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

      {/* Admin Extra Stats */}
      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            title="Total Users"
            value={users.filter(u => u.role !== 'admin').length}
            icon={Users}
          />
          <StatCard
            title="Total Teams"
            value={teams.length}
            icon={UsersRound}
          />
        </div>
      )}

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No tasks yet. Create your first task to get started!
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

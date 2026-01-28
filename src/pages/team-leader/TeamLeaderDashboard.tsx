import { useMemo } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Play, 
  Pause,
  CalendarClock
} from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';

const TeamLeaderDashboard = () => {
  const { user } = useAuthContext();
  const { tasks, users } = useDataContext();

  // Get tasks assigned by Admin to this Team Leader
  const adminAssignedTasks = useMemo(() => {
    return tasks.filter(task => {
      const creator = users.find(u => u.id === task.createdById);
      return creator?.role === 'admin' && task.assignedUserId === user?.id;
    });
  }, [tasks, users, user?.id]);

  // Task statistics
  const taskStats = useMemo(() => {
    const total = adminAssignedTasks.length;
    const pending = adminAssignedTasks.filter(t => t.status === 'pending').length;
    const inProgress = adminAssignedTasks.filter(t => t.status === 'in_progress').length;
    const completed = adminAssignedTasks.filter(t => t.status === 'completed').length;
    const overdue = adminAssignedTasks.filter(t => 
      t.status === 'in_progress' && isPast(parseISO(t.deadline))
    ).length;
    const atRisk = adminAssignedTasks.filter(t => t.isAtRisk).length;
    
    return { total, pending, inProgress, completed, overdue, atRisk };
  }, [adminAssignedTasks]);

  // Recent tasks (last 5)
  const recentTasks = useMemo(() => {
    return [...adminAssignedTasks]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [adminAssignedTasks]);

  // Get user by ID
  const getUser = (userId: string) => users.find(u => u.id === userId);

  // Status badge component
  const getStatusBadge = (status: string, isOverdue?: boolean, isAtRisk?: boolean) => {
    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    if (isAtRisk) {
      return <Badge variant="outline" className="border-orange-500 text-orange-500">At Risk</Badge>;
    }
    
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', label: 'Pending' },
      in_progress: { variant: 'default', label: 'In Progress' },
      completed: { variant: 'outline', label: 'Completed' },
    };
    
    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Priority badge
  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      high: { variant: 'destructive', label: 'High' },
      medium: { variant: 'default', label: 'Medium' },
      low: { variant: 'secondary', label: 'Low' },
    };
    
    const c = config[priority] || config.medium;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user.name}. Here's what you need to focus on today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{taskStats.total}</p>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Play className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{taskStats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{taskStats.atRisk + taskStats.overdue}</p>
                <p className="text-xs text-muted-foreground">Needs Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-2xl font-bold">{taskStats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {adminAssignedTasks.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <CalendarClock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Tasks Assigned</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You don't have any tasks assigned by Admin yet. Check back later or contact your administrator.
            </p>
            <Button variant="outline" disabled>
              Refresh
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTasks.map((task) => {
                  const creator = getUser(task.createdById);
                  const isOverdue = task.status === 'in_progress' && isPast(parseISO(task.deadline));
                  const isAtRisk = task.isAtRisk;
                  
                  return (
                    <div key={task.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium truncate">{task.title}</h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {getPriorityBadge(task.priority)}
                            {getStatusBadge(task.status, isOverdue, isAtRisk)}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {format(parseISO(task.deadline), 'MMM d, yyyy')}</span>
                          </div>
                          {task.estimatedTimeToComplete && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Est: {task.estimatedTimeToComplete}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span>From: {creator?.name || 'Admin'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {adminAssignedTasks.length > 5 && (
                <div className="mt-4 pt-4 border-t text-center">
                  <Button variant="link" className="text-primary">
                    View All Tasks
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default TeamLeaderDashboard;
import { useEffect, useState } from 'react';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Clock, CheckCircle, FileUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskStatus = Database['public']['Enums']['task_status'];

const UserDashboard = () => {
  const { user, profile } = useSupabaseAuthContext();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', user.id)
        .order('due_date', { ascending: true });

      if (!error && data) {
        setTasks(data);
      }
      setIsLoading(false);
    };

    fetchTasks();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('user-tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `assigned_to=eq.${user?.id}`,
        },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getStatusBadge = (status: TaskStatus | null) => {
    const config: Record<TaskStatus, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
      in_progress: { label: 'In Progress', className: 'bg-primary/10 text-primary' },
      submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
      reviewed: { label: 'Reviewed', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    };
    const s = status || 'pending';
    return <Badge className={config[s].className}>{config[s].label}</Badge>;
  };

  const getPriorityBadge = (priority: string | null) => {
    const config: Record<string, { label: string; className: string }> = {
      high: { label: 'High', className: 'bg-destructive/10 text-destructive border-destructive/20' },
      medium: { label: 'Medium', className: 'bg-warning/10 text-warning border-warning/20' },
      low: { label: 'Low', className: 'bg-success/10 text-success border-success/20' },
    };
    const p = priority || 'medium';
    return <Badge variant="outline" className={config[p]?.className || config.medium.className}>{config[p]?.label || 'Medium'}</Badge>;
  };

  const filterTasksByStatus = (statuses: TaskStatus[]) => {
    return tasks.filter(t => statuses.includes(t.status || 'pending'));
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
    submitted: tasks.filter(t => t.status === 'submitted').length,
    reviewed: tasks.filter(t => t.status === 'reviewed').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {profile?.name || 'User'}</h1>
          <p className="text-muted-foreground">Here are your assigned tasks</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <FileUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submitted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviewed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted ({stats.submitted})</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed ({stats.reviewed})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {filterTasksByStatus(['pending', 'in_progress']).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending tasks. Great job!
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterTasksByStatus(['pending', 'in_progress']).map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  getStatusBadge={getStatusBadge}
                  getPriorityBadge={getPriorityBadge}
                  onClick={() => navigate(`/user/task/${task.id}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submitted" className="space-y-4">
          {filterTasksByStatus(['submitted']).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No submitted tasks awaiting review.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterTasksByStatus(['submitted']).map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  getStatusBadge={getStatusBadge}
                  getPriorityBadge={getPriorityBadge}
                  onClick={() => navigate(`/user/task/${task.id}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4">
          {filterTasksByStatus(['reviewed']).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No reviewed tasks yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterTasksByStatus(['reviewed']).map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  getStatusBadge={getStatusBadge}
                  getPriorityBadge={getPriorityBadge}
                  onClick={() => navigate(`/user/task/${task.id}`)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  getStatusBadge: (status: TaskStatus | null) => React.ReactNode;
  getPriorityBadge: (priority: string | null) => React.ReactNode;
  onClick: () => void;
}

const TaskCard = ({ task, getStatusBadge, getPriorityBadge, onClick }: TaskCardProps) => {
  const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'submitted' && task.status !== 'reviewed';
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${isOverdue ? 'border-destructive/50' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-2">{task.title}</CardTitle>
          {getPriorityBadge(task.priority)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
        
        <div className="flex items-center justify-between">
          {getStatusBadge(task.status)}
          <span className={`text-xs ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
          </span>
        </div>

        <div className="flex gap-2 pt-2">
          {task.allows_file_upload && (
            <Badge variant="outline" className="text-xs">
              <FileUp className="h-3 w-3 mr-1" />
              Files
            </Badge>
          )}
          {task.allows_text_submission && (
            <Badge variant="outline" className="text-xs">
              Text
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserDashboard;

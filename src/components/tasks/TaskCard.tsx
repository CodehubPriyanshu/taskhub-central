import { Calendar, MessageSquare, User } from 'lucide-react';
import { Task, User as UserType } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, isPast, isToday } from 'date-fns';

interface TaskCardProps {
  task: Task;
  assignedUser?: UserType;
  onClick?: () => void;
}

const TaskCard = ({ task, assignedUser, onClick }: TaskCardProps) => {
  const priorityConfig = {
    high: { label: 'High', className: 'bg-priority-high/10 text-priority-high border-priority-high/20' },
    medium: { label: 'Medium', className: 'bg-priority-medium/10 text-priority-medium border-priority-medium/20' },
    low: { label: 'Low', className: 'bg-priority-low/10 text-priority-low border-priority-low/20' },
  };

  const statusConfig = {
    pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
    in_progress: { label: 'In Progress', className: 'bg-primary/10 text-primary' },
    completed: { label: 'Completed', className: 'bg-success/10 text-success' },
  };

  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const deadline = new Date(task.deadline);
  const isOverdue = isPast(deadline) && task.status !== 'completed';
  const isDueToday = isToday(deadline);

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
        isOverdue && "border-destructive/50"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm line-clamp-2">{task.title}</h3>
          <Badge variant="outline" className={cn('shrink-0 text-xs', priority.className)}>
            {priority.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
        
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className={cn('text-xs', status.className)}>
            {status.label}
          </Badge>
          
          <div className={cn(
            "flex items-center gap-1 text-xs",
            isOverdue ? "text-destructive" : isDueToday ? "text-warning" : "text-muted-foreground"
          )}>
            <Calendar className="h-3 w-3" />
            {format(deadline, 'MMM d')}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {assignedUser?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <span className="text-xs text-muted-foreground truncate max-w-24">
              {assignedUser?.name || 'Unassigned'}
            </span>
          </div>
          
          {task.comments.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {task.comments.length}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;

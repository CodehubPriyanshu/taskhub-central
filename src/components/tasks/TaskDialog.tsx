import { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus, User, Team } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  mode: 'create' | 'edit' | 'view';
}

const TaskDialog = ({ open, onOpenChange, task, mode }: TaskDialogProps) => {
  const { user } = useAuthContext();
  const { users, teams, createTask, updateTask } = useDataContext();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    status: 'pending' as TaskStatus,
    deadline: '',
    assignedUserId: '',
    teamId: '',
  });

  const [comment, setComment] = useState('');

  useEffect(() => {
    if (task && (mode === 'edit' || mode === 'view')) {
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        deadline: task.deadline,
        assignedUserId: task.assignedUserId,
        teamId: task.teamId,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        deadline: new Date().toISOString().split('T')[0],
        assignedUserId: '',
        teamId: user?.teamId || '',
      });
    }
  }, [task, mode, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.assignedUserId || !formData.deadline) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (mode === 'create') {
      createTask({
        ...formData,
        createdById: user!.id,
      });
      toast({
        title: 'Task Created',
        description: 'The task has been created successfully',
      });
    } else if (mode === 'edit') {
      updateTask(task!.id, formData);
      toast({
        title: 'Task Updated',
        description: 'The task has been updated successfully',
      });
    }

    onOpenChange(false);
  };

  const availableTeams = user?.role === 'admin' 
    ? teams 
    : teams.filter(t => t.id === user?.teamId);

  const availableUsers = users.filter(u => {
    if (user?.role === 'admin') return u.role === 'user';
    return u.teamId === user?.teamId && u.role === 'user';
  });

  const isViewMode = mode === 'view';
  const isUser = user?.role === 'user';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Task' : mode === 'edit' ? 'Edit Task' : 'Task Details'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={isViewMode || isUser}
              placeholder="Enter task title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isViewMode || isUser}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: TaskPriority) => setFormData({ ...formData, priority: value })}
                disabled={isViewMode || isUser}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: TaskStatus) => setFormData({ ...formData, status: value })}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline *</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                disabled={isViewMode || isUser}
              />
            </div>

            {!isUser && (
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Select
                  value={formData.teamId}
                  onValueChange={(value) => setFormData({ ...formData, teamId: value, assignedUserId: '' })}
                  disabled={isViewMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {!isUser && (
            <div className="space-y-2">
              <Label htmlFor="assignee">Assign To *</Label>
              <Select
                value={formData.assignedUserId}
                onValueChange={(value) => setFormData({ ...formData, assignedUserId: value })}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers
                    .filter(u => !formData.teamId || u.teamId === formData.teamId)
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!isViewMode && (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {mode === 'create' ? 'Create Task' : 'Save Changes'}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;

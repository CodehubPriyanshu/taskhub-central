import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Calendar, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  mode: 'create' | 'edit' | 'view';
}

const TaskDialog = ({ open, onOpenChange, task, mode }: TaskDialogProps) => {
  const { user } = useAuthContext();
  const { users, teams, createTask, updateTask, acceptTask, rejectTask, requestExtension } = useDataContext();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    status: 'pending' as TaskStatus,
    startDate: '',
    deadline: '',
    assignedUserId: '',
    teamId: '',
  });

  const [comment, setComment] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [extensionReason, setExtensionReason] = useState('');
  const [requestedDeadline, setRequestedDeadline] = useState('');

  useEffect(() => {
    if (task && (mode === 'edit' || mode === 'view')) {
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        startDate: task.startDate,
        deadline: task.deadline,
        assignedUserId: task.assignedUserId,
        teamId: task.teamId,
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        startDate: today,
        deadline: today,
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
      }, user!.id);
      toast({
        title: 'Task Created',
        description: 'The task has been created and sent to the assignee',
      });
    } else if (mode === 'edit') {
      updateTask(task!.id, formData, user!.id);
      toast({
        title: 'Task Updated',
        description: 'The task has been updated successfully',
      });
    }

    onOpenChange(false);
  };

  const handleAcceptTask = () => {
    if (!task || !user) return;
    acceptTask(task.id, user.id);
    toast({
      title: 'Task Accepted',
      description: 'You have accepted this task. It is now in progress.',
    });
    onOpenChange(false);
  };

  const handleRejectTask = () => {
    if (!task || !user || !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }
    rejectTask(task.id, user.id, rejectionReason);
    toast({
      title: 'Task Rejected',
      description: 'The task has been rejected and the team leader has been notified.',
    });
    setShowRejectDialog(false);
    setRejectionReason('');
    onOpenChange(false);
  };

  const handleRequestExtension = () => {
    if (!task || !user || !extensionReason.trim() || !requestedDeadline) {
      toast({
        title: 'Error',
        description: 'Please provide a reason and new deadline',
        variant: 'destructive',
      });
      return;
    }
    requestExtension(task.id, user.id, extensionReason, requestedDeadline);
    toast({
      title: 'Extension Requested',
      description: 'Your extension request has been sent to the team leader.',
    });
    setShowExtensionDialog(false);
    setExtensionReason('');
    setRequestedDeadline('');
    onOpenChange(false);
  };

  const availableTeams = user?.role === 'admin' 
    ? teams 
    : teams.filter(t => t.id === user?.teamId);

  const availableUsers = users.filter(u => {
    if (user?.role === 'admin') return u.role === 'user' && u.isActive;
    return u.teamId === user?.teamId && u.role === 'user' && u.isActive;
  });

  const isViewMode = mode === 'view';
  const isUser = user?.role === 'user';
  const canAcceptReject = isUser && task?.acceptanceStatus === 'pending';
  const canRequestExtension = isUser && task?.acceptanceStatus === 'accepted';

  const acceptanceStatusConfig = {
    pending: { label: 'Pending Acceptance', className: 'bg-muted text-muted-foreground', icon: Clock },
    accepted: { label: 'Accepted', className: 'bg-success/10 text-success', icon: CheckCircle },
    rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive', icon: XCircle },
    extension_requested: { label: 'Extension Requested', className: 'bg-warning/10 text-warning', icon: AlertTriangle },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Task' : mode === 'edit' ? 'Edit Task' : 'Task Details'}
          </DialogTitle>
        </DialogHeader>

        {/* Acceptance Status Badge */}
        {task && mode !== 'create' && (
          <div className="flex items-center gap-2">
            <Badge className={acceptanceStatusConfig[task.acceptanceStatus].className}>
              {React.createElement(acceptanceStatusConfig[task.acceptanceStatus].icon, { className: 'h-3 w-3 mr-1' })}
              {acceptanceStatusConfig[task.acceptanceStatus].label}
            </Badge>
            {task.rejectionReason && (
              <span className="text-xs text-destructive">Reason: {task.rejectionReason}</span>
            )}
          </div>
        )}

        {/* Extension Request Info */}
        {task?.acceptanceStatus === 'extension_requested' && (
          <div className="p-3 bg-warning/10 rounded-lg text-sm space-y-1">
            <p className="font-medium text-warning">Extension Request</p>
            <p className="text-muted-foreground">Reason: {task.extensionReason}</p>
            <p className="text-muted-foreground">Requested Deadline: {task.requestedDeadline && format(new Date(task.requestedDeadline), 'MMM dd, yyyy')}</p>
          </div>
        )}

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
                disabled={isViewMode || (isUser && task?.acceptanceStatus !== 'accepted')}
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
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                disabled={isViewMode || isUser}
              />
            </div>

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
          </div>

          {task && mode !== 'create' && task.originalDeadline !== task.deadline && (
            <p className="text-xs text-muted-foreground">
              Original deadline: {format(new Date(task.originalDeadline), 'MMM dd, yyyy')}
            </p>
          )}

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

          {/* User Actions */}
          {canAcceptReject && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">Task Actions</p>
                <div className="flex gap-2">
                  <Button type="button" onClick={handleAcceptTask} className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Task
                  </Button>
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={() => setShowRejectDialog(true)} 
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Task
                  </Button>
                </div>
              </div>
            </>
          )}

          {canRequestExtension && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">Need More Time?</p>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowExtensionDialog(true)}
                  className="w-full"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Request Time Extension
                </Button>
              </div>
            </>
          )}

          {/* Status Update for User with accepted task */}
          {isUser && task?.acceptanceStatus === 'accepted' && (
            <>
              <Separator />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update Status
                </Button>
              </DialogFooter>
            </>
          )}

          {!isViewMode && !isUser && (
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

        {/* Reject Dialog */}
        {showRejectDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg w-96 space-y-4">
              <h3 className="text-lg font-semibold">Reject Task</h3>
              <Textarea
                placeholder="Please provide a reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleRejectTask}>
                  Reject
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Extension Dialog */}
        {showExtensionDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg w-96 space-y-4">
              <h3 className="text-lg font-semibold">Request Extension</h3>
              <div className="space-y-2">
                <Label>New Deadline</Label>
                <Input
                  type="date"
                  value={requestedDeadline}
                  onChange={(e) => setRequestedDeadline(e.target.value)}
                  min={task?.deadline}
                />
              </div>
              <Textarea
                placeholder="Please provide a justification for the extension..."
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowExtensionDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRequestExtension}>
                  Submit Request
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;

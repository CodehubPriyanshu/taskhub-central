import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  Clock, 
  User, 
  Flag, 
  Check, 
  X, 
  Send,
  ClockArrowUp
} from 'lucide-react';
import { format } from 'date-fns';
import { Task } from '@/types';
import { useToast } from '@/hooks/use-toast';

const TaskDetailPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuthContext();
  const { 
    tasks, 
    acceptTask, 
    requestExtension, 
    requestTaskEdit,
    updateTask 
  } = useDataContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State for accepting task with estimated time
  const [estimatedTime, setEstimatedTime] = useState('');
  const [showAcceptForm, setShowAcceptForm] = useState(false);
  
  // State for extension request
  const [extensionReason, setExtensionReason] = useState('');
  const [requestedDeadline, setRequestedDeadline] = useState('');
  const [showExtensionForm, setShowExtensionForm] = useState(false);
  
  // State for edit request
  const [editRequestReason, setEditRequestReason] = useState('');
  const [editRequestDetails, setEditRequestDetails] = useState('');
  const [showEditRequestForm, setShowEditRequestForm] = useState(false);

  useEffect(() => {
    if (taskId) {
      const foundTask = tasks.find(t => t.id === taskId);
      if (foundTask) {
        setTask(foundTask);
        setRequestedDeadline(foundTask.deadline);
      }
      setLoading(false);
    }
  }, [taskId, tasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-lg font-semibold">Task Not Found</h2>
            <p className="text-muted-foreground">The requested task could not be found.</p>
            <Button className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAcceptTask = () => {
    if (!user || !estimatedTime.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter estimated time to complete',
        variant: 'destructive',
      });
      return;
    }

    acceptTask(task.id, user.id, estimatedTime);
    toast({
      title: 'Task Accepted',
      description: `Task has been accepted with estimated time: ${estimatedTime}`,
    });
    
    setShowAcceptForm(false);
    // Task will be updated automatically by context
  };

  const handleRequestExtension = () => {
    if (!user || !extensionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for the extension request',
        variant: 'destructive',
      });
      return;
    }

    requestExtension(task.id, user.id, extensionReason, requestedDeadline);
    toast({
      title: 'Extension Request Submitted',
      description: 'Your extension request has been submitted to the admin',
    });
    
    setShowExtensionForm(false);
    // Task will be updated automatically by context
  };

  const handleRequestEdit = () => {
    if (!user || !editRequestReason.trim() || !editRequestDetails.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide both reason and details for the edit request',
        variant: 'destructive',
      });
      return;
    }

    requestTaskEdit(task.id, user.id, editRequestReason, editRequestDetails);
    toast({
      title: 'Edit Request Submitted',
      description: 'Your edit request has been submitted',
    });
    
    setShowEditRequestForm(false);
    // Task will be updated automatically by context
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', label: 'Pending' },
      in_progress: { variant: 'default', label: 'In Progress' },
      completed: { variant: 'outline', label: 'Completed' },
    };
    
    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      high: { variant: 'destructive', label: 'High' },
      medium: { variant: 'default', label: 'Medium' },
      low: { variant: 'secondary', label: 'Low' },
    };
    
    const c = config[priority] || config.medium;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getAcceptanceStatusBadge = (status: string | undefined) => {
    if (!status) return <Badge variant="secondary">Not Accepted</Badge>;
    
    const config: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      accepted: { variant: 'default', label: 'Accepted' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      extension_requested: { variant: 'outline', label: 'Extension Requested' },
    };
    
    const c = config[status] || { variant: 'secondary', label: status };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getRequestStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    
    const config: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending Approval' },
      approved: { variant: 'outline', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    };
    
    const c = config[status] || { variant: 'secondary', label: status };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  // Check if the current user can perform actions
  const canAcceptTask = user?.role === 'team_leader' && 
                        task.acceptanceStatus === 'pending' && 
                        task.assignedUserId === user.id;
                        
  const canRequestExtension = user?.id === task.assignedUserId && 
                             task.status !== 'completed' && 
                             task.acceptanceStatus !== 'extension_requested';
                             
  const canRequestEdit = user?.id === task.assignedUserId && 
                        task.status !== 'completed' && 
                        task.editRequestStatus !== 'pending';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Task Details</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{task.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Task Details */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-1">
                <Flag className="h-4 w-4" />
                Description
              </h3>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {task.description || 'No description provided'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-1 flex items-center gap-1">
                  <Flag className="h-4 w-4" />
                  Priority
                </h3>
                <div>{getPriorityBadge(task.priority)}</div>
              </div>
              
              <div>
                <h3 className="font-medium mb-1 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Status
                </h3>
                <div>{getStatusBadge(task.status)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-1 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Start Date
                </h3>
                <p className="text-sm">{format(new Date(task.startDate), 'MMM d, yyyy')}</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Deadline
                </h3>
                <p className="text-sm">{format(new Date(task.deadline), 'MMM d, yyyy')}</p>
              </div>
            </div>
            
            {task.originalDeadline && task.originalDeadline !== task.deadline && (
              <div>
                <h3 className="font-medium mb-1">Original Deadline</h3>
                <p className="text-sm">{format(new Date(task.originalDeadline), 'MMM d, yyyy')}</p>
              </div>
            )}
            
            {task.estimatedTimeToComplete && (
              <div>
                <h3 className="font-medium mb-1 flex items-center gap-1">
                  <ClockArrowUp className="h-4 w-4" />
                  Estimated Time to Complete
                </h3>
                <p className="text-sm">{task.estimatedTimeToComplete}</p>
              </div>
            )}
            
            {task.acceptanceTimestamp && (
              <div>
                <h3 className="font-medium mb-1">Accepted On</h3>
                <p className="text-sm">{format(new Date(task.acceptanceTimestamp), 'MMM d, yyyy HH:mm')}</p>
              </div>
            )}
            
            <div>
              <h3 className="font-medium mb-1 flex items-center gap-1">
                <User className="h-4 w-4" />
                Assigned To
              </h3>
              <p className="text-sm">{task.assignedUserId}</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1 flex items-center gap-1">
                <User className="h-4 w-4" />
                Created By
              </h3>
              <p className="text-sm">{task.createdById}</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Acceptance Status</h3>
              <div>{getAcceptanceStatusBadge(task.acceptanceStatus)}</div>
            </div>
            
            {task.editRequestStatus && (
              <div>
                <h3 className="font-medium mb-1">Edit Request Status</h3>
                <div>{getRequestStatusBadge(task.editRequestStatus)}</div>
              </div>
            )}
            
            {task.editRequestStatus === 'pending' && (
              <div className="bg-muted p-3 rounded-md space-y-2">
                <h4 className="font-medium text-sm">Edit Request Details:</h4>
                <p className="text-sm"><strong>Reason:</strong> {task.editRequestReason}</p>
                <p className="text-sm"><strong>Details:</strong> {task.editRequestDetails}</p>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-4">
            {canAcceptTask && !showAcceptForm && (
              <div className="space-y-3">
                <p className="text-sm">Accept this task and provide an estimated time to complete:</p>
                <Button 
                  className="w-full" 
                  onClick={() => setShowAcceptForm(true)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept Task
                </Button>
              </div>
            )}
            
            {showAcceptForm && (
              <div className="space-y-3 p-4 border rounded-lg">
                <h3 className="font-medium">Accept Task</h3>
                <div className="space-y-2">
                  <Label htmlFor="estimatedTime">Estimated Time to Complete *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="estimatedTime"
                      value={estimatedTime}
                      onChange={(e) => setEstimatedTime(e.target.value)}
                      placeholder="e.g., 2 hours, 3 days"
                    />
                    <Button onClick={handleAcceptTask}>
                      <Check className="h-4 w-4 mr-1" />
                      Confirm
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the estimated time you need to complete this task (e.g., "2 hours", "3 days")
                  </p>
                </div>
              </div>
            )}
            
            {canRequestExtension && !showExtensionForm && (
              <div className="space-y-3">
                <p className="text-sm">Request an extension for this task:</p>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setShowExtensionForm(true)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Request Extension
                </Button>
              </div>
            )}
            
            {showExtensionForm && (
              <div className="space-y-3 p-4 border rounded-lg">
                <h3 className="font-medium">Request Extension</h3>
                <div className="space-y-2">
                  <Label htmlFor="extensionReason">Reason for Extension *</Label>
                  <Textarea
                    id="extensionReason"
                    value={extensionReason}
                    onChange={(e) => setExtensionReason(e.target.value)}
                    placeholder="Explain why you need more time..."
                    rows={2}
                  />
                  
                  <Label htmlFor="requestedDeadline">New Deadline *</Label>
                  <Input
                    id="requestedDeadline"
                    type="date"
                    value={requestedDeadline}
                    onChange={(e) => setRequestedDeadline(e.target.value)}
                    min={task.deadline}
                  />
                  
                  <Button onClick={handleRequestExtension}>
                    <Send className="h-4 w-4 mr-1" />
                    Submit Request
                  </Button>
                </div>
              </div>
            )}
            
            {canRequestEdit && !showEditRequestForm && (
              <div className="space-y-3">
                <p className="text-sm">Request changes to this task:</p>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setShowEditRequestForm(true)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Request Edit
                </Button>
              </div>
            )}
            
            {showEditRequestForm && (
              <div className="space-y-3 p-4 border rounded-lg">
                <h3 className="font-medium">Request Task Edit</h3>
                <div className="space-y-2">
                  <Label htmlFor="editRequestReason">Reason for Edit *</Label>
                  <Textarea
                    id="editRequestReason"
                    value={editRequestReason}
                    onChange={(e) => setEditRequestReason(e.target.value)}
                    placeholder="Explain why you need changes..."
                    rows={2}
                  />
                  
                  <Label htmlFor="editRequestDetails">Edit Details *</Label>
                  <Textarea
                    id="editRequestDetails"
                    value={editRequestDetails}
                    onChange={(e) => setEditRequestDetails(e.target.value)}
                    placeholder="Describe what changes you'd like..."
                    rows={3}
                  />
                  
                  <Button onClick={handleRequestEdit}>
                    <Send className="h-4 w-4 mr-1" />
                    Submit Request
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskDetailPage;
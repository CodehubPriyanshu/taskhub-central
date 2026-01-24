import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Calendar, Clock, FileUp, FileText, Image, Video, 
  File, Trash2, Download, Loader2, Send, Eye, CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Task = {
  id: string;
  title: string;
  description?: string | null;
  assigned_to: string;
  created_by: string;
  due_date: string;
  start_date?: string | null;
  status: 'pending' | 'in_progress' | 'submitted' | 'reviewed';
  team_id?: string | null;
  priority?: string | null;
  created_at: string;
  updated_at: string;
  allows_file_upload?: boolean | null;
  allows_text_submission?: boolean | null;
  max_files?: number | null;
};

type TaskSubmission = {
  id: string;
  task_id: string;
  user_id: string;
  text_content?: string | null;
  status: 'draft' | 'submitted' | 'reviewed';
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
};

type SubmissionFile = {
  id: string;
  submission_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
};

type TaskStatus = 'pending' | 'in_progress' | 'submitted' | 'reviewed';

const ALLOWED_FILE_TYPES = {
  'video/mp4': 'Video',
  'video/avi': 'Video',
  'video/quicktime': 'Video',
  'video/x-msvideo': 'Video',
  'application/pdf': 'PDF',
  'application/msword': 'Document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Document',
  'image/jpeg': 'Image',
  'image/png': 'Image',
  'image/gif': 'Image',
  'image/webp': 'Image',
  'text/plain': 'Text',
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const TaskSubmission = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { toast } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [submission, setSubmission] = useState<TaskSubmission | null>(null);
  const [files, setFiles] = useState<SubmissionFile[]>([]);
  const [textContent, setTextContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewFile, setPreviewFile] = useState<SubmissionFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!taskId || !user) return;
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('No auth token found');
      navigate('/login');
      return;
    }

    // Fetch task
    const taskResponse = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!taskResponse.ok) {
      toast({ title: 'Task not found', variant: 'destructive' });
      navigate('/user/dashboard');
      return;
    }
    
    const taskData = await taskResponse.json();

    // Check if task is assigned to current user
    if (taskData.assigned_to !== user.id) {
      toast({ title: 'Access denied', variant: 'destructive' });
      navigate('/user/dashboard');
      return;
    }

    setTask(taskData);

    // Fetch existing submission
    const subResponse = await fetch(`http://localhost:5000/api/submissions?task_id=${taskId}&user_id=${user.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (subResponse.ok) {
      const subDataArray = await subResponse.json();
      if (subDataArray.length > 0) {
        const subData = subDataArray[0];
        setSubmission(subData);
        setTextContent(subData.text_content || '');

        // Fetch files for this submission
        const filesResponse = await fetch(`http://localhost:5000/api/submission-files?submission_id=${subData.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (filesResponse.ok) {
          const filesData = await filesResponse.json();
          setFiles(filesData);
        }
      }
    }

    setIsLoading(false);
  }, [taskId, user, navigate, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getOrCreateSubmission = async (): Promise<string | null> => {
    if (submission) return submission.id;
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast({ 
        title: 'Authentication error', 
        description: 'Please log in again',
        variant: 'destructive' 
      });
      return null;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/submissions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          task_id: taskId!,
          user_id: user!.id,
          status: 'draft',
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubmission(data);
        return data.id;
      } else {
        const errorData = await response.json();
        toast({ 
          title: 'Failed to create submission', 
          description: errorData.message || 'Failed to create submission',
          variant: 'destructive' 
        });
        return null;
      }
    } catch (error) {
      toast({ 
        title: 'Failed to create submission', 
        description: 'Network error occurred',
        variant: 'destructive' 
      });
      return null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || !user || !task) return;

    // Check max files
    if (files.length + fileList.length > (task.max_files || 10)) {
      toast({ 
        title: 'Too many files', 
        description: `Maximum ${task.max_files || 10} files allowed`,
        variant: 'destructive' 
      });
      return;
    }

    setIsUploading(true);

    const submissionId = await getOrCreateSubmission();
    if (!submissionId) {
      setIsUploading(false);
      return;
    }

    for (const file of Array.from(fileList)) {
      // Validate file type
      if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
        toast({ 
          title: 'Invalid file type', 
          description: `${file.name} is not an allowed file type`,
          variant: 'destructive' 
        });
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast({ 
          title: 'File too large', 
          description: `${file.name} exceeds 50MB limit`,
          variant: 'destructive' 
        });
        continue;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('submission_id', submissionId);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast({ 
          title: 'Authentication error', 
          description: 'Please log in again',
          variant: 'destructive' 
        });
        continue;
      }
      
      try {
        const response = await fetch('http://localhost:5000/api/submission-files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // Note: Don't set Content-Type header when using FormData
          },
          body: formData
        });
        
        if (response.ok) {
          const fileData = await response.json();
          setFiles(prev => [...prev, fileData]);
          toast({ title: 'File uploaded', description: file.name });
        } else {
          const errorData = await response.json();
          toast({ 
            title: 'Upload failed', 
            description: errorData.message || 'Failed to upload file',
            variant: 'destructive' 
          });
        }
      } catch (error) {
        toast({ 
          title: 'Upload failed', 
          description: 'Network error occurred',
          variant: 'destructive' 
        });
      }
    }

    setIsUploading(false);
    e.target.value = '';
  };

  const handleDeleteFile = async (fileId: string, filePath: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast({ 
        title: 'Authentication error', 
        description: 'Please log in again',
        variant: 'destructive' 
      });
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/submission-files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setFiles(prev => prev.filter(f => f.id !== fileId));
        toast({ title: 'File deleted' });
      } else {
        const errorData = await response.json();
        toast({ 
          title: 'Delete failed', 
          description: errorData.message || 'Failed to delete file',
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ 
        title: 'Delete failed', 
        description: 'Network error occurred',
        variant: 'destructive' 
      });
    }
  };

  const handleSaveText = async () => {
    if (!submission) {
      const submissionId = await getOrCreateSubmission();
      if (!submissionId) return;
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast({ 
        title: 'Authentication error', 
        description: 'Please log in again',
        variant: 'destructive' 
      });
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/submissions/${submission?.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text_content: textContent })
      });
      
      if (response.ok) {
        toast({ title: 'Text saved' });
      } else {
        const errorData = await response.json();
        toast({ 
          title: 'Save failed', 
          description: errorData.message || 'Failed to save text',
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ 
        title: 'Save failed', 
        description: 'Network error occurred',
        variant: 'destructive' 
      });
    }
  };

  const handleSubmit = async () => {
    if (!submission && !textContent && files.length === 0) {
      toast({ 
        title: 'Nothing to submit', 
        description: 'Please add text content or upload files',
        variant: 'destructive' 
      });
      return;
    }

    setIsSubmitting(true);

    const submissionId = submission?.id || await getOrCreateSubmission();
    if (!submissionId) {
      setIsSubmitting(false);
      return;
    }
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast({ 
        title: 'Authentication error', 
        description: 'Please log in again',
        variant: 'destructive' 
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Update submission status
      const subResponse = await fetch(`http://localhost:5000/api/submissions/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'submitted', 
          text_content: textContent,
          submitted_at: new Date().toISOString(),
        })
      });
      
      // Update task status
      const taskResponse = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'submitted' })
      });

      if (subResponse.ok && taskResponse.ok) {
        toast({ title: 'Task submitted successfully!' });
        navigate('/user/dashboard');
      } else {
        const subError = await subResponse.json();
        const taskError = await taskResponse.json();
        
        toast({ 
          title: 'Submission failed', 
          description: subError.message || taskError.message || 'Failed to submit task',
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ 
        title: 'Submission failed', 
        description: 'Network error occurred',
        variant: 'destructive' 
      });
    }

    setIsSubmitting(false);
  };

  const handlePreviewFile = async (file: SubmissionFile) => {
    // In a real implementation, we would generate a signed URL from the backend
    // For now, we'll construct the URL assuming files are served from the backend
    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast({ 
        title: 'Authentication error', 
        description: 'Please log in again',
        variant: 'destructive' 
      });
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/submission-files/${file.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPreviewFile(file);
      } else {
        const errorData = await response.json();
        toast({ 
          title: 'Preview failed', 
          description: errorData.message || 'Failed to load file for preview',
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ 
        title: 'Preview failed', 
        description: 'Network error occurred',
        variant: 'destructive' 
      });
    }
  };

  const handleDownloadFile = async (file: SubmissionFile) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      toast({ 
        title: 'Authentication error', 
        description: 'Please log in again',
        variant: 'destructive' 
      });
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/submission-files/${file.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.file_name;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json();
        toast({ 
          title: 'Download failed', 
          description: errorData.message || 'Failed to download file',
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ 
        title: 'Download failed', 
        description: 'Network error occurred',
        variant: 'destructive' 
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'reviewed';
  const canEdit = !isSubmitted || task?.status === 'pending';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/user/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <div className="flex items-center gap-4 mt-1">
            <Badge className={
              task.priority === 'high' ? 'bg-destructive/10 text-destructive' :
              task.priority === 'medium' ? 'bg-warning/10 text-warning' :
              'bg-success/10 text-success'
            }>
              {task.priority}
            </Badge>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
            </span>
            {task.start_date && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Started: {format(new Date(task.start_date), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>
        {isSubmitted && (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            {submission?.status === 'reviewed' ? 'Reviewed' : 'Submitted'}
          </Badge>
        )}
      </div>

      {/* Task Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Task Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap">{task.description || 'No description provided.'}</p>
        </CardContent>
      </Card>

      {/* Text Submission */}
      {task.allows_text_submission && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Text Submission</CardTitle>
            <CardDescription>Write your response or notes for this task</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter your text submission here..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              disabled={!canEdit}
              className="min-h-[150px]"
            />
            {canEdit && (
              <Button variant="outline" onClick={handleSaveText}>
                Save Draft
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* File Upload */}
      {task.allows_file_upload && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">File Uploads</CardTitle>
            <CardDescription>
              Upload videos, documents, images, or text files (max {task.max_files || 10} files, 50MB each)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {canEdit && (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <FileUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-primary hover:underline">Click to upload</span>
                  <span className="text-muted-foreground"> or drag and drop</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  MP4, AVI, MOV, PDF, DOC, DOCX, JPG, PNG, GIF, TXT
                </p>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept={Object.keys(ALLOWED_FILE_TYPES).join(',')}
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </div>
            )}

            {isUploading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Uploading...
              </div>
            )}

            {/* Uploaded Files List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Uploaded Files ({files.length})</h4>
                <div className="space-y-2">
                  {files.map(file => (
                    <div 
                      key={file.id} 
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.file_type)}
                        <div>
                          <p className="font-medium text-sm">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.file_size)} • {format(new Date(file.uploaded_at!), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(file.file_type.startsWith('image/') || file.file_type.startsWith('video/') || file.file_type === 'application/pdf') && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handlePreviewFile(file)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDownloadFile(file)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {canEdit && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteFile(file.id, file.file_path)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {canEdit && (
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate('/user/dashboard')}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Task
              </>
            )}
          </Button>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => { setPreviewFile(null); setPreviewUrl(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewFile?.file_name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            {previewFile?.file_type.startsWith('image/') && previewUrl && (
              <img src={previewUrl} alt={previewFile.file_name} className="w-full h-auto" />
            )}
            {previewFile?.file_type.startsWith('video/') && previewUrl && (
              <video src={previewUrl} controls className="w-full" />
            )}
            {previewFile?.file_type === 'application/pdf' && previewUrl && (
              <iframe src={previewUrl} className="w-full h-[70vh]" title={previewFile.file_name} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskSubmission;

import { useState, useMemo } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import { User, Task } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  User as UserIcon, 
  Mail, 
  Users, 
  UserPlus, 
  Building2,
  Copy,
  Check,
  Eye,
  EyeOff,
  ClipboardList,
  Search
} from 'lucide-react';

const TeamLeaderProfilePage = () => {
  const { user: currentUser } = useAuthContext();
  const { users, teams, tasks, createUser } = useDataContext();
  const { toast } = useToast();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [credentialsCopied, setCredentialsCopied] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Get current user's team
  const currentTeam = useMemo(() => {
    return teams.find(t => t.id === currentUser?.teamId);
  }, [teams, currentUser?.teamId]);

  // Get only team members (users in the same team)
  const teamMembers = useMemo(() => {
    return users.filter(u => u.teamId === currentUser?.teamId && u.role === 'user');
  }, [users, currentUser?.teamId]);

  // Filter team members based on search
  const filteredTeamMembers = useMemo(() => {
    if (!searchQuery.trim()) return teamMembers;
    const query = searchQuery.toLowerCase();
    return teamMembers.filter(u => 
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  }, [teamMembers, searchQuery]);

  // Get task stats for a user
  const getUserTaskStats = (userId: string) => {
    const userTasks = tasks.filter(t => t.assignedUserId === userId);
    return {
      total: userTasks.length,
      pending: userTasks.filter(t => t.status === 'pending').length,
      inProgress: userTasks.filter(t => t.status === 'in_progress').length,
      completed: userTasks.filter(t => t.status === 'completed').length
    };
  };

  const handleCreateUser = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const existingUser = users.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
    if (existingUser) {
      toast({
        title: "Error",
        description: "A user with this email already exists",
        variant: "destructive"
      });
      return;
    }

    try {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        role: 'user' as const,
        teamId: currentUser?.teamId, // Automatically assign to team leader's team
        createdById: currentUser?.id
      };

      createUser(userData, currentUser?.id || '', false);

      setGeneratedCredentials({
        email: formData.email.trim(),
        password: formData.password.trim()
      });
      
      setShowCreateDialog(false);
      setShowCredentialsDialog(true);

      toast({
        title: "Success",
        description: "User account created successfully and added to your team"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive"
      });
    }
  };

  const handleCopyCredentials = async () => {
    if (generatedCredentials) {
      const text = `Email: ${generatedCredentials.email}\nPassword: ${generatedCredentials.password}`;
      await navigator.clipboard.writeText(text);
      setCredentialsCopied(true);
      setTimeout(() => setCredentialsCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Credentials copied to clipboard"
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Leader Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your profile and team members</p>
        </div>
        <Button onClick={() => {
          setFormData({ name: '', email: '', password: '' });
          setShowCreateDialog(true);
        }}>
          <UserPlus className="h-4 w-4 mr-2" />
          Create Team User
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Personal Details
          </CardTitle>
          <CardDescription>Your team leader account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{currentUser?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{currentUser?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assigned Team</p>
                <Badge variant="default">{currentTeam?.name || 'No Team Assigned'}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{teamMembers.length}</p>
              <p className="text-muted-foreground text-sm">Team Members</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {tasks.filter(t => t.teamId === currentUser?.teamId && t.status !== 'completed').length}
              </p>
              <p className="text-muted-foreground text-sm">Active Tasks</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Check className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {tasks.filter(t => t.teamId === currentUser?.teamId && t.status === 'completed').length}
              </p>
              <p className="text-muted-foreground text-sm">Completed Tasks</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Team Members</CardTitle>
              <CardDescription>Users assigned to your team only</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTeamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No matching team members found.' : 'No users assigned to your team. Create one to get started.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Tasks</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>In Progress</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeamMembers.map((member) => {
                  const stats = getUserTaskStats(member.id);
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{stats.total}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{stats.pending}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{stats.inProgress}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-success text-success-foreground">{stats.completed}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.isActive ? "default" : "secondary"}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Team User</DialogTitle>
            <DialogDescription>
              Enter the details for the new user. They will be automatically assigned to your team ({currentTeam?.name}) and can log in immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This user will be automatically assigned to your team: <strong>{currentTeam?.name || 'No Team'}</strong>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>
              Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Created Successfully</DialogTitle>
            <DialogDescription>
              Save these credentials. The user can log in immediately with this information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Email</Label>
              <p className="font-mono text-sm">{generatedCredentials?.email}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Password</Label>
              <p className="font-mono text-sm">{generatedCredentials?.password}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCopyCredentials}>
              {credentialsCopied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Credentials
                </>
              )}
            </Button>
            <Button onClick={() => setShowCredentialsDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamLeaderProfilePage;

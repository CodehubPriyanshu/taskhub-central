import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Users, 
  UserPlus, 
  Building2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';

const AdminProfilePage = () => {
  const { user: currentUser, updateCurrentUser } = useAuthContext();
  const { users, teams, departments, createUser, updateUser, deactivateUser } = useDataContext();
  const { toast } = useToast();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<'team_leader' | 'user'>('team_leader');
  const [showPassword, setShowPassword] = useState(false);
  const [credentialsCopied, setCredentialsCopied] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);

  // New state for credential update
  const [credentialForm, setCredentialForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [credentialErrors, setCredentialErrors] = useState<Record<string, string>>({});
  const [updatingCredentials, setUpdatingCredentials] = useState(false);

  // Sync credential form with current user when user data changes
  useEffect(() => {
    if (currentUser) {
      setCredentialForm(prev => ({
        ...prev,
        name: currentUser.name || prev.name,
        email: currentUser.email || prev.email
      }));
    }
  }, [currentUser]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    teamId: '',
    departmentId: ''
  });

  // Functions for credential update
  const validateCredentialForm = () => {
    const errors: Record<string, string> = {};
    
    if (!credentialForm.currentPassword.trim()) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (credentialForm.newPassword && credentialForm.newPassword !== credentialForm.confirmNewPassword) {
      errors.confirmNewPassword = 'Passwords do not match';
    }
    
    if (credentialForm.newPassword && credentialForm.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (credentialForm.name.trim() === '') {
      errors.name = 'Name is required';
    }
    
    if (credentialForm.email.trim() === '') {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(credentialForm.email)) {
      errors.email = 'Email is invalid';
    }
    
    setCredentialErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateCredentials = async () => {
    if (!validateCredentialForm()) {
      return;
    }

    setUpdatingCredentials(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('http://localhost:5000/api/auth/admin/update-credentials', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: credentialForm.currentPassword,
          new_password: credentialForm.newPassword || undefined,
          new_email: credentialForm.email,
          new_name: credentialForm.name,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the user in context
        const updatedUser = {
          ...currentUser!,
          name: credentialForm.name,
          email: credentialForm.email,
        };
        
        // Update context using the updateCurrentUser function from the auth context
        updateCurrentUser(updatedUser);
        
        // Update the credential form state to clear sensitive data
        setCredentialForm(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        }));
        
        toast({
          title: "Success",
          description: "Credentials updated successfully",
        });
        
        // Optionally log out the user if email or password was changed for security
        if (credentialForm.newPassword || credentialForm.email !== currentUser?.email) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000); // Allow 2 seconds for user to see success message
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Update credentials error:', error);
      toast({
        title: "Error",
        description: "An error occurred while updating credentials",
        variant: "destructive"
      });
    } finally {
      setUpdatingCredentials(false);
    }
  };

  const teamLeaders = users.filter(u => u.role === 'team_leader');
  const regularUsers = users.filter(u => u.role === 'user');

  const handleOpenCreateDialog = (type: 'team_leader' | 'user') => {
    setCreateType(type);
    setFormData({ name: '', email: '', password: '', teamId: '', departmentId: '' });
    setShowCreateDialog(true);
  };

  const handleCreateAccount = () => {
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
        role: createType as 'team_leader' | 'user',
        teamId: formData.teamId || undefined,
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
        description: `${createType === 'team_leader' ? 'Team Leader' : 'User'} account created successfully`
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

  const handleToggleActive = (userId: string, isActive: boolean) => {
    if (isActive) {
      deactivateUser(userId, currentUser?.id || '');
      toast({
        title: "Account Deactivated",
        description: "User account has been deactivated"
      });
    } else {
      updateUser(userId, { isActive: true }, currentUser?.id);
      toast({
        title: "Account Activated",
        description: "User account has been activated"
      });
    }
  };

  const getTeamName = (teamId?: string) => {
    if (!teamId) return 'No Team';
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Unknown Team';
  };

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return 'No Department';
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || 'Unknown Department';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your profile and create accounts</p>
        </div>
      </div>

      {/* Admin Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Personal Details
          </CardTitle>
          <CardDescription>Your admin account information</CardDescription>
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
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge variant="default">Administrator</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Admin Credentials Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Update Admin Credentials
          </CardTitle>
          <CardDescription>Update your personal information and account credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Full Name</Label>
              <Input
                id="admin-name"
                placeholder="Enter your full name"
                value={credentialForm.name}
                onChange={(e) => setCredentialForm({...credentialForm, name: e.target.value})}
                disabled={updatingCredentials}
              />
              {credentialErrors.name && (
                <p className="text-red-500 text-sm">{credentialErrors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="Enter your email"
                value={credentialForm.email}
                onChange={(e) => setCredentialForm({...credentialForm, email: e.target.value})}
                disabled={updatingCredentials}
              />
              {credentialErrors.email && (
                <p className="text-red-500 text-sm">{credentialErrors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Enter current password"
                value={credentialForm.currentPassword}
                onChange={(e) => setCredentialForm({...credentialForm, currentPassword: e.target.value})}
                disabled={updatingCredentials}
              />
              {credentialErrors.currentPassword && (
                <p className="text-red-500 text-sm">{credentialErrors.currentPassword}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={credentialForm.newPassword}
                onChange={(e) => setCredentialForm({...credentialForm, newPassword: e.target.value})}
                disabled={updatingCredentials}
              />
              {credentialErrors.newPassword && (
                <p className="text-red-500 text-sm">{credentialErrors.newPassword}</p>
              )}
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="Confirm new password"
                value={credentialForm.confirmNewPassword}
                onChange={(e) => setCredentialForm({...credentialForm, confirmNewPassword: e.target.value})}
                disabled={updatingCredentials}
              />
              {credentialErrors.confirmNewPassword && (
                <p className="text-red-500 text-sm">{credentialErrors.confirmNewPassword}</p>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleUpdateCredentials} 
              disabled={updatingCredentials}
            >
              {updatingCredentials ? (
                <>
                  <span>Updating...</span>
                </>
              ) : (
                'Update Credentials'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleOpenCreateDialog('team_leader')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Create Team Leader</h3>
              <p className="text-muted-foreground text-sm">Add a new team leader account</p>
            </div>
            <UserPlus className="h-5 w-5 text-muted-foreground ml-auto" />
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleOpenCreateDialog('user')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-14 w-14 rounded-xl bg-success/10 flex items-center justify-center">
              <UserIcon className="h-7 w-7 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Create User</h3>
              <p className="text-muted-foreground text-sm">Add a new user account</p>
            </div>
            <UserPlus className="h-5 w-5 text-muted-foreground ml-auto" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Team Leaders and Users */}
      <Tabs defaultValue="team_leaders" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="team_leaders">Team Leaders ({teamLeaders.length})</TabsTrigger>
          <TabsTrigger value="users">Users ({regularUsers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="team_leaders" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Leaders</CardTitle>
              <CardDescription>All team leader accounts in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {teamLeaders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No team leaders found. Create one to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamLeaders.map((leader) => (
                      <TableRow key={leader.id}>
                        <TableCell className="font-medium">{leader.name}</TableCell>
                        <TableCell>{leader.email}</TableCell>
                        <TableCell>{getTeamName(leader.teamId)}</TableCell>
                        <TableCell>
                          <Badge variant={leader.isActive ? "default" : "secondary"}>
                            {leader.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={leader.isActive}
                            onCheckedChange={() => handleToggleActive(leader.id, leader.isActive)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>All user accounts in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {regularUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found. Create one to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regularUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getTeamName(user.teamId)}</TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={() => handleToggleActive(user.id, user.isActive)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Account Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Create {createType === 'team_leader' ? 'Team Leader' : 'User'} Account
            </DialogTitle>
            <DialogDescription>
              Enter the details for the new {createType === 'team_leader' ? 'team leader' : 'user'} account.
              They will be able to log in immediately with these credentials.
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

            <div className="space-y-2">
              <Label htmlFor="team">Assign to Team</Label>
              <Select
                value={formData.teamId || "none"}
                onValueChange={(value) => setFormData({ ...formData, teamId: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Team</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAccount}>
              Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account Created Successfully</DialogTitle>
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

export default AdminProfilePage;

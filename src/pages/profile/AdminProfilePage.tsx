import { useState } from 'react';
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
  EyeOff
} from 'lucide-react';

const AdminProfilePage = () => {
  const { user: currentUser } = useAuthContext();
  const { users, teams, departments, createUser, updateUser, deactivateUser } = useDataContext();
  const { toast } = useToast();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState<'team_leader' | 'user'>('team_leader');
  const [showPassword, setShowPassword] = useState(false);
  const [credentialsCopied, setCredentialsCopied] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    teamId: '',
    departmentId: ''
  });

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

import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext } from '@/contexts/DataContext';
import { User, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Search, Key, Copy, Check, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';

const UsersPage = () => {
  const { user: currentUser } = useAuthContext();
  const { users, teams, createUser, updateUser, deleteUser, deactivateUser } = useDataContext();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoGenerateCredentials, setAutoGenerateCredentials] = useState(true);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [credentialsCopied, setCredentialsCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as UserRole,
    teamId: '',
  });

  // Only admin can access this page
  if (currentUser?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredUsers = users.filter(u => 
    u.role !== 'admin' && (
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        teamId: user.teamId || '',
      });
      setAutoGenerateCredentials(false);
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
        teamId: '',
      });
      setAutoGenerateCredentials(true);
    }
    setGeneratedCredentials(null);
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a name',
        variant: 'destructive',
      });
      return;
    }

    if (!autoGenerateCredentials && (!formData.email || (!editingUser && !formData.password))) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicate email (only if not auto-generating)
    if (!autoGenerateCredentials) {
      const existingUser = users.find(u => u.email === formData.email && u.id !== editingUser?.id);
      if (existingUser) {
        toast({
          title: 'Validation Error',
          description: 'A user with this email already exists',
          variant: 'destructive',
        });
        return;
      }
    }

    if (editingUser) {
      const updateData: Partial<User> = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        teamId: formData.teamId || undefined,
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      updateUser(editingUser.id, updateData, currentUser?.id);
      toast({
        title: 'User Updated',
        description: 'User has been updated successfully',
      });
      setDialogOpen(false);
    } else {
      const result = createUser(
        {
          name: formData.name,
          email: formData.email || '',
          password: formData.password || '',
          role: formData.role,
          teamId: formData.teamId || undefined,
        },
        currentUser!.id,
        autoGenerateCredentials
      );

      if (autoGenerateCredentials && result.credentials) {
        setGeneratedCredentials(result.credentials);
        toast({
          title: 'User Created',
          description: 'Credentials have been generated. Please save them securely.',
        });
      } else {
        toast({
          title: 'User Created',
          description: 'User has been created successfully',
        });
        setDialogOpen(false);
      }
    }
  };

  const handleCopyCredentials = async () => {
    if (generatedCredentials) {
      const text = `Email: ${generatedCredentials.email}\nPassword: ${generatedCredentials.password}`;
      await navigator.clipboard.writeText(text);
      setCredentialsCopied(true);
      setTimeout(() => setCredentialsCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'Credentials copied to clipboard',
      });
    }
  };

  const handleCloseCredentialsDialog = () => {
    setGeneratedCredentials(null);
    setDialogOpen(false);
  };

  const handleDelete = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser(userId, currentUser?.id);
      toast({
        title: 'User Deleted',
        description: 'User has been deleted successfully',
      });
    }
  };

  const handleToggleActive = (userId: string, isActive: boolean) => {
    if (isActive) {
      updateUser(userId, { isActive: true }, currentUser?.id);
      toast({ title: 'User Activated' });
    } else {
      deactivateUser(userId, currentUser!.id);
      toast({ title: 'User Deactivated' });
    }
  };

  const getTeamName = (teamId?: string) => {
    if (!teamId) return '-';
    return teams.find(t => t.id === teamId)?.name || '-';
  };

  const roleConfig = {
    team_leader: { label: 'Team Leader', className: 'bg-primary/10 text-primary' },
    user: { label: 'User', className: 'bg-muted text-muted-foreground' },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage team leaders and users with auto-generated credentials</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Users Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className={!user.isActive ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={roleConfig[user.role as keyof typeof roleConfig]?.className}>
                      {roleConfig[user.role as keyof typeof roleConfig]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{getTeamName(user.teamId)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={user.isActive}
                      onCheckedChange={(checked) => handleToggleActive(user.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* User Dialog */}
      <Dialog open={dialogOpen && !generatedCredentials} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
            <DialogDescription>
              {!editingUser && 'Create a new user with auto-generated or custom credentials'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>

            {!editingUser && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="autoGenerate" className="text-sm font-medium">
                    Auto-generate credentials
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    System will create email and secure password
                  </p>
                </div>
                <Switch
                  id="autoGenerate"
                  checked={autoGenerateCredentials}
                  onCheckedChange={setAutoGenerateCredentials}
                />
              </div>
            )}

            {(!autoGenerateCredentials || editingUser) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password {editingUser ? '(leave blank to keep current)' : '*'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team_leader">Team Leader</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Team</Label>
              <Select
                value={formData.teamId}
                onValueChange={(value) => setFormData({ ...formData, teamId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Team</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingUser ? 'Save Changes' : 'Create User'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generated Credentials Dialog */}
      <Dialog open={!!generatedCredentials} onOpenChange={() => setGeneratedCredentials(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              User Created Successfully
            </DialogTitle>
            <DialogDescription>
              Please save these credentials securely. The password cannot be retrieved later.
            </DialogDescription>
          </DialogHeader>
          
          <Card className="bg-muted">
            <CardContent className="pt-4 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-mono text-sm">{generatedCredentials?.email}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Password</Label>
                <p className="font-mono text-sm">{generatedCredentials?.password}</p>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCopyCredentials} className="flex-1">
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
            <Button onClick={handleCloseCredentialsDialog} className="flex-1">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;

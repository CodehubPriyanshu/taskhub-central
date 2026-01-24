import { useState } from 'react';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, Mail, Lock, Shield, CheckCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const AdminSettings = () => {
  const { user, profile, role, updateEmail, updatePassword } = useSupabaseAuthContext();
  const { toast } = useToast();

  const [emailForm, setEmailForm] = useState({ email: profile?.email || '', isLoading: false });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false,
    isLoading: false,
  });

  // Only admin can access this page
  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(emailForm.email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: 'Invalid email', description: error.errors[0].message, variant: 'destructive' });
        return;
      }
    }

    setEmailForm(prev => ({ ...prev, isLoading: true }));

    const result = await updateEmail(emailForm.email);
    
    if (result.success) {
      toast({ 
        title: 'Email updated', 
        description: 'Your email has been updated successfully.',
      });
    } else {
      toast({ 
        title: 'Failed to update email', 
        description: result.error,
        variant: 'destructive',
      });
    }

    setEmailForm(prev => ({ ...prev, isLoading: false }));
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate new password
    try {
      passwordSchema.parse(passwordForm.newPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: 'Invalid password', description: error.errors[0].message, variant: 'destructive' });
        return;
      }
    }

    // Check passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setPasswordForm(prev => ({ ...prev, isLoading: true }));

    const result = await updatePassword(passwordForm.newPassword);
    
    if (result.success) {
      toast({ 
        title: 'Password updated', 
        description: 'Your password has been updated successfully.',
      });
      setPasswordForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        isLoading: false,
      }));
    } else {
      toast({ 
        title: 'Failed to update password', 
        description: result.error,
        variant: 'destructive',
      });
      setPasswordForm(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground">Manage your account credentials</p>
      </div>

      {/* Current Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Account Information
          </CardTitle>
          <CardDescription>Your current admin account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">{profile?.name}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm text-success font-medium">Admin</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Update Email
          </CardTitle>
          <CardDescription>Change your login email address</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">New Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter new email"
                value={emailForm.email}
                onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" disabled={emailForm.isLoading}>
              {emailForm.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Email'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Update Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Update Password
          </CardTitle>
          <CardDescription>Change your login password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={passwordForm.showNew ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setPasswordForm(prev => ({ ...prev, showNew: !prev.showNew }))}
                >
                  {passwordForm.showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                At least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={passwordForm.showConfirm ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setPasswordForm(prev => ({ ...prev, showConfirm: !prev.showConfirm }))}
                >
                  {passwordForm.showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={passwordForm.isLoading}>
              {passwordForm.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;

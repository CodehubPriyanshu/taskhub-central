import { useState, useEffect, useCallback } from 'react';
import { User, AuthState } from '@/types';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('tms_current_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setAuthState({ user, isAuthenticated: true });
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string; role?: 'admin' | 'team_leader' | 'user'; userId?: string }> => {
    try {
      // First, try to authenticate with backend API
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const { access_token, user, profile, role } = data;
        
        // Store the token and user info
        localStorage.setItem('auth_token', access_token);
        
        // Construct user object from API response
        const fullUser: User = {
          id: user.id,
          email: user.email,
          name: profile.name || '',
          password: '', // Not stored for security
          role: role,
          teamId: profile.team_id || undefined,
          avatar: profile.avatar || undefined,
          createdAt: profile.created_at || new Date().toISOString(),
          createdById: profile.created_by || undefined,
          isActive: profile.is_active !== false,
        };
        
        setAuthState({ user: fullUser, isAuthenticated: true });
        
        return { 
          success: true, 
          role: role, 
          userId: user.id,
          error: undefined 
        };
      } else {
        // Fallback to local storage authentication if API fails
        const users: User[] = JSON.parse(localStorage.getItem('tms_users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          localStorage.setItem('tms_current_user', JSON.stringify(user));
          setAuthState({ user, isAuthenticated: true });
          return { 
            success: true, 
            role: user.role, 
            userId: user.id,
            error: undefined 
          };
        }
        
        return { success: false, error: data.message || 'Invalid email or password' };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Fallback to local storage authentication if API fails
      const users: User[] = JSON.parse(localStorage.getItem('tms_users') || '[]');
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        localStorage.setItem('tms_current_user', JSON.stringify(user));
        setAuthState({ user, isAuthenticated: true });
        return { 
          success: true, 
          role: user.role, 
          userId: user.id,
          error: undefined 
        };
      }
      
      return { success: false, error: 'Login failed' };
    }
  }, []);

  const logout = useCallback(() => {
    // Clear both API token and local storage user
    localStorage.removeItem('auth_token');
    localStorage.removeItem('tms_current_user');
    setAuthState({ user: null, isAuthenticated: false });
  }, []);

  const updateCurrentUser = useCallback((updatedUser: User) => {
    localStorage.setItem('tms_current_user', JSON.stringify(updatedUser));
    setAuthState({ user: updatedUser, isAuthenticated: true });
  }, []);

  const updateEmail = async (newEmail: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch('http://localhost:5000/api/auth/update-email', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_email: newEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local user state
        const updatedUser = { ...authState.user!, email: newEmail };
        localStorage.setItem('tms_current_user', JSON.stringify(updatedUser));
        setAuthState({ user: updatedUser, isAuthenticated: true });
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Update email failed' };
      }
    } catch (error) {
      console.error('Update email error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch('http://localhost:5000/api/auth/update-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Update password failed' };
      }
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  return {
    ...authState,
    isLoading,
    login,
    logout,
    updateCurrentUser,
    updateEmail,
    updatePassword,
  };
};

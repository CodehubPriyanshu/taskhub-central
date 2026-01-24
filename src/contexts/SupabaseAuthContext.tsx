import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

// Define the role type
export type AppRole = 'admin' | 'team_leader' | 'user';

// Define the profile interface
interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  team_id: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

// Define the user interface (without Supabase dependency)
interface User {
  id: string;
  email: string;
  aud: string;
  // Add other user properties as needed
}

// Define the session interface (without Supabase dependency)
interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
  // Add other session properties as needed
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  signUp: (email: string, password: string, name: string, role?: AppRole, teamId?: string) => Promise<{ success: boolean; error?: string; data?: any }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  updateEmail: (newEmail: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthContextType>({
    user: null,
    session: null,
    profile: null,
    role: null,
    isLoading: true,
    isAuthenticated: false,
    signIn: async () => ({ success: false, error: 'Not implemented' }),
    signUp: async () => ({ success: false, error: 'Not implemented' }),
    signOut: async () => ({ success: false, error: 'Not implemented' }),
    updateEmail: async () => ({ success: false, error: 'Not implemented' }),
    updatePassword: async () => ({ success: false, error: 'Not implemented' }),
    refreshProfile: async () => { /* not implemented */ },
  });

  // Load auth state from localStorage or session storage on initial load
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Verify token with backend
          const response = await fetch('http://localhost:5000/api/auth/verify', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setAuthState(prev => ({
              ...prev,
              user: { id: userData.id, email: userData.email, aud: 'authenticated' },
              session: { access_token: token, refresh_token: '', user: { id: userData.id, email: userData.email, aud: 'authenticated' } },
              profile: userData.profile,
              role: userData.role,
              isLoading: false,
              isAuthenticated: true,
            }));
          } else {
            // Token invalid, clear it
            localStorage.removeItem('auth_token');
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
              isAuthenticated: false,
            }));
          }
        } else {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            isAuthenticated: false,
          }));
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
        }));
      }
    };

    loadAuthState();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
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
        localStorage.setItem('auth_token', access_token);
        
        setAuthState(prev => ({
          ...prev,
          user: { id: user.id, email: user.email, aud: 'authenticated' },
          session: { access_token, refresh_token: '', user: { id: user.id, email: user.email, aud: 'authenticated' } },
          profile,
          role,
          isAuthenticated: true,
        }));
        
        return { success: true, data };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: AppRole = 'user',
    teamId?: string
  ) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, role, team_id: teamId }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const signOut = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('auth_token');
      
      setAuthState(prev => ({
        ...prev,
        user: null,
        session: null,
        profile: null,
        role: null,
        isAuthenticated: false,
      }));
      
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: 'Sign out failed' };
    }
  };

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
        // Update local state
        setAuthState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, email: newEmail } : null,
          profile: prev.profile ? { ...prev.profile, email: newEmail } : null,
        }));
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

  const refreshProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token || !authState.user) {
        return;
      }

      const response = await fetch(`http://localhost:5000/api/profile/${authState.user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setAuthState(prev => ({
          ...prev,
          profile: data.profile,
          role: data.role,
        }));
      }
    } catch (error) {
      console.error('Refresh profile error:', error);
    }
  };

  const value = {
    ...authState,
    signIn,
    signUp,
    signOut,
    updateEmail,
    updatePassword,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

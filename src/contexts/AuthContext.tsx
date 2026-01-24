import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  userId: string | null; // Permanent unique ID tied to the account
  role: 'admin' | 'team_leader' | 'user' | null; // Current user's role
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: 'admin' | 'team_leader' | 'user'; userId?: string }>;
  logout: () => void;
  updateCurrentUser: (user: User) => void;
  updateEmail: (newEmail: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();

  // Extract userId and role from the user object
  const userId = auth.user?.id || null;
  const role = auth.user?.role || null;

  // Update role in localStorage when it changes
  useEffect(() => {
    if (role) {
      localStorage.setItem('user_role', role);
    } else {
      localStorage.removeItem('user_role');
    }
  }, [role]);

  const value: AuthContextType = {
    ...auth,
    userId,
    role,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

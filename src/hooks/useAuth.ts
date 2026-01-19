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

  const login = useCallback((email: string, password: string): { success: boolean; error?: string } => {
    const users: User[] = JSON.parse(localStorage.getItem('tms_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      localStorage.setItem('tms_current_user', JSON.stringify(user));
      setAuthState({ user, isAuthenticated: true });
      return { success: true };
    }
    
    return { success: false, error: 'Invalid email or password' };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('tms_current_user');
    setAuthState({ user: null, isAuthenticated: false });
  }, []);

  const updateCurrentUser = useCallback((updatedUser: User) => {
    localStorage.setItem('tms_current_user', JSON.stringify(updatedUser));
    setAuthState({ user: updatedUser, isAuthenticated: true });
  }, []);

  return {
    ...authState,
    isLoading,
    login,
    logout,
    updateCurrentUser,
  };
};

import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  team_id: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useSupabaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    role: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const [profileResult, roleResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_roles').select('role').eq('user_id', userId).single(),
      ]);

      return {
        profile: profileResult.data as Profile | null,
        role: roleResult.data?.role as AppRole | null,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return { profile: null, role: null };
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Use setTimeout to avoid potential deadlocks
          setTimeout(async () => {
            const { profile, role } = await fetchUserProfile(session.user.id);
            setAuthState({
              user: session.user,
              session,
              profile,
              role,
              isLoading: false,
              isAuthenticated: true,
            });
          }, 0);
        } else {
          setAuthState({
            user: null,
            session: null,
            profile: null,
            role: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      }
    );

    // Then get the initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { profile, role } = await fetchUserProfile(session.user.id);
        setAuthState({
          user: session.user,
          session,
          profile,
          role,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  };

  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    role: AppRole = 'user',
    teamId?: string
  ) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || 'Failed to create user' };
    }

    // Get current user for created_by field
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email,
      name,
      team_id: teamId || null,
      created_by: currentUser?.id || null,
    });

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    // Create role
    const { error: roleError } = await supabase.from('user_roles').insert({
      user_id: authData.user.id,
      role,
    });

    if (roleError) {
      return { success: false, error: roleError.message };
    }

    return { success: true, data: authData };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const updateEmail = async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      return { success: false, error: error.message };
    }
    
    // Update profile email too
    if (authState.user) {
      await supabase.from('profiles')
        .update({ email: newEmail })
        .eq('id', authState.user.id);
    }
    
    return { success: true };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const refreshProfile = useCallback(async () => {
    if (authState.user) {
      const { profile, role } = await fetchUserProfile(authState.user.id);
      setAuthState(prev => ({ ...prev, profile, role }));
    }
  }, [authState.user, fetchUserProfile]);

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    updateEmail,
    updatePassword,
    refreshProfile,
  };
};

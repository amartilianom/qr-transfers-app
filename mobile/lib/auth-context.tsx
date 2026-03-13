import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { BusinessUser } from '@/types/database';

interface AuthContextValue {
  session: Session | null;
  businessUser: BusinessUser | null; // Deprecated: use currentBusinessUser
  currentBusinessUser: BusinessUser | null;
  allBusinessUsers: BusinessUser[];
  displayName: string;
  isLoading: boolean;
  signInWithOtp: (phone: string) => Promise<{ error: Error | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshBusinessUser: () => Promise<void>;
  switchBusiness?: (businessUserId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [allBusinessUsers, setAllBusinessUsers] = useState<BusinessUser[]>([]);
  const [currentBusinessUser, setCurrentBusinessUser] = useState<BusinessUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllBusinessUsers = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('business_user')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .returns<BusinessUser[]>();

    if (data && data.length > 0) {
      setAllBusinessUsers(data);

      // Auto-select if only one business
      if (data.length === 1) {
        setCurrentBusinessUser(data[0]);
      } else {
        // Check for last_selected or use first one
        const lastSelected = data.find(bu => bu.last_selected);
        setCurrentBusinessUser(lastSelected || data[0]);
      }
    } else {
      setAllBusinessUsers([]);
      setCurrentBusinessUser(null);
    }
  }, []);

  const refreshBusinessUser = useCallback(async () => {
    if (session?.user.id) {
      await fetchAllBusinessUsers(session.user.id);
    }
  }, [session, fetchAllBusinessUsers]);

  const switchBusiness = useCallback(async (businessUserId: string) => {
    const bu = allBusinessUsers.find(u => u.id === businessUserId);
    if (bu) {
      setCurrentBusinessUser(bu);

      // Update last_selected in database
      await supabase
        .from('business_user')
        .update({ last_selected: true })
        .eq('id', businessUserId);

      // Unset last_selected for others
      await supabase
        .from('business_user')
        .update({ last_selected: false })
        .eq('user_id', session?.user.id)
        .neq('id', businessUserId);
    }
  }, [allBusinessUsers, session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        fetchAllBusinessUsers(s.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        fetchAllBusinessUsers(s.user.id).finally(() => setIsLoading(false));
      } else {
        setAllBusinessUsers([]);
        setCurrentBusinessUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchAllBusinessUsers]);

  const signInWithOtp = useCallback(async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error: error as Error | null };
  }, []);

  const verifyOtp = useCallback(async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAllBusinessUsers([]);
    setCurrentBusinessUser(null);
  }, []);

  const displayName = session?.user.user_metadata?.full_name || 'bienvenido';

  return (
    <AuthContext.Provider
      value={{
        session,
        businessUser: currentBusinessUser, // Backward compat
        currentBusinessUser,
        allBusinessUsers,
        displayName,
        isLoading,
        signInWithOtp,
        verifyOtp,
        signOut,
        refreshBusinessUser,
        switchBusiness,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { BusinessUser } from '@/types/database';

interface AuthContextValue {
  session: Session | null;
  businessUser: BusinessUser | null;
  isLoading: boolean;
  signInWithOtp: (phone: string) => Promise<{ error: Error | null }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshBusinessUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [businessUser, setBusinessUser] = useState<BusinessUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBusinessUser = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('business_user')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .limit(1)
      .single<BusinessUser>();

    setBusinessUser(data ?? null);
  }, []);

  const refreshBusinessUser = useCallback(async () => {
    if (session?.user.id) {
      await fetchBusinessUser(session.user.id);
    }
  }, [session, fetchBusinessUser]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        fetchBusinessUser(s.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        fetchBusinessUser(s.user.id).finally(() => setIsLoading(false));
      } else {
        setBusinessUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchBusinessUser]);

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
    setBusinessUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, businessUser, isLoading, signInWithOtp, verifyOtp, signOut, refreshBusinessUser }}
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

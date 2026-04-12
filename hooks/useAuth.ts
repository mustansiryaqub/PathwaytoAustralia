import { useEffect, useCallback } from 'react';
import { supabase, authHelpers, profileQueries } from '@/lib/supabase';
import { identifyUser, logOutRevenueCat } from '@/lib/revenuecat';
import { useAuthStore } from '@/store/authStore';
import type { UserProfile } from '@/types';

export function useAuth() {
  const {
    user,
    session,
    profile,
    isLoading,
    isInitialised,
    setUser,
    setSession,
    setProfile,
    setLoading,
    setInitialised,
    reset,
  } = useAuthStore();

  // Initialise auth state and listen to changes
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { session: currentSession } = await authHelpers.getSession();
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await loadProfile(currentSession.user.id);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialised(true);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          await loadProfile(newSession.user.id);
          // Identify in RevenueCat
          try {
            await identifyUser(newSession.user.id);
          } catch {
            // Non-critical
          }
        }

        if (event === 'SIGNED_OUT') {
          reset();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const prof = await profileQueries.get(userId);
      setProfile(prof);
      return prof;
    } catch {
      return null;
    }
  };

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      setLoading(true);
      try {
        const { data, error } = await authHelpers.signUp(email, password, fullName);
        if (error) return { success: false, error: error.message };
        return { success: true, data };
      } finally {
        setLoading(false);
      }
    },
    [setLoading]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const { data, error } = await authHelpers.signIn(email, password);
        if (error) return { success: false, error: error.message };
        return { success: true, data };
      } finally {
        setLoading(false);
      }
    },
    [setLoading]
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await authHelpers.signOut();
      try {
        await logOutRevenueCat();
      } catch {
        // Non-critical
      }
      reset();
    } finally {
      setLoading(false);
    }
  }, [reset, setLoading]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    await loadProfile(user.id);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isPremium = profile?.subscription_tier === 'premium';

  return {
    user,
    session,
    profile,
    isLoading,
    isInitialised,
    isAuthenticated: !!user,
    isPremium,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };
}

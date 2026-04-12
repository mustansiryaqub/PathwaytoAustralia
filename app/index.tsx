import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

// Root redirect: send users to the correct section based on auth state
export default function Index() {
  const { isAuthenticated, isInitialised } = useAuth();

  if (!isInitialised) return null;

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

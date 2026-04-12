import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/hooks/useAuth';
import { initRevenueCat } from '@/lib/revenuecat';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isInitialised, user } = useAuth();

  useEffect(() => {
    initRevenueCat(user?.id).catch(console.error);
  }, [user?.id]);

  useEffect(() => {
    if (isInitialised) {
      SplashScreen.hideAsync();
    }
  }, [isInitialised]);

  if (!isInitialised) return null;

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="quiz" />
        <Stack.Screen
          name="university/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitle: 'Back',
            headerTransparent: true,
          }}
        />
        <Stack.Screen
          name="results"
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack>
    </>
  );
}

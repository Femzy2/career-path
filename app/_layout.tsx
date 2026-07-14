import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Suppress useLayoutEffect warning during SSR on Web
if (Platform.OS === 'web' && typeof window === 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('useLayoutEffect does nothing on the server')) {
      return;
    }
    originalConsoleError(...args);
  };
}


export const unstable_settings = {
  anchor: 'auth',
};

// Inner component that handles auth-based routing
function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [walkthroughChecked, setWalkthroughChecked] = useState(false);
  const [hasSeenWalkthrough, setHasSeenWalkthrough] = useState(false);

  useEffect(() => {
    const checkWalkthrough = async () => {
      try {
        const val = await AsyncStorage.getItem('@has_seen_walkthrough');
        setHasSeenWalkthrough(val === 'true');
      } catch (err) {
        console.warn('Error reading walkthrough status:', err);
      } finally {
        setWalkthroughChecked(true);
      }
    };
    checkWalkthrough();
  }, [segments]);

  useEffect(() => {
    if (loading || !walkthroughChecked) return;

    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'welcome' || segments[0] === undefined;

    if (!user) {
      if (!hasSeenWalkthrough) {
        if (segments[0] !== 'welcome') {
          router.replace('/welcome');
        }
      } else {
        if (segments[0] !== 'auth') {
          router.replace('/auth');
        }
      }
    } else {
      // User is logged in
      if (inAuthGroup) {
        // Redirect them based on whether they have completed onboarding
        const redirectUser = async () => {
          try {
            const hasRecommendation = await AsyncStorage.getItem('@career_recommendation');
            if (hasRecommendation) {
              router.replace('/(tabs)');
            } else {
              router.replace('/onboarding');
            }
          } catch (err) {
            router.replace('/onboarding');
          }
        };
        redirectUser();
      }
    }
  }, [user, loading, segments, walkthroughChecked, hasSeenWalkthrough]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RouteGuard>
            <Stack>
              <Stack.Screen name="welcome" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="roadmap" options={{ presentation: 'modal', headerShown: false }} />
            </Stack>
          </RouteGuard>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

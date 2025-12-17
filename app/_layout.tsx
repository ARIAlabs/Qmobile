import { EnvironmentBadge } from '@/components/EnvironmentBadge';
import { AppProvider } from '@/context/AppContext';
import { BookingProvider } from '@/context/BookingContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

// Prevent splash screen from auto-hiding until we're ready
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check authentication status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirect based on authentication status
  useEffect(() => {
    if (isAuthenticated === null) return; // Still loading

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to auth if not authenticated
      router.replace('/auth');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to tabs if authenticated
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments]);

  // Hide splash screen once auth check is complete
  useEffect(() => {
    if (isAuthenticated !== null) {
      SplashScreen.hideAsync();
    }
  }, [isAuthenticated]);

  // Force HTTPS when running on web inside an iframe to align with Builder's https origin
 // useEffect(() => {
  //  if (Platform.OS === 'web' && typeof window !== 'undefined') {
  //    const isHttpLocalhost = window.location.protocol === 'http:' && window.location.hostname === 'localhost';
  //    if (isHttpLocalhost) {
 //       const newUrl = 'https://' + window.location.host + window.location.pathname + window.location.search + window.location.hash;
 //      window.location.replace(newUrl);
 //     }
 //   }
//  }, []);

  // Show loading screen while checking auth
  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <BookingProvider>
        <RootLayoutNav />
        <EnvironmentBadge />
      </BookingProvider>
    </AppProvider>
  );
}

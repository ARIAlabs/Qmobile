import { EnvironmentBadge } from '@/components/EnvironmentBadge';
import { AppProvider } from '@/context/AppContext';
import { BookingProvider } from '@/context/BookingContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  // Force HTTPS when running on web inside an iframe to align with Builder's https origin
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const isHttpLocalhost = window.location.protocol === 'http:' && window.location.hostname === 'localhost';
      if (isHttpLocalhost) {
        const newUrl = 'https://' + window.location.host + window.location.pathname + window.location.search + window.location.hash;
        window.location.replace(newUrl);
      }
    }
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
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

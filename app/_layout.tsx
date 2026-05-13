import { useEffect } from 'react';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SystemUI from 'expo-system-ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider } from '@/providers/auth-provider';
import { ChatRoomsProvider } from '@/providers/chat-rooms-provider';
import { NotificationsProvider } from '@/providers/notifications-provider';
import { palette } from '@/lib/theme';

export default function RootLayout() {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(palette.cream).catch(() => undefined);
  }, []);

  return (
    <AuthProvider>
      <NotificationsProvider>
        <ChatRoomsProvider>
        <ThemeProvider
          value={{
            ...DefaultTheme,
            colors: {
              ...DefaultTheme.colors,
              background: palette.cream,
              card: palette.cream,
              primary: palette.burgundy,
              text: palette.ink,
              border: palette.border,
            },
          }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: palette.cream },
            }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="post/[id]" />
            <Stack.Screen name="post/compose" />
            <Stack.Screen name="chat/[id]" />
            <Stack.Screen name="account/liked" />
            <Stack.Screen name="account/mine" />
            <Stack.Screen name="account/edit" />
            <Stack.Screen name="notifications" />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
        </ChatRoomsProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}

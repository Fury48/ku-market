import { useEffect } from 'react';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SystemUI from 'expo-system-ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import { AuthProvider } from '@/providers/auth-provider';
import { ChatRoomsProvider } from '@/providers/chat-rooms-provider';
import { NotificationsProvider } from '@/providers/notifications-provider';
import { palette } from '@/lib/theme';
import { installWebAlert } from '@/lib/web-alert';

export default function RootLayout() {
  installWebAlert();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(palette.cream).catch(() => undefined);
  }, []);

  return (
    <View style={Platform.OS === 'web' ? styles.webShell : styles.nativeShell}>
      <View style={Platform.OS === 'web' ? styles.webFrame : styles.nativeShell}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nativeShell: {
    flex: 1,
  },
  webShell: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#0E1014',
  },
  webFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: palette.cream,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
  },
});

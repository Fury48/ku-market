import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticTab } from '@/components/haptic-tab';
import { palette } from '@/lib/theme';
import { useChatRooms } from '@/providers/chat-rooms-provider';
import { useKeyboardOffset } from '@/hooks/use-keyboard-offset';

export default function TabLayout() {
  const { unreadCount } = useChatRooms();
  const keyboardOffset = useKeyboardOffset();
  const chatBadge = unreadCount > 99 ? '99+' : unreadCount || undefined;
  const hideTabBar = Platform.OS === 'web' && keyboardOffset > 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.burgundy,
        tabBarInactiveTintColor: palette.muted,
        headerShown: false,
        sceneStyle: {
          backgroundColor: palette.cream,
        },
        tabBarButton: HapticTab,
        tabBarStyle: {
          display: hideTabBar ? 'none' : 'flex',
          height: 100,
          paddingTop: 8,
          paddingBottom: 22,
          backgroundColor: palette.white,
          borderTopColor: palette.border,
        },
        tabBarItemStyle: {
          paddingBottom: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '메인',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: '중고',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? 'basket' : 'basket-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recruit"
        options={{
          title: '구인',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? 'people' : 'people-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="promo"
        options={{
          title: '홍보',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? 'megaphone' : 'megaphone-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="chats"
        options={{
          title: '채팅',
          tabBarBadge: chatBadge,
          tabBarBadgeStyle: {
            backgroundColor: palette.burgundy,
            color: palette.white,
            fontSize: 11,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? 'chatbubble' : 'chatbubble-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: '계정',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? 'person-circle' : 'person-circle-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

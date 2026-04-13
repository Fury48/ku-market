import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { HapticTab } from '@/components/haptic-tab';
import { palette } from '@/lib/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.burgundy,
        tabBarInactiveTintColor: palette.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 78,
          paddingTop: 8,
          paddingBottom: 14,
          backgroundColor: palette.white,
          borderTopColor: palette.border,
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

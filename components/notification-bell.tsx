import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { palette } from '@/lib/theme';
import { useNotifications } from '@/providers/notifications-provider';

type NotificationBellProps = {
  compact?: boolean;
};

export function NotificationBell({ compact = false }: NotificationBellProps) {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Pressable
      accessibilityLabel="알림"
      onPress={() => router.push('/notifications' as Href)}
      style={[styles.button, compact && styles.compactButton]}>
      <Ionicons name={unreadCount ? 'notifications' : 'notifications-outline'} size={21} color={palette.ink} />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: palette.burgundy,
    borderWidth: 1,
    borderColor: palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: palette.white,
    fontSize: 10,
    fontWeight: '800',
  },
});

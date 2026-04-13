import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatRelativeTime } from '@/lib/format';
import { palette, radius, spacing } from '@/lib/theme';
import { ChatRoomSummary } from '@/types/models';
import { Avatar } from '@/components/ui/avatar';

type ChatRoomRowProps = {
  room: ChatRoomSummary;
  onPress: () => void;
};

export function ChatRoomRow({ room, onPress }: ChatRoomRowProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Avatar uri={room.otherUser.profileImageUrl} size={52} label={room.otherUser.nickname} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{room.otherUser.nickname}</Text>
          <Text style={styles.time}>{formatRelativeTime(room.lastMessageAt)}</Text>
        </View>
        <Text style={styles.postTitle} numberOfLines={1}>
          {room.postTitle}
        </Text>
        <Text style={styles.message} numberOfLines={1}>
          {room.lastMessage || '채팅을 시작해보세요'}
        </Text>
      </View>
      {room.unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{room.unreadCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.9,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  time: {
    color: palette.muted,
    fontSize: 11,
  },
  postTitle: {
    color: palette.burgundy,
    fontSize: 12,
    fontWeight: '600',
  },
  message: {
    color: palette.muted,
    fontSize: 13,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.burgundy,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '700',
  },
});

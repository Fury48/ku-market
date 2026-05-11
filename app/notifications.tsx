import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatRelativeTime } from '@/lib/format';
import { palette, radius, spacing } from '@/lib/theme';
import { useNotifications } from '@/providers/notifications-provider';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, loading, unreadCount, refreshNotifications, markAllRead } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshNotifications()
        .then(() => markAllRead())
        .catch(() => undefined);
    }, [markAllRead, refreshNotifications])
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshNotifications();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.burgundy} />}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={palette.ink} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>알림</Text>
            <Text style={styles.subtitle}>
              {unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : '새 알림을 모두 확인했어요.'}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={palette.burgundy} />
          </View>
        ) : notifications.length ? (
          notifications.map((notification) => (
            <Pressable
              key={notification.id}
              onPress={() => router.push(`/post/${notification.postId}` as Href)}
              style={[styles.notificationCard, !notification.readAt && styles.unreadCard]}>
              <View style={[styles.iconWrap, notification.type === 'like' ? styles.likeIcon : styles.commentIcon]}>
                <Ionicons
                  name={notification.type === 'like' ? 'heart' : 'chatbubble-ellipses'}
                  size={18}
                  color={palette.white}
                />
              </View>
              <View style={styles.notificationText}>
                <View style={styles.notificationTopRow}>
                  <Text style={styles.message} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  {!notification.readAt ? <View style={styles.unreadDot} /> : null}
                </View>
                <Text style={styles.postTitle} numberOfLines={1}>
                  {notification.postTitle}
                </Text>
                <Text style={styles.time}>{formatRelativeTime(notification.createdAt)}</Text>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="notifications-outline" size={32} color={palette.muted} />
            <Text style={styles.emptyTitle}>아직 알림이 없어요</Text>
            <Text style={styles.emptyText}>내 게시글에 댓글이나 찜이 생기면 여기에서 모아볼 수 있어요.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: palette.ink,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.muted,
    fontSize: 13,
    marginTop: 5,
  },
  loadingWrap: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  unreadCard: {
    borderColor: palette.burgundy,
    backgroundColor: palette.creamStrong,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeIcon: {
    backgroundColor: palette.burgundy,
  },
  commentIcon: {
    backgroundColor: palette.gold,
  },
  notificationText: {
    flex: 1,
    gap: 5,
  },
  notificationTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  message: {
    flex: 1,
    color: palette.ink,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.burgundy,
    marginTop: 6,
  },
  postTitle: {
    color: palette.muted,
    fontSize: 13,
  },
  time: {
    color: palette.muted,
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    alignItems: 'center',
  },
  emptyTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});

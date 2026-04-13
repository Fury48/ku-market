import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api';
import { palette, radius, spacing } from '@/lib/theme';
import { ChatRoomSummary } from '@/types/models';
import { ChatRoomRow } from '@/components/chat-room-row';

export default function ChatsScreen() {
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  const loadRooms = useCallback(async () => {
    const response = await apiFetch<{ rooms: ChatRoomSummary[] }>('/chats');
    setRooms(response.rooms);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadRooms()
        .catch(() => {
          setRooms([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }, [loadRooms])
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadRooms();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.burgundy} />}>
        <Text style={styles.title}>채팅</Text>
        <Text style={styles.subtitle}>게시글에서 바로 이어진 대화를 당근마켓처럼 한눈에 확인해보세요.</Text>

        {showAlert ? (
          <View style={styles.alertCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>안전 거래 안내</Text>
              <Text style={styles.alertText}>선입금 유도, 외부 메신저 이동, 신분 도용 같은 위험 행위를 조심하세요.</Text>
            </View>
            <Pressable onPress={() => setShowAlert(false)}>
              <Text style={styles.alertDismiss}>닫기</Text>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={palette.burgundy} />
          </View>
        ) : rooms.length ? (
          rooms.map((room) => <ChatRoomRow key={room.id} room={room} onPress={() => router.push(`/chat/${room.id}` as Href)} />)
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>아직 열린 채팅이 없어요</Text>
            <Text style={styles.emptyText}>관심 있는 게시글에서 채팅하기를 눌러 대화를 시작해보세요.</Text>
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
  title: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: spacing.lg,
  },
  alertCard: {
    backgroundColor: '#FFF6EA',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F2D6A4',
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  alertTitle: {
    color: palette.warning,
    fontSize: 13,
    fontWeight: '800',
  },
  alertText: {
    color: palette.ink,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  alertDismiss: {
    color: palette.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  loadingWrap: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: 8,
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

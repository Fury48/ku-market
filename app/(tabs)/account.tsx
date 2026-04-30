import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { palette, radius, spacing } from '@/lib/theme';
import { useAuth } from '@/providers/auth-provider';
import { Avatar } from '@/components/ui/avatar';

export default function AccountScreen() {
  const router = useRouter();
  const { user, stats, refreshSession, logout } = useAuth();

  useFocusEffect(
    useCallback(() => {
      refreshSession().catch(() => undefined);
    }, [refreshSession])
  );

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>계정</Text>
        <Text style={styles.subtitle}>프로필, 찜한 글, 내가 작성한 글을 한곳에서 관리해보세요.</Text>

        <View style={styles.profileCard}>
          <Avatar uri={user.profileImageUrl} size={76} label={user.nickname} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.nickname}>{user.nickname}</Text>
            <Text style={styles.profileMeta}>
              {user.department} · {user.studentYear}학년
            </Text>
            <Text style={styles.profileBio}>{user.bio || '고려대 학생들과 안전하게 연결되고 있어요.'}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="내 글" value={stats?.myPostCount ?? 0} />
          <StatCard label="찜한 글" value={stats?.likedPostCount ?? 0} />
          <StatCard label="채팅방" value={stats?.chatRoomCount ?? 0} />
        </View>

        <MenuButton label="찜한 게시글" description="좋아요로 모아둔 글을 다시 확인해요." onPress={() => router.push('/account/liked' as Href)} />
        <MenuButton label="내가 작성한 게시글" description="작성한 거래글과 모집글을 한 번에 봐요." onPress={() => router.push('/account/mine' as Href)} />
        <MenuButton label="프로필 수정" description="닉네임, 학과, 소개, 프로필 이미지를 수정해요." onPress={() => router.push('/account/edit' as Href)} />

        <Pressable
          onPress={async () => {
            await logout();
            router.replace('/login' as Href);
          }}
          style={styles.logoutButton}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuButton({
  label,
  description,
  onPress,
}: {
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuButton, pressed && { opacity: 0.92 }]}>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuDescription}>{description}</Text>
    </Pressable>
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
    gap: spacing.lg,
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
    marginTop: -6,
  },
  profileCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  nickname: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '800',
  },
  profileMeta: {
    color: palette.burgundy,
    fontSize: 13,
    fontWeight: '700',
  },
  profileBio: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  menuButton: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 6,
  },
  menuLabel: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  menuDescription: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  logoutButton: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#70424D',
    backgroundColor: '#3A242B',
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: palette.danger,
    fontSize: 15,
    fontWeight: '800',
  },
});

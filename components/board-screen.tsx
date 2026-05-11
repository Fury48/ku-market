import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildQuery, apiFetch } from '@/lib/api';
import {
  boardDescriptions,
  boardTitles,
  subcategoryOptions,
} from '@/lib/constants';
import { palette, spacing } from '@/lib/theme';
import { BoardType, FeedResponse, PostCategory, PostSummary } from '@/types/models';
import { FloatingWriteButton } from '@/components/ui/floating-write-button';
import { PostCard } from '@/components/post-card';
import { SearchHeader } from '@/components/search-header';
import { NotificationBell } from '@/components/notification-bell';

type BoardScreenProps = {
  board: BoardType;
};

function toCategoryValue(value: string): 'all' | PostCategory {
  if (value === 'market' || value === 'recruit' || value === 'promo' || value === 'community') {
    return value;
  }

  return 'all';
}

export function BoardScreen({ board }: BoardScreenProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [primary, setPrimary] = useState<'all' | PostCategory>(board === 'main' ? 'all' : board);
  const [secondary, setSecondary] = useState('all');
  const [headerHeight, setHeaderHeight] = useState(0);

  const secondaryChips = useMemo(() => {
    if (board === 'main') {
      if (primary === 'all') {
        return [];
      }

      return [{ label: '전체', value: 'all' }, ...subcategoryOptions[primary].map((item) => ({ label: item, value: item }))];
    }

    return [{ label: '전체', value: 'all' }, ...subcategoryOptions[board].map((item) => ({ label: item, value: item }))];
  }, [board, primary]);

  const primaryChips = useMemo(() => {
    return [];
  }, [board]);

  const fetchPosts = useCallback(async () => {
    const params =
      board === 'main'
        ? { board, type: primary === 'all' ? null : primary, subcategory: secondary === 'all' ? null : secondary, query }
        : { board, subcategory: secondary === 'all' ? null : secondary, query };

    const response = await apiFetch<FeedResponse>(`/feed${buildQuery(params)}`);
    setPosts(response.posts);
  }, [board, primary, query, secondary]);

  useEffect(() => {
    setLoading(true);
    fetchPosts()
      .catch(() => {
        setPosts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fetchPosts]);

  useFocusEffect(
    useCallback(() => {
      fetchPosts().catch(() => undefined);
    }, [fetchPosts])
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetchPosts();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        <View
          style={styles.floatingHeader}
          onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
          <SearchHeader
            title={board === 'main' ? '' : boardTitles[board]}
            titleLogo={board === 'main' ? require('../assets/images/kul.png') : undefined}
            subtitle={board === 'main' ? undefined : boardDescriptions[board]}
            query={query}
            onChangeQuery={setQuery}
            primaryChips={primaryChips}
            primaryValue={primary}
            onPrimaryChange={(value) => {
              const nextValue = toCategoryValue(value);
              setPrimary(nextValue);
              setSecondary('all');
            }}
            secondaryChips={secondaryChips}
            secondaryValue={secondary}
            onSecondaryChange={setSecondary}
            rightAccessory={<NotificationBell />}
          />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + spacing.md }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={palette.burgundy}
              progressViewOffset={headerHeight}
            />
          }>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={palette.burgundy} />
            </View>
          ) : posts.length ? (
            posts.map((post) => (
              <PostCard key={post.id} post={post} onPress={() => router.push(`/post/${post.id}` as Href)} />
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>아직 게시글이 없어요</Text>
              <Text style={styles.emptyText}>첫 게시글을 올려서 호랭마켓 피드를 시작해보세요.</Text>
            </View>
          )}
        </ScrollView>

        <FloatingWriteButton onPress={() => router.push(`/post/compose?board=${board}` as Href)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  container: {
    flex: 1,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: palette.cream,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  loadingWrap: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 20,
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

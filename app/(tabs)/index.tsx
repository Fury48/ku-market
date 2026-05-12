import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { type Href, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildQuery, apiFetch } from '@/lib/api';
import { formatRelativeTime } from '@/lib/format';
import { palette, spacing } from '@/lib/theme';
import { FeedResponse, PostCategory, PostSummary } from '@/types/models';
import { FloatingWriteButton } from '@/components/ui/floating-write-button';
import { SearchHeader } from '@/components/search-header';
import { NotificationBell } from '@/components/notification-bell';

type MainBoardKey = Extract<PostCategory, 'market' | 'recruit' | 'promo'>;

type MainSection = {
  key: MainBoardKey;
  title: string;
  href: Href;
};

const MAIN_SECTIONS: MainSection[] = [
  { key: 'market', title: '중고 게시판', href: '/(tabs)/market' as Href },
  { key: 'recruit', title: '구인 게시판', href: '/(tabs)/recruit' as Href },
  { key: 'promo', title: '홍보 게시판', href: '/(tabs)/promo' as Href },
];

const EMPTY_SECTION_POSTS: Record<MainBoardKey, PostSummary[]> = {
  market: [],
  recruit: [],
  promo: [],
};

export default function MainBoardScreen() {
  const router = useRouter();
  const [sectionPosts, setSectionPosts] = useState<Record<MainBoardKey, PostSummary[]>>(EMPTY_SECTION_POSTS);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [headerHeight, setHeaderHeight] = useState(0);

  const fetchRecentPosts = useCallback(async () => {
    const entries = await Promise.all(
      MAIN_SECTIONS.map(async (section) => {
        const response = await apiFetch<FeedResponse>(
          `/feed${buildQuery({ board: 'main', type: section.key, query })}`
        );

        return [section.key, response.posts.slice(0, 2)] as const;
      })
    );

    setSectionPosts(Object.fromEntries(entries) as Record<MainBoardKey, PostSummary[]>);
  }, [query]);

  useEffect(() => {
    setLoading(true);
    fetchRecentPosts()
      .catch(() => {
        setSectionPosts(EMPTY_SECTION_POSTS);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fetchRecentPosts]);

  useFocusEffect(
    useCallback(() => {
      fetchRecentPosts().catch(() => undefined);
    }, [fetchRecentPosts])
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.container}>
        <View
          style={styles.floatingHeader}
          onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
          <SearchHeader
            title=""
            titleLogo={require('../../assets/images/kul.png')}
            query={query}
            onChangeQuery={setQuery}
            primaryChips={[]}
            primaryValue="all"
            onPrimaryChange={() => undefined}
            secondaryChips={[]}
            secondaryValue="all"
            onSecondaryChange={() => undefined}
            rightAccessory={<NotificationBell />}
          />
        </View>

        <View style={[styles.boardArea, { paddingTop: headerHeight + spacing.sm }]}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={palette.burgundy} />
            </View>
          ) : (
            MAIN_SECTIONS.map((section) => (
              <View key={section.key} style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Pressable
                    hitSlop={12}
                    onPress={() => router.push(section.href)}
                    style={({ pressed }) => [styles.sectionLink, pressed && styles.pressed]}>
                    <Text style={styles.sectionArrow}>&gt;</Text>
                  </Pressable>
                </View>

                <View style={styles.postGroup}>
                  {sectionPosts[section.key].map((post, index) => (
                    <MainPostRow
                      key={post.id}
                      post={post}
                      isLast={index === 1}
                      onPress={() => router.push(`/post/${post.id}` as Href)}
                    />
                  ))}

                  {Array.from({ length: 2 - sectionPosts[section.key].length }).map((_, index) => (
                    <EmptyPostRow key={`empty-${section.key}-${index}`} isLast={sectionPosts[section.key].length + index === 1} />
                  ))}
                </View>
              </View>
            ))
          )}
        </View>

        <FloatingWriteButton onPress={() => router.push('/post/compose?board=main' as Href)} />
      </View>
    </SafeAreaView>
  );
}

function MainPostRow({
  post,
  isLast,
  onPress,
}: {
  post: PostSummary;
  isLast: boolean;
  onPress: () => void;
}) {
  const headline = getPostHeadline(post);
  const meta = [post.location || post.subcategory, formatRelativeTime(post.createdAt)].filter(Boolean).join(' · ');

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.postRow, isLast && styles.lastPostRow, pressed && styles.pressed]}>
      {post.coverImageUrl ? (
        <Image source={{ uri: post.coverImageUrl }} style={styles.postImage} contentFit="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>사진</Text>
        </View>
      )}

      <View style={styles.postBody}>
        <Text style={styles.postTitle} numberOfLines={1}>
          {post.title}
        </Text>
        <Text style={styles.postMeta} numberOfLines={1}>
          {meta}
        </Text>
        <View style={styles.postBottomRow}>
          <Text style={styles.postHeadline} numberOfLines={1}>
            {headline}
          </Text>
          <View style={styles.reactionRow}>
            {post.commentCount > 0 ? (
              <View style={styles.reaction}>
                <Ionicons name="chatbubble-ellipses" size={17} color={palette.muted} />
                <Text style={styles.reactionText}>{post.commentCount}</Text>
              </View>
            ) : null}
            {post.likeCount > 0 ? (
              <View style={styles.reaction}>
                <Ionicons name="heart" size={17} color={palette.muted} />
                <Text style={styles.reactionText}>{post.likeCount}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function EmptyPostRow({ isLast }: { isLast: boolean }) {
  return (
    <View style={[styles.postRow, isLast && styles.lastPostRow]}>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imagePlaceholderText}>사진</Text>
      </View>
      <View style={styles.postBody}>
        <Text style={styles.emptyTitle}>게시글이 없습니다</Text>
      </View>
    </View>
  );
}

function getPostHeadline(post: PostSummary) {
  if (post.category === 'market') {
    if (!post.price) {
      return '나눔';
    }

    return `${post.price.toLocaleString('ko-KR')}원`;
  }

  if (post.category === 'recruit') {
    if (post.recruitmentCurrent !== null || post.recruitmentTarget !== null) {
      return `${post.recruitmentCurrent ?? 0}/${post.recruitmentTarget ?? 0}명 모집`;
    }

    return post.status || '모집중';
  }

  if (post.category === 'promo') {
    return post.status || '홍보중';
  }

  return post.subcategory;
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
  boardArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    flex: 1,
    minHeight: 0,
  },
  sectionTitleRow: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 28,
  },
  sectionLink: {
    width: 34,
    height: 30,
    marginLeft: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionArrow: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 26,
  },
  postGroup: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    backgroundColor: palette.cream,
  },
  postRow: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  lastPostRow: {
    borderBottomWidth: 0,
  },
  pressed: {
    opacity: 0.72,
  },
  postImage: {
    width: 74,
    height: 74,
    borderRadius: 8,
    backgroundColor: palette.creamStrong,
  },
  imagePlaceholder: {
    width: 74,
    height: 74,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.creamStrong,
    borderWidth: 1,
    borderColor: palette.border,
  },
  imagePlaceholderText: {
    color: palette.muted,
    fontSize: 15,
    fontWeight: '700',
  },
  postBody: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
    gap: 3,
  },
  postTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  postMeta: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 17,
  },
  postBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  postHeadline: {
    flex: 1,
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  reactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionText: {
    color: palette.muted,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyTitle: {
    color: palette.muted,
    fontSize: 16,
    fontWeight: '700',
  },
});

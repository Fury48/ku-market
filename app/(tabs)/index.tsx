import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { type Href, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildQuery, apiFetch } from '@/lib/api';
import { formatRelativeTime } from '@/lib/format';
import { palette, spacing } from '@/lib/theme';
import { FeedResponse, PostCategory, PostSummary } from '@/types/models';
import { SearchHeader } from '@/components/search-header';
import { NotificationBell } from '@/components/notification-bell';

type MainBoardKey = Extract<PostCategory, 'market' | 'recruit' | 'promo'>;

type MainSection = {
  key: MainBoardKey;
  hotLabel: string;
  href: Href;
};

const MAIN_SECTIONS: MainSection[] = [
  { key: 'market', hotLabel: '중고글', href: '/(tabs)/market' as Href },
  { key: 'recruit', hotLabel: '구인글', href: '/(tabs)/recruit' as Href },
  { key: 'promo', hotLabel: '홍보글', href: '/(tabs)/promo' as Href },
];

const HOT_POST_COUNT = 2;
const RECENT_POST_COUNT = 5;

const EMPTY_SECTION_POSTS: Record<MainBoardKey, PostSummary[]> = {
  market: [],
  recruit: [],
  promo: [],
};

export default function MainBoardScreen() {
  const router = useRouter();
  const [hotPosts, setHotPosts] = useState<Record<MainBoardKey, PostSummary[]>>(EMPTY_SECTION_POSTS);
  const [recentPosts, setRecentPosts] = useState<PostSummary[]>([]);
  const [activeHotIndex, setActiveHotIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [headerHeight, setHeaderHeight] = useState(0);
  const hasLoadedRef = useRef(false);

  const activeHotSection = MAIN_SECTIONS[activeHotIndex] ?? MAIN_SECTIONS[0];

  const fetchHomePosts = useCallback(async () => {
    const response = await apiFetch<FeedResponse>(`/feed${buildQuery({ board: 'main', query })}`);
    const posts = response.posts;
    const hotEntries = MAIN_SECTIONS.map((section) => {
      const sectionPosts = posts.filter((post) => post.category === section.key);

      return [section.key, getPopularPosts(sectionPosts)] as const;
    });

    return {
      hotPosts: Object.fromEntries(hotEntries) as Record<MainBoardKey, PostSummary[]>,
      recentPosts: posts.slice(0, RECENT_POST_COUNT),
    };
  }, [query]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      if (!hasLoadedRef.current) {
        setLoading(true);
      }

      fetchHomePosts()
        .then((nextState) => {
          if (!isActive) {
            return;
          }

          setHotPosts(nextState.hotPosts);
          setRecentPosts(nextState.recentPosts);
        })
        .catch(() => {
          if (!isActive) {
            return;
          }

          setHotPosts(EMPTY_SECTION_POSTS);
          setRecentPosts([]);
        })
        .finally(() => {
          if (!isActive) {
            return;
          }

          hasLoadedRef.current = true;
          setLoading(false);
        });

      return () => {
        isActive = false;
      };
    }, [fetchHomePosts])
  );

  function handleHotScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!carouselWidth) {
      return;
    }

    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / carouselWidth);
    setActiveHotIndex(Math.min(Math.max(nextIndex, 0), MAIN_SECTIONS.length - 1));
  }

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
            <>
              <View style={styles.hotSection}>
                <View style={styles.sectionTitleRow}>
                  <Pressable
                    hitSlop={8}
                    onPress={() => router.push(activeHotSection.href)}
                    style={({ pressed }) => [styles.sectionTitlePressable, pressed && styles.pressed]}>
                    <Text style={styles.sectionTitle} numberOfLines={1}>
                      지금 고려대학교는 이런 {activeHotSection.hotLabel}이 핫해요!
                    </Text>
                    <Text style={styles.sectionArrow}>&gt;</Text>
                  </Pressable>
                </View>

                <View style={styles.carouselWrap} onLayout={(event) => setCarouselWidth(event.nativeEvent.layout.width)}>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    bounces={false}
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onMomentumScrollEnd={handleHotScrollEnd}>
                    {MAIN_SECTIONS.map((section) => {
                      const posts = hotPosts[section.key];
                      const pageWidth = carouselWidth || 1;

                      return (
                        <View key={section.key} style={[styles.carouselPage, { width: pageWidth }]}>
                          <View style={styles.hotPostGroup}>
                            {posts.map((post, index) => (
                              <MainPostRow
                                key={post.id}
                                post={post}
                                isLast={index === HOT_POST_COUNT - 1}
                                variant="hot"
                                onPress={() => router.push(`/post/${post.id}` as Href)}
                              />
                            ))}

                            {Array.from({ length: Math.max(0, HOT_POST_COUNT - posts.length) }).map((_, index) => (
                              <EmptyPostRow
                                key={`empty-${section.key}-${index}`}
                                isLast={posts.length + index === HOT_POST_COUNT - 1}
                                variant="hot"
                              />
                            ))}
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.pageDots}>
                  {MAIN_SECTIONS.map((section, index) => (
                    <View
                      key={`dot-${section.key}`}
                      style={[styles.pageDot, index === activeHotIndex && styles.pageDotActive]}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.latestSection}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>종합게시판</Text>
                </View>

                <View style={styles.latestPostGroup}>
                  {recentPosts.map((post, index) => (
                    <MainPostRow
                      key={post.id}
                      post={post}
                      isLast={index === RECENT_POST_COUNT - 1}
                      showCategory
                      onPress={() => router.push(`/post/${post.id}` as Href)}
                    />
                  ))}

                  {Array.from({ length: Math.max(0, RECENT_POST_COUNT - recentPosts.length) }).map((_, index) => (
                    <EmptyPostRow
                      key={`empty-recent-${index}`}
                      isLast={recentPosts.length + index === RECENT_POST_COUNT - 1}
                    />
                  ))}
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function MainPostRow({
  post,
  isLast,
  variant = 'latest',
  showCategory = false,
  onPress,
}: {
  post: PostSummary;
  isLast: boolean;
  variant?: 'hot' | 'latest';
  showCategory?: boolean;
  onPress: () => void;
}) {
  const headline = getPostHeadline(post);
  const meta = getPostMeta(post, showCategory);
  const isHot = variant === 'hot';
  const isLatest = !isHot;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.postRow,
        isHot && styles.hotPostRow,
        isLatest && styles.latestPostRow,
        isLast && styles.lastPostRow,
        pressed && styles.pressed,
      ]}>
      {post.coverImageUrl ? (
        <Image
          source={{ uri: post.coverImageUrl }}
          style={[styles.postImage, isHot ? styles.hotPostImage : styles.latestPostImage]}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.imagePlaceholder, isHot ? styles.hotPostImage : styles.latestPostImage]}>
          <Text style={styles.imagePlaceholderText}>사진</Text>
        </View>
      )}

      <View style={styles.postBody}>
        <Text style={[styles.postTitle, isHot ? styles.hotPostTitle : styles.latestPostTitle]} numberOfLines={1}>
          {post.title}
        </Text>
        <Text style={[styles.postMeta, isLatest && styles.latestPostMeta]} numberOfLines={1}>
          {meta}
        </Text>
        <View style={styles.postBottomRow}>
          <Text style={[styles.postHeadline, isLatest && styles.latestPostHeadline]} numberOfLines={1}>
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

function EmptyPostRow({ isLast, variant = 'latest' }: { isLast: boolean; variant?: 'hot' | 'latest' }) {
  const isHot = variant === 'hot';
  const isLatest = !isHot;

  return (
    <View style={[styles.postRow, isHot && styles.hotPostRow, isLatest && styles.latestPostRow, isLast && styles.lastPostRow]}>
      <View style={[styles.imagePlaceholder, isHot ? styles.hotPostImage : styles.latestPostImage]}>
        <Text style={styles.imagePlaceholderText}>사진</Text>
      </View>
      <View style={styles.postBody}>
        <Text style={styles.emptyTitle}>게시글이 없습니다</Text>
      </View>
    </View>
  );
}

function getPopularPosts(posts: PostSummary[]) {
  return [...posts]
    .sort((a, b) => {
      const reactionGap = getReactionScore(b) - getReactionScore(a);

      if (reactionGap !== 0) {
        return reactionGap;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, HOT_POST_COUNT);
}

function getReactionScore(post: PostSummary) {
  return post.likeCount + post.commentCount;
}

function getPostMeta(post: PostSummary, showCategory: boolean) {
  const category = showCategory ? getCategoryLabel(post.category) : null;

  return [category, post.location || post.subcategory, formatRelativeTime(post.createdAt)].filter(Boolean).join(' · ');
}

function getCategoryLabel(category: PostCategory) {
  if (category === 'market') {
    return '중고';
  }

  if (category === 'recruit') {
    return '구인';
  }

  if (category === 'promo') {
    return '홍보';
  }

  return '커뮤니티';
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
    paddingBottom: spacing.md,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotSection: {
    flexShrink: 0,
    marginBottom: spacing.sm,
  },
  latestSection: {
    flex: 1,
    minHeight: 0,
  },
  sectionTitleRow: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitlePressable: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    flexShrink: 1,
    color: palette.ink,
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 24,
  },
  sectionArrow: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '600',
    marginLeft: spacing.xs,
    lineHeight: 24,
  },
  carouselWrap: {
    overflow: 'hidden',
  },
  carouselPage: {
    paddingRight: 0,
  },
  hotPostGroup: {
    height: 174,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    backgroundColor: palette.cream,
  },
  latestPostGroup: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    backgroundColor: palette.cream,
  },
  pageDots: {
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  pageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: palette.muted,
  },
  pageDotActive: {
    backgroundColor: palette.ink,
    borderColor: palette.ink,
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
  hotPostRow: {
    paddingVertical: spacing.xs,
  },
  latestPostRow: {
    paddingVertical: 5,
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
  hotPostImage: {
    width: 70,
    height: 70,
  },
  latestPostImage: {
    width: 54,
    height: 54,
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
    gap: 2,
  },
  postTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  hotPostTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  latestPostTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 17,
  },
  postMeta: {
    color: palette.muted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 17,
  },
  latestPostMeta: {
    fontSize: 12,
    lineHeight: 14,
  },
  postBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  postHeadline: {
    flex: 1,
    color: palette.ink,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  latestPostHeadline: {
    fontSize: 14,
    lineHeight: 17,
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

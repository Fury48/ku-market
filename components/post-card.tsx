import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatRelativeTime } from '@/lib/format';
import { palette, spacing } from '@/lib/theme';
import { PostSummary } from '@/types/models';

type PostCardProps = {
  post: PostSummary;
  onPress: () => void;
};

export function PostCard({ post, onPress }: PostCardProps) {
  const headline = getPostHeadline(post);
  const meta = [post.location || post.subcategory, formatRelativeTime(post.createdAt)].filter(Boolean).join(' · ');

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      <Image source={{ uri: post.coverImageUrl }} style={styles.image} contentFit="cover" />

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {post.title}
          </Text>
          <Pressable hitSlop={10} style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={21} color={palette.muted} />
          </Pressable>
        </View>

        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>

        <Text style={styles.headline} numberOfLines={1}>
          {headline}
        </Text>

        <View style={styles.spacer} />

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
    </Pressable>
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

    return '모집중';
  }

  if (post.category === 'promo') {
    return post.status || '홍보중';
  }

  return post.subcategory || '커뮤니티';
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    minHeight: 148,
    paddingVertical: 14,
    backgroundColor: palette.cream,
    borderBottomWidth: 1,
    borderColor: palette.border,
  },
  pressed: {
    opacity: 0.72,
  },
  image: {
    width: 116,
    height: 116,
    borderRadius: 8,
    backgroundColor: palette.creamStrong,
  },
  body: {
    flex: 1,
    minHeight: 116,
    marginLeft: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    color: palette.ink,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  moreButton: {
    width: 30,
    height: 28,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  meta: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  headline: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 25,
    marginTop: 7,
  },
  spacer: {
    flex: 1,
  },
  reactionRow: {
    minHeight: 22,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionText: {
    color: palette.muted,
    fontSize: 15,
    fontWeight: '700',
  },
});

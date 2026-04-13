import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryLabels } from '@/lib/constants';
import { formatHeadline, formatRelativeTime } from '@/lib/format';
import { palette, radius, spacing } from '@/lib/theme';
import { PostSummary } from '@/types/models';
import { Avatar } from '@/components/ui/avatar';
import { Pill } from '@/components/ui/pill';

type PostCardProps = {
  post: PostSummary;
  onPress: () => void;
};

export function PostCard({ post, onPress }: PostCardProps) {
  const isActive = ['판매중', '모집중', '진행중', '일반'].includes(post.status);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Image source={{ uri: post.coverImageUrl }} style={styles.image} contentFit="cover" />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Pill label={categoryLabels[post.category]} toned="soft" />
          <Pill label={post.status} active={isActive} />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        <Text style={styles.headline}>
          {formatHeadline(post.category, post.price, post.recruitmentCurrent, post.recruitmentTarget)}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {post.subcategory}
          {post.location ? ` · ${post.location}` : ''}
        </Text>
        <View style={styles.authorRow}>
          <Avatar uri={post.author.profileImageUrl} size={28} label={post.author.nickname} />
          <View style={styles.authorBlock}>
            <Text style={styles.authorText} numberOfLines={1}>
              {post.author.nickname} · {post.author.department} {post.author.studentYear}학년
            </Text>
            <Text style={styles.timeText}>{formatRelativeTime(post.createdAt)}</Text>
          </View>
          <Text style={styles.countText}>찜 {post.likeCount} · 댓글 {post.commentCount}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.md,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  image: {
    width: 104,
    height: 104,
    borderRadius: radius.md,
    backgroundColor: palette.creamStrong,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  headline: {
    color: palette.burgundy,
    fontSize: 18,
    fontWeight: '800',
  },
  meta: {
    color: palette.muted,
    fontSize: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  authorBlock: {
    flex: 1,
  },
  authorText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    color: palette.muted,
    fontSize: 11,
    marginTop: 2,
  },
  countText: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: '600',
  },
});

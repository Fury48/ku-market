import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api';
import { palette, spacing } from '@/lib/theme';
import { PostSummary } from '@/types/models';
import { PostCard } from '@/components/post-card';

export default function LikedPostsScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostSummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      apiFetch<{ posts: PostSummary[] }>('/account/liked')
        .then((response) => setPosts(response.posts))
        .catch(() => setPosts([]));
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={palette.ink} />
          </Pressable>
          <View>
            <Text style={styles.title}>찜한 게시글</Text>
            <Text style={styles.subtitle}>좋아요로 모아둔 게시글을 다시 살펴보세요.</Text>
          </View>
        </View>

        {posts.length ? (
          posts.map((post) => <PostCard key={post.id} post={post} onPress={() => router.push(`/post/${post.id}` as Href)} />)
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>찜한 글이 아직 없어요</Text>
            <Text style={styles.emptyText}>관심 있는 게시글에서 하트를 눌러보세요.</Text>
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
  title: {
    color: palette.ink,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 4,
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
  },
});

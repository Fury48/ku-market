import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api';
import { palette, spacing } from '@/lib/theme';
import { BoardType, PostDetail, PostUpsertPayload } from '@/types/models';
import { PostForm } from '@/components/post-form';
import { useKeyboardOffset } from '@/hooks/use-keyboard-offset';

function pickParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeBoard(value?: string): BoardType {
  if (value === 'market' || value === 'recruit' || value === 'promo') {
    return value;
  }

  return 'main';
}

export default function ComposePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ board?: string | string[]; id?: string | string[] }>();
  const postId = pickParam(params.id);
  const board = useMemo(() => normalizeBoard(pickParam(params.board)), [params.board]);
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(postId));
  const [submitting, setSubmitting] = useState(false);
  const keyboardOffset = useKeyboardOffset();

  useEffect(() => {
    if (!postId) {
      setPost(null);
      return;
    }

    setLoading(true);
    apiFetch<{ post: PostDetail }>(`/posts/${postId}`)
      .then((response) => {
        setPost(response.post);
      })
      .catch((error) => {
        Alert.alert('게시글을 불러오지 못했어요', error instanceof Error ? error.message : '다시 시도해 주세요.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [postId]);

  async function handleSubmit(payload: PostUpsertPayload) {
    try {
      setSubmitting(true);
      const response = postId
        ? await apiFetch<{ post: PostDetail }>(`/posts/${postId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : await apiFetch<{ post: PostDetail }>('/posts', {
            method: 'POST',
            body: JSON.stringify(payload),
          });

      Alert.alert('저장 완료', postId ? '게시글이 수정되었습니다.' : '게시글이 등록되었습니다.');
      router.replace(`/post/${response.post.id}` as Href);
    } catch (error) {
      Alert.alert('저장 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={styles.keyboardAvoider}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={palette.ink} />
        </Pressable>
        <View>
          <Text style={styles.title}>{postId ? '게시글 수정' : '새 글쓰기'}</Text>
          <Text style={styles.subtitle}>호랭마켓 피드에 바로 반영됩니다.</Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xxl + keyboardOffset }]}>
        {loading ? <Text style={styles.loadingText}>게시글 정보를 불러오는 중...</Text> : null}
        {!loading ? <PostForm board={board} initialPost={post} submitting={submitting} onSubmit={handleSubmit} /> : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  keyboardAvoider: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingText: {
    color: palette.muted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});

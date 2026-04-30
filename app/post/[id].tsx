import { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api';
import { categoryLabels } from '@/lib/constants';
import { formatHeadline, formatRelativeTime, formatTradeType } from '@/lib/format';
import { palette, radius, spacing } from '@/lib/theme';
import { PostDetail } from '@/types/models';
import { Avatar } from '@/components/ui/avatar';
import { Pill } from '@/components/ui/pill';

function pickParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function PostDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const postId = pickParam(params.id);
  const { width, height } = useWindowDimensions();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const loadPost = useCallback(async () => {
    if (!postId) {
      return;
    }

    const response = await apiFetch<{ post: PostDetail }>(`/posts/${postId}`);
    setPost(response.post);
  }, [postId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadPost()
        .catch(() => {
          setPost(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }, [loadPost])
  );

  async function handleLike() {
    if (!postId) {
      return;
    }

    try {
      const response = await apiFetch<{ post: PostDetail }>(`/posts/${postId}/like`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setPost(response.post);
    } catch (error) {
      Alert.alert('찜 처리 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    }
  }

  async function handleComment() {
    if (!postId || !comment.trim()) {
      return;
    }

    try {
      setCommenting(true);
      const response = await apiFetch<{ post: PostDetail }>(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: comment.trim() }),
      });
      setPost(response.post);
      setComment('');
    } catch (error) {
      Alert.alert('댓글 등록 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    } finally {
      setCommenting(false);
    }
  }

  async function handleOpenChat() {
    if (!post) {
      return;
    }

    if (post.isMine) {
      Alert.alert('내 게시글입니다', '내 게시글에는 채팅을 열 수 없어요. 더보기에서 수정이나 삭제를 진행해 주세요.');
      return;
    }

    try {
      const response = await apiFetch<{ roomId: number }>('/chats/open', {
        method: 'POST',
        body: JSON.stringify({ postId: post.id }),
      });
      router.push(`/chat/${response.roomId}` as Href);
    } catch (error) {
      Alert.alert('채팅 열기 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    }
  }

  function openMoreActions() {
    if (!post) {
      return;
    }

    if (post.isMine) {
      Alert.alert('게시글 관리', '원하는 작업을 선택해 주세요.', [
        {
          text: '수정',
          onPress: () => router.push(`/post/compose?id=${post.id}` as Href),
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: handleDelete,
        },
        { text: '취소', style: 'cancel' },
      ]);
      return;
    }

    Alert.alert('신고하기', '이 게시글을 신고할까요?', [
      {
        text: '신고',
        style: 'destructive',
        onPress: () => Alert.alert('신고 접수', '운영진 검토용 더미 동작입니다.'),
      },
      { text: '취소', style: 'cancel' },
    ]);
  }

  function handleDelete() {
    if (!postId) {
      return;
    }

    Alert.alert('게시글 삭제', '정말 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/posts/${postId}`, {
              method: 'DELETE',
              body: JSON.stringify({}),
            });
            Alert.alert('삭제 완료', '게시글이 삭제되었습니다.');
            router.replace('/(tabs)' as Href);
          } catch (error) {
            Alert.alert('삭제 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>게시글을 불러오는 중...</Text>
        </View>
      ) : !post ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>게시글을 찾을 수 없습니다.</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.hero}>
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                {post.images.map((uri, index) => (
                  <Pressable
                    key={`${uri}-${index}`}
                    onPress={() => setSelectedImageIndex(index)}
                    style={[styles.heroImageButton, { width }]}>
                    <Image source={{ uri }} style={styles.heroImage} contentFit="contain" />
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.heroActions}>
                <Pressable onPress={() => router.back()} style={styles.heroButton}>
                  <Ionicons name="chevron-back" size={22} color={palette.ink} />
                </Pressable>
                <Pressable onPress={openMoreActions} style={styles.heroButton}>
                  <Ionicons name="ellipsis-vertical" size={18} color={palette.ink} />
                </Pressable>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.infoHeader}>
                <Pill label={categoryLabels[post.category]} toned="soft" />
                <Pill label={post.status} active />
              </View>
              <Text style={styles.title}>{post.title}</Text>
              <Text style={styles.headline}>
                {formatHeadline(post.category, post.price, post.recruitmentCurrent, post.recruitmentTarget)}
              </Text>
              <Text style={styles.metaText}>
                {post.subcategory} · {formatRelativeTime(post.createdAt)}
              </Text>
            </View>

            <View style={[styles.section, styles.authorCard]}>
              <Avatar uri={post.author.profileImageUrl} size={52} label={post.author.nickname} />
              <View style={{ flex: 1 }}>
                <Text style={styles.authorName}>{post.author.nickname}</Text>
                <Text style={styles.authorMeta}>
                  {post.author.department} {post.author.studentYear}학년
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>상세 설명</Text>
              <Text style={styles.content}>{post.content}</Text>

              <View style={styles.metaList}>
                {post.tradeType ? (
                  <Text style={styles.metaLine}>거래 방식: {formatTradeType(post.tradeType)}</Text>
                ) : null}
                {post.location ? <Text style={styles.metaLine}>장소: {post.location}</Text> : null}
                {post.tags.length ? <Text style={styles.metaLine}>태그: {post.tags.map((tag) => `#${tag}`).join(' ')}</Text> : null}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>댓글 {post.comments.length}</Text>
              <View style={styles.commentComposer}>
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder="댓글을 입력하세요"
                  placeholderTextColor={palette.muted}
                  style={styles.commentInput}
                  multiline
                />
                <Pressable onPress={commenting ? undefined : handleComment} style={styles.commentButton}>
                  <Text style={styles.commentButtonText}>{commenting ? '등록중' : '등록'}</Text>
                </Pressable>
              </View>

              {post.comments.map((item) => (
                <View key={item.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{item.author.nickname}</Text>
                    <Text style={styles.commentTime}>{formatRelativeTime(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.commentText}>{item.content}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.actionBar}>
            <View style={styles.actionLeft}>
              <Pressable onPress={handleLike} style={styles.likeButton}>
                <Ionicons name={post.isLiked ? 'heart' : 'heart-outline'} size={18} color={post.isLiked ? palette.burgundy : palette.ink} />
              </Pressable>
              <Text style={styles.actionMeta}>찜 {post.likeCount}</Text>
              <Text style={styles.actionMeta}>댓글 {post.comments.length}</Text>
            </View>
            <Pressable onPress={handleOpenChat} style={styles.chatButton}>
              <Text style={styles.chatButtonText}>채팅하기</Text>
            </Pressable>
          </View>

          <Modal
            visible={selectedImageIndex !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setSelectedImageIndex(null)}>
            <View style={styles.imageModal}>
              <View style={styles.imageModalHeader}>
                <Text style={styles.imageModalCounter}>
                  {(selectedImageIndex ?? 0) + 1} / {post.images.length}
                </Text>
                <Pressable onPress={() => setSelectedImageIndex(null)} style={styles.imageModalCloseButton}>
                  <Ionicons name="close" size={24} color={palette.white} />
                </Pressable>
              </View>

              <ScrollView
                key={selectedImageIndex ?? 0}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentOffset={{ x: (selectedImageIndex ?? 0) * width, y: 0 }}>
                {post.images.map((uri, index) => (
                  <View key={`modal-${uri}-${index}`} style={[styles.imageModalPage, { width }]}>
                    <Image
                      source={{ uri }}
                      style={[styles.imageModalImage, { width, height: Math.max(1, height - 96) }]}
                      contentFit="contain"
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: palette.muted,
    fontSize: 13,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  hero: {
    position: 'relative',
    backgroundColor: palette.creamStrong,
  },
  heroImageButton: {
    height: 300,
    backgroundColor: palette.creamStrong,
  },
  heroImage: {
    width: '100%',
    height: 300,
    backgroundColor: palette.creamStrong,
  },
  heroActions: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    backgroundColor: palette.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  infoHeader: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: palette.ink,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
  },
  headline: {
    color: palette.burgundy,
    fontSize: 22,
    fontWeight: '900',
  },
  metaText: {
    color: palette.muted,
    fontSize: 13,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  authorMeta: {
    color: palette.muted,
    fontSize: 13,
    marginTop: 4,
  },
  mannerBox: {
    alignItems: 'flex-end',
    gap: 2,
  },
  mannerValue: {
    color: palette.burgundy,
    fontSize: 16,
    fontWeight: '800',
  },
  mannerLabel: {
    color: palette.muted,
    fontSize: 11,
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  content: {
    color: palette.ink,
    fontSize: 14,
    lineHeight: 22,
  },
  metaList: {
    gap: 6,
    marginTop: 6,
  },
  metaLine: {
    color: palette.muted,
    fontSize: 13,
  },
  commentComposer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  commentInput: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    backgroundColor: palette.cream,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.ink,
  },
  commentButton: {
    borderRadius: radius.lg,
    backgroundColor: palette.burgundy,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  commentButtonText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '800',
  },
  commentCard: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: spacing.md,
    gap: 6,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentAuthor: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  commentTime: {
    color: palette.muted,
    fontSize: 11,
  },
  commentText: {
    color: palette.ink,
    fontSize: 13,
    lineHeight: 20,
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  likeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  actionMeta: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  chatButton: {
    backgroundColor: palette.burgundy,
    borderRadius: radius.lg,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  chatButtonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '800',
  },
  imageModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
  },
  imageModalHeader: {
    height: 96,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageModalCounter: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '700',
  },
  imageModalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  imageModalPage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageModalImage: {
    backgroundColor: 'transparent',
  },
});

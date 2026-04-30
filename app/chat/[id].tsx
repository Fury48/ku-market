import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api';
import { pickImages } from '@/lib/image-picker';
import { palette, radius, spacing } from '@/lib/theme';
import { ChatRoomDetail } from '@/types/models';
import { MessageBubble } from '@/components/message-bubble';

function pickParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ChatDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const roomId = pickParam(params.id);
  const [room, setRoom] = useState<ChatRoomDetail | null>(null);
  const [showAlert, setShowAlert] = useState(true);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadRoom = useCallback(async () => {
    if (!roomId) {
      return;
    }

    const response = await apiFetch<{ room: ChatRoomDetail }>(`/chats/${roomId}`);
    setRoom(response.room);
  }, [roomId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadRoom()
        .catch(() => {
          setRoom(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }, [loadRoom])
  );

  async function handleSend(imageUrl?: string) {
    if (!roomId) {
      return;
    }

    if (!message.trim() && !imageUrl) {
      return;
    }

    try {
      setSending(true);
      await apiFetch(`/chats/${roomId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: message.trim(), imageUrl: imageUrl ?? null }),
      });
      setMessage('');
      await loadRoom();
    } catch (error) {
      Alert.alert('메시지 전송 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    } finally {
      setSending(false);
    }
  }

  async function handleSendImage() {
    try {
      const [imageUrl] = await pickImages(1);
      if (imageUrl) {
        await handleSend(imageUrl);
      }
    } catch (error) {
      Alert.alert('이미지 전송 실패', error instanceof Error ? error.message : '이미지를 보낼 수 없습니다.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={styles.keyboardAvoider}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={22} color={palette.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{room?.otherUser.nickname ?? '채팅'}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {room?.postTitle ?? '게시글 기반 채팅'}
          </Text>
        </View>
        {room ? (
          <Pressable onPress={() => router.push(`/post/${room.postId}` as Href)} style={styles.iconButton}>
            <Ionicons name="document-text-outline" size={20} color={palette.ink} />
          </Pressable>
        ) : null}
      </View>

      {showAlert ? (
        <View style={styles.banner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>사기 주의</Text>
            <Text style={styles.bannerText}>외부 링크 유도, 선입금 요구, 학생증 사칭을 주의하세요.</Text>
          </View>
          <Pressable onPress={() => setShowAlert(false)}>
            <Text style={styles.bannerDismiss}>닫기</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        style={styles.messagesList}
        contentContainerStyle={styles.messagesWrap}>
        {loading ? <Text style={styles.helperText}>채팅을 불러오는 중...</Text> : null}
        {!loading && !room ? <Text style={styles.helperText}>채팅방을 찾을 수 없습니다.</Text> : null}
        {room?.messages.map((item) => <MessageBubble key={item.id} message={item} />)}
      </ScrollView>

      <View style={styles.inputBar}>
        <Pressable onPress={handleSendImage} style={styles.imageButton}>
          <Ionicons name="image-outline" size={20} color={palette.burgundy} />
        </Pressable>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="메시지를 입력하세요"
          placeholderTextColor={palette.muted}
          style={styles.input}
          multiline
        />
        <Pressable onPress={() => handleSend()} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>{sending ? '전송중' : '보내기'}</Text>
        </Pressable>
      </View>
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
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
  },
  headerTitle: {
    color: palette.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 3,
  },
  banner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F2D6A4',
    backgroundColor: '#FFF6EA',
    flexDirection: 'row',
    gap: spacing.md,
  },
  bannerTitle: {
    color: palette.warning,
    fontSize: 13,
    fontWeight: '800',
  },
  bannerText: {
    color: palette.ink,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  bannerDismiss: {
    color: palette.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  messagesWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  messagesList: {
    flex: 1,
  },
  helperText: {
    color: palette.muted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.white,
  },
  imageButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.blush,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 96,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    backgroundColor: palette.cream,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.ink,
  },
  sendButton: {
    borderRadius: radius.lg,
    backgroundColor: palette.burgundy,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sendButtonText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '800',
  },
});

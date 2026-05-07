import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api';
import { pickImages } from '@/lib/image-picker';
import { palette, radius, spacing } from '@/lib/theme';
import { ChatMessage, ChatRoomDetail } from '@/types/models';
import { MessageBubble } from '@/components/message-bubble';
import { useChatRooms } from '@/providers/chat-rooms-provider';
import { useAuth } from '@/providers/auth-provider';

function pickParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function isSameRoom(previous: ChatRoomDetail | null, next: ChatRoomDetail) {
  if (!previous || previous.id !== next.id || previous.postTitle !== next.postTitle) {
    return false;
  }

  if (previous.messages.length !== next.messages.length) {
    return false;
  }

  return previous.messages.every((message, index) => {
    const nextMessage = next.messages[index];

    return (
      nextMessage &&
      message.id === nextMessage.id &&
      message.clientId === nextMessage.clientId &&
      message.content === nextMessage.content &&
      message.imageUrl === nextMessage.imageUrl &&
      message.createdAt === nextMessage.createdAt &&
      message.isMine === nextMessage.isMine
    );
  });
}

function getMessageKey(message: ChatMessage) {
  return message.clientId ?? String(message.id);
}

function mergeMessages(previousMessages: ChatMessage[], incomingMessages: ChatMessage[]) {
  const validIncomingMessages = incomingMessages.filter(Boolean);

  if (!validIncomingMessages.length) {
    return previousMessages;
  }

  const mergedMessages = [...previousMessages];

  validIncomingMessages.forEach((incomingMessage) => {
    const sameClientIndex = incomingMessage.clientId
      ? mergedMessages.findIndex((message) => message.clientId === incomingMessage.clientId)
      : -1;
    const sameIdIndex = mergedMessages.findIndex((message) => message.id === incomingMessage.id);
    const messageIndex = sameClientIndex >= 0 ? sameClientIndex : sameIdIndex;

    if (messageIndex >= 0) {
      mergedMessages[messageIndex] = incomingMessage;
      return;
    }

    mergedMessages.push(incomingMessage);
  });

  return mergedMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

type SendMessageResponse = {
  message?: ChatMessage;
  room?: ChatRoomDetail;
};

export default function ChatDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const { refreshRooms } = useChatRooms();
  const { user } = useAuth();
  const roomId = pickParam(params.id);
  const messagesListRef = useRef<FlatList<ChatMessage>>(null);
  const isLoadingRoomRef = useRef(false);
  const isSendingMessageRef = useRef(false);
  const hasRoomRef = useRef(false);
  const latestServerMessageIdRef = useRef(0);
  const didInitialScrollRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const isMessageInputFocusedRef = useRef(false);
  const [room, setRoom] = useState<ChatRoomDetail | null>(null);
  const [showAlert, setShowAlert] = useState(true);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const roomMessages = useMemo(() => room?.messages ?? [], [room?.messages]);
  const latestMessageId = useMemo(() => {
    return roomMessages.length ? getMessageKey(roomMessages[roomMessages.length - 1]) : null;
  }, [roomMessages]);
  const latestServerMessageId = useMemo(() => {
    const serverMessages = roomMessages.filter((item) => item.id > 0);
    return serverMessages.length ? serverMessages[serverMessages.length - 1].id : 0;
  }, [roomMessages]);

  useEffect(() => {
    hasRoomRef.current = Boolean(room);
    latestServerMessageIdRef.current = latestServerMessageId;
  }, [latestServerMessageId, room]);

  const scrollToLatestMessage = useCallback((animated = true, force = false) => {
    if (!force && !isNearBottomRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      messagesListRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const scrollToLatestMessageAfterLayout = useCallback((force = false) => {
    scrollToLatestMessage(true, force);
    setTimeout(() => scrollToLatestMessage(true, force), 120);
    setTimeout(() => scrollToLatestMessage(true, force), 280);
  }, [scrollToLatestMessage]);

  const handleMessagesScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    isNearBottomRef.current = distanceFromBottom < 96;
  }, []);

  const addOptimisticMessage = useCallback(
    (content: string, imageUrl?: string) => {
      if (!user) {
        return null;
      }

      const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimisticMessage: ChatMessage = {
        id: -Date.now(),
        clientId,
        content,
        imageUrl: imageUrl ?? null,
        createdAt: new Date().toISOString(),
        isMine: true,
        sender: {
          id: user.id,
          nickname: user.nickname,
          profileImageUrl: user.profileImageUrl,
        },
      };

      setRoom((previousRoom) => {
        if (!previousRoom) {
          return previousRoom;
        }

        return {
          ...previousRoom,
          messages: [...previousRoom.messages, optimisticMessage],
        };
      });

      return clientId;
    },
    [user]
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function refreshRoom(showLoading = false) {
        if (!roomId || isLoadingRoomRef.current || isSendingMessageRef.current) {
          return;
        }

        try {
          isLoadingRoomRef.current = true;
          if (showLoading) {
            setLoading(true);
          }

          if (!hasRoomRef.current && showLoading) {
            const response = await apiFetch<{ room: ChatRoomDetail }>(`/chats/${roomId}`);

            if (isActive) {
              setRoom((previousRoom) => (isSameRoom(previousRoom, response.room) ? previousRoom : response.room));
            }
            return;
          }

          const response = await apiFetch<{ messages?: ChatMessage[] }>(`/chats/${roomId}/messages?afterId=${latestServerMessageIdRef.current}`);
          const incomingMessages = response.messages ?? [];

          if (isActive && incomingMessages.length) {
            setRoom((previousRoom) => {
              if (!previousRoom) {
                return previousRoom;
              }

              return {
                ...previousRoom,
                messages: mergeMessages(previousRoom.messages, incomingMessages),
              };
            });
          }
        } catch {
          if (isActive && showLoading) {
            setRoom(null);
          }
        } finally {
          isLoadingRoomRef.current = false;
          if (isActive && showLoading) {
            setLoading(false);
          }
        }
      }

      setLoading(true);
      refreshRoom(true).finally(() => {
        refreshRooms().catch(() => undefined);
      });

      const refreshInterval = setInterval(() => {
        refreshRoom();
      }, 3000);

      return () => {
        isActive = false;
        clearInterval(refreshInterval);
      };
    }, [refreshRooms, roomId])
  );

  useEffect(() => {
    didInitialScrollRef.current = false;
    isNearBottomRef.current = true;
  }, [roomId]);

  useEffect(() => {
    if (room?.id) {
      const shouldForceInitialScroll = !didInitialScrollRef.current;
      scrollToLatestMessage(true, shouldForceInitialScroll);
      didInitialScrollRef.current = true;
    }
  }, [latestMessageId, room?.id, scrollToLatestMessage]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardSubscription = Keyboard.addListener(showEvent, () => {
      scrollToLatestMessageAfterLayout(isMessageInputFocusedRef.current || !didInitialScrollRef.current);
    });

    return () => {
      keyboardSubscription.remove();
    };
  }, [scrollToLatestMessageAfterLayout]);

  async function handleSend(imageUrl?: string) {
    if (!roomId) {
      return;
    }

    const content = message.trim();

    if ((!content && !imageUrl) || isSendingMessageRef.current) {
      return;
    }

    const optimisticClientId = addOptimisticMessage(content, imageUrl);
    isSendingMessageRef.current = true;
    setSending(true);
    setMessage('');
    isNearBottomRef.current = true;
    scrollToLatestMessageAfterLayout(true);

    try {
      const response = await apiFetch<SendMessageResponse>(`/chats/${roomId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, imageUrl: imageUrl ?? null, clientId: optimisticClientId }),
      });
      setRoom((previousRoom) => {
        if (!previousRoom) {
          return previousRoom;
        }

        if (response.room) {
          return response.room;
        }

        if (!response.message) {
          return previousRoom;
        }

        return {
          ...previousRoom,
          messages: mergeMessages(previousRoom.messages, [response.message]),
        };
      });
      refreshRooms().catch(() => undefined);
      scrollToLatestMessageAfterLayout(true);
    } catch (error) {
      if (optimisticClientId !== null) {
        setRoom((previousRoom) => {
          if (!previousRoom) {
            return previousRoom;
          }

          return {
            ...previousRoom,
            messages: previousRoom.messages.filter((item) => item.clientId !== optimisticClientId),
          };
        });
      }
      setMessage(content);
      Alert.alert('메시지 전송 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    } finally {
      isSendingMessageRef.current = false;
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

      <FlatList
        ref={messagesListRef}
        data={roomMessages}
        keyExtractor={getMessageKey}
        renderItem={({ item }) => <MessageBubble message={item} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        style={styles.messagesList}
        contentContainerStyle={styles.messagesWrap}
        onScroll={handleMessagesScroll}
        scrollEventThrottle={80}
        initialNumToRender={18}
        maxToRenderPerBatch={12}
        windowSize={9}
        removeClippedSubviews={Platform.OS !== 'web'}
        ListHeaderComponent={
          <>
            {loading ? <Text style={styles.helperText}>채팅을 불러오는 중...</Text> : null}
            {!loading && !room ? <Text style={styles.helperText}>채팅방을 찾을 수 없습니다.</Text> : null}
          </>
        }
        onContentSizeChange={() => scrollToLatestMessage(false)}>
      </FlatList>

      <View style={styles.inputBar}>
        <Pressable disabled={sending} onPress={handleSendImage} style={[styles.imageButton, sending && styles.disabledButton]}>
          <Ionicons name="image-outline" size={20} color={palette.burgundy} />
        </Pressable>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="메시지를 입력하세요"
          placeholderTextColor={palette.muted}
          style={styles.input}
          onFocus={() => {
            isMessageInputFocusedRef.current = true;
            scrollToLatestMessageAfterLayout(true);
          }}
          onBlur={() => {
            isMessageInputFocusedRef.current = false;
          }}
          onPressIn={() => scrollToLatestMessageAfterLayout(true)}
          multiline
        />
        <Pressable
          disabled={sending || !message.trim()}
          onPress={() => handleSend()}
          style={[styles.sendButton, (sending || !message.trim()) && styles.disabledSendButton]}>
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
    borderColor: '#5A4B2E',
    backgroundColor: '#2F2A20',
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
  disabledButton: {
    opacity: 0.55,
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
  disabledSendButton: {
    opacity: 0.55,
  },
  sendButtonText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '800',
  },
});

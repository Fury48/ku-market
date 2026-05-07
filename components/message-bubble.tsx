import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useState } from 'react';
import { formatRelativeTime } from '@/lib/format';
import { palette, radius, spacing } from '@/lib/theme';
import { ChatMessage } from '@/types/models';

type MessageBubbleProps = {
  message: ChatMessage;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const { width, height } = useWindowDimensions();
  const [isImageOpen, setIsImageOpen] = useState(false);

  return (
    <View style={[styles.wrap, message.isMine && styles.wrapMine]}>
      <View style={[styles.bubble, message.isMine ? styles.bubbleMine : styles.bubbleOther]}>
        {message.content ? <Text style={[styles.text, message.isMine && styles.textMine]}>{message.content}</Text> : null}
        {message.imageUrl ? (
          <>
            <Pressable onPress={() => setIsImageOpen(true)} accessibilityRole="imagebutton">
              <Image source={{ uri: message.imageUrl }} style={styles.image} contentFit="cover" />
            </Pressable>
            <Modal visible={isImageOpen} transparent animationType="fade" onRequestClose={() => setIsImageOpen(false)}>
              <View style={styles.imageModal}>
                <View style={styles.imageModalHeader}>
                  <Pressable onPress={() => setIsImageOpen(false)} style={styles.imageModalCloseButton}>
                    <Ionicons name="close" size={24} color={palette.white} />
                  </Pressable>
                </View>
                <Pressable onPress={() => setIsImageOpen(false)} style={styles.imageModalBody}>
                  <Image
                    source={{ uri: message.imageUrl }}
                    style={[styles.imageModalImage, { width, height: Math.max(1, height - 96) }]}
                    contentFit="contain"
                  />
                </Pressable>
              </View>
            </Modal>
          </>
        ) : null}
      </View>
      <Text style={styles.time}>{formatRelativeTime(message.createdAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  wrapMine: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  bubbleMine: {
    backgroundColor: palette.burgundy,
  },
  bubbleOther: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
  },
  text: {
    color: palette.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  textMine: {
    color: palette.white,
  },
  image: {
    width: 220,
    height: 180,
    borderRadius: radius.md,
    backgroundColor: palette.creamStrong,
  },
  imageModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
  },
  imageModalHeader: {
    height: 96,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  imageModalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  imageModalBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageModalImage: {
    backgroundColor: 'transparent',
  },
  time: {
    color: palette.muted,
    fontSize: 11,
    marginTop: 4,
  },
});

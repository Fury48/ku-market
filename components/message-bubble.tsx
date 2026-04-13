import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { formatRelativeTime } from '@/lib/format';
import { palette, radius, spacing } from '@/lib/theme';
import { ChatMessage } from '@/types/models';

type MessageBubbleProps = {
  message: ChatMessage;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <View style={[styles.wrap, message.isMine && styles.wrapMine]}>
      <View style={[styles.bubble, message.isMine ? styles.bubbleMine : styles.bubbleOther]}>
        {message.content ? <Text style={[styles.text, message.isMine && styles.textMine]}>{message.content}</Text> : null}
        {message.imageUrl ? <Image source={{ uri: message.imageUrl }} style={styles.image} contentFit="cover" /> : null}
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
  time: {
    color: palette.muted,
    fontSize: 11,
    marginTop: 4,
  },
});

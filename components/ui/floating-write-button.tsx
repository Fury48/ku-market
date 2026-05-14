import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { palette, radius, spacing } from '@/lib/theme';

type FloatingWriteButtonProps = {
  onPress: () => void;
  hidden?: boolean;
};

export function FloatingWriteButton({ onPress, hidden = false }: FloatingWriteButtonProps) {
  if (hidden) {
    return null;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Ionicons name="add" size={24} color={palette.white} />
      <Text style={styles.label}>글쓰기</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: palette.burgundy,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 5,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '800',
  },
});

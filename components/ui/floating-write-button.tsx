import { Pressable, StyleSheet, Text } from 'react-native';
import { palette, radius, spacing } from '@/lib/theme';

type FloatingWriteButtonProps = {
  onPress: () => void;
};

export function FloatingWriteButton({ onPress }: FloatingWriteButtonProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Text style={styles.plus}>+</Text>
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
    gap: 8,
    backgroundColor: palette.burgundy,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 14,
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
  plus: {
    color: palette.white,
    fontSize: 18,
    fontWeight: '800',
  },
  label: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '800',
  },
});

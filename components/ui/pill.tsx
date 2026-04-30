import { Pressable, StyleSheet, Text } from 'react-native';
import { palette, radius } from '@/lib/theme';

type PillProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  toned?: 'default' | 'soft' | 'danger';
};

export function Pill({ label, active, onPress, toned = 'default' }: PillProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        toned === 'soft' && styles.soft,
        toned === 'danger' && styles.danger,
        active && styles.active,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.label, toned === 'danger' && styles.dangerLabel, active && styles.activeLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.white,
  },
  soft: {
    backgroundColor: palette.creamStrong,
  },
  danger: {
    backgroundColor: '#3A242B',
    borderColor: '#70424D',
  },
  active: {
    backgroundColor: palette.burgundy,
    borderColor: palette.burgundy,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  activeLabel: {
    color: palette.white,
  },
  dangerLabel: {
    color: palette.danger,
  },
});

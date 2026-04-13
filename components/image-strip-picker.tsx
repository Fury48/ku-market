import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing } from '@/lib/theme';

type ImageStripPickerProps = {
  images: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onPromote: (index: number) => void;
};

export function ImageStripPicker({ images, onAdd, onRemove, onPromote }: ImageStripPickerProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>사진</Text>
        <Text style={styles.helper}>최대 10장, 첫 번째 사진이 대표 이미지</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Pressable onPress={onAdd} style={styles.addCard}>
          <Ionicons name="camera-outline" size={24} color={palette.burgundy} />
          <Text style={styles.addText}>사진 추가</Text>
        </Pressable>

        {images.map((uri, index) => (
          <View key={`${uri}-${index}`} style={styles.imageWrap}>
            <Pressable onPress={() => onPromote(index)} style={styles.imageButton}>
              <Image source={{ uri }} style={styles.image} contentFit="cover" />
              {index === 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>대표</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable onPress={() => onRemove(index)} style={styles.removeButton}>
              <Ionicons name="close" size={14} color={palette.white} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  headerRow: {
    gap: 4,
  },
  label: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  helper: {
    color: palette.muted,
    fontSize: 12,
  },
  scrollContent: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  addCard: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.burgundy,
    backgroundColor: palette.blush,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addText: {
    color: palette.burgundyDark,
    fontSize: 12,
    fontWeight: '700',
  },
  imageWrap: {
    position: 'relative',
  },
  imageButton: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.creamStrong,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.burgundy,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: palette.white,
    fontSize: 11,
    fontWeight: '700',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

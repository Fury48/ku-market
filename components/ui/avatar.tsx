import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '@/lib/theme';

type AvatarProps = {
  uri?: string;
  size?: number;
  label?: string;
};

export function Avatar({ uri, size = 44, label }: AvatarProps) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.creamStrong,
        }}
        contentFit="cover"
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.fallbackText}>{label?.slice(0, 1) || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.blush,
  },
  fallbackText: {
    color: palette.burgundyDark,
    fontSize: 16,
    fontWeight: '700',
  },
});

import * as ImagePicker from 'expo-image-picker';

export async function pickImages(limit: number) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (permission.status !== 'granted') {
    throw new Error('갤러리 권한이 필요합니다.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 0.75,
    base64: true,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets
    .map((asset) => {
      if (!asset.base64) {
        return '';
      }

      return `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
    })
    .filter(Boolean);
}

import { ActivityIndicator, View } from 'react-native';
import { Redirect, type Href } from 'expo-router';
import { palette } from '@/lib/theme';
import { useAuth } from '@/providers/auth-provider';

export default function IndexScreen() {
  const { ready, user } = useAuth();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.cream }}>
        <ActivityIndicator color={palette.burgundy} />
      </View>
    );
  }

  return <Redirect href={(user ? '/(tabs)' : '/login') as Href} />;
}

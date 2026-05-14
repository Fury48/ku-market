import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Link, type Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, radius, spacing } from '@/lib/theme';
import { useAuth } from '@/providers/auth-provider';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      Alert.alert('입력 확인', '아이디와 비밀번호를 입력해 주세요.');
      return;
    }

    try {
      setSubmitting(true);
      await login({ username, password, keepLoggedIn });
      router.replace('/(tabs)' as Href);
    } catch (error) {
      Alert.alert('로그인 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.hero}>
        <Image source={require('../assets/images/tenrang1.png')} style={styles.logo} />
        <Text style={styles.brand}>KU-L거래</Text>
        <Text style={styles.subtitle}>고려대학교 학생들을 위한 생활형 로컬 커뮤니티</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>로그인</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="아이디"
          autoCapitalize="none"
          style={styles.input}
          placeholderTextColor={palette.muted}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="비밀번호"
          secureTextEntry
          style={styles.input}
          placeholderTextColor={palette.muted}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>로그인 상태 유지</Text>
          <Switch value={keepLoggedIn} onValueChange={setKeepLoggedIn} trackColor={{ true: palette.burgundy }} />
        </View>

        <Pressable onPress={submitting ? undefined : handleLogin} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{submitting ? '로그인 중...' : '로그인'}</Text>
        </Pressable>

        <Link href={'/register' as Href} style={styles.link}>
          고려대 이메일로 새 계정 만들기
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 0,
  },
  hero: {
    alignItems: 'center',
    gap: 10,
  },
  brand: {
    color: palette.burgundyDark,
    fontSize: 38,
    fontWeight: '900',
  },
  subtitle: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: palette.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  cardTitle: {
    color: palette.ink,
    fontSize: 26,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    backgroundColor: palette.cream,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: palette.ink,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: palette.burgundy,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '800',
  },
  link: {
    color: palette.burgundy,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
});

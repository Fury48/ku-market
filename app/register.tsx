import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api';
import { pickImages } from '@/lib/image-picker';
import { palette, radius, spacing } from '@/lib/theme';
import { useAuth } from '@/providers/auth-provider';
import { useKeyboardOffset } from '@/hooks/use-keyboard-offset';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [department, setDepartment] = useState('정보보호대학');
  const [studentYear, setStudentYear] = useState('2');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const keyboardOffset = useKeyboardOffset();

  const emailValid = useMemo(() => /@korea\.ac\.kr$/i.test(email.trim()), [email]);

  async function handleSendCode() {
    if (!emailValid) {
      Alert.alert('이메일 형식 확인', '@korea.ac.kr 이메일만 사용할 수 있어요.');
      return;
    }

    try {
      const emailCheck = await apiFetch<{ taken: boolean }>(`/auth/check/email?email=${encodeURIComponent(email)}`);
      if (emailCheck.taken) {
        Alert.alert('중복 이메일', '이미 가입된 학교 이메일입니다.');
        return;
      }

      const response = await apiFetch<{ devCode?: string }>('/auth/send-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setDevCode(response.devCode || '');
      Alert.alert('인증번호 발송', response.devCode ? `개발용 인증번호: ${response.devCode}` : '메일함을 확인해 주세요.');
    } catch (error) {
      Alert.alert('인증번호 발송 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    }
  }

  async function handleVerifyCode() {
    try {
      await apiFetch('/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });
      setVerified(true);
      Alert.alert('인증 완료', '이메일 인증이 완료되었습니다.');
    } catch (error) {
      Alert.alert('인증 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    }
  }

  async function handlePickImage() {
    try {
      const [imageUrl] = await pickImages(1);
      if (imageUrl) {
        setProfileImageUrl(imageUrl);
      }
    } catch (error) {
      Alert.alert('이미지 선택 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    }
  }

  async function handleRegister() {
    if (!verified) {
      Alert.alert('이메일 인증 필요', '먼저 고려대 이메일 인증을 완료해 주세요.');
      return;
    }

    if (!username.trim() || !password.trim() || !nickname.trim()) {
      Alert.alert('입력 확인', '아이디, 비밀번호, 닉네임을 모두 입력해 주세요.');
      return;
    }

    if (password !== passwordConfirm) {
      Alert.alert('비밀번호 불일치', '비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    try {
      setSubmitting(true);

      const [usernameCheck, nicknameCheck] = await Promise.all([
        apiFetch<{ taken: boolean }>(`/auth/check/username?username=${encodeURIComponent(username)}`),
        apiFetch<{ taken: boolean }>(`/auth/check/nickname?nickname=${encodeURIComponent(nickname)}`),
      ]);

      if (usernameCheck.taken) {
        Alert.alert('중복 아이디', '이미 사용 중인 아이디입니다.');
        return;
      }

      if (nicknameCheck.taken) {
        Alert.alert('중복 닉네임', '이미 사용 중인 닉네임입니다.');
        return;
      }

      await register({
        email,
        username,
        password,
        nickname,
        department,
        studentYear: Number(studentYear) || 1,
        profileImageUrl,
      });

      router.replace('/(tabs)' as Href);
    } catch (error) {
      Alert.alert('회원가입 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={styles.keyboardAvoider}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={[styles.container, { paddingBottom: spacing.xxl + keyboardOffset }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Ionicons name="chevron-back" size={20} color={palette.ink} />
          <Text style={styles.backText}>뒤로</Text>
        </Pressable>

        <Text style={styles.title}>고려대 이메일로 가입하기</Text>
        <Text style={styles.subtitle}>학교 인증 후 프로필을 만들고 호랭마켓을 바로 시작해보세요.</Text>

        <Field
          label="학교 이메일"
          value={email}
          onChangeText={setEmail}
          placeholder="20261234@korea.ac.kr"
          keyboardType="email-address"
        />
        <Pressable onPress={handleSendCode} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>인증번호 보내기</Text>
        </Pressable>

        <Field label="인증번호" value={code} onChangeText={setCode} placeholder="4자리 숫자" keyboardType="numeric" />
        {devCode ? <Text style={styles.devCode}>개발용 인증번호: {devCode}</Text> : null}
        <Pressable onPress={handleVerifyCode} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>인증 확인</Text>
        </Pressable>

        <Field label="아이디" value={username} onChangeText={setUsername} placeholder="아이디" editable={verified} />
        <Field
          label="비밀번호"
          value={password}
          onChangeText={setPassword}
          placeholder="비밀번호"
          secureTextEntry
          editable={verified}
        />
        <Field
          label="비밀번호 확인"
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          placeholder="비밀번호 다시 입력"
          secureTextEntry
          editable={verified}
        />
        <Field label="닉네임" value={nickname} onChangeText={setNickname} placeholder="닉네임" editable={verified} />
        <Field label="소속 학과" value={department} onChangeText={setDepartment} placeholder="소속 학과" editable={verified} />
        <Field label="학년" value={studentYear} onChangeText={setStudentYear} placeholder="학년" keyboardType="numeric" editable={verified} />

        <Pressable onPress={verified ? handlePickImage : undefined} style={styles.imagePicker}>
          <Text style={styles.imagePickerTitle}>프로필 이미지</Text>
          <Text style={styles.imagePickerText}>
            {profileImageUrl ? '이미지 선택 완료' : verified ? '선택하기' : '이메일 인증 후 선택 가능'}
          </Text>
        </Pressable>

        <Pressable onPress={submitting ? undefined : handleRegister} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{submitting ? '가입 중...' : '회원가입'}</Text>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  secureTextEntry,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  editable?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        editable={editable}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={[styles.input, !editable && styles.inputDisabled]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  keyboardAvoider: {
    flex: 1,
  },
  container: {
    padding: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    backgroundColor: palette.white,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: palette.ink,
  },
  inputDisabled: {
    backgroundColor: '#F1EBE5',
    color: palette.muted,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.white,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  devCode: {
    color: palette.burgundy,
    fontSize: 13,
    fontWeight: '700',
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    backgroundColor: palette.white,
    padding: spacing.lg,
    gap: 6,
  },
  imagePickerTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  imagePickerText: {
    color: palette.muted,
    fontSize: 13,
  },
  primaryButton: {
    marginTop: spacing.sm,
    backgroundColor: palette.burgundy,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '800',
  },
});

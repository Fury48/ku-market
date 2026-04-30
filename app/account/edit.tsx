import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '@/lib/api';
import { pickImages } from '@/lib/image-picker';
import { palette, radius, spacing } from '@/lib/theme';
import { useAuth } from '@/providers/auth-provider';
import { UserSummary } from '@/types/models';
import { Avatar } from '@/components/ui/avatar';
import { useKeyboardOffset } from '@/hooks/use-keyboard-offset';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, applyProfile, refreshSession } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [department, setDepartment] = useState(user?.department ?? '');
  const [studentYear, setStudentYear] = useState(String(user?.studentYear ?? 1));
  const [bio, setBio] = useState(user?.bio ?? '');
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl ?? '');
  const [saving, setSaving] = useState(false);
  const keyboardOffset = useKeyboardOffset();

  if (!user) {
    return null;
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

  async function handleSave() {
    try {
      setSaving(true);
      const response = await apiFetch<{ user: UserSummary }>('/account/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          nickname,
          department,
          studentYear: Number(studentYear) || 1,
          bio,
          profileImageUrl,
        }),
      });
      applyProfile(response.user);
      await refreshSession();
      Alert.alert('저장 완료', '프로필이 수정되었습니다.');
      router.back();
    } catch (error) {
      Alert.alert('저장 실패', error instanceof Error ? error.message : '다시 시도해 주세요.');
    } finally {
      setSaving(false);
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
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={palette.ink} />
          </Pressable>
          <View>
            <Text style={styles.title}>프로필 수정</Text>
            <Text style={styles.subtitle}>학교 커뮤니티에서 보이는 내 프로필을 다듬어보세요.</Text>
          </View>
        </View>

        <View style={styles.profileCard}>
          <Avatar uri={profileImageUrl} size={84} label={nickname || user.nickname} />
          <Pressable onPress={handlePickImage} style={styles.pickButton}>
            <Text style={styles.pickButtonText}>프로필 이미지 변경</Text>
          </Pressable>
        </View>

        <Field label="닉네임" value={nickname} onChangeText={setNickname} />
        <Field label="소속 학과" value={department} onChangeText={setDepartment} />
        <Field label="학년" value={studentYear} onChangeText={setStudentYear} keyboardType="numeric" />
        <Field label="소개" value={bio} onChangeText={setBio} multiline />

        <Pressable onPress={saving ? undefined : handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>{saving ? '저장 중...' : '저장하기'}</Text>
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
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholderTextColor={palette.muted}
        style={[styles.input, multiline && styles.textarea]}
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
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: palette.ink,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 4,
  },
  profileCard: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  pickButton: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: palette.blush,
  },
  pickButtonText: {
    color: palette.burgundyDark,
    fontSize: 13,
    fontWeight: '700',
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    backgroundColor: palette.white,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: palette.ink,
    fontSize: 14,
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  saveButton: {
    borderRadius: radius.lg,
    backgroundColor: palette.burgundy,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '800',
  },
});

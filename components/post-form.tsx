import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import {
  boardComposeDefaults,
  categoryLabels,
  categoryOptions,
  statusOptions,
  subcategoryOptions,
  tradeTypeOptions,
} from '@/lib/constants';
import { pickImages } from '@/lib/image-picker';
import { palette, radius, spacing } from '@/lib/theme';
import { BoardType, PostCategory, PostDetail, PostUpsertPayload, TradeType } from '@/types/models';
import { ImageStripPicker } from '@/components/image-strip-picker';
import { Pill } from '@/components/ui/pill';

type PostFormProps = {
  board: BoardType;
  submitting: boolean;
  initialPost?: PostDetail | null;
  onSubmit: (payload: PostUpsertPayload) => Promise<void>;
};

export function PostForm({ board, submitting, initialPost, onSubmit }: PostFormProps) {
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PostCategory>(boardComposeDefaults[board]);
  const [subcategory, setSubcategory] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('');
  const [tradeType, setTradeType] = useState<TradeType>('direct');
  const [location, setLocation] = useState('');
  const [isPriceOfferAllowed, setIsPriceOfferAllowed] = useState(false);
  const [recruitmentTarget, setRecruitmentTarget] = useState('');
  const [recruitmentCurrent, setRecruitmentCurrent] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (!initialPost) {
      const nextCategory = boardComposeDefaults[board];
      setCategory(nextCategory);
      setSubcategory(subcategoryOptions[nextCategory][0] ?? '');
      setStatus(statusOptions[nextCategory][0] ?? '');
      return;
    }

    setImages(initialPost.images);
    setTitle(initialPost.title);
    setCategory(initialPost.category);
    setSubcategory(initialPost.subcategory);
    setPrice(initialPost.price ? String(initialPost.price) : '');
    setStatus(initialPost.status);
    setTradeType((initialPost.tradeType ?? 'direct') as TradeType);
    setLocation(initialPost.location ?? '');
    setIsPriceOfferAllowed(initialPost.isPriceOfferAllowed);
    setRecruitmentTarget(initialPost.recruitmentTarget ? String(initialPost.recruitmentTarget) : '');
    setRecruitmentCurrent(initialPost.recruitmentCurrent ? String(initialPost.recruitmentCurrent) : '');
    setContent(initialPost.content);
    setTagInput(initialPost.tags.join(', '));
  }, [board, initialPost]);

  useEffect(() => {
    if (!subcategoryOptions[category].includes(subcategory)) {
      setSubcategory(subcategoryOptions[category][0] ?? '');
    }

    if (!statusOptions[category].includes(status)) {
      setStatus(statusOptions[category][0] ?? '');
    }
  }, [category, status, subcategory]);

  const categoryChoices = useMemo(() => {
    if (board === 'main') {
      return categoryOptions;
    }

    return categoryOptions.filter((item) => item.value === boardComposeDefaults[board] || item.value === 'community');
  }, [board]);

  async function handleAddImages() {
    try {
      const nextImages = await pickImages(Math.max(0, 10 - images.length));
      if (!nextImages.length) {
        return;
      }

      setImages((current) => [...current, ...nextImages].slice(0, 10));
    } catch (error) {
      Alert.alert('사진 선택 실패', error instanceof Error ? error.message : '사진을 불러오지 못했습니다.');
    }
  }

  function handleRemoveImage(index: number) {
    setImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function handlePromoteImage(index: number) {
    setImages((current) => {
      if (index === 0) {
        return current;
      }

      const next = [...current];
      const [picked] = next.splice(index, 1);
      next.unshift(picked);
      return next;
    });
  }

  async function handleSubmit() {
    if (!images.length) {
      Alert.alert('사진이 필요해요', '최소 1장의 사진을 등록해 주세요.');
      return;
    }

    if (!title.trim() || !content.trim() || !subcategory.trim()) {
      Alert.alert('입력 확인', '제목, 카테고리, 상세 설명을 입력해 주세요.');
      return;
    }

    if (category === 'market' && !price.trim()) {
      Alert.alert('가격 확인', '중고거래 글에는 가격 입력이 필요합니다.');
      return;
    }

    const payload: PostUpsertPayload = {
      title: title.trim(),
      content: content.trim(),
      category,
      subcategory,
      images,
      status: status || statusOptions[category][0],
      location: location.trim() || null,
      isPriceOfferAllowed,
      tags: tagInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    if (category === 'market') {
      payload.price = Number(price) || 0;
      payload.tradeType = tradeType;
    }

    if (category === 'recruit') {
      payload.recruitmentTarget = Number(recruitmentTarget) || null;
      payload.recruitmentCurrent = Number(recruitmentCurrent) || 0;
    }

    await onSubmit(payload);
  }

  return (
    <View style={styles.wrap}>
      <ImageStripPicker
        images={images}
        onAdd={handleAddImages}
        onRemove={handleRemoveImage}
        onPromote={handlePromoteImage}
      />

      <Field label="제목">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="예: 운영체제 교재 상태 좋아요"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />
      </Field>

      <Field label="카테고리">
        <View style={styles.chips}>
          {categoryChoices.map((item) => (
            <Pill
              key={item.value}
              label={item.label}
              active={item.value === category}
              onPress={() => setCategory(item.value)}
            />
          ))}
        </View>
      </Field>

      <Field label="세부 카테고리">
        <View style={styles.chips}>
          {subcategoryOptions[category].map((item) => (
            <Pill key={item} label={item} active={item === subcategory} toned="soft" onPress={() => setSubcategory(item)} />
          ))}
        </View>
      </Field>

      {category === 'market' ? (
        <>
          <Field label="가격">
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="가격을 입력해 주세요"
              placeholderTextColor={palette.muted}
              keyboardType="numeric"
              style={styles.input}
            />
          </Field>

          <Field label="거래 방식">
            <View style={styles.chips}>
              {tradeTypeOptions.map((item) => (
                <Pill
                  key={item.value}
                  label={item.label}
                  active={item.value === tradeType}
                  toned="soft"
                  onPress={() => setTradeType(item.value)}
                />
              ))}
            </View>
          </Field>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.fieldLabel}>가격 제안 허용</Text>
              <Text style={styles.helper}>구매자가 가격 제안을 보낼 수 있어요.</Text>
            </View>
            <Switch
              value={isPriceOfferAllowed}
              onValueChange={setIsPriceOfferAllowed}
              trackColor={{ false: '#D7CCC4', true: palette.burgundy }}
            />
          </View>
        </>
      ) : null}

      {category === 'recruit' ? (
        <View style={styles.doubleRow}>
          <View style={styles.halfField}>
            <Field label="모집 목표 인원">
              <TextInput
                value={recruitmentTarget}
                onChangeText={setRecruitmentTarget}
                placeholder="예: 4"
                placeholderTextColor={palette.muted}
                keyboardType="numeric"
                style={styles.input}
              />
            </Field>
          </View>
          <View style={styles.halfField}>
            <Field label="현재 인원">
              <TextInput
                value={recruitmentCurrent}
                onChangeText={setRecruitmentCurrent}
                placeholder="예: 2"
                placeholderTextColor={palette.muted}
                keyboardType="numeric"
                style={styles.input}
              />
            </Field>
          </View>
        </View>
      ) : null}

      <Field label="상태">
        <View style={styles.chips}>
          {statusOptions[category].map((item) => (
            <Pill key={item} label={item} active={item === status} toned="soft" onPress={() => setStatus(item)} />
          ))}
        </View>
      </Field>

      <Field label="거래/활동 위치">
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="예: 안암캠퍼스 하나스퀘어"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />
      </Field>

      <Field label="해시태그">
        <TextInput
          value={tagInput}
          onChangeText={setTagInput}
          placeholder="쉼표로 구분해 입력해 주세요"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />
      </Field>

      <Field label="상세 설명">
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder={`${categoryLabels[category]} 내용을 자세히 적어 주세요`}
          placeholderTextColor={palette.muted}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.textarea]}
        />
      </Field>

      <Pressable onPress={submitting ? undefined : handleSubmit} style={styles.submitButton}>
        <Text style={styles.submitButtonText}>{submitting ? '저장 중...' : initialPost ? '수정 완료' : '게시글 등록'}</Text>
      </Pressable>
    </View>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabel: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  helper: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    backgroundColor: palette.white,
    color: palette.ink,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  textarea: {
    minHeight: 140,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  switchRow: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.lg,
    backgroundColor: palette.white,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  doubleRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  submitButton: {
    borderRadius: radius.lg,
    backgroundColor: palette.burgundy,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '800',
  },
});

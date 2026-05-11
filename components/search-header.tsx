import { ReactNode, useEffect, useRef, useState } from 'react';
import { Image, ImageSourcePropType, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing } from '@/lib/theme';
import { Pill } from '@/components/ui/pill';

type SearchHeaderProps = {
  title: string;
  subtitle?: string;
  titleLogo?: ImageSourcePropType;
  query: string;
  onChangeQuery: (value: string) => void;
  primaryChips: { label: string; value: string }[];
  primaryValue: string;
  onPrimaryChange: (value: string) => void;
  secondaryChips: { label: string; value: string }[];
  secondaryValue: string;
  onSecondaryChange: (value: string) => void;
  rightAccessory?: ReactNode;
};

export function SearchHeader({
  title,
  subtitle,
  titleLogo,
  query,
  onChangeQuery,
  primaryChips,
  primaryValue,
  onPrimaryChange,
  secondaryChips,
  secondaryValue,
  onSecondaryChange,
  rightAccessory,
}: SearchHeaderProps) {
  const inputRef = useRef<TextInput>(null);
  const [searchOpen, setSearchOpen] = useState(Boolean(query));

  useEffect(() => {
    if (searchOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
  }, [searchOpen]);

  function closeSearch() {
    onChangeQuery('');
    setSearchOpen(false);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <View style={styles.titleTextWrap}>
          <View style={styles.titleContent}>
            {titleLogo ? <Image source={titleLogo} style={styles.titleLogo} /> : null}
            <Text style={styles.title}>{title}</Text>
          </View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="검색"
            onPress={() => setSearchOpen((value) => !value)}
            style={[styles.iconButton, (searchOpen || query) && styles.iconButtonActive]}>
            <Ionicons name="search" size={22} color={searchOpen || query ? palette.white : palette.ink} />
          </Pressable>
          {rightAccessory}
        </View>
      </View>

      {searchOpen ? (
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={palette.muted} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={onChangeQuery}
            placeholder="제목이나 본문으로 검색"
            placeholderTextColor={palette.muted}
            returnKeyType="search"
            style={styles.searchInput}
          />
          <Pressable accessibilityLabel="검색 닫기" hitSlop={10} onPress={closeSearch} style={styles.closeButton}>
            <Ionicons name="close" size={18} color={palette.muted} />
          </Pressable>
        </View>
      ) : null}

      {primaryChips.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {primaryChips.map((chip) => (
            <Pill
              key={chip.value}
              label={chip.label}
              active={chip.value === primaryValue}
              onPress={() => onPrimaryChange(chip.value)}
            />
          ))}
        </ScrollView>
      ) : null}

      {secondaryChips.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {secondaryChips.map((chip) => (
            <Pill
              key={chip.value}
              label={chip.label}
              active={chip.value === secondaryValue}
              toned="soft"
              onPress={() => onSecondaryChange(chip.value)}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleTextWrap: {
    flex: 1,
  },
  titleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleLogo: {
    width: 140,
    height: 50,
    marginLeft: -17,
    borderRadius: 8,
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: palette.burgundy,
    borderColor: palette.burgundy,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: palette.ink,
    fontSize: 14,
    paddingVertical: 0,
  },
  closeButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipScroll: {
    gap: 8,
    paddingRight: spacing.md,
  },
});

import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing } from '@/lib/theme';
import { Pill } from '@/components/ui/pill';

type SearchHeaderProps = {
  title: string;
  subtitle: string;
  query: string;
  onChangeQuery: (value: string) => void;
  primaryChips: { label: string; value: string }[];
  primaryValue: string;
  onPrimaryChange: (value: string) => void;
  secondaryChips: { label: string; value: string }[];
  secondaryValue: string;
  onSecondaryChange: (value: string) => void;
};

export function SearchHeader({
  title,
  subtitle,
  query,
  onChangeQuery,
  primaryChips,
  primaryValue,
  onPrimaryChange,
  secondaryChips,
  secondaryValue,
  onSecondaryChange,
}: SearchHeaderProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={palette.muted} />
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          placeholder="제목이나 본문으로 검색"
          placeholderTextColor={palette.muted}
          style={styles.searchInput}
        />
      </View>

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
    marginBottom: spacing.lg,
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  searchInput: {
    flex: 1,
    color: palette.ink,
    fontSize: 14,
  },
  chipScroll: {
    gap: 8,
    paddingRight: spacing.md,
  },
});

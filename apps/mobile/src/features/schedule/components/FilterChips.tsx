import { ScrollView, StyleSheet } from "react-native";
import { FilterPill } from "../../../components/brand/FilterPill";
import { spacing } from "../../../theme/spacing";
import type { ScheduleFilter } from "../types";

const BASE_CHIPS: { key: ScheduleFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "group", label: "Group stage" },
  { key: "knockouts", label: "Knockouts" },
];

interface FilterChipsProps {
  value: ScheduleFilter;
  onChange: (filter: ScheduleFilter) => void;
  showMyTeam: boolean;
}

export function FilterChips({ value, onChange, showMyTeam }: FilterChipsProps) {
  const chips = showMyTeam
    ? [...BASE_CHIPS, { key: "myTeam" as ScheduleFilter, label: "My team" }]
    : BASE_CHIPS;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {chips.map((chip) => (
        <FilterPill
          key={chip.key}
          label={chip.label}
          selected={chip.key === value}
          onPress={() => onChange(chip.key)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
});

import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import type { ScheduleFilter } from "../types";

const BASE_CHIPS: { key: ScheduleFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "group", label: "Group stage" },
  { key: "knockouts", label: "Knockouts" }
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
      contentContainerStyle={styles.row}
    >
      {chips.map((chip) => {
        const active = chip.key === value;
        return (
          <Pressable
            key={chip.key}
            onPress={() => onChange(chip.key)}
            style={[styles.chip, active ? styles.chipActive : null]}
          >
            <Text style={[styles.label, active ? styles.labelActive : null]}>{chip.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: "rgba(255, 248, 234, 0.08)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  chipActive: {
    backgroundColor: colors.gold
  },
  label: {
    color: "rgba(255, 248, 234, 0.75)",
    fontSize: 13,
    fontWeight: "800"
  },
  labelActive: {
    color: colors.pitch
  },
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  }
});

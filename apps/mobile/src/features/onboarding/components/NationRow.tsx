import { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import type { NationConfig } from "@gogaffa/config";
import { TeamLogo } from "../../../components/team";
import { colors, opacity } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { pressableFeedback } from "../../../theme/pressable";
import { typography } from "../../../theme/typography";

interface NationRowProps {
  nation: NationConfig;
  selected: boolean;
  onPress: (nation: NationConfig) => void;
}

function NationRowComponent({ nation, selected, onPress }: NationRowProps) {
  const handlePress = useCallback(() => {
    onPress(nation);
  }, [nation, onPress]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && pressableFeedback(true),
      ]}
    >
      <TeamLogo code={nation.code} name={nation.name} size={34} />
      <Text style={styles.name} numberOfLines={2}>
        {nation.name}
      </Text>
      {selected ? <Text style={styles.check}>✓</Text> : null}
    </Pressable>
  );
}

export const NationRow = memo(
  NationRowComponent,
  (prev, next) =>
    prev.nation.code === next.nation.code
    && prev.selected === next.selected
    && prev.onPress === next.onPress
);

const styles = StyleSheet.create({
  check: {
    color: colors.red,
    fontFamily: typography.label.fontFamily,
    fontSize: 18,
    lineHeight: 22,
  },
  name: {
    ...typography.body,
    color: colors.ink,
    flex: 1,
    fontFamily: typography.eyebrow.fontFamily,
    fontSize: 16,
  },
  row: {
    alignItems: "center",
    borderBottomColor: opacity.ink12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 66,
    paddingVertical: spacing.md,
  },
  rowSelected: {
    borderLeftColor: colors.red,
    borderLeftWidth: 2,
    paddingLeft: spacing.sm,
  },
});

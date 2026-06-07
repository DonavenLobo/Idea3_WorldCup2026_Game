import { Pressable, StyleSheet, Text } from "react-native";
import type { NationConfig } from "@world-cup-game/config";
import { colors, opacity } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { pressableFeedback } from "../../../theme/pressable";
import { typography } from "../../../theme/typography";

interface NationRowProps {
  nation: NationConfig;
  selected: boolean;
  onPress: () => void;
}

export function NationRow({ nation, selected, onPress }: NationRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && pressableFeedback(true),
      ]}
    >
      <Text style={styles.flag}>{nation.flagEmoji}</Text>
      <Text style={styles.name} numberOfLines={2}>
        {nation.name}
      </Text>
      {selected ? <Text style={styles.check}>✓</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  check: {
    color: colors.red,
    fontFamily: typography.label.fontFamily,
    fontSize: 18,
    lineHeight: 22,
  },
  flag: {
    fontSize: 28,
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
    paddingVertical: spacing.md,
  },
  rowSelected: {
    borderLeftColor: colors.red,
    borderLeftWidth: 2,
    paddingLeft: spacing.sm,
  },
});

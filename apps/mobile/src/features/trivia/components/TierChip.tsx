import { StyleSheet, Text, View } from "react-native";
import { TRIVIA_QUESTION_TIERS } from "@gogaffa/config";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

export type TierChipQuestionIndex = 0 | 1 | 2;

interface TierChipProps {
  /** 0 = Q1, 1 = Q2, 2 = Q3. Drives the base-points value shown. */
  questionIndex: TierChipQuestionIndex;
  /** Optional override label — defaults to "Q{n+1}". */
  label?: string;
  /** When true, render with the accent treatment (e.g. "this question, right now"). */
  emphasized?: boolean;
}

export function TierChip({ questionIndex, label, emphasized = false }: TierChipProps) {
  const base = TRIVIA_QUESTION_TIERS[questionIndex];
  return (
    <View style={[styles.chip, emphasized ? styles.chipEmphasized : null]}>
      <Text style={[styles.qLabel, emphasized ? styles.qLabelEmphasized : null]}>
        {label ?? `Q${questionIndex + 1}`}
      </Text>
      <Text style={[styles.dot, emphasized ? styles.valueEmphasized : null]}>·</Text>
      <Text style={[styles.value, emphasized ? styles.valueEmphasized : null]}>{base}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    backgroundColor: opacity.ink10,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  chipEmphasized: {
    backgroundColor: opacity.red18,
  },
  dot: {
    ...typography.caption,
    color: opacity.ink55,
  },
  qLabel: {
    ...typography.caption,
    color: opacity.ink70,
    fontFamily: typography.label.fontFamily,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  qLabelEmphasized: {
    color: colors.red,
  },
  value: {
    ...typography.caption,
    color: colors.ink,
    fontFamily: typography.label.fontFamily,
  },
  valueEmphasized: {
    color: colors.red,
  },
});

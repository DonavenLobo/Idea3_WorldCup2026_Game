import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

export interface ScoreDisplayProps {
  label?: string;
  value: number;
  unit?: string;
  size?: "hero" | "default";
  framed?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Inter tabular score row — use for points, XP, and other live totals. */
export function ScoreDisplay({
  label,
  value,
  unit = "pts",
  size = "default",
  framed = true,
  style,
}: ScoreDisplayProps) {
  const isHero = size === "hero";

  const body = (
    <>
      {label ? <Text style={styles.trayLabel}>{label}</Text> : null}
      <View style={styles.scoreRow}>
        <Text style={[styles.plus, isHero && styles.plusHero]}>+</Text>
        <Text style={[styles.value, isHero && styles.valueHero]}>{value}</Text>
        {unit ? <Text style={[styles.unit, isHero && styles.unitHero]}>{unit}</Text> : null}
      </View>
    </>
  );

  if (!framed) {
    return (
      <View style={[styles.unframed, isHero && styles.unframedHero, style]}>
        {body}
      </View>
    );
  }

  return (
    <View style={[styles.tray, isHero && styles.trayHero, style]}>
      {body}
    </View>
  );
}

export interface TriviaStatChipProps {
  label: string;
  value: string;
}

/** Pre-game trivia stats — matches kickoff countdown unit styling. */
export function TriviaStatChip({ label, value }: TriviaStatChipProps) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    borderColor: opacity.ink15,
    borderRadius: radius.button,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  chipLabel: {
    ...typography.caption,
    color: opacity.ink55,
    fontFamily: typography.label.fontFamily,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  chipValue: {
    ...typography.dataValue,
    color: colors.ink,
    fontSize: 20,
    fontVariant: ["tabular-nums"],
    lineHeight: 24,
    marginTop: 2,
  },
  plus: {
    ...typography.dataValue,
    color: colors.red,
    fontSize: 22,
    lineHeight: 26,
    marginRight: 2,
  },
  plusHero: {
    fontSize: 36,
    lineHeight: 40,
  },
  scoreRow: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "center",
  },
  tray: {
    alignItems: "center",
    borderColor: opacity.ink15,
    borderRadius: radius.button,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    width: "100%",
  },
  trayHero: {
    marginTop: spacing.sm,
  },
  unframed: {
    alignItems: "center",
  },
  unframedHero: {
    marginTop: spacing.sm,
  },
  trayLabel: {
    ...typography.caption,
    color: colors.red,
    fontFamily: typography.label.fontFamily,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
  },
  unit: {
    ...typography.caption,
    color: opacity.ink55,
    letterSpacing: 0.8,
    marginLeft: spacing.xs,
    textTransform: "uppercase",
  },
  unitHero: {
    fontSize: 13,
    marginLeft: spacing.sm,
  },
  value: {
    ...typography.dataValue,
    color: colors.ink,
    fontSize: 32,
    fontVariant: ["tabular-nums"],
    lineHeight: 36,
  },
  valueHero: {
    fontSize: 48,
    lineHeight: 52,
  },
});

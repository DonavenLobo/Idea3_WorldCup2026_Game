import { StyleSheet, Text, View } from "react-native";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

export interface LoginStreakBadgeProps {
  /** Consecutive-day login count from profiles.current_login_streak. */
  streak: number;
}

/**
 * Small pill that surfaces the persisted login streak on the home tab.
 * Zero-streak still renders (muted) so users discover the mechanic; the
 * caller decides when to hide it via mount/unmount.
 */
export function LoginStreakBadge({ streak }: LoginStreakBadgeProps) {
  const muted = streak <= 0;
  const safeStreak = Math.max(0, streak);
  const unit = safeStreak === 1 ? "day" : "days";

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Login streak: ${safeStreak} ${unit}`}
      style={[styles.root, muted && styles.rootMuted]}
    >
      <Text style={[styles.eyebrow, muted && styles.textMuted]}>Streak</Text>
      <Text style={[styles.value, muted && styles.textMuted]}>
        {safeStreak}
      </Text>
      <Text style={[styles.unit, muted && styles.textMuted]}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...typography.eyebrow,
    color: colors.red,
  },
  root: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: opacity.red18,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rootMuted: {
    backgroundColor: opacity.ink10,
  },
  textMuted: {
    color: opacity.ink55,
  },
  unit: {
    ...typography.caption,
    color: colors.ink,
    fontFamily: typography.label.fontFamily,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  value: {
    ...typography.dataValue,
    color: colors.ink,
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    lineHeight: 20,
  },
});

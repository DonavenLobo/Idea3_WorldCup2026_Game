import { StyleSheet, Text, View } from "react-native";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

export interface CompetitivePointsPillProps {
  /** Leaderboard-eligible competitive_points total. */
  total: number;
  /** Render in a muted/placeholder style (e.g. while loading). */
  isLoading?: boolean;
}

const formatter = new Intl.NumberFormat("en-US");

/**
 * Small pill that surfaces the user's competitive-points total on the home
 * tab. Visually parallel to LoginStreakBadge (same shape, same vertical
 * rhythm) but uses the ink tone so it reads as the "score" half of the row.
 *
 * Zero-state still renders ("0") so users see the score climb.
 * Loading-state renders "--" in a muted style.
 */
export function CompetitivePointsPill({
  total,
  isLoading = false
}: CompetitivePointsPillProps) {
  const safeTotal = Math.max(0, Math.trunc(total));
  const display = isLoading ? "--" : formatter.format(safeTotal);
  const accessibilityLabel = isLoading
    ? "Competitive points loading"
    : `Competitive points: ${safeTotal}`;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      style={[styles.root, isLoading && styles.rootMuted]}
    >
      <Text style={[styles.eyebrow, isLoading && styles.textMuted]}>
        Points
      </Text>
      <Text style={[styles.value, isLoading && styles.textMuted]}>
        {display}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...typography.eyebrow,
    color: colors.ink,
  },
  root: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: opacity.ink10,
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
  value: {
    ...typography.dataValue,
    color: colors.ink,
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    lineHeight: 20,
  },
});

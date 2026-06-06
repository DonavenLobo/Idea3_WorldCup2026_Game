import { StyleSheet, Text, View } from "react-native";
import { SUPPORTED_NATIONS } from "@world-cup-game/config";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

const RANK_WIDTH = 32;
const FLAG_SIZE = 32;
const SCORE_WIDTH = 72;

interface LeaderboardRowProps {
  rank: number;
  displayName: string;
  countryCode: string;
  score: number;
  isCurrentUser: boolean;
}

function flagFor(code: string): string {
  const nation = SUPPORTED_NATIONS.find((n) => n.code === code);
  return nation?.flagEmoji ?? "🏳️";
}

export function LeaderboardRow({
  rank,
  displayName,
  countryCode,
  score,
  isCurrentUser,
}: LeaderboardRowProps) {
  const textStyle = isCurrentUser ? styles.textCurrent : styles.textDefault;

  return (
    <View style={styles.wrap}>
      <View style={[styles.row, isCurrentUser ? styles.rowCurrent : styles.rowDefault]}>
        <Text style={[styles.rank, textStyle]}>{rank}</Text>
        <View style={styles.flagCircle}>
          <Text style={styles.flag}>{flagFor(countryCode)}</Text>
        </View>
        <Text style={[styles.name, textStyle]} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={[styles.score, textStyle]}>{score}</Text>
      </View>
    </View>
  );
}

export const leaderboardRowMetrics = {
  rankWidth: RANK_WIDTH,
  flagSize: FLAG_SIZE,
  scoreWidth: SCORE_WIDTH,
  horizontalMargin: spacing.md,
  rowGap: spacing.sm,
} as const;

const styles = StyleSheet.create({
  flag: {
    fontSize: 18,
  },
  flagCircle: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderRadius: FLAG_SIZE / 2,
    height: FLAG_SIZE,
    justifyContent: "center",
    marginLeft: spacing.sm,
    width: FLAG_SIZE,
  },
  name: {
    ...typography.label,
    flex: 1,
    marginLeft: spacing.sm,
    minWidth: 0,
  },
  rank: {
    ...typography.label,
    fontVariant: ["tabular-nums"],
    textAlign: "left",
    width: RANK_WIDTH,
  },
  row: {
    alignItems: "center",
    borderRadius: radius.button,
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowCurrent: {
    backgroundColor: colors.red,
  },
  rowDefault: {
    backgroundColor: colors.cream,
  },
  score: {
    ...typography.label,
    fontVariant: ["tabular-nums"],
    marginLeft: spacing.sm,
    textAlign: "right",
    width: SCORE_WIDTH,
  },
  textCurrent: {
    color: colors.cream,
  },
  textDefault: {
    color: colors.ink,
  },
  wrap: {
    marginBottom: spacing.sm,
    marginHorizontal: spacing.md,
  },
});

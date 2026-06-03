import { StyleSheet, Text, View } from "react-native";
import { SUPPORTED_NATIONS } from "@world-cup-game/config";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";

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
  isCurrentUser
}: LeaderboardRowProps) {
  return (
    <View style={[styles.row, isCurrentUser ? styles.rowCurrent : null]}>
      <Text style={[styles.rank, isCurrentUser ? styles.textCurrent : null]}>{rank}</Text>
      <View style={styles.divider} />
      <View style={styles.avatar}>
        <Text style={styles.avatarFlag}>{flagFor(countryCode)}</Text>
      </View>
      <Text
        style={[styles.name, isCurrentUser ? styles.textCurrent : null]}
        numberOfLines={1}
      >
        {displayName}
      </Text>
      <Text style={[styles.score, isCurrentUser ? styles.textCurrent : null]}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    marginRight: spacing.sm,
    width: 36
  },
  avatarFlag: {
    fontSize: 20
  },
  divider: {
    backgroundColor: "rgba(12, 59, 46, 0.15)",
    height: 28,
    marginHorizontal: spacing.sm,
    width: 1
  },
  name: {
    color: colors.pitch,
    flex: 1,
    fontSize: 17,
    fontWeight: "900"
  },
  rank: {
    color: colors.pitch,
    fontSize: 16,
    fontWeight: "900",
    minWidth: 28,
    textAlign: "center"
  },
  row: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomColor: "rgba(12, 59, 46, 0.08)",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  rowCurrent: {
    backgroundColor: colors.gold
  },
  score: {
    color: colors.pitch,
    fontSize: 17,
    fontWeight: "900",
    minWidth: 50,
    textAlign: "right"
  },
  textCurrent: {
    color: colors.pitch
  }
});

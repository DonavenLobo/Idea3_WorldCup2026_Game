import { useRouter } from "expo-router";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { APP_ROUTES, GROUP_IDS, SUPPORTED_NATIONS } from "@world-cup-game/config";
import type { GroupId } from "@world-cup-game/config";
import { useBracket } from "../BracketContext";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

function nationName(code: string | null): string {
  if (!code) return "—";
  return SUPPORTED_NATIONS.find((n) => n.code === code)?.name ?? code;
}

function nationFlag(code: string | null): string {
  if (!code) return "🏴";
  return SUPPORTED_NATIONS.find((n) => n.code === code)?.flagEmoji ?? "🏴";
}

interface BracketSummaryProps {
  onGroupTap?: (group: GroupId) => void;
}

export function BracketSummary({ onGroupTap }: BracketSummaryProps) {
  const router = useRouter();
  const { groupRankings, picks, resetAll } = useBracket();

  const champion = picks.final;
  const third = picks.third;

  // 2nd place = loser of the final = the SF winner who wasn't picked in the final.
  const sf0Winner = picks.sf[0] ?? null;
  const sf1Winner = picks.sf[1] ?? null;
  const second: string | null = (() => {
    if (!champion || !sf0Winner || !sf1Winner) return null;
    return champion === sf0Winner ? sf1Winner : sf0Winner;
  })();

  const handleShare = async () => {
    const lines = [
      "My 2026 tournament bracket prediction:",
      "",
      champion
        ? `🏆 Champion: ${nationFlag(champion)} ${nationName(champion)}`
        : "🏆 Champion: TBD",
      second
        ? `🥈 2nd Place: ${nationFlag(second)} ${nationName(second)}`
        : "🥈 2nd Place: TBD",
      third
        ? `🥉 3rd Place: ${nationFlag(third)} ${nationName(third)}`
        : "🥉 3rd Place: TBD",
      "",
      "Group winners:",
      ...GROUP_IDS.map((g) => {
        const winner = groupRankings[g]?.[0] ?? null;
        return `  ${g}: ${nationFlag(winner)} ${nationName(winner)}`;
      })
    ];
    try {
      await Share.share({ message: lines.join("\n") });
    } catch {
      // user cancelled or share failed - no-op
    }
  };

  const handleJoinGroup = () => {
    router.push(APP_ROUTES.tabs.groups);
  };

  return (
    <View style={styles.root}>
      <View style={styles.championCard}>
        <Text style={styles.championLabel}>🏆 CHAMPION</Text>
        <Text style={styles.championFlag}>{nationFlag(champion)}</Text>
        <Text style={styles.championName}>
          {champion ? nationName(champion) : "Pick the Final to crown your champion"}
        </Text>
      </View>

      <View style={styles.podiumRow}>
        <View style={styles.podiumCard}>
          <Text style={styles.podiumLabel}>🥈 2ND</Text>
          <Text style={styles.podiumFlag}>{nationFlag(second)}</Text>
          <Text style={styles.podiumName} numberOfLines={1}>
            {second ? nationName(second) : "TBD"}
          </Text>
        </View>
        <View style={styles.podiumCard}>
          <Text style={styles.podiumLabel}>🥉 3RD</Text>
          <Text style={styles.podiumFlag}>{nationFlag(third)}</Text>
          <Text style={styles.podiumName} numberOfLines={1}>
            {third ? nationName(third) : "TBD"}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Group winners (tap to edit)</Text>
      <View style={styles.groupGrid}>
        {GROUP_IDS.map((g) => {
          const winner = groupRankings[g]?.[0] ?? null;
          return (
            <Pressable
              key={g}
              style={styles.groupCell}
              onPress={() => onGroupTap?.(g)}
            >
              <Text style={styles.groupLetter}>{g}</Text>
              <Text style={styles.groupFlag}>{nationFlag(winner)}</Text>
              <Text style={styles.groupWinner} numberOfLines={1}>
                {nationName(winner)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.nextStepsHeader}>What&apos;s next?</Text>

      <Pressable style={styles.primaryButton} onPress={handleShare}>
        <Text style={styles.primaryButtonText}>📤  Share My Bracket</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={handleJoinGroup}>
        <Text style={styles.secondaryButtonText}>👥  Create or Join a Group</Text>
      </Pressable>

      <Pressable style={styles.resetButton} onPress={resetAll}>
        <Text style={styles.resetText}>Reset bracket</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  championCard: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderColor: colors.gold,
    borderRadius: radius.lg,
    borderWidth: 3,
    marginBottom: spacing.md,
    padding: spacing.lg
  },
  championFlag: {
    fontSize: 48,
    marginVertical: spacing.sm
  },
  championLabel: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2
  },
  championName: {
    color: colors.pitch,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center"
  },
  groupCell: {
    alignItems: "center",
    backgroundColor: "rgba(255, 248, 234, 0.06)",
    borderColor: "rgba(255, 248, 234, 0.1)",
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
    width: "31%"
  },
  groupFlag: {
    fontSize: 22,
    marginVertical: 4
  },
  groupGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.lg
  },
  groupLetter: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900"
  },
  groupWinner: {
    color: colors.cream,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center"
  },
  nextStepsHeader: {
    color: "rgba(255, 248, 234, 0.7)",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textTransform: "uppercase"
  },
  podiumCard: {
    alignItems: "center",
    backgroundColor: "rgba(255, 248, 234, 0.06)",
    borderColor: "rgba(255, 248, 234, 0.12)",
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md
  },
  podiumFlag: {
    fontSize: 28,
    marginVertical: 4
  },
  podiumLabel: {
    color: "rgba(255, 248, 234, 0.7)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1
  },
  podiumName: {
    color: colors.cream,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center"
  },
  podiumRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    padding: spacing.md
  },
  primaryButtonText: {
    color: colors.pitch,
    fontSize: 16,
    fontWeight: "900"
  },
  resetButton: {
    marginTop: spacing.lg,
    padding: spacing.sm
  },
  resetText: {
    color: "rgba(255, 248, 234, 0.5)",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center"
  },
  root: {
    padding: spacing.lg
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.gold,
    borderRadius: radius.pill,
    borderWidth: 2,
    marginTop: spacing.sm,
    padding: spacing.md
  },
  secondaryButtonText: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: "900"
  },
  sectionHeader: {
    color: "rgba(255, 248, 234, 0.7)",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textTransform: "uppercase"
  }
});

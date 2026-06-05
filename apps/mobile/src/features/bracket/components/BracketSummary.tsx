import { useRouter } from "expo-router";
import { Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";
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
  const { groupRankings, picks, resetAll, saveBracket, isSaving, lastSavedAt, saveError, phase, isClockFallback } = useBracket();

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

  const handleSave = async () => {
    try {
      await saveBracket();
    } catch (error) {
      Alert.alert(
        "Could not save bracket",
        error instanceof Error ? error.message : "Try again in a moment."
      );
    }
  };

  const handleJoinGroup = () => {
    router.push(APP_ROUTES.tabs.groups);
  };

  const handleResetPress = () => {
    Alert.alert(
      "Reset your bracket?",
      "This clears every group pick, knockout result, and final. You can't undo this.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset bracket", style: "destructive", onPress: resetAll }
      ]
    );
  };

  const saveButtonLabel = (() => {
    switch (phase) {
      case "pre":
      case "phase1-closing":
        return isSaving ? "Saving..." : "Save Group Picks";
      case "between":
      case "phase2-closing":
        return isSaving ? "Saving..." : "Save My Bracket";
      case "complete":
        return "Tournament Complete";
    }
  })();

  return (
    <View style={styles.root}>
      {isClockFallback ? (
        <Text style={styles.clockBanner}>
          ⚠️ Couldn't reach server clock — lock times may drift slightly.
        </Text>
      ) : null}
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

      <Pressable
        disabled={isSaving || phase === "complete"}
        style={[styles.primaryButton, (isSaving || phase === "complete") ? styles.disabledButton : null]}
        onPress={handleSave}
      >
        <Text style={styles.primaryButtonText}>
          {saveButtonLabel}
        </Text>
      </Pressable>

      {lastSavedAt ? (
        <Text style={styles.saveStatus}>Saved {new Date(lastSavedAt).toLocaleTimeString()}</Text>
      ) : null}
      {saveError ? <Text style={styles.saveError}>{saveError.message}</Text> : null}

      <Pressable style={styles.secondaryButton} onPress={handleShare}>
        <Text style={styles.secondaryButtonText}>📤  Share My Bracket</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={handleJoinGroup}>
        <Text style={styles.secondaryButtonText}>👥  Create or Join a Group</Text>
      </Pressable>

      <Pressable style={styles.resetButton} onPress={handleResetPress}>
        <Text style={styles.resetText}>Reset bracket</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  clockBanner: {
    color: "#F0A500",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: spacing.sm,
    textAlign: "center"
  },
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
  disabledButton: {
    opacity: 0.7
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
  saveError: {
    color: "#FFB4A8",
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.xs,
    textAlign: "center"
  },
  saveStatus: {
    color: "rgba(255, 248, 234, 0.65)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.xs,
    textAlign: "center"
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

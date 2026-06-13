import { useRouter } from "expo-router";
import { Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { BrandButton } from "../../../components/brand";
import { TeamLogo } from "../../../components/team";
import { APP_ROUTES, formatTeamName, GROUP_IDS, SUPPORTED_NATIONS } from "@world-cup-game/config";
import type { GroupId } from "@world-cup-game/config";
import { WEB_URL } from "../../../lib/constants";
import { useBracket } from "../BracketContext";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

function nationForTeam(team: string | null) {
  if (!team) return null;
  return SUPPORTED_NATIONS.find((n) => n.code === team || n.name === team) ?? null;
}

function nationName(team: string | null): string {
  if (!team) return "—";
  const nation = nationForTeam(team);
  return formatTeamName(nation?.name ?? team);
}

interface BracketSummaryProps {
  onGroupTap?: (group: GroupId) => void;
  canOpenGroups?: boolean;
  canEditGroups?: boolean;
}

export function BracketSummary({
  onGroupTap,
  canOpenGroups = true,
  canEditGroups = true
}: BracketSummaryProps) {
  const router = useRouter();
  const {
    groupRankings,
    picks,
    resetAll,
    stageState,
    isClockFallback
  } = useBracket();

  const champion = picks.final;
  const third = picks.third;

  // 2nd place = loser of the final = the SF winner who wasn't picked in the final.
  const sf0Winner = picks.sf[0] ?? null;
  const sf1Winner = picks.sf[1] ?? null;
  const second: string | null = (() => {
    if (!champion || !sf0Winner || !sf1Winner) return null;
    return champion === sf0Winner ? sf1Winner : sf0Winner;
  })();
  const showPodium = stageState.currentStage === "finals" || stageState.currentStage === "complete";

  const handleShare = async () => {
    const groupWinnerLines = GROUP_IDS.map((g) => {
      const winner = groupRankings[g]?.[0] ?? null;
      return `Group ${g}: ${nationName(winner)}`;
    });

    const lines = [
      stageState.currentStage === "groups"
        ? "My 2026 Tournament Group Winners Prediction:"
        : "My 2026 Tournament Bracket Prediction:",
      "",
      ...(showPodium
        ? [
          champion ? `Champion: ${nationName(champion)}` : "Champion: TBD",
          second ? `2nd Place: ${nationName(second)}` : "2nd Place: TBD",
          third ? `3rd Place: ${nationName(third)}` : "3rd Place: TBD",
          "",
          "Group winners:",
        ]
        : []),
      ...groupWinnerLines,
      "",
      `Sign up at ${WEB_URL}`
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

  return (
    <View style={styles.root}>
      {isClockFallback ? (
        <Text style={styles.clockBanner}>
          ⚠️ Couldn't reach server clock — lock times may drift slightly.
        </Text>
      ) : null}

      {showPodium ? (
        <>
          <View style={styles.championCard}>
            <Text style={styles.championLabel}>🏆 CHAMPION</Text>
            <TeamLogo
              code={nationForTeam(champion)?.code}
              name={nationForTeam(champion)?.name ?? champion}
              size={72}
              style={styles.championLogo}
            />
            <Text style={styles.championName}>
              {champion ? nationName(champion) : "Pick the Final to crown your champion"}
            </Text>
          </View>

          <View style={styles.podiumRow}>
            <View style={styles.podiumCard}>
              <Text style={styles.podiumLabel}>🥈 2ND</Text>
              <TeamLogo
                code={nationForTeam(second)?.code}
                name={nationForTeam(second)?.name ?? second}
                size={42}
                style={styles.podiumLogo}
              />
              <Text style={styles.podiumName} numberOfLines={1}>
                {second ? nationName(second) : "TBD"}
              </Text>
            </View>
            <View style={styles.podiumCard}>
              <Text style={styles.podiumLabel}>🥉 3RD</Text>
              <TeamLogo
                code={nationForTeam(third)?.code}
                name={nationForTeam(third)?.name ?? third}
                size={42}
                style={styles.podiumLogo}
              />
              <Text style={styles.podiumName} numberOfLines={1}>
                {third ? nationName(third) : "TBD"}
              </Text>
            </View>
          </View>
        </>
      ) : null}

      <Text style={styles.sectionHeader}>
        {canEditGroups
          ? "Group winners (tap to edit)"
          : canOpenGroups
            ? "Group winners (tap to view)"
            : "Group winners"}
      </Text>
      <View style={styles.groupGrid}>
        {GROUP_IDS.map((g) => {
          const winner = groupRankings[g]?.[0] ?? null;
          const nation = nationForTeam(winner);
          return (
            <Pressable
              key={g}
              disabled={!canOpenGroups}
              style={[styles.groupCell, !canOpenGroups ? styles.groupCellDisabled : null]}
              onPress={() => onGroupTap?.(g)}
            >
              <Text style={styles.groupLetter}>{g}</Text>
              <TeamLogo code={nation?.code} name={nation?.name ?? winner} size={32} />
              <Text style={styles.groupWinner} numberOfLines={1}>
                {nationName(winner)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.nextStepsHeader}>What&apos;s next?</Text>

      <BrandButton
        label="Share My Bracket"
        onPress={handleShare}
      />

      <BrandButton
        label="Create or Join a Group"
        onPress={handleJoinGroup}
        variant="secondary"
        style={styles.secondaryCta}
      />

      <BrandButton
        label="Reset bracket"
        onPress={handleResetPress}
        variant="ghost"
        style={styles.resetCta}
      />
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
    borderColor: colors.red,
    borderRadius: radius.lg,
    borderWidth: 3,
    marginBottom: spacing.md,
    padding: spacing.lg
  },
  championLogo: {
    marginVertical: spacing.sm
  },
  championLabel: {
    color: colors.red,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2
  },
  championName: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center"
  },
  groupCell: {
    alignItems: "center",
    backgroundColor: opacity.ink12,
    borderColor: opacity.ink15,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
    width: "31%"
  },
  groupCellDisabled: {
    opacity: 0.55
  },
  groupGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.lg
  },
  groupLetter: {
    color: colors.red,
    fontSize: 12,
    fontWeight: "700"
  },
  groupWinner: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center"
  },
  nextStepsHeader: {
    color: opacity.ink60,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textTransform: "uppercase"
  },
  podiumCard: {
    alignItems: "center",
    backgroundColor: opacity.ink12,
    borderColor: opacity.ink15,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md
  },
  podiumLogo: {
    marginVertical: 4
  },
  podiumLabel: {
    color: opacity.ink60,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1
  },
  podiumName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center"
  },
  podiumRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  resetCta: {
    marginTop: spacing.lg,
  },
  root: {
    padding: spacing.lg
  },
  secondaryCta: {
    marginTop: spacing.sm,
  },
  sectionHeader: {
    color: opacity.ink60,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textTransform: "uppercase"
  }
});

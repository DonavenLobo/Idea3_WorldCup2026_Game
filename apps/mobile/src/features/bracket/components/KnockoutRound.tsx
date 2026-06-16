import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatTeamName, SUPPORTED_NATIONS } from "@world-cup-game/config";
import { BrandButton } from "../../../components/brand";
import { TeamLogo } from "../../../components/team";
import { useBracket } from "../BracketContext";
import {
  getFinalMatch,
  getQFMatches,
  getR16Matches,
  getR32Matches,
  getSFMatches,
  getThirdPlaceMatch
} from "../seeding";
import type { Match, Round } from "../types";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

const SAVE_WARNING_DISMISSED_KEY = "gogaffa.bracket.knockoutSaveWarningDismissed";

function nationByTeam(team: string | null) {
  if (!team) return null;
  return SUPPORTED_NATIONS.find((n) => n.code === team || n.name === team) ?? null;
}

function roundLabel(r: Round): string {
  switch (r) {
    case "r32": return "Round of 32";
    case "r16": return "Round of 16";
    case "qf": return "Quarter-finals";
    case "sf": return "Semi-finals";
    case "final": return "Final";
    case "third": return "3rd Place Play-off";
  }
}

function roundShortLabel(r: Round): string {
  switch (r) {
    case "r32": return "R32";
    case "r16": return "R16";
    case "qf": return "QF";
    case "sf": return "SF";
    case "final": return "Final";
    case "third": return "3rd-place";
  }
}

interface KnockoutRoundProps {
  round: Round;
}

export function KnockoutRound({ round }: KnockoutRoundProps) {
  const {
    groupRankings,
    picks,
    setPick,
    setFinal,
    setThird,
    isMatchLocked,
    isKnockoutRoundFinalized,
    saveKnockoutRound,
    isSaving,
    saveError
  } = useBracket();

  const [warningDismissed, setWarningDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(SAVE_WARNING_DISMISSED_KEY).then((value) => {
      if (!cancelled) setWarningDismissed(value === "1");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  let matches: Match[] = [];
  if (round === "r32") matches = getR32Matches(groupRankings);
  else if (round === "r16") matches = getR16Matches(picks);
  else if (round === "qf") matches = getQFMatches(picks);
  else if (round === "sf") matches = getSFMatches(picks);
  else if (round === "final") matches = [getFinalMatch(picks)];
  else if (round === "third") matches = [getThirdPlaceMatch(picks)];

  const getPick = (matchIndex: number): string | null => {
    if (round === "final") return picks.final;
    if (round === "third") return picks.third;
    return picks[round][matchIndex] ?? null;
  };

  const handlePick = (matchIndex: number, code: string) => {
    if (round === "final") {
      setFinal(code);
      return;
    }
    if (round === "third") {
      setThird(code);
      return;
    }
    setPick(round, matchIndex, code);
  };

  const everyMatchUnready = matches.length > 0 && matches.every((m) => !m.home || !m.away);
  const finalized = isKnockoutRoundFinalized(round);

  // Round is fillable iff every match has both teams + a pick. We only enable
  // Save when every required match is filled.
  const allFilled =
    matches.length > 0 &&
    matches.every((m) => Boolean(m.home) && Boolean(m.away) && Boolean(getPick(m.index)));

  const performSave = useCallback(
    async (dontAskAgain = false) => {
      if (dontAskAgain) {
        try {
          await AsyncStorage.setItem(SAVE_WARNING_DISMISSED_KEY, "1");
          setWarningDismissed(true);
        } catch {
          // best-effort
        }
      }
      await saveKnockoutRound(round);
    },
    [round, saveKnockoutRound]
  );

  const handleSavePress = useCallback(() => {
    if (finalized || isSaving || !allFilled) return;

    if (warningDismissed) {
      void performSave(false);
      return;
    }

    Alert.alert(
      `Save ${roundShortLabel(round)} picks?`,
      "Once these picks are saved, you cannot alter them again.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Save", onPress: () => void performSave(false) },
        { text: "Save & don't ask again", onPress: () => void performSave(true) }
      ]
    );
  }, [allFilled, finalized, isSaving, performSave, round, warningDismissed]);

  return (
    <View style={styles.root}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{roundLabel(round)}</Text>
        {finalized ? <Text style={styles.lockedHeaderChip}>LOCKED</Text> : null}
      </View>

      {everyMatchUnready ? (
        <Text style={styles.hint}>
          Pick the previous round to unlock these matches.
        </Text>
      ) : null}

      {matches.map((m) => {
        const home = nationByTeam(m.home);
        const away = nationByTeam(m.away);
        const pick = getPick(m.index);
        const homeSelected = pick !== null && pick === m.home;
        const awaySelected = pick !== null && pick === m.away;
        const locked = finalized || isMatchLocked(round, m.index);

        return (
          <View key={m.index} style={styles.matchCard}>
            <Text style={styles.matchLabel}>Match {m.index + 1}</Text>
            {locked ? <Text style={styles.lockChip}>LOCKED</Text> : null}
            <View style={styles.matchRow}>
              <Pressable
                style={[
                  styles.team,
                  homeSelected ? styles.teamSelected : null,
                  !m.home ? styles.teamDisabled : null,
                  locked ? styles.teamLocked : null
                ]}
                disabled={!m.home || locked}
                onPress={() => m.home && handlePick(m.index, m.home)}
              >
                <TeamLogo code={home?.code} name={home?.name ?? m.home} size={32} />
                <Text
                  style={[styles.teamName, homeSelected ? styles.teamNameSelected : null]}
                  numberOfLines={2}
                >
                  {m.home ? formatTeamName(home?.name ?? m.home) : "TBD"}
                </Text>
              </Pressable>

              <Text style={styles.vs}>VS</Text>

              <Pressable
                style={[
                  styles.team,
                  awaySelected ? styles.teamSelected : null,
                  !m.away ? styles.teamDisabled : null,
                  locked ? styles.teamLocked : null
                ]}
                disabled={!m.away || locked}
                onPress={() => m.away && handlePick(m.index, m.away)}
              >
                <TeamLogo code={away?.code} name={away?.name ?? m.away} size={32} />
                <Text
                  style={[styles.teamName, awaySelected ? styles.teamNameSelected : null]}
                  numberOfLines={2}
                >
                  {m.away ? formatTeamName(away?.name ?? m.away) : "TBD"}
                </Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      {!finalized && !everyMatchUnready ? (
        <View style={styles.saveRow}>
          {!allFilled ? (
            <Text style={styles.saveHelper}>
              Pick a winner for every match before saving.
            </Text>
          ) : null}
          <BrandButton
            label={`Save ${roundShortLabel(round)}`}
            onPress={handleSavePress}
            disabled={!allFilled || isSaving}
            loading={isSaving}
            style={styles.saveCta}
          />
          {saveError ? <Text style={styles.saveError}>{saveError.message}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: opacity.ink55,
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg
  },
  lockChip: {
    color: opacity.ink55,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: spacing.sm
  },
  lockedHeaderChip: {
    color: opacity.ink60,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginLeft: spacing.sm
  },
  matchCard: {
    backgroundColor: opacity.ink12,
    borderColor: opacity.ink15,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.md
  },
  matchLabel: {
    color: opacity.ink55,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: spacing.sm
  },
  matchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  root: {
    paddingTop: spacing.md
  },
  saveCta: {
    alignSelf: "stretch"
  },
  saveError: {
    color: colors.red,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.xs,
    textAlign: "center"
  },
  saveHelper: {
    color: opacity.ink55,
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: spacing.sm,
    textAlign: "center"
  },
  saveRow: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm
  },
  team: {
    alignItems: "center",
    backgroundColor: opacity.ink12,
    borderColor: opacity.ink15,
    borderRadius: radius.md,
    borderWidth: 2,
    flex: 1,
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md
  },
  teamDisabled: {
    opacity: 0.4
  },
  teamLocked: {
    opacity: 0.5
  },
  teamName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center"
  },
  teamNameSelected: {
    color: colors.red
  },
  teamSelected: {
    backgroundColor: opacity.red18,
    borderColor: colors.red
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "700"
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg
  },
  vs: {
    color: opacity.ink55,
    fontSize: 12,
    fontWeight: "700"
  }
});

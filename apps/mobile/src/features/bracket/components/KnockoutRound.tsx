import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatTeamName, SUPPORTED_NATIONS } from "@world-cup-game/config";
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

function nationByCode(code: string | null) {
  if (!code) return null;
  return SUPPORTED_NATIONS.find((n) => n.code === code) ?? null;
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

interface KnockoutRoundProps {
  round: Round;
}

export function KnockoutRound({ round }: KnockoutRoundProps) {
  const { groupRankings, picks, setPick, setFinal, setThird } = useBracket();

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

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{roundLabel(round)}</Text>

      {everyMatchUnready ? (
        <Text style={styles.hint}>
          Pick the previous round to unlock these matches.
        </Text>
      ) : null}

      {matches.map((m) => {
        const home = nationByCode(m.home);
        const away = nationByCode(m.away);
        const pick = getPick(m.index);
        const homeSelected = pick !== null && pick === m.home;
        const awaySelected = pick !== null && pick === m.away;

        return (
          <View key={m.index} style={styles.matchCard}>
            <Text style={styles.matchLabel}>Match {m.index + 1}</Text>
            <View style={styles.matchRow}>
              <Pressable
                style={[
                  styles.team,
                  homeSelected ? styles.teamSelected : null,
                  !m.home ? styles.teamDisabled : null
                ]}
                disabled={!m.home}
                onPress={() => m.home && handlePick(m.index, m.home)}
              >
                <Text style={styles.teamFlag}>{home?.flagEmoji ?? "?"}</Text>
                <Text
                  style={[styles.teamName, homeSelected ? styles.teamNameSelected : null]}
                  numberOfLines={2}
                >
                  {home?.name ? formatTeamName(home.name) : "TBD"}
                </Text>
              </Pressable>

              <Text style={styles.vs}>VS</Text>

              <Pressable
                style={[
                  styles.team,
                  awaySelected ? styles.teamSelected : null,
                  !m.away ? styles.teamDisabled : null
                ]}
                disabled={!m.away}
                onPress={() => m.away && handlePick(m.index, m.away)}
              >
                <Text style={styles.teamFlag}>{away?.flagEmoji ?? "?"}</Text>
                <Text
                  style={[styles.teamName, awaySelected ? styles.teamNameSelected : null]}
                  numberOfLines={2}
                >
                  {away?.name ? formatTeamName(away.name) : "TBD"}
                </Text>
              </Pressable>
            </View>
          </View>
        );
      })}
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
  teamFlag: {
    fontSize: 24
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
    fontWeight: "700",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg
  },
  vs: {
    color: opacity.ink55,
    fontSize: 12,
    fontWeight: "700"
  }
});

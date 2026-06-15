import { Pressable, StyleSheet, Text, View } from "react-native";
import { ContentCard } from "../../../components/brand";
import { colors, opacity } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { pressableFeedback } from "../../../theme/pressable";
import { typography } from "../../../theme/typography";
import type { ScheduledFixture } from "../types";
import { formatKickoffTime } from "../utils";
import { TeamLabel } from "./TeamLabel";

interface FixtureRowProps {
  fixture: ScheduledFixture;
  timeZone: string;
  onVenuePress: (city: string) => void;
}

export function FixtureRow({ fixture, timeZone, onVenuePress }: FixtureRowProps) {
  const hasScore =
    fixture.score?.homeScore !== null
    && fixture.score?.homeScore !== undefined
    && fixture.score?.awayScore !== null
    && fixture.score?.awayScore !== undefined
    && fixture.status !== "scheduled";

  return (
    <ContentCard style={styles.row}>
      <View style={styles.teams}>
        <TeamLabel name={fixture.team1} align="left" />
        <View style={styles.center}>
          {hasScore ? (
            <>
              <View style={[styles.statusPill, fixture.status === "live" && styles.livePill]}>
                <Text style={[styles.statusText, fixture.status === "live" && styles.liveText]}>
                  {fixture.status === "live" ? "LIVE" : "FT"}
                </Text>
              </View>
              <Text style={styles.score}>
                {fixture.score?.homeScore} - {fixture.score?.awayScore}
              </Text>
            </>
          ) : (
            <Text style={styles.time}>{formatKickoffTime(fixture.kickoffUtc, timeZone)}</Text>
          )}
        </View>
        <TeamLabel name={fixture.team2} align="right" />
      </View>
      <Pressable
        onPress={() => onVenuePress(fixture.venueCity)}
        hitSlop={6}
        style={({ pressed }) => pressed && pressableFeedback(true)}
      >
        <Text style={styles.venue} numberOfLines={1}>
          {fixture.group ? `${fixture.group} · ` : ""}
          {fixture.venueCity} ›
        </Text>
      </Pressable>
    </ContentCard>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    flexShrink: 0,
    width: 90,
  },
  livePill: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  liveText: {
    color: colors.cream,
  },
  row: {
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  score: {
    ...typography.dataValue,
    color: colors.ink,
    fontSize: 18,
    fontVariant: ["tabular-nums"],
    lineHeight: 22,
    marginTop: 2,
  },
  statusPill: {
    borderColor: opacity.ink15,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusText: {
    ...typography.caption,
    color: opacity.ink70,
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
  },
  teams: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  time: {
    ...typography.label,
    color: colors.red,
  },
  venue: {
    ...typography.caption,
    color: opacity.ink55,
    fontFamily: typography.label.fontFamily,
    textAlign: "center",
  },
});

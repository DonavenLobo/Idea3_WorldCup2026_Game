import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Fixture } from "@world-cup-game/config";
import { ContentCard } from "../../../components/brand";
import { colors, opacity } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { pressableFeedback } from "../../../theme/pressable";
import { typography } from "../../../theme/typography";
import { formatKickoffTime } from "../utils";
import { TeamLabel } from "./TeamLabel";

interface FixtureRowProps {
  fixture: Fixture;
  timeZone: string;
  onVenuePress: (city: string) => void;
}

export function FixtureRow({ fixture, timeZone, onVenuePress }: FixtureRowProps) {
  return (
    <ContentCard style={styles.row}>
      <View style={styles.teams}>
        <TeamLabel name={fixture.team1} align="left" />
        <View style={styles.center}>
          <Text style={styles.time}>{formatKickoffTime(fixture.kickoffUtc, timeZone)}</Text>
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
  row: {
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
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

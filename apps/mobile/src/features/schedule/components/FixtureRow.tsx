import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Fixture } from "@world-cup-game/config";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { formatKickoffTime } from "../utils";
import { TeamLabel } from "./TeamLabel";

interface FixtureRowProps {
  fixture: Fixture;
  timeZone: string;
  onVenuePress: (city: string) => void;
}

export function FixtureRow({ fixture, timeZone, onVenuePress }: FixtureRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.teams}>
        <TeamLabel name={fixture.team1} align="left" />
        <View style={styles.center}>
          <Text style={styles.time}>{formatKickoffTime(fixture.kickoffUtc, timeZone)}</Text>
        </View>
        <TeamLabel name={fixture.team2} align="right" />
      </View>
      <Pressable onPress={() => onVenuePress(fixture.venueCity)} hitSlop={6}>
        <Text style={styles.venue} numberOfLines={1}>
          {fixture.group ? `${fixture.group} · ` : ""}
          {fixture.venueCity} ›
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    minWidth: 64
  },
  row: {
    backgroundColor: "rgba(255, 248, 234, 0.05)",
    borderRadius: radius.md,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    padding: spacing.md
  },
  teams: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  time: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: "800"
  },
  venue: {
    color: "rgba(255, 248, 234, 0.6)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center"
  }
});

import { Image, StyleSheet, Text, View } from "react-native";
import { BASE_CARD_STATS, CARD_STATS } from "@gogaffa/config";
import type { NationConfig } from "@gogaffa/config";
import type { CardStats } from "@gogaffa/types";
import { TeamLogo } from "../../../components/team";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import type { PhotoSource } from "../types";

interface MockPlayerCardProps {
  nation: NationConfig | null;
  displayName: string;
  photoSource: PhotoSource | null;
  stats?: CardStats;
}

const MOCK_OVERALL = 50;

export function MockPlayerCard({
  nation,
  displayName,
  photoSource,
  stats = BASE_CARD_STATS
}: MockPlayerCardProps) {
  const name = displayName.trim() || "Rookie";

  return (
    <View style={[styles.card, nation ? { borderColor: nation.primaryColor } : null]}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.overall}>{MOCK_OVERALL}</Text>
          <Text style={styles.overallLabel}>OVR</Text>
        </View>
        <TeamLogo code={nation?.code} name={nation?.name} size={50} />
      </View>

      <View style={styles.avatar}>
        {photoSource?.uri ? (
          <Image source={{ uri: photoSource.uri }} style={styles.avatarImage} />
        ) : (
          <TeamLogo code={nation?.code} name={nation?.name} size={112} />
        )}
      </View>

      <Text style={styles.name}>{name}</Text>
      <Text style={styles.nation}>{nation ? nation.name : "No nation selected"}</Text>

      <View style={styles.statsRow}>
        {CARD_STATS.map((stat) => (
          <View key={stat.key} style={styles.stat}>
            <Text style={styles.statValue}>{stats[stat.key]}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.badge}>MOCK PREVIEW</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: opacity.ink12,
    borderRadius: radius.lg,
    height: 180,
    justifyContent: "center",
    marginVertical: spacing.md,
    overflow: "hidden",
    width: 180
  },
  avatarImage: {
    height: "100%",
    width: "100%"
  },
  badge: {
    alignSelf: "center",
    backgroundColor: colors.red,
    borderRadius: radius.pill,
    color: colors.cream,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: spacing.md,
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: 4
  },
  card: {
    backgroundColor: colors.cream,
    borderColor: colors.red,
    borderRadius: radius.lg,
    borderWidth: 3,
    padding: spacing.lg
  },
  name: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center"
  },
  nation: {
    color: opacity.ink55,
    fontSize: 14,
    textAlign: "center"
  },
  overall: {
    color: colors.ink,
    fontSize: 40,
    fontWeight: "700"
  },
  overallLabel: {
    color: opacity.ink55,
    fontSize: 12,
    fontWeight: "700"
  },
  stat: {
    alignItems: "center",
    flex: 1
  },
  statLabel: {
    color: opacity.ink55,
    fontSize: 11,
    fontWeight: "700"
  },
  statValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700"
  },
  statsRow: {
    flexDirection: "row",
    marginTop: spacing.md
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  }
});

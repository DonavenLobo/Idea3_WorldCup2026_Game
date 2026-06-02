import { Image, StyleSheet, Text, View } from "react-native";
import { BASE_CARD_STATS, CARD_STATS } from "@world-cup-game/config";
import type { NationConfig } from "@world-cup-game/config";
import type { CardStats } from "@world-cup-game/types";
import { colors } from "../../../theme/colors";
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
        <Text style={styles.flag}>{nation?.flagEmoji ?? "⚽️"}</Text>
      </View>

      <View style={styles.avatar}>
        {photoSource?.uri ? (
          <Image source={{ uri: photoSource.uri }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarEmoji}>{nation?.flagEmoji ?? "⚽️"}</Text>
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
    backgroundColor: colors.turf,
    borderRadius: radius.lg,
    height: 180,
    justifyContent: "center",
    marginVertical: spacing.md,
    overflow: "hidden",
    width: 180
  },
  avatarEmoji: {
    fontSize: 80
  },
  avatarImage: {
    height: "100%",
    width: "100%"
  },
  badge: {
    alignSelf: "center",
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    color: colors.pitch,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: spacing.md,
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: 4
  },
  card: {
    backgroundColor: colors.cream,
    borderColor: colors.gold,
    borderRadius: radius.lg,
    borderWidth: 3,
    padding: spacing.lg
  },
  flag: {
    fontSize: 40
  },
  name: {
    color: colors.pitch,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center"
  },
  nation: {
    color: "rgba(12, 59, 46, 0.6)",
    fontSize: 14,
    textAlign: "center"
  },
  overall: {
    color: colors.pitch,
    fontSize: 40,
    fontWeight: "900"
  },
  overallLabel: {
    color: "rgba(12, 59, 46, 0.6)",
    fontSize: 12,
    fontWeight: "800"
  },
  stat: {
    alignItems: "center",
    flex: 1
  },
  statLabel: {
    color: "rgba(12, 59, 46, 0.6)",
    fontSize: 11,
    fontWeight: "800"
  },
  statValue: {
    color: colors.pitch,
    fontSize: 18,
    fontWeight: "900"
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

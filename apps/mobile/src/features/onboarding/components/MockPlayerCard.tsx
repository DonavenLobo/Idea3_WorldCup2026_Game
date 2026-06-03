import { Image, StyleSheet, Text, View } from "react-native";
import { BASE_CARD_STATS, CARD_STATS } from "@world-cup-game/config";
import type { CosmeticItem, NationConfig } from "@world-cup-game/config";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import type { PhotoSource } from "../types";

interface MockPlayerCardProps {
  nation: NationConfig | null;
  displayName: string;
  photoSource: PhotoSource | null;
  activeFrame?: CosmeticItem | null;
  activeBadge?: CosmeticItem | null;
  activeBackground?: CosmeticItem | null;
  ovrBonus?: number;
}

const MOCK_OVERALL = 50;

export function MockPlayerCard({
  nation,
  displayName,
  photoSource,
  activeFrame,
  activeBadge,
  activeBackground,
  ovrBonus = 0
}: MockPlayerCardProps) {
  const name = displayName.trim() || "Rookie";

  const borderColor =
    activeFrame?.meta?.color ?? nation?.primaryColor ?? colors.gold;
  const cardBackground =
    activeBackground?.meta?.backgroundColor ?? colors.cream;
  const overall = MOCK_OVERALL + ovrBonus;

  return (
    <View
      style={[
        styles.card,
        { borderColor, backgroundColor: cardBackground }
      ]}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={styles.overall}>{overall}</Text>
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
        {activeBadge ? (
          <View style={styles.badgeOverlay}>
            <Text style={styles.badgeOverlayEmoji}>{activeBadge.emoji}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.name}>{name}</Text>
      <Text style={styles.nation}>{nation ? nation.name : "No nation selected"}</Text>

      <View style={styles.statsRow}>
        {CARD_STATS.map((stat) => (
          <View key={stat.key} style={styles.stat}>
            <Text style={styles.statValue}>{BASE_CARD_STATS[stat.key]}</Text>
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
    position: "relative",
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
  badgeOverlay: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderColor: colors.gold,
    borderRadius: 999,
    borderWidth: 2,
    height: 44,
    justifyContent: "center",
    position: "absolute",
    right: -6,
    top: -6,
    width: 44
  },
  badgeOverlayEmoji: {
    fontSize: 22
  },
  card: {
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

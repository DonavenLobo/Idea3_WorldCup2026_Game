import { Pressable, StyleSheet, Text, View } from "react-native";
import type { CreditPack } from "@world-cup-game/config";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

interface CreditPackButtonProps {
  pack: CreditPack;
  onPress: () => void;
}

export function CreditPackButton({ pack, onPress }: CreditPackButtonProps) {
  return (
    <Pressable
      style={[styles.card, pack.bestValue ? styles.cardBest : null]}
      onPress={onPress}
    >
      {pack.bestValue ? (
        <View style={styles.bestBadge}>
          <Text style={styles.bestBadgeText}>BEST VALUE</Text>
        </View>
      ) : null}
      <Text style={styles.credits}>{pack.credits.toLocaleString()}</Text>
      <Text style={styles.creditsLabel}>CREDITS</Text>
      <Text style={styles.price}>{pack.priceUsd}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bestBadge: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    position: "absolute",
    right: 6,
    top: -8
  },
  bestBadgeText: {
    color: colors.red,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderColor: opacity.ink12,
    borderRadius: radius.lg,
    borderWidth: 2,
    flex: 1,
    padding: spacing.md,
    position: "relative"
  },
  cardBest: {
    borderColor: colors.red
  },
  credits: {
    color: colors.red,
    fontSize: 22,
    fontWeight: "700"
  },
  creditsLabel: {
    color: opacity.ink55,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1
  },
  price: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
    marginTop: spacing.xs
  }
});

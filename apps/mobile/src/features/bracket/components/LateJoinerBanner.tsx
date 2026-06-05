// apps/mobile/src/features/bracket/components/LateJoinerBanner.tsx
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

const STORAGE_KEY = "bracket.lateJoinerBannerDismissed";

interface LateJoinerBannerProps {
  lockedGroupCount: number;
  lockedMatchCount: number;
}

export function LateJoinerBanner({ lockedGroupCount, lockedMatchCount }: LateJoinerBannerProps) {
  const [dismissedKnown, setDismissedKnown] = useState<boolean | null>(null);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      setDismissedKnown(value === "1");
    });
  }, []);

  if (dismissedKnown === null) return null;
  if (dismissedKnown) return null;
  if (lockedGroupCount === 0 && lockedMatchCount === 0) return null;

  const handleDismiss = () => {
    setDismissedKnown(true);
    void AsyncStorage.setItem(STORAGE_KEY, "1");
  };

  return (
    <View style={styles.banner}>
      <Text style={styles.body}>
        🕒 <Text style={styles.bold}>You're joining after some games started.</Text>{" "}
        {lockedGroupCount > 0
          ? `${lockedGroupCount} group${lockedGroupCount === 1 ? "" : "s"} already locked. `
          : ""}
        {lockedMatchCount > 0
          ? `${lockedMatchCount} knockout match${lockedMatchCount === 1 ? "" : "es"} already played. `
          : ""}
        You can still play the rest.
      </Text>
      <Pressable onPress={handleDismiss} hitSlop={12} style={styles.dismiss}>
        <Text style={styles.dismissText}>Got it</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "rgba(214, 161, 30, 0.18)",
    borderColor: colors.gold,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md
  },
  body: {
    color: colors.cream,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18
  },
  bold: { fontWeight: "900" },
  dismiss: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4
  },
  dismissText: {
    color: colors.pitch,
    fontSize: 12,
    fontWeight: "900"
  }
});

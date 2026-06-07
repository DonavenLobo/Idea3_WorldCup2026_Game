import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { pressableFeedback } from "../../../theme/pressable";
import { colors, opacity } from "../../../theme/colors";
import { fontFamily } from "../../../theme/typography";
import { useCurrentUserCard } from "../../card";
import { useOnboarding } from "../../onboarding";
import { useSession } from "../../auth/hooks/useSession";
import { useAccountStats } from "../hooks/useAccountWallet";
import { useProfile } from "../hooks/useProfile";
import {
  AccountBottomSheet,
  type AccountBottomSheetHandle,
} from "./AccountBottomSheet";

export function ProfileHeaderButton() {
  const { displayName, photoSource } = useOnboarding();
  const { card } = useCurrentUserCard();
  const { profile } = useProfile();
  const { user } = useSession();
  const { creditBalance, leaderboardScore } = useAccountStats();
  const queryClient = useQueryClient();
  const sheetRef = useRef<AccountBottomSheetHandle>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const savedImageUrl = profile?.avatarUrl ?? card?.avatarSourceUrl;
  const imageUri = savedImageUrl ?? photoSource?.uri;
  const effectiveName = profile?.displayName || card?.displayName || displayName;
  const nationCode = card?.selectedNationCode ?? profile?.selectedNationCode;
  const initial = effectiveName.trim().charAt(0).toUpperCase() || "?";

  const openMenu = () => {
    void queryClient.invalidateQueries({ queryKey: ["account-stats"] });
    sheetRef.current?.present();
  };

  return (
    <>
      <View collapsable={false} style={styles.anchor}>
        <Pressable
          accessibilityLabel="Open account menu"
          accessibilityRole="button"
          accessibilityState={{ expanded: sheetOpen }}
          onPress={openMenu}
          style={({ pressed }) => [
            styles.root,
            sheetOpen && !reduceMotion && styles.rootActive,
            pressed && pressableFeedback(true),
          ]}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <Text style={styles.initial}>{initial}</Text>
          )}
        </Pressable>
      </View>

      <AccountBottomSheet
        ref={sheetRef}
        creditBalance={creditBalance}
        leaderboardScore={leaderboardScore}
        displayName={effectiveName}
        email={user?.email}
        imageUri={imageUri}
        nationCode={nationCode}
        onOpenChange={setSheetOpen}
        overall={card?.overall}
      />
    </>
  );
}

const styles = StyleSheet.create({
  anchor: {
    marginLeft: 16,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  initial: {
    color: colors.red,
    fontFamily: fontFamily.caveatBold,
    fontSize: 16,
  },
  root: {
    alignItems: "center",
    backgroundColor: opacity.red18,
    borderColor: colors.red,
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    justifyContent: "center",
    overflow: "hidden",
    width: 36,
  },
  rootActive: {
    backgroundColor: opacity.red50,
    transform: [{ scale: 1.04 }],
  },
});

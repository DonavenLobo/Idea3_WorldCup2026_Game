import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LOCKER_TIERS } from "@world-cup-game/config";
import type { PlayerCard as PlayerCardData } from "@world-cup-game/types";
import { BrandButton, Eyebrow } from "../../../components/brand";
import { Screen } from "../../../components/layout";
import { RenderedPlayerCard } from "../components/RenderedPlayerCard";
import { useLockerRoom } from "../../locker-room";
import type { LockerProgress } from "../../locker-room";
import { useCurrentUserCard } from "../hooks/useCurrentUserCard";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";
import { getErrorMessage } from "../../../utils/errors";

type CardSubTab = "card" | "locker";

export function CardScreen() {
  const { card, error: cardError, isLoading: isCardLoading } = useCurrentUserCard();
  const { progress } = useLockerRoom();
  const [subTab, setSubTab] = useState<CardSubTab>("card");
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  return (
    <View style={styles.root}>
      <View style={styles.subTabRow}>
        <Pressable
          style={[styles.subTab, subTab === "card" ? styles.subTabActive : null]}
          onPress={() => setSubTab("card")}
        >
          <Text style={[styles.subTabText, subTab === "card" ? styles.subTabTextActive : null]}>
            My Card
          </Text>
        </Pressable>
        <Pressable
          style={[styles.subTab, subTab === "locker" ? styles.subTabActive : null]}
          onPress={() => setSubTab("locker")}
        >
          <Text style={[styles.subTabText, subTab === "locker" ? styles.subTabTextActive : null]}>
            Locker Room
          </Text>
        </Pressable>
      </View>

      <Screen
        scroll
        ref={scrollRef}
        edges={["left", "right"]}
        bottomInset={32}
        contentContainerStyle={styles.content}
      >
        {subTab === "card" ? (
          <MyCardPanel
            card={card}
            error={cardError}
            isLoading={isCardLoading}
            progress={progress}
            onOpenLocker={() => setSubTab("locker")}
          />
        ) : (
          <LockerRoomComingSoonPanel />
        )}
      </Screen>
    </View>
  );
}

function MyCardPanel({
  card,
  error,
  isLoading,
  progress,
  onOpenLocker
}: {
  card: PlayerCardData | null;
  error: unknown;
  isLoading: boolean;
  progress: LockerProgress;
  onOpenLocker: () => void;
}) {
  const tierConfig = LOCKER_TIERS.find((tier) => tier.id === progress.tier);

  return (
    <View>
      <View style={styles.eyebrowWrap}>
        <Eyebrow label="YOUR CARD" />
      </View>
      {isLoading ? (
        <Text style={styles.statusText}>Loading your card...</Text>
      ) : error ? (
        <Text style={styles.statusText}>
          {getErrorMessage(error, "Could not load your card.")}
        </Text>
      ) : card ? (
        <RenderedPlayerCard card={card} style={styles.playerCard} />
      ) : (
        <Text style={styles.statusText}>Create your card during onboarding to manage it here.</Text>
      )}

      <View style={styles.tierCard}>
        <View
          style={[
            styles.tierBadge,
            { backgroundColor: tierConfig?.badgeColor ?? colors.red }
          ]}
        >
          <Text style={styles.tierBadgeText}>
            {tierConfig?.label.toUpperCase() ?? "BRONZE"}
          </Text>
        </View>
        <View style={styles.tierTextCol}>
          <Text style={styles.tierTitle}>Current locker tier</Text>
          <Text style={styles.tierStat}>
            +{tierConfig?.ovrBonus ?? 0} OVR status bonus. {progress.ownedCount} cosmetics owned.
          </Text>
          <Text style={styles.tierProgress}>
            {progress.nextTierLabel
              ? `${progress.ownedToNextTier} more to ${progress.nextTierLabel}`
              : "Max tier reached"}
          </Text>
        </View>
      </View>

      <BrandButton
        label="Open Locker Room"
        onPress={onOpenLocker}
        style={styles.lockerCta}
      />

      <Text style={styles.note}>
        Cards never downgrade. Paid cosmetics and status bonuses do not affect competitive points.
      </Text>
    </View>
  );
}

function LockerRoomComingSoonPanel() {
  return (
    <View style={styles.comingSoonPanel}>
      <Eyebrow label="COMING SOON" />
      <Text style={styles.comingSoonTitle}>Locker Room Coming Soon</Text>
      <Text style={styles.comingSoonBody}>
        Cosmetics and card upgrades will be available in an app update.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  comingSoonBody: {
    ...typography.bodySmall,
    color: opacity.ink60,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  comingSoonPanel: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 360,
    paddingHorizontal: spacing.lg,
  },
  comingSoonTitle: {
    ...typography.titleScreen,
    color: colors.ink,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  content: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  eyebrowWrap: {
    marginBottom: spacing.xs,
  },
  playerCard: {
    marginTop: -15,
  },
  lockerCta: {
    alignSelf: "stretch",
    marginTop: spacing.lg
  },
  note: {
    ...typography.caption,
    color: opacity.ink35,
    fontStyle: "italic",
    marginTop: spacing.md,
    textAlign: "center",
  },
  root: {
    backgroundColor: colors.cream,
    flex: 1
  },
  statusText: {
    ...typography.label,
    color: opacity.ink70,
    padding: spacing.lg,
    textAlign: "center",
  },
  subTab: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: radius.pill,
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
    paddingVertical: spacing.sm,
  },
  subTabActive: {
    backgroundColor: colors.cream,
    borderColor: opacity.ink15,
    borderWidth: 1,
  },
  subTabRow: {
    backgroundColor: opacity.ink12,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.xs,
  },
  subTabText: {
    ...typography.label,
    color: opacity.ink55,
  },
  subTabTextActive: {
    color: colors.ink,
  },
  tierBadge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radius.button,
    flexShrink: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tierBadgeText: {
    ...typography.label,
    color: colors.ink,
    letterSpacing: 1,
  },
  tierCard: {
    alignItems: "flex-start",
    backgroundColor: opacity.ink12,
    borderColor: opacity.ink15,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  tierProgress: {
    ...typography.caption,
    color: colors.red,
    fontFamily: typography.label.fontFamily,
    marginTop: spacing.xs,
  },
  tierStat: {
    ...typography.caption,
    color: opacity.ink60,
    marginTop: spacing.xs,
  },
  tierTextCol: {
    flex: 1,
    minWidth: 0,
  },
  tierTitle: {
    ...typography.headingCard,
    color: colors.ink,
  },
});

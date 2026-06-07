import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { APP_ROUTES } from "@world-cup-game/config";
import { BrandButton, Eyebrow } from "../../src/components/brand";
import { Screen } from "../../src/components/layout";
import { RenderedPlayerCard } from "../../src/features/card";
import { useOnboarding } from "../../src/features/onboarding";
import { useCurrentUserCard } from "../../src/features/card";
import { useProfile } from "../../src/features/profile";
import { colors, opacity } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

const KICKOFF_DATE = new Date("2026-06-11T18:00:00Z");

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target.getTime() - now.getTime());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

/** Pre-tournament only — remove once the World Cup kicks off. */
function KickoffCountdown({
  days,
  hours,
  minutes,
  seconds,
}: {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}) {
  return (
    <View style={styles.kickoffBanner}>
      <Text style={styles.kickoffSeries}>World Cup 2026</Text>
      <Text style={styles.kickoffDate}>Kickoff · 11 June</Text>

      <View style={styles.kickoffRow}>
        <KickoffUnit label="days" value={days} />
        <Text style={styles.kickoffDot}>·</Text>
        <KickoffUnit label="hrs" value={hours} />
        <Text style={styles.kickoffDot}>·</Text>
        <KickoffUnit label="min" value={minutes} />
        <Text style={styles.kickoffDot}>·</Text>
        <KickoffUnit emphasize label="sec" value={seconds} />
      </View>
    </View>
  );
}

function KickoffUnit({
  value,
  label,
  emphasize = false,
}: {
  value: number;
  label: string;
  emphasize?: boolean;
}) {
  return (
    <View style={styles.kickoffUnit}>
      <Text style={[styles.kickoffValue, emphasize && styles.kickoffValueLive]}>
        {pad(value)}
      </Text>
      <Text style={[styles.kickoffLabel, emphasize && styles.kickoffLabelLive]}>
        {label}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { nation, displayName, photoSource } = useOnboarding();
  const { card } = useCurrentUserCard();
  const { profile } = useProfile();
  const { days, hours, minutes, seconds } = useCountdown(KICKOFF_DATE);
  const selectedNationCode =
    profile?.selectedNationCode ?? card?.selectedNationCode ?? nation?.code;
  const cardDisplayName = profile?.displayName || card?.displayName || displayName;
  const savedPhotoUrl = profile?.avatarUrl ?? card?.avatarSourceUrl;
  const cardPhotoSource = savedPhotoUrl
    ? { type: "upload" as const, uri: savedPhotoUrl }
    : photoSource;
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  return (
    <Screen
      scroll
      edges={["left", "right"]}
      bottomInset={spacing.xl}
      ref={scrollRef}
      contentContainerStyle={styles.content}
    >
      <KickoffCountdown
        days={days}
        hours={hours}
        minutes={minutes}
        seconds={seconds}
      />

      <Eyebrow label="Your card" />
      <RenderedPlayerCard
        card={card}
        displayName={cardDisplayName}
        photoSource={cardPhotoSource}
        selectedNationCode={selectedNationCode}
        stats={card?.stats}
        style={styles.playerCard}
      />

      <View style={styles.navActions}>
        <BrandButton
          label="Create Your Bracket"
          onPress={() => router.push(APP_ROUTES.tabs.bracket)}
        />
        <BrandButton
          label="Join a Group"
          variant="secondary"
          onPress={() => router.push(APP_ROUTES.tabs.groups)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
  },
  kickoffBanner: {
    alignItems: "center",
    borderColor: opacity.ink15,
    borderRadius: radius.card,
    borderTopColor: colors.red,
    borderTopWidth: 3,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: "visible",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  kickoffDate: {
    ...typography.caption,
    color: colors.red,
    fontFamily: typography.label.fontFamily,
    letterSpacing: 1,
    marginTop: spacing.xs,
    textTransform: "uppercase",
  },
  kickoffDot: {
    ...typography.caption,
    color: opacity.red50,
    fontFamily: typography.label.fontFamily,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  kickoffLabel: {
    ...typography.caption,
    color: opacity.ink55,
    fontSize: 10,
    letterSpacing: 0.6,
    marginTop: 2,
    textTransform: "uppercase",
  },
  kickoffLabelLive: {
    color: colors.red,
    fontFamily: typography.label.fontFamily,
  },
  kickoffRow: {
    alignItems: "flex-end",
    borderColor: opacity.ink15,
    borderRadius: radius.button,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    width: "100%",
  },
  kickoffSeries: {
    ...typography.titleScreen,
    color: colors.ink,
    fontSize: 24,
    lineHeight: 34,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xl,
    textAlign: "center",
  },
  navActions: {
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  kickoffUnit: {
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  kickoffValue: {
    ...typography.dataValue,
    color: colors.ink,
    fontSize: 20,
    fontVariant: ["tabular-nums"],
    lineHeight: 24,
  },
  kickoffValueLive: {
    color: colors.red,
  },
  playerCard: {
    marginTop: -15,
  },
});

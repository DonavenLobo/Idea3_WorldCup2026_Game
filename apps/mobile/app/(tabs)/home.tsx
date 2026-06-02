import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { APP_ROUTES } from "@world-cup-game/config";
import { MockPlayerCard, useOnboarding } from "../../src/features/onboarding";
import { colors } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { spacing } from "../../src/theme/spacing";

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
    seconds: Math.floor((diff / 1000) % 60)
  };
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export default function HomeScreen() {
  const router = useRouter();
  const { nation, displayName, photoSource } = useOnboarding();
  const { days, hours, minutes, seconds } = useCountdown(KICKOFF_DATE);
  const scrollRef = useRef<ScrollView>(null);

  // Reset scroll to top whenever the Home tab gets focused.
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  return (
    <ScrollView ref={scrollRef} style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>YOUR CARD</Text>
      <MockPlayerCard nation={nation} displayName={displayName} photoSource={photoSource} />

      <View style={styles.countdownCard}>
        <Text style={styles.countdownLabel}>Kickoff in</Text>
        <View style={styles.countdownRow}>
          <CountdownBox value={days} unit="DAYS" />
          <CountdownBox value={hours} unit="HRS" />
          <CountdownBox value={minutes} unit="MIN" />
          <CountdownBox value={seconds} unit="SEC" />
        </View>
        <Text style={styles.kickoffDate}>Kickoff Jun 11</Text>
      </View>

      <Pressable
        style={styles.ctaCard}
        onPress={() => router.push(APP_ROUTES.tabs.bracket)}
      >
        <View style={styles.ctaText}>
          <Text style={styles.ctaTitle}>Create Your Bracket</Text>
          <Text style={styles.ctaBody}>
            Pick group winners and the knockout path to the trophy.
          </Text>
        </View>
        <Text style={styles.ctaArrow}>›</Text>
      </Pressable>

      <Pressable
        style={styles.ctaCard}
        onPress={() => router.push(APP_ROUTES.tabs.groups)}
      >
        <View style={styles.ctaText}>
          <Text style={styles.ctaTitle}>Join a Group</Text>
          <Text style={styles.ctaBody}>
            Compete with friends on the tournament leaderboard.
          </Text>
        </View>
        <Text style={styles.ctaArrow}>›</Text>
      </Pressable>

      <Pressable
        style={styles.ctaCard}
        onPress={() => router.push(APP_ROUTES.leaderboard)}
      >
        <View style={styles.ctaText}>
          <Text style={styles.ctaTitle}>View Leaderboard</Text>
          <Text style={styles.ctaBody}>
            See where you rank globally. Filter by country or stage.
          </Text>
        </View>
        <Text style={styles.ctaArrow}>›</Text>
      </Pressable>
    </ScrollView>
  );
}

function CountdownBox({ value, unit }: { value: number; unit: string }) {
  return (
    <View style={styles.countdownBox}>
      <Text style={styles.countdownValue}>{pad(value)}</Text>
      <Text style={styles.countdownUnit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg
  },
  countdownBox: {
    alignItems: "center",
    backgroundColor: "rgba(214, 161, 30, 0.12)",
    borderRadius: radius.md,
    flex: 1,
    paddingVertical: spacing.sm
  },
  countdownCard: {
    backgroundColor: "rgba(255, 248, 234, 0.06)",
    borderColor: "rgba(255, 248, 234, 0.12)",
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.lg
  },
  countdownLabel: {
    color: "rgba(255, 248, 234, 0.7)",
    fontSize: 13,
    fontWeight: "700"
  },
  countdownRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  countdownUnit: {
    color: "rgba(255, 248, 234, 0.6)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 2
  },
  countdownValue: {
    color: colors.gold,
    fontSize: 28,
    fontWeight: "900"
  },
  ctaArrow: {
    color: colors.pitch,
    fontSize: 28,
    fontWeight: "900"
  },
  ctaBody: {
    color: "rgba(12, 59, 46, 0.65)",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2
  },
  ctaCard: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg
  },
  ctaText: {
    flex: 1
  },
  ctaTitle: {
    color: colors.pitch,
    fontSize: 17,
    fontWeight: "900"
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    textTransform: "uppercase"
  },
  kickoffDate: {
    color: "rgba(255, 248, 234, 0.7)",
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.sm,
    textAlign: "center"
  },
  root: {
    backgroundColor: colors.pitch,
    flex: 1
  }
});

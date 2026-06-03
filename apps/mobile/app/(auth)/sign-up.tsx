import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { APP_ROUTES } from "@world-cup-game/config";
import { AuthLegalLinks, OAuthButtons } from "../../src/features/auth";
import { BackButton } from "../../src/components/common/BackButton";
import { colors } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

export default function SignUpScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton variant="light" />
        <Text style={styles.eyebrow}>SAVE YOUR CARD</Text>
        <Text style={styles.title}>Save Your Footballer</Text>
        <Text style={styles.subtitle}>
          Create an account to keep your card, join groups, and climb the tournament leaderboard.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create your account</Text>
          <Text style={styles.cardSubtitle}>
            Verification takes you straight to your home screen.
          </Text>

          <OAuthButtons />

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push(APP_ROUTES.auth.enterPhone)}
          >
            <Text style={styles.primaryButtonText}>📱  Continue with Phone Number</Text>
          </Pressable>

          <Pressable
            style={styles.goldButton}
            onPress={() => router.push(APP_ROUTES.auth.enterEmail)}
          >
            <Text style={styles.goldButtonText}>✉️  Use Email</Text>
          </Pressable>

          <Pressable onPress={() => router.push(APP_ROUTES.auth.signIn)}>
            <Text style={styles.linkText}>I already have an account</Text>
          </Pressable>

          <AuthLegalLinks />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How it works</Text>

          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🎯</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Predict</Text>
              <Text style={styles.featureBody}>
                Pick your bracket and play daily trivia.
              </Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>👥</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Compete</Text>
              <Text style={styles.featureBody}>
                Climb leaderboards with your friend group.
              </Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>📡</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Follow</Text>
              <Text style={styles.featureBody}>
                Track your nation&apos;s matches live.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream,
    borderColor: "rgba(12, 59, 46, 0.12)",
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.lg
  },
  cardSubtitle: {
    color: "rgba(12, 59, 46, 0.65)",
    fontSize: 14,
    marginTop: 2
  },
  cardTitle: {
    color: colors.pitch,
    ...typography.title
  },
  content: {
    padding: spacing.lg
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  featureBody: {
    color: "rgba(12, 59, 46, 0.65)",
    fontSize: 14,
    lineHeight: 20
  },
  featureEmoji: {
    fontSize: 22
  },
  featureIcon: {
    alignItems: "center",
    backgroundColor: "rgba(214, 161, 30, 0.18)",
    borderRadius: radius.md,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  featureRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md
  },
  featureText: {
    flex: 1,
    gap: 2
  },
  featureTitle: {
    color: colors.pitch,
    fontSize: 18,
    fontWeight: "900"
  },
  goldButton: {
    alignItems: "center",
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    padding: spacing.md
  },
  goldButtonText: {
    color: colors.pitch,
    fontSize: 16,
    fontWeight: "900"
  },
  linkText: {
    color: colors.pitch,
    fontSize: 15,
    fontWeight: "700",
    marginTop: spacing.md,
    textAlign: "center"
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.pitch,
    borderRadius: radius.pill,
    marginTop: spacing.md,
    padding: spacing.md
  },
  primaryButtonText: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: "900"
  },
  root: {
    backgroundColor: colors.pitch,
    flex: 1
  },
  subtitle: {
    color: "rgba(255, 248, 234, 0.75)",
    marginTop: spacing.xs,
    ...typography.body
  },
  title: {
    color: colors.cream,
    marginTop: spacing.xs,
    ...typography.display
  }
});

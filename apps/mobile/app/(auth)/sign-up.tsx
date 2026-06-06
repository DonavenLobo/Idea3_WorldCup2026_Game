import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { APP_ROUTES } from "@world-cup-game/config";
import { AuthOptionRow, AuthShell } from "../../src/components/auth";
import { AuthLegalLinks, OAuthButtons } from "../../src/features/auth";
import { colors, opacity } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

const FEATURES = [
  { title: "Predict", body: "Pick your bracket and play daily trivia." },
  { title: "Compete", body: "Climb leaderboards with your friend group." },
  { title: "Follow", body: "Track your nation's matches live." },
] as const;

export default function SignUpScreen() {
  const router = useRouter();

  return (
    <AuthShell
      title="Save Your Footballer"
      subtitle="Create an account to keep your card, join groups, and climb the tournament leaderboard."
    >
      <OAuthButtons />

      <AuthOptionRow
        accent
        label="Continue with Phone Number"
        onPress={() => router.push(APP_ROUTES.auth.enterPhone)}
      />

      <AuthOptionRow
        label="Use Email"
        onPress={() => router.push(APP_ROUTES.auth.enterEmail)}
      />

      <Pressable onPress={() => router.push(APP_ROUTES.auth.signIn)} style={styles.signInLink}>
        <Text style={styles.signInText}>I already have an account</Text>
      </Pressable>

      <AuthLegalLinks />

      <View style={styles.features}>
        <Text style={styles.featuresTitle}>How it works</Text>
        {FEATURES.map((feature) => (
          <View key={feature.title} style={styles.featureRow}>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureBody}>{feature.body}</Text>
          </View>
        ))}
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  featureBody: {
    ...typography.caption,
    color: opacity.ink60,
    flex: 1,
    lineHeight: 20,
  },
  featureRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  featureTitle: {
    ...typography.sectionHeading,
    color: colors.ink,
    fontSize: 16,
    lineHeight: 20,
    width: 72,
  },
  features: {
    borderTopColor: opacity.ink12,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
  },
  featuresTitle: {
    ...typography.sectionHeading,
    color: colors.ink,
    fontSize: 20,
  },
  signInLink: {
    marginTop: spacing.lg,
  },
  signInText: {
    ...typography.body,
    color: colors.ink,
    fontFamily: typography.eyebrow.fontFamily,
    textAlign: "center",
  },
});

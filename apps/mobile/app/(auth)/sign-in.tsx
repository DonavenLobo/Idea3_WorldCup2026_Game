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

export default function SignInScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton variant="light" />
        <Text style={styles.eyebrow}>WELCOME BACK</Text>
        <Text style={styles.title}>Sign in to GoGaffa</Text>
        <Text style={styles.subtitle}>
          Return to your card, groups, trivia streaks, and tournament progress.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Continue with your account</Text>
          <Text style={styles.cardSubtitle}>
            Use the same provider you used when saving your footballer card.
          </Text>

          <OAuthButtons />

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push(APP_ROUTES.auth.enterEmail)}
          >
            <Text style={styles.secondaryButtonText}>Use email instead</Text>
          </Pressable>

          <Pressable onPress={() => router.push(APP_ROUTES.auth.signUp)}>
            <Text style={styles.linkText}>Create a new account</Text>
          </Pressable>

          <AuthLegalLinks />
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
  linkText: {
    color: colors.pitch,
    fontSize: 15,
    fontWeight: "700",
    marginTop: spacing.md,
    textAlign: "center"
  },
  root: {
    backgroundColor: colors.pitch,
    flex: 1
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "rgba(12, 59, 46, 0.16)",
    borderRadius: radius.pill,
    borderWidth: 2,
    marginTop: spacing.sm,
    padding: spacing.md
  },
  secondaryButtonText: {
    color: colors.pitch,
    fontSize: 16,
    fontWeight: "900"
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

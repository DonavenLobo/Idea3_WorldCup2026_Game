import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { APP_ROUTES } from "@world-cup-game/config";
import { AuthOptionRow, AuthShell } from "../../src/components/auth";
import { AuthLegalLinks, OAuthButtons } from "../../src/features/auth";
import { colors } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

export default function SignInScreen() {
  const router = useRouter();

  return (
    <AuthShell
      title="Sign in to GoGaffa"
      subtitle="Return to your card, groups, bracket, and tournament progress."
    >
      <OAuthButtons />

      <AuthOptionRow
        label="Continue with Phone Number"
        onPress={() => router.push(APP_ROUTES.auth.enterPhone)}
        variant="primary"
      />

      <AuthOptionRow
        label="Continue with Email"
        onPress={() => router.push(APP_ROUTES.auth.enterEmail)}
        variant="secondary"
      />

      <Pressable onPress={() => router.push(APP_ROUTES.auth.signUp)} style={styles.signUpLink}>
        <Text style={styles.signUpText}>Create a new account</Text>
      </Pressable>

      <AuthLegalLinks />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  signUpLink: {
    alignSelf: "center",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  signUpText: {
    ...typography.body,
    color: colors.ink,
    fontFamily: typography.eyebrow.fontFamily,
    textAlign: "center",
  },
});

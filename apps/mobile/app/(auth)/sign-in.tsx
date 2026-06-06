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
      subtitle="Return to your card, groups, trivia streaks, and tournament progress."
    >
      <OAuthButtons />

      <AuthOptionRow
        label="Use email instead"
        onPress={() => router.push(APP_ROUTES.auth.enterEmail)}
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
    marginTop: spacing.lg,
  },
  signUpText: {
    ...typography.body,
    color: colors.ink,
    fontFamily: typography.eyebrow.fontFamily,
    textAlign: "center",
  },
});

import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { APP_ROUTES } from "@gogaffa/config";
import { AuthShell } from "../../src/components/auth";
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

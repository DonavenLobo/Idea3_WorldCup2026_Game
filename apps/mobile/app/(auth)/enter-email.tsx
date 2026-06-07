import { useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { APP_ROUTES } from "@world-cup-game/config";
import { AuthShell } from "../../src/components/auth";
import { OnboardingButton, OnboardingInput } from "../../src/components/onboarding";
import { colors } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EnterEmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const trimmed = email.trim();
  const isValid = EMAIL_REGEX.test(trimmed);

  const handleContinue = () => {
    if (!isValid) return;
    router.push({
      pathname: APP_ROUTES.auth.verify,
      params: { method: "email", value: trimmed },
    });
  };

  return (
    <AuthShell
      keyboard
      title="What is your email?"
      subtitle="We will send a 6-digit code to verify."
      footer={
        <OnboardingButton label="Send code" onPress={handleContinue} disabled={!isValid} />
      }
    >
      <Text style={styles.label}>Email</Text>
      <OnboardingInput
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
        returnKeyType="go"
        onSubmitEditing={handleContinue}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.caption,
    color: colors.ink,
    fontFamily: typography.eyebrow.fontFamily,
    marginBottom: spacing.xs,
  },
});

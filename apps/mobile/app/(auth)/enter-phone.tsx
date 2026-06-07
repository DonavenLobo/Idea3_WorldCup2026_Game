import { useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { APP_ROUTES } from "@world-cup-game/config";
import { AuthShell } from "../../src/components/auth";
import { OnboardingButton, OnboardingInput } from "../../src/components/onboarding";
import { colors } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

export default function EnterPhoneScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const cleaned = phone.replace(/\D/g, "");
  const isValid = cleaned.length >= 10;

  const handleContinue = () => {
    if (!isValid) return;
    router.push({
      pathname: APP_ROUTES.auth.verify,
      params: { method: "phone", value: phone.trim() },
    });
  };

  return (
    <AuthShell
      keyboard
      title="What is your phone number?"
      subtitle="We will text you a 6-digit code to verify."
      footer={
        <OnboardingButton label="Send code" onPress={handleContinue} disabled={!isValid} />
      }
    >
      <Text style={styles.label}>Phone number</Text>
      <OnboardingInput
        placeholder="+1 555 123 4567"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
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

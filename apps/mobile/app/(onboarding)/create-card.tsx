import { useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import * as Linking from "expo-linking";
import { SafeAreaView } from "react-native-safe-area-context";
import { APP_ROUTES } from "@world-cup-game/config";
import { OnboardingButton, OnboardingInput, OnboardingShell } from "../../src/components/onboarding";
import { useOnboarding } from "../../src/features/onboarding";
import { TERMS_OF_SERVICE_URL } from "../../src/lib/constants";
import { colors, opacity } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

const MAX_NAME_LENGTH = 20;

export default function CreateCardScreen() {
  const router = useRouter();
  const { displayName, setDisplayName } = useOnboarding();
  const [isCooking, setIsCooking] = useState(false);

  const trimmedName = displayName.trim();
  const canCreate = trimmedName.length > 0 && !isCooking;

  const handleCreate = () => {
    if (trimmedName.length === 0) {
      return;
    }
    setIsCooking(true);
    setTimeout(() => {
      setIsCooking(false);
      router.push(APP_ROUTES.onboarding.cardPreview);
    }, 2000);
  };

  if (isCooking) {
    return (
      <SafeAreaView style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={colors.red} />
        <Text style={styles.cookingTitle}>Your card is cooking…</Text>
        <Text style={styles.cookingBody}>Building {trimmedName}&apos;s footballer card.</Text>
      </SafeAreaView>
    );
  }

  return (
    <OnboardingShell
      step={3}
      showBack
      title="Name your card"
      subtitle="This name appears on your footballer card."
      footer={
        <View style={styles.footerCol}>
          <Text style={styles.policyNote}>
            By creating a card you agree to our{" "}
            <Text
              style={styles.policyLink}
              onPress={() => void Linking.openURL(TERMS_OF_SERVICE_URL)}
            >
              Content Guidelines
            </Text>
            . No offensive, harmful, or infringing content.
          </Text>
          <OnboardingButton
            label="Create My Card"
            onPress={handleCreate}
            disabled={!canCreate}
          />
        </View>
      }
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.form}
      >
        <OnboardingInput
          placeholder="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={MAX_NAME_LENGTH}
          autoFocus
          returnKeyType="done"
          style={styles.input}
        />
        <Text style={styles.counter}>
          {trimmedName.length}/{MAX_NAME_LENGTH}
        </Text>
      </KeyboardAvoidingView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    backgroundColor: colors.cream,
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
  },
  cookingBody: {
    ...typography.body,
    color: opacity.ink60,
  },
  cookingTitle: {
    ...typography.headingCard,
    color: colors.ink,
    fontSize: 20,
    lineHeight: 26,
    marginTop: spacing.md,
  },
  counter: {
    alignSelf: "flex-end",
    color: opacity.ink55,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  form: {
    flex: 1,
    marginTop: spacing.lg,
  },
  input: {
    fontSize: 28,
    lineHeight: 34,
    textAlign: "center",
  },
  footerCol: {
    width: "100%",
  },
  policyLink: {
    color: colors.ink,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  policyNote: {
    color: opacity.ink55,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  root: {
    backgroundColor: colors.cream,
    flex: 1,
  },
});

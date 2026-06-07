import { useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { APP_ROUTES } from "@world-cup-game/config";
import { RenderedPlayerCard } from "../../src/features/card";
import { useOnboarding } from "../../src/features/onboarding";
import { OnboardingButton, OnboardingShell } from "../../src/components/onboarding";
import { opacity } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

export default function CardPreviewScreen() {
  const router = useRouter();
  const { nation, displayName, photoSource, reset } = useOnboarding();

  const friendlyName = displayName.trim() || "Your Footballer";

  const handleStartOver = () => {
    Alert.alert(
      "Start over?",
      "This clears your nation, photo, and name. You can rebuild your card from scratch.",
      [
        { text: "Keep this card", style: "cancel" },
        {
          text: "Start over",
          style: "destructive",
          onPress: () => {
            reset();
            router.navigate(APP_ROUTES.onboarding.selectNation);
          },
        },
      ]
    );
  };

  return (
    <OnboardingShell
      step={4}
      totalSteps={4}
      title={`Meet ${friendlyName}`}
      subtitle="Sign up to generate your AI card"
      footer={
        <OnboardingButton
          label="Create account to save"
          onPress={() => router.push(APP_ROUTES.auth.signUp)}
        />
      }
    >
      <RenderedPlayerCard
        concealUntilGenerated
        displayName={displayName}
        photoSource={photoSource}
        selectedNationCode={nation?.code}
      />

      <Pressable onPress={handleStartOver} style={styles.startOverWrap}>
        <Text style={styles.startOver}>Start over</Text>
      </Pressable>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  startOver: {
    ...typography.caption,
    color: opacity.ink55,
    textAlign: "center",
  },
  startOverWrap: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
});

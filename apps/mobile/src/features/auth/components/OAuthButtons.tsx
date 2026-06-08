import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { APP_ROUTES } from "@world-cup-game/config";
import type { AuthProvider } from "@world-cup-game/types";
import { AuthOptionRow } from "../../../components/auth";
import { spacing } from "../../../theme/spacing";
import { saveCompletedOnboarding, useOnboarding } from "../../onboarding";
import { signInWithProvider } from "../api/signInWithProvider";

type OAuthButtonProvider = Extract<AuthProvider, "apple" | "google">;

const PROVIDERS: Array<{
  label: string;
  provider: OAuthButtonProvider;
}> = [
  { label: "Continue with Google", provider: "google" },
  { label: "Continue with Apple", provider: "apple" },
];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Please try again.";
}

export function OAuthButtons() {
  const router = useRouter();
  const onboarding = useOnboarding();
  const [loadingProvider, setLoadingProvider] = useState<OAuthButtonProvider | null>(null);

  const handlePress = async (provider: OAuthButtonProvider) => {
    setLoadingProvider(provider);

    try {
      const session = await signInWithProvider(provider);

      if (session) {
        try {
          await saveCompletedOnboarding(onboarding);
        } catch (saveError) {
          Alert.alert("Card save failed", getErrorMessage(saveError));
        }

        router.replace(APP_ROUTES.tabs.home);
      }
    } catch (error) {
      Alert.alert("Sign-in failed", getErrorMessage(error));
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <View style={styles.root}>
      {PROVIDERS.map((item) => (
        <AuthOptionRow
          key={item.provider}
          label={item.label}
          onPress={() => void handlePress(item.provider)}
          disabled={loadingProvider !== null}
          loading={loadingProvider === item.provider}
          variant="secondary"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: spacing.sm,
  },
});

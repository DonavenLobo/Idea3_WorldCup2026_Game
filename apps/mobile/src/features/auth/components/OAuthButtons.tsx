import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { APP_ROUTES } from "@world-cup-game/config";
import type { AuthProvider } from "@world-cup-game/types";
import { AuthOptionRow } from "../../../components/auth";
import { spacing } from "../../../theme/spacing";
import { useOnboarding } from "../../onboarding";
import { finalizeSignIn } from "../api/finalizeSignIn";
import { signInWithProvider } from "../api/signInWithProvider";

type OAuthButtonProvider = Extract<AuthProvider, "apple" | "google">;

const PROVIDERS: Array<{
  label: string;
  provider: OAuthButtonProvider;
  variant: "primary" | "secondary";
}> = [
  { label: "Continue with Google", provider: "google", variant: "primary" },
  { label: "Continue with Apple", provider: "apple", variant: "secondary" },
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

      if (!session) {
        return;
      }

      const outcome = await finalizeSignIn(onboarding);

      if (outcome === "needs-onboarding") {
        Alert.alert(
          "No account yet",
          "We couldn't find a GoGaffa account for that login. Let's create your footballer card first."
        );
        router.replace(APP_ROUTES.onboarding.selectNation);
        return;
      }

      router.replace(APP_ROUTES.tabs.home);
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
          variant={item.variant}
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

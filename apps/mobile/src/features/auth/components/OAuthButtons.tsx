import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { APP_ROUTES } from "@world-cup-game/config";
import type { AuthProvider } from "@world-cup-game/types";
import { signInWithProvider } from "../api/signInWithProvider";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

type OAuthButtonProvider = Extract<AuthProvider, "apple" | "google">;

const PROVIDERS: Array<{
  label: string;
  provider: OAuthButtonProvider;
  variant: "dark" | "light";
}> = [
  {
    label: "Continue with Google",
    provider: "google",
    variant: "light"
  },
  {
    label: "Continue with Apple",
    provider: "apple",
    variant: "dark"
  }
];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Please try again.";
}

export function OAuthButtons() {
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<OAuthButtonProvider | null>(null);

  const handlePress = async (provider: OAuthButtonProvider) => {
    setLoadingProvider(provider);

    try {
      const session = await signInWithProvider(provider);

      if (session) {
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
      {PROVIDERS.map((item) => {
        const isLoading = loadingProvider === item.provider;
        const isDisabled = loadingProvider !== null;
        const buttonStyle = item.variant === "dark" ? styles.darkButton : styles.lightButton;
        const textStyle = item.variant === "dark" ? styles.darkButtonText : styles.lightButtonText;

        return (
          <Pressable
            disabled={isDisabled}
            key={item.provider}
            onPress={() => void handlePress(item.provider)}
            style={[styles.button, buttonStyle, isDisabled ? styles.disabled : null]}
          >
            <Text style={textStyle}>{isLoading ? "Opening..." : item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 2,
    padding: spacing.md
  },
  darkButton: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  darkButtonText: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: "900"
  },
  disabled: {
    opacity: 0.65
  },
  lightButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(12, 59, 46, 0.18)"
  },
  lightButtonText: {
    color: colors.pitch,
    fontSize: 16,
    fontWeight: "900"
  },
  root: {
    gap: spacing.sm,
    marginTop: spacing.md
  }
});

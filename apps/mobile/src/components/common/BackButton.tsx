import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { spacing } from "../../theme/spacing";

interface BackButtonProps {
  /** Choose "light" for dark (pitch) backgrounds, "dark" for cream backgrounds. */
  variant?: "light" | "dark";
  /** Optional override; defaults to router.back(). */
  onPress?: () => void;
}

export function BackButton({ variant = "dark", onPress }: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    }
  };

  const isLight = variant === "light";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={12}
      onPress={handlePress}
      style={[
        styles.button,
        isLight ? styles.buttonLight : styles.buttonDark
      ]}
    >
      <Text style={[styles.text, isLight ? styles.textLight : styles.textDark]}>
        ‹ Back
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    borderWidth: 1,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  buttonDark: {
    backgroundColor: "rgba(12, 59, 46, 0.06)",
    borderColor: "rgba(12, 59, 46, 0.16)"
  },
  buttonLight: {
    backgroundColor: "rgba(255, 248, 234, 0.08)",
    borderColor: "rgba(255, 248, 234, 0.25)"
  },
  text: {
    fontSize: 14,
    fontWeight: "800"
  },
  textDark: {
    color: colors.pitch
  },
  textLight: {
    color: colors.cream
  }
});

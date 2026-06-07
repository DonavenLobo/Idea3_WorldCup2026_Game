import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

interface BackButtonProps {
  /** Choose "light" for dark (ink) backgrounds, "dark" for cream backgrounds. */
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
      style={styles.button}
    >
      <Text style={[styles.text, isLight ? styles.textLight : styles.textDark]}>
        ‹ Back
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    marginBottom: spacing.md,
  },
  text: {
    ...typography.input,
    fontSize: 24,
    lineHeight: 28,
  },
  textDark: {
    color: colors.ink,
  },
  textLight: {
    color: colors.cream,
  },
});

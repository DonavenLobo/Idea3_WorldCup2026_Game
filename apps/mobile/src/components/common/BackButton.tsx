import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../../theme/colors";

interface BackButtonProps {
  tint?: "dark" | "light";
  onPress?: () => void;
}

/**
 * Small absolute-positioned back chevron for screens without a header.
 * Use tint="dark" on cream backgrounds, tint="light" on pitch backgrounds.
 */
export function BackButton({ tint = "dark", onPress }: BackButtonProps) {
  const router = useRouter();
  const handlePress = () => {
    if (onPress) onPress();
    else router.back();
  };

  return (
    <Pressable
      style={[
        styles.button,
        tint === "light" ? styles.buttonLight : styles.buttonDark
      ]}
      onPress={handlePress}
      hitSlop={8}
    >
      <Text style={tint === "light" ? styles.textLight : styles.textDark}>←</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    left: 16,
    position: "absolute",
    top: 16,
    width: 36,
    zIndex: 10
  },
  buttonDark: {
    backgroundColor: "rgba(12, 59, 46, 0.08)"
  },
  buttonLight: {
    backgroundColor: "rgba(255, 248, 234, 0.14)"
  },
  textDark: {
    color: colors.pitch,
    fontSize: 20,
    fontWeight: "900"
  },
  textLight: {
    color: colors.cream,
    fontSize: 20,
    fontWeight: "900"
  }
});

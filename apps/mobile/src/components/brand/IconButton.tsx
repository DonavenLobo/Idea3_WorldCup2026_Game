import type { ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";
import { colors, opacity } from "../../theme/colors";
import { pressableFeedback } from "../../theme/pressable";

export interface IconButtonProps {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  size?: number;
}

export function IconButton({ children, onPress, disabled = false, size = 40 }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.root,
        { height: size, width: size, borderRadius: size / 2 },
        pressed && !disabled && pressableFeedback(true),
        disabled && styles.disabled,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.25,
  },
  root: {
    alignItems: "center",
    backgroundColor: opacity.cream80,
    borderColor: colors.ink,
    borderWidth: 2,
    justifyContent: "center",
  },
});

import type { ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Text } from "react-native";

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "default" | "large";
  disabled?: boolean;
  icon?: ReactNode;
}

const FONT_INTER_SEMIBOLD = "Inter_600SemiBold";

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "default",
  disabled = false,
  icon,
}: ButtonProps) {
  const shadowStyle =
    variant === "ghost"
      ? undefined
      : Platform.select({
          ios: {
            shadowColor: "#1a1a2e",
            shadowOffset: { width: size === "large" ? 4 : 3, height: size === "large" ? 4 : 3 },
            shadowOpacity: disabled ? 0 : 1,
            shadowRadius: 0,
          },
          android: { elevation: disabled ? 0 : size === "large" ? 6 : 4 },
        });

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === "large" ? styles.large : styles.default,
        variant !== "ghost" && styles.bordered,
        styles[variant],
        shadowStyle,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.label,
          variant !== "primary" && styles.secondaryLabel,
          variant === "ghost" && styles.ghostLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 20,
  },
  bordered: {
    borderColor: "#1a1a2e",
    borderWidth: 2,
  },
  default: {
    borderRadius: 12,
    paddingVertical: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  ghostLabel: {
    color: "#1a1a2e",
  },
  label: {
    color: "#f5f0e8",
    fontFamily: FONT_INTER_SEMIBOLD,
    fontSize: 15,
    lineHeight: 20,
  },
  large: {
    borderRadius: 12,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  primary: {
    backgroundColor: "#e63946",
  },
  secondary: {
    backgroundColor: "#f5f0e8",
  },
  secondaryLabel: {
    color: "#1a1a2e",
  },
});

import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  icon?: ReactNode;
}

export function Button({ label, onPress, variant = "primary", disabled = false, icon }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.base, styles[variant], disabled && styles.disabled]}
    >
      {icon}
      <Text style={[styles.label, variant === "secondary" && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 20
  },
  disabled: {
    opacity: 0.5
  },
  label: {
    color: "#FFF8EA",
    fontSize: 16,
    fontWeight: "800"
  },
  primary: {
    backgroundColor: "#0C3B2E"
  },
  secondary: {
    backgroundColor: "#FFF8EA",
    borderColor: "#0C3B2E",
    borderWidth: 1
  },
  secondaryLabel: {
    color: "#0C3B2E"
  }
});

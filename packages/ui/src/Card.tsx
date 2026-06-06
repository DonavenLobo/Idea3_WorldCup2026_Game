import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

export interface CardProps {
  children: ReactNode;
  variant?: "surface" | "outlined";
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, variant = "surface", style }: CardProps) {
  return (
    <View style={[styles.card, variant === "outlined" && styles.outlined, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(26, 26, 46, 0.12)",
    borderRadius: 16,
    padding: 16,
  },
  outlined: {
    backgroundColor: "#f5f0e8",
    borderColor: "#e63946",
    borderWidth: 2,
  },
});

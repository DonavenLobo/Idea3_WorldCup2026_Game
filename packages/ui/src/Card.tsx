import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

export interface CardProps {
  children: ReactNode;
}

export function Card({ children }: CardProps) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF8EA",
    borderColor: "rgba(12, 59, 46, 0.12)",
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#0C3B2E",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24
  }
});

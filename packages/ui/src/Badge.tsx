import { StyleSheet, Text, View } from "react-native";

export interface BadgeProps {
  label: string;
  tone?: "neutral" | "success" | "warning";
}

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[tone]]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  label: {
    color: "#0C3B2E",
    fontSize: 12,
    fontWeight: "800"
  },
  neutral: {
    backgroundColor: "#E9E4D4"
  },
  success: {
    backgroundColor: "#BFE8C5"
  },
  warning: {
    backgroundColor: "#FFE0A3"
  }
});

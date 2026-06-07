import { StyleSheet, Text, View } from "react-native";

export interface BadgeProps {
  label: string;
  tone?: "neutral" | "success" | "warning";
}

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[tone]]}>
      <Text style={[styles.label, tone === "success" && styles.successLabel]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    color: "#1a1a2e",
    fontSize: 12,
    fontWeight: "700",
  },
  neutral: {
    backgroundColor: "rgba(26, 26, 46, 0.08)",
  },
  success: {
    backgroundColor: "rgba(47, 122, 77, 0.15)",
  },
  successLabel: {
    color: "#2f7a4d",
  },
  warning: {
    backgroundColor: "rgba(230, 57, 70, 0.12)",
  },
});

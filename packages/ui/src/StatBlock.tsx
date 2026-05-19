import { StyleSheet, Text, View } from "react-native";

export interface StatBlockProps {
  label: string;
  value: number | string;
}

export function StatBlock({ label, value }: StatBlockProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: "rgba(12, 59, 46, 0.66)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8
  },
  root: {
    alignItems: "center",
    gap: 2
  },
  value: {
    color: "#0C3B2E",
    fontSize: 20,
    fontWeight: "900"
  }
});

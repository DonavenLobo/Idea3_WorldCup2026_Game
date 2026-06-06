import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export interface LoadingStateProps {
  label: string;
}

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <View style={styles.root}>
      <ActivityIndicator color="#e63946" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: "#1a1a2e",
    fontSize: 15,
    fontWeight: "600",
  },
  root: {
    alignItems: "center",
    gap: 12,
    padding: 24,
  },
});

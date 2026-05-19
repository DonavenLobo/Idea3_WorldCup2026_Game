import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export interface LoadingStateProps {
  label: string;
}

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <View style={styles.root}>
      <ActivityIndicator color="#0C3B2E" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: "#0C3B2E",
    fontSize: 15,
    fontWeight: "700"
  },
  root: {
    alignItems: "center",
    gap: 12,
    padding: 24
  }
});

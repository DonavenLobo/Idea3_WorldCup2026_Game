import { StyleSheet, Text, View } from "react-native";

export interface EmptyStateProps {
  title: string;
  body?: string;
}

export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: "rgba(26, 26, 46, 0.70)",
    fontSize: 15,
    textAlign: "center",
  },
  root: {
    alignItems: "center",
    gap: 8,
    padding: 24,
  },
  title: {
    color: "#1a1a2e",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});

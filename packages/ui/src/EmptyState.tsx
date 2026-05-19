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
    color: "rgba(12, 59, 46, 0.68)",
    fontSize: 15,
    textAlign: "center"
  },
  root: {
    alignItems: "center",
    gap: 8,
    padding: 24
  },
  title: {
    color: "#0C3B2E",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center"
  }
});

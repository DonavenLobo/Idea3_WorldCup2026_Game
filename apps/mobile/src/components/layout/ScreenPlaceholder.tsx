import { StyleSheet, Text, View } from "react-native";

export interface ScreenPlaceholderProps {
  title: string;
  body?: string;
}

export function ScreenPlaceholder({ title, body }: ScreenPlaceholderProps) {
  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>World Cup Game</Text>
        <Text style={styles.title}>{title}</Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: "rgba(12, 59, 46, 0.72)",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center"
  },
  card: {
    backgroundColor: "#FFF8EA",
    borderColor: "rgba(12, 59, 46, 0.14)",
    borderRadius: 32,
    borderWidth: 1,
    gap: 12,
    padding: 24
  },
  eyebrow: {
    color: "#D6A11E",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
    textAlign: "center",
    textTransform: "uppercase"
  },
  root: {
    backgroundColor: "#E9E4D4",
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  title: {
    color: "#0C3B2E",
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center"
  }
});

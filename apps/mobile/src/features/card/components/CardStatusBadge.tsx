import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { CardStatus } from "@world-cup-game/types";

interface CardStatusBadgeProps {
  isRetrying?: boolean;
  onRetry?: () => void;
  status?: CardStatus;
}

export function CardStatusBadge({ isRetrying, onRetry, status }: CardStatusBadgeProps) {
  if (status === "generating_avatar") {
    return (
      <View style={styles.badge}>
        <ActivityIndicator size="small" color="#FFF8EA" />
        <Text style={styles.text}>Generating your card...</Text>
      </View>
    );
  }

  if (status === "failed") {
    return (
      <Pressable
        accessibilityRole={onRetry ? "button" : undefined}
        disabled={!onRetry || isRetrying}
        onPress={onRetry}
        style={({ pressed }) => [
          styles.badge,
          styles.error,
          pressed && onRetry ? styles.pressed : null
        ]}
      >
        {isRetrying ? <ActivityIndicator size="small" color="#FFF8EA" /> : null}
        <Text style={styles.text}>{onRetry ? "Retry generation" : "Generation failed"}</Text>
      </Pressable>
    );
  }

  if (status === "moderation_rejected") {
    return (
      <View style={[styles.badge, styles.error]}>
        <Text style={styles.text}>Photo not accepted - try another</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(12, 59, 46, 0.85)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  error: {
    backgroundColor: "rgba(140, 30, 30, 0.9)"
  },
  pressed: {
    opacity: 0.82
  },
  text: {
    color: "#FFF8EA",
    fontSize: 13,
    fontWeight: "900"
  }
});

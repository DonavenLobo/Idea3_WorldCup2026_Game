import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

interface PhotoChoiceButtonProps {
  emoji: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

export function PhotoChoiceButton({ emoji, title, subtitle, onPress }: PhotoChoiceButtonProps) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(12, 59, 46, 0.12)",
    borderRadius: radius.md,
    borderWidth: 2,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg
  },
  emoji: {
    fontSize: 34
  },
  subtitle: {
    color: "rgba(12, 59, 46, 0.6)",
    fontSize: 13,
    lineHeight: 18
  },
  text: {
    flex: 1,
    gap: 2
  },
  title: {
    color: colors.pitch,
    fontSize: 17,
    fontWeight: "800"
  }
});

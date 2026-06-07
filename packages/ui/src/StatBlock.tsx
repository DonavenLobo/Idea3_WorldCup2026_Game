import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, Text, View } from "react-native";

const INK = "#1A1F2E";
const RED = "#E63946";

export interface StatBlockProps {
  label: string;
  value: number | string;
  style?: StyleProp<ViewStyle>;
}

export function StatBlock({ label, value, style }: StatBlockProps) {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.valueSlot}>
        <Text style={styles.value}>{value}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.underline} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: "rgba(26, 31, 46, 0.60)",
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.6,
    lineHeight: 14,
    marginTop: 2,
    textTransform: "uppercase",
  },
  root: {
    alignItems: "center",
    borderColor: "rgba(26, 31, 46, 0.15)",
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  underline: {
    backgroundColor: RED,
    borderRadius: 1,
    height: 2,
    marginTop: 4,
    width: 24,
  },
  value: {
    color: INK,
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    fontVariant: ["tabular-nums"],
    lineHeight: 24,
  },
  valueSlot: {
    alignItems: "center",
    height: 24,
    justifyContent: "flex-end",
    width: "100%",
  },
});

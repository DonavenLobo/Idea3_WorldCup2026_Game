import { StyleSheet, View, type DimensionValue } from "react-native";

export interface ProgressBarProps {
  value: number;
  max: number;
}

export function ProgressBar({ value, max }: ProgressBarProps) {
  const width = `${Math.max(0, Math.min(100, (value / max) * 100))}%` as DimensionValue;

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    backgroundColor: "#D6A11E",
    borderRadius: 999,
    height: "100%"
  },
  track: {
    backgroundColor: "rgba(12, 59, 46, 0.14)",
    borderRadius: 999,
    height: 10,
    overflow: "hidden",
    width: "100%"
  }
});

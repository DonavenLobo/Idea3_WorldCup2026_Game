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
    backgroundColor: "#e63946",
    borderRadius: 999,
    height: "100%",
  },
  track: {
    backgroundColor: "rgba(26, 26, 46, 0.12)",
    borderRadius: 999,
    height: 10,
    overflow: "hidden",
    width: "100%",
  },
});

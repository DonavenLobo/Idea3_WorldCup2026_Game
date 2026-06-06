import { StyleSheet, Text } from "react-native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

export type EyebrowAccent = "red" | "blue" | "purple";

const accentColors: Record<EyebrowAccent, string> = {
  red: colors.red,
  blue: colors.blue,
  purple: colors.purple,
};

export interface EyebrowProps {
  label: string;
  accent?: EyebrowAccent;
}

export function Eyebrow({ label, accent = "red" }: EyebrowProps) {
  return <Text style={[styles.root, { color: accentColors[accent] }]}>{label}</Text>;
}

const styles = StyleSheet.create({
  root: {
    ...typography.eyebrow,
  },
});

import { CARD_STATS } from "@world-cup-game/config";
import type { CardStats, CardTemplateMetadata } from "@world-cup-game/types";
import { StyleSheet, Text, View } from "react-native";

export interface PlayerStatsLayerProps {
  stats: CardStats;
  layer: CardTemplateMetadata["layers"]["stats"];
}

export function PlayerStatsLayer({ stats, layer }: PlayerStatsLayerProps) {
  return (
    <>
      {layer.columns.map((column) => {
        const stat = CARD_STATS.find((candidate) => candidate.key === column.key);

        return (
          <View key={column.key} style={[styles.stat, { left: column.x, top: layer.y }]}>
            <Text style={[styles.value, { color: layer.color, fontSize: layer.valueFontSize }]}>
              {stats[column.key]}
            </Text>
            <Text style={[styles.label, { color: layer.color, fontSize: layer.labelFontSize }]}>
              {stat?.label ?? column.key.toUpperCase()}
            </Text>
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "800"
  },
  stat: {
    alignItems: "center",
    position: "absolute"
  },
  value: {
    fontWeight: "900"
  }
});

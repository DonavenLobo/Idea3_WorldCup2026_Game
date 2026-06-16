import { CARD_STATS } from "@gogaffa/config";
import type { CardStats, CardTemplateMetadata } from "@gogaffa/types";
import { StyleSheet, Text, View } from "react-native";
import { resolveLayerFontStyle } from "../utils/layerTextStyle";

export interface PlayerStatsLayerProps {
  stats: CardStats;
  layer: CardTemplateMetadata["layers"]["stats"];
}

export function PlayerStatsLayer({ stats, layer }: PlayerStatsLayerProps) {
  const showLabels = layer.showLabels ?? true;

  return (
    <>
      {layer.columns.map((column) => {
        const stat = CARD_STATS.find((candidate) => candidate.key === column.key);

        return (
          <View
            key={column.key}
            style={[
              styles.stat,
              {
                left: column.x,
                top: layer.y,
                width: column.width
              }
            ]}
          >
            <Text
              style={[
                styles.value,
                {
                  color: layer.color,
                  fontSize: layer.valueFontSize,
                  textAlign: layer.align,
                  ...resolveLayerFontStyle(layer),
                }
              ]}
            >
              {stats[column.key]}
            </Text>
            {showLabels ? (
              <Text
                style={[
                  styles.label,
                  {
                    color: layer.color,
                    fontSize: layer.labelFontSize,
                    ...resolveLayerFontStyle(layer),
                  },
                ]}
              >
                {stat?.label ?? column.key.toUpperCase()}
              </Text>
            ) : null}
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  label: {},
  stat: {
    alignItems: "center",
    position: "absolute"
  },
  value: {},
});

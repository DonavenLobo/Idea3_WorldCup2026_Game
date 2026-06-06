import { CARD_STATS } from "@world-cup-game/config";
import type { CardStats } from "@world-cup-game/types";
import { useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";

/**
 * Fine-tune these % positions to center each value inside the stat boxes
 * drawn on the card image. Order: HYP, FRM, ATK, AST, WAL, LCK.
 *
 * `left` / `top` are the anchor point for each slot (center of the drawn box).
 */
export const STAT_VALUE_OVERLAY_POSITIONS: ReadonlyArray<{
  left: number;
  top: number;
}> = [
  { left: 19.5, top: 83 },
  { left: 31.5, top: 83 },
  { left: 44, top: 83 },
  { left: 56, top: 83 },
  { left: 68.5, top: 83 },
  { left: 80.5, top: 83 },
];

/** Width of each stat slot as a % of the card image container. */
const STAT_SLOT_WIDTH_PCT = 12;

export interface CardStatOverlaysProps {
  stats: CardStats;
}

export function CardStatOverlays({ stats }: CardStatOverlaysProps) {
  const [imageWidth, setImageWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setImageWidth((current) => (Math.abs(current - nextWidth) < 1 ? current : nextWidth));
  };

  const fontSize = imageWidth > 0 ? imageWidth * 0.045 : 16;

  return (
    <View pointerEvents="none" style={styles.overlay} onLayout={handleLayout}>
      {CARD_STATS.map((stat, index) => {
        const position = STAT_VALUE_OVERLAY_POSITIONS[index];
        if (!position) return null;

        return (
          <View
            key={stat.key}
            style={[
              styles.slot,
              {
                left: `${position.left - STAT_SLOT_WIDTH_PCT / 2}%`,
                top: `${position.top}%`,
                width: `${STAT_SLOT_WIDTH_PCT}%`,
              },
            ]}
          >
            <Text style={[styles.value, { fontSize }]}>{stats[stat.key]}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  slot: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  value: {
    color: colors.ink,
    fontFamily: "Inter_700Bold",
    fontVariant: ["tabular-nums"],
    textAlign: "center",
    width: "100%",
  },
});

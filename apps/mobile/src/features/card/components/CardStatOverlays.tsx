import { CARD_STATS } from "@world-cup-game/config";
import type { CardStats } from "@world-cup-game/types";
import { useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { fontFamily } from "../../../theme/typography";

/** Caveat reads smaller than Inter at the same px — scale to match template (~42/1024). */
const SKETCH_STAT_FONT_SCALE = 0.059;

/**
 * Stat overlay tuning (percent of card width/height):
 * - Positions → `STAT_VALUE_OVERLAY_POSITIONS` below (center of each drawn box)
 * - Size → `SKETCH_STAT_FONT_SCALE`
 *
 * OVR + player name also use overlays — see `CardTextOverlays.tsx` + `templates/level00SketchTemplate.ts`.
 * Order: HYP, FRM, ATK, AST, WAL, LCK.
 */
export const STAT_VALUE_OVERLAY_POSITIONS: ReadonlyArray<{
  left: number;
  top: number;
}> = [
  { left: 19, top: 83 },
  { left: 31.5, top: 83 },
  { left: 43.5, top: 83 },
  { left: 55.5, top: 83 },
  { left: 68, top: 83 },
  { left: 80, top: 83 },
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

  const fontSize = imageWidth > 0 ? imageWidth * SKETCH_STAT_FONT_SCALE : 18;
  const lineHeight = fontSize * 1.15;

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
            <Text style={[styles.value, { fontSize, lineHeight }]}>
              {stats[stat.key]}
            </Text>
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
    fontFamily: fontFamily.caveatBold,
    fontWeight: "normal",
    includeFontPadding: false,
    paddingHorizontal: 2,
    textAlign: "center",
    width: "100%",
  },
});

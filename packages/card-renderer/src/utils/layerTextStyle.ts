import type { CardTemplateLayerMetadata } from "@world-cup-game/types";
import type { TextStyle } from "react-native";

type LayerFont = Pick<CardTemplateLayerMetadata, "fontFamily" | "fontWeight">;

/**
 * Custom font files (e.g. Caveat_700Bold) embed their weight — setting fontWeight
 * alongside fontFamily makes React Native fall back to the system bold font.
 */
export function resolveLayerFontStyle(layer: LayerFont): Pick<TextStyle, "fontFamily" | "fontWeight"> {
  if (layer.fontFamily) {
    return {
      fontFamily: layer.fontFamily,
      fontWeight: "normal",
    };
  }

  return { fontWeight: (layer.fontWeight ?? "700") as "700" };
}

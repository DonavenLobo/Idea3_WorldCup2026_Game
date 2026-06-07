import { loadTemplate } from "@world-cup-game/card-renderer";
import type { PlayerCardRenderTemplate } from "@world-cup-game/card-renderer";
import type { CardTemplateMetadata } from "@world-cup-game/types";
import type { ImageSourcePropType } from "react-native";
import { fontFamily } from "../../../theme/typography";

/**
 * Sketch card layout — coordinates are template pixels on a 1024×1536 canvas.
 *
 * Manual tuning guide:
 * - OVR number + "OVR" label → `layers.overall` (x, y, width, fontSize, labelX, labelY, labelFontSize)
 * - Player name → `layers.displayName` (x, y, width, height, fontSize)
 * - Stat values (overlay) → `../components/CardStatOverlays.tsx`
 *   (`STAT_VALUE_OVERLAY_POSITIONS`, `SKETCH_STAT_FONT_SCALE`)
 * - OVR + name render via `../components/CardTextOverlays.tsx` (reads this file live)
 *
 * Bold sketch look: change `SKETCH_FONT` only — never set `fontWeight` with Caveat
 * (RN falls back to system font). Use `caveatBold`, `caveatSemiBold`, etc.
 */
export const LEVEL_00_SKETCH_TEMPLATE_KEY = "level-00-sketch-v1";

export const LEVEL_00_SKETCH_SOURCE = require("../../../../assets/card-templates/level-00-sketch-v1.png") as ImageSourcePropType;

const SKETCH_FONT = fontFamily.caveatBold;

export const LEVEL_00_SKETCH_METADATA = {
  id: LEVEL_00_SKETCH_TEMPLATE_KEY,
  name: "Sketch Card Level 00",
  version: 1,
  width: 1024,
  height: 1536,
  safeArea: {
    x: 94,
    y: 96,
    width: 836,
    height: 1344
  },
  layers: {
    overall: {
      x: 120,
      y: 185,
      width: 150,
      fontSize: 130,
      fontFamily: SKETCH_FONT,
      color: "#1a1a2e",
      align: "center",
      label: "OVR",
      labelFontSize: 55,
      labelX: 120,
      labelY: 150
    },
    avatar: {
      x: 235,
      y: 220,
      width: 565,
      height: 735,
      fit: "cover"
    },
    displayName: {
      x: 205,
      y: 1034,
      width: 614,
      height: 70,
      fontSize: 65,
      fontFamily: SKETCH_FONT,
      color: "#1a1a2e",
      align: "center"
    },
    /** Not used at runtime — stats render via CardStatOverlays.tsx (renderStatValues=false). */
    stats: {
      x: 0,
      y: 1272,
      columns: [
        { key: "hyp", x: 154, width: 82 },
        { key: "frm", x: 278, width: 82 },
        { key: "atk", x: 402, width: 82 },
        { key: "ast", x: 526, width: 82 },
        { key: "wal", x: 650, width: 82 },
        { key: "lck", x: 774, width: 82 }
      ],
      labelFontSize: 0,
      valueFontSize: 42,
      fontFamily: SKETCH_FONT,
      color: "#1a1a2e",
      align: "center",
      showLabels: false
    },
    badge: {
      x: 735,
      y: 155,
      width: 150,
      height: 132,
      fontSize: 100,
      backgroundColor: "transparent",
      color: "#1a1a2e"
    }
  }
} satisfies CardTemplateMetadata;

export const LEVEL_00_SKETCH_TEMPLATE: PlayerCardRenderTemplate = loadTemplate({
  id: LEVEL_00_SKETCH_TEMPLATE_KEY,
  templateKey: LEVEL_00_SKETCH_TEMPLATE_KEY,
  name: "Sketch Card Level 00",
  baseImageSource: LEVEL_00_SKETCH_SOURCE,
  metadata: LEVEL_00_SKETCH_METADATA
});

export function getBundledTemplateSource(templateKey: string): ImageSourcePropType | undefined {
  return templateKey === LEVEL_00_SKETCH_TEMPLATE_KEY ? LEVEL_00_SKETCH_SOURCE : undefined;
}

export function isLevel00SketchTemplate(template: PlayerCardRenderTemplate): boolean {
  return (
    template.templateKey === LEVEL_00_SKETCH_TEMPLATE_KEY
    || template.metadata.id === LEVEL_00_SKETCH_TEMPLATE_KEY
    || template.id === LEVEL_00_SKETCH_TEMPLATE_KEY
  );
}

/**
 * Always read live bundled metadata for the sketch template so local edits in this
 * file apply immediately (React Query caches a snapshot from the first fetch).
 */
export function applyBundledSketchMetadata(
  template: PlayerCardRenderTemplate
): PlayerCardRenderTemplate {
  if (!isLevel00SketchTemplate(template)) {
    return template;
  }

  return {
    ...template,
    baseImageSource: template.baseImageSource ?? LEVEL_00_SKETCH_SOURCE,
    metadata: LEVEL_00_SKETCH_METADATA,
  };
}

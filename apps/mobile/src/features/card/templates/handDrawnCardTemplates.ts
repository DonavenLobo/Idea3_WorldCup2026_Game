import { loadTemplate } from "@world-cup-game/card-renderer";
import type { PlayerCardRenderTemplate } from "@world-cup-game/card-renderer";
import type { CardTemplateMetadata } from "@world-cup-game/types";
import type { ImageSourcePropType } from "react-native";
import { fontFamily } from "../../../theme/typography";
import {
  LEVEL_00_SKETCH_METADATA,
  LEVEL_00_SKETCH_SOURCE,
  LEVEL_00_SKETCH_TEMPLATE,
  LEVEL_00_SKETCH_TEMPLATE_KEY,
} from "./level00SketchTemplate";

export const LEVEL_02_BASE_TEMPLATE_KEY = "level-02-base-v1";
export const LEVEL_03_BASE_TEMPLATE_KEY = "level-03-base-v1";
export const LEVEL_04_BASE_TEMPLATE_KEY = "level-04-base-v1";

export const DEFAULT_CARD_TEMPLATE_KEY = LEVEL_02_BASE_TEMPLATE_KEY;

const SKETCH_FONT = fontFamily.caveatBold;

const HAND_DRAWN_LAYER_METADATA = {
  overall: {
    x: 120,
    y: 185,
    width: 150,
    fontSize: 130,
    fontFamily: SKETCH_FONT,
    color: "#1a1a2e",
    align: "center" as const,
    label: "OVR",
    labelFontSize: 55,
    labelX: 120,
    labelY: 150,
  },
  avatar: {
    x: 235,
    y: 220,
    width: 565,
    height: 735,
    fit: "cover" as const,
  },
  displayName: {
    x: 205,
    y: 1034,
    width: 614,
    height: 70,
    fontSize: 65,
    fontFamily: SKETCH_FONT,
    color: "#1a1a2e",
    align: "center" as const,
  },
  stats: {
    x: 0,
    y: 1272,
    columns: [
      { key: "hyp" as const, x: 154, width: 82 },
      { key: "frm" as const, x: 278, width: 82 },
      { key: "atk" as const, x: 402, width: 82 },
      { key: "ast" as const, x: 526, width: 82 },
      { key: "wal" as const, x: 650, width: 82 },
      { key: "lck" as const, x: 774, width: 82 },
    ],
    labelFontSize: 0,
    valueFontSize: 42,
    fontFamily: SKETCH_FONT,
    color: "#1a1a2e",
    align: "center" as const,
    showLabels: false,
  },
  badge: {
    x: 735,
    y: 155,
    width: 150,
    height: 132,
    fontSize: 100,
    backgroundColor: "transparent",
    color: "#1a1a2e",
  },
};

function createHandDrawnMetadata(
  id: string,
  name: string
): CardTemplateMetadata {
  return {
    id,
    name,
    version: 1,
    width: 1024,
    height: 1536,
    safeArea: {
      x: 94,
      y: 96,
      width: 836,
      height: 1344,
    },
    layers: HAND_DRAWN_LAYER_METADATA,
  };
}

export const LEVEL_02_BASE_SOURCE = require("../../../../assets/card-templates/level-02-base-v1.png") as ImageSourcePropType;
export const LEVEL_03_BASE_SOURCE = require("../../../../assets/card-templates/level-03-base-v1.png") as ImageSourcePropType;
export const LEVEL_04_BASE_SOURCE = require("../../../../assets/card-templates/level-04-base-v1.png") as ImageSourcePropType;

export const LEVEL_02_BASE_METADATA = createHandDrawnMetadata(
  LEVEL_02_BASE_TEMPLATE_KEY,
  "Base Card Page 2"
);
export const LEVEL_03_BASE_METADATA = createHandDrawnMetadata(
  LEVEL_03_BASE_TEMPLATE_KEY,
  "Base Card Page 3"
);
export const LEVEL_04_BASE_METADATA = createHandDrawnMetadata(
  LEVEL_04_BASE_TEMPLATE_KEY,
  "Base Card Page 4"
);

export const LEVEL_02_BASE_TEMPLATE: PlayerCardRenderTemplate = loadTemplate({
  id: LEVEL_02_BASE_TEMPLATE_KEY,
  templateKey: LEVEL_02_BASE_TEMPLATE_KEY,
  name: "Base Card Page 2",
  baseImageSource: LEVEL_02_BASE_SOURCE,
  metadata: LEVEL_02_BASE_METADATA,
});

export const LEVEL_03_BASE_TEMPLATE: PlayerCardRenderTemplate = loadTemplate({
  id: LEVEL_03_BASE_TEMPLATE_KEY,
  templateKey: LEVEL_03_BASE_TEMPLATE_KEY,
  name: "Base Card Page 3",
  baseImageSource: LEVEL_03_BASE_SOURCE,
  metadata: LEVEL_03_BASE_METADATA,
});

export const LEVEL_04_BASE_TEMPLATE: PlayerCardRenderTemplate = loadTemplate({
  id: LEVEL_04_BASE_TEMPLATE_KEY,
  templateKey: LEVEL_04_BASE_TEMPLATE_KEY,
  name: "Base Card Page 4",
  baseImageSource: LEVEL_04_BASE_SOURCE,
  metadata: LEVEL_04_BASE_METADATA,
});

const BUNDLED_TEMPLATE_SOURCES: Record<string, ImageSourcePropType> = {
  [LEVEL_00_SKETCH_TEMPLATE_KEY]: LEVEL_00_SKETCH_SOURCE,
  [LEVEL_02_BASE_TEMPLATE_KEY]: LEVEL_02_BASE_SOURCE,
  [LEVEL_03_BASE_TEMPLATE_KEY]: LEVEL_03_BASE_SOURCE,
  [LEVEL_04_BASE_TEMPLATE_KEY]: LEVEL_04_BASE_SOURCE,
};

const BUNDLED_TEMPLATE_METADATA: Record<string, CardTemplateMetadata> = {
  [LEVEL_00_SKETCH_TEMPLATE_KEY]: LEVEL_00_SKETCH_METADATA,
  [LEVEL_02_BASE_TEMPLATE_KEY]: LEVEL_02_BASE_METADATA,
  [LEVEL_03_BASE_TEMPLATE_KEY]: LEVEL_03_BASE_METADATA,
  [LEVEL_04_BASE_TEMPLATE_KEY]: LEVEL_04_BASE_METADATA,
};

const HAND_DRAWN_TEMPLATE_KEYS = new Set([
  LEVEL_00_SKETCH_TEMPLATE_KEY,
  LEVEL_02_BASE_TEMPLATE_KEY,
  LEVEL_03_BASE_TEMPLATE_KEY,
  LEVEL_04_BASE_TEMPLATE_KEY,
]);

export function getBundledTemplateSource(templateKey: string): ImageSourcePropType | undefined {
  return BUNDLED_TEMPLATE_SOURCES[templateKey];
}

export function getHandDrawnTemplateMetadata(templateKey: string): CardTemplateMetadata | undefined {
  return BUNDLED_TEMPLATE_METADATA[templateKey];
}

export function resolveTemplateKey(template: PlayerCardRenderTemplate): string {
  return template.templateKey ?? template.metadata.id ?? template.id;
}

export function usesHandDrawnOverlays(template: PlayerCardRenderTemplate): boolean {
  return HAND_DRAWN_TEMPLATE_KEYS.has(resolveTemplateKey(template));
}

export function applyBundledTemplateMetadata(
  template: PlayerCardRenderTemplate
): PlayerCardRenderTemplate {
  const templateKey = resolveTemplateKey(template);
  const metadata = BUNDLED_TEMPLATE_METADATA[templateKey];
  const baseImageSource = BUNDLED_TEMPLATE_SOURCES[templateKey];

  if (!metadata) {
    return template;
  }

  return {
    ...template,
    baseImageSource: template.baseImageSource ?? baseImageSource,
    metadata,
  };
}

export const FALLBACK_CARD_TEMPLATES: PlayerCardRenderTemplate[] = [
  LEVEL_02_BASE_TEMPLATE,
  LEVEL_03_BASE_TEMPLATE,
  LEVEL_04_BASE_TEMPLATE,
  LEVEL_00_SKETCH_TEMPLATE,
];

export function templateForKey(templateKey: string): PlayerCardRenderTemplate | undefined {
  return FALLBACK_CARD_TEMPLATES.find(
    (candidate) => resolveTemplateKey(candidate) === templateKey
  );
}

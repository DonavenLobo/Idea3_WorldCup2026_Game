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

/** Bundled PNG assets for pages 2–4 (matches `assets/card-templates/level-0*-base-v1.png`). */
export const HAND_DRAWN_CANVAS_WIDTH = 682;
export const HAND_DRAWN_CANVAS_HEIGHT = 1024;

const SKETCH_FONT = fontFamily.caveatBold;

/** Authoring grid for layer coordinates before scaling to bundled PNG size. */
const DESIGN_WIDTH = 1024;
const DESIGN_HEIGHT = 1536;
const SCALE_X = HAND_DRAWN_CANVAS_WIDTH / DESIGN_WIDTH;
const SCALE_Y = HAND_DRAWN_CANVAS_HEIGHT / DESIGN_HEIGHT;

function sx(value: number): number {
  return Math.round(value * SCALE_X);
}

function sy(value: number): number {
  return Math.round(value * SCALE_Y);
}

function scaleLayers(layers: CardTemplateMetadata["layers"]): CardTemplateMetadata["layers"] {
  return {
    overall: {
      ...layers.overall,
      x: sx(layers.overall.x ?? 0),
      y: sy(layers.overall.y ?? 0),
      width: layers.overall.width ? sx(layers.overall.width) : undefined,
      fontSize: layers.overall.fontSize ? sx(layers.overall.fontSize) : undefined,
      labelFontSize: layers.overall.labelFontSize ? sx(layers.overall.labelFontSize) : undefined,
      labelX: layers.overall.labelX !== undefined ? sx(layers.overall.labelX) : undefined,
      labelY: layers.overall.labelY !== undefined ? sy(layers.overall.labelY) : undefined,
    },
    avatar: {
      ...layers.avatar,
      x: sx(layers.avatar.x ?? 0),
      y: sy(layers.avatar.y ?? 0),
      width: sx(layers.avatar.width ?? 0),
      height: sy(layers.avatar.height ?? 0),
    },
    displayName: {
      ...layers.displayName,
      x: sx(layers.displayName.x ?? 0),
      y: sy(layers.displayName.y ?? 0),
      width: sx(layers.displayName.width ?? 0),
      height: sy(layers.displayName.height ?? 0),
      fontSize: layers.displayName.fontSize ? sx(layers.displayName.fontSize) : undefined,
    },
    stats: {
      ...layers.stats,
      x: sx(layers.stats.x ?? 0),
      y: sy(layers.stats.y ?? 0),
      valueFontSize: sx(layers.stats.valueFontSize ?? 0),
      columns: layers.stats.columns.map((column) => ({
        ...column,
        x: sx(column.x),
        width: column.width !== undefined ? sx(column.width) : column.width,
      })),
    },
    badge: layers.badge
      ? {
        ...layers.badge,
        x: sx(layers.badge.x ?? 0),
        y: sy(layers.badge.y ?? 0),
        width: sx(layers.badge.width ?? 0),
        height: sy(layers.badge.height ?? 0),
        fontSize: layers.badge.fontSize ? sx(layers.badge.fontSize) : undefined,
      }
      : undefined,
  };
}

/** Page 2 — rectangular torn-paper card (full bleed art). */
const LEVEL_02_STAT_POSITIONS = [
  { left: 19, top: 83 },
  { left: 31.5, top: 83 },
  { left: 43.5, top: 83 },
  { left: 55.5, top: 83 },
  { left: 68, top: 83 },
  { left: 80, top: 83 },
] as const;

/** Page 3 — shield card; stats sit in the drawn shield icons. */
const LEVEL_03_STAT_POSITIONS = [
  { left: 18.5, top: 77.7 },
  { left: 31.2, top: 77.7 },
  { left: 43.7, top: 77.7 },
  { left: 56.2, top: 77.7 },
  { left: 68.4, top: 77.7 },
  { left: 80.6, top: 77.7 },
] as const;

/** Page 4 — shield + trophy header; stats sit slightly lower. */
const LEVEL_04_STAT_POSITIONS = [
  { left: 18.4, top: 75.5 },
  { left: 31.2, top: 75.5 },
  { left: 43.7, top: 75.5 },
  { left: 56.2, top: 75.5 },
  { left: 68.7, top: 75.5 },
  { left: 81.5, top: 75.5 },
] as const;

function createHandDrawnMetadata(
  id: string,
  name: string,
  designLayers: CardTemplateMetadata["layers"],
  options: Pick<
    CardTemplateMetadata,
    "transparentCanvas" | "canvasBlendMode" | "showOverallOverlay" | "statOverlayPositions" | "statFontScale"
  > = {}
): CardTemplateMetadata {
  return {
    id,
    name,
    version: 1,
    width: HAND_DRAWN_CANVAS_WIDTH,
    height: HAND_DRAWN_CANVAS_HEIGHT,
    safeArea: {
      x: sx(94),
      y: sy(96),
      width: sx(836),
      height: sy(1344),
    },
    layers: scaleLayers(designLayers),
    ...options,
  };
}

const LEVEL_02_LAYERS: CardTemplateMetadata["layers"] = {
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
    labelY: 150,
  },
  avatar: {
    x: 235,
    y: 220,
    width: 565,
    height: 735,
    fit: "cover",
  },
  displayName: {
    x: 205,
    y: 1034,
    width: 614,
    height: 70,
    fontSize: 65,
    fontFamily: SKETCH_FONT,
    color: "#1a1a2e",
    align: "center",
  },
  stats: {
    x: 0,
    y: 1272,
    columns: [
      { key: "hyp", x: 154, width: 82 },
      { key: "frm", x: 278, width: 82 },
      { key: "atk", x: 402, width: 82 },
      { key: "ast", x: 526, width: 82 },
      { key: "wal", x: 650, width: 82 },
      { key: "lck", x: 774, width: 82 },
    ],
    labelFontSize: 0,
    valueFontSize: 42,
    fontFamily: SKETCH_FONT,
    color: "#1a1a2e",
    align: "center",
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

const LEVEL_03_LAYERS: CardTemplateMetadata["layers"] = {
  overall: {
    x: 110,
    y: 234,
    width: 120,
    fontSize: 96,
    fontFamily: SKETCH_FONT,
    color: "#1a1a2e",
    align: "center",
    label: "OVR",
    labelFontSize: 50,
    labelX: 110,
    labelY: 199,
  },
  avatar: {
    x: 280,
    y: 270,
    width: 488,
    height: 580,
    fit: "cover",
  },
  displayName: {
    x: 246,
    y: 948,
    width: 532,
    height: 72,
    fontSize: 70,
    fontFamily: SKETCH_FONT,
    color: "#1a1a2e",
    align: "center",
  },
  stats: {
    x: 0,
    y: 1200,
    columns: [
      { key: "hyp", x: 168, width: 72 },
      { key: "frm", x: 306, width: 72 },
      { key: "atk", x: 444, width: 72 },
      { key: "ast", x: 582, width: 72 },
      { key: "wal", x: 720, width: 72 },
      { key: "lck", x: 858, width: 72 },
    ],
    labelFontSize: 0,
    valueFontSize: 38,
    fontFamily: SKETCH_FONT,
    color: "#1a1a2e",
    align: "center",
    showLabels: false,
  },
  badge: {
    x: 745,
    y: 234,
    width: 140,
    height: 104,
    fontSize: 100,
    backgroundColor: "transparent",
    color: "#1a1a2e",
  },
};

const LEVEL_04_LAYERS: CardTemplateMetadata["layers"] = {
  overall: {
    x: 145,
    y: 325,
    width: 130,
    fontSize: 90,
    fontFamily: SKETCH_FONT,
    color: "#1a1a2e",
    align: "center",
    label: "OVR",
    labelFontSize: 38,
    labelX: 150,
    labelY: 296,
  },
  avatar: {
    x: 320,
    y: 300,
    width: 450,
    height: 570,
    fit: "cover",
  },
  displayName: {
    x: 246,
    y: 948,
    width: 532,
    height: 52,
    fontSize: 60,
    fontFamily: SKETCH_FONT,
    color: "#1a1a2e",
    align: "center",
  },
  stats: {
    x: 0,
    y: 1232,
    columns: [
      { key: "hyp", x: 168, width: 72 },
      { key: "frm", x: 306, width: 72 },
      { key: "atk", x: 444, width: 72 },
      { key: "ast", x: 582, width: 72 },
      { key: "wal", x: 720, width: 72 },
      { key: "lck", x: 858, width: 72 },
    ],
    labelFontSize: 0,
    valueFontSize: 38,
    fontFamily: SKETCH_FONT,
    color: "#1a1a2e",
    align: "center",
    showLabels: false,
  },
  badge: {
    x: 790,
    y: 250,
    width: 120,
    height: 90,
    fontSize: 100,
    backgroundColor: "transparent",
    color: "#1a1a2e",
  },
};

export const LEVEL_02_BASE_SOURCE = require("../../../../assets/card-templates/level-02-base-v1.png") as ImageSourcePropType;
export const LEVEL_03_BASE_SOURCE = require("../../../../assets/card-templates/level-03-base-v1.png") as ImageSourcePropType;
export const LEVEL_04_BASE_SOURCE = require("../../../../assets/card-templates/level-04-base-v1.png") as ImageSourcePropType;

export const LEVEL_02_BASE_METADATA = createHandDrawnMetadata(
  LEVEL_02_BASE_TEMPLATE_KEY,
  "Base Card Page 2",
  LEVEL_02_LAYERS,
  {
    showOverallOverlay: true,
    statOverlayPositions: LEVEL_02_STAT_POSITIONS,
    statFontScale: 0.059,
  }
);
export const LEVEL_03_BASE_METADATA = createHandDrawnMetadata(
  LEVEL_03_BASE_TEMPLATE_KEY,
  "Base Card Page 3",
  LEVEL_03_LAYERS,
  {
    transparentCanvas: true,
    showOverallOverlay: true,
    statOverlayPositions: LEVEL_03_STAT_POSITIONS,
    statFontScale: 0.060,
  }
);
export const LEVEL_04_BASE_METADATA = createHandDrawnMetadata(
  LEVEL_04_BASE_TEMPLATE_KEY,
  "Base Card Page 4",
  LEVEL_04_LAYERS,
  {
    transparentCanvas: true,
    showOverallOverlay: true,
    statOverlayPositions: LEVEL_04_STAT_POSITIONS,
    statFontScale: 0.060,
  }
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

export function usesTransparentCanvas(template: PlayerCardRenderTemplate): boolean {
  return template.metadata.transparentCanvas === true;
}

export function applyBundledTemplateMetadata(
  template: PlayerCardRenderTemplate
): PlayerCardRenderTemplate {
  const templateKey = resolveTemplateKey(template);
  const metadata = BUNDLED_TEMPLATE_METADATA[templateKey];

  if (!metadata) {
    return template;
  }

  const bundledImage = BUNDLED_TEMPLATE_SOURCES[templateKey];

  return {
    ...template,
    templateKey,
    baseImageSource: bundledImage ?? template.baseImageSource,
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
  const match = FALLBACK_CARD_TEMPLATES.find(
    (candidate) => resolveTemplateKey(candidate) === templateKey
  );

  return match ? applyBundledTemplateMetadata(match) : undefined;
}

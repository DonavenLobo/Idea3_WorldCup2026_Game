export type CardProgressionLevel = 2 | 3 | 4;

export interface CardProgressionMilestones {
  hasCompletedFirstTrivia: boolean;
  hasFinalizedAllBracketGroups: boolean;
}

export interface CardUpgradeStep {
  from: CardProgressionLevel;
  to: CardProgressionLevel;
}

export interface CardUpgradeEvent {
  id: string;
  userId: string;
  cardId: string;
  fromLevel: CardProgressionLevel;
  toLevel: CardProgressionLevel;
  sequence: number;
  createdAt: string;
  animationSeenAt: string | null;
}

export type CardTier = "bronze" | "silver" | "gold" | "elite" | "legend";

export type CardStatus =
  | "draft"
  | "generating_avatar"
  | "composing"
  | "ready"
  | "failed"
  | "moderation_rejected";

export type CardStatKey = "hyp" | "frm" | "atk" | "ast" | "wal" | "lck";

export type CardStats = Record<CardStatKey, number>;

export interface PlayerCard {
  id: string;
  userId: string;
  templateId: string;
  displayName: string;
  selectedNationCode: string;
  tier: CardTier;
  overall: number;
  stats: CardStats;
  avatarSourceUrl?: string;
  avatarGeneratedUrl?: string;
  finalCardUrl?: string;
  shareSlug: string;
  status: CardStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CardTemplateLayerMetadata {
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontWeight?: string;
  /** React Native font family — e.g. Caveat_700Bold when loaded in the host app. */
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  label?: string;
  labelColor?: string;
  labelFontSize?: number;
  labelX?: number;
  labelY?: number;
  align?: "left" | "center" | "right";
  fit?: "cover" | "contain";
}

export interface CardStatOverlayPosition {
  left: number;
  top: number;
}

export interface CardTemplateMetadata {
  id: string;
  name: string;
  version: number;
  width: number;
  height: number;
  safeArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** When true, PNG margins blend into the host background (shield templates). */
  transparentCanvas?: boolean;
  /** How the base PNG blends with the host background. Defaults to multiply (white margins). */
  canvasBlendMode?: "multiply" | "screen";
  /** When false, OVR label/number overlays are omitted. */
  showOverallOverlay?: boolean;
  /** Stat value positions as % of card width/height. */
  statOverlayPositions?: ReadonlyArray<CardStatOverlayPosition>;
  /** Stat font size as a fraction of rendered card width. */
  statFontScale?: number;
  layers: {
    overall: CardTemplateLayerMetadata;
    avatar: CardTemplateLayerMetadata;
    displayName: CardTemplateLayerMetadata;
    stats: CardTemplateLayerMetadata & {
      columns: Array<{ key: CardStatKey; x: number; width?: number }>;
      labelFontSize: number;
      valueFontSize: number;
      showLabels?: boolean;
    };
    badge?: CardTemplateLayerMetadata;
  };
}

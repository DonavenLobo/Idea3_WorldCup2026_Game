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

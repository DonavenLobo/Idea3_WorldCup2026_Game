import type { CardTemplateMetadata, PlayerCard } from "@world-cup-game/types";

export interface PlayerCardRenderTemplate {
  id: string;
  name: string;
  baseImageUrl?: string;
  metadata: CardTemplateMetadata;
}

export interface PlayerCardRenderData {
  card: Pick<
    PlayerCard,
    | "displayName"
    | "selectedNationCode"
    | "tier"
    | "overall"
    | "stats"
    | "avatarGeneratedUrl"
    | "avatarSourceUrl"
  >;
  template: PlayerCardRenderTemplate;
}

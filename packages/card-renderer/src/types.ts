import type { CardTemplateMetadata, PlayerCard } from "@world-cup-game/types";
import type { ImageSourcePropType } from "react-native";

export interface PlayerCardRenderTemplate {
  id: string;
  templateKey?: string;
  name: string;
  baseImageSource?: ImageSourcePropType;
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

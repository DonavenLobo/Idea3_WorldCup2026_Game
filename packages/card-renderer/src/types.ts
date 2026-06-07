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
  /** When false, stat values are omitted so the host can overlay them on the image. */
  renderStatValues?: boolean;
  /** When false, the overall rating is omitted so the host can overlay it on the image. */
  renderOverall?: boolean;
  /** When false, the display name is omitted so the host can overlay it on the image. */
  renderDisplayName?: boolean;
  template: PlayerCardRenderTemplate;
}

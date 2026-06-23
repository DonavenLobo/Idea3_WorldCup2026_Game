import type { CardTemplateMetadata, PlayerCard } from "@gogaffa/types";
import type { ComponentType } from "react";
import type { ImageSourcePropType } from "react-native";

export type BadgeIconComponent = ComponentType<{
  height?: number | string;
  preserveAspectRatio?: string;
  width?: number | string;
}>;

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
  > & {
    badgeIcon?: BadgeIconComponent;
    badgeImageSource?: ImageSourcePropType;
  };
  /** When false, stat values are omitted so the host can overlay them on the image. */
  renderStatValues?: boolean;
  /** When false, the overall rating is omitted so the host can overlay it on the image. */
  renderOverall?: boolean;
  /** When false, the display name is omitted so the host can overlay it on the image. */
  renderDisplayName?: boolean;
  /** Called after the template image has loaded and can be displayed. */
  onTemplateReady?: () => void;
  /** Called after the player portrait has finished loading. */
  onAvatarReady?: () => void;
  template: PlayerCardRenderTemplate;
}

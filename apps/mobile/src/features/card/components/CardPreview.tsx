import { PlayerCard } from "@gogaffa/card-renderer";
import { BASE_CARD_STATS } from "@gogaffa/config";
import type { PlayerCardRenderTemplate } from "@gogaffa/card-renderer";

export interface CardPreviewProps {
  template: PlayerCardRenderTemplate;
}

export function CardPreview({ template }: CardPreviewProps) {
  return (
    <PlayerCard
      template={template}
      card={{
        displayName: "Rookie",
        selectedNationCode: "USA",
        tier: "bronze",
        overall: 50,
        stats: BASE_CARD_STATS,
        avatarSourceUrl: undefined,
        avatarGeneratedUrl: undefined
      }}
    />
  );
}

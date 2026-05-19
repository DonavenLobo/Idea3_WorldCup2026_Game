import { CARD_TIERS } from "@world-cup-game/config";
import type { CardTier } from "@world-cup-game/types";

export function calculateCardTier(overall: number): CardTier {
  return CARD_TIERS.reduce<CardTier>((currentTier, tier) => {
    return overall >= tier.minOverall ? tier.tier : currentTier;
  }, "bronze");
}

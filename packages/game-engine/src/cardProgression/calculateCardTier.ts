import { CARD_TIERS } from "@gogaffa/config";
import type { CardTier } from "@gogaffa/types";

export function calculateCardTier(overall: number): CardTier {
  return CARD_TIERS.reduce<CardTier>((currentTier, tier) => {
    return overall >= tier.minOverall ? tier.tier : currentTier;
  }, "bronze");
}

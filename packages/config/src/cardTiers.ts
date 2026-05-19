import type { CardTier } from "@world-cup-game/types";

export const CARD_TIERS: Array<{
  tier: CardTier;
  minOverall: number;
  label: string;
}> = [
  { tier: "bronze", minOverall: 0, label: "Bronze" },
  { tier: "silver", minOverall: 65, label: "Silver" },
  { tier: "gold", minOverall: 75, label: "Gold" },
  { tier: "elite", minOverall: 85, label: "Elite" },
  { tier: "legend", minOverall: 93, label: "Legend" }
];

export const MAX_CARD_OVERALL_BY_TOURNAMENT_DAY = 94;

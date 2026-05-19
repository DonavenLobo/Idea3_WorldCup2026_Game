import type { TriviaScoreSummary } from "@world-cup-game/types";

export interface TriviaRewards {
  competitivePoints: number;
  earnedCardXp: number;
}

export function calculateTriviaRewards(summary: TriviaScoreSummary): TriviaRewards {
  return {
    competitivePoints: summary.competitivePoints,
    earnedCardXp: summary.earnedCardXp
  };
}

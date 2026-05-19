import type { BountyReward } from "@world-cup-game/types";

export interface BountyScoreInput {
  isCorrect: boolean;
  reward: BountyReward;
}

export interface BountyScoreResult {
  competitivePoints: 0;
  reward?: BountyReward;
}

export function scoreBounty(input: BountyScoreInput): BountyScoreResult {
  return {
    competitivePoints: 0,
    reward: input.isCorrect ? input.reward : undefined
  };
}

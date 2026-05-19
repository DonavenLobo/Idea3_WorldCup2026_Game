import type { AnswerKey, TriviaAnswerOption } from "./trivia";

export type BountyRewardType =
  | "exclusive_cosmetic"
  | "temporary_visual_effect"
  | "card_stat_upgrade"
  | "rarity_progress"
  | "streak_save_coupon"
  | "limited_event_badge";

export interface BountyReward {
  type: BountyRewardType;
  label: string;
  metadata?: Record<string, unknown>;
}

export interface MatchBounty {
  id: string;
  matchId: string;
  prompt: string;
  answerOptions: TriviaAnswerOption[];
  correctAnswerKey?: AnswerKey;
  reward: BountyReward;
  lockTime: string;
  resultStatus: "scheduled" | "open" | "locked" | "scored" | "void";
}

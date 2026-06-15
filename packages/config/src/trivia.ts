import {
  TRIVIA_ALL_THREE_COMBO_BONUS,
  TRIVIA_QUESTION_TIER_DETAILS,
  TRIVIA_QUESTION_TIERS,
  TRIVIA_RULES
} from "./xpRules";

export const TRIVIA_QUESTIONS_PER_DAY = TRIVIA_RULES.questionsPerDay;

/**
 * Maximum points a single question can be worth: the HARDEST tier's
 * base + max speed bonus. Used by leaderboard/UI for "best possible" displays.
 */
export const TRIVIA_MAX_POINTS_PER_QUESTION = (() => {
  const lastTier = TRIVIA_QUESTION_TIER_DETAILS[TRIVIA_QUESTION_TIER_DETAILS.length - 1]!;
  return lastTier.basePoints + lastTier.maxSpeedBonus;
})();

/** Daily maximum points before streak multipliers. */
export const TRIVIA_MAX_POINTS_PER_DAY = TRIVIA_QUESTION_TIERS.reduce<number>(
  (total, basePoints) => total + basePoints * 2,
  TRIVIA_ALL_THREE_COMBO_BONUS
);

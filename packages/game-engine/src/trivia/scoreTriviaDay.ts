/**
 * scoreTriviaDay — pure day-scoped trivia scorer (PR-A points rewrite).
 *
 * Scores a user's complete daily trivia attempt (Q1, Q2, Q3) using the new
 * tiered formula from the points-system-rewrite spec
 * (docs/superpowers/specs/2026-06-08-points-system-rewrite-design.md).
 *
 * NOTE: The legacy per-attempt scorer at ./scoreTriviaAttempt.ts is still in
 * use and will be retired in Task 6 when the trivia edge function is rewritten.
 * Do not couple this function to it.
 */

import {
  TRIVIA_QUESTION_TIERS,
  TRIVIA_TIMER_SECONDS,
  TRIVIA_ALL_THREE_COMBO_BONUS,
  getTriviaStreakMultiplier,
} from "@world-cup-game/config";

export interface TriviaQuestionResult {
  questionId: string;
  isCorrect: boolean;
  responseTimeMs: number;
}

export interface ScoreTriviaDayInput {
  /** Exactly 3 results, in Q1/Q2/Q3 order. */
  answers: [TriviaQuestionResult, TriviaQuestionResult, TriviaQuestionResult];
  /** The user's trivia streak BEFORE today's run (>= 0). */
  currentStreak: number;
}

export interface ScoreTriviaDayPerQuestion {
  questionId: string;
  basePoints: number;
  speedBonus: number;
  total: number;
}

export interface ScoreTriviaDayResult {
  perQuestion: [
    ScoreTriviaDayPerQuestion,
    ScoreTriviaDayPerQuestion,
    ScoreTriviaDayPerQuestion,
  ];
  /** Sum of per-Q totals before combo bonus and streak multiplier. */
  baseSum: number;
  /** 0 or TRIVIA_ALL_THREE_COMBO_BONUS. */
  comboBonusApplied: number;
  /** 1.0 / 1.10 / 1.20 / 1.30 — derived from the NEW streak (today's result included). */
  streakMultiplier: number;
  /** The user's streak AFTER today's run. */
  newStreak: number;
  /** Final day total (rounded integer). */
  competitivePoints: number;
}

const TIMER_MS = TRIVIA_TIMER_SECONDS * 1000;

/**
 * Per-question scoring: incorrect = 0; correct = base + base * max(0, 1 - rt/(2*T))
 * Result is rounded to nearest integer. rt is clamped to [0, T].
 */
function scoreQuestion(
  answer: TriviaQuestionResult,
  base: number
): ScoreTriviaDayPerQuestion {
  if (!answer.isCorrect) {
    return {
      questionId: answer.questionId,
      basePoints: 0,
      speedBonus: 0,
      total: 0,
    };
  }

  const rtMs = Math.max(0, Math.min(answer.responseTimeMs, TIMER_MS));
  const remainingRatio = Math.max(0, 1 - rtMs / (2 * TIMER_MS));
  const speedBonusRaw = base * remainingRatio;
  const speedBonus = Math.round(speedBonusRaw);
  // Round the total from the un-rounded sum to avoid double-rounding drift.
  const total = Math.round(base + speedBonusRaw);

  return {
    questionId: answer.questionId,
    basePoints: base,
    speedBonus,
    total,
  };
}

export function scoreTriviaDay(input: ScoreTriviaDayInput): ScoreTriviaDayResult {
  const { answers, currentStreak } = input;

  const perQuestion: [
    ScoreTriviaDayPerQuestion,
    ScoreTriviaDayPerQuestion,
    ScoreTriviaDayPerQuestion,
  ] = [
    scoreQuestion(answers[0], TRIVIA_QUESTION_TIERS[0]),
    scoreQuestion(answers[1], TRIVIA_QUESTION_TIERS[1]),
    scoreQuestion(answers[2], TRIVIA_QUESTION_TIERS[2]),
  ];

  const baseSum = perQuestion.reduce((sum, q) => sum + q.total, 0);

  const allCorrect =
    answers[0].isCorrect && answers[1].isCorrect && answers[2].isCorrect;

  const comboBonusApplied = allCorrect ? TRIVIA_ALL_THREE_COMBO_BONUS : 0;

  const safeCurrentStreak = Math.max(0, currentStreak);
  const newStreak = allCorrect ? safeCurrentStreak + 1 : 0;

  // Multiplier kicks in on the day the milestone is HIT (uses NEW streak).
  const streakMultiplier = getTriviaStreakMultiplier(newStreak);

  const competitivePoints = Math.round(
    (baseSum + comboBonusApplied) * streakMultiplier
  );

  return {
    perQuestion,
    baseSum,
    comboBonusApplied,
    streakMultiplier,
    newStreak,
    competitivePoints,
  };
}

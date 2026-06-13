import { TRIVIA_RULES, getTriviaTierForOrder } from "@world-cup-game/config";
import type { TriviaScoreSummary } from "@world-cup-game/types";

export interface TriviaQuestionScoreInput {
  questionId: string;
  /** 1-indexed position in the daily attempt (1 = easy, 2 = medium, 3 = hard). */
  questionOrder: number;
  isCorrect: boolean;
  responseTimeMs: number;
}

/**
 * Speed bonus scales linearly inside the tier's time window.
 * At 0ms → full bonus; at the tier's timeLimitMs → 0 bonus.
 */
function calculateSpeedBonus(responseTimeMs: number, questionOrder: number): number {
  const tier = getTriviaTierForOrder(questionOrder);
  const cappedMs = Math.max(0, Math.min(responseTimeMs, tier.timeLimitMs));
  const remainingRatio = (tier.timeLimitMs - cappedMs) / tier.timeLimitMs;

  return Math.round(tier.maxSpeedBonus * remainingRatio);
}

function calculateAnswerPoints(answer: TriviaQuestionScoreInput): number {
  if (!answer.isCorrect) return 0;
  const tier = getTriviaTierForOrder(answer.questionOrder);
  return tier.basePoints + calculateSpeedBonus(answer.responseTimeMs, answer.questionOrder);
}

export function scoreTriviaAttempt(answers: TriviaQuestionScoreInput[]): TriviaScoreSummary {
  const correctAnswers = answers.filter((answer) => answer.isCorrect);
  const totalResponseTimeMs = answers.reduce((total, answer) => total + answer.responseTimeMs, 0);
  const competitivePoints = answers.reduce(
    (total, answer) => total + calculateAnswerPoints(answer),
    0
  );

  return {
    totalQuestions: answers.length,
    correctAnswers: correctAnswers.length,
    totalResponseTimeMs,
    competitivePoints,
    earnedCardXp:
      correctAnswers.length * TRIVIA_RULES.correctAnswerCardXp +
      (answers.length === TRIVIA_RULES.questionsPerDay ? TRIVIA_RULES.completedDailyTriviaCardXp : 0)
  };
}

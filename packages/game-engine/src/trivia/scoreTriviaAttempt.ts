import { TRIVIA_RULES } from "@world-cup-game/config";
import type { TriviaScoreSummary } from "@world-cup-game/types";

export interface TriviaQuestionScoreInput {
  questionId: string;
  isCorrect: boolean;
  responseTimeMs: number;
}

function calculateSpeedBonus(responseTimeMs: number): number {
  const cappedMs = Math.max(0, Math.min(responseTimeMs, 30_000));
  const remainingRatio = (30_000 - cappedMs) / 30_000;

  return Math.round(TRIVIA_RULES.maxSpeedBonusPerQuestion * remainingRatio);
}

export function scoreTriviaAttempt(answers: TriviaQuestionScoreInput[]): TriviaScoreSummary {
  const correctAnswers = answers.filter((answer) => answer.isCorrect);
  const totalResponseTimeMs = answers.reduce((total, answer) => total + answer.responseTimeMs, 0);
  const correctnessPoints = correctAnswers.length * TRIVIA_RULES.correctAnswerCompetitivePoints;
  const speedBonus = correctAnswers.reduce(
    (total, answer) => total + calculateSpeedBonus(answer.responseTimeMs),
    0
  );

  return {
    totalQuestions: answers.length,
    correctAnswers: correctAnswers.length,
    totalResponseTimeMs,
    competitivePoints: correctnessPoints + speedBonus,
    earnedCardXp:
      correctAnswers.length * TRIVIA_RULES.correctAnswerCardXp +
      (answers.length === TRIVIA_RULES.questionsPerDay ? TRIVIA_RULES.completedDailyTriviaCardXp : 0)
  };
}

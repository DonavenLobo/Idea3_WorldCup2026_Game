import type { AnswerKey, TriviaQuestion, TriviaScoreSummary } from "@world-cup-game/types";

export type DailyTriviaStatus =
  | "loading"
  | "missing"
  | "available"
  | "in_progress"
  | "submitting"
  | "completed";

export interface DailyTriviaQuestion extends Omit<TriviaQuestion, "correctAnswerKey"> {
  difficulty: string;
  questionOrder: number;
}

export interface DailyAnswer {
  questionId: string;
  selectedAnswerKey: AnswerKey;
  selectedIndex: number;
  responseTimeMs: number;
  isCorrect?: boolean;
  points?: number;
}

export interface ScoredTriviaAttempt extends TriviaScoreSummary {
  id: string;
  activeDate: string;
  answers: DailyAnswer[];
  completedAt: string;
}

export interface TriviaResult {
  selectedAnswerKey: AnswerKey;
  responseTimeMs: number;
}

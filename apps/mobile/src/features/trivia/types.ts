export type DailyTriviaStatus = "available" | "completed" | "locked";

export interface DailyAttempt {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
  points: number;
}

export interface TriviaResult {
  correct: boolean;
  points: number;
  correctIndex: number;
}

export type AnswerKey = "A" | "B" | "C" | "D";

export interface TriviaAnswerOption {
  key: AnswerKey;
  label: string;
}

export interface TriviaQuestion {
  id: string;
  question: string;
  answerOptions: TriviaAnswerOption[];
  correctAnswerKey?: AnswerKey;
  explanation?: string;
  activeDate: string;
  nationCode?: string;
}

export interface TriviaAnswerSubmission {
  questionId: string;
  selectedAnswerKey: AnswerKey;
  responseTimeMs: number;
}

export interface TriviaScoreSummary {
  totalQuestions: number;
  correctAnswers: number;
  totalResponseTimeMs: number;
  competitivePoints: number;
  earnedCardXp: number;
  /**
   * Day-scoped multiplier applied to (baseSum + comboBonusApplied).
   * 1.0 when no streak bonus is active; 1.10 / 1.20 / 1.30 at milestones.
   * Optional for backward compat with persisted attempts that pre-date PR-A.
   */
  streakMultiplier?: number;
  /** Trivia streak AFTER today's run (>= 0). */
  newStreak?: number;
  /** 0 when not perfect; TRIVIA_ALL_THREE_COMBO_BONUS when perfect. */
  comboBonusApplied?: number;
}

export interface SpoilerSafeTriviaShare {
  correctAnswers: number;
  totalQuestions: number;
  totalResponseTimeMs: number;
  nationCode: string;
  cardTier: string;
}

export interface PooledTriviaQuestion {
  /** Stable unique id within the pool. */
  id: string;
  /** Subject nation (FK code into public.nations). */
  nationCode: string;
  question: string;
  /** Exactly four options, keys A–D. */
  answerOptions: TriviaAnswerOption[];
  correctAnswerKey: AnswerKey;
  explanation: string;
  difficulty: string;
}

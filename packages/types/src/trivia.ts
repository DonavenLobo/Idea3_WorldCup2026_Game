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
}

export interface SpoilerSafeTriviaShare {
  correctAnswers: number;
  totalQuestions: number;
  totalResponseTimeMs: number;
  nationCode: string;
  cardTier: string;
}

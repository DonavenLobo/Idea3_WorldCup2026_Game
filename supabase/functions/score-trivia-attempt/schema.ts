export interface ScoreTriviaAttemptRequest {
  userId: string;
  activeDate: string;
  answers: Array<{
    questionId: string;
    selectedAnswerKey: "A" | "B" | "C" | "D";
    responseTimeMs: number;
  }>;
}

export function parseScoreTriviaAttemptRequest(value: unknown): ScoreTriviaAttemptRequest {
  const input = value as Partial<ScoreTriviaAttemptRequest>;

  if (!input.userId || !input.activeDate || !Array.isArray(input.answers)) {
    throw new Error("Invalid score-trivia-attempt request.");
  }

  return input as ScoreTriviaAttemptRequest;
}

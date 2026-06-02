export type AnswerKey = "A" | "B" | "C" | "D";

export interface TriviaAnswerSubmission {
  questionId: string;
  selectedAnswerKey: AnswerKey;
  responseTimeMs: number;
}

export interface ScoreTriviaAttemptRequest {
  activeDate: string;
  answers: TriviaAnswerSubmission[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAnswerKey(value: unknown): value is AnswerKey {
  return value === "A" || value === "B" || value === "C" || value === "D";
}

function parseActiveDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("activeDate must be a YYYY-MM-DD string.");
  }

  return value;
}

function parseAnswer(value: unknown): TriviaAnswerSubmission {
  if (!isRecord(value)) {
    throw new Error("Each trivia answer must be an object.");
  }

  if (typeof value.questionId !== "string" || value.questionId.length === 0) {
    throw new Error("Each trivia answer needs a questionId.");
  }

  if (!isAnswerKey(value.selectedAnswerKey)) {
    throw new Error("Each trivia answer needs a selectedAnswerKey of A, B, C, or D.");
  }

  if (typeof value.responseTimeMs !== "number" || !Number.isFinite(value.responseTimeMs)) {
    throw new Error("Each trivia answer needs a numeric responseTimeMs.");
  }

  return {
    questionId: value.questionId,
    selectedAnswerKey: value.selectedAnswerKey,
    responseTimeMs: Math.max(0, Math.round(value.responseTimeMs))
  };
}

export function parseScoreTriviaAttemptRequest(value: unknown): ScoreTriviaAttemptRequest {
  if (!isRecord(value) || !Array.isArray(value.answers)) {
    throw new Error("Invalid score-trivia-attempt request.");
  }

  const answers = value.answers.map(parseAnswer);
  const uniqueQuestionIds = new Set(answers.map((answer) => answer.questionId));

  if (uniqueQuestionIds.size !== answers.length) {
    throw new Error("Trivia attempt contains duplicate question answers.");
  }

  return {
    activeDate: parseActiveDate(value.activeDate),
    answers
  };
}

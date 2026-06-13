import type { AnswerKey, TriviaAnswerOption } from "@world-cup-game/types";
import { supabase } from "../../../lib/supabase";
import { isAnswerKey } from "../schemas/triviaSchema";
import type { DailyAnswer, DailyTriviaQuestion, ScoredTriviaAttempt } from "../types";
import { calculateTriviaAnswerPoints } from "../utils";

interface TriviaQuestionRow {
  id: string;
  question: string;
  answer_options: unknown;
  explanation: string | null;
  difficulty: string;
  active_date: string;
  question_order: number;
  nation_code: string | null;
}

interface TriviaAttemptRow {
  id: string;
  active_date: string;
  total_questions: number;
  correct_answers: number;
  total_response_time_ms: number;
  competitive_points: number;
  earned_card_xp: number;
  completed_at: string;
}

interface TriviaAttemptAnswerRow {
  question_id: string;
  selected_answer_key: AnswerKey;
  is_correct: boolean;
  response_time_ms: number;
}

interface ScoreTriviaAttemptResponse {
  attempt: {
    id: string;
    activeDate: string;
    totalQuestions: number;
    correctAnswers: number;
    totalResponseTimeMs: number;
    competitivePoints: number;
    earnedCardXp: number;
    completedAt: string;
    answers: Array<{
      questionId: string;
      selectedAnswerKey: AnswerKey;
      responseTimeMs: number;
      isCorrect: boolean;
      points: number;
    }>;
    /** Score breakdown — present on freshly scored attempts; null on replays. */
    score: {
      baseSum: number;
      comboBonusApplied: number;
      streakMultiplier: number;
      newStreak: number;
      competitivePoints: number;
    } | null;
    /** Streak rollup — present on both fresh + replayed attempts. */
    streak?: {
      currentTriviaStreak: number;
      longestTriviaStreak: number;
    };
  };
}

const QUESTION_COLUMNS = `
  id,
  question,
  answer_options,
  explanation,
  difficulty,
  active_date,
  question_order,
  nation_code
`;

const ATTEMPT_COLUMNS = `
  id,
  active_date,
  total_questions,
  correct_answers,
  total_response_time_ms,
  competitive_points,
  earned_card_xp,
  completed_at
`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAnswerOptions(value: unknown): TriviaAnswerOption[] {
  if (!Array.isArray(value)) {
    throw new Error("Trivia answer options are malformed.");
  }

  const options = value.map((option) => {
    if (!isRecord(option) || typeof option.label !== "string" || typeof option.key !== "string") {
      throw new Error("Trivia answer option is malformed.");
    }

    if (!isAnswerKey(option.key)) {
      throw new Error("Trivia answer option key is invalid.");
    }

    return {
      key: option.key,
      label: option.label
    };
  });

  if (options.length !== 4) {
    throw new Error("Trivia questions must have exactly four answer options.");
  }

  return options;
}

function mapQuestion(row: TriviaQuestionRow): DailyTriviaQuestion {
  return {
    id: row.id,
    activeDate: row.active_date,
    answerOptions: parseAnswerOptions(row.answer_options),
    difficulty: row.difficulty,
    explanation: row.explanation ?? undefined,
    nationCode: row.nation_code ?? undefined,
    question: row.question,
    questionOrder: row.question_order
  };
}

function mapAttemptAnswer(row: TriviaAttemptAnswerRow): DailyAnswer {
  return {
    questionId: row.question_id,
    selectedAnswerKey: row.selected_answer_key,
    selectedIndex: ["A", "B", "C", "D"].indexOf(row.selected_answer_key),
    responseTimeMs: row.response_time_ms,
    isCorrect: row.is_correct,
    points: calculateTriviaAnswerPoints(row.is_correct, row.response_time_ms)
  };
}

function mapAttempt(row: TriviaAttemptRow, answers: DailyAnswer[]): ScoredTriviaAttempt {
  return {
    id: row.id,
    activeDate: row.active_date,
    totalQuestions: row.total_questions,
    correctAnswers: row.correct_answers,
    totalResponseTimeMs: row.total_response_time_ms,
    competitivePoints: row.competitive_points,
    earnedCardXp: row.earned_card_xp,
    completedAt: row.completed_at,
    answers
  };
}

function mapSubmittedAttempt(input: ScoreTriviaAttemptResponse["attempt"]): ScoredTriviaAttempt {
  return {
    id: input.id,
    activeDate: input.activeDate,
    totalQuestions: input.totalQuestions,
    correctAnswers: input.correctAnswers,
    totalResponseTimeMs: input.totalResponseTimeMs,
    competitivePoints: input.competitivePoints,
    earnedCardXp: input.earnedCardXp,
    completedAt: input.completedAt,
    // The day-scoped score breakdown (streak multiplier, combo bonus) is only
    // produced when the edge function runs a fresh scoring; existing-attempt
    // replays come back with score = null, so leave the optional fields undef.
    streakMultiplier: input.score?.streakMultiplier,
    newStreak: input.score?.newStreak ?? input.streak?.currentTriviaStreak,
    comboBonusApplied: input.score?.comboBonusApplied,
    answers: input.answers.map((answer) => ({
      questionId: answer.questionId,
      selectedAnswerKey: answer.selectedAnswerKey,
      selectedIndex: ["A", "B", "C", "D"].indexOf(answer.selectedAnswerKey),
      responseTimeMs: answer.responseTimeMs,
      isCorrect: answer.isCorrect,
      points: answer.points
    }))
  };
}

async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user?.id ?? null;
}

export async function getDailyTriviaQuestions(activeDate: string): Promise<DailyTriviaQuestion[]> {
  const { data, error } = await supabase
    .from("trivia_questions")
    .select(QUESTION_COLUMNS)
    .eq("active_date", activeDate)
    .order("question_order", { ascending: true })
    .returns<TriviaQuestionRow[]>();

  if (error) {
    throw error;
  }

  return data.map(mapQuestion);
}

export async function getCompletedTriviaAttempt(activeDate: string): Promise<ScoredTriviaAttempt | null> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  const { data: attempt, error: attemptError } = await supabase
    .from("trivia_attempts")
    .select(ATTEMPT_COLUMNS)
    .eq("user_id", userId)
    .eq("active_date", activeDate)
    .maybeSingle<TriviaAttemptRow>();

  if (attemptError) {
    throw attemptError;
  }

  if (!attempt) {
    return null;
  }

  const { data: answerRows, error: answersError } = await supabase
    .from("trivia_attempt_answers")
    .select("question_id, selected_answer_key, is_correct, response_time_ms")
    .eq("attempt_id", attempt.id)
    .order("created_at", { ascending: true })
    .returns<TriviaAttemptAnswerRow[]>();

  if (answersError) {
    throw answersError;
  }

  return mapAttempt(attempt, answerRows.map(mapAttemptAnswer));
}

export async function submitDailyTriviaAttempt(input: {
  activeDate: string;
  answers: Array<{
    questionId: string;
    selectedAnswerKey: AnswerKey;
    responseTimeMs: number;
  }>;
}): Promise<ScoredTriviaAttempt> {
  const { data, error } = await supabase.functions.invoke<ScoreTriviaAttemptResponse>(
    "score-trivia-attempt",
    {
      body: input
    }
  );

  if (error) {
    throw error;
  }

  if (!data?.attempt) {
    throw new Error("Trivia attempt did not return a score.");
  }

  return mapSubmittedAttempt(data.attempt);
}

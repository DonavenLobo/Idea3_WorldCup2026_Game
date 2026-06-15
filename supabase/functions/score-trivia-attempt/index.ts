import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  evaluateCardProgression,
  type EvaluateCardProgressionInput,
  type EvaluateCardProgressionResult
} from "../_shared/evaluateCardProgression.ts";
import {
  parseScoreTriviaAttemptRequest,
  TRIVIA_DAILY_QUESTION_COUNT,
  type AnswerKey,
  type TriviaAnswerSubmission
} from "./schema.ts";
import {
  computeDayScore,
  type ScoreTriviaDayResult,
  type TriviaQuestionResult
} from "./scoreTriviaDay.ts";

type SupabaseClient = ReturnType<typeof createClient<any>>;

// Card progression must never break the core trivia save. If it fails, the
// attempt is still recorded and returned; pending upgrades are picked up later
// by the client's background pending-upgrades query.
async function safeEvaluateCardProgression(
  supabaseAdmin: ReturnType<typeof createClient>,
  input: EvaluateCardProgressionInput
): Promise<EvaluateCardProgressionResult | null> {
  try {
    return await evaluateCardProgression(supabaseAdmin, input);
  } catch (error) {
    console.error("score-trivia-attempt: card progression evaluation failed", error);
    return null;
  }
}

interface TriviaQuestionRow {
  id: string;
  correct_answer_key: AnswerKey;
  question_order: number;
}

interface TriviaAttemptRow {
  id: string;
  user_id: string;
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

interface ProfileStreakRow {
  current_trivia_streak: number;
  longest_trivia_streak: number;
}

interface ScoredAnswer extends TriviaAnswerSubmission {
  isCorrect: boolean;
  points: number;
}

// Card XP rules are unchanged from the legacy scorer — only the competitive
// points pipeline moved to scoreTriviaDay (PR-A).
const CARD_XP_RULES = {
  perCorrectAnswer: 25,
  completedDailyBonus: 50
} as const;

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*"
};

const ATTEMPT_COLUMNS =
  "id,user_id,active_date,total_questions,correct_answers,total_response_time_ms,competitive_points,earned_card_xp,completed_at";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    },
    status
  });
}

function mapAttempt(
  row: TriviaAttemptRow,
  answers: ScoredAnswer[],
  scoreBreakdown: ScoreTriviaDayResult | null,
  streak: { current: number; longest: number }
) {
  return {
    id: row.id,
    activeDate: row.active_date,
    totalQuestions: row.total_questions,
    correctAnswers: row.correct_answers,
    totalResponseTimeMs: row.total_response_time_ms,
    competitivePoints: row.competitive_points,
    earnedCardXp: row.earned_card_xp,
    completedAt: row.completed_at,
    answers: answers.map((answer) => ({
      questionId: answer.questionId,
      selectedAnswerKey: answer.selectedAnswerKey,
      responseTimeMs: answer.responseTimeMs,
      isCorrect: answer.isCorrect,
      points: answer.points
    })),
    score: scoreBreakdown
      ? {
          baseSum: scoreBreakdown.baseSum,
          comboBonusApplied: scoreBreakdown.comboBonusApplied,
          streakMultiplier: scoreBreakdown.streakMultiplier,
          newStreak: scoreBreakdown.newStreak,
          competitivePoints: scoreBreakdown.competitivePoints
        }
      : null,
    streak: {
      currentTriviaStreak: streak.current,
      longestTriviaStreak: streak.longest
    }
  };
}

async function loadProfileStreak(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<ProfileStreakRow> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("current_trivia_streak, longest_trivia_streak")
    .eq("id", userId)
    .maybeSingle<ProfileStreakRow>();

  if (error) {
    throw error;
  }

  return {
    current_trivia_streak: data?.current_trivia_streak ?? 0,
    longest_trivia_streak: data?.longest_trivia_streak ?? 0
  };
}

async function loadExistingAttempt(
  supabaseAdmin: SupabaseClient,
  userId: string,
  activeDate: string,
  streak: ProfileStreakRow
) {
  const { data: existingAttempt, error: attemptError } = await supabaseAdmin
    .from("trivia_attempts")
    .select(ATTEMPT_COLUMNS)
    .eq("user_id", userId)
    .eq("active_date", activeDate)
    .maybeSingle<TriviaAttemptRow>();

  if (attemptError) {
    throw attemptError;
  }

  if (!existingAttempt) {
    return null;
  }

  const { data: answerRows, error: answersError } = await supabaseAdmin
    .from("trivia_attempt_answers")
    .select("question_id, selected_answer_key, is_correct, response_time_ms")
    .eq("attempt_id", existingAttempt.id)
    .order("created_at", { ascending: true })
    .returns<TriviaAttemptAnswerRow[]>();

  if (answersError) {
    throw answersError;
  }

  const scoredAnswers: ScoredAnswer[] = answerRows.map((answer) => ({
    questionId: answer.question_id,
    selectedAnswerKey: answer.selected_answer_key,
    responseTimeMs: answer.response_time_ms,
    isCorrect: answer.is_correct,
    // No per-answer breakdown is persisted; surface 0 here. The authoritative
    // total lives on the attempt row.
    points: 0
  }));

  return mapAttempt(existingAttempt, scoredAnswers, null, {
    current: streak.current_trivia_streak,
    longest: streak.longest_trivia_streak
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const input = parseScoreTriviaAttemptRequest(await request.json());
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = request.headers.get("Authorization");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return jsonResponse({ error: "Supabase environment is not configured." }, 500);
    }

    if (!authorization) {
      return jsonResponse({ error: "Missing Authorization header." }, 401);
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      },
      global: {
        headers: {
          Authorization: authorization
        }
      }
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !userData.user) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const userId = userData.user.id;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false
      }
    });

    const priorStreak = await loadProfileStreak(supabaseAdmin, userId);

    const existingAttempt = await loadExistingAttempt(
      supabaseAdmin,
      userId,
      input.activeDate,
      priorStreak
    );

    if (existingAttempt) {
      // Re-run progression idempotently so a prior attempt that persisted but
      // failed to record its upgrade can still recover on a retry.
      const cardProgression = await safeEvaluateCardProgression(supabaseAdmin, {
        userId: userData.user.id,
        markFirstTrivia: true,
      });

      return jsonResponse({ attempt: existingAttempt, cardProgression });
    }

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("trivia_questions")
      .select("id, correct_answer_key, question_order")
      .eq("active_date", input.activeDate)
      .order("question_order", { ascending: true })
      .returns<TriviaQuestionRow[]>();

    if (questionsError) {
      throw questionsError;
    }

    if (questions.length !== TRIVIA_DAILY_QUESTION_COUNT) {
      return jsonResponse(
        { error: `Daily trivia for ${input.activeDate} is not configured.` },
        400
      );
    }

    const questionById = new Map<string, TriviaQuestionRow>(
      questions.map((q) => [q.id, q])
    );

    const allMatch = input.answers.every((answer) =>
      questionById.has(answer.questionId)
    );

    if (!allMatch) {
      return jsonResponse({ error: "Attempt answers do not match today's questions." }, 400);
    }

    // Build per-question results sorted by question_order so Q1/Q2/Q3 line up
    // with the daily trivia scorer.
    const sortedAnswers: Array<{
      submission: TriviaAnswerSubmission;
      question: TriviaQuestionRow;
      isCorrect: boolean;
    }> = input.answers
      .map((submission) => {
        const question = questionById.get(submission.questionId)!;
        return {
          submission,
          question,
          isCorrect: question.correct_answer_key === submission.selectedAnswerKey
        };
      })
      .sort((a, b) => a.question.question_order - b.question.question_order);

    const scoreInput: [
      TriviaQuestionResult,
      TriviaQuestionResult,
      TriviaQuestionResult
    ] = [
      {
        questionId: sortedAnswers[0].question.id,
        isCorrect: sortedAnswers[0].isCorrect,
        responseTimeMs: sortedAnswers[0].submission.responseTimeMs
      },
      {
        questionId: sortedAnswers[1].question.id,
        isCorrect: sortedAnswers[1].isCorrect,
        responseTimeMs: sortedAnswers[1].submission.responseTimeMs
      },
      {
        questionId: sortedAnswers[2].question.id,
        isCorrect: sortedAnswers[2].isCorrect,
        responseTimeMs: sortedAnswers[2].submission.responseTimeMs
      }
    ];

    const score = computeDayScore(scoreInput, priorStreak.current_trivia_streak);

    const correctAnswers = sortedAnswers.filter((a) => a.isCorrect).length;
    const totalResponseTimeMs = sortedAnswers.reduce(
      (sum, a) => sum + a.submission.responseTimeMs,
      0
    );
    const earnedCardXp =
      correctAnswers * CARD_XP_RULES.perCorrectAnswer +
      (correctAnswers === TRIVIA_DAILY_QUESTION_COUNT
        ? CARD_XP_RULES.completedDailyBonus
        : 0);

    const { data: attempt, error: attemptInsertError } = await supabaseAdmin
      .from("trivia_attempts")
      .insert({
        user_id: userId,
        active_date: input.activeDate,
        total_questions: TRIVIA_DAILY_QUESTION_COUNT,
        correct_answers: correctAnswers,
        total_response_time_ms: totalResponseTimeMs,
        competitive_points: score.competitivePoints,
        earned_card_xp: earnedCardXp
      })
      .select(ATTEMPT_COLUMNS)
      .single<TriviaAttemptRow>();

    if (attemptInsertError) {
      throw attemptInsertError;
    }

    const { error: answersInsertError } = await supabaseAdmin
      .from("trivia_attempt_answers")
      .insert(
        sortedAnswers.map((a) => ({
          attempt_id: attempt.id,
          question_id: a.submission.questionId,
          selected_answer_key: a.submission.selectedAnswerKey,
          is_correct: a.isCorrect,
          response_time_ms: a.submission.responseTimeMs
        }))
      );

    if (answersInsertError) {
      throw answersInsertError;
    }

    // Persist the trivia streak on the profile.
    const newLongestStreak = Math.max(
      priorStreak.longest_trivia_streak,
      score.newStreak
    );
    const { error: streakError } = await supabaseAdmin
      .from("profiles")
      .update({
        current_trivia_streak: score.newStreak,
        longest_trivia_streak: newLongestStreak
      })
      .eq("id", userId);

    if (streakError) {
      throw streakError;
    }

    const xpEvents = [
      {
        user_id: userId,
        source_type: "daily_trivia",
        source_id: attempt.id,
        currency_type: "competitive_points",
        amount: score.competitivePoints,
        reason: `Daily trivia ${input.activeDate}`,
        counts_toward_leaderboard: true
      },
      {
        user_id: userId,
        source_type: "daily_trivia",
        source_id: attempt.id,
        currency_type: "earned_xp",
        amount: earnedCardXp,
        reason: `Daily trivia ${input.activeDate}`,
        counts_toward_leaderboard: false
      }
    ];

    const { error: xpEventError } = await supabaseAdmin.from("xp_events").insert(xpEvents);

    if (xpEventError) {
      throw xpEventError;
    }

    const scoredAnswers: ScoredAnswer[] = sortedAnswers.map((a, i) => ({
      questionId: a.submission.questionId,
      selectedAnswerKey: a.submission.selectedAnswerKey,
      responseTimeMs: a.submission.responseTimeMs,
      isCorrect: a.isCorrect,
      points: score.perQuestion[i].total
    }));

    const cardProgression = await safeEvaluateCardProgression(supabaseAdmin, {
      userId,
      markFirstTrivia: true,
    });

    return jsonResponse({
      attempt: mapAttempt(attempt, scoredAnswers, score, {
        current: score.newStreak,
        longest: newLongestStreak
      }),
      cardProgression,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected score-trivia-attempt error." },
      400
    );
  }
});

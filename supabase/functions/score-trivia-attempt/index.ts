import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  parseScoreTriviaAttemptRequest,
  type AnswerKey,
  type TriviaAnswerSubmission
} from "./schema.ts";

interface TriviaQuestionRow {
  id: string;
  correct_answer_key: AnswerKey;
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

interface ScoredAnswer extends TriviaAnswerSubmission {
  isCorrect: boolean;
  points: number;
}

const TRIVIA_RULES = {
  questionsPerDay: 5,
  correctAnswerCompetitivePoints: 100,
  maxSpeedBonusPerQuestion: 20,
  correctAnswerCardXp: 25,
  completedDailyTriviaCardXp: 50
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

function calculateAnswerPoints(isCorrect: boolean, responseTimeMs: number): number {
  if (!isCorrect) return 0;

  const cappedMs = Math.max(0, Math.min(responseTimeMs, 30_000));
  const remainingRatio = (30_000 - cappedMs) / 30_000;
  const speedBonus = Math.round(TRIVIA_RULES.maxSpeedBonusPerQuestion * remainingRatio);

  return TRIVIA_RULES.correctAnswerCompetitivePoints + speedBonus;
}

function mapAttempt(row: TriviaAttemptRow, answers: ScoredAnswer[]) {
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
    }))
  };
}

function scoreAnswers(
  submissions: TriviaAnswerSubmission[],
  questions: TriviaQuestionRow[]
): ScoredAnswer[] {
  const correctByQuestionId = Object.fromEntries(
    questions.map((question) => [question.id, question.correct_answer_key])
  );

  return submissions.map((submission) => {
    const isCorrect = correctByQuestionId[submission.questionId] === submission.selectedAnswerKey;

    return {
      ...submission,
      isCorrect,
      points: calculateAnswerPoints(isCorrect, submission.responseTimeMs)
    };
  });
}

async function loadExistingAttempt(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  activeDate: string
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

  const scoredAnswers = answerRows.map((answer) => ({
    questionId: answer.question_id,
    selectedAnswerKey: answer.selected_answer_key,
    responseTimeMs: answer.response_time_ms,
    isCorrect: answer.is_correct,
    points: calculateAnswerPoints(answer.is_correct, answer.response_time_ms)
  }));

  return mapAttempt(existingAttempt, scoredAnswers);
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false
      }
    });

    const existingAttempt = await loadExistingAttempt(
      supabaseAdmin,
      userData.user.id,
      input.activeDate
    );

    if (existingAttempt) {
      return jsonResponse({ attempt: existingAttempt });
    }

    if (input.answers.length !== TRIVIA_RULES.questionsPerDay) {
      return jsonResponse(
        { error: `Daily trivia requires exactly ${TRIVIA_RULES.questionsPerDay} answers.` },
        400
      );
    }

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("trivia_questions")
      .select("id, correct_answer_key")
      .eq("active_date", input.activeDate)
      .returns<TriviaQuestionRow[]>();

    if (questionsError) {
      throw questionsError;
    }

    if (questions.length !== TRIVIA_RULES.questionsPerDay) {
      return jsonResponse(
        { error: `Daily trivia for ${input.activeDate} is not configured.` },
        400
      );
    }

    const validQuestionIds = new Set(questions.map((question) => question.id));
    const answersMatchDailyQuestions = input.answers.every((answer) =>
      validQuestionIds.has(answer.questionId)
    );

    if (!answersMatchDailyQuestions) {
      return jsonResponse({ error: "Attempt answers do not match today's questions." }, 400);
    }

    const scoredAnswers = scoreAnswers(input.answers, questions);
    const correctAnswers = scoredAnswers.filter((answer) => answer.isCorrect).length;
    const totalResponseTimeMs = scoredAnswers.reduce(
      (total, answer) => total + answer.responseTimeMs,
      0
    );
    const competitivePoints = scoredAnswers.reduce((total, answer) => total + answer.points, 0);
    const earnedCardXp =
      correctAnswers * TRIVIA_RULES.correctAnswerCardXp +
      TRIVIA_RULES.completedDailyTriviaCardXp;

    const { data: attempt, error: attemptInsertError } = await supabaseAdmin
      .from("trivia_attempts")
      .insert({
        user_id: userData.user.id,
        active_date: input.activeDate,
        total_questions: TRIVIA_RULES.questionsPerDay,
        correct_answers: correctAnswers,
        total_response_time_ms: totalResponseTimeMs,
        competitive_points: competitivePoints,
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
        scoredAnswers.map((answer) => ({
          attempt_id: attempt.id,
          question_id: answer.questionId,
          selected_answer_key: answer.selectedAnswerKey,
          is_correct: answer.isCorrect,
          response_time_ms: answer.responseTimeMs
        }))
      );

    if (answersInsertError) {
      throw answersInsertError;
    }

    const xpEvents = [
      {
        user_id: userData.user.id,
        source_type: "daily_trivia",
        source_id: attempt.id,
        currency_type: "competitive_points",
        amount: competitivePoints,
        reason: `Daily trivia ${input.activeDate}`,
        counts_toward_leaderboard: true
      },
      {
        user_id: userData.user.id,
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

    return jsonResponse({ attempt: mapAttempt(attempt, scoredAnswers) });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected score-trivia-attempt error." },
      400
    );
  }
});

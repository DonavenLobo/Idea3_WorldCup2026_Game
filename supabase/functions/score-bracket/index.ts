import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { parseScoreBracketRequest } from "./schema.ts";
import {
  scoreBracket,
  type BracketKnockoutPrediction,
  type BracketKnockoutResult,
  type BracketScoreInput,
  type GroupId,
  type KnockoutRoundId,
} from "./scoreBracket.ts";

// ---------- FIFA seeds ----------
// TODO: PR-B — move to a fifa_seeds DB table.
//
// Seeds are keyed by nation code as defined in packages/config/src/nations.ts
// (SUPPORTED_NATIONS, 48 entries). Lower number = better team. The values
// below are best-effort tiers for PR-A — replace with the official FIFA
// world ranking snapshot once the seeds table lands. Any nation not in this
// map gets no upset bonus (typeof seed !== "number").
const FIFA_SEEDS: Record<string, number> = {
  // Tier 1 (1-10) — confederation favorites
  ARG: 1, FRA: 2, ESP: 3, ENG: 4, BRA: 5,
  NED: 6, POR: 7, BEL: 8, ITA: 9, CRO: 10,
  // Tier 2 (11-20)
  MAR: 11, SUI: 12, GER: 13, COL: 14, MEX: 15,
  URU: 16, USA: 17, SEN: 18, JPN: 19, IRN: 20,
  // Tier 3 (21-30)
  AUS: 21, KOR: 22, ECU: 23, TUR: 24, NOR: 25,
  EGY: 26, TUN: 27, ALG: 28, SWE: 29, AUT: 30,
  // Tier 4 (31-48) — qualified outsiders + debutants
  CAN: 31, QAT: 32, BIH: 33, KSA: 34, GHA: 35,
  PAR: 36, SCO: 37, RSA: 38, CIV: 39, JOR: 40,
  IRQ: 41, NZL: 42, UZB: 43, PAN: 44, HAI: 45,
  CZE: 46, CPV: 47, COD: 48, CUW: 49,
};

type SupabaseClient = ReturnType<typeof createClient<any>>;

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

const KNOCKOUT_ROUNDS: readonly KnockoutRoundId[] = [
  "r32", "r16", "qf", "sf", "third", "final",
] as const;
const KNOCKOUT_ROUND_SET = new Set<string>(KNOCKOUT_ROUNDS);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status,
  });
}

interface BracketRow {
  id: string;
  user_id: string;
  group_id: string | null;
  picks: unknown;
  score: number;
  scored_at: string | null;
}

interface RawBracketPicks {
  groupRankings?: Record<string, string[]>;
  picks?: {
    r32?: Record<string, string>;
    r16?: Record<string, string>;
    qf?: Record<string, string>;
    sf?: Record<string, string>;
    final?: string | null;
    third?: string | null;
  };
}

interface MatchRow {
  id: string;
  round: string;
  group_id: string | null;
  bracket_index: number | null;
  home_team_code: string | null;
  away_team_code: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
}

interface GroupStanding {
  code: string;
  points: number;
  goalDiff: number;
  goalsFor: number;
}

async function loadBracket(
  supabaseAdmin: SupabaseClient,
  userId: string,
  bracketId: string | null
): Promise<BracketRow | null> {
  const columns = "id,user_id,group_id,picks,score,scored_at";

  if (bracketId) {
    const { data, error } = await supabaseAdmin
      .from("brackets")
      .select(columns)
      .eq("id", bracketId)
      .eq("user_id", userId)
      .maybeSingle<BracketRow>();
    if (error) throw error;
    return data;
  }

  // No id provided — score the caller's most recent solo bracket.
  const { data, error } = await supabaseAdmin
    .from("brackets")
    .select(columns)
    .eq("user_id", userId)
    .is("group_id", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<BracketRow>();
  if (error) throw error;
  return data;
}

async function loadMatches(supabaseAdmin: SupabaseClient): Promise<MatchRow[]> {
  const { data, error } = await supabaseAdmin
    .from("matches")
    .select(
      "id,round,group_id,bracket_index,home_team_code,away_team_code,status,home_score,away_score"
    );
  if (error) throw error;
  return (data ?? []) as MatchRow[];
}

/**
 * Compute group-stage final standings from a list of completed group matches.
 *
 * Returns an array of nation codes ordered 1st..4th, or `null` if the group
 * isn't fully resolved (any match missing scores or not `completed`, or the
 * group has fewer than the expected 6 matches once matchdays 2/3 land).
 *
 * Tiebreakers in this PR-A implementation: points → goal diff → goals for →
 * alphabetical (deterministic last resort). The official FIFA tiebreaker
 * chain (head-to-head, fair play, etc.) will land with the live-results
 * ingest pipeline in PR-B.
 */
function computeGroupStandings(matches: MatchRow[]): string[] | null {
  if (matches.length === 0) return null;

  // Every match must be completed with both scores present.
  for (const m of matches) {
    if (
      m.status !== "completed" ||
      m.home_score === null ||
      m.away_score === null ||
      !m.home_team_code ||
      !m.away_team_code
    ) {
      return null;
    }
  }

  const standings = new Map<string, GroupStanding>();
  const ensure = (code: string): GroupStanding => {
    let s = standings.get(code);
    if (!s) {
      s = { code, points: 0, goalDiff: 0, goalsFor: 0 };
      standings.set(code, s);
    }
    return s;
  };

  for (const m of matches) {
    const home = ensure(m.home_team_code!);
    const away = ensure(m.away_team_code!);
    const hs = m.home_score!;
    const as = m.away_score!;
    home.goalsFor += hs;
    away.goalsFor += as;
    home.goalDiff += hs - as;
    away.goalDiff += as - hs;
    if (hs > as) home.points += 3;
    else if (hs < as) away.points += 3;
    else {
      home.points += 1;
      away.points += 1;
    }
  }

  // A finalized group should have exactly 4 distinct teams that each played
  // 3 matches (6 total). Bail if the shape isn't right — incomplete groups
  // should not be scored as if final.
  if (standings.size !== 4 || matches.length !== 6) return null;

  const ordered = [...standings.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.code.localeCompare(b.code);
  });

  return ordered.map((s) => s.code);
}

/** Convert match rows → scoreBracket results shape. */
function buildResultsFromMatches(matches: MatchRow[]): BracketScoreInput["results"] {
  const groups: Partial<Record<GroupId, readonly string[]>> = {};
  const knockouts: BracketKnockoutResult[] = [];

  // Bucket group matches by group_id.
  const groupBuckets = new Map<string, MatchRow[]>();
  for (const m of matches) {
    if (m.round === "group" && m.group_id) {
      let bucket = groupBuckets.get(m.group_id);
      if (!bucket) {
        bucket = [];
        groupBuckets.set(m.group_id, bucket);
      }
      bucket.push(m);
      continue;
    }
    if (
      KNOCKOUT_ROUND_SET.has(m.round) &&
      m.status === "completed" &&
      m.bracket_index !== null &&
      m.home_team_code &&
      m.away_team_code &&
      m.home_score !== null &&
      m.away_score !== null
    ) {
      // Ties in knockouts can't be scored without penalty data — skip those.
      if (m.home_score === m.away_score) continue;
      const homeWon = m.home_score > m.away_score;
      knockouts.push({
        round: m.round as KnockoutRoundId,
        index: m.bracket_index,
        winnerCode: homeWon ? m.home_team_code : m.away_team_code,
        loserCode: homeWon ? m.away_team_code : m.home_team_code,
      });
    }
  }

  for (const [gid, bucket] of groupBuckets.entries()) {
    const standings = computeGroupStandings(bucket);
    if (standings) {
      groups[gid as GroupId] = standings;
    }
  }

  return { groups, knockouts };
}

/** Convert the DB picks payload → scoreBracket predictions shape. */
function buildPredictionsFromPicks(picks: RawBracketPicks): BracketScoreInput["predictions"] {
  const groups: Partial<Record<GroupId, readonly string[]>> = {};
  const groupRankings = picks.groupRankings ?? {};
  for (const [gid, ranking] of Object.entries(groupRankings)) {
    if (Array.isArray(ranking) && ranking.length > 0) {
      groups[gid as GroupId] = ranking;
    }
  }

  const knockouts: BracketKnockoutPrediction[] = [];
  const koPicks = picks.picks ?? {};

  const pushRoundDict = (
    round: Extract<KnockoutRoundId, "r32" | "r16" | "qf" | "sf">,
    dict: Record<string, string> | undefined
  ) => {
    if (!dict) return;
    for (const [idxStr, winnerCode] of Object.entries(dict)) {
      const index = Number.parseInt(idxStr, 10);
      if (!Number.isFinite(index) || !winnerCode) continue;
      knockouts.push({ round, index, winnerCode });
    }
  };

  pushRoundDict("r32", koPicks.r32);
  pushRoundDict("r16", koPicks.r16);
  pushRoundDict("qf", koPicks.qf);
  pushRoundDict("sf", koPicks.sf);

  if (koPicks.final) {
    knockouts.push({ round: "final", index: 0, winnerCode: koPicks.final });
  }
  if (koPicks.third) {
    knockouts.push({ round: "third", index: 0, winnerCode: koPicks.third });
  }

  return { groups, knockouts };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    // Parse body if present; default to empty payload.
    let rawBody: unknown = null;
    const text = await request.text();
    if (text.trim().length > 0) {
      try {
        rawBody = JSON.parse(text);
      } catch {
        return jsonResponse({ error: "Request body is not valid JSON." }, 400);
      }
    }
    const input = parseScoreBracketRequest(rawBody);

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
      auth: { persistSession: false },
      global: { headers: { Authorization: authorization } },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const userId = userData.user.id;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    const bracket = await loadBracket(supabaseAdmin, userId, input.bracketId);
    if (!bracket) {
      return jsonResponse({ error: "Bracket not found." }, 404);
    }

    const picks = (bracket.picks ?? {}) as RawBracketPicks;
    const predictions = buildPredictionsFromPicks(picks);

    const matches = await loadMatches(supabaseAdmin);
    const results = buildResultsFromMatches(matches);

    const scoreResult = scoreBracket({
      predictions,
      results,
      fifaSeeds: FIFA_SEEDS,
    });

    const { error: updateError } = await supabaseAdmin
      .from("brackets")
      .update({
        score: scoreResult.total,
        scored_at: new Date().toISOString(),
      })
      .eq("id", bracket.id);

    if (updateError) {
      throw updateError;
    }

    return jsonResponse({
      bracketId: bracket.id,
      total: scoreResult.total,
      groupPoints: scoreResult.groupPoints,
      knockoutPoints: scoreResult.knockoutPoints,
      breakdown: scoreResult.breakdown,
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error ? error.message : "Unexpected score-bracket error.",
      },
      400
    );
  }
});

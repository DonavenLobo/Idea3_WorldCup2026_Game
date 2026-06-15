import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SCORE_SOURCE = "worldcup26.ir";
const DEFAULT_SOURCE_URL = "https://worldcup26.ir/get/games";
const SOURCE_TIMEOUT_MS = 25_000;
const PRE_MATCH_POLL_MS = 15 * 60 * 1000;
const POST_KICKOFF_POLL_MS = 4 * 60 * 60 * 1000;

type SupabaseClient = ReturnType<typeof createClient<any>>;

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*"
};

type MatchStatus = "scheduled" | "live" | "completed";

interface SourceGame {
  id?: string | number;
  home_score?: string | number | null;
  away_score?: string | number | null;
  finished?: string | boolean | null;
  time_elapsed?: string | null;
}

interface SyncMatchScoresRequest {
  force?: boolean;
}

interface MatchCacheRow {
  away_score: number | null;
  home_score: number | null;
  kickoff: string;
  match_num: number;
  score_source_match_id: string;
  status: MatchStatus;
}

interface MatchScoreUpdate {
  away_score: number | null;
  home_score: number | null;
  match_num: number;
  status: MatchStatus;
  score_synced_at: string;
  updated_at: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    },
    status
  });
}

function requestHasSyncSecret(request: Request): boolean {
  const syncSecret = Deno.env.get("SYNC_MATCH_SCORES_SECRET");
  if (!syncSecret) return false;

  const authorization = request.headers.get("Authorization") ?? "";
  const bearerToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  const headerSecret = request.headers.get("x-sync-secret");

  return bearerToken === syncSecret || headerSecret === syncSecret;
}

function normalizeStatus(game: SourceGame): MatchStatus {
  const elapsed = game.time_elapsed?.toLowerCase();
  const finished =
    game.finished === true || String(game.finished ?? "").toLowerCase() === "true";

  if (elapsed === "live") return "live";
  if (finished || elapsed === "finished") return "completed";
  return "scheduled";
}

function parseScore(value: SourceGame["home_score"]): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function parseRequest(request: Request): Promise<SyncMatchScoresRequest> {
  const rawBody = await request.text();
  if (!rawBody.trim()) return {};

  const input = JSON.parse(rawBody) as Partial<SyncMatchScoresRequest>;
  if (input.force !== undefined && typeof input.force !== "boolean") {
    throw new Error("Invalid sync request: force must be a boolean.");
  }

  return { force: input.force };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unexpected match score sync error.";
  }
}

function getSyncWindowState(cacheRows: MatchCacheRow[], nowMs: number) {
  let liveCachedCount = 0;
  let activeWindowCount = 0;
  let nextPollAtMs: number | null = null;

  for (const row of cacheRows) {
    if (row.status === "live") {
      liveCachedCount += 1;
    }

    const kickoffMs = new Date(row.kickoff).getTime();
    if (!Number.isFinite(kickoffMs)) continue;

    const windowStartMs = kickoffMs - PRE_MATCH_POLL_MS;
    const windowEndMs = kickoffMs + POST_KICKOFF_POLL_MS;

    if (nowMs >= windowStartMs && nowMs <= windowEndMs) {
      activeWindowCount += 1;
    } else if (nowMs < windowStartMs) {
      nextPollAtMs =
        nextPollAtMs === null
          ? windowStartMs
          : Math.min(nextPollAtMs, windowStartMs);
    }
  }

  return {
    activeWindowCount,
    liveCachedCount,
    nextPollAt: nextPollAtMs === null ? null : new Date(nextPollAtMs).toISOString(),
    shouldFetch: liveCachedCount > 0 || activeWindowCount > 0
  };
}

async function fetchSourceGames(sourceUrl: string): Promise<SourceGame[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SOURCE_TIMEOUT_MS);

  try {
    const response = await fetch(sourceUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Score source returned ${response.status}.`);
    }

    const payload = await response.json();
    if (!payload || !Array.isArray(payload.games)) {
      throw new Error("Score source response did not include a games array.");
    }

    return payload.games as SourceGame[];
  } finally {
    clearTimeout(timeout);
  }
}

function buildUpdates(
  games: SourceGame[],
  cacheRows: MatchCacheRow[],
  syncedAt: string
) {
  const rowBySourceId = new Map(
    cacheRows.map((row) => [row.score_source_match_id, row])
  );
  const updates: MatchScoreUpdate[] = [];
  const missingSourceIds: string[] = [];

  for (const game of games) {
    const sourceId = String(game.id ?? "");
    if (!sourceId) continue;

    const cacheRow = rowBySourceId.get(sourceId);
    if (!cacheRow) {
      missingSourceIds.push(sourceId);
      continue;
    }

    const sourceStatus = normalizeStatus(game);
    const isCompletedDowngrade =
      cacheRow.status === "completed" && sourceStatus !== "completed";
    const status = isCompletedDowngrade ? cacheRow.status : sourceStatus;

    const sourceHomeScore = parseScore(game.home_score);
    const sourceAwayScore = parseScore(game.away_score);
    const shouldUseSourceScore =
      sourceStatus === "live" || sourceStatus === "completed";

    updates.push({
      match_num: cacheRow.match_num,
      status,
      home_score: isCompletedDowngrade
        ? cacheRow.home_score
        : shouldUseSourceScore
          ? sourceHomeScore
          : null,
      away_score: isCompletedDowngrade
        ? cacheRow.away_score
        : shouldUseSourceScore
          ? sourceAwayScore
          : null,
      score_synced_at: syncedAt,
      updated_at: syncedAt
    });
  }

  return { updates, missingSourceIds };
}

async function applyUpdates(
  supabaseAdmin: SupabaseClient,
  updates: MatchScoreUpdate[]
) {
  const chunkSize = 20;

  for (let start = 0; start < updates.length; start += chunkSize) {
    const chunk = updates.slice(start, start + chunkSize);
    const results = await Promise.all(
      chunk.map((update) => {
        const { match_num, ...payload } = update;
        return supabaseAdmin
          .from("matches")
          .update(payload)
          .eq("match_num", match_num);
      })
    );

    const failed = results.find((result) => result.error);
    if (failed?.error) {
      throw failed.error;
    }
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    if (!Deno.env.get("SYNC_MATCH_SCORES_SECRET")) {
      return jsonResponse({ error: "SYNC_MATCH_SCORES_SECRET is not configured." }, 500);
    }

    if (!requestHasSyncSecret(request)) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const input = await parseRequest(request);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse({ error: "Supabase environment is not configured." }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });

    const sourceUrl = Deno.env.get("MATCH_SCORE_SOURCE_URL") ?? DEFAULT_SOURCE_URL;
    const cacheResult = await supabaseAdmin
      .from("matches")
      .select("match_num,score_source_match_id,status,home_score,away_score,kickoff")
      .eq("score_source", SCORE_SOURCE)
      .not("match_num", "is", null)
      .not("score_source_match_id", "is", null)
      .returns<MatchCacheRow[]>();

    if (cacheResult.error) {
      throw cacheResult.error;
    }

    const cacheRows = cacheResult.data ?? [];
    const now = new Date();
    const syncWindowState = getSyncWindowState(cacheRows, now.getTime());

    if (!input.force && !syncWindowState.shouldFetch) {
      return jsonResponse({
        source: SCORE_SOURCE,
        skipped: true,
        reason: "no_active_match_window",
        checkedAt: now.toISOString(),
        nextPollAt: syncWindowState.nextPollAt,
        activeWindowMatches: syncWindowState.activeWindowCount,
        liveCachedMatches: syncWindowState.liveCachedCount
      });
    }

    const games = await fetchSourceGames(sourceUrl);
    const syncedAt = new Date().toISOString();
    const { updates, missingSourceIds } = buildUpdates(
      games,
      cacheRows,
      syncedAt
    );

    if (updates.length === 0) {
      return jsonResponse({
        error: "No score updates mapped to cached matches.",
        missingSourceIds
      }, 409);
    }

    await applyUpdates(supabaseAdmin, updates);

    return jsonResponse({
      source: SCORE_SOURCE,
      fetched: games.length,
      forced: input.force === true,
      updated: updates.length,
      live: updates.filter((match) => match.status === "live").length,
      completed: updates.filter((match) => match.status === "completed").length,
      missingSourceIds,
      syncedAt
    });
  } catch (error) {
    return jsonResponse({ error: errorMessage(error) }, 400);
  }
});

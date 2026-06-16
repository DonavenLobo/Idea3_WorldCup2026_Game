import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { parseSubmitBracketRequest } from "./schema.ts";
import {
  validateBracketWriteAgainstFinalized,
  type BracketPicksPayload
} from "./validateFixtures.ts";

// EdgeRuntime is provided by Supabase's deno runtime. Declared inline so the
// type-checker on a vanilla `deno check` is happy — mirrors the pattern used
// by generate-card-avatar/index.ts.
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined;

const SCORE_BRACKET_TIMEOUT_MS = 3000;

/**
 * Fire-and-forget call into the sibling `score-bracket` edge function so the
 * caller's competitive points stay in sync with the latest picks. Errors are
 * logged but never surface to the user — the bracket save is the priority and
 * must not regress on a downstream scoring hiccup.
 */
function fireScoreBracket(
  supabaseUrl: string,
  serviceRoleKey: string,
  bracketId: string
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCORE_BRACKET_TIMEOUT_MS);

  return fetch(`${supabaseUrl}/functions/v1/score-bracket`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // The score-bracket fn re-uses the same auth model as the other edge
      // fns (anon-key → getUser). The service-role key authorizes the call
      // and short-circuits user lookup via the Authorization header.
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey
    },
    body: JSON.stringify({ bracketId }),
    signal: controller.signal
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => "<no body>");
        console.error(
          `[submit-bracket] score-bracket returned ${res.status}: ${text}`
        );
      }
    })
    .catch((error) => {
      console.error("[submit-bracket] score-bracket invocation failed", error);
    })
    .finally(() => clearTimeout(timeout));
}

interface BracketRow {
  id: string;
  user_id: string;
  group_id: string | null;
  picks: unknown;
  score: number;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ExistingBracketRow {
  id: string;
  locked_at: string | null;
}

type SupabaseClient = ReturnType<typeof createClient<any>>;

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*"
};

const BRACKET_COLUMNS = "id,user_id,group_id,picks,score,locked_at,created_at,updated_at";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    },
    status
  });
}

function mapBracket(row: BracketRow) {
  return {
    id: row.id,
    userId: row.user_id,
    groupId: row.group_id,
    picks: row.picks,
    score: row.score,
    lockedAt: row.locked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function isGroupMember(
  supabase: SupabaseClient,
  groupId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

async function fetchExistingPicks(
  supabase: SupabaseClient,
  bracketId: string
): Promise<BracketPicksPayload | null> {
  const { data, error } = await supabase
    .from("brackets")
    .select("picks")
    .eq("id", bracketId)
    .maybeSingle<{ picks: unknown }>();
  if (error) throw error;
  if (!data) return null;
  return data.picks as BracketPicksPayload;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const input = parseSubmitBracketRequest(await request.json());
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

    let existingQuery = supabaseAdmin
      .from("brackets")
      .select("id,locked_at")
      .eq("user_id", userData.user.id)
      .order("updated_at", { ascending: false })
      .limit(1);

    existingQuery = input.groupId
      ? existingQuery.eq("group_id", input.groupId)
      : existingQuery.is("group_id", null);

    const { data: existingBracket, error: existingError } =
      await existingQuery.maybeSingle<ExistingBracketRow>();

    if (existingError) {
      throw existingError;
    }

    // Group bracket: confirm membership before allowing the write.
    if (input.groupId) {
      const isMember = await isGroupMember(supabaseAdmin, input.groupId, userData.user.id);
      if (!isMember) {
        return jsonResponse({ ok: false, code: "NOT_GROUP_MEMBER" });
      }
    }

    // Lock-on-save validation: a change targeting an already-finalized group
    // or knockout round is rejected. Source of truth is the existing bracket's
    // `picks` JSONB (same place `finalizedGroups` lives).
    const existingPicks = existingBracket
      ? await fetchExistingPicks(supabaseAdmin, existingBracket.id)
      : null;

    const validation = validateBracketWriteAgainstFinalized(
      existingPicks,
      input.picks as BracketPicksPayload
    );

    if (!validation.ok) {
      return jsonResponse({
        ok: false,
        code: "PICK_PAST_LOCKOUT",
        invalidGroups: validation.invalidGroups,
        invalidRounds: validation.invalidRounds
      });
    }

    // (Binary `locked_at` check removed — phased lockout is enforced by
    // validateBracketWriteAgainstFinalized above. The locked_at column
    // remains nullable on the table but is no longer consulted.)

    const now = new Date().toISOString();
    // Mirror per-round finalized flags from the JSONB payload onto the
    // queryable boolean columns added in migration 000033. The JSONB stays the
    // source of truth for detail-level state (picks within a round); these
    // columns are the canonical rollups ("is user X's R32 finalized?").
    const kf = input.picks.knockoutFinalized ?? {};
    const writePayload = {
      group_id: input.groupId,
      picks: input.picks,
      updated_at: now,
      r32_finalized: kf.r32 ?? false,
      r16_finalized: kf.r16 ?? false,
      qf_finalized: kf.qf ?? false,
      sf_finalized: kf.sf ?? false,
      final_finalized: kf.final ?? false,
      third_finalized: kf.third ?? false
    };

    const writeQuery = existingBracket
      ? supabaseAdmin
        .from("brackets")
        .update(writePayload)
        .eq("id", existingBracket.id)
        .is("locked_at", null)
      : supabaseAdmin
        .from("brackets")
        .insert({
          ...writePayload,
          score: 0,
          user_id: userData.user.id
        });

    const { data: savedBracket, error: writeError } = await writeQuery
      .select(BRACKET_COLUMNS)
      .single<BracketRow>();

    if (writeError) {
      throw writeError;
    }

    // Fire-and-forget rescore. Tolerated failure: a score-bracket error must
    // never cause the bracket save itself to look like it failed to the user.
    const scorePromise = fireScoreBracket(
      supabaseUrl,
      supabaseServiceRoleKey,
      savedBracket.id
    );
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      EdgeRuntime.waitUntil(scorePromise);
    } else {
      // Pure local Deno fallback. `.catch` is already attached inside
      // fireScoreBracket — this is just to prevent UnhandledPromiseRejection
      // warnings in test environments.
      scorePromise.catch(() => {});
    }

    return jsonResponse({ ok: true, bracket: mapBracket(savedBracket) });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected submit-bracket error." },
      400
    );
  }
});

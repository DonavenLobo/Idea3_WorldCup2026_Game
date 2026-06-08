import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { parseSubmitBracketRequest } from "./schema.ts";
import {
  loadKickoffMaps,
  validateBracketAgainstFixtures,
  type BracketPicksPayload
} from "./validateFixtures.ts";

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

    // Fixture validation: any CHANGED pick on a passed-kickoff unit is rejected.
    const [existingPicks, kickoffMaps] = await Promise.all([
      existingBracket ? fetchExistingPicks(supabaseAdmin, existingBracket.id) : Promise.resolve(null),
      loadKickoffMaps(supabaseAdmin)
    ]);

    const validation = validateBracketAgainstFixtures(
      Date.now(),
      input.picks as BracketPicksPayload,
      existingPicks,
      kickoffMaps.groupKickoffMs,
      kickoffMaps.knockoutKickoffMs
    );

    if (validation.invalidGroups.length > 0 || validation.invalidMatches.length > 0) {
      return jsonResponse({
        ok: false,
        code: "PICK_PAST_LOCKOUT",
        invalidGroups: validation.invalidGroups,
        invalidMatches: validation.invalidMatches
      });
    }

    // (Binary `locked_at` check removed — phased lockout is enforced by
    // validateBracketAgainstFixtures above. The locked_at column remains
    // nullable on the table but is no longer consulted.)

    const now = new Date().toISOString();
    const writePayload = {
      group_id: input.groupId,
      picks: input.picks,
      updated_at: now
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

    return jsonResponse({ ok: true, bracket: mapBracket(savedBracket) });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected submit-bracket error." },
      400
    );
  }
});

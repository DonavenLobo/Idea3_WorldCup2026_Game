import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { parseSubmitBracketRequest } from "./schema.ts";

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
    const authorization = request.headers.get("Authorization");

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ error: "Supabase environment is not configured." }, 500);
    }

    if (!authorization) {
      return jsonResponse({ error: "Missing Authorization header." }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      },
      global: {
        headers: {
          Authorization: authorization
        }
      }
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    let existingQuery = supabase
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

    if (existingBracket?.locked_at) {
      return jsonResponse({ error: "This bracket is locked and can no longer be changed." }, 409);
    }

    const now = new Date().toISOString();
    const writePayload = {
      group_id: input.groupId,
      picks: input.picks,
      updated_at: now
    };

    const writeQuery = existingBracket
      ? supabase
        .from("brackets")
        .update(writePayload)
        .eq("id", existingBracket.id)
        .is("locked_at", null)
      : supabase
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

    return jsonResponse({ bracket: mapBracket(savedBracket) });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected submit-bracket error." },
      400
    );
  }
});

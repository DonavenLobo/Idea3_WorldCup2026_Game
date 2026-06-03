import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*"
};

type Platform = "ios" | "android";

interface RegisterPushTokenRequest {
  platform: Platform;
  token: string;
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

function parseRequest(value: unknown): RegisterPushTokenRequest {
  const input = (value ?? {}) as Partial<RegisterPushTokenRequest>;

  if (input.platform !== "ios" && input.platform !== "android") {
    throw new Error("Invalid push token request: platform must be ios or android.");
  }

  if (
    typeof input.token !== "string"
    || input.token.length < 20
    || input.token.length > 300
  ) {
    throw new Error("Invalid push token request: token is invalid.");
  }

  return {
    platform: input.platform,
    token: input.token
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
    const input = parseRequest(await request.json());
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
      global: { headers: { Authorization: authorization } }
    });
    const { data: userData, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !userData.user) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });
    const { error: upsertError } = await supabaseAdmin
      .from("device_push_tokens")
      .upsert(
        {
          platform: input.platform,
          token: input.token,
          updated_at: new Date().toISOString(),
          user_id: userData.user.id
        },
        { onConflict: "token" }
      );

    if (upsertError) {
      throw upsertError;
    }

    return jsonResponse({ status: "registered" });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected push token error." },
      400
    );
  }
});

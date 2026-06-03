import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { generateAvatarImage, OpenAiModerationError } from "./openai.ts";
import { parseGenerateCardAvatarRequest } from "./schema.ts";
import { buildAvatarPrompt } from "./prompt.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const UPLOAD_BUCKET = "card-uploads";
const GENERATED_BUCKET = "card-generated";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*"
};

interface CardRow {
  avatar_source_url: string | null;
  id: string;
  selected_nation_code: string;
  status: string;
  user_id: string;
}

interface NationRow {
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
}

interface PushSendResult {
  response?: unknown;
  statusCode?: number;
  tokenCount: number;
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.slice(0, 1000);
  }

  try {
    return JSON.stringify(error).slice(0, 1000);
  } catch {
    return "Unknown generation error.";
  }
}

function normalizeSecret(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\""))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const openAiApiKey = normalizeSecret(Deno.env.get("OPENAI_API_KEY"));

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !openAiApiKey) {
    return jsonResponse({ error: "Function environment is not configured." }, 500);
  }

  const authorization = request.headers.get("Authorization");

  if (!authorization) {
    return jsonResponse({ error: "Missing Authorization header." }, 401);
  }

  let cardId: string;

  try {
    cardId = parseGenerateCardAvatarRequest(await request.json()).cardId;
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 400);
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
  const { data: card, error: cardError } = await supabaseAdmin
    .from("cards")
    .select("id, user_id, selected_nation_code, avatar_source_url, status")
    .eq("id", cardId)
    .maybeSingle<CardRow>();

  if (cardError) {
    return jsonResponse({ error: cardError.message }, 500);
  }

  if (!card) {
    return jsonResponse({ error: "Card not found." }, 404);
  }

  if (card.user_id !== userData.user.id) {
    return jsonResponse({ error: "Forbidden." }, 403);
  }

  const now = new Date().toISOString();
  const { error: cardUpdateError } = await supabaseAdmin
    .from("cards")
    .update({ status: "generating_avatar", updated_at: now })
    .eq("id", cardId);

  if (cardUpdateError) {
    return jsonResponse({ error: cardUpdateError.message }, 500);
  }

  const { data: generation, error: generationError } = await supabaseAdmin
    .from("card_generations")
    .insert({
      card_id: cardId,
      generation_type: "onboarding",
      provider: "openai",
      source_image_url: card.avatar_source_url,
      status: "pending",
      user_id: userData.user.id
    })
    .select("id")
    .single<{ id: string }>();

  if (generationError || !generation) {
    await supabaseAdmin.from("cards").update({ status: card.status }).eq("id", cardId);
    return jsonResponse(
      { error: generationError?.message ?? "Could not create generation record." },
      500
    );
  }

  EdgeRuntime.waitUntil(
    runGeneration({
      admin: supabaseAdmin,
      card,
      cardId,
      generationId: generation.id,
      openAiApiKey,
      userId: userData.user.id
    })
  );

  return jsonResponse({ cardId, status: "accepted" }, 202);
});

async function runGeneration(ctx: {
  admin: ReturnType<typeof createClient>;
  card: CardRow;
  cardId: string;
  generationId: string;
  openAiApiKey: string;
  userId: string;
}) {
  const { admin, card, cardId, generationId, openAiApiKey, userId } = ctx;

  try {
    const { data: nation } = await admin
      .from("nations")
      .select("name, primary_color, secondary_color")
      .eq("code", card.selected_nation_code)
      .maybeSingle<NationRow>();
    const nationName = nation?.name ?? card.selected_nation_code;
    const kitDescription = nation
      ? `kit (${nation.primary_color ?? "primary color"} and ${nation.secondary_color ?? "secondary color"})`
      : "national-team kit";
    let sourceImage: { bytes: Uint8Array; contentType: string } | undefined;

    if (card.avatar_source_url) {
      const { data: blob, error } = await admin.storage
        .from(UPLOAD_BUCKET)
        .download(card.avatar_source_url);

      if (error) {
        throw error;
      }

      sourceImage = {
        bytes: new Uint8Array(await blob.arrayBuffer()),
        contentType: blob.type || "image/jpeg"
      };
    }

    const prompt = buildAvatarPrompt({
      kitDescription,
      mode: sourceImage ? "edit" : "generate",
      nationName
    });
    const png = await generateAvatarImage({ apiKey: openAiApiKey, prompt, sourceImage });
    const path = `${userId}/${cardId}/${Date.now()}.png`;
    const { error: uploadError } = await admin.storage
      .from(GENERATED_BUCKET)
      .upload(path, new Blob([png], { type: "image/png" }), {
        contentType: "image/png",
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    const { error: cardFinalizeError } = await admin
      .from("cards")
      .update({
        avatar_generated_url: path,
        status: "ready",
        updated_at: new Date().toISOString()
      })
      .eq("id", cardId);

    if (cardFinalizeError) {
      throw cardFinalizeError;
    }

    const { error: generationFinalizeError } = await admin
      .from("card_generations")
      .update({ error_message: null, generated_image_url: path, status: "succeeded" })
      .eq("id", generationId);

    if (generationFinalizeError) {
      console.error("card_generations finalize failed:", generationFinalizeError.message);
    }

    const pushResult = await sendCardReadyPush(admin, userId, cardId);
    const { error: pushResultError } = await admin
      .from("card_generations")
      .update({
        push_response: pushResult,
        push_sent_at: new Date().toISOString(),
        push_token_count: pushResult.tokenCount
      })
      .eq("id", generationId);

    if (pushResultError) {
      console.error("card_generations push result update failed:", pushResultError.message);
    }
  } catch (error) {
    const status = error instanceof OpenAiModerationError ? "moderation_rejected" : "failed";
    const message = getErrorMessage(error);

    await admin
      .from("cards")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", cardId);
    await admin
      .from("card_generations")
      .update({ error_message: message, status })
      .eq("id", generationId);
    console.error("generate-card-avatar failed:", message);
  }
}

async function sendCardReadyPush(
  admin: ReturnType<typeof createClient>,
  userId: string,
  cardId: string
): Promise<PushSendResult> {
  try {
    const { data: tokens, error } = await admin
      .from("device_push_tokens")
      .select("token")
      .eq("user_id", userId)
      .returns<Array<{ token: string }>>();

    if (error) {
      console.error("device_push_tokens lookup failed:", error.message);
      return {
        response: { error: error.message },
        tokenCount: 0
      };
    }

    if (!tokens?.length) {
      return { tokenCount: 0 };
    }

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      body: JSON.stringify(
        tokens.map(({ token }) => ({
          body: "Tap to see your AI footballer card.",
          channelId: "default",
          data: { cardId, type: "CARD_READY" },
          priority: "high",
          sound: "default",
          title: "Your card is ready",
          to: token
        }))
      ),
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    const responseText = await response.text();
    let responseBody: unknown = responseText;

    try {
      responseBody = JSON.parse(responseText);
    } catch {
      // Keep the raw response text.
    }

    if (!response.ok) {
      console.error("Expo push send failed:", response.status, responseText);
    }

    return {
      response: responseBody,
      statusCode: response.status,
      tokenCount: tokens.length
    };
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("Card ready push failed:", message);

    return {
      response: { error: message },
      tokenCount: 0
    };
  }
}

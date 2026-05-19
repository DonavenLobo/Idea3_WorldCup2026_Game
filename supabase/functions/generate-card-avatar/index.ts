import { buildAvatarPrompt } from "./prompt.ts";
import { parseGenerateCardAvatarRequest } from "./schema.ts";

Deno.serve(async (request) => {
  const body = await request.json();
  const input = parseGenerateCardAvatarRequest(body);

  return Response.json({
    status: "not_implemented",
    prompt: buildAvatarPrompt(input),
    next: "Call AI provider, save generated avatar to Storage, update card_generations and cards."
  });
});

import { parseComposePlayerCardRequest } from "./schema.ts";

Deno.serve(async (request) => {
  const input = parseComposePlayerCardRequest(await request.json());

  return Response.json({
    status: "not_implemented",
    cardId: input.cardId,
    next: "Load template metadata, compose flattened PNG, save final_card_url and teaser_card_url."
  });
});

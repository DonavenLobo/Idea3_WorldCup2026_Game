import { parseGrantXpRequest } from "./schema.ts";
import { validateGrantXpRequest } from "./rules.ts";

Deno.serve(async (request) => {
  const input = parseGrantXpRequest(await request.json());
  validateGrantXpRequest(input);

  return Response.json({
    status: "not_implemented",
    next: "Write xp_events and update wallets inside a transaction."
  });
});

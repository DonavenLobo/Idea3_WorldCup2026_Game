import { parseSubmitBracketRequest } from "./schema.ts";

Deno.serve(async (request) => {
  const input = parseSubmitBracketRequest(await request.json());

  return Response.json({
    status: "not_implemented",
    userId: input.userId,
    next: "Validate lock windows, save picks, and keep bracket points separate by leaderboard type."
  });
});

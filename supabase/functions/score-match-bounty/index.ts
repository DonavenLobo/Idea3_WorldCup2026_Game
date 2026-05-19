import { parseScoreMatchBountyRequest } from "./schema.ts";

Deno.serve(async (request) => {
  const input = parseScoreMatchBountyRequest(await request.json());

  return Response.json({
    status: "not_implemented",
    bountyId: input.bountyId,
    competitivePointsAwarded: 0,
    next: "Score bounty, grant deterministic reward, never write Competitive Points."
  });
});

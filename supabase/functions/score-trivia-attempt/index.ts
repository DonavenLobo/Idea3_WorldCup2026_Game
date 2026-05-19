import { parseScoreTriviaAttemptRequest } from "./schema.ts";

Deno.serve(async (request) => {
  const input = parseScoreTriviaAttemptRequest(await request.json());

  return Response.json({
    status: "not_implemented",
    userId: input.userId,
    activeDate: input.activeDate,
    next: "Load correct answers server-side, score first attempt, write trivia_attempts and xp_events."
  });
});

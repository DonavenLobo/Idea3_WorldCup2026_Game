export interface ScoreMatchBountyRequest {
  userId: string;
  bountyId: string;
  selectedAnswerKey: "A" | "B" | "C" | "D";
}

export function parseScoreMatchBountyRequest(value: unknown): ScoreMatchBountyRequest {
  const input = value as Partial<ScoreMatchBountyRequest>;

  if (!input.userId || !input.bountyId || !input.selectedAnswerKey) {
    throw new Error("Invalid score-match-bounty request.");
  }

  return input as ScoreMatchBountyRequest;
}

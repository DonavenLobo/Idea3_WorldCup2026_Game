export interface SubmitBracketRequest {
  userId: string;
  groupId?: string;
  picks: Array<{
    matchId: string;
    selectedTeamCode: string;
  }>;
}

export function parseSubmitBracketRequest(value: unknown): SubmitBracketRequest {
  const input = value as Partial<SubmitBracketRequest>;

  if (!input.userId || !Array.isArray(input.picks)) {
    throw new Error("Invalid submit-bracket request.");
  }

  return input as SubmitBracketRequest;
}

export interface ScoreBracketRequest {
  /**
   * Specific bracket to score. If null/omitted, the edge fn resolves the
   * caller's most recently-updated solo (group_id IS NULL) bracket.
   */
  bracketId: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBracketId(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new Error("bracketId must be a uuid string or null.");
  }
  return value;
}

export function parseScoreBracketRequest(value: unknown): ScoreBracketRequest {
  // Allow an empty body — submit-bracket calls us with no body when
  // forwarding the fire-and-forget rescore. Default bracketId to null.
  if (value === null || value === undefined) {
    return { bracketId: null };
  }
  if (!isRecord(value)) {
    throw new Error("Invalid score-bracket request.");
  }
  return {
    bracketId: parseBracketId(value.bracketId),
  };
}

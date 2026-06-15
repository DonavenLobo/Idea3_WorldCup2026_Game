type RoundPicks = Record<string, string>;

export interface BracketPicksPayload {
  groupRankings: Record<string, string[]>;
  finalizedGroups: string[];
  picks: {
    r32: RoundPicks;
    r16: RoundPicks;
    qf: RoundPicks;
    sf: RoundPicks;
    final: string | null;
    third: string | null;
  };
}

export interface SubmitBracketRequest {
  groupId: string | null;
  picks: BracketPicksPayload;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseGroupId(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new Error("Bracket groupId must be a string or null.");
  }
  return value;
}

function parseStringArrayRecord(value: unknown, label: string): Record<string, string[]> {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object.`);
  }

  const parsed: Record<string, string[]> = {};
  for (const [key, rankings] of Object.entries(value)) {
    if (!Array.isArray(rankings) || !rankings.every((entry) => typeof entry === "string")) {
      throw new Error(`${label}.${key} must be an array of strings.`);
    }
    parsed[key] = rankings;
  }
  return parsed;
}

function parseRoundPicks(value: unknown, label: string): RoundPicks {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object.`);
  }

  const parsed: RoundPicks = {};
  for (const [matchIndex, teamCode] of Object.entries(value)) {
    if (typeof teamCode !== "string") {
      throw new Error(`${label}.${matchIndex} must be a team code string.`);
    }
    parsed[matchIndex] = teamCode;
  }
  return parsed;
}

function parseStringArray(value: unknown, label: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
    throw new Error(`${label} must be an array of strings.`);
  }
  return value;
}

function parseNullableTeamCode(value: unknown, label: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new Error(`${label} must be a team code string or null.`);
  }
  return value;
}

function parsePicksPayload(value: unknown): BracketPicksPayload {
  if (!isRecord(value) || !isRecord(value.picks)) {
    throw new Error("Bracket picks payload is invalid.");
  }

  return {
    groupRankings: parseStringArrayRecord(value.groupRankings, "groupRankings"),
    finalizedGroups: parseStringArray(value.finalizedGroups, "finalizedGroups"),
    picks: {
      r32: parseRoundPicks(value.picks.r32, "picks.r32"),
      r16: parseRoundPicks(value.picks.r16, "picks.r16"),
      qf: parseRoundPicks(value.picks.qf, "picks.qf"),
      sf: parseRoundPicks(value.picks.sf, "picks.sf"),
      final: parseNullableTeamCode(value.picks.final, "picks.final"),
      third: parseNullableTeamCode(value.picks.third, "picks.third")
    },
  };
}

export function parseSubmitBracketRequest(value: unknown): SubmitBracketRequest {
  if (!isRecord(value)) {
    throw new Error("Invalid submit-bracket request.");
  }

  return {
    groupId: parseGroupId(value.groupId),
    picks: parsePicksPayload(value.picks)
  };
}

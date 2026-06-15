import { GROUP_IDS } from "@world-cup-game/config";
import type { GroupId } from "@world-cup-game/config";
import type { CardUpgradeEvent } from "@world-cup-game/types";
import { supabase } from "../../../lib/supabase";
import { getValidatedSupabaseUser } from "../../auth/api/sessionRecovery";
import {
  mapCardProgressionResponse,
  type CardProgressionResponse,
} from "../../card/api/cardProgression";
import type { BracketPicks, PersistedBracketPicks } from "../types";
import {
  PickPastLockoutError,
  NotGroupMemberError,
  type PickPastLockoutDetails
} from "../types";

interface BracketRow {
  id: string;
  group_id: string | null;
  picks: unknown;
  score: number;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedBracket {
  id: string;
  groupId: string | null;
  picks: PersistedBracketPicks;
  score: number;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const BRACKET_COLUMNS = `
  id,
  group_id,
  picks,
  score,
  locked_at,
  created_at,
  updated_at
`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function parseFinalizedGroups(value: unknown): GroupId[] {
  if (value === undefined) return [];
  if (!isStringArray(value)) {
    throw new Error("Saved bracket finalized groups are malformed.");
  }
  return value.filter((group): group is GroupId =>
    (GROUP_IDS as readonly string[]).includes(group)
  );
}

function isRoundPicks(value: unknown): value is Record<number, string> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === "string");
}

function parsePersistedPicks(value: unknown): PersistedBracketPicks {
  if (!isRecord(value) || !isRecord(value.groupRankings) || !isRecord(value.picks)) {
    throw new Error("Saved bracket data is malformed.");
  }

  const rawGroupRankings = value.groupRankings;
  const rawPicks = value.picks;
  const groupRankings = GROUP_IDS.reduce((acc, group) => {
    const rankings = rawGroupRankings[group];
    if (!isStringArray(rankings)) {
      throw new Error("Saved bracket group rankings are malformed.");
    }
    acc[group] = rankings;
    return acc;
  }, {} as Record<GroupId, string[]>);

  if (
    !isRoundPicks(rawPicks.r32) ||
    !isRoundPicks(rawPicks.r16) ||
    !isRoundPicks(rawPicks.qf) ||
    !isRoundPicks(rawPicks.sf)
  ) {
    throw new Error("Saved bracket round picks are malformed.");
  }

  const final = rawPicks.final;
  const third = rawPicks.third;
  if ((final !== null && typeof final !== "string") || (third !== null && typeof third !== "string")) {
    throw new Error("Saved bracket podium picks are malformed.");
  }

  return {
    groupRankings,
    finalizedGroups: parseFinalizedGroups(value.finalizedGroups),
    picks: {
      r32: rawPicks.r32,
      r16: rawPicks.r16,
      qf: rawPicks.qf,
      sf: rawPicks.sf,
      final,
      third
    } satisfies BracketPicks
  };
}

function mapBracketRow(row: BracketRow): SavedBracket {
  return {
    id: row.id,
    groupId: row.group_id,
    picks: parsePersistedPicks(row.picks),
    score: row.score,
    lockedAt: row.locked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getCurrentBracket(): Promise<SavedBracket | null> {
  const user = await getValidatedSupabaseUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("brackets")
    .select(BRACKET_COLUMNS)
    .eq("user_id", user.id)
    .is("group_id", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<BracketRow>();

  if (error) {
    throw error;
  }

  return data ? mapBracketRow(data) : null;
}

interface SubmitBracketResponse {
  ok?: boolean;
  bracket?: SavedBracket;
  cardProgression?: CardProgressionResponse | null;
  code?: "PICK_PAST_LOCKOUT" | "NOT_GROUP_MEMBER";
  invalidGroups?: string[];
  invalidMatches?: Array<{ round: string; index: number }>;
  error?: string;
}

function isResponseLike(value: unknown): value is {
  clone?: () => unknown;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
} {
  return typeof value === "object" && value !== null;
}

async function readFunctionErrorResponse(error: unknown): Promise<SubmitBracketResponse | null> {
  const context = (error as { context?: unknown }).context;
  if (!isResponseLike(context)) {
    return null;
  }

  const response = typeof context.clone === "function"
    ? context.clone()
    : context;

  if (!isResponseLike(response)) {
    return null;
  }

  try {
    if (typeof response.json === "function") {
      const body = await response.json();
      return isRecord(body) ? body as SubmitBracketResponse : null;
    }

    if (typeof response.text === "function") {
      const text = await response.text();
      if (!text) return null;
      const body = JSON.parse(text);
      return isRecord(body) ? body as SubmitBracketResponse : null;
    }
  } catch {
    return null;
  }

  return null;
}

function parseSubmitBracketResponse(data: SubmitBracketResponse | null): {
  bracket: SavedBracket;
  pendingUpgrades: CardUpgradeEvent[];
} {
  if (!data) {
    throw new Error("Bracket save returned no data.");
  }

  if (data.code === "PICK_PAST_LOCKOUT") {
    throw new PickPastLockoutError({
      invalidGroups: data.invalidGroups ?? [],
      invalidMatches: (data.invalidMatches ?? []) as PickPastLockoutDetails["invalidMatches"]
    });
  }

  if (data.code === "NOT_GROUP_MEMBER") {
    throw new NotGroupMemberError();
  }

  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.bracket) {
    throw new Error("Bracket save did not return a saved bracket.");
  }

  return {
    bracket: data.bracket,
    pendingUpgrades: mapCardProgressionResponse(data.cardProgression),
  };
}

export async function submitCurrentBracket(
  picks: PersistedBracketPicks,
  groupId: string | null = null
): Promise<{ bracket: SavedBracket; pendingUpgrades: CardUpgradeEvent[] }> {
  const user = await getValidatedSupabaseUser();
  if (!user) {
    throw new Error("Sign in to save your bracket.");
  }

  const { data, error } = await supabase.functions.invoke<SubmitBracketResponse>(
    "submit-bracket",
    { body: { groupId, picks } }
  );

  if (error) {
    const errorData = await readFunctionErrorResponse(error);
    if (errorData) {
      return parseSubmitBracketResponse(errorData);
    }
    throw error;
  }

  return parseSubmitBracketResponse(data ?? null);
}

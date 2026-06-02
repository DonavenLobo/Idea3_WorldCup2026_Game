import { GROUP_IDS } from "@world-cup-game/config";
import type { GroupId } from "@world-cup-game/config";
import { supabase } from "../../../lib/supabase";
import type { BracketPicks, PersistedBracketPicks } from "../types";

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
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!authData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("brackets")
    .select(BRACKET_COLUMNS)
    .eq("user_id", authData.user.id)
    .is("group_id", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<BracketRow>();

  if (error) {
    throw error;
  }

  return data ? mapBracketRow(data) : null;
}

export async function submitCurrentBracket(picks: PersistedBracketPicks): Promise<SavedBracket> {
  const { data, error } = await supabase.functions.invoke<{ bracket: SavedBracket }>("submit-bracket", {
    body: {
      groupId: null,
      picks
    }
  });

  if (error) {
    throw error;
  }

  if (!data?.bracket) {
    throw new Error("Bracket save did not return a saved bracket.");
  }

  return data.bracket;
}

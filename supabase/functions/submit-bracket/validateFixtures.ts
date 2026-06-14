// supabase/functions/submit-bracket/validateFixtures.ts
//
// Loads kickoff data on demand from public.matches and validates that
// every CHANGED pick targets a unit whose lockout window is still open.

import { createClient } from "npm:@supabase/supabase-js@2";

type SupabaseClient = ReturnType<typeof createClient<any>>;

export type GroupId = "A"|"B"|"C"|"D"|"E"|"F"|"G"|"H"|"I"|"J"|"K"|"L";
export type KnockoutRoundId = "r32"|"r16"|"qf"|"sf"|"final"|"third";

export interface BracketPicksPayload {
  groupRankings: Record<string, string[]>;
  finalizedGroups?: string[];
  picks: {
    r32: Record<string, string>;
    r16: Record<string, string>;
    qf: Record<string, string>;
    sf: Record<string, string>;
    final: string | null;
    third: string | null;
  };
}

export interface FixtureValidationResult {
  invalidGroups: string[];
  invalidMatches: Array<{ round: KnockoutRoundId; index: number }>;
}

const GROUP_STAGE_EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

interface MatchRow {
  round: string;
  group_id: string | null;
  bracket_index: number | null;
  kickoff: string;
}

/** Pull just the kickoff data we need from public.matches. */
export async function loadKickoffMaps(supabase: SupabaseClient): Promise<{
  groupKickoffMs: Map<string, number>;
  knockoutKickoffMs: Map<string, number>;
}> {
  const { data, error } = await supabase
    .from("matches")
    .select("round,group_id,bracket_index,kickoff");

  if (error) throw error;

  const rows = (data ?? []) as MatchRow[];
  const groupKickoffMs = new Map<string, number>();
  const knockoutKickoffMs = new Map<string, number>();

  for (const r of rows) {
    const ms = new Date(r.kickoff).getTime();
    if (r.round === "group" && r.group_id) {
      const existing = groupKickoffMs.get(r.group_id);
      if (existing === undefined || ms < existing) {
        groupKickoffMs.set(r.group_id, ms);
      }
    } else if (r.bracket_index !== null) {
      knockoutKickoffMs.set(`${r.round}:${r.bracket_index}`, ms);
    }
  }

  return { groupKickoffMs, knockoutKickoffMs };
}

/**
 * Compare `next` picks against `existing`. Any pick whose value CHANGES after
 * its lockout window closes is invalid.
 *
 * Group rankings share one tournament-wide lockout: earliest group kickoff + 7
 * days. Knockout picks still lock per match at kickoff.
 * Untouched picks pass even on locked units.
 */
export function validateBracketAgainstFixtures(
  nowMs: number,
  next: BracketPicksPayload,
  existing: BracketPicksPayload | null,
  groupKickoffMs: Map<string, number>,
  knockoutKickoffMs: Map<string, number>
): FixtureValidationResult {
  const invalidGroups: string[] = [];
  const invalidMatches: Array<{ round: KnockoutRoundId; index: number }> = [];
  const groupStageDeadlineMs = getGroupStageDeadlineMs(groupKickoffMs);

  for (const [g, ranking] of Object.entries(next.groupRankings)) {
    if (nowMs < groupStageDeadlineMs) continue;
    const prev = existing?.groupRankings?.[g];
    if (!arraysEqual(prev, ranking)) {
      invalidGroups.push(g);
    }
  }

  for (const round of ["r32", "r16", "qf", "sf"] as const) {
    const nextRound = next.picks[round] ?? {};
    const prevRound = existing?.picks?.[round] ?? {};
    for (const [indexStr, teamCode] of Object.entries(nextRound)) {
      const index = Number(indexStr);
      const kickoff = knockoutKickoffMs.get(`${round}:${index}`);
      if (kickoff === undefined) continue;
      if (nowMs < kickoff) continue;
      if (prevRound[indexStr] !== teamCode) {
        invalidMatches.push({ round, index });
      }
    }
  }

  if (next.picks.final !== (existing?.picks?.final ?? null)) {
    const k = knockoutKickoffMs.get("final:0");
    if (k !== undefined && nowMs >= k) invalidMatches.push({ round: "final", index: 0 });
  }

  if (next.picks.third !== (existing?.picks?.third ?? null)) {
    const k = knockoutKickoffMs.get("third:0");
    if (k !== undefined && nowMs >= k) invalidMatches.push({ round: "third", index: 0 });
  }

  return { invalidGroups, invalidMatches };
}

function getGroupStageDeadlineMs(groupKickoffMs: Map<string, number>): number {
  const earliestGroupKickoff = Math.min(...Array.from(groupKickoffMs.values()));
  return Number.isFinite(earliestGroupKickoff)
    ? earliestGroupKickoff + GROUP_STAGE_EDIT_WINDOW_MS
    : Infinity;
}

function arraysEqual(a: string[] | undefined, b: string[] | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

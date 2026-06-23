// apps/mobile/src/features/bracket/hooks/useFixtures.ts
import { useEffect, useState } from "react";
import { GROUP_IDS } from "@gogaffa/config";
import type { GroupId } from "@gogaffa/config";
import { supabase } from "../../../lib/supabase";
import type {
  FixtureData,
  KnockoutRoundId
} from "../lib/computeBracketLockState";

interface UseFixturesResult {
  fixtures: FixtureData | null;
  isLoading: boolean;
  error: Error | null;
}

interface MatchRow {
  id: string;
  round: string;
  group_id: string | null;
  bracket_index: number | null;
  kickoff: string;
}

// Module-level cache. Reset only on app restart. The fixture data is static
// for the duration of the tournament — no need to invalidate.
let cachedFixtures: FixtureData | null = null;
let cachedFetchPromise: Promise<FixtureData> | null = null;

const KNOCKOUT_ROUNDS: ReadonlySet<KnockoutRoundId> = new Set([
  "r32", "r16", "qf", "sf", "final", "third"
]);

function isKnockoutRound(r: string): r is KnockoutRoundId {
  return KNOCKOUT_ROUNDS.has(r as KnockoutRoundId);
}

function isGroupId(g: string): g is GroupId {
  return (GROUP_IDS as readonly string[]).includes(g);
}

async function fetchFixturesFromSupabase(): Promise<FixtureData> {
  const { data, error } = await supabase
    .from("matches")
    .select("id,round,group_id,bracket_index,kickoff");

  if (error) throw error;

  const rows = (data ?? []) as MatchRow[];

  const groupFirstKickoffs: Partial<Record<GroupId, Date>> = {};
  const knockouts: FixtureData["knockouts"] = [];

  for (const row of rows) {
    if (row.round === "group") {
      if (!row.group_id || !isGroupId(row.group_id)) continue;
      const candidate = new Date(row.kickoff);
      const existing = groupFirstKickoffs[row.group_id];
      // If there are multiple group rows per group (backfill PR), keep the earliest
      if (!existing || candidate.getTime() < existing.getTime()) {
        groupFirstKickoffs[row.group_id] = candidate;
      }
    } else if (isKnockoutRound(row.round) && row.bracket_index !== null) {
      knockouts.push({
        round: row.round,
        index: row.bracket_index,
        kickoff: new Date(row.kickoff)
      });
    }
  }

  // Sanity: every group must have a first kickoff
  for (const g of GROUP_IDS) {
    if (!groupFirstKickoffs[g]) {
      throw new Error(`Missing fixture for Group ${g}. Seed migration may be out of date.`);
    }
  }

  return {
    groupFirstKickoffs: groupFirstKickoffs as Record<GroupId, Date>,
    knockouts
  };
}

export function useFixtures(): UseFixturesResult {
  const [fixtures, setFixtures] = useState<FixtureData | null>(cachedFixtures);
  const [isLoading, setIsLoading] = useState<boolean>(cachedFixtures === null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cachedFixtures) {
      setFixtures(cachedFixtures);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    if (!cachedFetchPromise) {
      cachedFetchPromise = fetchFixturesFromSupabase()
        .then((result) => {
          cachedFixtures = result;
          return result;
        })
        .catch((err) => {
          cachedFetchPromise = null; // allow retry next mount
          throw err;
        });
    }

    cachedFetchPromise
      .then((result) => {
        if (cancelled) return;
        setFixtures(result);
        setError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { fixtures, isLoading, error };
}

/** Test helper — reset the module cache between tests. Not exported in production. */
export function __resetFixturesCacheForTesting(): void {
  cachedFixtures = null;
  cachedFetchPromise = null;
}

import { supabase } from "../../../lib/supabase";
import type { CachedMatchScore, MatchStatus } from "../types";

interface MatchScoreRow {
  away_score: number | null;
  home_score: number | null;
  match_num: number | null;
  score_synced_at: string | null;
  status: MatchStatus;
}

export async function getCachedMatchScores(): Promise<Map<number, CachedMatchScore>> {
  const { data, error } = await supabase
    .from("matches")
    .select("match_num,status,home_score,away_score,score_synced_at")
    .not("match_num", "is", null)
    .order("match_num", { ascending: true })
    .returns<MatchScoreRow[]>();

  if (error) {
    throw error;
  }

  const scores = new Map<number, CachedMatchScore>();

  for (const row of data ?? []) {
    if (row.match_num === null) continue;

    scores.set(row.match_num, {
      awayScore: row.away_score,
      homeScore: row.home_score,
      matchNum: row.match_num,
      status: row.status,
      syncedAt: row.score_synced_at
    });
  }

  return scores;
}

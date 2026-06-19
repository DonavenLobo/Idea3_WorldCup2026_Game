import type { LeaderboardStage } from "@gogaffa/config";
import { supabase } from "../../../lib/supabase";
import type { LeaderboardRowData } from "../types";

interface LeaderboardRow {
  user_id: string;
  display_name: string | null;
  country_code: string | null;
  score: number | null;
}

interface GetLeaderboardRowsInput {
  currentUserId: string | null;
  groupId?: string | null;
  stage: LeaderboardStage;
}

function normalizeRows(data: unknown): LeaderboardRow[] {
  return Array.isArray(data) ? data as LeaderboardRow[] : [];
}

export async function getLeaderboardRows({
  currentUserId,
  groupId = null,
  stage
}: GetLeaderboardRowsInput): Promise<LeaderboardRowData[]> {
  const { data, error } = await supabase
    .rpc("list_group_leaderboard", {
      target_group_id: groupId,
      leaderboard_stage: stage
    });

  if (error) throw error;

  return normalizeRows(data).map((row, index) => ({
    rank: index + 1,
    id: row.user_id,
    displayName: row.display_name?.trim() || "Rookie",
    countryCode: row.country_code?.trim() || "USA",
    score: row.score ?? 0,
    isCurrentUser: currentUserId === row.user_id
  }));
}

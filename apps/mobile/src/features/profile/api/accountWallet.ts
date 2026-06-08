import { getLeaderboardRows } from "../../leaderboard/api/leaderboard";
import { supabase } from "../../../lib/supabase";

export interface AccountStats {
  /** Same value shown on the global leaderboard (overall stage). */
  leaderboardScore: number;
  /** Locker credits available to spend (earned + purchased). */
  creditBalance: number;
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("You must be signed in to load account stats.");
  }

  return data.user.id;
}

export async function getAccountStats(): Promise<AccountStats> {
  const userId = await getCurrentUserId();

  const leaderboardRows = await getLeaderboardRows({
    currentUserId: userId,
    groupId: null,
    stage: "overall",
  });

  const selfRow = leaderboardRows.find((row) => row.id === userId);

  return {
    creditBalance: 0,
    leaderboardScore: selfRow?.score ?? 0,
  };
}

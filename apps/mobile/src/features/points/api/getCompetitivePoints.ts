import { supabase } from "../../../lib/supabase";

/**
 * Sums a user's leaderboard-eligible competitive_points from xp_events.
 *
 * v1 implementation: pulls the rows and reduces client-side. The dataset is
 * small (one row per scoring event per user) and RLS already restricts to the
 * caller's own rows, so the row count is bounded by the user's own activity.
 *
 * If this becomes hot we can move the aggregation into a Postgres function.
 */
export async function getCompetitivePoints(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("xp_events")
    .select("amount")
    .eq("user_id", userId)
    .eq("currency_type", "competitive_points")
    .eq("counts_toward_leaderboard", true);

  if (error) {
    throw error;
  }
  if (!data) {
    return 0;
  }

  return data.reduce((sum, row) => sum + (row.amount ?? 0), 0);
}

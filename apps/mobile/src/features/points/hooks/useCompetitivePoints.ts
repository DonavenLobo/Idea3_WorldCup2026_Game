import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "../../auth/hooks/useSession";
import { supabase } from "../../../lib/supabase";
import { getCompetitivePoints } from "../api/getCompetitivePoints";

export const COMPETITIVE_POINTS_QUERY_KEY = ["competitive-points"] as const;

/**
 * Hook exposing the user's leaderboard-eligible competitive-points total.
 *
 * - Loads the sum via getCompetitivePoints
 * - Subscribes to a Supabase realtime channel filtered to this user's
 *   xp_events rows; any insert/update/delete invalidates the query so the
 *   pill stays fresh without polling.
 *
 * Mirrors the channel/filter pattern in useCardRealtime.
 */
export function useCompetitivePoints() {
  const { user, isLoading: isSessionLoading } = useSession();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    enabled: !isSessionLoading && Boolean(userId),
    queryFn: () =>
      userId ? getCompetitivePoints(userId) : Promise.resolve(0),
    queryKey: [...COMPETITIVE_POINTS_QUERY_KEY, userId]
  });

  useEffect(() => {
    if (!userId) {
      return;
    }

    const invalidate = () => {
      void queryClient.invalidateQueries({
        queryKey: [...COMPETITIVE_POINTS_QUERY_KEY, userId]
      });
    };

    const channel = supabase
      .channel(`xp-events:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `user_id=eq.${userId}`,
          schema: "public",
          table: "xp_events"
        },
        invalidate
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

  return {
    error: query.error,
    isLoading: isSessionLoading || query.isLoading,
    refetch: query.refetch,
    total: query.data ?? 0
  };
}

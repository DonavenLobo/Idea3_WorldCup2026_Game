import { useQuery } from "@tanstack/react-query";
import { useSession } from "../../auth/hooks/useSession";
import { getAccountStats } from "../api/accountWallet";

export function useAccountStats() {
  const { user, isLoading: isSessionLoading } = useSession();
  const query = useQuery({
    enabled: !isSessionLoading && Boolean(user),
    queryFn: getAccountStats,
    queryKey: ["account-stats", user?.id],
  });

  return {
    creditBalance: query.data?.creditBalance ?? 0,
    error: query.error,
    isLoading: isSessionLoading || query.isLoading,
    leaderboardScore: query.data?.leaderboardScore ?? 0,
  };
}

/** @deprecated Use useAccountStats — kept as alias for existing imports. */
export function useAccountWallet() {
  const stats = useAccountStats();
  return {
    competitivePoints: stats.leaderboardScore,
    error: stats.error,
    isLoading: stats.isLoading,
  };
}

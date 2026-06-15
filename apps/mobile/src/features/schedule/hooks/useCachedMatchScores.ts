import { useCallback, useEffect, useState } from "react";
import { getCachedMatchScores } from "../api/getCachedMatchScores";
import type { CachedMatchScore } from "../types";

const SCORE_REFRESH_MS = 60_000;

export function useCachedMatchScores() {
  const [scoresByMatchNum, setScoresByMatchNum] = useState(
    () => new Map<number, CachedMatchScore>()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const scores = await getCachedMatchScores();
      setScoresByMatchNum(scores);
      setLastUpdatedAt(new Date().toISOString());
    } catch (error) {
      console.warn("Failed to load cached match scores", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, SCORE_REFRESH_MS);

    return () => clearInterval(interval);
  }, [refresh]);

  return { isLoading, lastUpdatedAt, refresh, scoresByMatchNum };
}

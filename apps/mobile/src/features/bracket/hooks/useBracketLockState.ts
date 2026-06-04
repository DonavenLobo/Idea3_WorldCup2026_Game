// apps/mobile/src/features/bracket/hooks/useBracketLockState.ts
import { useMemo } from "react";
import { computeBracketLockState, type BracketLockState } from "../lib/computeBracketLockState";
import { useTournamentClock } from "./useTournamentClock";
import { useFixtures } from "./useFixtures";

export interface UseBracketLockState extends BracketLockState {
  /** True until the matches table finishes loading. UI should treat as "all unlocked". */
  isLoading: boolean;
  /** True when the server clock is unreachable. Surface a warning banner. */
  isClockFallback: boolean;
  /** Error from the fixtures fetch, if any. */
  error: Error | null;
}

const PERMISSIVE_PRE_LOAD_STATE: BracketLockState = {
  isGroupLocked: () => false,
  isMatchLocked: () => false,
  phase: "pre",
  nextLockAt: null,
  nextLockLabel: null
};

export function useBracketLockState(): UseBracketLockState {
  const { now, isUsingFallback } = useTournamentClock();
  const { fixtures, isLoading, error } = useFixtures();

  // Bucket `now` to 5-second granularity so the memo key changes at most every
  // 5s instead of every render. Sub-5s precision doesn't matter for hour-scale countdowns.
  const bucketedNowMs = Math.floor(now.getTime() / 5000) * 5000;

  const lockState = useMemo(() => {
    if (!fixtures) return PERMISSIVE_PRE_LOAD_STATE;
    return computeBracketLockState(new Date(bucketedNowMs), fixtures);
  }, [bucketedNowMs, fixtures]);

  return { ...lockState, isLoading, isClockFallback: isUsingFallback, error };
}

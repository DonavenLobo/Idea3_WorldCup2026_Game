import { useMemo } from "react";
import {
  computeBracketStageState,
  type BracketStageState,
} from "../lib/computeBracketStageState";
import { useTournamentClock } from "./useTournamentClock";

export function useBracketStageState(): BracketStageState {
  const { now } = useTournamentClock();
  const bucketedNowMs = Math.floor(now.getTime() / 30_000) * 30_000;

  return useMemo(
    () => computeBracketStageState(new Date(bucketedNowMs)),
    [bucketedNowMs]
  );
}

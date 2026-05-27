import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { BRACKET_GROUPS, GROUP_IDS } from "@world-cup-game/config";
import type { GroupId } from "@world-cup-game/config";
import type { BracketPicks, BracketState, PickRound } from "./types";

function defaultRankings(): Record<GroupId, string[]> {
  const entries = GROUP_IDS.map((g) => [g, [...BRACKET_GROUPS[g]]] as const);
  return Object.fromEntries(entries) as Record<GroupId, string[]>;
}

function defaultPicks(): BracketPicks {
  return { r32: {}, r16: {}, qf: {}, sf: {}, final: null, third: null };
}

interface BracketContextValue extends BracketState {
  start: () => void;
  resetAll: () => void;
  moveTeamUp: (group: GroupId, index: number) => void;
  moveTeamDown: (group: GroupId, index: number) => void;
  resetGroup: (group: GroupId) => void;
  setPick: (round: PickRound, matchIndex: number, code: string) => void;
  setFinal: (code: string | null) => void;
  setThird: (code: string | null) => void;
}

const BracketContext = createContext<BracketContextValue | null>(null);

function swap(arr: string[], i: number, j: number): string[] | null {
  const a = arr[i];
  const b = arr[j];
  if (a === undefined || b === undefined) return null;
  const next = [...arr];
  next[i] = b;
  next[j] = a;
  return next;
}

export function BracketProvider({ children }: PropsWithChildren) {
  const [isCreated, setIsCreated] = useState(false);
  const [groupRankings, setGroupRankings] = useState<Record<GroupId, string[]>>(defaultRankings);
  const [picks, setPicks] = useState<BracketPicks>(defaultPicks);

  const moveTeamUp = useCallback((group: GroupId, index: number) => {
    if (index <= 0) return;
    setGroupRankings((prev) => {
      const current = prev[group];
      if (!current) return prev;
      const next = swap(current, index, index - 1);
      if (!next) return prev;
      return { ...prev, [group]: next };
    });
  }, []);

  const moveTeamDown = useCallback((group: GroupId, index: number) => {
    setGroupRankings((prev) => {
      const current = prev[group];
      if (!current || index >= current.length - 1) return prev;
      const next = swap(current, index, index + 1);
      if (!next) return prev;
      return { ...prev, [group]: next };
    });
  }, []);

  const resetGroup = useCallback((group: GroupId) => {
    setGroupRankings((prev) => ({ ...prev, [group]: [...BRACKET_GROUPS[group]] }));
  }, []);

  const resetAll = useCallback(() => {
    setGroupRankings(defaultRankings());
    setPicks(defaultPicks());
    setIsCreated(false);
  }, []);

  const setPick = useCallback((round: PickRound, matchIndex: number, code: string) => {
    setPicks((prev) => ({
      ...prev,
      [round]: { ...prev[round], [matchIndex]: code }
    }));
  }, []);

  const setFinal = useCallback((code: string | null) => {
    setPicks((prev) => ({ ...prev, final: code }));
  }, []);

  const setThird = useCallback((code: string | null) => {
    setPicks((prev) => ({ ...prev, third: code }));
  }, []);

  const start = useCallback(() => setIsCreated(true), []);

  const value = useMemo<BracketContextValue>(
    () => ({
      isCreated,
      groupRankings,
      picks,
      start,
      resetAll,
      moveTeamUp,
      moveTeamDown,
      resetGroup,
      setPick,
      setFinal,
      setThird
    }),
    [
      isCreated, groupRankings, picks, start, resetAll,
      moveTeamUp, moveTeamDown, resetGroup, setPick, setFinal, setThird
    ]
  );

  return <BracketContext.Provider value={value}>{children}</BracketContext.Provider>;
}

export function useBracket(): BracketContextValue {
  const ctx = useContext(BracketContext);
  if (!ctx) throw new Error("useBracket must be used within a BracketProvider.");
  return ctx;
}

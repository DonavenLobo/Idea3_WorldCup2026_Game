import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { BRACKET_GROUPS, GROUP_IDS } from "@world-cup-game/config";
import type { GroupId } from "@world-cup-game/config";
import { useSession } from "../../hooks/useSession";
import { getCurrentBracket, submitCurrentBracket } from "./api/brackets";
import type { BracketPicks, BracketState, PersistedBracketPicks, PickRound } from "./types";

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
  saveBracket: () => Promise<void>;
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
  const { user, isLoading: isSessionLoading } = useSession();
  const [isCreated, setIsCreated] = useState(false);
  const [isLoadingSavedBracket, setIsLoadingSavedBracket] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const [groupRankings, setGroupRankings] = useState<Record<GroupId, string[]>>(defaultRankings);
  const [picks, setPicks] = useState<BracketPicks>(defaultPicks);

  useEffect(() => {
    let isMounted = true;

    if (isSessionLoading) {
      return () => {
        isMounted = false;
      };
    }

    if (!user) {
      setGroupRankings(defaultRankings());
      setPicks(defaultPicks());
      setIsCreated(false);
      setLastSavedAt(null);
      setSaveError(null);
      setIsLoadingSavedBracket(false);
      return () => {
        isMounted = false;
      };
    }

    setIsLoadingSavedBracket(true);
    setSaveError(null);

    void getCurrentBracket()
      .then((savedBracket) => {
        if (!isMounted || !savedBracket) return;
        setGroupRankings(savedBracket.picks.groupRankings);
        setPicks(savedBracket.picks.picks);
        setIsCreated(true);
        setLastSavedAt(savedBracket.updatedAt);
      })
      .catch((error) => {
        if (!isMounted) return;
        const normalizedError = error instanceof Error ? error : new Error("Failed to load bracket.");
        console.warn("Failed to load saved bracket", normalizedError);
        setSaveError(normalizedError);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingSavedBracket(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isSessionLoading, user?.id]);

  const moveTeamUp = useCallback((group: GroupId, index: number) => {
    if (index <= 0) return;
    setLastSavedAt(null);
    setSaveError(null);
    setGroupRankings((prev) => {
      const current = prev[group];
      if (!current) return prev;
      const next = swap(current, index, index - 1);
      if (!next) return prev;
      return { ...prev, [group]: next };
    });
  }, []);

  const moveTeamDown = useCallback((group: GroupId, index: number) => {
    setLastSavedAt(null);
    setSaveError(null);
    setGroupRankings((prev) => {
      const current = prev[group];
      if (!current || index >= current.length - 1) return prev;
      const next = swap(current, index, index + 1);
      if (!next) return prev;
      return { ...prev, [group]: next };
    });
  }, []);

  const resetGroup = useCallback((group: GroupId) => {
    setLastSavedAt(null);
    setSaveError(null);
    setGroupRankings((prev) => ({ ...prev, [group]: [...BRACKET_GROUPS[group]] }));
  }, []);

  const resetAll = useCallback(() => {
    setGroupRankings(defaultRankings());
    setPicks(defaultPicks());
    setIsCreated(false);
    setLastSavedAt(null);
    setSaveError(null);
  }, []);

  const setPick = useCallback((round: PickRound, matchIndex: number, code: string) => {
    setLastSavedAt(null);
    setSaveError(null);
    setPicks((prev) => ({
      ...prev,
      [round]: { ...prev[round], [matchIndex]: code }
    }));
  }, []);

  const setFinal = useCallback((code: string | null) => {
    setLastSavedAt(null);
    setSaveError(null);
    setPicks((prev) => ({ ...prev, final: code }));
  }, []);

  const setThird = useCallback((code: string | null) => {
    setLastSavedAt(null);
    setSaveError(null);
    setPicks((prev) => ({ ...prev, third: code }));
  }, []);

  const start = useCallback(() => setIsCreated(true), []);

  const saveBracket = useCallback(async () => {
    if (!user) {
      throw new Error("You must be signed in to save a bracket.");
    }

    const payload: PersistedBracketPicks = { groupRankings, picks };

    setIsSaving(true);
    setSaveError(null);

    try {
      const savedBracket = await submitCurrentBracket(payload);
      setLastSavedAt(savedBracket.updatedAt);
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error("Failed to save bracket.");
      setSaveError(normalizedError);
      throw normalizedError;
    } finally {
      setIsSaving(false);
    }
  }, [groupRankings, picks, user]);

  const value = useMemo<BracketContextValue>(
    () => ({
      isCreated,
      isLoadingSavedBracket,
      isSaving,
      lastSavedAt,
      saveError,
      groupRankings,
      picks,
      start,
      resetAll,
      saveBracket,
      moveTeamUp,
      moveTeamDown,
      resetGroup,
      setPick,
      setFinal,
      setThird
    }),
    [
      isCreated, isLoadingSavedBracket, isSaving, lastSavedAt, saveError,
      groupRankings, picks, start, resetAll, saveBracket,
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

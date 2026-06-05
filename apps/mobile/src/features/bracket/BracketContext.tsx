import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BRACKET_GROUPS, GROUP_IDS } from "@world-cup-game/config";
import type { GroupId } from "@world-cup-game/config";
import { useSession } from "../../hooks/useSession";
import { getCurrentBracket, submitCurrentBracket } from "./api/brackets";
import type { BracketPicks, BracketState, PersistedBracketPicks, PickRound } from "./types";
import { useBracketLockState } from "./hooks/useBracketLockState";
import type { KnockoutRoundId } from "./lib/computeBracketLockState";
import { PickPastLockoutError } from "./types";
import { scheduleKnockoutReminder } from "./notifications";

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
  isGroupLocked: (group: GroupId) => boolean;
  isMatchLocked: (round: KnockoutRoundId, index: number) => boolean;
  isClockFallback: boolean;
  phase: ReturnType<typeof useBracketLockState>["phase"];
  nextLockAt: Date | null;
  nextLockLabel: string | null;
  fixturesLoading: boolean;
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

interface BracketProviderProps {
  groupId?: string | null;
  children: React.ReactNode;
}

export function BracketProvider({ groupId = null, children }: BracketProviderProps) {
  const { user, isLoading: isSessionLoading } = useSession();
  const [isCreated, setIsCreated] = useState(false);
  const [isLoadingSavedBracket, setIsLoadingSavedBracket] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const [groupRankings, setGroupRankings] = useState<Record<GroupId, string[]>>(defaultRankings);
  const [picks, setPicks] = useState<BracketPicks>(defaultPicks);
  const lockState = useBracketLockState();

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
        void scheduleKnockoutReminder().catch(() => {
          // best-effort — ignore failures
        });
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
      setSaveError(new Error("Sign in to save your bracket."));
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const persisted: PersistedBracketPicks = { groupRankings, picks };

    try {
      const saved = await submitCurrentBracket(persisted, groupId);
      setLastSavedAt(saved.updatedAt);
    } catch (err) {
      if (err instanceof PickPastLockoutError) {
        const fresh = await getCurrentBracket();
        const revertedRankings = { ...groupRankings };
        for (const g of err.invalidGroups as GroupId[]) {
          if (fresh?.picks.groupRankings[g]) {
            revertedRankings[g] = fresh.picks.groupRankings[g];
          }
        }
        const revertedPicks: BracketPicks = { ...picks };
        for (const m of err.invalidMatches) {
          if (m.round === "final") {
            revertedPicks.final = fresh?.picks.picks.final ?? null;
          } else if (m.round === "third") {
            revertedPicks.third = fresh?.picks.picks.third ?? null;
          } else {
            const round = m.round as PickRound;
            const prev = fresh?.picks.picks[round]?.[m.index];
            if (prev !== undefined) {
              revertedPicks[round] = { ...revertedPicks[round], [m.index]: prev };
            } else {
              const next = { ...revertedPicks[round] };
              delete next[m.index];
              revertedPicks[round] = next;
            }
          }
        }

        setGroupRankings(revertedRankings);
        setPicks(revertedPicks);

        try {
          const retried = await submitCurrentBracket(
            { groupRankings: revertedRankings, picks: revertedPicks },
            groupId
          );
          setLastSavedAt(retried.updatedAt);
          setSaveError(
            new Error("Some picks were locked while editing — your other picks saved.")
          );
        } catch (retryErr) {
          setSaveError(retryErr instanceof Error ? retryErr : new Error(String(retryErr)));
        }
      } else {
        setSaveError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      setIsSaving(false);
    }
  }, [groupRankings, picks, user, groupId]);

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
      setThird,
      isGroupLocked: lockState.isGroupLocked,
      isMatchLocked: lockState.isMatchLocked,
      isClockFallback: lockState.isClockFallback,
      phase: lockState.phase,
      nextLockAt: lockState.nextLockAt,
      nextLockLabel: lockState.nextLockLabel,
      fixturesLoading: lockState.isLoading
    }),
    [
      isCreated, isLoadingSavedBracket, isSaving, lastSavedAt, saveError,
      groupRankings, picks, start, resetAll, saveBracket,
      moveTeamUp, moveTeamDown, resetGroup, setPick, setFinal, setThird,
      lockState
    ]
  );

  return <BracketContext.Provider value={value}>{children}</BracketContext.Provider>;
}

export function useBracket(): BracketContextValue {
  const ctx = useContext(BracketContext);
  if (!ctx) throw new Error("useBracket must be used within a BracketProvider.");
  return ctx;
}

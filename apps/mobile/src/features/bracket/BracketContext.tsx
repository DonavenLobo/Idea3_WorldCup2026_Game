import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BRACKET_GROUPS, GROUP_IDS } from "@world-cup-game/config";
import type { GroupId } from "@world-cup-game/config";
import { useSession } from "../auth/hooks/useSession";
import { getCurrentBracket, submitCurrentBracket } from "./api/brackets";
import type { BracketPicks, BracketState, PersistedBracketPicks, PickRound } from "./types";
import { useBracketLockState } from "./hooks/useBracketLockState";
import { useBracketStageState } from "./hooks/useBracketStageState";
import type { KnockoutRoundId } from "./lib/computeBracketLockState";
import type { BracketStageState } from "./lib/computeBracketStageState";
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
  saveGroup: (group: GroupId) => Promise<boolean>;
  moveTeamUp: (group: GroupId, index: number) => void;
  moveTeamDown: (group: GroupId, index: number) => void;
  resetGroup: (group: GroupId) => void;
  setPick: (round: PickRound, matchIndex: number, code: string) => void;
  setFinal: (code: string | null) => void;
  setThird: (code: string | null) => void;
  areAllGroupsFinalized: boolean;
  isGroupFinalized: (group: GroupId) => boolean;
  isGroupLocked: (group: GroupId) => boolean;
  isMatchLocked: (round: KnockoutRoundId, index: number) => boolean;
  isClockFallback: boolean;
  phase: ReturnType<typeof useBracketLockState>["phase"];
  stageState: BracketStageState;
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

function normalizeFinalizedGroups(groups: readonly GroupId[] | undefined): GroupId[] {
  return GROUP_IDS.filter((group) => groups?.includes(group));
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
  const [committedGroupRankings, setCommittedGroupRankings] =
    useState<Record<GroupId, string[]>>(defaultRankings);
  const [finalizedGroups, setFinalizedGroups] = useState<GroupId[]>([]);
  const [picks, setPicks] = useState<BracketPicks>(defaultPicks);
  const [committedPicks, setCommittedPicks] = useState<BracketPicks>(defaultPicks);
  const lockState = useBracketLockState();
  const stageState = useBracketStageState();
  const areAllGroupsFinalized = finalizedGroups.length === GROUP_IDS.length;

  const isGroupFinalized = useCallback(
    (group: GroupId) => finalizedGroups.includes(group),
    [finalizedGroups]
  );

  useEffect(() => {
    let isMounted = true;

    if (isSessionLoading) {
      return () => {
        isMounted = false;
      };
    }

    if (!user) {
      const rankings = defaultRankings();
      const nextPicks = defaultPicks();
      setGroupRankings(rankings);
      setCommittedGroupRankings(rankings);
      setFinalizedGroups([]);
      setPicks(nextPicks);
      setCommittedPicks(nextPicks);
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

    // Schedule the Phase 2 reminder for any authenticated user who opens the
    // bracket tab — not just users who already have a saved bracket. The
    // call is idempotent (won't double-schedule) and permission-gated.
    void scheduleKnockoutReminder().catch(() => {
      // best-effort — ignore failures
    });

    void getCurrentBracket()
      .then((savedBracket) => {
        if (!isMounted || !savedBracket) return;
        setGroupRankings(savedBracket.picks.groupRankings);
        setCommittedGroupRankings(savedBracket.picks.groupRankings);
        setFinalizedGroups(normalizeFinalizedGroups(savedBracket.picks.finalizedGroups));
        setPicks(savedBracket.picks.picks);
        setCommittedPicks(savedBracket.picks.picks);
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
    if (isGroupFinalized(group)) return;
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
  }, [isGroupFinalized]);

  const moveTeamDown = useCallback((group: GroupId, index: number) => {
    if (isGroupFinalized(group)) return;
    setLastSavedAt(null);
    setSaveError(null);
    setGroupRankings((prev) => {
      const current = prev[group];
      if (!current || index >= current.length - 1) return prev;
      const next = swap(current, index, index + 1);
      if (!next) return prev;
      return { ...prev, [group]: next };
    });
  }, [isGroupFinalized]);

  const resetGroup = useCallback((group: GroupId) => {
    if (isGroupFinalized(group)) return;
    setLastSavedAt(null);
    setSaveError(null);
    setGroupRankings((prev) => ({ ...prev, [group]: [...BRACKET_GROUPS[group]] }));
  }, [isGroupFinalized]);

  const resetAll = useCallback(() => {
    const rankings = defaultRankings();
    const nextPicks = defaultPicks();
    setGroupRankings(rankings);
    setCommittedGroupRankings(rankings);
    setFinalizedGroups([]);
    setPicks(nextPicks);
    setCommittedPicks(nextPicks);
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

  const saveGroup = useCallback(async (group: GroupId) => {
    if (!user) {
      setSaveError(new Error("Sign in to save your bracket."));
      return false;
    }

    if (isGroupFinalized(group)) {
      return true;
    }

    setIsSaving(true);
    setSaveError(null);

    const nextFinalizedGroups = normalizeFinalizedGroups([...finalizedGroups, group]);
    const nextGroupRankings: Record<GroupId, string[]> = {
      ...committedGroupRankings,
      [group]: [...(groupRankings[group] ?? BRACKET_GROUPS[group])]
    };
    const persisted: PersistedBracketPicks = {
      groupRankings: nextGroupRankings,
      finalizedGroups: nextFinalizedGroups,
      picks: committedPicks
    };

    try {
      const saved = await submitCurrentBracket(persisted, groupId);
      setCommittedGroupRankings(saved.picks.groupRankings);
      setCommittedPicks(saved.picks.picks);
      setFinalizedGroups(normalizeFinalizedGroups(saved.picks.finalizedGroups ?? nextFinalizedGroups));
      setLastSavedAt(saved.updatedAt);
      setGroupRankings((prev) => ({
        ...prev,
        [group]: saved.picks.groupRankings[group] ?? nextGroupRankings[group]
      }));
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    committedGroupRankings,
    committedPicks,
    finalizedGroups,
    groupId,
    groupRankings,
    isGroupFinalized,
    user
  ]);

  const saveBracket = useCallback(async () => {
    if (!user) {
      setSaveError(new Error("Sign in to save your bracket."));
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const persisted: PersistedBracketPicks = { groupRankings, finalizedGroups, picks };

    try {
      const saved = await submitCurrentBracket(persisted, groupId);
      setCommittedGroupRankings(saved.picks.groupRankings);
      setCommittedPicks(saved.picks.picks);
      setFinalizedGroups(normalizeFinalizedGroups(saved.picks.finalizedGroups ?? finalizedGroups));
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
        setFinalizedGroups(normalizeFinalizedGroups(fresh?.picks.finalizedGroups ?? finalizedGroups));

        try {
          const retried = await submitCurrentBracket(
            {
              groupRankings: revertedRankings,
              finalizedGroups: normalizeFinalizedGroups(fresh?.picks.finalizedGroups ?? finalizedGroups),
              picks: revertedPicks
            },
            groupId
          );
          setCommittedGroupRankings(retried.picks.groupRankings);
          setCommittedPicks(retried.picks.picks);
          setFinalizedGroups(normalizeFinalizedGroups(retried.picks.finalizedGroups ?? finalizedGroups));
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
  }, [finalizedGroups, groupRankings, picks, user, groupId]);

  const value = useMemo<BracketContextValue>(
    () => ({
      isCreated,
      isLoadingSavedBracket,
      isSaving,
      lastSavedAt,
      saveError,
      groupRankings,
      finalizedGroups,
      picks,
      start,
      resetAll,
      saveBracket,
      saveGroup,
      moveTeamUp,
      moveTeamDown,
      resetGroup,
      setPick,
      setFinal,
      setThird,
      areAllGroupsFinalized,
      isGroupFinalized,
      isGroupLocked: lockState.isGroupLocked,
      isMatchLocked: lockState.isMatchLocked,
      isClockFallback: lockState.isClockFallback,
      phase: lockState.phase,
      stageState,
      nextLockAt: lockState.nextLockAt,
      nextLockLabel: lockState.nextLockLabel,
      fixturesLoading: lockState.isLoading
    }),
    [
      isCreated, isLoadingSavedBracket, isSaving, lastSavedAt, saveError,
      groupRankings, finalizedGroups, picks, start, resetAll, saveBracket, saveGroup,
      moveTeamUp, moveTeamDown, resetGroup, setPick, setFinal, setThird,
      areAllGroupsFinalized, isGroupFinalized, lockState, stageState
    ]
  );

  return <BracketContext.Provider value={value}>{children}</BracketContext.Provider>;
}

export function useBracket(): BracketContextValue {
  const ctx = useContext(BracketContext);
  if (!ctx) throw new Error("useBracket must be used within a BracketProvider.");
  return ctx;
}

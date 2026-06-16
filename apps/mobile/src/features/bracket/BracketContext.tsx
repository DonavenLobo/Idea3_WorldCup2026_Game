import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BRACKET_GROUPS, GROUP_IDS } from "@world-cup-game/config";
import type { GroupId } from "@world-cup-game/config";
import { useSession } from "../auth/hooks/useSession";
import { getCurrentBracket, submitCurrentBracket } from "./api/brackets";
import type {
  BracketPicks,
  BracketState,
  KnockoutFinalizedMap,
  PersistedBracketPicks,
  PickRound
} from "./types";
import { useFixtures } from "./hooks/useFixtures";
import { useBracketStageState } from "./hooks/useBracketStageState";
import {
  computeBracketLockStateFromFinalized,
  KNOCKOUT_ROUND_IDS,
  type KnockoutRoundId,
  type TournamentPhase
} from "./lib/computeBracketLockState";
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

function defaultKnockoutFinalized(): KnockoutFinalizedMap {
  return { r32: false, r16: false, qf: false, sf: false, final: false, third: false };
}

interface BracketContextValue extends BracketState {
  start: () => void;
  saveBracket: () => Promise<void>;
  /**
   * Persist the given group's rankings. Adds the group to `finalizedGroups`
   * and makes that group review-only. The full bracket reset is the only
   * way to reopen saved group picks.
   */
  saveGroup: (group: GroupId) => Promise<boolean>;
  /**
   * Persist the given knockout round's picks and mark the round finalized.
   * Mirrors `saveGroup` semantics — once saved, the round becomes
   * review-only and `isKnockoutRoundFinalized(round)` returns true.
   */
  saveKnockoutRound: (round: KnockoutRoundId) => Promise<boolean>;
  moveTeamUp: (group: GroupId, index: number) => void;
  moveTeamDown: (group: GroupId, index: number) => void;
  resetGroup: (group: GroupId) => void;
  setPick: (round: PickRound, matchIndex: number, code: string) => void;
  setFinal: (code: string | null) => void;
  setThird: (code: string | null) => void;
  areAllGroupsFinalized: boolean;
  areAllKnockoutRoundsFinalized: boolean;
  isGroupFinalized: (group: GroupId) => boolean;
  isKnockoutRoundFinalized: (round: KnockoutRoundId) => boolean;
  isGroupLocked: (group: GroupId) => boolean;
  isMatchLocked: (round: KnockoutRoundId, index: number) => boolean;
  isClockFallback: boolean;
  phase: TournamentPhase;
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
  const [knockoutFinalized, setKnockoutFinalized] =
    useState<KnockoutFinalizedMap>(defaultKnockoutFinalized);
  const [picks, setPicks] = useState<BracketPicks>(defaultPicks);
  const [committedPicks, setCommittedPicks] = useState<BracketPicks>(defaultPicks);
  // Fixtures + clock are no longer used for lock derivation (Task 16/17
  // moved the model to lock-on-save) — we still subscribe to `useFixtures`
  // so the existing loading/clock-fallback banners keep working.
  const fixturesState = useFixtures();
  const stageState = useBracketStageState();
  const areAllGroupsFinalized = finalizedGroups.length === GROUP_IDS.length;
  const areAllKnockoutRoundsFinalized = KNOCKOUT_ROUND_IDS.every(
    (round) => knockoutFinalized[round]
  );

  const isGroupFinalized = useCallback(
    (group: GroupId) => finalizedGroups.includes(group),
    [finalizedGroups]
  );

  const isKnockoutRoundFinalized = useCallback(
    (round: KnockoutRoundId) => knockoutFinalized[round] === true,
    [knockoutFinalized]
  );

  const lockState = useMemo(
    () => computeBracketLockStateFromFinalized({
      isGroupFinalized,
      isKnockoutRoundFinalized
    }),
    [isGroupFinalized, isKnockoutRoundFinalized]
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
      setKnockoutFinalized(defaultKnockoutFinalized());
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
        setKnockoutFinalized(
          savedBracket.picks.knockoutFinalized ?? defaultKnockoutFinalized()
        );
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
    if (index <= 0) return;
    if (finalizedGroups.includes(group)) return;
    setLastSavedAt(null);
    setSaveError(null);
    setGroupRankings((prev) => {
      const current = prev[group];
      if (!current) return prev;
      const next = swap(current, index, index - 1);
      if (!next) return prev;
      return { ...prev, [group]: next };
    });
  }, [finalizedGroups]);

  const moveTeamDown = useCallback((group: GroupId, index: number) => {
    if (finalizedGroups.includes(group)) return;
    setLastSavedAt(null);
    setSaveError(null);
    setGroupRankings((prev) => {
      const current = prev[group];
      if (!current || index >= current.length - 1) return prev;
      const next = swap(current, index, index + 1);
      if (!next) return prev;
      return { ...prev, [group]: next };
    });
  }, [finalizedGroups]);

  const resetGroup = useCallback((group: GroupId) => {
    if (finalizedGroups.includes(group)) return;
    setLastSavedAt(null);
    setSaveError(null);
    setGroupRankings((prev) => ({ ...prev, [group]: [...BRACKET_GROUPS[group]] }));
  }, [finalizedGroups]);

  const setPick = useCallback((round: PickRound, matchIndex: number, code: string) => {
    if (knockoutFinalized[round]) return; // round is finalized — ignore edits
    setLastSavedAt(null);
    setSaveError(null);
    setPicks((prev) => ({
      ...prev,
      [round]: { ...prev[round], [matchIndex]: code }
    }));
  }, [knockoutFinalized]);

  const setFinal = useCallback((code: string | null) => {
    if (knockoutFinalized.final) return;
    setLastSavedAt(null);
    setSaveError(null);
    setPicks((prev) => ({ ...prev, final: code }));
  }, [knockoutFinalized.final]);

  const setThird = useCallback((code: string | null) => {
    if (knockoutFinalized.third) return;
    setLastSavedAt(null);
    setSaveError(null);
    setPicks((prev) => ({ ...prev, third: code }));
  }, [knockoutFinalized.third]);

  const start = useCallback(() => setIsCreated(true), []);

  const saveGroup = useCallback(async (group: GroupId) => {
    if (!user) {
      setSaveError(new Error("Sign in to save your bracket."));
      return false;
    }

    if (finalizedGroups.includes(group)) {
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
      knockoutFinalized,
      picks: committedPicks
    };

    try {
      const saved = await submitCurrentBracket(persisted, groupId);
      setCommittedGroupRankings(saved.picks.groupRankings);
      setCommittedPicks(saved.picks.picks);
      setFinalizedGroups(normalizeFinalizedGroups(saved.picks.finalizedGroups ?? nextFinalizedGroups));
      setKnockoutFinalized(saved.picks.knockoutFinalized ?? knockoutFinalized);
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
    knockoutFinalized,
    user
  ]);

  const saveKnockoutRound = useCallback(async (round: KnockoutRoundId) => {
    if (!user) {
      setSaveError(new Error("Sign in to save your bracket."));
      return false;
    }

    if (knockoutFinalized[round]) {
      return true; // already finalized — no-op
    }

    setIsSaving(true);
    setSaveError(null);

    const nextKnockoutFinalized: KnockoutFinalizedMap = {
      ...knockoutFinalized,
      [round]: true
    };
    const persisted: PersistedBracketPicks = {
      groupRankings: committedGroupRankings,
      finalizedGroups,
      knockoutFinalized: nextKnockoutFinalized,
      picks
    };

    try {
      const saved = await submitCurrentBracket(persisted, groupId);
      setCommittedGroupRankings(saved.picks.groupRankings);
      setCommittedPicks(saved.picks.picks);
      setFinalizedGroups(normalizeFinalizedGroups(saved.picks.finalizedGroups ?? finalizedGroups));
      setKnockoutFinalized(saved.picks.knockoutFinalized ?? nextKnockoutFinalized);
      setPicks(saved.picks.picks);
      setLastSavedAt(saved.updatedAt);
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err : new Error(String(err)));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    committedGroupRankings,
    finalizedGroups,
    groupId,
    knockoutFinalized,
    picks,
    user
  ]);

  const saveBracket = useCallback(async () => {
    if (!user) {
      setSaveError(new Error("Sign in to save your bracket."));
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const persisted: PersistedBracketPicks = {
      groupRankings,
      finalizedGroups,
      knockoutFinalized,
      picks
    };

    try {
      const saved = await submitCurrentBracket(persisted, groupId);
      setCommittedGroupRankings(saved.picks.groupRankings);
      setCommittedPicks(saved.picks.picks);
      setFinalizedGroups(normalizeFinalizedGroups(saved.picks.finalizedGroups ?? finalizedGroups));
      setKnockoutFinalized(saved.picks.knockoutFinalized ?? knockoutFinalized);
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
              knockoutFinalized: fresh?.picks.knockoutFinalized ?? knockoutFinalized,
              picks: revertedPicks
            },
            groupId
          );
          setCommittedGroupRankings(retried.picks.groupRankings);
          setCommittedPicks(retried.picks.picks);
          setFinalizedGroups(normalizeFinalizedGroups(retried.picks.finalizedGroups ?? finalizedGroups));
          setKnockoutFinalized(retried.picks.knockoutFinalized ?? knockoutFinalized);
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
  }, [finalizedGroups, groupRankings, knockoutFinalized, picks, user, groupId]);

  const value = useMemo<BracketContextValue>(
    () => ({
      isCreated,
      isLoadingSavedBracket,
      isSaving,
      lastSavedAt,
      saveError,
      groupRankings,
      finalizedGroups,
      knockoutFinalized,
      picks,
      start,
      saveBracket,
      saveGroup,
      saveKnockoutRound,
      moveTeamUp,
      moveTeamDown,
      resetGroup,
      setPick,
      setFinal,
      setThird,
      areAllGroupsFinalized,
      areAllKnockoutRoundsFinalized,
      isGroupFinalized,
      isKnockoutRoundFinalized,
      isGroupLocked: lockState.isGroupLocked,
      isMatchLocked: lockState.isMatchLocked,
      // Lock-on-save model: no clock dependency, so no clock-fallback state.
      isClockFallback: false,
      phase: lockState.phase,
      stageState,
      nextLockAt: lockState.nextLockAt,
      nextLockLabel: lockState.nextLockLabel,
      fixturesLoading: fixturesState.isLoading
    }),
    [
      isCreated, isLoadingSavedBracket, isSaving, lastSavedAt, saveError,
      groupRankings, finalizedGroups, knockoutFinalized, picks,
      start, saveBracket, saveGroup, saveKnockoutRound,
      moveTeamUp, moveTeamDown, resetGroup, setPick, setFinal, setThird,
      areAllGroupsFinalized, areAllKnockoutRoundsFinalized,
      isGroupFinalized, isKnockoutRoundFinalized,
      lockState, stageState, fixturesState.isLoading
    ]
  );

  return <BracketContext.Provider value={value}>{children}</BracketContext.Provider>;
}

export function useBracket(): BracketContextValue {
  const ctx = useContext(BracketContext);
  if (!ctx) throw new Error("useBracket must be used within a BracketProvider.");
  return ctx;
}

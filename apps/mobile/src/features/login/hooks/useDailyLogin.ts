import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { claimDailyLogin, type ClaimDailyLoginResponse } from "../api/claim";

const LAST_CLAIM_DATE_STORAGE_KEY = "gogaffa.login.lastClaimDate";

function todayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function synthesizeAlreadyClaimed(today: string): ClaimDailyLoginResponse {
  return {
    alreadyClaimedToday: true,
    awarded: 0,
    newStreak: 0,
    newLongestStreak: 0,
    milestoneHit: null,
    newLastLoginDateKey: today
  };
}

export interface UseDailyLoginState {
  /** Latest claim result, or null if no claim has fired this session. */
  lastResult: ClaimDailyLoginResponse | null;
  /** Currently fetching the claim. */
  isClaiming: boolean;
  /** Last error from claim attempt, or null. */
  error: Error | null;
  /** Manually trigger a claim attempt (still gated by AsyncStorage de-dupe). */
  claim: () => Promise<void>;
}

export function useDailyLogin(): UseDailyLoginState {
  const [lastResult, setLastResult] = useState<ClaimDailyLoginResponse | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Prevents two concurrent claim calls (e.g. mount + AppState change racing).
  const inFlightRef = useRef(false);
  // Tracks whether the component is still mounted before we set state.
  const isMountedRef = useRef(true);

  const runClaim = useCallback(async () => {
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;

    const today = todayDateKey();

    try {
      // Same-day de-dupe at the device level — never call the edge function
      // more than once per device per day.
      const persisted = await AsyncStorage.getItem(LAST_CLAIM_DATE_STORAGE_KEY);
      if (persisted === today) {
        if (isMountedRef.current) {
          setLastResult(synthesizeAlreadyClaimed(today));
        }
        return;
      }

      if (isMountedRef.current) {
        setIsClaiming(true);
        setError(null);
      }

      const result = await claimDailyLogin(today);

      // Persist today's key on either outcome (server-side already-claimed or
      // fresh claim) so we don't refire today.
      await AsyncStorage.setItem(LAST_CLAIM_DATE_STORAGE_KEY, today);

      if (isMountedRef.current) {
        setLastResult(result);
      }
    } catch (err) {
      const normalized = err instanceof Error ? err : new Error(String(err));
      if (isMountedRef.current) {
        setError(normalized);
      }
    } finally {
      inFlightRef.current = false;
      if (isMountedRef.current) {
        setIsClaiming(false);
      }
    }
  }, []);

  const claim = useCallback(async () => {
    await runClaim();
  }, [runClaim]);

  // Cold-start: fire the claim attempt once on mount.
  useEffect(() => {
    isMountedRef.current = true;
    void runClaim();
    return () => {
      isMountedRef.current = false;
    };
  }, [runClaim]);

  // Foreground re-check: when the app returns to "active", if a new calendar
  // day has begun since the persisted claim, re-fire.
  useEffect(() => {
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state !== "active") {
        return;
      }
      void (async () => {
        const today = todayDateKey();
        const persisted = await AsyncStorage.getItem(LAST_CLAIM_DATE_STORAGE_KEY);
        if (persisted === today) {
          return;
        }
        await runClaim();
      })();
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [runClaim]);

  return {
    lastResult,
    isClaiming,
    error,
    claim
  };
}

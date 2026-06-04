// apps/mobile/src/features/bracket/hooks/useTournamentClock.ts
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";

const POLL_INTERVAL_MS = 60_000;
const MAX_FAILURES = 2;

export interface TournamentClock {
  /** Best estimate of server "now". Reactive — re-emitted every 60s. */
  now: Date;
  /** True if we're falling back to device clock. */
  isUsingFallback: boolean;
}

/**
 * Fetch server time from Supabase periodically. Derive `now` as
 * `Date.now() + offset` so the clock advances smoothly between polls without
 * needing a 1Hz timer.
 *
 * `get_server_time()` RPC is added in migration 000021. Until that ships,
 * the hook stays in fallback mode silently.
 */
export function useTournamentClock(): TournamentClock {
  const [offsetMs, setOffsetMs] = useState<number>(0);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);
  const failureCountRef = useRef(0);
  // Force re-renders so countdowns tick down without each consumer wiring a 1Hz timer.
  const [, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchServerNow = async () => {
      try {
        const { data, error } = await supabase.rpc("get_server_time");
        if (error) throw error;
        const serverMs =
          typeof data === "number"
            ? data * 1000
            : new Date(String(data)).getTime();
        if (cancelled || !Number.isFinite(serverMs)) return;
        setOffsetMs(serverMs - Date.now());
        setIsUsingFallback(false);
        failureCountRef.current = 0;
      } catch {
        failureCountRef.current += 1;
        if (failureCountRef.current >= MAX_FAILURES && !cancelled) {
          setIsUsingFallback(true);
        }
      }
    };

    void fetchServerNow();
    const interval = setInterval(() => {
      void fetchServerNow();
      setTick((t) => t + 1);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return {
    now: new Date(Date.now() + offsetMs),
    isUsingFallback
  };
}

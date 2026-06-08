import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";
import {
  clearLocalSupabaseSession,
  isMissingAuthUserError,
  isMissingSessionError,
} from "../api/sessionRecovery";

interface UseSessionResult {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void supabase.auth.getSession()
      .then(async ({ data, error }) => {
        if (error) {
          console.warn("Failed to load Supabase session", error);
        }

        const cachedSession = data.session;

        if (!cachedSession) {
          if (isMounted) {
            setSession(null);
            setIsLoading(false);
          }
          return;
        }

        const { error: userError } = await supabase.auth.getUser();

        if (userError) {
          if (isMissingAuthUserError(userError) || isMissingSessionError(userError)) {
            await clearLocalSupabaseSession();
            if (isMounted) {
              setSession(null);
              setIsLoading(false);
            }
            return;
          }

          console.warn("Failed to validate Supabase session", userError);
        }

        if (isMounted) {
          setSession(cachedSession);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.warn("Failed to load Supabase session", error);
        if (isMounted) {
          setSession(null);
          setIsLoading(false);
        }
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    isLoading
  } satisfies UseSessionResult;
}

import { useEffect, useRef } from "react";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { APP_ROUTES } from "@world-cup-game/config";
import {
  createSessionFromOAuthUrl,
  isSupabaseAuthCallbackUrl
} from "../api/signInWithProvider";
import { saveCompletedOnboarding, useOnboarding } from "../../onboarding";

export function useAuthRedirectHandler() {
  const router = useRouter();
  const onboarding = useOnboarding();
  const url = Linking.useURL();
  const handledUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!url || handledUrlRef.current === url || !isSupabaseAuthCallbackUrl(url)) {
      return;
    }

    handledUrlRef.current = url;

    void createSessionFromOAuthUrl(url)
      .then(async (session) => {
        if (session) {
          try {
            await saveCompletedOnboarding(onboarding);
          } catch (saveError) {
            console.warn("Failed to save onboarding after auth callback", saveError);
          }

          router.replace(APP_ROUTES.tabs.home);
        }
      })
      .catch((error: unknown) => {
        console.warn("Failed to handle Supabase auth callback", error);
      });
  }, [onboarding, router, url]);
}

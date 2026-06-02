import { useEffect, useRef } from "react";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { APP_ROUTES } from "@world-cup-game/config";
import {
  createSessionFromOAuthUrl,
  isSupabaseAuthCallbackUrl
} from "../api/signInWithProvider";

export function useAuthRedirectHandler() {
  const router = useRouter();
  const url = Linking.useURL();
  const handledUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!url || handledUrlRef.current === url || !isSupabaseAuthCallbackUrl(url)) {
      return;
    }

    handledUrlRef.current = url;

    void createSessionFromOAuthUrl(url)
      .then((session) => {
        if (session) {
          router.replace(APP_ROUTES.tabs.home);
        }
      })
      .catch((error: unknown) => {
        console.warn("Failed to handle Supabase auth callback", error);
      });
  }, [router, url]);
}

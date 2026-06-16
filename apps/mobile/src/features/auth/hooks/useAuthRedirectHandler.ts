import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { APP_ROUTES } from "@gogaffa/config";
import {
  createSessionFromOAuthUrl,
  isSupabaseAuthCallbackUrl
} from "../api/signInWithProvider";
import { useOnboarding } from "../../onboarding";
import { finalizeSignIn } from "../api/finalizeSignIn";

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
        if (!session) {
          return;
        }

        const outcome = await finalizeSignIn(onboarding);

        if (outcome === "needs-onboarding") {
          Alert.alert(
            "No account yet",
            "We couldn't find a GoGaffa account for that login. Let's create your footballer card first."
          );
          router.replace(APP_ROUTES.onboarding.selectNation);
          return;
        }

        router.replace(APP_ROUTES.tabs.home);
      })
      .catch((error: unknown) => {
        console.warn("Failed to handle Supabase auth callback", error);
      });
  }, [onboarding, router, url]);
}

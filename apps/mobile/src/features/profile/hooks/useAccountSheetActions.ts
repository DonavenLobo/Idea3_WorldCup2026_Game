import { useCallback, useRef } from "react";
import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { APP_ROUTES } from "@world-cup-game/config";
import { useRouter, type Href } from "expo-router";
import { triggerWarning } from "../../../lib/haptics";
import { signOutSupabaseUser } from "../../auth/api/sessionRecovery";
import { useOnboarding } from "../../onboarding";

export function useAccountSheetActions(onOpenChange?: (open: boolean) => void) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { reset } = useOnboarding();
  const pendingRouteRef = useRef<Href | null>(null);
  const pendingSignOutRef = useRef(false);
  const isSigningOutRef = useRef(false);

  const executeSignOut = useCallback(async () => {
    if (isSigningOutRef.current) {
      return;
    }

    isSigningOutRef.current = true;

    try {
      await signOutSupabaseUser();
      reset();
      queryClient.clear();
      router.replace(APP_ROUTES.onboarding.selectNation);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";
      Alert.alert("Sign-out failed", message);
    } finally {
      isSigningOutRef.current = false;
    }
  }, [queryClient, reset, router]);

  const confirmSignOut = useCallback(() => {
    triggerWarning();

    Alert.alert(
      "Sign out of GoGaffa?",
      "You can sign back in anytime and pick up where you left off.",
      [
        { style: "cancel", text: "Cancel" },
        {
          style: "destructive",
          text: "Sign out",
          onPress: () => void executeSignOut(),
        },
      ]
    );
  }, [executeSignOut]);

  const handleDismiss = useCallback(() => {
    onOpenChange?.(false);

    const pendingRoute = pendingRouteRef.current;
    const pendingSignOut = pendingSignOutRef.current;

    pendingRouteRef.current = null;
    pendingSignOutRef.current = false;

    if (pendingSignOut) {
      confirmSignOut();
      return;
    }

    if (pendingRoute) {
      router.push(pendingRoute);
    }
  }, [confirmSignOut, onOpenChange, router]);

  const queueNavigation = useCallback((route: Href) => {
    pendingRouteRef.current = route;
    pendingSignOutRef.current = false;
  }, []);

  const queueSignOut = useCallback(() => {
    pendingSignOutRef.current = true;
    pendingRouteRef.current = null;
  }, []);

  const resetPending = useCallback(() => {
    pendingRouteRef.current = null;
    pendingSignOutRef.current = false;
  }, []);

  return {
    handleDismiss,
    queueNavigation,
    queueSignOut,
    resetPending,
  };
}

import { useCallback, useRef } from "react";
import { ActionSheetIOS, Alert, Platform } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { APP_ROUTES } from "@world-cup-game/config";
import { useRouter, type Href } from "expo-router";
import { triggerWarning } from "../../../lib/haptics";
import { supabase } from "../../../lib/supabase";
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
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

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

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          cancelButtonIndex: 1,
          destructiveButtonIndex: 0,
          message: "You can sign back in anytime and pick up where you left off.",
          options: ["Sign out", "Cancel"],
          title: "Sign out of GoGaffa?",
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            void executeSignOut();
          }
        }
      );
      return;
    }

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

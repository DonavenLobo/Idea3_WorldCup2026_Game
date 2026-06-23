import { useCallback, useRef } from "react";
import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { APP_ROUTES } from "@gogaffa/config";
import { useRouter, type Href } from "expo-router";
import { triggerWarning } from "../../../lib/haptics";
import { signOutSupabaseUser } from "../../auth/api/sessionRecovery";
import { useOnboarding } from "../../onboarding";
import { deleteAccount } from "../api/deleteAccount";

export function useAccountSheetActions(onOpenChange?: (open: boolean) => void) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { reset } = useOnboarding();
  const pendingRouteRef = useRef<Href | null>(null);
  const pendingSignOutRef = useRef(false);
  const pendingDeleteRef = useRef(false);
  const isSigningOutRef = useRef(false);
  const isDeletingRef = useRef(false);

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

  const executeDeleteAccount = useCallback(async () => {
    if (isDeletingRef.current) {
      return;
    }

    isDeletingRef.current = true;

    try {
      await deleteAccount();

      // The account is gone; sign-out may fail because the auth user no longer
      // exists, so never let it block the local teardown.
      try {
        await signOutSupabaseUser();
      } catch {
        // already deleted — local session is cleared below
      }

      reset();
      queryClient.clear();
      router.replace(APP_ROUTES.onboarding.selectNation);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";
      Alert.alert("Couldn't delete account", message);
    } finally {
      isDeletingRef.current = false;
    }
  }, [queryClient, reset, router]);

  const confirmDeleteAccount = useCallback(() => {
    triggerWarning();

    Alert.alert(
      "Delete your account?",
      "This permanently deletes your account, your card, and all your data. This can't be undone.",
      [
        { style: "cancel", text: "Cancel" },
        {
          style: "destructive",
          text: "Delete account",
          onPress: () => void executeDeleteAccount(),
        },
      ]
    );
  }, [executeDeleteAccount]);

  const handleDismiss = useCallback(() => {
    onOpenChange?.(false);

    const pendingRoute = pendingRouteRef.current;
    const pendingSignOut = pendingSignOutRef.current;
    const pendingDelete = pendingDeleteRef.current;

    pendingRouteRef.current = null;
    pendingSignOutRef.current = false;
    pendingDeleteRef.current = false;

    if (pendingDelete) {
      confirmDeleteAccount();
      return;
    }

    if (pendingSignOut) {
      confirmSignOut();
      return;
    }

    if (pendingRoute) {
      router.push(pendingRoute);
    }
  }, [confirmDeleteAccount, confirmSignOut, onOpenChange, router]);

  const queueNavigation = useCallback((route: Href) => {
    pendingRouteRef.current = route;
    pendingSignOutRef.current = false;
    pendingDeleteRef.current = false;
  }, []);

  const queueSignOut = useCallback(() => {
    pendingSignOutRef.current = true;
    pendingRouteRef.current = null;
    pendingDeleteRef.current = false;
  }, []);

  const queueDeleteAccount = useCallback(() => {
    pendingDeleteRef.current = true;
    pendingSignOutRef.current = false;
    pendingRouteRef.current = null;
  }, []);

  const resetPending = useCallback(() => {
    pendingRouteRef.current = null;
    pendingSignOutRef.current = false;
    pendingDeleteRef.current = false;
  }, []);

  return {
    handleDismiss,
    queueNavigation,
    queueSignOut,
    queueDeleteAccount,
    resetPending,
  };
}

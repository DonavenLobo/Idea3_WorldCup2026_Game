import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppState } from "react-native";
import { useSession } from "../../../hooks/useSession";
import {
  getNotificationsModule,
  registerForPushNotifications,
  type NotificationsModule
} from "../../../lib/pushNotifications";
import { supabase } from "../../../lib/supabase";

type NotificationSubscription = ReturnType<
  NotificationsModule["addNotificationResponseReceivedListener"]
>;

async function addCardReadyNotificationListener(
  invalidateCard: () => void
): Promise<NotificationSubscription | null> {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      return null;
    }

    return Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.notification.request.content.data?.type === "CARD_READY") {
        invalidateCard();
      }
    });
  } catch (error) {
    console.warn("Push notification listener unavailable", error);
    return null;
  }
}

export function useCardRealtime() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      return;
    }

    void registerForPushNotifications().catch((error) => {
      console.warn("Failed to register for push notifications", error);
    });

    const invalidateCard = () => {
      void queryClient.invalidateQueries({ queryKey: ["current-card", userId] });
    };
    let notificationSubscription: NotificationSubscription | null = null;
    void addCardReadyNotificationListener(invalidateCard).then((subscription) => {
      notificationSubscription = subscription;
    });

    const channel = supabase
      .channel(`cards:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          filter: `user_id=eq.${userId}`,
          schema: "public",
          table: "cards"
        },
        invalidateCard
      )
      .subscribe();
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        invalidateCard();
      }
    });

    return () => {
      void supabase.removeChannel(channel);
      notificationSubscription?.remove();
      appStateSubscription.remove();
    };
  }, [queryClient, userId]);
}

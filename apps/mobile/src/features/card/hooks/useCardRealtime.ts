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
type ReceivedNotificationSubscription = ReturnType<
  NotificationsModule["addNotificationReceivedListener"]
>;

async function addCardReadyNotificationListeners(
  invalidateCard: () => void
): Promise<{
  received: ReceivedNotificationSubscription;
  response: NotificationSubscription;
} | null> {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      return null;
    }

    const received = Notifications.addNotificationReceivedListener((notification) => {
      if (notification.request.content.data?.type === "CARD_READY") {
        invalidateCard();
      }
    });
    const response = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.notification.request.content.data?.type === "CARD_READY") {
        invalidateCard();
      }
    });

    return { received, response };
  } catch (error) {
    console.warn("Push notification listeners unavailable", error);
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
    let notificationSubscriptions: {
      received: ReceivedNotificationSubscription;
      response: NotificationSubscription;
    } | null = null;
    void addCardReadyNotificationListeners(invalidateCard).then((subscriptions) => {
      notificationSubscriptions = subscriptions;
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
      notificationSubscriptions?.received.remove();
      notificationSubscriptions?.response.remove();
      appStateSubscription.remove();
    };
  }, [queryClient, userId]);
}

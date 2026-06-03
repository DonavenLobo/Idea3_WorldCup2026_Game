import Constants from "expo-constants";
import { Platform } from "react-native";
import { savePushToken } from "../features/notifications/api/savePushToken";

export type NotificationsModule = typeof import("expo-notifications");

let notificationsPromise: Promise<NotificationsModule | null> | null = null;
let notificationHandlerConfigured = false;

export async function getNotificationsModule(): Promise<NotificationsModule | null> {
  notificationsPromise ??= import("expo-notifications").catch((error) => {
    console.warn("Push notifications unavailable in this build", error);
    return null;
  });

  const Notifications = await notificationsPromise;
  if (!Notifications) {
    return null;
  }

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true
      })
    });
    notificationHandlerConfigured = true;
  }

  return Notifications;
}

async function loadNotifications(): Promise<NotificationsModule | null> {
  try {
    return await getNotificationsModule();
  } catch (error) {
    console.warn("Push notifications unavailable in this build", error);
    return null;
  }
}

function getProjectId(): string | undefined {
  const extraProjectId = Constants.expoConfig?.extra?.eas?.projectId;
  const easProjectId = Constants.easConfig?.projectId;

  return typeof extraProjectId === "string"
    ? extraProjectId
    : typeof easProjectId === "string"
      ? easProjectId
      : undefined;
}

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const Notifications = await loadNotifications();
    if (!Notifications) {
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        importance: Notifications.AndroidImportance.MAX,
        name: "Default"
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;

    if (status !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status;
    }

    if (status !== "granted") {
      return null;
    }

    const projectId = getProjectId();
    if (!projectId) {
      console.warn("Expo project ID is missing; push registration skipped.");
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId
    });
    const token = tokenResponse.data;

    await savePushToken(token).catch((error) => {
      console.warn("Failed to persist push token", error);
    });

    return token;
  } catch (error) {
    console.warn("Push notification registration skipped", error);
    return null;
  }
}

// apps/mobile/src/features/bracket/notifications.ts
import * as Notifications from "expo-notifications";

const NOTIFICATION_IDENTIFIER = "bracket-phase2-open";
const PHASE_2_REMINDER_DATE = new Date("2026-06-27T21:00:00");

/**
 * Idempotently schedule a single local notification reminding the user that
 * Phase 2 has opened. No-op if:
 *   - User denied notification permission
 *   - The reminder date has already passed
 *   - We've already scheduled this notification
 */
export async function scheduleKnockoutReminder(): Promise<void> {
  if (PHASE_2_REMINDER_DATE.getTime() <= Date.now()) return;

  const settings = await Notifications.getPermissionsAsync();
  if (settings.status !== "granted") return;

  const existing = await Notifications.getAllScheduledNotificationsAsync();
  if (existing.some((n) => n.identifier === NOTIFICATION_IDENTIFIER)) return;

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDENTIFIER,
    content: {
      title: "⚽ Phase 2 is open!",
      body: "Group stage is locked. Pick your knockouts before R32 kicks off tomorrow."
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: PHASE_2_REMINDER_DATE
    }
  });
}

export async function cancelKnockoutReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDENTIFIER);
}

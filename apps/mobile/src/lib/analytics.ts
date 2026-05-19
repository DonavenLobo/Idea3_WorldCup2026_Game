export type AnalyticsEvent =
  | "sign_up_started"
  | "sign_up_completed"
  | "nation_selected"
  | "photo_uploaded"
  | "photo_booth_started"
  | "card_created"
  | "card_shared"
  | "group_created"
  | "group_joined"
  | "trivia_started"
  | "trivia_completed"
  | "streak_extended"
  | "locker_room_opened"
  | "purchase_started"
  | "purchase_completed";

export function trackEvent(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  console.info("[analytics]", event, properties ?? {});
}

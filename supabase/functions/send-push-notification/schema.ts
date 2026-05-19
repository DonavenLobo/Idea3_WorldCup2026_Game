export type PushNotificationType =
  | "DAILY_TRIVIA_AVAILABLE"
  | "STREAK_AT_RISK"
  | "MATCH_BOUNTY_AVAILABLE"
  | "CARD_UPGRADE_UNLOCKED"
  | "CARD_READY";

export interface SendPushNotificationRequest {
  userId: string;
  type: PushNotificationType;
  title: string;
  body: string;
}

export function parseSendPushNotificationRequest(value: unknown): SendPushNotificationRequest {
  const input = value as Partial<SendPushNotificationRequest>;

  if (!input.userId || !input.type || !input.title || !input.body) {
    throw new Error("Invalid send-push-notification request.");
  }

  return input as SendPushNotificationRequest;
}

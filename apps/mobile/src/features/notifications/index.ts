export const NOTIFICATION_TYPES = [
  "CARD_READY",
  "DAILY_TRIVIA_AVAILABLE",
  "STREAK_AT_RISK",
  "MATCH_BOUNTY_AVAILABLE",
  "CARD_UPGRADE_UNLOCKED"
] as const;

export { savePushToken } from "./api/savePushToken";

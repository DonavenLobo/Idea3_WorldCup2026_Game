import { tokens } from "./tokens";

export const colors = {
  cream: tokens.colors.cream,
  ink: tokens.colors.navy,
  red: tokens.colors.red,
  blue: tokens.colors.blue,
  purple: tokens.colors.purple,
  success: tokens.colors.success,
  pillMuted: tokens.colors.pillMuted,
} as const;

export const opacity = {
  ink85: "rgba(26, 31, 46, 0.85)",
  ink80: "rgba(26, 31, 46, 0.80)",
  ink70: "rgba(26, 31, 46, 0.70)",
  ink60: "rgba(26, 31, 46, 0.60)",
  ink55: "rgba(26, 31, 46, 0.55)",
  ink35: "rgba(26, 31, 46, 0.35)",
  ink30: "rgba(26, 31, 46, 0.30)",
  ink10: "rgba(26, 31, 46, 0.10)",
  ink15: "rgba(26, 31, 46, 0.15)",
  ink12: "rgba(26, 31, 46, 0.12)",
  cream80: "rgba(242, 237, 228, 0.80)",
  cream75: "rgba(242, 237, 228, 0.75)",
  cream70: "rgba(242, 237, 228, 0.70)",
  red50: "rgba(230, 57, 70, 0.50)",
  red18: "rgba(230, 57, 70, 0.18)",
} as const;

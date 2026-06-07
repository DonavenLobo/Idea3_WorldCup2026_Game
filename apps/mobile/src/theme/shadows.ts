import { Platform } from "react-native";

export const shadows = {
  buttonCta: Platform.select({
    ios: {
      shadowColor: "#1a1a2e",
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
    },
    android: { elevation: 4 },
    default: {},
  }),
  buttonCtaLarge: Platform.select({
    ios: {
      shadowColor: "#1a1a2e",
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
    },
    android: { elevation: 6 },
    default: {},
  }),
  card: Platform.select({
    ios: {
      shadowColor: "#1a1a2e",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    android: { elevation: 4 },
    default: {},
  }),
  contentPanel: Platform.select({
    ios: {
      shadowColor: "#1a1a2e",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.45,
      shadowRadius: 40,
    },
    android: { elevation: 8 },
    default: {},
  }),
} as const;

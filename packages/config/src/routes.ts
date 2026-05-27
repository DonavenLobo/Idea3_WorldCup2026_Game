export const APP_ROUTES = {
  onboarding: {
    selectNation: "/(onboarding)/select-nation",
    createCard: "/(onboarding)/create-card",
    photoBooth: "/(onboarding)/photo-booth",
    cardPreview: "/(onboarding)/card-preview",
    joinGroup: "/(onboarding)/join-group"
  },
  auth: {
    signUp: "/(auth)/sign-up",
    signIn: "/(auth)/sign-in",
    forgotPassword: "/(auth)/forgot-password",
    enterEmail: "/(auth)/enter-email",
    enterPhone: "/(auth)/enter-phone",
    verify: "/(auth)/verify"
  },
  tabs: {
    home: "/(tabs)/home",
    bracket: "/(tabs)/bracket",
    groups: "/(tabs)/groups",
    trivia: "/(tabs)/trivia",
    card: "/(tabs)/card",
    schedule: "/(tabs)/schedule",
    lockerRoom: "/(tabs)/locker-room"
  }
} as const;

export const WEB_ROUTES = {
  card: (slug: string) => `/card/${slug}`,
  invite: (inviteCode: string) => `/invite/${inviteCode}`,
  download: "/download"
} as const;

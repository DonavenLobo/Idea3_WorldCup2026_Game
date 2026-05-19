export const APP_ROUTES = {
  onboarding: {
    selectNation: "/(onboarding)/select-nation",
    createCard: "/(onboarding)/create-card",
    photoBooth: "/(onboarding)/photo-booth",
    cardPreview: "/(onboarding)/card-preview",
    joinGroup: "/(onboarding)/join-group"
  },
  tabs: {
    home: "/(tabs)/home",
    trivia: "/(tabs)/trivia",
    bracket: "/(tabs)/bracket",
    groups: "/(tabs)/groups",
    lockerRoom: "/(tabs)/locker-room"
  }
} as const;

export const WEB_ROUTES = {
  card: (slug: string) => `/card/${slug}`,
  invite: (inviteCode: string) => `/invite/${inviteCode}`,
  download: "/download"
} as const;

export const ONBOARDING_STEPS = [
  "select-nation",
  "photo-booth",
  "create-card",
  "card-preview"
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export { OnboardingProvider, useOnboarding } from "./OnboardingContext";
export { saveCompletedOnboarding } from "./api/saveCompletedOnboarding";
export { NationRow } from "./components/NationRow";
export { PhotoChoiceButton } from "./components/PhotoChoiceButton";
export { MockPlayerCard } from "./components/MockPlayerCard";
export type { OnboardingData, PhotoSource, PhotoSourceType } from "./types";

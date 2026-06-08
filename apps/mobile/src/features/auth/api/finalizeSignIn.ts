import { getCurrentUserCard } from "../../card/api/getCard";
import { saveCompletedOnboarding } from "../../onboarding/api/saveCompletedOnboarding";
import type { OnboardingData } from "../../onboarding/types";
import { signOutSupabaseUser } from "./sessionRecovery";

export type SignInOutcome = "home" | "needs-onboarding";

/**
 * Decides what happens after a successful OAuth sign-in, using the saved card as
 * the source of truth for whether a GoGaffa account already exists.
 *
 * - Existing account (has a saved card): go Home. Never re-create or regenerate
 *   the card, even if the user re-ran onboarding before signing up again.
 * - No account, but onboarding was completed this session: save it and go Home.
 * - No account and nothing to save (e.g. tapped "I already have an account"
 *   without onboarding): sign back out and send them through onboarding.
 */
export async function finalizeSignIn(
  onboarding: OnboardingData
): Promise<SignInOutcome> {
  const existingCard = await getCurrentUserCard();

  if (existingCard) {
    return "home";
  }

  const hasOnboardingData = Boolean(
    onboarding.nation && onboarding.displayName.trim()
  );

  if (hasOnboardingData) {
    await saveCompletedOnboarding(onboarding);
    return "home";
  }

  // OAuth created an auth user but there is no account to land on. Don't leave a
  // dangling empty session — sign out and route them through onboarding.
  await signOutSupabaseUser();
  return "needs-onboarding";
}

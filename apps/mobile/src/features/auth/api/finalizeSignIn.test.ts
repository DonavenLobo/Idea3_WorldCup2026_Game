import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OnboardingData } from "../../onboarding/types";

const { getCurrentUserCard, saveCompletedOnboarding, signOutSupabaseUser } =
  vi.hoisted(() => ({
    getCurrentUserCard: vi.fn(),
    saveCompletedOnboarding: vi.fn(),
    signOutSupabaseUser: vi.fn()
  }));

vi.mock("../../card/api/getCard", () => ({ getCurrentUserCard }));
vi.mock("../../onboarding/api/saveCompletedOnboarding", () => ({
  saveCompletedOnboarding
}));
vi.mock("./sessionRecovery", () => ({ signOutSupabaseUser }));

import { finalizeSignIn } from "./finalizeSignIn";

const completedOnboarding: OnboardingData = {
  nation: { code: "BRA" } as unknown as OnboardingData["nation"],
  displayName: "Pele",
  photoSource: null
};

const emptyOnboarding: OnboardingData = {
  nation: null,
  displayName: "",
  photoSource: null
};

describe("finalizeSignIn", () => {
  beforeEach(() => {
    getCurrentUserCard.mockReset();
    saveCompletedOnboarding.mockReset();
    signOutSupabaseUser.mockReset();
  });

  it("logs an existing account into Home without re-saving the card", async () => {
    getCurrentUserCard.mockResolvedValue({ id: "card-1" });

    const outcome = await finalizeSignIn(completedOnboarding);

    expect(outcome).toBe("home");
    expect(saveCompletedOnboarding).not.toHaveBeenCalled();
    expect(signOutSupabaseUser).not.toHaveBeenCalled();
  });

  it("does not regenerate when an existing account re-runs onboarding then signs up again", async () => {
    getCurrentUserCard.mockResolvedValue({ id: "card-1" });

    // Even with fresh onboarding data present, the existing card wins.
    const outcome = await finalizeSignIn(completedOnboarding);

    expect(outcome).toBe("home");
    expect(saveCompletedOnboarding).not.toHaveBeenCalled();
  });

  it("saves a brand-new account when onboarding was completed this session", async () => {
    getCurrentUserCard.mockResolvedValue(null);
    saveCompletedOnboarding.mockResolvedValue({});

    const outcome = await finalizeSignIn(completedOnboarding);

    expect(outcome).toBe("home");
    expect(saveCompletedOnboarding).toHaveBeenCalledOnce();
    expect(signOutSupabaseUser).not.toHaveBeenCalled();
  });

  it("signs out and routes to onboarding when there is no account and nothing to save", async () => {
    getCurrentUserCard.mockResolvedValue(null);

    const outcome = await finalizeSignIn(emptyOnboarding);

    expect(outcome).toBe("needs-onboarding");
    expect(saveCompletedOnboarding).not.toHaveBeenCalled();
    expect(signOutSupabaseUser).toHaveBeenCalledOnce();
  });
});

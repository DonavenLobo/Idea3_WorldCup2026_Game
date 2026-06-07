import { BASE_CARD_STATS } from "@world-cup-game/config";
import { createCard } from "../../card/api/createCard";
import { startCardGeneration } from "../../card/api/startCardGeneration";
import { uploadCardImage } from "../../../lib/imageUpload";
import { queryClient } from "../../../lib/queryClient";
import { supabase } from "../../../lib/supabase";
import { upsertCurrentProfile } from "../../profile/api/profile";
import type { OnboardingData } from "../types";

function getCompletedOnboardingData(data: OnboardingData) {
  const displayName = data.displayName.trim();

  if (!data.nation || !displayName) {
    return null;
  }

  return {
    displayName,
    nation: data.nation,
    photoSource: data.photoSource
  };
}

export async function saveCompletedOnboarding(data: OnboardingData) {
  const completedData = getCompletedOnboardingData(data);

  if (!completedData) {
    return null;
  }

  const { data: userData, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!userData.user) {
    throw new Error("You must be signed in to save onboarding.");
  }

  const avatarSourceUrl = completedData.photoSource?.uri
    ? await uploadCardImage(
        {
          base64: completedData.photoSource.base64,
          uri: completedData.photoSource.uri
        },
        userData.user.id
      )
    : null;

  const profile = await upsertCurrentProfile({
    avatarUrl: avatarSourceUrl,
    displayName: completedData.displayName,
    selectedNationCode: completedData.nation.code
  });
  const { card } = await createCard({
    avatarSourceUrl,
    displayName: completedData.displayName,
    selectedNationCode: completedData.nation.code,
    stats: BASE_CARD_STATS
  });

  if (card.avatarSourceUrl || completedData.photoSource?.type === "random") {
    await startCardGeneration(card.id);
  }

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["profile", userData.user.id] }),
    queryClient.invalidateQueries({ queryKey: ["current-card", userData.user.id] })
  ]);

  return { card, profile };
}

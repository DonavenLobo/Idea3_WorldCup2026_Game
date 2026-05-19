import type { CardStats } from "@world-cup-game/types";

export interface CreateCardInput {
  displayName: string;
  selectedNationCode: string;
  avatarSourceUrl: string;
  stats: CardStats;
}

export async function createCard(input: CreateCardInput): Promise<{ cardId: string }> {
  // TODO: Insert draft card, upload source image, and start generate-card-avatar function.
  console.info("createCard", input);

  return { cardId: "draft-card" };
}

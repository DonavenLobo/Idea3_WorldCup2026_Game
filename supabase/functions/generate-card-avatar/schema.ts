export interface GenerateCardAvatarRequest {
  cardId: string;
  userId: string;
  displayName: string;
  nationCode: string;
  sourceImageUrl: string;
}

export function parseGenerateCardAvatarRequest(value: unknown): GenerateCardAvatarRequest {
  const input = value as Partial<GenerateCardAvatarRequest>;

  if (!input.cardId || !input.userId || !input.displayName || !input.nationCode || !input.sourceImageUrl) {
    throw new Error("Invalid generate-card-avatar request.");
  }

  return input as GenerateCardAvatarRequest;
}

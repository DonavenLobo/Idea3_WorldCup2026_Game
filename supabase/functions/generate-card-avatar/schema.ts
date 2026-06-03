const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface GenerateCardAvatarRequest {
  cardId: string;
}

export function parseGenerateCardAvatarRequest(value: unknown): GenerateCardAvatarRequest {
  const input = (value ?? {}) as Partial<GenerateCardAvatarRequest>;

  if (typeof input.cardId !== "string" || !UUID_RE.test(input.cardId)) {
    throw new Error("Invalid generate-card-avatar request: cardId must be a UUID.");
  }

  return { cardId: input.cardId };
}

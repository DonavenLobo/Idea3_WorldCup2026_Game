export interface ComposePlayerCardRequest {
  cardId: string;
}

export function parseComposePlayerCardRequest(value: unknown): ComposePlayerCardRequest {
  const input = value as Partial<ComposePlayerCardRequest>;

  if (!input.cardId) {
    throw new Error("Invalid compose-player-card request.");
  }

  return input as ComposePlayerCardRequest;
}

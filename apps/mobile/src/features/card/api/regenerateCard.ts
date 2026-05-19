export async function regenerateCard(cardId: string): Promise<{ generationId: string }> {
  // TODO: Verify purchase or entitlement, then request three new AI outputs.
  console.info("regenerateCard", cardId);

  return { generationId: "pending-generation" };
}

export async function updateCard(cardId: string, patch: Record<string, unknown>): Promise<void> {
  // TODO: Restrict updates to user-editable card fields.
  console.info("updateCard", cardId, patch);
}

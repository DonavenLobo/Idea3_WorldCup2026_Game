export function validateCardDisplayName(displayName: string): boolean {
  return displayName.trim().length >= 2 && displayName.trim().length <= 16;
}

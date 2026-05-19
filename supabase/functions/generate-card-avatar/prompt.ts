import type { GenerateCardAvatarRequest } from "./schema.ts";

export function buildAvatarPrompt(input: GenerateCardAvatarRequest): string {
  return [
    "Create a polished footballer card avatar from the supplied user photo.",
    "Keep the user recognizable, avoid official FIFA branding, and use tournament-inspired styling.",
    `Nation code: ${input.nationCode}.`,
    `Card display name: ${input.displayName}.`
  ].join(" ");
}

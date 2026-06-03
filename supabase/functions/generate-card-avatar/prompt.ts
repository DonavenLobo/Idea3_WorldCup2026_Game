export interface AvatarPromptOptions {
  kitDescription: string;
  mode: "edit" | "generate";
  nationName: string;
}

const SHARED = [
  "Hand-drawn colored-pencil and ink sketch style footballer for a trading card,",
  "head to upper torso, confident hero pose looking toward camera,",
  "rendered on a plain flat warm-beige paper background that matches a sketch trading card.",
  "No card frame, no border, no text, no letters, no numbers, no logos, no crests, no badges, no flags, no sponsors, no scenery - just the player figure on uniform beige paper."
].join(" ");

export function buildAvatarPrompt(opts: AvatarPromptOptions): string {
  const kit = [
    `Wearing an unbranded, logo-free football kit inspired by ${opts.nationName} national-team colors: ${opts.kitDescription}.`,
    "The shirt must be plain color blocks only, with no readable markings or federation-style emblems."
  ].join(" ");

  if (opts.mode === "edit") {
    return [
      "Transform the person in the provided photo into a stylized footballer illustration.",
      "Keep them clearly recognizable: same face, hairstyle, and skin tone.",
      kit,
      SHARED
    ].join(" ");
  }

  return [
    "Invent a plausible footballer character (no input photo provided).",
    kit,
    SHARED
  ].join(" ");
}

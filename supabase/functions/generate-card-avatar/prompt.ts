export interface AvatarPromptOptions {
  kitDescription: string;
  mode: "edit" | "generate";
  nationName: string;
}

const SHARED = [
  "Hand-drawn colored-pencil and ink sketch style footballer for a trading card,",
  "rendered on a plain flat warm-beige paper background that matches a sketch trading card.",
  "No card frame, no border, no text, no letters, no numbers, no logos, no crests, no badges, no flags, no sponsors, no scenery - just the player figure on uniform beige paper."
].join(" ");

const EDIT_POSE = [
  "Follow the input photo's pose, posture, body angle, head tilt, shoulder angle, hand/arm placement, and camera perspective as closely as possible.",
  "Do not invent a new hero pose unless the original pose is impossible to use.",
  "Keep the same crop feel while adapting it into a clean head-to-upper-torso football card avatar."
].join(" ");

export function buildAvatarPrompt(opts: AvatarPromptOptions): string {
  const kit = [
    `Wearing an unbranded, logo-free football kit inspired by ${opts.nationName} national-team colors: ${opts.kitDescription}.`,
    "The shirt must be plain color blocks only, with no readable markings or federation-style emblems."
  ].join(" ");

  if (opts.mode === "edit") {
    return [
      "Transform the person in the provided photo into a stylized footballer illustration.",
      "Cartoonify the photo while keeping them clearly recognizable: same face, hairstyle, skin tone, expression, and silhouette.",
      EDIT_POSE,
      "Make the illustration blend seamlessly with the sketch trading-card art style and avatar window.",
      kit,
      SHARED
    ].join(" ");
  }

  return [
    "Invent a plausible footballer character (no input photo provided).",
    "Use a head-to-upper-torso confident hero pose looking toward camera.",
    kit,
    SHARED
  ].join(" ");
}

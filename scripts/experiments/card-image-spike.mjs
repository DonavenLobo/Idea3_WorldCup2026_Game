// THROWAWAY SPIKE — not part of the app pipeline.
// Generates two card variants from one photo via gpt-image-2 so we can
// eyeball which "AI output scope" reads better:
//   Variant A: player on transparent bg, composited into the level-00 template window
//   Variant B: full-bleed AI card using the existing design as a style reference
//
// Usage:
//   node scripts/experiments/card-image-spike.mjs ["Nation / kit description"] [quality]
// Reads OPENAI_API_KEY from the environment or ../../.env.local (value never logged).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const outDir = resolve(__dirname, "out");

const NATION = process.argv[2] ?? "USA national team (red, white and navy kit)";
const QUALITY = process.argv[3] ?? "high"; // low | medium | high
const PHOTO = resolve(repoRoot, "tests/test_assets/input_image_test.jpg");
const BASE_CARD = resolve(repoRoot, "design/card-templates/level-00-sketch-v1/base-card.png");
const STYLE_REF = resolve(repoRoot, "design/card-templates/designs/level0.png");
const SIZE = "1024x1536";

// Avatar window from level-00-sketch-v1/metadata.json (fit: cover)
const AVATAR_WINDOW = { left: 235, top: 220, width: 565, height: 735 };

const PROMPT_A = [
  "Transform the person in this photo into a stylized footballer illustration for a trading card.",
  "Keep them clearly recognizable: same face, hairstyle, and skin tone.",
  "Hand-drawn colored-pencil and ink sketch style, head to upper-torso, confident hero pose looking toward camera.",
  `Wearing a ${NATION} football kit.`,
  "Render the player on a plain, flat, warm beige paper background that matches a hand-drawn sketch trading card.",
  "No card frame, no border, no text, no numbers, no scenery — just the player figure on uniform beige paper so it can be dropped into a card window."
].join(" ");

const PROMPT_B = [
  "Create a complete hand-drawn footballer trading card, portrait orientation,",
  "in a colored-pencil and ink sketch aesthetic on warm beige paper, matching the supplied reference card's art style.",
  "Feature the person from the supplied photo as the player, clearly recognizable (same face, hairstyle, skin tone),",
  `wearing a ${NATION} football kit in a confident hero pose.`,
  "Leave the top-left corner clear for an overall rating, the top-right corner clear for a national flag,",
  "a clear band near the bottom for the player's name, and a clear row along the very bottom for six stat numbers.",
  "Do NOT draw any text, letters, or numbers anywhere on the card."
].join(" ");

function loadApiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const envPath = resolve(repoRoot, ".env.local");
  if (!existsSync(envPath)) throw new Error("OPENAI_API_KEY not set and .env.local not found");
  for (const raw of readFileSync(envPath, "utf8").split("\n")) {
    const m = raw.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && /OPENAI.*KEY/i.test(m[1])) {
      return m[2].replace(/^['"]|['"]$/g, "").trim();
    }
  }
  throw new Error("OPENAI key not found in .env.local");
}

const API_KEY = loadApiKey();

function fileBlob(path, type = "image/png") {
  return new Blob([readFileSync(path)], { type });
}

async function edit({ images, prompt }) {
  const model = "gpt-image-2"; // gpt-image-2 ONLY — no fallback
  const form = new FormData();
  form.append("model", model);
  form.append("prompt", prompt);
  form.append("size", SIZE);
  form.append("quality", QUALITY);
  form.append("output_format", "png");
  form.append("n", "1");
  for (const img of images) {
    const type = img.endsWith(".jpg") || img.endsWith(".jpeg") ? "image/jpeg" : "image/png";
    const name = img.split("/").pop();
    form.append("image[]", fileBlob(img, type), name);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 240_000);
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form,
    signal: controller.signal
  }).finally(() => clearTimeout(timer));

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`[${model}] ${res.status}: ${text.slice(0, 600)}`);
  }
  const json = JSON.parse(text);
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error(`[${model}] no image in response: ${text.slice(0, 300)}`);
  return { buffer: Buffer.from(b64, "base64"), model, usage: json.usage };
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  console.log(`Photo:   ${PHOTO}`);
  console.log(`Nation:  ${NATION}`);
  console.log(`Quality: ${QUALITY}\n`);

  // Variant A — transparent player, composited into the template window
  console.log("Variant A: generating transparent player avatar...");
  const a = await edit({ images: [PHOTO], prompt: PROMPT_A });
  writeFileSync(resolve(outDir, "avatar_A.png"), a.buffer);
  const avatarFitted = await sharp(a.buffer)
    .resize(AVATAR_WINDOW.width, AVATAR_WINDOW.height, { fit: "cover" })
    .png()
    .toBuffer();
  const cardA = await sharp(BASE_CARD)
    .composite([{ input: avatarFitted, left: AVATAR_WINDOW.left, top: AVATAR_WINDOW.top }])
    .png()
    .toBuffer();
  writeFileSync(resolve(outDir, "card_A.png"), cardA);
  console.log(`  ✓ ${a.model} -> out/avatar_A.png, out/card_A.png\n`);

  // Variant B — full-bleed AI card with the existing design as a style reference
  console.log("Variant B: generating full-bleed AI card...");
  const b = await edit({ images: [PHOTO, STYLE_REF], prompt: PROMPT_B });
  writeFileSync(resolve(outDir, "card_B.png"), b.buffer);
  console.log(`  ✓ ${b.model} -> out/card_B.png\n`);

  // Side-by-side comparison
  const gap = 48;
  const compare = await sharp({
    create: { width: 1024 * 2 + gap, height: 1536, channels: 4, background: { r: 245, g: 240, b: 230, alpha: 1 } }
  })
    .composite([
      { input: cardA, left: 0, top: 0 },
      { input: b.buffer, left: 1024 + gap, top: 0 }
    ])
    .png()
    .toBuffer();
  writeFileSync(resolve(outDir, "compare_AB.png"), compare);
  console.log("Done. Compare: scripts/experiments/out/compare_AB.png  (A = left, B = right)");
}

main().catch((e) => {
  console.error("\nSpike failed:", e.message);
  process.exit(1);
});

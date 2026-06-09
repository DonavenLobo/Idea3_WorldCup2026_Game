// Resize raw app screenshots to exact App Store Connect iPhone sizes.
//
// Source screenshots are device captures with an aspect ratio that doesn't
// exactly match Apple's required pixel dimensions, so we scale to fit and pad
// with the app's cream background (#f5f0e8). This never distorts or crops
// content. Output is flattened, opaque PNG (App Store requirement).
//
// Usage: node scripts/resize-appstore-screenshots.mjs [sourceDir]

import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = path.resolve(process.argv[2] ?? "docs/release/app_v0_screenshots");
const BACKGROUND = "#f5f0e8"; // app cream background

// Portrait-only app. Both are accepted iPhone screenshot slots in App Store Connect.
const TARGETS = [
  { name: "6.7", width: 1284, height: 2778 }, // primary (required tier)
  { name: "6.5", width: 1242, height: 2688 }, // optional / legacy
];

const isImage = (f) => /\.(jpe?g|png)$/i.test(f) && !f.startsWith(".");

const files = (await readdir(SRC)).filter(isImage).sort();

if (files.length === 0) {
  console.error(`No screenshots found in ${SRC}`);
  process.exit(1);
}

for (const target of TARGETS) {
  const outDir = path.join(SRC, "appstore", target.name);
  await mkdir(outDir, { recursive: true });

  for (const file of files) {
    const outName = file.replace(/\.(jpe?g|png)$/i, ".png");
    const outPath = path.join(outDir, outName);

    await sharp(path.join(SRC, file))
      .resize(target.width, target.height, {
        fit: "contain",
        background: BACKGROUND,
      })
      .flatten({ background: BACKGROUND })
      .png()
      .toFile(outPath);
  }

  console.log(
    `${target.name}" (${target.width}x${target.height}): ${files.length} -> ${path.relative(process.cwd(), outDir)}`
  );
}

#!/usr/bin/env node
// Faithful card-layout preview.
//
// Composites the dynamic overlays (overall, flag, name, stats) onto the real
// base card PNG at the template's native metadata coordinates. This is ground
// truth for layout work and does NOT depend on react-native-web (whose card
// render is currently unreliable).
//
// Usage:
//   pnpm preview:card                                  # level-00-sketch-v1
//   node scripts/preview-card.cjs <template-dir>       # any template dir
//
// <template-dir> must contain `metadata.json` + `base-card.png` (the layout in
// design/card-templates/<key>/). Output is written to the OS temp dir and, on
// macOS, opened automatically.
//
// Note: the nation flag is drawn as a labelled placeholder box (e.g. [US])
// because sharp/librsvg cannot rasterize emoji. The real flag emoji renders on
// device. The box position/size are faithful.

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const sharp = require("sharp");

const repoRoot = path.resolve(__dirname, "..");
const templateDir = path.resolve(
  process.argv[2] || path.join(repoRoot, "design/card-templates/level-00-sketch-v1")
);
const metaPath = path.join(templateDir, "metadata.json");
const basePath = path.join(templateDir, "base-card.png");

for (const p of [metaPath, basePath]) {
  if (!fs.existsSync(p)) {
    console.error(`Missing required file: ${p}`);
    console.error("Pass a template dir containing metadata.json and base-card.png.");
    process.exit(1);
  }
}

const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
const { width: W, height: H, layers } = meta;

// Representative sample data (mirrors the visual preview screen).
const sample = {
  overall: 72,
  name: "MIA GAFFA",
  flag: "US",
  stats: { hyp: 74, frm: 68, atk: 81, ast: 77, wal: 63, lck: 89 }
};

const centerX = (x, width = 0) => x + width / 2;
const escape = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// dominant-baseline "hanging" makes y the TOP of the text, matching how the RN
// renderer positions text from `top`.
const text = (x, y, value, size, opts = {}) =>
  `<text x="${x}" y="${y}" font-family="Arial Black, Arial, sans-serif" ` +
  `font-weight="900" font-size="${size}" fill="${opts.fill || "#2C2923"}" ` +
  `text-anchor="${opts.anchor || "middle"}" ` +
  `dominant-baseline="${opts.baseline || "hanging"}">${escape(value)}</text>`;

const parts = [];

const ov = layers.overall;
if (ov) {
  if (ov.label) {
    parts.push(
      text(centerX(ov.labelX ?? ov.x, ov.width), ov.labelY ?? ov.y, ov.label,
        ov.labelFontSize ?? 24, { fill: ov.labelColor || ov.color })
    );
  }
  parts.push(text(centerX(ov.x, ov.width), ov.y, sample.overall, ov.fontSize, { fill: ov.color }));
}

const bd = layers.badge;
if (bd) {
  parts.push(
    `<rect x="${bd.x}" y="${bd.y}" width="${bd.width}" height="${bd.height}" ` +
    `fill="rgba(0,120,255,0.10)" stroke="rgba(0,120,255,0.55)" stroke-width="3" rx="8"/>`
  );
  parts.push(
    text(centerX(bd.x, bd.width), bd.y + (bd.height || 0) / 2, `[${sample.flag}]`,
      bd.fontSize, { baseline: "central", fill: "rgba(0,90,200,0.9)" })
  );
}

const dn = layers.displayName;
if (dn) parts.push(text(centerX(dn.x, dn.width), dn.y, sample.name, dn.fontSize, { fill: dn.color }));

const st = layers.stats;
if (st && Array.isArray(st.columns)) {
  for (const col of st.columns) {
    parts.push(
      text(centerX(col.x, col.width), st.y, sample.stats[col.key] ?? "", st.valueFontSize, { fill: st.color })
    );
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${parts.join("")}</svg>`;
const out = path.join(os.tmpdir(), `card-preview-${meta.id || "card"}.png`);

sharp(basePath)
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .png()
  .toFile(out)
  .then(() => {
    console.log(`Wrote ${out}`);
    console.log("Flag shown as a placeholder box; the real emoji renders on device.");
    if (process.platform === "darwin" && !process.env.NO_OPEN) {
      execFile("open", [out]);
    }
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

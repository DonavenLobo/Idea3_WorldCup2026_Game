const fs = require("node:fs");
const path = require("node:path");
const { PNG } = require("pngjs");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "design/card-templates/designs/level0.png");
const outputPaths = [
  path.join(root, "design/card-templates/level-00-sketch-v1/base-card.png"),
  path.join(root, "apps/mobile/assets/card-templates/level-00-sketch-v1.png")
];

function isBackgroundLike(r, g, b, a) {
  if (a < 16) return true;

  const brightness = (r + g + b) / 3;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);

  return brightness >= 205 && chroma <= 20;
}

function indexFor(x, y, width) {
  return y * width + x;
}

function pushIfBackground({ x, y, png, visited, queue }) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;

  const pixelIndex = indexFor(x, y, png.width);
  if (visited[pixelIndex]) return;

  const dataIndex = pixelIndex * 4;
  if (
    !isBackgroundLike(
      png.data[dataIndex],
      png.data[dataIndex + 1],
      png.data[dataIndex + 2],
      png.data[dataIndex + 3]
    )
  ) {
    return;
  }

  visited[pixelIndex] = 1;
  queue.push([x, y]);
}

function removeConnectedWhiteBackground(png) {
  const visited = new Uint8Array(png.width * png.height);
  const queue = [];

  for (let x = 0; x < png.width; x += 1) {
    pushIfBackground({ x, y: 0, png, visited, queue });
    pushIfBackground({ x, y: png.height - 1, png, visited, queue });
  }

  for (let y = 0; y < png.height; y += 1) {
    pushIfBackground({ x: 0, y, png, visited, queue });
    pushIfBackground({ x: png.width - 1, y, png, visited, queue });
  }

  let cursor = 0;
  while (cursor < queue.length) {
    const [x, y] = queue[cursor];
    cursor += 1;

    pushIfBackground({ x: x + 1, y, png, visited, queue });
    pushIfBackground({ x: x - 1, y, png, visited, queue });
    pushIfBackground({ x, y: y + 1, png, visited, queue });
    pushIfBackground({ x, y: y - 1, png, visited, queue });
  }

  for (let pixelIndex = 0; pixelIndex < visited.length; pixelIndex += 1) {
    if (!visited[pixelIndex]) continue;
    png.data[pixelIndex * 4 + 3] = 0;
  }

  return queue.length;
}

const source = PNG.sync.read(fs.readFileSync(sourcePath));
const transparentPixelCount = removeConnectedWhiteBackground(source);
const output = PNG.sync.write(source);

for (const outputPath of outputPaths) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output);
}

console.log(
  `Created transparent level0 card template with ${transparentPixelCount} transparent background pixels.`
);

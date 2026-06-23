const fs = require("node:fs");
const path = require("node:path");
const { PNG } = require("pngjs");

const root = path.resolve(__dirname, "..");

/** Matte blobs are ~160k px; largest ink stroke cluster is ~760 px. */
const MATTE_COMPONENT_MIN_SIZE = 1000;
/** Peel dark neutral pixels from the cutout silhouette. */
const DARK_EDGE_MAX_CHANNEL = 72;

const targets = [
  {
    source: path.join(root, "apps/mobile/assets/card-templates/level-03-base-v1.png"),
    outputs: [
      path.join(root, "apps/mobile/assets/card-templates/level-03-base-v1.png"),
      path.join(root, "design/card-templates/level-03-base-v1/base-card.png"),
    ],
  },
  {
    source: path.join(root, "apps/mobile/assets/card-templates/level-04-base-v1.png"),
    outputs: [
      path.join(root, "apps/mobile/assets/card-templates/level-04-base-v1.png"),
      path.join(root, "design/card-templates/level-04-base-v1/base-card.png"),
    ],
  },
];

function isExactBlack(r, g, b) {
  return r === 0 && g === 0 && b === 0;
}

function isNearBlackFringe(r, g, b, a) {
  if (a === 0) return true;
  return Math.max(r, g, b) <= 5;
}

function isDarkSilhouetteEdge(r, g, b, a) {
  if (a === 0) return false;

  const maxChannel = Math.max(r, g, b);
  const minChannel = Math.min(r, g, b);
  const chroma = maxChannel - minChannel;

  // Neutral dark outline / matte halo only; keep colored paint strokes.
  return maxChannel <= DARK_EDGE_MAX_CHANNEL && chroma <= 28;
}

function touchesTransparent(data, width, height, x, y) {
  for (const [nextX, nextY] of [
    [x + 1, y],
    [x - 1, y],
    [x, y + 1],
    [x, y - 1],
  ]) {
    if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) return true;
    if (data[(nextY * width + nextX) * 4 + 3] === 0) return true;
  }
  return false;
}

function removeLargeBlackMatte(png) {
  const { width, height, data } = png;
  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  let removedPixels = 0;

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    if (visited[pixelIndex]) continue;

    const dataIndex = pixelIndex * 4;
    if (data[dataIndex + 3] === 0 || !isExactBlack(data[dataIndex], data[dataIndex + 1], data[dataIndex + 2])) {
      continue;
    }

    const queue = [pixelIndex];
    const component = [];
    visited[pixelIndex] = 1;

    while (queue.length > 0) {
      const current = queue.pop();
      component.push(current);

      const x = current % width;
      const y = (current - x) / width;
      for (const [nextX, nextY] of [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ]) {
        if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) continue;
        const nextIndex = nextY * width + nextX;
        if (visited[nextIndex]) continue;

        const nextDataIndex = nextIndex * 4;
        if (
          !isExactBlack(
            data[nextDataIndex],
            data[nextDataIndex + 1],
            data[nextDataIndex + 2]
          )
        ) {
          continue;
        }

        visited[nextIndex] = 1;
        queue.push(nextIndex);
      }
    }

    if (component.length < MATTE_COMPONENT_MIN_SIZE) continue;

    for (const pixelIndexToClear of component) {
      data[pixelIndexToClear * 4 + 3] = 0;
      removedPixels += 1;
    }
  }

  return removedPixels;
}

function removeNearBlackFringeAdjacentToTransparent(png) {
  const { width, height, data } = png;
  let removedPixels = 0;
  let changed = true;

  while (changed) {
    changed = false;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const pixelIndex = y * width + x;
        const dataIndex = pixelIndex * 4;
        const r = data[dataIndex];
        const g = data[dataIndex + 1];
        const b = data[dataIndex + 2];
        const a = data[dataIndex + 3];

        if (a === 0 || !isNearBlackFringe(r, g, b, a)) continue;
        if (!touchesTransparent(data, width, height, x, y)) continue;

        data[dataIndex + 3] = 0;
        removedPixels += 1;
        changed = true;
      }
    }
  }

  return removedPixels;
}

function removeDarkSilhouetteEdge(png) {
  const { width, height, data } = png;
  let removedPixels = 0;
  let changed = true;

  while (changed) {
    changed = false;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const pixelIndex = y * width + x;
        const dataIndex = pixelIndex * 4;
        const r = data[dataIndex];
        const g = data[dataIndex + 1];
        const b = data[dataIndex + 2];
        const a = data[dataIndex + 3];

        if (a === 0 || !isDarkSilhouetteEdge(r, g, b, a)) continue;
        if (!touchesTransparent(data, width, height, x, y)) continue;

        data[dataIndex + 3] = 0;
        removedPixels += 1;
        changed = true;
      }
    }
  }

  return removedPixels;
}

function removeImageBoundaryFrame(png) {
  const { width, height, data } = png;
  let removedPixels = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const onBoundary = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      if (!onBoundary) continue;

      const dataIndex = (y * width + x) * 4;
      if (data[dataIndex + 3] === 0) continue;

      data[dataIndex + 3] = 0;
      removedPixels += 1;
    }
  }

  return removedPixels;
}

for (const target of targets) {
  const png = PNG.sync.read(fs.readFileSync(target.source));
  const matteRemoved = removeLargeBlackMatte(png);
  const fringeRemoved = removeNearBlackFringeAdjacentToTransparent(png);
  const edgeRemoved = removeDarkSilhouetteEdge(png);
  const frameRemoved = removeImageBoundaryFrame(png);
  const output = PNG.sync.write(png);

  for (const outputPath of target.outputs) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output);
  }

  console.log(
    `${path.basename(target.source)}: matte ${matteRemoved}, fringe ${fringeRemoved}, edge ${edgeRemoved}, frame ${frameRemoved}.`
  );
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getCenteredCrop(width: number, height: number): CropRect {
  const size = Math.min(width, height);

  return {
    x: Math.round((width - size) / 2),
    y: Math.round((height - size) / 2),
    width: size,
    height: size
  };
}

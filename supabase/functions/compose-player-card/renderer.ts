export interface RenderedCardImage {
  finalCardUrl: string;
  teaserCardUrl: string;
}

export async function renderPlayerCardImage(): Promise<RenderedCardImage> {
  throw new Error("renderPlayerCardImage is not implemented yet.");
}

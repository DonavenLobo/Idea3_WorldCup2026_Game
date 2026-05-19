export interface LocalImageAsset {
  uri: string;
  width?: number;
  height?: number;
}

export async function uploadCardImage(asset: LocalImageAsset): Promise<string> {
  // TODO: Upload to Supabase Storage once buckets and auth are wired.
  return asset.uri;
}

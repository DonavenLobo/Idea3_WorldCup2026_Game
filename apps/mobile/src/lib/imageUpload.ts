import { supabase } from "./supabase";

export interface LocalImageAsset {
  base64?: string;
  uri: string;
  width?: number;
  height?: number;
}

const CARD_UPLOAD_BUCKET = "card-uploads";
const CARD_GENERATED_BUCKET = "card-generated";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function isAlreadyResolvableUri(value: string) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("file://") ||
    value.startsWith("content://") ||
    value.startsWith("assets-library://")
  );
}

function getImageExtension(uri: string) {
  const withoutQuery = uri.split("?")[0] ?? uri;
  const extension = withoutQuery.split(".").pop()?.toLowerCase();

  if (extension === "png" || extension === "webp" || extension === "jpg") {
    return extension;
  }

  return "jpeg";
}

function getContentType(extension: string) {
  if (extension === "png") {
    return "image/png";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

function base64ToUint8Array(base64: string) {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export async function uploadCardImage(
  asset: LocalImageAsset,
  userId: string
): Promise<string> {
  if (asset.uri.startsWith("http://") || asset.uri.startsWith("https://")) {
    return asset.uri;
  }

  let fileBytes: Uint8Array;

  if (asset.base64) {
    fileBytes = base64ToUint8Array(asset.base64);
  } else {
    const response = await fetch(asset.uri);

    if (!response.ok) {
      throw new Error("Could not read the selected image.");
    }

    fileBytes = new Uint8Array(await response.arrayBuffer());
  }

  if (fileBytes.byteLength === 0) {
    throw new Error("The selected image was empty. Please choose another photo.");
  }

  const extension = getImageExtension(asset.uri);
  const filePath = `${userId}/${Date.now()}.${extension}`;
  const { data, error } = await supabase.storage
    .from(CARD_UPLOAD_BUCKET)
    .upload(filePath, fileBytes, {
      contentType: getContentType(extension),
      upsert: false
    });

  if (error) {
    throw error;
  }

  return data.path;
}

export async function getCardUploadDisplayUrl(
  storedPathOrUrl?: string | null
): Promise<string | undefined> {
  if (!storedPathOrUrl) {
    return undefined;
  }

  if (isAlreadyResolvableUri(storedPathOrUrl)) {
    return storedPathOrUrl;
  }

  const { data, error } = await supabase.storage
    .from(CARD_UPLOAD_BUCKET)
    .createSignedUrl(storedPathOrUrl, SIGNED_URL_TTL_SECONDS);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function getCardGeneratedDisplayUrl(
  storedPathOrUrl?: string | null
): Promise<string | undefined> {
  if (!storedPathOrUrl) {
    return undefined;
  }

  if (isAlreadyResolvableUri(storedPathOrUrl)) {
    return storedPathOrUrl;
  }

  const { data, error } = await supabase.storage
    .from(CARD_GENERATED_BUCKET)
    .createSignedUrl(storedPathOrUrl, SIGNED_URL_TTL_SECONDS);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

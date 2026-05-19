export function getStoreRedirect(userAgent: string): string {
  if (/android/i.test(userAgent)) {
    return process.env.NEXT_PUBLIC_PLAY_STORE_URL ?? "/download";
  }

  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return process.env.NEXT_PUBLIC_APP_STORE_URL ?? "/download";
  }

  return "/download";
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}

/** @deprecated Prefer `getErrorMessage` — alias kept for gradual migration. */
export const messageFromError = getErrorMessage;

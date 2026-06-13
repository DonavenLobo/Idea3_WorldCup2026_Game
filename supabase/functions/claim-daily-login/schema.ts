export interface ClaimDailyLoginRequest {
  /** Today's date key in user's tz, format YYYY-MM-DD. Client computes. */
  today: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseDateKey(label: string, value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} must be a YYYY-MM-DD string.`);
  }

  return value;
}

export function parseClaimDailyLoginRequest(value: unknown): ClaimDailyLoginRequest {
  if (!isRecord(value)) {
    throw new Error("Invalid claim-daily-login request.");
  }

  return {
    today: parseDateKey("today", value.today),
  };
}

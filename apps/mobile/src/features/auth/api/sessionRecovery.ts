import type { User } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";

const MISSING_AUTH_USER_PATTERN = /User from sub claim in JWT does not exist/i;
const MISSING_SESSION_PATTERN = /auth session missing|session.*missing/i;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : "";
  }
  return "";
}

export function isMissingAuthUserError(error: unknown): boolean {
  return MISSING_AUTH_USER_PATTERN.test(getErrorMessage(error));
}

export function isMissingSessionError(error: unknown): boolean {
  return MISSING_SESSION_PATTERN.test(getErrorMessage(error));
}

export async function clearLocalSupabaseSession(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error && !isMissingSessionError(error)) {
      console.warn("Failed to clear local Supabase session", error);
    }
  } catch (error) {
    if (!isMissingSessionError(error)) {
      console.warn("Failed to clear local Supabase session", error);
    }
  }
}

export async function getValidatedSupabaseUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    if (isMissingAuthUserError(error) || isMissingSessionError(error)) {
      await clearLocalSupabaseSession();
      return null;
    }

    throw error;
  }

  return data.user ?? null;
}

export async function signOutSupabaseUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (!error) return;

  if (isMissingAuthUserError(error) || isMissingSessionError(error)) {
    await clearLocalSupabaseSession();
    return;
  }

  throw error;
}

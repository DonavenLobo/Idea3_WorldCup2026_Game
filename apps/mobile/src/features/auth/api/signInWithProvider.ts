import type { AuthProvider } from "@world-cup-game/types";

export async function signInWithProvider(provider: Exclude<AuthProvider, "anonymous" | "email">): Promise<void> {
  // TODO: Wire Supabase OAuth providers after mobile redirect URIs are finalized.
  console.info("signInWithProvider", provider);
}

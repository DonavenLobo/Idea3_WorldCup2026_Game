import { supabase } from "../../../lib/supabase";

/**
 * Permanently deletes the signed-in user's account. The `delete-account` Edge
 * Function removes their storage objects and hard-deletes the auth user, which
 * cascades every user-owned database row. Throws on failure so the caller can
 * surface an error and keep the user signed in.
 */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke("delete-account", {
    body: {}
  });

  if (error) {
    throw error;
  }
}

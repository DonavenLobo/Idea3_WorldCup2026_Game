import { Platform } from "react-native";
import { getValidatedSupabaseUser } from "../../auth/api/sessionRecovery";
import { supabase } from "../../../lib/supabase";

export async function savePushToken(token: string): Promise<void> {
  const platform = Platform.OS === "ios"
    ? "ios"
    : Platform.OS === "android"
      ? "android"
      : null;

  if (!platform) {
    return;
  }

  const user = await getValidatedSupabaseUser();
  if (!user) {
    return;
  }

  const { error } = await supabase.functions.invoke("register-push-token", {
    body: { platform, token }
  });

  if (error) {
    throw error;
  }
}

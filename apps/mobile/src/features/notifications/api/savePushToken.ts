import { Platform } from "react-native";
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

  const { error } = await supabase.functions.invoke("register-push-token", {
    body: { platform, token }
  });

  if (error) {
    throw error;
  }
}

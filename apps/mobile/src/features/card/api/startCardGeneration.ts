import { supabase } from "../../../lib/supabase";

export async function startCardGeneration(cardId: string): Promise<void> {
  const { error } = await supabase.functions.invoke("generate-card-avatar", {
    body: { cardId }
  });

  if (error) {
    console.warn("Failed to start card generation", error);
  }
}

import { BASE_CARD_STATS } from "@world-cup-game/config";
import type { CardStats, PlayerCard } from "@world-cup-game/types";
import { supabase } from "../../../lib/supabase";
import { getCurrentUserCard, mapCardRow } from "./getCard";

export interface CreateCardInput {
  displayName: string;
  selectedNationCode: string;
  avatarSourceUrl?: string | null;
  stats?: CardStats;
}

interface TemplateRow {
  id: string;
}

interface CardMutationRow {
  id: string;
  user_id: string;
  template_id: string;
  display_name: string;
  selected_nation_code: string;
  tier: string;
  overall: number;
  stats: unknown;
  avatar_source_url: string | null;
  avatar_generated_url: string | null;
  final_card_url: string | null;
  share_slug: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const CARD_COLUMNS = `
  id,
  user_id,
  template_id,
  display_name,
  selected_nation_code,
  tier,
  overall,
  stats,
  avatar_source_url,
  avatar_generated_url,
  final_card_url,
  share_slug,
  status,
  created_at,
  updated_at
`;

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("You must be signed in to save a card.");
  }

  return data.user.id;
}

async function getDefaultTemplateId() {
  const { data, error } = await supabase
    .from("card_templates")
    .select("id")
    .eq("template_key", "level-01-base-v1")
    .eq("is_active", true)
    .maybeSingle<TemplateRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("No active base card template is available.");
  }

  return data.id;
}

export async function createCard(
  input: CreateCardInput
): Promise<{ cardId: string; card: PlayerCard }> {
  const userId = await getCurrentUserId();
  const existingCard = await getCurrentUserCard();
  const now = new Date().toISOString();
  const payload = {
    display_name: input.displayName,
    selected_nation_code: input.selectedNationCode,
    stats: input.stats ?? BASE_CARD_STATS,
    avatar_source_url: input.avatarSourceUrl ?? null,
    updated_at: now
  };

  if (existingCard) {
    const { data, error } = await supabase
      .from("cards")
      .update(payload)
      .eq("id", existingCard.id)
      .select(CARD_COLUMNS)
      .single<CardMutationRow>();

    if (error) {
      throw error;
    }

    const card = await mapCardRow(data);
    return { cardId: card.id, card };
  }

  const templateId = await getDefaultTemplateId();
  const { data, error } = await supabase
    .from("cards")
    .insert({
      ...payload,
      user_id: userId,
      template_id: templateId,
      created_at: now
    })
    .select(CARD_COLUMNS)
    .single<CardMutationRow>();

  if (error) {
    throw error;
  }

  const card = await mapCardRow(data);
  return { cardId: card.id, card };
}

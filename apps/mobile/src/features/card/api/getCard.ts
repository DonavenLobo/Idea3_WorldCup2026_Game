import { BASE_CARD_STATS } from "@world-cup-game/config";
import type { CardStats, CardStatus, CardTier, PlayerCard } from "@world-cup-game/types";
import { getCardUploadDisplayUrl } from "../../../lib/imageUpload";
import { supabase } from "../../../lib/supabase";

interface CardRow {
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

function normalizeStats(stats: unknown): CardStats {
  if (!stats || typeof stats !== "object" || Array.isArray(stats)) {
    return BASE_CARD_STATS;
  }

  return {
    ...BASE_CARD_STATS,
    ...(stats as Partial<CardStats>)
  };
}

export async function mapCardRow(row: CardRow): Promise<PlayerCard> {
  return {
    id: row.id,
    userId: row.user_id,
    templateId: row.template_id,
    displayName: row.display_name,
    selectedNationCode: row.selected_nation_code,
    tier: row.tier as CardTier,
    overall: row.overall,
    stats: normalizeStats(row.stats),
    avatarSourceUrl: await getCardUploadDisplayUrl(row.avatar_source_url),
    avatarGeneratedUrl: row.avatar_generated_url ?? undefined,
    finalCardUrl: row.final_card_url ?? undefined,
    shareSlug: row.share_slug ?? "",
    status: row.status as CardStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
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

export async function getCard(cardId: string): Promise<PlayerCard | null> {
  const { data, error } = await supabase
    .from("cards")
    .select(CARD_COLUMNS)
    .eq("id", cardId)
    .maybeSingle<CardRow>();

  if (error) {
    throw error;
  }

  return data ? mapCardRow(data) : null;
}

export async function getCurrentUserCard(): Promise<PlayerCard | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!userData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("cards")
    .select(CARD_COLUMNS)
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<CardRow>();

  if (error) {
    throw error;
  }

  return data ? mapCardRow(data) : null;
}

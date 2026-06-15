import type { CardProgressionLevel, CardUpgradeEvent } from "@world-cup-game/types";
import { supabase } from "../../../lib/supabase";

interface CardUpgradeEventRow {
  id: string;
  user_id: string;
  card_id: string;
  from_level: number;
  to_level: number;
  sequence: number;
  created_at: string;
  animation_seen_at: string | null;
}

function mapUpgradeEvent(row: CardUpgradeEventRow): CardUpgradeEvent {
  return {
    id: row.id,
    userId: row.user_id,
    cardId: row.card_id,
    fromLevel: row.from_level as CardProgressionLevel,
    toLevel: row.to_level as CardProgressionLevel,
    sequence: row.sequence,
    createdAt: row.created_at,
    animationSeenAt: row.animation_seen_at,
  };
}

export async function getPendingCardUpgrades(): Promise<CardUpgradeEvent[]> {
  const { data, error } = await supabase
    .from("card_upgrade_events")
    .select(
      "id, user_id, card_id, from_level, to_level, sequence, created_at, animation_seen_at"
    )
    .is("animation_seen_at", null)
    .order("created_at", { ascending: true })
    .order("sequence", { ascending: true })
    .returns<CardUpgradeEventRow[]>();

  if (error) {
    throw error;
  }

  return data.map(mapUpgradeEvent);
}

export async function markCardUpgradeSeen(eventId: string): Promise<void> {
  const { error } = await supabase
    .from("card_upgrade_events")
    .update({ animation_seen_at: new Date().toISOString() })
    .eq("id", eventId)
    .is("animation_seen_at", null);

  if (error) {
    throw error;
  }
}

export interface CardProgressionResponse {
  newLevel: CardProgressionLevel;
  pendingUpgrades: Array<{
    id: string;
    fromLevel: CardProgressionLevel;
    toLevel: CardProgressionLevel;
    sequence: number;
    createdAt: string;
  }>;
}

export function mapCardProgressionResponse(
  payload: CardProgressionResponse | null | undefined
): CardUpgradeEvent[] {
  if (!payload?.pendingUpgrades?.length) {
    return [];
  }

  return payload.pendingUpgrades.map((upgrade) => ({
    id: upgrade.id,
    userId: "",
    cardId: "",
    fromLevel: upgrade.fromLevel,
    toLevel: upgrade.toLevel,
    sequence: upgrade.sequence,
    createdAt: upgrade.createdAt,
    animationSeenAt: null,
  }));
}

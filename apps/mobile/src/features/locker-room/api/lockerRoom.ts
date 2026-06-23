import type { CosmeticCategory, CosmeticItem, LockerTier } from "@gogaffa/config";
import { supabase } from "../../../lib/supabase";
import type { LockerWallet } from "../types";

interface LockerItemRow {
  item_key: string;
  name: string;
  item_type: string | null;
  rarity: string | null;
  price_credits: number | null;
  metadata: unknown;
  owned: boolean | null;
}

interface WalletRow {
  locker_credits: number | null;
  purchased_credits: number | null;
  balance: number | null;
}

export interface LockerItem extends CosmeticItem {
  owned: boolean;
}

const CATEGORIES = new Set<CosmeticCategory>(["frame", "badge", "background"]);
const TIERS = new Set<LockerTier>(["bronze", "silver", "gold", "platinum", "diamond"]);

const EMPTY_WALLET: LockerWallet = {
  balance: 0,
  lockerCredits: 0,
  purchasedCredits: 0
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCategory(value: unknown, fallback: unknown): CosmeticCategory {
  if (typeof value === "string" && CATEGORIES.has(value as CosmeticCategory)) {
    return value as CosmeticCategory;
  }

  if (typeof fallback === "string" && CATEGORIES.has(fallback as CosmeticCategory)) {
    return fallback as CosmeticCategory;
  }

  return "badge";
}

function parseTier(value: unknown, fallback: LockerTier): LockerTier {
  if (typeof value === "string" && TIERS.has(value as LockerTier)) {
    return value as LockerTier;
  }

  return fallback;
}

function normalizeItemRows(data: unknown): LockerItemRow[] {
  return Array.isArray(data) ? data as LockerItemRow[] : [];
}

function normalizeWalletRows(data: unknown): WalletRow[] {
  return Array.isArray(data) ? data as WalletRow[] : [];
}

function mapItem(row: LockerItemRow): LockerItem {
  const metadata = isRecord(row.metadata) ? row.metadata : {};
  const requiredTier = metadata.requiredTier ? parseTier(metadata.requiredTier, "bronze") : undefined;

  return {
    id: row.item_key,
    name: row.name,
    category: parseCategory(metadata.category, row.item_type),
    emoji: typeof metadata.emoji === "string" ? metadata.emoji : row.item_key.slice(0, 2).toUpperCase(),
    priceCredits: row.price_credits ?? 0,
    requiredTier,
    rarity: parseTier(row.rarity, "bronze"),
    owned: row.owned ?? false
  };
}

function mapWallet(row: WalletRow | undefined): LockerWallet {
  if (!row) return EMPTY_WALLET;

  return {
    lockerCredits: row.locker_credits ?? 0,
    purchasedCredits: row.purchased_credits ?? 0,
    balance: row.balance ?? 0
  };
}

export async function getLockerRoomItems(): Promise<LockerItem[]> {
  const { data, error } = await supabase.rpc("list_locker_room_items");

  if (error) throw error;

  return normalizeItemRows(data).map(mapItem);
}

export async function getLockerWallet(): Promise<LockerWallet> {
  const { data, error } = await supabase.rpc("get_locker_wallet");

  if (error) throw error;

  return mapWallet(normalizeWalletRows(data)[0]);
}

export async function redeemLockerItem(itemKey: string): Promise<void> {
  const { error } = await supabase.rpc("redeem_locker_item", {
    p_item_key: itemKey
  });

  if (error) throw error;
}

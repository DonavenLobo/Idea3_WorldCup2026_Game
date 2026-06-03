import { createContext, useCallback, useContext, useMemo } from "react";
import type { PropsWithChildren } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LOCKER_TIERS } from "@world-cup-game/config";
import type { CosmeticItem, LockerTier } from "@world-cup-game/config";
import { useSession } from "../../hooks/useSession";
import {
  getLockerRoomItems,
  getLockerWallet,
  redeemLockerItem
} from "./api/lockerRoom";
import type { LockerItem } from "./api/lockerRoom";
import type { LockerProgress, LockerWallet } from "./types";

interface LockerRoomContextValue {
  items: LockerItem[];
  ownedIds: Set<string>;
  wallet: LockerWallet;
  balance: number;
  error: Error | null;
  isLoading: boolean;
  progress: LockerProgress;
  isOwned: (itemId: string) => boolean;
  canRedeem: (itemId: string) => boolean;
  redeem: (itemId: string) => Promise<void>;
}

const LOCKER_QUERY_KEY = ["locker-room"] as const;
const EMPTY_WALLET: LockerWallet = {
  balance: 0,
  lockerCredits: 0,
  purchasedCredits: 0
};

const LockerRoomContext = createContext<LockerRoomContextValue | null>(null);

function tierFromOwnedCount(count: number): LockerTier {
  let current: LockerTier = "bronze";
  for (const tier of LOCKER_TIERS) {
    if (count >= tier.minItemsOwned) {
      current = tier.id;
    }
  }
  return current;
}

function buildProgress(ownedCount: number): LockerProgress {
  const currentTier = tierFromOwnedCount(ownedCount);
  const currentIdx = LOCKER_TIERS.findIndex((tier) => tier.id === currentTier);
  const next = currentIdx >= 0 ? LOCKER_TIERS[currentIdx + 1] : undefined;
  const currentTierCfg = LOCKER_TIERS[currentIdx];

  if (!next || !currentTierCfg) {
    return {
      tier: currentTier,
      ownedCount,
      ownedToNextTier: null,
      nextTierLabel: null,
      progressPercent: 1
    };
  }

  const range = next.minItemsOwned - currentTierCfg.minItemsOwned;
  const intoTier = Math.max(0, ownedCount - currentTierCfg.minItemsOwned);

  return {
    tier: currentTier,
    ownedCount,
    ownedToNextTier: Math.max(0, next.minItemsOwned - ownedCount),
    nextTierLabel: next.label,
    progressPercent: Math.min(1, intoTier / range)
  };
}

function tierRank(tier: LockerTier): number {
  return LOCKER_TIERS.findIndex((candidate) => candidate.id === tier);
}

function normalizeError(error: unknown): Error | null {
  if (!error) return null;
  return error instanceof Error ? error : new Error("Failed to load locker room.");
}

function findItem(items: readonly CosmeticItem[], itemId: string): CosmeticItem | undefined {
  return items.find((item) => item.id === itemId);
}

export function LockerRoomProvider({ children }: PropsWithChildren) {
  const { user, isLoading: isSessionLoading } = useSession();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const itemsQuery = useQuery({
    queryKey: [...LOCKER_QUERY_KEY, "items", userId],
    enabled: Boolean(userId) && !isSessionLoading,
    queryFn: getLockerRoomItems
  });

  const walletQuery = useQuery({
    queryKey: [...LOCKER_QUERY_KEY, "wallet", userId],
    enabled: Boolean(userId) && !isSessionLoading,
    queryFn: getLockerWallet
  });

  const invalidateLockerRoom = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: LOCKER_QUERY_KEY });
  }, [queryClient]);

  const redeemMutation = useMutation({
    mutationFn: redeemLockerItem,
    onSuccess: invalidateLockerRoom
  });

  const items = userId ? itemsQuery.data ?? [] : [];
  const wallet = userId ? walletQuery.data ?? EMPTY_WALLET : EMPTY_WALLET;
  const ownedIds = useMemo(
    () => new Set(items.filter((item) => item.owned).map((item) => item.id)),
    [items]
  );
  const progress = useMemo(() => buildProgress(ownedIds.size), [ownedIds]);

  const isOwned = useCallback(
    (itemId: string) => ownedIds.has(itemId),
    [ownedIds]
  );

  const canRedeem = useCallback(
    (itemId: string) => {
      if (ownedIds.has(itemId)) return false;

      const item = findItem(items, itemId);
      if (!item) return false;
      if (item.priceCredits > wallet.balance) return false;

      if (item.requiredTier && tierRank(progress.tier) < tierRank(item.requiredTier)) {
        return false;
      }

      return true;
    },
    [items, ownedIds, progress.tier, wallet.balance]
  );

  const redeem = useCallback(
    async (itemId: string) => {
      if (!userId) throw new Error("You must be signed in to redeem locker items.");
      await redeemMutation.mutateAsync(itemId);
    },
    [redeemMutation, userId]
  );

  const error = normalizeError(itemsQuery.error ?? walletQuery.error);
  const isLoading =
    isSessionLoading ||
    itemsQuery.isLoading ||
    walletQuery.isLoading ||
    redeemMutation.isPending;

  const value = useMemo<LockerRoomContextValue>(
    () => ({
      items,
      ownedIds,
      wallet,
      balance: wallet.balance,
      error,
      isLoading,
      progress,
      isOwned,
      canRedeem,
      redeem
    }),
    [
      items,
      ownedIds,
      wallet,
      error,
      isLoading,
      progress,
      isOwned,
      canRedeem,
      redeem
    ]
  );

  return <LockerRoomContext.Provider value={value}>{children}</LockerRoomContext.Provider>;
}

export function useLockerRoom(): LockerRoomContextValue {
  const ctx = useContext(LockerRoomContext);
  if (!ctx) throw new Error("useLockerRoom must be used within a LockerRoomProvider.");
  return ctx;
}

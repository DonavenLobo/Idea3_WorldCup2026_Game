import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { COSMETIC_ITEMS, LOCKER_TIERS } from "@world-cup-game/config";
import type { CosmeticItem, LockerTier } from "@world-cup-game/config";
import { useTrivia } from "../trivia";
import type { LockerProgress } from "./types";

interface LockerRoomContextValue {
  ownedIds: Set<string>;
  extraCredits: number;
  spentCredits: number;
  earnedCredits: number;
  balance: number;
  progress: LockerProgress;
  isOwned: (itemId: string) => boolean;
  canRedeem: (itemId: string) => boolean;
  redeem: (itemId: string) => { ok: boolean; reason?: string };
  buyCreditPack: (credits: number) => void;
}

const LockerRoomContext = createContext<LockerRoomContextValue | null>(null);

function tierFromOwnedCount(count: number): LockerTier {
  let current: LockerTier = "bronze";
  for (const t of LOCKER_TIERS) {
    if (count >= t.minItemsOwned) {
      current = t.id;
    }
  }
  return current;
}

function buildProgress(ownedCount: number): LockerProgress {
  const currentTier = tierFromOwnedCount(ownedCount);
  const currentIdx = LOCKER_TIERS.findIndex((t) => t.id === currentTier);
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
  const into = Math.max(0, ownedCount - currentTierCfg.minItemsOwned);
  const ownedToNextTier = Math.max(0, next.minItemsOwned - ownedCount);
  const progressPercent = Math.min(1, into / range);

  return {
    tier: currentTier,
    ownedCount,
    ownedToNextTier,
    nextTierLabel: next.label,
    progressPercent
  };
}

function findItem(id: string): CosmeticItem | undefined {
  return COSMETIC_ITEMS.find((i) => i.id === id);
}

export function LockerRoomProvider({ children }: PropsWithChildren) {
  const { totalPoints } = useTrivia();
  const [ownedIds, setOwnedIds] = useState<Set<string>>(() => new Set());
  const [extraCredits, setExtraCredits] = useState(0);
  const [spentCredits, setSpentCredits] = useState(0);

  const earnedCredits = totalPoints + extraCredits;
  const balance = Math.max(0, earnedCredits - spentCredits);

  const progress = useMemo(() => buildProgress(ownedIds.size), [ownedIds]);

  const isOwned = useCallback((itemId: string) => ownedIds.has(itemId), [ownedIds]);

  const canRedeem = useCallback(
    (itemId: string): boolean => {
      if (ownedIds.has(itemId)) return false;
      const item = findItem(itemId);
      if (!item) return false;
      if (item.priceCredits > balance) return false;
      if (item.requiredTier) {
        const requiredIdx = LOCKER_TIERS.findIndex((t) => t.id === item.requiredTier);
        const currentIdx = LOCKER_TIERS.findIndex((t) => t.id === progress.tier);
        if (currentIdx < requiredIdx) return false;
      }
      return true;
    },
    [ownedIds, balance, progress.tier]
  );

  const redeem = useCallback(
    (itemId: string): { ok: boolean; reason?: string } => {
      const item = findItem(itemId);
      if (!item) return { ok: false, reason: "Item not found." };
      if (ownedIds.has(itemId)) return { ok: false, reason: "Already owned." };
      if (item.priceCredits > balance) {
        return { ok: false, reason: "Not enough credits." };
      }
      if (item.requiredTier) {
        const requiredIdx = LOCKER_TIERS.findIndex((t) => t.id === item.requiredTier);
        const currentIdx = LOCKER_TIERS.findIndex((t) => t.id === progress.tier);
        if (currentIdx < requiredIdx) {
          return { ok: false, reason: `Reach ${item.requiredTier} tier first.` };
        }
      }
      setSpentCredits((prev) => prev + item.priceCredits);
      setOwnedIds((prev) => {
        const next = new Set(prev);
        next.add(itemId);
        return next;
      });
      return { ok: true };
    },
    [ownedIds, balance, progress.tier]
  );

  const buyCreditPack = useCallback((credits: number) => {
    setExtraCredits((prev) => prev + credits);
  }, []);

  const value = useMemo<LockerRoomContextValue>(
    () => ({
      ownedIds,
      extraCredits,
      spentCredits,
      earnedCredits,
      balance,
      progress,
      isOwned,
      canRedeem,
      redeem,
      buyCreditPack
    }),
    [
      ownedIds,
      extraCredits,
      spentCredits,
      earnedCredits,
      balance,
      progress,
      isOwned,
      canRedeem,
      redeem,
      buyCreditPack
    ]
  );

  return <LockerRoomContext.Provider value={value}>{children}</LockerRoomContext.Provider>;
}

export function useLockerRoom(): LockerRoomContextValue {
  const ctx = useContext(LockerRoomContext);
  if (!ctx) throw new Error("useLockerRoom must be used within LockerRoomProvider.");
  return ctx;
}

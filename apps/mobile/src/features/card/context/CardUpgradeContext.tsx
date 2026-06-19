import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { CardUpgradeEvent } from "@gogaffa/types";

interface CardUpgradeContextValue {
  isBlocking: boolean;
  queue: CardUpgradeEvent[];
  setQueue: (events: CardUpgradeEvent[]) => void;
  enqueueUpgrades: (events: CardUpgradeEvent[]) => void;
  dequeueUpgrade: () => void;
  clearQueue: () => void;
  setBlocking: (blocking: boolean) => void;
}

const CardUpgradeContext = createContext<CardUpgradeContextValue | null>(null);

export function CardUpgradeProvider({ children }: PropsWithChildren) {
  const [queue, setQueueState] = useState<CardUpgradeEvent[]>([]);
  const [isBlocking, setBlocking] = useState(false);

  const setQueue = useCallback((events: CardUpgradeEvent[]) => {
    setQueueState(events);
  }, []);

  const enqueueUpgrades = useCallback((events: CardUpgradeEvent[]) => {
    if (!events.length) {
      return;
    }

    setQueueState((current) => {
      const seen = new Set(current.map((event) => event.id));
      const merged = [...current];

      for (const event of events) {
        if (!seen.has(event.id)) {
          merged.push(event);
          seen.add(event.id);
        }
      }

      return merged.sort((a, b) => {
        const createdDiff = a.createdAt.localeCompare(b.createdAt);
        return createdDiff !== 0 ? createdDiff : a.sequence - b.sequence;
      });
    });
  }, []);

  const dequeueUpgrade = useCallback(() => {
    setQueueState((current) => current.slice(1));
  }, []);

  const clearQueue = useCallback(() => {
    setQueueState([]);
  }, []);

  const value = useMemo(
    () => ({
      isBlocking,
      queue,
      setQueue,
      enqueueUpgrades,
      dequeueUpgrade,
      clearQueue,
      setBlocking,
    }),
    [clearQueue, dequeueUpgrade, enqueueUpgrades, isBlocking, queue, setBlocking, setQueue]
  );

  return (
    <CardUpgradeContext.Provider value={value}>{children}</CardUpgradeContext.Provider>
  );
}

export function useCardUpgrade() {
  const context = useContext(CardUpgradeContext);

  if (!context) {
    throw new Error("useCardUpgrade must be used within CardUpgradeProvider.");
  }

  return context;
}

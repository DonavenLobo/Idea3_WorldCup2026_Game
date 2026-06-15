import { templateKeyForLevel } from "@world-cup-game/game-engine";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { useSession } from "../../auth/hooks/useSession";
import { markCardUpgradeSeen } from "../api/cardProgression";
import { useCardUpgrade } from "../context/CardUpgradeContext";
import { useCurrentUserCard } from "../hooks/useCurrentUserCard";
import { usePendingCardUpgrades } from "../hooks/usePendingCardUpgrades";
import { CardUpgradeModal } from "./CardUpgradeModal";

function buildTemplateKeysFromQueue(
  queue: Array<{ fromLevel: 2 | 3 | 4; toLevel: 2 | 3 | 4 }>
): string[] {
  if (!queue.length) {
    return [];
  }

  const keys = [templateKeyForLevel(queue[0]!.fromLevel)];
  for (const event of queue) {
    keys.push(templateKeyForLevel(event.toLevel));
  }
  return keys;
}

function InnerCardUpgradeGate() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { card } = useCurrentUserCard();
  const { data: pendingUpgrades } = usePendingCardUpgrades();
  const {
    queue,
    enqueueUpgrades,
    clearQueue,
    setBlocking,
  } = useCardUpgrade();

  useEffect(() => {
    if (pendingUpgrades?.length) {
      enqueueUpgrades(pendingUpgrades);
    }
  }, [enqueueUpgrades, pendingUpgrades]);

  const templateKeys = useMemo(() => buildTemplateKeysFromQueue(queue), [queue]);
  const visible = queue.length > 0 && card !== null;

  useEffect(() => {
    setBlocking(visible);
  }, [setBlocking, visible]);

  const handleContinue = useCallback(async () => {
    if (!queue.length) {
      return;
    }

    const events = [...queue];

    try {
      await Promise.all(events.map((event) => markCardUpgradeSeen(event.id)));
    } catch (error) {
      // Never trap the user behind the modal. If marking fails, the events stay
      // unseen server-side and the pending-upgrades query will re-surface them.
      console.warn("Failed to mark card upgrades as seen", error);
    } finally {
      clearQueue();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["current-card", user?.id] }),
        queryClient.invalidateQueries({ queryKey: ["pending-card-upgrades", user?.id] }),
        queryClient.invalidateQueries({ queryKey: ["card-templates"] }),
      ]);
    }
  }, [clearQueue, queryClient, queue, user?.id]);

  if (!card) {
    return null;
  }

  return (
    <CardUpgradeModal
      card={card}
      onContinue={() => {
        void handleContinue();
      }}
      templateKeys={templateKeys}
      visible={visible}
    />
  );
}

export function CardUpgradeGate() {
  const { session, isLoading } = useSession();

  if (isLoading || !session) {
    return null;
  }

  return <InnerCardUpgradeGate key={session.user.id} />;
}

export function useNotifyCardUpgrades() {
  const { enqueueUpgrades } = useCardUpgrade();
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useCallback(
    async (events: Parameters<typeof enqueueUpgrades>[0]) => {
      if (events.length) {
        enqueueUpgrades(events);
      }

      // Always refresh the backstop query, even when the immediate response had
      // no upgrades. If progression succeeded server-side but the response could
      // not carry the events, this refetch still surfaces them.
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["pending-card-upgrades", user?.id],
        }),
        queryClient.invalidateQueries({ queryKey: ["current-card", user?.id] }),
      ]);
    },
    [enqueueUpgrades, queryClient, user?.id]
  );
}

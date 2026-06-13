import { useEffect, useState } from "react";
import { useSession } from "../../auth/hooks/useSession";
import { useDailyLogin } from "../hooks/useDailyLogin";
import { MilestoneUnlockModal } from "./MilestoneUnlockModal";

interface MilestonePayload {
  atStreak: number;
  bonus: number;
}

function InnerLoginGate() {
  const { lastResult } = useDailyLogin();
  const [activeMilestone, setActiveMilestone] = useState<MilestonePayload | null>(null);
  const [shownAtStreaks, setShownAtStreaks] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    const hit = lastResult?.milestoneHit;
    if (!hit) {
      return;
    }
    if (shownAtStreaks.has(hit.atStreak)) {
      return;
    }
    setActiveMilestone({ atStreak: hit.atStreak, bonus: hit.bonus });
    setShownAtStreaks((prev) => {
      const next = new Set(prev);
      next.add(hit.atStreak);
      return next;
    });
  }, [lastResult, shownAtStreaks]);

  return (
    <MilestoneUnlockModal
      milestone={activeMilestone}
      onDismiss={() => setActiveMilestone(null)}
    />
  );
}

/**
 * Drives the once-per-day login claim and surfaces the milestone unlock modal
 * when the user crosses a streak threshold. Renders nothing visible until a
 * milestone fires.
 *
 * Gated by `useSession` so the claim only fires for authenticated users and
 * unmounts cleanly on sign-out — preventing wasted edge-function calls and
 * keeping the modal from flashing during the auth flow.
 */
export function LoginGate() {
  const { session, isLoading } = useSession();

  if (isLoading || !session) {
    return null;
  }

  // Key by user id so signing into a different account resets the in-session
  // "already shown" set.
  return <InnerLoginGate key={session.user.id} />;
}

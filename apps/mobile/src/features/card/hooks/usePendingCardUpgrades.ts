import { useQuery } from "@tanstack/react-query";
import { useSession } from "../../auth/hooks/useSession";
import { getPendingCardUpgrades } from "../api/cardProgression";

export function usePendingCardUpgrades() {
  const { user, isLoading: isSessionLoading } = useSession();

  return useQuery({
    enabled: !isSessionLoading && Boolean(user),
    queryFn: getPendingCardUpgrades,
    queryKey: ["pending-card-upgrades", user?.id],
  });
}

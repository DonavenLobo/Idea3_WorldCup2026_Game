import { useQuery } from "@tanstack/react-query";
import { useSession } from "../../auth/hooks/useSession";
import { getCurrentUserCard } from "../api/getCard";

export function useCurrentUserCard() {
  const { user, isLoading: isSessionLoading } = useSession();
  const query = useQuery({
    enabled: !isSessionLoading && Boolean(user),
    queryFn: getCurrentUserCard,
    queryKey: ["current-card", user?.id]
  });

  return {
    card: query.data ?? null,
    error: query.error,
    isLoading: isSessionLoading || query.isLoading
  };
}

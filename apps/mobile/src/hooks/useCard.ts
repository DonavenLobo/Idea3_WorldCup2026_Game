import { useQuery } from "@tanstack/react-query";
import { getCurrentUserCard } from "../features/card/api/getCard";
import { useSession } from "./useSession";

export function useCard() {
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

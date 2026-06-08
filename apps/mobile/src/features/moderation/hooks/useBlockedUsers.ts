import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "../../auth/hooks/useSession";
import { listBlockedUserIds } from "../api/moderation";

export function useBlockedUsers() {
  const { user, isLoading: isSessionLoading } = useSession();
  const query = useQuery({
    enabled: !isSessionLoading && Boolean(user),
    queryFn: listBlockedUserIds,
    queryKey: ["blocked-users", user?.id]
  });

  const blockedIds = query.data ?? [];
  const blockedSet = useMemo(() => new Set(blockedIds), [blockedIds]);

  return {
    blockedIds,
    blockedSet,
    isLoading: isSessionLoading || query.isLoading
  };
}

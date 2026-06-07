import { useQuery } from "@tanstack/react-query";
import { useSession } from "../../auth/hooks/useSession";
import { getCurrentProfile } from "../api/profile";

export function useProfile() {
  const { user, isLoading: isSessionLoading } = useSession();
  const query = useQuery({
    enabled: !isSessionLoading && Boolean(user),
    queryFn: getCurrentProfile,
    queryKey: ["profile", user?.id]
  });

  return {
    error: query.error,
    isLoading: isSessionLoading || query.isLoading,
    profile: query.data ?? null
  };
}

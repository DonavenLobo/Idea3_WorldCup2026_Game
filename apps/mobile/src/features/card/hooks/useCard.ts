import { useQuery } from "@tanstack/react-query";
import { getCard } from "../api/getCard";

export function useCard(cardId: string) {
  return useQuery({
    queryKey: ["card", cardId],
    queryFn: () => getCard(cardId)
  });
}

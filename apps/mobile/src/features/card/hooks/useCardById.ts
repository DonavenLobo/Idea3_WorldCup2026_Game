import { useQuery } from "@tanstack/react-query";
import { getCard } from "../api/getCard";

export function useCardById(cardId: string) {
  return useQuery({
    queryKey: ["card", cardId],
    queryFn: () => getCard(cardId)
  });
}

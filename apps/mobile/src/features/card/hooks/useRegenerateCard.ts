import { useMutation } from "@tanstack/react-query";
import { regenerateCard } from "../api/regenerateCard";

export function useRegenerateCard() {
  return useMutation({
    mutationFn: regenerateCard
  });
}

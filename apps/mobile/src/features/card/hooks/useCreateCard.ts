import { useMutation } from "@tanstack/react-query";
import { createCard } from "../api/createCard";

export function useCreateCard() {
  return useMutation({
    mutationFn: createCard
  });
}

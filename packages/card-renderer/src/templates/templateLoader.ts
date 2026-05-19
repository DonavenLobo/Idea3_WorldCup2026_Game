import type { CardTemplateMetadata } from "@world-cup-game/types";
import type { PlayerCardRenderTemplate } from "../types";
import { isCardTemplateMetadata } from "./templateSchema";

export function loadTemplate(input: {
  id: string;
  name: string;
  baseImageUrl?: string;
  metadata: unknown;
}): PlayerCardRenderTemplate {
  if (!isCardTemplateMetadata(input.metadata)) {
    throw new Error(`Invalid card template metadata for ${input.id}`);
  }

  return {
    id: input.id,
    name: input.name,
    baseImageUrl: input.baseImageUrl,
    metadata: input.metadata as CardTemplateMetadata
  };
}

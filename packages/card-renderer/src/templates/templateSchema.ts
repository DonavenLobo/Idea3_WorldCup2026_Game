import type { CardTemplateMetadata } from "@gogaffa/types";

export function isCardTemplateMetadata(value: unknown): value is CardTemplateMetadata {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CardTemplateMetadata>;

  return Boolean(candidate.id && candidate.name && candidate.width && candidate.height && candidate.layers);
}

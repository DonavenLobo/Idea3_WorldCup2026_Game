import type { CardTemplateMetadata } from "@gogaffa/types";
import type { ImageSourcePropType } from "react-native";
import type { PlayerCardRenderTemplate } from "../types";
import { isCardTemplateMetadata } from "./templateSchema";

export function loadTemplate(input: {
  id: string;
  templateKey?: string;
  name: string;
  baseImageSource?: ImageSourcePropType;
  baseImageUrl?: string;
  metadata: unknown;
}): PlayerCardRenderTemplate {
  if (!isCardTemplateMetadata(input.metadata)) {
    throw new Error(`Invalid card template metadata for ${input.id}`);
  }

  return {
    id: input.id,
    templateKey: input.templateKey,
    name: input.name,
    baseImageSource: input.baseImageSource,
    baseImageUrl: input.baseImageUrl,
    metadata: input.metadata as CardTemplateMetadata
  };
}

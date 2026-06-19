import { useQuery } from "@tanstack/react-query";
import { loadTemplate } from "@gogaffa/card-renderer";
import type { PlayerCardRenderTemplate } from "@gogaffa/card-renderer";
import { supabase } from "../../../lib/supabase";
import {
  applyBundledTemplateMetadata,
  FALLBACK_CARD_TEMPLATES,
  getBundledTemplateSource,
} from "../templates/handDrawnCardTemplates";

interface CardTemplateRow {
  id: string;
  template_key: string;
  name: string;
  base_image_url: string | null;
  metadata: unknown;
}

const TEMPLATE_COLUMNS = `
  id,
  template_key,
  name,
  base_image_url,
  metadata
`;

function mapTemplate(row: CardTemplateRow): PlayerCardRenderTemplate {
  return applyBundledTemplateMetadata(
    loadTemplate({
      id: row.id,
      templateKey: row.template_key,
      name: row.name,
      baseImageSource: getBundledTemplateSource(row.template_key),
      baseImageUrl: row.base_image_url ?? undefined,
      metadata: row.metadata
    })
  );
}

async function getActiveCardTemplates(): Promise<PlayerCardRenderTemplate[]> {
  const { data, error } = await supabase
    .from("card_templates")
    .select(TEMPLATE_COLUMNS)
    .eq("is_active", true)
    .order("tier", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<CardTemplateRow[]>();

  if (error) {
    throw error;
  }

  return data.map(mapTemplate);
}

export function useCardTemplates() {
  const query = useQuery({
    queryFn: getActiveCardTemplates,
    queryKey: ["card-templates"]
  });
  const templates = query.data?.length ? query.data : FALLBACK_CARD_TEMPLATES;

  return {
    error: query.error,
    isLoading: query.isLoading && !query.data,
    templates
  };
}

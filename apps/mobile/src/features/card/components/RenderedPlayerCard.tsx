import { View, StyleSheet } from "react-native";
import { PlayerCard, resolveTemplate } from "@world-cup-game/card-renderer";
import type { PlayerCardRenderTemplate } from "@world-cup-game/card-renderer";
import { BASE_CARD_STATS } from "@world-cup-game/config";
import type { CardStats, CardTier, PlayerCard as PlayerCardData } from "@world-cup-game/types";
import type { PhotoSource } from "../../onboarding";
import { useCardTemplates } from "../hooks/useCardTemplates";
import { LEVEL_00_SKETCH_TEMPLATE } from "../templates/level00SketchTemplate";

interface RenderedPlayerCardProps {
  card?: PlayerCardData | null;
  displayName?: string;
  overall?: number;
  photoSource?: PhotoSource | null;
  selectedNationCode?: string;
  stats?: CardStats;
  templateId?: string | null;
  tier?: CardTier;
}

function resolveCardTemplate(templates: PlayerCardRenderTemplate[], templateId: string) {
  try {
    return resolveTemplate(templates, templateId);
  } catch {
    return (
      templates.find((candidate) => candidate.templateKey === LEVEL_00_SKETCH_TEMPLATE.templateKey)
      ?? templates[0]
      ?? LEVEL_00_SKETCH_TEMPLATE
    );
  }
}

export function RenderedPlayerCard({
  card,
  displayName,
  overall,
  photoSource,
  selectedNationCode,
  stats,
  templateId,
  tier
}: RenderedPlayerCardProps) {
  const { templates } = useCardTemplates();
  const selectedTemplateId = templateId ?? card?.templateId ?? LEVEL_00_SKETCH_TEMPLATE.id;
  const template = resolveCardTemplate(templates, selectedTemplateId);
  const avatarUrl = card?.avatarGeneratedUrl ?? card?.avatarSourceUrl ?? photoSource?.uri;

  return (
    <View style={styles.cardWrap}>
      <PlayerCard
        template={template}
        card={{
          avatarGeneratedUrl: undefined,
          avatarSourceUrl: avatarUrl,
          displayName: displayName ?? card?.displayName ?? "Rookie",
          overall: overall ?? card?.overall ?? 50,
          selectedNationCode: selectedNationCode ?? card?.selectedNationCode ?? "USA",
          stats: stats ?? card?.stats ?? BASE_CARD_STATS,
          tier: tier ?? card?.tier ?? "bronze"
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    alignSelf: "center",
    maxWidth: 420,
    width: "100%"
  }
});

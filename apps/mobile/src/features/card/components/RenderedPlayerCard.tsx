import { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { PlayerCard, resolveTemplate } from "@world-cup-game/card-renderer";
import type { PlayerCardRenderTemplate } from "@world-cup-game/card-renderer";
import { BASE_CARD_STATS } from "@world-cup-game/config";
import type {
  CardStats,
  CardStatus,
  CardTier,
  PlayerCard as PlayerCardData
} from "@world-cup-game/types";
import type { PhotoSource } from "../../onboarding";
import { colors } from "../../../theme/colors";
import { startCardGeneration } from "../api/startCardGeneration";
import { useCardTemplates } from "../hooks/useCardTemplates";
import { LEVEL_00_SKETCH_TEMPLATE } from "../templates/level00SketchTemplate";
import { CardStatusBadge } from "./CardStatusBadge";

interface RenderedPlayerCardProps {
  card?: PlayerCardData | null;
  concealUntilGenerated?: boolean;
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
  concealUntilGenerated = false,
  displayName,
  overall,
  photoSource,
  selectedNationCode,
  stats,
  templateId,
  tier
}: RenderedPlayerCardProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const { templates } = useCardTemplates();
  const selectedTemplateId = templateId ?? card?.templateId ?? LEVEL_00_SKETCH_TEMPLATE.id;
  const template = resolveCardTemplate(templates, selectedTemplateId);
  const canRetry = card?.status === "failed" && Boolean(card.id);
  const status = card?.status;
  const shouldConceal =
    concealUntilGenerated ||
    Boolean(
      status
      && status !== "ready"
      && !card?.avatarGeneratedUrl
    );

  const handleRetry = canRetry
    ? async () => {
        setIsRetrying(true);

        try {
          await startCardGeneration(card.id);
        } finally {
          setIsRetrying(false);
        }
      }
    : undefined;

  return (
    <View style={styles.cardWrap}>
      {shouldConceal ? (
        <HiddenCardPlaceholder
          aspectRatio={template.metadata.width / template.metadata.height}
          status={status}
        />
      ) : (
        <PlayerCard
          template={template}
          card={{
            avatarGeneratedUrl: card?.avatarGeneratedUrl,
            avatarSourceUrl: card?.avatarSourceUrl ?? photoSource?.uri,
            displayName: displayName ?? card?.displayName ?? "Rookie",
            overall: overall ?? card?.overall ?? 50,
            selectedNationCode: selectedNationCode ?? card?.selectedNationCode ?? "USA",
            stats: stats ?? card?.stats ?? BASE_CARD_STATS,
            tier: tier ?? card?.tier ?? "bronze"
          }}
        />
      )}
      <CardStatusBadge
        isRetrying={isRetrying}
        onRetry={handleRetry}
        status={status}
      />
    </View>
  );
}

function HiddenCardPlaceholder({
  aspectRatio,
  status
}: {
  aspectRatio: number;
  status?: CardStatus;
}) {
  const title =
    status === "failed"
      ? "Generation needs a retry"
      : status === "moderation_rejected"
        ? "Photo needs another try"
        : status === "generating_avatar"
          ? "Card is generating"
          : "Card reveal after generation";

  return (
    <View style={[styles.hiddenCard, { aspectRatio }]}>
      <View style={styles.blurBandTop} />
      <View style={styles.blurBandMid} />
      <View style={styles.blurBandBottom} />
      <View style={styles.hiddenOverlay}>
        <View style={styles.questionCircle}>
          <Text style={styles.questionMark}>?</Text>
        </View>
        <Text style={styles.hiddenTitle}>{title}</Text>
        <Text style={styles.hiddenBody}>Your final card stays hidden until the AI version is ready.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    alignSelf: "center",
    maxWidth: 420,
    width: "100%"
  },
  blurBandBottom: {
    backgroundColor: "rgba(12, 59, 46, 0.18)",
    borderRadius: 16,
    bottom: "12%",
    height: "18%",
    left: "16%",
    position: "absolute",
    right: "16%"
  },
  blurBandMid: {
    backgroundColor: "rgba(217, 231, 203, 0.72)",
    borderRadius: 24,
    height: "34%",
    left: "18%",
    position: "absolute",
    right: "18%",
    top: "25%"
  },
  blurBandTop: {
    backgroundColor: "rgba(255, 248, 234, 0.64)",
    borderRadius: 18,
    height: "16%",
    left: "14%",
    position: "absolute",
    right: "14%",
    top: "8%"
  },
  hiddenBody: {
    color: "rgba(255, 248, 234, 0.82)",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 8,
    maxWidth: 250,
    textAlign: "center"
  },
  hiddenCard: {
    alignItems: "center",
    backgroundColor: colors.pitch,
    borderColor: "rgba(255, 248, 234, 0.5)",
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    width: "100%"
  },
  hiddenOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(12, 59, 46, 0.42)",
    height: "100%",
    justifyContent: "center",
    padding: 24,
    width: "100%"
  },
  hiddenTitle: {
    color: colors.cream,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 14,
    textAlign: "center"
  },
  questionCircle: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderRadius: 999,
    height: 76,
    justifyContent: "center",
    width: 76
  },
  questionMark: {
    color: colors.pitch,
    fontSize: 48,
    fontWeight: "900",
    lineHeight: 54
  }
});

import { useEffect, useState } from "react";
import { View, StyleSheet, Text, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
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
import { colors, opacity } from "../../../theme/colors";
import { startCardGeneration } from "../api/startCardGeneration";
import { useCardTemplates } from "../hooks/useCardTemplates";
import {
  applyBundledSketchMetadata,
  isLevel00SketchTemplate,
  LEVEL_00_SKETCH_TEMPLATE
} from "../templates/level00SketchTemplate";
import { CardStatOverlays } from "./CardStatOverlays";
import { CardTextOverlays } from "./CardTextOverlays";
import { CardStatusBadge } from "./CardStatusBadge";
import { teamLogoSourceForCode } from "../../../components/team";

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
  style?: StyleProp<ViewStyle>;
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
  tier,
  style,
}: RenderedPlayerCardProps) {
  const { height: windowHeight } = useWindowDimensions();
  const maxCardHeight = windowHeight * 0.55;
  const [isRetrying, setIsRetrying] = useState(false);
  const { templates } = useCardTemplates();
  const selectedTemplateId = templateId ?? card?.templateId ?? LEVEL_00_SKETCH_TEMPLATE.id;
  const template = applyBundledSketchMetadata(
    resolveCardTemplate(templates, selectedTemplateId)
  );
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

  const resolvedStats = stats ?? card?.stats ?? BASE_CARD_STATS;
  const resolvedDisplayName = displayName ?? card?.displayName ?? "Rookie";
  const resolvedOverall = overall ?? card?.overall ?? 50;
  const resolvedNationCode = selectedNationCode ?? card?.selectedNationCode ?? "USA";
  const useSketchTextOverlays = isLevel00SketchTemplate(template);

  return (
    <View style={[styles.cardWrap, { maxHeight: maxCardHeight }, style]}>
      {shouldConceal ? (
        <HiddenCardPlaceholder
          aspectRatio={template.metadata.width / template.metadata.height}
          status={status}
        />
      ) : (
        <View style={styles.cardSurface}>
          <PlayerCard
            renderDisplayName={!useSketchTextOverlays}
            renderOverall={!useSketchTextOverlays}
            renderStatValues={false}
            template={template}
            card={{
              avatarGeneratedUrl: card?.avatarGeneratedUrl,
              avatarSourceUrl: card?.avatarSourceUrl ?? photoSource?.uri,
              badgeImageSource: teamLogoSourceForCode(resolvedNationCode),
              displayName: resolvedDisplayName,
              overall: resolvedOverall,
              selectedNationCode: resolvedNationCode,
              stats: resolvedStats,
              tier: tier ?? card?.tier ?? "bronze"
            }}
          />
          {useSketchTextOverlays ? (
            <CardTextOverlays displayName={resolvedDisplayName} overall={resolvedOverall} />
          ) : null}
          <CardStatOverlays stats={resolvedStats} />
        </View>
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
        <PulsingQuestionCircle />
        <Text style={styles.hiddenTitle}>{title}</Text>
        <Text style={styles.hiddenBody}>Your final card stays hidden until the AI version is ready.</Text>
      </View>
    </View>
  );
}

function PulsingQuestionCircle() {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 900 }),
        withTiming(1, { duration: 900 })
      ),
      -1,
      false
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View style={[styles.questionCircle, animatedStyle]}>
      <Text style={styles.questionMark}>?</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardSurface: {
    position: "relative",
    width: "100%",
  },
  cardWrap: {
    alignSelf: "center",
    maxWidth: 420,
    width: "100%"
  },
  blurBandBottom: {
    backgroundColor: opacity.ink15,
    borderRadius: 16,
    bottom: "12%",
    height: "18%",
    left: "16%",
    position: "absolute",
    right: "16%"
  },
  blurBandMid: {
    backgroundColor: opacity.ink12,
    borderRadius: 24,
    height: "34%",
    left: "18%",
    position: "absolute",
    right: "18%",
    top: "25%"
  },
  blurBandTop: {
    backgroundColor: opacity.cream70,
    borderRadius: 18,
    height: "16%",
    left: "14%",
    position: "absolute",
    right: "14%",
    top: "8%"
  },
  hiddenBody: {
    color: opacity.cream80,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 8,
    maxWidth: 250,
    textAlign: "center"
  },
  hiddenCard: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderColor: opacity.ink30,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    width: "100%"
  },
  hiddenOverlay: {
    alignItems: "center",
    backgroundColor: opacity.ink70,
    height: "100%",
    justifyContent: "center",
    padding: 24,
    width: "100%"
  },
  hiddenTitle: {
    color: colors.cream,
    fontSize: 18,
    fontWeight: "700",
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
    color: colors.ink,
    fontSize: 48,
    fontWeight: "700",
    lineHeight: 54
  }
});

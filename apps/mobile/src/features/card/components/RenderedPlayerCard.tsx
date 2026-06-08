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
  maxHeightRatio?: number;
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
  maxHeightRatio,
  style,
}: RenderedPlayerCardProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [isRetrying, setIsRetrying] = useState(false);
  const { templates } = useCardTemplates();
  const selectedTemplateId = templateId ?? card?.templateId ?? LEVEL_00_SKETCH_TEMPLATE.id;
  const template = applyBundledSketchMetadata(
    resolveCardTemplate(templates, selectedTemplateId)
  );
  const aspectRatio = template.metadata.width / template.metadata.height;
  const maxCardHeight = windowHeight * (maxHeightRatio ?? 0.65);
  const cardSizing = maxHeightRatio
    ? {
      maxHeight: maxCardHeight,
      maxWidth: Math.min(420, maxCardHeight * aspectRatio)
    }
    : { maxHeight: maxCardHeight };
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
    <View style={[styles.cardWrap, cardSizing, style]}>
      {shouldConceal ? (
        <HiddenCardPlaceholder
          displayName={resolvedDisplayName}
          overall={resolvedOverall}
          selectedNationCode={resolvedNationCode}
          status={status}
          stats={resolvedStats}
          template={template}
          tier={tier ?? card?.tier ?? "bronze"}
          useSketchTextOverlays={useSketchTextOverlays}
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
  displayName,
  overall,
  selectedNationCode,
  status,
  stats,
  template,
  tier,
  useSketchTextOverlays
}: {
  displayName: string;
  overall: number;
  selectedNationCode: string;
  status?: CardStatus;
  stats: CardStats;
  template: PlayerCardRenderTemplate;
  tier: CardTier;
  useSketchTextOverlays: boolean;
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
    <View style={styles.hiddenCard}>
      <PlayerCard
        renderDisplayName={!useSketchTextOverlays}
        renderOverall={!useSketchTextOverlays}
        renderStatValues={false}
        template={template}
        card={{
          avatarGeneratedUrl: undefined,
          avatarSourceUrl: undefined,
          badgeImageSource: teamLogoSourceForCode(selectedNationCode),
          displayName,
          overall,
          selectedNationCode,
          stats,
          tier
        }}
      />
      {useSketchTextOverlays ? (
        <CardTextOverlays displayName={displayName} overall={overall} />
      ) : null}
      <CardStatOverlays stats={stats} />
      <View pointerEvents="none" style={styles.hiddenMask}>
        <View style={styles.hiddenTint} />
        <View style={[styles.hiddenBand, styles.hiddenBandTop]} />
        <View style={[styles.hiddenBand, styles.hiddenBandMid]} />
        <View style={[styles.hiddenBand, styles.hiddenBandBottom]} />
        <View style={styles.hiddenOverlay}>
          <PulsingQuestionCircle />
          <Text style={styles.hiddenTitle}>{title}</Text>
          <Text style={styles.hiddenBody}>Your final card stays hidden until the AI version is ready.</Text>
        </View>
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
  hiddenBody: {
    color: opacity.cream80,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 8,
    maxWidth: 250,
    textAlign: "center"
  },
  hiddenBand: {
    backgroundColor: opacity.cream75,
    borderRadius: 999,
    opacity: 0.28,
    position: "absolute",
    transform: [{ rotate: "-10deg" }]
  },
  hiddenBandBottom: {
    bottom: "14%",
    height: "12%",
    left: "-8%",
    right: "-8%"
  },
  hiddenBandMid: {
    height: "18%",
    left: "-16%",
    right: "-16%",
    top: "44%"
  },
  hiddenBandTop: {
    height: "14%",
    left: "-10%",
    right: "-10%",
    top: "18%"
  },
  hiddenCard: {
    overflow: "hidden",
    position: "relative",
    width: "100%"
  },
  hiddenMask: {
    borderRadius: 22,
    bottom: "6%",
    left: "9%",
    overflow: "hidden",
    position: "absolute",
    right: "9%",
    top: "6.5%"
  },
  hiddenOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  hiddenTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: opacity.ink80
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

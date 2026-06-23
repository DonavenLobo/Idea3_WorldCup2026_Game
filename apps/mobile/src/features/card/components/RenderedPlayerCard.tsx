import { useEffect, useState } from "react";
import { View, StyleSheet, Text, useWindowDimensions, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { PlayerCard, resolveTemplate } from "@gogaffa/card-renderer";
import type { PlayerCardRenderTemplate } from "@gogaffa/card-renderer";
import { BASE_CARD_STATS } from "@gogaffa/config";
import type {
  CardStats,
  CardStatus,
  CardTier,
  PlayerCard as PlayerCardData
} from "@gogaffa/types";
import type { PhotoSource } from "../../onboarding";
import { colors, opacity } from "../../../theme/colors";
import { startCardGeneration } from "../api/startCardGeneration";
import { useCardTemplates } from "../hooks/useCardTemplates";
import {
  applyBundledTemplateMetadata,
  getHandDrawnTemplateMetadata,
  LEVEL_02_BASE_TEMPLATE,
  resolveTemplateKey,
  templateForKey,
  usesHandDrawnOverlays,
} from "../templates/handDrawnCardTemplates";
import { CardStatOverlays } from "./CardStatOverlays";
import { CardTextOverlays } from "./CardTextOverlays";
import { CardStatusBadge } from "./CardStatusBadge";
import { teamFlagForCode } from "../../../components/team";

interface RenderedPlayerCardProps {
  card?: PlayerCardData | null;
  concealUntilGenerated?: boolean;
  displayName?: string;
  overall?: number;
  photoSource?: PhotoSource | null;
  selectedNationCode?: string;
  stats?: CardStats;
  templateId?: string | null;
  templateKey?: string | null;
  tier?: CardTier;
  maxHeightRatio?: number;
  style?: StyleProp<ViewStyle>;
  renderOverlays?: boolean;
  hideStatusBadge?: boolean;
  fillParent?: boolean;
  onAvatarReady?: () => void;
  onTemplateReady?: () => void;
}

function resolveCardTemplate(templates: PlayerCardRenderTemplate[], templateId: string) {
  try {
    return resolveTemplate(templates, templateId);
  } catch {
    return (
      templates.find((candidate) => candidate.templateKey === LEVEL_02_BASE_TEMPLATE.templateKey)
      ?? templates[0]
      ?? LEVEL_02_BASE_TEMPLATE
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
  templateKey,
  tier,
  maxHeightRatio,
  style,
  renderOverlays = true,
  hideStatusBadge = false,
  fillParent = false,
  onAvatarReady,
  onTemplateReady,
}: RenderedPlayerCardProps) {
  const { height: windowHeight } = useWindowDimensions();
  const [isRetrying, setIsRetrying] = useState(false);
  const { templates } = useCardTemplates();
  const selectedTemplateId = templateId ?? card?.templateId ?? LEVEL_02_BASE_TEMPLATE.id;
  const resolvedTemplate = templateKey
    ? templateForKey(templateKey) ?? resolveCardTemplate(templates, selectedTemplateId)
    : resolveCardTemplate(templates, selectedTemplateId);
  const template = applyBundledTemplateMetadata(resolvedTemplate);
  const aspectRatio = template.metadata.width / template.metadata.height;
  const maxCardHeight = windowHeight * (maxHeightRatio ?? 0.55);
  const maxCardWidth = Math.min(420, maxCardHeight * aspectRatio);
  const cardSizing = fillParent
    ? {
        alignSelf: "stretch" as const,
        height: "100%" as const,
        width: "100%" as const,
      }
    : {
        alignSelf: "center" as const,
        maxWidth: maxCardWidth,
        width: "100%" as const,
      };
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
  const useSketchTextOverlays = usesHandDrawnOverlays(template);
  const overlayMetadata = getHandDrawnTemplateMetadata(resolveTemplateKey(template));

  return (
    <View style={[styles.cardWrap, fillParent && styles.cardWrapFill, cardSizing, style]}>
      {shouldConceal ? (
        <HiddenCardPlaceholder
          aspectRatio={aspectRatio}
          displayName={resolvedDisplayName}
          overall={resolvedOverall}
          selectedNationCode={resolvedNationCode}
          stats={resolvedStats}
          status={status}
          template={template}
          tier={tier ?? card?.tier ?? "bronze"}
          useSketchTextOverlays={useSketchTextOverlays}
          overlayMetadata={overlayMetadata}
          onAvatarReady={onAvatarReady}
          onTemplateReady={onTemplateReady}
        />
      ) : (
        <View style={[styles.cardSurface, fillParent && styles.cardSurfaceFill]}>
          <View style={[styles.cardCanvas, { aspectRatio }, fillParent && styles.cardCanvasFill]}>
            <PlayerCard
              onAvatarReady={onAvatarReady}
              renderDisplayName={!useSketchTextOverlays}
              onTemplateReady={onTemplateReady}
              renderOverall={!useSketchTextOverlays}
              renderStatValues={false}
              template={template}
              card={{
                avatarGeneratedUrl: card?.avatarGeneratedUrl,
                avatarSourceUrl: card?.avatarSourceUrl ?? photoSource?.uri,
                badgeIcon: teamFlagForCode(resolvedNationCode),
                displayName: resolvedDisplayName,
                overall: resolvedOverall,
                selectedNationCode: resolvedNationCode,
                stats: resolvedStats,
                tier: tier ?? card?.tier ?? "bronze"
              }}
            />
            {renderOverlays && useSketchTextOverlays && overlayMetadata ? (
              <CardTextOverlays
                displayName={resolvedDisplayName}
                metadata={overlayMetadata}
                overall={resolvedOverall}
              />
            ) : null}
            {renderOverlays ? <CardStatOverlays metadata={overlayMetadata} stats={resolvedStats} /> : null}
          </View>
        </View>
      )}
      {hideStatusBadge ? null : (
        <CardStatusBadge
          isRetrying={isRetrying}
          onRetry={handleRetry}
          status={status}
        />
      )}
    </View>
  );
}

function HiddenCardPlaceholder({
  aspectRatio,
  displayName,
  overall,
  selectedNationCode,
  status,
  stats,
  template,
  tier,
  useSketchTextOverlays,
  overlayMetadata,
  onAvatarReady,
  onTemplateReady,
}: {
  aspectRatio: number;
  displayName: string;
  overall: number;
  selectedNationCode: string;
  status?: CardStatus;
  stats: CardStats;
  template: PlayerCardRenderTemplate;
  tier: CardTier;
  useSketchTextOverlays: boolean;
  overlayMetadata?: ReturnType<typeof getHandDrawnTemplateMetadata>;
  onAvatarReady?: () => void;
  onTemplateReady?: () => void;
}) {
  useEffect(() => {
    onAvatarReady?.();
  }, [onAvatarReady]);

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
      <View style={styles.cardCanvas}>
        <PlayerCard
        onAvatarReady={onAvatarReady}
        renderDisplayName={!useSketchTextOverlays}
        onTemplateReady={onTemplateReady}
        renderOverall={!useSketchTextOverlays}
        renderStatValues={false}
        template={template}
        card={{
          avatarGeneratedUrl: undefined,
          avatarSourceUrl: undefined,
          badgeIcon: teamFlagForCode(selectedNationCode),
          displayName,
          overall,
          selectedNationCode,
          stats,
          tier
        }}
        />
      {useSketchTextOverlays && overlayMetadata ? (
        <CardTextOverlays
          displayName={displayName}
          metadata={overlayMetadata}
          overall={overall}
        />
      ) : null}
      <CardStatOverlays metadata={overlayMetadata} stats={stats} />
      </View>
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
  cardSurfaceFill: {
    height: "100%",
    justifyContent: "center",
    width: "100%",
  },
  cardCanvas: {
    position: "relative",
    width: "100%",
  },
  cardCanvasFill: {
    height: "100%",
  },
  cardWrap: {
    alignSelf: "center",
    flexGrow: 0,
    maxWidth: 420,
    width: "100%"
  },
  cardWrapFill: {
    alignSelf: "stretch",
    maxWidth: undefined,
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

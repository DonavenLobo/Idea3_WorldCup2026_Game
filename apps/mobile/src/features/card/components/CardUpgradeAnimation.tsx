import type { PlayerCard } from "@world-cup-game/types";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../../../theme/colors";
import {
  getHandDrawnTemplateMetadata,
  LEVEL_02_BASE_METADATA,
} from "../templates/handDrawnCardTemplates";
import { CardStatOverlays } from "./CardStatOverlays";
import { CardTextOverlays } from "./CardTextOverlays";
import { RenderedPlayerCard } from "./RenderedPlayerCard";

/**
 * Plays ONE tier transition (e.g. level-02 -> level-03). Multi-step upgrades
 * are handled by the parent re-mounting this component with a new key.
 *
 * Choreography (~900ms settle):
 *   flatten squash on the paper stack
 *   fast PNG crossfade (overlays stay static above)
 *   sketch-line wipe top->bottom
 *   masking-tape slap with overshoot
 */

const FLATTEN_MS = 240;
const CROSSFADE_MS = 380;
const WIPE_MS = 520;
const TAPE_MS = 320;
const TAPE_DELAY = 420;
const SETTLE_MS = 900;

const TAPE_TINT = "rgba(214, 199, 168, 0.82)";

export interface CardUpgradeAnimationProps {
  fromTemplateKey: string;
  toTemplateKey: string;
  card: PlayerCard;
  onComplete: () => void;
}

export function CardUpgradeAnimation({
  fromTemplateKey,
  toTemplateKey,
  card,
  onComplete,
}: CardUpgradeAnimationProps) {
  const flatten = useSharedValue(0);
  const crossfade = useSharedValue(0);
  const wipe = useSharedValue(0);
  const tape = useSharedValue(0);

  const overlayMetadata =
    getHandDrawnTemplateMetadata(toTemplateKey)
    ?? getHandDrawnTemplateMetadata(fromTemplateKey)
    ?? LEVEL_02_BASE_METADATA;

  useEffect(() => {
    flatten.value = withSequence(
      withTiming(1, { duration: FLATTEN_MS * 0.4, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: FLATTEN_MS * 0.6, easing: Easing.elastic(1.1) })
    );

    crossfade.value = withDelay(
      FLATTEN_MS * 0.5,
      withTiming(1, { duration: CROSSFADE_MS, easing: Easing.inOut(Easing.ease) })
    );

    wipe.value = withDelay(
      FLATTEN_MS * 0.6,
      withTiming(1, { duration: WIPE_MS, easing: Easing.out(Easing.cubic) })
    );

    tape.value = withDelay(
      TAPE_DELAY,
      withSequence(
        withTiming(1.12, { duration: TAPE_MS * 0.7, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: TAPE_MS * 0.3, easing: Easing.out(Easing.quad) })
      )
    );

    const settle = setTimeout(onComplete, SETTLE_MS);

    return () => {
      clearTimeout(settle);
      cancelAnimation(flatten);
      cancelAnimation(crossfade);
      cancelAnimation(wipe);
      cancelAnimation(tape);
    };
  }, [crossfade, flatten, fromTemplateKey, onComplete, tape, toTemplateKey, wipe]);

  const stackStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: interpolate(flatten.value, [0, 1], [1, 0.94]) },
      { scaleX: interpolate(flatten.value, [0, 1], [1, 1.02]) },
      { translateY: interpolate(flatten.value, [0, 1], [0, 6]) },
    ],
  }));

  const oldTemplateStyle = useAnimatedStyle(() => ({
    opacity: 1 - crossfade.value,
  }));

  const newTemplateStyle = useAnimatedStyle(() => ({
    opacity: crossfade.value,
  }));

  const wipeStyle = useAnimatedStyle(() => ({
    top: `${interpolate(wipe.value, [0, 1], [-4, 104])}%`,
    opacity: interpolate(wipe.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
  }));

  const tapeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tape.value, [0, 0.2, 1], [0, 1, 1]),
    transform: [
      { translateY: interpolate(tape.value, [0, 1], [-22, 0]) },
      { rotate: "-8deg" },
      { scale: interpolate(tape.value, [0, 1, 1.12], [0.9, 1.12, 1], "clamp") },
    ],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.stack, stackStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, oldTemplateStyle]}>
          <RenderedPlayerCard
            card={card}
            fillParent
            hideStatusBadge
            renderOverlays={false}
            templateKey={fromTemplateKey}
          />
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, newTemplateStyle]}>
          <RenderedPlayerCard
            card={card}
            fillParent
            hideStatusBadge
            renderOverlays={false}
            templateKey={toTemplateKey}
          />
        </Animated.View>

        <Animated.View pointerEvents="none" style={[styles.wipeLine, wipeStyle]} />
        <Animated.View pointerEvents="none" style={[styles.tape, tapeStyle]} />
      </Animated.View>

      <View pointerEvents="none" style={styles.overlayLayer}>
        <CardTextOverlays
          displayName={card.displayName}
          metadata={overlayMetadata}
          overall={card.overall}
        />
        <CardStatOverlays stats={card.stats} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  root: {
    aspectRatio: 1024 / 1536,
    width: "100%",
  },
  stack: {
    ...StyleSheet.absoluteFillObject,
  },
  tape: {
    backgroundColor: TAPE_TINT,
    borderRadius: 1,
    height: "6%",
    left: "8%",
    position: "absolute",
    shadowColor: colors.ink,
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    top: "6%",
    width: "22%",
  },
  wipeLine: {
    backgroundColor: colors.ink,
    height: 3,
    left: "-2%",
    position: "absolute",
    right: "-2%",
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
});

import type { PlayerCard } from "@gogaffa/types";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
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
  HAND_DRAWN_CANVAS_HEIGHT,
  HAND_DRAWN_CANVAS_WIDTH,
} from "../templates/handDrawnCardTemplates";
import { RenderedPlayerCard } from "./RenderedPlayerCard";

/**
 * Plays ONE tier transition (e.g. level-02 -> level-03). Multi-step upgrades
 * are handled by the parent re-mounting this component with a new key.
 *
 * Choreography:
 *   hold the current card long enough to register
 *   flatten and fade it away
 *   reveal the upgraded card with a scale settle
 *   sketch-line wipe and masking-tape slap
 */

const FLATTEN_MS = 240;
const CROSSFADE_MS = 380;
const WIPE_MS = 520;
const TAPE_MS = 320;
const TAPE_DELAY = 720;
const START_DELAY_MS = 500;
const SETTLE_MS = 2100;

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
  const hasAvatar = Boolean(card.avatarGeneratedUrl ?? card.avatarSourceUrl);
  const [hasLayout, setHasLayout] = useState(false);
  const [oldTemplateReady, setOldTemplateReady] = useState(false);
  const [newTemplateReady, setNewTemplateReady] = useState(false);
  const [oldAvatarReady, setOldAvatarReady] = useState(!hasAvatar);
  const [newAvatarReady, setNewAvatarReady] = useState(!hasAvatar);
  const flatten = useSharedValue(0);
  const crossfade = useSharedValue(0);
  const wipe = useSharedValue(0);
  const tape = useSharedValue(0);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    if (height > 0 && width > 0) {
      setHasLayout(true);
    }
  }, []);
  const handleOldAvatarReady = useCallback(() => setOldAvatarReady(true), []);
  const handleNewAvatarReady = useCallback(() => setNewAvatarReady(true), []);
  const handleOldTemplateReady = useCallback(() => setOldTemplateReady(true), []);
  const handleNewTemplateReady = useCallback(() => setNewTemplateReady(true), []);

  useEffect(() => {
    flatten.value = 0;
    crossfade.value = 0;
    wipe.value = 0;
    tape.value = 0;

    if (
      !hasLayout
      || !oldTemplateReady
      || !newTemplateReady
      || !oldAvatarReady
      || !newAvatarReady
    ) {
      return undefined;
    }

    const start = setTimeout(() => {
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
    }, START_DELAY_MS);

    const settle = setTimeout(onComplete, START_DELAY_MS + SETTLE_MS);

    return () => {
      clearTimeout(start);
      clearTimeout(settle);
      cancelAnimation(flatten);
      cancelAnimation(crossfade);
      cancelAnimation(wipe);
      cancelAnimation(tape);
    };
  }, [
    crossfade,
    flatten,
    fromTemplateKey,
    hasLayout,
    newAvatarReady,
    newTemplateReady,
    oldAvatarReady,
    oldTemplateReady,
    onComplete,
    tape,
    toTemplateKey,
    wipe,
  ]);

  const stackStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: interpolate(flatten.value, [0, 1], [1, 0.94]) },
      { scaleX: interpolate(flatten.value, [0, 1], [1, 1.02]) },
      { translateY: interpolate(flatten.value, [0, 1], [0, 6]) },
    ],
  }));

  const oldTemplateStyle = useAnimatedStyle(() => ({
    opacity: interpolate(crossfade.value, [0, 0.35, 1], [1, 1, 0]),
    transform: [
      { scale: interpolate(crossfade.value, [0, 0.55, 1], [1, 0.94, 0.88]) },
      { rotate: `${interpolate(crossfade.value, [0, 1], [0, -2])}deg` },
    ],
  }));

  const newTemplateStyle = useAnimatedStyle(() => ({
    opacity: interpolate(crossfade.value, [0, 0.3, 1], [0, 0, 1]),
    transform: [
      { scale: interpolate(crossfade.value, [0, 0.3, 0.82, 1], [0.86, 0.86, 1.04, 1]) },
      { rotate: `${interpolate(crossfade.value, [0, 0.3, 1], [2, 2, 0])}deg` },
    ],
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
    <View style={styles.root} onLayout={handleLayout}>
      <Animated.View style={[styles.stack, stackStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, oldTemplateStyle]}>
          <RenderedPlayerCard
            card={card}
            fillParent
            hideStatusBadge
            onAvatarReady={handleOldAvatarReady}
            onTemplateReady={handleOldTemplateReady}
            templateKey={fromTemplateKey}
          />
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, newTemplateStyle]}>
          <RenderedPlayerCard
            card={card}
            fillParent
            hideStatusBadge
            onAvatarReady={handleNewAvatarReady}
            onTemplateReady={handleNewTemplateReady}
            templateKey={toTemplateKey}
          />
        </Animated.View>

        <Animated.View pointerEvents="none" style={[styles.wipeLine, wipeStyle]} />
        <Animated.View pointerEvents="none" style={[styles.tape, tapeStyle]} />
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    aspectRatio: HAND_DRAWN_CANVAS_WIDTH / HAND_DRAWN_CANVAS_HEIGHT,
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

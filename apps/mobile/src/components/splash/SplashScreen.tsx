import type { Href } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, opacity } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { SketchWordmark } from "./SketchWordmark";

const MIN_SPLASH_MS = 2400;
const HOLD_AFTER_ANIM_MS = 450;
const FADE_OUT_MS = 380;

export interface SplashScreenProps {
  sessionReady: boolean;
  destination: Href;
  onNavigate: (route: Href) => void;
}

export function SplashScreen({ sessionReady, destination, onNavigate }: SplashScreenProps) {
  const [animationDone, setAnimationDone] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const fadeOut = useRef(new Animated.Value(1)).current;
  const hasNavigated = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  const exitSplash = useCallback(() => {
    if (hasNavigated.current) {
      return;
    }
    hasNavigated.current = true;

    Animated.timing(fadeOut, {
      toValue: 0,
      duration: FADE_OUT_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onNavigate(destination);
    });
  }, [destination, fadeOut, onNavigate]);

  useEffect(() => {
    if (!animationDone || !sessionReady || !minTimeElapsed) {
      return undefined;
    }

    const timer = setTimeout(exitSplash, HOLD_AFTER_ANIM_MS);
    return () => clearTimeout(timer);
  }, [animationDone, exitSplash, minTimeElapsed, sessionReady]);

  const handleSkip = () => {
    if (!sessionReady) {
      return;
    }
    exitSplash();
  };

  const handleAnimationComplete = useCallback(() => {
    setAnimationDone(true);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable
        accessibilityHint="Skip splash screen once loading finishes"
        accessibilityRole="button"
        disabled={!sessionReady}
        onPress={handleSkip}
        style={styles.root}
      >
        <Animated.View style={[styles.content, { opacity: fadeOut }]}>
          <SketchWordmark onComplete={handleAnimationComplete} />
          {!sessionReady ? (
            <View style={styles.waitingRow}>
              <View style={styles.waitingDot} />
              <View style={[styles.waitingDot, styles.waitingDotMid]} />
              <View style={[styles.waitingDot, styles.waitingDotLate]} />
            </View>
          ) : null}
        </Animated.View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 340,
    width: "100%",
  },
  root: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  safe: {
    backgroundColor: colors.cream,
    flex: 1,
  },
  waitingDot: {
    backgroundColor: opacity.ink15,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  waitingDotLate: {
    opacity: 0.45,
  },
  waitingDotMid: {
    opacity: 0.7,
  },
  waitingRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: spacing.xl,
  },
});

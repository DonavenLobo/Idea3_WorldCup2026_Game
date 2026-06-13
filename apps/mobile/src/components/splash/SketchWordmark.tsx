import { useEffect, useRef, useState } from "react";
import { Animated, Easing, LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { colors, opacity } from "../../theme/colors";
import { typography } from "../../theme/typography";

const WORDMARK = "GoGaffa";
const TAGLINE = "Your football summer starts here.";
const LETTER_MS = 72;
const UNDERLINE_MS = 520;
const TAGLINE_MS = 420;

interface SketchWordmarkProps {
  onComplete?: () => void;
}

export function SketchWordmark({ onComplete }: SketchWordmarkProps) {
  const [visibleChars, setVisibleChars] = useState(0);
  const [underlineWidth, setUnderlineWidth] = useState(0);
  const underlineProgress = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(8)).current;
  const completedRef = useRef(false);

  const handleMeasure = (event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth > 0) {
      setUnderlineWidth(nextWidth);
    }
  };

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    WORDMARK.split("").forEach((_, index) => {
      timers.push(
        setTimeout(() => {
          setVisibleChars(index + 1);
        }, (index + 1) * LETTER_MS)
      );
    });

    const typingDoneAt = WORDMARK.length * LETTER_MS + 120;
    timers.push(
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(underlineProgress, {
            toValue: 1,
            duration: UNDERLINE_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.parallel([
            Animated.timing(taglineOpacity, {
              toValue: 1,
              duration: TAGLINE_MS,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(taglineY, {
              toValue: 0,
              duration: TAGLINE_MS,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ]).start(({ finished }) => {
          if (finished && !completedRef.current) {
            completedRef.current = true;
            onComplete?.();
          }
        });
      }, typingDoneAt)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [onComplete, taglineOpacity, taglineY, underlineProgress]);

  const underlineAnimatedWidth = underlineProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, underlineWidth],
  });

  return (
    <View style={styles.root}>
      <View style={styles.wordmarkBlock}>
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          onLayout={handleMeasure}
          style={styles.measure}
        >
          {WORDMARK}
        </Text>
        <Text style={styles.wordmark}>{WORDMARK.slice(0, visibleChars)}</Text>
        {underlineWidth > 0 ? (
          <Animated.View style={[styles.underline, { width: underlineAnimatedWidth }]} />
        ) : null}
      </View>

      <Animated.Text
        style={[
          styles.tagline,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineY }],
          },
        ]}
      >
        {TAGLINE}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  measure: {
    ...typography.display,
    fontSize: 46,
    lineHeight: 50,
    opacity: 0,
    position: "absolute",
  },
  root: {
    alignItems: "center",
    width: "100%",
  },
  tagline: {
    color: opacity.ink70,
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 22,
    maxWidth: 280,
    textAlign: "center",
  },
  underline: {
    backgroundColor: colors.red,
    borderRadius: 2,
    height: 3,
    marginTop: 6,
  },
  wordmark: {
    color: colors.ink,
    fontFamily: typography.display.fontFamily,
    fontSize: 46,
    lineHeight: 50,
    textAlign: "center",
  },
  wordmarkBlock: {
    alignItems: "center",
  },
});

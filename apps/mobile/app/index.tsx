import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { Animated, Easing, Pressable, StyleSheet } from "react-native";
import { APP_ROUTES } from "@world-cup-game/config";
import { colors } from "../src/theme/colors";

const SPLASH_MS = 2400;

export default function IndexRoute() {
  const router = useRouter();
  const scale = useRef(new Animated.Value(0.5)).current;
  const numberOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(numberOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.spring(scale, {
        toValue: 1.05,
        friction: 4,
        tension: 80,
        useNativeDriver: true
      })
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.0,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(scale, {
            toValue: 1.05,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          })
        ])
      ).start();
    });

    Animated.timing(taglineOpacity, {
      toValue: 1,
      duration: 500,
      delay: 700,
      useNativeDriver: true
    }).start();

    const timer = setTimeout(() => {
      router.replace(APP_ROUTES.onboarding.selectNation);
    }, SPLASH_MS);

    return () => clearTimeout(timer);
  }, [numberOpacity, router, scale, taglineOpacity]);

  return (
    <Pressable
      style={styles.root}
      onPress={() => router.replace(APP_ROUTES.onboarding.selectNation)}
    >
      <Animated.Text
        style={[styles.number, { opacity: numberOpacity, transform: [{ scale }] }]}
      >
        26
      </Animated.Text>
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        TOURNAMENT FAN GAME
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  number: {
    color: colors.gold,
    fontSize: 180,
    fontWeight: "900",
    letterSpacing: -8
  },
  root: {
    alignItems: "center",
    backgroundColor: colors.pitch,
    flex: 1,
    justifyContent: "center"
  },
  tagline: {
    color: colors.cream,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 4,
    marginTop: 24
  }
});

import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { colors, opacity } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

interface CelebrationOverlayProps {
  points: number;
}

export function CelebrationOverlay({ points }: CelebrationOverlayProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const pointsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(pointsOpacity, {
        toValue: 1,
        duration: 200,
        delay: 200,
        useNativeDriver: true
      }),
      Animated.timing(lift, {
        toValue: -60,
        duration: 1200,
        delay: 200,
        useNativeDriver: true
      })
    ]).start();

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        delay: 1300,
        useNativeDriver: true
      }),
      Animated.timing(pointsOpacity, {
        toValue: 0,
        duration: 400,
        delay: 1300,
        useNativeDriver: true
      })
    ]).start();
  }, [scale, opacity, lift, pointsOpacity]);

  return (
    <View style={styles.root} pointerEvents="none">
      <Animated.View
        style={[
          styles.checkCircle,
          { opacity, transform: [{ scale }] }
        ]}
      >
        <Animated.Text style={styles.check}>✓</Animated.Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.pointsRow,
          { opacity: pointsOpacity, transform: [{ translateY: lift }] }
        ]}
      >
        <Text style={styles.pointsPlus}>+</Text>
        <Text style={styles.pointsValue}>{points}</Text>
        <Text style={styles.pointsUnit}>pts</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  check: {
    color: colors.cream,
    fontSize: 80,
    fontFamily: "Caveat_700Bold",
  },
  checkCircle: {
    alignItems: "center",
    backgroundColor: colors.success,
    borderRadius: 999,
    elevation: 8,
    height: 140,
    justifyContent: "center",
    shadowColor: colors.ink,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    width: 140
  },
  pointsPlus: {
    ...typography.dataValue,
    color: colors.red,
    fontSize: 24,
    lineHeight: 28,
    marginRight: 2,
  },
  pointsRow: {
    alignItems: "baseline",
    flexDirection: "row",
    marginTop: 24,
  },
  pointsUnit: {
    ...typography.caption,
    color: opacity.ink55,
    letterSpacing: 0.8,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  pointsValue: {
    ...typography.dataValue,
    color: colors.red,
    fontSize: 28,
    fontVariant: ["tabular-nums"],
    lineHeight: 32,
  },
  root: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  }
});

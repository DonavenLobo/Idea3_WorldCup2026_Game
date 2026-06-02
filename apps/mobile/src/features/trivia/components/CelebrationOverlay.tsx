import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

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
      <Animated.Text
        style={[
          styles.points,
          { opacity: pointsOpacity, transform: [{ translateY: lift }] }
        ]}
      >
        +{points} PTS
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  check: {
    color: "#FFFFFF",
    fontSize: 80,
    fontWeight: "900"
  },
  checkCircle: {
    alignItems: "center",
    backgroundColor: "#1F9D55",
    borderRadius: 999,
    elevation: 8,
    height: 140,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    width: 140
  },
  points: {
    color: "#D6A11E",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 24,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 6
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

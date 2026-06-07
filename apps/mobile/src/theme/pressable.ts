import type { ViewStyle } from "react-native";

export function pressableFeedback(pressed: boolean): ViewStyle | false {
  return pressed ? { opacity: 0.7, transform: [{ scale: 0.97 }] } : false;
}

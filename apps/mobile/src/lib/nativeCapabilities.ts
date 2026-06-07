import { NativeModules, Platform } from "react-native";

export function isGestureHandlerAvailable(): boolean {
  if (Platform.OS === "web") {
    return false;
  }

  return Boolean(NativeModules.RNGestureHandlerModule);
}

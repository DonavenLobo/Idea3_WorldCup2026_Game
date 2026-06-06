import * as Haptics from "expo-haptics";

let hapticsUnavailable = false;

export function triggerLightImpact() {
  if (hapticsUnavailable) {
    return;
  }

  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
    hapticsUnavailable = true;
  });
}

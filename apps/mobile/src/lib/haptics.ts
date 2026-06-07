import * as Haptics from "expo-haptics";

let hapticsUnavailable = false;

function runHaptic(task: () => Promise<void>) {
  if (hapticsUnavailable) {
    return;
  }

  void task().catch(() => {
    hapticsUnavailable = true;
  });
}

export function triggerLightImpact() {
  runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function triggerSelection() {
  runHaptic(() => Haptics.selectionAsync());
}

export function triggerWarning() {
  runHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  );
}

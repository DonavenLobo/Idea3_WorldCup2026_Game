import type { PlayerCard } from "@world-cup-game/types";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { BrandButton } from "../../../components/brand/BrandButton";
import { Eyebrow } from "../../../components/brand/Eyebrow";
import { colors, opacity } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import { CardUpgradeAnimation } from "./CardUpgradeAnimation";

export interface CardUpgradeModalProps {
  visible: boolean;
  card: PlayerCard;
  templateKeys: string[];
  onContinue: () => void;
}

export function CardUpgradeModal({
  visible,
  card,
  templateKeys,
  onContinue,
}: CardUpgradeModalProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (visible) {
      setStep(0);
    }
  }, [visible, templateKeys.join("|")]);

  const transitions = useMemo(() => {
    const pairs: Array<{ from: string; to: string }> = [];
    for (let index = 0; index < templateKeys.length - 1; index += 1) {
      pairs.push({
        from: templateKeys[index]!,
        to: templateKeys[index + 1]!,
      });
    }
    return pairs;
  }, [templateKeys]);

  const isFinished = step >= transitions.length;
  const current = transitions[step];

  const handleStepComplete = useCallback(() => {
    setStep((previous) => {
      const next = previous + 1;
      if (next >= transitions.length) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      return next;
    });
  }, [transitions.length]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => {
        if (isFinished) {
          onContinue();
        }
      }}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <View style={styles.content}>
          {current ? (
            <CardUpgradeAnimation
              key={`${current.from}->${current.to}`}
              card={card}
              fromTemplateKey={current.from}
              onComplete={handleStepComplete}
              toTemplateKey={current.to}
            />
          ) : null}

          {isFinished ? (
            <Animated.View entering={FadeIn.duration(260)} style={styles.ctaBlock}>
              <Eyebrow accent="purple" label="Card Upgraded" />
              <BrandButton label="Continue" onPress={onContinue} style={styles.cta} />
            </Animated.View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: opacity.ink60,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  content: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderColor: colors.ink,
    borderRadius: 24,
    borderWidth: 2,
    maxWidth: 420,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    width: "100%",
  },
  cta: {
    width: "100%",
  },
  ctaBlock: {
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    width: "100%",
  },
});

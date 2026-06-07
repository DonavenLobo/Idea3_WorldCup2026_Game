import { useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { APP_ROUTES } from "@world-cup-game/config";
import { AuthShell } from "../../src/components/auth";
import { OnboardingButton } from "../../src/components/onboarding";
import { colors, opacity } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

const CODE_LENGTH = 6;
const BOX_WIDTH = 44;

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ method?: string; value?: string }>();
  const method = typeof params.method === "string" ? params.method : "email";
  const value = typeof params.value === "string" ? params.value : "your account";

  const [code, setCode] = useState("");
  const inputRef = useRef<TextInput>(null);
  const isValid = code.length === CODE_LENGTH;

  const handleVerify = () => {
    if (!isValid) return;
    router.replace(APP_ROUTES.tabs.home);
  };

  const focusInput = () => inputRef.current?.focus();

  return (
    <AuthShell
      keyboard
      showBack={false}
      title="Enter your 6-digit code"
      subtitle={`Code sent to ${value}. Verification takes you to your home screen.`}
      footer={
        <OnboardingButton label="Verify" onPress={handleVerify} disabled={!isValid} />
      }
    >
      <Text style={styles.label}>Verification code</Text>
      <Text style={styles.target}>{value}</Text>

      <Pressable onPress={focusInput} style={styles.boxesContainer}>
        <View style={styles.boxes} pointerEvents="none">
          {Array.from({ length: CODE_LENGTH }).map((_, i) => {
            const digit = code[i] ?? "";
            const active = code.length === i;
            return (
              <View key={i} style={[styles.box, active ? styles.boxActive : null]}>
                <Text style={styles.boxText}>{digit}</Text>
              </View>
            );
          })}
        </View>
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={code}
          onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, CODE_LENGTH))}
          keyboardType="number-pad"
          maxLength={CODE_LENGTH}
          autoFocus
          caretHidden
          textContentType="oneTimeCode"
        />
      </Pressable>

      <Text style={styles.hint}>Check spam or junk if it does not arrive right away.</Text>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.altText}>
          Use a different {method === "phone" ? "phone" : "email"}
        </Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  altText: {
    ...typography.caption,
    color: opacity.ink60,
    fontFamily: typography.eyebrow.fontFamily,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  box: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderBottomColor: opacity.ink15,
    borderBottomWidth: 2,
    height: 52,
    justifyContent: "center",
    width: BOX_WIDTH,
  },
  boxActive: {
    borderBottomColor: colors.red,
  },
  boxText: {
    color: colors.ink,
    fontFamily: typography.eyebrow.fontFamily,
    fontSize: 22,
    lineHeight: 26,
  },
  boxes: {
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
  },
  boxesContainer: {
    marginTop: spacing.sm,
    position: "relative",
  },
  hiddenInput: {
    bottom: 0,
    height: "100%",
    left: 0,
    opacity: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: "100%",
  },
  hint: {
    ...typography.caption,
    color: opacity.ink60,
    marginTop: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.ink,
    fontFamily: typography.eyebrow.fontFamily,
  },
  target: {
    ...typography.caption,
    color: opacity.ink60,
    marginTop: 2,
  },
});

import { useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { APP_ROUTES } from "@world-cup-game/config";
import { BackButton } from "../../src/components/common/BackButton";
import { colors } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

const CODE_LENGTH = 6;

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
    <SafeAreaView style={styles.root}>
      <BackButton tint="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.eyebrow}>
            VERIFY {method === "phone" ? "PHONE" : "EMAIL"}
          </Text>
          <Text style={styles.title}>Enter your 6-digit code</Text>
          <Text style={styles.subtitle}>
            Code sent to {value}. Verification takes you to your home screen.
          </Text>
          <Text style={styles.mockHint}>Mock — any 6-digit code verifies.</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Verification code</Text>
            <Text style={styles.target}>{value}</Text>

            <Pressable onPress={focusInput} style={styles.boxesContainer}>
              <View style={styles.boxes} pointerEvents="none">
                {Array.from({ length: CODE_LENGTH }).map((_, i) => {
                  const digit = code[i] ?? "";
                  const active = code.length === i;
                  return (
                    <View
                      key={i}
                      style={[styles.box, active ? styles.boxActive : null]}
                    >
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

            <Text style={styles.hint}>
              Check spam or junk if it does not arrive right away.
            </Text>

            <Pressable
              style={[styles.button, !isValid ? styles.buttonDisabled : null]}
              onPress={handleVerify}
              disabled={!isValid}
            >
              <Text style={styles.buttonText}>Verify</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => router.back()}>
            <Text style={styles.altText}>
              Use a different {method === "phone" ? "phone" : "email"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  altText: {
    color: "rgba(255, 248, 234, 0.75)",
    fontSize: 14,
    fontWeight: "700",
    marginTop: spacing.lg,
    textAlign: "center"
  },
  mockHint: {
    color: colors.gold,
    fontSize: 12,
    fontStyle: "italic",
    marginTop: spacing.xs
  },
  box: {
    alignItems: "center",
    backgroundColor: "#FFF3DD",
    borderColor: "rgba(12, 59, 46, 0.15)",
    borderRadius: radius.md,
    borderWidth: 2,
    flex: 1,
    height: 56,
    justifyContent: "center"
  },
  boxActive: {
    borderColor: colors.gold
  },
  boxText: {
    color: colors.pitch,
    fontSize: 24,
    fontWeight: "900"
  },
  boxes: {
    flexDirection: "row",
    gap: spacing.sm
  },
  boxesContainer: {
    marginTop: spacing.sm,
    position: "relative"
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
    padding: spacing.md
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: colors.pitch,
    fontSize: 16,
    fontWeight: "900"
  },
  card: {
    backgroundColor: colors.cream,
    borderColor: "rgba(12, 59, 46, 0.12)",
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.lg
  },
  content: {
    padding: spacing.lg,
    paddingTop: 64
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  hiddenInput: {
    bottom: 0,
    height: "100%",
    left: 0,
    opacity: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: "100%"
  },
  hint: {
    color: "rgba(12, 59, 46, 0.65)",
    fontSize: 13,
    marginTop: spacing.md
  },
  kav: { flex: 1 },
  label: {
    color: colors.pitch,
    fontSize: 14,
    fontWeight: "800"
  },
  root: {
    backgroundColor: colors.pitch,
    flex: 1
  },
  subtitle: {
    color: "rgba(255, 248, 234, 0.75)",
    marginTop: spacing.xs,
    ...typography.body
  },
  target: {
    color: "rgba(12, 59, 46, 0.65)",
    fontSize: 14,
    marginTop: 2
  },
  title: {
    color: colors.cream,
    marginTop: spacing.xs,
    ...typography.display
  }
});

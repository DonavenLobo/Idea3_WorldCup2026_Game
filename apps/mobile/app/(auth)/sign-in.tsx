import { useState } from "react";
import { useRouter } from "expo-router";
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const trimmed = identifier.trim();

  const looksLikeEmail = EMAIL_REGEX.test(trimmed);
  const looksLikePhone = trimmed.replace(/\D/g, "").length >= 10;
  const isValid = looksLikeEmail || looksLikePhone;

  const handleContinue = () => {
    if (!isValid) return;
    router.push({
      pathname: APP_ROUTES.auth.verify,
      params: {
        method: looksLikeEmail ? "email" : "phone",
        value: trimmed
      }
    });
  };

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
          <Text style={styles.eyebrow}>SIGN IN</Text>
          <Text style={styles.title}>Welcome back.</Text>
          <Text style={styles.subtitle}>
            Enter the email or phone number you used to create your account.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Email or phone</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com or +1 555 123 4567"
              placeholderTextColor="rgba(12, 59, 46, 0.4)"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoFocus
              returnKeyType="go"
              onSubmitEditing={handleContinue}
            />

            <Pressable
              style={[styles.button, !isValid ? styles.buttonDisabled : null]}
              onPress={handleContinue}
              disabled={!isValid}
            >
              <Text style={styles.buttonText}>Send code</Text>
            </Pressable>

            <Text style={styles.hint}>
              We&apos;ll text or email you a 6-digit code. Mock — any code verifies.
            </Text>
          </View>

          <Pressable onPress={() => router.replace(APP_ROUTES.auth.signUp)}>
            <Text style={styles.altText}>Don&apos;t have an account yet? Sign up</Text>
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
  button: {
    alignItems: "center",
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    marginTop: spacing.md,
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
    marginTop: spacing.xl,
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
  hint: {
    color: "rgba(12, 59, 46, 0.55)",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: spacing.md
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(12, 59, 46, 0.15)",
    borderRadius: radius.md,
    borderWidth: 2,
    color: colors.pitch,
    fontSize: 18,
    marginTop: spacing.xs,
    padding: spacing.md
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
  title: {
    color: colors.cream,
    marginTop: spacing.xs,
    ...typography.display
  }
});

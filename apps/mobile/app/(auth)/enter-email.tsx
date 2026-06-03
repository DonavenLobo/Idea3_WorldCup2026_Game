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

export default function EnterEmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const trimmed = email.trim();
  const isValid = EMAIL_REGEX.test(trimmed);

  const handleContinue = () => {
    if (!isValid) return;
    router.push({
      pathname: APP_ROUTES.auth.verify,
      params: { method: "email", value: trimmed }
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <BackButton variant="light" />
          <Text style={styles.eyebrow}>EMAIL SIGN-UP</Text>
          <Text style={styles.title}>What is your email?</Text>
          <Text style={styles.subtitle}>We will send a 6-digit code to verify.</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="rgba(12, 59, 46, 0.4)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    padding: spacing.lg
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase"
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

import { useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { APP_ROUTES } from "@world-cup-game/config";
import { useOnboarding } from "../../src/features/onboarding";
import { BackButton } from "../../src/components/common/BackButton";
import { colors } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

const MAX_NAME_LENGTH = 20;

export default function CreateCardScreen() {
  const router = useRouter();
  const { displayName, setDisplayName } = useOnboarding();
  const [isCooking, setIsCooking] = useState(false);

  const trimmedName = displayName.trim();
  const canCreate = trimmedName.length > 0 && !isCooking;

  const handleCreate = () => {
    if (trimmedName.length === 0) {
      return;
    }
    setIsCooking(true);
    setTimeout(() => {
      setIsCooking(false);
      router.push(APP_ROUTES.onboarding.cardPreview);
    }, 2000);
  };

  if (isCooking) {
    return (
      <SafeAreaView style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.cookingTitle}>Your card is cooking…</Text>
        <Text style={styles.cookingBody}>Building {trimmedName}&apos;s footballer card.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <BackButton variant="dark" />
        <Text style={styles.eyebrow}>Step 3 of 3</Text>
        <Text style={styles.title}>Name Your Card</Text>
        <Text style={styles.subtitle}>This name appears on your footballer card.</Text>

        <TextInput
          style={styles.input}
          placeholder="Display name"
          placeholderTextColor="rgba(12, 59, 46, 0.4)"
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={MAX_NAME_LENGTH}
          autoFocus
          returnKeyType="done"
        />
        <Text style={styles.counter}>
          {trimmedName.length}/{MAX_NAME_LENGTH}
        </Text>

        <Pressable
          style={[styles.button, !canCreate ? styles.buttonDisabled : null]}
          onPress={handleCreate}
          disabled={!canCreate}
        >
          <Text style={styles.buttonText}>Create My Card</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.pitch,
    borderRadius: radius.pill,
    marginTop: spacing.xl,
    padding: spacing.md
  },
  buttonDisabled: {
    opacity: 0.4
  },
  buttonText: {
    color: colors.cream,
    fontSize: 17,
    fontWeight: "900"
  },
  centered: {
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center"
  },
  content: {
    padding: spacing.lg
  },
  cookingBody: {
    color: "rgba(12, 59, 46, 0.65)",
    ...typography.body
  },
  cookingTitle: {
    color: colors.pitch,
    marginTop: spacing.md,
    ...typography.title
  },
  counter: {
    alignSelf: "flex-end",
    color: "rgba(12, 59, 46, 0.5)",
    fontSize: 12,
    marginTop: spacing.xs
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
    fontWeight: "700",
    marginTop: spacing.xl,
    padding: spacing.md
  },
  root: {
    backgroundColor: colors.cream,
    flex: 1
  },
  subtitle: {
    color: "rgba(12, 59, 46, 0.65)",
    marginTop: spacing.xs,
    ...typography.body
  },
  title: {
    color: colors.pitch,
    marginTop: spacing.xs,
    ...typography.display
  }
});

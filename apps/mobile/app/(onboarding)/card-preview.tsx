import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { APP_ROUTES } from "@world-cup-game/config";
import { RenderedPlayerCard } from "../../src/features/card";
import { useOnboarding } from "../../src/features/onboarding";
import { BackButton } from "../../src/components/common/BackButton";
import { colors } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

export default function CardPreviewScreen() {
  const router = useRouter();
  const { nation, displayName, photoSource, reset } = useOnboarding();

  const friendlyName = displayName.trim() || "Your Footballer";

  const handleStartOver = () => {
    Alert.alert(
      "Start over?",
      "This clears your nation, photo, and name. You can rebuild your card from scratch.",
      [
        { text: "Keep this card", style: "cancel" },
        {
          text: "Start over",
          style: "destructive",
          onPress: () => {
            reset();
            router.navigate(APP_ROUTES.onboarding.selectNation);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton variant="dark" />
        <Text style={styles.title}>Meet {friendlyName}</Text>

        <RenderedPlayerCard
          displayName={displayName}
          photoSource={photoSource}
          selectedNationCode={nation?.code}
        />

        <Pressable
          style={styles.button}
          onPress={() => router.push(APP_ROUTES.auth.signUp)}
        >
          <Text style={styles.buttonText}>Create Account to Save</Text>
        </Pressable>

        <Pressable onPress={handleStartOver}>
          <Text style={styles.startOver}>Start over</Text>
        </Pressable>
      </ScrollView>
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
  buttonText: {
    color: colors.cream,
    fontSize: 17,
    fontWeight: "900"
  },
  content: {
    padding: spacing.lg
  },
  root: {
    backgroundColor: colors.cream,
    flex: 1
  },
  startOver: {
    color: "rgba(12, 59, 46, 0.6)",
    fontSize: 15,
    fontWeight: "700",
    marginTop: spacing.lg,
    textAlign: "center"
  },
  title: {
    color: colors.pitch,
    marginBottom: spacing.lg,
    ...typography.display
  }
});

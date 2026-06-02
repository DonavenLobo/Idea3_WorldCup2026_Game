import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { APP_ROUTES, SUPPORTED_NATIONS } from "@world-cup-game/config";
import { NationRow, useOnboarding } from "../../src/features/onboarding";
import { colors } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

export default function SelectNationScreen() {
  const router = useRouter();
  const { nation, setNation } = useOnboarding();
  const [query, setQuery] = useState("");

  const filteredNations = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length === 0) {
      return SUPPORTED_NATIONS;
    }
    return SUPPORTED_NATIONS.filter((item) => item.name.toLowerCase().includes(term));
  }, [query]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Step 1 of 3</Text>
        <Text style={styles.tagline}>Build your personalized football card</Text>
        <Text style={styles.title}>Pick the Tournament Winner</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search nations"
        placeholderTextColor="rgba(12, 59, 46, 0.4)"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
      />

      <FlatList
        data={filteredNations}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.empty}>No nations match that search.</Text>}
        renderItem={({ item }) => (
          <NationRow
            nation={item}
            selected={nation?.code === item.code}
            onPress={() => setNation(item)}
          />
        )}
      />

      <View style={styles.footer}>
        <Pressable onPress={() => router.push(APP_ROUTES.auth.signIn)}>
          <Text style={styles.signInLink}>I already have an account</Text>
        </Pressable>

        <Pressable
          style={[styles.button, !nation ? styles.buttonDisabled : null]}
          onPress={() => router.push(APP_ROUTES.onboarding.photoBooth)}
          disabled={!nation}
        >
          <Text style={styles.buttonText}>Continue</Text>
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
  empty: {
    color: "rgba(12, 59, 46, 0.5)",
    fontSize: 15,
    textAlign: "center"
  },
  footer: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: spacing.sm
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  header: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg
  },
  list: {
    padding: spacing.lg
  },
  root: {
    backgroundColor: colors.cream,
    flex: 1
  },
  search: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(12, 59, 46, 0.15)",
    borderRadius: radius.md,
    borderWidth: 2,
    color: colors.pitch,
    fontSize: 16,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md
  },
  signInLink: {
    color: colors.pitch,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center"
  },
  tagline: {
    color: "rgba(12, 59, 46, 0.75)",
    fontSize: 15,
    fontWeight: "700"
  },
  title: {
    color: colors.pitch,
    ...typography.display
  }
});

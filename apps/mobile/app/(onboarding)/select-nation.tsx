import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import type { ListRenderItem } from "react-native";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import { APP_ROUTES, SUPPORTED_NATIONS } from "@world-cup-game/config";
import type { NationConfig } from "@world-cup-game/config";
import { OnboardingButton, OnboardingInput, OnboardingShell } from "../../src/components/onboarding";
import { NationRow, useOnboarding } from "../../src/features/onboarding";
import { opacity } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

export default function SelectNationScreen() {
  const router = useRouter();
  const { nation, setNation } = useOnboarding();
  const [query, setQuery] = useState("");
  const selectedNationCode = nation?.code;

  const filteredNations = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length === 0) {
      return SUPPORTED_NATIONS;
    }
    return SUPPORTED_NATIONS.filter((item) => item.name.toLowerCase().includes(term));
  }, [query]);

  const keyExtractor = useCallback((item: NationConfig) => item.code, []);

  const renderNation: ListRenderItem<NationConfig> = useCallback(
    ({ item }) => (
      <NationRow
        nation={item}
        selected={selectedNationCode === item.code}
        onPress={setNation}
      />
    ),
    [selectedNationCode, setNation]
  );

  return (
    <OnboardingShell
      step={1}
      title="Pick the tournament winner"
      subtitle="Build your personalised football card"
      footer={
        <>
          <Pressable onPress={() => router.push(APP_ROUTES.auth.signIn)}>
            <Text style={styles.signInLink}>I already have an account</Text>
          </Pressable>
          <OnboardingButton
            label="Continue"
            onPress={() => router.push(APP_ROUTES.onboarding.photoBooth)}
            disabled={!nation}
            style={styles.cta}
          />
        </>
      }
    >
      <OnboardingInput
        style={styles.search}
        placeholder="Search nations"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
      />

      <FlatList
        style={styles.list}
        data={filteredNations}
        extraData={selectedNationCode}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        initialNumToRender={12}
        keyboardShouldPersistTaps="handled"
        maxToRenderPerBatch={8}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        updateCellsBatchingPeriod={32}
        windowSize={5}
        ListEmptyComponent={<Text style={styles.empty}>No nations match that search.</Text>}
        renderItem={renderNation}
      />
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  cta: {
    marginTop: spacing.md,
  },
  empty: {
    ...typography.body,
    color: opacity.ink55,
    textAlign: "center",
  },
  list: {
    flex: 1,
    marginHorizontal: -spacing.lg,
  },
  listContent: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  search: {
    marginBottom: spacing.md,
    textAlign: "left",
  },
  signInLink: {
    ...typography.caption,
    color: opacity.ink60,
    textAlign: "center",
  },
});

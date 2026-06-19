import { PlayerCard } from "@gogaffa/card-renderer";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LEVEL_02_BASE_TEMPLATE } from "../../src/features/card/templates/handDrawnCardTemplates";
import { colors, opacity } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

const TEST_AVATAR_SVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 780">
  <rect width="600" height="780" fill="#e8dcc6"/>
  <circle cx="300" cy="210" r="112" fill="#c9b18a"/>
  <path d="M130 710c28-165 115-248 170-248s142 83 170 248" fill="#b64a37"/>
  <path d="M190 188c30-92 164-118 238-24-4 82-51 128-128 128-68 0-112-33-110-104z" fill="#2d2a24"/>
  <path d="M220 343c20 38 55 58 100 58 43 0 77-20 100-58" fill="none" stroke="#2d2a24" stroke-width="20" stroke-linecap="round"/>
</svg>
`);

const TEST_AVATAR_URI = `data:image/svg+xml;charset=utf-8,${TEST_AVATAR_SVG}`;

export default function VisualCardPreviewScreen() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Visual Card Preview</Text>
      <Text style={styles.subtitle}>Deterministic test render for layout inspection.</Text>

      <View testID="visual-card-preview-card" style={styles.cardFrame}>
        <PlayerCard
          template={LEVEL_02_BASE_TEMPLATE}
          card={{
            avatarGeneratedUrl: undefined,
            avatarSourceUrl: TEST_AVATAR_URI,
            displayName: "Mia Gaffa",
            overall: 72,
            selectedNationCode: "USA",
            stats: {
              hyp: 74,
              frm: 68,
              atk: 81,
              ast: 77,
              wal: 63,
              lck: 89
            },
            tier: "bronze"
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardFrame: {
    alignSelf: "center",
    marginTop: spacing.lg,
    width: 360
  },
  content: {
    alignItems: "stretch",
    padding: spacing.lg
  },
  root: {
    backgroundColor: colors.cream,
    flex: 1
  },
  subtitle: {
    color: opacity.ink70,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center"
  },
  title: {
    ...typography.titleScreen,
    color: colors.ink,
    textAlign: "center",
  },
});

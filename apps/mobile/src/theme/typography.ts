export const fontFamily = {
  caveat: "Caveat_700Bold",
  caveatRegular: "Caveat_400Regular",
  caveatMedium: "Caveat_500Medium",
  caveatSemiBold: "Caveat_600SemiBold",
  caveatBold: "Caveat_700Bold",
  inter: "Inter_400Regular",
  interSemiBold: "Inter_600SemiBold",
  interBold: "Inter_700Bold",
} as const;

/**
 * Caveat: screen titles, static celebratory numbers, decorative labels only.
 * Inter: all live data, body copy, buttons, ranks, scores, countdowns.
 */
export const typography = {
  displayLarge: {
    fontSize: 40,
    fontFamily: fontFamily.caveatBold,
    lineHeight: 44,
  },
  titleScreen: {
    fontSize: 28,
    fontFamily: fontFamily.caveatBold,
    lineHeight: 32,
  },
  /** Live/updating numeric values (countdowns, scores, ranks). */
  dataValue: {
    fontSize: 24,
    fontFamily: fontFamily.interSemiBold,
    lineHeight: 28,
  },
  headingCard: {
    fontSize: 16,
    fontFamily: fontFamily.interSemiBold,
    lineHeight: 22,
  },
  bodyDefault: {
    fontSize: 16,
    fontFamily: fontFamily.inter,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontFamily: fontFamily.inter,
    lineHeight: 20,
  },
  label: {
    fontSize: 15,
    fontFamily: fontFamily.interSemiBold,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontFamily: fontFamily.inter,
    lineHeight: 16,
  },
  /** Legacy aliases — prefer canonical tokens above. */
  display: {
    fontSize: 36,
    fontFamily: fontFamily.caveatBold,
    lineHeight: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: fontFamily.caveatBold,
    lineHeight: 32,
  },
  sectionHeading: {
    fontSize: 16,
    fontFamily: fontFamily.interSemiBold,
    lineHeight: 22,
  },
  body: {
    fontSize: 16,
    fontFamily: fontFamily.inter,
    lineHeight: 24,
  },
  bodyCard: {
    fontSize: 20,
    fontFamily: fontFamily.inter,
    lineHeight: 26,
  },
  button: {
    fontSize: 15,
    fontFamily: fontFamily.interSemiBold,
    lineHeight: 20,
  },
  input: {
    fontSize: 20,
    fontFamily: fontFamily.caveatRegular,
    lineHeight: 24,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: fontFamily.interBold,
    lineHeight: 14,
    letterSpacing: 2.5,
    textTransform: "uppercase" as const,
  },
  footnote: {
    fontSize: 12,
    fontFamily: fontFamily.inter,
    lineHeight: 16,
  },
} as const;

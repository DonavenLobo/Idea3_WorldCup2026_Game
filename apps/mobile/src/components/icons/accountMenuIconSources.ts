import type { ImageSourcePropType } from "react-native";
import { tabBarIconSources } from "./tabBarIconSources";

/** Sketch PNGs — same assets as the tab bar, tintable for menu rows. */
export const accountMenuIconSources = {
  card: tabBarIconSources.card,
  groups: tabBarIconSources.groups,
  home: tabBarIconSources.home,
} as const satisfies Record<string, ImageSourcePropType>;

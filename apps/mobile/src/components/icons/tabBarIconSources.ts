import type { ImageSourcePropType } from "react-native";

/** Rasterized from assets/icons/*.svg — tintable without react-native-svg native module. */
export const tabBarIconSources = {
  bracket: require("../../../assets/icons/png/bracket.png"),
  card: require("../../../assets/icons/png/card.png"),
  groups: require("../../../assets/icons/png/groups.png"),
  home: require("../../../assets/icons/png/home.png"),
  schedule: require("../../../assets/icons/png/schedule.png"),
  trivia: require("../../../assets/icons/png/trivia.png"),
} as const satisfies Record<string, ImageSourcePropType>;

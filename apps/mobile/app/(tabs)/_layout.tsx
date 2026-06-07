import { Tabs } from "expo-router";
import { Image, StyleSheet, Text } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tabBarIconSources } from "../../src/components/icons/tabBarIconSources";
import { useCardRealtime } from "../../src/features/card";
import { ProfileHeaderButton } from "../../src/features/profile/components/ProfileHeaderButton";
import { colors, opacity } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

const TAB_BAR_CONTENT_HEIGHT = 64;
const TAB_BAR_TOP_PADDING = spacing.sm;
const TAB_BAR_ITEM_HEIGHT = TAB_BAR_CONTENT_HEIGHT - TAB_BAR_TOP_PADDING;
const TAB_ICON_SIZE = 26;
const TAB_ICON_LABEL_GAP = 4;

/** Caveat swashes extend past measured glyph bounds — pad the trailing edge generously. */
const CAVEAT_HEADER_PAD_LEFT = spacing.sm;
const CAVEAT_HEADER_PAD_RIGHT = spacing.xl;

function TabHeaderTitle({ children }: { children: string }) {
  return (
    <Text numberOfLines={1} style={headerTitleStyles.title}>
      {children}
    </Text>
  );
}

const headerTitleStyles = StyleSheet.create({
  title: {
    ...typography.titleScreen,
    color: colors.ink,
    lineHeight: 40,
    paddingLeft: CAVEAT_HEADER_PAD_LEFT,
    paddingRight: CAVEAT_HEADER_PAD_RIGHT,
    textAlign: "center",
  },
});

function TabBarImageIcon({
  source,
  focused,
}: {
  source: ImageSourcePropType;
  focused: boolean;
}) {
  return (
    <Image
      resizeMode="contain"
      source={source}
      style={{
        height: TAB_ICON_SIZE,
        tintColor: focused ? colors.red : opacity.ink55,
        width: TAB_ICON_SIZE,
      }}
    />
  );
}

const tabIcon =
  (source: ImageSourcePropType) =>
  ({ focused }: { focused: boolean }) => (
    <TabBarImageIcon focused={focused} source={source} />
  );

export default function TabsLayout() {
  useCardRealtime();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.cream },
        headerTitle: ({ children }) => (
          <TabHeaderTitle>{typeof children === "string" ? children : ""}</TabHeaderTitle>
        ),
        headerTitleAlign: "center",
        headerTitleContainerStyle: {
          alignItems: "center",
          justifyContent: "center",
          maxWidth: "100%",
          overflow: "visible",
          paddingTop: spacing.xs,
        },
        headerTintColor: colors.ink,
        headerLeft: () => <ProfileHeaderButton />,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: opacity.ink55,
        tabBarIconStyle: {
          marginBottom: TAB_ICON_LABEL_GAP,
        },
        tabBarItemStyle: {
          height: TAB_BAR_ITEM_HEIGHT,
          justifyContent: "center",
          paddingVertical: 0,
        },
        tabBarLabelStyle: {
          fontFamily: typography.bodySmall.fontFamily,
          fontSize: 11,
          marginTop: 0,
        },
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopColor: opacity.ink10,
          borderTopWidth: 0.5,
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: TAB_BAR_TOP_PADDING,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: tabIcon(tabBarIconSources.home) }} />
      <Tabs.Screen
        name="bracket"
        options={{ title: "Bracket", tabBarIcon: tabIcon(tabBarIconSources.bracket) }}
      />
      <Tabs.Screen
        name="groups"
        options={{ title: "Groups", tabBarIcon: tabIcon(tabBarIconSources.groups) }}
      />
      <Tabs.Screen
        name="trivia"
        options={{ title: "Trivia", tabBarIcon: tabIcon(tabBarIconSources.trivia) }}
      />
      <Tabs.Screen name="card" options={{ title: "Card", tabBarIcon: tabIcon(tabBarIconSources.card) }} />
      <Tabs.Screen
        name="schedule"
        options={{ title: "Schedule", tabBarIcon: tabIcon(tabBarIconSources.schedule) }}
      />
      <Tabs.Screen name="locker-room" options={{ href: null }} />
    </Tabs>
  );
}

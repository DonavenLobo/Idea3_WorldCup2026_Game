import { Tabs } from "expo-router";
import { Alert, Image, Pressable, StyleSheet, Text } from "react-native";
import { useOnboarding } from "../../src/features/onboarding";
import { colors } from "../../src/theme/colors";

function ProfileButton() {
  const { displayName, photoSource } = useOnboarding();
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <Pressable
      style={profileStyles.root}
      onPress={() => Alert.alert("Profile", "Profile settings coming soon.")}
    >
      {photoSource?.uri ? (
        <Image source={{ uri: photoSource.uri }} style={profileStyles.image} />
      ) : (
        <Text style={profileStyles.initial}>{initial}</Text>
      )}
    </Pressable>
  );
}

const profileStyles = StyleSheet.create({
  image: {
    height: "100%",
    width: "100%"
  },
  initial: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: "900"
  },
  root: {
    alignItems: "center",
    backgroundColor: "rgba(214, 161, 30, 0.18)",
    borderColor: colors.gold,
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    justifyContent: "center",
    marginLeft: 16,
    overflow: "hidden",
    width: 36
  }
});

const tabIcon = (emoji: string) =>
  ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: focused ? 24 : 20 }}>{emoji}</Text>
  );

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.pitch },
        headerTitleStyle: { color: colors.cream, fontWeight: "900" },
        headerTitleAlign: "center",
        headerTintColor: colors.cream,
        headerLeft: () => <ProfileButton />,
        tabBarStyle: {
          backgroundColor: colors.pitch,
          borderTopColor: "rgba(255, 248, 234, 0.1)"
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: "rgba(255, 248, 234, 0.55)",
        tabBarLabelStyle: { fontWeight: "700", fontSize: 11 }
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: tabIcon("🏠") }} />
      <Tabs.Screen name="bracket" options={{ title: "Bracket", tabBarIcon: tabIcon("🏆") }} />
      <Tabs.Screen name="groups" options={{ title: "Groups", tabBarIcon: tabIcon("👥") }} />
      <Tabs.Screen name="trivia" options={{ title: "Trivia", tabBarIcon: tabIcon("❓") }} />
      <Tabs.Screen name="card" options={{ title: "Card", tabBarIcon: tabIcon("⚽") }} />
      <Tabs.Screen name="schedule" options={{ title: "Schedule", tabBarIcon: tabIcon("📅") }} />
      <Tabs.Screen name="locker-room" options={{ href: null }} />
    </Tabs>
  );
}

import { useState } from "react";
import { Tabs } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { ProfileSheet } from "../../src/components/profile/ProfileSheet";
import { useOnboarding } from "../../src/features/onboarding";
import { colors } from "../../src/theme/colors";

interface ProfileButtonProps {
  onPress: () => void;
}

function ProfileButton({ onPress }: ProfileButtonProps) {
  const { displayName, photoSource } = useOnboarding();
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <Pressable style={profileStyles.root} onPress={onPress}>
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
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.pitch },
          headerTitleStyle: { color: colors.cream, fontWeight: "900" },
          headerTitleAlign: "center",
          headerTintColor: colors.cream,
          headerLeft: () => <ProfileButton onPress={() => setProfileOpen(true)} />,
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

      <ProfileSheet visible={profileOpen} onDismiss={() => setProfileOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  }
});

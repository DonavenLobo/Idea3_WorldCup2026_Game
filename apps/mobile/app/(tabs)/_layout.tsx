import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { APP_ROUTES } from "@world-cup-game/config";
import { Tabs, useRouter } from "expo-router";
import { Alert, Image, Pressable, StyleSheet, Text } from "react-native";
import { useCardRealtime } from "../../src/features/card/hooks/useCardRealtime";
import { useOnboarding } from "../../src/features/onboarding";
import { useCard } from "../../src/hooks/useCard";
import { useProfile } from "../../src/hooks/useProfile";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/theme/colors";

function ProfileButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { displayName, photoSource, reset } = useOnboarding();
  const { card } = useCard();
  const { profile } = useProfile();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const savedImageUrl = profile?.avatarUrl ?? card?.avatarSourceUrl;
  const imageUri = savedImageUrl ?? photoSource?.uri;
  const effectiveName = profile?.displayName || card?.displayName || displayName;
  const initial = effectiveName.trim().charAt(0).toUpperCase() || "?";

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      reset();
      queryClient.clear();
      router.replace(APP_ROUTES.onboarding.selectNation);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";
      Alert.alert("Sign-out failed", message);
    } finally {
      setIsSigningOut(false);
    }
  };

  const showAccountMenu = () => {
    Alert.alert("Account", effectiveName || "GoGaffa account", [
      { text: "Cancel", style: "cancel" },
      {
        onPress: () => void handleSignOut(),
        style: "destructive",
        text: isSigningOut ? "Signing out..." : "Sign out"
      }
    ]);
  };

  return (
    <Pressable
      style={profileStyles.root}
      disabled={isSigningOut}
      onPress={showAccountMenu}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={profileStyles.image} />
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
  useCardRealtime();

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

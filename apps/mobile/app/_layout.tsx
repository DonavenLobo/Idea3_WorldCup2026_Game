import {
  Caveat_400Regular,
  Caveat_500Medium,
  Caveat_600SemiBold,
  Caveat_700Bold,
} from "@expo-google-fonts/caveat";
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootProviders } from "../src/components/layout/RootProviders";
import { useAuthRedirectHandler } from "../src/features/auth";
import { BracketProvider } from "../src/features/bracket";
import { CardUpgradeGate } from "../src/features/card/components/CardUpgradeGate";
import { CardUpgradeProvider } from "../src/features/card/context/CardUpgradeContext";
import { GroupsProvider } from "../src/features/groups";
import { LockerRoomProvider } from "../src/features/locker-room";
import { LoginGate } from "../src/features/login";
import { OnboardingProvider } from "../src/features/onboarding";
import { TriviaProvider } from "../src/features/trivia";
import { queryClient } from "../src/lib/queryClient";
import { colors } from "../src/theme/colors";

SplashScreen.preventAutoHideAsync();

function RootStack() {
  useAuthRedirectHandler();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.cream },
      }}
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_500Medium,
    Caveat_600SemiBold,
    Caveat_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={styles.loading} />;
  }

  return (
    <RootProviders>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <OnboardingProvider>
            <CardUpgradeProvider>
              <BracketProvider>
                <GroupsProvider>
                  <LockerRoomProvider>
                    <TriviaProvider>
                      <RootStack />
                      <LoginGate />
                      <CardUpgradeGate />
                    </TriviaProvider>
                  </LockerRoomProvider>
                </GroupsProvider>
              </BracketProvider>
            </CardUpgradeProvider>
          </OnboardingProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </RootProviders>
  );
}

const styles = StyleSheet.create({
  loading: {
    backgroundColor: colors.cream,
    flex: 1,
  },
});

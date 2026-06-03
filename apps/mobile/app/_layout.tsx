import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthRedirectHandler } from "../src/features/auth";
import { BracketProvider } from "../src/features/bracket";
import { GroupsProvider } from "../src/features/groups";
import { LockerRoomProvider } from "../src/features/locker-room";
import { OnboardingProvider } from "../src/features/onboarding";
import { TriviaProvider } from "../src/features/trivia";
import { queryClient } from "../src/lib/queryClient";

function RootStack() {
  useAuthRedirectHandler();

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <OnboardingProvider>
          <BracketProvider>
            <TriviaProvider>
              <GroupsProvider>
                <LockerRoomProvider>
                  <RootStack />
                </LockerRoomProvider>
              </GroupsProvider>
            </TriviaProvider>
          </BracketProvider>
        </OnboardingProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

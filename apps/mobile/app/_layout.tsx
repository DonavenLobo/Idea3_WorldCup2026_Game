import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BracketProvider } from "../src/features/bracket";
import { GroupsProvider } from "../src/features/groups";
import { LockerRoomProvider } from "../src/features/locker-room";
import { OnboardingProvider } from "../src/features/onboarding";
import { TriviaProvider } from "../src/features/trivia";
import { queryClient } from "../src/lib/queryClient";

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <OnboardingProvider>
          <BracketProvider>
            <TriviaProvider>
              <LockerRoomProvider>
                <GroupsProvider>
                  <Stack screenOptions={{ headerShown: false }} />
                </GroupsProvider>
              </LockerRoomProvider>
            </TriviaProvider>
          </BracketProvider>
        </OnboardingProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

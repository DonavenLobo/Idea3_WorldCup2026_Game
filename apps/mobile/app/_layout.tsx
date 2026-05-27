import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BracketProvider } from "../src/features/bracket";
import { OnboardingProvider } from "../src/features/onboarding";
import { queryClient } from "../src/lib/queryClient";

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <OnboardingProvider>
          <BracketProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </BracketProvider>
        </OnboardingProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

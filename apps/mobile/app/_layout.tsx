import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthRedirectHandler } from "../src/features/auth";
import { OnboardingProvider } from "../src/features/onboarding";
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
          <RootStack />
        </OnboardingProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

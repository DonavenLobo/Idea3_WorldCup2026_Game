import { useRouter } from "expo-router";
import { APP_ROUTES } from "@gogaffa/config";
import { SplashScreen } from "../src/components/splash";
import { useSession } from "../src/features/auth";

export default function IndexRoute() {
  const router = useRouter();
  const { isLoading, session } = useSession();

  return (
    <SplashScreen
      sessionReady={!isLoading}
      destination={session ? APP_ROUTES.tabs.home : APP_ROUTES.onboarding.selectNation}
      onNavigate={(route) => router.replace(route)}
    />
  );
}

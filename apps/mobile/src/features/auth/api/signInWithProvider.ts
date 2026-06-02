import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import type { Provider, Session } from "@supabase/supabase-js";
import type { AuthProvider } from "@world-cup-game/types";
import { APP_SCHEME, AUTH_CALLBACK_PATH } from "../../../lib/constants";
import { supabase } from "../../../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

type SupportedOAuthProvider = Extract<AuthProvider, "apple" | "google">;

const SUPABASE_OAUTH_PROVIDERS = {
  apple: "apple",
  google: "google"
} satisfies Record<SupportedOAuthProvider, Provider>;

export function getAuthRedirectUrl() {
  return makeRedirectUri({
    path: AUTH_CALLBACK_PATH,
    scheme: APP_SCHEME
  });
}

export function isSupabaseAuthCallbackUrl(url: string) {
  return (
    url.includes(AUTH_CALLBACK_PATH) &&
    (url.includes("access_token=") ||
      url.includes("code=") ||
      url.includes("error="))
  );
}

export async function createSessionFromOAuthUrl(url: string): Promise<Session | null> {
  const { errorCode, params } = QueryParams.getQueryParams(url);
  const redirectError = params.error_description ?? params.error ?? params.error_code ?? errorCode;

  if (redirectError) {
    throw new Error(redirectError);
  }

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);

    if (error) {
      throw error;
    }

    return data.session;
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;

  if (!accessToken || !refreshToken) {
    return null;
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signInWithProvider(provider: SupportedOAuthProvider): Promise<Session | null> {
  const redirectTo = getAuthRedirectUrl();

  if (process.env.EXPO_PUBLIC_ENVIRONMENT !== "production") {
    console.info("Supabase OAuth redirect URL:", redirectTo);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: SUPABASE_OAUTH_PROVIDERS[provider],
    options: {
      redirectTo,
      skipBrowserRedirect: true
    }
  });

  if (error) {
    throw error;
  }

  if (!data.url) {
    throw new Error("Supabase did not return an OAuth URL.");
  }

  if (process.env.EXPO_PUBLIC_ENVIRONMENT !== "production") {
    const authUrl = new URL(data.url);
    console.info(
      "Supabase OAuth URL redirect_to:",
      authUrl.searchParams.get("redirect_to")
    );
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success") {
    return null;
  }

  const session = await createSessionFromOAuthUrl(result.url);

  if (!session) {
    throw new Error("OAuth redirect did not return a Supabase session.");
  }

  return session;
}

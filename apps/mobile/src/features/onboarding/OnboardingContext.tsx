import { createContext, useContext, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { NationConfig } from "@gogaffa/config";
import type { OnboardingData, PhotoSource } from "./types";

interface OnboardingContextValue extends OnboardingData {
  setNation: (nation: NationConfig) => void;
  setPhotoSource: (photoSource: PhotoSource) => void;
  setDisplayName: (displayName: string) => void;
  reset: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [nation, setNation] = useState<NationConfig | null>(null);
  const [photoSource, setPhotoSource] = useState<PhotoSource | null>(null);
  const [displayName, setDisplayName] = useState("");

  const value = useMemo<OnboardingContextValue>(
    () => ({
      nation,
      photoSource,
      displayName,
      setNation,
      setPhotoSource,
      setDisplayName,
      reset: () => {
        setNation(null);
        setPhotoSource(null);
        setDisplayName("");
      }
    }),
    [nation, photoSource, displayName]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider.");
  }
  return context;
}

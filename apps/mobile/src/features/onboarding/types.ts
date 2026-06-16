import type { NationConfig } from "@gogaffa/config";

export type PhotoSourceType = "selfie" | "upload" | "random";

export interface PhotoSource {
  type: PhotoSourceType;
  base64?: string;
  uri?: string;
}

export interface OnboardingData {
  nation: NationConfig | null;
  photoSource: PhotoSource | null;
  displayName: string;
}

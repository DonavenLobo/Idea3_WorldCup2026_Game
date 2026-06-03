# Store Release Readiness Plan

Last updated: June 1, 2026

This plan prepares the Expo mobile app for Apple App Store and Google Play submission. It is not a claim that the app is ready to submit today. It documents what must be true before the first TestFlight, internal Play test, and public launch.

## Current Direction

Use Expo and EAS for mobile release infrastructure:

- Build installable preview binaries with EAS internal distribution.
- Build production iOS binaries for TestFlight/App Store.
- Build production Android App Bundles (`.aab`) for Google Play.
- Submit binaries with EAS Submit when store records and credentials exist.

Official references:

- Expo EAS Build configuration: https://docs.expo.dev/build/eas-json/
- Expo production app-store builds: https://docs.expo.dev/deploy/build-project/
- Expo EAS Submit: https://docs.expo.dev/submit/introduction/
- Expo iOS submission requirements: https://docs.expo.dev/submit/ios/
- Expo app permissions: https://docs.expo.dev/guides/permissions/
- Expo ImagePicker permissions: https://docs.expo.dev/versions/latest/sdk/imagepicker/
- Apple App Store privacy details: https://developer.apple.com/app-store/app-privacy-details/
- Apple App Store app information reference: https://developer.apple.com/help/app-store-connect/reference/app-information
- Google Play target API requirement: https://developer.android.com/google/play/requirements/target-sdk
- Android App Bundle format: https://developer.android.com/guide/app-bundle
- Google Play Data safety: https://support.google.com/googleplay/android-developer/answer/10787469
- Google Play target audience and app content: https://support.google.com/googleplay/android-developer/answer/9867159

## Current Confirmed Setup

Confirmed setup details:

- App name: `GoGaffa`.
- iOS bundle ID: `com.ivs.gogaffa`.
- Android package: `com.ivs.gogaffa`.
- Apple Team ID: `PT8MR25M5P`.
- App Store Connect App ID: `6775258169`.
- Support email: `denshimdon@gmail.com`.
- Expo account owner: `internationalventurestudio`.
- EAS project: `@internationalventurestudio/gogaffa`.
- EAS project ID: `b9b7a050-9841-4ed5-9154-eafed8a84bab`.
- Supabase project exists: `GoGaffa` / `hnwrhkrzvjesjrtjpjtm` in `us-east-1`.
- Supabase Auth providers configured: Email, Google, Apple.
- AI provider: OpenAI through server-side Supabase Edge Functions only.
- Public website/waitlist: `https://gogaffa.com`.
- Privacy Policy URL: `https://gogaffa.com/privacy`.
- Terms of Service URL: `https://gogaffa.com/terms`.
- Support URL: `https://gogaffa.com/support`.

Do not call OpenAI directly from the mobile client. Store `OPENAI_API_KEY` only in Supabase Edge Function secrets/local function env, call OpenAI from the relevant Edge Function, and return only the app-safe result to the client.

The public website URLs are now available. The app is still not ready for public submission until the app implementation, credentials, privacy answers, screenshots, and review metadata are complete.

- Registering/configuring Apple identifiers and capabilities.
- Creating and refining the App Store Connect record.
- Creating an Expo account and EAS project.
- Configuring EAS credentials and building internal/preview binaries.
- Wiring Supabase auth providers and Edge Function secret boundaries.
- Uploading early TestFlight builds when the app is technically buildable.
- Preparing screenshots, metadata drafts, privacy answers, and review notes.

## Repo Additions

The repo now includes baseline release configuration:

- `apps/mobile/eas.json`: EAS build and submit profiles.
- `apps/mobile/app.json`: iOS bundle identifier, Android package, build numbers, and permission copy.
- `apps/mobile/package.json`: EAS build and submit scripts.
- Root `package.json`: forwarded EAS scripts.
- `.env.example` and `apps/mobile/.env.example`: app-store identifier placeholders.

## Critical Identifiers

Current provisional IDs:

```txt
iOS bundle ID: com.ivs.gogaffa
Android package: com.ivs.gogaffa
URL scheme: gogaffa
Apple Team ID: PT8MR25M5P
App Store Connect App ID: 6775258169
Support email: denshimdon@gmail.com
Expo owner: internationalventurestudio
EAS project: @internationalventurestudio/gogaffa
EAS project ID: b9b7a050-9841-4ed5-9154-eafed8a84bab
Supabase project ref: hnwrhkrzvjesjrtjpjtm
Supabase URL: https://hnwrhkrzvjesjrtjpjtm.supabase.co
Public website: https://gogaffa.com
Privacy Policy URL: https://gogaffa.com/privacy
Terms of Service URL: https://gogaffa.com/terms
Support URL: https://gogaffa.com/support
```

Finalize these before the first store upload. Apple says the Bundle ID cannot be changed after uploading a build to App Store Connect. Google Play also treats the Android package as the app identity.

Recommended final format:

```txt
com.<company-or-organization>.<final-app-name>
```

Avoid FIFA, World Cup official, FUT, or other protected/official-affiliation language in identifiers, store listings, screenshots, and metadata.

## Build Profiles

`apps/mobile/eas.json` defines:

- `development`: internal development client build.
- `preview`: internal production-like build for stakeholder testing.
- `production`: store distribution build.

Development builds include `expo-dev-client`, use the stable native scheme
`gogaffa://auth/callback`, and are the preferred way to test OAuth on physical
devices. Expo Go can use changing `exp://...` callback URLs, so do not treat Expo
Go redirect behavior as the production auth baseline.

Android production builds use `app-bundle`, which produces the `.aab` format Google Play expects for publishing.

## Commands

Run commands from the repo root:

```sh
pnpm install
pnpm typecheck
```

Install or run EAS CLI:

```sh
pnpm dlx eas-cli@latest login
```

Build development and preview binaries:

```sh
pnpm mobile:eas:build:dev:ios
pnpm mobile:eas:build:dev:android
pnpm mobile:eas:build:preview
```

After installing a development build, run the JavaScript bundler for that build:

```sh
pnpm dev:mobile:client
```

Build production binaries:

```sh
pnpm mobile:eas:build:ios
pnpm mobile:eas:build:android
```

Submit production binaries after store records and credentials are configured:

```sh
pnpm mobile:eas:submit:ios
pnpm mobile:eas:submit:android
```

## Engineering Readiness Checklist

Complete before TestFlight or Play internal testing:

- [ ] Finalize app name and public-safe brand language.
- [ ] Finalize iOS bundle ID and Android package before any store upload.
- [ ] Replace placeholder app icon, adaptive icon, splash screen, and notification icon.
- [x] Create production Supabase project: `hnwrhkrzvjesjrtjpjtm`.
- [ ] Add production Supabase environment values to local/deployment secrets.
- [x] Apply initial Supabase schema, storage buckets, RLS policies, and advisor fixes.
- [x] Configure Supabase Auth providers for Email, Google, and Apple.
- [x] Create and link EAS project: `@internationalventurestudio/gogaffa`.
- [x] Confirm public website: `https://gogaffa.com`.
- [x] Confirm Privacy Policy, Terms of Service, and support URLs.
- [ ] Add final mobile OAuth/deep-link redirect URLs to Supabase Auth: `gogaffa://auth/callback`, `gogaffa://**`, `exp://**/--/auth/callback`, `exps://**/--/auth/callback`, and `https://gogaffa.com/**`.
- [ ] Configure OpenAI API usage behind Supabase Edge Functions only.
- [ ] Finish all auth modes. Google/Apple OAuth is wired in the mobile app; email/phone screens remain scaffolded.
- [ ] Persist created card, profile, onboarding completion, and session state.
- [ ] Gate full app access behind completed base card.
- [ ] Wire privacy-safe analytics or defer analytics entirely.
- [ ] Ensure photo upload, AI generation, moderation, and fallback card flows work.
- [ ] Ensure push notification permission is requested contextually, not on first launch.
- [ ] Add account deletion and data deletion request flow.
- [x] Add Terms of Service and Privacy Policy web pages.
- [x] Add support/contact URL.
- [x] Confirm support email: `denshimdon@gmail.com`.
- [ ] Add crash reporting only after privacy disclosure is updated.
- [ ] Replace provisional nation/team data with official sourced data.
- [ ] Run `pnpm typecheck`.
- [ ] Run an EAS preview build on iOS and Android physical devices.

Complete before public launch:

- [ ] Test signup/signin on clean devices.
- [ ] Test camera/photo permissions on iOS and Android.
- [ ] Test limited photo-library access on iOS.
- [ ] Test denied camera/photo permissions.
- [ ] Test app restart after card creation.
- [ ] Test app deletion/reinstall behavior.
- [ ] Test mobile auth, app invite, and download links.
- [ ] Test push notification opt-in, receipt, and opt-out.
- [ ] Test purchase sandbox flows if paid cosmetics/regeneration are included at launch.
- [ ] Confirm purchases never affect Competitive Points.
- [ ] Complete App Store privacy details and Google Play Data safety forms.
- [ ] Complete store screenshots, descriptions, age rating, content rating, and review notes.
- [ ] Confirm no public copy implies official FIFA affiliation.

## Apple App Store Checklist

Account and records:

- [ ] Enroll in Apple Developer Program.
- [x] Create or confirm Apple Team: `PT8MR25M5P`.
- [ ] Register the final Bundle ID in Apple Developer.
- [ ] Create the App Store Connect app record.
- [ ] Set SKU, primary language, app name, subtitle, category, age rating, and privacy policy URL.
- [x] Save App Store Connect App ID into `apps/mobile/eas.json` under `submit.production.ios.ascAppId`: `6775258169`.
- [ ] Configure App Store Connect API key or EAS-managed credentials.

App capabilities:

- [ ] Configure push notifications if used.
- [x] Configure Sign in with Apple for Supabase Auth.
- [ ] Configure in-app purchases if paid credits/cosmetics/regeneration ship on iOS.
- [ ] Configure Associated Domains if universal links ship.

Store content:

- [ ] App name: 2-30 characters.
- [ ] Subtitle: up to 30 characters.
- [ ] Promotional text, description, keywords, support URL, marketing URL.
- [x] Privacy Policy URL: `https://gogaffa.com/privacy`.
- [ ] Screenshots for required iPhone sizes.
- [ ] App Review notes, demo account, and feature explanation.
- [ ] Privacy Nutrition Label with all collected/shared data.
- [ ] Age rating questionnaire.

Likely Apple privacy disclosures for this app, subject to final implementation:

- Contact info: email and/or phone.
- User content: uploaded photos, generated card images, display name.
- Identifiers: user ID, push token, device/install identifiers if analytics are added.
- Usage data: gameplay, app interactions, purchases if analytics are added.
- Purchases: if in-app purchases ship.
- Diagnostics: if crash reporting ships.

## Google Play Checklist

Account and records:

- [ ] Create Google Play Developer account.
- [ ] Create app in Play Console.
- [ ] Confirm final package name before first upload.
- [ ] Enable Play App Signing.
- [ ] Configure app access instructions for reviewers.
- [ ] Configure service account only if using EAS Submit automation.

Technical:

- [ ] Production Android builds must upload an `.aab`.
- [ ] Target Android 15 / API 35 or higher for new apps and updates under current Google Play requirements.
- [ ] Verify Expo SDK target API support before first production build.
- [ ] Configure Firebase or another notification provider if needed.
- [ ] Configure Google Play Billing if Android purchases ship.

Store content:

- [ ] App name, short description, full description.
- [ ] App icon, feature graphic, phone screenshots.
- [x] Privacy Policy URL: `https://gogaffa.com/privacy`.
- [ ] Data safety form.
- [ ] Target audience and app content form.
- [ ] Content rating questionnaire.
- [ ] Ads declaration.
- [ ] Financial features or gambling-related declarations if any prediction language is reviewed as sensitive.
- [ ] Review instructions and demo account.

Likely Google Play Data safety disclosures for this app, subject to final implementation:

- Personal info: name, email, phone if collected.
- Photos and videos: uploaded or generated card photos.
- App activity: trivia attempts, predictions, groups, leaderboard activity.
- App info and performance: crash logs/diagnostics if used.
- Financial info: purchases if paid cosmetics/regeneration ship.
- Device or other IDs: push tokens, analytics IDs if used.

## Product And Policy Risks

Sports prediction apps can be misread as gambling-adjacent. Keep MVP copy and store metadata clear:

- Use "prediction game," "trivia," "bounties," and "fan card."
- Avoid "bet," "wager," "odds," "cash out," "stake," or real-money gambling terms.
- Do not offer paid randomized rewards.
- Do not let purchases affect Competitive Points.
- Keep bounties deterministic after reveal.

Because the product is 13+, make the age posture explicit:

- Do not list the app as "Made for Kids" unless the entire product is designed for children and can meet stricter requirements.
- Decide whether users under 13 are blocked or whether 13+ is enforced through store age rating and onboarding.
- If ads ship, use ad SDKs and settings compatible with the selected target audience.

## What The Founders Need To Do

Decisions to make:

- Final app name and subtitle.
- Legal developer entity: individual or company.
- Final iOS bundle ID and Android package. Current provisional values are `com.ivs.gogaffa` for both iOS and Android.
- Whether first launch includes purchases, ads, both, or neither.
- Whether the launch audience is 13+ only and how that is enforced.
- Which countries/regions to launch in.
- Whether to support universal links at launch.

Accounts to create:

- Apple Developer Program account.
- App Store Connect app record.
- Google Play Developer account.
- Google Play app record.
- Expo account and EAS project: created under `internationalventurestudio`.
- Production Supabase project.
- Anthropic account and API key.
- Separate image generation provider account if generated avatar images require true image generation.
- Support email inbox.

Legal/content assets to prepare:

- Privacy Policy URL: `https://gogaffa.com/privacy`.
- Terms of Service URL: `https://gogaffa.com/terms`.
- Support URL: `https://gogaffa.com/support`.
- Account/data deletion instructions.
- App screenshots and preview media.
- Store descriptions and review notes.
- Trademark-safe brand copy that does not imply official FIFA affiliation.

## Recommended Release Sequence

1. Finalize app identity: name, bundle ID, package, icon direction.
2. Build real onboarding persistence: auth, profile, card save, full-app gate.
3. Build first EAS preview binaries for iOS and Android.
4. Test on physical devices.
5. Create store records and configure credentials.
6. Upload first TestFlight and Play internal testing builds.
7. Complete privacy, data safety, age/content, and review forms.
8. Run closed beta with founders/friends.
9. Fix review blockers and crash issues.
10. Submit for public review only after the card creation/share loop is reliable.

## Not Ready Yet

The current app should not be submitted publicly yet because these are still unresolved:

- Auth verification is mock-only.
- Card creation is in-memory and not persisted.
- AI generation is not wired.
- App access is not gated by a saved card/session.
- Store icons/screenshots and final privacy answers are missing.
- App Store/Google Play records and credentials are not configured.

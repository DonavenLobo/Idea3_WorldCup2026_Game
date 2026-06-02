# Local Dev Setup — Running GoGaffa on Your iPhone

This guide gets a teammate from a fresh clone to the app running on their own
iPhone. Target time: ~20 minutes (most of it waiting on a build).

There are two ways to run the app on a device. Read
[Choose your run path](#choose-your-run-path) before building anything — it
decides whether you need device registration.

## Prerequisites

Before you start, the project owner needs to grant you two access invites:

- **Expo organization** — you must be a member of the `internationalventurestudio`
  Expo org to run EAS builds and register devices. Ask the owner to invite you at
  https://expo.dev (Account → Members).
- **Apple Developer team** (`PT8MR25M5P`) — only required if you'll trigger iOS
  development builds yourself. If the owner builds for you, you just need your
  device registered (see below).

You'll also need:

- macOS (for the iOS dev-build path; the JS bundler itself runs anywhere).
- An iPhone on the **same Wi-Fi network** as your dev machine.
- The `EXPO_PUBLIC_SUPABASE_ANON_KEY` value — ask the owner or copy it from the
  Supabase dashboard (project `hnwrhkrzvjesjrtjpjtm` → Project Settings → API).

## 1. Node (via nvm)

The repo pins Node in [`.nvmrc`](../../.nvmrc) to the version we've verified with
Expo SDK 54 (`20.19.4`). Newer majors like Node 24 cause Metro/Expo issues, which
is why pinning matters.

```sh
# Install nvm once: https://github.com/nvm-sh/nvm#installing-and-updating
nvm install   # reads .nvmrc, installs the pinned version
nvm use       # switches to it (run this in each new shell, from the repo root)
```

If `nvm` isn't found in a new shell, your profile may not source it. Either add
the nvm snippet to `~/.zshrc`, or run `source "$HOME/.nvm/nvm.sh"` first.

> Tip: add an `nvm use` auto-switch to your shell so you never forget — see
> https://github.com/nvm-sh/nvm#zsh

## 2. pnpm

The package manager and version are pinned in the root `package.json`
(`pnpm@9.15.0`). The easiest way to match it is Corepack:

```sh
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

Or install pnpm 9 directly: https://pnpm.io/installation

## 3. Install dependencies

```sh
nvm use            # make sure you're on the pinned Node version
pnpm install       # from the repo root — installs the whole monorepo
```

## 4. Environment files

The mobile app reads `apps/mobile/.env` (gitignored). Create it from the example
and fill in the anon key:

```sh
cp apps/mobile/.env.example apps/mobile/.env
# then edit apps/mobile/.env and set EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Everything else in the example already has working defaults. See
[`.env.example`](../../.env.example) at the repo root for the full list of values
across all runtimes (most are server-side and not needed for local mobile dev).

## Choose your run path

| | **Dev build** (recommended) | **Expo Go** |
|---|---|---|
| Setup effort | Higher (build + device registration) | Lowest (install one app) |
| iOS device registration | **Required** (UDID in Apple account) | Not required |
| Google/Apple OAuth login | ✅ Works (native `gogaffa://` scheme) | ❌ Won't work (uses `exp://`) |
| Push notifications | ✅ Works | ⚠️ Limited on SDK 54 |
| Custom native modules | ✅ All included | Only what Expo Go bundles |
| Good for | Testing the real app, auth, full loop | Quick UI iteration only |

This repo is configured for the **dev-build** path (`expo-dev-client`,
`start:dev-client`, the `development` profile in
[`eas.json`](../../apps/mobile/eas.json), and native-scheme OAuth). Use Expo Go
only when you just want to poke at UI and don't need login.

## Path A: Dev build (recommended)

### A1. Register your iPhone (one-time per device)

EAS internal-distribution iOS builds use **ad-hoc provisioning**, which only
installs on devices whose UDID is registered in the Apple Developer account. To
register yours:

```sh
pnpm dlx eas-cli@latest login          # log in to your Expo account
pnpm dlx eas-cli@latest device:create  # prints a registration URL + QR code
```

Open that URL **on the iPhone**, install the profile it offers, and confirm in
iOS Settings if prompted. This captures the device UDID into the Apple team.

> Apple allows 100 iOS devices per membership year, and removing a device doesn't
> free the slot until the annual renewal. Don't churn devices needlessly.

### A2. Build the dev client

The build must be created/regenerated **after** your device is registered so the
new UDID is baked into the provisioning profile:

```sh
pnpm mobile:eas:build:dev:ios
```

This runs on EAS and finishes with an install link / QR. (Android equivalent:
`pnpm mobile:eas:build:dev:android`.)

> If the owner already built a dev client before your device was registered, they
> need to rebuild so your UDID is included — installing an older build will fail
> with a provisioning error.

### A3. Install and run

1. Open the EAS install link on your iPhone and install the GoGaffa dev client.
2. Start the JS bundler from your machine (same Wi-Fi as the phone):

   ```sh
   nvm use
   pnpm dev:mobile:client   # expo start --dev-client
   ```

3. Open the GoGaffa dev client on the phone — it connects to your bundler. Or
   scan the QR shown in the terminal.

After the first install you only repeat A3 day-to-day. You only rebuild (A2) when
native dependencies or native config change — pure JS/TS changes hot-reload over
the bundler.

## Path B: Expo Go (quick UI only)

No device registration. Login won't work.

1. Install **Expo Go** from the App Store on your iPhone.
2. Start the bundler in Expo Go mode:

   ```sh
   nvm use
   pnpm dev:mobile   # expo start (no --dev-client)
   ```

3. Scan the QR with the iPhone Camera app and open in Expo Go.

## Troubleshooting

- **`nvm: command not found`** — run `source "$HOME/.nvm/nvm.sh"`, then `nvm use`.
  Add nvm to your `~/.zshrc` to make it permanent.
- **Wrong Node version / Metro crashes on start** — you're probably on a system
  Node (e.g. v24). Run `nvm use` from the repo root and restart the bundler.
- **iOS install fails with a provisioning / "device not eligible" error** — your
  UDID isn't in the build's profile. Register the device (A1), then rebuild (A2).
- **Phone can't reach the bundler** — confirm phone and machine share the same
  Wi-Fi and no VPN/firewall is blocking. Try `pnpm dev:mobile:client --tunnel`.
- **OAuth login does nothing / opens the wrong app** — you're on Expo Go. Use the
  dev build (Path A). Also confirm the Supabase redirect URLs in the
  [README](../../README.md#environment) are configured.
- **Missing/blank data after login** — check `EXPO_PUBLIC_SUPABASE_ANON_KEY` is
  set in `apps/mobile/.env`.

## Related docs

- [Store release readiness](../release/store_release_plan.md) — TestFlight, Play,
  submission, and the canonical list of project identifiers.
- [Repo structure](./repo_structure.md) — monorepo layout.
- [README](../../README.md) — env/auth redirect configuration and product rules.

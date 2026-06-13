# GoGaffa

Mobile-first football tournament fan game built around a personalized AI footballer card, daily trivia, groups, and card progression.

## Product Loop

```txt
Create AI footballer card -> join a group -> play daily games -> earn XP/credits -> upgrade card -> share/invite -> repeat
```

## Stack Direction

- Mobile: Expo, React Native, TypeScript
- Backend: Supabase Postgres, Auth, Storage, Edge Functions
- Monorepo: pnpm workspaces and Turborepo
- Public site/legal pages: hosted externally at `https://gogaffa.com`

## Workspace

```txt
apps/mobile
packages/config
packages/types
packages/ui
packages/card-renderer
packages/game-engine
supabase
design
docs
```

## Agent Onboarding

Future agents should read [.agent/gogaffa-start-here/SKILL.md](.agent/gogaffa-start-here/SKILL.md) before making repo changes. It contains the repo map, key reference files, product guardrails, implementation rules, and validation expectations.

For substantial new features, product surfaces, backend workflows, monetization paths, schema expansions, or architecture changes, agents should invoke [.agent/grill-me/SKILL.md](.agent/grill-me/SKILL.md) before implementation. Use it to pressure-test the plan one question at a time and record locked decisions before writing code.

## Local Dev Setup

New to the repo and want to run the app on your iPhone? Follow
[docs/engineering/dev-setup.md](docs/engineering/dev-setup.md). It covers Node/nvm,
env files, the Expo Go vs development-build decision, and iOS device registration.

Node is pinned in [.nvmrc](.nvmrc) — run `nvm use` from the repo root before any
`pnpm` command.

## Commands

These commands are scaffolded. Install dependencies before running them.

```sh
nvm use            # match the pinned Node version (.nvmrc)
pnpm install
pnpm dev
pnpm dev:mobile
pnpm dev:mobile:client
pnpm lint
pnpm typecheck
pnpm preview:card
pnpm test:visual
pnpm supabase:start
pnpm supabase:reset
```

## Visual Inspection

For card template/layout work, use `pnpm preview:card` first. It renders the
card at native template coordinates from `design/card-templates/<template>/` and
is the ground truth for overlay placement.

Use `pnpm test:visual` for Playwright web smoke checks and screenshot artifacts.
If the browser binary is missing, run:

```sh
pnpm exec playwright install chromium
```

For the onboarding AI card generation flow, prompt edits, and card-ready push
notifications, see
[docs/engineering/card-generation-and-push.md](docs/engineering/card-generation-and-push.md).

## Environment

Use [.env.example](.env.example) as the master checklist for required environment values. Copy the relevant sections into the files each runtime actually reads:

- `apps/mobile/.env` for Expo public variables.
- `supabase/functions/.env` for server-only Edge Function secrets.

Do not commit real secrets. `.env.local` and other real env files are intentionally ignored.

For Supabase OAuth on mobile, allow these redirect URLs in Supabase Auth URL Configuration:

```txt
gogaffa://auth/callback
gogaffa://**
exp://**/--/auth/callback
exps://**/--/auth/callback
https://gogaffa.com/**
```

The OAuth provider callback configured in Google/Apple remains the Supabase callback URL:

```txt
https://hnwrhkrzvjesjrtjpjtm.supabase.co/auth/v1/callback
```

For Expo Go testing, Supabase may need the current `exp://.../--/auth/callback`
URL as the temporary Site URL. For EAS development builds, set Supabase Site URL
back to `https://gogaffa.com` and use the stable native callback
`gogaffa://auth/callback`.

## Store Release

The mobile app is intended to ship to both the Apple App Store and Google Play through Expo EAS. Release readiness is tracked in [docs/release/store_release_plan.md](docs/release/store_release_plan.md).

The baseline EAS config lives at [apps/mobile/eas.json](apps/mobile/eas.json). Finalize the iOS bundle ID and Android package before the first store upload.

Development builds use the native GoGaffa URL scheme and should be used for
OAuth testing once installed on a device:

```sh
pnpm mobile:eas:build:dev:ios
pnpm dev:mobile:client
```

## Public Website

The public waitlist, Privacy Policy, Terms of Service, and support pages live outside this repo at `https://gogaffa.com`.

Use these URLs for store metadata:

```txt
Marketing/support site: https://gogaffa.com
Privacy Policy: https://gogaffa.com/privacy
Terms of Service: https://gogaffa.com/terms
Support: https://gogaffa.com/support
```

## Important Product Rules

- Purchases affect card identity/status only.
- Purchases never affect Competitive Points or competitive leaderboards.
- Daily trivia uses 5 fixed questions for everyone.
- Live bounties reward card/status items, not Competitive Points.
- Public language should avoid implying official tournament affiliation.

See [docs/product/mvp_decisions.md](docs/product/mvp_decisions.md) for the full MVP decision contract.

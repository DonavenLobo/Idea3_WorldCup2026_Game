# GoGaffa

Mobile-first World Cup fan game built around a personalized AI footballer card, daily trivia, groups, and card progression.

## Product Loop

```txt
Create AI footballer card -> join a group -> play daily games -> earn XP/credits -> upgrade card -> share/invite -> repeat
```

## Stack Direction

- Mobile: Expo, React Native, TypeScript
- Web: Next.js, TypeScript
- Backend: Supabase Postgres, Auth, Storage, Edge Functions
- Monorepo: pnpm workspaces and Turborepo

## Workspace

```txt
apps/mobile
apps/web
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

## Commands

These commands are scaffolded. Install dependencies before running them.

```sh
pnpm install
pnpm dev
pnpm dev:mobile
pnpm dev:web
pnpm lint
pnpm typecheck
pnpm supabase:start
pnpm supabase:reset
```

## Environment

Use [.env.example](.env.example) as the master checklist for required environment values. Copy the relevant sections into the files each runtime actually reads:

- `apps/mobile/.env` for Expo public variables.
- `apps/web/.env.local` for Next.js public variables.
- `supabase/functions/.env` for server-only Edge Function secrets.

Do not commit real secrets. `.env.local` and other real env files are intentionally ignored.

## Store Release

The mobile app is intended to ship to both the Apple App Store and Google Play through Expo EAS. Release readiness is tracked in [docs/release/store_release_plan.md](docs/release/store_release_plan.md).

The baseline EAS config lives at [apps/mobile/eas.json](apps/mobile/eas.json). Finalize the iOS bundle ID and Android package before the first store upload.

## Web Deployment

The web app is linked to Vercel project `gogaffa` (`prj_hmrALSf2Kt62HIAOCT1YpsTMZeHi`) under team `denshimdon-5307s-projects` (`team_lBY9AzfREi5PixiToVkPOZUr`).

Current verified preview:

```txt
https://gogaffa-nqgt6mnw6-denshimdon-5307s-projects.vercel.app
```

Vercel is configured to use `apps/web` as the root directory while installing from the monorepo root. Keep web framework dependencies pinned in [apps/web/package.json](apps/web/package.json); broad `*` ranges can make Vercel misclassify the Next.js app as legacy.

Deploy a preview from the repo root:

```sh
pnpm dlx vercel@latest deploy --target preview --scope denshimdon-5307s-projects
```

## Important Product Rules

- Purchases affect card identity/status only.
- Purchases never affect Competitive Points or competitive leaderboards.
- Daily trivia uses 5 fixed questions for everyone.
- Live bounties reward card/status items, not Competitive Points.
- Public language should avoid implying official FIFA affiliation.

See [docs/product/mvp_decisions.md](docs/product/mvp_decisions.md) for the full MVP decision contract.

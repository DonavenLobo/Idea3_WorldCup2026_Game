# World Cup Game

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

Future agents should read [.agent/world-cup-game-start-here/SKILL.md](.agent/world-cup-game-start-here/SKILL.md) before making repo changes. It contains the repo map, key reference files, product guardrails, implementation rules, and validation expectations.

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

## Important Product Rules

- Purchases affect card identity/status only.
- Purchases never affect Competitive Points or competitive leaderboards.
- Daily trivia uses 5 fixed questions for everyone.
- Live bounties reward card/status items, not Competitive Points.
- Public language should avoid implying official FIFA affiliation.

See [docs/product/mvp_decisions.md](docs/product/mvp_decisions.md) for the full MVP decision contract.

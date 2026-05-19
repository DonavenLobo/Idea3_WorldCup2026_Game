---
name: world-cup-game-start-here
description: Start-here repo onboarding guide for the World Cup Game monorepo. Use first when an agent begins work in this repository, initially explores the repo, adds features, fills scaffolded modules, updates Supabase schema/functions, wires mobile or web routes, adjusts shared packages, or makes product/engineering decisions that must respect the MVP guardrails.
---

# World Cup Game Start Here

## Purpose

Use this skill first when starting work in the World Cup Game repository. It captures the repo structure, key reference files, product guardrails, and implementation rules future agents should follow.

## Read First

Read these files before making non-trivial changes:

- `docs/product/mvp_decisions.md`: product contract and monetization/scoring guardrails.
- `docs/world_cup_game_repo_scaffolding_plan.md`: target architecture and build phases.
- `docs/engineering/repo_structure.md`: current scaffold map.
- `README.md`: stack, workspace, and command overview.
- Relevant package/app `package.json` and `tsconfig.json` files before changing dependencies or TypeScript config.
- Relevant Supabase migration/function files before changing backend schema or server-side workflows.

Do not read, print, or modify `.env.local` unless the user explicitly asks. Use `.env.example` files for config shape.

## Big Additions

Before implementing a substantial new feature, product surface, backend workflow, monetization path, schema expansion, or architecture change, invoke the local `grill-me` skill at `.agent/grill-me/SKILL.md`.

Use `grill-me` to pressure-test the plan one question at a time before writing code. Resolve product, data, scoring, monetization, and user-flow decisions first. Codify any locked product decisions in `docs/product/mvp_decisions.md` or a focused decision doc before implementation.

Do not use `grill-me` for tiny bug fixes, straightforward refactors, copy edits, mechanical type fixes, or validation-only work.

## Repo Map

```txt
apps/mobile/              Expo + React Native app
  app/                    Expo Router screens only
  src/features/           Feature logic, hooks, API calls, components
  src/lib/                Supabase, analytics, uploads, permissions, notifications
  src/theme/              Mobile design tokens

apps/web/                 Next.js app for landing, public card pages, invites, download redirects
  app/                    App Router routes
  src/components/         Landing, card, and invite UI
  src/lib/                Web Supabase client, metadata, redirects

packages/types/           Shared domain and generated database types
packages/config/          Product constants, nations, card stats, feature flags, XP rules
packages/ui/              Lightweight shared React Native UI primitives
packages/card-renderer/   Shared card rendering contract and template metadata logic
packages/game-engine/     Scoring, progression, XP ledger, bounty, and leaderboard rules

supabase/
  migrations/             SQL schema, RLS, storage buckets
  functions/              TypeScript/Deno Edge Function placeholders
  seed/                   Local seed data

design/
  card-templates/         Versioned manual card assets and metadata
  brand/                  Brand notes
  exports/                Approved generated/manual exports

.agent/                   Repo-local agent skills and instructions
```

## Product Guardrails

Preserve these rules unless the user explicitly changes the product direction:

- Purchases never affect Competitive Points, gameplay outcomes, or competitive leaderboards.
- Keep currencies separate: Competitive Points for fair competition; Card XP/Credits for card progression, cosmetics, and paid upgrades.
- Live bounties never award Competitive Points. They award deterministic card/status rewards after reveal.
- Daily trivia MVP is 5 fixed multiple-choice questions for everyone, 4 options each, first attempt only, scored by correctness plus speed.
- Groups are free, multiple groups are allowed, and group count/size should not be monetized.
- Card Showcase can include paid cosmetics/progression, but must be labeled as non-competitive.
- Cards never downgrade.
- Avoid gambling framing, paid randomness, loot boxes, and official FIFA affiliation language.
- Treat the AI footballer card as the core identity, monetization, and sharing surface.

## Implementation Rules

Keep route files thin:

- Put mobile screens in `apps/mobile/app`.
- Put mobile business logic in `apps/mobile/src/features/<feature>`.
- Reuse the feature module pattern: `api/`, `components/`, `hooks/`, `schemas/`, `utils/`, `types.ts`, `index.ts`.

Keep shared logic out of apps:

- Put cross-app domain types in `packages/types`.
- Put product constants and feature flags in `packages/config`.
- Put scoring/progression/leaderboard rules in `packages/game-engine`.
- Put card template/rendering logic in `packages/card-renderer`.
- Keep `packages/ui` lightweight. Do not force feature-specific UI into shared UI.

Backend logic is TypeScript:

- Supabase Edge Functions live in `supabase/functions/*` and run on Deno.
- Database schema and RLS live in ordered SQL migrations under `supabase/migrations`.
- Clients may submit actions, but backend functions must calculate rewards, XP, purchases, and scoring.
- Never trust client-provided XP, Competitive Points, purchase status, correct answers, or bounty rewards.
- Add RLS for any user-owned table.

Card template work:

- Add manual card assets under `design/card-templates/<template-key>-vN/`.
- Keep template positioning in `metadata.json`; do not hard-code template coordinates in app screens.
- Do not silently overwrite templates. Create a new version folder for material design or placement changes.

Web app scope:

- Keep web focused on acquisition: landing page, public card preview, invite links, download redirects, and social preview images.
- Do not duplicate the full mobile app on web unless the product direction changes.

Dependencies:

- This is a pnpm TypeScript monorepo. Use `pnpm`, not `uv`, for app dependencies.
- Add Python tooling only if the user explicitly introduces a Python service or script need.
- Avoid broad `*` dependency versions once implementation starts; pin compatible versions when choosing real library versions.

## Validation

Run relevant checks after edits:

```sh
pnpm typecheck
```

For dependency or workspace changes, also run:

```sh
pnpm install
pnpm typecheck
```

For Supabase changes, inspect migrations carefully and run local Supabase validation only when the environment is available:

```sh
supabase start
supabase db reset
```

If these commands fail because dependencies, Docker, Supabase, or network access are unavailable, report the blocker clearly and do not hide the failure.

## Working Style

- Inspect existing files before editing.
- Preserve user changes and never revert unrelated work.
- Prefer small, coherent patches over large rewrites.
- Update product docs when a product decision changes.
- Update `.env.example` files when adding required environment variables.
- Keep public-facing copy clear of official affiliation claims.
- Keep final explanations concise and include validation results.

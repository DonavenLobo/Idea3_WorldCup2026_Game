# Repo Structure

This repo is scaffolded as a mobile-first monorepo.

```txt
apps/
  mobile/        Expo + React Native app
  web/           Next.js web app for landing, invite, card share, and download pages

packages/
  config/        Shared product constants and feature flags
  types/         Shared TypeScript domain and database types
  ui/            Lightweight shared UI primitives
  card-renderer/ Shared player card rendering logic
  game-engine/   Scoring, XP, progression, and leaderboard rules

supabase/
  migrations/    Versioned database schema
  functions/     Edge function entrypoints
  seed/          Local seed data

design/
  card-templates/ Versioned card template assets and metadata
  brand/          Brand notes and tokens
  exports/        Generated or approved design exports
```

## Current Scaffold Scope

This first pass creates package boundaries, route placeholders, env examples, initial SQL, template metadata, and core TypeScript rule placeholders. It does not install dependencies or generate native Expo projects.

## First Vertical Slice

Build toward:

```txt
Anonymous open -> select nation -> capture/upload photo -> create card -> account required -> save card -> share public card link
```

# Onboarding Card Image Generation — Design

- **Date:** 2026-06-03
- **Branch:** `feature/ImageGeneration`
- **Status:** Approved design, pending implementation plan
- **Author:** Donaven Lobo (with Claude)

## Summary

Today, when a user uploads a selfie or photo during onboarding, the app just drops
the raw image into the card's avatar window. This design replaces that with an
**AI-generated footballer avatar**: after the user signs up, we send their photo to
OpenAI **gpt-image-2** to restyle it into a hand-drawn footballer that fits the
`level-00-sketch` card, then overlay the OVR / name / stats / flag crisply on top so
the data stays pixel-exact.

The card's data (OVR, six stats, name) is **never** sent through the image model —
only the player illustration is generated. Generation runs **asynchronously** after
sign-up; the user enters the app immediately with a "Generating…" card and gets a
**push notification** when the finished card is ready.

## Goals

- Turn the onboarding photo into a recognizable, on-brand footballer avatar via gpt-image-2.
- Keep OVR / stats / name / flag pixel-exact by overlaying them, not generating them.
- Run generation async after sign-up; never block the user; notify via push when ready.
- Keep the OpenAI key server-side only.
- Gracefully handle generation failure and content-moderation rejection.

## Non-Goals (separate later tasks)

- The **paid 3-option regenerate** flow (`app/card/regenerate.tsx`,
  `regenerateCard.ts`, `verify-purchase`). Out of scope.
- Server-flattening a shareable `final_card_url` / teaser image for external sharing
  and Open Graph (`compose-player-card` stays a stub).
- Trivia / brackets / bounties / leaderboards.

## Decisions (locked)

| Decision | Choice | Rationale |
| --- | --- | --- |
| Render strategy | AI paints the **player**; we overlay data | Image models redraw/garble text; overlay keeps "stats exactly" |
| AI output scope | **Variant A** — player fills the existing template's avatar window | Chosen empirically from a spike (see below); keeps fixed overlay coords reliable and stays on-brand |
| Generation UX | **Async, push-first** | User isn't blocked for 15–40s; matches MVP decision #6 |
| Image quality | `medium` | Good balance of quality/cost for the hero card |
| Model | `gpt-image-2` **only** (no gpt-image-1 fallback) | Per product direction; confirmed working in spike |

### Spike that informed this

`scripts/experiments/card-image-spike.mjs` (throwaway) generated two variants from a
test photo on gpt-image-2:

- **A — avatar window:** player composited into the real `level-00-sketch` template.
  Fixed frame + overlay coordinates line up perfectly. **Chosen.**
- **B — full-bleed AI card:** more immersive, but the AI decides where the rating/name/
  stat zones land, so they drift per generation and fight exact-data placement.

**Key API finding:** gpt-image-2 does **not** support `background: transparent`
(that's a gpt-image-1 feature). Variant A therefore renders the player on matching
beige paper rather than a transparent cutout.

## User Flow

```
ONBOARDING (anonymous, no API calls)        AFTER SIGN-UP (async)
select nation                               create profile + save card + upload photo
  → photo booth (selfie / upload / random)    → POST generate-card-avatar { cardId } -> 202
  → name card                                 → enter app immediately
  → preview: raw photo in template            → card shows "Generating…" on every surface
    + "Sign up to generate your card"         → backend runs gpt-image-2 in background (~15–40s)
  → "Create Account to Save"                  → on done: avatar stored, status=ready, push sent
                                              → user taps push → card reveal (polished avatar)
```

Pre-sign-up preview is the existing `RenderedPlayerCard` with the raw photo plus a
pending label. No OpenAI call happens until after sign-up.

## Architecture

### Backend — `generate-card-avatar` Edge Function (implement the stub)

Request body is tightened to **`{ cardId: string }`** only. Everything else is read
from the database; the caller's identity comes from the JWT. (Updates
`supabase/functions/generate-card-avatar/schema.ts`, which currently trusts a
client-supplied `userId` / `sourceImageUrl` / `nationCode`.)

Flow:

1. **Auth & ownership:** verify the JWT; load the `cards` row for `cardId`; confirm
   `card.user_id === auth.uid()`. Reject otherwise.
2. **Mark in progress:** set `cards.status = 'generating_avatar'`; insert a
   `card_generations` row (`generation_type='onboarding'`, `provider='openai'`,
   `status='pending'`).
3. **Return `202 Accepted` immediately.** All work below runs inside
   `EdgeRuntime.waitUntil(...)` so the client never waits on the HTTP request.
4. **Generate:** read `display_name`, `selected_nation_code`, `avatar_source_url` from
   the card row; fetch the source photo from the `card-uploads` bucket (service role);
   call gpt-image-2 (see below).
5. **Store:** upload the result PNG to the existing **`card-generated`** bucket at
   `${userId}/${cardId}/${timestamp}.png`.
6. **Finalize:** update `cards.avatar_generated_url` + `status='ready'`; update the
   `card_generations` row (`status='succeeded'`, `generated_image_url`, `cost_cents`,
   `provider_job_id`).
7. **Notify:** send an Expo push ("Your card is ready!") to the user's stored device
   token(s) via the Expo push API.

**Secrets:** `OPENAI_API_KEY` set via `supabase secrets set OPENAI_API_KEY=…`, read
with `Deno.env.get("OPENAI_API_KEY")`. Removed from any client-readable location;
`.env.example` documents it as a function secret. (Today it lives in `.env.local`.)

### The gpt-image-2 call

- **Endpoint:** `POST https://api.openai.com/v1/images/edits`
- **Params:** `model=gpt-image-2`, `size=1024x1536`, `quality=medium`,
  `output_format=png`, `n=1`. Identity fidelity is automatic (gpt-image-2 always
  processes image inputs at high fidelity; `input_fidelity` must be omitted).
- **Baseline (ships first):** `image[] = [photo]` + a prompt that restyles the person
  as a recognizable hand-drawn footballer in their nation's kit **on matching beige
  paper**. The renderer drops the result into the avatar window (`fit: cover`). This is
  the visually-approved spike result.
- **Seam enhancement (attempted during impl):** masked edit — composite the photo into
  the avatar window of `base-card.png` and pass a fixed window **mask** (transparent
  window, opaque elsewhere) so gpt-image-2 repaints only that region onto the real
  paper → no rectangular seam, frame byte-identical. If Deno-side compositing proves
  too fiddly, ship the baseline.
- **"Surprise Me"** (no source photo): use `POST /v1/images/generations` with a
  text-only prompt instead of `edits`.
- Prompt construction lives in `supabase/functions/generate-card-avatar/prompt.ts`.

### Client (mobile)

- **Post-sign-up wiring:** after account creation, create the profile, persist the card
  (existing `createCard` + `uploadCardImage`), then call a new
  `src/features/card/api/startCardGeneration.ts` that invokes the Edge Function with
  `{ cardId }`.
- **Pending state:** card surfaces (home, card tab, onboarding preview) show a
  "Generating…" badge while `status = 'generating_avatar'`. The renderer
  already falls back to `avatar_source_url` (raw photo), so the card is never blank.
- **Update on ready:** subscribe to the user's `cards` row via Supabase Realtime, plus
  refetch on app-foreground and on push-tap. When `status='ready'`, swap to the
  generated avatar and show a small reveal moment.
- **Push:** implement `registerForPushNotifications()` with `expo-notifications`
  (currently a stub returning `null`); persist the token; add a notification handler
  that refetches the card and routes to the reveal.
- **Pre-sign-up preview:** `app/(onboarding)/card-preview.tsx` adds the "Sign up to
  generate your card" pending label.

## Data Model Changes

- **Reuse** the existing `card-generated` private bucket for AI avatars (owner-read RLS
  already exists in `000011_storage_buckets.sql`). No new bucket.
- **New migration** `000020_device_push_tokens.sql` (next in sequence after `000019`): a `device_push_tokens` table
  (`user_id` → profiles, `token`, `platform`, `created_at`, `updated_at`,
  unique on `token`) with RLS so a user manages only their own tokens.
- **Mask asset** (only if we adopt the seam enhancement): a precomputed
  `avatar-window-mask.png` (1024×1536) committed under the template folder and/or
  uploaded to the public `card-assets` bucket.
- `cards` and `card_generations` need **no schema change** — the required statuses and
  columns already exist (`generating_avatar`, `ready`, `failed`, `moderation_rejected`;
  `avatar_generated_url`; `card_generations.provider/provider_job_id/cost_cents/status`).

## Error Handling, Moderation, Security

- **Generation failure:** set `cards.status='failed'` and `card_generations.status='failed'`
  (store error); keep the raw photo as the displayed avatar; surface a free **Retry**
  that re-invokes the function.
- **Moderation rejection** (OpenAI rejects the input/output): set
  `cards.status='moderation_rejected'`; client prompts the user for a new photo.
- **Security:** RLS already restricts `cards`/`card_generations`/storage to the owner.
  The function uses the service role but re-checks `card.user_id === auth.uid()`. The
  client never sets `avatar_generated_url`, `status`, or any reward field. The OpenAI
  key never reaches the client.

## Testing & Validation

- `pnpm typecheck` across touched packages and functions.
- Reuse `scripts/experiments/card-image-spike.mjs` to validate the masked-edit seam fix
  on the test photo before wiring it in.
- Manual device run: onboard → sign up → pending card → push → reveal. Plus a
  forced-failure path and a moderation-reject path.
- Confirm `OPENAI_API_KEY` resolves only as a function secret (not bundled into the app).

## Open Risks

1. **Deno-side image compositing** for the masked seam fix (no `sharp` in Deno).
   Mitigation: baseline (non-masked) path needs no compositing and is already approved.
2. **Push delivery / token lifecycle** (permissions, token refresh, multiple devices).
   Mitigation: `device_push_tokens` table; Realtime + foreground refetch make push a
   convenience, not a correctness dependency.
3. **Background-task duration** on Edge Functions (~40s generation). Comfortably within
   limits, but monitor; consider a queue if generation time grows.

## File Touch List (anticipated)

**Backend**
- `supabase/functions/generate-card-avatar/{index,prompt,schema}.ts` — implement.
- `supabase/migrations/0000XX_device_push_tokens.sql` — new.
- `supabase/functions/.env.example` / root `.env.example` — document `OPENAI_API_KEY`.
- (optional) `design/card-templates/level-00-sketch-v1/avatar-window-mask.png` — seam fix.

**Client**
- `src/features/card/api/startCardGeneration.ts` — new.
- `src/lib/pushNotifications.ts` — implement registration + handler.
- `src/features/card/components/RenderedPlayerCard.tsx` (+ card surfaces) — pending/ready states.
- card status hook / Realtime subscription (e.g., `src/features/card/hooks/useCard.ts`).
- `app/(onboarding)/card-preview.tsx` — pending label.
- Post-sign-up flow (`src/features/auth` / `src/features/onboarding/api/saveCompletedOnboarding.ts`) — trigger generation.

**Out of scope (unchanged):** `app/card/regenerate.tsx`, `regenerateCard.ts`,
`verify-purchase`, `compose-player-card`.

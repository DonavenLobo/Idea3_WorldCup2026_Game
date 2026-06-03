# Onboarding Card Image Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the raw onboarding photo with an AI-generated footballer avatar produced by OpenAI gpt-image-2 after sign-up, displayed via the existing template with crisp data overlaid, generated asynchronously with a push notification when ready.

**Architecture:** A Supabase Edge Function (`generate-card-avatar`) authenticates the caller, returns `202` immediately, and runs the gpt-image-2 call + storage upload + card status updates + push notification in a background task (`EdgeRuntime.waitUntil`). The mobile client triggers it right after the card is saved post-sign-up, shows a "Generating…" card, and flips to the finished avatar via Supabase Realtime / refetch. Card data (OVR/stats/name) is overlaid by the existing renderer and never sent through the image model.

**Tech Stack:** Supabase Edge Functions (Deno), Postgres + RLS, Supabase Storage, OpenAI gpt-image-2 (`/v1/images/edits` + `/v1/images/generations`), Expo (React Native, expo-notifications), `@tanstack/react-query`, `@supabase/supabase-js`.

**Spec:** `docs/superpowers/specs/2026-06-03-onboarding-card-image-generation-design.md`

---

## Verification Approach (read first)

This repo has **no unit-test runner** — every package `test` script is a placeholder echo and the only test infra is Playwright visual (`tests/visual/`). Do **not** introduce jest/vitest. Verification gates used in this plan, matching repo convention:

- **Deno's built-in test runner** for the Edge Function's pure helpers (`deno test …`). Deno ships with the `supabase` CLI; if neither `deno` nor `supabase` is on PATH, fall back to `pnpm typecheck` and note it.
- **`pnpm typecheck`** (root, runs `turbo typecheck`) for all TypeScript.
- **`supabase db reset`** to validate migrations apply cleanly.
- **`supabase functions serve` + a real invoke** to validate the Edge Function end-to-end locally.
- **`scripts/experiments/card-image-spike.mjs`** (existing) to eyeball image output and validate the optional seam fix.
- **Manual device run** for the React Native UI (no RN unit testing exists in this repo).

Commit after each task. Work on the current `feature/ImageGeneration` branch.

---

## File Structure

**Backend (Supabase)**
- `supabase/functions/generate-card-avatar/schema.ts` — *modify*: request is now `{ cardId }` only.
- `supabase/functions/generate-card-avatar/prompt.ts` — *modify*: build edit/generate prompts from nation + kit.
- `supabase/functions/generate-card-avatar/openai.ts` — *create*: gpt-image-2 client (edits + generations), moderation error type.
- `supabase/functions/generate-card-avatar/index.ts` — *modify*: orchestration (auth, ownership, status, storage, `card_generations`, background task, push).
- `supabase/functions/generate-card-avatar/schema_test.ts` — *create*: Deno tests for schema.
- `supabase/functions/generate-card-avatar/prompt_test.ts` — *create*: Deno tests for prompt.
- `supabase/migrations/000020_device_push_tokens.sql` — *create*: push-token table + RLS.
- `.env.example` (root) and `supabase/functions/.env.example` — *modify*: document `OPENAI_API_KEY` as a function secret.

**Client (apps/mobile)**
- `src/lib/imageUpload.ts` — *modify*: add `getCardGeneratedDisplayUrl` (signed URL for the private `card-generated` bucket).
- `src/features/card/api/getCard.ts` — *modify*: resolve `avatar_generated_url` via signed URL in `mapCardRow`.
- `src/features/card/api/startCardGeneration.ts` — *create*: invoke the Edge Function.
- `src/features/card/index.ts` — *modify*: export `startCardGeneration`.
- `src/features/onboarding/api/saveCompletedOnboarding.ts` — *modify*: trigger generation after `createCard`.
- `src/lib/pushNotifications.ts` — *modify*: implement registration + persistence.
- `src/features/notifications/api/savePushToken.ts` — *create*: upsert token row.
- `src/features/card/components/CardStatusBadge.tsx` — *create*: "Generating…" / "Retry" overlay.
- `src/features/card/components/RenderedPlayerCard.tsx` — *modify*: render the status badge.
- `src/features/card/hooks/useCardRealtime.ts` — *create*: subscribe to the user's card row, invalidate `["current-card", userId]`.
- `app/(tabs)/_layout.tsx` — *modify*: mount the realtime + push handler once.
- `app/(onboarding)/card-preview.tsx` — *modify*: "Sign up to generate" pending label.
- `apps/mobile/package.json` — *modify*: add `expo-notifications`, `expo-device`.

**Optional stretch**
- `design/card-templates/level-00-sketch-v1/avatar-window-mask.png` — *create*: window mask for the seam fix.

---

## PHASE A — Edge Function: avatar generation (baseline, no push yet)

### Task A1: Document and set the OpenAI key as a function secret

**Files:**
- Modify: `.env.example`
- Modify: `supabase/functions/.env.example` (create if missing)

- [ ] **Step 1: Add the key to `supabase/functions/.env.example`**

Append (create the file if it does not exist):

```sh
# Server-only. Never expose to the mobile client.
OPENAI_API_KEY=
```

- [ ] **Step 2: Note in root `.env.example`** that the key is server-only

Under the existing OpenAI section (or add one), ensure this comment exists:

```sh
# OPENAI_API_KEY is consumed only by Supabase Edge Functions.
# Set it locally with:  supabase secrets set OPENAI_API_KEY=sk-...
# It must NOT be added to apps/mobile/.env (never ship it to the client).
```

- [ ] **Step 3: Set the secret for local function serving**

Run (uses the value already in `.env.local`; never print it):

```sh
supabase secrets set OPENAI_API_KEY="$(grep -E '^OPENAI_API_KEY=' .env.local | cut -d= -f2-)"
```

Expected: `Finished supabase secrets set.`

- [ ] **Step 4: Commit**

```bash
git add .env.example supabase/functions/.env.example
git commit -m "chore: document OPENAI_API_KEY as a Supabase function secret"
```

---

### Task A2: Tighten the request schema to `{ cardId }`

**Files:**
- Modify: `supabase/functions/generate-card-avatar/schema.ts`
- Test: `supabase/functions/generate-card-avatar/schema_test.ts`

- [ ] **Step 1: Write the failing Deno test**

Create `supabase/functions/generate-card-avatar/schema_test.ts`:

```ts
import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { parseGenerateCardAvatarRequest } from "./schema.ts";

Deno.test("parses a valid cardId request", () => {
  const result = parseGenerateCardAvatarRequest({ cardId: "11111111-1111-1111-1111-111111111111" });
  assertEquals(result.cardId, "11111111-1111-1111-1111-111111111111");
});

Deno.test("rejects a missing cardId", () => {
  assertThrows(() => parseGenerateCardAvatarRequest({}), Error, "cardId");
});

Deno.test("rejects a non-uuid cardId", () => {
  assertThrows(() => parseGenerateCardAvatarRequest({ cardId: "nope" }), Error, "cardId");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `deno test supabase/functions/generate-card-avatar/schema_test.ts`
Expected: FAIL (current `schema.ts` requires `userId`, `displayName`, etc., and accepts a non-uuid).

- [ ] **Step 3: Replace `schema.ts` with the minimal implementation**

Overwrite `supabase/functions/generate-card-avatar/schema.ts`:

```ts
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface GenerateCardAvatarRequest {
  cardId: string;
}

export function parseGenerateCardAvatarRequest(value: unknown): GenerateCardAvatarRequest {
  const input = (value ?? {}) as Partial<GenerateCardAvatarRequest>;

  if (typeof input.cardId !== "string" || !UUID_RE.test(input.cardId)) {
    throw new Error("Invalid generate-card-avatar request: cardId must be a UUID.");
  }

  return { cardId: input.cardId };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `deno test supabase/functions/generate-card-avatar/schema_test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/generate-card-avatar/schema.ts supabase/functions/generate-card-avatar/schema_test.ts
git commit -m "feat(fn): generate-card-avatar accepts cardId-only request"
```

---

### Task A3: Build the gpt-image-2 prompt

**Files:**
- Modify: `supabase/functions/generate-card-avatar/prompt.ts`
- Test: `supabase/functions/generate-card-avatar/prompt_test.ts`

- [ ] **Step 1: Write the failing Deno test**

Create `supabase/functions/generate-card-avatar/prompt_test.ts`:

```ts
import { assertStringIncludes } from "jsr:@std/assert@1";
import { buildAvatarPrompt } from "./prompt.ts";

Deno.test("edit prompt names the nation and forbids text", () => {
  const prompt = buildAvatarPrompt({ nationName: "Brazil", kitDescription: "yellow and green kit", mode: "edit" });
  assertStringIncludes(prompt, "Brazil");
  assertStringIncludes(prompt, "yellow and green kit");
  assertStringIncludes(prompt, "no text");
});

Deno.test("generate prompt does not assume an input photo", () => {
  const prompt = buildAvatarPrompt({ nationName: "USA", kitDescription: "red, white and navy kit", mode: "generate" });
  assertStringIncludes(prompt, "Invent");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `deno test supabase/functions/generate-card-avatar/prompt_test.ts`
Expected: FAIL ("buildAvatarPrompt" signature mismatch / missing strings).

- [ ] **Step 3: Replace `prompt.ts`**

Overwrite `supabase/functions/generate-card-avatar/prompt.ts`:

```ts
export interface AvatarPromptOptions {
  nationName: string;
  kitDescription: string;
  mode: "edit" | "generate";
}

const SHARED = [
  "Hand-drawn colored-pencil and ink sketch style footballer for a trading card,",
  "head to upper torso, confident hero pose looking toward camera,",
  "rendered on a plain flat warm-beige paper background that matches a sketch trading card.",
  "No card frame, no border, no text, no numbers, no logos, no scenery — just the player figure on uniform beige paper."
].join(" ");

export function buildAvatarPrompt(opts: AvatarPromptOptions): string {
  const kit = `Wearing a ${opts.nationName} national-team football ${opts.kitDescription}.`;

  if (opts.mode === "edit") {
    return [
      "Transform the person in the provided photo into a stylized footballer illustration.",
      "Keep them clearly recognizable: same face, hairstyle, and skin tone.",
      kit,
      SHARED
    ].join(" ");
  }

  return [
    "Invent a plausible footballer character (no input photo provided).",
    kit,
    SHARED
  ].join(" ");
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `deno test supabase/functions/generate-card-avatar/prompt_test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/generate-card-avatar/prompt.ts supabase/functions/generate-card-avatar/prompt_test.ts
git commit -m "feat(fn): build gpt-image-2 avatar prompt for edit and generate modes"
```

---

### Task A4: gpt-image-2 client helper

**Files:**
- Create: `supabase/functions/generate-card-avatar/openai.ts`

> No unit test: this wraps an external HTTP API and is validated end-to-end in Task A6. Keep it small and pure-ish (takes inputs, returns bytes).

- [ ] **Step 1: Create `openai.ts`**

```ts
const OPENAI_BASE = "https://api.openai.com/v1";
const MODEL = "gpt-image-2"; // gpt-image-2 ONLY — no fallback
const SIZE = "1024x1536";
const QUALITY = "medium";

export class OpenAiModerationError extends Error {}

interface GenerateArgs {
  apiKey: string;
  prompt: string;
  /** PNG/JPEG bytes of the source photo. Omit for text-to-image (Surprise Me). */
  sourceImage?: { bytes: Uint8Array; contentType: string };
}

function isModeration(status: number, body: string): boolean {
  return (
    status === 400 &&
    /moderation|safety|content[_ ]policy|not allowed/i.test(body)
  );
}

async function readImageBytes(res: Response): Promise<Uint8Array> {
  const text = await res.text();
  const json = JSON.parse(text);
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error(`gpt-image-2 returned no image: ${text.slice(0, 300)}`);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/** Returns finished avatar PNG bytes. Throws OpenAiModerationError on policy rejection. */
export async function generateAvatarImage(args: GenerateArgs): Promise<Uint8Array> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);

  try {
    let res: Response;

    if (args.sourceImage) {
      const form = new FormData();
      form.append("model", MODEL);
      form.append("prompt", args.prompt);
      form.append("size", SIZE);
      form.append("quality", QUALITY);
      form.append("output_format", "png");
      form.append("n", "1");
      form.append(
        "image[]",
        new Blob([args.sourceImage.bytes], { type: args.sourceImage.contentType }),
        "source.png"
      );
      res = await fetch(`${OPENAI_BASE}/images/edits`, {
        method: "POST",
        headers: { Authorization: `Bearer ${args.apiKey}` },
        body: form,
        signal: controller.signal
      });
    } else {
      res = await fetch(`${OPENAI_BASE}/images/generations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${args.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: MODEL,
          prompt: args.prompt,
          size: SIZE,
          quality: QUALITY,
          output_format: "png",
          n: 1
        }),
        signal: controller.signal
      });
    }

    if (!res.ok) {
      const body = await res.text();
      if (isModeration(res.status, body)) {
        throw new OpenAiModerationError(body.slice(0, 300));
      }
      throw new Error(`gpt-image-2 ${res.status}: ${body.slice(0, 400)}`);
    }

    return await readImageBytes(res);
  } finally {
    clearTimeout(timer);
  }
}
```

- [ ] **Step 2: Typecheck (Deno) the file compiles**

Run: `deno check supabase/functions/generate-card-avatar/openai.ts`
Expected: no errors. (If `deno` is unavailable, skip; Task A6 will surface compile errors via `supabase functions serve`.)

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/generate-card-avatar/openai.ts
git commit -m "feat(fn): add gpt-image-2 client (edits + generations)"
```

---

### Task A5: Orchestration in `index.ts` (no push yet)

**Files:**
- Modify: `supabase/functions/generate-card-avatar/index.ts`

- [ ] **Step 1: Replace `index.ts`**

```ts
import { createClient } from "jsr:@supabase/supabase-js@2";
import { parseGenerateCardAvatarRequest } from "./schema.ts";
import { buildAvatarPrompt } from "./prompt.ts";
import { generateAvatarImage, OpenAiModerationError } from "./openai.ts";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const UPLOAD_BUCKET = "card-uploads";
const GENERATED_BUCKET = "card-generated";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization" }, 401);

  let cardId: string;
  try {
    cardId = parseGenerateCardAvatarRequest(await req.json()).cardId;
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }

  // Identity from the caller's JWT.
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data: userData } = await userClient.auth.getUser();
  const user = userData.user;
  if (!user) return json({ error: "Not authenticated" }, 401);

  // Privileged client for reads/writes that bypass RLS.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: card, error: cardErr } = await admin
    .from("cards")
    .select("id, user_id, selected_nation_code, avatar_source_url, status")
    .eq("id", cardId)
    .maybeSingle();

  if (cardErr) return json({ error: cardErr.message }, 500);
  if (!card) return json({ error: "Card not found" }, 404);
  if (card.user_id !== user.id) return json({ error: "Forbidden" }, 403);

  // Mark in-progress + open a generation record.
  await admin.from("cards").update({ status: "generating_avatar" }).eq("id", cardId);
  const { data: gen } = await admin
    .from("card_generations")
    .insert({
      card_id: cardId,
      user_id: user.id,
      generation_type: "onboarding",
      provider: "openai",
      source_image_url: card.avatar_source_url,
      status: "pending"
    })
    .select("id")
    .single();
  const generationId = gen?.id as string | undefined;

  // Background work — respond 202 immediately.
  EdgeRuntime.waitUntil(
    runGeneration({ admin, cardId, userId: user.id, generationId, card })
  );

  return json({ status: "accepted", cardId }, 202);
});

async function runGeneration(ctx: {
  admin: ReturnType<typeof createClient>;
  cardId: string;
  userId: string;
  generationId?: string;
  card: { selected_nation_code: string; avatar_source_url: string | null };
}) {
  const { admin, cardId, userId, generationId, card } = ctx;
  try {
    // Nation name + kit for the prompt.
    const { data: nation } = await admin
      .from("nations")
      .select("name, primary_color, secondary_color")
      .eq("code", card.selected_nation_code)
      .maybeSingle();
    const nationName = nation?.name ?? card.selected_nation_code;
    const kitDescription = nation
      ? `kit (${nation.primary_color} and ${nation.secondary_color})`
      : "national-team kit";

    // Source photo (if any).
    let sourceImage: { bytes: Uint8Array; contentType: string } | undefined;
    if (card.avatar_source_url) {
      const { data: blob, error } = await admin.storage
        .from(UPLOAD_BUCKET)
        .download(card.avatar_source_url);
      if (error) throw error;
      sourceImage = {
        bytes: new Uint8Array(await blob.arrayBuffer()),
        contentType: blob.type || "image/jpeg"
      };
    }

    const prompt = buildAvatarPrompt({
      nationName,
      kitDescription,
      mode: sourceImage ? "edit" : "generate"
    });

    const png = await generateAvatarImage({ apiKey: OPENAI_API_KEY, prompt, sourceImage });

    // Store the generated avatar (private bucket; path stored, signed at read time).
    const path = `${userId}/${cardId}/${Date.now()}.png`;
    const { error: upErr } = await admin.storage
      .from(GENERATED_BUCKET)
      .upload(path, png, { contentType: "image/png", upsert: true });
    if (upErr) throw upErr;

    await admin
      .from("cards")
      .update({ avatar_generated_url: path, status: "ready", updated_at: new Date().toISOString() })
      .eq("id", cardId);

    if (generationId) {
      await admin
        .from("card_generations")
        .update({ status: "succeeded", generated_image_url: path })
        .eq("id", generationId);
    }
    // Push notification is added in Task B3.
  } catch (err) {
    const moderation = err instanceof OpenAiModerationError;
    await admin
      .from("cards")
      .update({ status: moderation ? "moderation_rejected" : "failed" })
      .eq("id", cardId);
    if (generationId) {
      await admin
        .from("card_generations")
        .update({ status: "failed" })
        .eq("id", generationId);
    }
    console.error("generate-card-avatar failed:", (err as Error).message);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/generate-card-avatar/index.ts
git commit -m "feat(fn): orchestrate gpt-image-2 avatar generation as a background task"
```

---

### Task A6: Validate the function end-to-end locally

**Files:** none (validation only)

- [ ] **Step 1: Reset the local DB (applies migrations + seed)**

Run: `supabase db reset`
Expected: completes; nations/templates/etc. seeded.

- [ ] **Step 2: Create a test card row with a real source image**

Upload the test photo and insert a card via SQL (replace `<USER_UUID>` with a row from `auth.users`, or create one in Studio). Quick path using an existing seeded nation `USA`:

```sh
# Upload the spike test photo into card-uploads under a known user folder:
supabase storage cp tests/test_assets/input_image_test.jpg \
  "ss:///card-uploads/<USER_UUID>/test.jpg" --experimental
```

Then in Studio SQL editor (or `psql`):

```sql
insert into public.cards (user_id, template_id, display_name, selected_nation_code, avatar_source_url, status)
values ('<USER_UUID>',
        (select id from public.card_templates where is_active limit 1),
        'Test Player', 'USA', '<USER_UUID>/test.jpg', 'draft')
returning id;
```

- [ ] **Step 3: Serve the function**

Run: `supabase functions serve generate-card-avatar --env-file supabase/functions/.env`
(Ensure `OPENAI_API_KEY` is present in that env file or already set via `supabase secrets set`.)
Expected: "Serving functions on http://localhost:54321/functions/v1/generate-card-avatar".

- [ ] **Step 4: Invoke it with a user JWT**

Get a JWT for `<USER_UUID>` (Studio → Auth, or a signed-in app session). Then:

```sh
curl -i -X POST http://localhost:54321/functions/v1/generate-card-avatar \
  -H "Authorization: Bearer <USER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"cardId":"<CARD_ID>"}'
```

Expected: `HTTP/1.1 202` with `{"status":"accepted",...}` within ~1s.

- [ ] **Step 5: Confirm the background result**

Poll the row (wait ~15–40s):

```sql
select status, avatar_generated_url from public.cards where id = '<CARD_ID>';
select status, generated_image_url from public.card_generations where card_id = '<CARD_ID>';
```

Expected: `cards.status = 'ready'`, `avatar_generated_url` set; `card_generations.status = 'succeeded'`.
Then download and eyeball the generated PNG:

```sh
supabase storage cp "ss:///card-generated/<avatar_generated_url>" /tmp/gen.png --experimental && open /tmp/gen.png
```

> If `EdgeRuntime.waitUntil` does not complete locally under `policy = "oneshot"`, temporarily set `[edge_runtime] policy = "per_worker"` in `supabase/config.toml` for local testing, then revert.

- [ ] **Step 6: Commit any config note** (if you added a comment about `per_worker`)

```bash
git add -A && git commit -m "chore: note local edge_runtime policy for background tasks" || echo "nothing to commit"
```

---

## PHASE B — Push notifications

### Task B1: `device_push_tokens` migration

**Files:**
- Create: `supabase/migrations/000020_device_push_tokens.sql`

- [ ] **Step 1: Create the migration**

```sql
create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists device_push_tokens_user_id_idx
  on public.device_push_tokens (user_id);

alter table public.device_push_tokens enable row level security;

create policy "Users manage their own push tokens (select)"
  on public.device_push_tokens for select
  to authenticated using (auth.uid() = user_id);

create policy "Users manage their own push tokens (insert)"
  on public.device_push_tokens for insert
  to authenticated with check (auth.uid() = user_id);

create policy "Users manage their own push tokens (update)"
  on public.device_push_tokens for update
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own push tokens (delete)"
  on public.device_push_tokens for delete
  to authenticated using (auth.uid() = user_id);
```

- [ ] **Step 2: Validate the migration applies**

Run: `supabase db reset`
Expected: completes with no error on `000020`.

- [ ] **Step 3: Confirm the table + RLS exist**

In Studio SQL editor:

```sql
select tablename, rowsecurity from pg_tables where tablename = 'device_push_tokens';
select count(*) from pg_policies where tablename = 'device_push_tokens';
```

Expected: `rowsecurity = true`; policy count `= 4`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/000020_device_push_tokens.sql
git commit -m "feat(db): add device_push_tokens table with RLS"
```

---

### Task B2: Client push registration + persistence

**Files:**
- Modify: `apps/mobile/package.json` (add deps)
- Modify: `apps/mobile/src/lib/pushNotifications.ts`
- Create: `apps/mobile/src/features/notifications/api/savePushToken.ts`
- Modify: `apps/mobile/src/features/notifications/index.ts`

- [ ] **Step 1: Add dependencies**

Run:

```sh
pnpm --filter mobile add expo-notifications expo-device
```

Expected: both added to `apps/mobile/package.json`. (After install, restart Metro with `-c` to clear stale cache when you next run the app.)

- [ ] **Step 2: Create the token-upsert API**

Create `apps/mobile/src/features/notifications/api/savePushToken.ts`:

```ts
import { Platform } from "react-native";
import { supabase } from "../../../lib/supabase";

export async function savePushToken(token: string): Promise<void> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) return;

  const platform = Platform.OS === "ios" ? "ios" : "android";
  const { error: upsertError } = await supabase
    .from("device_push_tokens")
    .upsert(
      { user_id: data.user.id, token, platform, updated_at: new Date().toISOString() },
      { onConflict: "token" }
    );
  if (upsertError) throw upsertError;
}
```

- [ ] **Step 3: Implement `registerForPushNotifications`**

Overwrite `apps/mobile/src/lib/pushNotifications.ts`:

```ts
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { savePushToken } from "../features/notifications/api/savePushToken";

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") {
    return null;
  }

  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  const tokenResponse = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  const token = tokenResponse.data;

  try {
    await savePushToken(token);
  } catch (error) {
    console.warn("Failed to persist push token", error);
  }

  return token;
}
```

- [ ] **Step 4: Export the API**

Ensure `apps/mobile/src/features/notifications/index.ts` exports it:

```ts
export { savePushToken } from "./api/savePushToken";
```

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/package.json pnpm-lock.yaml apps/mobile/src/lib/pushNotifications.ts apps/mobile/src/features/notifications
git commit -m "feat(mobile): register and persist expo push tokens"
```

---

### Task B3: Send the "card ready" push from the function

**Files:**
- Modify: `supabase/functions/generate-card-avatar/index.ts`

- [ ] **Step 1: Add a push helper at the bottom of `index.ts`**

```ts
async function sendCardReadyPush(
  admin: ReturnType<typeof createClient>,
  userId: string
): Promise<void> {
  const { data: tokens } = await admin
    .from("device_push_tokens")
    .select("token")
    .eq("user_id", userId);
  if (!tokens?.length) return;

  const messages = tokens.map((t: { token: string }) => ({
    to: t.token,
    title: "Your card is ready! ⚽",
    body: "Tap to see your AI footballer card.",
    data: { type: "CARD_READY" }
  }));

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages)
  });
}
```

- [ ] **Step 2: Call it after `status: "ready"`**

In `runGeneration`, immediately after the `cards` update that sets `status: "ready"` and after the `card_generations` "succeeded" update, add:

```ts
    await sendCardReadyPush(admin, userId);
```

- [ ] **Step 3: Validate**

Re-run Task A6 Steps 3–5 with a `device_push_tokens` row present for `<USER_UUID>` (insert a dummy `ExponentPushToken[...]` value). Expected: function still reaches `status = 'ready'`; the Expo push call returns 200 (a dummy token yields a `DeviceNotRegistered` ticket — acceptable for this check).

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/generate-card-avatar/index.ts
git commit -m "feat(fn): push notification when the card avatar is ready"
```

---

## PHASE C — Client UX wiring

### Task C1: Resolve generated-avatar signed URLs

**Files:**
- Modify: `apps/mobile/src/lib/imageUpload.ts`
- Modify: `apps/mobile/src/features/card/api/getCard.ts`

- [ ] **Step 1: Add `getCardGeneratedDisplayUrl` to `imageUpload.ts`**

Add the constant and function (mirrors `getCardUploadDisplayUrl`, different bucket):

```ts
const CARD_GENERATED_BUCKET = "card-generated";

export async function getCardGeneratedDisplayUrl(
  storedPathOrUrl?: string | null
): Promise<string | undefined> {
  if (!storedPathOrUrl) {
    return undefined;
  }

  if (isAlreadyResolvableUri(storedPathOrUrl)) {
    return storedPathOrUrl;
  }

  const { data, error } = await supabase.storage
    .from(CARD_GENERATED_BUCKET)
    .createSignedUrl(storedPathOrUrl, SIGNED_URL_TTL_SECONDS);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}
```

- [ ] **Step 2: Use it in `mapCardRow`**

In `apps/mobile/src/features/card/api/getCard.ts`, update the import and the `avatarGeneratedUrl` line:

```ts
import { getCardGeneratedDisplayUrl, getCardUploadDisplayUrl } from "../../../lib/imageUpload";
```

```ts
    avatarGeneratedUrl: await getCardGeneratedDisplayUrl(row.avatar_generated_url),
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/lib/imageUpload.ts apps/mobile/src/features/card/api/getCard.ts
git commit -m "feat(mobile): resolve signed URLs for generated card avatars"
```

---

### Task C2: `startCardGeneration` API + onboarding trigger

**Files:**
- Create: `apps/mobile/src/features/card/api/startCardGeneration.ts`
- Modify: `apps/mobile/src/features/card/index.ts`
- Modify: `apps/mobile/src/features/onboarding/api/saveCompletedOnboarding.ts`

- [ ] **Step 1: Create `startCardGeneration.ts`**

```ts
import { supabase } from "../../../lib/supabase";

/** Fire-and-forget trigger for the async avatar generation function. */
export async function startCardGeneration(cardId: string): Promise<void> {
  const { error } = await supabase.functions.invoke("generate-card-avatar", {
    body: { cardId }
  });
  if (error) {
    // Non-fatal: the card still shows the raw photo; user can retry.
    console.warn("Failed to start card generation", error);
  }
}
```

- [ ] **Step 2: Export it from the card feature barrel**

Add to `apps/mobile/src/features/card/index.ts`:

```ts
export { startCardGeneration } from "./api/startCardGeneration";
```

- [ ] **Step 3: Trigger generation in `saveCompletedOnboarding`**

In `apps/mobile/src/features/onboarding/api/saveCompletedOnboarding.ts`, add the import:

```ts
import { createCard } from "../../card/api/createCard";
import { startCardGeneration } from "../../card/api/startCardGeneration";
```

Then, right after `const { card } = await createCard({ ... });` and before the `Promise.all` invalidation, add:

```ts
  if (card.avatarSourceUrl || completedData.photoSource?.type === "random") {
    await startCardGeneration(card.id);
  }
```

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/card/api/startCardGeneration.ts apps/mobile/src/features/card/index.ts apps/mobile/src/features/onboarding/api/saveCompletedOnboarding.ts
git commit -m "feat(mobile): trigger avatar generation after onboarding sign-up"
```

---

### Task C3: Pending/failed status badge on the card

**Files:**
- Create: `apps/mobile/src/features/card/components/CardStatusBadge.tsx`
- Modify: `apps/mobile/src/features/card/components/RenderedPlayerCard.tsx`
- Modify: `apps/mobile/app/(onboarding)/card-preview.tsx`

- [ ] **Step 1: Create `CardStatusBadge.tsx`**

```tsx
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { CardStatus } from "@world-cup-game/types";

export function CardStatusBadge({ status }: { status?: CardStatus }) {
  if (status === "generating_avatar") {
    return (
      <View style={styles.badge}>
        <ActivityIndicator size="small" color="#FFF8EA" />
        <Text style={styles.text}>Generating your card…</Text>
      </View>
    );
  }
  if (status === "failed") {
    return (
      <View style={[styles.badge, styles.error]}>
        <Text style={styles.text}>Generation failed — tap retry</Text>
      </View>
    );
  }
  if (status === "moderation_rejected") {
    return (
      <View style={[styles.badge, styles.error]}>
        <Text style={styles.text}>Photo not accepted — try another</Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(12, 59, 46, 0.85)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  error: {
    backgroundColor: "rgba(140, 30, 30, 0.9)"
  },
  text: {
    color: "#FFF8EA",
    fontSize: 13,
    fontWeight: "900"
  }
});
```

- [ ] **Step 2: Render it inside `RenderedPlayerCard`**

In `RenderedPlayerCard.tsx`, import the badge and a derived status, and add it under the card. Add import:

```tsx
import { CardStatusBadge } from "./CardStatusBadge";
```

Change the returned JSX wrapper to include the badge (use the passed `card?.status`):

```tsx
  return (
    <View style={styles.cardWrap}>
      <PlayerCard
        template={template}
        card={{
          /* …unchanged… */
        }}
      />
      <CardStatusBadge status={card?.status} />
    </View>
  );
```

- [ ] **Step 3: Add a pre-sign-up pending label to `card-preview.tsx`**

In `app/(onboarding)/card-preview.tsx`, add a line under `<RenderedPlayerCard .../>`:

```tsx
        <Text style={styles.pending}>Sign up to generate your AI card ✨</Text>
```

And add to its `StyleSheet.create`:

```tsx
  pending: {
    color: "rgba(12, 59, 46, 0.7)",
    fontSize: 14,
    fontWeight: "800",
    marginTop: spacing.md,
    textAlign: "center"
  },
```

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/features/card/components/CardStatusBadge.tsx apps/mobile/src/features/card/components/RenderedPlayerCard.tsx apps/mobile/app/\(onboarding\)/card-preview.tsx
git commit -m "feat(mobile): show generation status on the player card"
```

---

### Task C4: Realtime refetch + push tap handler

**Files:**
- Create: `apps/mobile/src/features/card/hooks/useCardRealtime.ts`
- Modify: `apps/mobile/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create `useCardRealtime.ts`**

```ts
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useQueryClient } from "@tanstack/react-query";
import { registerForPushNotifications } from "../../../lib/pushNotifications";
import { supabase } from "../../../lib/supabase";
import { useSession } from "../../../hooks/useSession";

/** Mount once inside the authenticated tab tree. */
export function useCardRealtime() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  useEffect(() => {
    if (!user) return;

    void registerForPushNotifications();

    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: ["current-card", user.id] });

    const channel = supabase
      .channel(`cards:${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "cards", filter: `user_id=eq.${user.id}` },
        invalidate
      )
      .subscribe();

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const type = response.notification.request.content.data?.type;
      if (type === "CARD_READY") invalidate();
    });

    return () => {
      supabase.removeChannel(channel);
      sub.remove();
    };
  }, [queryClient, user]);
}
```

- [ ] **Step 2: Mount it in the tabs layout**

In `apps/mobile/app/(tabs)/_layout.tsx`, import and call the hook inside the layout component body:

```tsx
import { useCardRealtime } from "../../src/features/card/hooks/useCardRealtime";
```

```tsx
  useCardRealtime();
```

(Add the call at the top of the default-exported component, before the returned JSX.)

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/card/hooks/useCardRealtime.ts apps/mobile/app/\(tabs\)/_layout.tsx
git commit -m "feat(mobile): refetch card on realtime update and push tap"
```

---

### Task C5: Manual end-to-end validation

**Files:** none

- [ ] **Step 1: Typecheck the whole repo**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 2: Run the app on a device** (push requires a physical device)

Run: `pnpm dev:mobile` (or a dev build per README for OAuth). Restart with cache clear if you just installed deps: stop, then `pnpm --filter mobile start -- -c`.

- [ ] **Step 3: Walk the flow**

Onboard → select nation → take/upload photo → name → preview shows raw photo + "Sign up to generate" → sign up → land on home → open Card tab → see "Generating your card…" over the raw photo → within ~40s (or on push tap) the card flips to the AI avatar.

- [ ] **Step 4: Force-fail path** — temporarily set an invalid `OPENAI_API_KEY` secret, regenerate, confirm `status='failed'` and the "Generation failed" badge. Restore the key.

- [ ] **Step 5: Commit** any small fixes found during validation, then verify the branch is green:

```bash
pnpm typecheck
git status
```

---

## PHASE D — Optional stretch: seamless masked edit

> Only do this if the baseline beige-paper seam is unacceptable. It removes the rectangular seam by repainting only the avatar window onto the real card paper.

### Task D1: Window mask + masked edit

**Files:**
- Create: `design/card-templates/level-00-sketch-v1/avatar-window-mask.png`
- Modify: `scripts/experiments/card-image-spike.mjs` (prove it first)
- Modify: `supabase/functions/generate-card-avatar/openai.ts` (accept a mask + composited base)

- [ ] **Step 1: Generate the mask** from the template metadata (avatar window `x:235 y:220 w:565 h:735` on a 1024×1536 canvas). Add a one-off Node snippet using `sharp`: a fully-opaque white image with a transparent rectangle at the window. Save to the path above.

- [ ] **Step 2: Prove the masked edit in the spike** — extend `card-image-spike.mjs` with a `Variant C`: composite the photo into the window of `base-card.png`, send `image[]=[compositedCard]`, `mask=avatar-window-mask.png`, prompt "redraw the person in the window as a hand-drawn footballer blending into the paper." Run `node scripts/experiments/card-image-spike.mjs` and `open scripts/experiments/out/card_C.png`. Confirm the seam is gone.

- [ ] **Step 3: Port the proven approach into `openai.ts`** (add an optional `mask` + pre-composited base path) and switch `runGeneration` to use it. Re-run Task A6 to validate `status='ready'` and eyeball the result.

- [ ] **Step 4: Commit**

```bash
git add design/card-templates/level-00-sketch-v1/avatar-window-mask.png scripts/experiments/card-image-spike.mjs supabase/functions/generate-card-avatar/openai.ts supabase/functions/generate-card-avatar/index.ts
git commit -m "feat(fn): seamless masked-edit avatar generation"
```

---

## Self-Review Notes

- **Spec coverage:** async generation (A5/B3/C4), push-first (B1–B3, C4), Variant A windowed avatar + overlay (renderer unchanged + C3), gpt-image-2 only/medium/1024×1536 (A4), key as secret (A1), failure→retry / moderation→re-upload (A5 statuses + C3 badge; retry UI wiring is the badge tap — see note below), private `card-generated` reuse + signed URLs (C1), `device_push_tokens` (B1), Surprise-Me text-to-image (A4/A5/C2). Seam fix (D1).
- **Retry action:** Task C3 shows the failed/moderation states. The actual retry button handler re-calls `startCardGeneration(card.id)` (failed) or routes to `photo-booth` (moderation). Wire it on the badge press in C3 if the engineer wants it interactive in this pass; otherwise the manual retry is acceptable for MVP and the badge is informational.
- **Type consistency:** `startCardGeneration(cardId: string)`, `getCardGeneratedDisplayUrl(path)`, `buildAvatarPrompt({nationName,kitDescription,mode})`, `generateAvatarImage({apiKey,prompt,sourceImage?})`, `parseGenerateCardAvatarRequest → {cardId}` are used consistently across tasks.
- **Known environment caveats:** `EdgeRuntime.waitUntil` under local `policy="oneshot"` (A6 note); `expo-notifications` needs a physical device + a dev build for real push (C5); after dep installs restart Metro with `-c`.

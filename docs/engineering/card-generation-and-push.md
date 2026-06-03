# Card Generation, Prompting, and Push Notifications

This guide is for future agents changing the onboarding AI card flow. It covers
the production path as implemented today: OpenAI image generation through
Supabase Edge Functions, private Storage, Realtime refresh, and Expo push
notifications.

## System Map

Mobile entry points:

- `apps/mobile/src/features/onboarding/api/saveCompletedOnboarding.ts` creates
  the card and starts generation.
- `apps/mobile/src/features/card/api/startCardGeneration.ts` invokes
  `generate-card-avatar`.
- `apps/mobile/src/features/card/hooks/useCardRealtime.ts` registers push
  notifications, listens for card table updates, and refreshes the current card.
- `apps/mobile/src/lib/pushNotifications.ts` gets the Expo push token and sets
  foreground notification behavior.
- `apps/mobile/src/features/notifications/api/savePushToken.ts` sends the token
  to the `register-push-token` Edge Function.

Supabase pieces:

- `supabase/functions/generate-card-avatar/` runs the OpenAI call, writes the
  generated image, marks the card ready, and sends the card-ready push.
- `supabase/functions/register-push-token/index.ts` verifies the signed-in user
  and upserts the Expo push token with the service role.
- `supabase/migrations/000020_device_push_tokens.sql` stores device tokens with
  RLS.
- `supabase/migrations/000021_card_generation_error_messages.sql` stores
  generation failure details.
- `supabase/migrations/000022_card_generation_push_results.sql` stores push
  diagnostics on each generation row.
- Storage buckets: `card-uploads` for source photos and `card-generated` for
  generated private PNGs.

## Generation Flow

1. Onboarding uploads the user photo to `card-uploads`.
2. The app creates a `cards` row with `avatar_source_url`.
3. The app invokes `generate-card-avatar` with `{ cardId }`.
4. The function authenticates the caller from the JWT, then verifies card
   ownership with a service-role client.
5. The card status becomes `generating_avatar`.
6. A `card_generations` row is inserted with `status = 'pending'`.
7. `EdgeRuntime.waitUntil(...)` continues the work after the HTTP request returns
   `202`.
8. The function downloads the source image if one exists, builds the prompt, and
   calls OpenAI `gpt-image-2`.
9. The generated PNG is uploaded to `card-generated`.
10. The card is updated to `status = 'ready'` with `avatar_generated_url`.
11. The function sends Expo push notifications to saved device tokens.
12. The app refreshes via Supabase Realtime, foreground app-state refresh, or
    push notification listeners.

If generation fails, the function updates:

- `cards.status` to `failed` or `moderation_rejected`
- `card_generations.status`
- `card_generations.error_message`

## Editing The Card Prompt

The prompt lives in:

```txt
supabase/functions/generate-card-avatar/prompt.ts
```

`buildAvatarPrompt()` has two modes:

- `edit`: used when the user uploaded a photo. Preserve the user identity, pose,
  posture, body/head/shoulder angle, expression, silhouette, and camera
  perspective as much as possible.
- `generate`: used when there is no input photo. It can invent a plausible
  footballer and use a generic hero pose.

The current prompt is intentionally strict about brand safety and visual fit:

- no card frame or border
- no text, letters, or numbers
- no logos, crests, badges, flags, sponsors, or readable markings
- plain beige paper background
- unbranded kit inspired by the selected nation colors

When changing prompt wording:

1. Keep the `edit` and `generate` prompts separate. Do not put generic pose
   instructions in `SHARED`, because that can override the uploaded photo pose.
2. Preserve the no-logo/no-text constraints unless the renderer changes to mask
   or post-process those artifacts.
3. Update `supabase/functions/generate-card-avatar/prompt_test.ts` with any new
   required phrase or behavior.
4. Run:

   ```sh
   pnpm typecheck
   git diff --check
   deno test supabase/functions/generate-card-avatar/prompt_test.ts
   ```

   If `deno` is not installed locally, note that in the final report.

5. Deploy the updated function:

   ```sh
   supabase functions deploy generate-card-avatar --project-ref hnwrhkrzvjesjrtjpjtm --use-api
   ```

Do not expose the OpenAI key to Expo/mobile code. The hosted secret is
`OPENAI_API_KEY` in Supabase Edge Function secrets. Local function testing reads
`supabase/functions/.env`.

## Push Notification Flow

The app uses Expo push notifications, not direct APNs/FCM calls.

1. On app start for a signed-in user, `useCardRealtime()` calls
   `registerForPushNotifications()`.
2. `pushNotifications.ts` dynamically imports `expo-notifications`, configures
   foreground display with `setNotificationHandler`, requests permission, and
   gets the Expo push token with the EAS project ID from app config.
3. `savePushToken()` invokes `register-push-token`.
4. `register-push-token` verifies the JWT and upserts into
   `device_push_tokens` with the service role.
5. `generate-card-avatar` queries `device_push_tokens` after a successful card
   generation and posts to `https://exp.host/--/api/v2/push/send`.
6. The function records Expo's response in `card_generations.push_response`.

Why token registration uses an Edge Function:

- Direct client upsert can fail RLS when the same device token already belongs
  to a previous signed-in user.
- RLS should stay strict on `device_push_tokens`.
- The Edge Function verifies the user and then safely reclaims the token for the
  current account with the service role.

## iOS Credentials

For iOS delivery, Expo must have APNs credentials for:

```txt
owner: internationalventurestudio
slug: gogaffa
bundle id: com.ivs.gogaffa
```

If `card_generations.push_response` contains `InvalidCredentials` and mentions
missing APNs credentials, run from the Expo app directory:

```sh
cd apps/mobile
pnpm dlx eas-cli@latest credentials -p ios
```

Choose:

```txt
development
Push Notifications: Manage your Apple Push Notifications Key
Set up your project to use Push Notifications
```

Let EAS generate/manage the key if prompted. After changing native credentials,
the installed development build may need to be rebuilt and reinstalled.

## Diagnostics

Start with hosted generation rows:

```sql
select
  id,
  card_id,
  status,
  error_message,
  push_token_count,
  push_response,
  push_sent_at,
  created_at
from public.card_generations
order by created_at desc
limit 10;
```

Interpretation:

- `push_token_count = 0`: the app did not register a push token for that user.
  Check mobile logs for token registration warnings and confirm notification
  permission is granted.
- `push_response.statusCode != 200`: Expo's push API request failed.
- `push_response.response.data[*].status = "error"`: Expo accepted the HTTP
  request but rejected one or more tickets. Read `details.error`.
- `InvalidCredentials`: fix APNs credentials through EAS.
- `DeviceNotRegistered`: remove stale tokens or let a fresh registration replace
  them.

Useful Supabase checks:

```sh
supabase functions list --project-ref hnwrhkrzvjesjrtjpjtm
supabase functions deploy register-push-token --project-ref hnwrhkrzvjesjrtjpjtm --use-api
supabase functions deploy generate-card-avatar --project-ref hnwrhkrzvjesjrtjpjtm --use-api
```

Use Supabase function logs for request-level evidence. The function also writes
structured failure data to `card_generations`, which is usually faster to inspect
than raw logs.

## Verification Checklist

For prompt-only changes:

- `pnpm typecheck`
- `git diff --check`
- `deno test supabase/functions/generate-card-avatar/prompt_test.ts` if Deno is
  available
- Deploy `generate-card-avatar`
- Generate a new card with an uploaded photo and verify pose preservation

For push changes:

- `pnpm typecheck`
- `git diff --check`
- Deploy changed Edge Function(s)
- Reload the dev app
- Confirm no mobile log warning from `Failed to persist push token`
- Generate a new card; existing ready cards do not send retroactive pushes
- Inspect `card_generations.push_response` if the phone does not show a
  notification

# Live Scoring

The app does not call the third-party score source directly. A Supabase Edge
Function polls the upstream API, caches score state in `public.matches`, and the
mobile app reads the cached rows from Supabase.

Reference source: https://github.com/rezarahiminia/worldcup2026. A local clone
may live under `docs/external/` for inspection, but that directory is ignored and
should not be committed.

## Data Flow

1. `sync-match-scores` checks the cached schedule in `public.matches`.
2. It fetches `https://worldcup26.ir/get/games` only when a match is in the
   active polling window, when a cached match is already `live`, or when called
   with `{ "force": true }`.
3. It maps upstream ids to our committed schedule `match_num`.
4. It updates `public.matches.status`, `home_score`, `away_score`, and
   `score_synced_at`.
5. Mobile reads `match_num`, `status`, scores, and sync timestamp from
   `public.matches`.

Static fixture rendering remains the fallback. If score sync fails, Schedule and
Home still show the committed schedule.

## Production Setup

Set a server-only sync secret:

```bash
supabase secrets set SYNC_MATCH_SCORES_SECRET="<random-long-secret>" --project-ref <project-ref>
```

Deploy the function with JWT verification disabled because the function performs
its own secret check:

```bash
supabase functions deploy sync-match-scores --no-verify-jwt --project-ref <project-ref>
```

Production currently uses Supabase Vault + `pg_cron` + `pg_net`:

- Edge Function secret: `SYNC_MATCH_SCORES_SECRET`
- Vault secret name: `sync_match_scores_secret`
- Cron job name: `sync-match-scores-every-minute`
- Schedule: every minute (`* * * * *`)
- Upstream fetch window: 15 minutes before kickoff through 4 hours after kickoff,
  plus any time a cached match is marked `live`

The cron job sends a `POST` request to:

```text
https://<project-ref>.supabase.co/functions/v1/sync-match-scores
```

It includes this header, read from Vault at runtime:

```text
x-sync-secret: <SYNC_MATCH_SCORES_SECRET>
```

Recommended MVP cadence: keep cron at every 1 minute. The Edge Function skips
the upstream request outside active match windows and returns:

```json
{
  "source": "worldcup26.ir",
  "skipped": true,
  "reason": "no_active_match_window",
  "nextPollAt": "2026-06-15T15:45:00.000Z"
}
```

To confirm the job is active:

```sql
select jobid, jobname, schedule, active
from cron.job
where jobname = 'sync-match-scores-every-minute';
```

To confirm recent runs:

```sql
select jobid, status, start_time, end_time, return_message
from cron.job_run_details
where jobid = 1
order by start_time desc
limit 5;
```

## Local Test

Serve the function:

```bash
supabase functions serve sync-match-scores --env-file /tmp/gogaffa-sync-match-scores.env --no-verify-jwt
```

Invoke it:

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/sync-match-scores \
  -H "Authorization: Bearer <SYNC_MATCH_SCORES_SECRET>" \
  -H "Content-Type: application/json" \
  -d "{\"force\": true}"
```

Expected sync response shape:

```json
{
  "source": "worldcup26.ir",
  "fetched": 104,
  "forced": true,
  "updated": 104,
  "live": 1,
  "completed": 10,
  "missingSourceIds": [],
  "syncedAt": "2026-06-15T00:33:56.285Z"
}
```

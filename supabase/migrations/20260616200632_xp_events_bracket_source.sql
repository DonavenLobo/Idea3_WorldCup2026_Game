-- Allow bracket scoring to emit xp_events rows.
--
-- The score-bracket edge function upserts a single xp_events row per
-- (user_id, bracket id) so the leaderboard reflects each user's current
-- bracket total. To support that:
--   1. Extend the source_type CHECK constraint to allow 'bracket'.
--   2. Add a partial unique index on (user_id, source_type, source_id)
--      restricted to bracket events. Other source types (daily_trivia,
--      daily_login, match_prediction, etc.) intentionally append rather
--      than upsert, so we keep the uniqueness scoped to bracket only.

alter table public.xp_events
  drop constraint if exists xp_events_source_type_check;

alter table public.xp_events
  add constraint xp_events_source_type_check check (
    source_type in (
      'daily_trivia',
      'daily_login',
      'match_prediction',
      'match_bounty',
      'streak',
      'locker_purchase',
      'admin_grant',
      'bracket'
    )
  );
-- Note: 'daily_login' is also included here because claim-daily-login already
-- emits rows with that source_type; the original 000008 CHECK omitted it.
-- This migration is the right place to close that gap alongside adding
-- 'bracket'.

create unique index if not exists xp_events_bracket_user_source_uniq
  on public.xp_events (user_id, source_id)
  where source_type = 'bracket';

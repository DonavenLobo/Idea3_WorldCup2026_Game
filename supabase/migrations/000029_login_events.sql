-- 000029_login_events.sql
-- Records one row per daily-login claim. Enforces 1-claim-per-day per user via unique constraint.
-- Used by claim-daily-login edge function (PR-A).

create table if not exists public.login_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  login_date      date not null,
  points_awarded  integer not null,
  milestone_bonus integer not null default 0,
  streak_after    integer not null,
  created_at      timestamptz not null default now()
);

create unique index if not exists login_events_user_day_uniq
  on public.login_events (user_id, login_date);

create index if not exists login_events_user_created_idx
  on public.login_events (user_id, created_at desc);

alter table public.login_events enable row level security;

-- Users can read only their own login events.
create policy "login_events_select_own"
  on public.login_events
  for select
  to authenticated
  using (user_id = auth.uid());

-- No client-side INSERT/UPDATE/DELETE — only the edge function (service-role) writes.
-- (No explicit policy → blocked under RLS.)

comment on table public.login_events is 'PR-A: one row per daily-login claim. Uniqueness on (user_id, login_date) is the de-dupe key.';
comment on column public.login_events.points_awarded is 'Total points awarded for this claim, including any milestone bonus.';
comment on column public.login_events.milestone_bonus is 'Milestone bonus portion (0 unless a streak milestone was hit).';
comment on column public.login_events.streak_after is 'The newStreak value that resulted from this claim, persisted for audit.';

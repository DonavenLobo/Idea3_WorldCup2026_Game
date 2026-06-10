-- 000030_profile_streak_columns.sql
-- Adds streak + last-login bookkeeping columns to profiles for PR-A.
-- Read by claim-daily-login and score-trivia-attempt edge functions.

alter table public.profiles
  add column if not exists current_login_streak     integer not null default 0,
  add column if not exists longest_login_streak     integer not null default 0,
  add column if not exists last_login_date          date,
  add column if not exists current_trivia_streak    integer not null default 0,
  add column if not exists longest_trivia_streak    integer not null default 0,
  add column if not exists perfect_knockout_run     boolean not null default false;

comment on column public.profiles.current_login_streak  is 'PR-A: consecutive-day login count. Reset on miss. Updated by claim-daily-login.';
comment on column public.profiles.longest_login_streak  is 'PR-A: highest-ever current_login_streak. Persisted for the lifetime of the account.';
comment on column public.profiles.last_login_date       is 'PR-A: most recent date a login was claimed (user-local date key persisted as a Postgres date).';
comment on column public.profiles.current_trivia_streak is 'PR-A: consecutive perfect-day trivia run. Advances on 3/3 days only. Reset on any non-perfect day.';
comment on column public.profiles.longest_trivia_streak is 'PR-A: highest-ever current_trivia_streak.';
comment on column public.profiles.perfect_knockout_run  is 'PR-A: true if the user predicted every KO match correctly (eligible for PERFECT_KNOCKOUT_RUN_BONUS). Set by score-bracket.';

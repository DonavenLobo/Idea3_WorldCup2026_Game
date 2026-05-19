create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null,
  source_id uuid,
  currency_type text not null,
  amount integer not null check (amount >= 0),
  reason text not null,
  counts_toward_leaderboard boolean not null default false,
  created_at timestamptz not null default now(),
  constraint xp_events_currency_type_check check (
    currency_type in ('competitive_points', 'earned_xp', 'locker_credits', 'purchased_credits')
  ),
  constraint xp_events_source_type_check check (
    source_type in (
      'daily_trivia',
      'match_prediction',
      'match_bounty',
      'streak',
      'locker_purchase',
      'admin_grant'
    )
  ),
  constraint paid_never_counts_toward_leaderboard check (
    not (source_type = 'locker_purchase' and counts_toward_leaderboard = true)
  ),
  constraint bounties_do_not_count_toward_leaderboard check (
    not (source_type = 'match_bounty' and counts_toward_leaderboard = true)
  )
);

create table if not exists public.wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  competitive_points integer not null default 0,
  earned_xp integer not null default 0,
  locker_credits integer not null default 0,
  purchased_credits integer not null default 0,
  streak_saves integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.xp_events enable row level security;
alter table public.wallets enable row level security;

create policy "Users can read their own xp events"
  on public.xp_events for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can read their own wallet"
  on public.wallets for select
  to authenticated
  using (auth.uid() = user_id);

comment on table public.xp_events is
  'Client must not insert XP directly. Use controlled backend functions so paid credits never affect competitive scoring.';

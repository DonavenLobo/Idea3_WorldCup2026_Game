create table if not exists public.match_bounties (
  id uuid primary key default gen_random_uuid(),
  match_id text not null,
  prompt text not null,
  answer_options jsonb not null,
  correct_answer_key text check (correct_answer_key in ('A', 'B', 'C', 'D')),
  reward_type text not null,
  reward_label text not null,
  reward_metadata jsonb not null default '{}'::jsonb,
  difficulty text not null default 'standard',
  open_time timestamptz not null,
  lock_time timestamptz not null,
  result_status text not null default 'scheduled',
  created_at timestamptz not null default now(),
  constraint match_bounties_result_status_check check (
    result_status in ('scheduled', 'open', 'locked', 'scored', 'void')
  ),
  constraint match_bounties_reward_type_check check (
    reward_type in (
      'exclusive_cosmetic',
      'temporary_visual_effect',
      'card_stat_upgrade',
      'rarity_progress',
      'streak_save_coupon',
      'limited_event_badge'
    )
  )
);

create table if not exists public.bounty_attempts (
  id uuid primary key default gen_random_uuid(),
  bounty_id uuid not null references public.match_bounties(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_revealed_at timestamptz,
  selected_answer_key text check (selected_answer_key in ('A', 'B', 'C', 'D')),
  is_correct boolean,
  reward_granted boolean not null default false,
  created_at timestamptz not null default now(),
  unique (bounty_id, user_id)
);

alter table public.match_bounties enable row level security;
alter table public.bounty_attempts enable row level security;

create policy "Authenticated users can read open bounties"
  on public.match_bounties for select
  to authenticated
  using (true);

create policy "Users can read their own bounty attempts"
  on public.bounty_attempts for select
  to authenticated
  using (auth.uid() = user_id);

comment on table public.match_bounties is
  'Bounty rewards are deterministic after reveal and never award Competitive Points.';

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  invite_code text not null unique,
  default_leaderboard_type text not null default 'daily_trivia',
  created_at timestamptz not null default now(),
  constraint groups_default_leaderboard_check check (
    default_leaderboard_type in (
      'daily_trivia',
      'overall_competitive_points',
      'prediction_accuracy',
      'card_showcase'
    )
  )
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  preferred_default_leaderboard_type text,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id),
  constraint group_members_role_check check (role in ('owner', 'admin', 'member')),
  constraint group_members_preferred_default_check check (
    preferred_default_leaderboard_type is null or preferred_default_leaderboard_type in (
      'daily_trivia',
      'overall_competitive_points',
      'prediction_accuracy',
      'card_showcase'
    )
  )
);

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members
    where group_members.group_id = target_group_id
      and group_members.user_id = auth.uid()
  );
$$;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

create policy "Group members can read groups"
  on public.groups for select
  to authenticated
  using (public.is_group_member(groups.id));

create policy "Users can create groups they own"
  on public.groups for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Owners can update groups"
  on public.groups for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Group members can read memberships"
  on public.group_members for select
  to authenticated
  using (public.is_group_member(group_members.group_id));

create policy "Users can join groups as themselves"
  on public.group_members for insert
  to authenticated
  with check (auth.uid() = user_id);

create table if not exists public.brackets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  picks jsonb not null,
  score integer not null default 0,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brackets enable row level security;

create policy "Users can read their own brackets"
  on public.brackets for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own brackets"
  on public.brackets for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update unlocked own brackets"
  on public.brackets for update
  to authenticated
  using (auth.uid() = user_id and locked_at is null)
  with check (auth.uid() = user_id);

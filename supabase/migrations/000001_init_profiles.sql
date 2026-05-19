create extension if not exists pgcrypto;

create table if not exists public.nations (
  code text primary key,
  name text not null,
  flag_emoji text not null,
  confederation text,
  primary_color text not null,
  secondary_color text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  selected_nation_code text references public.nations(code),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.nations enable row level security;
alter table public.profiles enable row level security;

create policy "Nations are public readable"
  on public.nations for select
  using (true);

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

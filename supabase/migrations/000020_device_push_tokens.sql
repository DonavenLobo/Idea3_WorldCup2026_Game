create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists device_push_tokens_user_id_idx
  on public.device_push_tokens (user_id);

alter table public.device_push_tokens enable row level security;

create policy "Users manage their own push tokens (select)"
  on public.device_push_tokens for select
  to authenticated using (auth.uid() = user_id);

create policy "Users manage their own push tokens (insert)"
  on public.device_push_tokens for insert
  to authenticated with check (auth.uid() = user_id);

create policy "Users manage their own push tokens (update)"
  on public.device_push_tokens for update
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own push tokens (delete)"
  on public.device_push_tokens for delete
  to authenticated using (auth.uid() = user_id);

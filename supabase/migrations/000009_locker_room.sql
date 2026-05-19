create table if not exists public.locker_items (
  id uuid primary key default gen_random_uuid(),
  item_key text not null unique,
  name text not null,
  item_type text not null,
  rarity text not null,
  price_credits integer,
  asset_url text,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  locker_item_id uuid not null references public.locker_items(id) on delete cascade,
  source text not null,
  acquired_at timestamptz not null default now(),
  unique (user_id, locker_item_id)
);

alter table public.locker_items enable row level security;
alter table public.user_inventory enable row level security;

create policy "Active locker items are readable"
  on public.locker_items for select
  to authenticated
  using (is_active = true);

create policy "Users can read their own inventory"
  on public.user_inventory for select
  to authenticated
  using (auth.uid() = user_id);

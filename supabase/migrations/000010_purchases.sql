create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null,
  product_id text not null,
  transaction_id text not null unique,
  purchase_type text not null,
  amount_cents integer not null,
  status text not null default 'pending',
  raw_receipt jsonb,
  created_at timestamptz not null default now(),
  constraint purchases_platform_check check (platform in ('ios', 'android', 'web')),
  constraint purchases_purchase_type_check check (
    purchase_type in ('card_regeneration', 'locker_credits', 'premium_cosmetic')
  ),
  constraint purchases_status_check check (status in ('pending', 'verified', 'rejected', 'refunded'))
);

alter table public.purchases enable row level security;

create policy "Users can read their own purchases"
  on public.purchases for select
  to authenticated
  using (auth.uid() = user_id);

comment on table public.purchases is
  'Purchase verification must happen server-side. Purchases can grant card/status value only.';

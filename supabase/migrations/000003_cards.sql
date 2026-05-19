create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  template_id uuid not null references public.card_templates(id),
  display_name text not null,
  selected_nation_code text not null references public.nations(code),
  tier text not null default 'bronze',
  overall integer not null default 50 check (overall between 0 and 99),
  stats jsonb not null default '{}'::jsonb,
  avatar_source_url text,
  avatar_generated_url text,
  final_card_url text,
  teaser_card_url text,
  share_slug text unique,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cards_status_check check (
    status in ('draft', 'generating_avatar', 'composing', 'ready', 'failed', 'moderation_rejected')
  ),
  constraint cards_tier_check check (
    tier in ('bronze', 'silver', 'gold', 'elite', 'legend')
  )
);

create table if not exists public.card_generations (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  generation_type text not null,
  source_image_url text,
  generated_image_url text,
  selected boolean not null default false,
  provider text,
  provider_job_id text,
  status text not null default 'pending',
  cost_cents integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.cards enable row level security;
alter table public.card_generations enable row level security;

create policy "Users can read their own cards"
  on public.cards for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own cards"
  on public.cards for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own cards"
  on public.cards for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read their own card generations"
  on public.card_generations for select
  to authenticated
  using (auth.uid() = user_id);

comment on table public.cards is
  'Do not expose this full table publicly. Public share pages should use a safe view/function with teaser_card_url and limited fields.';

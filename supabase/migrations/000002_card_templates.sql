create table if not exists public.card_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  name text not null,
  tier integer not null,
  base_image_url text,
  metadata jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.card_templates enable row level security;

create policy "Active card templates are public readable"
  on public.card_templates for select
  using (is_active = true);

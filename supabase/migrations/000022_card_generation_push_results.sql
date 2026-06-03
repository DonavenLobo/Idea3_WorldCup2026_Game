alter table public.card_generations
  add column if not exists push_token_count integer not null default 0,
  add column if not exists push_response jsonb,
  add column if not exists push_sent_at timestamptz;

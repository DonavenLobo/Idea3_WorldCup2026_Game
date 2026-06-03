alter table public.card_generations
  add column if not exists error_message text;

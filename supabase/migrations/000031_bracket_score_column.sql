-- 000031_bracket_score_column.sql
-- Adds the scored_at timestamp column to public.brackets. The `score` column
-- itself already exists (000006_brackets.sql defines it as
-- `integer not null default 0`). The new `scored_at` column records when the
-- score-bracket edge function last recomputed the total.
alter table public.brackets
  add column if not exists scored_at timestamptz;

comment on column public.brackets.scored_at is
  'PR-A: timestamp of the last score-bracket computation. NULL until the user''s bracket has been scored at least once.';

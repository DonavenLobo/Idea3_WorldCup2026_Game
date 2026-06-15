-- Daily trivia rules: WC-2026 flag on nations + 3-question default.
alter table public.nations
  add column if not exists in_world_cup_2026 boolean not null default false;

alter table public.trivia_attempts
  alter column total_questions set default 3;

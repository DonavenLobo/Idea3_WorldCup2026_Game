create table if not exists public.trivia_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer_options jsonb not null,
  correct_answer_key text not null check (correct_answer_key in ('A', 'B', 'C', 'D')),
  explanation text,
  difficulty text not null default 'standard',
  active_date date not null,
  question_order integer not null,
  nation_code text references public.nations(code),
  created_at timestamptz not null default now(),
  unique (active_date, question_order)
);

create table if not exists public.trivia_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  active_date date not null,
  total_questions integer not null default 5,
  correct_answers integer not null default 0,
  total_response_time_ms integer not null default 0,
  competitive_points integer not null default 0,
  earned_card_xp integer not null default 0,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, active_date)
);

create table if not exists public.trivia_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.trivia_attempts(id) on delete cascade,
  question_id uuid not null references public.trivia_questions(id) on delete cascade,
  selected_answer_key text not null check (selected_answer_key in ('A', 'B', 'C', 'D')),
  is_correct boolean not null,
  response_time_ms integer not null,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

alter table public.trivia_questions enable row level security;
alter table public.trivia_attempts enable row level security;
alter table public.trivia_attempt_answers enable row level security;

create policy "Trivia questions are readable"
  on public.trivia_questions for select
  to authenticated
  using (true);

create policy "Users can read their own trivia attempts"
  on public.trivia_attempts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can read their own trivia answers"
  on public.trivia_attempt_answers for select
  to authenticated
  using (
    exists (
      select 1 from public.trivia_attempts
      where trivia_attempts.id = trivia_attempt_answers.attempt_id
        and trivia_attempts.user_id = auth.uid()
    )
  );

comment on table public.trivia_attempts is
  'First daily attempt only. Writes should go through score-trivia-attempt, not direct client inserts.';

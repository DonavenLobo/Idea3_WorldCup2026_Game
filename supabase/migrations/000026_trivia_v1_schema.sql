-- Trivia v1: switch to 3 questions per day + add citation tracking.
--
-- Renaming this round of changes "v1" because it's the first time we ship real
-- content. Previously the trivia_questions table existed but had no production
-- questions seeded. The 000027 migration seeds 150 questions (3/day for 50 days).
--
-- Changes:
--   1. Default total_questions on trivia_attempts: 5 → 3
--   2. New column trivia_questions.source_url for fact-check citations
--   3. New CHECK constraint enforcing question_order ∈ {1, 2, 3}
--   4. New CHECK enforcing difficulty ∈ {'easy', 'medium', 'hard'}
--      (was: any text, default 'standard')

-- 1. Default for new daily attempts
alter table public.trivia_attempts
  alter column total_questions set default 3;

-- 2. Source URL column on questions (nullable — old questions don't have one)
alter table public.trivia_questions
  add column if not exists source_url text;

-- 3. Wipe stale trivia rows from the pre-v1 5-questions-per-day era.
--    These rows have question_order ∈ {1..5} and freeform difficulty,
--    which violates the new CHECK constraints below. They were test data
--    only — no real user attempts reference them since no production users
--    existed before the App-Store submission build. Trivia attempt rows
--    cascade-delete via FK on trivia_attempt_answers.question_id.
--    The new content gets seeded by 000027 and 000028.
delete from public.trivia_questions;

-- 4. question_order must be 1, 2, or 3 (matches three-tier scoring)
--    Drop any prior constraint with the same name to keep this re-runnable.
alter table public.trivia_questions
  drop constraint if exists trivia_questions_question_order_check;

alter table public.trivia_questions
  add constraint trivia_questions_question_order_check
    check (question_order in (1, 2, 3));

-- 5. difficulty enum
alter table public.trivia_questions
  alter column difficulty set default 'easy';

alter table public.trivia_questions
  drop constraint if exists trivia_questions_difficulty_check;

alter table public.trivia_questions
  add constraint trivia_questions_difficulty_check
    check (difficulty in ('easy', 'medium', 'hard'));

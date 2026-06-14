with days as (
  select generate_series(current_date, current_date + interval '29 days', interval '1 day')::date as active_date
),
daily_questions as (
  select *
  from (
    values
      (
        1,
        'Which country has won the most men''s global football titles?',
        '[{"key":"A","label":"Germany"},{"key":"B","label":"Brazil"},{"key":"C","label":"Italy"},{"key":"D","label":"Argentina"}]'::jsonb,
        'B',
        'Brazil has won the top men''s global football tournament five times.',
        'standard',
        null
      ),
      (
        2,
        'Which three countries are co-hosting the 2026 international football tournament?',
        '[{"key":"A","label":"Brazil, Argentina, Uruguay"},{"key":"B","label":"Spain, Portugal, Morocco"},{"key":"C","label":"USA, Mexico, Canada"},{"key":"D","label":"England, Wales, Scotland"}]'::jsonb,
        'C',
        'The 2026 tournament is co-hosted by the United States, Mexico, and Canada.',
        'standard',
        null
      ),
      (
        3,
        'How many teams will compete in the 2026 international football tournament?',
        '[{"key":"A","label":"32"},{"key":"B","label":"40"},{"key":"C","label":"48"},{"key":"D","label":"64"}]'::jsonb,
        'C',
        'The 2026 tournament expands the field to 48 teams.',
        'standard',
        null
      )
  ) as q(question_order, question, answer_options, correct_answer_key, explanation, difficulty, nation_code)
)
insert into public.trivia_questions (
  active_date,
  question_order,
  question,
  answer_options,
  correct_answer_key,
  explanation,
  difficulty,
  nation_code
)
select
  days.active_date,
  daily_questions.question_order,
  daily_questions.question,
  daily_questions.answer_options,
  daily_questions.correct_answer_key,
  daily_questions.explanation,
  daily_questions.difficulty,
  daily_questions.nation_code
from days
cross join daily_questions
on conflict (active_date, question_order) do update
set
  question = excluded.question,
  answer_options = excluded.answer_options,
  correct_answer_key = excluded.correct_answer_key,
  explanation = excluded.explanation,
  difficulty = excluded.difficulty,
  nation_code = excluded.nation_code;

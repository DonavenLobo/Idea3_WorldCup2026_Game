with days as (
  select generate_series(current_date, current_date + interval '29 days', interval '1 day')::date as active_date
),
daily_questions as (
  select *
  from (
    values
      (
        1,
        'Which country has won the most FIFA World Cups?',
        '[{"key":"A","label":"Germany"},{"key":"B","label":"Brazil"},{"key":"C","label":"Italy"},{"key":"D","label":"Argentina"}]'::jsonb,
        'B',
        'Brazil has won the men''s FIFA World Cup five times.',
        'standard',
        null
      ),
      (
        2,
        'Which three countries are co-hosting the 2026 World Cup?',
        '[{"key":"A","label":"Brazil, Argentina, Uruguay"},{"key":"B","label":"Spain, Portugal, Morocco"},{"key":"C","label":"USA, Mexico, Canada"},{"key":"D","label":"England, Wales, Scotland"}]'::jsonb,
        'C',
        'The 2026 tournament is co-hosted by the United States, Mexico, and Canada.',
        'standard',
        null
      ),
      (
        3,
        'How many teams will compete at the 2026 World Cup?',
        '[{"key":"A","label":"32"},{"key":"B","label":"40"},{"key":"C","label":"48"},{"key":"D","label":"64"}]'::jsonb,
        'C',
        'The 2026 World Cup expands the field to 48 teams.',
        'standard',
        null
      ),
      (
        4,
        'Which African nation reached the semi-finals of the 2022 World Cup?',
        '[{"key":"A","label":"Senegal"},{"key":"B","label":"Morocco"},{"key":"C","label":"Cameroon"},{"key":"D","label":"Ghana"}]'::jsonb,
        'B',
        'Morocco became the first African team to reach a men''s World Cup semi-final.',
        'standard',
        null
      ),
      (
        5,
        'Who is the all-time top scorer in men''s FIFA World Cup history?',
        '[{"key":"A","label":"Pele"},{"key":"B","label":"Ronaldo (Brazil)"},{"key":"C","label":"Miroslav Klose"},{"key":"D","label":"Gerd Muller"}]'::jsonb,
        'C',
        'Miroslav Klose scored 16 goals across World Cup tournaments.',
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

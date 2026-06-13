update public.locker_items
set
  name = 'Tournament ''26',
  metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{emoji}', '"26"', true)
where item_key = 'badge-wc26';

with replacement_trivia(question_order, question, explanation) as (
  values
    (
      1,
      'Which country has won the most men''s global football titles?',
      'Brazil has won the top men''s global football tournament five times.'
    ),
    (
      2,
      'Which three countries are co-hosting the 2026 international football tournament?',
      'The 2026 tournament is co-hosted by the United States, Mexico, and Canada.'
    ),
    (
      3,
      'How many teams will compete in the 2026 international football tournament?',
      'The 2026 tournament expands the field to 48 teams.'
    ),
    (
      4,
      'Which African nation reached the semi-finals of the 2022 global football tournament?',
      'Morocco became the first African team to reach a men''s global football tournament semi-final.'
    ),
    (
      5,
      'Who is the all-time top scorer in men''s global football tournament history?',
      'Miroslav Klose scored 16 goals across the top men''s global football tournament.'
    )
)
update public.trivia_questions
set
  question = replacement_trivia.question,
  explanation = replacement_trivia.explanation
from replacement_trivia
where trivia_questions.question_order = replacement_trivia.question_order
  and (
    trivia_questions.question ilike '%fifa%'
    or trivia_questions.question ilike '%world cup%'
    or trivia_questions.explanation ilike '%fifa%'
    or trivia_questions.explanation ilike '%world cup%'
  );

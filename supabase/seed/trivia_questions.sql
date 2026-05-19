insert into public.trivia_questions (
  question,
  answer_options,
  correct_answer_key,
  explanation,
  difficulty,
  active_date,
  question_order
)
values
  (
    'Which country hosted the 1994 men''s World Cup?',
    '[{"key":"A","label":"United States"},{"key":"B","label":"Brazil"},{"key":"C","label":"France"},{"key":"D","label":"Mexico"}]'::jsonb,
    'A',
    'The United States hosted the 1994 tournament.',
    'standard',
    current_date,
    1
  ),
  (
    'How many answer options should each MVP trivia question have?',
    '[{"key":"A","label":"2"},{"key":"B","label":"3"},{"key":"C","label":"4"},{"key":"D","label":"5"}]'::jsonb,
    'C',
    'The MVP format uses four options per question.',
    'standard',
    current_date,
    2
  )
on conflict (active_date, question_order) do nothing;

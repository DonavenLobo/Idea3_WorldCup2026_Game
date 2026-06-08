-- Trivia v1 seed — PILOT (9 questions, 3 days)
-- This is a quality-check batch before bulk-generating the remaining 141 questions
-- for days 4–50 (Jun 8 → Jul 24, 2026).
--
-- Format conventions baked in here:
--   * 3 questions per day, ordered easy → medium → hard
--   * difficulty matches question_order (Q1=easy, Q2=medium, Q3=hard)
--   * answer_options is a 4-element JSON array of { key, label } where key ∈ A/B/C/D
--   * explanation is 1–2 sentences, shown after the user submits
--   * source_url cites the primary fact source (Wikipedia preferred for stability)
--   * nation_code populated when the question is centrally about one nation
--
-- All facts double-checked against Wikipedia / FIFA archives as of June 2026.

insert into public.trivia_questions
  (question, answer_options, correct_answer_key, explanation, difficulty, active_date, question_order, nation_code, source_url)
values

-- ────────────────────────────────────────────────────────────────────────────
-- Day 1 · June 5, 2026 · Theme: World Cup foundations
-- ────────────────────────────────────────────────────────────────────────────

(
  'Which country hosted the first FIFA World Cup in 1930?',
  '[{"key":"A","label":"Brazil"},{"key":"B","label":"Uruguay"},{"key":"C","label":"Italy"},{"key":"D","label":"England"}]'::jsonb,
  'B',
  'Uruguay hosted the inaugural 1930 tournament and also won it, defeating Argentina 4–2 in the final at the Estadio Centenario.',
  'easy',
  '2026-06-05',
  1,
  'URU',
  'https://en.wikipedia.org/wiki/1930_FIFA_World_Cup'
),
(
  'Who scored the first goal in World Cup history?',
  '[{"key":"A","label":"Bert Patenaude (USA)"},{"key":"B","label":"Lucien Laurent (France)"},{"key":"C","label":"Guillermo Stábile (Argentina)"},{"key":"D","label":"Pedro Cea (Uruguay)"}]'::jsonb,
  'B',
  'Lucien Laurent scored for France in their 4–1 win over Mexico on July 13, 1930 — the very first goal in World Cup history.',
  'medium',
  '2026-06-05',
  2,
  'FRA',
  'https://en.wikipedia.org/wiki/Lucien_Laurent'
),
(
  'How many teams competed in the 1930 World Cup?',
  '[{"key":"A","label":"8"},{"key":"B","label":"13"},{"key":"C","label":"16"},{"key":"D","label":"24"}]'::jsonb,
  'B',
  '13 nations took part in 1930 — well below the 16 originally hoped for, as the long boat journey to South America discouraged European teams from entering.',
  'hard',
  '2026-06-05',
  3,
  null,
  'https://en.wikipedia.org/wiki/1930_FIFA_World_Cup'
),

-- ────────────────────────────────────────────────────────────────────────────
-- Day 2 · June 6, 2026 · Theme: Brazil's dominance
-- ────────────────────────────────────────────────────────────────────────────

(
  'How many FIFA World Cups has Brazil won, more than any other nation?',
  '[{"key":"A","label":"3"},{"key":"B","label":"4"},{"key":"C","label":"5"},{"key":"D","label":"6"}]'::jsonb,
  'C',
  'Brazil has won the World Cup 5 times: 1958, 1962, 1970, 1994, and 2002. Germany and Italy share second place with 4 each.',
  'easy',
  '2026-06-06',
  1,
  'BRA',
  'https://en.wikipedia.org/wiki/Brazil_at_the_FIFA_World_Cup'
),
(
  'In which year did Pelé win his first World Cup with Brazil, aged just 17?',
  '[{"key":"A","label":"1954"},{"key":"B","label":"1958"},{"key":"C","label":"1962"},{"key":"D","label":"1966"}]'::jsonb,
  'B',
  'Pelé was 17 when Brazil won the 1958 World Cup in Sweden, scoring twice in the final against the hosts. He remains the youngest player to win a World Cup.',
  'medium',
  '2026-06-06',
  2,
  'BRA',
  'https://en.wikipedia.org/wiki/Pel%C3%A9'
),
(
  'Who was Brazil''s top scorer at the 1970 World Cup, often called the greatest team ever?',
  '[{"key":"A","label":"Pelé"},{"key":"B","label":"Jairzinho"},{"key":"C","label":"Rivellino"},{"key":"D","label":"Tostão"}]'::jsonb,
  'B',
  'Jairzinho scored in every match of the 1970 tournament — the only player ever to do so in a single World Cup edition — finishing with 7 goals.',
  'hard',
  '2026-06-06',
  3,
  'BRA',
  'https://en.wikipedia.org/wiki/Jairzinho'
),

-- ────────────────────────────────────────────────────────────────────────────
-- Day 3 · June 7, 2026 · Theme: 2026 tournament & format
-- ────────────────────────────────────────────────────────────────────────────

(
  'How many countries are co-hosting the 2026 World Cup?',
  '[{"key":"A","label":"1"},{"key":"B","label":"2"},{"key":"C","label":"3"},{"key":"D","label":"4"}]'::jsonb,
  'C',
  'The 2026 World Cup is co-hosted by Canada, Mexico, and the United States — the first time three nations have shared hosting duties.',
  'easy',
  '2026-06-07',
  1,
  null,
  'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup'
),
(
  'How many teams qualified for the expanded 2026 World Cup, up from 32 in 2022?',
  '[{"key":"A","label":"40"},{"key":"B","label":"44"},{"key":"C","label":"48"},{"key":"D","label":"52"}]'::jsonb,
  'C',
  'The 2026 tournament expanded to 48 teams, organized into 12 groups of 4. The Round of 32 was added to accommodate the extra teams.',
  'medium',
  '2026-06-07',
  2,
  null,
  'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup'
),
(
  'Which stadium will host the 2026 World Cup Final on July 19, 2026?',
  '[{"key":"A","label":"SoFi Stadium, Los Angeles"},{"key":"B","label":"MetLife Stadium, New York/New Jersey"},{"key":"C","label":"Estadio Azteca, Mexico City"},{"key":"D","label":"AT&T Stadium, Dallas"}]'::jsonb,
  'B',
  'MetLife Stadium in East Rutherford, New Jersey will host the 2026 final. It is the home stadium of the NFL''s New York Giants and Jets, with capacity around 82,500.',
  'hard',
  '2026-06-07',
  3,
  null,
  'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_final'
)
on conflict (active_date, question_order) do nothing;

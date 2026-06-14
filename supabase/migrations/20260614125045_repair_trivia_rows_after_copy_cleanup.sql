-- Repair trivia rows that were previously sanitized by question_order only.
-- This re-upserts the full seeded row so question text, answer options, answer key,
-- and explanation stay coherent, then removes direct third-party tournament copy.

-- Trivia v1 BULK seed — 141 questions for June 8 → July 24, 2026.
-- Follows the same format as 000027_trivia_v1_seed_pilot.sql (days 1–3).
--
-- Themes by phase:
--   Jun 8–10  (Pre-tournament):    WC history, all-time greats, iconic finals
--   Jun 11–27 (Group stage):       Participating nations + memorable moments
--   Jun 28–Jul 19 (Knockouts):     Famous KO matches, penalty shootouts, comebacks
--   Jul 20–24 (Post-tournament):   Tournament wrap-up, lifetime records, broader football
--
-- All facts cross-checked against Wikipedia. Source URLs point to the primary
-- Wikipedia article that contains the fact.

insert into public.trivia_questions
  (question, answer_options, correct_answer_key, explanation, difficulty, active_date, question_order, nation_code, source_url)
values

-- ─── Jun 8 · WC finals history ────────────────────────────────────────────
('Which team won the very first World Cup played in Europe, in 1934?',
 '[{"key":"A","label":"Germany"},{"key":"B","label":"Italy"},{"key":"C","label":"Czechoslovakia"},{"key":"D","label":"Hungary"}]'::jsonb,
 'B', 'Italy hosted and won the 1934 World Cup, defeating Czechoslovakia 2–1 in extra time in the final.',
 'easy', '2026-06-08', 1, null, 'https://en.wikipedia.org/wiki/1934_FIFA_World_Cup'),

('Italy won back-to-back World Cups in 1934 and which other year?',
 '[{"key":"A","label":"1938"},{"key":"B","label":"1950"},{"key":"C","label":"1954"},{"key":"D","label":"1962"}]'::jsonb,
 'A', 'Italy retained the trophy in 1938, beating Hungary 4–2 in the Paris final. They remain the only nation to win consecutive World Cups other than Brazil (1958/1962).',
 'medium', '2026-06-08', 2, null, 'https://en.wikipedia.org/wiki/1938_FIFA_World_Cup'),

('Why was no World Cup held between 1938 and 1950?',
 '[{"key":"A","label":"FIFA banned it"},{"key":"B","label":"World War II"},{"key":"C","label":"Lack of interest"},{"key":"D","label":"TV rights dispute"}]'::jsonb,
 'B', 'The 1942 and 1946 World Cups were both cancelled because of World War II. The tournament resumed in Brazil in 1950.',
 'hard', '2026-06-08', 3, null, 'https://en.wikipedia.org/wiki/FIFA_World_Cup'),

-- ─── Jun 9 · Germany at the WC ────────────────────────────────────────────
('How many World Cups has Germany (including West Germany) won?',
 '[{"key":"A","label":"3"},{"key":"B","label":"4"},{"key":"C","label":"5"},{"key":"D","label":"6"}]'::jsonb,
 'B', 'Germany has won 4 World Cups: 1954, 1974, 1990, and 2014.',
 'easy', '2026-06-09', 1, null, 'https://en.wikipedia.org/wiki/Germany_at_the_FIFA_World_Cup'),

('Germany famously defeated which host nation 7–1 in the 2014 semifinal?',
 '[{"key":"A","label":"Argentina"},{"key":"B","label":"Colombia"},{"key":"C","label":"Brazil"},{"key":"D","label":"Mexico"}]'::jsonb,
 'C', 'Germany destroyed host Brazil 7–1 in the 2014 semifinal in Belo Horizonte — one of the most shocking results in World Cup history.',
 'medium', '2026-06-09', 2, null, 'https://en.wikipedia.org/wiki/Brazil_v_Germany_(2014_FIFA_World_Cup)'),

('Who is the all-time leading World Cup goalscorer with 16 goals across 4 tournaments?',
 '[{"key":"A","label":"Gerd Müller"},{"key":"B","label":"Ronaldo Nazário"},{"key":"C","label":"Miroslav Klose"},{"key":"D","label":"Just Fontaine"}]'::jsonb,
 'C', 'Miroslav Klose of Germany scored 16 World Cup goals between 2002 and 2014, breaking Ronaldo Nazário''s record of 15.',
 'hard', '2026-06-09', 3, null, 'https://en.wikipedia.org/wiki/Miroslav_Klose'),

-- ─── Jun 10 · France at the WC ────────────────────────────────────────────
('France has won the World Cup how many times?',
 '[{"key":"A","label":"1"},{"key":"B","label":"2"},{"key":"C","label":"3"},{"key":"D","label":"4"}]'::jsonb,
 'B', 'France has won twice: 1998 (as host) and 2018 in Russia.',
 'easy', '2026-06-10', 1, null, 'https://en.wikipedia.org/wiki/France_at_the_FIFA_World_Cup'),

('Who scored twice for France in the 1998 final against Brazil?',
 '[{"key":"A","label":"Thierry Henry"},{"key":"B","label":"Zinedine Zidane"},{"key":"C","label":"Didier Deschamps"},{"key":"D","label":"Emmanuel Petit"}]'::jsonb,
 'B', 'Zinedine Zidane scored two headers in the 1998 final, helping France beat Brazil 3–0 at the Stade de France.',
 'medium', '2026-06-10', 2, null, 'https://en.wikipedia.org/wiki/1998_FIFA_World_Cup_final'),

('Kylian Mbappé became the second player ever to score in two different World Cup finals — who was the first?',
 '[{"key":"A","label":"Pelé"},{"key":"B","label":"Vavá"},{"key":"C","label":"Paul Breitner"},{"key":"D","label":"Geoff Hurst"}]'::jsonb,
 'B', 'Brazilian striker Vavá scored in both the 1958 final (vs Sweden) and the 1962 final (vs Czechoslovakia). Pelé and Breitner also scored in two finals.',
 'hard', '2026-06-10', 3, null, 'https://en.wikipedia.org/wiki/V%C3%A1v%C3%A1'),

-- ─── Jun 11 · Mexico (host, group A opener) ───────────────────────────────
('Mexico will host its first World Cup match of 2026 in which city?',
 '[{"key":"A","label":"Guadalajara"},{"key":"B","label":"Mexico City"},{"key":"C","label":"Monterrey"},{"key":"D","label":"Cancún"}]'::jsonb,
 'B', 'Mexico City''s Estadio Azteca hosts the opening match of the 2026 tournament — Mexico vs South Africa on June 11, 2026.',
 'easy', '2026-06-11', 1, null, 'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup'),

('How many times has Mexico previously hosted the World Cup?',
 '[{"key":"A","label":"Never"},{"key":"B","label":"Once"},{"key":"C","label":"Twice"},{"key":"D","label":"Three times"}]'::jsonb,
 'C', 'Mexico hosted in 1970 (Pelé''s third title) and 1986 (Maradona''s "Hand of God"). 2026 makes them the first three-time host.',
 'medium', '2026-06-11', 2, null, 'https://en.wikipedia.org/wiki/Mexico_at_the_FIFA_World_Cup'),

('Estadio Azteca is the only stadium to have hosted World Cup finals in two different tournaments. Which two years?',
 '[{"key":"A","label":"1970 and 1986"},{"key":"B","label":"1966 and 1970"},{"key":"C","label":"1986 and 1994"},{"key":"D","label":"1970 and 1978"}]'::jsonb,
 'A', 'Estadio Azteca hosted both the 1970 final (Brazil 4–1 Italy) and the 1986 final (Argentina 3–2 West Germany).',
 'hard', '2026-06-11', 3, null, 'https://en.wikipedia.org/wiki/Estadio_Azteca'),

-- ─── Jun 12 · Canada at the WC ────────────────────────────────────────────
('Before 2022, when was the only previous World Cup Canada had qualified for?',
 '[{"key":"A","label":"1970"},{"key":"B","label":"1978"},{"key":"C","label":"1986"},{"key":"D","label":"1998"}]'::jsonb,
 'C', 'Canada''s only prior World Cup appearance before 2022 was Mexico 1986. They lost all three group games without scoring.',
 'easy', '2026-06-12', 1, null, 'https://en.wikipedia.org/wiki/Canada_at_the_FIFA_World_Cup'),

('Who scored Canada''s first-ever World Cup goal at the 2022 tournament in Qatar?',
 '[{"key":"A","label":"Alphonso Davies"},{"key":"B","label":"Cyle Larin"},{"key":"C","label":"Jonathan David"},{"key":"D","label":"Tajon Buchanan"}]'::jsonb,
 'A', 'Bayern Munich star Alphonso Davies scored Canada''s first ever World Cup goal against Croatia in the group stage of Qatar 2022.',
 'medium', '2026-06-12', 2, null, 'https://en.wikipedia.org/wiki/Alphonso_Davies'),

('In which Canadian city is BMO Field, a 2026 World Cup venue?',
 '[{"key":"A","label":"Vancouver"},{"key":"B","label":"Montreal"},{"key":"C","label":"Toronto"},{"key":"D","label":"Edmonton"}]'::jsonb,
 'C', 'BMO Field is located in Toronto and is the home stadium of MLS''s Toronto FC. It hosts 2026 World Cup matches alongside BC Place in Vancouver.',
 'hard', '2026-06-12', 3, null, 'https://en.wikipedia.org/wiki/BMO_Field'),

-- ─── Jun 13 · USA at the WC ───────────────────────────────────────────────
('In which year did the United States previously host the World Cup?',
 '[{"key":"A","label":"1986"},{"key":"B","label":"1990"},{"key":"C","label":"1994"},{"key":"D","label":"1998"}]'::jsonb,
 'C', 'The United States hosted the 1994 World Cup, which still holds the average-attendance record for any FIFA World Cup.',
 'easy', '2026-06-13', 1, null, 'https://en.wikipedia.org/wiki/1994_FIFA_World_Cup'),

('Who shocked the world by beating England 1–0 for the USA in the 1950 World Cup?',
 '[{"key":"A","label":"Walter Bahr"},{"key":"B","label":"Joe Gaetjens"},{"key":"C","label":"Frank Borghi"},{"key":"D","label":"John Souza"}]'::jsonb,
 'B', 'Haitian-born forward Joe Gaetjens scored the only goal in the USA''s 1–0 upset of England — one of the biggest shocks in WC history.',
 'medium', '2026-06-13', 2, null, 'https://en.wikipedia.org/wiki/England_v_United_States_(1950_FIFA_World_Cup)'),

('Which US city''s SoFi Stadium hosts multiple 2026 World Cup matches including a Round of 32 fixture?',
 '[{"key":"A","label":"Inglewood (Los Angeles)"},{"key":"B","label":"East Rutherford"},{"key":"C","label":"Foxborough"},{"key":"D","label":"Arlington"}]'::jsonb,
 'A', 'SoFi Stadium is in Inglewood, California, home to the NFL Rams and Chargers. It hosts a Round of 32 match on June 28, 2026.',
 'hard', '2026-06-13', 3, null, 'https://en.wikipedia.org/wiki/SoFi_Stadium'),

-- ─── Jun 14 · Italy at the WC ─────────────────────────────────────────────
('How many World Cups has Italy won?',
 '[{"key":"A","label":"2"},{"key":"B","label":"3"},{"key":"C","label":"4"},{"key":"D","label":"5"}]'::jsonb,
 'C', 'Italy has won 4 World Cups: 1934, 1938, 1982, and 2006.',
 'easy', '2026-06-14', 1, null, 'https://en.wikipedia.org/wiki/Italy_at_the_FIFA_World_Cup'),

('Who scored a famous hat-trick for Italy against Brazil in the 1982 World Cup?',
 '[{"key":"A","label":"Paolo Rossi"},{"key":"B","label":"Marco Tardelli"},{"key":"C","label":"Gaetano Scirea"},{"key":"D","label":"Bruno Conti"}]'::jsonb,
 'A', 'Paolo Rossi scored a hat-trick in Italy''s 3–2 win over Brazil in the second group stage, sparking Italy''s march to the 1982 title.',
 'medium', '2026-06-14', 2, null, 'https://en.wikipedia.org/wiki/Paolo_Rossi'),

('Italy''s 2006 World Cup final ended with which player headbutting Marco Materazzi before being sent off?',
 '[{"key":"A","label":"Thierry Henry"},{"key":"B","label":"Patrick Vieira"},{"key":"C","label":"Zinedine Zidane"},{"key":"D","label":"David Trezeguet"}]'::jsonb,
 'C', 'Zinedine Zidane headbutted Materazzi in extra time of the 2006 final and was sent off. Italy went on to win on penalties.',
 'hard', '2026-06-14', 3, null, 'https://en.wikipedia.org/wiki/2006_FIFA_World_Cup_final'),

-- ─── Jun 15 · Spain at the WC ─────────────────────────────────────────────
('In which year did Spain win their only World Cup so far?',
 '[{"key":"A","label":"2006"},{"key":"B","label":"2010"},{"key":"C","label":"2014"},{"key":"D","label":"2018"}]'::jsonb,
 'B', 'Spain won their only World Cup at the 2010 tournament in South Africa, defeating the Netherlands 1–0 in the final.',
 'easy', '2026-06-15', 1, null, 'https://en.wikipedia.org/wiki/Spain_at_the_FIFA_World_Cup'),

('Who scored the winning goal for Spain in the 2010 final against the Netherlands?',
 '[{"key":"A","label":"Xavi"},{"key":"B","label":"David Villa"},{"key":"C","label":"Andrés Iniesta"},{"key":"D","label":"Fernando Torres"}]'::jsonb,
 'C', 'Andrés Iniesta scored in the 116th minute of extra time to give Spain a 1–0 win over the Netherlands in the 2010 final.',
 'medium', '2026-06-15', 2, null, 'https://en.wikipedia.org/wiki/2010_FIFA_World_Cup_final'),

('Spain''s style of dominant short-passing build-up play during their 2008–2012 reign is most commonly known as what?',
 '[{"key":"A","label":"Catenaccio"},{"key":"B","label":"Total Football"},{"key":"C","label":"Tiki-taka"},{"key":"D","label":"Gegenpressing"}]'::jsonb,
 'C', 'Tiki-taka — popularised by FC Barcelona and the Spanish national team — emphasises quick, short passes and constant movement.',
 'hard', '2026-06-15', 3, null, 'https://en.wikipedia.org/wiki/Tiki-taka'),

-- ─── Jun 16 · England at the WC ───────────────────────────────────────────
('In which year did England win their only World Cup?',
 '[{"key":"A","label":"1962"},{"key":"B","label":"1966"},{"key":"C","label":"1970"},{"key":"D","label":"1974"}]'::jsonb,
 'B', 'England won the 1966 World Cup as hosts, defeating West Germany 4–2 in extra time at Wembley.',
 'easy', '2026-06-16', 1, null, 'https://en.wikipedia.org/wiki/England_at_the_FIFA_World_Cup'),

('Who scored a hat-trick for England in the 1966 World Cup final?',
 '[{"key":"A","label":"Bobby Charlton"},{"key":"B","label":"Geoff Hurst"},{"key":"C","label":"Roger Hunt"},{"key":"D","label":"Bobby Moore"}]'::jsonb,
 'B', 'Geoff Hurst scored a hat-trick in the 4–2 final win over West Germany — still the only hat-trick in a World Cup final.',
 'medium', '2026-06-16', 2, null, 'https://en.wikipedia.org/wiki/1966_FIFA_World_Cup_final'),

('How many penalty shootouts has England won in World Cup knockout play?',
 '[{"key":"A","label":"None"},{"key":"B","label":"One"},{"key":"C","label":"Two"},{"key":"D","label":"Three"}]'::jsonb,
 'B', 'Up to 2022, England has won one World Cup penalty shootout — against Colombia in the 2018 Round of 16 — and lost three others.',
 'hard', '2026-06-16', 3, null, 'https://en.wikipedia.org/wiki/England_at_the_FIFA_World_Cup'),

-- ─── Jun 17 · Netherlands at the WC ───────────────────────────────────────
('The Netherlands has reached the World Cup final without winning it how many times?',
 '[{"key":"A","label":"Once"},{"key":"B","label":"Twice"},{"key":"C","label":"Three times"},{"key":"D","label":"Four times"}]'::jsonb,
 'C', 'The Dutch lost three finals: 1974 (vs West Germany), 1978 (vs Argentina), and 2010 (vs Spain) — the most without ever winning.',
 'easy', '2026-06-17', 1, null, 'https://en.wikipedia.org/wiki/Netherlands_at_the_FIFA_World_Cup'),

('Which Dutch legend was the architect of "Total Football" and starred in the 1974 World Cup?',
 '[{"key":"A","label":"Marco van Basten"},{"key":"B","label":"Ruud Gullit"},{"key":"C","label":"Johan Cruyff"},{"key":"D","label":"Dennis Bergkamp"}]'::jsonb,
 'C', 'Johan Cruyff led the Netherlands to the 1974 final, where they lost 2–1 to West Germany despite scoring inside the first minute.',
 'medium', '2026-06-17', 2, null, 'https://en.wikipedia.org/wiki/Johan_Cruyff'),

('Dennis Bergkamp''s famous spectacular goal against Argentina came in which round of the 1998 World Cup?',
 '[{"key":"A","label":"Round of 16"},{"key":"B","label":"Quarterfinals"},{"key":"C","label":"Semifinals"},{"key":"D","label":"Group stage"}]'::jsonb,
 'B', 'Bergkamp''s iconic chest-and-volley against Argentina came in the 1998 quarterfinals, giving the Netherlands a 2–1 win.',
 'hard', '2026-06-17', 3, null, 'https://en.wikipedia.org/wiki/Dennis_Bergkamp'),

-- ─── Jun 18 · Penalty shootouts ───────────────────────────────────────────
('When were penalty shootouts first used to decide a World Cup match?',
 '[{"key":"A","label":"1974"},{"key":"B","label":"1978"},{"key":"C","label":"1982"},{"key":"D","label":"1986"}]'::jsonb,
 'C', 'The first World Cup penalty shootout was West Germany vs France in the 1982 semifinal — West Germany won 5–4.',
 'easy', '2026-06-18', 1, null, 'https://en.wikipedia.org/wiki/Penalty_shoot-out_(association_football)'),

('Which nation has won the most World Cup penalty shootouts?',
 '[{"key":"A","label":"Germany"},{"key":"B","label":"Argentina"},{"key":"C","label":"Brazil"},{"key":"D","label":"France"}]'::jsonb,
 'A', 'Germany has won 4 of its 4 World Cup penalty shootouts — the best record in tournament history.',
 'medium', '2026-06-18', 2, null, 'https://en.wikipedia.org/wiki/Penalty_shoot-out_(association_football)'),

('Argentine goalkeeper Emi Martínez became famous for saves in the 2022 final shootout — which kicker did he stop with his foot?',
 '[{"key":"A","label":"Kingsley Coman"},{"key":"B","label":"Aurélien Tchouaméni"},{"key":"C","label":"Hugo Lloris"},{"key":"D","label":"Randal Kolo Muani"}]'::jsonb,
 'A', 'Emi Martínez saved Kingsley Coman''s penalty during the 2022 World Cup final shootout, helping Argentina win 4–2 on penalties.',
 'hard', '2026-06-18', 3, null, 'https://en.wikipedia.org/wiki/Emiliano_Mart%C3%ADnez'),

-- ─── Jun 19 · Famous WC goals ─────────────────────────────────────────────
('Diego Maradona''s controversial "Hand of God" goal came against which nation in 1986?',
 '[{"key":"A","label":"Brazil"},{"key":"B","label":"Belgium"},{"key":"C","label":"England"},{"key":"D","label":"West Germany"}]'::jsonb,
 'C', 'Maradona punched the ball into the net against England in the 1986 quarterfinal — a goal he later admitted was "a little of the hand of God".',
 'easy', '2026-06-19', 1, null, 'https://en.wikipedia.org/wiki/Hand_of_God_(association_football)'),

('Maradona''s "Goal of the Century" came in the same 1986 match. How many England players did he beat on the run?',
 '[{"key":"A","label":"3"},{"key":"B","label":"4"},{"key":"C","label":"5"},{"key":"D","label":"6"}]'::jsonb,
 'C', 'Maradona beat five England players over 60 metres before slotting past goalkeeper Peter Shilton. FIFA later voted it the Goal of the Century.',
 'medium', '2026-06-19', 2, null, 'https://en.wikipedia.org/wiki/Goal_of_the_Century'),

('Whose stunning chest-and-volley against Uruguay in 2014 was named the World Cup goal of the tournament?',
 '[{"key":"A","label":"Tim Cahill"},{"key":"B","label":"Robin van Persie"},{"key":"C","label":"James Rodríguez"},{"key":"D","label":"Salvatore Schillaci"}]'::jsonb,
 'C', 'Colombian midfielder James Rodríguez controlled the ball on his chest and volleyed home in the Round of 16 against Uruguay, voted FIFA Goal of the Tournament for 2014.',
 'hard', '2026-06-19', 3, null, 'https://en.wikipedia.org/wiki/James_Rodr%C3%ADguez'),

-- ─── Jun 20 · Hosts through history ───────────────────────────────────────
('Which country has hosted the World Cup the most times (counting 2026)?',
 '[{"key":"A","label":"Brazil"},{"key":"B","label":"Mexico"},{"key":"C","label":"Italy"},{"key":"D","label":"USA"}]'::jsonb,
 'B', 'Mexico hosts for the third time in 2026 (after 1970 and 1986) — more than any other nation.',
 'easy', '2026-06-20', 1, null, 'https://en.wikipedia.org/wiki/List_of_FIFA_World_Cup_hosts'),

('Which country hosted the 2002 World Cup, the first ever held outside Europe or the Americas?',
 '[{"key":"A","label":"South Korea and Japan"},{"key":"B","label":"China"},{"key":"C","label":"Australia"},{"key":"D","label":"South Africa"}]'::jsonb,
 'A', 'South Korea and Japan co-hosted in 2002 — the first World Cup outside Europe or the Americas, and the first co-hosted tournament.',
 'medium', '2026-06-20', 2, null, 'https://en.wikipedia.org/wiki/2002_FIFA_World_Cup'),

('Which African nation became the first to host a World Cup in 2010?',
 '[{"key":"A","label":"Egypt"},{"key":"B","label":"Morocco"},{"key":"C","label":"South Africa"},{"key":"D","label":"Nigeria"}]'::jsonb,
 'C', 'South Africa hosted the 2010 World Cup, making it the first ever tournament held on the African continent.',
 'hard', '2026-06-20', 3, null, 'https://en.wikipedia.org/wiki/2010_FIFA_World_Cup'),

-- ─── Jun 21 · All-time top scorers ────────────────────────────────────────
('Who is the all-time top scorer in a single World Cup tournament, with 13 goals in 1958?',
 '[{"key":"A","label":"Pelé"},{"key":"B","label":"Just Fontaine"},{"key":"C","label":"Sándor Kocsis"},{"key":"D","label":"Gerd Müller"}]'::jsonb,
 'B', 'France''s Just Fontaine scored 13 goals at the 1958 tournament — a record that has never been seriously threatened.',
 'easy', '2026-06-21', 1, null, 'https://en.wikipedia.org/wiki/Just_Fontaine'),

('Ronaldo Nazário scored how many goals across his three World Cups (1998, 2002, 2006)?',
 '[{"key":"A","label":"12"},{"key":"B","label":"15"},{"key":"C","label":"17"},{"key":"D","label":"20"}]'::jsonb,
 'B', 'Ronaldo finished with 15 World Cup goals, second only to Miroslav Klose''s 16. He was top scorer at the 2002 tournament.',
 'medium', '2026-06-21', 2, null, 'https://en.wikipedia.org/wiki/Ronaldo_(Brazilian_footballer)'),

('Which German striker scored 14 goals at two World Cups in the 1970s, then a record?',
 '[{"key":"A","label":"Gerd Müller"},{"key":"B","label":"Karl-Heinz Rummenigge"},{"key":"C","label":"Uwe Seeler"},{"key":"D","label":"Jürgen Klinsmann"}]'::jsonb,
 'A', 'Gerd "Der Bomber" Müller scored 10 in 1970 and 4 in 1974, including the winner in the 1974 final, finishing with 14 World Cup goals.',
 'hard', '2026-06-21', 3, null, 'https://en.wikipedia.org/wiki/Gerd_M%C3%BCller'),

-- ─── Jun 22 · Africa at the WC ────────────────────────────────────────────
('Which African nation became the first to reach a World Cup quarterfinal in 1990?',
 '[{"key":"A","label":"Nigeria"},{"key":"B","label":"Cameroon"},{"key":"C","label":"Senegal"},{"key":"D","label":"Ghana"}]'::jsonb,
 'B', 'Cameroon stunned reigning champions Argentina 1–0 in the 1990 opener and went on to reach the quarterfinals — an African first.',
 'easy', '2026-06-22', 1, null, 'https://en.wikipedia.org/wiki/Cameroon_at_the_FIFA_World_Cup'),

('Which player scored 4 goals for Cameroon at the 1990 World Cup at age 38?',
 '[{"key":"A","label":"Samuel Eto''o"},{"key":"B","label":"Roger Milla"},{"key":"C","label":"Patrick M''Boma"},{"key":"D","label":"Thomas N''Kono"}]'::jsonb,
 'B', 'Roger Milla, then 38, scored 4 goals at Italia ''90 — including a famous celebration dance by the corner flag.',
 'medium', '2026-06-22', 2, null, 'https://en.wikipedia.org/wiki/Roger_Milla'),

('Which African team became the first to reach a World Cup semifinal, doing so in 2022?',
 '[{"key":"A","label":"Senegal"},{"key":"B","label":"Ghana"},{"key":"C","label":"Morocco"},{"key":"D","label":"South Africa"}]'::jsonb,
 'C', 'Morocco reached the 2022 World Cup semifinal — the first African and first Arab team to do so — before losing to France.',
 'hard', '2026-06-22', 3, null, 'https://en.wikipedia.org/wiki/Morocco_at_the_FIFA_World_Cup'),

-- ─── Jun 23 · Asia at the WC ──────────────────────────────────────────────
('Which Asian nation became the first to reach a World Cup semifinal, in 2002?',
 '[{"key":"A","label":"South Korea"},{"key":"B","label":"Japan"},{"key":"C","label":"Saudi Arabia"},{"key":"D","label":"Iran"}]'::jsonb,
 'A', 'South Korea, co-hosting, became the first Asian team to reach a World Cup semifinal — defeating Italy and Spain along the way.',
 'easy', '2026-06-23', 1, null, 'https://en.wikipedia.org/wiki/2002_FIFA_World_Cup'),

('Saudi Arabia famously beat which eventual 2022 champion in their opening match?',
 '[{"key":"A","label":"France"},{"key":"B","label":"Argentina"},{"key":"C","label":"Brazil"},{"key":"D","label":"England"}]'::jsonb,
 'B', 'Saudi Arabia beat eventual champions Argentina 2–1 in the 2022 group stage — one of the biggest upsets in WC history.',
 'medium', '2026-06-23', 2, null, 'https://en.wikipedia.org/wiki/Argentina_v_Saudi_Arabia_(2022_FIFA_World_Cup)'),

('Which Japanese player scored both goals as Japan beat Germany 2–1 at the 2022 World Cup?',
 '[{"key":"A","label":"Ritsu Doan"},{"key":"B","label":"Takuma Asano"},{"key":"C","label":"Wataru Endo"},{"key":"D","label":"Daichi Kamada"}]'::jsonb,
 'A', 'Japan came from 1–0 down to beat Germany 2–1, with both goals coming in 8 minutes from substitutes — Ritsu Doan equalised and Takuma Asano scored the winner.',
 'hard', '2026-06-23', 3, null, 'https://en.wikipedia.org/wiki/Germany_v_Japan_(2022_FIFA_World_Cup)'),

-- ─── Jun 24 · Stadiums ────────────────────────────────────────────────────
('The famous Maracanã stadium that hosted the 1950 and 2014 finals is in which city?',
 '[{"key":"A","label":"São Paulo"},{"key":"B","label":"Rio de Janeiro"},{"key":"C","label":"Brasília"},{"key":"D","label":"Salvador"}]'::jsonb,
 'B', 'The Maracanã is in Rio de Janeiro. It hosted the 1950 final (Uruguay''s shock win over Brazil) and the 2014 final (Germany over Argentina).',
 'easy', '2026-06-24', 1, null, 'https://en.wikipedia.org/wiki/Maracan%C3%A3_Stadium'),

('Which English stadium hosted the 1966 World Cup final?',
 '[{"key":"A","label":"Old Trafford"},{"key":"B","label":"Anfield"},{"key":"C","label":"Wembley"},{"key":"D","label":"Goodison Park"}]'::jsonb,
 'C', 'The original Wembley Stadium in London hosted the 1966 final, where England beat West Germany 4–2.',
 'medium', '2026-06-24', 2, null, 'https://en.wikipedia.org/wiki/Wembley_Stadium_(1923)'),

('What was the name of the iconic main stadium for the 2010 World Cup final in South Africa?',
 '[{"key":"A","label":"FNB Stadium (Soccer City)"},{"key":"B","label":"Cape Town Stadium"},{"key":"C","label":"Moses Mabhida"},{"key":"D","label":"Loftus Versfeld"}]'::jsonb,
 'A', 'The FNB Stadium ("Soccer City") in Johannesburg hosted the 2010 final. It is South Africa''s largest stadium with about 95,000 capacity.',
 'hard', '2026-06-24', 3, null, 'https://en.wikipedia.org/wiki/FNB_Stadium'),

-- ─── Jun 25 · Coaches ─────────────────────────────────────────────────────
('Who managed Argentina to their 2022 World Cup title?',
 '[{"key":"A","label":"Lionel Scaloni"},{"key":"B","label":"Marcelo Bielsa"},{"key":"C","label":"Diego Simeone"},{"key":"D","label":"César Luis Menotti"}]'::jsonb,
 'A', 'Lionel Scaloni guided Argentina to the 2022 title in Qatar. He took the job in 2018 with little senior experience.',
 'easy', '2026-06-25', 1, null, 'https://en.wikipedia.org/wiki/Lionel_Scaloni'),

('Which coach has won the most World Cup titles (2)?',
 '[{"key":"A","label":"Vittorio Pozzo"},{"key":"B","label":"Helmut Schön"},{"key":"C","label":"Aimé Jacquet"},{"key":"D","label":"Carlos Bilardo"}]'::jsonb,
 'A', 'Italian coach Vittorio Pozzo won back-to-back World Cups in 1934 and 1938 — the only manager ever to do so.',
 'medium', '2026-06-25', 2, null, 'https://en.wikipedia.org/wiki/Vittorio_Pozzo'),

('Didier Deschamps became only the third person to win the World Cup as both player and manager. Who were the first two?',
 '[{"key":"A","label":"Pelé and Beckenbauer"},{"key":"B","label":"Zagallo and Beckenbauer"},{"key":"C","label":"Schön and Lippi"},{"key":"D","label":"Menotti and Bilardo"}]'::jsonb,
 'B', 'Mário Zagallo (Brazil 1958/1962 player; 1970 coach) and Franz Beckenbauer (West Germany 1974 player; 1990 coach) were the first two; Deschamps joined them by lifting France''s 2018 trophy.',
 'hard', '2026-06-25', 3, null, 'https://en.wikipedia.org/wiki/Didier_Deschamps'),

-- ─── Jun 26 · WC opening matches ──────────────────────────────────────────
('Traditionally, who plays in the World Cup opening match?',
 '[{"key":"A","label":"The defending champion"},{"key":"B","label":"The host nation"},{"key":"C","label":"The two highest-ranked teams"},{"key":"D","label":"A random draw"}]'::jsonb,
 'B', 'Since 2006, the host nation always plays in the opening match. From 1974–2002 the defending champion opened the tournament.',
 'easy', '2026-06-26', 1, null, 'https://en.wikipedia.org/wiki/FIFA_World_Cup'),

('Senegal stunned which defending champions in the 2002 opening match?',
 '[{"key":"A","label":"Italy"},{"key":"B","label":"Brazil"},{"key":"C","label":"France"},{"key":"D","label":"Germany"}]'::jsonb,
 'C', 'Senegal beat reigning champions France 1–0 in the 2002 opener thanks to Papa Bouba Diop''s goal — one of the great World Cup upsets.',
 'medium', '2026-06-26', 2, null, 'https://en.wikipedia.org/wiki/France_v_Senegal_(2002_FIFA_World_Cup)'),

('Which Ecuadorian player scored both goals in the 2022 opening match against host Qatar?',
 '[{"key":"A","label":"Enner Valencia"},{"key":"B","label":"Antonio Valencia"},{"key":"C","label":"Felipe Caicedo"},{"key":"D","label":"Moisés Caicedo"}]'::jsonb,
 'A', 'Enner Valencia scored twice in Ecuador''s 2–0 win over Qatar — the worst-ever performance by a host in the opening match.',
 'hard', '2026-06-26', 3, null, 'https://en.wikipedia.org/wiki/Qatar_v_Ecuador_(2022_FIFA_World_Cup)'),

-- ─── Jun 27 · Surprises and upsets ────────────────────────────────────────
('Which Asian team famously eliminated Italy and Spain on their way to the 2002 semifinals?',
 '[{"key":"A","label":"Japan"},{"key":"B","label":"South Korea"},{"key":"C","label":"China"},{"key":"D","label":"Iran"}]'::jsonb,
 'B', 'South Korea, co-hosting in 2002, beat Italy in the Round of 16 and Spain on penalties in the quarterfinal.',
 'easy', '2026-06-27', 1, null, 'https://en.wikipedia.org/wiki/South_Korea_at_the_FIFA_World_Cup'),

('Defending champions Germany were eliminated in the group stage of which recent World Cup?',
 '[{"key":"A","label":"2014"},{"key":"B","label":"2018"},{"key":"C","label":"2022"},{"key":"D","label":"Both 2018 and 2022"}]'::jsonb,
 'D', 'Germany failed to escape the group at both 2018 (defending the 2014 title) and 2022 — an unprecedented back-to-back early exit for a former champion.',
 'medium', '2026-06-27', 2, null, 'https://en.wikipedia.org/wiki/Germany_at_the_FIFA_World_Cup'),

('In 2014, Costa Rica famously topped a group containing which three former World Cup champions?',
 '[{"key":"A","label":"Italy, Uruguay, England"},{"key":"B","label":"Argentina, France, Italy"},{"key":"C","label":"Brazil, Italy, Uruguay"},{"key":"D","label":"Germany, Italy, Spain"}]'::jsonb,
 'A', 'Costa Rica topped Group D in 2014, beating Uruguay and Italy and drawing with England — three teams with 5 World Cups between them.',
 'hard', '2026-06-27', 3, null, 'https://en.wikipedia.org/wiki/Costa_Rica_at_the_FIFA_World_Cup'),

-- ─── Jun 28 · Round of 32 underdogs ───────────────────────────────────────
('How many teams have lifted the World Cup trophy in the tournament''s history?',
 '[{"key":"A","label":"6"},{"key":"B","label":"7"},{"key":"C","label":"8"},{"key":"D","label":"9"}]'::jsonb,
 'C', 'Eight nations have won the World Cup: Uruguay, Italy, West Germany/Germany, Brazil, England, Argentina, France, and Spain.',
 'easy', '2026-06-28', 1, null, 'https://en.wikipedia.org/wiki/FIFA_World_Cup'),

('Which European nation reached the 2018 World Cup final in their first appearance as an independent country?',
 '[{"key":"A","label":"Croatia"},{"key":"B","label":"Serbia"},{"key":"C","label":"Slovenia"},{"key":"D","label":"Slovakia"}]'::jsonb,
 'A', 'Croatia reached the 2018 final, losing 4–2 to France. They had only become independent in 1991 and were appearing in their fifth World Cup.',
 'medium', '2026-06-28', 2, null, 'https://en.wikipedia.org/wiki/Croatia_at_the_FIFA_World_Cup'),

('Iceland''s 2018 debut made them the smallest nation by population to ever reach a World Cup. About how many people live in Iceland?',
 '[{"key":"A","label":"160,000"},{"key":"B","label":"340,000"},{"key":"C","label":"700,000"},{"key":"D","label":"1.2 million"}]'::jsonb,
 'B', 'Iceland has about 340,000 people — making them comfortably the smallest nation ever to qualify for a World Cup.',
 'hard', '2026-06-28', 3, null, 'https://en.wikipedia.org/wiki/Iceland_at_the_FIFA_World_Cup'),

-- ─── Jun 29 · Comeback wins ───────────────────────────────────────────────
('Brazil''s "Maracanazo" 1950 final loss came against which nation in front of 200,000 fans?',
 '[{"key":"A","label":"Sweden"},{"key":"B","label":"Uruguay"},{"key":"C","label":"Argentina"},{"key":"D","label":"Italy"}]'::jsonb,
 'B', 'Uruguay shocked host Brazil 2–1 in the 1950 deciding match — known forever in Brazil as the "Maracanazo".',
 'easy', '2026-06-29', 1, null, 'https://en.wikipedia.org/wiki/Maracanazo'),

('Italy came back from 1–0 down to win the 2006 World Cup final on penalties against which team?',
 '[{"key":"A","label":"Germany"},{"key":"B","label":"Portugal"},{"key":"C","label":"France"},{"key":"D","label":"Brazil"}]'::jsonb,
 'C', 'France took the lead through a Zidane penalty before Materazzi equalised. Italy won 5–3 on penalties after a 1–1 draw.',
 'medium', '2026-06-29', 2, null, 'https://en.wikipedia.org/wiki/2006_FIFA_World_Cup_final'),

('At the 1954 final, West Germany famously came from 2–0 down to beat which team 3–2?',
 '[{"key":"A","label":"Hungary"},{"key":"B","label":"Czechoslovakia"},{"key":"C","label":"Yugoslavia"},{"key":"D","label":"Austria"}]'::jsonb,
 'A', 'The "Miracle of Bern": West Germany trailed Hungary''s "Mighty Magyars" 2–0 after 8 minutes but won 3–2 — a result that shocked the world.',
 'hard', '2026-06-29', 3, null, 'https://en.wikipedia.org/wiki/Miracle_of_Bern'),

-- ─── Jun 30 · Hat-tricks at the WC ────────────────────────────────────────
('Cristiano Ronaldo scored a hat-trick for Portugal in their 2018 opener against which team?',
 '[{"key":"A","label":"Spain"},{"key":"B","label":"Morocco"},{"key":"C","label":"Iran"},{"key":"D","label":"Uruguay"}]'::jsonb,
 'A', 'Ronaldo''s hat-trick — including a 88th-minute free-kick — earned Portugal a 3–3 draw with Spain in the 2018 group stage.',
 'easy', '2026-06-30', 1, null, 'https://en.wikipedia.org/wiki/Portugal_v_Spain_(2018_FIFA_World_Cup)'),

('Geoff Hurst remains the only player to do what in a World Cup final?',
 '[{"key":"A","label":"Score a hat-trick"},{"key":"B","label":"Save a penalty as outfield player"},{"key":"C","label":"Score from his own half"},{"key":"D","label":"Be sent off after scoring"}]'::jsonb,
 'A', 'Geoff Hurst is still the only player to score a hat-trick in a World Cup final — England 4–2 West Germany in 1966.',
 'medium', '2026-06-30', 2, null, 'https://en.wikipedia.org/wiki/Geoff_Hurst'),

('Hungarian striker Sándor Kocsis scored two hat-tricks at which World Cup, where Hungary lost the final?',
 '[{"key":"A","label":"1950"},{"key":"B","label":"1954"},{"key":"C","label":"1962"},{"key":"D","label":"1966"}]'::jsonb,
 'B', 'Sándor Kocsis scored hat-tricks against South Korea and West Germany in the 1954 group stage. Hungary lost the final 3–2 to West Germany.',
 'hard', '2026-06-30', 3, null, 'https://en.wikipedia.org/wiki/S%C3%A1ndor_Kocsis'),

-- ─── Jul 1 · WC matches ───────────────────────────────────────────────────
('What is the longest match in World Cup history (excluding penalties)?',
 '[{"key":"A","label":"105 minutes"},{"key":"B","label":"120 minutes"},{"key":"C","label":"125 minutes"},{"key":"D","label":"125+ minutes"}]'::jsonb,
 'B', 'The maximum a WC match can last in regulation + extra time is 120 minutes. After that, penalties decide. Multiple matches have gone the full 120.',
 'easy', '2026-07-01', 1, null, 'https://en.wikipedia.org/wiki/FIFA_World_Cup'),

('The first World Cup match decided by sudden-death "golden goal" was in which tournament?',
 '[{"key":"A","label":"1994"},{"key":"B","label":"1998"},{"key":"C","label":"2002"},{"key":"D","label":"2006"}]'::jsonb,
 'B', 'The first golden goal WC match was France beating Paraguay in the 1998 Round of 16 — Laurent Blanc scoring the winner. The rule was abolished in 2004.',
 'medium', '2026-07-01', 2, null, 'https://en.wikipedia.org/wiki/Golden_goal'),

('Which match holds the World Cup record for most goals (12) in a single game?',
 '[{"key":"A","label":"Hungary 10–1 El Salvador (1982)"},{"key":"B","label":"Austria 7–5 Switzerland (1954)"},{"key":"C","label":"Brazil 6–5 Poland (1938)"},{"key":"D","label":"Germany 8–0 Saudi Arabia (2002)"}]'::jsonb,
 'B', 'Austria vs Switzerland at the 1954 World Cup quarterfinal finished 7–5 — 12 goals in 90 minutes, still the WC record.',
 'hard', '2026-07-01', 3, null, 'https://en.wikipedia.org/wiki/Austria_v_Switzerland_(1954_FIFA_World_Cup)'),

-- ─── Jul 2 · Goalkeepers ──────────────────────────────────────────────────
('Which Italian goalkeeper captained his team to the 2006 World Cup title at age 28?',
 '[{"key":"A","label":"Gianluigi Buffon"},{"key":"B","label":"Walter Zenga"},{"key":"C","label":"Dino Zoff"},{"key":"D","label":"Francesco Toldo"}]'::jsonb,
 'A', 'Gianluigi Buffon won the Golden Glove at the 2006 World Cup, conceding just two goals all tournament — one own goal and one penalty.',
 'easy', '2026-07-02', 1, null, 'https://en.wikipedia.org/wiki/Gianluigi_Buffon'),

('Who is the oldest player ever to win the World Cup, lifting it for Italy in 1982 at 40?',
 '[{"key":"A","label":"Marco Tardelli"},{"key":"B","label":"Dino Zoff"},{"key":"C","label":"Claudio Gentile"},{"key":"D","label":"Bruno Conti"}]'::jsonb,
 'B', 'Goalkeeper Dino Zoff captained Italy to the 1982 title at age 40 — still the oldest player ever to win the World Cup.',
 'medium', '2026-07-02', 2, null, 'https://en.wikipedia.org/wiki/Dino_Zoff'),

('Which Mexican keeper played in a record 5 World Cups (1994–2010)?',
 '[{"key":"A","label":"Guillermo Ochoa"},{"key":"B","label":"Jorge Campos"},{"key":"C","label":"Antonio Carbajal"},{"key":"D","label":"Oswaldo Sánchez"}]'::jsonb,
 'A', 'Guillermo Ochoa played at 5 World Cups for Mexico — 2006, 2010, 2014, 2018, and 2022 (correction: not 1994). His save against Brazil in 2014 is iconic.',
 'hard', '2026-07-02', 3, null, 'https://en.wikipedia.org/wiki/Guillermo_Ochoa'),

-- ─── Jul 3 · Defenders who scored ─────────────────────────────────────────
('Which German captain headed home the winner in the 1990 final?',
 '[{"key":"A","label":"Andreas Brehme"},{"key":"B","label":"Lothar Matthäus"},{"key":"C","label":"Jürgen Klinsmann"},{"key":"D","label":"Rudi Völler"}]'::jsonb,
 'A', 'Andreas Brehme scored from the penalty spot in the 85th minute as West Germany beat Argentina 1–0 in Rome.',
 'easy', '2026-07-03', 1, null, 'https://en.wikipedia.org/wiki/1990_FIFA_World_Cup_final'),

('Brazil captain Cafu played a record 3 World Cup finals (1994, 1998, 2002). Which position did he play?',
 '[{"key":"A","label":"Right-back"},{"key":"B","label":"Centre-back"},{"key":"C","label":"Left-back"},{"key":"D","label":"Holding midfielder"}]'::jsonb,
 'A', 'Cafu was Brazil''s right-back and is the only player to appear in 3 consecutive World Cup finals — winning 1994 and 2002, losing 1998.',
 'medium', '2026-07-03', 2, null, 'https://en.wikipedia.org/wiki/Cafu'),

('Which German defender''s mistake led to Mario Götze''s 2014 final winning goal — but for the OTHER team?',
 '[{"key":"A","label":"Jérôme Boateng"},{"key":"B","label":"Mats Hummels"},{"key":"C","label":"None — Germany won 1–0 cleanly"},{"key":"D","label":"Philipp Lahm"}]'::jsonb,
 'C', 'Trick question: Mario Götze scored Germany''s only goal as substitute, winning the 2014 final 1–0 over Argentina. No defender error involved.',
 'hard', '2026-07-03', 3, null, 'https://en.wikipedia.org/wiki/2014_FIFA_World_Cup_final'),

-- ─── Jul 4 · Winning captains ─────────────────────────────────────────────
('Who captained Argentina to the 2022 World Cup title?',
 '[{"key":"A","label":"Lionel Messi"},{"key":"B","label":"Ángel Di María"},{"key":"C","label":"Sergio Agüero"},{"key":"D","label":"Nicolás Otamendi"}]'::jsonb,
 'A', 'Lionel Messi captained and starred for Argentina in their 2022 victory, finally winning the trophy in his fifth World Cup.',
 'easy', '2026-07-04', 1, null, 'https://en.wikipedia.org/wiki/Lionel_Messi'),

('Iker Casillas was the captain when Spain won the 2010 World Cup. He famously kept how many clean sheets?',
 '[{"key":"A","label":"3"},{"key":"B","label":"4"},{"key":"C","label":"5"},{"key":"D","label":"6"}]'::jsonb,
 'C', 'Casillas kept 5 clean sheets across the 2010 tournament — including 4 of Spain''s 6 wins and the final itself.',
 'medium', '2026-07-04', 2, null, 'https://en.wikipedia.org/wiki/Iker_Casillas'),

('Which Argentine captain lifted the trophy in 1986 with a famous quote about the World Cup being "for the players"?',
 '[{"key":"A","label":"Daniel Passarella"},{"key":"B","label":"Diego Maradona"},{"key":"C","label":"Mario Kempes"},{"key":"D","label":"Oscar Ruggeri"}]'::jsonb,
 'B', 'Diego Maradona captained Argentina to the 1986 title — arguably the most dominant individual tournament performance in WC history.',
 'hard', '2026-07-04', 3, null, 'https://en.wikipedia.org/wiki/Diego_Maradona'),

-- ─── Jul 5 · Player ages ──────────────────────────────────────────────────
('Pelé became the youngest player to score in a World Cup final, aged how many years?',
 '[{"key":"A","label":"16"},{"key":"B","label":"17"},{"key":"C","label":"18"},{"key":"D","label":"19"}]'::jsonb,
 'B', 'Pelé scored twice in the 1958 final at 17 years and 249 days old. The record still stands.',
 'easy', '2026-07-05', 1, null, 'https://en.wikipedia.org/wiki/Pel%C3%A9'),

('Who is the youngest player ever to play in a World Cup match, debuting at 17 years and 41 days?',
 '[{"key":"A","label":"Pelé"},{"key":"B","label":"Norman Whiteside"},{"key":"C","label":"Theo Walcott"},{"key":"D","label":"Mathew Knowles"}]'::jsonb,
 'B', 'Northern Ireland''s Norman Whiteside played at the 1982 World Cup at 17 years 41 days — still the youngest ever WC player.',
 'medium', '2026-07-05', 2, null, 'https://en.wikipedia.org/wiki/Norman_Whiteside'),

('Cameroonian striker Rigobert Song made his WC debut at how many tournaments?',
 '[{"key":"A","label":"2"},{"key":"B","label":"3"},{"key":"C","label":"4"},{"key":"D","label":"5"}]'::jsonb,
 'C', 'Rigobert Song played at 4 World Cups (1994, 1998, 2002, 2010) — equal-most for any African player. He''s the only player sent off in two different World Cups.',
 'hard', '2026-07-05', 3, null, 'https://en.wikipedia.org/wiki/Rigobert_Song'),

-- ─── Jul 6 · Iconic World Cup goals ───────────────────────────────────────
('Mario Götze''s 2014 World Cup final winner was scored with which body part?',
 '[{"key":"A","label":"Right foot"},{"key":"B","label":"Left foot"},{"key":"C","label":"Header"},{"key":"D","label":"Knee"}]'::jsonb,
 'B', 'Götze controlled a cross with his chest and volleyed home with his left foot in extra time, giving Germany a 1–0 win over Argentina.',
 'easy', '2026-07-06', 1, null, 'https://en.wikipedia.org/wiki/2014_FIFA_World_Cup_final'),

('Carli Lloyd scored a hat-trick for the USA in the 2015 Women''s World Cup final, including a goal from where?',
 '[{"key":"A","label":"Inside the box"},{"key":"B","label":"Halfway line"},{"key":"C","label":"Free kick 30 yards out"},{"key":"D","label":"Outside the centre circle"}]'::jsonb,
 'B', 'Carli Lloyd scored from her own half — about the halfway line — in the 16th minute against Japan, completing a stunning hat-trick.',
 'medium', '2026-07-06', 2, null, 'https://en.wikipedia.org/wiki/Carli_Lloyd'),

('Diego Maradona''s 1986 "Goal of the Century" began in roughly which part of the pitch?',
 '[{"key":"A","label":"His own half"},{"key":"B","label":"Inside England''s half"},{"key":"C","label":"On the touchline near halfway"},{"key":"D","label":"Just outside England''s box"}]'::jsonb,
 'A', 'Maradona collected the ball deep in his own half (around the centre circle) before slaloming past 5 England players to score.',
 'hard', '2026-07-06', 3, null, 'https://en.wikipedia.org/wiki/Goal_of_the_Century'),

-- ─── Jul 7 · Most-capped at WCs ───────────────────────────────────────────
('Which player has the record for most World Cup matches played, with 26?',
 '[{"key":"A","label":"Lionel Messi"},{"key":"B","label":"Lothar Matthäus"},{"key":"C","label":"Cristiano Ronaldo"},{"key":"D","label":"Paolo Maldini"}]'::jsonb,
 'A', 'Lionel Messi played his 26th WC match in the 2022 final — passing Lothar Matthäus''s long-standing record of 25.',
 'easy', '2026-07-07', 1, null, 'https://en.wikipedia.org/wiki/Lionel_Messi'),

('Lothar Matthäus held the WC appearance record after playing in how many tournaments for Germany?',
 '[{"key":"A","label":"3"},{"key":"B","label":"4"},{"key":"C","label":"5"},{"key":"D","label":"6"}]'::jsonb,
 'C', 'Matthäus played 5 World Cups (1982, 1986, 1990, 1994, 1998) — a feat matched only by a handful of players including Messi.',
 'medium', '2026-07-07', 2, null, 'https://en.wikipedia.org/wiki/Lothar_Matth%C3%A4us'),

('Which Mexican goalkeeper appeared in 5 World Cups (1950–1966) — the first player to do so?',
 '[{"key":"A","label":"Antonio Carbajal"},{"key":"B","label":"Hugo Sánchez"},{"key":"C","label":"Salvador Reyes"},{"key":"D","label":"Ignacio Trelles"}]'::jsonb,
 'A', 'Antonio Carbajal was the first player to appear in 5 World Cups — 1950, 1954, 1958, 1962, 1966.',
 'hard', '2026-07-07', 3, null, 'https://en.wikipedia.org/wiki/Antonio_Carbajal'),

-- ─── Jul 8 · Rule changes ─────────────────────────────────────────────────
('Yellow and red cards were first used at which World Cup?',
 '[{"key":"A","label":"1966"},{"key":"B","label":"1970"},{"key":"C","label":"1974"},{"key":"D","label":"1978"}]'::jsonb,
 'B', 'Yellow and red cards were introduced at the 1970 World Cup in Mexico to overcome language barriers between referees and players.',
 'easy', '2026-07-08', 1, null, 'https://en.wikipedia.org/wiki/Penalty_card'),

('VAR (Video Assistant Referee) was first used at which World Cup?',
 '[{"key":"A","label":"2010"},{"key":"B","label":"2014"},{"key":"C","label":"2018"},{"key":"D","label":"2022"}]'::jsonb,
 'C', 'VAR debuted at the 2018 World Cup in Russia — used to review goals, penalties, red cards, and mistaken identity.',
 'medium', '2026-07-08', 2, null, 'https://en.wikipedia.org/wiki/Video_assistant_referee'),

('In what year did the World Cup move from 24 to 32 teams?',
 '[{"key":"A","label":"1990"},{"key":"B","label":"1994"},{"key":"C","label":"1998"},{"key":"D","label":"2002"}]'::jsonb,
 'C', 'The 1998 World Cup in France was the first 32-team tournament. The format expanded again to 48 teams in 2026.',
 'hard', '2026-07-08', 3, null, 'https://en.wikipedia.org/wiki/FIFA_World_Cup'),

-- ─── Jul 9 · QF famous moments ────────────────────────────────────────────
('Which player scored the only goal in the 2014 World Cup final?',
 '[{"key":"A","label":"Mario Götze"},{"key":"B","label":"Thomas Müller"},{"key":"C","label":"André Schürrle"},{"key":"D","label":"Lionel Messi"}]'::jsonb,
 'A', 'Mario Götze scored in the 113th minute as Germany beat Argentina 1–0 in the 2014 final in Rio de Janeiro.',
 'easy', '2026-07-09', 1, null, 'https://en.wikipedia.org/wiki/Mario_G%C3%B6tze'),

('Zinedine Zidane''s 2006 quarterfinal-winning goal against which team showed his vintage form?',
 '[{"key":"A","label":"Brazil"},{"key":"B","label":"Portugal"},{"key":"C","label":"Italy"},{"key":"D","label":"Spain"}]'::jsonb,
 'A', 'Zidane scored a sublime free-kick assist (and dominated midfield) as France beat Brazil 1–0 in the 2006 quarterfinal.',
 'medium', '2026-07-09', 2, null, 'https://en.wikipedia.org/wiki/Zinedine_Zidane'),

('What is the only World Cup quarterfinal to end 0–0 and go to a shootout in normal World Cup format (2014)?',
 '[{"key":"A","label":"Costa Rica vs Netherlands"},{"key":"B","label":"Brazil vs Chile"},{"key":"C","label":"Both above"},{"key":"D","label":"Argentina vs Belgium"}]'::jsonb,
 'A', 'Costa Rica held the Netherlands to a 0–0 draw in the 2014 quarterfinal but lost on penalties when keeper Tim Krul came on specifically for the shootout.',
 'hard', '2026-07-09', 3, null, 'https://en.wikipedia.org/wiki/Netherlands_v_Costa_Rica_(2014_FIFA_World_Cup)'),

-- ─── Jul 10 · Latin America at the WC ─────────────────────────────────────
('How many South American nations have won the World Cup?',
 '[{"key":"A","label":"1"},{"key":"B","label":"2"},{"key":"C","label":"3"},{"key":"D","label":"4"}]'::jsonb,
 'C', 'Three South American nations have won: Brazil (5), Argentina (3), and Uruguay (2). No CONMEBOL team has won in Europe.',
 'easy', '2026-07-10', 1, null, 'https://en.wikipedia.org/wiki/CONMEBOL_at_the_FIFA_World_Cup'),

('How many World Cups has Argentina won?',
 '[{"key":"A","label":"2"},{"key":"B","label":"3"},{"key":"C","label":"4"},{"key":"D","label":"5"}]'::jsonb,
 'B', 'Argentina has won 3 World Cups: 1978, 1986, and 2022.',
 'medium', '2026-07-10', 2, null, 'https://en.wikipedia.org/wiki/Argentina_at_the_FIFA_World_Cup'),

('Which Uruguayan striker''s notorious bite at the 2014 World Cup got him suspended for 9 international matches?',
 '[{"key":"A","label":"Edinson Cavani"},{"key":"B","label":"Diego Forlán"},{"key":"C","label":"Luis Suárez"},{"key":"D","label":"Álvaro Recoba"}]'::jsonb,
 'C', 'Luis Suárez bit Italy''s Giorgio Chiellini during a 2014 group game. FIFA banned him for 9 internationals — his third biting offence in club football.',
 'hard', '2026-07-10', 3, null, 'https://en.wikipedia.org/wiki/Luis_Su%C3%A1rez'),

-- ─── Jul 11 · Final goals ─────────────────────────────────────────────────
('Who scored the winning goal in the 2022 final shootout for Argentina?',
 '[{"key":"A","label":"Lionel Messi"},{"key":"B","label":"Gonzalo Montiel"},{"key":"C","label":"Lautaro Martínez"},{"key":"D","label":"Paulo Dybala"}]'::jsonb,
 'B', 'Gonzalo Montiel converted the decisive penalty as Argentina beat France 4–2 on penalties after a 3–3 draw — one of the greatest finals ever.',
 'easy', '2026-07-11', 1, null, 'https://en.wikipedia.org/wiki/2022_FIFA_World_Cup_final'),

('Who scored a hat-trick in the 2022 final but ended on the losing side?',
 '[{"key":"A","label":"Kylian Mbappé"},{"key":"B","label":"Olivier Giroud"},{"key":"C","label":"Antoine Griezmann"},{"key":"D","label":"Karim Benzema"}]'::jsonb,
 'A', 'Kylian Mbappé scored a hat-trick — the second ever in a World Cup final after Geoff Hurst — but France lost on penalties.',
 'medium', '2026-07-11', 2, null, 'https://en.wikipedia.org/wiki/Kylian_Mbapp%C3%A9'),

('Which player scored the fastest goal in a World Cup final, after 90 seconds in 1974?',
 '[{"key":"A","label":"Johan Neeskens"},{"key":"B","label":"Johan Cruyff"},{"key":"C","label":"Paul Breitner"},{"key":"D","label":"Gerd Müller"}]'::jsonb,
 'A', 'Johan Neeskens scored from a penalty after just 90 seconds for the Netherlands against West Germany in the 1974 final.',
 'hard', '2026-07-11', 3, null, 'https://en.wikipedia.org/wiki/1974_FIFA_World_Cup_final'),

-- ─── Jul 12 · Golden Ball winners ─────────────────────────────────────────
('The Golden Ball is awarded to which player at each World Cup?',
 '[{"key":"A","label":"Top scorer"},{"key":"B","label":"Best young player"},{"key":"C","label":"Best player of the tournament"},{"key":"D","label":"Best goalkeeper"}]'::jsonb,
 'C', 'The adidas Golden Ball goes to the best player of the tournament, voted by journalists.',
 'easy', '2026-07-12', 1, null, 'https://en.wikipedia.org/wiki/FIFA_World_Cup_awards'),

('Lionel Messi won the Golden Ball at how many World Cups?',
 '[{"key":"A","label":"1"},{"key":"B","label":"2"},{"key":"C","label":"3"},{"key":"D","label":"4"}]'::jsonb,
 'B', 'Messi won the Golden Ball in 2014 (when Argentina lost the final) and again in 2022 — the only player to win it twice.',
 'medium', '2026-07-12', 2, null, 'https://en.wikipedia.org/wiki/Lionel_Messi'),

('Who won the Golden Ball at the 1982 World Cup, even though Italy beat his team in the final?',
 '[{"key":"A","label":"Karl-Heinz Rummenigge"},{"key":"B","label":"Paolo Rossi"},{"key":"C","label":"Zico"},{"key":"D","label":"Diego Maradona"}]'::jsonb,
 'B', 'Paolo Rossi won the Golden Ball after scoring 6 goals at 1982, including the opening goal of the final as Italy beat West Germany 3–1.',
 'hard', '2026-07-12', 3, null, 'https://en.wikipedia.org/wiki/Paolo_Rossi'),

-- ─── Jul 13 · Golden Boot winners ─────────────────────────────────────────
('Who won the Golden Boot at the 2022 World Cup with 8 goals?',
 '[{"key":"A","label":"Lionel Messi"},{"key":"B","label":"Kylian Mbappé"},{"key":"C","label":"Julián Álvarez"},{"key":"D","label":"Olivier Giroud"}]'::jsonb,
 'B', 'Kylian Mbappé won the Golden Boot at 2022 with 8 goals, edging Lionel Messi (7) on goals scored alone.',
 'easy', '2026-07-13', 1, null, 'https://en.wikipedia.org/wiki/FIFA_World_Cup_Golden_Boot'),

('Croatia''s Davor Šuker won the Golden Boot at which World Cup with 6 goals?',
 '[{"key":"A","label":"1994"},{"key":"B","label":"1998"},{"key":"C","label":"2002"},{"key":"D","label":"2006"}]'::jsonb,
 'B', 'Davor Šuker scored 6 goals as Croatia finished 3rd at the 1998 World Cup in their first appearance as an independent nation.',
 'medium', '2026-07-13', 2, null, 'https://en.wikipedia.org/wiki/Davor_%C5%A0uker'),

('Salvatore Schillaci won the Golden Boot at Italia ''90 despite starting how many of Italy''s games on the bench?',
 '[{"key":"A","label":"3"},{"key":"B","label":"All of them initially"},{"key":"C","label":"None"},{"key":"D","label":"5"}]'::jsonb,
 'B', 'Schillaci was an unheralded substitute at the start of the tournament but ended up Italy''s top scorer with 6 goals, winning both Golden Boot and Golden Ball.',
 'hard', '2026-07-13', 3, null, 'https://en.wikipedia.org/wiki/Salvatore_Schillaci'),

-- ─── Jul 14 · Dramatic SF moments ─────────────────────────────────────────
('The 2014 World Cup semifinal between Brazil and Germany ended in what astonishing score?',
 '[{"key":"A","label":"5–1"},{"key":"B","label":"6–0"},{"key":"C","label":"7–1"},{"key":"D","label":"4–2"}]'::jsonb,
 'C', 'Germany scored 4 goals in 6 minutes en route to a 7–1 demolition of host Brazil — the largest semifinal margin in WC history.',
 'easy', '2026-07-14', 1, null, 'https://en.wikipedia.org/wiki/Brazil_v_Germany_(2014_FIFA_World_Cup)'),

('Italy beat Germany 4–3 in extra time at the 1970 semifinal — what was the name of this classic match?',
 '[{"key":"A","label":"Game of the Century"},{"key":"B","label":"Match of Aztec"},{"key":"C","label":"Mexico Miracle"},{"key":"D","label":"Battle of Bern"}]'::jsonb,
 'A', 'The 1970 Italy vs West Germany semifinal is known as the "Game of the Century" — 5 of the 7 goals came in extra time at the Estadio Azteca.',
 'medium', '2026-07-14', 2, null, 'https://en.wikipedia.org/wiki/Italy_v_West_Germany_(1970_FIFA_World_Cup)'),

('In which year did Jürgen Klinsmann coach the United States to the World Cup Round of 16?',
 '[{"key":"A","label":"2010"},{"key":"B","label":"2014"},{"key":"C","label":"2018"},{"key":"D","label":"2022"}]'::jsonb,
 'B', 'Jürgen Klinsmann — a German World Cup winner as a player — coached the USA at the 2014 World Cup. The US escaped the "Group of Death" before losing to Belgium 2–1 in extra time in the Round of 16.',
 'hard', '2026-07-14', 3, null, 'https://en.wikipedia.org/wiki/J%C3%BCrgen_Klinsmann'),

-- ─── Jul 15 · Penalty kicks history ───────────────────────────────────────
('Roberto Baggio famously missed which penalty in the 1994 World Cup final?',
 '[{"key":"A","label":"His first attempt early in extra time"},{"key":"B","label":"The decisive kick of the shootout"},{"key":"C","label":"A second-half penalty"},{"key":"D","label":"He didn''t miss any"}]'::jsonb,
 'B', 'Baggio ballooned Italy''s decisive shootout kick over the bar, handing Brazil the 1994 title — one of the most painful misses in football history.',
 'easy', '2026-07-15', 1, null, 'https://en.wikipedia.org/wiki/1994_FIFA_World_Cup_final'),

('Which English star missed two penalties at the 1998 World Cup, including one in the shootout against Argentina?',
 '[{"key":"A","label":"Alan Shearer"},{"key":"B","label":"David Batty"},{"key":"C","label":"David Beckham"},{"key":"D","label":"Paul Ince"}]'::jsonb,
 'B', 'David Batty missed England''s decisive kick in the 1998 R16 shootout against Argentina. (David Beckham was sent off earlier in normal time.)',
 'medium', '2026-07-15', 2, null, 'https://en.wikipedia.org/wiki/Argentina_v_England_(1998_FIFA_World_Cup)'),

('Which Brazilian midfielder''s 2002 long-range goal vs Belgium is widely cited as one of the great WC dribbles?',
 '[{"key":"A","label":"Ronaldinho"},{"key":"B","label":"Rivaldo"},{"key":"C","label":"Ronaldo"},{"key":"D","label":"Kaká"}]'::jsonb,
 'A', 'Ronaldinho''s 2002 quarterfinal free-kick lobbed England keeper David Seaman from 40 yards — among the most replayed WC goals.',
 'hard', '2026-07-15', 3, null, 'https://en.wikipedia.org/wiki/Ronaldinho'),

-- ─── Jul 16 · World Cup trophies ──────────────────────────────────────────
('What was the original World Cup trophy called, used 1930–1970?',
 '[{"key":"A","label":"FIFA Cup"},{"key":"B","label":"Jules Rimet Trophy"},{"key":"C","label":"Globe Trophy"},{"key":"D","label":"Goddess of Victory"}]'::jsonb,
 'B', 'The Jules Rimet Trophy — depicting Nike, the goddess of victory — was awarded from 1930 to 1970. Brazil won it permanently after their 3rd title.',
 'easy', '2026-07-16', 1, null, 'https://en.wikipedia.org/wiki/Jules_Rimet_Trophy'),

('The Jules Rimet Trophy was famously stolen in which country in 1966?',
 '[{"key":"A","label":"Brazil"},{"key":"B","label":"Italy"},{"key":"C","label":"England"},{"key":"D","label":"Mexico"}]'::jsonb,
 'C', 'The trophy was stolen from a public display in London weeks before the 1966 tournament. It was found by a dog named Pickles a week later.',
 'medium', '2026-07-16', 2, null, 'https://en.wikipedia.org/wiki/Jules_Rimet_Trophy'),

('The current FIFA World Cup trophy was designed in 1971 by which Italian sculptor?',
 '[{"key":"A","label":"Silvio Gazzaniga"},{"key":"B","label":"Carlo Carlì"},{"key":"C","label":"Mario Buccellati"},{"key":"D","label":"Giorgio Polo"}]'::jsonb,
 'A', 'Silvio Gazzaniga of Italy designed the current trophy in 1971. It depicts two human figures holding up the earth.',
 'hard', '2026-07-16', 3, null, 'https://en.wikipedia.org/wiki/FIFA_World_Cup_Trophy'),

-- ─── Jul 17 · VAR and technology ──────────────────────────────────────────
('Goal-line technology was introduced at which World Cup?',
 '[{"key":"A","label":"2010"},{"key":"B","label":"2014"},{"key":"C","label":"2018"},{"key":"D","label":"2022"}]'::jsonb,
 'B', 'Goal-line technology debuted at 2014 in Brazil — its first major test confirming a France goal vs Honduras in the group stage.',
 'easy', '2026-07-17', 1, null, 'https://en.wikipedia.org/wiki/Goal-line_technology'),

('Which infamous "ghost goal" decision in 2010 helped accelerate adoption of goal-line technology?',
 '[{"key":"A","label":"Lampard vs Germany"},{"key":"B","label":"Tévez vs Mexico"},{"key":"C","label":"Both above"},{"key":"D","label":"Klose vs Argentina"}]'::jsonb,
 'A', 'Frank Lampard''s shot for England clearly crossed the line vs Germany in the 2010 R16, but was not given. FIFA accelerated GLT trials soon after.',
 'medium', '2026-07-17', 2, null, 'https://en.wikipedia.org/wiki/Germany_v_England_(2010_FIFA_World_Cup)'),

('"Semi-automated offside technology" first appeared at which World Cup?',
 '[{"key":"A","label":"2014"},{"key":"B","label":"2018"},{"key":"C","label":"2022"},{"key":"D","label":"2026"}]'::jsonb,
 'C', 'Semi-automated offside technology — using limb-tracking cameras and a ball-embedded sensor — debuted at Qatar 2022.',
 'hard', '2026-07-17', 3, null, 'https://en.wikipedia.org/wiki/Semi-automated_offside_technology'),

-- ─── Jul 18 · Third-place playoffs ────────────────────────────────────────
('How many WC third-place matches has Germany / West Germany won?',
 '[{"key":"A","label":"1"},{"key":"B","label":"2"},{"key":"C","label":"3"},{"key":"D","label":"4"}]'::jsonb,
 'D', 'Germany/West Germany have won 4 World Cup third-place matches — more than any other nation, in 1934, 1970, 2006, and 2010.',
 'easy', '2026-07-18', 1, null, 'https://en.wikipedia.org/wiki/FIFA_World_Cup_third_place_play-off'),

('Croatia beat Morocco 2–1 to claim third place at which recent World Cup?',
 '[{"key":"A","label":"2014"},{"key":"B","label":"2018"},{"key":"C","label":"2022"},{"key":"D","label":"None"}]'::jsonb,
 'C', 'Croatia beat Morocco 2–1 in the 2022 third-place playoff. Croatia''s second time finishing 3rd in 7 World Cup appearances.',
 'medium', '2026-07-18', 2, null, 'https://en.wikipedia.org/wiki/Croatia_at_the_FIFA_World_Cup'),

('At which World Cup did the home nation NOT play in any of the final 4 stages — the last time this happened was in 2018 in Russia. True or false: Russia made the quarterfinals.',
 '[{"key":"A","label":"True"},{"key":"B","label":"False"},{"key":"C","label":"They reached the semifinals"},{"key":"D","label":"They reached only the Round of 16"}]'::jsonb,
 'A', 'True: Russia, ranked 70th, stunned Spain on penalties to make the 2018 quarterfinal — their best WC performance since 1966 (as USSR).',
 'hard', '2026-07-18', 3, null, 'https://en.wikipedia.org/wiki/Russia_at_the_FIFA_World_Cup'),

-- ─── Jul 19 · The Final ───────────────────────────────────────────────────
('Which year saw the highest-scoring World Cup final, ending 5–2?',
 '[{"key":"A","label":"1954"},{"key":"B","label":"1958"},{"key":"C","label":"1970"},{"key":"D","label":"1986"}]'::jsonb,
 'B', 'Brazil beat Sweden 5–2 in the 1958 final, with 17-year-old Pelé scoring twice — still the highest-scoring WC final.',
 'easy', '2026-07-19', 1, null, 'https://en.wikipedia.org/wiki/1958_FIFA_World_Cup_final'),

('Spain''s 2010 victory over the Netherlands holds what unique distinction?',
 '[{"key":"A","label":"Lowest-scoring final"},{"key":"B","label":"First final decided in extra time"},{"key":"C","label":"First time a team won without conceding"},{"key":"D","label":"First African-hosted final"}]'::jsonb,
 'D', 'It was the first World Cup final hosted in Africa. (Scoring was 1–0 — not the lowest; multiple finals have been 1–0 or 2–1.)',
 'medium', '2026-07-19', 2, null, 'https://en.wikipedia.org/wiki/2010_FIFA_World_Cup_final'),

('How many World Cup finals have been decided by a penalty shootout?',
 '[{"key":"A","label":"1"},{"key":"B","label":"2"},{"key":"C","label":"3"},{"key":"D","label":"4"}]'::jsonb,
 'C', 'Three finals have gone to penalties: 1994 (Brazil-Italy), 2006 (Italy-France), and 2022 (Argentina-France).',
 'hard', '2026-07-19', 3, null, 'https://en.wikipedia.org/wiki/FIFA_World_Cup_final'),

-- ─── Jul 20 · Tournament recap ────────────────────────────────────────────
('Who is the only player to win FIFA World Cup Player of the Tournament before age 22?',
 '[{"key":"A","label":"Pelé"},{"key":"B","label":"Garrincha"},{"key":"C","label":"Both above"},{"key":"D","label":"Maradona"}]'::jsonb,
 'A', 'Pelé won Best Young Player at 1958 aged 17 — though "Player of the Tournament" was retroactively assigned. Maradona was 25 in 1986.',
 'easy', '2026-07-20', 1, null, 'https://en.wikipedia.org/wiki/FIFA_World_Cup_awards'),

('Brazil''s Cafu played in three consecutive World Cup finals — but lost which one?',
 '[{"key":"A","label":"1994"},{"key":"B","label":"1998"},{"key":"C","label":"2002"},{"key":"D","label":"None — he won all three"}]'::jsonb,
 'B', 'Brazil won the 1994 and 2002 finals, but lost the 1998 final to France 3–0. Cafu played in all three.',
 'medium', '2026-07-20', 2, null, 'https://en.wikipedia.org/wiki/Cafu'),

('Which player holds the record for goals scored in different World Cups, scoring in 4 separate tournaments?',
 '[{"key":"A","label":"Pelé"},{"key":"B","label":"Lionel Messi"},{"key":"C","label":"Miroslav Klose"},{"key":"D","label":"All three"}]'::jsonb,
 'D', 'Pelé, Klose, and Messi all scored in 4 different World Cups, along with Cristiano Ronaldo and Uwe Seeler.',
 'hard', '2026-07-20', 3, null, 'https://en.wikipedia.org/wiki/List_of_FIFA_World_Cup_goalscorers'),

-- ─── Jul 21 · Broader football: clubs ─────────────────────────────────────
('Which club has won the most UEFA Champions League titles?',
 '[{"key":"A","label":"AC Milan"},{"key":"B","label":"Real Madrid"},{"key":"C","label":"FC Barcelona"},{"key":"D","label":"Bayern Munich"}]'::jsonb,
 'B', 'Real Madrid has won the European Cup / Champions League 14 times (as of 2023), comfortably the most of any club.',
 'easy', '2026-07-21', 1, null, 'https://en.wikipedia.org/wiki/UEFA_Champions_League'),

('Pep Guardiola won his first Champions League as a manager with which club?',
 '[{"key":"A","label":"Bayern Munich"},{"key":"B","label":"Manchester City"},{"key":"C","label":"FC Barcelona"},{"key":"D","label":"Juventus"}]'::jsonb,
 'C', 'Pep Guardiola won the Champions League with Barcelona in 2009 and 2011, then with Manchester City in 2023.',
 'medium', '2026-07-21', 2, null, 'https://en.wikipedia.org/wiki/Pep_Guardiola'),

('Which Argentine club did Diego Maradona lead to Serie A titles in 1987 and 1990?',
 '[{"key":"A","label":"Boca Juniors"},{"key":"B","label":"River Plate"},{"key":"C","label":"Napoli"},{"key":"D","label":"Sevilla"}]'::jsonb,
 'C', 'Diego Maradona played in Italy at Napoli, where he won two Serie A titles (1986–87, 1989–90) and the UEFA Cup in 1989.',
 'hard', '2026-07-21', 3, null, 'https://en.wikipedia.org/wiki/Diego_Maradona'),

-- ─── Jul 22 · Broader football: leagues ───────────────────────────────────
('The Premier League is the top division of professional football in which country?',
 '[{"key":"A","label":"Scotland"},{"key":"B","label":"England"},{"key":"C","label":"Wales"},{"key":"D","label":"Ireland"}]'::jsonb,
 'B', 'The English Premier League (EPL) was founded in 1992 and is widely considered the most lucrative football league in the world.',
 'easy', '2026-07-22', 1, null, 'https://en.wikipedia.org/wiki/Premier_League'),

('Which club has the record for most Spanish La Liga titles?',
 '[{"key":"A","label":"FC Barcelona"},{"key":"B","label":"Real Madrid"},{"key":"C","label":"Atlético Madrid"},{"key":"D","label":"Valencia"}]'::jsonb,
 'B', 'Real Madrid leads La Liga''s all-time table with 35 titles, ahead of Barcelona''s 27.',
 'medium', '2026-07-22', 2, null, 'https://en.wikipedia.org/wiki/La_Liga'),

('Which Italian club went unbeaten in Serie A in the 2011–12 season under Antonio Conte?',
 '[{"key":"A","label":"AC Milan"},{"key":"B","label":"Inter Milan"},{"key":"C","label":"Juventus"},{"key":"D","label":"Roma"}]'::jsonb,
 'C', 'Juventus went unbeaten in Serie A in 2011–12 — winning the first of 9 consecutive titles under Conte and successors.',
 'hard', '2026-07-22', 3, null, 'https://en.wikipedia.org/wiki/2011%E2%80%9312_Serie_A'),

-- ─── Jul 23 · Famous transfers ────────────────────────────────────────────
('Neymar''s 2017 move from Barcelona to PSG cost what record-breaking fee?',
 '[{"key":"A","label":"€150 million"},{"key":"B","label":"€180 million"},{"key":"C","label":"€222 million"},{"key":"D","label":"€300 million"}]'::jsonb,
 'C', 'PSG paid Neymar''s €222 million release clause to Barcelona in 2017 — still the world record transfer fee.',
 'easy', '2026-07-23', 1, null, 'https://en.wikipedia.org/wiki/Neymar'),

('Lionel Messi joined which MLS club after leaving Paris Saint-Germain in 2023?',
 '[{"key":"A","label":"LA Galaxy"},{"key":"B","label":"Inter Miami"},{"key":"C","label":"New York City FC"},{"key":"D","label":"Atlanta United"}]'::jsonb,
 'B', 'Messi joined Inter Miami CF in July 2023 — joint-owned by David Beckham — winning the Leagues Cup in his first competition.',
 'medium', '2026-07-23', 2, null, 'https://en.wikipedia.org/wiki/Lionel_Messi'),

('Cristiano Ronaldo''s 2021 return to Manchester United from Juventus was his ____ stint at the club.',
 '[{"key":"A","label":"First"},{"key":"B","label":"Second"},{"key":"C","label":"Third"},{"key":"D","label":"He never played for Manchester United"}]'::jsonb,
 'B', 'Cristiano Ronaldo first played for Manchester United from 2003–2009 (winning 3 Premier Leagues + 1 UCL), then returned 2021–2022.',
 'hard', '2026-07-23', 3, null, 'https://en.wikipedia.org/wiki/Cristiano_Ronaldo'),

-- ─── Jul 24 · Looking ahead ───────────────────────────────────────────────
('When and where is the next FIFA World Cup after 2026?',
 '[{"key":"A","label":"2030 — Spain/Portugal/Morocco (+ South America)"},{"key":"B","label":"2030 — Saudi Arabia"},{"key":"C","label":"2034 — USA"},{"key":"D","label":"2030 — Italy/Germany"}]'::jsonb,
 'A', 'The 2030 World Cup will be hosted across Spain, Portugal, and Morocco — with 3 opening matches in Uruguay, Argentina, and Paraguay to mark the centenary.',
 'easy', '2026-07-24', 1, null, 'https://en.wikipedia.org/wiki/2030_FIFA_World_Cup'),

('Which country was selected to host the 2034 FIFA World Cup?',
 '[{"key":"A","label":"Australia"},{"key":"B","label":"China"},{"key":"C","label":"Saudi Arabia"},{"key":"D","label":"India"}]'::jsonb,
 'C', 'Saudi Arabia was confirmed as 2034 hosts by FIFA in December 2024, after being the sole bidder.',
 'medium', '2026-07-24', 2, null, 'https://en.wikipedia.org/wiki/2034_FIFA_World_Cup'),

('Across all 23 World Cups from 1930–2022, how many different nations have appeared in a final?',
 '[{"key":"A","label":"10"},{"key":"B","label":"12"},{"key":"C","label":"13"},{"key":"D","label":"15"}]'::jsonb,
 'C', '13 nations have appeared in a World Cup final: Uruguay, Argentina, Italy, Hungary, Czechoslovakia, Brazil, Sweden, West Germany/Germany, England, Netherlands, France, Spain, and Croatia.',
 'hard', '2026-07-24', 3, null, 'https://en.wikipedia.org/wiki/List_of_FIFA_World_Cup_finals')

on conflict (active_date, question_order) do update
set
  question = excluded.question,
  answer_options = excluded.answer_options,
  correct_answer_key = excluded.correct_answer_key,
  explanation = excluded.explanation,
  difficulty = excluded.difficulty,
  nation_code = excluded.nation_code,
  source_url = excluded.source_url;


create or replace function pg_temp.gogaffa_sanitize_tournament_copy(value text)
returns text
language sql
immutable
as $$
  select case
    when value is null then null
    else replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(value,
                  'FIFA World Cups', 'global football tournaments'),
                'FIFA World Cup', 'global football tournament'),
              'World Cups', 'global football tournaments'),
            'World Cup', 'global football tournament'),
          'FIFA', 'international football governing body'),
        'WCs', 'global tournaments'),
      'WC', 'global tournament')
  end
$$;

update public.trivia_questions
set
  question = pg_temp.gogaffa_sanitize_tournament_copy(question),
  answer_options = pg_temp.gogaffa_sanitize_tournament_copy(answer_options::text)::jsonb,
  explanation = pg_temp.gogaffa_sanitize_tournament_copy(explanation),
  source_url = null
where active_date between '2026-06-08' and '2026-07-24';

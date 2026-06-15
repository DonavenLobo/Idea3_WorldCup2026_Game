-- Adds the cache keys used by the live score sync function and backfills the
-- full 104-match schedule into public.matches.
--
-- match_num is our committed schedule fixture number from packages/config.
-- score_source_match_id is the upstream worldcup26.ir game id, which differs
-- from match_num for several group-stage fixtures.

alter table public.matches
  add column if not exists match_num integer,
  add column if not exists score_source text,
  add column if not exists score_source_match_id text,
  add column if not exists score_synced_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'matches_match_num_check'
      and conrelid = 'public.matches'::regclass
  ) then
    alter table public.matches
      add constraint matches_match_num_check
      check (match_num is null or (match_num between 1 and 104));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'matches_match_num_key'
      and conrelid = 'public.matches'::regclass
  ) then
    alter table public.matches
      add constraint matches_match_num_key unique (match_num);
  end if;
end $$;

create unique index if not exists matches_score_source_match_id_uniq
  on public.matches (score_source, score_source_match_id)
  where score_source is not null and score_source_match_id is not null;

create index if not exists matches_live_status_idx
  on public.matches (status, kickoff)
  where status = 'live';

insert into public.matches (
  id,
  match_num,
  round,
  group_id,
  bracket_index,
  home_team_code,
  away_team_code,
  kickoff,
  venue,
  status,
  score_source,
  score_source_match_id
)
values
  ('G-A-1', 1, 'group', 'A', null, 'MEX', 'RSA', '2026-06-11T19:00:00.000Z', 'Mexico City', 'scheduled', 'worldcup26.ir', '1'),
  ('G-A-2', 2, 'group', 'A', null, 'KOR', 'CZE', '2026-06-12T02:00:00.000Z', 'Guadalajara (Zapopan)', 'scheduled', 'worldcup26.ir', '2'),
  ('G-B-1', 3, 'group', 'B', null, 'CAN', 'BIH', '2026-06-12T19:00:00.000Z', 'Toronto', 'scheduled', 'worldcup26.ir', '3'),
  ('G-D-1', 4, 'group', 'D', null, 'USA', 'PAR', '2026-06-13T01:00:00.000Z', 'Los Angeles (Inglewood)', 'scheduled', 'worldcup26.ir', '4'),
  ('G-B-2', 5, 'group', 'B', null, 'QAT', 'SUI', '2026-06-13T19:00:00.000Z', 'San Francisco Bay Area (Santa Clara)', 'scheduled', 'worldcup26.ir', '8'),
  ('G-C-1', 6, 'group', 'C', null, 'BRA', 'MAR', '2026-06-13T22:00:00.000Z', 'New York/New Jersey (East Rutherford)', 'scheduled', 'worldcup26.ir', '7'),
  ('G-C-2', 7, 'group', 'C', null, 'HAI', 'SCO', '2026-06-14T01:00:00.000Z', 'Boston (Foxborough)', 'scheduled', 'worldcup26.ir', '5'),
  ('G-D-2', 8, 'group', 'D', null, 'AUS', 'TUR', '2026-06-14T04:00:00.000Z', 'Vancouver', 'scheduled', 'worldcup26.ir', '6'),
  ('G-E-1', 9, 'group', 'E', null, 'GER', 'CUW', '2026-06-14T17:00:00.000Z', 'Houston', 'scheduled', 'worldcup26.ir', '10'),
  ('G-F-1', 10, 'group', 'F', null, 'NED', 'JPN', '2026-06-14T20:00:00.000Z', 'Dallas (Arlington)', 'scheduled', 'worldcup26.ir', '11'),
  ('G-E-2', 11, 'group', 'E', null, 'CIV', 'ECU', '2026-06-14T23:00:00.000Z', 'Philadelphia', 'scheduled', 'worldcup26.ir', '9'),
  ('G-F-2', 12, 'group', 'F', null, 'SWE', 'TUN', '2026-06-15T02:00:00.000Z', 'Monterrey (Guadalupe)', 'scheduled', 'worldcup26.ir', '12'),
  ('G-H-1', 13, 'group', 'H', null, 'ESP', 'CPV', '2026-06-15T16:00:00.000Z', 'Atlanta', 'scheduled', 'worldcup26.ir', '14'),
  ('G-G-1', 14, 'group', 'G', null, 'BEL', 'EGY', '2026-06-15T19:00:00.000Z', 'Seattle', 'scheduled', 'worldcup26.ir', '15'),
  ('G-H-2', 15, 'group', 'H', null, 'KSA', 'URU', '2026-06-15T22:00:00.000Z', 'Miami (Miami Gardens)', 'scheduled', 'worldcup26.ir', '16'),
  ('G-G-2', 16, 'group', 'G', null, 'IRN', 'NZL', '2026-06-16T01:00:00.000Z', 'Los Angeles (Inglewood)', 'scheduled', 'worldcup26.ir', '13'),
  ('G-I-1', 17, 'group', 'I', null, 'FRA', 'SEN', '2026-06-16T19:00:00.000Z', 'New York/New Jersey (East Rutherford)', 'scheduled', 'worldcup26.ir', '17'),
  ('G-I-2', 18, 'group', 'I', null, 'IRQ', 'NOR', '2026-06-16T22:00:00.000Z', 'Boston (Foxborough)', 'scheduled', 'worldcup26.ir', '18'),
  ('G-J-1', 19, 'group', 'J', null, 'ARG', 'ALG', '2026-06-17T01:00:00.000Z', 'Kansas City', 'scheduled', 'worldcup26.ir', '19'),
  ('G-J-2', 20, 'group', 'J', null, 'AUT', 'JOR', '2026-06-17T04:00:00.000Z', 'San Francisco Bay Area (Santa Clara)', 'scheduled', 'worldcup26.ir', '20'),
  ('G-K-1', 21, 'group', 'K', null, 'POR', 'COD', '2026-06-17T17:00:00.000Z', 'Houston', 'scheduled', 'worldcup26.ir', '21'),
  ('G-L-1', 22, 'group', 'L', null, 'ENG', 'CRO', '2026-06-17T20:00:00.000Z', 'Dallas (Arlington)', 'scheduled', 'worldcup26.ir', '22'),
  ('G-L-2', 23, 'group', 'L', null, 'GHA', 'PAN', '2026-06-17T23:00:00.000Z', 'Toronto', 'scheduled', 'worldcup26.ir', '24'),
  ('G-K-2', 24, 'group', 'K', null, 'UZB', 'COL', '2026-06-18T02:00:00.000Z', 'Mexico City', 'scheduled', 'worldcup26.ir', '23'),
  ('G-A-3', 25, 'group', 'A', null, 'CZE', 'RSA', '2026-06-18T16:00:00.000Z', 'Atlanta', 'scheduled', 'worldcup26.ir', '28'),
  ('G-B-3', 26, 'group', 'B', null, 'SUI', 'BIH', '2026-06-18T19:00:00.000Z', 'Los Angeles (Inglewood)', 'scheduled', 'worldcup26.ir', '26'),
  ('G-B-4', 27, 'group', 'B', null, 'CAN', 'QAT', '2026-06-18T22:00:00.000Z', 'Vancouver', 'scheduled', 'worldcup26.ir', '27'),
  ('G-A-4', 28, 'group', 'A', null, 'MEX', 'KOR', '2026-06-19T01:00:00.000Z', 'Guadalajara (Zapopan)', 'scheduled', 'worldcup26.ir', '25'),
  ('G-D-3', 29, 'group', 'D', null, 'USA', 'AUS', '2026-06-19T19:00:00.000Z', 'Seattle', 'scheduled', 'worldcup26.ir', '31'),
  ('G-C-3', 30, 'group', 'C', null, 'SCO', 'MAR', '2026-06-19T22:00:00.000Z', 'Boston (Foxborough)', 'scheduled', 'worldcup26.ir', '30'),
  ('G-C-4', 31, 'group', 'C', null, 'BRA', 'HAI', '2026-06-20T00:30:00.000Z', 'Philadelphia', 'scheduled', 'worldcup26.ir', '29'),
  ('G-D-4', 32, 'group', 'D', null, 'TUR', 'PAR', '2026-06-20T03:00:00.000Z', 'San Francisco Bay Area (Santa Clara)', 'scheduled', 'worldcup26.ir', '32'),
  ('G-F-3', 33, 'group', 'F', null, 'NED', 'SWE', '2026-06-20T17:00:00.000Z', 'Houston', 'scheduled', 'worldcup26.ir', '35'),
  ('G-E-3', 34, 'group', 'E', null, 'GER', 'CIV', '2026-06-20T20:00:00.000Z', 'Toronto', 'scheduled', 'worldcup26.ir', '33'),
  ('G-E-4', 35, 'group', 'E', null, 'ECU', 'CUW', '2026-06-21T00:00:00.000Z', 'Kansas City', 'scheduled', 'worldcup26.ir', '34'),
  ('G-F-4', 36, 'group', 'F', null, 'TUN', 'JPN', '2026-06-21T04:00:00.000Z', 'Monterrey (Guadalupe)', 'scheduled', 'worldcup26.ir', '36'),
  ('G-H-3', 37, 'group', 'H', null, 'ESP', 'KSA', '2026-06-21T16:00:00.000Z', 'Atlanta', 'scheduled', 'worldcup26.ir', '39'),
  ('G-G-3', 38, 'group', 'G', null, 'BEL', 'IRN', '2026-06-21T19:00:00.000Z', 'Los Angeles (Inglewood)', 'scheduled', 'worldcup26.ir', '37'),
  ('G-H-4', 39, 'group', 'H', null, 'URU', 'CPV', '2026-06-21T22:00:00.000Z', 'Miami (Miami Gardens)', 'scheduled', 'worldcup26.ir', '40'),
  ('G-G-4', 40, 'group', 'G', null, 'NZL', 'EGY', '2026-06-22T01:00:00.000Z', 'Vancouver', 'scheduled', 'worldcup26.ir', '38'),
  ('G-J-3', 41, 'group', 'J', null, 'ARG', 'AUT', '2026-06-22T17:00:00.000Z', 'Dallas (Arlington)', 'scheduled', 'worldcup26.ir', '43'),
  ('G-I-3', 42, 'group', 'I', null, 'FRA', 'IRQ', '2026-06-22T21:00:00.000Z', 'Philadelphia', 'scheduled', 'worldcup26.ir', '41'),
  ('G-I-4', 43, 'group', 'I', null, 'NOR', 'SEN', '2026-06-23T00:00:00.000Z', 'New York/New Jersey (East Rutherford)', 'scheduled', 'worldcup26.ir', '42'),
  ('G-J-4', 44, 'group', 'J', null, 'JOR', 'ALG', '2026-06-23T03:00:00.000Z', 'San Francisco Bay Area (Santa Clara)', 'scheduled', 'worldcup26.ir', '44'),
  ('G-K-3', 45, 'group', 'K', null, 'POR', 'UZB', '2026-06-23T17:00:00.000Z', 'Houston', 'scheduled', 'worldcup26.ir', '45'),
  ('G-L-3', 46, 'group', 'L', null, 'ENG', 'GHA', '2026-06-23T20:00:00.000Z', 'Boston (Foxborough)', 'scheduled', 'worldcup26.ir', '48'),
  ('G-L-4', 47, 'group', 'L', null, 'PAN', 'CRO', '2026-06-23T23:00:00.000Z', 'Toronto', 'scheduled', 'worldcup26.ir', '46'),
  ('G-K-4', 48, 'group', 'K', null, 'COL', 'COD', '2026-06-24T02:00:00.000Z', 'Guadalajara (Zapopan)', 'scheduled', 'worldcup26.ir', '47'),
  ('G-B-5', 49, 'group', 'B', null, 'BIH', 'QAT', '2026-06-24T19:00:00.000Z', 'Seattle', 'scheduled', 'worldcup26.ir', '53'),
  ('G-B-6', 50, 'group', 'B', null, 'SUI', 'CAN', '2026-06-24T19:00:00.000Z', 'Vancouver', 'scheduled', 'worldcup26.ir', '54'),
  ('G-C-5', 51, 'group', 'C', null, 'MAR', 'HAI', '2026-06-24T22:00:00.000Z', 'Atlanta', 'scheduled', 'worldcup26.ir', '50'),
  ('G-C-6', 52, 'group', 'C', null, 'SCO', 'BRA', '2026-06-24T22:00:00.000Z', 'Miami (Miami Gardens)', 'scheduled', 'worldcup26.ir', '49'),
  ('G-A-5', 53, 'group', 'A', null, 'CZE', 'MEX', '2026-06-25T01:00:00.000Z', 'Mexico City', 'scheduled', 'worldcup26.ir', '52'),
  ('G-A-6', 54, 'group', 'A', null, 'RSA', 'KOR', '2026-06-25T01:00:00.000Z', 'Monterrey (Guadalupe)', 'scheduled', 'worldcup26.ir', '51'),
  ('G-E-5', 55, 'group', 'E', null, 'ECU', 'GER', '2026-06-25T20:00:00.000Z', 'New York/New Jersey (East Rutherford)', 'scheduled', 'worldcup26.ir', '56'),
  ('G-E-6', 56, 'group', 'E', null, 'CUW', 'CIV', '2026-06-25T20:00:00.000Z', 'Philadelphia', 'scheduled', 'worldcup26.ir', '55'),
  ('G-F-5', 57, 'group', 'F', null, 'JPN', 'SWE', '2026-06-25T23:00:00.000Z', 'Dallas (Arlington)', 'scheduled', 'worldcup26.ir', '59'),
  ('G-F-6', 58, 'group', 'F', null, 'TUN', 'NED', '2026-06-25T23:00:00.000Z', 'Kansas City', 'scheduled', 'worldcup26.ir', '60'),
  ('G-D-5', 59, 'group', 'D', null, 'TUR', 'USA', '2026-06-26T02:00:00.000Z', 'Los Angeles (Inglewood)', 'scheduled', 'worldcup26.ir', '58'),
  ('G-D-6', 60, 'group', 'D', null, 'PAR', 'AUS', '2026-06-26T02:00:00.000Z', 'San Francisco Bay Area (Santa Clara)', 'scheduled', 'worldcup26.ir', '57'),
  ('G-I-5', 61, 'group', 'I', null, 'NOR', 'FRA', '2026-06-26T19:00:00.000Z', 'Boston (Foxborough)', 'scheduled', 'worldcup26.ir', '62'),
  ('G-I-6', 62, 'group', 'I', null, 'SEN', 'IRQ', '2026-06-26T19:00:00.000Z', 'Toronto', 'scheduled', 'worldcup26.ir', '61'),
  ('G-H-5', 63, 'group', 'H', null, 'URU', 'ESP', '2026-06-27T00:00:00.000Z', 'Guadalajara (Zapopan)', 'scheduled', 'worldcup26.ir', '66'),
  ('G-H-6', 64, 'group', 'H', null, 'CPV', 'KSA', '2026-06-27T00:00:00.000Z', 'Houston', 'scheduled', 'worldcup26.ir', '65'),
  ('G-G-5', 65, 'group', 'G', null, 'EGY', 'IRN', '2026-06-27T03:00:00.000Z', 'Seattle', 'scheduled', 'worldcup26.ir', '63'),
  ('G-G-6', 66, 'group', 'G', null, 'NZL', 'BEL', '2026-06-27T03:00:00.000Z', 'Vancouver', 'scheduled', 'worldcup26.ir', '64'),
  ('G-L-5', 67, 'group', 'L', null, 'PAN', 'ENG', '2026-06-27T21:00:00.000Z', 'New York/New Jersey (East Rutherford)', 'scheduled', 'worldcup26.ir', '67'),
  ('G-L-6', 68, 'group', 'L', null, 'CRO', 'GHA', '2026-06-27T21:00:00.000Z', 'Philadelphia', 'scheduled', 'worldcup26.ir', '68'),
  ('G-K-5', 69, 'group', 'K', null, 'COD', 'UZB', '2026-06-27T23:30:00.000Z', 'Atlanta', 'scheduled', 'worldcup26.ir', '72'),
  ('G-K-6', 70, 'group', 'K', null, 'COL', 'POR', '2026-06-27T23:30:00.000Z', 'Miami (Miami Gardens)', 'scheduled', 'worldcup26.ir', '71'),
  ('G-J-5', 71, 'group', 'J', null, 'JOR', 'ARG', '2026-06-28T02:00:00.000Z', 'Dallas (Arlington)', 'scheduled', 'worldcup26.ir', '70'),
  ('G-J-6', 72, 'group', 'J', null, 'ALG', 'AUT', '2026-06-28T02:00:00.000Z', 'Kansas City', 'scheduled', 'worldcup26.ir', '69'),
  ('K-R32-1', 73, 'r32', null, 0, null, null, '2026-06-28T19:00:00.000Z', 'Los Angeles (Inglewood)', 'scheduled', 'worldcup26.ir', '73'),
  ('K-R32-2', 76, 'r32', null, 1, null, null, '2026-06-29T17:00:00.000Z', 'Houston', 'scheduled', 'worldcup26.ir', '76'),
  ('K-R32-3', 74, 'r32', null, 2, null, null, '2026-06-29T20:30:00.000Z', 'Boston (Foxborough)', 'scheduled', 'worldcup26.ir', '74'),
  ('K-R32-4', 75, 'r32', null, 3, null, null, '2026-06-30T01:00:00.000Z', 'Monterrey (Guadalupe)', 'scheduled', 'worldcup26.ir', '75'),
  ('K-R32-5', 78, 'r32', null, 4, null, null, '2026-06-30T17:00:00.000Z', 'Dallas (Arlington)', 'scheduled', 'worldcup26.ir', '78'),
  ('K-R32-6', 77, 'r32', null, 5, null, null, '2026-06-30T21:00:00.000Z', 'New York/New Jersey (East Rutherford)', 'scheduled', 'worldcup26.ir', '77'),
  ('K-R32-7', 79, 'r32', null, 6, null, null, '2026-07-01T01:00:00.000Z', 'Mexico City', 'scheduled', 'worldcup26.ir', '79'),
  ('K-R32-8', 80, 'r32', null, 7, null, null, '2026-07-01T16:00:00.000Z', 'Atlanta', 'scheduled', 'worldcup26.ir', '80'),
  ('K-R32-9', 82, 'r32', null, 8, null, null, '2026-07-01T20:00:00.000Z', 'Seattle', 'scheduled', 'worldcup26.ir', '82'),
  ('K-R32-10', 81, 'r32', null, 9, null, null, '2026-07-02T00:00:00.000Z', 'San Francisco Bay Area (Santa Clara)', 'scheduled', 'worldcup26.ir', '81'),
  ('K-R32-11', 84, 'r32', null, 10, null, null, '2026-07-02T19:00:00.000Z', 'Los Angeles (Inglewood)', 'scheduled', 'worldcup26.ir', '84'),
  ('K-R32-12', 83, 'r32', null, 11, null, null, '2026-07-02T23:00:00.000Z', 'Toronto', 'scheduled', 'worldcup26.ir', '83'),
  ('K-R32-13', 85, 'r32', null, 12, null, null, '2026-07-03T03:00:00.000Z', 'Vancouver', 'scheduled', 'worldcup26.ir', '85'),
  ('K-R32-14', 88, 'r32', null, 13, null, null, '2026-07-03T18:00:00.000Z', 'Dallas (Arlington)', 'scheduled', 'worldcup26.ir', '88'),
  ('K-R32-15', 86, 'r32', null, 14, null, null, '2026-07-03T22:00:00.000Z', 'Miami (Miami Gardens)', 'scheduled', 'worldcup26.ir', '86'),
  ('K-R32-16', 87, 'r32', null, 15, null, null, '2026-07-04T01:30:00.000Z', 'Kansas City', 'scheduled', 'worldcup26.ir', '87'),
  ('K-R16-1', 90, 'r16', null, 0, null, null, '2026-07-04T17:00:00.000Z', 'Houston', 'scheduled', 'worldcup26.ir', '90'),
  ('K-R16-2', 89, 'r16', null, 1, null, null, '2026-07-04T21:00:00.000Z', 'Philadelphia', 'scheduled', 'worldcup26.ir', '89'),
  ('K-R16-3', 91, 'r16', null, 2, null, null, '2026-07-05T20:00:00.000Z', 'New York/New Jersey (East Rutherford)', 'scheduled', 'worldcup26.ir', '91'),
  ('K-R16-4', 92, 'r16', null, 3, null, null, '2026-07-06T00:00:00.000Z', 'Mexico City', 'scheduled', 'worldcup26.ir', '92'),
  ('K-R16-5', 93, 'r16', null, 4, null, null, '2026-07-06T19:00:00.000Z', 'Dallas (Arlington)', 'scheduled', 'worldcup26.ir', '93'),
  ('K-R16-6', 94, 'r16', null, 5, null, null, '2026-07-07T00:00:00.000Z', 'Seattle', 'scheduled', 'worldcup26.ir', '94'),
  ('K-R16-7', 95, 'r16', null, 6, null, null, '2026-07-07T16:00:00.000Z', 'Atlanta', 'scheduled', 'worldcup26.ir', '95'),
  ('K-R16-8', 96, 'r16', null, 7, null, null, '2026-07-07T20:00:00.000Z', 'Vancouver', 'scheduled', 'worldcup26.ir', '96'),
  ('K-QF-1', 97, 'qf', null, 0, null, null, '2026-07-09T20:00:00.000Z', 'Boston (Foxborough)', 'scheduled', 'worldcup26.ir', '97'),
  ('K-QF-2', 98, 'qf', null, 1, null, null, '2026-07-10T19:00:00.000Z', 'Los Angeles (Inglewood)', 'scheduled', 'worldcup26.ir', '98'),
  ('K-QF-3', 99, 'qf', null, 2, null, null, '2026-07-11T21:00:00.000Z', 'Miami (Miami Gardens)', 'scheduled', 'worldcup26.ir', '99'),
  ('K-QF-4', 100, 'qf', null, 3, null, null, '2026-07-12T01:00:00.000Z', 'Kansas City', 'scheduled', 'worldcup26.ir', '100'),
  ('K-SF-1', 101, 'sf', null, 0, null, null, '2026-07-14T19:00:00.000Z', 'Dallas (Arlington)', 'scheduled', 'worldcup26.ir', '101'),
  ('K-SF-2', 102, 'sf', null, 1, null, null, '2026-07-15T19:00:00.000Z', 'Atlanta', 'scheduled', 'worldcup26.ir', '102'),
  ('K-3RD-1', 103, 'third', null, 0, null, null, '2026-07-18T21:00:00.000Z', 'Miami (Miami Gardens)', 'scheduled', 'worldcup26.ir', '103'),
  ('K-FINAL-1', 104, 'final', null, 0, null, null, '2026-07-19T19:00:00.000Z', 'New York/New Jersey (East Rutherford)', 'scheduled', 'worldcup26.ir', '104')
on conflict (id) do update set
  match_num = excluded.match_num,
  round = excluded.round,
  group_id = excluded.group_id,
  bracket_index = excluded.bracket_index,
  home_team_code = excluded.home_team_code,
  away_team_code = excluded.away_team_code,
  kickoff = excluded.kickoff,
  venue = excluded.venue,
  score_source = excluded.score_source,
  score_source_match_id = excluded.score_source_match_id,
  updated_at = now();

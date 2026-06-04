-- supabase/migrations/000020_matches_table.sql
-- Canonical World Cup match data. Source of truth for bracket lockout and
-- the schedule tab. This PR seeds the 44 LOCKABLE units (12 group first
-- kickoffs + 32 knockout matches). Remaining 60 group games (matchdays
-- 2 and 3 across all 12 groups) come in a follow-up PR.
--
-- All kickoffs sourced June 3, 2026 from:
--   - ESPN:     https://www.espn.com/soccer/story/_/id/48939282/...
--   - Wikipedia: https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
-- ET kickoff times (EDT = UTC-4 in June/July) converted to UTC.
-- ⚠️ Sources disagreed on the Final (3pm vs 7pm ET) and 3rd-place;
-- we used Wikipedia. Re-verify against fifa.com before merging.

create table if not exists public.matches (
  id text primary key,                              -- "M01"..."M104"
  round text not null check (round in ('group','r32','r16','qf','sf','third','final')),
  group_id text check (group_id ~ '^[A-L]$'),       -- NULL for knockouts
  bracket_index integer check (bracket_index >= 0), -- NULL for group; 0..N-1 for knockouts within a round
  home_team_code text,                              -- NULL until known (knockouts depend on group results)
  away_team_code text,
  kickoff timestamptz not null,
  venue text,
  status text not null default 'scheduled'
    check (status in ('scheduled','live','completed')),
  home_score integer,
  away_score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Per-row consistency: group rows have group_id but no bracket_index;
  -- knockout rows have bracket_index but no group_id.
  constraint matches_round_keys check (
    (round = 'group' and group_id is not null and bracket_index is null)
    or (round <> 'group' and group_id is null and bracket_index is not null)
  )
);

-- Helpful indices for the access patterns we use
create index if not exists matches_round_kickoff_idx on public.matches (round, kickoff);
create index if not exists matches_group_kickoff_idx on public.matches (group_id, kickoff) where group_id is not null;
-- Chronological scan for the schedule tab ("SELECT * ORDER BY kickoff")
create index if not exists matches_kickoff_idx on public.matches (kickoff);
-- Knockout rows must be unique on (round, bracket_index) — partial since
-- group rows have NULL bracket_index.
create unique index if not exists matches_round_bracket_uniq
  on public.matches (round, bracket_index)
  where round <> 'group';

alter table public.matches enable row level security;

-- Everyone authenticated can read. No write policy — only the service role
-- (used by edge functions) can mutate. Future PRs that ingest live scores
-- will go through an admin edge function or a scheduled job.
-- Drop-then-create so this migration is safe to re-run on Postgres 15
-- (CREATE POLICY IF NOT EXISTS requires Postgres 16+).
drop policy if exists "Authenticated read matches" on public.matches;
create policy "Authenticated read matches"
  on public.matches for select
  to authenticated
  using (true);

-- Seed: 12 group first kickoffs.
-- We synthesize a stable id per group ("G-A-1" = Group A first match) so the
-- backfill PR can add G-A-2 and G-A-3 without touching the row primary key.
insert into public.matches (id, round, group_id, bracket_index, home_team_code, away_team_code, kickoff, venue, status)
values
  ('G-A-1', 'group', 'A', null, 'MEX', 'RSA', '2026-06-11T19:00:00Z', 'Estadio Azteca, Mexico City', 'scheduled'),
  ('G-B-1', 'group', 'B', null, 'CAN', 'BIH', '2026-06-12T19:00:00Z', 'BMO Field, Toronto',         'scheduled'),
  ('G-C-1', 'group', 'C', null, 'BRA', 'MAR', '2026-06-13T22:00:00Z', 'MetLife Stadium, NY/NJ',     'scheduled'),
  ('G-D-1', 'group', 'D', null, 'USA', 'PAR', '2026-06-13T01:00:00Z', 'SoFi Stadium, Los Angeles',  'scheduled'),
  ('G-E-1', 'group', 'E', null, 'GER', 'CUW', '2026-06-14T17:00:00Z', 'TBD',                        'scheduled'),
  ('G-F-1', 'group', 'F', null, 'NED', 'JPN', '2026-06-14T20:00:00Z', 'TBD',                        'scheduled'),
  ('G-G-1', 'group', 'G', null, 'BEL', 'EGY', '2026-06-15T22:00:00Z', 'TBD',                        'scheduled'),
  ('G-H-1', 'group', 'H', null, 'ESP', 'CPV', '2026-06-15T17:00:00Z', 'TBD',                        'scheduled'),
  ('G-I-1', 'group', 'I', null, 'FRA', 'SEN', '2026-06-16T19:00:00Z', 'TBD',                        'scheduled'),
  ('G-J-1', 'group', 'J', null, 'ARG', 'ALG', '2026-06-17T01:00:00Z', 'TBD',                        'scheduled'),
  ('G-K-1', 'group', 'K', null, 'POR', 'COD', '2026-06-17T17:00:00Z', 'TBD',                        'scheduled'),
  ('G-L-1', 'group', 'L', null, 'ENG', 'CRO', '2026-06-17T20:00:00Z', 'TBD',                        'scheduled')
on conflict (id) do update set
  round = excluded.round, group_id = excluded.group_id, bracket_index = excluded.bracket_index,
  home_team_code = excluded.home_team_code, away_team_code = excluded.away_team_code,
  kickoff = excluded.kickoff, venue = excluded.venue, status = excluded.status,
  updated_at = now();

-- Seed: 16 Round of 32 matches
insert into public.matches (id, round, group_id, bracket_index, home_team_code, away_team_code, kickoff, venue, status)
values
  ('K-R32-1',  'r32', null,  0, null, null, '2026-06-28T19:00:00Z', 'SoFi Stadium, Los Angeles',      'scheduled'),
  ('K-R32-2',  'r32', null,  1, null, null, '2026-06-29T17:00:00Z', 'NRG Stadium, Houston',           'scheduled'),
  ('K-R32-3',  'r32', null,  2, null, null, '2026-06-29T20:30:00Z', 'Gillette Stadium, Boston',       'scheduled'),
  ('K-R32-4',  'r32', null,  3, null, null, '2026-06-30T01:00:00Z', 'Estadio BBVA, Monterrey',        'scheduled'),
  ('K-R32-5',  'r32', null,  4, null, null, '2026-06-30T17:00:00Z', 'AT&T Stadium, Dallas',           'scheduled'),
  ('K-R32-6',  'r32', null,  5, null, null, '2026-06-30T21:00:00Z', 'MetLife Stadium, NY/NJ',         'scheduled'),
  ('K-R32-7',  'r32', null,  6, null, null, '2026-07-01T01:00:00Z', 'Estadio Azteca, Mexico City',    'scheduled'),
  ('K-R32-8',  'r32', null,  7, null, null, '2026-07-01T16:00:00Z', 'Mercedes-Benz Stadium, Atlanta', 'scheduled'),
  ('K-R32-9',  'r32', null,  8, null, null, '2026-07-01T20:00:00Z', 'Lumen Field, Seattle',           'scheduled'),
  ('K-R32-10', 'r32', null,  9, null, null, '2026-07-02T00:00:00Z', 'Levi''s Stadium, San Francisco',  'scheduled'),
  ('K-R32-11', 'r32', null, 10, null, null, '2026-07-02T19:00:00Z', 'SoFi Stadium, Los Angeles',      'scheduled'),
  ('K-R32-12', 'r32', null, 11, null, null, '2026-07-02T23:00:00Z', 'BMO Field, Toronto',             'scheduled'),
  ('K-R32-13', 'r32', null, 12, null, null, '2026-07-03T03:00:00Z', 'BC Place, Vancouver',            'scheduled'),
  ('K-R32-14', 'r32', null, 13, null, null, '2026-07-03T18:00:00Z', 'AT&T Stadium, Dallas',           'scheduled'),
  ('K-R32-15', 'r32', null, 14, null, null, '2026-07-03T22:00:00Z', 'Hard Rock Stadium, Miami',       'scheduled'),
  ('K-R32-16', 'r32', null, 15, null, null, '2026-07-04T01:30:00Z', 'Arrowhead Stadium, Kansas City', 'scheduled')
on conflict (id) do update set
  kickoff = excluded.kickoff, venue = excluded.venue, status = excluded.status, updated_at = now();

-- Seed: 8 Round of 16 matches
insert into public.matches (id, round, group_id, bracket_index, kickoff, venue, status)
values
  ('K-R16-1', 'r16', null, 0, '2026-07-04T19:00:00Z', 'NRG Stadium, Houston',                 'scheduled'),
  ('K-R16-2', 'r16', null, 1, '2026-07-05T00:00:00Z', 'Lincoln Financial Field, Philadelphia','scheduled'),
  ('K-R16-3', 'r16', null, 2, '2026-07-05T23:00:00Z', 'Estadio Azteca, Mexico City',          'scheduled'),
  ('K-R16-4', 'r16', null, 3, '2026-07-06T00:00:00Z', 'MetLife Stadium, NY/NJ',               'scheduled'),
  ('K-R16-5', 'r16', null, 4, '2026-07-06T23:00:00Z', 'AT&T Stadium, Dallas',                 'scheduled'),
  ('K-R16-6', 'r16', null, 5, '2026-07-07T00:00:00Z', 'Lumen Field, Seattle',                 'scheduled'),
  ('K-R16-7', 'r16', null, 6, '2026-07-07T20:00:00Z', 'Mercedes-Benz Stadium, Atlanta',       'scheduled'),
  ('K-R16-8', 'r16', null, 7, '2026-07-07T20:00:00Z', 'BC Place, Vancouver',                  'scheduled')
on conflict (id) do update set
  kickoff = excluded.kickoff, venue = excluded.venue, status = excluded.status, updated_at = now();

-- Seed: 4 Quarterfinals
insert into public.matches (id, round, group_id, bracket_index, kickoff, venue, status)
values
  ('K-QF-1', 'qf', null, 0, '2026-07-10T00:00:00Z', 'Gillette Stadium, Foxborough',  'scheduled'),
  ('K-QF-2', 'qf', null, 1, '2026-07-10T19:00:00Z', 'SoFi Stadium, Inglewood',       'scheduled'),
  ('K-QF-3', 'qf', null, 2, '2026-07-12T01:00:00Z', 'Hard Rock Stadium, Miami',      'scheduled'),
  ('K-QF-4', 'qf', null, 3, '2026-07-12T01:00:00Z', 'Arrowhead Stadium, Kansas City','scheduled')
on conflict (id) do update set
  kickoff = excluded.kickoff, venue = excluded.venue, status = excluded.status, updated_at = now();

-- Seed: 2 Semifinals
insert into public.matches (id, round, group_id, bracket_index, kickoff, venue, status)
values
  ('K-SF-1', 'sf', null, 0, '2026-07-14T23:00:00Z', 'AT&T Stadium, Dallas',         'scheduled'),
  ('K-SF-2', 'sf', null, 1, '2026-07-15T23:00:00Z', 'Mercedes-Benz Stadium, Atlanta','scheduled')
on conflict (id) do update set
  kickoff = excluded.kickoff, venue = excluded.venue, status = excluded.status, updated_at = now();

-- Seed: Third + Final
insert into public.matches (id, round, group_id, bracket_index, kickoff, venue, status)
values
  ('K-3RD-1',   'third', null, 0, '2026-07-19T01:00:00Z', 'Hard Rock Stadium, Miami', 'scheduled'),
  ('K-FINAL-1', 'final', null, 0, '2026-07-19T23:00:00Z', 'MetLife Stadium, NY/NJ',   'scheduled')
on conflict (id) do update set
  kickoff = excluded.kickoff, venue = excluded.venue, status = excluded.status, updated_at = now();

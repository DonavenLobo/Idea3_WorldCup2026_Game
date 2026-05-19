create table if not exists public.sample_matches (
  id text primary key,
  home_team_code text not null,
  away_team_code text not null,
  starts_at timestamptz not null
);

insert into public.sample_matches (id, home_team_code, away_team_code, starts_at)
values
  ('sample-usa-mex', 'USA', 'MEX', now() + interval '7 days')
on conflict (id) do update set
  home_team_code = excluded.home_team_code,
  away_team_code = excluded.away_team_code,
  starts_at = excluded.starts_at;

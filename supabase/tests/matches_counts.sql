-- supabase/tests/matches_counts.sql
-- Run with: supabase db psql -f supabase/tests/matches_counts.sql
-- Exits non-zero if any assertion fails.

do $$
declare
  total int;
  groups int;
  r32 int;
  r16 int;
  qf int;
  sf int;
  third int;
  final int;
begin
  select count(*) into total from public.matches;
  if total <> 104 then
    raise exception 'Expected 104 total matches, got %', total;
  end if;

  select count(*) into groups from public.matches where round = 'group';
  if groups <> 72 then
    raise exception 'Expected 72 group matches, got %', groups;
  end if;

  select count(*) into r32 from public.matches where round = 'r32';
  if r32 <> 16 then
    raise exception 'Expected 16 R32 matches, got %', r32;
  end if;

  select count(*) into r16 from public.matches where round = 'r16';
  if r16 <> 8 then
    raise exception 'Expected 8 R16 matches, got %', r16;
  end if;

  select count(*) into qf from public.matches where round = 'qf';
  if qf <> 4 then
    raise exception 'Expected 4 QF matches, got %', qf;
  end if;

  select count(*) into sf from public.matches where round = 'sf';
  if sf <> 2 then
    raise exception 'Expected 2 SF matches, got %', sf;
  end if;

  select count(*) into third from public.matches where round = 'third';
  if third <> 1 then
    raise exception 'Expected 1 third-place match, got %', third;
  end if;

  select count(*) into final from public.matches where round = 'final';
  if final <> 1 then
    raise exception 'Expected 1 final, got %', final;
  end if;

  -- bracket_index uniqueness within a knockout round
  if exists (
    select 1 from public.matches
     where round <> 'group'
     group by round, bracket_index
     having count(*) > 1
  ) then
    raise exception 'Duplicate bracket_index within a knockout round';
  end if;

  -- every group has exactly six group-stage rows
  if exists (
    select 1 from public.matches
     where round = 'group'
     group by group_id
     having count(*) <> 6
  ) then
    raise exception 'Some group does not have exactly six group-stage rows';
  end if;

  if exists (
    select 1
    from public.matches
    where match_num is null
       or match_num < 1
       or match_num > 104
  ) then
    raise exception 'Every match row must have a match_num between 1 and 104';
  end if;

  if exists (
    select 1
    from public.matches
    where score_source = 'worldcup26.ir'
    group by score_source_match_id
    having count(*) > 1
  ) then
    raise exception 'Duplicate worldcup26.ir score_source_match_id';
  end if;

  raise notice '✓ matches table: all assertions passed';
end$$;

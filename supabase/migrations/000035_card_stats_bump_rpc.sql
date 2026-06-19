-- 000035_card_stats_bump_rpc.sql
--
-- v1 stat-earning persistence for PRD #1 (card stat progression).
--
-- Adds:
--   1. brackets.awarded_stat_bumps jsonb — running tally of stat bumps already
--      awarded by score-bracket runs for that bracket. Enables idempotent
--      delta-application on each re-score.
--   2. apply_card_stat_bumps(...) RPC — atomically applies bumps to the user's
--      active card row, with optional "catch-up" mode (+amount to lowest stat).
--
-- The cards table allows multiple rows per user (one per generation attempt);
-- the "active" card is the most-recently-created row (mirrors the app's
-- getCurrentUserCard which orders by created_at desc limit 1). We scope the
-- SELECT/UPDATE to that single row via an id-pinning CTE so concurrent
-- generations are not touched.

-- 1. Idempotency tracker on brackets
alter table public.brackets
  add column if not exists awarded_stat_bumps jsonb not null default '{}'::jsonb;

comment on column public.brackets.awarded_stat_bumps is
  'PR-X (card stats): running tally of stat bumps already awarded by score-bracket runs. Delta-applied on re-score.';

-- 2. RPC
create or replace function public.apply_card_stat_bumps(
  p_user_id          uuid,
  p_bumps            jsonb default '{}'::jsonb,
  p_catch_up_count   int   default 0,
  p_catch_up_amount  int   default 2
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_keys constant text[] := array['atk','ast','frm','hyp','lck','wal'];  -- alphabetical (used for catch-up tiebreak)
  v_card_id uuid;
  v_stats jsonb;
  v_cur int;
  v_new int;
  v_key text;
  v_min_key text;
  v_min_val int;
  v_bump int;
begin
  if p_user_id is null then
    raise exception 'apply_card_stat_bumps: p_user_id is required';
  end if;

  -- Pick the user's active card (most recently created) and lock the row.
  select id, coalesce(stats, '{}'::jsonb)
  into v_card_id, v_stats
  from public.cards
  where user_id = p_user_id
  order by created_at desc
  limit 1
  for update;

  if v_card_id is null then
    -- User has no card row yet — silently no-op rather than failing the edge fn.
    return '{}'::jsonb;
  end if;

  -- Normalize: fill any missing key with base 50
  foreach v_key in array v_keys loop
    if not v_stats ? v_key then
      v_stats := v_stats || jsonb_build_object(v_key, 50);
    end if;
  end loop;

  -- Catch-up loop: pick lowest stat (alphabetical tiebreak via v_keys order), bump it, repeat.
  for v_iter in 1..coalesce(p_catch_up_count, 0) loop
    v_min_key := null;
    v_min_val := 101;  -- above cap
    foreach v_key in array v_keys loop
      v_cur := (v_stats ->> v_key)::int;
      if v_cur < v_min_val then
        v_min_val := v_cur;
        v_min_key := v_key;
      end if;
    end loop;
    if v_min_key is not null then
      v_new := least(v_min_val + coalesce(p_catch_up_amount, 2), 100);
      v_stats := v_stats || jsonb_build_object(v_min_key, v_new);
    end if;
  end loop;

  -- Apply explicit bumps map (additive, clamped)
  if p_bumps is not null and p_bumps <> '{}'::jsonb then
    foreach v_key in array v_keys loop
      if p_bumps ? v_key then
        v_bump := coalesce((p_bumps ->> v_key)::int, 0);
        v_cur := (v_stats ->> v_key)::int;
        v_new := least(greatest(v_cur + v_bump, 50), 100);
        v_stats := v_stats || jsonb_build_object(v_key, v_new);
      end if;
    end loop;
  end if;

  -- Persist to the same row we locked.
  update public.cards
  set stats = v_stats,
      updated_at = now()
  where id = v_card_id;

  return v_stats;
end;
$$;

revoke execute on function public.apply_card_stat_bumps(uuid, jsonb, int, int) from public, anon, authenticated;
grant execute on function public.apply_card_stat_bumps(uuid, jsonb, int, int) to service_role;

comment on function public.apply_card_stat_bumps(uuid, jsonb, int, int) is
  'PR-X (card stats): atomically apply explicit bumps and/or catch-up bumps to a user''s active card stats. Clamps to [50, 100].';

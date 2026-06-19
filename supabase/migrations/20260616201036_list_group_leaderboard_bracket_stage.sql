-- Fix list_group_leaderboard so the 'bracket' stage sums xp_events rows
-- emitted by the score-bracket edge function (source_type = 'bracket')
-- instead of returning a hardcoded 0.
--
-- Other stages are unchanged:
--   * 'overall'   -> sums all competitive_points xp_events (now naturally
--                    includes bracket rows via currency_type +
--                    counts_toward_leaderboard filter).
--   * 'trivia'    -> sums xp_events where source_type = 'daily_trivia'.
--   * 'prediction'-> sums xp_events where source_type = 'match_prediction'.
--   * 'showcase'  -> uses latest card overall rating.
--
-- Signature is preserved (uuid, text); we CREATE OR REPLACE to avoid
-- breaking dependents that reference the existing signature.

create or replace function public.list_group_leaderboard(
  target_group_id uuid default null,
  leaderboard_stage text default 'overall'
)
returns table (
  user_id uuid,
  display_name text,
  country_code text,
  score integer
)
language sql
stable
security definer
set search_path = public
as $$
  with eligible_users as (
    select profiles.id
    from public.profiles
    where target_group_id is null
    union
    select group_members.user_id
    from public.group_members
    where group_members.group_id = target_group_id
      and exists (
        select 1
        from public.group_members caller_membership
        where caller_membership.group_id = target_group_id
          and caller_membership.user_id = auth.uid()
      )
  ),
  latest_cards as (
    select distinct on (cards.user_id)
      cards.user_id,
      cards.overall
    from public.cards
    join eligible_users on eligible_users.id = cards.user_id
    order by cards.user_id, cards.updated_at desc
  ),
  gameplay_scores as (
    select
      xp_events.user_id,
      coalesce(sum(xp_events.amount), 0)::integer as score
    from public.xp_events
    join eligible_users on eligible_users.id = xp_events.user_id
    where xp_events.currency_type = 'competitive_points'
      and xp_events.counts_toward_leaderboard = true
      and (
        leaderboard_stage in ('overall', 'trivia')
        or (leaderboard_stage = 'prediction' and xp_events.source_type = 'match_prediction')
        or (leaderboard_stage = 'bracket' and xp_events.source_type = 'bracket')
      )
      and (
        leaderboard_stage != 'trivia'
        or xp_events.source_type = 'daily_trivia'
      )
    group by xp_events.user_id
  )
  select
    profiles.id as user_id,
    coalesce(profiles.display_name, 'Rookie') as display_name,
    coalesce(profiles.selected_nation_code, 'USA') as country_code,
    case
      when leaderboard_stage = 'showcase' then coalesce(latest_cards.overall, 0)
      else coalesce(gameplay_scores.score, 0)
    end as score
  from eligible_users
  join public.profiles on profiles.id = eligible_users.id
  left join latest_cards on latest_cards.user_id = profiles.id
  left join gameplay_scores on gameplay_scores.user_id = profiles.id
  order by score desc, display_name asc;
$$;

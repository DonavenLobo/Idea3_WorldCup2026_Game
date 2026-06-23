-- Atomic, idempotent milestone marking for card progression.
--
-- Why this exists: the trivia-completion and bracket-finalization flows each set
-- a different milestone column on the same row. A read-modify-write upsert from
-- two near-simultaneous edge invocations can lose one update (last writer wins),
-- leaving a user who completed both at level 3 instead of 4. This function makes
-- the mark a single atomic statement, and the coalesce guards ensure the first
-- timestamp is never overwritten by later calls (daily trivia re-runs are safe).
create or replace function public.mark_card_progression_milestones(
  p_user_id uuid,
  p_mark_first_trivia boolean default false,
  p_mark_bracket_groups_finalized boolean default false
)
returns public.card_progression_milestones
language sql
security definer
set search_path = public
as $$
  insert into public.card_progression_milestones as m (
    user_id,
    first_trivia_completed_at,
    bracket_groups_finalized_at,
    updated_at
  )
  values (
    p_user_id,
    case when p_mark_first_trivia then now() else null end,
    case when p_mark_bracket_groups_finalized then now() else null end,
    now()
  )
  on conflict (user_id) do update set
    first_trivia_completed_at = case
      when p_mark_first_trivia
        then coalesce(m.first_trivia_completed_at, now())
      else m.first_trivia_completed_at
    end,
    bracket_groups_finalized_at = case
      when p_mark_bracket_groups_finalized
        then coalesce(m.bracket_groups_finalized_at, now())
      else m.bracket_groups_finalized_at
    end,
    updated_at = now()
  returning m.*;
$$;

-- Only the service role (edge functions) may invoke this; clients never call it.
revoke execute on function public.mark_card_progression_milestones(uuid, boolean, boolean) from anon;
revoke execute on function public.mark_card_progression_milestones(uuid, boolean, boolean) from authenticated;
grant execute on function public.mark_card_progression_milestones(uuid, boolean, boolean) to service_role;

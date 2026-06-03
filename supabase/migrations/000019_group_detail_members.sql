create or replace function public.get_group_detail(target_group_id uuid)
returns table (
  id uuid,
  name text,
  member_count integer,
  visibility text,
  is_featured boolean,
  invite_code text,
  role text,
  default_leaderboard_type text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    groups.id,
    groups.name,
    public.group_member_count(groups.id) as member_count,
    groups.visibility,
    groups.is_featured,
    groups.invite_code,
    group_members.role,
    groups.default_leaderboard_type
  from public.groups
  join public.group_members
    on group_members.group_id = groups.id
  where groups.id = target_group_id
    and group_members.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.list_group_members(target_group_id uuid)
returns table (
  user_id uuid,
  display_name text,
  country_code text,
  role text,
  joined_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    group_members.user_id,
    coalesce(profiles.display_name, 'Rookie') as display_name,
    coalesce(profiles.selected_nation_code, 'USA') as country_code,
    group_members.role,
    group_members.joined_at
  from public.group_members
  join public.profiles
    on profiles.id = group_members.user_id
  where group_members.group_id = target_group_id
    and exists (
      select 1
      from public.group_members caller_membership
      where caller_membership.group_id = target_group_id
        and caller_membership.user_id = auth.uid()
    )
  order by
    case group_members.role
      when 'owner' then 0
      when 'admin' then 1
      else 2
    end,
    group_members.joined_at asc;
$$;

revoke execute on function public.get_group_detail(uuid) from public;
revoke execute on function public.get_group_detail(uuid) from anon;
revoke execute on function public.list_group_members(uuid) from public;
revoke execute on function public.list_group_members(uuid) from anon;

grant execute on function public.get_group_detail(uuid) to authenticated;
grant execute on function public.list_group_members(uuid) to authenticated;

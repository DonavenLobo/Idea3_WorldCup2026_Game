create or replace function public.create_user_group(
  group_name text,
  group_visibility text default 'private'
)
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
language plpgsql
security definer
set search_path = public
as $$
declare
  requester uuid := auth.uid();
  next_invite_code text;
  created_group public.groups%rowtype;
begin
  if requester is null then
    raise exception 'Not authenticated';
  end if;

  if group_visibility not in ('public', 'private') then
    raise exception 'Invalid group visibility';
  end if;

  loop
    next_invite_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (
      select 1 from public.groups where upper(groups.invite_code) = next_invite_code
    );
  end loop;

  insert into public.groups (name, owner_id, invite_code, visibility)
  values (coalesce(nullif(trim(group_name), ''), 'New Group'), requester, next_invite_code, group_visibility)
  returning * into created_group;

  insert into public.group_members (group_id, user_id, role)
  values (created_group.id, requester, 'owner')
  on conflict (group_id, user_id) do nothing;

  return query
    select
      created_group.id,
      created_group.name,
      public.group_member_count(created_group.id),
      created_group.visibility,
      created_group.is_featured,
      created_group.invite_code,
      'owner'::text,
      created_group.default_leaderboard_type;
end;
$$;

create or replace function public.join_group_by_invite_code(p_invite_code text)
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
language plpgsql
security definer
set search_path = public
as $$
declare
  requester uuid := auth.uid();
  target_group public.groups%rowtype;
begin
  if requester is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into target_group
  from public.groups
  where upper(groups.invite_code) = upper(trim(p_invite_code))
  limit 1;

  if target_group.id is null then
    raise exception 'Invite code not found';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (target_group.id, requester, 'member')
  on conflict (group_id, user_id) do nothing;

  return query
    select
      target_group.id,
      target_group.name,
      public.group_member_count(target_group.id),
      target_group.visibility,
      target_group.is_featured,
      target_group.invite_code,
      coalesce(
        (
          select group_members.role
          from public.group_members
          where group_members.group_id = target_group.id
            and group_members.user_id = requester
        ),
        'member'
      )::text,
      target_group.default_leaderboard_type;
end;
$$;

revoke execute on function public.create_user_group(text, text) from public;
revoke execute on function public.create_user_group(text, text) from anon;
revoke execute on function public.join_group_by_invite_code(text) from public;
revoke execute on function public.join_group_by_invite_code(text) from anon;

grant execute on function public.create_user_group(text, text) to authenticated;
grant execute on function public.join_group_by_invite_code(text) to authenticated;

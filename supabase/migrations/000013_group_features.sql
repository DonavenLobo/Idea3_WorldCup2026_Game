alter table public.groups
add column if not exists visibility text not null default 'private',
add column if not exists is_featured boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'groups_visibility_check'
      and conrelid = 'public.groups'::regclass
  ) then
    alter table public.groups
      add constraint groups_visibility_check check (visibility in ('public', 'private'));
  end if;
end $$;

create unique index if not exists groups_invite_code_upper_idx
  on public.groups (upper(invite_code));

create policy "Public groups are readable"
  on public.groups for select
  to authenticated
  using (visibility = 'public');

create policy "Users can leave their own group memberships"
  on public.group_members for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.group_member_count(target_group_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.group_members
  where group_id = target_group_id;
$$;

create or replace function public.list_my_groups()
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
  where group_members.user_id = auth.uid()
  order by group_members.joined_at desc;
$$;

create or replace function public.list_public_groups()
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
    null::text as invite_code,
    null::text as role,
    groups.default_leaderboard_type
  from public.groups
  where groups.visibility = 'public'
  order by groups.is_featured desc, public.group_member_count(groups.id) desc, groups.name asc;
$$;

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
    next_invite_code := upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8));
    exit when not exists (
      select 1 from public.groups where upper(invite_code) = next_invite_code
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
  where upper(invite_code) = upper(trim(p_invite_code))
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

create or replace function public.join_public_group(target_group_id uuid)
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
  where groups.id = target_group_id
    and groups.visibility = 'public'
  limit 1;

  if target_group.id is null then
    raise exception 'Public group not found';
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
      'member'::text,
      target_group.default_leaderboard_type;
end;
$$;

create or replace function public.leave_group(target_group_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  requester uuid := auth.uid();
  target_owner uuid;
begin
  if requester is null then
    raise exception 'Not authenticated';
  end if;

  select owner_id into target_owner
  from public.groups
  where groups.id = target_group_id;

  if target_owner = requester then
    delete from public.groups where groups.id = target_group_id;
    return true;
  end if;

  delete from public.group_members
  where group_id = target_group_id
    and user_id = requester;

  return found;
end;
$$;

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
      when leaderboard_stage = 'bracket' then 0
      else coalesce(gameplay_scores.score, 0)
    end as score
  from eligible_users
  join public.profiles on profiles.id = eligible_users.id
  left join latest_cards on latest_cards.user_id = profiles.id
  left join gameplay_scores on gameplay_scores.user_id = profiles.id
  order by score desc, display_name asc;
$$;

revoke execute on function public.group_member_count(uuid) from public;
revoke execute on function public.list_my_groups() from public;
revoke execute on function public.list_public_groups() from public;
revoke execute on function public.create_user_group(text, text) from public;
revoke execute on function public.join_group_by_invite_code(text) from public;
revoke execute on function public.join_public_group(uuid) from public;
revoke execute on function public.leave_group(uuid) from public;
revoke execute on function public.list_group_leaderboard(uuid, text) from public;

grant execute on function public.group_member_count(uuid) to authenticated;
grant execute on function public.list_my_groups() to authenticated;
grant execute on function public.list_public_groups() to authenticated;
grant execute on function public.create_user_group(text, text) to authenticated;
grant execute on function public.join_group_by_invite_code(text) to authenticated;
grant execute on function public.join_public_group(uuid) to authenticated;
grant execute on function public.leave_group(uuid) to authenticated;
grant execute on function public.list_group_leaderboard(uuid, text) to authenticated;

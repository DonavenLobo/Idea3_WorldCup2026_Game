drop policy if exists "Group members can read groups" on public.groups;
drop policy if exists "Public groups are readable" on public.groups;
create policy "Group members and public groups are readable"
  on public.groups for select
  to authenticated
  using (
    visibility = 'public'
    or private.is_group_member(groups.id)
  );

drop policy if exists "Users can leave their own group memberships" on public.group_members;
create policy "Users can leave their own group memberships"
  on public.group_members for delete
  to authenticated
  using ((select auth.uid()) = user_id);

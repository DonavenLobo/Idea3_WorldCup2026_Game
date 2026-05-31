create schema if not exists private;

create or replace function private.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members
    where group_members.group_id = target_group_id
      and group_members.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_group_member(uuid) from public;
grant execute on function private.is_group_member(uuid) to authenticated;

drop policy if exists "Group members can read groups" on public.groups;
create policy "Group members can read groups"
  on public.groups for select
  to authenticated
  using (private.is_group_member(groups.id));

drop policy if exists "Group members can read memberships" on public.group_members;
create policy "Group members can read memberships"
  on public.group_members for select
  to authenticated
  using (private.is_group_member(group_members.group_id));

drop function if exists public.is_group_member(uuid);

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users can read their own cards" on public.cards;
create policy "Users can read their own cards"
  on public.cards for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own cards" on public.cards;
create policy "Users can insert their own cards"
  on public.cards for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own cards" on public.cards;
create policy "Users can update their own cards"
  on public.cards for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own card generations" on public.card_generations;
create policy "Users can read their own card generations"
  on public.card_generations for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create groups they own" on public.groups;
create policy "Users can create groups they own"
  on public.groups for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can update groups" on public.groups;
create policy "Owners can update groups"
  on public.groups for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can join groups as themselves" on public.group_members;
create policy "Users can join groups as themselves"
  on public.group_members for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own trivia attempts" on public.trivia_attempts;
create policy "Users can read their own trivia attempts"
  on public.trivia_attempts for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own trivia answers" on public.trivia_attempt_answers;
create policy "Users can read their own trivia answers"
  on public.trivia_attempt_answers for select
  to authenticated
  using (
    exists (
      select 1 from public.trivia_attempts
      where trivia_attempts.id = trivia_attempt_answers.attempt_id
        and trivia_attempts.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can read their own brackets" on public.brackets;
create policy "Users can read their own brackets"
  on public.brackets for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own brackets" on public.brackets;
create policy "Users can insert their own brackets"
  on public.brackets for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update unlocked own brackets" on public.brackets;
create policy "Users can update unlocked own brackets"
  on public.brackets for update
  to authenticated
  using ((select auth.uid()) = user_id and locked_at is null)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own bounty attempts" on public.bounty_attempts;
create policy "Users can read their own bounty attempts"
  on public.bounty_attempts for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own xp events" on public.xp_events;
create policy "Users can read their own xp events"
  on public.xp_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own wallet" on public.wallets;
create policy "Users can read their own wallet"
  on public.wallets for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own inventory" on public.user_inventory;
create policy "Users can read their own inventory"
  on public.user_inventory for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read their own purchases" on public.purchases;
create policy "Users can read their own purchases"
  on public.purchases for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can upload their own card source images" on storage.objects;
create policy "Users can upload their own card source images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'card-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can read their own card source images" on storage.objects;
create policy "Users can read their own card source images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'card-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can read their own generated card images" on storage.objects;
create policy "Users can read their own generated card images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'card-generated'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create index if not exists profiles_selected_nation_code_idx
  on public.profiles (selected_nation_code);

create index if not exists cards_user_id_idx
  on public.cards (user_id);

create index if not exists cards_template_id_idx
  on public.cards (template_id);

create index if not exists cards_selected_nation_code_idx
  on public.cards (selected_nation_code);

create index if not exists card_generations_card_id_idx
  on public.card_generations (card_id);

create index if not exists card_generations_user_id_idx
  on public.card_generations (user_id);

create index if not exists groups_owner_id_idx
  on public.groups (owner_id);

create index if not exists group_members_user_id_idx
  on public.group_members (user_id);

create index if not exists trivia_questions_nation_code_idx
  on public.trivia_questions (nation_code);

create index if not exists trivia_attempt_answers_question_id_idx
  on public.trivia_attempt_answers (question_id);

create index if not exists brackets_user_id_idx
  on public.brackets (user_id);

create index if not exists brackets_group_id_idx
  on public.brackets (group_id);

create index if not exists bounty_attempts_user_id_idx
  on public.bounty_attempts (user_id);

create index if not exists xp_events_user_id_idx
  on public.xp_events (user_id);

create index if not exists purchases_user_id_idx
  on public.purchases (user_id);

create index if not exists user_inventory_locker_item_id_idx
  on public.user_inventory (locker_item_id);

-- supabase/migrations/000021_bracket_phased_locks.sql
-- Phased bracket lockout enforcement. Writes go through the submit-bracket
-- edge function (which validates each pick against public.matches kickoffs).
-- Add a unique constraint so the edge function can rely on at-most-one
-- (user_id, group_id) bracket row. Expose a tiny get_server_time() RPC.

-- 1. Drop the binary lock policy. The `locked_at` COLUMN stays (nullable, unused).
drop policy if exists "Users can update unlocked own brackets" on public.brackets;

-- 2. Block all direct UPDATEs to brackets. Force everything through the edge
--    function, which uses the service role to write past RLS.
create policy "No direct bracket updates"
  on public.brackets for update
  to authenticated
  using (false);

-- 3. Unique constraint on (user_id, group_id) with NULLS NOT DISTINCT so the
--    edge function can rely on "one personal bracket + one bracket per group"
--    per user. Postgres 15+ syntax (Supabase uses 15+).
create unique index if not exists brackets_user_group_unique
  on public.brackets (user_id, group_id)
  nulls not distinct;

-- 4. Tiny RPC so the client can fetch a single authoritative timestamp.
create or replace function public.get_server_time()
  returns timestamptz
  language sql
  stable
  security definer
  set search_path = public
as $$
  select now();
$$;

grant execute on function public.get_server_time() to anon, authenticated;

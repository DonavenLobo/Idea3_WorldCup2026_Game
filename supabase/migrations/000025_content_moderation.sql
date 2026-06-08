-- Content moderation surfaces for user-generated content (Apple Guideline 1.2,
-- Google Play UGC policy): let users report offensive people/content and block
-- abusive users. AI-generated card images are filtered upstream by the image
-- provider's safety guardrails in the generate-card-avatar function.

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete set null,
  context text not null,
  context_id text,
  reason text not null,
  details text,
  status text not null default 'open'
    check (status in ('open', 'reviewed', 'actioned', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists content_reports_reporter_idx
  on public.content_reports (reporter_id);
create index if not exists content_reports_reported_user_idx
  on public.content_reports (reported_user_id);

alter table public.content_reports enable row level security;

-- Users may file reports and read back only their own. Moderation review uses
-- the service role (bypasses RLS).
create policy "Users can file their own reports"
  on public.content_reports for insert
  to authenticated with check (auth.uid() = reporter_id);

create policy "Users can read their own reports"
  on public.content_reports for select
  to authenticated using (auth.uid() = reporter_id);

create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_user_id),
  constraint user_blocks_no_self check (blocker_id <> blocked_user_id)
);

create index if not exists user_blocks_blocker_idx
  on public.user_blocks (blocker_id);

alter table public.user_blocks enable row level security;

create policy "Users manage their own blocks (select)"
  on public.user_blocks for select
  to authenticated using (auth.uid() = blocker_id);

create policy "Users manage their own blocks (insert)"
  on public.user_blocks for insert
  to authenticated with check (auth.uid() = blocker_id);

create policy "Users manage their own blocks (delete)"
  on public.user_blocks for delete
  to authenticated using (auth.uid() = blocker_id);

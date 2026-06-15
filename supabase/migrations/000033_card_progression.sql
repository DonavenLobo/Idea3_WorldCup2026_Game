-- Page 2/3/4 progression templates (required before card backfill below).
insert into public.card_templates (template_key, name, tier, base_image_url, metadata, is_active)
values
  (
    'level-02-base-v1',
    'Base Card Page 2',
    2,
    null,
    '{"id":"level-02-base-v1","name":"Base Card Page 2","version":1,"width":1024,"height":1536,"safeArea":{"x":94,"y":96,"width":836,"height":1344},"layers":{"overall":{"x":120,"y":185,"width":150,"fontSize":130,"color":"#1a1a2e","align":"center","label":"OVR","labelFontSize":55,"labelX":120,"labelY":150},"avatar":{"x":235,"y":220,"width":565,"height":735,"fit":"cover"},"displayName":{"x":205,"y":1034,"width":614,"height":70,"fontSize":65,"color":"#1a1a2e","align":"center"},"stats":{"x":0,"y":1272,"columns":[{"key":"hyp","x":154,"width":82},{"key":"frm","x":278,"width":82},{"key":"atk","x":402,"width":82},{"key":"ast","x":526,"width":82},{"key":"wal","x":650,"width":82},{"key":"lck","x":774,"width":82}],"labelFontSize":0,"valueFontSize":42,"color":"#1a1a2e","align":"center","showLabels":false},"badge":{"x":735,"y":155,"width":150,"height":132,"fontSize":100,"backgroundColor":"transparent","color":"#1a1a2e"}}}'::jsonb,
    true
  ),
  (
    'level-03-base-v1',
    'Base Card Page 3',
    3,
    null,
    '{"id":"level-03-base-v1","name":"Base Card Page 3","version":1,"width":1024,"height":1536,"safeArea":{"x":94,"y":96,"width":836,"height":1344},"layers":{"overall":{"x":120,"y":185,"width":150,"fontSize":130,"color":"#1a1a2e","align":"center","label":"OVR","labelFontSize":55,"labelX":120,"labelY":150},"avatar":{"x":235,"y":220,"width":565,"height":735,"fit":"cover"},"displayName":{"x":205,"y":1034,"width":614,"height":70,"fontSize":65,"color":"#1a1a2e","align":"center"},"stats":{"x":0,"y":1272,"columns":[{"key":"hyp","x":154,"width":82},{"key":"frm","x":278,"width":82},{"key":"atk","x":402,"width":82},{"key":"ast","x":526,"width":82},{"key":"wal","x":650,"width":82},{"key":"lck","x":774,"width":82}],"labelFontSize":0,"valueFontSize":42,"color":"#1a1a2e","align":"center","showLabels":false},"badge":{"x":735,"y":155,"width":150,"height":132,"fontSize":100,"backgroundColor":"transparent","color":"#1a1a2e"}}}'::jsonb,
    true
  ),
  (
    'level-04-base-v1',
    'Base Card Page 4',
    4,
    null,
    '{"id":"level-04-base-v1","name":"Base Card Page 4","version":1,"width":1024,"height":1536,"safeArea":{"x":94,"y":96,"width":836,"height":1344},"layers":{"overall":{"x":120,"y":185,"width":150,"fontSize":130,"color":"#1a1a2e","align":"center","label":"OVR","labelFontSize":55,"labelX":120,"labelY":150},"avatar":{"x":235,"y":220,"width":565,"height":735,"fit":"cover"},"displayName":{"x":205,"y":1034,"width":614,"height":70,"fontSize":65,"color":"#1a1a2e","align":"center"},"stats":{"x":0,"y":1272,"columns":[{"key":"hyp","x":154,"width":82},{"key":"frm","x":278,"width":82},{"key":"atk","x":402,"width":82},{"key":"ast","x":526,"width":82},{"key":"wal","x":650,"width":82},{"key":"lck","x":774,"width":82}],"labelFontSize":0,"valueFontSize":42,"color":"#1a1a2e","align":"center","showLabels":false},"badge":{"x":735,"y":155,"width":150,"height":132,"fontSize":100,"backgroundColor":"transparent","color":"#1a1a2e"}}}'::jsonb,
    true
  )
on conflict (template_key) do update set
  name = excluded.name,
  tier = excluded.tier,
  base_image_url = excluded.base_image_url,
  metadata = excluded.metadata,
  is_active = excluded.is_active;

update public.card_templates
set is_active = false
where template_key in ('level-00-sketch-v1', 'level-01-base-v1');

create table if not exists public.card_progression_milestones (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  first_trivia_completed_at timestamptz,
  bracket_groups_finalized_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.card_upgrade_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  from_level smallint not null check (from_level between 2 and 4),
  to_level smallint not null check (to_level between 2 and 4),
  sequence smallint not null default 1 check (sequence >= 1),
  created_at timestamptz not null default now(),
  animation_seen_at timestamptz,
  constraint card_upgrade_events_level_step_check check (to_level = from_level + 1)
);

create unique index if not exists card_upgrade_events_pending_unique_idx
  on public.card_upgrade_events (user_id, from_level, to_level)
  where animation_seen_at is null;

create index if not exists card_upgrade_events_user_pending_idx
  on public.card_upgrade_events (user_id, created_at, sequence)
  where animation_seen_at is null;

create index if not exists card_progression_milestones_trivia_idx
  on public.card_progression_milestones (first_trivia_completed_at)
  where first_trivia_completed_at is not null;

create index if not exists card_progression_milestones_bracket_idx
  on public.card_progression_milestones (bracket_groups_finalized_at)
  where bracket_groups_finalized_at is not null;

alter table public.card_progression_milestones enable row level security;
alter table public.card_upgrade_events enable row level security;

create policy "Users can read their own card progression milestones"
  on public.card_progression_milestones for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can read their own card upgrade events"
  on public.card_upgrade_events for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can mark their own card upgrade animations seen"
  on public.card_upgrade_events for update
  to authenticated
  using (auth.uid() = user_id and animation_seen_at is null)
  with check (auth.uid() = user_id and animation_seen_at is not null);

-- Backfill milestones from existing gameplay data.
insert into public.card_progression_milestones (user_id, first_trivia_completed_at, bracket_groups_finalized_at)
select
  p.id,
  (
    select min(ta.completed_at)
    from public.trivia_attempts ta
    where ta.user_id = p.id
  ) as first_trivia_completed_at,
  (
    select min(b.updated_at)
    from public.brackets b
    where b.user_id = p.id
      and b.group_id is null
      and coalesce(jsonb_array_length(b.picks -> 'finalizedGroups'), 0) >= 12
  ) as bracket_groups_finalized_at
from public.profiles p
on conflict (user_id) do nothing;

-- Move legacy sketch cards onto Page 2 template for users still on level-00.
update public.cards c
set template_id = page2.id,
  updated_at = now()
from public.card_templates old_template,
  public.card_templates page2
where c.template_id = old_template.id
  and old_template.template_key = 'level-00-sketch-v1'
  and page2.template_key = 'level-02-base-v1';

-- Align card templates with derived progression for existing users (no pending animations).
with user_levels as (
  select
    c.id as card_id,
    c.user_id,
    case
      when m.first_trivia_completed_at is not null
        and m.bracket_groups_finalized_at is not null then 4
      when m.first_trivia_completed_at is not null
        or m.bracket_groups_finalized_at is not null then 3
      else 2
    end as target_level
  from public.cards c
  left join public.card_progression_milestones m on m.user_id = c.user_id
),
target_templates as (
  select
    ul.card_id,
    ul.user_id,
    ul.target_level,
    ct.id as template_id,
    ct.template_key
  from user_levels ul
  join public.card_templates ct
    on ct.template_key = case ul.target_level
      when 4 then 'level-04-base-v1'
      when 3 then 'level-03-base-v1'
      else 'level-02-base-v1'
    end
)
update public.cards c
set template_id = tt.template_id,
  updated_at = now()
from target_templates tt
where c.id = tt.card_id
  and c.template_id <> tt.template_id;

-- Record historical upgrades as already seen so existing users are not forced through animations.
insert into public.card_upgrade_events (
  user_id,
  card_id,
  from_level,
  to_level,
  sequence,
  created_at,
  animation_seen_at
)
select
  tt.user_id,
  tt.card_id,
  step.from_level,
  step.to_level,
  step.sequence,
  now(),
  now()
from (
  select
    c.id as card_id,
    c.user_id,
    case
      when m.first_trivia_completed_at is not null
        and m.bracket_groups_finalized_at is not null then 4
      when m.first_trivia_completed_at is not null
        or m.bracket_groups_finalized_at is not null then 3
      else 2
    end as target_level
  from public.cards c
  left join public.card_progression_milestones m on m.user_id = c.user_id
) tt
cross join lateral (
  values
    (2, 3, 1),
    (3, 4, 2)
) as step(from_level, to_level, sequence)
where tt.target_level >= step.to_level
  and not exists (
    select 1
    from public.card_upgrade_events cue
    where cue.user_id = tt.user_id
      and cue.card_id = tt.card_id
      and cue.from_level = step.from_level
      and cue.to_level = step.to_level
  );

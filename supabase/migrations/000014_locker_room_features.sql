insert into public.locker_items (item_key, name, item_type, rarity, price_credits, metadata, is_active)
values
  ('frame-bronze', 'Bronze Frame', 'frame', 'bronze', 50, '{"category":"frame","emoji":"B"}'::jsonb, true),
  ('frame-silver', 'Silver Frame', 'frame', 'silver', 120, '{"category":"frame","emoji":"S","requiredTier":"silver"}'::jsonb, true),
  ('frame-gold', 'Gold Frame', 'frame', 'gold', 250, '{"category":"frame","emoji":"G","requiredTier":"gold"}'::jsonb, true),
  ('frame-platinum', 'Platinum Frame', 'frame', 'platinum', 500, '{"category":"frame","emoji":"P","requiredTier":"platinum"}'::jsonb, true),
  ('frame-diamond', 'Diamond Frame', 'frame', 'diamond', 1000, '{"category":"frame","emoji":"D","requiredTier":"diamond"}'::jsonb, true),
  ('badge-wc26', 'World Cup ''26', 'badge', 'bronze', 75, '{"category":"badge","emoji":"WC"}'::jsonb, true),
  ('badge-mvp', 'MVP', 'badge', 'bronze', 150, '{"category":"badge","emoji":"MVP"}'::jsonb, true),
  ('badge-hattrick', 'Hat-trick', 'badge', 'silver', 200, '{"category":"badge","emoji":"HT","requiredTier":"silver"}'::jsonb, true),
  ('badge-ironwall', 'Iron Wall', 'badge', 'gold', 300, '{"category":"badge","emoji":"IW","requiredTier":"gold"}'::jsonb, true),
  ('badge-speeddemon', 'Speed Demon', 'badge', 'gold', 400, '{"category":"badge","emoji":"SD","requiredTier":"gold"}'::jsonb, true),
  ('bg-stadium', 'Stadium Lights', 'background', 'bronze', 100, '{"category":"background","emoji":"SL"}'::jsonb, true),
  ('bg-pitch', 'Pitch View', 'background', 'bronze', 150, '{"category":"background","emoji":"PV"}'::jsonb, true),
  ('bg-trophyhall', 'Trophy Hall', 'background', 'gold', 350, '{"category":"background","emoji":"TH","requiredTier":"gold"}'::jsonb, true),
  ('bg-fireworks', 'Fireworks', 'background', 'platinum', 600, '{"category":"background","emoji":"FW","requiredTier":"platinum"}'::jsonb, true)
on conflict (item_key) do update
set
  name = excluded.name,
  item_type = excluded.item_type,
  rarity = excluded.rarity,
  price_credits = excluded.price_credits,
  metadata = excluded.metadata,
  is_active = excluded.is_active;

create or replace function public.locker_tier_rank(tier text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case tier
    when 'bronze' then 0
    when 'silver' then 1
    when 'gold' then 2
    when 'platinum' then 3
    when 'diamond' then 4
    else 0
  end;
$$;

create or replace function public.locker_tier_for_owned_count(owned_count integer)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when owned_count >= 14 then 'diamond'
    when owned_count >= 10 then 'platinum'
    when owned_count >= 6 then 'gold'
    when owned_count >= 3 then 'silver'
    else 'bronze'
  end;
$$;

create or replace function public.get_locker_wallet()
returns table (
  locker_credits integer,
  purchased_credits integer,
  balance integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(wallets.locker_credits, 0) as locker_credits,
    coalesce(wallets.purchased_credits, 0) as purchased_credits,
    coalesce(wallets.locker_credits, 0) + coalesce(wallets.purchased_credits, 0) as balance
  from (select auth.uid() as user_id) requester
  left join public.wallets on wallets.user_id = requester.user_id
  where requester.user_id is not null;
$$;

create or replace function public.list_locker_room_items()
returns table (
  item_key text,
  name text,
  item_type text,
  rarity text,
  price_credits integer,
  metadata jsonb,
  owned boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    locker_items.item_key,
    locker_items.name,
    locker_items.item_type,
    locker_items.rarity,
    locker_items.price_credits,
    locker_items.metadata,
    user_inventory.id is not null as owned
  from public.locker_items
  left join public.user_inventory
    on user_inventory.locker_item_id = locker_items.id
    and user_inventory.user_id = auth.uid()
  where locker_items.is_active = true
  order by
    case locker_items.item_type
      when 'frame' then 0
      when 'badge' then 1
      when 'background' then 2
      else 3
    end,
    locker_items.price_credits asc,
    locker_items.name asc;
$$;

create or replace function public.redeem_locker_item(p_item_key text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  requester uuid := auth.uid();
  target_item public.locker_items%rowtype;
  wallet_row public.wallets%rowtype;
  owned_count integer;
  current_tier text;
  required_tier text;
  item_price integer;
  available_balance integer;
  locker_credit_spend integer;
  purchased_credit_spend integer;
begin
  if requester is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into target_item
  from public.locker_items
  where item_key = p_item_key
    and is_active = true
  limit 1;

  if target_item.id is null then
    raise exception 'Locker item not found';
  end if;

  if exists (
    select 1
    from public.user_inventory
    where user_id = requester
      and locker_item_id = target_item.id
  ) then
    raise exception 'Locker item already owned';
  end if;

  select count(*)::integer
  into owned_count
  from public.user_inventory
  where user_id = requester;

  current_tier := public.locker_tier_for_owned_count(owned_count);
  required_tier := target_item.metadata->>'requiredTier';

  if required_tier is not null
    and public.locker_tier_rank(current_tier) < public.locker_tier_rank(required_tier) then
    raise exception 'Reach % tier first', required_tier;
  end if;

  insert into public.wallets (user_id)
  values (requester)
  on conflict (user_id) do nothing;

  select *
  into wallet_row
  from public.wallets
  where user_id = requester
  for update;

  item_price := coalesce(target_item.price_credits, 0);
  available_balance := wallet_row.locker_credits + wallet_row.purchased_credits;

  if available_balance < item_price then
    raise exception 'Not enough credits';
  end if;

  locker_credit_spend := least(wallet_row.locker_credits, item_price);
  purchased_credit_spend := item_price - locker_credit_spend;

  update public.wallets
  set
    locker_credits = wallet_row.locker_credits - locker_credit_spend,
    purchased_credits = wallet_row.purchased_credits - purchased_credit_spend,
    updated_at = now()
  where user_id = requester;

  insert into public.user_inventory (user_id, locker_item_id, source)
  values (requester, target_item.id, 'locker_purchase');

  return true;
end;
$$;

revoke execute on function public.locker_tier_rank(text) from public;
revoke execute on function public.locker_tier_for_owned_count(integer) from public;
revoke execute on function public.get_locker_wallet() from public;
revoke execute on function public.list_locker_room_items() from public;
revoke execute on function public.redeem_locker_item(text) from public;

grant execute on function public.locker_tier_rank(text) to authenticated;
grant execute on function public.locker_tier_for_owned_count(integer) to authenticated;
grant execute on function public.get_locker_wallet() to authenticated;
grant execute on function public.list_locker_room_items() to authenticated;
grant execute on function public.redeem_locker_item(text) to authenticated;

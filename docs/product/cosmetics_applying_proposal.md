# Cosmetics: Apply to Card — Proposal

Status: **Proposal — awaiting decision**
Author: Denver
Last updated: June 3, 2026

## Why this doc exists

The Locker Room already lets users **own** cosmetics (frames, badges, backgrounds) via `user_inventory`. The UX polish round (PR #11) deliberately did *not* add an "Apply to card" / "Equip" flow because that crosses from client polish into a schema decision.

This doc proposes a minimal path so we can land it without painting ourselves into a corner.

## What's missing today

- `RenderedPlayerCard` renders the card from `displayName`, `photoSource`, and `selectedNationCode`. It never reads the user's *equipped* cosmetics.
- `user_inventory` tracks ownership but has no concept of "active" or "equipped."
- Cosmetic items have `category` (`frame` / `badge` / `background`) but the card has no slots for them.
- Tapping an owned cosmetic in the Locker Room is a no-op (`disabled={isOwned}` in `CosmeticItemCard.tsx`).

## Locked constraints from `mvp_decisions.md`

These keep the proposal honest:

- **#1** Purchases must never affect competitive scoring.
- **#15** Card stats are status/identity markers, not gameplay power.
- **#16** Cards never downgrade. (Equipping/unequipping is fine — losing a cosmetic is not.)
- **#29** Card Showcase can include paid cosmetics, but must be clearly labeled non-competitive.

Equipping cosmetics is a *display* change. None of these constraints push back. Good.

## Proposed schema change

One new table, one column per cosmetic slot. Keep it small.

```sql
-- New migration: 000020_card_cosmetics.sql

-- One row per (user, slot). User can equip exactly one item per slot,
-- or zero (NULL row absent). Enforces ownership via FK to user_inventory.
create table if not exists public.card_cosmetics (
  user_id uuid not null references public.profiles(id) on delete cascade,
  slot text not null check (slot in ('frame', 'badge', 'background')),
  user_inventory_id uuid not null references public.user_inventory(id) on delete cascade,
  equipped_at timestamptz not null default now(),
  primary key (user_id, slot)
);

alter table public.card_cosmetics enable row level security;

create policy "Users read their own equipped cosmetics"
  on public.card_cosmetics for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users equip their own cosmetics"
  on public.card_cosmetics for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users re-equip their own cosmetics"
  on public.card_cosmetics for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users unequip their own cosmetics"
  on public.card_cosmetics for delete
  to authenticated
  using (auth.uid() = user_id);
```

**Why this shape:**

- `primary key (user_id, slot)` enforces one equipped item per slot, atomically — no race condition between "unequip old" and "equip new."
- FK to `user_inventory` (not `locker_items` directly) means we can't equip something we don't own. If inventory is deleted, the equip row goes with it.
- No `is_equipped` boolean on `user_inventory` — keeps that table append-only and keeps "what's equipped" in one place.

## Client changes

### 1. `useCardCosmetics()` hook
Returns `{ equipped: Record<Slot, LockerItem | null>, equip(item), unequip(slot), isEquipping }`. Subscribes to `card_cosmetics` for the current user.

### 2. `RenderedPlayerCard` accepts cosmetics
New optional prop `cosmetics?: { frame?: LockerItem; badge?: LockerItem; background?: LockerItem }`. When present, render frame/border, badge overlay, and background. When absent, fall back to current default.

### 3. Locker Room: tap owned → equip / unequip
In `CosmeticItemCard.tsx`, remove the `disabled={isOwned}` block. New behavior in `card.tsx` handleRedeem:

- **Locked** → existing tier-hint alert (PR #11)
- **Affordable, not owned** → existing redeem confirmation (PR #11)
- **Owned, not equipped** → new "Equip this <frame/badge/background>?" alert → call `equip(item)`
- **Owned, equipped** → new "Unequip?" alert → call `unequip(item.category)`

### 4. Card tab shows equipped state
The "My Card" panel reads `equipped` from the hook and passes it to `RenderedPlayerCard`. Existing card render falls back gracefully if no cosmetics are equipped.

### 5. Visual indicator for equipped state
Add an "EQUIPPED" badge (similar to existing "OWNED") on the locker tile when an item is currently equipped. One item per category can be equipped at a time, so this is unambiguous.

## What we are NOT doing in v1

- **No equip animations / transitions** — instant swap. We can add motion later.
- **No multi-equip per slot** — strictly one frame, one badge, one background.
- **No equip-restricted cosmetics** — every owned cosmetic is equippable. (We can add `is_equippable` later if we want event-only display items.)
- **No "outfit" / preset loadouts** — users equip slot by slot.
- **No effect on OVR or competitive leaderboards** — pure visual change, per locked decision #1.

## Open questions for Donaven

1. **Do equipped cosmetics show in shareable card teasers** (the "primary share object" from decision #9)? My instinct is yes — that's where they'd be most visible — but it means the teaser-card generator needs to read `card_cosmetics`.
2. **Default cosmetics on signup?** Right now a card has no frame/badge/background. Do we want a default "Bronze" frame as a baseline, or stay bare until the user equips something?
3. **Migration ordering vs. live data** — anything already in `user_inventory` would just need this new table empty by default. Should be a clean migration, but flag if there's anything in `feature/productionization-store-compatibility` that already assumed equip state.

## Estimated scope

- Migration: ~30 lines SQL.
- `useCardCosmetics` hook + integration: ~150 lines TS.
- `RenderedPlayerCard` cosmetics rendering: ~80 lines TS + styles (the heaviest part — depends on how rich the visual treatment is).
- Locker Room equip/unequip UX: ~50 lines TS (mostly Alert wiring).

Roughly one stacked PR off main, similar size to PR #11.

# World Cup Game Repo Scaffolding Plan

## Working Product Direction

This repo should be structured around the clearest product loop:

**Create AI footballer card → join a group → play daily games → earn XP/credits → upgrade card → share/invite → repeat**

The player card is the core product surface. Trivia, brackets, bounties, groups, and the Locker Room should all be organized as supporting feature modules that feed the card progression system.

The current example cards should be treated as **manual base card templates** that the app populates with dynamic user data: avatar image, display name, overall rating, stat labels, stat values, country/team metadata, badges, and unlocked cosmetic layers.

---

# 1. Recommended Technical Approach

## App Strategy

Use a cross-platform mobile-first architecture:

- **Mobile app:** Expo + React Native + TypeScript
- **Web/landing/share pages:** Next.js + TypeScript
- **Backend:** Supabase
- **Database:** Supabase Postgres
- **Auth:** Supabase Auth
- **File storage:** Supabase Storage
- **Server-side workflows:** Supabase Edge Functions
- **Styling:** NativeWind or Tailwind-inspired tokens
- **Animations:** React Native Reanimated for mobile interactions; GSAP only for web/landing if needed
- **AI image generation:** OpenAI API or another image model provider behind a backend function

This lets the team build one mobile app for iOS and Android while still having a lightweight web layer for viral card sharing and invite links.

---

# 2. Monorepo Structure

Recommended top-level structure:

```txt
world-cup-game/
  apps/
    mobile/
    web/

  packages/
    config/
    types/
    ui/
    card-renderer/
    game-engine/

  supabase/
    migrations/
    functions/
    seed/

  design/
    card-templates/
    brand/
    exports/

  docs/
    product/
    engineering/
    decisions/

  scripts/

  package.json
  pnpm-workspace.yaml
  turbo.json
  README.md
```

## Why this structure works

- `apps/mobile` contains the actual iOS/Android app.
- `apps/web` powers shareable card pages, referral links, landing pages, and app download redirects.
- `packages/card-renderer` keeps the card rendering logic shared between mobile previews and web/share outputs.
- `packages/game-engine` keeps trivia scoring, bracket scoring, XP logic, and card progression rules out of the UI.
- `supabase` keeps migrations and backend functions version-controlled.
- `design` preserves manually created base card assets, exports, template metadata, and brand tokens.

---

# 3. Mobile App Structure

Recommended structure inside `apps/mobile`:

```txt
apps/mobile/
  app/
    _layout.tsx
    index.tsx

    (auth)/
      sign-in.tsx
      sign-up.tsx
      forgot-password.tsx

    (onboarding)/
      select-nation.tsx
      create-card.tsx
      photo-booth.tsx
      card-preview.tsx
      join-group.tsx

    (tabs)/
      _layout.tsx
      home.tsx
      trivia.tsx
      bracket.tsx
      groups.tsx
      locker-room.tsx

    card/
      [cardId].tsx
      regenerate.tsx
      share.tsx

    group/
      [groupId].tsx
      invite.tsx
      leaderboard.tsx

    match/
      [matchId].tsx
      bounties.tsx

  src/
    components/
      cards/
      layout/
      buttons/
      forms/
      feedback/
      leaderboard/

    features/
      auth/
      onboarding/
      card/
      trivia/
      bracket/
      groups/
      locker-room/
      bounties/
      notifications/
      purchases/
      profile/

    lib/
      supabase.ts
      queryClient.ts
      analytics.ts
      imageUpload.ts
      permissions.ts
      pushNotifications.ts
      constants.ts

    hooks/
      useSession.ts
      useProfile.ts
      useCard.ts
      useGroup.ts
      useFeatureFlags.ts

    theme/
      colors.ts
      spacing.ts
      typography.ts
      radius.ts

    utils/
      formatters.ts
      validators.ts
      dates.ts
      errors.ts

  assets/
    icons/
    fonts/
    placeholders/

  app.json
  package.json
  tsconfig.json
```

## Routing principle

Use route folders for actual screens and `src/features` for the business logic behind those screens.

Example:

- `app/(tabs)/trivia.tsx` should be a thin screen file.
- `src/features/trivia` should contain the hooks, API calls, scoring helpers, components, and types.

This prevents the route files from becoming huge and messy.

---

# 4. Web App Structure

Recommended structure inside `apps/web`:

```txt
apps/web/
  app/
    page.tsx
    layout.tsx

    card/
      [slug]/
        page.tsx
        opengraph-image.tsx

    invite/
      [inviteCode]/
        page.tsx

    download/
      page.tsx

  src/
    components/
      landing/
      card/
      invite/

    lib/
      supabase.ts
      metadata.ts
      redirects.ts

  public/
    social/
    previews/

  package.json
  next.config.ts
  tsconfig.json
```

## Web app purpose

The web app should not duplicate the whole mobile app. It should focus on acquisition and sharing:

- Public card preview pages
- Invite links
- Social preview images
- App download redirects
- Landing page
- Terms/privacy pages

Example use case:

A user shares their card on Instagram or iMessage. The recipient taps the link and lands on:

```txt
/card/kerry-7h2k
```

That page shows a polished public card preview and a CTA:

**Create your tournament card**

---

# 5. Shared Packages

## `packages/types`

Shared TypeScript types used across mobile, web, and backend functions.

```txt
packages/types/
  src/
    database.ts
    card.ts
    user.ts
    group.ts
    trivia.ts
    bracket.ts
    bounty.ts
    purchases.ts
    index.ts
```

Use this for:

- Supabase generated database types
- API response types
- Shared domain models
- Enums such as card tier, game type, nation code, purchase type

---

## `packages/config`

Shared config and constants.

```txt
packages/config/
  src/
    nations.ts
    cardStats.ts
    cardTiers.ts
    xpRules.ts
    featureFlags.ts
    routes.ts
    index.ts
```

Examples:

```ts
export const CARD_STATS = [
  { key: 'hyp', label: 'HYP', name: 'Hype' },
  { key: 'frm', label: 'FRM', name: 'Form' },
  { key: 'atk', label: 'ATK', name: 'Attack' },
  { key: 'ast', label: 'AST', name: 'Assist' },
  { key: 'wal', label: 'WAL', name: 'Wall' },
  { key: 'lck', label: 'LCK', name: 'Luck' },
] as const;
```

---

## `packages/ui`

Shared UI primitives that can be used in mobile and web where practical.

```txt
packages/ui/
  src/
    Button.tsx
    Card.tsx
    Avatar.tsx
    Badge.tsx
    ProgressBar.tsx
    StatBlock.tsx
    EmptyState.tsx
    LoadingState.tsx
    index.ts
```

Keep this lightweight. Do not force every component into shared UI. Feature-specific UI should live in each app or feature folder.

---

## `packages/card-renderer`

This is one of the most important packages.

Purpose:

- Render a user’s card preview
- Apply template metadata
- Position avatar, stats, display name, badges, and cosmetics
- Produce consistent card outputs across mobile and web
- Support future template changes without rewriting the app

Suggested structure:

```txt
packages/card-renderer/
  src/
    components/
      PlayerCard.tsx
      PlayerCardTemplate.tsx
      PlayerAvatarLayer.tsx
      PlayerStatsLayer.tsx
      PlayerNameLayer.tsx
      BadgeLayer.tsx
      CosmeticLayer.tsx

    templates/
      templateSchema.ts
      templateLoader.ts
      templateResolver.ts

    utils/
      scalePosition.ts
      fitText.ts
      cropImage.ts
      colors.ts

    types.ts
    index.ts
```

This package should not care where the data comes from. It should receive card data and template metadata, then render the card.

---

## `packages/game-engine`

All scoring and progression logic should live here.

```txt
packages/game-engine/
  src/
    xp/
      calculateXp.ts
      xpLedger.ts
      streaks.ts

    cardProgression/
      calculateCardTier.ts
      calculateStatCaps.ts
      applyUpgrade.ts

    trivia/
      scoreTriviaAttempt.ts
      calculateTriviaRewards.ts

    bracket/
      scoreBracket.ts
      bracketRules.ts

    bounties/
      scoreBounty.ts
      bountyRules.ts

    leaderboards/
      calculateLeaderboard.ts
      leaderboardTypes.ts

    index.ts
```

Important principle:

**Paid points should never be mixed with competitive scoring.**

The game engine should clearly separate:

- Earned XP
- Purchased Locker Room Credits
- Cosmetic upgrades
- Competitive leaderboard points

---

# 6. Card Template System

Because the base cards are manually created, the app should treat them as template assets with metadata.

## Card asset folder

```txt
design/card-templates/
  level-01-base/
    source.fig
    base-card.png
    preview-filled.png
    metadata.json
    notes.md

  level-02-base/
    source.fig
    base-card.png
    preview-filled.png
    metadata.json
    notes.md

  level-03-base/
    source.fig
    base-card.png
    preview-filled.png
    metadata.json
    notes.md
```

## Template metadata example

Each base card should have a matching `metadata.json` file that defines where dynamic content should go.

```json
{
  "id": "level-01-base",
  "name": "Base Card Level 01",
  "version": 1,
  "width": 1024,
  "height": 1536,
  "safeArea": {
    "x": 76,
    "y": 80,
    "width": 872,
    "height": 1376
  },
  "layers": {
    "overall": {
      "x": 115,
      "y": 210,
      "fontSize": 88,
      "fontWeight": "800",
      "color": "#3A2A05"
    },
    "avatar": {
      "x": 260,
      "y": 260,
      "width": 560,
      "height": 740,
      "fit": "contain"
    },
    "displayName": {
      "x": 160,
      "y": 1010,
      "width": 704,
      "height": 100,
      "fontSize": 74,
      "fontWeight": "900",
      "color": "#3A2A05",
      "align": "center"
    },
    "stats": {
      "y": 1160,
      "columns": [
        { "key": "hyp", "x": 145 },
        { "key": "frm", "x": 295 },
        { "key": "atk", "x": 445 },
        { "key": "ast", "x": 595 },
        { "key": "wal", "x": 745 },
        { "key": "lck", "x": 895 }
      ],
      "labelFontSize": 44,
      "valueFontSize": 58,
      "color": "#3A2A05"
    },
    "badge": {
      "x": 460,
      "y": 1320,
      "width": 110,
      "height": 110
    }
  }
}
```

The exact coordinates will change as the design evolves. The key is that each card template owns its own positioning rules.

## Why metadata matters

Without template metadata, every design change will require code changes. With metadata, you can create new base card designs and update where the dynamic elements land without rewriting the card renderer.

---

# 7. Card Rendering Strategy

## MVP rendering approach

For MVP, use two rendering modes:

### 1. In-app preview rendering

The mobile app shows a live preview using the base card image plus positioned React Native layers.

Used for:

- Card creation preview
- Locker Room preview
- Profile card
- Group card showcase

### 2. Server-generated final card image

When the user saves or shares a card, generate a final flattened PNG server-side and store it in Supabase Storage.

Used for:

- Social sharing
- Public card pages
- Open Graph previews
- Cached profile card images
- Download/share exports

This gives users a stable image that always renders correctly when shared outside the app.

## Card rendering flow

```txt
User uploads photo or takes photo booth image
  ↓
Client crops/compresses image
  ↓
Image saved to Supabase Storage
  ↓
Edge Function starts AI avatar generation
  ↓
Generated avatar saved to Supabase Storage
  ↓
Card template metadata is loaded
  ↓
Server composes final card PNG
  ↓
Final card image saved to Supabase Storage
  ↓
Card record updated with final image URL
  ↓
User can share card or use it in groups
```

---

# 8. Supabase Structure

Recommended structure:

```txt
supabase/
  migrations/
    000001_init_profiles.sql
    000002_card_templates.sql
    000003_cards.sql
    000004_groups.sql
    000005_trivia.sql
    000006_brackets.sql
    000007_bounties.sql
    000008_xp_ledger.sql
    000009_locker_room.sql
    000010_purchases.sql

  functions/
    generate-card-avatar/
      index.ts
      prompt.ts
      schema.ts

    compose-player-card/
      index.ts
      renderer.ts
      schema.ts

    score-trivia-attempt/
      index.ts
      schema.ts

    submit-bracket/
      index.ts
      schema.ts

    score-match-bounty/
      index.ts
      schema.ts

    grant-xp/
      index.ts
      rules.ts
      schema.ts

    send-push-notification/
      index.ts
      schema.ts

    verify-purchase/
      index.ts
      schema.ts

  seed/
    nations.sql
    card_templates.sql
    trivia_questions.sql
    sample_matches.sql
```

---

# 9. Recommended Database Tables

## Core user tables

```txt
profiles
  id uuid primary key references auth.users(id)
  username text unique
  display_name text
  avatar_url text
  selected_nation_code text
  created_at timestamptz
  updated_at timestamptz
```

```txt
nations
  code text primary key
  name text
  flag_emoji text
  confederation text
  primary_color text
  secondary_color text
```

---

## Card tables

```txt
card_templates
  id uuid primary key
  template_key text unique
  name text
  tier integer
  base_image_url text
  metadata jsonb
  is_active boolean
  created_at timestamptz
```

```txt
cards
  id uuid primary key
  user_id uuid references profiles(id)
  template_id uuid references card_templates(id)
  display_name text
  selected_nation_code text
  overall integer
  stats jsonb
  avatar_source_url text
  avatar_generated_url text
  final_card_url text
  share_slug text unique
  status text
  created_at timestamptz
  updated_at timestamptz
```

```txt
card_generations
  id uuid primary key
  card_id uuid references cards(id)
  user_id uuid references profiles(id)
  generation_type text
  source_image_url text
  generated_image_url text
  selected boolean
  provider text
  provider_job_id text
  status text
  cost_cents integer
  created_at timestamptz
```

---

## Group tables

```txt
groups
  id uuid primary key
  name text
  owner_id uuid references profiles(id)
  invite_code text unique
  max_members integer
  is_paid_group boolean
  created_at timestamptz
```

```txt
group_members
  id uuid primary key
  group_id uuid references groups(id)
  user_id uuid references profiles(id)
  role text
  joined_at timestamptz
  unique(group_id, user_id)
```

---

## Trivia tables

```txt
trivia_questions
  id uuid primary key
  question text
  answer_options jsonb
  correct_answer_key text
  explanation text
  difficulty text
  active_date date
  nation_code text null
  created_at timestamptz
```

```txt
trivia_attempts
  id uuid primary key
  user_id uuid references profiles(id)
  question_id uuid references trivia_questions(id)
  selected_answer_key text
  is_correct boolean
  response_time_ms integer
  xp_awarded integer
  created_at timestamptz
```

---

## Bracket tables

```txt
brackets
  id uuid primary key
  user_id uuid references profiles(id)
  group_id uuid references groups(id) null
  picks jsonb
  score integer
  locked_at timestamptz
  created_at timestamptz
  updated_at timestamptz
```

---

## Bounty tables

```txt
match_bounties
  id uuid primary key
  match_id text
  prompt text
  answer_options jsonb
  correct_answer_key text null
  difficulty text
  lock_time timestamptz
  result_status text
  created_at timestamptz
```

```txt
bounty_picks
  id uuid primary key
  bounty_id uuid references match_bounties(id)
  user_id uuid references profiles(id)
  selected_answer_key text
  is_correct boolean null
  xp_awarded integer
  created_at timestamptz
  unique(bounty_id, user_id)
```

---

## XP and monetization tables

```txt
xp_events
  id uuid primary key
  user_id uuid references profiles(id)
  source_type text
  source_id uuid null
  amount integer
  reason text
  counts_toward_leaderboard boolean
  created_at timestamptz
```

```txt
wallets
  user_id uuid primary key references profiles(id)
  earned_xp integer
  locker_credits integer
  purchased_credits integer
  updated_at timestamptz
```

```txt
locker_items
  id uuid primary key
  item_key text unique
  name text
  item_type text
  rarity text
  price_credits integer
  asset_url text
  metadata jsonb
  is_active boolean
  created_at timestamptz
```

```txt
user_inventory
  id uuid primary key
  user_id uuid references profiles(id)
  locker_item_id uuid references locker_items(id)
  source text
  acquired_at timestamptz
  unique(user_id, locker_item_id)
```

```txt
purchases
  id uuid primary key
  user_id uuid references profiles(id)
  platform text
  product_id text
  transaction_id text unique
  purchase_type text
  amount_cents integer
  status text
  raw_receipt jsonb
  created_at timestamptz
```

---

# 10. Feature Module Pattern

Each feature should follow the same internal pattern.

Example: `src/features/card`

```txt
src/features/card/
  api/
    createCard.ts
    getCard.ts
    updateCard.ts
    regenerateCard.ts

  components/
    CardPreview.tsx
    CardTemplatePicker.tsx
    CardStatsGrid.tsx
    CardShareButton.tsx
    RegenerationPicker.tsx

  hooks/
    useCreateCard.ts
    useCard.ts
    useRegenerateCard.ts
    useCardTemplates.ts

  schemas/
    cardSchema.ts

  utils/
    cardStats.ts
    cardProgression.ts
    cardValidation.ts

  types.ts
  index.ts
```

Use the same pattern for:

- `auth`
- `onboarding`
- `trivia`
- `bracket`
- `groups`
- `locker-room`
- `bounties`
- `notifications`
- `purchases`

---

# 11. MVP Build Phases

## Phase 0: Repo and infrastructure setup

Goal: clean foundation.

Tasks:

- Create monorepo
- Set up Expo app
- Set up Next.js app
- Set up Supabase project
- Add Supabase local development
- Add TypeScript configs
- Add linting and formatting
- Add `.env.example` files
- Add shared packages
- Add first database migration
- Add seed data for nations and sample templates

Done when:

- Mobile app opens locally
- Web app opens locally
- Supabase runs locally
- Mobile app can connect to Supabase
- Auth works locally

---

## Phase 1: Card creation MVP

Goal: prove the core hook.

Tasks:

- Nation selection
- Photo upload
- Photo booth capture
- Manual crop step
- Display name input
- Base card template preview
- Save card to Supabase
- Generate final card image
- Public share URL

Done when:

- A user can create a card from start to finish
- The card can be shared via link
- The shared page displays the card
- The card image is stored and stable

---

## Phase 2: Groups and invite loop

Goal: create social retention.

Tasks:

- Create group
- Join group by invite link/code
- Group member list
- Card showcase grid
- Basic group leaderboard shell
- Share group invite

Done when:

- A user can invite friends into a group
- Group members can see each other’s cards
- Invite links work from web to app

---

## Phase 3: Daily trivia and streaks

Goal: create daily engagement.

Tasks:

- Daily trivia screen
- 3 questions per day
- Submit answers
- Score attempt
- Award XP
- Track streak
- Update card stats
- Group trivia leaderboard
- Push reminder foundation

Done when:

- Users can play daily trivia
- XP is added through `xp_events`
- Card stats can improve from earned XP
- Group trivia leaderboard works

---

## Phase 4: Locker Room and monetization

Goal: test monetization.

Tasks:

- Locker Room screen
- Cosmetic inventory
- Apply card cosmetics
- Regenerate AI card image flow
- Product IDs for mobile purchases
- Purchase verification function
- Purchased credits separated from leaderboard XP

Done when:

- Users can preview cosmetics
- Users can purchase or unlock cosmetic items
- Paid credits do not affect competitive scoring
- Users can regenerate a card image and choose from options

---

## Phase 5: Brackets and match bounties

Goal: extend tournament engagement.

Tasks:

- Bracket pick flow
- Lock picks by match/tournament phase
- Score bracket picks
- Bracket leaderboard
- Match bounty creation
- Match bounty submission
- Match bounty scoring

Done when:

- Users can submit a bracket
- Bracket points are tracked separately
- Users can answer match bounties
- Groups show leaderboards by game type

---

# 12. Environment Variables

Each app should have its own `.env.example`.

## `apps/mobile/.env.example`

```txt
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_WEB_URL=
EXPO_PUBLIC_APP_SCHEME=
EXPO_PUBLIC_ENVIRONMENT=development
```

## `apps/web/.env.example`

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_STORE_URL=
NEXT_PUBLIC_PLAY_STORE_URL=
NEXT_PUBLIC_WEB_URL=
```

## `supabase/functions/.env.example`

```txt
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
CARD_RENDER_SECRET=
PURCHASE_WEBHOOK_SECRET=
```

Rule:

**Never expose service-role keys or AI provider keys in the mobile app or web client.**

---

# 13. Suggested Commands

Root `package.json` scripts:

```json
{
  "scripts": {
    "dev": "turbo dev",
    "dev:mobile": "pnpm --filter mobile start",
    "dev:web": "pnpm --filter web dev",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "supabase:start": "supabase start",
    "supabase:stop": "supabase stop",
    "supabase:reset": "supabase db reset",
    "supabase:types": "supabase gen types typescript --local > packages/types/src/database.ts"
  }
}
```

---

# 14. Card Template Workflow

## Manual design workflow

1. Create base card in Figma, Illustrator, or preferred design tool.
2. Export clean base card with no user overlays.
3. Export a filled example for QA/reference.
4. Create `metadata.json` for dynamic placement.
5. Add files to `design/card-templates/[template-key]`.
6. Upload approved base card PNG to Supabase Storage.
7. Seed or update `card_templates` table.
8. Test template inside app preview.
9. Test server-generated final card output.

## Template versioning

Do not overwrite templates silently.

Use:

```txt
level-01-base-v1
level-01-base-v2
level-02-base-v1
```

Why:

- Existing user cards should not break when designs change.
- You may want to preserve old limited-edition card designs.
- You can A/B test template styles later.

---

# 15. Naming Conventions

## Files and folders

Use kebab-case for folders:

```txt
locker-room/
card-renderer/
match-bounties/
```

Use PascalCase for React components:

```txt
PlayerCard.tsx
CardPreview.tsx
GroupLeaderboard.tsx
```

Use camelCase for utility files:

```txt
calculateXp.ts
formatCardStats.ts
uploadCardImage.ts
```

## Database naming

Use snake_case:

```txt
card_templates
card_generations
xp_events
locker_items
```

## Product language

Avoid public-facing language that implies official FIFA affiliation.

Use:

- footballer card
- fan card
- tournament card
- squad card
- match bounty
- Locker Room
- nation
- group
- bracket

Avoid:

- FIFA card
- official World Cup card
- Ultimate Team
- FUT
- official tournament partner

---

# 16. Security and Anti-Cheating Notes

## Row-level security

Every user-owned table should have RLS enabled.

Users should only be able to:

- Read public/shared card data
- Read groups they belong to
- Update their own profile
- Update their own active card
- Submit their own trivia attempts
- Submit their own bracket
- Submit their own bounty picks

Users should not be able to directly:

- Award themselves XP
- Modify leaderboard points
- Mark purchases as verified
- Change match results
- Change correct answers
- Edit card template metadata

## XP ledger

All XP should be written through a controlled function or server-side pathway.

Never trust the client to say:

```txt
user earned 500 XP
```

The client should submit the action, and the backend should calculate the reward.

## Paid points separation

Keep these separate:

- `earned_xp`
- `locker_credits`
- `purchased_credits`
- `leaderboard_points`

Paid credits can upgrade card visuals, but should not determine competitive leaderboard rankings.

---

# 17. Push Notifications

Suggested notification types:

```txt
DAILY_TRIVIA_AVAILABLE
STREAK_AT_RISK
FRIEND_CHALLENGED_YOU
GROUP_LEADER_CHANGED
BRACKET_LOCKING_SOON
MATCH_BOUNTY_AVAILABLE
CARD_UPGRADE_UNLOCKED
LOCKER_DROP_AVAILABLE
```

Start simple:

- Daily trivia reminder
- Streak reminder
- Bracket lock reminder
- Card upgrade unlocked

Do not over-notify in MVP. Notifications should feel like tournament energy, not spam.

---

# 18. Analytics Events

Track analytics from day one.

Recommended events:

```txt
sign_up_started
sign_up_completed
nation_selected
photo_uploaded
photo_booth_started
card_created
card_shared
group_created
group_joined
trivia_started
trivia_completed
streak_extended
bracket_started
bracket_submitted
locker_room_opened
cosmetic_previewed
purchase_started
purchase_completed
card_regeneration_started
card_regeneration_completed
```

Most important funnel:

```txt
App open → create card → share card → create/join group → complete first trivia → return next day
```

---

# 19. MVP Priority Recommendation

Build in this exact order:

1. Repo foundation
2. Supabase auth
3. Nation selection
4. Card template rendering
5. Photo upload/photo booth
6. Save card
7. Share card page
8. Groups/invites
9. Daily trivia
10. XP and streaks
11. Card progression
12. Locker Room cosmetics
13. Regeneration purchase flow
14. Bracket
15. Match bounties

The reason: the AI card is the viral hook. Do not spend weeks on scoring systems before the card creation and sharing loop feels great.

---

# 20. First Engineering Milestone

The first milestone should be:

**A user can create a card, see it rendered inside the app, save it, and share a public link.**

That requires:

- Mobile app shell
- Supabase auth
- Profile table
- Card template table
- Supabase Storage bucket
- Image upload
- Card creation screen
- Card renderer
- Shareable web page

Do not build trivia, brackets, bounties, or purchases until this milestone works.

---

# 21. Suggested First Sprint Checklist

## Repo setup

- [ ] Create GitHub repo
- [ ] Add `apps/mobile`
- [ ] Add `apps/web`
- [ ] Add `packages/types`
- [ ] Add `packages/config`
- [ ] Add `packages/card-renderer`
- [ ] Add `supabase`
- [ ] Add `design/card-templates`
- [ ] Add root README
- [ ] Add `.env.example` files

## Supabase setup

- [ ] Initialize Supabase locally
- [ ] Create profiles migration
- [ ] Create card templates migration
- [ ] Create cards migration
- [ ] Create storage buckets
- [ ] Add RLS policies
- [ ] Generate TypeScript database types

## Card system setup

- [ ] Add first base card PNG
- [ ] Add first `metadata.json`
- [ ] Seed first card template
- [ ] Build `PlayerCard` preview component
- [ ] Build card creation screen
- [ ] Build image upload flow
- [ ] Save card to database

## Share system setup

- [ ] Create card share slug
- [ ] Create `/card/[slug]` web page
- [ ] Display saved card on web
- [ ] Add share CTA in mobile app
- [ ] Test link sharing from phone

---

# 22. Open Decisions

These should be decided before build starts:

1. What is the app name?
2. What is the card stat system?
3. Are stats purely cosmetic, or do they reflect gameplay?
4. Does every user get one active card, or can they own multiple cards?
5. Are card templates unlocked by level, purchase, tournament phase, or all three?
6. Will AI-generated avatars be required, or can users use their original uploaded image?
7. Should paid regenerations happen before or after the first free generation?
8. What is the maximum free group size?
9. What is the first paid product: regeneration, cosmetics, or tournament pass?
10. What is the minimum MVP you want ready before user testing?

---

# 23. Recommended Product Architecture Summary

The project should be scaffolded as a mobile-first monorepo with a clean separation between:

- **Mobile experience:** card creation, games, groups, Locker Room
- **Web experience:** shared cards, invites, landing pages
- **Backend:** auth, database, storage, scoring, image generation, purchases
- **Shared packages:** types, config, card rendering, game rules
- **Design assets:** manually created base card templates and metadata

The key architectural choice is to make the player card system template-driven. Your manually created base cards should not be hardcoded into screens. Each card should have a base image, metadata, versioning, and dynamic layers. That keeps the design flexible as the visual direction changes and lets you add card tiers, limited drops, nation-specific cards, and paid cosmetics without rebuilding the core app.

The first product milestone should not be a full World Cup game. It should be a shareable card creator with enough backend structure to support groups, XP, and future monetization.


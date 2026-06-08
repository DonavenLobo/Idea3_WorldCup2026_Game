# GoGaffa MVP Decisions

Last updated: May 18, 2026

## Product Loop

The MVP is built around this loop:

```txt
Create AI footballer card -> join/create group -> play daily trivia -> earn Competitive Points and Card XP/Credits -> upgrade/share card -> repeat
```

The AI footballer card is the core identity, monetization, and sharing surface. Trivia, match predictions, groups, bounties, and Locker Room features should support card progression and social competition.

## Locked Decisions

1. Purchases must never affect competitive scoring, trivia outcomes, prediction outcomes, or competitive leaderboards.
2. MVP core gameplay is daily trivia first, with simple match predictions and live in-match bounties second.
3. Use two currencies: Competitive Points for fair leaderboards, and Card XP/Credits for card progression, cosmetics, and paid upgrades.
4. First-session activation is creating and previewing the AI footballer card.
5. Users cannot enter the full app without creating a base card.
6. Card generation can use an intentional waiting state: "your card is cooking." If it takes too long, prompt for push notifications and notify when ready.
7. If AI generation fails, provide a polished non-AI card fallback plus one free retry.
8. If an uploaded photo is rejected by moderation, ask the user for a new photo.
9. The primary share object is a simplified teaser card with name, nation, rarity/tier, avatar, and CTA.
10. Groups are strongly encouraged but not mandatory.
11. Users may join/create multiple groups.
12. Do not monetize group count or group size in MVP.
13. MVP monetization is AI card regeneration and premium cosmetics. Rewarded ads are optional and deferred.
14. Card progression uses rarity tiers, OVR, and cosmetic unlocks.
15. Card stats are status/identity markers, not gameplay power.
16. Cards never downgrade. Streaks and competitive rank can fluctuate, but card progression is cumulative.
17. Daily trivia uses fixed questions for everyone, asynchronous play, and Wordle-like spoiler-safe result sharing.
18. Daily trivia has 5 multiple-choice questions with 4 answer options each.
19. Only the first daily trivia attempt counts competitively.
20. Trivia scoring uses correctness plus speed.
21. Match predictions use simple pre-match outcome picks.
22. Live in-match bounties use a trivia-like format and never award Competitive Points.
23. Bounty rewards can include exclusive cosmetics, temporary visual effects, card stat/status upgrades, rarity progress, streak save coupons, and limited event badges.
24. Bounty reward identity can be hidden until the user opens the bounty, but after reveal the reward is deterministic.
25. Avoid randomized paid rewards and loot-box mechanics.
26. Bracket prediction is secondary. Include a lightweight bracket only if it does not delay card, trivia, and groups.
27. Each group has multiple leaderboards. The default is the most active leaderboard, and users can set a preferred default.
28. MVP leaderboards should include Daily Trivia, Overall Competitive Points, Prediction Accuracy, and Card Showcase.
29. Card Showcase can include paid cosmetics/progression, but it must be clearly labeled as non-competitive.
30. Use anonymous/session-first onboarding until card preview, then require account creation to save, share, join groups, or appear on leaderboards.
31. Desired auth options are Apple, Google, Facebook, and Instagram if feasible. Treat Instagram as desired until provider feasibility is confirmed.
32. The product is 13+, avoids gambling framing, avoids paid randomness, and moderates photo/AI generation.
33. Start with monorepo skeleton plus product decision docs, then build the first vertical slice.

## Non-Negotiable Engineering Rules

1. Competitive Points must only come from earned gameplay.
2. Purchased credits must never be merged into Competitive Points.
3. Leaderboard scoring must happen server-side or in controlled backend functions.
4. The client can submit actions, but must not directly award XP, Competitive Points, purchases, or bounty rewards.
5. Public language should avoid implying official FIFA affiliation.

## Deferred

1. 5-a-side fantasy is deferred until the daily loop proves retention.
2. Head-to-head trivia is deferred until there is enough participation density.
3. Sponsored integrations, affiliate commerce, and large-scale ad monetization are later-stage opportunities.
4. Live bounties should start operationally simple before relying on real-time automation.

## v1 App Store Submission Decisions

Locked on June 7, 2026 while preparing the first App Store / Google Play submission. These maximize first-pass review approval.

1. **Auth for v1 is Apple + Google OAuth only.** Phone and Email OTP screens were mock-only (no real session) and were removed, along with their routes, to avoid a broken-functionality rejection (Guideline 2.1). "Continue with Google" is the primary (red) button; "Continue with Apple" is secondary. Real phone/email OTP is deferred to a later update.
2. **Account deletion is in-app and immediate** (Guideline 5.1.1(v)). The `delete-account` Edge Function removes the user's storage objects and hard-deletes the auth user, which cascades every user-owned row. Surfaced as "Delete account" in the account menu with a destructive confirmation.
3. **No in-app purchases ship at launch.** No StoreKit/billing library is wired and the Locker Room is a labeled "Coming Soon" placeholder, so the IAP review surface is intentionally empty. Paid regeneration/cosmetics come in a later update and must use native IAP when they do.
4. **UGC safety (Guideline 1.2):** AI-generated card images rely on the image provider's (OpenAI) safety guardrails, enforced server-side in `generate-card-avatar` (`moderation_rejected` status). User-to-user content (display names, group/leaderboard visibility) is covered by in-app **report** + **block** (`content_reports`, `user_blocks` tables) and a content-policy acknowledgment at card creation. Blocked users are hidden from member lists and all leaderboards. Reports are reviewed within 24 hours (state this in App Review notes).
5. **Public copy must avoid implied official FIFA affiliation.** "World Cup 2026" appears as descriptive fan-game copy only; no FIFA marks, logos, or affiliation claims.

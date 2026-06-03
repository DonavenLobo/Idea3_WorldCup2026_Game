# Scripts

Project automation scripts live here.

## Current Scripts

- `create-transparent-card-template.cjs`: generates the transparent level 0 card
  asset from `design/card-templates/designs/level0.png`.
- `preview-card.cjs`: native-coordinate card layout preview. Run
  `pnpm preview:card` when adjusting card template metadata; this is the most
  reliable visual check for overlay placement.
- `serve-spa.cjs`: small local SPA static server used by Playwright visual tests.

## Future Candidates

- Generate Supabase database types.
- Validate card template metadata.
- Create card template seed SQL from `design/card-templates`.
- Check that paid ledger events cannot count toward competitive leaderboards.

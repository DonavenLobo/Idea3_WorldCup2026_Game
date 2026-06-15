# Trivia Gap-Fill Suggestions

**Date:** 2026-06-12 · **Branch:** `feature/trivia-daily-rules`

## Why
The schedule generator (`pnpm dlx tsx packages/game-engine/scripts/generateTriviaSeed.ts 30`)
reported gaps for a 30-day horizon from 2026-06-15:

```
filled: 21  gaps: 9
DAYS THAT CANNOT FIELD 3 DISTINCT WC NATIONS:
  2026-07-06 .. 2026-07-14  (have 1, need 3)  — pool exhausted after 21 days
```

The starter pool had 16 nations × 4 = 64 questions. With 3/day and no within-horizon
reuse, capacity ≈ 64 ÷ 3 ≈ 21 days. To fill 30 days with 3 *distinct* nations each day,
we need more **nation breadth** (not just depth). This adds **9 nations × 4 = 36**
factual, mark-free questions (→ 25 nations, 100 questions, ~33-day capacity).

All proposed questions: factual only, no FIFA/competition marks, "global tournament"
phrasing where a tournament must be referenced. All nation codes are in the WC-2026 set.

## Proposed new questions (review before they go live)

### Colombia (COL)
1. Nickname → **Los Cafeteros** (The Coffee Growers).
2. Capital → **Bogotá**.
3. Home shirt color → **Yellow**.
4. Won the Golden Boot at the 2014 global tournament → **James Rodríguez**.

### Uruguay (URU)
1. Nickname → **La Celeste** (The Sky Blue).
2. Capital → **Montevideo**.
3. Home shirt color → **Sky blue**.
4. Forward who partnered Edinson Cavani and starred at Barcelona → **Luis Suárez**.

### Switzerland (SUI)
1. Home shirt color → **Red**.
2. Capital → **Bern** (trap: not Zurich/Geneva).
3. Nickname → **Nati**.
4. Flag = white cross on which color → **Red**.

### Senegal (SEN)
1. Nickname → **The Lions of Teranga**.
2. Capital → **Dakar**.
3. Forward who starred for Liverpool and won the 2022 Africa Cup of Nations → **Sadio Mané**.
4. Stunned the reigning champions in their 2002 opener — which nation → **France**.

### Nigeria (NGA)
1. Nickname → **Super Eagles**.
2. Capital → **Abuja** (trap: not Lagos).
3. Home shirt color → **Green**.
4. Won Olympic men's football gold in → **1996**.

### Australia (AUS)
1. Nickname → **The Socceroos**.
2. Capital → **Canberra** (trap: not Sydney/Melbourne).
3. Home shirt color → **Gold**.
4. Joined which confederation in 2006 → **AFC (Asia)**.

### Ecuador (ECU)
1. Home shirt color → **Yellow**.
2. Capital → **Quito** (trap: not Guayaquil).
3. Nickname → **La Tri**.
4. High-altitude home stadium is in → **Quito**.

### Poland (POL)
1. Home shirt color → **White**.
2. Capital → **Warsaw**.
3. Prolific striker who became a Bayern Munich great → **Robert Lewandowski**.
4. Nickname → **Biało-czerwoni** (the white-reds).

### Denmark (DEN)
1. Home shirt color → **Red**.
2. Capital → **Copenhagen**.
3. Nickname → **Danish Dynamite**.
4. Won the 1992 European Championship after replacing which nation → **Yugoslavia**.

## Result
After adding these to `WORLD_CUP_TRIVIA_POOL` and regenerating, the 30-day schedule
fills with **0 gaps** (validated — see commit).

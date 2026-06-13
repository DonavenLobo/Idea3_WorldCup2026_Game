# GoGaffa Brand Guidelines

> **Version:** 1.0 — June 2026
> **Audience:** Designers, developers, and partners building for GoGaffa

---

## 1. Brand Overview

### Name & Tagline

| | |
|---|---|
| **Brand name** | GoGaffa |
| **Tagline** | Your football summer starts here. |
| **Full strapline** | Build your card. Back your picks. Beat your mates. |

### Mission

GoGaffa turns the 2026 international football tournament into a personal, social competition between friends — predictions, trivia, player cards, and bragging rights in a single mobile experience.

### Brand Personality

| Trait | In practice |
|---|---|
| **Playful** | Handwritten type, card-deck metaphor, cheeky kickers ("Spoiler: it's probably not Dave.") |
| **Competitive** | Leaderboards, upgrades, "Beat your mates" framing |
| **Direct** | Short sentences, second person, no jargon |
| **Football-native** | Tactical diagrams, pitch metaphors ("Couldn't reach the pitch"), tournament cadence |
| **Inclusive banter** | Trash-talk that's fun, never cruel — like mates at the pub |

---

## 2. Colour Palette

### Primary Colours

| Swatch | Name | Hex | RGB | HSL | Role |
|---|---|---|---|---|---|
| ![cream](https://via.placeholder.com/16/f5f0e8/f5f0e8) | **Cream** | `#f5f0e8` | `rgb(245, 240, 232)` | `hsl(37, 39%, 94%)` | Background / paper surface |
| ![ink](https://via.placeholder.com/16/1a1a2e/1a1a2e) | **Ink** | `#1a1a2e` | `rgb(26, 26, 46)` | `hsl(240, 28%, 14%)` | Primary text, borders, shadows |
| ![red](https://via.placeholder.com/16/e63946/e63946) | **Red** | `#e63946` | `rgb(230, 57, 70)` | `hsl(355, 78%, 56%)` | Energy, CTAs, urgency |

### Accent Colours

| Swatch | Name | Hex | RGB | HSL | Role |
|---|---|---|---|---|---|
| ![blue](https://via.placeholder.com/16/1d3557/1d3557) | **Blue** | `#1d3557` | `rgb(29, 53, 87)` | `hsl(215, 50%, 23%)` | Identity, trust, links |
| ![purple](https://via.placeholder.com/16/6b4c9a/6b4c9a) | **Purple** | `#6b4c9a` | `rgb(107, 76, 154)` | `hsl(264, 34%, 45%)` | Tournament, prestige |
| ![success](https://via.placeholder.com/16/2f7a4d/2f7a4d) | **Success** | `#2f7a4d` | `rgb(47, 122, 77)` | `hsl(144, 44%, 33%)` | Confirmation, positive feedback |

### CSS Custom Properties

```css
--color-cream:   #f5f0e8;
--color-red:     #e63946;
--color-blue:    #1d3557;
--color-purple:  #6b4c9a;
--color-ink:     #1a1a2e;
--color-success: #2f7a4d;
```

### Accent Semantics

| Accent | Meaning | Use when… |
|---|---|---|
| **Red** | Energy, action, urgency | CTAs, error messages, the opening "Kick-off" card, focus rings |
| **Blue** | Identity, trust | Identity-themed content, links on legal pages, the "Your card. Your reputation." card |
| **Purple** | Tournament, prestige | Tournament-themed content, the "64 games" card, support page eyebrow |

### Opacity Conventions

All opacity values use `ink` (`#1a1a2e`) as the base unless otherwise noted.

| Token | Opacity | Usage |
|---|---|---|
| `ink` | 100% | Headlines, primary text, borders |
| `ink/85` | 85% | Card body text (desktop) |
| `ink/80` | 80% | Card body text (mobile), secondary descriptions |
| `ink/70` | 70% | Footer navigation links, kicker text |
| `ink/60` | 60% | Footnotes, dot counter text ("1 / 4") |
| `ink/55` | 55% | "Last updated" date labels |
| `ink/35` | 35% | Input placeholder text |
| `ink/30` | 30% | Decorative bullet separators |
| `ink/15` | 15% | Content panel borders |
| `cream/80` | 80% | Arrow button background |
| `cream/75` | 75% | Content panel background |
| `cream/70` | 70% | Input field background |
| `red/50` | 50% | Input focus ring |

### Colour Pairing Rules

1. **Primary pair:** Ink on Cream — used for all body text and headlines.
2. **Inverted pair:** Cream on Red — used for primary CTA buttons.
3. **Accent text:** Red, Blue, or Purple on Cream — used for eyebrow labels and accent highlights.
4. **Links on legal pages:** Blue (`text-blue`) with `font-semibold` weight.
5. **Success text:** Success green on Cream — confirmation messages only.

### Accessibility Notes

- Ink on Cream (#1a1a2e on #f5f0e8) provides a contrast ratio of approximately **12.5:1** (exceeds WCAG AAA).
- Cream on Red (#f5f0e8 on #e63946) provides a contrast ratio of approximately **3.8:1** — acceptable for large bold text (CTA buttons use `text-3xl font-bold`).
- Always pair accent colours (red, blue, purple) with the cream background, never with each other.
- The `.ink-shadow` technique ensures text remains legible over paper-noise textures.

---

## 3. Typography

### Font Families

| Font | Variable | Stack | Role |
|---|---|---|---|
| **Caveat** | `--ff-caveat` | `Caveat, "Comic Sans MS", cursive` | Handwritten personality — headlines, labels, buttons, card copy |
| **Inter** | `--ff-inter` | `Inter, system-ui, -apple-system, sans-serif` | System/UI clarity — body text, legal content, eyebrows, metadata |

Both fonts are loaded from Google Fonts with `display: "swap"` for optimal performance.

### Caveat Weights

| Weight | CSS | Usage |
|---|---|---|
| 400 (Regular) | `font-normal` | — |
| 500 (Medium) | `font-medium` | — |
| 600 (Semibold) | `font-semibold` | Success confirmation messages |
| 700 (Bold) | `font-bold` | Headlines, buttons, section headings |

### Inter Weights

Inter is loaded with its full variable weight range. Used weights:

| Weight | CSS | Usage |
|---|---|---|
| 400 (Regular) | `font-normal` | Body text on content pages |
| 600 (Semibold) | `font-semibold` | Inline links on legal pages |
| 700 (Bold) | `font-bold` | Eyebrow labels |

### Type Scale

#### Headlines (Caveat)

| Style | Classes | Size | Weight | Leading | Context |
|---|---|---|---|---|---|
| Page title (large) | `text-6xl sm:text-7xl lg:text-8xl` | 60px / 72px / 96px | Bold | `leading-[0.92]` | Feature number ("64 games") |
| Page title | `text-6xl sm:text-7xl` | 60px / 72px | Bold | `leading-none` | Legal page H1s, card titles |
| Card title | `text-5xl sm:text-6xl lg:text-7xl` | 48px / 60px / 72px | Bold | `leading-[0.92]` | Standard card headlines |
| Section heading | `text-3xl` | 30px | Bold | default | H2s on content pages |
| Success message | `text-2xl sm:text-3xl` | 24px / 30px | Semibold | default | Post-signup confirmation |

#### Body (Caveat)

| Style | Classes | Size | Weight | Leading | Context |
|---|---|---|---|---|---|
| Card body (desktop) | `text-2xl sm:text-3xl` | 24px / 30px | Regular | `leading-snug` | Card descriptions, notes |
| Card body (mobile) | `text-2xl` | 24px | Regular | `leading-snug` | Mobile bottom panel |
| Support body | `text-3xl` | 30px | Regular | `leading-tight` | Support page description |
| Button text | `text-3xl` | 30px | Bold | default | CTA buttons |
| Input text | `text-2xl` | 24px | Regular | default | Email input field |
| Back link | `text-2xl` | 24px | Regular | default | "Back to GoGaffa" navigation |
| Error message | `text-lg sm:text-xl` | 18px / 20px | Regular | default | Form validation errors |
| Swipe hint | `text-lg sm:text-xl` | 18px / 20px | Regular | default | "Swipe or tap to continue" |
| Footer nav | `text-lg` | 18px | Regular | default | Privacy, Terms, Support links |
| Footnote | `text-base` | 16px | Regular | default | Counter ("1 / 4"), copyright |

#### System Text (Inter)

| Style | Classes | Size | Weight | Leading | Context |
|---|---|---|---|---|---|
| Body text | `text-base leading-7` | 16px / 28px | Regular | 1.75 | Legal page paragraphs |
| Date label | `text-sm` | 14px | Regular | default | "Last updated" timestamps |
| Eyebrow | `text-xs font-bold uppercase tracking-[0.28em]` | 12px | Bold | default | Section labels ("Kick-off", "GoGaffa") |

### Usage Rules

- **Caveat** is the brand's voice — use it for anything that should feel personal, handwritten, or conversational: headlines, card copy, buttons, navigation labels, and form inputs.
- **Inter** provides clarity and credibility — use it for legal body text, metadata, eyebrow labels, and any small-print that needs to be unmistakably readable.
- Never set Caveat below `text-base` (16px) — the handwritten style loses legibility at small sizes.
- Eyebrow labels always use Inter in `uppercase` with `tracking-[0.28em]` letter-spacing and `font-bold`.
- Apply `.ink-shadow` to Caveat headlines that sit over textured card surfaces.

---

## 4. Visual Language

### Paper Texture

The brand's signature tactile feel comes from a tileable fractal-noise SVG overlay applied via CSS.

**SVG Specification:**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
  <filter id="n">
    <feTurbulence
      type="fractalNoise"
      baseFrequency="0.85"
      numOctaves="2"
      stitchTiles="stitch"
    />
  </filter>
  <rect width="100%" height="100%" filter="url(#n)" />
</svg>
```

**CSS Application:**

```css
.paper-noise {
  background-image: url("data:image/svg+xml,..."); /* inline SVG above */
  background-repeat: repeat;
  pointer-events: none;
  mix-blend-mode: multiply;
}
```

**Implementation:**

- The overlay is a `fixed` positioned `div` covering the full viewport with `inset-0` and `z-0`.
- Opacity is set to `0.05` (5%) — subtle enough to imply paper, strong enough to feel tactile.
- The `aria-hidden` attribute ensures screen readers ignore the decorative layer.
- Content sits above the overlay at `z-10`.

| Parameter | Value | Notes |
|---|---|---|
| Tile size | 180 × 180 px | Seamlessly tileable |
| Noise type | `fractalNoise` | Organic, paper-like grain |
| Base frequency | `0.85` | Fine-grained texture |
| Octaves | `2` | Two layers of detail |
| Stitch mode | `stitch` | Seamless tiling |
| Blend mode | `multiply` | Darkens cream slightly, feels printed |
| Opacity | `0.05` (5%) | Barely perceptible, texturally felt |

### Ink Shadow

The `.ink-shadow` class creates a soft cream-coloured halo behind text, ensuring handwritten headlines remain legible over the paper-noise texture.

```css
.ink-shadow {
  text-shadow:
    0 0 10px rgba(245, 240, 232, 0.95),
    0 0 22px rgba(245, 240, 232, 0.85),
    1px 1px 0 rgba(245, 240, 232, 0.9),
    -1px 0 1px rgba(245, 240, 232, 0.75);
}
```

| Layer | Offset | Blur | Colour | Purpose |
|---|---|---|---|---|
| 1 | `0 0` | `10px` | `cream @ 95%` | Inner halo |
| 2 | `0 0` | `22px` | `cream @ 85%` | Outer halo |
| 3 | `1px 1px` | `0` | `cream @ 90%` | Bottom-right crisp edge |
| 4 | `-1px 0` | `1px` | `cream @ 75%` | Left edge softener |

### Hand-Drawn Aesthetic Principles

1. **Nothing is pixel-perfect** — corners are rounded, lines feel human-drawn.
2. **Borders are visible** — 2px solid borders in ink give elements a sketched outline.
3. **Shadows are offset, not blurred** — CTA buttons use solid `3px 3px` or `4px 4px` block shadows, as if stamps on paper.
4. **Paper over pixels** — the cream background + noise overlay makes everything feel like it's sitting on a notebook page.
5. **SVG diagrams use hand-drawn line qualities** — `strokeLinecap: "round"`, `strokeLinejoin: "round"` for organic feel.

### Card Design Language

Cards follow a collectible trading card metaphor — think football stickers or custom football cards.

| Property | Value | CSS |
|---|---|---|
| Aspect ratio | 682:1024 (~2:3) | `aspect-[682/1024]` |
| Max width | 520px | `w-[min(88vw,520px,(100svh-155px)/1.5)]` |
| Image shadow | — | `drop-shadow(0 16px 28px rgba(26,26,46,0.34))` |
| Fan rotation | `[0°, 2.6°, -2.2°, 3°]` per depth | Stacked cards look fanned out |
| Depth scale | `1 - depth × 0.045` | Background cards shrink slightly |
| Depth offset | `depth × 8px` vertical | Creates visible stack |

### Content Panel Design

Used on Privacy, Terms, and Support pages.

| Property | Value |
|---|---|
| Border radius | `28px` (`rounded-[28px]`) |
| Border | `2px solid ink/15` |
| Background | `cream/75` (cream at 75% opacity) |
| Padding | `24px` mobile / `40px` desktop (`p-6 sm:p-10`) |
| Shadow | `0 16px 40px -24px rgba(26, 26, 46, 0.45)` |

### Illustration Style: Playbook Tactical Diagrams

Illustrations use a football manager's notebook aesthetic — tactical diagrams drawn on the card surface.

**Vocabulary:**

| Element | Visual | SVG Implementation |
|---|---|---|
| **Player (node)** | Hollow circle | `<circle>` with `stroke="#1a1a2e"` `strokeWidth="2.4"` `fill="#efe9dd"` |
| **Ball** | Filled circle | `<circle>` with `fill="#1a1a2e"` `r="4.4"` |
| **Pass (dashed)** | Dashed line | `strokeDasharray="7 8"` in accent colour |
| **Run (solid)** | Solid line | Solid stroke, typically `width="2.8"` in ink |
| **Movement arrow** | Chevron arrowhead | Open chevron, `strokeWidth="2.6"`, wing ratio `0.48`, size `9` |
| **Zone** | Dashed rectangle | `<rect>` with `strokeDasharray="8 8"` in accent, `rx="7"` |

**SVG Constants:**

| Property | Value |
|---|---|
| ViewBox | `0 0 240 150` |
| Node radius | `6` |
| Node stroke width | `2.4` |
| Node fill | `#efe9dd` (slightly darker cream for paper feel) |
| Ball radius | `4.4` |
| Line stroke width | `3` (default), `2.6`–`3.4` range |
| Arrowhead size | `9` |
| Arrowhead wing ratio | `0.48` |
| Arrowhead stroke width | `2.6` |
| Dash pattern | `7 8` (line segments) / `8 8` (zone borders) |

**Diagram Heights:**

| Size | Class | Context |
|---|---|---|
| `xs` | `h-16` | Mobile bottom diagrams |
| `sm` | `h-24`, `max-w-[15rem]` | Desktop left sidebar |
| `lg` | `h-44`, `max-w-[22rem]` | Desktop right sidebar |

**Tactics Implemented:**

| Tactic | Description | Accent context |
|---|---|---|
| `tikiTaka` | Triangle of short passes between three players | Kick-off (red) |
| `totalFootball` | Two players swap positions on curved runs | Kick-off (red) |
| `overlap` | Winger plays inside, fullback overlaps and crosses | Identity (blue) |
| `falseNine` | Striker drops, wingers run behind | Identity (blue) |
| `gegenpress` | Three pressers collapse on ball in a trap zone | Tournament (purple) |
| `counterAttack` | Long break with supporting off-the-ball runs | Tournament (purple) |
| `highLine` | Back four step up to hold the offside line | Final whistle (red) |
| `corner` | In-swinging corner with two runners attacking | Final whistle (red) |

---

## 5. Component Patterns

### Primary CTA Button

The main call-to-action button, used for "Join the Waitlist" and support email.

**Waitlist CTA:**

```
rounded-[10px] border-2 border-ink bg-red px-5 py-3
font-caveat text-3xl font-bold text-cream
shadow-[3px_3px_0_0_var(--color-ink)]
transition-transform
```

| Property | Value |
|---|---|
| Border radius | `10px` |
| Border | `2px solid #1a1a2e` |
| Background | `#e63946` (red) |
| Text colour | `#f5f0e8` (cream) |
| Font | Caveat, 30px, bold |
| Padding | `20px` horizontal, `12px` vertical |
| Shadow | `3px 3px 0 0 #1a1a2e` (solid offset, no blur) |
| Hover | — (no hover colour change) |
| Active (tap) | `scale(0.97)` |
| Loading | Opacity pulse `[1, 0.65, 1]`, duration `1s`, infinite, `easeInOut` |
| Disabled | `cursor-not-allowed` |

**Support CTA (larger variant):**

```
rounded-[14px] border-2 border-ink bg-red px-6 py-3
font-caveat text-3xl font-bold text-cream
shadow-[4px_4px_0_0_var(--color-ink)]
transition-transform hover:-translate-y-0.5
```

| Property | Value |
|---|---|
| Border radius | `14px` |
| Shadow | `4px 4px 0 0 #1a1a2e` |
| Hover | `translateY(-2px)` lift |

### Input Field

Used for the waitlist email input.

```
rounded-[10px] border-2 border-ink bg-cream/70
px-4 py-3 text-center font-caveat text-2xl text-ink
placeholder:text-ink/35
focus:outline-none focus:ring-2 focus:ring-red/50
disabled:opacity-60
```

| Property | Value |
|---|---|
| Border radius | `10px` |
| Border | `2px solid #1a1a2e` |
| Background | `cream` at 70% opacity |
| Text | Caveat, 24px, centre-aligned |
| Placeholder | Ink at 35% opacity |
| Focus ring | `2px`, red at 50% opacity |
| Disabled | 60% opacity |
| Border style | `solid` (explicitly set via inline style) |

### Content Cards / Panels

Used on Privacy, Terms, and Support pages.

```
rounded-[28px] border-2 border-ink/15 bg-cream/75
p-6 sm:p-10
shadow-[0_16px_40px_-24px_rgba(26,26,46,0.45)]
```

| Property | Value |
|---|---|
| Border radius | `28px` |
| Border | `2px solid ink at 15%` |
| Background | Cream at 75% opacity |
| Padding | `24px` / `40px` responsive |
| Shadow | `0 16px 40px -24px rgba(26,26,46,0.45)` |

### Navigation Dots (DotIndicator)

```
// Container
flex items-center justify-center gap-3

// Active dot (animated via layoutId)
h-3 w-3 rounded-full border-2 border-ink bg-ink

// Inactive dot
h-2.5 w-2.5 rounded-full border-2 border-ink bg-transparent
hover:bg-ink/15
```

| Property | Active | Inactive |
|---|---|---|
| Size | `12px × 12px` | `10px × 10px` |
| Border | `2px solid ink` | `2px solid ink` |
| Fill | `ink` (solid) | Transparent |
| Hover fill | — | `ink` at 15% |
| Animation | Spring `stiffness: 400, damping: 28` (layoutId transition) | — |
| Spacing | `12px` gap between dots | — |

Counter below dots: `font-caveat text-base text-ink/60` — displays as "1 / 4".

### Icon Buttons (Arrows)

Used for previous/next card navigation.

```
rounded-full border-2 border-ink bg-cream/80 p-2.5 text-ink
transition-colors
hover:bg-ink hover:text-cream
disabled:cursor-not-allowed disabled:opacity-25
disabled:hover:bg-cream/80 disabled:hover:text-ink
```

| Property | Default | Hover | Disabled |
|---|---|---|---|
| Shape | Circle (`rounded-full`) | — | — |
| Border | `2px solid ink` | — | — |
| Background | Cream at 80% | Ink (inverted) | Cream at 80% |
| Icon colour | Ink | Cream (inverted) | Ink at 25% |
| Padding | `10px` | — | — |
| Cursor | Pointer | Pointer | `not-allowed` |

Arrow SVG: `viewBox="0 0 24 24"`, `strokeWidth="2.2"`, `strokeLinecap="round"`, `strokeLinejoin="round"`.

**Next-button pulse (first visit):**

```js
scale: [1, 1.08, 1],
boxShadow: [
  "0 0 0 0 rgba(230,57,70,0.4)",
  "0 0 0 8px rgba(230,57,70,0)",
  "0 0 0 0 rgba(230,57,70,0)",
],
duration: 1.8, repeat: 3, ease: "easeInOut"
```

### Eyebrow Label

```
font-inter text-xs font-bold uppercase tracking-[0.28em]
```

Colour is accent-dependent: `text-red`, `text-blue`, or `text-purple`.

### Underline Flourish

A hand-drawn SVG curve used beneath card titles.

```svg
<svg viewBox="0 0 160 10" class="my-2 h-3 w-40">
  <path
    d="M2 7 C 42 2, 86 10, 158 4"
    stroke="var(--color-{accent})"
    strokeWidth="4"
    strokeLinecap="round"
    fill="none"
  />
</svg>
```

### Footer

```
font-caveat text-ink/70

// Nav links
text-lg transition-colors hover:text-ink

// Bullet separator
text-ink/30 (decorative "•")

// Copyright
text-base text-ink/60
```

Copyright format: `GoGaffa © {year}`

---

## 6. Animation Principles

### Spring Physics Defaults

All meaningful transitions use spring physics via Framer Motion, never CSS timing functions.

| Context | Stiffness | Damping | Notes |
|---|---|---|---|
| Page/deck entrance | 260 | 24 | Gentle, welcoming entrance |
| Success message | 300 | 24 | Slightly snappier confirmation |
| Card content swap | 340 | 28 | Quick, responsive content change |
| Card position (drag return) | 300 | 32 | Heavier damping for card weight |
| Dot indicator travel | 400 | 28 | Tight, precise indicator movement |
| Note panel slide | 260 | 28 | Smooth flanking content |

### SVG Draw-In Pattern

Tactical diagram lines animate in using `pathLength`.

| Property | Value |
|---|---|
| Duration | `0.7s` (`DRAW` constant) |
| Easing | `easeOut` |
| Initial state | `pathLength: 0, opacity: 0` |
| Final state | `pathLength: 1, opacity: 1` |
| Stagger | Sequential delays (typically 0.12–0.18s apart) |

**Arrowhead timing:**

| Property | Value |
|---|---|
| Duration | `0.16s` |
| Delay | `lineDelay + DRAW × 0.88` (starts near end of parent line) |
| Easing | Default (Framer Motion default) |

**Node appearance:**

| Property | Value |
|---|---|
| Duration | `0.25s` |
| Initial | `scale: 0, opacity: 0` |
| Final | `scale: 1, opacity: 1` |

### Idle Breathing Animation

Applied to the top card when the user hasn't interacted yet.

```js
animate: { y: [0, -5, 0] }
transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
```

Disabled once the user taps, swipes, or clicks any navigation element.

### Card Drag Physics

| Property | Value |
|---|---|
| Drag axis | `x` only |
| Drag elastic | `0.55` |
| While dragging | `scale: 1.03`, `cursor: "grabbing"` |
| Advance threshold | `offset.x < -70px` or `velocity.x < -550` |
| Back threshold | `offset.x > 70px` or `velocity.x > 550` |
| Rotate on drag | Maps `x: [-260, 0, 260]` → `rotate: [-16°, 0°, 16°]` |
| Shadow on drag | Dynamic `drop-shadow` that shifts with drag direction |
| Exit animation | `x: "-128%"`, `y: -10`, `scale: 0.97`, `rotate: -24°`, `opacity: 0` |

### Swipe Hint Animation

```js
// Chevron arrows (>>>) bounce right
animate: { x: [0, 7, 0] }
transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
```

### Loading Pulse (Button)

```js
animate: { opacity: [1, 0.65, 1] }
transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
```

### Reduced Motion Policy

GoGaffa respects `prefers-reduced-motion: reduce` at two levels:

**CSS Level (global):**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

**JavaScript Level (per-component):**

Every animated component checks `useReducedMotion()` from Framer Motion. When reduced motion is preferred:
- `initial` is set to `false` (no entrance animation)
- Spring transitions use `{ duration: 0 }`
- Idle breathing, swipe hints, and draw-in animations are disabled
- The UI still functions identically — only motion is removed

---

## 7. Brand Voice & Copy

### Card Copy (PlaybookNotes)

Each card in the deck carries a distinct tone mapped to its position in the narrative flow.

#### Card 1 — Hook (Accent: Red)

| Field | Copy |
|---|---|
| **Eyebrow** | Kick-off |
| **Title** | GoGaffa |
| **Body** | Your football summer starts here. Build your card. Back your picks. Beat your mates. |
| **Kicker** | Swipe to see what's next. |

**Tone:** Bold, direct, sets the stakes immediately. Three punchy imperative sentences.

#### Card 2 — Identity (Accent: Blue)

| Field | Copy |
|---|---|
| **Eyebrow** | Identity |
| **Title** | Your card. Your reputation. |
| **Body** | Every prediction you nail and every trivia question you get right upgrades your player card. |
| **Kicker** | Get it wrong? Your mates will let you know. |

**Tone:** Aspirational with a cheeky threat — the card is personal, the stakes are social.

#### Card 3 — Urgency (Accent: Purple)

| Field | Copy |
|---|---|
| **Eyebrow** | Tournament mode |
| **Title** | 64 games |
| **Body** | One summer. Zero excuses. Join a league, make your predictions, and find out who actually knows their football. |
| **Kicker** | Spoiler: it's probably not Dave. |

**Tone:** Competitive urgency with a punchline. "Dave" is the universal mate who talks big but knows nothing.

#### Card 4 — CTA (Accent: Red)

| Field | Copy |
|---|---|
| **Eyebrow** | Final whistle |
| **Title** | Be first off the bench. |
| **Body** | GoGaffa is coming. Get early access and we'll set up your league before anyone else's. |
| **Kicker** | Join others already on the waitlist. |

**Tone:** Urgency meets exclusivity. "Off the bench" is a football metaphor for being ready to play.

### Confirmation Email

| Field | Value |
|---|---|
| **From** | `GoGaffa <hello@gogaffa.com>` |
| **Subject** | You're on the GoGaffa waitlist 🎴 |

**Body:**

> You're in.
>
> Thanks for joining the GoGaffa waitlist — your spot is saved.
> We'll be in touch before launch with your early access so your league is set up before anyone else's.
>
> The timing is no accident: GoGaffa lands during the biggest football tournament on the planet, so you'll be ready from the very first whistle.
>
> See you on the pitch,
> The GoGaffa team

### Success & Status Messages

| Status | Copy | Tone |
|---|---|---|
| **Joined** | You're on the list. We'll be in touch. ✓ | Warm confirmation |
| **Already joined** | You're already on the list — we've got you. | Reassuring, no judgement |
| **Loading** | Adding you... | Present participle, conversational |

### Error Messages

| Trigger | Copy | Tone |
|---|---|---|
| Invalid email (client) | That email doesn't look right — mind checking it? | Polite nudge, not accusatory |
| Invalid email (server) | That email doesn't look right — mind checking it? | Same as above, consistent |
| Server error | Something went wrong on our end. Try again in a moment. | Takes responsibility ("our end") |
| Network error | Couldn't reach the pitch. Check your connection and retry. | Football metaphor ("the pitch") |

### UI Microcopy

| Element | Copy |
|---|---|
| **CTA button** | Join the Waitlist |
| **Input placeholder** | you@example.com |
| **Swipe hint** | Swipe or tap to continue >>> |
| **Back link** | Back to GoGaffa |
| **Copyright** | GoGaffa © 2026 |
| **Counter** | {n} / {total} |

### Voice Do's & Don'ts

| Do | Don't |
|---|---|
| Use second person ("your card", "your mates") | Use third person or passive voice |
| Keep sentences short and punchy | Write long, corporate paragraphs |
| Use football metaphors naturally | Force metaphors where they don't fit |
| Be cheeky but inclusive ("probably not Dave") | Be mean-spirited or exclusionary |
| Take responsibility for errors ("on our end") | Blame the user |
| Use em dashes for asides | Use semicolons or formal punctuation |
| Say "mates" not "friends" or "users" | Use formal/clinical language |
| Use sentence case everywhere | Use Title Case except for brand name |

---

## 8. Contact & Legal

| Purpose | Address |
|---|---|
| **Support / Contact** | team@gogaffa.com |
| **From (transactional email)** | hello@gogaffa.com |
| **Display name** | GoGaffa |

**Copyright format:** `GoGaffa © {year}`

**Legal page structure:**
- Eyebrow label (accent coloured) → Page title (Caveat bold) → "Last updated" date → Content sections
- Privacy page eyebrow: Red
- Terms page eyebrow: Blue
- Support page eyebrow: Purple

---

## 9. Asset Reference

| Asset | Location | Format |
|---|---|---|
| Brand guidelines | `brand/BRAND_GUIDELINES.md` | Markdown |
| Wordmark (ink on transparent) | `brand/gogaffa-wordmark.svg` | SVG |
| Wordmark (cream on transparent) | `brand/gogaffa-wordmark-cream.svg` | SVG |
| Colour palette swatch | `brand/palette.svg` | SVG |
| Design tokens | `brand/tokens.json` | JSON |
| Favicon (SVG) | `public/favicon.svg` | SVG |
| Open Graph image | `public/og.png` | PNG 1200×630 |

---

*This document is the single source of truth for the GoGaffa brand. When in doubt, check `app/globals.css` and the component files for exact values.*

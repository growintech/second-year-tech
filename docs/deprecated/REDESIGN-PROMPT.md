# Games UI Redesign Prompt — Claude Code

Read @IMPL-B-js-modules.md for the full functional spec before touching any file.
Read the frontend-design skill at `.claude/skills/public/frontend-design/SKILL.md` before writing any CSS.

This is a **design-only task**. All JS logic in `auth.js` and `leaderboard.js` is correct and must not be changed.
Only rewrite: `games/shared/games.css`, `games/index.html`, `games/profile.html`.

---

## Aesthetic direction

The GIT Games platform is a retro-futuristic hacking terminal. Think:
- The targeting computers and ship readouts from Star Wars (1977) — scanlines, data panels, glowing borders
- 1980s arcade game HUDs — chunky UI panels, blinking cursors, ASCII-style dividers
- NOT green phosphor. NOT amber. This is GIT's brand: **cyan `#00E1FF` → blue `#0061FF`** on near-black `#0a0c10`
- Every piece of text is **monospace** — use `DM Mono` (already in the repo) for all body text, labels, values
- Use `Barlow Condensed` (700, 800) for large display headings only (the GIT brand headline font)
- Scanline overlay on the background (CSS repeating-gradient, subtle — 2px lines, 3% opacity)
- Panel borders use a faint cyan glow (`box-shadow: 0 0 12px rgba(0,225,255,0.15)`)
- Decorative elements: corner brackets on cards `┌ ┐ └ ┘`, section headers styled as terminal prompts `> LEADERBOARD_`, blinking cursor `_` on hero title

---

## GIT brand identity (strict)

```
--cyan:       #00E1FF
--blue:       #0061FF
--grad:       linear-gradient(90deg, #00E1FF, #0061FF)
--bg:         #0a0c10
--surface:    #0f1117
--surface-2:  #161920
--border:     rgba(0,225,255,0.12)
--border-2:   rgba(0,225,255,0.25)
--text:       #e8eaf0
--text-muted: #6b7280
--text-dim:   #374151
--green:      #22c55e
--red:        #ef4444
--yellow:     #eab308
```

Fonts via Google Fonts (already loaded in shared pages):
- `DM Mono` — all body text, labels, values, inputs, nav items
- `Barlow Condensed` 700/800 — hero headings only

---

## Navbar (top, sticky) — complete rewrite

**Structure (left → center → right):**
```
[GIT logo SVG]   [── centered nav ──]   [auth state + theme toggle]
```

- **Left:** GIT double-chevron logo (`>>`) + "Grow in Tech" — use the existing `logo.svg` from repo root, 
  height 40px. Link to `../index.html` (root lessons hub).
- **Center:** navigation links — `> GAMES_HUB` · `> LEADERBOARD_` · `> STANDINGS_` 
  (smooth-scroll anchors to sections on the page). Monospace, uppercase, small, muted cyan.
- **Right:** 
  - Theme toggle button (moon/sun icon, same pattern as lesson pages — reads/writes `git-theme` 
    in localStorage, toggles `html.light` class)
  - Auth state: if logged in → nickname badge `[M2] h4ck3r_pro` + `LOGOUT` button. 
    If logged out → `[ LOG IN ]` button styled as a terminal command button.
- Height: 56px. Background: `rgba(10,12,16,0.9)` + `backdrop-filter: blur(12px)`.
- Bottom border: `1px solid var(--border)`.

---

## games/index.html — full redesign

### Hero section
```
> GIT_GAMES_v1.0_
████████████████████████████████
PLAY HARD. DEBUG HARDER.
```
- Large `Barlow Condensed` title with blinking cursor `_` (CSS animation, 1s blink)
- Subtitle in `DM Mono`, muted
- Scanline texture on hero background
- No background image, no gradient blobs — pure terminal aesthetic

### Game cards grid
Each card is a **terminal panel**:
- Corner bracket decoration: CSS `::before`/`::after` pseudo-elements draw `┌─` top-left and `─┐` top-right
- Header bar: `[ HACKING_SIM ]` in cyan monospace, bold
- Body: description text in muted monospace
- Stats row: `BEST: 0000` · `TOP: 0000` — right-aligned, monospace, dim
- Play button: full-width, gradient background, monospace uppercase `[ PLAY → ]`
- If logged out: button shows `[ LOG IN TO PLAY ]`, cursor: not-allowed, reduced opacity
- Hover: card border brightens to `--border-2`, subtle translateY(-2px)

### Leaderboard section
- Section header: `> LEADERBOARD_` with a horizontal rule made of `─` characters
- Tab selector for All / Hacking Sim / Terminal Run: styled as terminal tabs 
  `[ALL]` `[HACKING_SIM]` `[TERMINAL_RUN]` — active tab has cyan underline + glow
- Table: no standard HTML table borders. Use monospace spacing, subtle row separators.
  Format: `#01  h4ck3r_pro      [M2]   4200   2026-03-28`
  Top 3 rows: #01 in gold `#fbbf24`, #02 silver `#9ca3af`, #03 bronze `#b45309`
- Empty state: `> NO_SCORES_YET_ ` with blinking cursor

### School standings section
- Section header: `> SCHOOL_STANDINGS_`
- 6 cards (one per school code), arranged in a 2×3 or 3×2 grid
- Each card: school badge `[M2]` large in cyan, total score, player count
- Leading school card gets a `★ LEADING` badge in gold

### Footer
- Simple dark footer, full width
- Left: `>> Grow in Tech — Net@ Program`
- Center: `GIT_GAMES_v1.0 // ${currentYear}`
- Right: `lessons.growintech.it`
- Top border: `1px solid var(--border)`
- All text: `DM Mono`, small, muted

---

## games/profile.html — full redesign

**Reference: Anthropic's auth UI — dark card, clean, very minimal. No clutter.**

### Layout
- Centered single card, max-width 440px, vertically centered on page
- Card: `--surface` background, `1px solid var(--border-2)` border, subtle cyan glow
- Corner bracket decoration on card (same as game cards)
- Header inside card: `> PROFILE_SETUP_` in small cyan monospace above the main title

### Form fields
- Labels: all-caps monospace, small, muted — `FIRST NAME`, `LAST NAME`, `AGE`, `NICKNAME`, `SCHOOL & YEAR`
- Inputs: dark background `--surface-2`, `1px solid var(--border)`, monospace font, 
  cyan focus ring (`outline: 1px solid var(--cyan)`, `box-shadow: 0 0 8px rgba(0,225,255,0.2)`)
- No rounded pill inputs — use `border-radius: 4px` (terminal feel, not soft/bubbly)
- Nickname field: inline status indicator — `✓ AVAILABLE` in green / `✗ TAKEN` in red / `...` while checking
- School dropdown: same styling as inputs, custom arrow in cyan

### CTA button
- Full width, gradient `var(--grad)`, monospace uppercase `[ SAVE AND START PLAYING → ]`
- On hover: opacity 0.9, subtle glow

### Edit mode (returning user)
- Header changes to `> EDIT_PROFILE_`
- School code field: if locked for the year, show `[LOCKED UNTIL 2027]` label, field disabled + dim
- Back link: `← BACK TO HUB` in small muted monospace at bottom of card

---

## Auth modal — full redesign

**Reference: Anthropic auth — dark card, brand-consistent, extremely minimal.**

- Overlay: `rgba(0,0,0,0.7)` backdrop blur
- Card: max-width 400px, centered, `--surface` bg, `var(--border-2)` border, cyan corner glow
- Header: `> AUTH_` small cyan label, then `LOG IN` or `CREATE ACCOUNT` as main title in Barlow Condensed
- Tab switcher: `[LOG IN]` / `[REGISTER]` — minimal underline tabs, no pill buttons
- Fields: same style as profile form (dark, monospace, 4px radius, cyan focus)
- Labels: `EMAIL_ADDRESS`, `PASSWORD`, `CONFIRM PASSWORD` — all-caps monospace
- Error slot: `✗ ERROR MESSAGE` in red monospace, appears below the field that failed
- CTA: `[ LOG IN → ]` or `[ CREATE ACCOUNT → ]` — full width gradient button
- Forgot password: `FORGOT PASSWORD?` — small, muted, monospace link below password field
- Post-register "check inbox" state: replace form with:
  ```
  ✉ CHECK YOUR INBOX
  We sent a verification link to
  your@email.com
  
  [ RESEND IN 60s ]
  ```
  All monospace. Countdown timer on the resend button.
- Close button: `✕` top-right corner, muted

---

## Light mode

Apply `html.light` class for light theme. Light mode for a terminal aesthetic:
- Background: `#f0f4f8` (slightly blue-tinted white, not pure white)
- Surface: `#ffffff`
- Text: `#0a0c10`
- Borders: `rgba(0,97,255,0.15)`
- Glow effects: reduced opacity (scanlines hidden in light mode)
- Cyan accents stay the same — they work on both backgrounds

---

## Rules

- Do NOT modify `auth.js` or `leaderboard.js` — only CSS and HTML structure
- All existing JS `import` statements and function calls in index.html and profile.html 
  must be preserved exactly
- All existing section IDs and class names used by JS must be preserved 
  (add new classes freely, don't remove existing ones the JS references)
- Commit with git-commit skill when done: one commit for games.css, 
  one for index.html, one for profile.html
# GIT Games — Shared Patterns
**Applies to:** All games in `games/`  
**Read this before reading any individual game PRD.**

---

## 1. Target session length

Every game must be completable or meaningfully playable in **5–15 minutes**. A student who finishes a class activity early should be able to play one full session before the next activity starts. Design difficulty curves, round lengths, and progression accordingly.

---

## 2. File structure convention

Every game lives in its own folder under `games/`:

```
games/
  {game-slug}/
    index.html      ← game shell (auth-gated)
    game.js         ← all game logic
    {game-slug}.css ← game-specific styles (imports games.css)
```

`index.html` always follows this boot sequence:

```html
<head>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <link rel="stylesheet" href="../shared/games.css">
  <link rel="stylesheet" href="./{game-slug}.css">
</head>
<body>
  <!-- game markup -->

  <!-- game.js loads FIRST as a regular script so initGame() is defined
       before the module block below calls it. game.js must attach
       initGame to window: window.initGame = function(profile) { ... } -->
  <script src="./game.js"></script>

  <!-- module block runs AFTER game.js — safe to call initGame() -->
  <script type="module">
    import { requireAuth } from '../shared/auth.js'
    const profile = await requireAuth()   // redirects if not authed
    window.initGame(profile)              // defined by game.js above
  </script>
</body>
```

**Rule for every `game.js`:** export the entry point as `window.initGame = function(profile) { ... }` at the bottom of the file. Never use ES module `export` in `game.js` — it is loaded as a classic script to avoid the ordering problem.

> **Local testing:** games require a local HTTP server — they cannot run from `file://` because Supabase network calls require an HTTP origin. Use `npx serve .` from the repo root and open `http://localhost:3000/games/`. This is intentional and documented — the `file://` rule in `CLAUDE.md` applies to lesson content only, not to auth-gated games.

---

## 3. Auth gate

Every game page calls `requireAuth()` before anything else. This is non-negotiable. If the student is not logged in or has no profile, they are redirected automatically. No game-level auth logic needed — `requireAuth()` handles all cases.

---

## 4. Score submission

All games submit scores via `submitScore()` from `games/shared/leaderboard.js`.

```js
import { submitScore } from '../shared/leaderboard.js'

// On game end (win or death):
await submitScore({
  gameId: 'game-slug',          // must match the game_id check constraint in DB
  score: Math.max(0, rawScore), // always clamp to 0
  metadata: { /* game-specific */ }
})
```

Score submission happens **once per game session**, on the final win/lose screen. Never submit mid-game. Never submit more than once per session.

---

## 5. Win/lose screen pattern

Every game ends with a full-screen overlay. Required elements:

```
[ GAME OVER ] or [ MISSION COMPLETE ]    ← Barlow Condensed, large

YOUR SCORE: 4200                          ← DM Mono, cyan, large
YOU RANKED #7 GLOBALLY                    ← DM Mono, muted (async, loads after submit)

── TOP 10: GAME_SLUG ──────────────────
#01  h4ck3r_pro    [M2]   9800
#02  ...

[ PLAY AGAIN ]    [ BACK TO HUB ]
```

- Show score immediately (local)
- Submit to Supabase, then render the top 10 async
- If Supabase unreachable: show "LEADERBOARD UNAVAILABLE" — score is lost, no retry
- "Play again" resets game state without page reload
- "Back to hub" navigates to `/games/index.html`

---

## 6. Difficulty curve

All games use a **three-phase difficulty curve** within a single session:

| Phase | Duration | Feel |
|---|---|---|
| Warm-up | First 20% of session | Slow, forgiving, student gets oriented |
| Mid-game | Middle 60% | Increasing speed/complexity, core tension |
| Endgame | Final 20% | Punishing — requires mastery to survive |

For timed games: speed/complexity scales continuously with time elapsed.  
For turn-based games: difficulty scales with round number.

---

## 7. Visual identity

All games use the GIT retro-terminal aesthetic defined in `games.css`:

- **Background:** `#0a0c10` (near-black)
- **Accent:** `#00E1FF` (cyan) → `#0061FF` (blue) gradient
- **Font:** `DM Mono` for all game UI text (scores, labels, instructions)
- **Display font:** `Barlow Condensed` 700/800 for large titles and game-over screens only
- **Borders:** faint cyan glow (`box-shadow: 0 0 12px rgba(0,225,255,0.15)`)
- **Panel style:** dark surface `#0f1117`, corner bracket decoration
- Scanline overlay on background (inherited from `games.css`)

Game-specific CSS files may extend this palette but must not override `--bg`, `--cyan`, `--blue`, `--grad`, or `--text`.

---

## 8. Scoring philosophy

- Scores are always **non-negative integers** — clamp with `Math.max(0, score)` before submit
- Higher is always better (leaderboard sorts descending)
- Score formulas must be **transparent to the player** — show the formula or a breakdown on the win screen
- Scores must be **reachable by a skilled student in 5–15 min** — calibrate so a top score requires genuine effort but is not impossible

---

## 9. Metadata schema

Each game defines its own `metadata` object. Required fields for all games:

```js
{
  duration_seconds: number,   // total session length
  rounds_played: number,      // for turn-based; 1 for runners
  difficulty_reached: string  // 'warm-up' | 'mid-game' | 'endgame'
}
```

Plus game-specific fields defined in each PRD.

---

## 10. Adding a new game to the hub

When a new game ships:
1. Add it to `games/index.html` game cards grid
2. Run the DB migration to extend the `game_id` check constraint (see IMPL-A doc)
3. Add the game's `game_id` slug to the leaderboard tab selector in `index.html`

---

## 11. Game registry

| game_id | Name | Status |
|---|---|---|
| `terminal-run` | Terminal Run | Priority 1 |
| `memory-leak` | Memory Leak | Priority 1 |
| `sort-the-array` | Sort the Array | Priority 2 |
| `logic-gates` | Logic Gates | Priority 2 |
| `css-duel` | CSS Duel | Priority 2 |
| `brute-force` | Brute Force | Priority 3 |
| `packet-panic` | Packet Panic | Priority 3 |
| `phishing-or-legit` | Phishing or Legit? | Priority 3 |
| `zero-day` | Zero Day | Priority 3 |
| `code-sprint` | Code Sprint | Priority 4 |
| `debug-race` | Debug Race | Priority 4 |
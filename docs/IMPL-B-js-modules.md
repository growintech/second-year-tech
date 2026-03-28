# Implementation Doc B — JS Modules + File Scaffold
**Project:** GIT Games + Auth + Leaderboard  
**Scope:** `auth.js` · `leaderboard.js` · `games.css` · `games/index.html` · `games/profile.html` · file structure scaffold  
**Prerequisites:** Doc A is complete. Supabase URL and anon key are in hand.  
**Stack:** Vanilla HTML/CSS/JS, no bundler, Supabase JS v2 via CDN.

---

## File structure to create

```
games/
  index.html            ← games hub (public; leaderboard visible to all)
  profile.html          ← profile setup + edit (requires active verified session)
  shared/
    auth.js             ← Supabase client + all auth and profile functions
    leaderboard.js      ← score submission + leaderboard queries
    games.css           ← auth modal, auth bar, leaderboard widget, profile form styles
  hacking-sim/
    index.html          ← game shell (stub for now — wired up in a later task)
  terminal-run/
    index.html          ← game shell (stub for now — wired up in a later task)
```

Create all files. Game stubs (`hacking-sim/index.html`, `terminal-run/index.html`) just need a boilerplate shell that imports `auth.js`, calls `requireAuth()`, and shows a placeholder "Game coming soon" message.

---

## 1. `games/shared/auth.js`

This is the singleton Supabase client and the single source of truth for all auth and profile operations. Every page in `games/` imports from this file.

### Constants

```js
const SUPABASE_URL      = 'https://xxxxxxxxxxxx.supabase.co'   // replace with real value
const SUPABASE_ANON_KEY = 'eyJ...'                              // replace with real value

const SCHOOLS = [
  { code: 'M1', label: 'Monti — 1° anno' },
  { code: 'M2', label: 'Monti — 2° anno' },
  { code: 'M3', label: 'Monti — 3° anno' },
  { code: 'S1', label: 'Sommeiller — 1° anno' },
  { code: 'S2', label: 'Sommeiller — 2° anno' },
  { code: 'S3', label: 'Sommeiller — 3° anno' },
]
```

### Client

```js
// Import via CDN in every HTML file that uses auth.js:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// <script type="module" src="../../shared/auth.js"></script>

const { createClient } = supabase
export const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

### Functions to implement

```js
// Returns the active session or null
export async function getSession()
// → await db.auth.getSession() → return session or null

// Returns the current user's own profile row or null
// Selects only the fields the app needs — never logs PII unnecessarily
export async function getProfile()
// → getSession() → if no session return null
// → db.from('profiles')
//     .select('id, nickname, school_code, school_code_updated_at, first_name, last_name, age')
//     .eq('id', session.user.id)
//     .single()

// Returns true if the nickname is not taken by another user.
// Uses .eq() on the citext column — citext handles case-insensitivity at the DB level.
// Do NOT use .ilike() here: the _ and - characters allowed in nicknames are
// SQL LIKE wildcards and would produce incorrect matches with ilike.
// Pass currentUserId to exclude the current user's own row from the check (for edits).
export async function isNicknameAvailable(nickname, currentUserId = null)
// → db.from('profiles').select('id').eq('nickname', nickname)
// → if result has rows and result[0].id !== currentUserId → return false
// → otherwise return true

// Creates the profile row on first login (called from profile.html)
export async function saveProfile({ firstName, lastName, age, nickname, schoolCode })
// → getSession() → throw if no session
// → db.from('profiles').insert({
//     id: session.user.id,
//     first_name: firstName, last_name: lastName, age,
//     nickname, school_code: schoolCode
//   })

// Updates editable profile fields (called from profile.html in edit mode)
// School code change limit is enforced by a DB trigger — no client-side check needed.
// If the trigger rejects the change, the error is caught and shown to the user.
export async function updateProfile({ firstName, lastName, age, nickname, schoolCode })
// → getSession() → throw if no session
// → db.from('profiles').update({
//     first_name: firstName, last_name: lastName, age,
//     nickname, school_code: schoolCode
//   }).eq('id', session.user.id)
// → catch trigger exception → surface message: 'School code can only be changed once per year'

// Registers a new user (email + password)
// Does NOT create a profile row — that happens in profile.html after email verification
export async function register({ email, password })
// → db.auth.signUp({ email, password })

// Logs in an existing user
export async function login({ email, password })
// → db.auth.signInWithPassword({ email, password })

// Logs out and redirects to games hub
// Uses an absolute path from the domain root to work correctly from any nesting depth
export async function logout()
// → db.auth.signOut() → window.location.href = '/games/index.html'

// Sends a password reset email
export async function resetPassword(email)
// → db.auth.resetPasswordForEmail(email)

// Auth gate — call at the top of every game page (hacking-sim, terminal-run, etc.)
// All redirects use absolute paths from the domain root — safe from any folder depth.
//
// GAME CONTEXT PRESERVATION:
// Before redirecting away, save the intended destination in sessionStorage so the
// student lands back on the game they wanted after login + profile setup:
//   sessionStorage.setItem('git_redirect_after_auth', window.location.pathname)
//
// After profile setup completes (profile.html), read and clear this key:
//   const dest = sessionStorage.getItem('git_redirect_after_auth')
//   sessionStorage.removeItem('git_redirect_after_auth')
//   window.location.href = dest || '/games/index.html'
//
// Redirect logic:
//   no session            → save current path to sessionStorage → /games/index.html?login=1
//   session, unverified   → /games/index.html?verify=1
//   session, no profile   → /games/profile.html  (context preserved in sessionStorage)
//   session + profile     → return profile (game can start)
export async function requireAuth()

// Exported constant for use in dropdowns
export { SCHOOLS }
```

---

## 2. `games/shared/leaderboard.js`

All score operations. Imports `db` from `auth.js`.

```js
import { db, getSession } from './auth.js'

// Submits a score for the current user
// Throws if no active session
// SCORE CLAMPING: always clamp the score to 0 before submitting —
//   score = Math.max(0, rawScore)
// The DB has a check (score >= 0) constraint. The Hacking Sim formula can produce
// negative values (slow time, no hints skipped) — clamping client-side prevents
// a DB rejection and ensures 0 is the floor on the leaderboard.
export async function submitScore({ gameId, score, metadata = {} })
// → score = Math.max(0, score)
// → getSession() → throw if null
// → db.from('scores').insert({ user_id: session.user.id, game_id: gameId, score, metadata })

// Returns top N scores for a game, joined with nickname + school_code from profiles_public view
// profiles_public is the safe view — it never exposes first_name, last_name, or age
// Shape: [{ rank, nickname, school_code, score, created_at }]
// Tie policy: standard competition ranking (1, 1, 3) — two players with the same score
//   share a rank, and the next rank is skipped. Render as "Tied #N" in the UI.
export async function getLeaderboard({ gameId, limit = 10 })
// → db.from('scores')
//     .select('score, created_at, profiles_public(nickname, school_code)')
//     .eq('game_id', gameId)
//     .order('score', { ascending: false })
//     .limit(limit)
// → add rank field client-side using standard competition ranking:
//   let rank = 1
//   rows.forEach((row, i) => {
//     if (i > 0 && row.score < rows[i-1].score) rank = i + 1
//     row.rank = rank
//   })

// Returns the current user's personal best for a game, or null
export async function getPersonalBest({ gameId })
// → getSession() → return null if no session
// → db.from('scores')
//     .select('score')
//     .eq('user_id', session.user.id)
//     .eq('game_id', gameId)
//     .order('score', { ascending: false })
//     .limit(1)
//     .maybeSingle()   // use maybeSingle() not single() — returns null instead of error if no rows

// Returns school standings: sum of each student's personal best per school_code
// Formula: SUM of personal bests (not sum of all scores — prevents inflation from replays)
// Optionally filtered by gameId (null = all games combined)
// Shape: [{ school_code, total_score, player_count }] sorted by total_score desc
// Joins via profiles_public view — no PII involved
export async function getSchoolStandings({ gameId = null })
// Step 1 — fetch all scores (filtered by game if specified)
// → let query = db.from('scores').select('score, user_id, game_id, profiles_public(school_code)')
// → if gameId: query = query.eq('game_id', gameId)
//
// Step 2 — compute personal best per user per game client-side
// → const personalBests = {}
//   rows.forEach(row => {
//     const key = `${row.user_id}:${row.game_id}`
//     if (!personalBests[key] || row.score > personalBests[key].score) {
//       personalBests[key] = { score: row.score, school_code: row.profiles_public.school_code }
//     }
//   })
//
// Step 3 — aggregate personal bests by school
// → const standings = {}
//   Object.values(personalBests).forEach(({ score, school_code }) => {
//     if (!standings[school_code]) standings[school_code] = { school_code, total_score: 0, player_count: 0 }
//     standings[school_code].total_score  += score
//     standings[school_code].player_count += 1
//   })
//   return Object.values(standings).sort((a, b) => b.total_score - a.total_score)

// Returns the global rank of a score for a given game
// Uses standard competition ranking: rank = (number of scores strictly greater) + 1
// Ties share a rank. Example: if 3 players scored higher, this score is rank 4.
export async function getScoreRank({ gameId, score })
// → db.from('scores')
//     .select('id', { count: 'exact', head: true })
//     .eq('game_id', gameId)
//     .gt('score', score)
//     → rank = count + 1
```

> **`game_id` check constraint note:** The `scores` table has a `check` constraint listing valid game slugs. This is intentional — it prevents orphaned scores for games that don't exist. When a new game ships, run a migration to add its slug to the constraint: `alter table public.scores drop constraint scores_game_id_check; alter table public.scores add constraint scores_game_id_check check (game_id in ('hacking-sim', 'terminal-run', 'new-game-slug'));` This is a one-liner and is preferable to a loose `text` column at this scale.

---

## 3. `games/shared/games.css`

Write all styles in this file. Import it in `index.html` and `profile.html` via:
```html
<link rel="stylesheet" href="./shared/games.css">
```
And in game pages:
```html
<link rel="stylesheet" href="../shared/games.css">
```

### Sections to style

**Auth modal** (`.auth-modal`, `.auth-overlay`)
- Centered card, dark surface, backdrop blur overlay
- Two tabs: "Log in" / "Register" with active underline indicator
- Input fields, error message slot (`.auth-error`), CTA button
- "Check your inbox" state (hidden by default, shown after registration)
- "Forgot password?" link below the login form

**Auth bar** (`.auth-bar`)
- Sticky top bar shown on `index.html` and `profile.html`
- Logged-in state: avatar circle (first initial of nickname) + `nickname · school_code` badge + logout button
- Logged-out state: single "Log in to play" button that triggers the modal

**Leaderboard widget** (`.leaderboard-widget`)
- Used both in the post-game overlay and on `index.html`
- Ranked list: `#N · nickname · school · score`
- Top 3 rows highlighted (gold / silver / bronze accent)
- "Your rank" row highlighted in brand gradient if player is in the top 10; shown separately below if not

**School standings** (`.school-standings`)
- Simple card grid, one per school code
- Shows: school badge · total score · player count
- Sorted by total score desc

**Profile form** (`.profile-form`)
- Used on `profile.html` for both first-time setup and edit mode
- Field groups: personal info section (first name, last name, age) + game identity section (nickname + live check indicator + school dropdown)
- Nickname field shows inline ✓ / ✗ / ⏳ states
- School code field: `<select>` populated from `SCHOOLS` constant
- School code field is disabled (with tooltip "Editable once per school year") if `school_code_updated_at` is within the current calendar year

**Game cards** (`.game-card`)
- Used in the hub grid
- Shows: game icon · name · description · personal best (hidden if logged out) · top score · Play button
- Play button is disabled with tooltip "Log in to play" if no session

**Visual identity:** match the GIT dark aesthetic from the existing lesson pages — CSS variables `--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-muted`, brand gradient `#00E1FF → #0061FF`. Import DM Sans and DM Mono from Google Fonts. Do not duplicate variable definitions — reference the same token names used in `shared/style-intro.css`.

---

## 4. `games/index.html` — Games hub

### Page structure

```
<head>
  Google Fonts (DM Sans, DM Mono)
  <link> games.css
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
  <!-- Auth bar (top, sticky) -->
  <div class="auth-bar">...</div>

  <!-- Auth modal (hidden by default) -->
  <div class="auth-overlay">
    <div class="auth-modal">
      <!-- tabs: Log in / Register -->
      <!-- "Check your inbox" state -->
    </div>
  </div>

  <!-- Hero -->
  <header class="hero">
    <h1>GIT Games</h1>
    <p>Play hard. Debug harder.</p>
  </header>

  <!-- Game cards grid -->
  <section class="game-cards">
    <!-- one .game-card per game -->
  </section>

  <!-- Global leaderboard (filterable by game) -->
  <section class="leaderboard-section">
    <!-- tab selector: All · Hacking Sim · Terminal Run -->
    <div class="leaderboard-widget">...</div>
  </section>

  <!-- School standings -->
  <section class="school-standings">...</section>

  <script type="module">
    import { getSession, getProfile, login, register, logout, resetPassword } from './shared/auth.js'
    import { getLeaderboard, getPersonalBest, getSchoolStandings } from './shared/leaderboard.js'

    // On load:
    // 1. Check session → update auth bar
    // 2. If ?login=1 in query params → open auth modal on login tab
    // 3. If ?verify=1 → open auth modal on "Check your inbox" state
    // 4. Load leaderboard (top 20, all games) → render widget
    // 5. Load school standings → render standings
    // 6. If session: load personal bests for each game → update game cards
  </script>
</body>
```

---

## 5. `games/profile.html` — Profile setup + edit

### Page structure

```
<head>
  Google Fonts
  <link> games.css
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
  <!-- Auth bar -->
  <div class="auth-bar">...</div>

  <!-- Page hero -->
  <header class="hero">
    <!-- First visit: "Set up your profile" -->
    <!-- Edit mode: "Edit your profile" -->
  </header>

  <!-- Profile form -->
  <form class="profile-form">
    <!-- Personal info -->
    <fieldset>
      <legend>Personal info</legend>
      <input name="first_name" type="text" required>
      <input name="last_name" type="text" required>
      <input name="age" type="number" min="13" max="25" required>
    </fieldset>

    <!-- Game identity -->
    <fieldset>
      <legend>Game identity</legend>
      <div class="nickname-field">
        <input name="nickname" type="text" pattern="[a-zA-Z0-9_\-]{3,20}" required>
        <span class="nickname-status"></span>  <!-- ✓ / ✗ / ⏳ -->
      </div>
      <select name="school_code" required>
        <!-- populated from SCHOOLS constant -->
      </select>
    </fieldset>

    <button type="submit">Save and start playing →</button>
  </form>

  <script type="module">
    import { getSession, getProfile, saveProfile, updateProfile,
             isNicknameAvailable, SCHOOLS } from './shared/auth.js'

    // On load:
    // 1. getSession() → redirect to index.html if no session
    // 2. getProfile() → if null: first-time setup mode; if exists: edit mode (pre-fill fields)
    // 3. Populate school_code <select> from SCHOOLS
    // 4. Nickname input: debounce 400ms → call isNicknameAvailable → update .nickname-status
    // 5. Submit: call saveProfile() or updateProfile() depending on mode
    //    → on success: redirect to index.html
    //    → on error: show inline error message
  </script>
</body>
```

---

## 6. Game stubs

Create these two files now so the hub can link to them. They will be replaced when the games are built.

### `games/hacking-sim/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hacking Sim — GIT Games</title>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <link rel="stylesheet" href="../shared/games.css">
</head>
<body>
  <p>Hacking Sim — coming soon.</p>
  <script type="module">
    import { requireAuth } from '../shared/auth.js'
    await requireAuth()
    // game bootstrap will go here
  </script>
</body>
</html>
```

### `games/terminal-run/index.html`

Same pattern as above, replace title and comment.

---

## 7. Implementation notes for Claude Code

- Use `type="module"` on all script tags that import from `auth.js` or `leaderboard.js`. ES module `import`/`export` works natively in all modern browsers without a bundler.
- The Supabase CDN script (`@supabase/supabase-js@2`) must load **before** any module that uses `supabase`. Load it as a regular (non-module) `<script>` tag in `<head>`.
- **Absolute redirect paths:** `requireAuth()` and `logout()` must use absolute paths (`/games/index.html`, `/games/profile.html`), never relative ones (`../games/index.html`). Relative paths break when called from different folder depths.
- **Nickname check uses `.eq()`, not `.ilike()`:** The `citext` column type handles case-insensitive equality natively. Using `.ilike()` would be wrong — `_` and `-` are SQL LIKE wildcard characters and would produce false matches for nicknames containing them.
- **All leaderboard joins use `profiles_public`**, not `profiles`. This is the structural PII guard — it is not optional. Never query `profiles` from `leaderboard.js`.
- **`getPersonalBest()` uses `.maybeSingle()`**, not `.single()`. A student with no scores returns `null`, not an error.
- **School code enforcement is DB-side only.** `updateProfile()` just sends the update and catches the trigger exception. No client-side calendar year check needed.
- **`getSchoolStandings()` groups client-side.** Fine at classroom scale. Do not add a Supabase RPC unless row count exceeds ~10,000.
- Do not use `localStorage` for auth state. Supabase manages session persistence internally — call `db.auth.getSession()` on every page load.
- **Local development:** static pages can be opened from `file://` for layout work. Auth flows (register, login, email redirect) require a local HTTP server. Use `npx serve` or VS Code Live Server, and add `http://localhost:PORT` to allowed redirect URLs in the Supabase dashboard.
- **Adding a new game:** extend the `game_id` check constraint in `scores` with a one-line migration (see leaderboard.js section), then add the game card to `index.html` and a new stub folder.
- **Post-game rank is approximate.** `getScoreRank()` counts rows at the moment of the query — concurrent submissions by other students may cause brief staleness. This is acceptable; document it as "rank at time of submission" in the UI copy.
- **All anonymous leaderboard queries must use `profiles_public`**, never the `profiles` base table. `getProfile()` (authenticated, owner only) may query `profiles` directly. This is the column-level privacy boundary enforced by convention in JS.
- **Nickname changes are retroactive on the leaderboard (intentional).** Because `getLeaderboard()` joins `scores` with `profiles_public` at query time, renaming a nickname immediately updates how all historical scores display. This is the desired behaviour — a student's current identity is always shown, not their identity at time of play.
- **School code disable UI:** in `profile.html` edit mode, after calling `getProfile()`, check if `school_code_updated_at` is within the current calendar year (`new Date(profile.school_code_updated_at).getFullYear() === new Date().getFullYear()`). If true: set the school_code `<select>` to `disabled` and show a tooltip "Editable once per school year — next change available in [year+1]".

---

## 8. Error handling reference

Supabase wraps Postgres errors in the response object. Catch by checking `error.code`. Use this pattern consistently across all functions in `auth.js` and `leaderboard.js`:

```js
const { data, error } = await db.from('profiles').insert({ ... })
if (error) {
  if (error.code === '23505') throw new Error('This nickname is already taken. Try another.')
  if (error.code === '23514') throw new Error('Check your age — must be between 13 and 25.')
  if (error.code === 'P0001') throw new Error('School code can only be changed once per year.')
  throw new Error('Something went wrong. Please try again.')
}
```

| Scenario | Postgres code | User-facing message |
|---|---|---|
| Nickname already taken (insert or update) | `23505` | "This nickname is already taken. Try another." |
| Age out of range (< 13 or > 25) | `23514` | "Age must be between 13 and 25." |
| Invalid `game_id` on score insert | `23514` | Silent — log to console, should never reach users |
| School code changed twice in one year | `P0001` (trigger raise) | "School code can only be changed once per year." |
| Network failure on any query | `error.message` contains `"fetch"` | "Connection error. Check your internet and try again." |

---

## 9. Score submission resilience (decided — single attempt)

`submitScore()` makes a single attempt with no retry logic. If Supabase is unreachable, the score is lost and the student plays again. No local caching, no retry queue.

Rationale: classroom tool on school WiFi, dozens of concurrent users at most. The complexity of a persistent retry queue is not justified. If this becomes a real problem post-launch, a localStorage-backed retry queue can be added without schema changes.

---

## 8. Commit guidance

Follow the git-commit skill. Suggested commit sequence after implementation:

```
feat(auth): add Supabase client, auth functions, and requireAuth guard

feat(auth): add profile setup and edit page (profile.html)

feat(games): add games hub with leaderboard and school standings (index.html)

feat(leaderboard): add score submission and leaderboard query module

feat(games): add hacking-sim and terminal-run stubs with auth gate

chore(games): add games.css with auth modal, leaderboard widget, and profile form styles
```
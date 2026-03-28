# PRD — GIT Games + Auth + Leaderboard
**Version:** 2.2  
**Status:** Draft  
**Scope:** Supabase auth · student profiles · global leaderboard · games hub  
**Out of scope:** Analytics, lesson progress tracking, IDE snippet saving, admin panel

---

## 1. Overview

Students on the GIT platform can play browser-based mini-games after finishing class activities. Games are **auth-gated** — a student must be logged in to play and submit scores. This is non-negotiable: it is the foundation for future behavioural analytics and progress tracking across the platform.

This PRD covers the minimum viable slice:

1. **Auth** — self-registration + login via email and password
2. **Profiles** — nickname + school class, set once on first login
3. **Leaderboard** — global score table, per-game rankings, school standings
4. **Games hub** — central page listing all games with live leaderboard data

---

## 2. Goals

| Goal | Why |
|------|-----|
| Gate all games behind auth | Enables identity-linked analytics later, non-negotiable |
| Zero-friction self-registration | Students sign up themselves, no instructor intervention |
| Global leaderboard with school context | Cross-school competition, no PII exposed |
| Forward-compatible schema | Auth migration path for analytics is additive, not destructive |

---

## 3. User stories

### Student
- As a student, I want to register with my email and a password so I can access games.
- As a student, I want to provide my first name, last name, age, nickname, and school class at signup so my profile is complete.
- As a student, I want to be able to change my nickname at any time so I can update my public handle.
- As a student, I want to see where I rank globally and within my school after each game.
- As a student, I want my session to persist so I don't log in every time I open the platform.

### Instructor
- As an instructor, I want to see school standings on the public hub so I can use it as a class engagement moment.
- As an instructor, I want student identity to be nickname-based (not real names) so privacy is respected in a public leaderboard.

---

## 4. Auth model

**Provider:** Supabase Auth, email + password.  
**Self-registration:** open — any student can create an account.  
**Email verification:** enabled (Supabase default). Students must verify before playing.  
**Session persistence:** Supabase handles via localStorage token refresh automatically.  
**Password reset:** Supabase default magic-link flow via email.

### Auth states and routing

| State | What the student sees |
|---|---|
| Not logged in, lands on games hub | Hub visible in read-only mode (leaderboard visible, game cards show "Log in to play") |
| Not logged in, clicks Play | Auth modal opens (login / register tabs) |
| Registered, email not yet verified | Auth modal collapses to a single "Check your inbox" screen — no other action available. Resend link offered after 60s. |
| Logged in, email verified, no profile yet | Redirected to `profile.html` — cannot access any game until profile is saved |
| Logged in, profile complete | Full access to all games |

The leaderboard is **publicly readable** — no login required to browse scores. Login is required to play and submit.

---

## 5. Schema

### `profiles` — one row per user, created on first login

```sql
create extension if not exists citext;

create table profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  first_name              text not null,
  last_name               text not null,
  age                     integer not null check (age >= 13 and age <= 25),
  nickname                citext not null unique,     -- globally unique, case-insensitive; freely editable
  school_code             text not null,              -- 'M1' | 'M2' | ... | 'S3'
  school_code_updated_at  timestamptz,               -- null until first change; enforces once-per-year edit
  created_at              timestamptz default now()
);
```

```sql
-- Public read (leaderboard display)
create policy "profiles_read" on profiles
  for select using (true);

-- Insert own profile only
create policy "profiles_insert" on profiles
  for insert with check (auth.uid() = id);

-- Update own profile only
create policy "profiles_update" on profiles
  for update using (auth.uid() = id);
```

**Nickname uniqueness** is enforced at the DB level via `citext` type + `unique` constraint. `citext` is a PostgreSQL extension (available on Supabase by default) that makes all equality and uniqueness checks case-insensitive automatically — `Alex`, `alex`, and `ALEX` are treated as the same nickname. Nickname is **freely editable at any time** — uniqueness is re-checked on every update. Client checks availability before submit to give a friendly error message.

**Name and age** (`first_name`, `last_name`, `age`) are collected at profile setup and stored server-side. They are **not shown on the public leaderboard** — only the nickname and school code are public. Age is validated server-side with a `check` constraint (13–25).

**School codes — full list (6 classes at launch):**

| Code | School | Year |
|------|--------|------|
| `M1` | Monti | 1st |
| `M2` | Monti | 2nd |
| `M3` | Monti | 3rd |
| `S1` | Sommeiller | 1st |
| `S2` | Sommeiller | 2nd |
| `S3` | Sommeiller | 3rd |

New schools added by extending the `SCHOOLS` constant in `auth.js` — no schema change.

---

### `scores` — one row per game completion

```sql
create table scores (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  game_id       text not null,             -- 'hacking-sim' | 'terminal-run' | ...
  score         integer not null,
  metadata      jsonb                      -- game-specific extras
);
```

```sql
-- Public read
create policy "scores_read" on scores
  for select using (true);

-- Authenticated users insert own scores only
create policy "scores_insert" on scores
  for insert with check (auth.uid() = user_id);

-- No client-side updates or deletes
```

**Indexes:**
```sql
create index on scores (game_id, score desc);
create index on scores (user_id);
```

**Personal best** is computed at query time: `max(score) where user_id = X and game_id = Y`.  
**School standings** join `scores` with `profiles` on `user_id`, group by `school_code`.

---

## 6. Games in scope

### 6.1 Hacking Sim
**Location:** `games/hacking-sim/`  
**Score formula:** `base_score − (seconds_used × 10) + (hints_skipped × 200)`  
**Submission trigger:** Mission set completed (win screen)  
**Metadata:** `{ missions_completed, hints_used, time_seconds }`

### 6.2 Terminal Run
**Location:** `games/terminal-run/`  
**Score formula:** `distance_units` (increases with speed over time)  
**Submission trigger:** Player death (game over screen)  
**Metadata:** `{ distance, obstacles_dodged, power_ups_collected }`

### Future slots (no schema change required)
`flappy-packet` · `boolean-maze` · `code-sprint`

---

## 7. Frontend spec

### 7.1 Games hub — `games/index.html`

| Section | Details |
|---|---|
| **Hero** | Title + tagline ("Play hard. Debug harder.") |
| **Auth bar** | Logged in: avatar initial + nickname + school badge + logout. Logged out: "Log in to play" button |
| **Game cards grid** | Per game: name, description, your personal best (auth only), global top score, Play button (disabled + tooltip if logged out) |
| **Global leaderboard** | Top 20, filterable by game. Columns: Rank · Nickname · School · Score · Date |
| **School standings** | Aggregate score per school code. Public, always visible. |

### 7.2 In-game leaderboard widget

Shown on **win / game over screen only**, never during play.

- Player's score + global rank ("You ranked #7 globally")
- Top 10 for this game
- "Play again" + "Back to hub" CTAs

Loads asynchronously — if Supabase unreachable, shows score locally with a muted offline note. Never blocks game flow.

### 7.3 Auth modal

Triggered by "Log in to play" or any gated action. Two tabs: **Log in** / **Register**.

**Register tab fields:**
- Email (text input)
- Password (min 8 chars)
- CTA: "Create account →"
- Post-register: Supabase sends verification email → show "Check your inbox" state

**Log in tab fields:**
- Email + password
- "Forgot password?" → Supabase magic-link reset
- CTA: "Log in →"

### 7.4 Profile setup page — `games/profile.html`

Shown once, immediately after first login, before any game is accessible.

**Fields:**
- First name (text input, required)
- Last name (text input, required)
- Age (number input, 13–25, required)
- Nickname (3–20 chars, `[a-zA-Z0-9_-]` only)
  - Live availability check (debounced, queries `profiles` table)
  - Feedback: ✓ Available / ✗ Taken
- School class (`<select>` with all 6 codes)
- CTA: "Save and start playing →"
- Saves to `profiles`, then redirects to games hub

**Profile mutability rules (decided):**
- **First name, last name, age** — editable at any time from hub settings (private, not on leaderboard)
- **Nickname** — editable at any time, subject to global uniqueness check
- **School code** — editable once per school year via the hub settings, tracked via `school_code_updated_at`

---

## 8. Shared JS modules

### `games/shared/auth.js`
```js
// Supabase client (singleton)
export const supabase = createClient(URL, ANON_KEY)

// Get current session
export async function getSession()         // → session | null

// Get current user profile
export async function getProfile()         // → { first_name, last_name, age, nickname, school_code } | null

// Check nickname availability (exclude own current nickname on update)
export async function isNicknameAvailable(nickname, currentUserId)  // → boolean

// Save profile (first login)
export async function saveProfile({ firstName, lastName, age, nickname, schoolCode })

// Update profile fields (any time)
export async function updateProfile({ firstName, lastName, age, nickname, schoolCode })

// Auth actions
export async function register({ email, password })
export async function login({ email, password })
export async function logout()
export async function resetPassword(email)

// Auth gate — call at top of any game page
// Redirects to hub with ?login=1 if not authenticated
export async function requireAuth()
```

### `games/shared/leaderboard.js`
```js
// Submit a score (requires active session)
export async function submitScore({ gameId, score, metadata })

// Fetch top N for a game
export async function getLeaderboard({ gameId, limit = 10 })

// Fetch player personal best
export async function getPersonalBest({ gameId })

// Fetch school standings (all games or filtered)
export async function getSchoolStandings({ gameId = null })
```

---

## 9. File structure

```
games/
  index.html                  ← games hub (public, leaderboard visible to all)
  profile.html                ← profile setup (auth required)
  shared/
    auth.js                   ← Supabase client + auth functions
    leaderboard.js            ← score functions
    games.css                 ← modal, auth bar, leaderboard widget styles
  hacking-sim/
    index.html
    terminal.js
    missions.js
  terminal-run/
    index.html
    game-loop.js
    renderer.js
```

---

## 10. Supabase configuration

- **Anon key:** public, committed to repo — safe because RLS is enforced server-side
- **Email verification:** enabled via Supabase dashboard
- **Free tier note:** Supabase free tier pauses after 7 days of inactivity. Upgrade to Pro ($25/mo) before any real student cohort uses the platform

---

## 11. Privacy and nickname moderation

Students are minors. The leaderboard is public. These rules apply:

- **Public vs private data** — only `nickname` and `school_code` are shown on the leaderboard. `first_name`, `last_name`, and `age` are stored server-side but never exposed to any public query. RLS `select` policies on `profiles` must only return the public columns to anonymous callers (see implementation doc).
- **No real names on leaderboard** — the profile setup UI explicitly labels the nickname field as "your public game handle" and discourages using real names. No technical enforcement, but framing is deliberate.
- **No moderation system** — there is no automated or real-time moderation at this phase. Offensive nicknames are handled manually: an instructor reports the nickname to Alberto, who deletes the profile row from the Supabase dashboard. The student can re-register with a new nickname.
- **Data minimisation** — data stored server-side: email (Supabase Auth), first name, last name, age, nickname, school code, scores, score metadata. No device fingerprinting, no IP logging beyond Supabase defaults.
- **Deletion** — a student's full data (profile + scores) can be deleted by removing the `auth.users` row in the Supabase dashboard. The `on delete cascade` constraint propagates automatically to `profiles` and `scores`.

---

## 12. Analytics forward-compatibility

This schema is the foundation for the analytics system (separate PRD). When that phase begins, no tables are dropped or recreated — only additions:

- `page_events` table: `user_id`, `page`, `event_type`, `timestamp`
- `code_snapshots` table: `user_id`, `lesson_id`, `code`, `timestamp`
- `scores.metadata` already stores game-specific data — no change needed

The `profiles` table + `auth.users` link is the identity spine that all future tables will reference.

---

## 12. Out of scope

- Analytics, heatmaps, time-on-page tracking (separate PRD)
- Lesson progress tracking (separate PRD)
- IDE snippet saving (separate PRD)
- Admin/instructor dashboard
- OAuth (Google, GitHub) — email/password only for now
- Score anti-cheat
- Mobile-native layout (desktop-first)

---

## 13. Open questions

| # | Question | Status |
|---|----------|--------|
| 1 | School codes | ✅ Closed — M1 M2 M3 S1 S2 S3 |
| 2 | Nickname uniqueness | ✅ Closed — DB-level unique constraint |
| 3 | School standings visibility | ✅ Closed — public |
| 4 | Auth model | ✅ Closed — self-register, email + password |
| 5 | Score anti-cheat | ✅ Closed — out of scope |
| 6 | Can a student change their school code / nickname after profile setup? | ✅ Closed — nickname freely editable; school code editable once per year; name/age editable any time |

---

## 14. Build order

| # | Task | Est. time |
|---|------|-----------|
| 1 | Supabase project: enable auth, create `profiles` + `scores` tables, RLS policies | 1.5h |
| 2 | `auth.js` module + `requireAuth()` guard | 2h |
| 3 | Auth modal (register + login tabs) | 2h |
| 4 | `profile.html` — profile setup page | 1.5h |
| 5 | `leaderboard.js` module | 1.5h |
| 6 | `games/index.html` hub (auth-aware, leaderboard, school standings) | 3h |
| 7 | Wire auth + leaderboard into Hacking Sim | 1h |
| 8 | Wire auth + leaderboard into Terminal Run | 1h |
| 9 | QA: register → verify → profile → play → submit → leaderboard | 1h |

**Total: ~15h** — two focused weekends.

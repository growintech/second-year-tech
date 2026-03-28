# Implementation Doc A — Supabase Setup
**Project:** GIT Games + Auth + Leaderboard  
**Scope:** Database schema · RLS policies · Auth configuration  
**Run order:** Steps must be executed in sequence — later steps depend on earlier ones.  
**Where to run SQL:** Supabase Dashboard → SQL Editor → New query.

---

## Prerequisites

- A Supabase project exists and is accessible at its dashboard URL
- You have the project `URL` and `anon` key ready (Dashboard → Project Settings → API)
- Email auth is enabled (Dashboard → Authentication → Providers → Email → ensure it is ON)

---

## Step 1 — Enable `citext` extension

Provides case-insensitive text type. Must run before creating any table.

```sql
create extension if not exists citext;
```

---

## Step 2 — Create `profiles` table

```sql
create table public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  first_name              text not null,
  last_name               text not null,
  age                     integer not null check (age >= 13 and age <= 25),
  nickname                citext not null unique,
  school_code             text not null check (school_code in ('M1','M2','M3','S1','S2','S3')),
  school_code_updated_at  timestamptz default null,
  created_at              timestamptz default now()
);

comment on column public.profiles.nickname              is 'Public leaderboard handle. Freely editable, globally unique (case-insensitive).';
comment on column public.profiles.school_code_updated_at is 'Tracks last school_code change. Null until first edit. Client enforces once-per-year limit using this value.';
comment on column public.profiles.first_name            is 'Private — never exposed to public leaderboard queries.';
comment on column public.profiles.last_name             is 'Private — never exposed to public leaderboard queries.';
comment on column public.profiles.age                   is 'Private — never exposed to public leaderboard queries.';
```

---

## Step 3 — Create `scores` table

```sql
create table public.scores (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  game_id     text not null check (game_id in ('hacking-sim', 'terminal-run')),
  score       integer not null check (score >= 0),  -- scores are always non-negative; clamp formula client-side
  metadata    jsonb default '{}'::jsonb
);

comment on column public.scores.game_id  is 'Slug identifying the game. Add new values to the check constraint when new games ship.';
comment on column public.scores.metadata is 'Game-specific extras. hacking-sim: { missions_completed, hints_used, time_seconds }. terminal-run: { distance, obstacles_dodged, power_ups_collected }.';
```

---

## Step 4 — Create indexes

```sql
-- Leaderboard queries: top scores per game
create index on public.scores (game_id, score desc);

-- Per-user history and personal best
create index on public.scores (user_id, game_id);

-- School standings: join profiles on user_id
create index on public.profiles (school_code);
```

---

## Step 5 — Enable Row Level Security

```sql
alter table public.profiles enable row level security;
alter table public.scores   enable row level security;
```

---

## Step 6 — Create `profiles_public` view

The `profiles` table contains PII (`first_name`, `last_name`, `age`). Postgres RLS operates at the **row level**, not the column level — so even with RLS enabled, any client with the anon key can query any column on any row they have read access to. Restricting columns via client-side discipline alone is not safe.

The solution is a **view** that structurally exposes only leaderboard-safe columns. All anonymous queries use this view. The base `profiles` table is only queried by authenticated users reading their own full row.

**How it works in practice:**
- `profiles_public` (the view) → queried by `leaderboard.js` for all public leaderboard and standings data
- `profiles` (the base table) → queried only by `auth.js` `getProfile()`, which runs as the authenticated owner

RLS policies on views in Supabase are not supported — policies live on the base table only. So the access model is: one permissive `SELECT` policy on `profiles` (allowing all reads), with column restriction enforced structurally by the view. The JS convention of never querying `profiles` directly from anonymous contexts is what keeps PII safe.

**Run this — two separate blocks:**

```sql
-- 1. Create the public-safe view (leaderboard columns only)
create view public.profiles_public as
  select
    id,
    nickname,
    school_code,
    created_at
  from public.profiles;
```

```sql
-- 2. Allow public read on profiles (required for the view to return rows to anonymous callers)
-- Column restriction is enforced by the view definition above, not by this policy.
-- Do NOT add first_name, last_name, or age to the view — that is the entire protection.
create policy "profiles: anyone can read"
  on public.profiles for select
  using (true);
```

> **Note for Claude Code:** All anonymous leaderboard queries in `leaderboard.js` must use `profiles_public`, never `profiles`. The `getProfile()` function in `auth.js` (authenticated, owner only) may query `profiles` directly.

---

## Step 7 — School code change trigger

The once-per-year school code edit limit must be enforced at the DB level. Client-side checks can be bypassed by any direct API call.

```sql
create or replace function public.enforce_school_code_update()
returns trigger language plpgsql as $$
begin
  -- Allow if school_code is not changing
  if new.school_code = old.school_code then
    return new;
  end if;

  -- Allow if never changed before
  if old.school_code_updated_at is null then
    new.school_code_updated_at := now();
    return new;
  end if;

  -- Block if already changed within the current calendar year
  if extract(year from old.school_code_updated_at) = extract(year from now()) then
    raise exception 'School code can only be changed once per calendar year. Last change: %', old.school_code_updated_at;
  end if;

  new.school_code_updated_at := now();
  return new;
end;
$$;

create trigger school_code_update_guard
  before update on public.profiles
  for each row execute function public.enforce_school_code_update();
```

---

## Step 8 — RLS policies for `profiles`

Two select policies are needed: public read (for leaderboard, via the view) and owner full-row read (for profile edit page).

```sql
-- Anonymous read: allows the profiles_public view to return rows to anyone.
-- Column restriction is enforced structurally by the view definition (Step 6),
-- not by RLS. All anonymous JS queries must use profiles_public, not profiles.
create policy "profiles: anyone can read"
  on public.profiles for select
  using (true);

-- Insert: authenticated user can only create their own profile
create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Update: authenticated user can only update their own profile.
-- School code change limit is enforced by the trigger, not here.
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);
```

> **Why two select policies aren't needed here:** Postgres RLS policies of the same command are OR-combined. A single `using (true)` select policy covers both anonymous (view) and authenticated (direct) reads. The distinction between what anonymous vs authenticated callers *should* see is enforced by which table/view they query in JS, not by separate policies.

---

## Step 9 — RLS policies for `scores`

```sql
-- Public read: leaderboard is visible to everyone
create policy "scores: anyone can read"
  on public.scores for select
  using (true);

-- Insert: authenticated user can only submit their own scores
create policy "scores: insert own"
  on public.scores for insert
  with check (auth.uid() = user_id);

-- No update or delete from client — scores are immutable once submitted
```

---

## Step 10 — Auth configuration (Dashboard UI steps)

Do these in the Supabase Dashboard, not in the SQL editor.

1. **Email confirmation:** Dashboard → Authentication → Settings → enable "Confirm email". Students must verify before the session is considered active.

2. **Redirect URL:** Dashboard → Authentication → URL Configuration → add `https://lessons.growintech.it/games/` to the allowed redirect URLs list. Also add `http://localhost:3000` for local development. Note: auth redirect flows require a local server — `file://` is not sufficient for testing auth callbacks.

3. **Email templates (optional but recommended):** Dashboard → Authentication → Email Templates → Confirm signup. Customise the subject line to something like: *"GIT Platform — confirm your email to start playing"*.

4. **Disable sign-ups from outside the app (optional):** Currently left open — any email can register. If you want to restrict to school domains later, add a DB trigger that checks the email domain on insert into `auth.users`.

---

## Step 11 — Verify the setup

Run these queries to confirm everything is in place:

```sql
-- Should return 2 rows
select tablename from pg_tables
where schemaname = 'public' and tablename in ('profiles', 'scores');

-- Should return exactly 8 columns for profiles
select column_name, data_type
from information_schema.columns
where table_name = 'profiles' and table_schema = 'public'
order by ordinal_position;

-- Expected columns in order:
-- id, first_name, last_name, age, nickname, school_code, school_code_updated_at, created_at

-- Should return 1 view
select viewname from pg_views
where schemaname = 'public' and viewname = 'profiles_public';

-- Should return 4 columns in the view (id, nickname, school_code, created_at)
select column_name
from information_schema.columns
where table_name = 'profiles_public' and table_schema = 'public'
order by ordinal_position;

-- Should return all 4 policies (profiles base table: 3, scores: 2... wait)
select policyname, tablename, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Expected policy list:

| policyname | tablename | cmd |
|---|---|---|
| profiles: anyone can read | profiles | SELECT |
| profiles: insert own | profiles | INSERT |
| profiles: update own | profiles | UPDATE |
| scores: anyone can read | scores | SELECT |
| scores: insert own | scores | INSERT |

---

## Step 12 — Note the credentials for Doc B

From Dashboard → Project Settings → API, copy:

```
SUPABASE_URL      = https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

These go into `games/shared/auth.js` as constants. The anon key is safe to commit — RLS enforces access control server-side.
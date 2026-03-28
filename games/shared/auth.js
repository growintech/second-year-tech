const SUPABASE_URL      = 'https://wkbnckjssidnzvvvzthf.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_ip8-A_LhROpjC0CrExYN0A_cgnfigyS'

export const SCHOOLS = [
  { code: 'M1', label: 'Monti — 1° anno' },
  { code: 'M2', label: 'Monti — 2° anno' },
  { code: 'M3', label: 'Monti — 3° anno' },
  { code: 'S1', label: 'Sommeiller — 1° anno' },
  { code: 'S2', label: 'Sommeiller — 2° anno' },
  { code: 'S3', label: 'Sommeiller — 3° anno' },
]

// Load Supabase CDN before any module script — in <head> of every HTML file:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// Import path depends on the file's location in the games/ folder:
//   games/index.html and games/profile.html  → "./shared/auth.js"
//   games/hacking-sim/index.html             → "../shared/auth.js"
//   games/terminal-run/index.html            → "../shared/auth.js"
// Never use ../../shared/auth.js — there is no auth.js outside the games/ folder.

const { createClient } = supabase
export const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Returns the active session or null
export async function getSession() {
  const { data: { session } } = await db.auth.getSession()
  return session
}

// Returns the current user's own profile row or null
// Selects only the fields the app needs — never logs PII unnecessarily
export async function getProfile() {
  const session = await getSession()
  if (!session) return null
  const { data, error } = await db
    .from('profiles')
    .select('id, nickname, school_code, school_code_updated_at, first_name, last_name, age')
    .eq('id', session.user.id)
    .single()
  if (error) return null
  return data
}

// Returns true if the nickname is not taken by another user.
// Uses .eq() on the citext column — citext handles case-insensitivity at the DB level.
// Do NOT use .ilike() here: the _ and - characters allowed in nicknames are
// SQL LIKE wildcards and would produce incorrect matches with ilike.
// Pass currentUserId to exclude the current user's own row from the check (for edits).
export async function isNicknameAvailable(nickname, currentUserId = null) {
  const { data, error } = await db
    .from('profiles')
    .select('id')
    .eq('nickname', nickname)
  if (error || !data || data.length === 0) return true
  if (currentUserId && data[0].id === currentUserId) return true
  return false
}

// Creates the profile row on first login (called from profile.html)
export async function saveProfile({ firstName, lastName, age, nickname, schoolCode }) {
  const session = await getSession()
  if (!session) throw new Error('No active session.')
  const { error } = await db.from('profiles').insert({
    id: session.user.id,
    first_name: firstName,
    last_name: lastName,
    age,
    nickname,
    school_code: schoolCode,
  })
  if (error) {
    if (error.code === '23505') throw new Error('This nickname is already taken. Try another.')
    if (error.code === '23514') throw new Error('Age must be between 13 and 25.')
    throw new Error('Something went wrong. Please try again.')
  }
}

// Updates editable profile fields (called from profile.html in edit mode)
// School code change limit is enforced by a DB trigger — no client-side check needed.
// If the trigger rejects the change, the error is caught and shown to the user.
export async function updateProfile({ firstName, lastName, age, nickname, schoolCode }) {
  const session = await getSession()
  if (!session) throw new Error('No active session.')
  const { error } = await db
    .from('profiles')
    .update({
      first_name: firstName,
      last_name: lastName,
      age,
      nickname,
      school_code: schoolCode,
    })
    .eq('id', session.user.id)
  if (error) {
    if (error.code === '23505') throw new Error('This nickname is already taken. Try another.')
    if (error.code === '23514') throw new Error('Age must be between 13 and 25.')
    if (error.code === 'P0001') throw new Error('School code can only be changed once per year.')
    throw new Error('Something went wrong. Please try again.')
  }
}

// Registers a new user (email + password)
// Does NOT create a profile row — that happens in profile.html after email verification
export async function register({ email, password }) {
  const { data, error } = await db.auth.signUp({ email, password })
  if (error) throw new Error(error.message)
  return data
}

// Logs in an existing user
export async function login({ email, password }) {
  const { data, error } = await db.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data
}

// Logs out and redirects to games hub
// Uses an absolute path from the domain root to work correctly from any nesting depth
export async function logout() {
  await db.auth.signOut()
  window.location.href = '/games/index.html'
}

// Sends a password reset email
export async function resetPassword(email) {
  const { error } = await db.auth.resetPasswordForEmail(email)
  if (error) throw new Error(error.message)
}

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
export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    sessionStorage.setItem('git_redirect_after_auth', window.location.pathname)
    window.location.href = '/games/index.html?login=1'
    return
  }

  if (!session.user.email_confirmed_at) {
    window.location.href = '/games/index.html?verify=1'
    return
  }

  const profile = await getProfile()
  if (!profile) {
    window.location.href = '/games/profile.html'
    return
  }

  return profile
}

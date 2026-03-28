import { db, getSession } from './auth.js'

// Submits a score for the current user
// Throws if no active session
// SCORE CLAMPING: always clamp the score to 0 before submitting —
//   score = Math.max(0, rawScore)
// The DB has a check (score >= 0) constraint. The Hacking Sim formula can produce
// negative values (slow time, no hints skipped) — clamping client-side prevents
// a DB rejection and ensures 0 is the floor on the leaderboard.
export async function submitScore({ gameId, score, metadata = {} }) {
  score = Math.max(0, score)
  const session = await getSession()
  if (!session) throw new Error('No active session.')
  const { error } = await db
    .from('scores')
    .insert({ user_id: session.user.id, game_id: gameId, score, metadata })
  if (error) {
    if (error.code === '23514') console.error('Invalid game_id or constraint violation:', gameId)
    throw new Error('Something went wrong. Please try again.')
  }
}

// Returns top N scores for a game, joined with nickname + school_code from profiles_public view
// profiles_public is the safe view — it never exposes first_name, last_name, or age
// Shape: [{ rank, nickname, school_code, score, created_at }]
// Tie policy: standard competition ranking (1, 1, 3) — two players with the same score
//   share a rank, and the next rank is skipped. Render as "Tied #N" in the UI.
export async function getLeaderboard({ gameId, limit = 10 }) {
  const { data, error } = await db
    .from('scores')
    .select('score, created_at, profiles_public(nickname, school_code)')
    .eq('game_id', gameId)
    .order('score', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)

  let rank = 1
  const rows = data || []
  rows.forEach((row, i) => {
    if (i > 0 && row.score < rows[i - 1].score) rank = i + 1
    row.rank = rank
  })
  return rows
}

// Returns the current user's personal best for a game, or null
export async function getPersonalBest({ gameId }) {
  const session = await getSession()
  if (!session) return null
  const { data, error } = await db
    .from('scores')
    .select('score')
    .eq('user_id', session.user.id)
    .eq('game_id', gameId)
    .order('score', { ascending: false })
    .limit(1)
    .maybeSingle()   // use maybeSingle() not single() — returns null instead of error if no rows
  if (error) return null
  return data
}

// Returns school standings: sum of each student's personal best per school_code
// Formula: SUM of personal bests (not sum of all scores — prevents inflation from replays)
// Optionally filtered by gameId (null = all games combined)
// Shape: [{ school_code, total_score, player_count }] sorted by total_score desc
// Joins via profiles_public view — no PII involved
export async function getSchoolStandings({ gameId = null }) {
  // Step 1 — fetch all scores (filtered by game if specified)
  let query = db
    .from('scores')
    .select('score, user_id, game_id, profiles_public(school_code)')
  if (gameId) query = query.eq('game_id', gameId)
  const { data, error } = await query
  if (error) throw new Error(error.message)

  // Step 2 — compute personal best per user per game client-side
  const personalBests = {}
  ;(data || []).forEach(row => {
    const key = `${row.user_id}:${row.game_id}`
    if (!personalBests[key] || row.score > personalBests[key].score) {
      personalBests[key] = { score: row.score, school_code: row.profiles_public?.school_code }
    }
  })

  // Step 3 — aggregate personal bests by school
  const standings = {}
  Object.values(personalBests).forEach(({ score, school_code }) => {
    if (!school_code) return
    if (!standings[school_code]) standings[school_code] = { school_code, total_score: 0, player_count: 0 }
    standings[school_code].total_score  += score
    standings[school_code].player_count += 1
  })
  return Object.values(standings).sort((a, b) => b.total_score - a.total_score)
}

// Returns the global rank of a score for a given game
// Uses standard competition ranking: rank = (number of scores strictly greater) + 1
// Ties share a rank. Example: if 3 players scored higher, this score is rank 4.
export async function getScoreRank({ gameId, score }) {
  const { count, error } = await db
    .from('scores')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', gameId)
    .gt('score', score)
  if (error) throw new Error(error.message)
  return (count ?? 0) + 1
}

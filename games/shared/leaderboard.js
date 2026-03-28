(function() {
  // We expect GIT_AUTH to be loaded first
  const getDb = () => window.GIT_AUTH?.db
  const getSession = () => window.GIT_AUTH?.getSession()

  // Submits a score for the current user
  async function submitScore({ gameId, score, metadata = {} }) {
    score = Math.max(0, score)
    const session = await getSession()
    if (!session) {
      console.warn('No active session. Score not submitted.')
      return
    }
    const db = getDb()
    if (!db) {
      console.warn('Supabase not available. Score not submitted.')
      return
    }
    const { error } = await db
      .from('scores')
      .insert({ user_id: session.user.id, game_id: gameId, score, metadata })
    if (error) {
      if (error.code === '23514') console.error('Invalid game_id or constraint violation:', gameId)
      throw new Error('Something went wrong. Please try again.')
    }
  }

  // Returns top N scores for a game
  async function getLeaderboard({ gameId, limit = 10 }) {
    const { data, error } = await getDb()
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

  // Returns the current user's personal best
  async function getPersonalBest({ gameId }) {
    const session = await getSession()
    if (!session) return null
    const { data, error } = await getDb()
      .from('scores')
      .select('score')
      .eq('user_id', session.user.id)
      .eq('game_id', gameId)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) return null
    return data
  }

  // Returns school standings
  async function getSchoolStandings({ gameId = null }) {
    let query = getDb()
      .from('scores')
      .select('score, user_id, game_id, profiles_public(school_code)')
    if (gameId) query = query.eq('game_id', gameId)
    const { data, error } = await query
    if (error) throw new Error(error.message)

    const personalBests = {}
    ;(data || []).forEach(row => {
      const key = `${row.user_id}:${row.game_id}`
      if (!personalBests[key] || row.score > personalBests[key].score) {
        personalBests[key] = { score: row.score, school_code: row.profiles_public?.school_code }
      }
    })

    const standings = {}
    Object.values(personalBests).forEach(({ score, school_code }) => {
      if (!school_code) return
      if (!standings[school_code]) standings[school_code] = { school_code, total_score: 0, player_count: 0 }
      standings[school_code].total_score  += score
      standings[school_code].player_count += 1
    })
    return Object.values(standings).sort((a, b) => b.total_score - a.total_score)
  }

  // Returns the global rank of a score
  async function getScoreRank({ gameId, score }) {
    const { count, error } = await getDb()
      .from('scores')
      .select('id', { count: 'exact', head: true })
      .eq('game_id', gameId)
      .gt('score', score)
    if (error) throw new Error(error.message)
    return (count ?? 0) + 1
  }

  // Expose to global scope
  window.GIT_LEADERBOARD = {
    submitScore,
    getLeaderboard,
    getPersonalBest,
    getSchoolStandings,
    getScoreRank
  }
})();

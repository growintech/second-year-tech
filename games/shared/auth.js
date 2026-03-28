(function() {
  const SUPABASE_URL      = 'https://wkbnckjssidnzvvvzthf.supabase.co'
  const SUPABASE_ANON_KEY = 'sb_publishable_ip8-A_LhROpjC0CrExYN0A_cgnfigyS'

  const SCHOOLS = [
    { code: 'M1', label: 'Monti — 1° anno' },
    { code: 'M2', label: 'Monti — 2° anno' },
    { code: 'M3', label: 'Monti — 3° anno' },
    { code: 'S1', label: 'Sommeiller — 1° anno' },
    { code: 'S2', label: 'Sommeiller — 2° anno' },
    { code: 'S3', label: 'Sommeiller — 3° anno' },
  ]

  // Load Supabase CDN before any script — in <head> of every HTML file:
  // <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

  const { createClient } = supabase
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Returns the active session or null
  async function getSession() {
    const { data: { session } } = await db.auth.getSession()
    return session
  }

  // Returns the current user's own profile row or null
  // Selects only the fields the app needs — never logs PII unnecessarily
  async function getProfile() {
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
  async function isNicknameAvailable(nickname, currentUserId = null) {
    const { data, error } = await db
      .from('profiles')
      .select('id')
      .eq('nickname', nickname)
    if (error || !data || data.length === 0) return true
    if (currentUserId && data[0].id === currentUserId) return true
    return false
  }

  // Creates the profile row on first login (called from profile.html)
  async function saveProfile({ firstName, lastName, age, nickname, schoolCode }) {
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
  async function updateProfile({ firstName, lastName, age, nickname, schoolCode }) {
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
  async function register({ email, password }) {
    const { data, error } = await db.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
    return data
  }

  // Logs in an existing user
  async function login({ email, password }) {
    const { data, error } = await db.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    return data
  }

  // Logs out and redirects to games hub
  async function logout() {
    await db.auth.signOut()
    window.location.href = '/games/index.html'
  }

  // Sends a password reset email
  async function resetPassword(email) {
    const { error } = await db.auth.resetPasswordForEmail(email)
    if (error) throw new Error(error.message)
  }

  // Auth gate — call at the top of every game page
  async function requireAuth() {
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

  // Expose to global scope
  window.GIT_AUTH = {
    SCHOOLS,
    db,
    getSession,
    getProfile,
    isNicknameAvailable,
    saveProfile,
    updateProfile,
    register,
    login,
    logout,
    resetPassword,
    requireAuth
  }
})();

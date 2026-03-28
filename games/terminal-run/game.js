/**
 * Terminal Run — game logic
 * Loaded as a classic script. Sets window.initGame(profile).
 * Uses window.GIT_AUTH and window.GIT_LEADERBOARD (loaded before this file).
 */

window.initGame = function initGame(profile) {
  'use strict'

  // ── DOM refs ────────────────────────────────────────────────────────────────
  const startScreen    = document.getElementById('start-screen')
  const gameContainer  = document.getElementById('game-container')
  const gameOverScreen = document.getElementById('game-over-screen')
  const gameWorld      = document.getElementById('game-world')
  const groundLineEl   = document.getElementById('ground-line')
  const entitiesEl     = document.getElementById('entities')
  const playerEl       = document.getElementById('player')
  const hudScore       = document.getElementById('score-display')
  const hudSpeed       = document.getElementById('speed-display')
  const hudShield      = document.getElementById('shield-display')
  const powerupBanner  = document.getElementById('powerup-banner')
  const finalScoreEl   = document.getElementById('final-score')
  const rankDisplay    = document.getElementById('rank-display')
  const topBoardRows   = document.getElementById('top-board-rows')
  const btnPlayAgain   = document.getElementById('btn-play-again')
  const codeBg         = document.getElementById('code-bg')
  const speedLines     = document.getElementById('speed-lines')

  // ── Constants ───────────────────────────────────────────────────────────────
  const GROUND_Y_RATIO   = 0.70   // ground at 70% of game world height from top
  const PLAYER_X_RATIO   = 0.15   // player at 15% of world width from left
  const JUMP_HEIGHT      = 140    // px — max height above ground at peak
  const JUMP_DURATION    = 800    // ms — full arc (400 up + 400 down)
  const BASE_SPEED       = 280    // px/s at 1× speed
  const SPEED_INTERVAL   = 30000  // ms between speed bumps
  const SPEED_STEP       = 0.15   // fractional increase per bump
  const MAX_SPEED        = 3.0    // speed cap
  const MIN_OBS_GAP      = 300    // px — min gap between trailing and leading edges
  const PU_INTERVAL_MIN  = 15000  // ms — min time between power-up spawns
  const PU_INTERVAL_MAX  = 25000  // ms — max time between power-up spawns
  const COLL_SHRINK      = 0.20   // collision box is 80% of visual on each axis
  const OBS_POOL         = 6      // obstacle pool size
  const PU_POOL          = 3      // power-up pool size
  const HUD_HEIGHT       = 40     // px — must match CSS #hud height
  const DUCK_HEIGHT_MULT = 0.50   // ducking player height = normal * this
  const PARTICLE_POOL    = 40     // particle pool size
  const TRAIL_POOL       = 8      // trail pool size
  const TRAIL_INTERVAL   = 40     // ms between trail ghost spawns

  // ── Obstacle definitions ────────────────────────────────────────────────────
  // heightType:
  //   'normal' — at ground, ~1 char tall → jump over
  //   'small'  — at ground, smaller → jump over (easier)
  //   'low'    — floats at head height → duck under
  //   'tall'   — wall, taller than jump arc → need power-up
  const OBS_DEFS = [
    { text: 'SyntaxError', heightType: 'normal', weight: 30, special: false },
    { text: 'undefined',   heightType: 'normal', weight: 30, special: false },
    { text: 'NaN',         heightType: 'small',  weight: 25, special: false },
    { text: '· ;',         heightType: 'low',    weight: 20, special: false },
    { text: '∞ LOOP',      heightType: 'tall',   weight: 10, special: true  },
  ]

  // ── Power-up definitions ────────────────────────────────────────────────────
  const PU_DEFS = [
    { text: 'debugger',        type: 'debugger', cls: 'powerup-cyan'   },
    { text: 'try{catch}',      type: 'shield',   cls: 'powerup-green'  },
    { text: 'console.clear()', type: 'clear',    cls: 'powerup-yellow' },
  ]

  // ── Layout (computed on start) ───────────────────────────────────────────────
  let worldW   = 0   // game world width in px
  let worldH   = 0   // game world height in px (below HUD)
  let groundY  = 0   // px from top of game world to ground line
  let playerX  = 0   // px — player left edge
  let playerW  = 0   // player element width
  let playerH  = 0   // player element height (normal stance)

  // ── Object pools ─────────────────────────────────────────────────────────────
  // Each slot: { el, active, x, elWidth, def, cTop, cBot }
  //   cTop/cBot = top/bottom of obstacle in game-world px (for collision)
  const obsPool = []
  const puPool  = []
  const particlePool = []
  const trailPool    = []

  // ── Game state ───────────────────────────────────────────────────────────────
  let phase          = 'start'   // 'start' | 'playing' | 'dead'
  let score          = 0
  let speedMult      = 1.0
  let rafId          = null
  let lastRafTime    = 0
  let gameStartTime  = 0         // RAF timestamp when game started
  let lastSpeedBump  = 0         // elapsed ms of last speed bump

  // Obstacle spawn tracking (elapsed ms)
  let lastObsSpawn   = -9999
  let lastPuSpawn    = -9999
  let nextPuIn       = randPuInterval()

  // Power-up state
  let puVisible      = false     // any power-up currently on screen
  let lastPuCollected = -99999   // elapsed ms when last PU was collected

  // Active effects
  let shieldActive   = false
  let debuggerArmed  = false

  // Stats
  let obstsDodged    = 0
  let pusCollected   = 0

  // Player motion state
  let isJumping      = false
  let jumpStart      = 0         // RAF timestamp when jump began
  let jumpOffset     = 0         // current px above ground (positive = up)
  let isDucking      = false
  let lastTrailSpawn = 0

  // ── Layout measurement ───────────────────────────────────────────────────────
  function measure() {
    worldW  = gameWorld.offsetWidth
    worldH  = gameWorld.offsetHeight
    groundY = worldH * GROUND_Y_RATIO

    // Position ground line
    groundLineEl.style.top = groundY + 'px'

    // Measure player element (must be visible to measure)
    playerEl.textContent = '_'
    playerEl.classList.remove('ducking', 'debugger-armed')
    playerEl.style.transform = ''

    playerW = playerEl.offsetWidth  || 20
    playerH = playerEl.offsetHeight || 32

    playerX = worldW * PLAYER_X_RATIO - playerW / 2
    playerEl.style.left = playerX + 'px'
    playerEl.style.top  = (groundY - playerH) + 'px'
  }

  // ── Pool creation ─────────────────────────────────────────────────────────────
  function buildPools() {
    for (let i = 0; i < OBS_POOL; i++) {
      const el = document.createElement('div')
      el.className = 'obstacle'
      el.style.display = 'none'
      entitiesEl.appendChild(el)
      obsPool.push({ el, active: false, x: 0, elWidth: 0, def: null, cTop: 0, cBot: 0 })
    }
    for (let i = 0; i < PU_POOL; i++) {
      const el = document.createElement('div')
      el.className = 'powerup'
      el.style.display = 'none'
      entitiesEl.appendChild(el)
      puPool.push({ el, active: false, x: 0, elWidth: 0, def: null, cTop: 0, cBot: 0 })
    }
    for (let i = 0; i < PARTICLE_POOL; i++) {
      const el = document.createElement('div')
      el.className = 'particle'
      el.style.display = 'none'
      entitiesEl.appendChild(el)
      particlePool.push({ el, active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0 })
    }
    for (let i = 0; i < TRAIL_POOL; i++) {
      const el = document.createElement('div')
      el.className = 'player-trail'
      el.style.display = 'none'
      entitiesEl.appendChild(el)
      trailPool.push({ el, active: false, life: 0 })
    }
  }

  function resetPools() {
    for (const o of obsPool) { o.active = false; o.el.style.display = 'none' }
    for (const p of puPool)  { p.active = false; p.el.style.display = 'none' }
    for (const p of particlePool) { p.active = false; p.el.style.display = 'none' }
    for (const t of trailPool)    { t.active = false; t.el.style.display = 'none' }
    puVisible = false
  }

  // ── Obstacle spawning ─────────────────────────────────────────────────────────
  function rightmostObstacleEdge() {
    let max = -1
    for (const o of obsPool) {
      if (o.active) max = Math.max(max, o.x + o.elWidth)
    }
    return max
  }

  function canSpawnInfLoop(elapsed) {
    return (elapsed - lastPuCollected < 20000) || puVisible
  }

  function spawnObstacle(elapsed) {
    const slot = obsPool.find(o => !o.active)
    if (!slot) return

    // Weighted random pick (filter out ∞ LOOP if not allowed)
    const pool = OBS_DEFS.filter(d => !d.special || canSpawnInfLoop(elapsed))
    const totalW = pool.reduce((s, d) => s + d.weight, 0)
    let r = Math.random() * totalW
    let def = pool[pool.length - 1]
    for (const d of pool) {
      r -= d.weight
      if (r <= 0) { def = d; break }
    }

    slot.def = def
    slot.el.textContent = def.text
    slot.el.className   = 'obstacle obstacle-' + def.heightType
    slot.el.style.display = ''
    slot.el.style.height  = ''    // clear any previous forced height

    // Width after text is set
    slot.elWidth = slot.el.offsetWidth || def.text.length * 11 + 8

    // X: far right, beyond any existing obstacle + min gap
    const edge = rightmostObstacleEdge()
    slot.x = Math.max(worldW + 20, edge < 0 ? worldW + 20 : edge + MIN_OBS_GAP)

    // Vertical bounds depend on heightType
    let cTop, cBot, elTop, elHeight
    switch (def.heightType) {
      case 'tall': {
        // Wall: from groundY down to above the jump peak (3× jump height above ground)
        const wallTop = groundY - JUMP_HEIGHT * 2.2
        cTop     = wallTop
        cBot     = groundY
        elTop    = wallTop
        elHeight = groundY - wallTop
        break
      }
      case 'low': {
        // Bar that floats at "head height" — player must duck.
        // Bottom of bar is just above the duck clearance, within standing height.
        // Standing player top = groundY - playerH
        // Ducking player top  = groundY - playerH * DUCK_HEIGHT_MULT
        // Place bar bottom at groundY - playerH * DUCK_HEIGHT_MULT - 2  (2px gap)
        // Bar height ≈ half the remaining standing height
        const barH   = Math.max(slot.el.offsetHeight || 14, 10)
        const barBot = groundY - playerH * DUCK_HEIGHT_MULT - 2
        const barTop = barBot - barH
        cTop     = barTop
        cBot     = barBot
        elTop    = barTop
        elHeight = barH
        break
      }
      case 'small': {
        const h  = Math.max(slot.el.offsetHeight || 22, 18)
        cTop     = groundY - h
        cBot     = groundY
        elTop    = cTop
        elHeight = h
        break
      }
      default: { // 'normal'
        const h  = Math.max(slot.el.offsetHeight || 32, 28)
        cTop     = groundY - h
        cBot     = groundY
        elTop    = cTop
        elHeight = h
        break
      }
    }

    slot.cTop = cTop
    slot.cBot = cBot
    slot.el.style.left   = slot.x + 'px'
    slot.el.style.top    = elTop + 'px'
    slot.el.style.height = elHeight + 'px'
    slot.active = true

    lastObsSpawn = elapsed
  }

  // ── Power-up spawning ─────────────────────────────────────────────────────────
  function spawnPowerup() {
    const slot = puPool.find(p => !p.active)
    if (!slot) return

    const def   = PU_DEFS[Math.floor(Math.random() * PU_DEFS.length)]
    slot.def    = def
    slot.el.textContent = def.text
    slot.el.className   = 'powerup ' + def.cls
    slot.el.style.display = ''

    slot.elWidth = slot.el.offsetWidth || def.text.length * 10 + 16

    slot.x = worldW + 60

    // Float at ~60% of jump height above ground — comfortably reachable
    const puH  = slot.el.offsetHeight || 24
    const puY  = groundY - JUMP_HEIGHT * 0.60 - puH / 2

    slot.el.style.left = slot.x + 'px'
    slot.el.style.top  = puY + 'px'
    slot.cTop = puY
    slot.cBot = puY + puH
    slot.active  = true
    puVisible    = true
  }

  // ── Player collision bounds ───────────────────────────────────────────────────
  function playerBounds() {
    const ph    = isDucking ? playerH * DUCK_HEIGHT_MULT : playerH
    const pBot  = groundY - jumpOffset
    const pTop  = pBot - ph
    const shrinkY = ph * COLL_SHRINK / 2
    const shrinkX = playerW * COLL_SHRINK / 2
    const cx = playerX + playerW / 2  // horizontal center
    return {
      left:   cx - playerW / 2 + shrinkX,
      right:  cx + playerW / 2 - shrinkX,
      top:    pTop  + shrinkY,
      bottom: pBot  - shrinkY,
    }
  }

  // ── Collision detection ───────────────────────────────────────────────────────
  function checkCollisions() {
    const pb = playerBounds()

    // Obstacles
    for (const o of obsPool) {
      if (!o.active) continue

      // Horizontal
      if (pb.right < o.x || pb.left > o.x + o.elWidth) continue

      // Vertical (with 80% shrink on obstacle too)
      const oH     = o.cBot - o.cTop
      const oShrY  = oH * COLL_SHRINK / 2
      if (pb.bottom < o.cTop + oShrY || pb.top > o.cBot - oShrY) continue

      // HIT — consume effect or die
      if (debuggerArmed) {
        deactivateObs(o)
        debuggerArmed = false
        playerEl.classList.remove('debugger-armed')
        showFlash('cyan')
        obstsDodged++
      } else if (shieldActive) {
        deactivateObs(o)
        shieldActive = false
        hudShield.hidden = true
        showFlash('green')
        obstsDodged++
      } else {
        spawnParticles(playerX + playerW / 2, pb.top + (pb.bottom - pb.top) / 2, 'var(--cyan)', 15)
        triggerShake()
        triggerGlitch()
        die()
        return
      }
    }

    // Power-ups
    for (const p of puPool) {
      if (!p.active) continue
      if (pb.right < p.x || pb.left > p.x + p.elWidth) continue
      const puH   = p.cBot - p.cTop
      const puShr = puH * COLL_SHRINK / 2
      if (pb.bottom < p.cTop + puShr || pb.top > p.cBot - puShr) continue
      collectPowerup(p)
    }
  }

  function deactivateObs(o) {
    o.active = false
    o.el.style.display = 'none'
  }

  function deactivatePu(p) {
    p.active  = false
    p.el.style.display = 'none'
    puVisible = puPool.some(pp => pp.active)
  }

  // ── Power-up collection ────────────────────────────────────────────────────────
  function collectPowerup(p) {
    const elapsed = performance.now() - gameStartTime
    lastPuCollected = elapsed
    pusCollected++
    deactivatePu(p)

    const puColor = p.def.cls.includes('cyan') ? 'var(--cyan)' : p.def.cls.includes('green') ? 'var(--green)' : 'var(--yellow)'
    spawnParticles(p.x + p.elWidth / 2, p.cTop + (p.cBot - p.cTop) / 2, puColor, 12)

    switch (p.def.type) {
      case 'debugger':
        debuggerArmed = true
        playerEl.classList.add('debugger-armed')
        showFlash('cyan')
        showBanner('debugger ARMED — next obstacle destroyed')
        break
      case 'shield':
        shieldActive = true
        hudShield.hidden = false
        showFlash('green')
        showBanner('try{catch} ACTIVE — one free collision')
        break
      case 'clear':
        for (const o of obsPool) { if (o.active) deactivateObs(o) }
        showFlash('yellow')
        showBanner('console.clear() — screen cleared')
        break
    }
  }

  // ── Effects ────────────────────────────────────────────────────────────────────
  function showFlash(color) {
    const div = document.createElement('div')
    div.className = 'screen-flash flash-' + color
    document.body.appendChild(div)
    setTimeout(() => div.remove(), 350)
  }

  function spawnParticles(x, y, color, count = 6) {
    const chars = ['0', '1', '*', '#', '+', ';', '{', '}']
    for (let i = 0; i < count; i++) {
      const p = particlePool.find(p => !p.active)
      if (!p) break
      p.active = true
      p.el.style.display = ''
      p.el.textContent = chars[Math.floor(Math.random() * chars.length)]
      p.el.style.color = color
      p.x = x
      p.y = y
      const angle = Math.random() * Math.PI * 2
      const speed = 50 + Math.random() * 150
      p.vx = Math.cos(angle) * speed
      p.vy = Math.sin(angle) * speed
      p.life = 0
      p.maxLife = 0.5 + Math.random() * 0.5
    }
  }

  function spawnTrail() {
    const t = trailPool.find(t => !t.active)
    if (!t) return
    t.active = true
    t.el.style.display = ''
    t.el.textContent = playerEl.textContent
    t.el.className   = playerEl.className + ' player-trail'
    t.el.style.left  = playerX + 'px'
    const ph = isDucking ? playerH * DUCK_HEIGHT_MULT : playerH
    t.el.style.top   = (groundY - ph - jumpOffset) + 'px'
    t.el.style.transform = playerEl.style.transform
    t.life = 0.4 // seconds
  }

  function triggerShake() {
    gameContainer.classList.remove('shake')
    void gameContainer.offsetWidth // trigger reflow
    gameContainer.classList.add('shake')
    setTimeout(() => gameContainer.classList.remove('shake'), 200)
  }

  function triggerGlitch() {
    const flash = document.createElement('div')
    flash.className = 'glitch-flash'
    document.body.appendChild(flash)
    setTimeout(() => flash.remove(), 200)
  }

  let bannerTimer = null
  function showBanner(text) {
    powerupBanner.textContent = text
    powerupBanner.classList.add('visible')
    clearTimeout(bannerTimer)
    bannerTimer = setTimeout(() => powerupBanner.classList.remove('visible'), 2000)
  }

  // ── Scrolling code background ─────────────────────────────────────────────────
  const CODE_SNIPPETS = [
    'const render = (t) => requestAnimationFrame(render)',
    'if (score > highScore) { highScore = score }',
    'function update(dt) { player.y += velocity * dt }',
    'try { parse(input) } catch (e) { console.error(e) }',
    'while (obstacles.length) { obstacles.pop().destroy() }',
    'export default class Game extends EventEmitter {}',
    'const { data, error } = await supabase.from("scores")',
    'let frame = 0; setInterval(() => frame++, 16)',
    'if (!session) return redirect("/login")',
    'obstacles.filter(o => o.x > -100)',
    'Math.max(0, score - penalty)',
    'const speed = BASE * Math.min(multiplier, 3.0)',
    'undefined is not a function at runtime:284',
    'SyntaxError: Unexpected token at line 1',
    'NaN === NaN // false, obviously',
    'for (let i = 0; i < Infinity; i++) { crash() }',
  ]

  function buildCodeBg() {
    const lineCount = Math.ceil(worldH / 24) + 2
    codeBg.innerHTML = ''
    const speeds = [60, 80, 45, 70, 55]  // px/s per row (variation)
    for (let i = 0; i < lineCount; i++) {
      const line = document.createElement('div')
      line.className = 'code-line'
      // Double the text so seamless loop works
      const snippet = CODE_SNIPPETS[i % CODE_SNIPPETS.length]
      const repeated = (snippet + '   ').repeat(6)
      line.textContent = repeated + repeated
      line.style.top = (i * 24) + 'px'
      const spd = speeds[i % speeds.length]
      const dur = (line.textContent.length * 9) / spd  // rough px-per-char width
      line.style.animationDuration = dur + 's'
      line.style.animationDelay = -(Math.random() * dur) + 's'
      codeBg.appendChild(line)
    }
  }

  // ── Main game loop ─────────────────────────────────────────────────────────────
  function gameLoop(ts) {
    if (phase !== 'playing') return

    const elapsed = ts - gameStartTime               // ms since game start
    const dt      = Math.min((ts - lastRafTime) / 1000, 0.05)  // seconds, capped
    lastRafTime   = ts

    // Speed bump every SPEED_INTERVAL ms
    if (elapsed >= lastSpeedBump + SPEED_INTERVAL) {
      lastSpeedBump += SPEED_INTERVAL
      speedMult = Math.min(speedMult + SPEED_STEP, MAX_SPEED)
      hudSpeed.textContent = 'SPEED: ' + speedMult.toFixed(1) + '×'
    }

    const speed = BASE_SPEED * speedMult  // px per second

    // Score: distance units = pixels traveled / 10
    score += speed * dt / 10
    hudScore.textContent = 'DIST: ' + String(Math.floor(score)).padStart(5, '0')

    // Update particles
    for (const p of particlePool) {
      if (!p.active) continue
      p.life += dt
      if (p.life >= p.maxLife) {
        p.active = false
        p.el.style.display = 'none'
      } else {
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vy += 400 * dt // gravity
        p.el.style.left = p.x + 'px'
        p.el.style.top  = p.y + 'px'
        p.el.style.opacity = 1 - (p.life / p.maxLife)
      }
    }

    // Update trails
    for (const t of trailPool) {
      if (!t.active) continue
      t.life -= dt
      if (t.life <= 0) {
        t.active = false
        t.el.style.display = 'none'
      } else {
        t.el.style.opacity = (t.life / 0.4) * 0.4
      }
    }

    // Spawn trail
    if (elapsed - lastTrailSpawn > TRAIL_INTERVAL) {
      spawnTrail()
      lastTrailSpawn = elapsed
    }

    // Background pulse
    const pulse = 0.04 + Math.sin(elapsed / 200) * 0.02
    codeBg.style.opacity = pulse

    // Speed lines opacity
    if (speedLines) {
      const speedAlpha = Math.max(0, (speedMult - 1.2) / 1.8) // starts at 1.2x
      speedLines.style.opacity = speedAlpha
      speedLines.style.animationDuration = (0.8 / speedMult) + 's'
    }

    // Move obstacles
    for (const o of obsPool) {
      if (!o.active) continue
      o.x -= speed * dt
      o.el.style.left = o.x + 'px'
      if (o.x + o.elWidth < -10) {
        obstsDodged++
        deactivateObs(o)
      }
    }

    // Move power-ups
    for (const p of puPool) {
      if (!p.active) continue
      p.x -= speed * dt
      p.el.style.left = p.x + 'px'
      if (p.x + p.elWidth < -10) deactivatePu(p)
    }

    // Jump arc: sin curve gives smooth ease-in-out
    if (isJumping) {
      const progress = (ts - jumpStart) / JUMP_DURATION
      if (progress >= 1) {
        isJumping  = false
        jumpOffset = 0
        playerEl.style.transform = ''
      } else {
        jumpOffset = JUMP_HEIGHT * Math.sin(Math.PI * progress)
        const rotation = progress * 360
        playerEl.style.transform = 'translateY(' + (-jumpOffset) + 'px) rotate(' + rotation + 'deg)'
      }
    }

    // Spawn obstacle
    // Interval shrinks with speed, but never below 700ms
    const spawnInterval = Math.max(2200 / speedMult, 700)
    const lastEdge = rightmostObstacleEdge()
    const gapOk = lastEdge < 0 || (worldW - lastEdge) >= MIN_OBS_GAP
    if (elapsed - lastObsSpawn >= spawnInterval && gapOk) {
      spawnObstacle(elapsed)
    }

    // Spawn power-up
    if (!puVisible && elapsed - lastPuSpawn >= nextPuIn) {
      spawnPowerup()
      lastPuSpawn = elapsed
      nextPuIn    = randPuInterval()
    }

    // Collision
    checkCollisions()

    if (phase === 'playing') rafId = requestAnimationFrame(gameLoop)
  }

  // ── Jump input ────────────────────────────────────────────────────────────────
  function doJump() {
    if (isJumping || phase !== 'playing') return
    isJumping  = true
    jumpStart  = lastRafTime
    isDucking  = false
    playerEl.textContent = '_'
    playerEl.classList.remove('ducking')

    spawnParticles(playerX + playerW / 2, groundY, 'var(--cyan)', 8)
    triggerShake()
  }

  function startDuck() {
    if (isJumping || phase !== 'playing') return
    isDucking = true
    playerEl.textContent = '·'
    playerEl.classList.add('ducking')
  }

  function stopDuck() {
    if (!isDucking) return
    isDucking = false
    playerEl.textContent = '_'
    playerEl.classList.remove('ducking')
  }

  // ── Input handlers ────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    if (phase === 'start') {
      startGame()
      return
    }
    if (phase === 'dead') {
      if (e.code === 'KeyR') restartGame()
      return
    }
    // Playing
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault()
      doJump()
    }
    if (e.code === 'ArrowDown') {
      e.preventDefault()
      startDuck()
    }
  }

  function onKeyUp(e) {
    if (e.code === 'ArrowDown') stopDuck()
  }

  function onTouch(e) {
    const t = e.changedTouches[0]
    const midY = window.innerHeight / 2
    if (phase === 'start') { startGame(); return }
    if (phase === 'playing') {
      if (t.clientY < midY) doJump()
      else startDuck()
    }
  }

  function onTouchEnd(e) {
    const t = e.changedTouches[0]
    const midY = window.innerHeight / 2
    if (t.clientY >= midY) stopDuck()
  }

  // ── Game state transitions ────────────────────────────────────────────────────
  function startGame() {
    phase      = 'playing'
    score      = 0
    speedMult  = 1.0
    obstsDodged   = 0
    pusCollected  = 0

    startScreen.hidden    = true
    gameOverScreen.hidden = true
    gameContainer.hidden  = false

    measure()
    buildCodeBg()
    resetPools()

    const now   = performance.now()
    gameStartTime = now
    lastRafTime   = now
    lastSpeedBump = 0
    lastObsSpawn  = -9999
    lastPuSpawn   = -9999
    nextPuIn      = randPuInterval()
    lastPuCollected = -99999
    puVisible     = false

    isJumping  = false
    isDucking  = false
    jumpOffset = 0
    playerEl.style.transform = ''
    playerEl.textContent     = '_'
    playerEl.className       = 'player'

    shieldActive  = false
    debuggerArmed = false
    hudShield.hidden = true

    hudScore.textContent = 'DIST: 00000'
    hudSpeed.textContent = 'SPEED: 1.0×'
    powerupBanner.classList.remove('visible')

    rafId = requestAnimationFrame(gameLoop)
  }

  function restartGame() {
    cancelAnimationFrame(rafId)
    startGame()
  }

  async function die() {
    if (phase === 'dead') return
    phase = 'dead'
    cancelAnimationFrame(rafId)

    showFlash('red')

    const finalScore  = Math.floor(score)
    const elapsed     = performance.now() - gameStartTime
    const durationSec = Math.floor(elapsed / 1000)

    let diffReached = 'warm-up'
    if (speedMult >= 2.5) diffReached = 'endgame'
    else if (speedMult >= 1.5) diffReached = 'mid-game'

    // Show game over screen
    finalScoreEl.textContent = String(finalScore).padStart(5, '0')
    rankDisplay.textContent  = 'SUBMITTING SCORE...'
    topBoardRows.innerHTML   = '<div class="loading-text">&gt; LOADING_</div>'

    gameContainer.hidden  = true
    gameOverScreen.hidden = false

    // Submit and show leaderboard
    try {
      const { submitScore, getLeaderboard, getScoreRank } = window.GIT_LEADERBOARD

      await submitScore({
        gameId: 'terminal-run',
        score:  finalScore,
        metadata: {
          duration_seconds:    durationSec,
          distance:            finalScore,
          obstacles_dodged:    obstsDodged,
          power_ups_collected: pusCollected,
          rounds_played:       1,
          difficulty_reached:  diffReached,
        },
      })

      const [globalRank, rows] = await Promise.all([
        getScoreRank({ gameId: 'terminal-run', score: finalScore }),
        getLeaderboard({ gameId: 'terminal-run', limit: 10 }),
      ])

      rankDisplay.textContent = 'YOU RANKED #' + globalRank + ' GLOBALLY'
      renderTopBoard(rows, finalScore)

    } catch {
      rankDisplay.textContent = 'SCORE SUBMITTED'
      topBoardRows.innerHTML  = '<div class="loading-text">LEADERBOARD UNAVAILABLE</div>'
    }
  }

  function renderTopBoard(rows, myScore) {
    if (!rows || !rows.length) {
      topBoardRows.innerHTML = '<div class="loading-text">NO SCORES YET</div>'
      return
    }
    const gold   = '#fbbf24'
    const silver = '#9ca3af'
    const bronze = '#b45309'
    const medals = [gold, silver, bronze]

    topBoardRows.innerHTML = rows.map((r, i) => {
      const nick   = esc(r.profiles_public?.nickname   || '---')
      const school = esc(r.profiles_public?.school_code || '??')
      const rankStr = '#' + String(r.rank).padStart(2, '0')
      const isMe    = r.score === myScore
      const color   = medals[i] || ''
      const style   = color ? `color:${color}` : (isMe ? 'color:var(--cyan)' : '')
      return '<div class="top-row" style="' + style + '">' +
        rankStr + '  ' +
        nick.padEnd(14, ' ') + '  ' +
        '[' + school + ']  ' +
        r.score.toLocaleString() +
        '</div>'
    }).join('')
  }

  // ── Utilities ─────────────────────────────────────────────────────────────────
  function randPuInterval() {
    return PU_INTERVAL_MIN + Math.random() * (PU_INTERVAL_MAX - PU_INTERVAL_MIN)
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  function init() {
    buildPools()

    window.addEventListener('keydown',   onKeyDown)
    window.addEventListener('keyup',     onKeyUp)
    window.addEventListener('touchstart', onTouch,   { passive: true })
    window.addEventListener('touchend',   onTouchEnd, { passive: true })

    btnPlayAgain.addEventListener('click', restartGame)

    window.addEventListener('resize', () => {
      if (phase === 'playing') {
        measure()
        groundLineEl.style.top = groundY + 'px'
        buildCodeBg()
      }
    })
  }

  init()
}

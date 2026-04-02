# PRD — Terminal Run
**game_id:** `terminal-run`  
**Priority:** 1  
**Type:** Endless runner  
**Session length:** 5–15 min

---

## Concept

You are a cursor `_` running through a scrolling terminal. The world is a horizontal stream of code — syntax errors, infinite loops, and undefined references block your path. Survive as long as possible. The terminal gets faster. It never stops.

Pure ASCII aesthetic. No sprites. No images. All text and CSS.

---

## Core loop

1. Game starts — cursor appears at left-center of screen, terminal begins scrolling right-to-left
2. Student presses **Space** or **↑** to jump
3. Obstacles scroll in from the right at increasing speed
4. Collision = game over → win/lose screen → score submitted

---

## Mechanics

### The runner
- Cursor character: `_` (blinking, `DM Mono`, large)
- Fixed horizontal position: 15% from left edge
- Vertical position: adjustable (jump only — no mid-air control)
- Jump: single jump only. Press Space/↑ to jump. Cannot double-jump.
- Jump arc: smooth CSS `transform: translateY()` with `ease-in-out`, 400ms up + 400ms down
- Ground line: a row of `────────────────` characters at 70% viewport height

### Obstacles
All obstacles are text rendered in `DM Mono`. They scroll left at game speed.

| Obstacle | Text | Height |
|---|---|---|
| Syntax error | `SyntaxError` | Ground level, jump over |
| Undefined | `undefined` | Ground level, jump over |
| Infinite loop | `∞ LOOP` | Tall — fills jump arc too. Cannot jump over — need power-up. **Spawn guard: `∞ LOOP` only spawns if a power-up was collected in the last 20 seconds OR a power-up is currently visible on screen. Never spawns otherwise — an unavoidable obstacle with no counterplay is not fair.** |
| NaN | `NaN` | Ground level, small, jump over |
| Missing semicolon | `· ;` | Low — duck under (hold ↓) |

Duck mechanic: hold **↓** to duck. Cursor shrinks to `·`. Releases on key up.

### Power-ups (scroll in like obstacles, collect by running into them)
| Power-up | Text | Effect |
|---|---|---|
| `debugger` | cyan flash | Destroys next obstacle automatically |
| `try{catch}` | green flash | One free collision — shield |
| `console.clear()` | screen flash | Clears all current obstacles on screen |

Power-ups appear every 15–25 seconds, random.

### Speed
- Start: slow (obstacles every 2.5s)
- Every 30 seconds: speed increases by 15%
- Cap: 3× start speed (reached at ~3 min)
- Score = distance units = function of speed × time survived

---

## Score formula

```
score = Math.floor(distance_units)
```

Where `distance_units` increments every frame at the current speed. No cap — score grows indefinitely with survival time.

**Metadata:**
```js
{
  duration_seconds,
  distance: score,
  obstacles_dodged: number,
  power_ups_collected: number,
  rounds_played: 1,
  difficulty_reached: string
}
```

---

## Visuals

- Background: `#0a0c10` with scanline overlay (from `games.css`)
- Scrolling "code" background: faint monospace text lines (`opacity: 0.04`) scrolling slowly — gives depth without distraction
- Ground: `────────────────` in `--border` color
- Score ticker: top-right, `DM Mono`, `DIST: 00000` incrementing live
- Speed indicator: top-left, `SPEED: 1.0×` updating as speed increases
- On game over: screen briefly flashes red, then win/lose overlay appears

---

## File structure

```
games/terminal-run/
  index.html
  game.js
  terminal-run.css
```

---

## Controls

| Key | Action |
|---|---|
| Space or ↑ | Jump |
| ↓ (hold) | Duck |
| Any key on start screen | Start |
| R on game over | Play again |

---

## Technical acceptance criteria

These are the minimum measurable bars for the implementation to be considered correct:

| Criterion | Target |
|---|---|
| Frame rate | Stable 60fps on a mid-range school laptop (requestAnimationFrame loop, no setTimeout fallback) |
| Input latency | Jump response within 1 frame (~16ms) of Space/↑ keydown — no debounce on jump input |
| Collision tolerance | Collision box is 80% of visual character size (forgiveness margin — pixel-perfect feels unfair at speed) |
| Obstacle spawn bounds | No obstacle spawns within 300px of the previous obstacle's trailing edge — prevents instant-death double-spawns |
| `∞ LOOP` spawn guard | Never spawns unless power-up collected in last 20s OR power-up visible on screen (see mechanics section) |
| Score consistency | Same survival time + speed must produce the same score ±1 across runs (deterministic formula) |
| Game over trigger | Collision detected → game over overlay appears within 100ms |
| Memory | No increasing memory usage over a 10-minute run — obstacle elements must be recycled, not created anew |
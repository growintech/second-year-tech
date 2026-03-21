# PRD — Bootstrap Interactive Lesson Guide
**Status: Implemented.** This document reflects the current built state as of March 2026.

---

## What was built

An interactive browser-based lesson guide (`lesson15/bootstrap-guide/`) that teaches students how to use Bootstrap by having them build a landing page for **Net@** — a high school web development program — step by step.

The lesson uses a **two-phase flow per step**: first an intro page (theory + live mini-IDE + quiz gate), then a full IDE page (VS Code-style editor + preview + validation). Students must pass the quiz before accessing the IDE for each step.

---

## File structure

```
lesson15/bootstrap-guide/
  index.html          ← hub page (lesson14-style activity grid, links to all 5 steps)
  style.css           ← shared CSS for hub + all intro pages (dark/light, components)
  app.js              ← shared JS: theme toggle, quiz engine, localStorage helpers
  logo.svg            ← GIT logo SVG (do NOT modify)

  01-intro.html       ← Step 1: Navbar theory + mini-IDE + quiz gate
  01-ide.html         ← Step 1: full VS Code-like IDE
  02-intro.html       ← Step 2: Hero theory + mini-IDE + quiz gate
  02-ide.html         ← Step 2: full IDE
  03-intro.html       ← Step 3: Grid theory + mini-IDE + quiz gate
  03-ide.html         ← Step 3: full IDE
  04-intro.html       ← Step 4: Buttons theory + mini-IDE + quiz gate
  04-ide.html         ← Step 4: full IDE
  05-intro.html       ← Step 5: Footer theory + mini-IDE + quiz gate
  05-ide.html         ← Step 5: full IDE
```

`index.html` at `lesson15/` folder level redirects to `./bootstrap-guide/`. This is required for GitHub Pages deployment.

---

## Tech stack

- **Vanilla HTML/CSS/JS** — no build tools, no npm, no frameworks on the app shell
- **CodeMirror 5** via CDN (`cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/`)
  - Modes: `htmlmixed`, `javascript`, `xml`, `css`
  - Addons: `show-hint`, `html-hint`, `javascript-hint`, `closetag`, `matchbrackets`, `active-line`
  - Theme: **custom VS Code dark/light** (inline CSS classes `.cm-s-vscode-dark` / `.cm-s-vscode-light`) — NOT the CDN dracula or default themes
- **Bootstrap 5.3** loaded only inside preview iframes via CDN (`cdn.jsdelivr.net/npm/bootstrap@5.3.0/`) — never on the app shell
- **Google Fonts**: `DM Sans` (body) + `DM Mono` (code), same import as `lesson14/`
- GIT logo SVG inlined directly in each HTML file

---

## Student flow (per step)

```
Hub (index.html)
  └─→ 0N-intro.html   Theory + mini-IDE + quiz
        ↓ (pass quiz)
      0N-ide.html     Full editor + validation
        ↓ (pass check)
      0{N+1}-intro.html  (or completion overlay on step 5)
```

### Intro pages (`0N-intro.html`)

Uses `style.css` + `app.js` from the same folder. Matches `lesson14/date-and-time/` visual identity exactly.

**Structure:**
1. Topbar (GIT logo 48px + "JS · Year 2 · Lesson 15" label + theme toggle)
2. Progress bar (5 dots)
3. `.page-wrap` (max-width 780px, centred)
   - Theory section: short paragraphs, concept explanation, key classes via **class-switcher** (tab-like, one class shown at a time), max 1–2 single-sentence callouts (info/tip/warn), reference code block
   - **Reference Snippet**: a `.snippet-block` div wrapping a `<textarea>` — initialized by `initSnippet()` as a read-only CodeMirror with VS Code theme. **Not** `.code-block`.
   - Mini-IDE section: small CodeMirror editor (8 lines) + preview iframe (200px) + ▶ Run button (no validation)
   - Quiz section: 2–3 multiple-choice questions. Check Answers → on pass, unlocks "Enter IDE →" link
4. Nav footer: ← Back | Enter IDE → (disabled until quiz passed)

**CodeMirror script loading order (all intro pages):**
```html
<script src="…/codemirror.min.js"></script>
<script src="…/mode/xml/xml.min.js"></script>
<script src="…/mode/javascript/javascript.min.js"></script>
<script src="…/mode/css/css.min.js"></script>
<script src="…/mode/htmlmixed/htmlmixed.min.js"></script>
```
`htmlmixed` requires `xml`, `javascript`, and `css` as dependencies. Loading `htmlmixed` alone causes CodeMirror to silently fail and render a plain textarea.

**Quiz gate:**
- On pass: `localStorage.setItem('quiz-passed-N', '1')` and enable the "Enter IDE →" link
- On load: if `localStorage.getItem('quiz-passed-N') === '1'`, pre-enable the link

**Mini-IDE:** Free exploration only — no validation, no Check button. Short Bootstrap snippet pre-filled. `▶ Run` wraps content in a full Bootstrap HTML page and sets iframe `srcdoc`.

### IDE pages (`0N-ide.html`)

Fully self-contained (all CSS inline `<style>`, all JS inline `<script>`). VS Code aesthetic.

**Layout:**
```
#topbar         (.topbar-left: GIT logo + full breadcrumb) (.pills-group: Instructions/Editor/Console/Preview) (.topbar-right: ⊞ Split/☰ Top-down + theme toggle)
#main           (flex row or column depending on layout)
  #panel-instructions    (task list + hint-box + collapsible hints section)
  .drag-handle           (drag-1: resize between instructions and editor)
  #panel-editor-console
    .editor-tabs         ([index.html] [script.js] [✓ Check] [▶ Run])
    .editor-wrap         (CodeMirror)
    #check-result        (✅/❌ inline callout)
    #panel-console       (collapsible, shows errors + dismissible × close buttons)
  .drag-handle           (drag-2: resize between editor and preview)
  #panel-preview         (iframe with Bootstrap loaded)
#ide-nav        (← Theory | Next Step → or Finish ✓ on step 5)
#status-bar     (always blue #007acc: Bootstrap Guide · HTML · Step N — Topic)
```

**Two layout modes:** Split (default, flex-row) and Top-down (flex-column). Toggled by topbar button. Persisted in `localStorage` key `git-layout`.

---

## Theming

### Intro pages and hub (`style.css`)

CSS variable system, dark by default, `.light` class on `<html>` for light mode:

```css
/* Dark (default) */
--bg: #0a0c10; --surface: #13161d; --surface-2: #1b1f28;
--border: rgba(255,255,255,0.07); --border-2: rgba(255,255,255,0.13);
--text: #e8eaf0; --text-muted: #7a8099; --text-dim: #4a5070;

/* Light */
--bg: #f4f5f8; --surface: #ffffff; --surface-2: #eef0f5;
--border: rgba(0,0,0,0.08); --border-2: rgba(0,0,0,0.13);
--text: #0f1117; --text-muted: #5a6070; --text-dim: #9aa0b0;

/* Shared */
--grad-start: #00E1FF; --grad-end: #0061FF;
--grad: linear-gradient(135deg, var(--grad-start), var(--grad-end));
--green: #22c55e; --yellow: #eab308; --red: #ef4444;
```

### IDE pages (inline CSS)

VS Code variables, dark by default, `.light` on `<html>`:

```css
/* Dark */
--vsc-bg: #1e1e1e; --vsc-surface: #252526; --vsc-tab-inactive: #2d2d30;
--vsc-border: #3c3c3c; --vsc-text: #cccccc; --vsc-muted: #969696;

/* Light */
--vsc-bg: #ffffff; --vsc-surface: #f3f3f3; --vsc-tab-inactive: #ececec;
--vsc-border: #e8e8e8; --vsc-text: #333333; --vsc-muted: #717171;
```

Status bar: `background: #007acc` always (both modes).

CodeMirror uses custom `.cm-s-vscode-dark` / `.cm-s-vscode-light` classes defined inline in each IDE page. Theme swaps on toggle: `editor.setOption('theme', isLight ? 'vscode-light' : 'vscode-dark')`.

Theme persisted in `localStorage` key `git-theme`.

---

## Hub page (`index.html`)

- Topbar + hero section ("Bootstrap · Building a Landing Page")
- Collapsible "Before you start" card (between hero and activity grid): what Bootstrap is, what they'll build, what to keep open, Bootstrap pre-loaded in preview. State persisted in `localStorage` key `git-before-open`.
- Activity grid: 5 cards, one per step, each linking to `0N-intro.html`

---

## IDE features

### Panel visibility (VS Code-style segmented buttons)

Four pill buttons centered in `#topbar`: Instructions, Editor, Console, Preview. Each toggles its panel. Active = solid fill with blue underline, inactive = outline. In split layout, hiding a panel collapses its column (via `updatePanelFlex()`).

### Drag-to-resize panels

Two `.drag-handle` elements inside `#main`:
- `drag-1` between `#panel-instructions` and `#panel-editor-console`
- `drag-2` between `#panel-editor-console` and `#panel-preview`

In split layout: `width: 6px; cursor: col-resize`. In top-down: `height: 6px; cursor: row-resize`. Hover/drag highlight: `rgba(0,225,255,0.35)`.

Panel sizes persist in `localStorage` key `git-panel-sizes` (JSON object of panel IDs → pixel sizes). Restored on page load.

### HTML + JS tabs

One CodeMirror instance; mode swaps on tab click. `htmlContent` and `jsContent` variables store each tab's content independently. JS tab content is injected before `</body>` in the preview srcdoc.

### Starter code

Stored in `<script type="text/html" id="starter-code">` to avoid template literal escaping issues. Read via `.textContent` at script init. Each step's starter = previous step's correct solution + a `<!-- Step N: Add your X here -->` comment.

Starters:
- Step 1: Bootstrap CDN + comment placeholder for navbar
- Step 2: Step 1 correct navbar + comment for hero section
- Step 3: Steps 1+2 correct + comment for grid layout
- Step 4: Steps 1+2+3 correct + comment for buttons section
- Step 5: Steps 1+2+3+4 correct + comment for footer

### Save/restore editor code

On every editor `change` event (debounced 500ms): `localStorage.setItem('git-code-step-N', htmlContent)`.

On page load (after editor init): restore from `localStorage.getItem('git-code-step-N')` if present.

Key: `git-code-step-{STEP}` where STEP is 1–5.

### Hints system (collapsible, progressive)

In `#panel-instructions`, below the main task description:
- Toggle button `💡 Hints ▶/▼` shows/hides `.hints-body`
- 3 hint items per step; first is pre-revealed, others revealed one at a time by "Show next hint →" button
- Hints are specific to each step (Grid: container/row/col layers; Buttons: btn + variant; etc.)

### Console

- Collapsible panel (collapsed by default, auto-expands on error)
- Each message rendered as: `<div class="console-msg [error]"><span class="console-msg-text">…</span><button class="console-close">×</button></div>`
- × button dismisses individual messages
- `runPreview()` clears all `.console-msg.error` elements before running (so stale errors don't persist)
- iFrame errors forwarded via `postMessage` (`window.onerror` inside iframe)

### Navigation buttons

- `← Theory` link (always available, goes to `0N-intro.html`)
- `Next Step →` / `Finish ✓` button: `ide-nav-btn-disabled` (opacity 0.4, `pointer-events: all`, `cursor: not-allowed`) until check passes. Has `title="Complete the check above to unlock the next step."` tooltip.
- On pass: switch to `ide-nav-btn-primary` (gradient), remove `disabled`. `goNext()` / `showCompletion()` guarded with `if (!stepPassed) return;`.
- Styling: `min-height: 44px`, `min-width: 160px`, `justify-content: center`. Mobile: `width: 100%`.



---

## Validation

`validateStep(step, code)` — pure string checks on the HTML string. Returns array of failure messages.

| Step | Checks |
|------|--------|
| 1 Navbar | `navbar`, `navbar-brand`, ≥2 `nav-link`, `Net@` |
| 2 Hero | step 1 present, `display-` class, `lead`, `btn` class, `Net@` |
| 3 Grid | step 1+2 present, `row`, ≥2 `col-` classes, `col-lg-` |
| 4 Buttons | step 1+3 present, ≥3 `btn`, ≥2 color variants, `btn-lg` or `btn-sm` |
| 5 Footer | `<footer`, `bg-dark` or `bg-*`, `Net@`, `©` or `2025` or `rights`, steps 1–4 present |

On pass → unlock Next/Finish button, show green callout, log to console.
On fail → show red callout with list of failed conditions, log error to console.

---

## Completion screen (step 5)

When `Finish ✓` is clicked after step 5 passes, a full-screen overlay appears (`#completion-overlay`) on top of the page:
- "You built a Bootstrap landing page!" heading
- Checklist of all 5 components learned
- CTA to open VSCode and build from scratch
- Two buttons: `Copy HTML` (copies editor content to clipboard) + `Back to Lesson Hub`

---

## localStorage keys

| Key | Used by | Value |
|-----|---------|-------|
| `git-theme` | all pages | `'light'` or absent (dark) |
| `git-layout` | IDE pages | `'split'` or `'topdown'` |
| `quiz-passed-N` (N=1–5) | intro pages | `'1'` when quiz passed |
| `git-panel-sizes` | IDE pages | JSON: `{ "panel-instructions": px, ... }` |
| `git-code-step-N` (N=1–5) | IDE pages | HTML string of student's code |
| `git-before-open` | hub index.html | `'1'` when "Before you start" is expanded |

---

## The 5 steps

### Step 1 — Navbar
- **Concept:** Bootstrap pre-built components. Add a class, Bootstrap does the styling.
- **Key classes:** `navbar`, `navbar-expand-lg`, `navbar-dark`, `bg-dark`, `navbar-brand`, `navbar-nav`, `nav-item`, `nav-link`, `container`, `ms-auto`
- **Task:** Add a navbar with brand "Net@" and at least two nav links.

### Step 2 — Hero Section
- **Concept:** Bootstrap utility classes for spacing and typography.
- **Key classes:** `py-5`, `text-center`, `bg-primary`, `text-white`, `container`, `display-4`, `fw-bold`, `lead`, `btn`, `btn-light`, `btn-lg`, `mt-3`
- **Task:** Add a hero section with big title "Welcome to Net@", a subtitle, and a CTA button.

### Step 3 — Grid Layout
- **Concept:** 12-column grid system with responsive breakpoints.
- **Key classes:** `container`, `py-5`, `row`, `col-12`, `col-lg-8`, `col-lg-4`
- **Task:** Add a two-column section: main content (8/12) + sidebar (4/12).

### Step 4 — Buttons
- **Concept:** Semantic color variants and size modifiers.
- **Key classes:** `btn`, `btn-primary`, `btn-secondary`, `btn-danger`, `btn-success`, `btn-warning`, `btn-outline-*`, `btn-lg`, `btn-sm`
- **Task:** Add a "Join Us" section with at least 3 buttons using ≥2 color variants and ≥1 size modifier.

### Step 5 — Footer
- **Concept:** Composing Bootstrap utilities on semantic HTML without a dedicated component.
- **Key classes:** `footer` (HTML element), `bg-dark`, `text-white`, `py-4`, `mt-5`, `container`, `text-center`, `text-muted`, `mb-0`
- **Task:** Add a footer with dark background, Net@ name, year 2025, and © symbol.

---

## Constraints

- **All student-facing text in English**
- **No frameworks on the app shell** — Bootstrap only inside preview iframes
- **Self-contained** — every page works by double-clicking locally. Network requests: Google Fonts, CodeMirror CDN, Bootstrap CDN (preview only)
- **Consistent with `lesson14/`** — same fonts, same dark theme, same component shapes, same logo
- **Never show the complete correct solution outright** — starters have comment placeholders; hints describe classes, not full solutions
- **Relative paths** — always `./`, never absolute (served both from `lessons.growintech.it/lesson15/` and local filesystem)

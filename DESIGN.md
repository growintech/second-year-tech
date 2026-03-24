# DESIGN.md — GIT Lesson Pages Design System

This document describes the visual system for all lesson pages in this repo. It reflects what is already implemented in `shared/style-intro.css` and `shared/style-ide.css` — those files are the ground truth. In case of conflict, the files win.

**Lesson 15 (`lesson15/bootstrap-guide/`)** is the canonical visual reference. Inspect its files before generating new content.

---

## CSS variables

These are defined in `shared/style-intro.css` and available on all intro pages. IDE pages use a separate VS Code-like variable set (see `shared/style-ide.css`).

```css
/* shared/style-intro.css — :root */
:root {
  --grad-start: #00E1FF;
  --grad-end:   #0061FF;
  --grad: linear-gradient(135deg, var(--grad-start), var(--grad-end));

  --bg:        #0a0c10;   /* page background */
  --surface:   #13161d;   /* cards, panels */
  --surface-2: #1b1f28;   /* inner panels, code bg */
  --border:    rgba(255,255,255,0.07);
  --border-2:  rgba(255,255,255,0.13);

  --text:      #e8eaf0;
  --text-muted:#7a8099;
  --text-dim:  #4a5070;

  --green:  #22c55e;
  --yellow: #eab308;
  --red:    #ef4444;

  --radius:    12px;
  --radius-sm: 8px;
}

/* Light theme — applied via .light on <html> */
html.light {
  --bg:        #f4f6fb;
  --surface:   #ffffff;
  --surface-2: #edf0f7;
  --border:    rgba(0,0,0,0.08);
  --border-2:  rgba(0,0,0,0.14);
  --text:      #1a1d2e;
  --text-muted:#5a6080;
  --text-dim:  #9aa0bc;
}
```

```css
/* shared/style-ide.css — :root (VS Code aesthetic) */
:root {
  --vsc-bg:           #1e1e1e;
  --vsc-surface:      #252526;
  --vsc-tab-inactive: #2d2d30;
  --vsc-border:       #3c3c3c;
  --vsc-text:         #cccccc;
  --vsc-muted:        #969696;
  /* same --grad-start / --grad-end as above */
}
html.light {
  --vsc-bg:           #ffffff;
  --vsc-surface:      #f3f3f3;
  --vsc-tab-inactive: #ececec;
  --vsc-border:       #e8e8e8;
  --vsc-text:         #333333;
  --vsc-muted:        #717171;
}
/* Status bar is always blue regardless of theme */
#status-bar { background: var(--grad-start); }
```

---

## Typography

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');

body { font-family: 'DM Sans', sans-serif; font-size: 16px; line-height: 1.65; }
code, pre, .code-block, textarea.code-editor { font-family: 'DM Mono', monospace; }
```

---

## Layout

### Intro pages

- `body`: `background: var(--bg)`, `color: var(--text)`
- `.page-wrap`: `max-width: 780px`, `margin: 0 auto`, `padding: 0 24px 80px`
- **Topbar**: sticky, `background: rgba(10,12,16,0.85)` with backdrop blur, `border-bottom: 1px solid var(--border)`, height ~56px. Contains GIT logo (SVG inlined, never `<img>`), lesson label, theme toggle.
- **Progress bar**: `.progress-bar` with `.progress-bar-dot` elements (`.active` = gradient, `.done` = faded cyan)

### IDE pages

- `body`: `height: 100vh; overflow: hidden; display: flex; flex-direction: column`
- `#shell`: `flex: 1; display: flex; flex-direction: column; min-height: 0`
- Layout modes: `layout-split` (flex-row) and `layout-topdown` (flex-column), toggled by student, persisted in `localStorage('git-layout')`
- `#ide-nav` and `#status-bar` are always pinned to the bottom of `#shell`

---

## Components — Intro pages

All component classes are defined in `shared/style-intro.css`. Use them directly.

### Activity badge

```html
<div class="activity-badge badge-blue">📅 Date &amp; Time</div>
<div class="activity-badge badge-green">🟢 Level 1 — Easy</div>
<div class="activity-badge badge-yellow">🟡 Level 2 — Medium</div>
<div class="activity-badge badge-red">🔴 Level 4 — Main Challenge</div>
<div class="activity-badge badge-concept">⏱️ Concept</div>
<div class="activity-badge badge-explore">🔍 Exploration</div>
```

### Hero

```html
<div class="hero">
  <div class="activity-badge badge-blue">Step 1 · Bootstrap</div>
  <h1>The <span class="grad">Navbar</span> Component</h1>
  <p class="lead">Learn what a CSS framework is…</p>
</div>
```

`h1` uses `clamp(28px, 5vw, 40px)`, font-weight 600. `.grad` applies the brand gradient as text fill.

### Section heading

```html
<section>
  <h2>Key Classes</h2>
  …
</section>
```

`section h2` is rendered as a small-caps label with a line extending to the right (defined in CSS via `::after`). Do not add extra styling.

### Card

```html
<div class="card">
  <h3>Title</h3>
  <p>Content…</p>
</div>
```

Background `var(--surface)`, border `1px solid var(--border)`, radius `var(--radius)`, padding 24px.

### Steps

```html
<div class="steps">
  <div class="step">
    <div class="step-num">1</div>
    <div class="step-body">
      <h4>Step title</h4>
      <p>Description.</p>
    </div>
  </div>
</div>
```

### Code block (static display)

```html
<div class="code-block">
  <button class="copy-btn">Copy</button>
  <pre><span class="kw">var</span> now = <span class="kw">new</span> <span class="fn">Date</span>();</pre>
</div>
```

Syntax colour classes: `.kw` (keywords, cyan), `.fn` (function names, indigo), `.str` (strings, green), `.num` (numbers, yellow), `.cmt` (comments, dim), `.met` (methods, pink).

### Snippet block (read-only CodeMirror)

```html
<div class="snippet-block">
  <textarea id="ref-snippet-1">…code…</textarea>
</div>
```

Initialised by `initSnippet('ref-snippet-1', true)` in the page script. Renders as a read-only CodeMirror with VS Code theme + copy button. **Use this instead of `.code-block` for reference snippets on intro pages.**

### Callout

```html
<div class="callout callout-tip">
  <span class="callout-icon">💡</span>
  <div class="callout-body">
    <strong>Tip</strong>
    One concise sentence max.
  </div>
</div>
```

Variants: `callout-info`, `callout-tip`, `callout-warn`, `callout-bonus`. **Rule: max 1–2 callouts per page. Single sentence only.**

On lesson14-style pages (inline editor pattern), add a local `<style>` override to restore flex layout:

```css
.callout { display: flex; gap: 14px; align-items: flex-start; padding: 16px 18px; }
.callout-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
.callout-body { display: block; }
.callout-body strong { display: block; margin-bottom: 3px; }
```

### Class switcher

```html
<div class="class-switcher" id="cs-01">
  <div class="cs-tabs">
    <button class="cs-tab active" onclick="switchClassTab('cs-01', 0)">navbar</button>
    <button class="cs-tab" onclick="switchClassTab('cs-01', 1)">navbar-expand-lg</button>
  </div>
  <div class="cs-content-wrap">
    <div class="cs-pane active"><p>Base class…</p></div>
    <div class="cs-pane"><p>Collapses…</p></div>
  </div>
</div>
```

Use this instead of a bullet list when introducing multiple related CSS classes — shows one at a time to avoid cognitive overload.

### Q&A reveal

```html
<div class="qa">
  <div class="qa-q">What does getMonth() return in January?</div>
  <div class="qa-a" style="display:none">0 — not 1. January is month 0.</div>
</div>
```

Click to reveal answer. Handled by `app-intro.js`.

### Inline code editor (lesson14 pattern)

```html
<div class="editor-wrap">
  <div class="editor-titlebar">
    <div class="editor-dots"><span></span><span></span><span></span></div>
    <span class="editor-filename">birthday.js</span>
    <span class="editor-lang-badge">JS</span>
  </div>
  <textarea class="code-editor" id="editor-01" rows="6" spellcheck="false">…starter…</textarea>
  <div class="editor-actions">
    <button class="run-btn" onclick="runCode('editor-01','output-01','')">▶ Run</button>
    <button class="check-btn" onclick="checkFn()">✓ Check</button>
    <a class="jsbin-btn" href="https://jsbin.com/?js,console" target="_blank">↗ JSBin</a>
  </div>
  <iframe id="output-01" class="editor-output" style="min-height:80px;"></iframe>
  <div id="feedback-01" class="check-feedback"></div>
</div>
```

`runCode()` and `checkStudentCode()` / `showFeedback()` are provided by `app-intro.js`.

### Mini-IDE (lesson15 intro pattern)

```html
<div class="mini-ide-wrap">
  <h3>▶ Try it yourself</h3>
  <div class="mini-ide-actions">
    <button id="run-btn" class="btn-run">▶ Run</button>
  </div>
  <div class="mini-editor-wrap">
    <textarea id="mini-editor"></textarea>
  </div>
  <iframe id="mini-preview" class="mini-preview" sandbox="allow-scripts allow-same-origin"></iframe>
</div>
```

Initialised by `initMiniIDE('mini-editor', 'mini-preview', 'run-btn', STARTER_CODE)`. No validation — free exploration only.

### Quiz gate (lesson15 pattern)

```html
<div class="quiz-section">
  <h2>Quick Check</h2>
  <div id="quiz-container"></div>
  <button class="quiz-check-btn" onclick="checkQuiz(1, QUIZZES_1, 'go-ide-btn', 'quiz-result')">Check Answers</button>
  <div id="quiz-result" class="quiz-result"></div>
</div>
```

Quiz data is a JS array. On pass: `localStorage.setItem('quiz-passed-N', '1')` and the "Enter IDE →" button unlocks. `renderQuiz()`, `checkQuiz()`, `restoreQuizState()` are provided by `app-intro.js`.

### Navigation footer

```html
<div class="nav-footer">
  <a href="./index.html" class="nav-btn nav-btn-outline">← Back</a>
  <button id="go-ide-btn" class="nav-btn nav-btn-disabled" disabled onclick="window.location='01-ide.html'">Enter IDE →</button>
</div>
```

---

## Components — IDE pages

All defined in `shared/style-ide.css` + `shared/app-ide.js`. Each IDE page is self-contained with inline `<style>` only for page-specific overrides.

### Shell structure

```
#topbar          GIT logo | breadcrumb | .pills-group (centred) | layout/theme toggles
#main            Flex container (split or topdown)
  #panel-instructions   task list + .hints-section
  .drag-handle
  #panel-editor-console
    #panel-editor       .editor-tabs | .editor-wrap (CodeMirror) | #check-result
    #panel-console      collapsible, auto-expands on error
  .drag-handle
  #panel-preview        iframe (Bootstrap CDN loaded inside)
#ide-nav         ← Theory link | Next Step → button (disabled until check passes)
#status-bar      always blue gradient; "Bootstrap Guide · HTML · Step N — Topic"
```

### Starter code pattern

Stored in `<script type="text/html" id="starter-code">` to avoid escaping issues. Each step's starter = previous step's complete correct solution + a `<!-- Step N: Add your X here -->` comment placeholder.

### Validation

`window.validateStep(step, code)` — pure string/regex checks on the HTML string. Returns an array of failure messages. Defined inline in each IDE page before loading `app-ide.js`.

### Pills group

Four rectangular buttons centred in the topbar: Instructions, Editor, Console, Preview. Active = solid gradient fill. Toggles panel visibility.

---

## Activity list (lesson hub — `index.html`)

```html
<div class="activity-grid">
  <a class="activity-card" href="./01-intro.html">
    <div class="activity-card-icon">🧭</div>
    <div class="activity-card-body">
      <div class="activity-card-title">Step 1 — Navbar</div>
      <div class="activity-card-desc">Bootstrap pre-built components</div>
    </div>
    <span class="activity-card-time">~15 min</span>
    <span class="activity-card-arrow">›</span>
  </a>
</div>
```

Scaffolding activities added by the skill should include a `[S]` prefix in the title or a muted badge so tutors can recognise them.

---

## `shared/` loading rules

Every intro page must load:

```html
<link rel="stylesheet" href="../../shared/style-intro.css">
<!-- CodeMirror (if needed) -->
<script src="…/codemirror.min.js"></script>
<script src="…/mode/xml/xml.min.js"></script>
<script src="…/mode/javascript/javascript.min.js"></script>
<script src="…/mode/css/css.min.js"></script>
<script src="…/mode/htmlmixed/htmlmixed.min.js"></script>  ← must be last
<script src="../../shared/app-intro.js"></script>           ← must be last
```

**CodeMirror mode load order is critical.** `htmlmixed` depends on `xml`, `javascript`, and `css`. Loading it before them causes silent breakage.

Every IDE page must load:

```html
<link rel="stylesheet" href="…/codemirror.min.css">
<link rel="stylesheet" href="../../shared/style-ide.css">
<!-- CodeMirror scripts -->
<script>window.IDE_STEP = N; window.IDE_NEXT_URL = 'NN-intro.html'; window.validateStep = function(step, code) { … };</script>
<script src="../../shared/app-ide.js"></script>  ← must be last
```

Theme is persisted in `localStorage('git-theme')`. Layout in `localStorage('git-layout')`. Editor code in `localStorage('git-code-step-N')`. Quiz state in `localStorage('quiz-passed-N')`.

---

## Generation rules

When the skill generates new files:

1. **Use real CSS variable names** — `var(--bg)`, `var(--surface)`, `var(--text-muted)` etc., exactly as defined in `shared/style-intro.css`. Do not invent new variables.
2. **Do not inline the shared CSS** — always link `../../shared/style-intro.css` (or `style-ide.css`).
3. **Inline the GIT logo SVG** — never use `<img src="logo.svg">` on a page that serves via CDN. Keep a `logo.svg` file in the lesson folder for topbar `<img>` tags (lesson14 pattern) or use the inline SVG approach (lesson15 pattern).
4. **CodeMirror via cdnjs** — use `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/`.
5. **Bootstrap 5.3 only inside preview iframes** — `https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/`.
6. **`app-ide.js` expects** `window.IDE_STEP`, `window.IDE_NEXT_URL`, and `window.validateStep` to be defined before it loads.
7. **Verify mentally** that the page opens from `file://` on a local filesystem.
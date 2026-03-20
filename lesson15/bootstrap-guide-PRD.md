# PRD — Bootstrap Interactive Lesson Guide
**Recipient: Claude Code. Build this exactly as specified.**

---

## What you're building

A single self-contained HTML file (`index.html` inside a new folder `bootstrap-guide/`) that teaches students how to use Bootstrap by having them build a landing page for **Net@** — a high school web development program — step by step.

The app is a full IDE-style environment in the browser: instruction panel + live code editor + preview, all in one page, no server needed, openable by double-clicking the file locally.

---

## Reference project

An existing lesson guide lives in `git-dates/`. Read its `style.css` and any of its HTML files carefully before writing a single line. Replicate the same visual identity, component language, and interaction patterns. This Bootstrap lesson must feel like it belongs to the same product family.

Key patterns to replicate from `git-dates/`:
- Topbar with GIT logo (48px height) + lesson label + light/dark toggle
- `DM Sans` + `DM Mono` from Google Fonts
- CSS variable system for theming
- Callout components (info / tip / warn / bonus)
- Step-numbered lists
- The gradient `#00E1FF → #0061FF` for accents and CTAs
- Dark-first design with full light mode via `.light` on `<html>`

---

## Tech stack

- **Vanilla HTML/CSS/JS only** — no build tools, no npm, no frameworks for the app shell itself
- **CodeMirror 5** loaded via CDN for the code editor (syntax highlighting for HTML)
  - CDN: `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js`
  - CSS: `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css`
  - HTML mode: `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/htmlmixed/htmlmixed.min.js`
  - Theme (use `dracula` for dark, `default` for light): `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/dracula.min.css`
- **Bootstrap 5.3** pre-loaded inside the preview iframe only — NOT on the app shell
- **Google Fonts**: DM Sans + DM Mono (same import as `git-dates/style.css`)
- The GIT logo SVG must be inlined directly in the HTML (copy from `git-dates/logo.svg`)

---

## Layout system

The student can switch between two layouts using a toggle in the topbar. Persist their choice in `localStorage` key `git-layout`.

### Top-down layout (default)
```
┌─────────────────────────────────┐
│           TOPBAR                │
├─────────────────────────────────┤
│      INSTRUCTION PANEL          │  (current step: title, explanation, hint)
├─────────────────────────────────┤
│      CODE EDITOR (CodeMirror)   │  (HTML editor, full width)
│      [Run ▶]  [Check ✓]         │
├─────────────────────────────────┤
│         CONSOLE                 │  (error messages only, collapsible)
├─────────────────────────────────┤
│      LIVE PREVIEW (iframe)      │  (Bootstrap pre-loaded inside)
└─────────────────────────────────┘
```

### Split-pane layout
```
┌──────────────┬─────────────────┬──────────────┐
│  INSTRUCTION │  CODE EDITOR    │  LIVE        │
│  PANEL       │  (CodeMirror)   │  PREVIEW     │
│              │                 │  (iframe)    │
│              │  [Run ▶][Check] │              │
│              ├─────────────────┤              │
│              │  CONSOLE        │              │
└──────────────┴─────────────────┴──────────────┘
```

### Panel visibility toggles (JSBin-style)
Small pill buttons in the topbar row (below the main topbar): `[Instructions]` `[Editor]` `[Console]` `[Preview]`. Each toggles visibility of its panel. Active panels have a filled style, hidden ones are dimmed outlines. In split-pane, hiding a panel collapses its column; in top-down, it collapses the row.

---

## Theming

Same system as `git-dates/style.css`. Apply `.light` class to `<html>`.

```css
/* Dark (default) */
--bg: #0a0c10;
--surface: #13161d;
--surface-2: #1b1f28;
--border: rgba(255,255,255,0.07);
--border-2: rgba(255,255,255,0.13);
--text: #e8eaf0;
--text-muted: #7a8099;
--text-dim: #4a5070;

/* Light */
--bg: #f4f5f8;
--surface: #ffffff;
--surface-2: #eef0f5;
--border: rgba(0,0,0,0.08);
--border-2: rgba(0,0,0,0.13);
--text: #0f1117;
--text-muted: #5a6070;
--text-dim: #9aa0b0;

/* Shared */
--grad-start: #00E1FF;
--grad-end: #0061FF;
--grad: linear-gradient(135deg, var(--grad-start), var(--grad-end));
--green: #22c55e;
--yellow: #eab308;
--red: #ef4444;
```

The CodeMirror editor uses theme `dracula` in dark mode and `default` in light mode — swap the theme when toggling.

Persist theme in `localStorage` key `git-theme`. Toggle button: moon icon in dark mode, sun icon in light mode.

---

## Progress & navigation

A step progress bar is always visible below the topbar (7 dots, matching the `git-dates/` style — but here 5 dots for 5 steps). The student can only advance to the next step after their code passes the **Check**. 

Navigation:
- `[← Back]` button: always available, goes to previous step (no validation required to go back)
- `[Next →]` button: **disabled and greyed out** until Check passes. Once it passes, it becomes active with the gradient style and can be clicked.
- On the very last step (Step 5), the Next button is replaced by `[🎉 Finish]` which triggers a completion screen.

Step counter label (e.g. "Step 2 of 5") is visible in the instruction panel header.

---

## The 5 steps

The student is building the **Net@ landing page** incrementally. Each step adds one section to the page. The editor always contains the full HTML built so far — each step's starter code is the previous step's correct solution with a new section stubbed out for the student to complete.

The preview iframe always renders the full page as written, with Bootstrap loaded.

The iframe `srcdoc` must always include this Bootstrap boilerplate wrapping the student's code:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <title>Net@ Landing Page</title>
</head>
<body>
  STUDENT_CODE_HERE
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

---

### Step 1 — Navbar

**Concept to teach:** Bootstrap pre-built components. You add a class and Bootstrap does the styling. No custom CSS needed.

**Instruction panel content:**
- Explain what a CSS framework is in one sentence: pre-written CSS you activate with class names.
- Explain the Bootstrap Navbar: a responsive header component with brand name, links, and a hamburger menu on mobile.
- Key classes to introduce: `navbar`, `navbar-expand-lg`, `navbar-dark`/`navbar-light`, `bg-dark`/`bg-primary`, `navbar-brand`, `nav-item`, `nav-link`, `container`.
- Show this reference snippet in a read-only code block (not editable):
  ```html
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container">
      <a class="navbar-brand" href="#">My Site</a>
    </div>
  </nav>
  ```
- Task: "Add a navbar for Net@ with the brand name **Net@** and three navigation links: **Home**, **About**, **Contact**."

**Starter code in editor:**
```html
<!-- Step 1: Add your Navbar here -->
<!-- Use the navbar classes you just learned -->
```

**Validation logic (Check button):**
Run the code through a JS function that checks the HTML string for all of:
1. Contains `navbar` class
2. Contains `navbar-brand`
3. Contains at least two `nav-link` occurrences
4. Contains "Net@" text somewhere

If all pass: ✅ green success callout — "Great! Your navbar is live. You can see it in the preview." — and unlock Next.
If any fail: ❌ red error callout listing specifically which check failed (e.g. "We couldn't find a `navbar-brand` — make sure your brand name has that class.").

---

### Step 2 — Hero Section

**Concept to teach:** Bootstrap utility classes for spacing, typography, and layout. Using `container`, `py-*`, `text-center`, `display-*`, `lead`.

**Instruction panel content:**
- Explain what a "hero section" is: the big introductory block at the top of a landing page. First thing visitors see.
- Key classes: `container`, `py-5`, `text-center`, `display-4` (big headline), `lead` (subtitle text), `mt-*`/`mb-*` spacing utilities.
- Show reference snippet:
  ```html
  <section class="py-5 text-center bg-light">
    <div class="container">
      <h1 class="display-4">Welcome</h1>
      <p class="lead">A short description here.</p>
    </div>
  </section>
  ```
- Task: "Add a hero section below the navbar. It should have a big title 'Welcome to Net@', a subtitle that briefly describes the course, and a call-to-action button (any Bootstrap button style)."

**Starter code in editor:**
The correct navbar from Step 1, then:
```html
<!-- Step 2: Add your Hero Section below the navbar -->
```

**Validation logic:**
1. Navbar from step 1 is still present (`navbar` class exists)
2. Contains `display-` class (any display utility, e.g. `display-4`)
3. Contains `lead` class
4. Contains a `<button` or `<a` with `btn` class
5. Contains "Net@" text in the hero content

---

### Step 3 — Sidebar Layout

**Concept to teach:** The Bootstrap grid system. 12-column logic. `row`, `col-*`, responsive breakpoints (`col-lg-*`).

**Instruction panel content:**
- Explain the 12-column grid: every row has 12 slots. You decide how many each column takes.
- Show visual diagram of the grid inline in the instruction panel (draw it with HTML/CSS — a simple row of 12 numbered boxes, then examples of 6+6, 8+4, 3+9).
- Key classes: `row`, `col-12`, `col-lg-8`, `col-lg-4`, `container`.
- Explain responsive breakpoints: `col-12` = full width on mobile, `col-lg-8` = 8 columns only on large screens. On small screens everything stacks vertically automatically.
- Show reference snippet for a sidebar layout:
  ```html
  <div class="container py-5">
    <div class="row">
      <div class="col-12 col-lg-8">
        <!-- Main content -->
      </div>
      <div class="col-12 col-lg-4">
        <!-- Sidebar -->
      </div>
    </div>
  </div>
  ```
- Task: "Add a content section below the hero. The main column (8/12) should contain a short paragraph about what students learn in Net@. The sidebar column (4/12) should contain a small box with upcoming lesson info (use any Bootstrap card or just a `div` with some text)."

**Validation logic:**
1. `row` class present
2. At least two `col-` classes present
3. One column uses `col-lg-8` or similar (checking for `col-lg-` prefix)
4. Navbar and hero from previous steps still present

---

### Step 4 — Buttons

**Concept to teach:** Bootstrap button variants and sizing. `btn`, `btn-primary`, `btn-secondary`, `btn-outline-*`, `btn-lg`, `btn-sm`, `btn-danger`, `btn-success`. Also Bootstrap `badge` as a bonus.

**Instruction panel content:**
- Explain Bootstrap's semantic color system: `primary`, `secondary`, `success`, `danger`, `warning`, `info`, `light`, `dark`.
- Show the full button palette in the instruction panel as a live mini-preview (render a small read-only iframe or HTML block showing all variants).
- Key classes: `btn btn-primary`, `btn btn-outline-secondary`, `btn btn-lg`, `btn btn-sm`.
- Task: "Add a section called 'Join Us' with at least **three different button styles**. For example: a primary 'Enroll Now' button, an outline secondary 'Learn More' button, and a small danger 'Limited spots!' button. Try using `btn-lg` on one of them."

**Starter code:** All previous steps' correct code + comment placeholder for this section.

**Validation logic:**
1. At least 3 elements with `btn` class
2. At least 2 different color variants (check for at least 2 of: `btn-primary`, `btn-secondary`, `btn-danger`, `btn-success`, `btn-warning`, `btn-outline-*`)
3. At least 1 size modifier (`btn-lg` or `btn-sm`)
4. All previous sections still present

---

### Step 5 — Footer

**Concept to teach:** Semantic HTML `<footer>`, combining Bootstrap utilities (background, text color, padding, text alignment) without a specific "footer component" — Bootstrap gives you the tools, you compose them.

**Instruction panel content:**
- Explain that Bootstrap has no dedicated footer component — instead you combine utilities: `bg-dark`, `text-white`, `text-muted`, `py-4`, `text-center`, `mt-auto`.
- Show a reference snippet:
  ```html
  <footer class="bg-dark text-white py-4 mt-5">
    <div class="container text-center">
      <p class="mb-0 text-muted">© 2025 Net@ — All rights reserved.</p>
    </div>
  </footer>
  ```
- Task: "Add a footer at the bottom of the page. It should have a dark background, the Net@ name, the current year, and at least one of these: social links, a tagline, or navigation links."

**Validation logic:**
1. `<footer` tag present
2. Contains `bg-dark` or `bg-*` class (any background utility)
3. Contains "Net@" text
4. Contains `©` or "2025" or "rights" (copyright indicator)
5. All 4 previous sections still present

**On pass:** Unlock the `[🎉 Finish]` button.

---

## Completion screen

When the student clicks `[🎉 Finish]` after Step 5 passes, replace the entire instruction panel content (not the editor or preview — those stay) with:

```
🎉 You built a full Bootstrap landing page!

Here's what you used:
✅ Navbar      — pre-built responsive header
✅ Hero        — utility classes for spacing and typography  
✅ Grid layout — 12-column system with responsive breakpoints
✅ Buttons     — semantic color variants and sizing
✅ Footer      — composing utilities without a component

What's next: open VS Code, start a blank HTML file, connect Bootstrap via CDN,
and build your own landing page from scratch. You now know how.
```

Below this, show two buttons:
- `[↩ Review my code]` — scrolls to the editor
- `[📋 Copy full HTML]` — copies the complete student code to clipboard

---

## Console panel

The console is a read-only output panel that shows:
- **Red error messages** when the student's HTML causes a JS error inside the iframe (catch via `window.onerror` in the iframe and `postMessage` back to parent)
- **Check results** — both pass and fail messages appear here as well as in the inline callout
- When there are no errors: show a dim "No errors" state

The console is **collapsed by default** and auto-expands when an error occurs.

---

## Run button behavior

- Clicking **Run** takes the current CodeMirror content and injects it into the iframe `srcdoc` (with Bootstrap boilerplate wrapping as specified above)
- The preview updates immediately
- Run does NOT trigger validation — it just renders
- Auto-run on editor change is OFF by default (students must click Run explicitly)

---

## Check button behavior

1. Read the current CodeMirror value
2. Run the step-specific validation function (pure string checks on the HTML — no execution needed for most steps)
3. Show result in a callout that appears between the editor and the console:
   - ✅ Green callout: specific success message for this step + "Next is now unlocked"
   - ❌ Red callout: list each failed condition with a plain-English hint
4. If all checks pass, enable the Next button (remove `disabled` attribute, apply gradient style)

Validation is string-based (regex / `includes()` checks on the HTML string). No need to execute the code for validation.

---

## File structure

```
bootstrap-guide/
  index.html      ← the entire app, self-contained
```

No other files. The GIT logo SVG is inlined in `index.html`. All CSS is in a `<style>` block. All JS is in `<script>` blocks at the bottom.

---

## Constraints and non-negotiables

- **All student-facing text must be in English**
- **No frameworks on the app shell** — the app itself is vanilla. Bootstrap only loads inside the preview iframe.
- **Self-contained** — the file must work by double-clicking locally, with no server. The only network requests are Google Fonts, CodeMirror CDN, and Bootstrap CDN (for the preview). Everything else is inline.
- **Consistent with `git-dates/`** — a student switching between the two lesson guides should feel no visual discontinuity. Same fonts, same dark theme, same component shapes, same logo.
- **The editor always contains the full page code** — never just a fragment. This way the preview always shows a complete, functional Bootstrap page.
- **Never show the complete correct solution outright** — the starter code for each step has a comment placeholder (`<!-- Add your X here -->`). Hints describe the classes to use. The solution is only revealed implicitly when the check passes.

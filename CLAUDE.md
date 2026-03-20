# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

---

## Organisation & program

**Grow in Tech (GIT)** is an Italian coding education organisation that runs structured programming courses in high schools. Website: growintech.it.

The program runs for **3 years**, **60 hours/year**, split into **20 lessons of 3 hours each**. Every lesson divides time equally between technical coding content and soft skills / relational competencies. Lessons are taught by paid university STEM students using a peer-to-peer, interactive methodology — direct student engagement over frontal lecturing.

**Net@** is the name of the specific school program/course that students are enrolled in. When lesson content refers to a project the students are building (e.g. a landing page), that project is for **Net@**.

**Curriculum by year:**
- Year 1: HTML + CSS
- Year 2: JavaScript (this repository)
- Year 3: Introduction to Python

---

## This repository

**Repo:** `second-year-lessons` (hosted at `https://lessons.growintech.it/`)

This is the **Year 2 JavaScript lesson platform** — a collection of interactive browser-based lesson guides that students open during class to follow along, complete exercises, and check their work. It is **not** a backend platform; everything runs in the browser with no server.

**Primary audience:** High school students, 15–18 years old, in Italy. They are beginners — they know HTML and CSS from Year 1 but are new to programming logic.

**Instructor audience:** University STEM students who teach the lessons. They use these materials as a live reference during class.

---

## Purpose of the platform

These files are **in-class companions**, not homework assignments. Students open them on their laptops during a lesson and use them as:
1. A step-by-step guide to the activity they are working on
2. An interactive code environment (editor + live preview) where they write and test code without leaving the browser
3. A validation layer that tells them whether their solution is correct

The platform replaces the need to switch between a lesson PDF, JSBin, and a separate instructions document. Everything is in one place.

---

## Architecture & patterns

### Repo structure

```
second-year-lessons/
  index.html                  ← hub page (in Italian, links to all lessons)
  lesson14/
    date-and-time/
      index.html              ← lesson hub listing all activities
      01-explore.html
      02-birthday.html
      …
      07-countdown.html
      app.js
      style.css
      logo.svg
  lesson15/
    bootstrap-guide/
      index.html              ← full IDE-style single-file app
      bootstrap-guide-PRD.md  ← full spec for Claude Code
```

Each lesson lives in its own folder and follows this pattern:
- `index.html` — lesson hub page listing all activities
- `01-*.html`, `02-*.html`, … — individual activity files
- `app.js` — shared utilities (theme toggle, copy buttons, sandbox runner, validation)
- `style.css` — all styling for that lesson
- `logo.svg` — GIT branding (reuse across all lessons, do not modify)

Lessons must be **self-contained** — they work by double-clicking the HTML file locally with no server. CDN links are allowed (Google Fonts, CodeMirror, Bootstrap).

### Hub page (`index.html`)

The root `index.html` is the student-facing dashboard listing all 15 lessons of Year 2. It is written in **Italian** (the students are Italian). It links to each lesson folder.

The hub page uses the **GIT brand identity** (see Design System below), not the dark lesson-guide aesthetic. It is light-background, high-contrast, energetic — matching the GIT visual identity PDF. Cards are numbered 01–15, accent colors rotate through the GIT palette (cyan, lime, mint, blue), lessons not yet available are visually dimmed with a "PROSSIMAMENTE" label.

---

## Design system

### Lesson guides (lesson14, lesson15, …)

All lesson guide pages share a consistent dark-first visual identity. Replicate it exactly when building new lesson content.

**Colors (CSS variables):**
```css
/* Dark mode (default) */
--bg: #0a0c10;
--surface: #13161d;
--surface-2: #1b1f28;
--border: rgba(255,255,255,0.07);
--border-2: rgba(255,255,255,0.13);
--text: #e8eaf0;
--text-muted: #7a8099;
--text-dim: #4a5070;

/* Light mode (applied via .light class on <html>) */
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

**Fonts:** `DM Sans` (body) + `DM Mono` (code) from Google Fonts.

**Theme toggle:** Button with ☀️/🌙 icon, stored in `localStorage` key `git-theme`. Toggle applies/removes `.light` on `<html>`.

**Topbar:** GIT logo at **48px height** (SVG inlined, never an `<img>` tag for cross-origin safety) + lesson label (e.g. "JS · Year 2 · Lesson 14") + theme toggle. Logo must be visible in both dark and light themes — the SVG uses the `#00E1FF → #0061FF` gradient fill which works on both.

**Component library (defined in lesson14/style.css — reuse these patterns):**
- `.card` — surface container with border and radius
- `.callout` — info / tip / warn / bonus variants with left border accent
- `.step` — numbered step with circle indicator
- `.code-block` — dark code area with copy button
- `.activity-badge` — pill badge with color variants (green/yellow/red/blue/concept)
- `.progress-bar` — dot-based step progress indicator
- `.nav-footer` — back/next navigation at bottom of page
- `.qa` — click-to-reveal Q&A pair

### Hub page (`index.html`) — GIT brand identity

The hub page uses the **full GIT brand palette**, distinct from the lesson guide dark theme:

**Colors:**
- Cyan: `#00E1FF`
- Lime: `#E1FF00`
- Mint: `#00FF9E`
- Electric blue: `#0061FF`
- Navy: `#010034`
- Background: `#F4FEFF`

**Fonts:** `Barlow Condensed` (700, 800) for headlines + `DM Sans` (400, 500, 600) for body and labels.

**Decorative elements:** A repeating binary `010101` diagonal pattern used as a subtle background texture on colored surfaces. Diagonal geometric shapes and color bands as accents.

**Logo:** The GIT logo is a double chevron `>>` mark followed by "Grow in Tech" in bold sans-serif. Rendered in the `#00E1FF → #0061FF` gradient (same as lesson guides). Use the inlined SVG from `logo.svg`.

---

## Content language rules

| File | Language |
|------|----------|
| Root `index.html` (hub) | Italian |
| All lesson guide pages (`lesson14/`, `lesson15/`, …) | English |
| `CLAUDE.md`, PRD files, code comments | English |

Student-facing text in lesson guides is always in **English**. This is an explicit pedagogical choice — students are expected to read English technical content.

---

## Tech constraints

- **No build tools** — no npm scripts, no bundlers, no compilation step
- **No frameworks on the app shell** — vanilla HTML/CSS/JS only for the lesson guide UI
- **CDN dependencies allowed:** Google Fonts, CodeMirror 5, Bootstrap 5.3 (only inside preview iframes)
- **Self-contained files** — every lesson folder must work by double-clicking `index.html` locally
- **Relative paths** — always use `./` relative paths, never absolute. The lessons are served both from `lessons.growintech.it/lessonXX/` and from a local filesystem
- **No localStorage for lesson content** — student code and progress do not persist between sessions (by design — each class starts fresh)
- `localStorage` is used only for UI preferences: `git-theme` (dark/light) and `git-layout` (top-down/split-pane)

---

## Lesson 14 — Date and Time

**Location:** `lesson14/date-and-time/`

Seven activity pages building toward a countdown banner. Structure:
1. `01-explore.html` — exploring the `Date` object and its methods
2. `02-birthday.html` — 🟢 Level 1: Birthday Finder (`getDay()`)
3. `03-age.html` — 🟡 Level 2: Age Calculator (`getFullYear()`)
4. `04-gettime.html` — Concept: `getTime()` and ms differences
5. `05-school.html` — 🟡 Level 3: Days until end of school
6. `06-remainder.html` — Concept: the extract→subtract→proceed remainder pattern
7. `07-countdown.html` — 🔴 Level 4: Live countdown banner with `setInterval`

**Interactive pattern:** Each exercise page has an inline CodeMirror-style editor (or styled textarea) where students write code. A **Run** button injects their code into a sandboxed `<iframe srcdoc>` for live output. A **Check** button validates their solution with string/regex checks and shows ✅/❌ feedback. The Next button is unlocked only after Check passes.

**Five additional exercises planned** (not yet built, to be added as extra pages):
1. What season is it? (`getMonth()` + if/else ranges)
2. Is it the weekend? (`getDay()` + OR operator)
3. Good morning/afternoon/evening (`getHours()` + if/else if)
4. How many days have you been alive? (`getTime()` + ms → days conversion)
5. Format today's date as DD/MM/YYYY (`getDate()`, `getMonth()+1`, `getFullYear()` + string concatenation)

---

## Lesson 15 — Bootstrap Guide

**Location:** `lesson15/bootstrap-guide/`

**Full spec:** `lesson15/bootstrap-guide-PRD.md` — read this before touching any code.

Single-file IDE-style app. Key points:
- Single file: `lesson15/bootstrap-guide/index.html`
- IDE-style layout: instruction panel + CodeMirror editor + live preview iframe
- Two layouts: **top-down** (default) and **split-pane**, toggled by the student, persisted in `localStorage` key `git-layout`
- Panel visibility toggles (JSBin-style): Instructions / Editor / Console / Preview
- CodeMirror 5 via CDN — theme `dracula` in dark mode, `default` in light mode
- Bootstrap 5.3 loads **only inside the preview iframe** via CDN — never on the app shell itself
- **5 guided steps** building a "Net@" landing page incrementally:
  1. Navbar
  2. Hero section
  3. Sidebar layout (Bootstrap grid 8+4 columns)
  4. Buttons (semantic color variants)
  5. Footer
- Each step's starter code = previous step's correct solution + placeholder comment
- Validation is **string-based** (`includes()` / regex on the HTML string) — no code execution needed for checking
- Next button is **disabled** until Check passes
- Completion screen after Step 5 with summary of what was learned + CTA to build from scratch in VSCode
- Visual identity must match `lesson14/date-and-time/` exactly

---

## Lessons 1–13 (reference only)

These lessons exist on the live platform but their source files are not in this repo (they were built separately). Lesson topics for reference:

| # | Title |
|---|-------|
| 01 | Introduzione a JavaScript |
| 02 | Identity Card |
| 03 | Tipi di dati e if/else |
| 04 | Guess the Number |
| 05 | Input e numeri random |
| 06 | Funzioni e condizioni |
| 07 | Operatori booleani |
| 08 | Whac-A-Mole / parte 1 |
| 09 | Whac-A-Mole / parte 2 |
| 10 | *(coming soon)* |
| 11 | To-Do List |
| 12 | JSON e localStorage |
| 13 | Image Slideshow |
| 14 | Date e countdown |
| 15 | Bootstrap |
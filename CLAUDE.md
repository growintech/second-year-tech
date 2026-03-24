# CLAUDE.md — GIT Lesson Hub

## What this repo is

The official repository for all technical lesson materials for GIT (Grow in Tech) second-year JavaScript curriculum, published at `lessons.growintech.it` via GitHub Pages.

Lesson plan source files sit at the repo root as `.md` files (e.g. `LESSON-16.md`). Skills in `skills/` process those files to generate lesson folders and other static materials.

---

## Repo structure

```
/
├── CLAUDE.md                          ← this file
├── PRD.md                             ← product requirements
├── DESIGN.md                          ← design system
├── index.html                         ← root hub: list of all lessons
│
├── reference-material/
│   ├── LESSON-14.md                       ← lesson plan source (Date & Time)
│   ├── LESSON-15.md                       ← lesson plan source (Bootstrap)
│   └── LESSON-16.md                       ← lesson plan source (to be generated)
│
├── shared/
│   ├── style-intro.css                ← shared CSS for all intro/exercise pages
│   ├── style-ide.css                  ← shared CSS for all IDE pages
│   ├── app-intro.js                   ← shared JS for intro pages (theme, quiz, editors)
│   ├── app-ide.js                     ← shared JS for IDE pages (layout, CM, check)
│   └── logo.svg                       ← GIT logo SVG (do NOT modify)
│
├── lesson14-date_and_time/
│   ├── index.html
│   ├── logo.svg                   ← local copy for relative-path safety
│   ├── 01-explore.html
│   ├── 02-birthday.html
│   └── ...
│
├── lesson15-bootstrap/             ← Lesson 15 — canonical reference (intro+IDE style)
│   ├── index.html
│   ├── logo.svg
│   ├── 01-intro.html
│   ├── 01-ide.html
│   ├── 02-intro.html
│   ├── 02-ide.html
│   └── ...
│
└── skills/
    ├── generate-lesson/               ← /generate-lesson skill
    │   └── SKILL.md
    └── [future-skill]/
        └── SKILL.md
```

---

## Page types

Each lesson uses a consistent two-file pattern per activity:

| File | Purpose |
|------|---------|
| `{N}-intro.html` | Theory, reference snippets, mini-IDE exploration, quiz gate |
| `{N}-ide.html` | Full VS Code-style editor + live preview + validation |

The lesson index (`index.html`) lists all activities and links to their intro pages.

All pages share CSS and JS from `shared/` via relative paths (`../../shared/`).

---

## Canonical reference

**Lesson 15 (`lesson15/`)** is the canonical reference for the two-phase intro+IDE pattern. Read its files before generating any new lesson.

Lesson 14 uses a simpler single-file-per-activity pattern with inline editors — valid but older. New lessons should follow Lesson 15's structure.

---

## Available skills

| Command | Input | What it does |
|---------|-------|--------------|
| `/generate-lesson LESSON-16.md` | Lesson plan `.md` at repo root | Generates a full lesson folder with intro+IDE pages |

Additional skills can be added under `skills/` following the same structure.

---

## How to add a new lesson (instructor manual)

1. Write the lesson plan and save it as `LESSON-{N}.md` at the repo root
2. Run `/generate-lesson LESSON-{N}.md` in Claude Code
3. Claude reads `skills/generate-lesson/SKILL.md` and examines the reference lesson
4. Claude proposes the activity plan (scaffolding insertions labelled and justified)
5. Instructor approves or adjusts
6. Claude generates `lesson{N}/{slug}/` with all files
7. Commit and push → auto-deploy

---

## Ground rules

- **All files must work offline** — openable from `file://` with no server. Relative paths everywhere (`../../shared/`).
- **No local dependencies** — CDN only (Google Fonts, CodeMirror 5, Bootstrap 5 inside preview iframes only). CDNs must degrade gracefully.
- **No frameworks on the app shell** — vanilla HTML/CSS/JS. No React, Vue, Vite, Webpack.
- **Never modify `shared/`** unless explicitly asked — changes break all existing lessons.
- **Never modify existing lesson files** without explicit request.
- **Always read the reference lesson first** — before generating, inspect `lesson15/` to match structure, components and patterns exactly.

---

## Content language

| File | Language |
|------|----------|
| Root `index.html` (hub) | English |
| All lesson pages | English |
| `CLAUDE.md`, `PRD.md`, `DESIGN.md`, `SKILL.md`, lesson plan `.md` files | English |

---

## Hosting

GitHub Pages, domain `growintech.github.io/second-year-tech` via CNAME. Push to `main` → automatic deploy.

---

## Commit convention

Use the `git-commit` skill. Type `content` for new or modified lesson files, `docs` for CLAUDE.md / PRD.md / DESIGN.md / any SKILL.md.
---
name: generate-lesson
description: Generate GIT lesson pages or standalone student materials (project briefs, assignment guides) from a .md source file. Use this skill whenever the Admin Instructor provides a lesson plan or project brief and asks to generate HTML lesson files, activity pages, intro pages, IDE pages, or any student-facing material in the GIT format. Triggers on /generate-lesson, "generate the lesson", "create the pages for", "turn this into a lesson", "build the material for", or any request to produce HTML files from a .md source. Also use for standalone materials like mid-year project briefs, final project guides, or assignment pages even if they don't follow the lesson plan format.
---

# generate-lesson Skill

Converts a `.md` source file from `reference-material/` into a complete set of static HTML pages, following the GIT lesson format exactly.

---

## Step 0 — Read the reference lesson first

Before doing anything else, read these files:

```
lesson15/index.html
lesson15/01-intro.html
lesson15/01-ide.html
shared/style-intro.css    ← skim variable names and component classes
shared/style-ide.css      ← skim IDE layout structure
shared/app-intro.js       ← understand: runCode, checkStudentCode, initMiniIDE,
                               initSnippet, renderQuiz, checkQuiz, restoreQuizState
shared/app-ide.js         ← understand: IDE_STEP, IDE_NEXT_URL, validateStep contract
```

This is mandatory. You must match the existing pattern exactly — structure, component names, class names, localStorage keys, everything.

---

## Step 1 — Detect material type

Read the `.md` source file from `reference-material/`. Decide:

| Signal in the file | Type |
|--------------------|------|
| Contains a session brief table (Subject \| Activity \| Notes \| Time) | **Lesson** |
| Contains phases, tasks, rubric, timeline — no session brief | **Standalone material** |
| Ambiguous | Ask the Admin Instructor before proceeding |

---

## Step 2A — Lesson plan workflow

### 2A.1 Parse the lesson plan

Extract:
- Lesson number and title
- Rationale
- Learning goals
- All activities from the session brief table: name, duration, description, tutor notes, any code snippets

### 2A.2 Analyse difficulty curve

For each pair of consecutive activities, assess the difficulty jump. Flag a jump as **too steep** if any of these are true:

| Condition | Flag |
|-----------|------|
| A new JS concept is introduced directly in a complex exercise, with no guided exploration first | ⚠️ |
| An exercise combines two or more concepts that are both new in this lesson | ⚠️ |
| Students are asked to write code autonomously for the first time on a concept introduced only moments before | ⚠️ |

### 2A.3 Propose the activity plan

Present to the Admin Instructor before generating any file:

```
## Proposed activity plan — Lesson 16: Arrays

1. What is an array — guided exploration              [ORIGINAL · 15 min]
2. Read and write elements                            [ORIGINAL · 10 min]
2b. Push and pop — isolated practice                  [SCAFFOLDING · 10 min]
    → Introduces .push()/.pop() separately before the combined exercise.
3. Loop over an array                                 [ORIGINAL · 20 min]
4. Project: shopping list                             [ORIGINAL · 25 min]

Files to generate: lesson16/
  index.html
  01-intro.html + 01-ide.html
  02-intro.html + 02-ide.html
  02b-intro.html + 02b-ide.html
  03-intro.html + 03-ide.html
  04-intro.html + 04-ide.html

Proceed?
```

Wait for the Admin Instructor's approval or adjustments before generating any file.

### 2A.4 Generate the lesson folder

Once approved, generate `lesson{N}/` at the repo root containing:

**`index.html`** — lesson hub

- Topbar with GIT logo + lesson label + theme toggle
- Hero: lesson title, rationale, lead paragraph
- Collapsible "Before you start" card (`.before-card` pattern from `lesson15/index.html`)
- `.activity-grid` with one `.activity-card` per activity, linking to `NN-intro.html`
  - Scaffolding activities get a `[S]` prefix in the title
- "Before you start" section explaining the two-phase flow
- `<script src="../shared/app-intro.js"></script>` at end of body
- `<link rel="stylesheet" href="../shared/style-intro.css">` in head

**`{NN}-intro.html`** — one per activity

Required sections:
1. Topbar (GIT logo, `JS · Year 2 · Lesson N`, theme toggle)
2. Progress bar dots (`.progress-bar`)
3. Hero: activity badge + h1 + lead
4. Theory section: concept explanation, max 3 short paragraphs
5. Reference snippet (`.snippet-block` + `initSnippet()`) OR code block (`.code-block`) — use snippet-block for multi-line HTML/JS, code-block for short inline examples
6. Class switcher (`.class-switcher`) if introducing multiple related CSS classes or JS methods
7. Max 1–2 callouts — single sentence each
8. Mini-IDE (`initMiniIDE()`) — pre-filled starter, no validation, free exploration
9. Quiz gate — 2–3 multiple choice questions testing the theory
10. Nav footer: ← Back | Enter IDE → (disabled until quiz passed)
11. Scripts: CodeMirror CDN (in order: xml → javascript → css → htmlmixed), then `../shared/app-intro.js`

**`{NN}-ide.html`** — one per activity

Required sections:
1. Starter code in `<script type="text/html" id="starter-code">` — previous step's correct solution + comment placeholder
2. `#shell` > `#topbar` > `#main` > `#ide-nav` > `#status-bar` (exact structure from `lesson15/`)
3. `#panel-instructions` with task list and `.hints-section` (3 progressive hints)
4. `#panel-editor-console` with tab selector (HTML / JS), CodeMirror, `#check-result`
5. `#panel-preview` with iframe
6. `window.IDE_STEP`, `window.IDE_NEXT_URL`, `window.validateStep` defined inline before loading `app-ide.js`
7. `validateStep` uses string/regex checks only — no code execution
8. Scripts: CodeMirror CDN, then `../shared/app-ide.js`

**Starter code rule:** Never give the complete solution. Each IDE page's starter = previous IDE page's correct output + a `<!-- Step N: Add your X here -->` comment. Step 1 starter = Bootstrap CDN boilerplate + comment.

**Last IDE page:** `window.IDE_NEXT_URL` points to `./index.html`. Show a completion overlay (`.completion-card` pattern from `lesson15/05-ide.html`).

---

## Step 2B — Standalone material workflow

### 2B.1 Parse the document

Extract: title, phases or sections, tasks/instructions, rubric (if any), timeline (if any), resources (if any).

### 2B.2 Propose the page structure

Present a proposed outline to the Admin Instructor:

```
## Proposed structure — Final Project 2026

Single page: final-project/index.html
  → Hero (title, tagline)
  → Phase overview (visual timeline)
  → Phase 1 — Problem identification (instructions, deliverables)
  → Phase 2 — Solution definition
  → Phase 3 — Market validation (PerplexityAI note)
  → Phase 4 — Pitch deck
  → Phase 5 — Website development
  → Timeline table
  → Rubric
  → Resources

Or split into separate pages (index + 01-phase1.html … 05-phase5.html)?
```

Wait for approval before generating.

### 2B.3 Generate the material folder

Output goes to a named folder at the repo root (e.g. `final-project/`).

Use **intro-style pages only** — same CSS (`../shared/style-intro.css`), same components (cards, steps, callouts, code blocks), same topbar/theme toggle pattern.

No IDE pages, no quiz gate, no CodeMirror required (unless the material includes interactive code examples).

Use `.steps`, `.card`, `.callout`, `.code-block` freely. Render structured content (tables, timelines, rubrics) using cards and steps rather than raw HTML tables where possible.

---

## Naming conventions

| Element | Pattern | Example |
|---------|---------|---------|
| Lesson folder | `lesson{N}/` (repo root) | `lesson16/` |
| Standalone material folder | `{slug}/` (repo root) | `final-project/` |
| Activity files | `{NN}-intro.html` / `{NN}-ide.html` | `03-intro.html`, `03-ide.html` |
| Scaffolding activity | `{NN}b-intro.html` / `{NN}b-ide.html` | `02b-intro.html`, `02b-ide.html` |
| Lesson plan source | `reference-material/LESSON-{N}.md` | `reference-material/LESSON-16.md` |
| Material source | `reference-material/{SLUG}.md` (uppercase) | `reference-material/FINAL-PROJECT.md` |

---

## Shared asset paths

All pages in a lesson or material folder are **one level deep** from the repo root (`lesson16/`, `final-project/`, etc.), so shared assets are always reached with `../shared/`:

```html
<!-- In any lesson or material page -->
<link rel="stylesheet" href="../shared/style-intro.css">
<script src="../shared/app-intro.js"></script>

<!-- IDE pages -->
<link rel="stylesheet" href="../shared/style-ide.css">
<script src="../shared/app-ide.js"></script>
```

The GIT logo (`logo.svg`) should be copied into each lesson folder for `file://` safety. Reference it as `./logo.svg` within the folder.

---

## GIT pedagogical principles

When deciding how many scaffolding steps to insert and how to write theory sections, apply these principles:

- **Peer-to-peer, interactive** — students discover before being told. Write instructions that ask them to try first.
- **Gradual difficulty** — each activity should be achievable by students who succeeded at the previous one.
- **Starter code reduces friction, not learning** — always leave the meaningful challenge for the student. Never pre-fill the key concept.
- **One concept per activity** — if an activity introduces two new ideas, split it.
- **Explicit connections** — callouts that link new concepts to things already known help anchor learning.
- **Beginner audience** — students are 15–18 years old, know HTML/CSS from Year 1, and are new to programming logic. Avoid jargon. Explain with analogies.

---

## Quality checklist before committing

- [ ] All pages link to `../shared/style-intro.css` (or `style-ide.css`) — no inline full CSS
- [ ] CodeMirror mode load order on intro pages: xml → javascript → css → htmlmixed
- [ ] Each IDE page has `window.IDE_STEP`, `window.IDE_NEXT_URL`, `window.validateStep` defined before `app-ide.js` loads
- [ ] Starter code for step N = correct solution of step N-1 + placeholder comment
- [ ] Relative paths only — no absolute URLs for local assets
- [ ] Bootstrap 5.3 CDN only inside preview iframes, never on app shell
- [ ] Pages open correctly from `file://` locally (mental check)
- [ ] Activity count in `index.html` matches the actual number of files generated
- [ ] Source `.md` file is in `reference-material/` and committed alongside generated files
- [ ] `logo.svg` is present in the lesson folder
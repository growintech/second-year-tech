# PRD — GIT Lesson Hub

## What it is

A static repository containing all technical lesson materials for the GIT (Grow in Tech) second-year JavaScript curriculum, published at `growintech.github.io/second-year-tech`.

Materials are pure HTML/CSS/JS files. Students open them in the browser during class to follow theory, complete exercises, and check their work. University tutors use them as a live teaching guide.

---

## Context

GIT is a coding education programme for Italian high schools. The second year focuses on JavaScript. Lessons are taught by paid university STEM students using a peer-to-peer methodology. Materials must work in any classroom on any PC, with nothing to install.

**Net@** is the name of the specific school programme students are enrolled in. When lesson content refers to a project students are building (e.g. a landing page), that project is for Net@.

---

## Users

| User | Role |
|------|------|
| **Admin Instructor** | Curriculum designer. Writes source `.md` files, runs skills, reviews output, commits to the repo. |
| **University tutors** | Use the pages as a live teaching guide during the 90-minute session. |
| **Students** | Open the pages to follow theory and complete exercises in class. |

---

## Material types

The repo contains two types of student-facing material, both rendered as the same kind of static HTML page:

### 1. Lessons

A lesson is a numbered set of activities. Each activity has:

- **Intro page** (`{N}-intro.html`) — theory, reference snippets, mini-IDE for exploration, quiz gate
- **IDE page** (`{N}-ide.html`) — full VS Code-style editor, live preview iframe, string-based validation

The lesson folder also contains an **index** (`index.html`) listing all activities.

```
lesson{N}/{slug}/
├── index.html             ← activity list, rationale, before-you-start info
├── logo.svg               ← GIT logo (local copy for file:// safety)
├── 01-intro.html
├── 01-ide.html
├── 02-intro.html
├── 02-ide.html
└── ...
```

All CSS and JS comes from `../../shared/` via relative paths.

### 2. Standalone materials

Project briefs, assignment guides, mid-year or final project instructions. These are rendered as **intro-style pages** (same visual design, same components) without an IDE pairing. One or more HTML files, no lesson hub needed.

Examples:
- `mid-year-project/index.html` — project brief, phases, rubric, timeline. File structure shall be like the `lesson{N}-{slug}` with an `index.html` containing a brief of the 
- `final-project/index.html` — idem for the final project

---

## The `generate-lesson` skill

The primary skill for producing new material. Takes a source `.md` file at the repo root and generates the complete output folder.

### Invocation

```
/generate-lesson LESSON-16.md
/generate-lesson MIDYEAR-PROJECT.md
/generate-lesson FINAL-PROJECT.md
```

### What the skill does

**For a lesson plan** (file contains session brief with Subject | Activity | Notes | Time table):

1. Parses activities from the session brief
2. Analyses the difficulty curve
3. Inserts scaffolding activities where the jump is too steep
4. **Presents the activity plan to Admin Instructor** — originals + insertions clearly labelled, each insertion justified in one sentence
5. Waits for approval
6. Generates `lesson{N}/{slug}/` with index + all intro/IDE page pairs

**For standalone material** (project brief, assignment guide):

1. Parses the document structure (phases, tasks, rubric, timeline, resources)
2. Proposes an HTML page structure to Admin Instructor
3. Waits for approval
4. Generates one or more intro-style HTML pages

### Scaffolding insertion criteria (lessons only)

| Trigger | Action |
|---------|--------|
| New concept introduced directly into a complex exercise | Insert a guided exploration activity first |
| Exercise combining two new concepts | Split into two separate exercises |
| First time students write code autonomously | Provide a more complete starter scaffold |

Inserted activities are marked `[SCAFFOLDING]` in the proposal and justified in one sentence.

### Example — lesson workflow

```
Admin Instructor:  Here's the plan for Lesson 16 (Arrays). [LESSON-16.md at root]

Claude:   Found 4 activities. Proposing one insertion between 2 and 3:

          1. What is an array — guided exploration         [ORIGINAL]
          2. Read and write elements                       [ORIGINAL]
          2b. Push and pop — isolated practice             [SCAFFOLDING — introduces
              .push/.pop separately before the combined exercise]
          3. Loop over an array                            [ORIGINAL]
          4. Project: shopping list                        [ORIGINAL]

          Proceed?

Admin Instructor:  Yes.

Claude:   [generates lesson16/arrays/ with all files]
```

### Example — standalone material workflow

```
Admin Instructor:  Here's the final project brief. [FINAL-PROJECT.md at root]

Claude:   I'll render this as a single intro-style page. Proposed sections:
          Hero → Phase overview → Phase details (1–5) → Timeline → Rubric → Resources

          Proceed?

Admin Instructor:  Yes, but split phases into separate pages. [this is the standard: different phases have different pages]

Claude:   [generates final-project/ with index.html + 01-problem.html + ... ]
```

---

## Technical requirements

- **Works offline** — openable from `file://` on any PC, no server required
- **No local dependencies** — CDN only (Google Fonts, CodeMirror 5, Bootstrap 5 inside preview iframes only)
- **No frameworks on the app shell** — vanilla HTML/CSS/JS
- **Relative paths everywhere** — `../../shared/style-intro.css`, `../../shared/app-intro.js`, etc.
- **Bootstrap 5.3 only inside preview iframes** — never on the app shell

---

## Non-goals

- ❌ User authentication or accounts
- ❌ Student progress tracking
- ❌ Backend or database of any kind
- ❌ Instructor dashboard
- ❌ Build tools (Vite, Webpack, etc.)
- ❌ Deployment pipeline beyond GitHub Pages

---

## Hosting

GitHub Pages, custom domain `lessons.growintech.it` via CNAME. Push to `main` → automatic deploy. Lessons are served from both `lessons.growintech.it/` and the default `growintech.github.io/second-year-tech` URL — relative paths must work on both.
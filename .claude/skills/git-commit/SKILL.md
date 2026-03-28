---
name: git-commit
description: Write genuinely useful git commit messages. Triggers whenever Claude Code is about to run git commit. Enforces conventional commits format with project-specific scopes, requires showing the message before committing, and flags unrelated staged changes.
---

# Commit Message Skill

## Purpose
Write genuinely useful git commit messages that explain what changed and why, not just what files were touched. This skill triggers whenever Claude Code is about to run `git commit`.

## The problem this solves
Bad commit messages make the git log useless:
- `fix bug`
- `update files`
- `changes`
- `wip`
- `minor stuff`

A good commit message lets you (or a collaborator) understand what happened six months later without reading the diff.

---

## Format to always use

```
<type>(<scope>): <short summary in present tense, max 60 chars>

<body — what changed and why, not how. wrap at 72 chars.>

<footer — breaking changes, closes #issue, co-authors if any>
```

The body and footer are optional for small changes. The first line is always required and always meaningful.

---

## Type prefixes

| Type | When to use |
|------|-------------|
| `feat` | New feature or capability added |
| `fix` | Bug fix |
| `refactor` | Code restructured without behavior change |
| `style` | CSS/visual changes only, no logic change |
| `content` | Lesson text, instructions, copy changes |
| `chore` | Config, deps, tooling, CI — nothing a student would notice |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `docs` | README, CLAUDE.md, comments, PRD files |
| `revert` | Reverting a previous commit |

---

## Scope examples for this project

Use the part of the codebase that was primarily changed:

- `shared` — shared CSS/JS files
- `lesson14` — anything in lesson14/
- `lesson15` — anything in lesson15/
- `ide` — IDE layout, editor, panels
- `intro` — theory/intro pages
- `auth` — Supabase auth, login, session
- `dashboard` — student dashboard
- `admin` — admin panel
- `design-system` — CSS variables, tokens, theming
- `root` — root index.html, top-level files

---

## Rules

1. **Never use vague verbs**: update, change, modify, fix stuff, adjust, tweak → describe *what* specifically
2. **Present tense, imperative mood**: "add dark mode toggle" not "added dark mode toggle" or "adding dark mode toggle"
3. **No period at the end of the first line**
4. **The summary must be self-explanatory without reading the diff**: if someone reads only the first line in `git log --oneline`, they should know what happened
5. **Body explains WHY, not HOW**: the diff shows how. The message explains the reasoning.
6. **Group related changes in one commit**: don't commit 12 unrelated things together just because they happened in the same session. If changes are unrelated, stage and commit them separately.
7. **Never include file lists in the message**: "updated style.css and app.js" is useless. Say what the change does.

---

## Before committing — checklist

Run through this before writing the message:

- [ ] Are all staged changes actually related to each other?
- [ ] Can I describe the change in one sentence without saying "and also"? (If not, split into multiple commits)
- [ ] Does the summary answer "what does this commit do?" not "what files did I touch?"
- [ ] If this breaks something in the future, will this message help someone understand what changed?

---

## Examples — bad vs good

### Refactor
```
# BAD
refactor: update files

# GOOD
refactor(shared): consolidate per-lesson CSS into shared/style-intro.css and style-ide.css

Removes duplicate variable definitions and component styles that were
copied across lesson14 and lesson15. Each lesson folder previously had
its own style.css — now all intro pages share one file and all IDE pages
share another. Zero visual changes, relative paths updated in all HTML files.
```

### Bug fix
```
# BAD
fix: fix navbar bug

# GOOD
fix(lesson15): prevent preview iframe from navigating on navbar link click

Navbar anchor tags in starter code and reference snippets used href="#"
which caused the preview iframe to reload the parent page on click.
Changed all example nav links to href="javascript:void(0)".
```

### New feature
```
# BAD
feat: add stuff to ide

# GOOD
feat(ide): add resizable panels with drag handles between all panes

Implements mousedown/mousemove/mouseup drag logic for both split-pane
(vertical handles) and top-down (horizontal handles) layouts. Panel
sizes persist in localStorage key git-panel-sizes. Minimum panel
size enforced at 120px to prevent accidental collapse.
```

### Content change
```
# BAD
update: lesson content

# GOOD
content(lesson14): add quest-style hints to countdown banner exercise

Replaces flat instruction list in 07-countdown.html with three
progressive hints, each more specific than the last. Hints track
usage count per step for the completion summary. No changes to
validation logic or starter code.
```

### Chore
```
# BAD
chore: misc

# GOOD
chore: add 5 Claude Code skills from everything-claude-code repo

Added api-design, backend-patterns, coding-standards, nextjs-turbopack,
and e2e-testing to .claude/skills/. Also added prompt-optimizer,
search-first, security-review, security-scan, verification-loop.
Committed CLAUDE.md at repo root with full project context.
```

---

## When Claude Code is writing the commit

Before running `git commit`, Claude Code must:

1. Run `git diff --staged` to review exactly what is staged
2. Identify the primary type and scope from the diff
3. Write a summary that describes the *effect* of the change, not the mechanism
4. If the diff contains unrelated changes, flag this and ask whether to split into separate commits before proceeding
5. Include a body paragraph if the change is non-trivial (more than a one-line fix)
6. Show the proposed commit message to the user and wait for approval before running `git commit`
7. After a successful commit, immediately run `git push` to push to GitHub

Do not run `git commit -m "..."` silently. Always show the message first.
Always push after committing — do not ask for a separate confirmation.

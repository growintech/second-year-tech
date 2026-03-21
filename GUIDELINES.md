# Grow in Tech — Year 2 JavaScript Project Guidelines

This document outlines the design consistency and learning methodology for the **Year 2 JavaScript** interactive lesson guides. It serves as the primary reference for adding new lessons or extending existing ones.

---

## 1. Project Context

- **Audience**: High school students (15–18 years old) in Italy. They know HTML/CSS but are beginners in programming logic.
- **Instructors**: University STEM students using these materials during live classes.
- **Environment**: Browser-based interactive lesson guides.
- **Language**: Core lesson content and UI are in **English** (for pedagogical reasons).

---

## 2. Technical Constraints

- **Deployment**: Vercel, Supabase, and GitHub stack.
- **Allowed CDNs**: Google Fonts, CodeMirror 5, and Bootstrap 5 (only inside preview iframes, never on the main app shell).
- **Paths**: Always use relative paths (`./`), as files might be served from different local or remote paths.
- **Persistence**: Use `localStorage` exclusively for UI preferences (theme, layout arrangements) and temporary in-lesson states (e.g., passing a quiz or saving editor buffer). Long-term student code storage will be supported by design via Supabase (it isn't currently).
---

## 3. Design Consistency & Visual Identity

All lesson guides share a unified **dark-first** aesthetic.

### 3.1 Colors (CSS Variables)
Use the established CSS variables. Light mode is activated by adding the `.light` class to the `<html>` element.

```css
/* Core Dark Theme */
--bg: #0a0c10;
--surface: #13161d;
--surface-2: #1b1f28;
--border: rgba(255, 255, 255, 0.07);
--border-2: rgba(255, 255, 255, 0.13);
--text: #e8eaf0;
--text-muted: #7a8099;
--text-dim: #4a5070;

/* Gradients & Accents */
--grad-start: #00E1FF;
--grad-end: #0061FF;
--grad: linear-gradient(135deg, var(--grad-start), var(--grad-end));
--green: #22c55e;
--yellow: #eab308;
--red: #ef4444;
```

### 3.2 Typography & Elements
- **Fonts**: `DM Sans` for body text and UI; `DM Mono` for code and file paths.
- **Topbar**: Must feature the GIT SVG Logo (48px height), the full breadcrumb lesson label (e.g., `JS · Year 2 · Lesson 15 › Bootstrap Guide › Step 1 — Navbar`), a centrally positioned `.pills-group` (VS Code style rectangular segmented buttons: Instructions, Editor, Console, Preview), and the Layout/Theme Toggle buttons (☀️/🌙) on the right.
- **Reusable Components**: Stick to existing class names like `.card`, `.callout` (with `.callout-info`, `.callout-tip`, `.callout-warn` variants), `.activity-badge`, and `.progress-bar` (only for Intro pages, never IDE pages). Use `.class-switcher` for tabbed content presentation.
- **UI Best Practices for Intro Pages**: 
  - Keep paragraphs very short for readability.
  - Callouts must be single-column and limited to one concise sentence. Use at most 1 or 2 callouts per page to minimize distraction.
  - When presenting a list of concepts or CSS classes, use the `.class-switcher` tab-like behavior to show one item at a time, keeping others hidden to prevent cognitive overload.
  - For **Reference Snippets**, use `.snippet-block` (not `.code-block`) wrapping a `<textarea>` initialized by `initSnippet()`. This renders a read-only CodeMirror with VS Code dark/light theme.
  - **Critical:** intro pages must load CodeMirror modes in this exact order: `xml.min.js` → `javascript.min.js` → `css.min.js` → `htmlmixed.min.js`. Missing dependency modes silently break syntax highlighting.

---

## 4. The "Intro -> IDE" Learning Style

Recent complex lessons (like Lesson 15) use a structured **Two-Phase Flow** for each learning step. This approach should be replicated for topics requiring deep focus and progressive building.

### Flow Overview
```text
Step 1 Intro → Step 1 IDE → Step 2 Intro → Step 2 IDE → ... → Completion
```

### Phase 1: Intro Pages (`0N-intro.html`)
The goal of the intro page is to explain the concept and verify understanding before allowing the student to write actual code.
1. **Theory**: Short explanation of the concept, including visual examples and `.callout` boxes for tips/warnings.
2. **Mini-IDE**: A small, pre-filled sandbox (CodeMirror + preview frame) where students can click "Run" and freely change values to see what happens. No validation is applied here.
3. **Quiz Gate**: 2-3 multiple-choice questions testing the theory. 
4. **Progression**: The "Enter IDE →" button remains **disabled** until the quiz is successfully passed. The success state is stored in `localStorage` (e.g., `quiz-passed-N`).

### Phase 2: IDE Pages (`0N-ide.html`)
A standalone VS Code-style environment where the student implements the step's requirements.
1. **Layout**: The `body` must be exactly `100vh` with `overflow: hidden`. All layout panels are wrapped inside a `#shell` container equipped with `display: flex; flex-direction: column; flex: 1; min-height: 0;`. This strict flex-column structure guarantees the bottom navigation (`#ide-nav`) and status bar (`#status-bar`) remain permanently pinned to the absolute bottom of the viewport. Topbar offers "Split" (flex-row) or "Top-down" (flex-column) views.
2. **Panels**:
   - **Instructions**: A vertically scrollable (`overflow-y: auto`) panel containing a checkbox-style task list (`.task-list`, explicitly block-level to text-wrap code accurately) and a progressive/collapsible Hints system.
   - **Editor**: A full CodeMirror instance supporting HTML/JS tabs. The editor state saves continuously to `localStorage`.
   - **Preview**: An iframe that renders the student's code live. Iframe `pointer-events` are temporarily disabled via JS during panel resizing to ensure drag smoothness.
   - **Console**: Displays any JavaScript execution errors or validation failures.
3. **Validation**: String-based checking (e.g., regex or `.includes()`) of the student's HTML/JS. 
   - Uses a **"Check"** button to run validation.
   - Provides green inline success messages or red specific error feedback.
4. **Progression**: The "Next Step →" button remains **disabled** until the validation passes.

### Starter Design
- **Never give the complete solution outright.** 
- The starter code for Step *N* should be the correct completed code of Step *N-1*, plus an explicit comment placeholder indicating where the new work goes (e.g., `<!-- Step 2: Add your Hero here -->`).

---

## 5. Hub Page (`index.html`)

The root directory contains the student-facing dashboard. 
- **Style**: High-contrast, energetic, light background. Uses the full GIT brand palette (Cyan, Lime, Mint, Electric Blue, Navy) and `Barlow Condensed` for headers.
- **Language**: Written in **Italian**.
- Indicates unlocked vs. upcoming ("PROSSIMAMENTE") lessons.

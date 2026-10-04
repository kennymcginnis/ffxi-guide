# FFXI Return Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a no-build Docsify guide that gives this returning player a COR-first 75–99 route, leveling gear checkpoints, a post-99 queue, and persistent browser progress.

**Architecture:** Dated Markdown files are the durable guide and remain readable without JavaScript. A small framework-independent progress model owns validation and calculations; a Docsify plugin connects it to task-list checkboxes, browser storage, and dashboard controls. Python checks the published documentation graph while Node's built-in test runner exercises custom JavaScript behavior.

**Tech Stack:** Docsify 4 from pinned jsDelivr URLs, Markdown, CSS, browser JavaScript modules, Node built-in test runner, Python standard library, GitHub Pages from `/docs`.

**Spec:** `docs/superpowers/specs/2026-10-03-ffxi-return-command-center-design.md`

## Global Constraints

- No application build step, runtime backend, npm dependency installation, account, analytics, or cloud state.
- Deploy directly from `/docs`; include `.nojekyll`; all guide content must remain useful as plain Markdown.
- Store only versioned personal progress in `localStorage`; invalid imports must not overwrite existing state.
- Use stable task IDs and preserve recognized IDs when stored content is older or contains unknown tasks.
- Use CSS and typography only; ship no Square Enix logos, screenshots, or copied game art.
- Prefer official Square Enix/PlayOnline sources; label and date community operational guidance.
- Optimize the existing character's mostly-solo COR 75–99 route, then i117/i119 and weekend-group readiness.

## Review Focus

- Storage access can throw or be disabled: the UI must keep session progress and explain that it is temporary (Task 1 tests adapter failure; Task 2 smoke-checks the notice path).
- Imports can be malformed, from another schema, or contain unknown IDs: reject malformed/incompatible input and retain only recognized IDs without destroying current state (Task 1 tests each case).
- A content edit can duplicate or remove a task ID: site verification must reject duplicate IDs and dashboard references to missing IDs (Task 3 tests controlled bad fixtures).
- GitHub Pages serves the project from a repository subpath: all site navigation and assets must use relative or Docsify-root paths that work under the configured base (Task 2 local subpath smoke test; Task 3 link checks).
- A narrow screen can make tables or controls unusable: CSS must keep tables scrollable and controls reachable at 375 px (Task 4 browser smoke test).

---

### Task 1: Progress model and persistence boundary

**Files:**
- Create: `docs/assets/progress-model.js`
- Create: `tests/progress-model.test.mjs`

**Interfaces:**
- Produces: `createEmptyProgress()`, `normalizeProgress(value, knownTaskIds)`, `calculateProgress(taskIds, completedTaskIds)`, `findNextTask(tasks, completedTaskIds)`, `parseProgressImport(text, knownTaskIds)`, and `createProgressStore(storage, key)`.
- `Task` is `{ id: string, title: string, required: boolean, phase: string }`; progress is `{ version: 1, completedTaskIds: string[], lastVisitedPhase: string | null }`.

- [ ] **Step 1: Write failing model tests** for empty/non-empty totals, required next-task order, malformed JSON, wrong schema version, unknown-ID filtering, storage read/write, and throwing storage fallback. Each expectation uses literal fixtures and observable return values.
- [ ] **Step 2: Run `node --test tests/progress-model.test.mjs`** and verify it fails because `docs/assets/progress-model.js` does not exist.
- [ ] **Step 3: Implement the exported model functions** with schema version `1`; imports return `{ ok: true, value }` or `{ ok: false, error }`; the store exposes `{ persistent, load, save, clear }` and switches to in-memory state when storage throws.
- [ ] **Step 4: Run `node --test tests/progress-model.test.mjs`** and verify all tests pass with zero warnings.
- [ ] **Step 5: Commit** with `git add docs/assets/progress-model.js tests/progress-model.test.mjs && git commit -m "feat: add guide progress model"`.

### Task 2: Docsify shell and interactive progress plugin

**Files:**
- Create: `docs/index.html`
- Create: `docs/.nojekyll`
- Create: `docs/assets/progress-plugin.js`
- Create: `docs/assets/theme.css`
- Create: `tests/progress-plugin.test.mjs`

**Interfaces:**
- Consumes: all Task 1 exports.
- Produces: `extractTasks(root)`, `renderProgress(root, state)`, and `installProgressPlugin(hook, vm, options)`; recognizes task metadata from inline `<span data-task-id="ID" data-task-phase="PHASE" data-task-required="true|false"></span>` markers and dashboard slots marked with `data-progress-*` attributes.

- [ ] **Step 1: Write failing plugin tests** using a minimal fake DOM fixture for task extraction, restored checkbox state, next-action rendering, and the temporary-progress notice when the supplied store reports `persistent: false`.
- [ ] **Step 2: Run `node --test tests/progress-plugin.test.mjs`** and verify it fails because the plugin module does not exist.
- [ ] **Step 3: Implement the Docsify shell and plugin** with relative asset URLs, pinned Docsify/search CDN URLs, event delegation, accessible export/import/reset controls, and non-destructive import errors. Keep storage/model logic out of the DOM adapter.
- [ ] **Step 4: Run `node --check docs/assets/progress-model.js`, `node --check docs/assets/progress-plugin.js`, and `node --test tests/progress-plugin.test.mjs tests/progress-model.test.mjs`** and verify all syntax and JavaScript tests pass.
- [ ] **Step 5: Start `python3 -m http.server 3000 --directory docs` and smoke-test** `/`, task toggling, reload persistence, export/import, reset, and the site at a nested GitHub Pages-style path; stop the server afterward.
- [ ] **Step 6: Commit** with `git add docs/index.html docs/.nojekyll docs/assets tests/progress-plugin.test.mjs && git commit -m "feat: add interactive Docsify shell"`.

### Task 3: Battle-plan content and documentation graph

**Files:**
- Create: `docs/_sidebar.md`
- Create: `docs/2026-10-03/battle-plan.md`
- Create: `docs/2026-10-03/return-setup.md`
- Create: `docs/2026-10-03/cor-75-99.md`
- Create: `docs/2026-10-03/post-99.md`
- Create: `docs/2026-10-03/weekend-cor.md`
- Create: `docs/2026-10-03/choose-next-job.md`
- Create: `docs/2026-10-03/roster.md`
- Create: `docs/2026-10-03/since-2010.md`
- Create: `docs/2026-10-03/sources.md`
- Create: `scripts/check_site.py`
- Create: `tests/test_site.py`

**Interfaces:**
- Consumes: Task 2's inline task-marker and dashboard-slot contract.
- Produces: unique task IDs; dashboard phase/task metadata; all Docsify sidebar and Markdown link targets; readable source labels (`Official` or `Community`, plus access date).

- [ ] **Step 1: Write failing Python integrity tests** that build controlled temporary documentation fixtures and prove the checker rejects duplicate task IDs, missing sidebar/internal links, and dashboard task references that are absent. Add a passing-fixture case so the checker itself is not fail-only.
- [ ] **Step 2: Run `python3 -m unittest tests/test_site.py -v`** and verify it fails because the site checker and guide pages do not exist.
- [ ] **Step 3: Implement the site checker and Markdown pages** with the approved phase order, COR recommendation, limit-break/Trust/Rhapsodies route, gear checkpoints at return/75–80/80–90/90–98/99/i117/i119, ordered post-99 todo list, weekend COR minimums, roster, glossary, and source-quality labels. Mark uncertain server/campaign details as verify-in-game rather than presenting them as fixed facts.
- [ ] **Step 4: Run `python3 -m unittest tests/test_site.py -v` and `node --test tests/*.test.mjs`** and verify all content and interaction tests pass.
- [ ] **Step 5: Serve the site and browser-smoke-test** every sidebar route, external source links' presence, direct raw Markdown readability, dashboard next-action changes, and post-99 surfacing after the level-99 task is checked.
- [ ] **Step 6: Commit** with `git add docs/_sidebar.md docs/2026-10-03 tests/test_site.py && git commit -m "docs: add personalized FFXI battle plan"`.

### Task 4: Project handoff and final visual verification

**Files:**
- Create: `README.md`
- Modify: `docs/assets/theme.css`

**Interfaces:**
- Consumes: Tasks 1–3's preview commands, progress behavior, and `/docs` publication layout.
- Produces: local preview instructions, GitHub Pages branch-folder deployment steps, content-update/task-ID rules, progress backup guidance, and CDN/offline limitation.

- [ ] **Step 1: Write the README** with `python3 -m http.server 3000 --directory docs`, Pages deployment from branch `/docs`, progress export/import behavior, source/content update rules, and the pinned external Docsify dependency.
- [ ] **Step 2: Run the full automated suite** with `node --test tests/*.test.mjs && python3 -m unittest discover -s tests -p 'test_*.py' -v` and verify zero failures.
- [ ] **Step 3: Serve and visually inspect** at 375×812 and 1440×900: home hierarchy, sidebar, progress controls, focus states, task rows, gear tables, source labels, and horizontal table scrolling.
- [ ] **Step 4: Run `git diff --check`** and verify no whitespace errors.
- [ ] **Step 5: Commit** with `git add README.md docs/assets/theme.css && git commit -m "docs: document and polish guide"`.

### Task 5: Whole-branch verification and review

**Files:**
- Modify only files required by Critical or Important review findings.

**Interfaces:**
- Consumes: complete implementation and the design spec.
- Produces: fresh verification evidence, two-axis code review, and one fix pass if required.

- [ ] **Step 1: Run the full automated suite** and retain the zero-failure output.
- [ ] **Step 2: Run a fresh local browser smoke test** of the published `/docs` tree at phone and desktop widths.
- [ ] **Step 3: Invoke `/code-review`** against the design commit `6350f10`, reviewing Standards and Spec in parallel as required by the named skill.
- [ ] **Step 4: Re-grade findings and perform one TDD fix pass** for any Critical or Important issue, then rerun the full suite; ledger Minor findings for handoff.
- [ ] **Step 5: Commit review fixes if any** with a focused commit message, then verify `git status --short` contains no unintended files.

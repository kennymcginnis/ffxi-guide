# FFXI Return Command Center Design

## Purpose

Build a personal, mobile-friendly guide for a player returning to Final Fantasy XI after last playing in 2010. The guide must turn a large amount of unfamiliar modern progression into one clear next action at a time. It should favor a fast, sustainable, mostly-solo return over a brittle speedrun or an immediate raid-readiness grind.

The player's existing character is the primary route. The starting roster is the one shown in the supplied screenshot, including COR, RNG, SMN, THF, and WAR at level 75; NIN at 70; several jobs in the 60s; and only old level-75-era equipment. Account recovery failure may receive a short fallback note, but the guide will not maintain a parallel fresh-character plan.

## Recommended Progression Strategy

The guide will recommend Corsair as the first job to level from 75 to 99. COR starts at the old cap, can progress with Trusts, and has a useful party identity through Phantom Roll before its damage sets are finished. The recommendation is intentionally balanced: COR is not presented as cheap to perfect, and high-end gear requirements will be stated plainly.

The battle plan has five phases:

1. Reorient the account and unlock the modern solo toolkit: Trusts, Records of Eminence, current travel systems, and early Rhapsodies of Vana'diel rewards.
2. Level COR from 75 to 99 through the post-75 limit breaks with a practical solo route and optional group accelerators.
3. Replace obsolete equipment, establish an item-level baseline, and reach i119 through Records of Eminence, Sparks, intermediate objectives, and Ambuscade.
4. Build a minimum viable weekend-group COR: rolls, support habits, essential equipment categories, and content-readiness checks.
5. Choose a longer-term main or secondary job after the foundation is complete. The guide will summarize BRD, THF, WAR, healer, tank, and other routes without asking the player to build them all.

Detailed factual support and source links live in `docs/research/2026-returning-player-leveling-path.md`. Official Square Enix and PlayOnline sources are preferred. Operational advice that only exists in community guides must be labeled as community guidance and dated.

## Leveling Gear Lane

Every leveling phase will include a parallel gear lane so the player never has to guess whether equipment is worth chasing.

Each gear checkpoint will answer:

- What can remain from the old level-75 set for the moment?
- What easy Records of Eminence, Sparks, quest, NPC, or inexpensive auction-house replacement is appropriate now?
- Which COR statistics and equipment slots matter for solo leveling and reliable rolls?
- What should be skipped because it will be replaced quickly at the next item-level milestone?
- What inventory can be safely stored or retired, without claiming that rare or sentimental items should be discarded?

The guide will provide checkpoints for the return setup, levels 75–80, 80–90, 90–98, initial level 99, i117, and i119. It will avoid prescribing an exhaustive best-in-slot set during the leveling phase.

## Post-99 Todo Queue

Reaching 99 changes the objective from character level to item level and job readiness. The home page will automatically surface a post-99 queue once the level-99 milestone is checked.

The ordered queue will cover:

1. Claim or buy a complete i117 baseline so old level-75 pieces are no longer carrying the build.
2. Complete the relevant Records of Eminence tutorial/intermediate objectives.
3. Unlock and begin approachable i119 and Ambuscade progression.
4. Assemble COR's minimum roll/support equipment and learn the expected roll toolkit.
5. Establish a practical solo/farming fallback, with THF as the suggested second investment rather than a simultaneous project.
6. Begin Capacity Points and Job Points only after the item-level floor is secure.
7. Defer Master Levels until COR is mastered and the core equipment/readiness checks are complete.
8. Join a social linkshell and use the weekend-readiness checklist before entering higher-level group content.

Tasks will distinguish required foundations, useful upgrades, and long-term goals so the queue does not imply that expensive endgame equipment is required before joining any group.

## Information Architecture

The site will use Docsify and mirror the proven no-build organization in `/Users/kmcgin1/workspace/kennymcginnis/rsl-teams`:

- `docs/index.html` configures Docsify, search, theme overrides, and the progress plugin.
- `docs/_sidebar.md` is the navigation source.
- `docs/.nojekyll` supports branch-based GitHub Pages deployment from `/docs`.
- Dated Markdown pages under `docs/2026-10-03/` contain the guide.
- Plain CSS and JavaScript under `docs/assets/` provide styling and progressive enhancement.

The initial page set is:

- `battle-plan.md`: home page, next action, total progress, and phase summary.
- `return-setup.md`: account reorientation and modern solo-system unlocks.
- `cor-75-99.md`: leveling, limit breaks, camp guidance, and leveling gear checkpoints.
- `post-99.md`: the ordered i117/i119 and COR-readiness todo queue.
- `weekend-cor.md`: minimum useful group toolkit and expectations.
- `choose-next-job.md`: post-foundation job branches, including BRD.
- `roster.md`: the supplied starting job levels and known equipment context.
- `since-2010.md`: concise glossary and changes since the level-75 era.
- `sources.md`: dated source notes and official/community labels.

The underlying Markdown must remain useful when printed or read directly on GitHub.

## Interaction Model

Markdown task lists become interactive through a small Docsify plugin. Each trackable task has a stable task ID encoded in the Markdown. The plugin will:

- restore checked state after Docsify renders a page;
- save task completion to `localStorage`;
- calculate per-phase and overall progress;
- identify the first incomplete required task as "Your next move";
- expose progress export, import, and reset controls;
- update the home page when a phase milestone, including level 99, is completed.

The stored record will be versioned and contain completed task IDs, optional task notes if included in the final content, and the last visited phase. Content remains the source of truth; local storage records only personal state.

If browser storage is unavailable, checkboxes continue to work for the current page session and a small notice explains that progress is temporary. Import validates its schema before changing existing progress. Unknown task IDs are ignored so content changes do not corrupt the guide.

## Visual Design

The site should feel like a restrained Vana'diel field manual rather than an unmodified documentation theme. It will use warm parchment surfaces, deep navy or ink text, muted crystal-blue and gil-gold accents, compact status chips, and generous mobile spacing. Visuals will be made from CSS, typography, and simple geometric decoration only. No Square Enix logos, screenshots, or copied game art will ship with the site.

The guide must work at narrow phone widths and on desktop. Tables must scroll horizontally rather than break the viewport. Interactive controls require visible keyboard focus, labels, and adequate contrast.

## Deployment

The project has no application build step and no runtime backend. GitHub Pages will deploy directly from the repository's `/docs` folder, as in `rsl-teams`. Docsify assets load from a pinned jsDelivr version. Local preview uses a simple HTTP server because Docsify fetches Markdown over HTTP.

The README will document:

- local preview;
- GitHub Pages branch-and-folder setup;
- content update conventions;
- how progress persistence and exports work;
- the external CDN requirement.

## Testing and Verification

Implementation will follow test-first development for custom behavior. The progress model will be isolated from DOM wiring so its calculations and import validation can be tested with Node's built-in test runner without a package install. Static documentation checks may use Python from the standard library, following the existing `rsl-teams` pattern.

Verification will cover:

- progress totals and next-task selection;
- storage unavailable or malformed data;
- valid and invalid imports without destructive overwrite;
- preservation of recognized task IDs across schema/content changes;
- unique, stable task IDs;
- sidebar targets and internal Markdown links;
- expected Docsify configuration and `.nojekyll` presence;
- local browser smoke tests at phone and desktop widths;
- readable Markdown without JavaScript.

## Non-Goals

- A general-purpose FFXI leveling calculator.
- Multi-user accounts or cloud synchronization.
- Live game APIs, auction-house prices, server population, or event schedules.
- A fresh-character guide equal in scope to the returning-character route.
- Complete best-in-slot gear sets or promises of acceptance into every endgame group.
- A Remix, Vite, React, Cloudflare, database, or authentication stack.

## Success Criteria

The guide succeeds when the returning player can open it on a phone, immediately see the next useful action, check off progress over multiple sessions, understand what to equip without wasting time on temporary gear, reach 99 on COR through a mostly-solo route, and continue into a specific i119 and weekend-group-readiness queue. It must remain deployable to GitHub Pages by publishing the `/docs` directory with no build service.

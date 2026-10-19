# FFXI Progression Command Center

A personal, mostly-solo progression plan for Final Fantasy XI with occasional weekend group play. The current guide is tailored to seven level-99 jobs in starter i119 equipment, with COR as the quick group-entry job, BRD as the long-term group main, BLU as the solo progression job, and THF as the farming tool.

The current route is:

1. finish any remaining Intermediate Records of Eminence objectives;
2. buy Compensator and establish the minimum useful COR roll kit for quick weekend entry;
3. always advance one BRD succession project toward a reliable three-song support floor and eventual COR replacement;
4. build a practical BLU spell library and comfortable solo Ambuscade clear;
5. keep THF focused on named farms rather than another full gear project;
6. use the session, weekly, and monthly routine without treating every timer as mandatory.

## Local preview

Docsify fetches Markdown over HTTP, so opening `docs/index.html` directly is not sufficient.

```sh
python3 -m http.server 3000 --directory docs
```

Open <http://localhost:3000>. Stop the server with `Ctrl-C`.

There is no install or build step. Docsify 4.13.1, its search plugin, and the base theme load from jsDelivr, so the rendered site requires an internet connection. The Markdown remains readable on GitHub or in a text editor when the CDN is unavailable.

## GitHub Pages

1. Push the repository to GitHub.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select the publishing branch (normally `main`) and the **`/docs`** folder.
5. Save and wait for the Pages deployment.

The checked-in [`docs/.nojekyll`](docs/.nojekyll) file prevents Jekyll processing. No GitHub Actions workflow is required.

## Personal progress

Checklist state is stored only in the current browser under the `ffxi-return-progress-v1` local-storage key. The guide has no account or cloud backend.

- **Export backup** downloads the current versioned state as JSON.
- **Import backup** validates the version and task IDs before replacing progress.
- **Reset progress** clears all saved checks after confirmation.
- If local storage is blocked, tasks still work for the current session and the guide shows a temporary-progress warning.

Export a backup before clearing browser data or moving to another device.

## Updating the guide

Guide pages and navigation live in:

- `docs/2026-10-03/*.md` for the archived return route
- `docs/2026-10-19/*.md` for the current plan and recurring routine
- `docs/_sidebar.md`
- `docs/assets/task-catalog.js`

Each persistent checkbox needs one unique inline marker:

```html
<span data-task-id="stable-id" data-task-phase="phase" data-task-required="true"></span>
```

Add the matching task to `docs/assets/task-catalog.js`. Never reuse an old ID for a different action; saved browser state depends on its meaning. The integrity checker rejects duplicate, missing, and unknown task IDs as well as broken local Markdown links.

Keep game advice dated. Prefer Square Enix/PlayOnline sources for system behavior, label practical community routes as community guidance, and mark server-, campaign-, or month-sensitive details for in-game verification.

## Verification

Run the complete dependency-free suite from the repository root:

```sh
node --test tests/*.test.mjs
python3 -m unittest discover -s tests -p 'test_*.py' -v
python3 scripts/check_site.py
```

The JavaScript tests cover progress calculations, import validation, persistence fallback, and the Docsify adapter. The Python tests cover the published content graph, task catalog, sidebar, and internal links.

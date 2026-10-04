# FFXI Return Command Center

A personal, mostly-solo battle plan for returning to Final Fantasy XI after the level-75 era. The guide is tailored to the character snapshot in [`docs/2026-10-03/roster.md`](docs/2026-10-03/roster.md): COR, THF, WAR, RNG, SMN, and BLM at 75, with old level-75 equipment.

The recommended route is:

1. restore Trusts, Records of Eminence, travel, and early Rhapsodies bonuses;
2. take COR from 75 to 99;
3. replace the old set with an i117 baseline and coherent i119 gear;
4. build the minimum useful weekend-group COR toolkit;
5. choose a longer-term job, including BRD, after that foundation works.

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

- `docs/2026-10-03/*.md`
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

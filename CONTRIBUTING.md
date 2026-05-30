# Contributing to Cell2

Thanks for your interest in improving Cell2. It's a small, deliberately dependency-free project, and contributions are welcome.

## Project shape

Two standalone vanilla-JS files, no build step, no package manager, no framework:

- `cell2-cms.js` — lists, tabs, and CMS rendering
- `cell2-map.js` — the Leaflet map

Each file opens with a header comment that documents every attribute it supports. That header is the source of truth — if you change behavior, update the header in the same commit.

## Principles

- **No build step.** The files must run as-is when dropped into a page via a script tag. No transpiling, no bundling.
- **No dependencies** beyond Leaflet, which `cell2-map.js` loads from a CDN at runtime. Don't add npm packages.
- **Attributes over config objects.** Features are configured through `data-cell2-*` attributes with sensible defaults, so a basic setup needs almost no attributes.
- **Solid fallbacks.** Anything optional should have a default that does the right thing when the attribute is absent.
- **Backward compatible.** Renaming or removing an attribute is a breaking change. Prefer adding.

## Reporting a bug

Open an issue that includes:

1. What you expected to happen.
2. What actually happened (including any console output, e.g. `[cell2-cms] ...`).
3. A link to a minimal Google Sheet and a minimal page that reproduce it.

The sheet + page link matters — most issues come down to how a sheet is structured or published, and a reproduction lets it be diagnosed quickly.

## Submitting a change

1. Fork and branch.
2. Keep changes focused — one fix or feature per pull request.
3. Update the relevant file header and `CHANGELOG.md`.
4. Confirm both files still pass a syntax check (`node --check cell2-cms.js`).
5. Describe what you changed and why, and how you tested it against a real sheet.

## Versioning

Cell2 uses semantic versioning with tags on GitHub. Maintainers cut release tags; please don't bump version numbers in pull requests — note the change in `CHANGELOG.md` under an "Unreleased" heading instead.

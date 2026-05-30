# Changelog

All notable changes to Cell2 are documented here. The project follows [semantic versioning](https://semver.org/).

## v1.0.2

- Documented that `_config` (or any tab whose first data row is sparse) must not be the first tab in the workbook, to avoid Google's CSV header-mangling on the first tab.
- Aligned both scripts to the same version and corrected the install snippets in the file headers.

## v1.0.1

- `cell2-map.js`: popup cards now support `data-cell2-meta="tab-label"` and `data-cell2-meta="tab-name"`, exposing each marker's source tab — consistent with the CMS list behavior.

## v1.0.0

- Initial public release: `cell2-cms.js` and `cell2-map.js`.
- Lists, auto-generated tabs, aggregate tabs, config-sheet-driven setup, sorting, accordions, loading skeletons, empty/error states, record counts, and CSS variables.
- Leaflet map with clustered markers, dropdown and tab filters, search, geolocation, templated popups, list → map linking, and selectable tile styles.
- Shared two-layer fetch cache (in-memory + localStorage) with `?clearcache` and per-component TTL override.

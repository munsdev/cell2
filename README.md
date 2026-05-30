# Cell2

Turn a Google Sheet into live website content — CMS-style lists, tabs, and interactive maps. No build step, no API keys, no backend. Publish a sheet, add a script tag, and mark up your HTML with `data-cell2-*` attributes. Built for Webflow, but works on any HTML page.

Two drop-in scripts that work independently or together:

- **`cell2-cms.js`** — lists, auto-generated tabs, aggregate tabs, sorting, accordions, loading skeletons, and CSS variables driven by sheet data
- **`cell2-map.js`** — a Leaflet map with clustered markers, dropdown filters, search, geolocation, and templated popups

Both scripts share one fetch cache and read the same optional `_config` sheet. A list can be wired so clicking a row flies the map to that record.

## Contents

- [Install](#install)
- [Quick start](#quick-start)
- [The config sheet](#the-config-sheet)
- [CMS attributes](#cms-attributes)
- [Map attributes](#map-attributes)
- [CSS variables](#css-variables)
- [List → map linking](#list--map-linking)
- [Caching](#caching)
- [Gotchas](#gotchas)
- [Versioning](#versioning)
- [Contributing](#contributing)
- [License](#license)

## Install

First, publish your sheet so the scripts can read it:

**File → Share → Publish to web → Entire document → CSV → Publish**

(Link-sharing alone is not enough — the document must be *published to the web*.)

Then add whichever script you need before the closing `</body>` tag. Pin to a version tag for stability:

```html
<script src="https://cdn.jsdelivr.net/gh/munsdev/cell2@v1.0.2/cell2-cms.js"></script>
<script src="https://cdn.jsdelivr.net/gh/munsdev/cell2@v1.0.2/cell2-map.js"></script>
```

Use only the script(s) you need — a menu needs just the CMS script; a standalone map needs just the map script.

## Quick start

### A list

```html
<div data-cell2-list data-cell2-id="YOUR_SHEET_ID" data-cell2-sheet="Places">
  <div data-cell2-item>
    <h3 data-cell2-field="Name"></h3>
    <p  data-cell2-field="Description"></p>
  </div>
</div>
```

The element marked `data-cell2-item` is a template. It is cloned once per row, and each `data-cell2-field` is filled from the matching column. Everything else inside the list is left alone.

### A map

```html
<div data-cell2-map-wrapper data-cell2-id="YOUR_SHEET_ID" data-cell2-sheet="Places">
  <div data-cell2-map style="height:480px"></div>
</div>
```

Rows need latitude and longitude columns — by default named `Latitude` and `Longitude`, both overridable.

## The config sheet

For tabs, sorting, marker colors, and shared styling, add a tab named `_config` (or point at a custom name with `data-cell2-config="YourTab"`). Each row becomes a tab, in row order.

| Tab | Label | Description | Color | Icon | Sort By | Sort Dir | Sort Type | Active |
|-----|-------|-------------|-------|------|---------|----------|-----------|--------|
| Cultural | Cultural Sites | Human-made heritage | #b45309 | 🏛️ | Name | asc | text | TRUE |
| Natural | Natural Sites | Natural heritage | #15803d | 🌲 | Name | asc | text | |
| Cultural,Natural | All | Everything combined | | | Name | asc | text | |
| * | | | #6b7280 | 📍 | | | | |

- A **single name** in `Tab` is one tab.
- A **comma-separated list** is an aggregate tab — its source tabs are merged and de-duplicated.
- A **`*`** row holds global CSS-variable defaults applied to the wrapper. Any extra column on this row becomes a variable source.
- **`Active`** (`TRUE` / `✓` / `yes` / `1`) marks the tab that opens by default.

Column names must match the header row exactly. Recognized columns are `Tab`, `Label`, `Description`, `Color`, `Icon`, `Sort By`, `Sort Dir`, `Sort Type`, and `Active`; any other column can be referenced as a CSS-variable source.

With no config sheet, lists still work standalone, and tabs fall back to `data-cell2-sheets="Tab A, Tab B"` on the wrapper.

## CMS attributes

### Wrappers

**Tabs wrapper:**

| Attribute | Purpose |
|-----------|---------|
| `data-cell2-tabs` | presence flag |
| `data-cell2-id` | Google Sheet ID |
| `data-cell2-config` | config tab name (default `_config`) |
| `data-cell2-sheets` | fallback tab list when no config sheet |
| `data-cell2-cache-ttl` | cache seconds (default 60) |
| `data-cell2-accordion-trigger` | accordion trigger selector (default `.accordion2_top`) |
| `data-cell2-accordion-panel` | accordion panel selector (default `.accordion2_bottom`) |
| `data-cell2-accordion-icon` | accordion icon selector (default `.accordion2_icon`) |

**Standalone list:**

| Attribute | Purpose |
|-----------|---------|
| `data-cell2-list` | presence flag |
| `data-cell2-id` | Google Sheet ID |
| `data-cell2-sheet` | tab name (default `Sheet1`) |
| `data-cell2-sort-col` / `-dir` / `-type` | sort (config sheet wins) |
| `data-cell2-item-limit` | render only the first N rows |
| `data-cell2-map-ref` | link clicks to a map id |
| `data-cell2-cache-ttl` | cache seconds (default 60) |

A standalone list is any `data-cell2-list` **not** inside a `data-cell2-tabs` element. You can place as many on a page as you like — a tabbed menu and a separate hours table on the same page, for example, run independently and share only the fetch cache.

### Templates

| Attribute | On | Purpose |
|-----------|----|---------|
| `data-cell2-tab-link` | tab link template | cloned per tab |
| `data-cell2-tab-content` | tab pane template | cloned per tab |
| `data-cell2-item` | row template | cloned per record |
| `data-cell2-tab-count` | element in a tab link | filled with that tab's record count |
| `data-cell2-meta="tab-title"` | inside link/pane | active config-row Label |
| `data-cell2-meta="tab-label"` | inside link/pane/item | source-tab Label (per record in aggregate lists) |
| `data-cell2-meta="tab-description"` | inside link/pane | config Description |

### Fields (inside any item, template, or popup)

| Attribute | Effect |
|-----------|--------|
| `data-cell2-field="Column"` | sets `textContent` |
| `data-cell2-field-html="Column"` | sets `innerHTML` |
| `data-cell2-field-attr="attr:Column"` | sets an attribute, e.g. `href:Website` or `src:Image` |
| `data-cell2-field-wrapper` | nearest flagged ancestor is removed when the field is blank |
| `data-cell2-show-if="Column"` | element is removed when the value is falsy (`FALSE`, `0`, `no`, blank) |
| `data-cell2-var="name:Column"` | sets `--name` as a CSS variable |

### List state helpers (siblings of the item, inside the list)

| Attribute | Effect |
|-----------|--------|
| `data-cell2-count` | filled with the visible record count |
| `data-cell2-empty` | shown only when there are zero records |
| `data-cell2-error` | shown on fetch failure; a `data-cell2-field="message"` inside gets the error text |
| `data-cell2-loading` | custom loader element (otherwise an auto skeleton is injected) |
| `data-cell2-loading-count="6"` | number of skeleton rows (default 6) |

### Accordions

Items containing a trigger + panel are auto-wired into an accordion. Selectors default to Relume/Webflow class names and are overridable per wrapper via the accordion attributes above. Cell2 takes ownership of the toggle so it does not fight Webflow interactions.

## Map attributes

### Map wrapper

| Attribute | Purpose |
|-----------|---------|
| `data-cell2-map-wrapper` | presence flag |
| `data-cell2-map-id` | id for list → map linking |
| `data-cell2-id` | Google Sheet ID |
| `data-cell2-sheet` | tab name (fallback when no config) |
| `data-cell2-config` | config tab name (default `_config`) |
| `data-cell2-col-lat` / `-col-lng` / `-col-name` | column overrides (default `Latitude`, `Longitude`, `Name`) |
| `data-cell2-map-filter-logic` | `and` or `or` across dropdowns (default `and`) |
| `data-cell2-cache-ttl` | cache seconds (default 60) |

### Map element

| Attribute | Purpose |
|-----------|---------|
| `data-cell2-map` | Leaflet renders here — needs a CSS height |
| `data-cell2-map-center="20,0"` | initial center `"lat,lng"` (default world) |
| `data-cell2-map-zoom="3"` | initial zoom (default 3 desktop / 2 mobile) |
| `data-cell2-map-tiles="osm"` | tile style — `osm`, `carto-light`, `carto-dark`, `esri-street`, `esri-topo` |
| `data-cell2-map-cluster-radius="80"` | marker cluster radius in px |
| `data-cell2-map-refit="true"` | refit bounds to visible markers after filtering |

### Popup card

Use `data-cell2-map-card` on a template element inside the wrapper. It supports all the field attributes above, plus `data-cell2-meta="tab-label"` and `data-cell2-meta="tab-name"` to show the marker's source tab.

### Map controls (anywhere inside the wrapper)

| Attribute | Purpose |
|-----------|---------|
| `data-cell2-map-search` | search input (debounced) |
| `data-cell2-map-search-cols="A, B"` | restrict search to listed columns |
| `data-cell2-map-search-btn` | trigger search immediately |
| `data-cell2-map-filter="Column"` | auto-populated dropdown filter |
| `data-cell2-map-filter-tabs` | dropdown populated from tab labels |
| `data-cell2-map-filter-multi` | makes a dropdown multi-select |
| `data-cell2-map-reset` | clears filters and resets the view |
| `data-cell2-map-locate` | flies to the visitor's location |
| `data-cell2-count` | filled with the visible marker count |
| `data-cell2-empty` | shown when no markers are visible |
| `data-cell2-error` | shown on fetch failure |

Across dropdowns, logic is `and` by default (set `or` on the wrapper). Within a single multi-select dropdown, logic is always `or`. An aggregate tab option matches all of its source tabs.

## CSS variables

`data-cell2-var` sets CSS custom properties on any element from sheet data. The `--` prefix is added automatically.

```html
<div data-cell2-var="card-bg:Background; accent:Color"></div>
```

Resolution per variable, first match wins: the item's own column, then the aggregate config row, then the record's individual tab config row, then the global `*` row, then unset. It works at every level — wrapper, tab pane, list, item, or a nested element — with tighter scopes overriding looser ones.

## List → map linking

Give the map wrapper an id and point a list at it:

```html
<div data-cell2-map-wrapper data-cell2-map-id="sites" ...> ... </div>

<div data-cell2-list data-cell2-map-ref="sites" ...>
  <div data-cell2-item>
    <h3 data-cell2-field="Name"></h3>
  </div>
</div>
```

Clicking a list item flies the map to the marker whose name column matches. Add `data-cell2-map-trigger` to a child element to make only that element clickable rather than the whole row.

## Caching

Responses are cached in memory (60s) and in `localStorage` (1h) to keep loads fast and reduce requests to Google. Override per component with `data-cell2-cache-ttl="120"` (seconds). Append `?clearcache` to any page URL to wipe both layers immediately — useful while editing a sheet.

## Gotchas

- **Do not make `_config` the first tab in the workbook.** Google's CSV export mangles the header row of whichever tab is first. Keep `_config` (and any tab whose first data row is sparse) anywhere but the first position.
- **Column names are case-sensitive** and must match the sheet header row exactly.
- **Rows where every cell is blank are skipped.**
- **The sheet must be published to the web**, not merely link-shared.
- `cell2-map.js` loads Leaflet and MarkerCluster from a CDN at runtime — nothing to install, but the map needs network access on first load.

## Versioning

Cell2 follows semantic versioning, tagged on GitHub. **Pin to a version tag** in production so upgrades are deliberate:

```html
<script src="https://cdn.jsdelivr.net/gh/munsdev/cell2@v1.0.2/cell2-cms.js"></script>
```

`@latest` or an unpinned URL will float to the newest commit and is cached aggressively by the CDN — fine for experimenting, not recommended for live sites. See [CHANGELOG.md](CHANGELOG.md) for what changed between versions.

## Contributing

Issues and pull requests are welcome. The project is two dependency-free vanilla-JS files — `cell2-cms.js` and `cell2-map.js` — each self-documented in a header comment. If you open an issue, please include the behavior you expected, what happened, and a link to a minimal sheet + page that reproduces it. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).

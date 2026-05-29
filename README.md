# Cell2

Turn a Google Sheet into live Webflow content — CMS lists, tabs, and interactive maps. No build step, no API keys, no backend. Publish a sheet, add a script tag, mark up your HTML with `data-cell2-*` attributes.

Two drop-in scripts that work independently or together:

- **`cell2-cms.js`** — lists, auto-tabs, aggregate tabs, sorting, accordions, CSS variables driven by sheet data
- **`cell2-map.js`** — a Leaflet map with clustered markers, filters, search, and templated popups

Both share a fetch cache and the same `_config` sheet, and a list can be wired to fly a map to the clicked record.

## Install

Publish your sheet: **File → Share → Publish to web → Entire document → CSV**.

Add whichever script(s) you need before `</body>`:

```html
<script src="https://cdn.jsdelivr.net/gh/munsdev/cell2@v1.0.0/cell2-cms.js"></script>
<script src="https://cdn.jsdelivr.net/gh/munsdev/cell2@v1.0.0/cell2-map.js"></script>
```

Replace `munsdev` with your GitHub username and pin to a tag (`@v1.0.0`) for stability, or use `@latest` to float.

## Minimal list

```html
<div data-cell2-list data-cell2-id="YOUR_SHEET_ID" data-cell2-sheet="Places">
  <div data-cell2-item>
    <h3 data-cell2-field="Name"></h3>
    <p  data-cell2-field="Description"></p>
  </div>
</div>
```

The element marked `data-cell2-item` is a template. It is cloned once per row, with each `data-cell2-field` filled from the matching column.

## Minimal map

```html
<div data-cell2-map-wrapper data-cell2-id="YOUR_SHEET_ID" data-cell2-sheet="Places">
  <div data-cell2-map style="height:480px"></div>
</div>
```

Rows need latitude and longitude columns (default names `Latitude` and `Longitude`, overridable).

## The config sheet

Add a tab named `_config` to drive tabs, sorting, marker colors, and shared CSS variables. Row order is display order.

| Tab | Label | Description | Color | Icon | Sort By | Sort Dir | Sort Type | Active |
|-----|-------|-------------|-------|------|---------|----------|-----------|--------|
| Cultural | Cultural Sites | Human-made heritage | #b45309 | 🏛️ | Name | asc | text | TRUE |
| Natural | Natural Sites | Natural heritage | #15803d | 🌲 | Name | asc | text | |
| Cultural,Natural | All | Everything combined | | | Name | asc | text | |
| * | | | | | | | | |

- A single name in **Tab** is one tab.
- A comma-separated list is an **aggregate** tab (sources merged and deduplicated).
- A **`*`** row holds global CSS variables applied to the wrapper; any extra column becomes a variable source.

With no config sheet, lists still work standalone and tabs fall back to `data-cell2-sheets="Tab A, Tab B"`.

## Attribute reference

The full, authoritative reference lives in the header comment of each script. A summary:

### Fields (inside any item or popup)

| Attribute | Effect |
|-----------|--------|
| `data-cell2-field="Column"` | sets `textContent` |
| `data-cell2-field-html="Column"` | sets `innerHTML` |
| `data-cell2-field-attr="href:Column"` | sets an attribute from a column |
| `data-cell2-field-wrapper` | nearest ancestor removed when the field is blank |
| `data-cell2-show-if="Column"` | element removed when the value is falsy |
| `data-cell2-var="name:Column"` | sets `--name` as a CSS variable |

### List helpers (siblings of the item, inside the list)

| Attribute | Effect |
|-----------|--------|
| `data-cell2-count` | filled with the visible record count |
| `data-cell2-empty` | shown only when there are zero records |
| `data-cell2-error` | shown on fetch failure (`data-cell2-field="message"` gets the text) |
| `data-cell2-loading` | custom loader element (otherwise an auto skeleton is used) |
| `data-cell2-item-limit="N"` | render only the first N records |

### Map controls (inside the map wrapper)

| Attribute | Effect |
|-----------|--------|
| `data-cell2-map-search` | search input (debounced) |
| `data-cell2-map-filter="Column"` | auto-populated dropdown filter |
| `data-cell2-map-filter-tabs` | dropdown populated from tab labels |
| `data-cell2-map-filter-multi` | makes a dropdown multi-select |
| `data-cell2-map-reset` | clears filters and resets the view |
| `data-cell2-map-locate` | flies to the visitor's location |
| `data-cell2-map-tiles="osm"` | tile style (`osm`, `carto-light`, `carto-dark`, `esri-street`, `esri-topo`) |
| `data-cell2-map-center="20,0"` | initial center |
| `data-cell2-map-zoom="3"` | initial zoom |

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

Clicking a list item flies the map to the marker whose name column matches. Add `data-cell2-map-trigger` to a child element to make only that element clickable.

## Caching

Responses are cached in memory (60s) and in `localStorage` (1h) to keep page loads fast and reduce requests to Google. Override per component with `data-cell2-cache-ttl="120"` (seconds). Append `?clearcache` to any URL to wipe everything.

## Examples

See the [`examples/`](examples/) folder for complete, copy-pasteable pages: a basic list, tabs, a map, and a combined list-plus-map layout.

## Notes

- Column names are case-sensitive and must match the header row exactly.
- Rows where every cell is blank are skipped.
- `cell2-map.js` loads Leaflet and MarkerCluster from cdnjs at runtime — nothing to install.
- No API keys are required for any feature.

## License

MIT

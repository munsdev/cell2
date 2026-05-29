/**
 * cell2-cms.js  v1.0.0
 * Cell2 — Google Sheets → Webflow CMS Lists, Tabs, Aggregate Tabs
 * https://cell2.site
 *
 * Turn a Google Sheet into live CMS content. No build step, no API keys.
 * Pairs with cell2-map.js (shared cache + config sheet + list→map linking).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUICK START
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. Publish your sheet:  File → Share → Publish to web → entire doc → CSV
 * 2. Add this script to your page (footer / before </body>):
 *      <script src="https://cdn.jsdelivr.net/gh/USER/cell2@v1.0.0/cell2-cms.js"></script>
 * 3. Mark up a list:
 *      <div data-cell2-list data-cell2-id="SHEET_ID" data-cell2-sheet="Tab Name">
 *        <div data-cell2-item>
 *          <h3 data-cell2-field="Title"></h3>
 *          <p  data-cell2-field="Description"></p>
 *        </div>
 *      </div>
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CONFIG SHEET  (optional — a tab named _config, or data-cell2-config="YourTab")
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * One tab drives tabs, sorting, colors, and CSS vars. Row order = display order.
 *
 *   Tab          Single name  → one tab
 *                Comma list   → aggregate tab (merged + deduped)
 *                *            → global CSS vars row (applied to wrapper)
 *   Label        Display name wherever a tab name shows
 *   Description  Exposed via data-cell2-meta="tab-description"
 *   Color        Hex (#ef4444) — used by cell2-map for markers
 *   Icon         Emoji / text — used by cell2-map for markers
 *   Sort By      Column name to sort that tab's list by
 *   Sort Dir     asc | desc
 *   Sort Type    text | number | date
 *   Active       TRUE / ✓ / yes / 1 — marks the default-open tab
 *   [any col]    Usable as a CSS var source via data-cell2-var
 *
 * No config sheet? Lists work standalone, and tabs fall back to
 * data-cell2-sheets="Tab A, Tab B" on the wrapper.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * WRAPPER ATTRIBUTES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tabs wrapper (Webflow Tabs root):
 *   data-cell2-tabs                 presence flag
 *   data-cell2-id                   Google Sheet ID
 *   data-cell2-config               config tab name (default: _config)
 *   data-cell2-sheets               fallback tab list (ignored if config present)
 *   data-cell2-cache-ttl            cache seconds (default: 60)
 *   data-cell2-accordion-trigger    accordion trigger selector (default: .accordion2_top)
 *   data-cell2-accordion-panel      accordion panel selector  (default: .accordion2_bottom)
 *   data-cell2-accordion-icon       accordion icon selector   (default: .accordion2_icon)
 *
 * Standalone list:
 *   data-cell2-list                 presence flag
 *   data-cell2-id                   Google Sheet ID
 *   data-cell2-sheet                tab name (default: Sheet1)
 *   data-cell2-sort-col             sort column   (config sheet wins)
 *   data-cell2-sort-dir             asc | desc
 *   data-cell2-sort-type            text | number | date
 *   data-cell2-item-limit           show only first N records after sort
 *   data-cell2-map-ref              map id to link clicks to (needs cell2-map.js)
 *   data-cell2-cache-ttl            cache seconds (default: 60)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TEMPLATES & ELEMENTS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tab link template (inside .w-tab-menu):
 *   data-cell2-tab-link                  cloned per tab
 *   data-cell2-meta="tab-title"          active config-row Label
 *   data-cell2-meta="tab-label"          source tab Label (falls back to title)
 *   data-cell2-meta="tab-description"    config Description
 *   data-cell2-tab-count                 record count for that tab
 *
 * Tab content template (inside .w-tab-content):
 *   data-cell2-tab-content               cloned per tab
 *   data-cell2-meta="tab-title|tab-label|tab-description"
 *   (contains a data-cell2-list with a data-cell2-item)
 *
 * List item template:
 *   data-cell2-item                      cloned per record
 *   data-cell2-meta="tab-label"          per-record source tab label
 *
 * Inside any item / template:
 *   data-cell2-field="Column"            → textContent
 *   data-cell2-field-html="Column"       → innerHTML
 *   data-cell2-field-attr="attr:Column"  → sets attribute (e.g. href:URL, src:Image)
 *   data-cell2-field-wrapper             nearest ancestor removed if field blank
 *   data-cell2-show-if="Column"          element removed if value falsy
 *                                        (FALSE / false / 0 / blank / no)
 *   data-cell2-var="name:Column; ..."    CSS custom property (-- auto-prefixed)
 *   data-cell2-map-trigger               specific click target for map linking
 *
 * List-level helper elements (siblings of data-cell2-item, inside the list):
 *   data-cell2-count                     populated with visible record count
 *   data-cell2-empty                     shown only when zero records
 *   data-cell2-error                     shown only on fetch failure;
 *                                        data-cell2-field="message" inside gets the error
 *   data-cell2-loading                   custom loader (else auto skeleton is used)
 *   data-cell2-loading-count="6"         skeleton row count (default: 6)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CSS VARIABLES  (data-cell2-var)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   data-cell2-var="my-color:Color; my-icon:Icon"   sets --my-color, --my-icon
 *
 * Resolution per variable (first hit wins):
 *   1. item record column      2. aggregate config row column
 *   3. individual tab config    4. global * row      5. unset
 *
 * Works at any level — wrapper, tab pane, list, item, nested element.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ACCORDION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Auto-wired on cloned items that contain a trigger + panel. Selectors default
 * to Relume/Webflow class names but are overridable via the wrapper attributes
 * above. Takes ownership of toggle behavior so it won't fight Webflow IX2.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTES
 * ═══════════════════════════════════════════════════════════════════════════
 *  • Sheet must be published to the web (CSV)
 *  • Column names are case-sensitive, must match the header row exactly
 *  • All-blank rows are skipped
 *  • Append ?clearcache to any URL to wipe cached data
 *  • No external libraries or API keys required
 */

(function () {
  'use strict';

  // ─── SHARED FETCH CACHE ────────────────────────────────────────────────────
  // Shared with cell2-map.js via window.__cell2Cache. First script wins.
  // Two layers: in-memory (fast, per page session) + localStorage (cross-reload).

  var _cache       = window.__cell2Cache = window.__cell2Cache || {};
  var TTL_MS       = 60 * 1000;        // in-memory default — 60s
  var LS_TTL_MS    = 60 * 60 * 1000;   // localStorage default — 1h
  var LS_PREFIX    = 'cell2_cache_';

  // ?clearcache / #clearcache → wipe everything
  (function () {
    var hit = location.search.indexOf('clearcache') !== -1 ||
              location.hash.indexOf('clearcache') !== -1;
    if (!hit) return;
    Object.keys(_cache).forEach(function (k) { delete _cache[k]; });
    try {
      Object.keys(localStorage)
        .filter(function (k) { return k.indexOf(LS_PREFIX) === 0; })
        .forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) {}
    console.log('[cell2] caches cleared');
  })();

  // ttlMs is optional per-call override (from data-cell2-cache-ttl)
  async function cachedFetch(url, ttlMs) {
    var memTtl = ttlMs || TTL_MS;
    var lsTtl  = ttlMs ? ttlMs * 60 : LS_TTL_MS;   // localStorage holds 60× longer
    var now    = Date.now();

    var entry = _cache[url];
    if (entry && (now - entry.ts) < memTtl) return entry.data;

    try {
      var stored = localStorage.getItem(LS_PREFIX + url);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && (now - parsed.ts) < lsTtl) {
          _cache[url] = { ts: now, data: parsed.data };
          return parsed.data;
        }
      }
    } catch (e) {}

    var res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status + ' — ' + url);
    var data = rowsToObjects(parseCSV(await res.text()));

    _cache[url] = { ts: now, data: data };
    try {
      localStorage.setItem(LS_PREFIX + url, JSON.stringify({ ts: now, data: data }));
    } catch (e) {}

    return data;
  }

  // ─── ACCORDION DEFAULTS ─────────────────────────────────────────────────────

  var ACCORDION_TRIGGER_DEFAULT    = '.accordion2_top';
  var ACCORDION_PANEL_DEFAULT      = '.accordion2_bottom';
  var ACCORDION_ICON_DEFAULT       = '.accordion2_icon';
  var ACCORDION_TRANSITION         = 'height 0.3s ease';

  // ─── SKELETON LOADER ────────────────────────────────────────────────────────

  var SKELETON_INJECTED = false;

  function injectSkeletonStyles() {
    if (SKELETON_INJECTED) return;
    SKELETON_INJECTED = true;
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes cell2-shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}',
      '.cell2-skeleton-item{width:100%;height:56px;border-radius:8px;margin-bottom:8px;',
      'background:linear-gradient(90deg,var(--cell2-sk-base,#e8e8e8) 25%,',
      'var(--cell2-sk-shine,#d0d0d0) 50%,var(--cell2-sk-base,#e8e8e8) 75%);',
      'background-size:600px 100%;animation:cell2-shimmer 1.4s ease-in-out infinite;}',
    ].join('');
    document.head.appendChild(style);
  }

  function showLoader(listEl) {
    var custom = listEl.querySelector('[data-cell2-loading]');
    if (custom) { custom.style.display = ''; return; }
    injectSkeletonStyles();
    var count = parseInt(listEl.getAttribute('data-cell2-loading-count') || '6', 10);
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var el = document.createElement('div');
      el.className = 'cell2-skeleton-item';
      el.setAttribute('data-cell2-skeleton', '');
      frag.appendChild(el);
    }
    listEl.appendChild(frag);
  }

  function hideLoader(listEl) {
    var custom = listEl.querySelector('[data-cell2-loading]');
    if (custom) { custom.style.display = 'none'; return; }
    listEl.querySelectorAll('[data-cell2-skeleton]').forEach(function (el) { el.remove(); });
  }

  // ─── STATE ELEMENTS (empty / error / count) ─────────────────────────────────

  function setVisible(el, visible) { if (el) el.style.display = visible ? '' : 'none'; }

  function showError(scopeEl, message) {
    var errEl = scopeEl.querySelector('[data-cell2-error]');
    if (!errEl) return;
    var msgEl = errEl.querySelector('[data-cell2-field="message"]');
    if (msgEl && message) msgEl.textContent = message;
    setVisible(errEl, true);
  }

  function updateCount(scopeEl, n) {
    scopeEl.querySelectorAll('[data-cell2-count]').forEach(function (el) {
      el.textContent = n;
    });
  }

  // ─── UTILITIES ──────────────────────────────────────────────────────────────

  function uid() { return 'c2-' + Math.random().toString(36).slice(2, 9); }

  function csvUrl(sheetId, sheetName) {
    return 'https://docs.google.com/spreadsheets/d/' + sheetId +
      '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(sheetName);
  }

  function parseList(attr) {
    if (!attr) return [];
    return attr.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function isTruthy(val) {
    if (!val) return false;
    var v = val.trim().toLowerCase();
    return v === 'true' || v === 'yes' || v === '1' || v === '✓' || v === 'x';
  }

  function ttlFromAttr(el) {
    var raw = el && el.getAttribute('data-cell2-cache-ttl');
    var n = raw ? parseInt(raw, 10) : 0;
    return (n && !isNaN(n)) ? n * 1000 : 0;   // 0 = use default
  }

  function parseCSV(text) {
    var rows = [], row = [], field = '', inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i], next = text[i + 1];
      if (inQuotes) {
        if (ch === '"' && next === '"') { field += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { field += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { row.push(field); field = ''; }
        else if (ch === '\r' && next === '\n') { row.push(field); field = ''; rows.push(row); row = []; i++; }
        else if (ch === '\n' || ch === '\r') { row.push(field); field = ''; rows.push(row); row = []; }
        else { field += ch; }
      }
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function rowsToObjects(rows) {
    if (rows.length < 2) return [];
    var headers = rows[0].map(function (h) { return h.trim(); });
    var records = [];
    for (var i = 1; i < rows.length; i++) {
      var obj = {}, hasValue = false;
      headers.forEach(function (h, idx) {
        var val = (rows[i][idx] || '').trim();
        obj[h] = val;
        if (val) hasValue = true;
      });
      if (hasValue) records.push(obj);
    }
    return records;
  }

  // ─── CONFIG SHEET ─────────────────────────────────────────────────────────

  async function fetchConfig(sheetId, configTabName, ttlMs) {
    var rows;
    try {
      rows = await cachedFetch(csvUrl(sheetId, configTabName), ttlMs);
    } catch (e) {
      return null;   // no config sheet — caller falls back
    }
    if (!rows.length) return null;

    var tabDefs = [], globalVars = {};
    rows.forEach(function (row) {
      var tab = (row['Tab'] || '').trim();
      if (!tab) return;
      if (tab === '*') { Object.assign(globalVars, row); return; }

      var sources = tab.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      tabDefs.push({
        tab         : tab,
        sourceTabs  : sources,
        isAggregate : sources.length > 1,
        label       : (row['Label'] || '').trim() || tab,
        description : (row['Description'] || '').trim(),
        color       : (row['Color'] || '').trim(),
        icon        : (row['Icon'] || '').trim(),
        sortCol     : (row['Sort By'] || '').trim(),
        sortDir     : (row['Sort Dir'] || 'asc').trim().toLowerCase(),
        sortType    : (row['Sort Type'] || 'text').trim().toLowerCase(),
        active      : isTruthy(row['Active'] || ''),
        _row        : row,
      });
    });
    return { tabDefs: tabDefs, globalVars: globalVars };
  }

  // ─── CSS VAR RESOLUTION ─────────────────────────────────────────────────────

  function resolveVars(el, itemRecord, configRow, globalVars, individualConfigRow) {
    var attr = el.getAttribute('data-cell2-var');
    if (!attr) return;

    var aggregateRaw  = configRow && configRow._row ? configRow._row : (configRow || {});
    var individualRaw = individualConfigRow && individualConfigRow._row
      ? individualConfigRow._row : (individualConfigRow || {});

    attr.split(';').forEach(function (pair) {
      var idx = pair.indexOf(':');
      if (idx === -1) return;
      var varName = pair.slice(0, idx).trim();
      var col     = pair.slice(idx + 1).trim();
      if (!varName || !col) return;

      var val = '';
      if (itemRecord && itemRecord[col])      val = itemRecord[col];
      else if (aggregateRaw[col])             val = aggregateRaw[col];
      else if (individualRaw[col])            val = individualRaw[col];
      else if (globalVars && globalVars[col]) val = globalVars[col];

      if (val) el.style.setProperty('--' + varName, val);
    });
  }

  // ─── DEDUPLICATION ──────────────────────────────────────────────────────────

  function getVisibleFields(templateEl) {
    var fields = [];
    if (!templateEl) return fields;
    templateEl.querySelectorAll('[data-cell2-field], [data-cell2-field-html]').forEach(function (el) {
      var key = el.getAttribute('data-cell2-field') || el.getAttribute('data-cell2-field-html');
      if (key && fields.indexOf(key) === -1) fields.push(key);
    });
    return fields;
  }

  function deduplicateRecords(records, visibleFields) {
    if (!visibleFields.length) return records;
    var seen = {};
    return records.filter(function (record) {
      var fp = visibleFields.map(function (f) { return (record[f] || '').toLowerCase(); }).join('||');
      if (seen[fp]) return false;
      seen[fp] = true;
      return true;
    });
  }

  // ─── SORTING ──────────────────────────────────────────────────────────────

  function sortRecords(records, listEl, configRow) {
    var col = (configRow && configRow.sortCol) || listEl.getAttribute('data-cell2-sort-col');
    if (!col) return records;
    var dir  = ((configRow && configRow.sortDir) || listEl.getAttribute('data-cell2-sort-dir') || 'asc').toLowerCase();
    var type = ((configRow && configRow.sortType) || listEl.getAttribute('data-cell2-sort-type') || 'text').toLowerCase();
    var desc = dir === 'desc';

    function valueOf(record) {
      var raw = (record[col] || '').trim();
      if (!raw) return null;
      if (type === 'number') { var n = parseFloat(raw.replace(/,/g, '')); return isNaN(n) ? null : n; }
      if (type === 'date')   { var d = Date.parse(raw); return isNaN(d) ? null : d; }
      return raw.toLowerCase();
    }

    return records.slice().sort(function (a, b) {
      var av = valueOf(a), bv = valueOf(b);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (av < bv) return desc ? 1 : -1;
      if (av > bv) return desc ? -1 : 1;
      return 0;
    });
  }

  // ─── ACCORDION ──────────────────────────────────────────────────────────────

  function wireAccordion(itemEl, sel) {
    var trigger = itemEl.querySelector(sel.trigger);
    var panel   = itemEl.querySelector(sel.panel);
    if (!trigger || !panel) return;

    itemEl.querySelectorAll('[data-w-id]').forEach(function (el) { el.removeAttribute('data-w-id'); });

    panel.style.cssText    = '';
    panel.style.overflow   = 'hidden';
    panel.style.height     = '0px';
    panel.style.transition = ACCORDION_TRANSITION;
    trigger.style.cursor   = 'pointer';
    var isOpen = false;

    trigger.addEventListener('click', function () {
      isOpen = !isOpen;
      if (isOpen) {
        panel.style.height = panel.scrollHeight + 'px';
        panel.addEventListener('transitionend', function release() {
          panel.style.height = 'auto';
          panel.removeEventListener('transitionend', release);
        });
      } else {
        panel.style.height = panel.scrollHeight + 'px';
        panel.getBoundingClientRect();
        panel.style.height = '0px';
      }
      if (sel.icon) {
        var icon = trigger.querySelector(sel.icon);
        if (icon) { icon.style.transition = 'transform 0.3s ease'; icon.style.transform = isOpen ? 'rotate(45deg)' : 'rotate(0deg)'; }
      }
      itemEl.classList.toggle('is-open', isOpen);
    });
  }

  // ─── MAP LINK ─────────────────────────────────────────────────────────────

  function wireMapLink(clone, record, listEl, accordionTriggerSel) {
    var mapRef = listEl.getAttribute('data-cell2-map-ref');
    if (!mapRef) return;
    (function attempt() {
      var mapInstance = window.__cell2Maps && window.__cell2Maps[mapRef];
      if (!mapInstance) { setTimeout(attempt, 200); return; }
      var nameVal = record[mapInstance.nameCol] || '';
      if (!nameVal) return;
      var trigger = clone.querySelector('[data-cell2-map-trigger]') || clone;
      trigger.style.cursor = 'pointer';
      trigger.addEventListener('click', function (e) {
        if (trigger === clone && e.target.closest && accordionTriggerSel && e.target.closest(accordionTriggerSel)) return;
        mapInstance.flyToName(nameVal);
      });
    })();
  }

  // ─── FIELD POPULATION ───────────────────────────────────────────────────────

  function removeWrapperOrClear(el, rootEl, clearFn) {
    var ancestor = el.parentElement;
    while (ancestor && ancestor !== rootEl) {
      if (ancestor.hasAttribute('data-cell2-field-wrapper')) { ancestor.remove(); return true; }
      ancestor = ancestor.parentElement;
    }
    clearFn();
    return false;
  }

  function populateFields(rootEl, record) {
    // textContent
    rootEl.querySelectorAll('[data-cell2-field]').forEach(function (el) {
      var key = el.getAttribute('data-cell2-field');
      if (key === 'message') return;   // reserved for error elements
      var val = key && record[key] !== undefined ? record[key] : '';
      if (val) el.textContent = val;
      else removeWrapperOrClear(el, rootEl, function () { el.textContent = ''; });
    });

    // innerHTML
    rootEl.querySelectorAll('[data-cell2-field-html]').forEach(function (el) {
      var key = el.getAttribute('data-cell2-field-html');
      var val = key && record[key] !== undefined ? record[key] : '';
      if (val) el.innerHTML = val;
      else removeWrapperOrClear(el, rootEl, function () { el.innerHTML = ''; });
    });

    // attribute injection — "attr:Column"
    rootEl.querySelectorAll('[data-cell2-field-attr]').forEach(function (el) {
      var spec = el.getAttribute('data-cell2-field-attr');
      var idx  = spec.indexOf(':');
      if (idx === -1) return;
      var attr = spec.slice(0, idx).trim();
      var key  = spec.slice(idx + 1).trim();
      var val  = key && record[key] !== undefined ? record[key] : '';
      if (val) el.setAttribute(attr, val);
      else removeWrapperOrClear(el, rootEl, function () { el.removeAttribute(attr); });
    });

    // conditional removal
    rootEl.querySelectorAll('[data-cell2-show-if]').forEach(function (el) {
      var key = el.getAttribute('data-cell2-show-if');
      if (!isTruthy(record[key])) el.remove();
    });
  }

  // ─── LIST POPULATION ─────────────────────────────────────────────────────

  function populateList(listEl, records, configRow, globalVars, configByTab, accordionSel) {
    var template = listEl.querySelector('[data-cell2-item]');
    if (!template) { console.warn('[cell2-cms] No [data-cell2-item] inside', listEl); return; }

    var sorted = sortRecords(records, listEl, configRow || null);

    var limitRaw = listEl.getAttribute('data-cell2-item-limit');
    var limit = limitRaw ? parseInt(limitRaw, 10) : 0;
    if (limit && !isNaN(limit)) sorted = sorted.slice(0, limit);

    // empty state
    var emptyEl = listEl.querySelector('[data-cell2-empty]');
    setVisible(emptyEl, sorted.length === 0);
    updateCount(listEl, sorted.length);

    template.style.display = 'none';
    var fragment = document.createDocumentFragment();

    sorted.forEach(function (record) {
      var clone = template.cloneNode(true);
      clone.removeAttribute('data-cell2-item');
      clone.style.display = '';

      var individualConfigRow = (configByTab && record._tab)
        ? (configByTab[record._tab] || null) : null;

      var individualLabel = (individualConfigRow && individualConfigRow.label)
        ? individualConfigRow.label
        : (configRow && (configRow.label || configRow.tab)) || '';
      var activeLabel = (configRow && (configRow.label || configRow.tab)) || '';

      clone.querySelectorAll('[data-cell2-meta]').forEach(function (el) {
        var meta = el.getAttribute('data-cell2-meta');
        if (meta === 'tab-title') el.textContent = activeLabel;
        if (meta === 'tab-label') el.textContent = individualLabel;
      });

      populateFields(clone, record);

      clone.querySelectorAll('[data-cell2-var]').forEach(function (el) {
        resolveVars(el, record, configRow, globalVars, individualConfigRow);
      });
      if (clone.hasAttribute('data-cell2-var')) {
        resolveVars(clone, record, configRow, globalVars, individualConfigRow);
      }

      wireAccordion(clone, accordionSel);
      wireMapLink(clone, record, listEl, accordionSel.trigger);
      clone.classList.add('is-ready');
      fragment.appendChild(clone);
    });

    listEl.insertBefore(fragment, template);
    template.remove();
  }

  async function processListElement(listEl, accordionSel) {
    var sheetId   = listEl.getAttribute('data-cell2-id');
    var sheetName = listEl.getAttribute('data-cell2-sheet') || 'Sheet1';
    var ttl       = ttlFromAttr(listEl);
    if (!sheetId) { console.warn('[cell2-cms] Missing data-cell2-id on', listEl); return; }

    // hide state elements up front
    setVisible(listEl.querySelector('[data-cell2-empty]'), false);
    setVisible(listEl.querySelector('[data-cell2-error]'), false);

    listEl.classList.add('is-loading');
    showLoader(listEl);
    try {
      var data = await cachedFetch(csvUrl(sheetId, sheetName), ttl);
      populateList(listEl, data, null, {}, null, accordionSel);
    } catch (err) {
      console.error('[cell2-cms]', err);
      showError(listEl, String(err && err.message || err));
    } finally {
      hideLoader(listEl);
      listEl.classList.remove('is-loading');
    }
  }

  // ─── TABS ──────────────────────────────────────────────────────────────────

  function wireTabs(linkEls, paneEls, activeIndex) {
    function activate(i) {
      linkEls.forEach(function (link, idx) {
        link.classList.toggle('w--current', idx === i);
        link.setAttribute('aria-selected', idx === i ? 'true' : 'false');
      });
      paneEls.forEach(function (pane, idx) {
        var active = idx === i;
        pane.classList.toggle('w--tab-active', active);
        pane.style.display = active ? '' : 'none';
        pane.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
    }
    linkEls.forEach(function (link, i) {
      link.style.cursor = 'pointer';
      link.addEventListener('click', function () { activate(i); });
    });
    activate(activeIndex);
  }

  function insertTab(tabDef, records, ctx) {
    var tabId = uid();
    var label = tabDef.label || tabDef.tab;

    var link = ctx.linkTemplate.cloneNode(true);
    link.removeAttribute('data-cell2-tab-link');
    link.style.display = '';
    link.setAttribute('data-w-tab', tabId);
    link.setAttribute('role', 'tab');
    link.setAttribute('aria-selected', 'false');
    link.setAttribute('aria-controls', tabId);

    link.querySelectorAll('[data-cell2-meta]').forEach(function (el) {
      var meta = el.getAttribute('data-cell2-meta');
      if (meta === 'tab-title')       el.textContent = label;
      if (meta === 'tab-label')       el.textContent = label;
      if (meta === 'tab-description') el.textContent = tabDef.description || '';
    });
    link.querySelectorAll('[data-cell2-tab-count]').forEach(function (el) {
      el.textContent = records.length;
    });

    if (link.hasAttribute('data-cell2-var')) resolveVars(link, null, tabDef, ctx.globalVars);
    link.querySelectorAll('[data-cell2-var]').forEach(function (el) {
      resolveVars(el, null, tabDef, ctx.globalVars);
    });

    ctx.linkContainer.insertBefore(link, ctx.linkTemplate);
    ctx.linkEls.push(link);

    var pane = ctx.contentTemplate.cloneNode(true);
    pane.removeAttribute('data-cell2-tab-content');
    pane.style.display = '';
    pane.setAttribute('data-w-tab', tabId);
    pane.setAttribute('id', tabId);
    pane.setAttribute('role', 'tabpanel');
    pane.setAttribute('aria-hidden', 'true');

    pane.querySelectorAll('[data-cell2-meta]').forEach(function (el) {
      var meta = el.getAttribute('data-cell2-meta');
      if (meta === 'tab-title')       el.textContent = label;
      if (meta === 'tab-label')       el.textContent = label;
      if (meta === 'tab-description') el.textContent = tabDef.description || '';
    });

    if (pane.hasAttribute('data-cell2-var')) resolveVars(pane, null, tabDef, ctx.globalVars);
    pane.querySelectorAll('[data-cell2-var]').forEach(function (el) {
      resolveVars(el, null, tabDef, ctx.globalVars);
    });

    var listEl = pane.querySelector('[data-cell2-list]');
    if (listEl) {
      showLoader(listEl);
      populateList(listEl, records, tabDef, ctx.globalVars, ctx.configByTab, ctx.accordionSel);
      hideLoader(listEl);
    }

    ctx.contentContainer.insertBefore(pane, ctx.contentTemplate);
    ctx.paneEls.push(pane);
  }

  async function processTabsElement(wrapperEl, accordionSel) {
    var sheetId    = wrapperEl.getAttribute('data-cell2-id');
    var configName = wrapperEl.getAttribute('data-cell2-config') || '_config';
    var ttl        = ttlFromAttr(wrapperEl);
    if (!sheetId) { console.warn('[cell2-cms] Missing data-cell2-id on tabs wrapper', wrapperEl); return; }

    var linkTemplate    = wrapperEl.querySelector('[data-cell2-tab-link]');
    var contentTemplate = wrapperEl.querySelector('[data-cell2-tab-content]');
    if (!linkTemplate || !contentTemplate) {
      console.warn('[cell2-cms] Needs [data-cell2-tab-link] and [data-cell2-tab-content]', wrapperEl);
      return;
    }

    var linkContainer    = linkTemplate.parentElement;
    var contentContainer = contentTemplate.parentElement;
    linkTemplate.style.display    = 'none';
    contentTemplate.style.display = 'none';

    var config     = await fetchConfig(sheetId, configName, ttl);
    var tabDefs    = [];
    var globalVars = {};

    if (config && config.tabDefs.length) {
      tabDefs    = config.tabDefs;
      globalVars = config.globalVars;
    } else {
      parseList(wrapperEl.getAttribute('data-cell2-sheets')).forEach(function (name) {
        tabDefs.push({ tab: name, sourceTabs: [name], isAggregate: false, label: name,
          description: '', color: '', icon: '', sortCol: '', sortDir: 'asc',
          sortType: 'text', active: false, _row: {} });
      });
      if (!tabDefs.length) {
        console.warn('[cell2-cms] No tabs — add a _config sheet or data-cell2-sheets', wrapperEl);
        showError(wrapperEl, 'No tabs configured');
        return;
      }
    }

    if (wrapperEl.hasAttribute('data-cell2-var')) resolveVars(wrapperEl, null, null, globalVars);
    wrapperEl.querySelectorAll('[data-cell2-var]').forEach(function (el) {
      if (!el.closest('[data-cell2-tab-link]') && !el.closest('[data-cell2-tab-content]')) {
        resolveVars(el, null, null, globalVars);
      }
    });

    var configByTab = {};
    tabDefs.forEach(function (def) {
      if (!def.isAggregate) def.sourceTabs.forEach(function (t) { configByTab[t] = def; });
    });

    var uniqueTabs = {};
    tabDefs.forEach(function (def) { def.sourceTabs.forEach(function (t) { uniqueTabs[t] = true; }); });

    var fetchMap = {};
    await Promise.all(Object.keys(uniqueTabs).map(async function (tabName) {
      try {
        var rows = await cachedFetch(csvUrl(sheetId, tabName), ttl);
        fetchMap[tabName] = rows.map(function (r) {
          var copy = Object.assign({}, r);
          copy._tab = tabName;
          return copy;
        });
      } catch (err) {
        console.error('[cell2-cms] Failed to fetch "' + tabName + '"', err);
        fetchMap[tabName] = [];
      }
    }));

    var visibleFields = getVisibleFields(contentTemplate);

    var ctx = {
      linkTemplate: linkTemplate, contentTemplate: contentTemplate,
      linkContainer: linkContainer, contentContainer: contentContainer,
      linkEls: [], paneEls: [], globalVars: globalVars,
      configByTab: configByTab, accordionSel: accordionSel,
    };

    var activeIndex = 0;
    tabDefs.forEach(function (def) {
      var records;
      if (def.isAggregate) {
        var merged = [];
        def.sourceTabs.forEach(function (t) { merged = merged.concat(fetchMap[t] || []); });
        records = deduplicateRecords(merged, visibleFields);
      } else {
        records = fetchMap[def.sourceTabs[0]] || [];
      }
      if (def.active) activeIndex = ctx.linkEls.length;
      insertTab(def, records, ctx);
    });

    linkTemplate.remove();
    contentTemplate.remove();
    wireTabs(ctx.linkEls, ctx.paneEls, Math.min(activeIndex, ctx.linkEls.length - 1));
  }

  // ─── INIT ──────────────────────────────────────────────────────────────────

  function readAccordionSel(el) {
    return {
      trigger: el.getAttribute('data-cell2-accordion-trigger') || ACCORDION_TRIGGER_DEFAULT,
      panel:   el.getAttribute('data-cell2-accordion-panel')   || ACCORDION_PANEL_DEFAULT,
      icon:    el.getAttribute('data-cell2-accordion-icon')    || ACCORDION_ICON_DEFAULT,
    };
  }

  function init() {
    document.querySelectorAll('[data-cell2-tabs]').forEach(function (el) {
      processTabsElement(el, readAccordionSel(el));
    });
    document.querySelectorAll('[data-cell2-list]').forEach(function (listEl) {
      if (listEl.closest('[data-cell2-tabs]')) return;
      processListElement(listEl, readAccordionSel(listEl));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

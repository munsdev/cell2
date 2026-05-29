/**
 * cell2-map.js  v1.0.1
 * Cell2 — Google Sheets → Leaflet Map
 * https://cell2.site
 *
 * Plot rows from a Google Sheet on an interactive map. No build step, no API
 * keys. Leaflet + MarkerCluster load themselves from a CDN at runtime.
 * Pairs with cell2-cms.js (shared cache + config sheet + list→map linking).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * QUICK START
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   <div data-cell2-map-wrapper data-cell2-id="SHEET_ID" data-cell2-sheet="Places">
 *     <div data-cell2-map style="height:480px"></div>
 *   </div>
 *   <script src="https://cdn.jsdelivr.net/gh/USER/cell2@v1.0.0/cell2-map.js"></script>
 *
 * Rows need latitude + longitude columns (default names: Latitude, Longitude).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * MAP WRAPPER  (outer container — holds map + popup template + controls)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   data-cell2-map-wrapper             presence flag
 *   data-cell2-map-id="my-map"         id for list→map linking
 *   data-cell2-id="SHEET_ID"           Google Sheet ID
 *   data-cell2-sheet="Tab Name"        single tab (fallback when no config)
 *   data-cell2-config="_config"        config tab name (default: _config)
 *   data-cell2-col-lat="Latitude"      latitude column
 *   data-cell2-col-lng="Longitude"     longitude column
 *   data-cell2-col-name="Name"         name column (used for list linking)
 *   data-cell2-map-filter-logic="and"  and | or across filter dropdowns
 *   data-cell2-cache-ttl="60"          cache seconds (default: 60)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * MAP ELEMENT  (Leaflet renders here — must have a CSS height)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   data-cell2-map
 *   data-cell2-map-zoom="3"            initial zoom (default: 3 desktop / 2 mobile)
 *   data-cell2-map-center="20,0"       initial center "lat,lng" (default: 20,0)
 *   data-cell2-map-tiles="osm"         tile style (see TILE STYLES below)
 *   data-cell2-map-cluster-radius="80" cluster radius px (default: 80)
 *   data-cell2-map-refit="true"        refit bounds after filtering (default: true)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TILE STYLES  (data-cell2-map-tiles)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   osm          OpenStreetMap standard            (default)
 *   carto-light  Carto Positron — light/minimal
 *   carto-dark   Carto Dark Matter — dark
 *   esri-street  Esri World Street Map
 *   esri-topo    Esri World Topographic
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CONFIG SHEET  (shared with cell2-cms.js)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   Tab      Tab name(s). Comma list = aggregate. * = global vars row.
 *   Color    Hex marker color for rows from that tab (#ef4444)
 *   Icon     Emoji / text marker icon for rows from that tab
 *
 * Marker style per row (first hit wins):
 *   1. Color/Icon column in the row   2. source tab's config row   3. default
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * POPUP CARD TEMPLATE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   data-cell2-map-card                template — auto-hidden, cloned per popup
 *   data-cell2-field="Column"          → textContent
 *   data-cell2-field-html="Column"     → innerHTML
 *   data-cell2-field-attr="src:Column" → sets attribute
 *   data-cell2-field-wrapper           removed if child field blank
 *   data-cell2-show-if="Column"        removed if value falsy
 *   data-cell2-meta="tab-label"        source tab's config Label (per record)
 *   data-cell2-meta="tab-name"         source tab's raw sheet name (per record)
 *   data-cell2-var="name:Column"       CSS var from row / config / global
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FILTER CONTROLS  (anywhere inside the wrapper)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   data-cell2-map-search              search input (debounced 250ms)
 *   data-cell2-map-search-cols="A, B"  limit search to these columns
 *   data-cell2-map-search-btn          search immediately on click
 *   data-cell2-map-reset               clear all filters + reset view
 *   data-cell2-map-filter="Column"     dropdown — auto-populated
 *   data-cell2-map-filter-tabs         flag — populate dropdown from tab labels
 *   data-cell2-map-filter-multi        multi-select dropdown
 *   data-cell2-map-locate              click → geolocate → fly to user
 *   data-cell2-count                   populated with visible marker count
 *   data-cell2-empty                   shown when zero markers visible
 *   data-cell2-error                   shown on fetch failure
 *                                      (data-cell2-field="message" gets the error)
 *
 * AND/OR across dropdowns: data-cell2-map-filter-logic on wrapper (default: and).
 * Within one multi-select: always OR. Aggregate tab options match all source tabs.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * LIST LINKING  (requires cell2-cms.js)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   data-cell2-map-id="id"    on this map wrapper
 *   data-cell2-map-ref="id"   on the [data-cell2-list] in cell2-cms.js
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTES
 * ═══════════════════════════════════════════════════════════════════════════
 *  • Sheet must be published to the web (CSV)
 *  • Lat/lng must be decimals; invalid rows are skipped
 *  • Multiple map wrappers per page are supported
 *  • Append ?clearcache to any URL to wipe cached data
 *  • No API keys — Leaflet loads from cdnjs at runtime
 */

(function () {
  'use strict';

  // ─── SHARED FETCH CACHE ────────────────────────────────────────────────────
  // Shared with cell2-cms.js via window.__cell2Cache. First script wins.

  var _cache    = window.__cell2Cache = window.__cell2Cache || {};
  var TTL_MS    = 60 * 1000;
  var LS_TTL_MS = 60 * 60 * 1000;
  var LS_PREFIX = 'cell2_cache_';

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

  async function cachedFetch(url, ttlMs) {
    var memTtl = ttlMs || TTL_MS;
    var lsTtl  = ttlMs ? ttlMs * 60 : LS_TTL_MS;
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
    try { localStorage.setItem(LS_PREFIX + url, JSON.stringify({ ts: now, data: data })); } catch (e) {}
    return data;
  }

  // ─── DEFAULTS ────────────────────────────────────────────────────────────────

  var MARKER_DEFAULT     = { color: '#6b7280', icon: '📍', size: 36 };
  var SEARCH_DEBOUNCE_MS = 250;

  var ZOOM_DEFAULT_DESKTOP = 3;
  var ZOOM_DEFAULT_MOBILE  = 2;
  var ZOOM_FLYTO_DESKTOP   = 12;
  var ZOOM_FLYTO_MOBILE    = 8;
  var ZOOM_LOCATE          = 6;

  var IS_MOBILE   = window.innerWidth <= 767;
  var DEFAULT_LAT = 20;
  var DEFAULT_LNG = 0;

  // ─── TILE LAYERS ─────────────────────────────────────────────────────────────

  var TILE_LAYERS = {
    'osm': {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      opts: { attribution: '© OpenStreetMap contributors', maxZoom: 19 },
    },
    'carto-light': {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      opts: { attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 20 },
    },
    'carto-dark': {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      opts: { attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 20 },
    },
    'esri-street': {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      opts: { attribution: '© Esri', maxZoom: 19 },
    },
    'esri-topo': {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      opts: { attribution: '© Esri', maxZoom: 19 },
    },
  };

  // ─── LEAFLET LOADER ────────────────────────────────────────────────────────

  var leafletReady = null;

  function loadLeaflet() {
    if (leafletReady) return leafletReady;
    function loadAsset(tag, attrs) {
      return new Promise(function (resolve, reject) {
        var sel = tag === 'link' ? 'link[href="' + attrs.href + '"]' : 'script[src="' + attrs.src + '"]';
        if (document.querySelector(sel)) { resolve(); return; }
        var el = document.createElement(tag);
        Object.keys(attrs).forEach(function (k) { el[k] = attrs[k]; });
        el.onload = resolve;
        el.onerror = function () { reject(new Error('Failed: ' + (attrs.src || attrs.href))); };
        document.head.appendChild(el);
      });
    }
    leafletReady = Promise.all([
      loadAsset('link', { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css' }),
      loadAsset('link', { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.min.css' }),
      loadAsset('link', { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.min.css' }),
    ]).then(function () {
      return loadAsset('script', { src: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js' });
    }).then(function () {
      return loadAsset('script', { src: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.min.js' });
    });
    return leafletReady;
  }

  // ─── UTILITIES ──────────────────────────────────────────────────────────────

  function isTruthy(val) {
    if (!val) return false;
    var v = val.trim().toLowerCase();
    return v === 'true' || v === 'yes' || v === '1' || v === '✓' || v === 'x';
  }

  function setVisible(el, visible) { if (el) el.style.display = visible ? '' : 'none'; }

  function showError(scopeEl, message) {
    var errEl = scopeEl.querySelector('[data-cell2-error]');
    if (!errEl) return;
    var msgEl = errEl.querySelector('[data-cell2-field="message"]');
    if (msgEl && message) msgEl.textContent = message;
    setVisible(errEl, true);
  }

  function getVisibleFields(templateEl) {
    if (!templateEl) return [];
    var fields = [];
    templateEl.querySelectorAll('[data-cell2-field], [data-cell2-field-html]').forEach(function (el) {
      var key = el.getAttribute('data-cell2-field') || el.getAttribute('data-cell2-field-html');
      if (key && key !== 'message' && fields.indexOf(key) === -1) fields.push(key);
    });
    return fields;
  }

  function deduplicateRecords(records, visibleFields) {
    if (!visibleFields.length) return records;
    var seen = {};
    return records.filter(function (r) {
      var fp = visibleFields.map(function (f) { return (r[f] || '').toLowerCase(); }).join('||');
      if (seen[fp]) return false;
      seen[fp] = true;
      return true;
    });
  }

  function parseList(str) {
    if (!str) return [];
    return str.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function ttlFromAttr(el) {
    var raw = el && el.getAttribute('data-cell2-cache-ttl');
    var n = raw ? parseInt(raw, 10) : 0;
    return (n && !isNaN(n)) ? n * 1000 : 0;
  }

  function debounce(fn, wait) {
    var timer;
    return function () { var a = arguments; clearTimeout(timer); timer = setTimeout(function () { fn.apply(null, a); }, wait); };
  }

  function csvUrl(sheetId, sheetName) {
    return 'https://docs.google.com/spreadsheets/d/' + sheetId +
      '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(sheetName);
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
        obj[h] = val; if (val) hasValue = true;
      });
      if (hasValue) records.push(obj);
    }
    return records;
  }

  // ─── CSS VAR RESOLUTION ─────────────────────────────────────────────────────

  function resolveVars(el, itemRecord, globalVars, individualConfigRow) {
    var attr = el.getAttribute('data-cell2-var');
    if (!attr) return;
    var individualRaw = individualConfigRow && individualConfigRow._row
      ? individualConfigRow._row : (individualConfigRow || {});

    attr.split(';').forEach(function (pair) {
      var idx = pair.indexOf(':');
      if (idx === -1) return;
      var varName = pair.slice(0, idx).trim(), col = pair.slice(idx + 1).trim();
      if (!varName || !col) return;
      var val = '';
      if (itemRecord && itemRecord[col])      val = itemRecord[col];
      else if (individualRaw[col])            val = individualRaw[col];
      else if (globalVars && globalVars[col]) val = globalVars[col];
      if (val) el.style.setProperty('--' + varName, val);
    });
  }

  // ─── CONFIG SHEET ─────────────────────────────────────────────────────────

  async function fetchConfig(sheetId, configTabName, ttlMs) {
    var rows;
    try { rows = await cachedFetch(csvUrl(sheetId, configTabName), ttlMs); }
    catch (e) { return null; }
    if (!rows.length) return null;

    var tabDefs = [], globalVars = {};
    rows.forEach(function (row) {
      var tab = (row['Tab'] || '').trim();
      if (!tab) return;
      if (tab === '*') {
        var skip = { 'Tab': true, 'Label': true, 'Sort By': true, 'Sort Dir': true, 'Sort Type': true, 'Active': true };
        Object.keys(row).forEach(function (k) { if (!skip[k]) globalVars[k] = row[k]; });
        return;
      }
      var sources = tab.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      tabDefs.push({
        tab: tab, sourceTabs: sources, isAggregate: sources.length > 1,
        label: (row['Label'] || '').trim() || tab,
        color: (row['Color'] || '').trim(),
        icon:  (row['Icon']  || '').trim(),
        _row: row,
      });
    });
    return { tabDefs: tabDefs, globalVars: globalVars };
  }

  // ─── CARD POPULATION ─────────────────────────────────────────────────────

  function populateCard(cardEl, record, globalVars, individualConfigRow) {
    function removeWrapperOrClear(el, clearFn) {
      var ancestor = el.parentElement;
      while (ancestor && ancestor !== cardEl) {
        if (ancestor.hasAttribute('data-cell2-field-wrapper')) { ancestor.remove(); return; }
        ancestor = ancestor.parentElement;
      }
      clearFn();
    }

    cardEl.querySelectorAll('[data-cell2-field]').forEach(function (el) {
      var key = el.getAttribute('data-cell2-field');
      if (key === 'message') return;
      var val = key && record[key] !== undefined ? record[key] : '';
      if (val) el.textContent = val;
      else removeWrapperOrClear(el, function () { el.textContent = ''; });
    });

    cardEl.querySelectorAll('[data-cell2-field-html]').forEach(function (el) {
      var key = el.getAttribute('data-cell2-field-html');
      var val = key && record[key] !== undefined ? record[key] : '';
      if (val) el.innerHTML = val;
      else removeWrapperOrClear(el, function () { el.innerHTML = ''; });
    });

    cardEl.querySelectorAll('[data-cell2-field-attr]').forEach(function (el) {
      var spec = el.getAttribute('data-cell2-field-attr');
      var idx  = spec.indexOf(':');
      if (idx === -1) return;
      var attr = spec.slice(0, idx).trim();
      var key  = spec.slice(idx + 1).trim();
      var val  = key && record[key] !== undefined ? record[key] : '';
      if (val) el.setAttribute(attr, val);
      else removeWrapperOrClear(el, function () { el.removeAttribute(attr); });
    });

    cardEl.querySelectorAll('[data-cell2-show-if]').forEach(function (el) {
      var key = el.getAttribute('data-cell2-show-if');
      if (!isTruthy(record[key])) el.remove();
    });

    // meta — source tab name / label for this record (matches the CMS side)
    var tabName  = record._tab || '';
    var tabLabel = (individualConfigRow && individualConfigRow.label) || tabName;
    cardEl.querySelectorAll('[data-cell2-meta]').forEach(function (el) {
      var meta = el.getAttribute('data-cell2-meta');
      if (meta === 'tab-label') el.textContent = tabLabel;
      else if (meta === 'tab-name') el.textContent = tabName;
    });

    cardEl.querySelectorAll('[data-cell2-var]').forEach(function (el) {
      resolveVars(el, record, globalVars, individualConfigRow);
    });
    if (cardEl.hasAttribute('data-cell2-var')) resolveVars(cardEl, record, globalVars, individualConfigRow);
    return cardEl;
  }

  function buildPopupContent(cardTemplate, record, globalVars, individualConfigRow) {
    var clone = cardTemplate.cloneNode(true);
    clone.style.display = '';
    clone.removeAttribute('data-cell2-map-card');
    populateCard(clone, record, globalVars, individualConfigRow);
    return clone.outerHTML;
  }

  // ─── MARKER STYLE ─────────────────────────────────────────────────────────

  function getMarkerStyle(record, individualConfigRow) {
    var color = (record && record['Color'])
      || (individualConfigRow && individualConfigRow.color) || MARKER_DEFAULT.color;
    var icon  = (record && record['Icon'])
      || (individualConfigRow && individualConfigRow.icon)  || MARKER_DEFAULT.icon;
    return { color: color, icon: icon, size: MARKER_DEFAULT.size };
  }

  function createMarkerIcon(style) {
    var size = style.size;
    var html = '<div style="background-color:' + style.color + ';border:2px solid white;border-radius:50%;width:' + size +
      'px;height:' + size + 'px;display:flex;align-items:center;justify-content:center;font-size:' +
      Math.round(size * 0.5) + 'px;box-shadow:0 2px 8px rgba(0,0,0,0.25);cursor:pointer;">' + style.icon + '</div>';
    return L.divIcon({ html: html, iconSize: [size, size], iconAnchor: [size / 2, size], popupAnchor: [0, -size], className: 'cell2-map-marker' });
  }

  // ─── FILTERING ──────────────────────────────────────────────────────────────

  function getUniqueValues(records, col) {
    var seen = {}, vals = [];
    records.forEach(function (r) { var v = (r[col] || '').trim(); if (v && !seen[v]) { seen[v] = true; vals.push(v); } });
    return vals.sort();
  }

  function populateFilterDropdown(selectEl, records, col, isMulti) {
    Array.from(selectEl.options).forEach(function (opt, idx) { if (idx > 0) opt.remove(); });
    getUniqueValues(records, col).forEach(function (v) {
      var opt = document.createElement('option');
      opt.value = v; opt.textContent = v; selectEl.appendChild(opt);
    });
    if (isMulti) selectEl.setAttribute('multiple', '');
  }

  function applyFilters(records, filterState) {
    var query  = (filterState.search || '').toLowerCase().trim();
    var logic  = filterState.logic || 'and';
    var active = (filterState.filters || []).filter(function (f) { return f.values && f.values.length; });

    return records.filter(function (record) {
      if (query) {
        var cols = filterState.searchCols && filterState.searchCols.length ? filterState.searchCols : Object.keys(record);
        if (!cols.some(function (c) { return (record[c] || '').toLowerCase().indexOf(query) !== -1; })) return false;
      }
      if (!active.length) return true;

      function matchesFilter(f) {
        if (f.col === '_tab') {
          var recordTab = (record._tab || '').toLowerCase();
          return f.values.some(function (v) {
            return v.split(',').map(function (s) { return s.trim().toLowerCase(); })
              .some(function (t) { return t === recordTab; });
          });
        }
        var val = (record[f.col] || '').trim();
        return f.values.some(function (v) { return v.toLowerCase() === val.toLowerCase(); });
      }

      return logic === 'or' ? active.some(matchesFilter) : active.every(matchesFilter);
    });
  }

  // ─── MAP INSTANCE ─────────────────────────────────────────────────────────

  async function initMapInstance(wrapperEl) {
    var sheetId    = wrapperEl.getAttribute('data-cell2-id');
    var sheetName  = wrapperEl.getAttribute('data-cell2-sheet') || 'Sheet1';
    var configName = wrapperEl.getAttribute('data-cell2-config') || '_config';
    var mapId      = wrapperEl.getAttribute('data-cell2-map-id') || '';
    var colLat     = wrapperEl.getAttribute('data-cell2-col-lat') || 'Latitude';
    var colLng     = wrapperEl.getAttribute('data-cell2-col-lng') || 'Longitude';
    var colName    = wrapperEl.getAttribute('data-cell2-col-name') || 'Name';
    var logic      = (wrapperEl.getAttribute('data-cell2-map-filter-logic') || 'and').toLowerCase();
    var ttl        = ttlFromAttr(wrapperEl);

    if (!sheetId) { console.warn('[cell2-map] Missing data-cell2-id', wrapperEl); return; }

    var mapEl        = wrapperEl.querySelector('[data-cell2-map]');
    var cardTemplate = wrapperEl.querySelector('[data-cell2-map-card]');
    if (cardTemplate) cardTemplate.style.display = 'none';
    if (!mapEl) { console.warn('[cell2-map] No [data-cell2-map] found', wrapperEl); return; }

    setVisible(wrapperEl.querySelector('[data-cell2-empty]'), false);
    setVisible(wrapperEl.querySelector('[data-cell2-error]'), false);

    try { await loadLeaflet(); }
    catch (err) { console.error('[cell2-map] Leaflet load failed', err); showError(wrapperEl, 'Map library failed to load'); return; }

    // center
    var centerAttr = mapEl.getAttribute('data-cell2-map-center');
    var center = [DEFAULT_LAT, DEFAULT_LNG];
    if (centerAttr) {
      var parts = centerAttr.split(',').map(function (s) { return parseFloat(s.trim()); });
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) center = parts;
    }

    var attrZoom = mapEl.getAttribute('data-cell2-map-zoom');
    var initZoom = attrZoom ? parseFloat(attrZoom) : (IS_MOBILE ? ZOOM_DEFAULT_MOBILE : ZOOM_DEFAULT_DESKTOP);
    var clusterR = parseInt(mapEl.getAttribute('data-cell2-map-cluster-radius') || '80', 10);
    var refit    = (mapEl.getAttribute('data-cell2-map-refit') || 'true').toLowerCase() !== 'false';

    var tileKey  = (mapEl.getAttribute('data-cell2-map-tiles') || 'osm').toLowerCase();
    var tile     = TILE_LAYERS[tileKey] || TILE_LAYERS['osm'];

    var map = L.map(mapEl, { center: center, zoom: initZoom });

    setTimeout(function () {
      map.invalidateSize({ animate: false, pan: false });
      map.setView(center, initZoom, { animate: false });
    }, 0);

    L.tileLayer(tile.url, tile.opts).addTo(map);

    var clusterGroup = L.markerClusterGroup({ maxClusterRadius: clusterR });
    map.addLayer(clusterGroup);

    var config     = await fetchConfig(sheetId, configName, ttl);
    var tabDefs    = config ? config.tabDefs : [];
    var globalVars = config ? config.globalVars : {};

    if (wrapperEl.hasAttribute('data-cell2-var')) resolveVars(wrapperEl, null, globalVars);
    wrapperEl.querySelectorAll('[data-cell2-var]').forEach(function (el) {
      if (!el.closest('[data-cell2-map-card]')) resolveVars(el, null, globalVars);
    });

    var configByTab = {};
    tabDefs.forEach(function (def) {
      if (!def.isAggregate) def.sourceTabs.forEach(function (t) { configByTab[t] = def; });
    });

    var tabNames;
    if (tabDefs.length) {
      var seen = {};
      tabNames = [];
      tabDefs.forEach(function (def) {
        def.sourceTabs.forEach(function (t) { if (!seen[t]) { seen[t] = true; tabNames.push(t); } });
      });
    } else {
      tabNames = parseList(wrapperEl.getAttribute('data-cell2-sheet'));
      if (!tabNames.length) tabNames = [sheetName];
    }

    var allFetches;
    try {
      allFetches = await Promise.all(tabNames.map(async function (tabName) {
        var rows = await cachedFetch(csvUrl(sheetId, tabName), ttl);
        return rows.map(function (r) { var copy = Object.assign({}, r); copy._tab = tabName; return copy; });
      }));
    } catch (err) {
      console.error('[cell2-map]', err);
      showError(wrapperEl, String(err && err.message || err));
      return;
    }

    var records = [];
    allFetches.forEach(function (rows) { records = records.concat(rows); });

    var validRecords = records.filter(function (r) {
      return !isNaN(parseFloat(r[colLat])) && !isNaN(parseFloat(r[colLng]));
    });

    if (!validRecords.length) {
      console.warn('[cell2-map] No valid lat/lng records');
      setVisible(wrapperEl.querySelector('[data-cell2-empty]'), true);
      return;
    }

    var visibleFields = getVisibleFields(cardTemplate);
    validRecords = deduplicateRecords(validRecords, visibleFields);

    var markerMap = {};
    validRecords.forEach(function (record) {
      var lat = parseFloat(record[colLat]);
      var lng = parseFloat(record[colLng]);
      var name = record[colName] || '';
      var individualConfig = configByTab[record._tab] || null;
      var style  = getMarkerStyle(record, individualConfig);
      var marker = L.marker([lat, lng], { icon: createMarkerIcon(style) });

      if (cardTemplate) marker.bindPopup(buildPopupContent(cardTemplate, record, globalVars, individualConfig), { maxWidth: 360 });
      else marker.bindPopup('<strong>' + name + '</strong>');

      clusterGroup.addLayer(marker);
      markerMap[name] = { marker: marker, record: record, individualConfig: individualConfig };
    });

    // ── Filters ──────────────────────────────────────────────────────────────
    var filterEls   = wrapperEl.querySelectorAll('[data-cell2-map-filter], [data-cell2-map-filter-tabs]:not([data-cell2-map-filter])');
    var filterState = { search: '', searchCols: null, filters: [], logic: logic };

    filterEls.forEach(function (selectEl, idx) {
      var col         = selectEl.getAttribute('data-cell2-map-filter') || '';
      var isMulti     = selectEl.hasAttribute('data-cell2-map-filter-multi');
      var isTabFilter = selectEl.hasAttribute('data-cell2-map-filter-tabs');

      if (isTabFilter) {
        var labels = tabDefs.length
          ? tabDefs.map(function (d) { return { value: d.sourceTabs.join(','), label: d.label }; })
          : tabNames.map(function (t) { return { value: t, label: t }; });
        labels.forEach(function (item) {
          var opt = document.createElement('option');
          opt.value = item.value; opt.textContent = item.label; selectEl.appendChild(opt);
        });
        if (isMulti) selectEl.setAttribute('multiple', '');
        filterState.filters.push({ col: '_tab', values: [], multi: isMulti });
      } else {
        populateFilterDropdown(selectEl, validRecords, col, isMulti);
        filterState.filters.push({ col: col, values: [], multi: isMulti });
      }

      selectEl.addEventListener('change', function () {
        filterState.filters[idx].values = Array.from(selectEl.selectedOptions)
          .map(function (o) { return o.value; }).filter(Boolean);
        applyAndRender();
      });
    });

    var searchEl    = wrapperEl.querySelector('[data-cell2-map-search]');
    var searchBtnEl = wrapperEl.querySelector('[data-cell2-map-search-btn]');
    var resetEl     = wrapperEl.querySelector('[data-cell2-map-reset]');

    if (searchEl) {
      var searchColsAttr = searchEl.getAttribute('data-cell2-map-search-cols');
      filterState.searchCols = searchColsAttr ? parseList(searchColsAttr) : null;
      var doSearch = debounce(function () { filterState.search = searchEl.value; applyAndRender(); }, SEARCH_DEBOUNCE_MS);
      searchEl.addEventListener('input', doSearch);
      if (searchBtnEl) searchBtnEl.addEventListener('click', function () { filterState.search = searchEl.value; applyAndRender(); });
    }

    function resetFilters() {
      if (searchEl) { searchEl.value = ''; filterState.search = ''; }
      filterEls.forEach(function (selectEl, idx) {
        Array.from(selectEl.options).forEach(function (o) { o.selected = false; });
        if (!filterState.filters[idx].multi && selectEl.options[0]) selectEl.options[0].selected = true;
        filterState.filters[idx].values = [];
      });
      applyAndRender();
    }

    if (resetEl) {
      resetEl.addEventListener('click', function () {
        resetFilters();
        map.setView(center, initZoom, { animate: true });
      });
    }

    var locateEl = wrapperEl.querySelector('[data-cell2-map-locate]');
    if (locateEl && navigator.geolocation) {
      locateEl.addEventListener('click', function () {
        navigator.geolocation.getCurrentPosition(
          function (pos) {
            var zoom = Math.min(IS_MOBILE ? ZOOM_FLYTO_MOBILE : ZOOM_FLYTO_DESKTOP, ZOOM_LOCATE);
            map.flyTo([pos.coords.latitude, pos.coords.longitude], zoom, { duration: 1.5 });
          },
          function () {}
        );
      });
    }

    // ── Render ─────────────────────────────────────────────────────────────
    function applyAndRender() {
      var passing = applyFilters(validRecords, filterState);
      var passingNames = {};
      passing.forEach(function (r) { passingNames[r[colName]] = true; });

      clusterGroup.clearLayers();
      var visibleMarkers = [];
      Object.keys(markerMap).forEach(function (name) {
        if (passingNames[name]) { clusterGroup.addLayer(markerMap[name].marker); visibleMarkers.push(markerMap[name].marker); }
      });

      wrapperEl.querySelectorAll('[data-cell2-count]').forEach(function (el) { el.textContent = visibleMarkers.length; });
      setVisible(wrapperEl.querySelector('[data-cell2-empty]'), visibleMarkers.length === 0);

      if (refit && visibleMarkers.length) {
        var group = L.featureGroup(visibleMarkers);
        map.fitBounds(group.getBounds(), { padding: [32, 32], animate: true, maxZoom: 10 });
      }
    }

    // initial count
    wrapperEl.querySelectorAll('[data-cell2-count]').forEach(function (el) { el.textContent = validRecords.length; });

    if (mapId) {
      window.__cell2Maps = window.__cell2Maps || {};
      window.__cell2Maps[mapId] = {
        flyToName: function (name, zoom) {
          var entry = markerMap[name];
          if (!entry) return;
          resetFilters();
          var targetZoom = zoom || (IS_MOBILE ? ZOOM_FLYTO_MOBILE : ZOOM_FLYTO_DESKTOP);
          map.flyTo(entry.marker.getLatLng(), targetZoom, { duration: 1 });
          setTimeout(function () { entry.marker.openPopup(); }, 1100);
        },
        nameCol: colName,
      };
    }
  }

  // ─── INIT ──────────────────────────────────────────────────────────────────

  function init() {
    document.querySelectorAll('[data-cell2-map-wrapper]').forEach(function (el) { initMapInstance(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  if (window.Webflow) {
    window.Webflow.push(function () { if (!window.__cell2Maps) init(); });
  }

})();

/* NusaStats — Indonesia & ASEAN-6 national statistics, 2014–2024.
   All figures come from app/data.json (World Bank WDI, fetched 26 Nov 2026).
   Charts are hand-drawn on <canvas>; nothing here fetches another origin. */
'use strict';

const COUNTRIES = [
  { code: 'IDN', name: 'Indonesia', color: '#0f5f5c' },
  { code: 'MYS', name: 'Malaysia', color: '#c07f10' },
  { code: 'PHL', name: 'Philippines', color: '#2b6cb0' },
  { code: 'SGP', name: 'Singapore', color: '#b3382e' },
  { code: 'THA', name: 'Thailand', color: '#6b4fa1' },
  { code: 'VNM', name: 'Vietnam', color: '#1e7a4c' },
];

const INDICATORS = [
  { code: 'SP.POP.TOTL', name: 'Population', unit: 'people', kind: 'pop' },
  { code: 'NY.GDP.MKTP.CD', name: 'GDP', unit: 'current US$', kind: 'gdp' },
  { code: 'NY.GDP.PCAP.CD', name: 'GDP per capita', unit: 'current US$', kind: 'money' },
  { code: 'SP.DYN.LE00.IN', name: 'Life expectancy', unit: 'years', kind: 'years' },
  { code: 'SL.UEM.TOTL.ZS', name: 'Unemployment', unit: '% of labour force', kind: 'pct' },
  { code: 'FP.CPI.TOTL.ZG', name: 'Inflation', unit: '% per year', kind: 'pct' },
  { code: 'SI.POV.NAHC', name: 'Poverty headcount', unit: '% of population', kind: 'pct' },
  { code: 'SE.ADT.LITR.ZS', name: 'Adult literacy', unit: '% of ages 15+', kind: 'pct' },
];

const YEARS = [];
for (let y = 2014; y <= 2024; y++) YEARS.push(y);

let DATA = null;
const viewEl = document.getElementById('view');

/* ---------- formatting ---------- */
function fmtNum(v, decimals) {
  if (v === null || v === undefined) return '—';
  return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function formatValue(kind, v) {
  if (v === null || v === undefined) return '—';
  if (kind === 'pop') return (v / 1e6).toFixed(1) + ' million';
  if (kind === 'gdp') return v >= 1e12 ? '$' + (v / 1e12).toFixed(2) + ' trillion' : '$' + (v / 1e9).toFixed(1) + ' billion';
  if (kind === 'money') return '$' + fmtNum(v, 0);
  if (kind === 'years') return v.toFixed(1) + ' years';
  if (kind === 'pct') return v.toFixed(1) + '%';
  return fmtNum(v, 2);
}
function formatAxis(kind, v) {
  if (kind === 'pop') return (v / 1e6).toFixed(0) + 'm';
  if (kind === 'gdp') return '$' + (v / 1e9).toFixed(0) + 'bn';
  if (kind === 'money') return '$' + fmtNum(v, 0);
  return fmtNum(v, 1);
}
function pctChange(a, b) {
  if (a === null || b === null || a === 0) return null;
  return ((b - a) / Math.abs(a)) * 100;
}

/* ---------- data helpers ---------- */
function seriesFor(code, country) {
  const rows = (DATA.values[code] && DATA.values[code][country]) || {};
  return YEARS.map(y => (rows[y] === undefined ? null : rows[y]));
}
function latestOf(code, country) {
  const s = seriesFor(code, country);
  for (let i = s.length - 1; i >= 0; i--) {
    if (s[i] !== null) return { year: YEARS[i], value: s[i] };
  }
  return { year: null, value: null };
}
function firstOf(code, country) {
  const s = seriesFor(code, country);
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== null) return { year: YEARS[i], value: s[i] };
  }
  return { year: null, value: null };
}
function coverageNote(code, country) {
  const s = seriesFor(code, country);
  const present = s.filter(v => v !== null).length;
  if (present === 0) return 'no data 2014–2024';
  if (present < s.length) {
    const yrs = YEARS.filter((_, i) => s[i] !== null);
    return 'only ' + yrs[0] + '–' + yrs[yrs.length - 1] + ' (' + present + ' years)';
  }
  return '2014–2024';
}

/* ---------- canvas charts ---------- */
function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: rect.width, h: rect.height };
}
function drawLineChart(canvas, seriesList, kind) {
  const { ctx, w, h } = setupCanvas(canvas);
  const padL = 58, padR = 14, padT = 14, padB = 30;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  let lo = Infinity, hi = -Infinity;
  for (const s of seriesList) for (const v of s.values) {
    if (v !== null) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  }
  if (!isFinite(lo)) { ctx.fillStyle = '#666'; ctx.font = '14px system-ui'; ctx.fillText('No data for this selection.', padL, padT + 20); return; }
  if (hi === lo) { hi = lo + 1; }
  const span = hi - lo, pad = span * 0.08;
  lo -= pad; hi += pad;
  if (lo < 0 && seriesList.every(s => s.values.every(v => v === null || v >= 0))) lo = 0;
  const xAt = i => padL + (i / (YEARS.length - 1)) * plotW;
  const yAt = v => padT + (1 - (v - lo) / (hi - lo)) * plotH;
  ctx.font = '12px system-ui';
  ctx.strokeStyle = '#e2ddd0'; ctx.fillStyle = '#5c6f78'; ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const v = lo + (hi - lo) * g / 4, y = yAt(v);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    ctx.textAlign = 'right'; ctx.fillText(formatAxis(kind, v), padL - 8, y + 4);
  }
  ctx.textAlign = 'center';
  for (let i = 0; i < YEARS.length; i += 2) ctx.fillText(String(YEARS[i]), xAt(i), h - 10);
  for (const s of seriesList) {
    ctx.strokeStyle = s.color; ctx.lineWidth = 2.5; ctx.beginPath();
    let started = false;
    s.values.forEach((v, i) => {
      if (v === null) { started = false; return; }
      if (!started) { ctx.moveTo(xAt(i), yAt(v)); started = true; }
      else ctx.lineTo(xAt(i), yAt(v));
    });
    ctx.stroke();
    s.values.forEach((v, i) => {
      if (v === null) return;
      ctx.fillStyle = s.color;
      ctx.beginPath(); ctx.arc(xAt(i), yAt(v), 3.5, 0, Math.PI * 2); ctx.fill();
    });
  }
  return { xAt, yAt, padL, padR, padT, plotW };
}
function drawBarChart(canvas, rows, kind) {
  const { ctx, w, h } = setupCanvas(canvas);
  const padL = 58, padR = 14, padT = 16, padB = 34;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  const vals = rows.map(r => r.value).filter(v => v !== null);
  const max = vals.length ? Math.max(...vals) * 1.08 : 1;
  const n = rows.length, gap = 14, bw = Math.min(64, (plotW - gap * (n + 1)) / n);
  ctx.font = '12px system-ui';
  ctx.strokeStyle = '#e2ddd0'; ctx.fillStyle = '#5c6f78';
  for (let g = 0; g <= 4; g++) {
    const v = max * g / 4, y = padT + (1 - g / 4) * plotH;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    ctx.textAlign = 'right'; ctx.fillText(formatAxis(kind, v), padL - 8, y + 4);
  }
  rows.forEach((r, i) => {
    const x = padL + gap + i * (bw + gap);
    if (r.value !== null) {
      const bh = (r.value / max) * plotH;
      ctx.fillStyle = r.color;
      ctx.fillRect(x, padT + plotH - bh, bw, bh);
      ctx.fillStyle = '#14232b'; ctx.textAlign = 'center';
      ctx.fillText(formatValue(kind, r.value), x + bw / 2, padT + plotH - bh - 6);
    } else {
      ctx.fillStyle = '#9a938a'; ctx.textAlign = 'center';
      ctx.fillText('no data', x + bw / 2, padT + plotH - 8);
    }
    ctx.fillStyle = '#3d5563'; ctx.textAlign = 'center';
    ctx.fillText(r.label, x + bw / 2, h - 12);
  });
}

/* ---------- shared bits ---------- */
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function kpiCard(label, code, country) {
  const latest = latestOf(code, country);
  const first = firstOf(code, country);
  const ind = INDICATORS.find(i => i.code === code);
  const ch = pctChange(first.value, latest.value);
  const arrow = ch === null ? '' : (ch >= 0 ? '▲' : '▼');
  const cls = ch === null ? '' : (ch >= 0 ? 'up' : 'down');
  const changeText = ch === null ? 'no earlier year'
    : arrow + ' ' + Math.abs(ch).toFixed(1) + '% vs ' + first.year;
  return '<div class="kpi"><div class="label">' + esc(label) + '</div>' +
    '<div class="value">' + formatValue(ind.kind, latest.value) + '</div>' +
    '<div class="sub">' + (latest.year || '—') + ' · <b class="' + cls + '">' + changeText + '</b></div></div>';
}
function legendHtml(list) {
  return '<div class="legend">' + list.map(c =>
    '<span><i style="background:' + c.color + '"></i>' + esc(c.name) + '</span>').join('') + '</div>';
}
function setActiveNav(route) {
  document.querySelectorAll('[data-nav]').forEach(a =>
    a.classList.toggle('active', a.dataset.nav === route));
}

/* ---------- views ---------- */
function renderOverview() {
  const pop = latestOf('SP.POP.TOTL', 'IDN');
  const gdp = latestOf('NY.GDP.MKTP.CD', 'IDN');
  const gdpPc = latestOf('NY.GDP.PCAP.CD', 'IDN');
  const life = latestOf('SP.DYN.LE00.IN', 'IDN');
  const unem = latestOf('SL.UEM.TOTL.ZS', 'IDN');
  const popFirst = firstOf('SP.POP.TOTL', 'IDN');
  const gdpFirst = firstOf('NY.GDP.MKTP.CD', 'IDN');
  const lifeFirst = firstOf('SP.DYN.LE00.IN', 'IDN');
  const unemFirst = firstOf('SL.UEM.TOTL.ZS', 'IDN');
  const popGrowth = pctChange(popFirst.value, pop.value);
  const gdpGrowth = pctChange(gdpFirst.value, gdp.value);
  const lifeGain = (life.value - lifeFirst.value).toFixed(1);
  const unemShift = (unem.value - unemFirst.value).toFixed(1);

  viewEl.innerHTML =
    '<h1>Indonesia in numbers</h1>' +
    '<p class="lede">Ten years of national statistics for Indonesia — population, economy, health and work — ' +
    'set against five ASEAN neighbours. Every figure is a real World Bank figure with its year attached.</p>' +
    '<div class="kpis">' +
    kpiCard('Population', 'SP.POP.TOTL', 'IDN') +
    kpiCard('GDP', 'NY.GDP.MKTP.CD', 'IDN') +
    kpiCard('GDP per capita', 'NY.GDP.PCAP.CD', 'IDN') +
    kpiCard('Life expectancy', 'SP.DYN.LE00.IN', 'IDN') +
    kpiCard('Unemployment', 'SL.UEM.TOTL.ZS', 'IDN') +
    '</div>' +
    '<section class="panel"><h2>Population growth, 2014–2024</h2>' +
    '<p>Indonesia added about <strong>' + fmtNum((pop.value - popFirst.value) / 1e6, 1) +
    ' million people</strong> in a decade — from ' + formatValue('pop', popFirst.value) + ' in ' + popFirst.year +
    ' to ' + formatValue('pop', pop.value) + ' in ' + pop.year + '.</p>' +
    '<div class="chart-wrap"><canvas id="popChart" class="chart" role="img" aria-label="Line chart of Indonesia population 2014 to 2024"></canvas></div>' +
    legendHtml([COUNTRIES[0]]) +
    '<p class="note">Source: World Bank WDI, indicator SP.POP.TOTL.</p></section>' +
    '<section class="panel story"><h2>The decade in brief</h2>' +
    '<p><strong>A bigger country.</strong> Population grew ' + popGrowth.toFixed(1) + '% between ' + popFirst.year +
    ' and ' + pop.year + ', reaching ' + formatValue('pop', pop.value) + ' — still the largest in Southeast Asia by a wide margin.</p>' +
    '<p><strong>A bigger economy.</strong> GDP rose ' + gdpGrowth.toFixed(1) + '% in current US dollars, from ' +
    formatValue('gdp', gdpFirst.value) + ' in ' + gdpFirst.year + ' to ' + formatValue('gdp', gdp.value) + ' in ' + gdp.year +
    '. GDP per capita reached ' + formatValue('money', gdpPc.value) + '.</p>' +
    '<p><strong>Longer lives.</strong> Life expectancy at birth rose ' + lifeGain + ' years, from ' +
    lifeFirst.value.toFixed(1) + ' in ' + lifeFirst.year + ' to ' + life.value.toFixed(1) + ' in ' + life.year + '.</p>' +
    '<p><strong>A tighter labour market — then looser.</strong> Unemployment moved from ' + unemFirst.value.toFixed(1) +
    '% in ' + unemFirst.year + ' to ' + unem.value.toFixed(1) + '% in ' + unem.year +
    ' (' + (unemShift >= 0 ? '+' : '') + unemShift + ' points). It spiked during the pandemic years; open the ' +
    '<a href="#/explorer">Explorer</a> and pick Unemployment to see the full path.</p></section>' +
    '<section class="panel"><h2>ASEAN-6 at a glance — latest year</h2>' +
    '<div class="scroll-x"><table class="data"><thead><tr><th>Country</th><th>Population</th><th>GDP per capita</th><th>Life expectancy</th></tr></thead><tbody>' +
    COUNTRIES.map(c => {
      const p = latestOf('SP.POP.TOTL', c.code), g = latestOf('NY.GDP.PCAP.CD', c.code), l = latestOf('SP.DYN.LE00.IN', c.code);
      return '<tr' + (c.code === 'IDN' ? ' class="hl"' : '') + '><td>' + esc(c.name) + '</td><td>' +
        formatValue('pop', p.value) + ' (' + (p.year || '—') + ')</td><td>' +
        formatValue('money', g.value) + ' (' + (g.year || '—') + ')</td><td>' +
        formatValue('years', l.value) + ' (' + (l.year || '—') + ')</td></tr>';
    }).join('') +
    '</tbody></table></div>' +
    '<p class="note">Singapore leads on income and longevity; Indonesia leads on population. ' +
    'Full comparisons live in <a href="#/compare">Compare</a>.</p></section>';
  const canvas = document.getElementById('popChart');
  drawLineChart(canvas, [{ values: seriesFor('SP.POP.TOTL', 'IDN'), color: COUNTRIES[0].color }], 'pop');
}

function renderExplorer() {
  viewEl.innerHTML =
    '<h1>Explorer</h1>' +
    '<p class="lede">Pick an indicator and the countries to draw. Hover the chart for the year-by-year values; the table below lists every year.</p>' +
    '<div class="controls"><label for="indSelect">Indicator</label>' +
    '<select id="indSelect">' + INDICATORS.map(i =>
      '<option value="' + i.code + '">' + esc(i.name) + ' (' + esc(i.unit) + ')</option>').join('') + '</select></div>' +
    '<div class="controls toggles" id="countryToggles">' +
    COUNTRIES.map(c => '<label><input type="checkbox" value="' + c.code + '" checked> ' + esc(c.name) + '</label>').join('') +
    '</div>' +
    '<section class="panel"><h2 id="chartTitle"></h2>' +
    '<div class="chart-wrap"><canvas id="exChart" class="chart tall" role="img" aria-label="Line chart of selected indicator"></canvas>' +
    '<div class="tip" id="exTip"></div></div>' +
    '<div id="exLegend"></div>' +
    '<p class="note" id="exNote"></p></section>' +
    '<section class="panel"><h2>Year by year</h2><div class="scroll-x" id="exTable"></div></section>';

  const select = document.getElementById('indSelect');
  const toggles = document.getElementById('countryToggles');
  const canvas = document.getElementById('exChart');
  const tip = document.getElementById('exTip');
  let geom = null;

  function draw() {
    const ind = INDICATORS.find(i => i.code === select.value);
    const chosen = [...toggles.querySelectorAll('input:checked')].map(x => x.value)
      .map(code => COUNTRIES.find(c => c.code === code));
    document.getElementById('chartTitle').textContent = ind.name + ' — ' + ind.unit + ', 2014–2024';
    document.getElementById('exLegend').innerHTML = legendHtml(chosen);
    const gaps = chosen.map(c => esc(c.name) + ': ' + coverageNote(ind.code, c.code)).join(' · ');
    document.getElementById('exNote').textContent = 'Coverage — ' + gaps + '. Source: World Bank WDI ' + ind.code + '.';
    geom = drawLineChart(canvas, chosen.map(c => ({ values: seriesFor(ind.code, c.code), color: c.color })), ind.kind);
    const rows = YEARS.map((y, i) => '<tr><td>' + y + '</td>' + chosen.map(c => {
      const v = seriesFor(ind.code, c.code)[i];
      return '<td class="' + (v === null ? 'missing' : '') + '">' + formatValue(ind.kind, v) + '</td>';
    }).join('') + '</tr>').join('');
    document.getElementById('exTable').innerHTML =
      '<table class="data"><thead><tr><th>Year</th>' + chosen.map(c => '<th>' + esc(c.name) + '</th>').join('') +
      '</tr></thead><tbody>' + rows + '</tbody></table>';
  }
  canvas.addEventListener('mousemove', e => {
    if (!geom) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const idx = Math.round((x - geom.padL) / geom.plotW * (YEARS.length - 1));
    if (idx < 0 || idx >= YEARS.length) { tip.style.display = 'none'; return; }
    const ind = INDICATORS.find(i => i.code === select.value);
    const chosen = [...toggles.querySelectorAll('input:checked')].map(x => x.value)
      .map(code => COUNTRIES.find(c => c.code === code));
    const lines = [String(YEARS[idx])].concat(chosen.map(c =>
      c.name + ': ' + formatValue(ind.kind, seriesFor(ind.code, c.code)[idx])));
    tip.textContent = lines.join('\n');
    tip.style.display = 'block';
    tip.style.left = Math.min(x + 12, rect.width - 170) + 'px';
    tip.style.top = Math.max(8, e.clientY - rect.top - 10) + 'px';
  });
  canvas.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  select.addEventListener('change', draw);
  toggles.addEventListener('change', draw);
  draw();
}

function renderCompare() {
  viewEl.innerHTML =
    '<h1>Compare countries</h1>' +
    '<p class="lede">One indicator, all six countries, latest available value each. Click a column heading to sort the table.</p>' +
    '<div class="controls"><label for="cmpSelect">Indicator</label>' +
    '<select id="cmpSelect">' + INDICATORS.map(i =>
      '<option value="' + i.code + '">' + esc(i.name) + ' (' + esc(i.unit) + ')</option>').join('') + '</select></div>' +
    '<section class="panel"><h2 id="cmpTitle"></h2>' +
    '<div class="chart-wrap"><canvas id="cmpChart" class="chart tall" role="img" aria-label="Bar chart comparing countries"></canvas></div>' +
    '<p class="note" id="cmpNote"></p></section>' +
    '<section class="panel"><h2>Latest values</h2><div class="scroll-x" id="cmpTable"></div></section>';

  const select = document.getElementById('cmpSelect');
  const canvas = document.getElementById('cmpChart');
  let sortKey = 'value', sortDir = -1;

  function tableRows(ind) {
    return COUNTRIES.map(c => {
      const latest = latestOf(ind.code, c.code);
      const first = firstOf(ind.code, c.code);
      const ch = pctChange(first.value, latest.value);
      return {
        code: c.code, name: c.name, color: c.color,
        value: latest.value, year: latest.year,
        change: ch, changeFrom: first.year,
      };
    });
  }
  function draw() {
    const ind = INDICATORS.find(i => i.code === select.value);
    const rows = tableRows(ind);
    document.getElementById('cmpTitle').textContent = ind.name + ' — latest value per country';
    document.getElementById('cmpNote').textContent =
      'Years differ where data is missing: ' + rows.map(r => r.name + ' ' + (r.year || 'n/a')).join(', ') +
      '. Source: World Bank WDI ' + ind.code + '.';
    drawBarChart(canvas, rows.map(r => ({ label: r.code, value: r.value, color: r.color })), ind.kind);
    const sorted = [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av === null) return 1; if (bv === null) return -1;
      if (typeof av === 'string') return sortDir * av.localeCompare(bv);
      return sortDir * (av - bv);
    });
    const arrow = sortDir === -1 ? ' ▼' : ' ▲';
    const head = (key, label) => '<th class="sortable" data-sort="' + key + '">' + label + (sortKey === key ? arrow : '') + '</th>';
    document.getElementById('cmpTable').innerHTML =
      '<table class="data"><thead><tr>' + head('name', 'Country') + head('value', 'Latest value') +
      head('year', 'Year') + head('change', 'Change since first year') + '</tr></thead><tbody>' +
      sorted.map(r => '<tr' + (r.code === 'IDN' ? ' class="hl"' : '') + '><td>' + esc(r.name) + '</td><td>' +
        formatValue(ind.kind, r.value) + '</td><td>' + (r.year || '—') + '</td><td>' +
        (r.change === null ? '—' : (r.change >= 0 ? '+' : '') + r.change.toFixed(1) + '% since ' + r.changeFrom) +
        '</td></tr>').join('') + '</tbody></table>';
    document.querySelectorAll('#cmpTable th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const k = th.dataset.sort;
        if (sortKey === k) sortDir = -sortDir; else { sortKey = k; sortDir = k === 'name' ? 1 : -1; }
        draw();
      });
    });
  }
  select.addEventListener('change', draw);
  draw();
}

function renderSources() {
  viewEl.innerHTML =
    '<h1>Sources &amp; method</h1>' +
    '<p class="lede">Where every number comes from, what is missing, and how the site was built.</p>' +
    '<section class="panel"><h2>Data source</h2>' +
    '<p>All figures are from the <strong>World Bank Open Data — World Development Indicators (WDI)</strong>, ' +
    'retrieved 26 November 2026 from api.worldbank.org for the years 2014–2024 and the countries ' +
    'Indonesia, Malaysia, Philippines, Singapore, Thailand and Vietnam. No figure was invented, estimated or ' +
    'interpolated: where the World Bank reports no value, this site shows —.</p>' +
    '<div class="scroll-x"><table class="data"><thead><tr><th>Indicator</th><th>WDI code</th><th>Unit</th><th>Coverage</th></tr></thead><tbody>' +
    INDICATORS.map(ind => '<tr><td>' + esc(ind.name) + '</td><td>' + ind.code + '</td><td>' + esc(ind.unit) + '</td><td>' +
      COUNTRIES.map(c => c.code + ' ' + coverageNote(ind.code, c.code)).join('<br>') + '</td></tr>').join('') +
    '</tbody></table></div></section>' +
    '<section class="panel"><h2>Known gaps — read before you quote</h2>' +
    '<p><span class="badge">Poverty</span> The World Bank publishes no national poverty headcount for Singapore or the ' +
    'Philippines in this window, and only a few survey years for Malaysia (2019–2023), Thailand (to 2022) and Vietnam (to 2022). ' +
    'Poverty comparisons across countries are therefore incomplete by design.</p>' +
    '<p><span class="badge">Literacy</span> Adult literacy is reported only in census and survey years, so every country has ' +
    'gaps: Indonesia 2014–2020, Vietnam only 2019 and 2022. Treat the literacy line as scattered observations, not a yearly series.</p>' +
    '<p><span class="badge">Latest year</span> Most indicators run to 2024, but each country\'s latest year is shown next to its value ' +
    'wherever it matters, because the newest year is not the same for every indicator.</p></section>' +
    '<section class="panel"><h2>How the site works</h2>' +
    '<p>NusaStats is static files only: one HTML page, one stylesheet, one script and one data file. Charts are drawn ' +
    'by hand on &lt;canvas&gt; — no chart library, no framework, no web font, no request to any other origin. ' +
    'The four views are reached by links in the header and by hash routes (#/overview, #/explorer, #/compare, #/sources), ' +
    'so any view can be bookmarked. The layout is responsive: cards stack two-across and tables scroll sideways on a phone.</p>' +
    '<p class="note">NusaStats is an independent project. It is not affiliated with the World Bank, Statistics Indonesia (BPS) ' +
    'or any government. Figures are reproduced as published by the World Bank; check the source before citing a figure in ' +
    'an official document.</p></section>';
}

/* ---------- router ---------- */
const ROUTES = { overview: renderOverview, explorer: renderExplorer, compare: renderCompare, sources: renderSources };
function route() {
  const name = (location.hash || '#/overview').replace(/^#\//, '').split('?')[0];
  const fn = ROUTES[name] || ROUTES.overview;
  setActiveNav(ROUTES[name] ? name : 'overview');
  fn();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

fetch('data.json')
  .then(r => { if (!r.ok) throw new Error('data.json failed: ' + r.status); return r.json(); })
  .then(d => { DATA = d; route(); })
  .catch(err => {
    viewEl.innerHTML = '<h1>Data could not be loaded</h1><p>' + esc(err.message) +
      '</p><p class="note">NusaStats needs its data file (app/data.json) beside this page.</p>';
  });

/* Arunika app — hash router, views and state. Data: World Bank WDI via data.json. */
(function () {
  'use strict';
  var C = window.ArunikaCharts, T = window.ArunikaTables;
  var view = document.getElementById('view');
  var DB = null;
  var state = { explorerInd: 'gdpppp', explorerCountries: ['SGP', 'MYS', 'THA', 'IDN', 'VNM'],
    compareInd: 'gdppc', rankInd: 'life' };

  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d; }
  function country(code) { return DB.meta.countries.find(function (c) { return c.code === code; }); }
  function ind(id) { return DB.meta.indicators.find(function (i) { return i.id === id; }); }
  function seriesOf(id, code) { return DB.values[id][code]; }
  function latest(arr) {
    for (var i = arr.length - 1; i >= 0; i--) if (arr[i] !== null) return { year: DB.meta.years[i], value: arr[i] };
    return { year: null, value: null };
  }
  function firstVal(arr) {
    for (var i = 0; i < arr.length; i++) if (arr[i] !== null) return { year: DB.meta.years[i], value: arr[i] };
    return { year: null, value: null };
  }
  function fmtNum(v, digits) {
    if (v === null || v === undefined) return '—';
    if (digits !== undefined) return v.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
    return T.fmtCell(v);
  }
  function changeText(arr) {
    var a = firstVal(arr), b = latest(arr);
    if (a.value === null || b.value === null || a.year === b.year) return '—';
    var d = b.value - a.value, pct = (d / Math.abs(a.value)) * 100;
    var sign = d >= 0 ? '+' : '';
    return sign + fmtNum(d, 1) + ' (' + sign + pct.toFixed(1) + '%)';
  }
  function navActive(route) {
    document.querySelectorAll('.mainnav a').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-nav') === route);
    });
  }
  function indOptions(selected) {
    return DB.meta.indicators.map(function (i) {
      return '<option value="' + i.id + '"' + (i.id === selected ? ' selected' : '') + '>' +
        T.esc(i.label) + ' (' + T.esc(i.unit) + ')</option>';
    }).join('');
  }
  function countryLinks() {
    return '<div class="countrylist">' + DB.meta.countries.map(function (c) {
      var pop = latest(seriesOf('pop', c.code));
      var gdp = latest(seriesOf('gdppc', c.code));
      return '<a href="#/country/' + c.code + '"><b>' + T.esc(c.name) + '</b><span>Pop. ' +
        fmtNum(pop.value) + ' (' + (pop.year || '—') + ') · GDP/cap ' +
        (gdp.value === null ? '—' : '$' + fmtNum(gdp.value)) + '</span></a>';
    }).join('') + '</div>';
  }

  /* ---------- Overview ---------- */
  function renderOverview() {
    navActive('overview');
    var years = DB.meta.years;
    var pop2024 = DB.meta.countries.reduce(function (s, c) { var v = seriesOf('pop', c.code)[10]; return s + (v || 0); }, 0);
    var lifeVals = DB.meta.countries.map(function (c) { return seriesOf('life', c.code)[10]; }).filter(function (v) { return v !== null; }).sort(function (a, b) { return a - b; });
    var medianLife = lifeVals.length ? lifeVals[Math.floor(lifeVals.length / 2)] : null;
    var gdpRows = DB.meta.countries.map(function (c) { return { c: c, v: latest(seriesOf('gdpppp', c.code)).value }; })
      .filter(function (r) { return r.v !== null; }).sort(function (a, b) { return b.v - a.v; });
    var net2014 = DB.meta.countries.map(function (c) { return seriesOf('internet', c.code)[0]; }).filter(function (v) { return v !== null; });
    var net2024 = DB.meta.countries.map(function (c) { return latest(seriesOf('internet', c.code)).value; }).filter(function (v) { return v !== null; });
    var avg = function (a) { return a.reduce(function (s, v) { return s + v; }, 0) / a.length; };
    var growth = DB.meta.countries.map(function (c) {
      return { name: c.name, g: avg(seriesOf('growth', c.code).filter(function (v) { return v !== null; })) };
    }).sort(function (a, b) { return b.g - a.g; });
    var co2top = DB.meta.countries.map(function (c) { return { name: c.name, v: latest(seriesOf('co2', c.code)).value }; })
      .filter(function (r) { return r.v !== null; }).sort(function (a, b) { return b.v - a.v; })[0];

    view.innerHTML = '';
    var root = el(
      '<p class="eyebrow">Southeast Asia · 2014–2024 · World Bank Open Data</p>' +
      '<h1>Ten countries, one decade, twelve measures of how people live.</h1>' +
      '<p class="lede">Arunika tracks the ASEAN-10 — from Brunei to Myanmar — across population, income, health, work, energy and the internet. Every number below comes from the World Bank and carries its year; where the Bank has no value, we show — instead of guessing.</p>' +
      '<div class="kpis">' +
      '<div class="kpi"><div class="lab">People in ASEAN, 2024</div><div class="num">' + fmtNum(pop2024) + '</div><div class="sub">Sum of all ten countries</div></div>' +
      '<div class="kpi amber"><div class="lab">Richest, GDP/cap PPP</div><div class="num">' + (gdpRows[0] ? '$' + fmtNum(gdpRows[0].v) : '—') + '</div><div class="sub">' + (gdpRows[0] ? T.esc(gdpRows[0].c.name) : '') + ', ' + (gdpRows[0] ? latest(seriesOf('gdpppp', gdpRows[0].c.code)).year : '—') + '</div></div>' +
      '<div class="kpi"><div class="lab">Median life expectancy</div><div class="num">' + fmtNum(medianLife, 1) + ' yrs</div><div class="sub">Across the ten, 2024</div></div>' +
      '<div class="kpi amber"><div class="lab">Fastest average growth</div><div class="num">' + growth[0].g.toFixed(1) + '%/yr</div><div class="sub">' + T.esc(growth[0].name) + ', 2014–2024 average</div></div>' +
      '</div>' +
      '<div class="grid2"><section class="panel"><h2>Income is pulling apart — and together</h2>' +
      '<p class="dim">GDP per capita, PPP (current international $). Singapore and Brunei sit far above the rest; Vietnam and the Philippines have climbed fastest from a low base.</p>' +
      '<div class="chartbox"><canvas class="chart" id="ovChart"></canvas><div class="tip" id="ovTip"></div></div>' +
      '<div class="legend" id="ovLegend"></div></section>' +
      '<section class="panel"><h2>The decade in five facts</h2><div class="story" id="ovStory"></div></section></div>' +
      '<h2>Pick a country to go deep</h2>' + countryLinks() +
      '<p class="dim" style="margin-top:14px">Or start with the <a href="#/explorer">Explorer</a> to draw any indicator for any set of countries, <a href="#/compare">Compare</a> to rank them side by side, or <a href="#/rankings">Rankings</a> for the leaderboard of each measure.</p>'
    );
    view.appendChild(root);
    var top5 = ['SGP', 'BRN', 'MYS', 'THA', 'IDN'];
    var series = top5.map(function (cc, i) {
      return { label: country(cc).name, color: C.PALETTE[i], values: seriesOf('gdpppp', cc) };
    });
    C.drawLineChart(document.getElementById('ovChart'), years, series);
    C.attachHover(document.getElementById('ovChart'), 'ovTip');
    document.getElementById('ovLegend').innerHTML = series.map(function (s) {
      return '<span><i class="dot" style="background:' + s.color + '"></i>' + T.esc(s.label) + '</span>';
    }).join('');
    document.getElementById('ovStory').innerHTML =
      '<p><strong>' + Math.round(pop2024 / 1e6) + ' million people.</strong> ASEAN held about ' + fmtNum(pop2024) + ' people in 2024; Indonesia alone accounts for over 40% of them.</p>' +
      '<p><strong>The internet arrived.</strong> Average internet use rose from ' + avg(net2014).toFixed(0) + '% of people in 2014 to ' + avg(net2024).toFixed(0) + '% in the latest year — the fastest-moving indicator in the atlas.</p>' +
      '<p><strong>Longer lives, unevenly.</strong> Singaporeans live to about ' + fmtNum(seriesOf('life', 'SGP')[10], 1) + ' years; in Myanmar the figure is ' + fmtNum(seriesOf('life', 'MMR')[10], 1) + ' — a gap of ' + (seriesOf('life', 'SGP')[10] - seriesOf('life', 'MMR')[10]).toFixed(1) + ' years.</p>' +
      '<p><strong>Carbon is concentrated.</strong> The highest per-person emitter, ' + T.esc(co2top.name) + ' (' + fmtNum(co2top.v, 1) + ' t), emits roughly ' + Math.round(co2top.v / Math.min.apply(null, DB.meta.countries.map(function (c) { return latest(seriesOf('co2', c.code)).value; }).filter(function (v) { return v !== null; }))) + '× the lowest in the region.</p>' +
      '<p><strong>Growth survived the pandemic.</strong> Every country except one grew on average over the decade; ' + T.esc(growth[0].name) + ' averaged ' + growth[0].g.toFixed(1) + '% a year, the region\u2019s fastest.</p>';
  }

  /* ---------- Explorer ---------- */
  function renderExplorer() {
    navActive('explorer');
    var years = DB.meta.years;
    view.innerHTML = '';
    var root = el(
      '<p class="eyebrow">Explorer</p><h1>Draw any indicator, any countries.</h1>' +
      '<p class="lede">Pick a measure, tick the countries you want, hover the line to read exact values. The table below lists every year; the CSV button downloads exactly what you see.</p>' +
      '<div class="controls"><div><label class="f" for="exInd">Indicator</label><select id="exInd">' + indOptions(state.explorerInd) + '</select></div>' +
      '<button class="btn amber" id="exCsv" type="button">Download CSV</button></div>' +
      '<div class="chips" id="exChips"></div>' +
      '<section class="panel"><h2 id="exTitle"></h2><p class="dim" id="exSub"></p>' +
      '<div class="chartbox"><canvas class="chart tall" id="exChart"></canvas><div class="tip" id="exTip"></div></div>' +
      '<div class="legend" id="exLegend"></div></section>' +
      '<section class="panel"><h2>Year by year</h2><div id="exTable"></div>' +
      '<p class="dim">— means the World Bank reports no value for that country and year. Values are shown as reported; nothing is filled in or interpolated.</p></section>'
    );
    view.appendChild(root);

    function draw() {
      var iid = state.explorerInd, meta = ind(iid);
      var chosen = state.explorerCountries.slice();
      document.getElementById('exTitle').textContent = meta.label + ' — ' + meta.unit;
      document.getElementById('exSub').textContent = meta.source + ' · ' + years[0] + '–' + years[years.length - 1] +
        ' · ' + chosen.length + ' countr' + (chosen.length === 1 ? 'y' : 'ies') + ' selected';
      var series = chosen.map(function (cc, i) {
        return { label: country(cc).name, color: C.PALETTE[i % C.PALETTE.length], values: seriesOf(iid, cc) };
      });
      C.drawLineChart(document.getElementById('exChart'), years, series);
      C.attachHover(document.getElementById('exChart'), 'exTip');
      document.getElementById('exLegend').innerHTML = series.map(function (s) {
        return '<span><i class="dot" style="background:' + s.color + '"></i>' + T.esc(s.label) + '</span>';
      }).join('');
      var cols = [{ key: 'year', label: 'Year', sortable: true }].concat(chosen.map(function (cc) {
        return { key: cc, label: country(cc).name, sortable: true };
      }));
      var rows = years.map(function (y, i) {
        var r = { year: y };
        chosen.forEach(function (cc) { r[cc] = seriesOf(iid, cc)[i]; });
        return r;
      });
      T.buildTable(document.getElementById('exTable'), cols, rows, { sortKey: 'year', sortDir: 1 });
      document.getElementById('exCsv').onclick = function () {
        var csvCols = [{ key: 'year', label: 'year' }].concat(chosen.map(function (cc) {
          return { key: cc, label: country(cc).name };
        }));
        var csvRows = years.map(function (y, i) {
          var r = { year: y };
          chosen.forEach(function (cc) { r[cc] = seriesOf(iid, cc)[i] === null ? '' : seriesOf(iid, cc)[i]; });
          return r;
        });
        T.downloadCSV('arunika-' + iid + '.csv', csvCols, csvRows);
      };
    }

    var chips = document.getElementById('exChips');
    DB.meta.countries.forEach(function (c) {
      var lab = document.createElement('label');
      lab.className = 'chip' + (state.explorerCountries.indexOf(c.code) >= 0 ? ' on' : '');
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = state.explorerCountries.indexOf(c.code) >= 0;
      cb.addEventListener('change', function () {
        if (cb.checked) state.explorerCountries.push(c.code);
        else state.explorerCountries = state.explorerCountries.filter(function (x) { return x !== c.code; });
        if (!state.explorerCountries.length) { state.explorerCountries = [c.code]; cb.checked = true; }
        lab.classList.toggle('on', cb.checked);
        draw();
      });
      lab.appendChild(cb);
      lab.appendChild(document.createTextNode(c.name));
      chips.appendChild(lab);
    });
    document.getElementById('exInd').addEventListener('change', function (ev) {
      state.explorerInd = ev.target.value; draw();
    });
    draw();
  }

  /* ---------- Compare ---------- */
  function renderCompare() {
    navActive('compare');
    view.innerHTML = '';
    var root = el(
      '<p class="eyebrow">Compare</p><h1>All ten countries, one measure.</h1>' +
      '<p class="lede">Bars show the latest available value for each country. Click a column header to sort the table — by name, by value, or by year.</p>' +
      '<div class="controls"><div><label class="f" for="cmpInd">Indicator</label><select id="cmpInd">' + indOptions(state.compareInd) + '</select></div></div>' +
      '<section class="panel"><h2 id="cmpTitle"></h2><p class="dim" id="cmpSub"></p>' +
      '<div class="chartbox"><canvas class="chart tall" id="cmpChart"></canvas></div></section>' +
      '<section class="panel"><h2>Latest values</h2><div id="cmpTable"></div></section>'
    );
    view.appendChild(root);
    function draw() {
      var meta = ind(state.compareInd);
      var rows = DB.meta.countries.map(function (c, i) {
        var l = latest(seriesOf(state.compareInd, c.code));
        return { name: c.name, code: c.code, value: l.value, year: l.year, _barMax: 0, _barColor: C.PALETTE[i % C.PALETTE.length] };
      });
      var max = 0; rows.forEach(function (r) { if (r.value !== null && r.value > max) max = r.value; });
      rows.forEach(function (r) { r._barMax = max; });
      var sorted = rows.slice().sort(function (a, b) { return (b.value === null ? -1 : b.value) - (a.value === null ? -1 : a.value); });
      document.getElementById('cmpTitle').textContent = meta.label + ' — latest value per country';
      document.getElementById('cmpSub').textContent = meta.source + ' · bars use each country\u2019s most recent reported year (shown in the table).';
      C.drawBarChart(document.getElementById('cmpChart'), sorted.map(function (r) {
        return { label: r.name, value: r.value, color: r._barColor };
      }));
      T.buildTable(document.getElementById('cmpTable'), [
        { key: 'name', label: 'Country', sortable: true },
        { key: 'value', label: 'Latest value', sortable: true },
        { key: 'year', label: 'Year', sortable: true },
        { key: 'bar', label: 'Scale', sortable: false }
      ], rows, { sortKey: 'value', sortDir: -1 });
    }
    document.getElementById('cmpInd').addEventListener('change', function (ev) { state.compareInd = ev.target.value; draw(); });
    draw();
  }

  /* ---------- Rankings ---------- */
  function renderRankings() {
    navActive('rankings');
    view.innerHTML = '';
    var root = el(
      '<p class="eyebrow">Rankings</p><h1>Who leads on each measure?</h1>' +
      '<p class="lede">A leaderboard for every indicator, using each country\u2019s latest reported value. “Highest” is not always “best” — for poverty, unemployment and CO₂, the bottom of the list is the one to admire.</p>' +
      '<div class="controls"><div><label class="f" for="rkInd">Indicator</label><select id="rkInd">' + indOptions(state.rankInd) + '</select></div></div>' +
      '<section class="panel"><h2 id="rkTitle"></h2><p class="dim" id="rkSub"></p><div id="rkList"></div></section>' +
      '<div class="note">Poverty is ranked on the latest survey year, which differs by country (some report 2019, others 2023). Compare the years in the table, not just the rank.</div>'
    );
    view.appendChild(root);
    function draw() {
      var meta = ind(state.rankInd);
      var rows = DB.meta.countries.map(function (c) {
        var l = latest(seriesOf(state.rankInd, c.code));
        return { name: c.name, code: c.code, value: l.value, year: l.year };
      }).filter(function (r) { return r.value !== null; })
        .sort(function (a, b) { return b.value - a.value; });
      var max = rows.length ? rows[0].value : 0;
      document.getElementById('rkTitle').textContent = meta.label + ' — ranked, highest first';
      document.getElementById('rkSub').textContent = meta.source + ' · ' + rows.length + ' of 10 countries have a reported value.';
      var missing = DB.meta.countries.filter(function (c) {
        return latest(seriesOf(state.rankInd, c.code)).value === null;
      }).map(function (c) { return c.name; });
      var html = '<table class="data"><thead><tr><th>#</th><th>Country</th><th>Value</th><th>Year</th><th>Share of leader</th></tr></thead><tbody>';
      rows.forEach(function (r, i) {
        var pct = max ? Math.round((r.value / max) * 100) : 0;
        html += '<tr><td class="ranknum">' + (i + 1) + '</td><td><a href="#/country/' + r.code + '">' + T.esc(r.name) + '</a></td>' +
          '<td class="num"><b>' + fmtNum(r.value) + '</b> ' + T.esc(meta.unit) + '</td><td>' + r.year + '</td>' +
          '<td><span class="barcell"><span class="bar" style="width:' + Math.max(2, pct) + 'px;background:' +
          (i === 0 ? '#d97706' : '#0f766e') + '"></span>' + pct + '%</span></td></tr>';
      });
      html += '</tbody></table>';
      if (missing.length) html += '<p class="dim">No reported value: ' + missing.map(T.esc).join(', ') + '.</p>';
      document.getElementById('rkList').innerHTML = html;
    }
    document.getElementById('rkInd').addEventListener('change', function (ev) { state.rankInd = ev.target.value; draw(); });
    draw();
  }

  /* ---------- Country profile ---------- */
  function renderCountry(code) {
    navActive('');
    var c = country(code);
    if (!c) { view.innerHTML = '<h1>Country not found</h1><p>Pick one of the ten ASEAN countries from the <a href="#/overview">Overview</a>.</p>'; return; }
    var years = DB.meta.years;
    view.innerHTML = '';
    var pop = latest(seriesOf('pop', c.code)), gdp = latest(seriesOf('gdppc', c.code)),
      gdppp = latest(seriesOf('gdpppp', c.code)), life = latest(seriesOf('life', c.code));
    var root = el(
      '<p class="eyebrow">Country profile</p><h1>' + T.esc(c.name) + '</h1>' +
      '<p class="lede">All twelve indicators for ' + T.esc(c.name) + ', 2014–2024, from World Bank Open Data. Latest value, where it started, and how much it moved.</p>' +
      '<div class="kpis">' +
      '<div class="kpi"><div class="lab">Population</div><div class="num">' + fmtNum(pop.value) + '</div><div class="sub">' + (pop.year || '—') + '</div></div>' +
      '<div class="kpi amber"><div class="lab">GDP per capita</div><div class="num">' + (gdp.value === null ? '—' : '$' + fmtNum(gdp.value)) + '</div><div class="sub">' + (gdp.year || '—') + ', current US$</div></div>' +
      '<div class="kpi"><div class="lab">GDP per capita, PPP</div><div class="num">' + (gdppp.value === null ? '—' : '$' + fmtNum(gdppp.value)) + '</div><div class="sub">' + (gdppp.year || '—') + ', intl $</div></div>' +
      '<div class="kpi amber"><div class="lab">Life expectancy</div><div class="num">' + fmtNum(life.value, 1) + ' yrs</div><div class="sub">' + (life.year || '—') + '</div></div>' +
      '</div>' +
      '<div class="grid2eq"><section class="panel"><h2>Income per person (PPP)</h2>' +
      '<div class="chartbox"><canvas class="chart" id="ctGdp"></canvas><div class="tip" id="ctGdpTip"></div></div></section>' +
      '<section class="panel"><h2>People using the internet</h2>' +
      '<div class="chartbox"><canvas class="chart" id="ctNet"></canvas><div class="tip" id="ctNetTip"></div></div></section></div>' +
      '<section class="panel"><h2>Every indicator</h2><div id="ctTable"></div>' +
      '<p class="dim">Change is measured from the first reported year to the latest reported year for that indicator.</p></section>' +
      '<p style="margin-top:16px"><a class="btn ghost" href="#/compare">Compare ' + T.esc(c.name) + ' with the region</a> ' +
      '<a class="btn ghost" href="#/overview">Back to overview</a></p>'
    );
    view.appendChild(root);
    C.drawLineChart(document.getElementById('ctGdp'), years,
      [{ label: c.name, color: '#0f766e', values: seriesOf('gdpppp', c.code) }]);
    C.attachHover(document.getElementById('ctGdp'), 'ctGdpTip');
    C.drawLineChart(document.getElementById('ctNet'), years,
      [{ label: c.name, color: '#d97706', values: seriesOf('internet', c.code) }]);
    C.attachHover(document.getElementById('ctNet'), 'ctNetTip');
    var rows = DB.meta.indicators.map(function (m) {
      var arr = seriesOf(m.id, c.code), l = latest(arr), f = firstVal(arr);
      return { indicator: m.label, latest: l.value, year: l.year, first: f.value, firstYear: f.year,
        change: changeText(arr), unit: m.unit };
    });
    T.buildTable(document.getElementById('ctTable'), [
      { key: 'indicator', label: 'Indicator', sortable: true },
      { key: 'latest', label: 'Latest', sortable: true },
      { key: 'year', label: 'Year', sortable: true },
      { key: 'first', label: 'First reported', sortable: true },
      { key: 'change', label: 'Change', sortable: false },
      { key: 'unit', label: 'Unit', sortable: false }
    ], rows, { sortKey: 'indicator', sortDir: 1 });
  }

  /* ---------- Sources ---------- */
  function renderSources() {
    navActive('sources');
    view.innerHTML = '';
    var rows = DB.meta.indicators.map(function (m) {
      var present = 0;
      DB.meta.countries.forEach(function (c) {
        seriesOf(m.id, c.code).forEach(function (v) { if (v !== null) present++; });
      });
      var perCountry = DB.meta.countries.map(function (c) {
        var n = seriesOf(m.id, c.code).filter(function (v) { return v !== null; }).length;
        return c.name + ': ' + n + '/11';
      }).join(' · ');
      return '<div class="srcrow"><h3>' + T.esc(m.label) + ' <span class="dim">(' + T.esc(m.unit) + ')</span></h3>' +
        '<p>' + T.esc(m.source) + ' · code <b>' + T.esc(m.code) + '</b> · years 2014–2024 · coverage <b>' + present + ' of 110</b> values present.</p>' +
        '<p class="cov">' + T.esc(perCountry) + '</p>' +
        (m.note ? '<p class="dim">' + T.esc(m.note) + '</p>' : '') + '</div>';
    }).join('');
    var root = el(
      '<p class="eyebrow">Sources &amp; method</p><h1>Where every number comes from.</h1>' +
      '<p class="lede">All ' + DB.meta.points + ' data points (' + DB.meta.present + ' present, ' + (DB.meta.points - DB.meta.present) + ' missing) were fetched from the World Bank Open Data API (api.worldbank.org, World Development Indicators) on 27 November 2026. Values are shown exactly as reported, rounded only for display. Nothing is estimated, filled in or interpolated.</p>' +
      '<h2>What is missing, honestly</h2>' +
      '<p><strong>Poverty ($2.15/day)</strong> is the sparsest series: only ' + (function () { var n = 0; DB.meta.countries.forEach(function (c) { seriesOf('poverty', c.code).forEach(function (v) { if (v !== null) n++; }); }); return n; })() + ' of 110 values exist, because the Bank reports it only in survey years and some countries have no survey in the window at all. <strong>Renewable energy</strong> and <strong>secondary enrolment</strong> have gaps in the most recent years, where the Bank has not yet published them. Everywhere else, a — in a table means “not reported”, not zero.</p>' +
      '<p><strong>One substitution:</strong> the classic CO₂-per-capita code (EN.ATM.CO2E.PC) has been retired by the World Bank, so the atlas uses the current series EN.GHG.CO2.PC.CE.AR5 — CO₂ excluding land-use change, in tonnes of CO₂-equivalent per person. It is labelled as such on every page that shows it.</p>' +
      '<h2>Every indicator</h2>' + rows +
      '<h2>How to reuse this data</h2>' +
      '<p>Use the Explorer\u2019s Download CSV button for any indicator and country set, or take <a href="data.json">data.json</a> (the site\u2019s own data file) directly. The World Bank asks that you cite “World Bank, World Development Indicators” as the source. This site is an independent atlas, not affiliated with the World Bank or ASEAN.</p>'
    );
    view.appendChild(root);
  }

  /* ---------- Router ---------- */
  function route() {
    var h = location.hash || '#/overview';
    var parts = h.replace(/^#\//, '').split('/');
    window.scrollTo(0, 0);
    if (parts[0] === 'explorer') renderExplorer();
    else if (parts[0] === 'compare') renderCompare();
    else if (parts[0] === 'rankings') renderRankings();
    else if (parts[0] === 'country') renderCountry(parts[1] || '');
    else if (parts[0] === 'sources') renderSources();
    else renderOverview();
  }

  fetch('data.json').then(function (r) { return r.json(); }).then(function (d) {
    DB = d;
    window.addEventListener('hashchange', route);
    route();
  }).catch(function () {
    view.innerHTML = '<h1>Data could not be loaded</h1><p>The atlas needs its data file (data.json) served beside this page. Serve the app/ folder with any static server and reload.</p>';
  });
})();

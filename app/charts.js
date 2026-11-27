/* Arunika charts — hand-drawn canvas charts, no library. */
(function () {
  'use strict';
  var PALETTE = ['#0f766e', '#d97706', '#2563eb', '#b91c1c', '#7c3aed',
    '#15803d', '#be185d', '#0891b2', '#a16207', '#4d7c0f'];
  var GRID = '#e3ddd2', AXIS = '#5b6b70';

  function setupCanvas(cv) {
    var dpr = window.devicePixelRatio || 1;
    var w = cv.clientWidth, h = cv.clientHeight;
    cv.width = Math.max(1, Math.round(w * dpr));
    cv.height = Math.max(1, Math.round(h * dpr));
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  function niceTicks(min, max, count) {
    if (min === max) { min -= 1; max += 1; }
    var span = max - min, step = Math.pow(10, Math.floor(Math.log10(span / count)));
    var err = (span / count) / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var lo = Math.floor(min / step) * step, out = [];
    for (var v = lo; v <= max + step * 0.5; v += step) out.push(v);
    return out;
  }

  function fmt(v) {
    if (v === null || v === undefined || isNaN(v)) return '—';
    var a = Math.abs(v);
    if (a >= 1e9) return (v / 1e9).toFixed(2) + ' bn';
    if (a >= 1e6) return (v / 1e6).toFixed(1) + ' m';
    if (a >= 1000) return Math.round(v).toLocaleString('en-US');
    if (a >= 100) return v.toFixed(0);
    if (a >= 1) return v.toFixed(1);
    return v.toFixed(2);
  }

  function drawAxes(ctx, box, ticks, yOf) {
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = AXIS; ctx.strokeStyle = GRID; ctx.lineWidth = 1;
    ticks.forEach(function (t) {
      var y = yOf(t);
      ctx.beginPath(); ctx.moveTo(box.x, y); ctx.lineTo(box.x + box.w, y); ctx.stroke();
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(fmt(t), box.x - 6, y);
    });
  }

  /* Line chart. series: [{label, color, values:[v|null...]}]; years: [2014..].
     Returns nothing; hover shows #tip inside the chart's .chartbox parent. */
  function drawLineChart(cv, years, series) {
    var s = setupCanvas(cv), ctx = s.ctx;
    var box = { x: 52, y: 12, w: s.w - 62, h: s.h - 42 };
    var all = [];
    series.forEach(function (sr) { sr.values.forEach(function (v) { if (v !== null) all.push(v); }); });
    if (!all.length) { ctx.fillStyle = AXIS; ctx.font = '14px system-ui'; ctx.fillText('No data for this selection.', 12, 24); return; }
    var min = Math.min.apply(null, all), max = Math.max.apply(null, all);
    var pad = (max - min) * 0.08 || 1; min -= pad; max += pad;
    if (min < 0 && Math.min.apply(null, all) >= 0) min = 0;
    if (min > 0 && min / max > 0.55) min = 0;
    var ticks = niceTicks(min, max, 5);
    var yOf = function (v) { return box.y + box.h - ((v - min) / (max - min)) * box.h; };
    var xOf = function (i) { return box.x + (i / (years.length - 1)) * box.w; };
    drawAxes(ctx, box, ticks, yOf);
    ctx.fillStyle = AXIS; ctx.textBaseline = 'top';
    years.forEach(function (y, i) {
      if (i % 2 === 0 || years.length <= 6) {
        ctx.textAlign = i === 0 ? 'left' : (i === years.length - 1 ? 'right' : 'center');
        ctx.fillText(String(y), xOf(i), box.y + box.h + 8);
      }
    });
    series.forEach(function (sr, si) {
      var color = sr.color || PALETTE[si % PALETTE.length];
      ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.beginPath();
      var started = false;
      sr.values.forEach(function (v, i) {
        if (v === null) { started = false; return; }
        if (!started) { ctx.moveTo(xOf(i), yOf(v)); started = true; }
        else ctx.lineTo(xOf(i), yOf(v));
      });
      ctx.stroke();
      sr.values.forEach(function (v, i) {
        if (v === null) return;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(xOf(i), yOf(v), 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(xOf(i), yOf(v), 1.4, 0, Math.PI * 2); ctx.fill();
      });
    });
    cv._hover = { years: years, series: series, box: box, xOf: xOf, yOf: yOf };
  }

  function lineHover(cv, ev, tip) {
    var h = cv._hover; if (!h) return;
    var rect = cv.getBoundingClientRect();
    var mx = ev.clientX - rect.left;
    var idx = Math.round(((mx - h.box.x) / h.box.w) * (h.years.length - 1));
    if (idx < 0 || idx >= h.years.length) { tip.style.display = 'none'; return; }
    var lines = ['<b>' + h.years[idx] + '</b>'];
    h.series.forEach(function (sr, si) {
      var v = sr.values[idx];
      var color = sr.color || PALETTE[si % PALETTE.length];
      lines.push('<span style="color:' + color + '">●</span> ' + sr.label + ': <b>' + fmt(v) + '</b>');
    });
    tip.innerHTML = lines.join('<br>');
    tip.style.display = 'block';
    var tx = Math.min(Math.max(h.xOf(idx) + 12, 4), rect.width - 190);
    tip.style.left = tx + 'px';
    tip.style.top = '8px';
  }

  function attachHover(cv, tipId) {
    var tip = document.getElementById(tipId);
    if (!tip) return;
    cv.addEventListener('mousemove', function (ev) { lineHover(cv, ev, tip); });
    cv.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
    cv.addEventListener('touchstart', function (ev) {
      if (ev.touches.length) lineHover(cv, ev.touches[0], tip);
    }, { passive: true });
  }

  /* Horizontal bar chart. rows: [{label, value, color?}] sorted desc already. */
  function drawBarChart(cv, rows) {
    var s = setupCanvas(cv), ctx = s.ctx;
    var top = 8, rowH = Math.min(34, (s.h - top - 8) / Math.max(1, rows.length));
    var max = 0; rows.forEach(function (r) { if (r.value !== null && r.value > max) max = r.value; });
    if (!max) { ctx.fillStyle = AXIS; ctx.font = '14px system-ui'; ctx.fillText('No data for this selection.', 12, 24); return; }
    var labelW = 118, barX = labelW + 8, barW = s.w - barX - 86;
    ctx.font = '12.5px system-ui, sans-serif';
    rows.forEach(function (r, i) {
      var y = top + i * rowH + rowH / 2;
      ctx.fillStyle = '#17252a'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      var lab = r.label.length > 18 ? r.label.slice(0, 17) + '…' : r.label;
      ctx.fillText(lab, labelW, y);
      if (r.value === null) {
        ctx.fillStyle = AXIS; ctx.textAlign = 'left'; ctx.fillText('— no data', barX, y);
        return;
      }
      var w = Math.max(2, (r.value / max) * barW);
      ctx.fillStyle = r.color || PALETTE[i % PALETTE.length];
      roundRect(ctx, barX, y - 8, w, 16, 5); ctx.fill();
      ctx.fillStyle = '#17252a'; ctx.textAlign = 'left';
      ctx.fillText(fmt(r.value), barX + w + 6, y);
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  window.ArunikaCharts = {
    drawLineChart: drawLineChart, drawBarChart: drawBarChart,
    attachHover: attachHover, fmt: fmt, PALETTE: PALETTE
  };
})();

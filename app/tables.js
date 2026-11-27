/* Arunika tables — sortable data tables and CSV download. No library. */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function fmtCell(v, digits) {
    if (v === null || v === undefined) return '—';
    if (typeof v !== 'number') return esc(v);
    if (digits !== undefined) return v.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
    var a = Math.abs(v);
    if (a >= 1000000) return Math.round(v).toLocaleString('en-US');
    if (a >= 100) return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
    return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  /* Build a table into el. columns: [{key,label,sortable?,digits?,align?}].
     rows: array of objects. Returns the table element; clicking a sortable
     header re-sorts (numbers sort numerically, nulls always last). */
  function buildTable(el, columns, rows, opts) {
    opts = opts || {};
    var state = { key: opts.sortKey || null, dir: opts.sortDir || -1 };
    var table = document.createElement('table');
    table.className = 'data';
    var thead = document.createElement('thead');
    var tr = document.createElement('tr');
    columns.forEach(function (c) {
      var th = document.createElement('th');
      th.textContent = c.label + (state.key === c.key ? (state.dir === 1 ? ' ▲' : ' ▼') : '');
      if (c.sortable) {
        th.className = 'sortable';
        th.addEventListener('click', function () {
          if (state.key === c.key) state.dir = -state.dir;
          else { state.key = c.key; state.dir = -1; }
          render();
        });
      }
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);
    var tbody = document.createElement('tbody');
    table.appendChild(tbody);

    function sorted() {
      var out = rows.slice();
      if (!state.key) return out;
      var k = state.key, d = state.dir;
      out.sort(function (a, b) {
        var x = a[k], y = b[k];
        if (x === null || x === undefined) return 1;
        if (y === null || y === undefined) return -1;
        if (typeof x === 'number' && typeof y === 'number') return (x - y) * d;
        return String(x).localeCompare(String(y)) * d;
      });
      return out;
    }

    function render() {
      tr.childNodes.forEach(function (th, i) {
        var c = columns[i];
        th.textContent = c.label + (state.key === c.key ? (state.dir === 1 ? ' ▲' : ' ▼') : '');
      });
      tbody.innerHTML = '';
      sorted().forEach(function (r) {
        var row = document.createElement('tr');
        columns.forEach(function (c) {
          var td = document.createElement('td');
          if (c.key === 'bar' && typeof r._barMax === 'number' && r.value !== null) {
            var wrap = document.createElement('span');
            wrap.className = 'barcell';
            var bar = document.createElement('span');
            bar.className = 'bar';
            bar.style.width = Math.max(2, (r.value / r._barMax) * 110) + 'px';
            bar.style.background = r._barColor || '#0f766e';
            wrap.appendChild(bar);
            wrap.appendChild(document.createTextNode(fmtCell(r.value, c.digits)));
            td.appendChild(wrap);
          } else {
            td.innerHTML = fmtCell(r[c.key], c.digits);
          }
          row.appendChild(td);
        });
        tbody.appendChild(row);
      });
    }
    render();
    el.innerHTML = '';
    el.appendChild(table);
    return table;
  }

  /* Download rows as a CSV file. columns: [{key,label}], rows: objects. */
  function downloadCSV(filename, columns, rows) {
    function q(v) {
      if (v === null || v === undefined) return '';
      var s = String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }
    var lines = [columns.map(function (c) { return q(c.label); }).join(',')];
    rows.forEach(function (r) {
      lines.push(columns.map(function (c) { return q(r[c.key]); }).join(','));
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  window.ArunikaTables = { buildTable: buildTable, downloadCSV: downloadCSV, fmtCell: fmtCell, esc: esc };
})();

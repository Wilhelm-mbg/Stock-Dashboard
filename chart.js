'use strict';
/* Chart-Zeichnung: Achsen, Ticks, Hover, Mehrserien-Linien.
 *
 * Zweiter Schnitt aus depot.js (Audit 22). Die Datei stand bei 9.124 Zeilen, und
 * diese 132 gehoerten am wenigsten dorthin: Sie fassen weder D noch eine Position
 * noch eine Kursquelle an. Sie bekommen Punkte und einen SVG-Knoten und zeichnen.
 * Genau deshalb liessen sie sich WOERTLICH verschieben - kein Aufruf, keine Formel
 * und kein Zahlenwert ist dabei angefasst worden.
 *
 * Der Gewinn ist nicht die Zeilenzahl, sondern dass niceTicks, fmtTick und
 * fmtTimeTick jetzt in Node laufen: Achsenbeschriftung ist reine Rechnerei mit
 * Rundungsfallen (Schrittweite bei sehr kleinen und sehr grossen Spannen), und die
 * war bisher nur ueber einen Screenshot pruefbar.
 *
 * Abhaengigkeiten: window.U fuer die Zahlenformate, sonst nur das DOM. */
(function (root) {

  /* KEIN stiller Rueckfall. Ein Ersatz-Formatierer wuerde 1.234,56 zu 1234.56 machen -
   * und das faellt an einer Achsenbeschriftung niemandem auf. Beim ersten Wurf stand
   * chart.js vor app-shell.js in index.html, der Rueckfall haette also dauerhaft
   * gegolten. Lieber laut abbrechen: die Ladereihenfolge ist dann kaputt, und das
   * gehoert bemerkt, nicht ueberspielt. */
  var U = root.U;
  if (!U || !U.nf2 || !U.esc) throw new Error('chart.js braucht window.U aus app-shell.js - Ladereihenfolge in index.html pruefen.');

/* ================= Chart-Helfer: Achsen, Ticks, Hover ================= */
function niceTicks(lo, hi, n) {
  var span = hi - lo;
  if (span <= 0) return [lo];
  var step = Math.pow(10, Math.floor(Math.log(span / n) / Math.LN10));
  var err = span / n / step;
  step *= err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1;
  var out = [];
  for (var v = Math.ceil(lo / step) * step; v <= hi + step * 1e-6; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}
function fmtTick(v, span) {
  if (Math.abs(v) >= 1000) return U.nf0.format(v);
  if (span < 4) return U.nf2.format(v);
  return U.nf0.format(v);
}
function fmtTimeTick(t, spanMs) {
  var d = new Date(t);
  if (spanMs <= 30 * 3600000) return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  if (spanMs <= 130 * 86400000) return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  return d.toLocaleDateString('de-DE', { month: '2-digit', year: '2-digit' });
}
function chartHover(e) {
  var svg = e.currentTarget, c = svg.__chart, tip = document.getElementById('tip');
  if (!c || !tip) return;
  var rect = svg.getBoundingClientRect();
  var mx = (e.clientX - rect.left) * (c.W / Math.max(1, rect.width));
  var t = c.x0 + Math.max(0, Math.min(1, (mx - c.padL) / (c.plotW || 1))) * (c.x1 - c.x0);
  var rows = [], cx = null;
  c.series.forEach(function (s) {
    if (!s.pts.length) return;
    var best = 0, bd = Infinity;
    for (var i = 0; i < s.pts.length; i++) { var d0 = Math.abs(s.pts[i][0] - t); if (d0 < bd) { bd = d0; best = i; } }
    var p = s.pts[best];
    if (cx === null) cx = p[0];
    rows.push('<div style="display:flex; align-items:center; gap:6px;"><span style="width:8px;height:8px;border-radius:var(--r-kreis);background:' + s.color + ';display:inline-block;"></span>' +
      '<span class="tt">' + U.esc(s.short || s.name) + '</span> <span class="tv">' + U.nf2.format(p[1]) + (c.unit || '') + '</span></div>');
  });
  if (cx === null) return;
  var xh = svg.querySelector('.xhair');
  if (xh) { xh.style.display = ''; var xpx = c.padL + (cx - c.x0) / (c.x1 - c.x0) * c.plotW; xh.setAttribute('x1', xpx); xh.setAttribute('x2', xpx); }
  tip.style.display = 'block';
  tip.innerHTML = '<div class="tt">' + fmtTimeTick(cx, c.x1 - c.x0) + (c.x1 - c.x0 > 30 * 3600000 ? ' · ' + new Date(cx).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr' : ' Uhr') + '</div>' + rows.join('');
  var tw = tip.offsetWidth || 120;
  tip.style.left = Math.min(window.innerWidth - tw - 12, e.clientX + 14) + 'px';
  tip.style.top = (e.clientY + 14) + 'px';
}
function chartLeave(e) {
  var tip = document.getElementById('tip');
  if (tip) tip.style.display = 'none';
  var xh = e.currentTarget.querySelector('.xhair');
  if (xh) xh.style.display = 'none';
}

/* ================= Mehrserien-Chart (Achsen + Grid + Hover) ================= */
function drawLines(svg, seriesArr, legendEl, base, opts) {
  opts = opts || {};
  var W = svg.clientWidth || 560, H = svg.clientHeight || 150;
  var padL = 8, padR = opts.padR != null ? opts.padR : 52, padT = 8, padB = 18;
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  var all = [];
  seriesArr.forEach(function (s) { all = all.concat(s.pts); });
  if (all.length < 2) {
    svg.innerHTML = '<text x="' + (W / 2) + '" y="' + (H / 2) + '" text-anchor="middle" fill="var(--muted)" font-size="12">Noch zu wenig Daten.</text>';
    if (legendEl) legendEl.innerHTML = '';
    svg.__chart = null;
    return;
  }
  var x0 = Math.min.apply(null, all.map(function (p) { return p[0]; })), x1 = Math.max.apply(null, all.map(function (p) { return p[0]; }));
  var ys = all.map(function (p) { return p[1]; });
  if (base != null) ys = ys.concat([base]);
  var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
  if (y1 - y0 < 1e-9) { y0 -= 1; y1 += 1; }
  var yPad = (y1 - y0) * 0.06;
  y0 -= yPad; y1 += yPad;
  if (x1 - x0 < 1) x1 = x0 + 1;
  var plotW = W - padL - padR, plotH = H - padT - padB;
  function X(t) { return padL + (t - x0) / (x1 - x0) * plotW; }
  function Y(v) { return H - padB - (v - y0) / (y1 - y0) * plotH; }
  var html = '';
  // Y-Gitter (haarfein, durchgezogen) + Werte-Beschriftung
  var ticks = niceTicks(y0, y1, 4);
  ticks.forEach(function (tv) {
    html += '<line x1="' + padL + '" x2="' + (padL + plotW) + '" y1="' + Y(tv).toFixed(1) + '" y2="' + Y(tv).toFixed(1) + '" stroke="var(--grid)" stroke-width="1"></line>' +
      '<text x="' + (padL + 2) + '" y="' + (Y(tv) - 3).toFixed(1) + '" fill="var(--muted)" font-size="9.5">' + fmtTick(tv, y1 - y0) + '</text>';
  });
  // X-Zeitachse: 4 Beschriftungen, keine vertikalen Linien
  for (var xi = 0; xi <= 3; xi++) {
    var tx = x0 + (x1 - x0) * xi / 3;
    var anchor = xi === 0 ? 'start' : xi === 3 ? 'end' : 'middle';
    html += '<text x="' + X(tx).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="' + anchor + '" fill="var(--muted)" font-size="9.5">' + fmtTimeTick(tx, x1 - x0) + '</text>';
  }
  if (base != null) html += '<line x1="' + padL + '" x2="' + (padL + plotW) + '" y1="' + Y(base) + '" y2="' + Y(base) + '" stroke="var(--baseline)" stroke-dasharray="4 4" stroke-width="1"></line>';
  // Flächenfüllung (nur Einzelserie, ~10 % Deckung)
  if (opts.area && seriesArr.length === 1 && seriesArr[0].pts.length > 1) {
    var s0 = seriesArr[0];
    var dA = s0.pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join(' ');
    html += '<path d="' + dA + ' L' + X(s0.pts[s0.pts.length - 1][0]).toFixed(1) + ' ' + (H - padB) + ' L' + X(s0.pts[0][0]).toFixed(1) + ' ' + (H - padB) + ' Z" fill="' + s0.color + '" opacity="0.10"></path>';
  }
  // Linien + Endpunkte
  var endLabels = [];
  seriesArr.forEach(function (s) {
    if (s.pts.length < 2) return;
    var d = s.pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join(' ');
    var last = s.pts[s.pts.length - 1];
    html += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>';
    html += '<circle cx="' + X(last[0]).toFixed(1) + '" cy="' + Y(last[1]).toFixed(1) + '" r="4" fill="' + s.color + '" stroke="var(--surface)" stroke-width="2"></circle>';
    if (s.short) endLabels.push({ x: X(last[0]) + 8, y: Y(last[1]) + 3.5, txt: s.short, color: s.color });
  });
  // End-Beschriftungen: Kollisionen vermeiden (min. 13 px Abstand), Text in Textfarbe
  endLabels.sort(function (a, b) { return a.y - b.y; });
  for (var li = 1; li < endLabels.length; li++) {
    if (endLabels[li].y - endLabels[li - 1].y < 13) endLabels[li].y = endLabels[li - 1].y + 13;
  }
  endLabels.forEach(function (l) {
    html += '<text x="' + l.x.toFixed(1) + '" y="' + Math.min(H - padB, l.y).toFixed(1) + '" fill="var(--ink-2)" font-size="10" font-weight="600">' + U.esc(l.txt) + '</text>';
  });
  // Crosshair fürs Hover
  html += '<line class="xhair" x1="0" x2="0" y1="' + padT + '" y2="' + (H - padB) + '" stroke="var(--baseline)" stroke-width="1" style="display:none;"></line>';
  svg.innerHTML = html;
  svg.__chart = { W: W, H: H, padL: padL, plotW: plotW, x0: x0, x1: x1, series: seriesArr, unit: opts.unit || '' };
  if (!svg.__hoverBound) {
    svg.__hoverBound = true;
    svg.style.cursor = 'crosshair';
    svg.addEventListener('mousemove', chartHover);
    svg.addEventListener('mouseleave', chartLeave);
  }
  if (legendEl) legendEl.innerHTML = seriesArr.length > 1 ? seriesArr.map(function (s) {
    return '<span style="display:inline-flex; align-items:center; gap:5px; margin-right:14px;"><span style="width:10px;height:10px;border-radius:var(--r-klein);background:' + s.color + ';display:inline-block;"></span>' + U.esc(s.name) + '</span>';
  }).join('') : '';
}

  var Chart = {
    niceTicks: niceTicks, fmtTick: fmtTick, fmtTimeTick: fmtTimeTick,
    drawLines: drawLines, chartHover: chartHover, chartLeave: chartLeave
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Chart; return; }
  root.Chart = Chart;
})(typeof window !== 'undefined' ? window : globalThis);

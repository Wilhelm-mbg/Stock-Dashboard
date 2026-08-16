'use strict';
/* Wirtschaftskalender: verifizierte Fix-Termine (FOMC, CPI) + berechnete
   wiederkehrende Termine (US-Arbeitsmarktbericht, Verfallstage). */
(function () {
  // Verifizierte Termine (Quellen: Federal Reserve / BLS-Schedule, Stand Aug 2026). Zeiten in Berliner Zeit.
  var FIXED = [
    { d: '2026-09-11', t: '14:30', name: 'US-Inflationsdaten (CPI, August)', impact: 3 },
    { d: '2026-09-16', t: '20:00', name: 'Fed-Zinsentscheid (FOMC) + Projektionen', impact: 3 },
    { d: '2026-10-14', t: '14:30', name: 'US-Inflationsdaten (CPI, September)', impact: 3 },
    { d: '2026-10-28', t: '19:00', name: 'Fed-Zinsentscheid (FOMC)', impact: 3 },
    { d: '2026-11-10', t: '14:30', name: 'US-Inflationsdaten (CPI, Oktober)', impact: 3 },
    { d: '2026-12-09', t: '20:00', name: 'Fed-Zinsentscheid (FOMC) + Projektionen', impact: 3 },
    { d: '2026-12-10', t: '14:30', name: 'US-Inflationsdaten (CPI, November)', impact: 3 }
  ];

  function nthWeekday(year, month /*0-basiert*/, weekday, n) {
    var d = new Date(year, month, 1);
    var add = (weekday - d.getDay() + 7) % 7 + (n - 1) * 7;
    return new Date(year, month, 1 + add);
  }
  function iso(dt) {
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  }

  function buildEvents(daysAhead) {
    var out = [];
    var now = new Date();
    var horizon = new Date(now.getTime() + (daysAhead || 90) * 86400000);
    FIXED.forEach(function (e) {
      var dt = new Date(e.d + 'T' + e.t + ':00');
      if (dt >= new Date(now.getTime() - 12 * 3600000) && dt <= horizon) out.push({ dt: dt, name: e.name, impact: e.impact, fixed: true });
    });
    // Berechnet: Arbeitsmarktbericht (1. Freitag, 14:30) & großer Verfallstag (3. Freitag Mär/Jun/Sep/Dez)
    for (var m = 0; m < 5; m++) {
      var ref = new Date(now.getFullYear(), now.getMonth() + m, 1);
      var nfp = nthWeekday(ref.getFullYear(), ref.getMonth(), 5, 1);
      var nfpDt = new Date(iso(nfp) + 'T14:30:00');
      if (nfpDt >= now && nfpDt <= horizon) out.push({ dt: nfpDt, name: 'US-Arbeitsmarktbericht (NFP, vorauss.)', impact: 3 });
      if ([2, 5, 8, 11].indexOf(ref.getMonth()) !== -1) {
        var tw = nthWeekday(ref.getFullYear(), ref.getMonth(), 5, 3);
        var twDt = new Date(iso(tw) + 'T15:30:00');
        if (twDt >= now && twDt <= horizon) out.push({ dt: twDt, name: 'Großer Verfallstag (Triple Witching)', impact: 2 });
      }
    }
    out.sort(function (a, b) { return a.dt - b.dt; });
    return out;
  }

  function fmtCountdown(dt) {
    var days = Math.floor((dt - Date.now()) / 86400000);
    var isToday = new Date(dt).toDateString() === new Date().toDateString();
    if (isToday) return 'HEUTE';
    if (days <= 0) return 'morgen';
    if (days === 1) return 'in 1–2 Tagen';
    return 'in ' + (days + 1) + ' Tagen';
  }

  function render(el, n) {
    var evs = buildEvents(90).slice(0, n || 6);
    if (!evs.length) { el.innerHTML = '<div class="loading">Keine anstehenden Termine im Zeitfenster.</div>'; return; }
    el.innerHTML = evs.map(function (e) {
      var today = new Date(e.dt).toDateString() === new Date().toDateString();
      var dateStr = e.dt.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }) +
        ' · ' + e.dt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
      return '<div class="news-item"><div class="t">' +
        (e.impact >= 3 ? '🔴' : '🟠') + ' <b>' + e.name + '</b></div>' +
        '<div class="src">' + dateStr + '<br><span style="' + (today ? 'color:var(--down); font-weight:700;' : '') + '">' + fmtCountdown(e.dt) + '</span></div></div>';
    }).join('');
  }

  window.Cal = {
    next: function (n) { return buildEvents(90).slice(0, n || 3); },
    within24h: function () {
      return buildEvents(3).filter(function (e) { return e.impact >= 3 && e.dt - Date.now() < 24 * 3600000 && e.dt - Date.now() > -3 * 3600000; });
    },
    /** Sind wir gerade im Blackout-Fenster (± Minuten um einen High-Impact-Termin)? */
    isBlackout: function (ms, beforeMin, afterMin) {
      ms = ms || Date.now();
      var b = (beforeMin || 45) * 60000, a = (afterMin || 45) * 60000;
      var hit = buildEvents(7).filter(function (e) { return e.impact >= 3 && ms >= e.dt.getTime() - b && ms <= e.dt.getTime() + a; });
      return hit.length ? hit[0] : null;
    },
    /** High-Impact-Termin in den nächsten X Minuten? */
    upcoming: function (minAhead) {
      var ms = Date.now();
      var hit = buildEvents(3).filter(function (e) { return e.impact >= 3 && e.dt.getTime() - ms > 0 && e.dt.getTime() - ms <= (minAhead || 15) * 60000; });
      return hit.length ? hit[0] : null;
    },
    render: render
  };

  // Dashboard-Sektion füllen
  var el = document.getElementById('calendar');
  if (el) { render(el, 6); setInterval(function () { render(el, 6); }, 6 * 3600000); }
})();

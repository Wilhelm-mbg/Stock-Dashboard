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
    var d = new Date(Date.UTC(year, month, 1));
    var add = (weekday - d.getUTCDay() + 7) % 7 + (n - 1) * 7;
    return new Date(Date.UTC(year, month, 1 + add));
  }
  function iso(dt) {
    return dt.getUTCFullYear() + '-' + String(dt.getUTCMonth() + 1).padStart(2, '0') + '-' + String(dt.getUTCDate()).padStart(2, '0');
  }

  /* Alle Termine oben sind in BERLINER Zeit angegeben. `new Date('2026-09-11T14:30:00')`
     liest so etwas aber als Zeit der EINGESTELLTEN Systemzeitzone – auf einem PC außerhalb
     Deutschlands lagen damit sämtliche Blackout-Fenster falsch. Deshalb wird hier explizit
     von Berliner Zeit nach UTC gerechnet: Mitteleuropa ist UTC+1, in der Sommerzeit UTC+2.
     Sommerzeit gilt vom letzten Sonntag im März 01:00 UTC bis zum letzten Sonntag im
     Oktober 01:00 UTC (EU-weit einheitlich, anders als in den USA). */
  function letzterSonntagUtc(jahr, monat) {
    var d = new Date(Date.UTC(jahr, monat + 1, 0));            // letzter Tag des Monats
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());              // zurück auf Sonntag
    return Date.UTC(jahr, d.getUTCMonth(), d.getUTCDate(), 1); // Umstellung um 01:00 UTC
  }
  function berlinZeit(datumStr, zeitStr) {
    var d = String(datumStr).split('-').map(Number);
    var t = String(zeitStr || '00:00').split(':').map(Number);
    var alsUtc = Date.UTC(d[0], d[1] - 1, d[2], t[0] || 0, t[1] || 0);
    // Erst mit Winterzeit (+1) annehmen, dann prüfen, ob der Zeitpunkt in die Sommerzeit fällt.
    var kandidat = alsUtc - 3600000;
    var sommer = kandidat >= letzterSonntagUtc(d[0], 2) && kandidat < letzterSonntagUtc(d[0], 9);
    return new Date(sommer ? alsUtc - 2 * 3600000 : kandidat);
  }

  function buildEvents(daysAhead) {
    var out = [];
    var now = new Date();
    var horizon = new Date(now.getTime() + (daysAhead || 90) * 86400000);
    FIXED.forEach(function (e) {
      var dt = berlinZeit(e.d, e.t);
      if (dt >= new Date(now.getTime() - 12 * 3600000) && dt <= horizon) out.push({ dt: dt, name: e.name, impact: e.impact, fixed: true });
    });
    // Berechnet: Arbeitsmarktbericht (1. Freitag, 14:30) & großer Verfallstag (3. Freitag Mär/Jun/Sep/Dez)
    for (var m = 0; m < 5; m++) {
      var ref = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + m, 1));
      var nfp = nthWeekday(ref.getUTCFullYear(), ref.getUTCMonth(), 5, 1);
      var nfpDt = berlinZeit(iso(nfp), '14:30');
      if (nfpDt >= new Date(now.getTime() - 12 * 3600000) && nfpDt <= horizon) out.push({ dt: nfpDt, name: 'US-Arbeitsmarktbericht (NFP, vorauss.)', impact: 3 });
      if ([2, 5, 8, 11].indexOf(ref.getUTCMonth()) !== -1) {
        var tw = nthWeekday(ref.getUTCFullYear(), ref.getUTCMonth(), 5, 3);
        var twDt = berlinZeit(iso(tw), '15:30');
        if (twDt >= new Date(now.getTime() - 12 * 3600000) && twDt <= horizon) out.push({ dt: twDt, name: 'Großer Verfallstag (Triple Witching)', impact: 2 });
      }
    }
    out.sort(function (a, b) { return a.dt - b.dt; });
    return out;
  }

  function fmtCountdown(dt) {
    var isToday = new Date(dt).toDateString() === new Date().toDateString();
    if (isToday) return dt.getTime() < Date.now() ? 'HEUTE (vorbei)' : 'HEUTE';
    if (dt.getTime() < Date.now()) return 'vorbei';
    // Kalendertage statt 24-h-Blöcke zählen
    var heute0 = new Date(); heute0.setHours(0, 0, 0, 0);
    var dann0 = new Date(dt); dann0.setHours(0, 0, 0, 0);
    var tage = Math.round((dann0 - heute0) / 86400000);
    if (tage === 1) return 'morgen';
    return 'in ' + tage + ' Tagen';
  }

  function render(el, n) {
    var evs = buildEvents(90).slice(0, n || 6);
    // Veralteter Kalender: Wenn der letzte verifizierte Fix-Termin näher als 14 Tage liegt
    // (oder vorbei ist), verschwinden CPI/FOMC-Blackouts bald STILL – das muss sichtbar sein.
    var letzterFix = berlinZeit(FIXED[FIXED.length - 1].d, '23:59');
    var warnung = (letzterFix.getTime() - Date.now() < 14 * 86400000)
      ? '<div class="loading" style="color:var(--warn);">⚠ Die verifizierte Terminliste (CPI/FOMC) endet am ' +
        letzterFix.toLocaleDateString('de-DE') + ' – danach schützt der Event-Blackout nur noch vor NFP/Verfallstagen. Bitte App-Update laden.</div>'
      : '';
    if (!evs.length) { el.innerHTML = warnung + '<div class="loading">Keine anstehenden Termine im Zeitfenster.</div>'; return; }
    el.innerHTML = warnung + evs.map(function (e) {
      var today = new Date(e.dt).toDateString() === new Date().toDateString();
      var dateStr = e.dt.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }) +
        ' · ' + e.dt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
      return '<div class="news-item"><div class="t">' +
        (e.impact >= 3 ? '🔴' : '🟠') + ' <b>' + e.name + '</b></div>' +
        '<div class="src">' + dateStr + '<br><span style="' + (today ? 'color:var(--down); font-weight:700;' : '') + '">' + fmtCountdown(e.dt) + '</span></div></div>';
    }).join('');
  }

  var Cal = {
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
    render: render,
    // nur für die Tests: die Zeitzonen-Umrechnung prüfbar machen
    berlinZeit: berlinZeit
  };

  // In Node (Unit-Tests) gibt es kein window/document – dann nur exportieren, nicht rendern.
  if (typeof module !== 'undefined' && module.exports) { module.exports = Cal; return; }
  window.Cal = Cal;

  // Dashboard-Sektion füllen
  var el = document.getElementById('calendar');
  if (el) { render(el, 6); setInterval(function () { render(el, 6); }, 6 * 3600000); }
})();

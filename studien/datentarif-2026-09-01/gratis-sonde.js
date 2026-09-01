'use strict';
/* WAS KANN DIE GRATISSTUFE WIRKLICH? - tastend, nicht aus der Doku abgeleitet.
 *
 * SCHLUESSEL-SICHERHEIT (drei Riegel, weil einer zu wenig ist):
 *  1. Der Schluessel steht im Authorization-HEADER, nie in der URL. Eine
 *     protokollierte URL kann ihn deshalb gar nicht enthalten.
 *  2. Jede Ausgabe laeuft durch sicher(): kommt der Schluessel doch irgendwo vor
 *     (etwa weil die Gegenseite ihn zurueckspiegelt), wird er ersetzt.
 *  3. Die Sonde schreibt nur die Datei sonde-<phase>.json - und auch die geht
 *     durch sicher().
 *
 * TEMPO: 5 Abrufe/Minute auf Basic. Abstand 13 s wie in tools/massive.js.
 * Ein 429 wuerde das Bild verfaelschen, deshalb wird nicht gedraengelt.
 *
 * MEHRDEUTIGKEIT: 403 heisst NICHT automatisch "Tarif deckt das nicht". Die Sonde
 * hält deshalb je Abruf Status UND Fehlertext-Kern fest und unterscheidet drei
 * Faelle, die alle 403/leer aussehen koennen:
 *   (a) Tarif deckt den Endpunkt nicht      -> Text nennt Plan/Upgrade
 *   (b) Endpunkt existiert nicht            -> 404 / "Unknown"
 *   (c) Zeitraum ausserhalb der Stufe       -> Text nennt Zeitraum/Datum
 *   (d) freigeschaltet, aber 0 Treffer      -> HTTP 200, results: []
 * (d) ist ein GANZ anderer Befund als (a) - und beide sehen in einer
 * Trefferzaehlung gleich aus. Genau deshalb steht der Status daneben.
 *
 * Aufruf: node studien/datentarif-2026-09-01/gratis-sonde.js <phase>
 *   phase A  Endpunkt-Tastlauf (6 Abrufe)
 *   phase B  binaere Suche nach der echten News-Wand
 *   phase C  Dichte-Stichprobe (Teil 2)
 */
var https = require('https');
var fs = require('fs');
var path = require('path');
var M = require('../../tools/massive.js');

var KEY = M.schluessel();
var MASKE = '<SCHLUESSEL>';
function sicher(x) {
  var s = typeof x === 'string' ? x : JSON.stringify(x);
  /* Auch Teilstuecke ab 8 Zeichen ersetzen - ein abgeschnittener Schluessel ist
   * immer noch ein Schluessel. */
  if (!s) return s;
  s = s.split(KEY).join(MASKE);
  if (KEY.length > 12) s = s.split(KEY.slice(0, 12)).join(MASKE);
  return s;
}
function sage(x) { console.log(sicher(String(x))); }

var ABSTAND = M.ABSTAND_MS;          // 13 s
var letzter = 0;
function warte(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/** Ein Abruf. Gibt IMMER ein Ergebnis zurueck - auch bei Fehlern. Nichts wirft,
 *  weil ein geworfener Fehler die Tabelle unvollstaendig liesse. */
async function abruf(pfad) {
  var seit = Date.now() - letzter;
  if (seit < ABSTAND) await warte(ABSTAND - seit);
  letzter = Date.now();
  return new Promise(function (res) {
    var u = new URL('https://' + M.HOST + pfad);
    var req = https.get({
      host: u.host, path: u.pathname + u.search,
      headers: { Authorization: 'Bearer ' + KEY, Accept: 'application/json', 'User-Agent': 'markt-dashboard' },
      timeout: 30000,
    }, function (r) {
      var b = '';
      r.on('data', function (d) { b += d; });
      r.on('end', function () {
        var j = null;
        try { j = JSON.parse(b); } catch (e) { /* Rumpf bleibt Text */ }
        res({
          pfad: pfad,                                  // enthaelt nie den Schluessel
          status: r.statusCode,
          fehler: j && j.error ? String(j.error) : null,
          nachricht: j && j.message ? String(j.message) : null,
          statusFeld: j && j.status ? String(j.status) : null,
          treffer: j && Array.isArray(j.results) ? j.results.length : null,
          gesamt: j && typeof j.count === 'number' ? j.count : null,
          weiter: !!(j && j.next_url),
          rumpf: b.slice(0, 260),
          j: j,
        });
      });
    });
    req.on('timeout', function () { req.destroy(); res({ pfad: pfad, status: 0, fehler: 'Zeitueberschreitung' }); });
    req.on('error', function (e) { res({ pfad: pfad, status: 0, fehler: String(e.message) }); });
  });
}

function zeile(r) {
  var kern = r.fehler || r.nachricht || (r.treffer !== null ? r.treffer + ' Treffer' : '-');
  return '  HTTP ' + String(r.status).padEnd(4) + ' ' +
    (r.statusFeld ? '[' + r.statusFeld + '] ' : '') + sicher(kern).slice(0, 150);
}
function schreibe(name, obj) {
  var p = path.join(__dirname, name);
  fs.writeFileSync(p, sicher(JSON.stringify(obj, null, 1)));
  sage('geschrieben: ' + name);
}
function tag(vorTagen) {
  return new Date(Date.now() - vorTagen * 86400000).toISOString().slice(0, 10);
}

/* ================= PHASE A: Endpunkte abtasten ================= */
async function phaseA() {
  var proben = [
    ['Referenz active=false (nutzen wir bereits)', '/v3/reference/tickers?active=false&market=stocks&limit=1'],
    ['Nachrichten, ohne Zeitfilter', '/v2/reference/news?ticker=AAPL&limit=5'],
    ['Tages-Aggregate INNERHALB ~730 T', '/v2/aggs/ticker/AAPL/range/1/day/' + tag(700) + '/' + tag(690) + '?adjusted=true'],
    ['Tages-Aggregate AUSSERHALB ~730 T', '/v2/aggs/ticker/AAPL/range/1/day/' + tag(820) + '/' + tag(810) + '?adjusted=true'],
    ['Minutenbalken, frisch (letzte Tage)', '/v2/aggs/ticker/AAPL/range/1/minute/' + tag(5) + '/' + tag(3) + '?adjusted=true&limit=5'],
    ['Minutenbalken, alt (~700 T zurueck)', '/v2/aggs/ticker/AAPL/range/1/minute/' + tag(700) + '/' + tag(699) + '?adjusted=true&limit=5'],
  ];
  var aus = [];
  for (var i = 0; i < proben.length; i++) {
    sage('\n[' + (i + 1) + '/' + proben.length + '] ' + proben[i][0]);
    sage('  ' + proben[i][1]);
    var r = await abruf(proben[i][1]);
    sage(zeile(r));
    aus.push({ was: proben[i][0], pfad: proben[i][1], status: r.status, statusFeld: r.statusFeld,
      fehler: r.fehler, nachricht: r.nachricht, treffer: r.treffer, gesamt: r.gesamt, weiter: r.weiter,
      rumpf: r.rumpf });
  }
  schreibe('sonde-A.json', { stand: new Date().toISOString(), proben: aus });
}

/* ================= PHASE B: die echte News-Wand ================= */
/* Binaere Suche ueber published_utc.lt: gibt es Meldungen VOR Zeitpunkt X?
 * Nicht raten - die Doku nennt 22.06.2016 fuer den Bestand und "2 Jahre" fuer
 * Basic; welche der beiden Grenzen unser Schluessel sieht, sagt nur der Versuch. */
async function phaseB() {
  var frueh = new Date('2016-01-01').getTime();      // sicher VOR jedem Bestand
  var spaet = Date.now();                            // sicher innerhalb
  var schritte = [];
  /* Erst die beiden Enden pruefen, damit die Suche einen belegten Rahmen hat. */
  for (var e = 0; e < 2; e++) {
    var d = e === 0 ? frueh : spaet - 86400000;
    var iso = new Date(d).toISOString().slice(0, 10);
    var r = await abruf('/v2/reference/news?ticker=AAPL&published_utc.lt=' + iso + '&limit=1&order=desc&sort=published_utc');
    sage('  Rahmen ' + iso + ' -> HTTP ' + r.status + ', Treffer ' + r.treffer + (r.fehler ? ' | ' + sicher(r.fehler).slice(0, 80) : ''));
    schritte.push({ datum: iso, status: r.status, treffer: r.treffer, fehler: r.fehler });
    if (e === 0 && r.status === 200 && r.treffer > 0) {
      sage('  Es gibt Meldungen VOR 2016 - die Suche braucht eine fruehere Untergrenze.');
    }
  }
  /* Binaere Suche: kleinstes Datum, zu dem es noch aeltere Meldungen gibt. */
  var lo = frueh, hi = spaet, runde = 0;
  while (hi - lo > 7 * 86400000 && runde < 12) {
    runde++;
    var mitte = lo + Math.floor((hi - lo) / 2);
    var isoM = new Date(mitte).toISOString().slice(0, 10);
    var rm = await abruf('/v2/reference/news?ticker=AAPL&published_utc.lt=' + isoM + '&limit=1&order=desc&sort=published_utc');
    var hat = rm.status === 200 && rm.treffer > 0;
    var aeltester = hat && rm.j && rm.j.results && rm.j.results[0] ? rm.j.results[0].published_utc : null;
    sage('  Runde ' + runde + ': vor ' + isoM + ' -> HTTP ' + rm.status + ', ' +
      (hat ? 'JA (juengste davor ' + String(aeltester).slice(0, 10) + ')' : 'nein') +
      (rm.fehler ? ' | ' + sicher(rm.fehler).slice(0, 70) : ''));
    schritte.push({ datum: isoM, status: rm.status, treffer: rm.treffer, fehler: rm.fehler, aeltester: aeltester });
    if (hat) hi = mitte; else lo = mitte;
  }
  schreibe('sonde-B.json', { stand: new Date().toISOString(), wandZwischen: [new Date(lo).toISOString().slice(0, 10), new Date(hi).toISOString().slice(0, 10)], schritte: schritte });
  sage('\n  Wand liegt zwischen ' + new Date(lo).toISOString().slice(0, 10) + ' und ' + new Date(hi).toISOString().slice(0, 10));
}

/* ================= PHASE D: was aus Phase A/B folgt ================= */
async function phaseD() {
  var proben = [
    ['Minutenbalken AUSSERHALB ~730 T (Wand auch hier?)',
     '/v2/aggs/ticker/AAPL/range/1/minute/' + tag(820) + '/' + tag(819) + '?adjusted=true&limit=5'],
    ['Dividenden-Termine (Landkarte 2.12 verlangt sie)',
     '/v3/reference/dividends?ticker=AAPL&limit=5'],
    ['Tages-Aggregate UNADJUSTIERT (Landkarte 2.12 verlangt sie)',
     '/v2/aggs/ticker/AAPL/range/1/day/' + tag(60) + '/' + tag(50) + '?adjusted=false'],
    ['Seitengroesse: limit=1000 - wie viel kommt wirklich?',
     '/v2/reference/news?ticker=AAPL&limit=1000&order=desc&sort=published_utc'],
    ['Nachrichten zu einem VERSCHWUNDENEN Wert (Ueberlebensverzerrung)',
     '/v2/reference/news?ticker=FRCB&limit=5&order=desc&sort=published_utc'],
    ['Splits (Kapitalmassnahmen, fuer Sprungpaar-Befunde)',
     '/v3/reference/splits?ticker=AAPL&limit=5'],
  ];
  var aus = [];
  for (var i = 0; i < proben.length; i++) {
    sage('\n[' + (i + 1) + '/' + proben.length + '] ' + proben[i][0]);
    sage('  ' + proben[i][1]);
    var r = await abruf(proben[i][1]);
    sage(zeile(r));
    if (r.status === 200 && r.j && r.j.results && r.j.results.length) {
      var e = r.j.results[r.j.results.length - 1];
      var stichwort = e.published_utc || e.ex_dividend_date || e.execution_date ||
        (e.t ? new Date(e.t).toISOString().slice(0, 10) : null);
      if (stichwort) sage('    aeltester Eintrag dieser Seite: ' + String(stichwort).slice(0, 10));
    }
    aus.push({ was: proben[i][0], pfad: proben[i][1], status: r.status, statusFeld: r.statusFeld,
      fehler: r.fehler, nachricht: r.nachricht, treffer: r.treffer, weiter: r.weiter, rumpf: r.rumpf });
  }
  schreibe('sonde-D.json', { stand: new Date().toISOString(), proben: aus });
}

var phase = (process.argv[2] || 'A').toUpperCase();
(async function () {
  sage('== Gratisstufen-Sonde, Phase ' + phase + ' == Abstand ' + (ABSTAND / 1000) + ' s (5 Abrufe/Min)');
  sage('Schluessel geladen (' + KEY.length + ' Zeichen) - er steht im Header, nie in einer URL.');
  if (phase === 'A') await phaseA();
  else if (phase === 'B') await phaseB();
  else if (phase === 'D') await phaseD();
  else { sage('Unbekannte Phase.'); process.exit(2); }
})();

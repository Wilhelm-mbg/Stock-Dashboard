'use strict';
/* PROBE: Liefert Alpaca auf der GRATISSTUFE Kapitalmassnahmen - und reichen sie bis 2016?
 *
 *   node studien/alpaca-vollsammlung-2026-09/probe-massnahmen.js
 *
 * WARUM DIESE PROBE VOR DEM BAU KOMMT. Wilhelms Entscheid vom 03.09.2026 ist "beides":
 * ein rohes Minutenarchiv UND eine bereinigte Kopie, die LOKAL aus roh + Massnahmen
 * abgeleitet wird. Die bereinigte Kopie steht und faellt mit den Massnahmen. Gibt es sie
 * auf der Gratisstufe nicht, ist Teil (c) der Vollsammlung nicht baubar - dann wird das
 * GEMELDET, nicht ersetzt (Auftrag: "Liefert der Gratis-Tarif keine Massnahmen: melden,
 * nicht ersetzen"). Ein Faktor, den man aus der Rohreihe erraet, waere eine Behauptung:
 * ein Kurssprung von -50 % kann ein Split sein oder eine Gewinnwarnung.
 *
 * KRITERIEN - im Code, VOR dem Lauf (wiki/messmethodik.md):
 *   K1  Der Endpunkt antwortet ueberhaupt (HTTP 200, kein Tarif-Nein).
 *   K2  MNST zeigt den Forward-Split 2:1 mit Wirkung 11.08.2026 - genau die Massnahme,
 *       die die Skalenreparatur unabhaengig aus den Kursen gemessen hat (Faktor 2,000000).
 *       Das ist die Positivkontrolle: die Quelle muss dasselbe sagen wie die Messung.
 *   K3  SPGI zeigt die Abspaltung mit Wirkung ~01.07.2026 (gemessener Faktor 1,057000).
 *   K4  Reichweite: der Endpunkt liefert Massnahmen aus 2016-2021 (AAPL-Split 4:1 am
 *       31.08.2020, NVDA-Split 4:1 am 20.07.2021). Ohne Reichweite ist die bereinigte
 *       Kopie nur fuer die juengsten Jahre ableitbar - auch das waere ein Befund.
 *   K5  Die gelieferten Saetze tragen ein Wirkungsdatum und ein Verhaeltnis, aus dem sich
 *       ein FAKTOR rechnen laesst - sonst ist die Ableitung nicht ausfuehrbar.
 *
 * Zugang: nur ueber schluessel.js der Spannen-Studie. Diese Datei kennt die Umgebungsnamen
 * nicht; jede Ausgabe laeuft durch verdecken().
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var S = require('../vorregistrierung-2026-09-02-spannen-historisch/schluessel.js');

var DATEN = 'https://data.alpaca.markets/v1';
var ERGEBNIS = path.join(__dirname, 'probe-massnahmen-ergebnis.json');

function sag(t) { process.stdout.write(S.verdecken(t) + '\n'); }

/* Alle Arten, die Alpaca kennt - wir fragen sie ALLE ab. "Haben ist besser als brauchen"
 * (Wilhelm, 03.09.2026): welche davon die Ableitung anwendet, entscheidet spaeter das
 * Werkzeug, nicht die Abfrage. */
var ARTEN = ['reverse_split', 'forward_split', 'unit_split', 'cash_dividend', 'stock_dividend',
  'spin_off', 'cash_merger', 'stock_merger', 'stock_and_cash_merger', 'redemption',
  'name_change', 'worthless_removal', 'rights_distribution'].join(',');

async function hole(url, f) {
  f = f || globalThis.fetch;
  var res, text;
  try {
    res = await f(url, { headers: S.kopfzeilen(), signal: AbortSignal.timeout(60000) });
    text = await res.text();
  } catch (e) { return { status: 0, text: 'netz: ' + S.verdecken(String(e && e.message)) }; }
  var daten = null;
  try { daten = JSON.parse(text); } catch (e2) { daten = null; }
  return { status: res.status, text: text, daten: daten };
}

/** Alle Saetze einer Antwort flach, mit ihrer Art. Alpaca buendelt sie je Art unter
 *  corporate_actions.<art_plural>. Die Form wird NICHT vorausgesetzt, sondern gelesen -
 *  was da ist, kommt mit. */
function flach(daten) {
  var ca = daten && daten.corporate_actions;
  if (!ca || typeof ca !== 'object') return [];
  var aus = [];
  Object.keys(ca).forEach(function (art) {
    var liste = ca[art];
    if (!Array.isArray(liste)) return;
    liste.forEach(function (e) { aus.push(Object.assign({ _art: art }, e)); });
  });
  return aus;
}

/** Traegt ein Satz ein Wirkungsdatum und etwas, aus dem ein Faktor wird? (K5) */
function faktorAus(e) {
  var alt = Number(e.old_rate), neu = Number(e.new_rate);
  if (isFinite(alt) && isFinite(neu) && alt > 0 && neu > 0) return neu / alt;
  var r = Number(e.rate);
  if (isFinite(r) && r > 0) return r;
  return null;
}
function datumAus(e) {
  return e.ex_date || e.effective_date || e.process_date || e.payable_date || null;
}

async function lauf(f) {
  var raus = { erzeugt: new Date().toISOString(), abrufe: [], kriterien: {}, urteil: {} };

  /* --- Abruf 1: die beiden gemessenen Faelle, 2026 --- */
  var u1 = DATEN + '/corporate-actions?symbols=MNST,SPGI&types=' + ARTEN +
    '&start=2026-01-01&end=2026-09-03&limit=1000';
  var r1 = await hole(u1, f);
  raus.abrufe.push({ was: 'MNST,SPGI 2026', status: r1.status, rumpf: r1.status === 200 ? null : S.verdecken(String(r1.text).slice(0, 300)) });
  var s1 = r1.status === 200 ? flach(r1.daten) : [];

  /* --- Abruf 2: Reichweite 2016-2021 --- */
  var u2 = DATEN + '/corporate-actions?symbols=AAPL,NVDA&types=' + ARTEN +
    '&start=2016-01-01&end=2021-12-31&limit=1000';
  var r2 = await hole(u2, f);
  raus.abrufe.push({ was: 'AAPL,NVDA 2016-2021', status: r2.status, rumpf: r2.status === 200 ? null : S.verdecken(String(r2.text).slice(0, 300)) });
  var s2 = r2.status === 200 ? flach(r2.daten) : [];

  /* --- K1 --- */
  raus.kriterien.K1 = { erfuellt: r1.status === 200, status: r1.status };

  /* --- K2: MNST Split 2:1 am 11.08.2026 --- */
  var mnst = s1.filter(function (e) { return e.symbol === 'MNST' && /split/.test(e._art); });
  var mTreffer = mnst.filter(function (e) { var fk = faktorAus(e); return fk !== null && Math.abs(fk - 2) < 0.001; });
  raus.kriterien.K2 = { erfuellt: mTreffer.length > 0, gefunden: mnst.map(function (e) { return { art: e._art, datum: datumAus(e), faktor: faktorAus(e) }; }) };

  /* --- K3: SPGI Abspaltung ~01.07.2026 --- */
  var spgi = s1.filter(function (e) { return e.symbol === 'SPGI' || e.source_symbol === 'SPGI'; });
  raus.kriterien.K3 = { erfuellt: spgi.some(function (e) { return /spin/.test(e._art); }),
    gefunden: spgi.map(function (e) { return { art: e._art, datum: datumAus(e), faktor: faktorAus(e), roh: e }; }) };

  /* --- K4: Reichweite --- */
  var alt = s2.filter(function (e) { return /split/.test(e._art); });
  raus.kriterien.K4 = { erfuellt: alt.length > 0, saetze: alt.length,
    gefunden: alt.slice(0, 10).map(function (e) { return { sym: e.symbol, art: e._art, datum: datumAus(e), faktor: faktorAus(e) }; }) };

  /* --- K5: Datum + Faktor auf jedem Split/Spin-off --- */
  var relevant = s1.concat(s2).filter(function (e) { return /split|spin/.test(e._art); });
  var ohne = relevant.filter(function (e) { return !datumAus(e) || faktorAus(e) === null; });
  raus.kriterien.K5 = { erfuellt: relevant.length > 0 && ohne.length === 0, saetze: relevant.length, ohneDatumOderFaktor: ohne.length };

  /* Was liefert der Endpunkt ueberhaupt? Fuer das Wiki, nicht fuer das Urteil. */
  var jeArt = {};
  s1.concat(s2).forEach(function (e) { jeArt[e._art] = (jeArt[e._art] || 0) + 1; });
  raus.artenGeliefert = jeArt;
  raus.beispielSatz = relevant.length ? relevant[0] : (s1[0] || s2[0] || null);

  var k = raus.kriterien;
  raus.urteil = {
    bestanden: !!(k.K1.erfuellt && k.K2.erfuellt && k.K3.erfuellt && k.K4.erfuellt && k.K5.erfuellt),
    gefallen: Object.keys(k).filter(function (n) { return !k[n].erfuellt; }),
  };
  return raus;
}

/** Selbsttest fuer die Leck-Kette in test-v6 Block 35: erfundene Zugangswerte gegen einen
 *  Server, der die Kopfzeilen im Rumpf zurueckspiegelt. Nichts davon darf in der Ausgabe
 *  stehen. Nach dem Muster von probe-alpaca-balken.js. */
async function selbsttest() {
  S.testZugangSetzen('ERFUNDENER-ZUGANG-1234', 'ERFUNDENES-GEHEIMNIS-5678');
  var gesammelt = '';
  var echt = process.stdout.write;
  process.stdout.write = function (t) { gesammelt += t; return true; };
  try {
    var spiegel = function (url, opt) {
      var k = (opt && opt.headers) || {};
      var rumpf = JSON.stringify({ message: 'Fehler mit ' + k['APCA-API-KEY-ID'] + ' und ' + k['APCA-API-SECRET-KEY'] });
      return Promise.resolve({ status: 403, text: function () { return Promise.resolve(rumpf); },
        headers: { get: function () { return null; } } });
    };
    var r = await lauf(spiegel);
    sag('Probe (Selbsttest): ' + JSON.stringify(r.abrufe));
    sag('Urteil: ' + JSON.stringify(r.urteil));
  } finally { process.stdout.write = echt; }
  var leck = gesammelt.indexOf('ERFUNDENER-ZUGANG-1234') >= 0 || gesammelt.indexOf('ERFUNDENES-GEHEIMNIS-5678') >= 0;
  return { leck: leck, ausgabe: gesammelt };
}

async function main() {
  if (!S.vorhanden()) {
    console.error('Kein Zugang in der Umgebung: ' + S.fehlend().join(', ') + ' fehlt.');
    process.exit(2);
  }
  sag('Probe Kapitalmassnahmen (Alpaca /v1/corporate-actions) - 2 Abrufe, schreibt nur das Ergebnis.');
  var r = await lauf();
  fs.writeFileSync(ERGEBNIS, S.verdecken(JSON.stringify(r, null, 1)));
  sag('');
  Object.keys(r.kriterien).forEach(function (n) {
    sag('  ' + n + ': ' + (r.kriterien[n].erfuellt ? 'erfuellt' : 'GEFALLEN') + '  ' +
      JSON.stringify(r.kriterien[n]).slice(0, 400));
  });
  sag('');
  sag('Arten geliefert: ' + JSON.stringify(r.artenGeliefert));
  sag('Beispielsatz: ' + JSON.stringify(r.beispielSatz));
  sag('URTEIL: ' + (r.urteil.bestanden ? 'BESTANDEN' : 'NICHT BESTANDEN (' + r.urteil.gefallen.join(', ') + ')'));
  sag('Ergebnis: ' + ERGEBNIS);
}

module.exports = { lauf: lauf, selbsttest: selbsttest, flach: flach, faktorAus: faktorAus, datumAus: datumAus, ERGEBNIS: ERGEBNIS };
if (require.main === module) main().catch(function (e) { console.error(S.verdecken(String(e && e.stack || e))); process.exit(1); });

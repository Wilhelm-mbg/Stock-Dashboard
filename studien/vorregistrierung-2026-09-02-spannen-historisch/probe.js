'use strict';
/* ================= SCHRITT 0: Probe an der Alpaca-Kurstafel =================
 *
 * Zweck: EINE Frage vor jedem Bau - gibt der Gratis-Tarif historische NBBO-Quotes her?
 * Kommt 403/422 oder ein Tarif-Hinweis, ist die Studie hier zu Ende und der Befund lautet
 * "nicht messbar" (wiki/messmethodik.md A1). Kommen Quotes mit bp/ap, wird gebaut.
 *
 * Diese Probe MISST NICHTS. Sie stellt fest, was der Endpunkt ueberhaupt liefert:
 * Erreichbarkeit, Rueckreichweite, Feed (sip gegen iex), Auktionen, und was vorboerslich
 * zurueckkommt (die Antwort darauf legt die Placebo-Regel der Registrierung fest, statt
 * sie zu raten). Alle hier gezeigten Zahlen werden in der Registrierung unter
 * "Gesehene Zahlen" deklariert.
 *
 * Zugang: ausschliesslich ueber schluessel.js aus der Umgebung. Diese Datei kennt die
 * Umgebungsnamen nicht und gibt nichts aus, was nicht durch verdecken() gelaufen ist.
 *
 * Aufruf (Wilhelm, in seinem eigenen Terminal):
 *     node studien/vorregistrierung-2026-09-02-spannen-historisch/probe.js
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */

var S = require('./schluessel.js');

var BASIS = 'https://data.alpaca.markets/v2';

/* Ein 2018 duenn gehandelter Wert aus dem eingefrorenen Universum: Malibu Boats, Median-
 * Tagesumsatz 6,2 Mio $ ueber die 20 Balken bis 01.03.2018 (archiv1d, Regel aus liquide.js).
 * Gegenstueck zu AAPL, damit die Probe nicht nur den bestabgedeckten Wert der Welt trifft. */
var DUENN = 'MBUU';

/** Ausgabe. Laeuft ausnahmslos durch verdecken(). */
function sag(text) { process.stdout.write(S.verdecken(text) + '\n'); }

function pause(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/** Ein Abruf. Gibt IMMER ein Ergebnis zurueck, nie eine Ausnahme - eine Probe, die beim
 *  ersten Netzfehler abbricht, beantwortet die uebrigen Fragen nicht mehr.
 *  `hole` ist einspeisbar, damit der Selbsttest einen boesartigen Server stellen kann. */
async function abruf(pfad, hole) {
  var f = hole || globalThis.fetch;
  try {
    var res = await f(BASIS + pfad, { headers: S.kopfzeilen() });
    var text = await res.text();
    var daten = null;
    try { daten = JSON.parse(text); } catch (e) { daten = null; }
    return { status: res.status, text: text, daten: daten,
             grenze: res.headers && res.headers.get ? (res.headers.get('x-ratelimit-limit') || '') : '' };
  } catch (e) {
    return { status: 0, text: 'Netzfehler: ' + (e && e.message ? e.message : String(e)), daten: null, grenze: '' };
  }
}

/** Spanne in Prozentpunkten aus einem Quote. Null-Gebot, Null-Brief und gekreuzte Quotes
 *  (ap < bp) gelten als FEHLEND, nicht als Spanne 0 - dieselbe Regel wie im Messwerkzeug. */
function spannePp(q) {
  if (!q) return null;
  var bp = Number(q.bp), ap = Number(q.ap);
  if (!isFinite(bp) || !isFinite(ap) || bp <= 0 || ap <= 0 || ap < bp) return null;
  var mid = (bp + ap) / 2;
  if (!(mid > 0)) return null;
  return ((ap - bp) / mid) * 100;
}

function zeigeQuotes(r, sym) {
  var liste = r.daten && r.daten.quotes ? (r.daten.quotes[sym] || []) : [];
  if (!Array.isArray(liste)) liste = [];
  sag('    Quotes: ' + liste.length);
  for (var i = 0; i < liste.length && i < 3; i++) {
    var q = liste[i], s = spannePp(q);
    sag('      ' + (q.t || '?') + '  bp=' + q.bp + ' ap=' + q.ap + ' bs=' + q.bs + ' as=' + q.as +
        ' bx=' + q.bx + ' ax=' + q.ax + '  Spanne=' + (s == null ? 'FEHLEND' : s.toFixed(4) + ' Pp'));
  }
  return liste.length;
}

function quotesPfad(sym, start, feed, limit) {
  return '/stocks/quotes?symbols=' + encodeURIComponent(sym) +
         '&start=' + encodeURIComponent(start) +
         '&limit=' + (limit || 3) + '&feed=' + feed;
}

async function main() {
  sag('=== Probe: historische Kurstafel Alpaca - ' + new Date().toISOString() + ' ===');
  sag('');
  if (!S.vorhanden()) {
    sag('ABBRUCH: Umgebungswerte fehlen (' + S.fehlend().join(', ') + ').');
    sag('Setze sie in DEINEM Terminal und starte die Probe erneut. Sie werden nirgends');
    sag('gespeichert, ausgegeben oder in eine Adresse gehaengt.');
    return;
  }

  /* Die Fragen der Probe, in der Reihenfolge, in der sie die Studie entscheiden. */
  var fragen = [
    { name: '1) AAPL 2018-03-01 09:35 ET, feed=sip  - die Kernfrage',
      pfad: quotesPfad('AAPL', '2018-03-01T14:35:00Z', 'sip'), sym: 'AAPL' },
    { name: '2) ' + DUENN + ' 2018-03-01 09:35 ET, feed=sip  - duenner Wert',
      pfad: quotesPfad(DUENN, '2018-03-01T14:35:00Z', 'sip'), sym: DUENN },
    { name: '3) AAPL 2018-03-01 09:35 ET, feed=iex  - Rueckfallebene',
      pfad: quotesPfad('AAPL', '2018-03-01T14:35:00Z', 'iex'), sym: 'AAPL' },
    { name: '4) AAPL 2016-01-05 09:35 ET, feed=sip  - wie weit reicht die Tafel zurueck?',
      pfad: quotesPfad('AAPL', '2016-01-05T14:35:00Z', 'sip'), sym: 'AAPL' },
    { name: '5) AAPL 2024-06-03 12:30 ET, feed=sip  - Zelle der Positivkontrolle',
      pfad: quotesPfad('AAPL', '2024-06-03T16:30:00Z', 'sip'), sym: 'AAPL' },
    { name: '6) AAPL 2024-06-03 08:00 ET, feed=sip  - vorboerslich (legt die Placebo-Regel fest)',
      pfad: quotesPfad('AAPL', '2024-06-03T12:00:00Z', 'sip'), sym: 'AAPL' },
    { name: '7) AAPL 2025-08-01 12:30 ET, feed=sip  - juengstes Jahr, Verzoegerung des Tarifs?',
      pfad: quotesPfad('AAPL', '2025-08-01T16:30:00Z', 'sip'), sym: 'AAPL' },
    { name: '8) Sammelabruf 3 Symbole, 5 Sekunden, feed=sip - traegt ein Aufruf mehrere Werte?',
      pfad: '/stocks/quotes?symbols=AAPL%2CMSFT%2C' + DUENN +
            '&start=2018-03-01T14%3A35%3A00Z&end=2018-03-01T14%3A35%3A05Z&limit=50&feed=sip',
      sym: 'AAPL', sammel: true }
  ];

  var auktion = { name: '9) Auktionen AAPL 2018-03-01, feed=sip - Zusatz B',
                  pfad: '/stocks/auctions?symbols=AAPL&start=2018-03-01&end=2018-03-02&feed=sip' };

  var treffer = 0, tarif = 0;
  for (var i = 0; i < fragen.length; i++) {
    var f = fragen[i];
    var r = await abruf(f.pfad);
    sag(f.name);
    sag('    HTTP ' + r.status + (r.grenze ? '   (Ratengrenze laut Kopfzeile: ' + r.grenze + '/min)' : ''));
    if (r.status === 200) {
      if (f.sammel && r.daten && r.daten.quotes) {
        var namen = Object.keys(r.daten.quotes);
        sag('    Symbole in der Antwort: ' +
            namen.map(function (n) { return n + '=' + r.daten.quotes[n].length; }).join(', '));
        sag('    next_page_token: ' + (r.daten.next_page_token ? 'ja' : 'nein'));
      }
      if (zeigeQuotes(r, f.sym) > 0) treffer++;
    } else {
      if (r.status === 403 || r.status === 422 || r.status === 401) tarif++;
      sag('    Rumpf: ' + String(r.text || '').replace(/\s+/g, ' ').slice(0, 300));
    }
    sag('');
    await pause(400);
  }

  var ra = await abruf(auktion.pfad);
  sag(auktion.name);
  sag('    HTTP ' + ra.status);
  sag('    Rumpf (400 Zeichen): ' + String(ra.text || '').replace(/\s+/g, ' ').slice(0, 400));
  sag('');
  sag('=== Urteil der Probe ===');
  sag('Abrufe mit Quotes: ' + treffer + ' von ' + fragen.length +
      '   |   Tarif-/Zugangsabweisungen (401/403/422): ' + tarif);
  sag(treffer > 0
    ? 'Die Tafel liefert. Weiter mit Schritt 1 (Vorregistrierung).'
    : 'Keine Quotes. Wenn der Grund Tarif oder Zugang ist: Abbruch, Befund in die Uebergabe.');
}

/* ---- Selbsttest: kein Netz, boesartiger Server. Prueft, dass erfundene Zugangswerte
 *      weder auf dem Bildschirm noch in einer Datei landen. Wird von test-v6.js gefahren. */
async function selbsttest() {
  var MARKE_ID = 'ZZTESTKENNUNGxyz1234', MARKE_GEHEIM = 'ZZTESTGEHEIMabcd5678';
  S.testZugangSetzen(MARKE_ID, MARKE_GEHEIM);
  var gesammelt = '';
  var echtesSchreiben = process.stdout.write.bind(process.stdout);
  /* Der Haken SAMMELT und REICHT DURCH. Nur zu sammeln waere kuerzer, verschluckt aber
   * jede fremde Ausgabe, die waehrend des await weiter unten anfaellt: test-v6.js ruft
   * selbsttest() aus einem async-IIFE, und der uebrige Dateirumpf laeuft in diesem
   * Fenster weiter. Am 03.09.2026 landeten so 102 Zeilen eines nachfolgenden Abschnitts
   * im Sammelpuffer statt im Protokoll - sichtbar blieb nur "1 TEST(S) FEHLGESCHLAGEN"
   * ohne den Namen der roten Zusicherung (wiki/fehlerformen.md, "die Pruefung, die
   * niemand ansieht"). Der Leck-Test bleibt davon unberuehrt scharf: `gesammelt`
   * enthaelt weiter ALLES, was durch diesen Haken geht. */
  process.stdout.write = function (chunk, enc, cb) {
    gesammelt += String(chunk);
    return echtesSchreiben(chunk, enc, cb);
  };
  /* Ein Server, der die Kopfzeilen im Rumpf zurueckspiegelt - der schlimmste Fall. */
  var boese = async function (url, opt) {
    var kopf = JSON.stringify((opt && opt.headers) || {});
    return { status: 500, headers: { get: function () { return null; } },
             text: async function () { return 'Serverfehler bei ' + url + ' mit ' + kopf; } };
  };
  var r = await abruf('/stocks/quotes?symbols=AAPL', boese);
  sag('Selbsttest-Rumpf: ' + r.text);
  sag('Selbsttest-Kopf: ' + JSON.stringify(S.kopfzeilen()));
  process.stdout.write = echtesSchreiben;
  var leck = gesammelt.indexOf(MARKE_ID) >= 0 || gesammelt.indexOf(MARKE_GEHEIM) >= 0;
  return { leck: leck, ausgabe: gesammelt };
}

module.exports = { spannePp: spannePp, abruf: abruf, selbsttest: selbsttest, DUENN: DUENN };

if (require.main === module) { main(); }

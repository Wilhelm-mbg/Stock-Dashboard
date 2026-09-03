'use strict';
/* ============ SCHRITT 0 zu Zusatz C: fuehrt die Tafel verschwundene Werte? ============
 *
 * EINE Frage vor jedem Bau: liefert data.alpaca.markets/v2/stocks/quotes ueberhaupt
 * Quotes fuer ein Symbol, das es heute nicht mehr gibt? Kommen 0 von 5 zurueck, ist
 * Zusatz C nicht messbar - dann steht der Befund in der Uebergabe, die Haupttabellen
 * behalten den Vermerk "misst Ueberlebende", und es wird nichts gebaut.
 *
 * Diese Probe MISST NICHTS. Sie stellt drei Dinge fest, und jedes davon ist eine Falle,
 * die schon einmal zugeschnappt ist:
 *
 *   (1) TRAEGT DIE TAFEL DEN WERT?  HTTP 200 mit leerer Quote-Liste ist ein anderer
 *       Befund als HTTP 403 - beides wird getrennt gezaehlt.
 *
 *   (2) IST ES DER ANGEFRAGTE ZEITPUNKT?  Die iex-Falle (VORREGISTRIERUNG Paragraph 1.1,
 *       wiki/datenquellen.md): eine Anfrage auf 2018 kam mit Quotes von 2020 zurueck -
 *       HTTP 200, keine Warnung. Diese Probe faehrt nur feed=sip und haelt den
 *       gelieferten Zeitstempel tq gegen den angefragten. Erwartet: 0 bis wenige
 *       Sekunden VOR dem Zeitpunkt (sort=desc), nie danach, nie ein anderes Jahr.
 *
 *   (3) IST ES DERSELBE WERT?  Boersen vergeben Kuerzel neu. Ein Quote unter "MRO" aus
 *       dem Jahr 2027 gehoert nicht mehr zu Marathon Oil. Geprueft wird deshalb an der
 *       LEBENSZEIT aus massive/tagesdaten/: der Mittelkurs des gelieferten Quotes muss
 *       in die Tagesspanne [tief, hoch] des Balkens fallen, den das Archiv fuer genau
 *       diesen Tag fuehrt. Dazu ein zweiter Abruf DEUTLICH NACH dem letzten Balken:
 *       kommt dort noch ein Quote, handelt das Kuerzel weiter - der Wert ist dann
 *       entweder gar nicht verschwunden (verschwundene.json stammt aus
 *       reference/tickers?active=false und kennt Fehlalarme, siehe abmeldungen.json:
 *       AVB, EQR, WBS tragen dort "historie-zurueckgesetzt") oder das Kuerzel wurde neu
 *       vergeben. In beiden Faellen taugt der Wert nicht als Beleg.
 *
 * AUSWAHL DER FUENF - Regel, nicht Namensliste (wiki/fehlerformen.md, Universum nach
 * Eigenschaft filtern):
 *   - mindestens 60 Tagesbalken in massive/tagesdaten/ (sonst ist die Lebenszeit zu kurz,
 *     um einen Zeitpunkt sicher hineinzulegen),
 *   - letzter Balken vor dem 03.03.2026 (ein halbes Jahr vor heute - frisch Verschwundene
 *     koennten noch nachlaufen),
 *   - in einer der vier Umsatzklassen (Regel woertlich aus liquide.js, wie im Hauptrahmen),
 *   - je Klasse die AELTESTEN zuerst (frueher letzter Handelstag = laenger weg),
 *     aufgefuellt in Klassenreihenfolge bis fuenf.
 * Der Zeitpunkt je Wert liegt in der Mitte der Lebenszeit, Fenster `mitte`, Minute und
 * Sekunde aus DEMSELBEN Wuerfelstrom wie der Hauptrahmen (saatAus(sym|tag|mitte)).
 *
 * KONTROLLE: derselbe Abruf auf AAPL am selben Tag. Kaeme von fuenf Verschwundenen nichts
 * und von AAPL auch nichts, laege es an der Probe, nicht an der Tafel - ohne diese Zeile
 * waere "0 von 5" nicht deutbar.
 *
 * Zugang: ausschliesslich ueber schluessel.js. Diese Datei kennt die Umgebungsnamen nicht
 * und liest process.env nicht. Jede Ausgabe laeuft durch verdecken().
 *
 * Aufruf (Wilhelm, in seinem eigenen Terminal, mit gesetzten Umgebungswerten):
 *     node studien/vorregistrierung-2026-09-02-spannen-historisch/probeC.js
 *
 * Nur lesend: massive/tagesdaten/, massive/verschwundene.json, der abgelegte Boersenkalender.
 * Es wird KEINE Datei geschrieben.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */

var fs = require('fs');
var path = require('path');
var S = require('./schluessel.js');
var M = require('./messen.js');
var St = require('./stichprobe.js');
var Kalender = require('./kalender.js');
var Liquide = require(path.join(__dirname, '..', '..', 'liquide.js'));

var BASIS = 'https://data.alpaca.markets/v2';
var TAGESDATEN = path.join(St.MASSIVE, 'tagesdaten');

/* Auswahlregel, oben begruendet. Wer eine Zahl aendert, aendert die Probe. */
var WAHL = { mindestBalken: 60, letzterVor: '2026-03-03', anzahl: 5, nachlaufTage: 60 };
var KLASSEN = [
  { name: '5-50', von: 5e6, bis: 50e6 },
  { name: '50-250', von: 50e6, bis: 250e6 },
  { name: '250-1000', von: 250e6, bis: 1000e6 },
  { name: 'ab1000', von: 1000e6, bis: Infinity }
];

function sag(text) { process.stdout.write(S.verdecken(text) + '\n'); }
function pause(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/* Tagesdatum in New York - dieselbe Rechnung wie in stichprobe.js (reiheLesen). */
var NY = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false,
  year: 'numeric', month: '2-digit', day: '2-digit' });
function datumET(ms) {
  var p = {}; NY.formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
  return p.year + '-' + p.month + '-' + p.day;
}

/** Eine Reihe aus massive/tagesdaten/. Format wie archiv1d:
 *  [zeit, schluss, stueck, hoch, tief, eroeffnung]. Balken ohne Schluss fallen weg. */
function verschwundeneReihe(sym) {
  var j;
  try { j = JSON.parse(fs.readFileSync(path.join(TAGESDATEN, sym + '.json'), 'utf8')); }
  catch (e) { return null; }
  var s = j && j.series;
  if (!Array.isArray(s) || !s.length) return null;
  var tage = [], b = [];
  for (var i = 0; i < s.length; i++) {
    if (!s[i] || !(s[i][1] > 0)) continue;
    tage.push(datumET(s[i][0])); b.push(s[i]);
  }
  if (!tage.length) return null;
  return { sym: sym, tage: tage, b: b, delistet: j.delistet || null, name: j.name || '' };
}

/** Die fuenf. Deterministisch, ohne Netz. */
function auswaehlen(kal) {
  var kand = [];
  fs.readdirSync(TAGESDATEN).forEach(function (f) {
    if (f.slice(-5) !== '.json') return;
    var R = verschwundeneReihe(f.slice(0, -5));
    if (!R || R.tage.length < WAHL.mindestBalken) return;
    var letzter = R.tage[R.tage.length - 1];
    if (!(letzter < WAHL.letzterVor)) return;
    /* Mitte der Lebenszeit, auf den naechsten VOLLEN Handelstag geschoben. */
    var i = Math.floor(R.tage.length / 2);
    while (i < R.tage.length && (!kal.tage[R.tage[i]] || !kal.tage[R.tage[i]].voll)) i++;
    if (i >= R.tage.length || i < 19) return;
    if (!Liquide.hatUmsatz(R.b, i, 20)) return;
    var u = Liquide.medianUmsatz(R.b, i, 20);
    var kn = null;
    for (var k = 0; k < KLASSEN.length; k++) {
      if (u >= KLASSEN[k].von && u < KLASSEN[k].bis) { kn = KLASSEN[k].name; break; }
    }
    if (!kn) return;
    kand.push({ sym: R.sym, name: R.name, klasse: kn, umsatz: u, letzter: letzter,
                delistet: R.delistet, balken: R.tage.length,
                tag: R.tage[i], bar: R.b[i] });
  });
  var gewaehlt = [], jeKlasse = {};
  /* Zwei Runden: erst je Klasse der aelteste, dann auffuellen. So ist die Probe auf die
   * Klassen verteilt, statt aus der groessten Klasse zu bestehen. */
  for (var runde = 1; runde <= 3 && gewaehlt.length < WAHL.anzahl; runde++) {
    for (var kk = 0; kk < KLASSEN.length && gewaehlt.length < WAHL.anzahl; kk++) {
      var kn2 = KLASSEN[kk].name;
      var g = kand.filter(function (c) { return c.klasse === kn2; })
                  .sort(function (a, b) { return a.letzter < b.letzter ? -1 : a.letzter > b.letzter ? 1
                                                 : (a.sym < b.sym ? -1 : 1); });
      var n = jeKlasse[kn2] || 0;
      if (g[n]) { gewaehlt.push(g[n]); jeKlasse[kn2] = n + 1; }
    }
  }
  return { gewaehlt: gewaehlt, kandidaten: kand.length };
}

/** Zeitpunkt im Fenster `mitte` an einem Tag - DERSELBE Wuerfelstrom wie im Hauptrahmen. */
function zeitpunktMitte(sym, tag) {
  var r = St.wuerfel(St.saatAus(sym + '|' + tag + '|mitte', St.PLAN.saat));
  var von = 10 * 60, bis = 15 * 60 + 30;
  var minute = von + Math.floor(r() * (bis - von));
  var sekunde = Math.floor(r() * 60);
  return new Date(St.etZuUtc(tag, minute, sekunde)).toISOString();
}

/** Ein voller Handelstag ungefaehr `n` Handelstage nach `ab`. null, wenn keiner mehr da. */
function tagNach(kal, ab, n) {
  var alle = Object.keys(kal.tage).filter(function (d) { return d > ab && kal.tage[d].voll; }).sort();
  return alle.length ? alle[Math.min(n, alle.length - 1)] : null;
}

/** Ein Abruf. Gibt IMMER ein Ergebnis zurueck, nie eine Ausnahme - eine Probe, die beim
 *  ersten Netzfehler abbricht, beantwortet die uebrigen Fragen nicht mehr.
 *  `holen` ist einspeisbar, damit der Selbsttest einen boesartigen Server stellen kann. */
async function abruf(pfad, holen) {
  var f = holen || globalThis.fetch;
  try {
    var res = await f(BASIS + pfad, { headers: S.kopfzeilen() });
    var text = await res.text();
    var daten = null;
    try { daten = JSON.parse(text); } catch (e) { daten = null; }
    return { status: res.status, text: text, daten: daten };
  } catch (e) {
    return { status: 0, text: 'Netzfehler: ' + (e && e.message ? e.message : String(e)), daten: null };
  }
}

/** Der Quote zu einem Zeitpunkt, mit pfadQuote() aus messen.js - nicht nachgebaut,
 *  damit die Probe genau das fragt, was der Vollauf fragen wuerde. */
async function quoteAn(sym, utc) {
  var r = await abruf(M.pfadQuote(sym, utc));
  var L = (r.status === 200 && r.daten && r.daten.quotes && Array.isArray(r.daten.quotes[sym]))
    ? r.daten.quotes[sym] : [];
  return { status: r.status, anzahl: L.length, q: L[0] || null,
           rumpf: String(r.text || '').replace(/\s+/g, ' ').slice(0, 200) };
}

/** Was der Quote ueber sich verraet, gegen den angefragten Zeitpunkt und den Tagesbalken. */
function pruefen(erg, utc, bar) {
  var z = { status: erg.status, anzahl: erg.anzahl };
  if (!erg.q) return z;
  var b = M.bewerten(erg.q);
  z.tq = erg.q.t;
  z.bp = erg.q.bp; z.ap = erg.q.ap;
  z.versatzS = (Date.parse(utc) - Date.parse(erg.q.t)) / 1000;   /* > 0 = Quote liegt VOR T */
  z.spanne = (b.spanne == null ? null : b.spanne);
  z.grund = b.grund || null;
  z.gesperrt = !!b.gesperrt;
  z.amCentBoden = (erg.q.bp > 0 && erg.q.ap > 0 && Math.abs((erg.q.ap - erg.q.bp) - 0.01) < 1e-9);
  if (b.mid != null && bar) {
    /* bar = [zeit, schluss, stueck, hoch, tief, eroeffnung] */
    var hoch = bar[3], tief = bar[4];
    z.mid = b.mid; z.tief = tief; z.hoch = hoch;
    if (isFinite(hoch) && isFinite(tief) && tief > 0) {
      /* Der NBBO-Mittelkurs darf knapp ausserhalb der Handelsspanne liegen (Gebot und Brief
       * umschliessen die Trades). Fuenf Prozent Toleranz - alles darueber ist kein
       * Rundungsproblem mehr, sondern ein anderer Wert. */
      z.imTagesband = (b.mid >= tief * 0.95 && b.mid <= hoch * 1.05);
      z.abstandPct = b.mid < tief ? ((tief - b.mid) / tief * 100)
                   : b.mid > hoch ? ((b.mid - hoch) / hoch * 100) : 0;
    }
  }
  return z;
}

function zeigen(titel, z) {
  sag('    ' + titel);
  sag('      HTTP ' + z.status + '   Quotes ' + z.anzahl);
  if (!z.tq) { if (z.status !== 200) sag('      Rumpf: ' + (z.rumpf || '')); return; }
  sag('      geliefert ' + z.tq + '   Versatz zum angefragten Zeitpunkt ' +
      z.versatzS.toFixed(1) + ' s ' + (z.versatzS < 0 ? '(NACH T - VERFEHLT)' : '(vor T)'));
  sag('      bp=' + z.bp + '  ap=' + z.ap + '   Spanne ' +
      (z.spanne == null ? 'FEHLEND (' + z.grund + ')' : z.spanne.toFixed(4) + ' Pp') +
      (z.gesperrt ? '  [gesperrt]' : '') + (z.amCentBoden ? '  [am Cent-Boden]' : ''));
  if (z.mid != null && z.tief != null) {
    sag('      Mittelkurs ' + z.mid.toFixed(4) + '   Tagesband des Archivs [' + z.tief + ', ' + z.hoch + ']' +
        '   -> ' + (z.imTagesband ? 'DRIN' : 'AUSSERHALB um ' + z.abstandPct.toFixed(1) + ' %'));
  }
}

async function main() {
  sag('=== Probe zu Zusatz C: fuehrt die Tafel verschwundene Werte? - ' + new Date().toISOString() + ' ===');
  sag('');
  if (!S.vorhanden()) {
    sag('ABBRUCH: Umgebungswerte fehlen (' + S.fehlend().join(', ') + ').');
    sag('Setze sie in DEINEM Terminal und starte die Probe erneut. Sie werden nirgends');
    sag('gespeichert, ausgegeben oder in eine Adresse gehaengt.');
    return;
  }
  var kal = Kalender.lesen();
  if (!kal || !kal.tage) { sag('ABBRUCH: Boersenkalender fehlt (kalender.json im Spannen-Ordner).'); return; }

  var A = auswaehlen(kal);
  sag('Kandidaten nach der Auswahlregel: ' + A.kandidaten + '   gewaehlt: ' + A.gewaehlt.length);
  sag('');

  var mitQuote = 0, imBand = 0, nachLebenMitQuote = 0, tarif = 0;
  for (var i = 0; i < A.gewaehlt.length; i++) {
    var C = A.gewaehlt[i];
    var utc = zeitpunktMitte(C.sym, C.tag);
    sag((i + 1) + ') ' + C.sym + '  [' + C.klasse + ', Median-Umsatz ' +
        (C.umsatz / 1e6).toFixed(1) + ' Mio $]  ' + C.name);
    sag('    Lebenszeit im Archiv: ' + C.balken + ' Balken, letzter Handelstag ' + C.letzter +
        (C.delistet ? '   (Liste: ' + C.delistet + ')' : ''));

    var e1 = await quoteAn(C.sym, utc);
    var z1 = pruefen(e1, utc, C.bar); z1.rumpf = e1.rumpf;
    zeigen('IN der Lebenszeit: ' + C.tag + ', Fenster mitte, angefragt ' + utc, z1);
    if (z1.tq) mitQuote++;
    if (z1.imTagesband) imBand++;
    if (z1.status === 401 || z1.status === 403 || z1.status === 422) tarif++;

    /* Der zweite Abruf: deutlich NACH dem letzten Balken. Kommt hier ein Quote, handelt
     * das Kuerzel weiter - dann ist der Wert kein Beleg fuer "die Tafel fuehrt
     * Verschwundene", sondern ein Fehlalarm der Liste oder eine Kuerzel-Neuvergabe. */
    var spaet = tagNach(kal, C.letzter, WAHL.nachlaufTage);
    if (spaet) {
      var utc2 = zeitpunktMitte(C.sym, spaet);
      var e2 = await quoteAn(C.sym, utc2);
      var z2 = pruefen(e2, utc2, null); z2.rumpf = e2.rumpf;
      zeigen('NACH dem letzten Balken: ' + spaet + ' (' + WAHL.nachlaufTage +
             ' Handelstage spaeter), angefragt ' + utc2, z2);
      if (z2.tq) { nachLebenMitQuote++; sag('      ACHTUNG: das Kuerzel handelt nach dem letzten Balken weiter.'); }
      else sag('      kein Quote nach dem letzten Balken - passt zu einem wirklich verschwundenen Wert.');
    }
    sag('');
    await pause(400);
  }

  /* Kontrolle: derselbe Abruf auf einen Wert, den es sicher gibt. Ohne sie waere ein
   * "0 von 5" nicht deutbar - es koennte auch an der Probe liegen. */
  var kTag = A.gewaehlt.length ? A.gewaehlt[0].tag : '2025-06-02';
  var kUtc = zeitpunktMitte('AAPL', kTag);
  var ek = await quoteAn('AAPL', kUtc);
  var zk = pruefen(ek, kUtc, null); zk.rumpf = ek.rumpf;
  sag('K) KONTROLLE AAPL am ' + kTag + ' - beweist, dass die Probe selbst laeuft');
  zeigen('angefragt ' + kUtc, zk);
  sag('');

  sag('=== Urteil der Probe ===');
  sag('Verschwundene mit Quote IN der Lebenszeit: ' + mitQuote + ' von ' + A.gewaehlt.length);
  sag('   davon Mittelkurs im Tagesband des Archivs: ' + imBand + '  (Kuerzel-Wiederverwendung ausgeschlossen)');
  sag('Kuerzel, die NACH dem letzten Balken noch Quotes liefern: ' + nachLebenMitQuote +
      '  (jedes davon ist KEIN Beleg)');
  sag('Tarif-/Zugangsabweisungen (401/403/422): ' + tarif);
  sag('Kontrolle AAPL: ' + (zk.tq ? 'Quote da - die Probe laeuft.' : 'KEIN Quote - die Probe selbst ist verdaechtig.'));
  sag('');
  if (!zk.tq) {
    sag('URTEIL: unentscheidbar. Die Kontrolle liefert nichts; erst die Probe reparieren.');
  } else if (imBand === 0) {
    sag('URTEIL: Zusatz C ist NICHT messbar. Kein verschwundener Wert liefert einen Quote,');
    sag('der nachweislich aus seiner Lebenszeit stammt. Befund in die Uebergabe, die');
    sag('Haupttabellen behalten den Vermerk "misst Ueberlebende". Ende.');
  } else {
    sag('URTEIL: Die Tafel fuehrt verschwundene Werte (' + imBand + ' von ' + A.gewaehlt.length +
        ' belegt). Weiter mit dem Registrierungs-Nachtrag Paragraph 9b.');
  }
}

/* ---- Selbsttest: kein Netz, boesartiger Server. Prueft, dass erfundene Zugangswerte
 *      weder auf dem Bildschirm noch in einer Datei landen. Wird von test-v6.js gefahren.
 *      Baugleich mit probe.js: der stdout-Haken reicht DURCH, statt zu schlucken. */
async function selbsttest() {
  var MARKE_ID = 'ZZTESTKENNUNGxyz1234', MARKE_GEHEIM = 'ZZTESTGEHEIMabcd5678';
  S.testZugangSetzen(MARKE_ID, MARKE_GEHEIM);
  var gesammelt = '';
  var echtesSchreiben = process.stdout.write.bind(process.stdout);
  process.stdout.write = function (chunk) { gesammelt += String(chunk); return echtesSchreiben(chunk); };
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

module.exports = { auswaehlen: auswaehlen, zeitpunktMitte: zeitpunktMitte,
                   verschwundeneReihe: verschwundeneReihe, pruefen: pruefen,
                   abruf: abruf, selbsttest: selbsttest, WAHL: WAHL };

if (require.main === module) { main(); }

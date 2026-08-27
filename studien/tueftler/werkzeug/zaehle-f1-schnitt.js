'use strict';
/* Tueftler, 27.08.2026 - was holt ein "Schnitt am letzten Sprung" zurueck?
 *
 * PM-Auftrag: zaehlen, wie viel brauchbare Historie ein Schnitt rettet. NICHT
 * entscheiden, ob er zulaessig ist - die vier Bedenken dazu stehen VOR dem Lauf
 * in studien/tueftler/2026-08-27-f1-schnitt-am-letzten-sprung.md.
 *
 * BAUT AUF, WIEDERHOLT NICHT. Die Zaehlung "58 verworfen, 25 ein Sprung, 7 mehrere,
 * 23 nur Kurs>100k, Rand-Bereinigung rettet 1" stammt aus
 * studien/datenfund-dochte-2026-08-27/f1-raender.js (~01:50, andere Sitzung). Ich
 * uebernehme sie und rechne nur die ANDERE Operation: nicht Raender kappen, sondern
 * am Sprung schneiden. Die Sprunglogik ist woertlich dieselbe (reiheKaputt), damit
 * die Reihenmenge vergleichbar bleibt - eine Abweichung waere selbst ein Fund und
 * wird ausgewiesen.
 *
 * DREI SCHNITTE, weil "der Schnitt" nicht eindeutig ist:
 *   Schwanz  - alles NACH dem letzten Sprung behalten (das woertlich Beauftragte)
 *   Kopf     - alles VOR dem ersten Sprung behalten (das Spiegelbild)
 *   bester   - der laengste sprungfreie Abschnitt ueberhaupt
 * Fuer jeden wird geprueft, ob der Rest die Preisschwelle NOCH IMMER reisst - ein
 * Schnitt beseitigt keine Niveau-Verletzung.
 *
 * Nur lesend. Achtet auf die Archivsperre wie das Werkzeug der anderen Sitzung.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');

var D = process.env.ARCHIV1D || 'E:/Markt-Dashboard-Archiv/archiv1d';
var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive');
var MIN_BRAUCHBAR = 250;   /* unter einem Handelsjahr nennen wir es nicht "Historie" */

function sperreAktiv(ordner) {
  var p = path.join(ordner, '_laeuft.json');
  if (!fs.existsSync(p)) return null;
  var j; try { j = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; }
  var start = Date.parse(j.start);
  if (!isFinite(start) || (Date.now() - start) / 3600000 >= 6) return null;
  if (j.pid) { try { process.kill(j.pid, 0); } catch (e) { return null; } }
  return j;
}
var sp = sperreAktiv(D);
if (sp) { console.error('ABBRUCH: archiv1d wird geschrieben (PID ' + sp.pid + ').'); process.exit(2); }

var ARTEN = (function () {
  try {
    var j = JSON.parse(fs.readFileSync(path.join(DATEN, 'wertpapierarten.json'), 'utf8'));
    if (j && j.arten && Object.keys(j.arten).length > 1000) return j.arten;
  } catch (e) {}
  return null;
})();
function artVon(s) { return ARTEN ? (ARTEN[s] || ARTEN[s.replace(/-/g, '.')] || null) : null; }
function istAktie(s) { var a = artVon(s); return a === 'CS' || a === 'ADRC'; }

function dateien(ordner) {
  var out = [];
  fs.readdirSync(ordner, { withFileTypes: true }).forEach(function (e) {
    var p = path.join(ordner, e.name);
    if (e.isDirectory() && !/^backup/.test(e.name)) out = out.concat(dateien(p));
    else if (e.isFile() && e.name.indexOf('bars_1d_') === 0) out.push(p);
  });
  return out;
}
function tag(ts) { return new Date(ts).toISOString().slice(0, 10); }

/* Woertlich reiheKaputt, aber ALLE Spruenge gesammelt und die Preisschwelle
 * getrennt gefuehrt - sonst laesst sich ein Abschnitt nicht einzeln beurteilen. */
function spruengeVon(bars) {
  var out = [];
  for (var i = 1; i < bars.length; i++) {
    var v = bars[i - 1][1], c = bars[i][1];
    if (v > 0 && c > 0) { var r = c / v - 1; if (r > 4 || r < -0.8) out.push({ i: i, r: r, t: tag(bars[i][0])}); }
  }
  return out;
}
function maxKurs(bars, von, bis) {
  var m = 0;
  for (var i = von; i < bis; i++) if (bars[i][1] > m) m = bars[i][1];
  return m;
}

var alle = dateien(D);
var verworfen = [], geprueft = 0;
for (var f = 0; f < alle.length; f++) {
  var j;
  try { j = JSON.parse(fs.readFileSync(alle[f], 'utf8')); } catch (e) { continue; }
  var b = j.bars || j.series || [];
  if (!b.length) continue;
  geprueft++;
  var sym = path.basename(alle[f]).slice(8, -5);
  var sp2 = spruengeVon(b);
  var mk = maxKurs(b, 0, b.length);
  if (!sp2.length && !(mk > 100000)) continue;      /* F1 laesst sie durch */
  verworfen.push({ sym: sym, bars: b, spruenge: sp2, maxKurs: mk });
}

/* ---------- die drei Schnitte ---------- */
function abschnitt(e, von, bis) {
  var laenge = bis - von;
  var mk = laenge > 0 ? maxKurs(e.bars, von, bis) : 0;
  return {
    kerzen: laenge,
    von: laenge ? tag(e.bars[von][0]) : null,
    bis: laenge ? tag(e.bars[bis - 1][0]) : null,
    reisstPreisschwelleWeiter: mk > 100000,
    brauchbar: laenge >= MIN_BRAUCHBAR && !(mk > 100000)
  };
}

var zeilen = verworfen.map(function (e) {
  var n = e.bars.length, s = e.spruenge;
  var schwanz, kopf, bester;
  if (s.length) {
    schwanz = abschnitt(e, s[s.length - 1].i, n);
    kopf = abschnitt(e, 0, s[0].i);
    /* laengster sprungfreier Abschnitt: Grenzen sind 0, alle Sprungindizes, n */
    var g = [0].concat(s.map(function (x) { return x.i; })).concat([n]);
    var best = { kerzen: -1 };
    for (var k = 0; k < g.length - 1; k++) {
      var a = abschnitt(e, g[k], g[k + 1]);
      if (a.kerzen > best.kerzen) best = a;
    }
    bester = best;
  } else {
    schwanz = kopf = bester = { kerzen: 0, von: null, bis: null, reisstPreisschwelleWeiter: true, brauchbar: false };
  }
  return {
    sym: e.sym, art: artVon(e.sym), istAktie: istAktie(e.sym),
    laenge: n, spruenge: s.length,
    nurPreisschwelle: s.length === 0,
    letzterSprung: s.length ? s[s.length - 1].t + ' (Kerze ' + s[s.length - 1].i + '/' + n + ')' : null,
    schwanzNachLetztemSprung: schwanz,
    kopfVorErstemSprung: kopf,
    besterAbschnitt: bester
  };
});

function summe(list, feld) { var t = 0; list.forEach(function (x) { t += x[feld].kerzen; }); return t; }
function zaehl(list, feld) { return list.filter(function (x) { return x[feld].brauchbar; }).length; }

var aktien = zeilen.filter(function (x) { return x.istAktie; });
var nichtAktien = zeilen.filter(function (x) { return !x.istAktie; });
var mitSprung = zeilen.filter(function (x) { return x.spruenge > 0; });
var aktienMitSprung = mitSprung.filter(function (x) { return x.istAktie; });

var out = {
  erzeugt: new Date().toISOString(),
  auftrag: 'PM 27.08.: wie viel brauchbare Historie holt ein Schnitt am letzten Sprung zurueck?',
  hinweis: 'Zaehlung. Die Zulaessigkeitsfrage steht VOR dem Lauf im Protokoll und wird hier NICHT beantwortet.',
  vorarbeit: 'Reihenmenge und Sprungzahlen aus studien/datenfund-dochte-2026-08-27/f1-ergebnis.txt (andere Sitzung, ~01:50) - hier reproduziert, nicht ersetzt.',
  schwelleBrauchbar_Kerzen: MIN_BRAUCHBAR,
  reihenGeprueft: geprueft,
  vonF1Verworfen: zeilen.length,
  abgleichMitVorarbeit: (zeilen.length === 58 ? 'deckungsgleich (58)' : 'ABWEICHUNG: ' + zeilen.length + ' statt 58 - selbst ein Fund'),
  nachWertpapierart: {
    CS_oder_ADRC: aktien.length,
    andere_oder_unbekannt: nichtAktien.length,
    hinweis: 'Reihen ausserhalb CS/ADRC wirft schon der Wertpapierart-Filter, nicht erst F1 - fuer sie ist die Rettungsfrage gegenstandslos.'
  },
  rettbarkeit: {
    ohneSprung_nichtSchneidbar: zeilen.filter(function (x) { return x.nurPreisschwelle; }).length,
    mitSprung: mitSprung.length,
    davonAktien: aktienMitSprung.length,
    schwanzBrauchbar: zaehl(mitSprung, 'schwanzNachLetztemSprung'),
    schwanzBrauchbar_nurAktien: zaehl(aktienMitSprung, 'schwanzNachLetztemSprung'),
    kopfBrauchbar_nurAktien: zaehl(aktienMitSprung, 'kopfVorErstemSprung'),
    besterBrauchbar_nurAktien: zaehl(aktienMitSprung, 'besterAbschnitt'),
    kerzenSchwanz_nurAktien: summe(aktienMitSprung, 'schwanzNachLetztemSprung'),
    kerzenKopf_nurAktien: summe(aktienMitSprung, 'kopfVorErstemSprung'),
    kerzenBester_nurAktien: summe(aktienMitSprung, 'besterAbschnitt'),
    kerzenGanzeReihen_nurAktien: aktienMitSprung.reduce(function (t, x) { return t + x.laenge; }, 0)
  },
  reihen: zeilen.sort(function (a, b) {
    if (a.istAktie !== b.istAktie) return a.istAktie ? -1 : 1;
    return b.besterAbschnitt.kerzen - a.besterAbschnitt.kerzen;
  })
};
var ziel = path.join(__dirname, '..', 'daten', 'zaehlung-f1-schnitt-2026-08-27.json');
fs.writeFileSync(ziel, JSON.stringify(out, null, 1));

console.log('geprueft ' + geprueft + ' Reihen, von F1 verworfen: ' + zeilen.length + '  [' + out.abgleichMitVorarbeit + ']');
console.log('Wertpapierart: CS/ADRC ' + aktien.length + '  |  andere/unbekannt ' + nichtAktien.length);
console.log(JSON.stringify(out.rettbarkeit, null, 1));
console.log('\nAktien mit Sprung, je Reihe (Kerzen: ganz / Schwanz / Kopf / bester):');
aktienMitSprung.forEach(function (x) {
  console.log('  ' + x.sym.padEnd(7) + String(x.laenge).padStart(6) +
    ' /' + String(x.schwanzNachLetztemSprung.kerzen).padStart(6) +
    ' /' + String(x.kopfVorErstemSprung.kerzen).padStart(6) +
    ' /' + String(x.besterAbschnitt.kerzen).padStart(6) +
    '  bester ' + x.besterAbschnitt.von + '..' + x.besterAbschnitt.bis +
    (x.besterAbschnitt.reisstPreisschwelleWeiter ? '  [Preisschwelle bleibt gerissen]' : ''));
});
console.log('\ngeschrieben: ' + ziel);

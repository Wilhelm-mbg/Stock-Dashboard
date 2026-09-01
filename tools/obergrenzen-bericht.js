'use strict';
/* DIE OBERGRENZEN-MELDUNG.
 *
 * "Nicht entscheidbar" ist eine Nicht-Aussage. Es klingt wie "wir wissen es nicht", und
 * meistens stimmt sogar etwas Staerkeres: Wir wissen, dass dort NICHTS GROSSES ist.
 *
 * Der Unterschied ist der zwischen Schweigen und Wissen. Ein Lauf, der +0,05 Pp misst
 * mit einem Standardfehler von 0,06 Pp, hat eine obere 95-%-Grenze von 0,17 Pp. Er hat
 * damit AUSGESCHLOSSEN, dass dort eine Kante von 0,30 Pp liegt - das ist ein Befund, und
 * er stand bisher in keinem Protokoll ausgeschrieben.
 *
 * Liegt die obere Grenze unter der Kostenhuerde der Handelsklasse, ist die Sache
 * ERLEDIGT, nicht offen: Selbst der optimistischste mit den Daten vertraegliche Wert
 * traegt die Kosten nicht. Diese Familie muss nie wieder durchsucht werden.
 *
 * WAS DIESES WERKZEUG NICHT DARF: Es rechnet keine neuen Zahlen. tagesmittel und se
 * stehen im Protokoll; die Grenze ist tagesmittel + 1,96 x se, eine Zeile. Und es
 * schreibt kein Protokoll um - Protokolle sind Belege (D2).
 *
 * ZUR SKALA: tagesmittel ist der Mittelwert UEBER TAGE des mittleren Ueberschusses JE
 * HANDEL an diesem Tag. Seine Einheit ist damit Pp je Umlauf - dieselbe wie die der
 * Kostenhuerde. Der Vergleich ist zulaessig. Daneben steht "jeSignal" (Mittel ueber
 * alle Signale, nicht ueber Tage): duenne Tage koennen beide Zahlen auseinanderziehen
 * (Warnung B2 der Maschine). Handelbar ist die Zahl je Signal; das Band rechnet auf
 * tagesmittel, weil nur dort ein Standardfehler vorliegt.
 *
 * HUERDEN (Stand wiki/kosten.md, 02.09.2026): Kassa-Aktie ~0,06 Pp ist eine ANNAHME
 * (kein Broker-Konto, Freigabeschwelle der Kostenmessung unerfuellt); CFD-Runde K = 0,10
 * (gemessen fuer die Mrd-Klasse, vorlaeufig) plus Finanzierung F = 0,0247 Pp je Nacht
 * (Capital.com-Gebuehrenformel) -> 0,1247 fuer eine Nacht; Standard-Schein 0,23.
 * Die aelteren Huerden 0,04 (Aktie, nur Spanne) und 0,05 (Schein ATM) sind ueberholt.
 *
 * Aufruf: node tools/obergrenzen-bericht.js [protokollordner]
 *           [--huerden=Name:0.06,Name:0.1247,...]   eigene Huerden
 *           [--band=0.06,0.1247]                    Zwischenband fuer die Kandidatenliste
 *           [--md]                                  zusaetzlich Markdown-Tabellen ausgeben
 */
var fs = require('fs'), path = require('path');

var Z = 1.959964;   // zweiseitig 95 %
var HUERDEN = [
  ['Kassa-Aktie (ANNAHME)', 0.06],
  ['CFD-Runde K ohne Nacht', 0.10],
  ['CFD gehebelt, 1 Nacht (K+F)', 0.1247],
  ['Standard-Schein', 0.23]
];
var BAND = [0.06, 0.1247];
var MD = false;

var argv = process.argv.slice(2), dir = null;
argv.forEach(function (a) {
  var m;
  if ((m = /^--huerden=(.+)$/.exec(a))) {
    HUERDEN = m[1].split(',').map(function (s) { var t = s.split(':'); return [t[0], parseFloat(t[1])]; });
  } else if ((m = /^--band=([\d.]+),([\d.]+)$/.exec(a))) {
    BAND = [parseFloat(m[1]), parseFloat(m[2])];
  } else if (a === '--md') { MD = true; }
  else if (!/^--/.test(a)) { dir = a; }
});
dir = dir || path.join(__dirname, '..', 'studien', 'messmaschine', 'protokolle');
if (!fs.existsSync(dir)) { console.error('Kein Protokollordner: ' + dir); process.exit(2); }

/* Je Kennung nur der juengste Lauf - aeltere sind vom selben Gegenstand. */
var jeKey = {};
fs.readdirSync(dir).filter(function (f) { return /\.json$/.test(f); }).forEach(function (f) {
  var p; try { p = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { return; }
  var k = p.strategie && p.strategie.key; if (!k) return;
  var st = fs.statSync(path.join(dir, f)).mtimeMs;
  if (!jeKey[k] || jeKey[k].st < st) jeKey[k] = { st: st, p: p, datei: f };
});

var zeilen = [];
Object.keys(jeKey).sort().forEach(function (k) {
  var p = jeKey[k].p;
  (p.ergebnisse || []).forEach(function (e, vi) {
    var u = e.bestaetigung && e.bestaetigung.ueberschuss;
    if (!u || u.tagesmittel == null || !(u.se > 0)) return;
    zeilen.push({
      key: k, v: vi, zr: p.strategie.zeitrahmen, H: p.strategie.haltedauerKerzen,
      datei: jeKey[k].datei, tage: u.tage,
      mittel: u.tagesmittel * 100, se: u.se * 100,
      jeSignal: u.jeSignal != null ? u.jeSignal * 100 : null,
      oben: (u.tagesmittel + Z * u.se) * 100,
      unten: (u.tagesmittel - Z * u.se) * 100,
      urteil: (p.urteile || [])[vi] || '?'
    });
  });
});

if (!zeilen.length) { console.log('Keine auswertbaren Protokolle.'); process.exit(0); }

function f3(x) { return x == null ? '   -  ' : x.toFixed(3); }

console.log('OBERGRENZEN — was jede Messung AUSSCHLIESST (' + zeilen.length + ' Varianten aus ' +
            Object.keys(jeKey).length + ' Protokollen)\n');
console.log('Strategie'.padEnd(24) + 'V ' + 'gemessen'.padStart(9) + 'se'.padStart(8) +
            'jeSignal'.padStart(9) + '   95-%-Band'.padStart(20) + '   schliesst aus ab' + '  Tage'.padStart(8) + '  Urteil');
var sortiert = zeilen.slice().sort(function (a, b) { return a.oben - b.oben; });
sortiert.forEach(function (r) {
  console.log(r.key.slice(0, 23).padEnd(24) + r.v + ' ' +
    r.mittel.toFixed(3).padStart(9) + r.se.toFixed(3).padStart(8) + f3(r.jeSignal).padStart(9) +
    ('[' + r.unten.toFixed(3) + ', ' + r.oben.toFixed(3) + ']').padStart(20) +
    ('  > ' + r.oben.toFixed(3) + ' Pp').padStart(18) + String(r.tage).padStart(8) + '  ' + r.urteil);
});

console.log('\nWAS DAMIT ERLEDIGT IST — je Handelsklasse');
HUERDEN.forEach(function (h) {
  var zu = zeilen.filter(function (r) { return r.oben < h[1]; });
  console.log('\n  ' + h[0] + ' (Huerde ' + h[1].toFixed(4) + ' Pp je Umlauf): ' +
    zu.length + ' von ' + zeilen.length + ' Varianten GESCHLOSSEN');
  if (zu.length) {
    var namen = {};
    zu.forEach(function (r) { namen[r.key] = (namen[r.key] || 0) + 1; });
    console.log('    ' + Object.keys(namen).map(function (n) { return n + ' (' + namen[n] + ')'; }).join(', '));
    console.log('    Selbst der optimistischste mit den Daten vertraegliche Wert traegt die Kosten nicht.');
  }
});

/* Die eigentliche Aussage: was ist NICHT ausgeschlossen? */
var cfd = HUERDEN.filter(function (h) { return /CFD/.test(h[0]); }).pop() || HUERDEN[HUERDEN.length - 1];
console.log('\nWAS OFFEN BLEIBT (gegen ' + cfd[0] + ', ' + cfd[1].toFixed(4) + ' Pp)');
var offen = zeilen.filter(function (r) { return r.oben >= cfd[1]; });
if (!offen.length) {
  console.log('  Nichts. Fuer jede gemessene Variante schliesst das 95-%-Band eine');
  console.log('  CFD-handelbare Kante aus. Der durchsuchte Raum ist leer.');
} else {
  console.log('  ' + offen.length + ' von ' + zeilen.length + ' Varianten lassen eine CFD-handelbare Kante zu.');
  console.log('  Bei ihnen ist "nicht entscheidbar" wirklich Unwissen und nicht Ausschluss:');
  offen.sort(function (a, b) { return b.oben - a.oben; }).forEach(function (r) {
    console.log('    ' + (r.key + ' V' + r.v).padEnd(28) + 'obere Grenze ' + r.oben.toFixed(3).padStart(7) + ' Pp' +
      '   (' + r.zr + ', H=' + r.H + ', ' + r.tage + ' Tage)');
  });
}

/* Zwischenband: Punktschaetzer ueber der unteren, unter der oberen Huerde. */
console.log('\nZWISCHENBAND — Punktschaetzer in [' + BAND[0] + ', ' + BAND[1] + ') Pp je Umlauf');
var band = zeilen.filter(function (r) { return r.mittel >= BAND[0] && r.mittel < BAND[1]; });
if (!band.length) { console.log('  Keine Variante.'); }
else band.sort(function (a, b) { return b.mittel - a.mittel; }).forEach(function (r) {
  console.log('    ' + (r.key + ' V' + r.v).padEnd(28) + 'Punkt ' + r.mittel.toFixed(4) + '  jeSignal ' + f3(r.jeSignal) +
    '  Band [' + r.unten.toFixed(3) + ', ' + r.oben.toFixed(3) + ']' +
    (r.unten > 0 ? '  untere Grenze > 0' : '  null im Band') + '  ' + r.urteil);
});
var knapp = zeilen.filter(function (r) { return r.mittel >= BAND[0] * 0.8 && r.mittel < BAND[0]; });
if (knapp.length) {
  console.log('  Knapp unter der unteren Huerde (ab ' + (BAND[0] * 0.8).toFixed(3) + '):');
  knapp.sort(function (a, b) { return b.mittel - a.mittel; }).forEach(function (r) {
    console.log('    ' + (r.key + ' V' + r.v).padEnd(28) + 'Punkt ' + r.mittel.toFixed(4) + '  jeSignal ' + f3(r.jeSignal) +
      '  Band [' + r.unten.toFixed(3) + ', ' + r.oben.toFixed(3) + ']  ' + r.urteil);
  });
}

console.log('\nHINWEIS ZUR LESART: Eine obere Grenze schliesst eine GROESSE aus, keine These.');
console.log('Sie sagt "hier liegt nichts ueber X", nicht "hier liegt nichts". Und sie gilt nur');
console.log('fuer das gemessene Universum, den gemessenen Zeitraum und die gemessene Haltedauer.');

if (MD) {
  console.log('\n\n<!-- MARKDOWN -->');
  console.log('| Strategie | V | Zeitrahmen/H | Tage | gemessen (Tagesmittel) | je Signal | se | 95-%-Band | obere Grenze | Urteil der Maschine |');
  console.log('|---|---|---|---|---|---|---|---|---|---|');
  sortiert.forEach(function (r) {
    var de = function (x) { return x == null ? '—' : x.toFixed(3).replace('.', ','); };
    console.log('| `' + r.key + '` | ' + r.v + ' | ' + r.zr + ' / ' + r.H + ' | ' + r.tage + ' | ' + de(r.mittel) +
      ' | ' + de(r.jeSignal) + ' | ' + de(r.se) + ' | [' + de(r.unten) + ', ' + de(r.oben) + '] | **' + de(r.oben) + '** | ' + r.urteil + ' |');
  });
}

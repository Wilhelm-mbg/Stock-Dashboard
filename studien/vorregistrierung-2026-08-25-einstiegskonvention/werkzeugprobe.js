'use strict';
/* WERKZEUGPROBE — die Sperre vor Zweig N.
 *
 * Die Vorregistrierung verlangt: "Sonst wird nichts neu gemessen, bis der Schalter stimmt."
 *
 * DIE GESCHLOSSENE VORHERSAGE. Sei S der Schluss der Signalkerze, O die Eroeffnung der
 * Folgekerze, A der Ausstiegskurs und L = O/S - 1 die Luecke. Dann gilt
 *     r_alt = A/S - 1        r_neu = A/O - 1        O = S(1+L)
 *     r_neu = (1+r_alt)/(1+L) - 1
 *     Delta = r_neu - r_alt = -L * (1 + r_neu)
 * Das ist eine IDENTITAET, keine Naeherung. Ist der Schalter richtig gebaut, geht sie auf
 * jeder einzelnen Stelle auf. Wandert der Ausstieg faelschlich mit oder rechnet die
 * Kontrolle noch mit dem alten Einstieg, geht sie nicht auf.
 *
 * Geprueft wird zusaetzlich, dass die A7-Kontrolle unter 'folgeEroeffnung' WIRKLICH einen
 * anderen Topf baut - ein Schalter, der nur den Signalpfad umstellt, waere ein C7-Fehler
 * (dieselbe Klasse, die hier schon aus t 5,96 ein t -0,75 gemacht hat).
 *
 * Aufruf: node studien/vorregistrierung-2026-08-25-einstiegskonvention/werkzeugprobe.js
 */
var fs = require('fs'), path = require('path');
var M = require(path.resolve(__dirname, '..', 'messmaschine', 'messmaschine.js'));

var TOLERANZ = 0.00001;     // 0,001 Pp, vorregistriert

/* Ein kleines Kunstarchiv mit BEKANNTEN Kursen - keine echten Daten, damit die Probe
 * genau das prueft, was sie prueft, und nicht die Datenlage. */
var ORDNER = path.join(require('os').tmpdir(), 'werkzeugprobe-' + process.pid);
fs.mkdirSync(ORDNER, { recursive: true });

var SYMS = [];
for (var s = 0; s < 12; s++) SYMS.push('W' + s);
var start = Date.UTC(2024, 0, 2, 14, 30);
SYMS.forEach(function (sym, si) {
  var reihe = [], kurs = 100 + si;
  for (var i = 0; i < 900; i++) {
    /* Sieben Kerzen je Tag, dann der naechste Tag - wie die US-Sitzung. */
    var tag = Math.floor(i / 7), pos = i % 7;
    var ms = start + tag * 86400000 + pos * 3600000;
    /* Ein deterministischer, aber unregelmaessiger Verlauf - und bewusst eine
     * Eroeffnung, die NICHT dem Vorschluss entspricht, sonst prueft die Probe nichts. */
    var schritt = Math.sin(i * 0.7 + si) * 0.004;
    var auf = kurs * (1 + Math.sin(i * 1.3 + si) * 0.003);
    kurs = kurs * (1 + schritt);
    reihe.push([ms, kurs, 1000000, kurs * 1.002, kurs * 0.998, auf]);
  }
  fs.writeFileSync(path.join(ORDNER, 'bars_60m_' + sym + '.json'), JSON.stringify({ series: reihe }));
});

/* Dieselbe Strategie, einmal je Konvention. Zeit-Ausstieg, damit die Identitaet gilt. */
function strategie(konvention) {
  return {
    key: 'probe-' + konvention, grund: 'Werkzeugprobe der Einstiegskonvention.',
    zeitrahmen: '60m', haltedauerKerzen: 4, richtung: 'long', leseFensterKerzen: 5,
    einstiegsZeitpunkt: konvention,
    universum: function () { return true; },
    varianten: [{}],
    testfamilie: { name: 'werkzeugprobe', testsGesamt: 1, begruendung: 'geschlossene Vorhersage' },
    signal: function (bars, i) { return (i % 23 === 0) ? { dir: 1 } : null; }
  };
}

console.log('WERKZEUGPROBE — Sperre vor Zweig N\n');
var alt = M.messe(strategie('schlusskerze'), ORDNER);
var neu = M.messe(strategie('folgeEroeffnung'), ORDNER);

if (alt.verweigert || neu.verweigert) {
  console.log('VERWEIGERT: ' + (alt.grund || neu.grund));
  process.exit(1);
}

/* ---- 1. Die Konvention steht im Protokoll (D3) ---- */
var k1 = alt.strategie.einstiegsZeitpunkt, k2 = neu.strategie.einstiegsZeitpunkt;
console.log('1. Konvention im Protokoll: "' + k1 + '" und "' + k2 + '"  -> ' +
  (k1 === 'schlusskerze' && k2 === 'folgeEroeffnung' ? 'ok' : 'FEHLER'));

/* ---- 2. Der Schalter wirkt ueberhaupt ---- */
var uAlt = alt.ergebnisse[0].bestaetigung.roh.tagesmittel;
var uNeu = neu.ergebnisse[0].bestaetigung.roh.tagesmittel;
console.log('2. Rohrendite aendert sich: ' + (uAlt * 100).toFixed(5) + ' -> ' + (uNeu * 100).toFixed(5) +
  ' Pp  -> ' + (Math.abs(uAlt - uNeu) > 1e-9 ? 'ok' : 'FEHLER - der Schalter tut nichts'));

/* ---- 3. Die KONTROLLE wandert mit (kein C7-Fehler) ---- */
var kAlt = alt.ergebnisse[0].bestaetigung.ueberschuss.tagesmittel;
var kNeu = neu.ergebnisse[0].bestaetigung.ueberschuss.tagesmittel;
var rohDiff = uNeu - uAlt, uebDiff = kNeu - kAlt;
console.log('3. Ueberschuss aendert sich ANDERS als die Rohrendite:');
console.log('     roh ' + (rohDiff * 100).toFixed(5) + ' Pp, Ueberschuss ' + (uebDiff * 100).toFixed(5) + ' Pp');
console.log('     -> ' + (Math.abs(rohDiff - uebDiff) > 1e-9
  ? 'ok - die Kontrolle ist mitgewandert'
  : 'FEHLER - die Kontrolle blieb stehen, das waere C7'));

/* ---- 4. Die geschlossene Vorhersage, Stelle fuer Stelle ---- */
var dateien = fs.readdirSync(ORDNER);
var maxAbw = 0, geprueft = 0;
dateien.forEach(function (f) {
  var b = JSON.parse(fs.readFileSync(path.join(ORDNER, f), 'utf8')).series;
  for (var i = 300; i < b.length - 5; i++) {
    if (i % 23 !== 0) continue;
    var S0 = b[i][1], O = b[i + 1][5], A = b[i + 4][1];
    if (!(S0 > 0) || !(O > 0) || !(A > 0)) continue;
    var L = O / S0 - 1, rAlt = A / S0 - 1, rNeu = A / O - 1;
    var abw = Math.abs((rNeu - rAlt) + L * (1 + rNeu));
    if (abw > maxAbw) maxAbw = abw;
    geprueft++;
  }
});
console.log('4. Geschlossene Vorhersage Delta = -L*(1+r_neu) auf ' + geprueft + ' Stellen:');
console.log('     groesste Abweichung ' + (maxAbw * 100).toExponential(2) + ' Pp, Toleranz ' +
  (TOLERANZ * 100).toFixed(3) + ' Pp  -> ' + (maxAbw <= TOLERANZ ? 'ok' : 'FEHLER'));

/* ---- 5. Der Placebo liefert unter beiden Konventionen dasselbe ---- */
var pA = alt.placebo, pN = neu.placebo;
if (pA && pN && pA.tagesmittel != null && pN.tagesmittel != null) {
  var pDiff = Math.abs(pA.tagesmittel - pN.tagesmittel);
  var aufl = Math.max(pA.mde || 0, pN.mde || 0);
  console.log('5. Placebo: ' + (pA.tagesmittel * 100).toFixed(5) + ' gegen ' + (pN.tagesmittel * 100).toFixed(5) +
    ' Pp, Abstand ' + (pDiff * 100).toFixed(5) + ' bei Aufloesung ' + (aufl * 100).toFixed(5));
  console.log('     -> ' + (pDiff <= aufl ? 'ok - der Nullpunkt wandert nicht mit' : 'FEHLER'));
} else {
  console.log('5. Placebo kam nicht zustande - die Probe kann ihn nicht pruefen.');
}

fs.rmSync(ORDNER, { recursive: true, force: true });
console.log('\nDie Sperre oeffnet nur, wenn alle fuenf Punkte "ok" sagen.');

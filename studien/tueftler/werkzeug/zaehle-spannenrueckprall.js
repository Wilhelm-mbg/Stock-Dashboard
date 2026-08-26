'use strict';
/* ZAEHLWERKZEUG 4 des Strategie-Tueftlers - Nacht auf den 26.08.2026.
 * KEINE Messung. Eine einzige Frage, rein abzaehlbar:
 *
 * Der Schlussdruck S = (Schluss-Tief)/(Hoch-Tief) teilt den Kurs Schluss(i)
 * mit der Zielgroesse Eroeffnung(i+1)/Schluss(i)-1 - und zwar mit
 * ENTGEGENGESETZTEM Vorzeichen: ein Schluss, der auf dem Geldkurs druckt,
 * senkt S UND hebt die gemessene Uebernachtrendite. Das ist die klassische
 * Spannen-Umkehr (bid-ask bounce). Sie erzeugt einen Scheineffekt in genau
 * der Richtung, die der Kandidat glockendruck-nacht behauptet.
 *
 * Wie akut das ist, haengt daran, wie viele der ausgewaehlten Tage ihren
 * Schluss WIRKLICH am Tagestief drucken. Genau das wird hier gezaehlt.
 * Der Uebernachtstoss O(i) = Eroeffnung(i)/Schluss(i-1)-1 teilt dagegen
 * keinen Kurs mit der Zielgroesse; er dient hier als Vergleichsmassstab.
 *
 * #85: letzte Kerze weg.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');

var ARCHIV = process.env.ARCHIV1D || 'E:/Markt-Dashboard-Archiv/archiv1d';
var STICHPROBE = Number(process.env.STICHPROBE || 400);
var UMSATZ_MIN = 5e6;
var BREITE_MIN = 20;

var ARTEN = (function () {
  try {
    var p = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive', 'wertpapierarten.json');
    var j = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (j && j.arten && Object.keys(j.arten).length > 1000) return j.arten;
  } catch (e) {}
  return null;
})();
function istAktie(sym) {
  if (sym.indexOf('-USD') !== -1) return false;
  if (!ARTEN) return true;
  var a = ARTEN[sym] || ARTEN[sym.replace(/-/g, '.')];
  return a === 'CS' || a === 'ADRC';
}
function med(a) { var b = a.slice().sort(function (x, y) { return x - y; }); return b[Math.floor(b.length / 2)]; }

var dateien = fs.readdirSync(ARCHIV).filter(function (f) { return f.indexOf('bars_1d_') === 0; });
var symbole = dateien.map(function (f) { return f.slice(8, -5); }).filter(istAktie).sort();
var schritt = Math.max(1, Math.floor(symbole.length / STICHPROBE));
var gewaehlt = symbole.filter(function (_, i) { return i % schritt === 0; }).slice(0, STICHPROBE);

var proTag = new Map();
gewaehlt.forEach(function (sym) {
  var j;
  try { j = JSON.parse(fs.readFileSync(path.join(ARCHIV, 'bars_1d_' + sym + '.json'), 'utf8')); }
  catch (e) { return; }
  if (!j || !Array.isArray(j.series) || j.series.length < 80) return;
  var b = j.series.slice(0, -1);                       // #85
  for (var i = 1; i < b.length - 1; i++) {
    var cVor = b[i - 1][1], c = b[i][1], o = b[i][5], hi = b[i][3], lo = b[i][4];
    var oNext = b[i + 1][5];
    if (!(cVor > 0 && c > 0 && o > 0 && oNext > 0)) continue;
    if (!(hi > lo && lo > 0)) continue;
    var umsatz = c * (b[i][2] || 0);
    if (!(umsatz >= UMSATZ_MIN)) continue;
    var rN = (oNext / c - 1) * 100;
    if (!isFinite(rN) || Math.abs(rN) > 25) continue;

    var tag = new Date(b[i][0]).toISOString().slice(0, 10);
    var e = proTag.get(tag);
    if (!e) { e = { s: [], spanne: [], kurs: [] }; proTag.set(tag, e); }
    e.s.push((c - lo) / (hi - lo));
    e.spanne.push((hi - lo) / c * 100);                // Tagesspanne in Pp
    e.kurs.push(c);
  }
});

var tage = Array.from(proTag.keys()).sort().filter(function (t) { return proTag.get(t).s.length >= BREITE_MIN; });

var amTief = [], fastAmTief = [], spanneQuintil = [], spanneKorb = [], sQuintil = [];
tage.forEach(function (t) {
  var e = proTag.get(t), n = e.s.length;
  var idx = e.s.map(function (_, k) { return k; }).sort(function (a, c) { return e.s[a] - e.s[c]; });
  var wahl = idx.slice(0, Math.max(1, Math.floor(n * 0.2)));
  var null0 = 0, unter5 = 0, sp = [], sw = [];
  for (var i = 0; i < wahl.length; i++) {
    var v = e.s[wahl[i]];
    if (v <= 1e-12) null0++;
    if (v < 0.05) unter5++;
    sp.push(e.spanne[wahl[i]]); sw.push(v);
  }
  amTief.push(null0 / wahl.length);
  fastAmTief.push(unter5 / wahl.length);
  spanneQuintil.push(med(sp));
  spanneKorb.push(med(e.spanne));
  sQuintil.push(med(sw));
});

function r3(x) { return Math.round(x * 1000) / 1000; }
var spQ = med(spanneQuintil);

var bericht = {
  hinweis: 'Reine Abzaehlung. Keine Rendite gemittelt, kein Ertrag berechnet.',
  frage: 'Wie oft druckt der Schluss der ausgewaehlten Tage wirklich auf dem Tagestief?',
  archiv: ARCHIV, stichprobe: gewaehlt.length,
  handelstage: tage.length, ersterTag: tage[0], letzterTag: tage[tage.length - 1],
  unterstesSQuintil: {
    anteil_Schluss_exakt_auf_Tagestief: r3(med(amTief)),
    anteil_S_kleiner_005: r3(med(fastAmTief)),
    S_median_der_Auswahl: r3(med(sQuintil)),
    tagesspanne_median_Pp: r3(spQ),
    tagesspanne_median_Korb_Pp: r3(med(spanneKorb)),
  },
  einordnung: {
    halbeSpanne_Aktie_Pp: 0.02,
    kommentar: 'Die halbe notierte Spanne (Kostentabelle Aktie 0,04 Pp je Umlauf) ist die '
      + 'Groessenordnung, um die ein Schluss auf dem Geldkurs die gemessene '
      + 'Uebernachtrendite mechanisch hebt. Zu vergleichen mit MDE 0,0256 Pp und '
      + 'delta80 0,0395 Pp des Kandidaten.',
  },
};
console.log(JSON.stringify(bericht, null, 1));
try {
  fs.mkdirSync(path.join(__dirname, '..', 'daten'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '..', 'daten', 'zaehlung-spannenrueckprall-2026-08-26.json'),
    JSON.stringify(bericht, null, 1));
} catch (e) { console.error('Ablage fehlgeschlagen: ' + e.message); }

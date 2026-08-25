'use strict';
/* ZAEHLWERKZEUG des Strategie-Tueftlers - Machbarkeits-Check, KEINE Messung.
 *
 * Was hier berechnet wird: Anzahlen (Handelstage, Breite je Tag, Symbol-Tage,
 * Umsaetze) und STREUUNGEN (Standardabweichung der Tagesmittel). Beides braucht
 * die MDE-Formel der Protokolle, und beides faellt kein Urteil ueber die Welt.
 *
 * Was hier bewusst NICHT ausgegeben wird: irgendein Mittelwert einer Rendite.
 * Der Tueftler faellt kein Ertragsurteil - das ist Sache der Mess-Kette. Die
 * Tagesmittel entstehen zwar rechnerisch (ohne sie gibt es keine Streuung),
 * werden aber weder gedruckt noch abgelegt.
 *
 * Hausregeln, die hier nachgebaut sind:
 *   #85  - die letzte Kerze eines Abrufs kann eine laufende Quote-Stempel-Kerze
 *          sein. Wird immer verworfen.
 *   F1   - reiheKaputt: unbereinigte Zusammenlegungen erzeugen Spruenge, die
 *          kein Markt macht. Gleiche Grenzen wie die Messmaschine.
 *   Art  - Universum nach Wertpapierart (CS/ADRC), nicht nach Namensliste.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');

var ARCHIV = process.env.ARCHIV1D || 'E:/Markt-Dashboard-Archiv/archiv1d';
var STICHPROBE = Number(process.env.STICHPROBE || 400);
var UMSATZ_MIN = 5e6;          // wie Studie 2: Tagesumsatz > 5 Mio $
var FENSTER = 60;              // Rueckblick fuer die Streuungsmasse
var BREITE_MIN = 20;           // Tage mit weniger Werten zaehlen nicht als Tag

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
function reiheKaputt(bars) {
  var maxKurs = 0;
  for (var i = 0; i < bars.length; i++) {
    var c = bars[i][1];
    if (c > maxKurs) maxKurs = c;
    if (i > 0) {
      var v = bars[i - 1][1];
      if (v > 0 && c > 0) { var r = c / v - 1; if (r > 4 || r < -0.8) return 'Sprung'; }
    }
  }
  return maxKurs > 100000 ? 'Kurs' : null;
}
function sd(a) {
  var n = a.length; if (n < 2) return NaN;
  var m = 0, i; for (i = 0; i < n; i++) m += a[i]; m /= n;
  var s = 0; for (i = 0; i < n; i++) { var d = a[i] - m; s += d * d; }
  return Math.sqrt(s / (n - 1));
}
function med(a) { var b = a.slice().sort(function (x, y) { return x - y; }); return b[Math.floor(b.length / 2)]; }
function haelfte(a) { return a.slice(Math.floor(a.length / 2)); }

var dateien = fs.readdirSync(ARCHIV).filter(function (f) { return f.indexOf('bars_1d_') === 0; });
var symbole = dateien.map(function (f) { return f.slice(8, -5); }).filter(istAktie).sort();
var schritt = Math.max(1, Math.floor(symbole.length / STICHPROBE));
var gewaehlt = symbole.filter(function (_, i) { return i % schritt === 0; }).slice(0, STICHPROBE);

var proTag = new Map();
var verworfen = { kaputt: 0, leer: 0, unlesbar: 0 };
var extremRaus = 0, symbolTage = 0;

gewaehlt.forEach(function (sym, symNr) {
  var j;
  try { j = JSON.parse(fs.readFileSync(path.join(ARCHIV, 'bars_1d_' + sym + '.json'), 'utf8')); }
  catch (e) { verworfen.unlesbar++; return; }
  if (!j || !Array.isArray(j.series) || !j.series.length) { verworfen.leer++; return; }
  var b = j.series.slice(0, -1);                 // #85: laufende Kerze weg
  if (b.length < FENSTER + 10) { verworfen.leer++; return; }
  if (reiheKaputt(b)) { verworfen.kaputt++; return; }

  var luecke = [], innen = [];
  for (var i = 1; i < b.length - 1; i++) {
    var cVor = b[i - 1][1], c = b[i][1], o = b[i][5], oNext = b[i + 1][5], cNext = b[i + 1][1];
    if (!(cVor > 0 && c > 0 && o > 0)) continue;
    luecke.push((o / cVor - 1) * 100);
    innen.push((c / o - 1) * 100);
    if (luecke.length > FENSTER) { luecke.shift(); innen.shift(); }
    if (luecke.length < FENSTER) continue;
    if (!(oNext > 0 && cNext > 0)) continue;
    var umsatz = c * (b[i][2] || 0);
    if (!(umsatz >= UMSATZ_MIN)) continue;
    var rN = (oNext / c - 1) * 100;              // Uebernacht: Schluss[i] -> Eroeffnung[i+1]
    var rV = (cNext / c - 1) * 100;              // voller Tag: Schluss[i] -> Schluss[i+1]
    if (!isFinite(rN) || !isFinite(rV) || Math.abs(rN) > 25 || Math.abs(rV) > 40) { extremRaus++; continue; }
    var gN = sd(luecke), gI = sd(innen);
    if (!(gN > 0 && gI > 0)) continue;
    var tag = new Date(b[i][0]).toISOString().slice(0, 10);
    var e = proTag.get(tag);
    if (!e) { e = { rN: [], rV: [], vN: [], um: [], sy: [] }; proTag.set(tag, e); }
    e.rN.push(rN); e.rV.push(rV); e.vN.push(gN / gI); e.um.push(umsatz); e.sy.push(symNr);
    symbolTage++;
  }
});

var tage = Array.from(proTag.keys()).sort().filter(function (t) { return proTag.get(t).rN.length >= BREITE_MIN; });
var mitteBreit = [], mitteVoll = [], mitteQuintil = [], mitteFest = [];
var breiten = [], quintilBreiten = [], festBreiten = [];
var umsatzBasket = [], umsatzQuintil = [], umsatzFest = [];
var beharrlich = [], vorQuintil = null;

tage.forEach(function (t) {
  var e = proTag.get(t), n = e.rN.length, i, q;
  var sN = 0, sV = 0;
  for (i = 0; i < n; i++) { sN += e.rN[i]; sV += e.rV[i]; }
  mitteBreit.push(sN / n); mitteVoll.push(sV / n); breiten.push(n); umsatzBasket.push(med(e.um));

  /* A) hoechstes V-Quintil, ohne Kostenschutz */
  var idx = e.vN.map(function (_, k) { return k; }).sort(function (a, c) { return e.vN[c] - e.vN[a]; });
  var k1 = Math.max(1, Math.floor(n * 0.2)), sQ = 0, umQ = [], jetzt = new Set();
  for (q = 0; q < k1; q++) { sQ += e.rN[idx[q]]; umQ.push(e.um[idx[q]]); jetzt.add(e.sy[idx[q]]); }
  mitteQuintil.push(sQ / k1); quintilBreiten.push(k1); umsatzQuintil.push(med(umQ));

  /* Beharrlichkeit: Wie oft war ein Wert schon am Vortag im Quintil? Das ist die
   * Ueberlebensfrage dieses Entwurfs. Die A7-Kontrolle zieht von jedem Symbol
   * seinen EIGENEN Langfristmittelwert ab. Waehlt das Signal Nacht fuer Nacht
   * dieselben Werte, ist es faktisch eine feste Symbolneigung - und die ist per
   * Konstruktion null Ueberschuss. Nur der zeitlich WECHSELNDE Teil ist messbar. */
  if (vorQuintil) {
    var bleib = 0;
    jetzt.forEach(function (s) { if (vorQuintil.has(s)) bleib++; });
    beharrlich.push(bleib / jetzt.size);
  }
  vorQuintil = jetzt;

  /* B) kostenfeste Fassung: erst nach Umsatz das obere Drittel, dann darin das
   * hoechste V-Quintil. Nimmt dem Signal die Moeglichkeit, sich in teure Werte
   * hineinzusuchen - genau der Fehler, an dem hier schon Entwuerfe gestorben sind. */
  var nachUmsatz = e.um.map(function (_, k) { return k; }).sort(function (a, c) { return e.um[c] - e.um[a]; });
  var top = nachUmsatz.slice(0, Math.max(1, Math.floor(n / 3)));
  top.sort(function (a, c) { return e.vN[c] - e.vN[a]; });
  var k2 = Math.max(1, Math.floor(top.length * 0.2)), sT = 0, umT = [];
  for (q = 0; q < k2; q++) { sT += e.rN[top[q]]; umT.push(e.um[top[q]]); }
  mitteFest.push(sT / k2); festBreiten.push(k2); umsatzFest.push(med(umT));
});

var bericht = {
  archiv: ARCHIV,
  universum: symbole.length + ' Aktien (CS/ADRC) von ' + dateien.length + ' Reihen' +
             (ARTEN ? '' : ' [KEINE Artenkarte - Filter durchlaessig]'),
  stichprobe: gewaehlt.length,
  verworfen: verworfen, extremRaus: extremRaus, symbolTage: symbolTage,
  handelstageMitBreite: tage.length, ersterTag: tage[0], letzterTag: tage[tage.length - 1],
  bestaetigungAb: tage[Math.floor(tage.length / 2)],
  bestaetigungTage: tage.length - Math.floor(tage.length / 2),
  breiteMedian: { basket: med(breiten), vQuintil: med(quintilBreiten), kostenfest: med(festBreiten) },
  umsatzMedian_MioDollar: {
    basket: Math.round(med(umsatzBasket) / 1e5) / 10,
    vQuintil_ungeschuetzt: Math.round(med(umsatzQuintil) / 1e5) / 10,
    vQuintil_kostenfest: Math.round(med(umsatzFest) / 1e5) / 10,
  },
  streuung_Pp: {
    uebernacht_breit_gesamt: sd(mitteBreit),
    uebernacht_breit_bestaetigung: sd(haelfte(mitteBreit)),
    vollerTag_breit_bestaetigung: sd(haelfte(mitteVoll)),
    uebernacht_vQuintil_bestaetigung: sd(haelfte(mitteQuintil)),
    uebernacht_kostenfest_bestaetigung: sd(haelfte(mitteFest)),
  },
  beharrlichkeit_vQuintil: {
    anteilSchonGesternDrin_median: Math.round(med(beharrlich) * 1000) / 1000,
    anteilSchonGesternDrin_bestaetigung: Math.round(med(haelfte(beharrlich)) * 1000) / 1000,
    hinweis: 'Zufallserwartung bei einem Quintil = 0,20. Naeher an 1,00 heisst: feste ' +
             'Symbolneigung, die A7 per Konstruktion wegkuerzt.',
  },
};
console.log(JSON.stringify(bericht, null, 1));
try {
  fs.mkdirSync(path.join(__dirname, '..', 'daten'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '..', 'daten', 'zaehlung-uebernacht-2026-08-26.json'),
    JSON.stringify(bericht, null, 1));
} catch (e) { console.error('Ablage fehlgeschlagen: ' + e.message); }

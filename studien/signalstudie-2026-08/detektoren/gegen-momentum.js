'use strict';
/* Gegenpruefung Momentum: eigene Praefix-Probe, schneller und mit Schwerpunkt am ENDE der Reihe.
 * Praefix-Universum = alle Symbole auf t <= bars[i].t gekappt. Die Tagesschluesse des Praefixes
 * werden exakt wie MOM.tagesSchluesse(bars.slice(0,n)) gebildet (letzter Bar je NY-Tag), nur
 * ohne das ganze Archiv je Probe neu zu lesen. Stichprobenweise wird gegen MOM.vorbereiten
 * (langsam, Referenz) gegengerechnet. Zufall: mulberry32, ein Generator ausserhalb der Schleife. */
var fs = require('fs');
var MOM = require('./momentum.js');
var DIR = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var SYMS = ['NVDA', 'PLTR', 'INTC'];
var SEED = 4711;
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(SEED);

var uni = {};
fs.readdirSync(DIR).filter(function (f) { return /^bars_60m_/.test(f); }).forEach(function (f) {
  uni[f.slice(9, -5)] = JSON.parse(fs.readFileSync(DIR + f, 'utf8')).series;
});
var alleSyms = Object.keys(uni);
var aktien = alleSyms.filter(function (s) { return !/-USD$/.test(s); });
console.log('Universum 60m: ' + alleSyms.length + ' Dateien, davon Aktien ' + aktien.length);
var vbVoll = MOM.vorbereiten(uni);
console.log('Achse: ' + vbVoll.zeiten.length + ' Tage ' + vbVoll.zeiten[0] + ' .. ' + vbVoll.zeiten[vbVoll.zeiten.length - 1]);

/* Vorberechnung je Symbol: Bars-Zeiten, NY-Tag je Bar */
var tagJeBar = {};
aktien.forEach(function (s) { tagJeBar[s] = uni[s].map(function (b) { return MOM.nyTag(b[0]); }); });

/** Praefix-Universum schnell: Tagesschluesse aus Bars mit t <= tMax. */
function vbPraefixSchnell(tMax) {
  var schluss = {}, zaehler = {};
  aktien.forEach(function (s) {
    var b = uni[s], tg = tagJeBar[s], o = {};
    for (var k = 0; k < b.length && b[k][0] <= tMax; k++) o[tg[k]] = b[k][1];
    schluss[s] = o;
    Object.keys(o).forEach(function (tag) { zaehler[tag] = (zaehler[tag] || 0) + 1; });
  });
  var zeiten = Object.keys(zaehler).filter(function (t) { return zaehler[t] >= 30; }).sort();
  var idx = {}; zeiten.forEach(function (t, i) { idx[t] = i; });
  var map = {};
  aktien.forEach(function (s) {
    var a = new Array(zeiten.length).fill(null);
    Object.keys(schluss[s]).forEach(function (tag) { var i = idx[tag]; if (i !== undefined) a[i] = schluss[s][tag]; });
    map[s] = a;
  });
  return { syms: aktien, zeiten: zeiten, idx: idx, map: map };
}
function kappe(tMax) {
  var u = {};
  alleSyms.forEach(function (s) { var b = uni[s], n = 0; while (n < b.length && b[n][0] <= tMax) n++; u[s] = b.slice(0, n); });
  return u;
}
function gleich(a, b) { return (a == null && b == null) || (a != null && b != null && a.dir === b.dir && a.rang === b.rang && a.n === b.n && a.staerke === b.staerke); }

var geprueft = 0, abw = 0, nichtNull = 0, endeGeprueft = 0, endeNichtNull = 0, refGeprueft = 0, refAbw = 0, beispiele = [];
var verteilung = { '+1': 0, '-1': 0 };
SYMS.forEach(function (sym) {
  var bars = uni[sym], tg = tagJeBar[sym];
  var erste = [];
  for (var i = 1; i < bars.length; i++) if (tg[i] !== tg[i - 1]) erste.push(i);
  var kand = [];
  // 150 zufaellige Tagesanfaenge ueber die GANZE Reihe (auch < 252 Tage: muss beidseitig null sein)
  for (var k = 0; k < 150; k++) kand.push(erste[Math.floor(rnd() * erste.length)]);
  // die letzten 25 Tagesanfaenge komplett (Ende der Reihe)
  erste.slice(-25).forEach(function (i) { kand.push(i); });
  // letzter Bar und 10 zufaellige beliebige Bars
  kand.push(bars.length - 1);
  for (var k2 = 0; k2 < 10; k2++) kand.push(1 + Math.floor(rnd() * (bars.length - 1)));
  var endeAb = erste[erste.length - 25];
  kand.forEach(function (i, nr) {
    var voll = MOM.momentumSignal(bars, i, { sym: sym, vb: vbVoll });
    var vbP = vbPraefixSchnell(bars[i][0]);
    var prae = MOM.momentumSignal(bars.slice(0, i + 1), i, { sym: sym, vb: vbP });
    geprueft++;
    if (voll) { nichtNull++; verteilung[voll.dir > 0 ? '+1' : '-1']++; }
    if (i >= endeAb) { endeGeprueft++; if (voll) endeNichtNull++; }
    if (!gleich(voll, prae)) { abw++; if (beispiele.length < 10) beispiele.push({ sym: sym, i: i, tag: tg[i], voll: voll, prae: prae }); }
    // Referenz: jede 40. Probe zusaetzlich mit MOM.vorbereiten auf gekapptem Universum (langsam)
    if (nr % 40 === 0) {
      var vbR = MOM.vorbereiten(kappe(bars[i][0]));
      var ref = MOM.momentumSignal(bars.slice(0, i + 1), i, { sym: sym, vb: vbR });
      refGeprueft++;
      if (!gleich(ref, prae)) { refAbw++; beispiele.push({ referenzAbweichung: true, sym: sym, i: i, ref: ref, prae: prae }); }
    }
  });
  console.log(sym + ': ' + kand.length + ' Indizes, Bars ' + bars.length + ', Tage ' + erste.length + ', letzter Bar ' + new Date(bars[bars.length - 1][0]).toISOString());
});
console.log('Geprueft: ' + geprueft + '  Signal!=null: ' + nichtNull + ' (' + JSON.stringify(verteilung) + ')  Abweichungen: ' + abw +
  '  Trefferquote: ' + ((geprueft - abw) / geprueft * 100).toFixed(2) + ' %');
console.log('Davon am Ende der Reihe (letzte 25 Tage je Symbol): ' + endeGeprueft + ' geprueft, ' + endeNichtNull + ' mit Signal');
console.log('Referenz schnell vs. MOM.vorbereiten: ' + refGeprueft + ' geprueft, ' + refAbw + ' Abweichungen');
if (beispiele.length) console.log('Beispiele:', JSON.stringify(beispiele, null, 1));
console.log('Urteil: ' + (abw === 0 && refAbw === 0 ? 'walk-forward' : 'ZUKUNFTSBLICK'));

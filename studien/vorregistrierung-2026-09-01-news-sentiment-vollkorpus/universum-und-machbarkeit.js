'use strict';
/* UNIVERSUM (Regel vorab) UND MACHBARKEIT - beides VOR der Vorregistrierung.
 *
 * WAS HIER ANGESEHEN WIRD UND WAS NICHT: Fuer die MDE braucht es die STREUUNG der
 * Uebernachtertraege - ein Rauschmass. Kein Zusammenhang zu irgendeinem Score wird
 * gebildet. Der Umsatz ist eine Begleitgroesse, keine Zielgroesse.
 *
 * DIE AUSWAHLREGEL, vollstaendig vor dem ersten Blick festgeschrieben:
 *   (1) Symbol liegt in archiv1d.
 *   (2) WP.istAktie(sym) - Stammaktie. ETF, Fonds, ADR, gehebelte/inverse Produkte
 *       raus; fuer sie meint "Sentiment" etwas anderes.
 *   (3) Existierte am Fensterstart: Kerze am oder vor 2017-04-10.
 *   (4) PUNKT-IN-ZEIT-LIQUIDITAET: Median-Dollarumsatz der 250 Handelstage VOR dem
 *       Fensterstart >= 0,5 Mrd $. Gemessen am ANFANG des Fensters, nie am Ende -
 *       sonst waere die Auswahl selbst Rueckschau ("wer heute gross ist").
 *   (5) Die 30 groessten nach ebendieser Vorfenster-Liquiditaet.
 *   (6) Bei Mehrfachgattungen derselben Firma nur die liquidere Linie (GOOGL vor
 *       GOOG). Zwei Gattungen sind EIN Unternehmen und eine Nachricht - sie als
 *       zwei Beobachtungen zu zaehlen, taeuscht Unabhaengigkeit vor.
 *
 * OFFENGELEGTE ITERATION: Die Schwelle stand zuerst bei 1 Mrd $ und lieferte NUR ACHT
 * Symbole (2017 war der Dollarumsatz kleiner als heute) - unbrauchbar. Sie wurde auf
 * 0,5 Mrd gesenkt, BEVOR irgendein Ertrag gegen einen Score gehalten wurde; die Wahl
 * haengt an der Symbolzahl und an der Kostenbelegbarkeit, nicht am Ergebnis. Folge fuer
 * die Kosten: Rang 30 liegt bei ~0,57 Mrd $, die gemessene Runde stammt aus der
 * >=1,6-Mrd-Klasse (wiki/kosten.md) - 0,10 %% ist hier also OPTIMISTISCH. Deshalb steht
 * die NEIN-Seite auf der CFD-Huerde, nicht auf der Aktienhuerde.
 *
 * WARUM UEBERHAUPT EINE LIQUIDITAETSSCHWELLE: wiki/kosten.md - "0,10 % ist fuer die
 * Milliarden-Klasse passend und fuer unsere Kandidaten-Universen optimistisch". Die
 * Schwelle bindet das Universum so nah wie moeglich an die einzige Kostenzahl, die wir
 * belegen koennen. Sie erreicht sie nicht ganz - siehe Iteration oben.
 */
var fs = require('fs');
var path = require('path');
var Q = require('../../quant.js');
var WP = require('../messmaschine/strategien/wertpapierart.js');

var ARCHIV = 'E:/Markt-Dashboard-Archiv/archiv1d';
var START = '2017-04-10';      // News-Wand, GRATIS-PRUEFUNG.md
var N_UNIVERSUM = 30;
var LIQ_SCHWELLE = 5e8;
var VORFENSTER = 250;

if (!WP.klassifizierungDa()) { console.error('ABBRUCH: wertpapierarten.json fehlt - Universum waere ungefiltert.'); process.exit(2); }

function tagVon(ms) { return new Date(ms - (Q.usSommerzeit(new Date(ms)) ? 4 : 5) * 3600000).toISOString().slice(0, 10); }
function mittel(a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; }
function sd(a) { var m = mittel(a); return Math.sqrt(a.reduce(function (x, y) { return x + (y - m) * (y - m); }, 0) / Math.max(1, a.length - 1)); }
function median(a) { var b = a.slice().sort(function (x, y) { return x - y; }); return b[Math.floor(b.length / 2)]; }

var dateien = fs.readdirSync(ARCHIV).filter(function (f) { return /^bars_1d_/.test(f); });
console.log('archiv1d: ' + dateien.length + ' Reihen');

var kandidaten = [];
var raus = { keineAktie: 0, zuJung: 0, zuKlein: 0, kaputt: 0 };
dateien.forEach(function (f) {
  var sym = f.replace(/bars_1d_|\.json/g, '');
  if (!WP.istAktie(sym)) { raus.keineAktie++; return; }
  var ser;
  try { ser = JSON.parse(fs.readFileSync(path.join(ARCHIV, f), 'utf8')).series; } catch (e) { raus.kaputt++; return; }
  if (!ser || ser.length < VORFENSTER + 50) { raus.kaputt++; return; }
  /* Index des Fensterstarts */
  var i0 = -1;
  for (var i = 0; i < ser.length; i++) { if (tagVon(ser[i][0]) >= START) { i0 = i; break; } }
  if (i0 < VORFENSTER) { raus.zuJung++; return; }        // existierte nicht lange genug VOR dem Start
  /* Dollarumsatz der 250 Tage VOR dem Start - Punkt in Zeit, keine Rueckschau */
  var ums = [];
  for (var k = i0 - VORFENSTER; k < i0; k++) {
    var b = ser[k];
    if (b[1] > 0 && b[2] > 0) ums.push(b[1] * b[2]);
  }
  if (ums.length < VORFENSTER * 0.8) { raus.kaputt++; return; }
  var liq = median(ums);
  if (liq < LIQ_SCHWELLE) { raus.zuKlein++; return; }
  kandidaten.push({ sym: sym, liq: liq, i0: i0, n: ser.length });
});
kandidaten.sort(function (a, b) { return b.liq - a.liq; });
console.log('  keine Stammaktie: ' + raus.keineAktie + ' | zu jung/kurz: ' + raus.zuJung +
            ' | unter Schwelle: ' + raus.zuKlein + ' | unbrauchbar: ' + raus.kaputt);
/* Regel (6): Mehrfachgattungen derselben Firma - nur die liquidere Linie. Die Liste ist
 * kurz und wird ausdrucklich benannt, damit sie pruefbar ist statt heuristisch. */
var GATTUNGSPAARE = [['GOOGL', 'GOOG'], ['BRK.B', 'BRK.A'], ['FOXA', 'FOX'], ['NWSA', 'NWS'],
                     ['UAA', 'UA'], ['DISCA', 'DISCK'], ['LEN', 'LEN.B'], ['HEI', 'HEI.A']];
var streichen = {};
GATTUNGSPAARE.forEach(function (p) {
  var a = kandidaten.find(function (x) { return x.sym === p[0]; });
  var b = kandidaten.find(function (x) { return x.sym === p[1]; });
  if (a && b) { streichen[(a.liq >= b.liq ? b : a).sym] = 1; }
});
if (Object.keys(streichen).length) console.log('  Zweitgattung gestrichen: ' + Object.keys(streichen).join(', '));
kandidaten = kandidaten.filter(function (x) { return !streichen[x.sym]; });
console.log('  Regel bestanden: ' + kandidaten.length + ' -> die groessten ' + N_UNIVERSUM + ' werden genommen');
var uni = kandidaten.slice(0, N_UNIVERSUM);
console.log('\nUNIVERSUM (Vorfenster-Median-Dollarumsatz, Mrd $):');
uni.forEach(function (u, i) {
  process.stdout.write((i + 1 + '. ' + u.sym + ' ' + (u.liq / 1e9).toFixed(2) + '   ').padEnd(22));
  if ((i + 1) % 4 === 0) process.stdout.write('\n');
});
console.log('\n  kleinster im Universum: ' + (uni[uni.length - 1].liq / 1e9).toFixed(2) + ' Mrd $');

/* ---- Handelstage im Fenster ---- */
var ser0 = JSON.parse(fs.readFileSync(path.join(ARCHIV, 'bars_1d_' + uni[0].sym + '.json'), 'utf8')).series;
var tage = [];
for (var t = 0; t < ser0.length - 1; t++) { var d = tagVon(ser0[t][0]); if (d >= START) tage.push(d); }
console.log('\nHandelstage ' + START + ' .. ' + tage[tage.length - 1] + ': ' + tage.length);

/* ---- RAUSCHMASS: Streuung der tagesbereinigten Uebernachtertraege ---- */
var unJe = {};
uni.forEach(function (u) {
  var ser = JSON.parse(fs.readFileSync(path.join(ARCHIV, 'bars_1d_' + u.sym + '.json'), 'utf8')).series;
  var m = {};
  for (var i = 1; i < ser.length; i++) {
    if (!(ser[i - 1][1] > 0) || !(ser[i][5] > 0)) continue;
    var tg = tagVon(ser[i - 1][0]);
    if (tg >= START) m[tg] = (ser[i][5] / ser[i - 1][1] - 1) * 100;
  }
  unJe[u.sym] = m;
});
var rest = [], jeTagN = [];
tage.forEach(function (tg) {
  var g = uni.map(function (u) { return unJe[u.sym][tg]; }).filter(function (x) { return x !== undefined && isFinite(x); });
  if (g.length < 5) return;
  jeTagN.push(g.length);
  var m = mittel(g);
  g.forEach(function (x) { rest.push(x - m); });
});
var sdRest = sd(rest);
console.log('Uebernachtertraege im Fenster: ' + rest.length + ' Symbol-Tage auf ' + jeTagN.length + ' Tagen');
console.log('  sd TAGESBEREINIGT: ' + sdRest.toFixed(3) + ' Pp   (Anker wiki: archivweit 0,880; dieses Universum ist volatiler)');

/* ---- MACHBARKEIT nach wiki/aufloesungswand.md ---- */
var K = 1.959964 + 0.8416212;                     // 2,8016
var SX = 0.300;                                   // Score-Streuung, gemessen 31.08. (Planwert)
var DICHTE = 0.562;                               // GRATIS-PRUEFUNG.md, Grosswerte
var nErwartet = Math.round(jeTagN.length * N_UNIVERSUM * DICHTE);
console.log('\n== MACHBARKEIT ==');
console.log('erwartete Beobachtungen: ' + jeTagN.length + ' Tage x ' + N_UNIVERSUM + ' x Dichte ' +
            (100 * DICHTE).toFixed(1) + ' % = ' + nErwartet);
function mde(n, nc) {
  return { roh: K * sdRest / (SX * Math.sqrt(n)), geclustert: K * sdRest / (SX * Math.sqrt(nc)) };
}
var m = mde(nErwartet, jeTagN.length);
console.log('MDE der Steigung b (Pp je Score-Punkt):');
console.log('  ungeclustert (n=' + nErwartet + '):        ' + m.roh.toFixed(4));
console.log('  je Tag geclustert (n=' + jeTagN.length + ' Cluster): ' + m.geclustert.toFixed(4));
console.log('\nUmgerechnet auf einen Ertrag je 1-sd-Score-Sprung (x ' + SX + '):');
console.log('  ungeclustert:      ' + (m.roh * SX).toFixed(4) + ' Pp');
console.log('  geclustert:        ' + (m.geclustert * SX).toFixed(4) + ' Pp');
console.log('\nKostenhuerden (wiki/kosten.md), H=1 Nacht:');
var HUERDEN = [['Kassa-Aktie', 0.06], ['CFD gehebelt (K 0,10 + F 0,0247)', 0.1247]];
HUERDEN.forEach(function (h) {
  console.log('  ' + (h[0] + '                                   ').slice(0, 34) + h[1].toFixed(4) + ' Pp' +
    '  -> b muesste >= ' + (h[1] / SX).toFixed(3) + ' Pp/Punkt sein' +
    '  | ungeclustert ' + (m.roh <= h[1] / SX ? 'AUFLOESBAR' : 'blind') +
    ' | geclustert ' + (m.geclustert <= h[1] / SX ? 'AUFLOESBAR' : 'blind'));
});
console.log('\nWand-Formel N(d) = N_vorhanden * (delta80/d)^2 - noetige Tage je Huerde (geclustert):');
HUERDEN.forEach(function (h) {
  var d = h[1] / SX;
  console.log('  ' + (h[0] + '                                   ').slice(0, 34) +
    Math.round(jeTagN.length * Math.pow(m.geclustert / d, 2)) + ' Tage noetig, ' + jeTagN.length + ' vorhanden');
});
fs.writeFileSync(path.join(__dirname, 'universum.json'), JSON.stringify({
  regel: { start: START, liqSchwelle: LIQ_SCHWELLE, vorfenster: VORFENSTER, n: N_UNIVERSUM },
  universum: uni.map(function (u) { return { sym: u.sym, liqMrd: u.liq / 1e9 }; }),
  tage: jeTagN.length, ersterTag: tage[0], letzterTag: tage[tage.length - 1],
  sdTagesbereinigt: sdRest, symbolTageKurs: rest.length,
  machbarkeit: { nErwartet: nErwartet, mdeRoh: m.roh, mdeGeclustert: m.geclustert, sx: SX, dichte: DICHTE }
}, null, 1));
console.log('\nuniversum.json geschrieben.');

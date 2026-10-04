'use strict';
/* Messung Sektor-Momentum: Empfindlichkeit gegen die fehlerhaften Yahoo-Eroeffnungskurse (nachrichtlich, OHNE Urteil, aendert keine Zahl der Messung).
 * Die Datenpruefung (DATENPRUEFUNG.md Abschnitt 9, datenpruefung.json zweiteKursquelle.je.*.yahooOpenAusserhalbMinutenSpanne) fand Tage, an denen
 * Yahoos `open` ausserhalb dessen liegt, was laut Alpaca-Minuten (SIP, roh, auf Yahoo-Einheiten umgerechnet) an dem Tag gehandelt wurde.
 * ZUSATZ §1.7 handelt zum gelieferten `open`; dabei bleibt die Messung. Hier wird nur gezeigt, wie weit das Urteil davon abhaengt:
 * dieselbe Messung von A und B (k = 0 und 63 Startphasen, Kandidat und Placebo) mit der Minuten-Eroeffnung 09:30 an genau diesen Reihen-Tagen.
 *   node studien/sektor-momentum-messung-2026-10/empfindlichkeit-eroeffnung.js      (schreibt empfindlichkeit-eroeffnung.json) */
var fs = require('fs');
var path = require('path');
var S = require('./sektor.js');

var PS = JSON.parse(fs.readFileSync(path.join(__dirname, 'pruefsummen.json'), 'utf8'));
var DP = JSON.parse(fs.readFileSync(path.join(__dirname, 'datenpruefung.json'), 'utf8'));
var E = JSON.parse(fs.readFileSync(path.join(__dirname, 'ergebnis.json'), 'utf8'));
var LR = S.ladeRohdateien(S.DATEN_ORDNER, PS);

function messe(ersatz) {
  var D = S.baueDaten(LR.gelesen), F = S.klinken(D).fenster, geaendert = [];
  ersatz.forEach(function (x) {
    var r = D.reihen[x.sym], k = D.idx[x.tag], z = k == null ? -1 : r.zeileAm[k];
    if (z < 0) throw new Error('KLINKE: ' + x.sym + ' ' + x.tag + ' ohne Zeile');
    if (Math.abs(r.open[z] - x.yahooOpen) > 1e-9) throw new Error('KLINKE: Yahoo-open ' + x.sym + ' ' + x.tag + ' ist ' + r.open[z] + ', erwartet ' + x.yahooOpen);
    r.open[z] = x.minutenOpen; geaendert.push(x.sym + ' ' + x.tag);
  });
  return { M: S.messung(D, { A: F.A, B: F.B }), geaendert: geaendert, F: F };
}
/* Treffer: an welchen Ausfuehrungstagen (k = 0) wurde ein betroffener Fonds zum betroffenen Kurs gehandelt? */
function treffer(M, liste) {
  var aus = [];
  ['A', 'B'].forEach(function (f) {
    ['kandidat', 'placebo'].forEach(function (m) {
      M[f][m].umschichtungen.forEach(function (u) {
        liste.forEach(function (x) {
          if (x.tag !== u.ausfuehrungstag) return;
          var gehandelt = [].concat(u.verkauft, u.teilverkauft, u.aufgestockt, u.gekauft).indexOf(x.sym) >= 0;
          aus.push({ fenster: f, modus: m, tag: x.tag, sym: x.sym, gehandelt: gehandelt });
        });
      });
    });
  });
  return aus;
}

var liste = [];
Object.keys(DP.zweiteKursquelle.je).forEach(function (sym) {
  (DP.zweiteKursquelle.je[sym].yahooOpenAusserhalbMinutenSpanne || []).forEach(function (x) {
    if (x.fenster === 'A' || x.fenster === 'B') liste.push({ sym: sym, tag: x.tag, fenster: x.fenster, yahooOpen: x.yahooOpen, minutenOpen: x.minutenOpen, abstandZurSpannePct: x.abstandZurSpannePct });
  });
});
var basis = messe([]), neu = messe(liste);
/* Klinke: der Basislauf hier ist der eine Lauf (gleiche Endwerte wie ergebnis.json) */
['A', 'B'].forEach(function (f) { ['kandidat', 'placebo'].forEach(function (m) {
  if (basis.M[f][m].haupt.buchEnde !== E.fenster[f][m].haupt.buchEnde || basis.M[f][m].startphasen.median !== E.fenster[f][m].startphasen.median) throw new Error('KLINKE: Basislauf trifft ergebnis.json nicht (' + f + ' ' + m + ')');
}); });

function kurz(M) {
  var o = { urteil: M.urteil.text };
  ['A', 'B'].forEach(function (f) {
    o[f] = {};
    ['kandidat', 'placebo'].forEach(function (m) {
      var X = M[f][m];
      o[f][m] = { buchEnde: X.haupt.buchEnde, spyEnde: X.haupt.spyEnde, abstandPaK0: X.haupt.abstandPa, phasenVorn: X.startphasen.vorn, median: X.startphasen.median,
        minimum: X.startphasen.minimum, maximum: X.startphasen.maximum };
    });
    o[f].kandidatGegenPlacebo = { k0Vorn: M[f].kandidatGegenPlacebo.k0Vorn, vorn: M[f].kandidatGegenPlacebo.vorn, median: M[f].kandidatGegenPlacebo.median };
  });
  return o;
}
var aus = { kennung: S.KENNUNG + '/empfindlichkeit-eroeffnung', erzeugt: new Date().toISOString(), hinweis: 'nachrichtlich, ohne Urteil; die Messung handelt zum gelieferten Yahoo-open (ZUSATZ §1.7)',
  ersetzt: liste, trefferK0: treffer(basis.M, liste), mitYahooOpen: kurz(basis.M), mitMinutenOpen: kurz(neu.M) };
aus.unterschied = {};
['A', 'B'].forEach(function (f) { aus.unterschied[f] = {}; ['kandidat', 'placebo'].forEach(function (m) {
  var a = aus.mitYahooOpen[f][m], b = aus.mitMinutenOpen[f][m];
  aus.unterschied[f][m] = { buchEndeDollar: b.buchEnde - a.buchEnde, spyEndeDollar: b.spyEnde - a.spyEnde, abstandPaK0Pp: b.abstandPaK0 - a.abstandPaK0, phasenVorn: b.phasenVorn - a.phasenVorn,
    medianPp: b.median - a.median, minimumPp: b.minimum - a.minimum, maximumPp: b.maximum - a.maximum };
}); });
fs.writeFileSync(path.join(__dirname, 'empfindlichkeit-eroeffnung.json'), JSON.stringify(aus, null, 1) + '\n');
console.log('ersetzt ' + liste.length + ' Reihen-Tage; Treffer an Ausfuehrungstagen k = 0: ' + aus.trefferK0.length + ' (gehandelt ' + aus.trefferK0.filter(function (t) { return t.gehandelt; }).length + ')');
console.log('Urteil mit Yahoo-open: ' + aus.mitYahooOpen.urteil);
console.log('Urteil mit Minuten-open: ' + aus.mitMinutenOpen.urteil);
console.log(JSON.stringify(aus.unterschied));

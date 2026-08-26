'use strict';
/* ZAEHLWERKZEUG 3 des Strategie-Tueftlers - Nacht auf den 26.08.2026, zweiter Lauf.
 * KEINE Messung: es werden nur Anzahlen, Streuungen, Beharrlichkeiten und
 * Ueberschneidungen gedruckt. Kein Ertragsmittelwert verlaesst diese Datei.
 *
 * Frage dieses Laufs: Gibt es im Uebernacht-Fenster eine Bedingung, die
 *   (a) AUSSCHLIESSLICH aus Kursen gebildet ist, die vor der Schlussauktion
 *       feststehen  -> kein C8-Vorgriff, anders als beim Schlussdruck S,
 *   (b) mit der Uebernachtrendite KEINEN Kurs teilt -> keine mechanische
 *       Spannen-Umkehr (S teilt Schluss(i) mit der Zielgroesse),
 *   (c) zeitlich wechselt statt zu beharren (A7),
 *   (d) sich mit der Auswahl des Schlussdrucks kaum ueberschneidet
 *       -> zweiter unabhaengiger Schuss, nicht dieselbe Sache zweimal.
 *
 * Kandidatenfamilie: der Uebernachtstoss selbst.
 *   O(i) = Eroeffnung(i)/Schluss(i-1) - 1, bekannt um 09:31 des Tages i.
 *   Zielgroesse ist Eroeffnung(i+1)/Schluss(i) - 1: gemeinsame Kurse KEINE.
 *
 * #85: letzte Kerze weg. F1: reiheKaputt wie in der Messmaschine.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');

var ARCHIV = process.env.ARCHIV1D || 'E:/Markt-Dashboard-Archiv/archiv1d';
var STICHPROBE = Number(process.env.STICHPROBE || 400);
var UMSATZ_MIN = 5e6;
var FENSTER = 60;
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

/* ---------- Kandidaten ----------
 * Ausgewaehlt wird immer das UNTERSTE Quintil der Kennzahl.
 * Wer oben stehen soll, liefert das Negative.
 * Referenz B ist der bereits vorregistrierte Schlussdruck - nur als Massstab
 * fuer Ueberschneidung und Streuung, nicht als neuer Kandidat.               */
var KANDIDATEN = [
  { key: 'B_schlussdruck_referenz', was: 'REFERENZ (schon vorregistriert): S = (Schluss-Tief)/(Hoch-Tief), unterstes Quintil. Teilt Schluss(i) mit der Zielgroesse, C8-Vorgriff.' },
  { key: 'F_nachtstoss_runter', was: 'z1 = O(i)/sd60(O), unterstes Quintil: der Wert ist heute frueh am staerksten heruntergerissen worden.' },
  { key: 'G_nachtstoss_hoch', was: 'z1 oberstes Quintil (Spiegelbild von F, fuer die Richtungsfrage).' },
  { key: 'H_nachtstoss_drei', was: 'z3 = Summe der letzten 3 Uebernachtstoesse / (sd60(O)*sqrt(3)), unterstes Quintil.' },
  { key: 'I_stoss_roh', was: 'GEGENPROBE: O(i) ohne Normierung, unterstes Quintil - waehlt die schwankungsfreudigen Symbole aus.' },
];

var dateien = fs.readdirSync(ARCHIV).filter(function (f) { return f.indexOf('bars_1d_') === 0; });
var symbole = dateien.map(function (f) { return f.slice(8, -5); }).filter(istAktie).sort();
var schritt = Math.max(1, Math.floor(symbole.length / STICHPROBE));
var gewaehlt = symbole.filter(function (_, i) { return i % schritt === 0; }).slice(0, STICHPROBE);

var proTag = new Map();
var verworfen = 0, extremRaus = 0, symbolTage = 0;

gewaehlt.forEach(function (sym, symNr) {
  var j;
  try { j = JSON.parse(fs.readFileSync(path.join(ARCHIV, 'bars_1d_' + sym + '.json'), 'utf8')); }
  catch (e) { verworfen++; return; }
  if (!j || !Array.isArray(j.series) || j.series.length < FENSTER + 12) { verworfen++; return; }
  var b = j.series.slice(0, -1);                       // #85
  if (reiheKaputt(b)) { verworfen++; return; }

  var luecke = [];                                     // O(t) in Pp, Fenster 60
  for (var i = 1; i < b.length - 1; i++) {
    var cVor = b[i - 1][1], c = b[i][1], o = b[i][5], hi = b[i][3], lo = b[i][4];
    var oNext = b[i + 1][5];
    if (!(cVor > 0 && c > 0 && o > 0)) continue;
    var umsatz = c * (b[i][2] || 0);
    var stoss = (o / cVor - 1) * 100;
    luecke.push(stoss);
    if (luecke.length > FENSTER) luecke.shift();
    if (luecke.length < FENSTER) continue;
    if (!(oNext > 0) || !(umsatz >= UMSATZ_MIN)) continue;
    if (!(hi > lo && lo > 0)) continue;

    var rN = (oNext / c - 1) * 100;
    if (!isFinite(rN) || Math.abs(rN) > 25) { extremRaus++; continue; }

    /* sd60 OHNE den heutigen Stoss - sonst normiert sich der Ausreisser selbst weg. */
    var fensterOhneHeute = luecke.slice(0, FENSTER - 1);
    var gN = sd(fensterOhneHeute);
    if (!(gN > 0)) continue;
    var z1 = stoss / gN;
    var drei = luecke[FENSTER - 1] + luecke[FENSTER - 2] + luecke[FENSTER - 3];
    var z3 = drei / (gN * Math.sqrt(3));

    var kenn = {
      B_schlussdruck_referenz: (c - lo) / (hi - lo),
      F_nachtstoss_runter: z1,
      G_nachtstoss_hoch: -z1,
      H_nachtstoss_drei: z3,
      I_stoss_roh: stoss,
    };
    var tag = new Date(b[i][0]).toISOString().slice(0, 10);
    var e = proTag.get(tag);
    if (!e) { e = { rN: [], um: [], sy: [], k: {} }; KANDIDATEN.forEach(function (x) { e.k[x.key] = []; }); proTag.set(tag, e); }
    e.rN.push(rN); e.um.push(umsatz); e.sy.push(symNr);
    KANDIDATEN.forEach(function (x) { e.k[x.key].push(kenn[x.key]); });
    symbolTage++;
  }
});

var tage = Array.from(proTag.keys()).sort().filter(function (t) { return proTag.get(t).rN.length >= BREITE_MIN; });

function wahlDesTages(e, key) {
  var arr = e.k[key], n = arr.length;
  var idx = arr.map(function (_, k) { return k; }).sort(function (a, c) { return arr[a] - arr[c]; });
  return idx.slice(0, Math.max(1, Math.floor(n * 0.2)));
}

function auswerten(key) {
  var mitten = [], breiten = [], umsaetze = [], umsaetzeKorb = [], beharr = [], anteile = [], ueber = [];
  var vor = null;
  tage.forEach(function (t) {
    var e = proTag.get(t), n = e.rN.length, i;
    var wahl = wahlDesTages(e, key);
    if (!wahl.length) return;
    var s = 0, um = [], jetzt = new Set();
    for (i = 0; i < wahl.length; i++) { s += e.rN[wahl[i]]; um.push(e.um[wahl[i]]); jetzt.add(e.sy[wahl[i]]); }
    mitten.push(s / wahl.length);            // bleibt in dieser Funktion, wird nie gedruckt
    breiten.push(wahl.length); umsaetze.push(med(um)); umsaetzeKorb.push(med(e.um));
    anteile.push(wahl.length / n);
    if (key !== 'B_schlussdruck_referenz') {
      var refWahl = new Set(wahlDesTages(e, 'B_schlussdruck_referenz'));
      var doppelt = 0;
      for (i = 0; i < wahl.length; i++) if (refWahl.has(wahl[i])) doppelt++;
      ueber.push(doppelt / wahl.length);
    }
    if (vor) {
      var bleib = 0;
      jetzt.forEach(function (x) { if (vor.has(x)) bleib++; });
      beharr.push(bleib / jetzt.size);
    }
    vor = jetzt;
  });
  var N = mitten.length - Math.floor(mitten.length / 2);
  var streu = sd(haelfte(mitten));
  var se = streu / Math.sqrt(N);
  var r = {
    signalanteil: Math.round(med(anteile) * 1000) / 10 + ' %',
    breiteMedian: med(breiten),
    umsatzMedian_MioDollar: Math.round(med(umsaetze) / 1e5) / 10,
    umsatzMedianKorb_MioDollar: Math.round(med(umsaetzeKorb) / 1e5) / 10,
    beharrlichkeit: Math.round(med(haelfte(beharr)) * 1000) / 1000,
    beharrlichkeit_zufall: Math.round(med(anteile) * 1000) / 1000,
    bestaetigungTage: N,
    streuung_Pp: Math.round(streu * 10000) / 10000,
    se_Pp: Math.round(se * 100000) / 100000,
    MDE_Pp: Math.round(2 * se * 100000) / 100000,
    delta80_1Test_Pp: Math.round((1.959964 + 0.8416212) * se * 100000) / 100000,
    delta80_2Tests_Pp: Math.round((2.241403 + 0.8416212) * se * 100000) / 100000,
    delta80_4Tests_Pp: Math.round((2.497706 + 0.8416212) * se * 100000) / 100000,
  };
  if (ueber.length) r.ueberschneidung_mit_B = Math.round(med(ueber) * 1000) / 1000;
  return r;
}

var bericht = {
  hinweis: 'Nur Anzahlen, Streuungen, Beharrlichkeit und Ueberschneidung. Kein Ertragsmittelwert berechnet, gedruckt oder abgelegt.',
  frage: 'Uebernacht-Bedingung ohne C8-Vorgriff und ohne geteilten Kurs mit der Zielgroesse?',
  archiv: ARCHIV, stichprobe: gewaehlt.length, verworfeneReihen: verworfen,
  extremRaus: extremRaus, symbolTage: symbolTage,
  handelstage: tage.length, ersterTag: tage[0], letzterTag: tage[tage.length - 1],
  kostenhuerden_Pp: { aktie: 0.04, scheinATM: 0.05, cfd: 0.10, standardSchein: 0.23 },
  korpusVergleich_Pp: { median_delta80_der_38_Varianten: 0.605, median_se: 0.148 },
  kandidaten: {},
};
KANDIDATEN.forEach(function (x) {
  bericht.kandidaten[x.key] = Object.assign({ was: x.was }, auswerten(x.key));
});
console.log(JSON.stringify(bericht, null, 1));
try {
  fs.mkdirSync(path.join(__dirname, '..', 'daten'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '..', 'daten', 'zaehlung-nachtstoss-2026-08-26.json'),
    JSON.stringify(bericht, null, 1));
} catch (e) { console.error('Ablage fehlgeschlagen: ' + e.message); }

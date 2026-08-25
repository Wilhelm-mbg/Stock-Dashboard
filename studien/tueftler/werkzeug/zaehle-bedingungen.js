'use strict';
/* ZAEHLWERKZEUG 2 des Strategie-Tueftlers - Auswahl der Bedingung, KEINE Messung.
 *
 * Der erste Entwurf (V = Nachtanteil des Risikos) ist am eigenen Check gestorben:
 * Beharrlichkeit 0,943. Ein Merkmal, das Nacht fuer Nacht dieselben Werte waehlt,
 * ist eine feste Symbolneigung - und die zieht die A7-Kontrolle per Konstruktion
 * ab (die Strategiedatei t1-zwangsglattstellung.js sagt genau das in ihrem Kopf).
 *
 * Dieses Werkzeug vergleicht Bedingungen NUR nach drei Groessen:
 *   - Beharrlichkeit  (Zufallserwartung = Signalanteil; nahe 1,00 = unbrauchbar)
 *   - Streuung der Tagesmittel (fuer die MDE-Formel)
 *   - Breite und Umsatz (Kostenneigung)
 * Kein Mittelwert einer Rendite wird gedruckt oder abgelegt. Die Wahl der
 * Bedingung faellt damit OHNE Blick auf irgendeinen Ertrag - das steht so in der
 * Vorregistrierung und ist der Grund, warum dieser Vergleich keine Tests kostet.
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

/* ---------- Die Bedingungen im Vergleich ----------
 * Jede bekommt je Symbol-Tag eine Kennzahl; ausgewaehlt wird das UNTERSTE
 * Quintil der Kennzahl. Wer oben stehen soll, liefert das Negative.        */
var BEDINGUNGEN = [
  { key: 'A_nachtanteil',   was: 'V = sd(60 Luecken) / sd(60 Innentage), hoechstes Quintil (erster Entwurf)' },
  { key: 'B_schlussdruck',  was: 'S = (Schluss - Tief)/(Hoch - Tief), niedrigstes Quintil: in die Glocke verkauft' },
  { key: 'C_umsatzschock',  was: 'U = Umsatz / Median60(Umsatz), hoechstes Quintil' },
  { key: 'D_spannenschock', was: 'R = (Hoch-Tief)/Schluss geteilt durch Median60, hoechstes Quintil' },
  { key: 'E_druck_und_schock', was: 'S im untersten Drittel UND U im obersten Drittel: einseitig verkauft bei hohem Umsatz' },
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

  var luecke = [], innen = [], umsL = [], spanL = [];
  for (var i = 1; i < b.length - 1; i++) {
    var cVor = b[i - 1][1], c = b[i][1], o = b[i][5], hi = b[i][3], lo = b[i][4];
    var oNext = b[i + 1][5];
    if (!(cVor > 0 && c > 0 && o > 0)) continue;
    var umsatz = c * (b[i][2] || 0);
    luecke.push((o / cVor - 1) * 100);
    innen.push((c / o - 1) * 100);
    umsL.push(umsatz);
    spanL.push(hi > 0 && lo > 0 && hi >= lo ? (hi - lo) / c : NaN);
    if (luecke.length > FENSTER) { luecke.shift(); innen.shift(); umsL.shift(); spanL.shift(); }
    if (luecke.length < FENSTER) continue;
    if (!(oNext > 0) || !(umsatz >= UMSATZ_MIN)) continue;
    if (!(hi > lo && lo > 0)) continue;

    var rN = (oNext / c - 1) * 100;
    if (!isFinite(rN) || Math.abs(rN) > 25) { extremRaus++; continue; }

    var gN = sd(luecke), gI = sd(innen);
    var umMed = med(umsL), spMed = med(spanL.filter(isFinite));
    if (!(gN > 0 && gI > 0 && umMed > 0 && spMed > 0)) continue;

    var kenn = {
      A_nachtanteil: -(gN / gI),                       // hoch = gut -> negieren
      B_schlussdruck: (c - lo) / (hi - lo),            // niedrig = gut
      C_umsatzschock: -(umsatz / umMed),
      D_spannenschock: -(((hi - lo) / c) / spMed),
    };
    var tag = new Date(b[i][0]).toISOString().slice(0, 10);
    var e = proTag.get(tag);
    if (!e) { e = { rN: [], um: [], sy: [], k: {} , sD: [], uS: [] }; BEDINGUNGEN.forEach(function (x) { e.k[x.key] = []; }); proTag.set(tag, e); }
    e.rN.push(rN); e.um.push(umsatz); e.sy.push(symNr);
    e.sD.push(kenn.B_schlussdruck); e.uS.push(-kenn.C_umsatzschock);
    e.k.A_nachtanteil.push(kenn.A_nachtanteil);
    e.k.B_schlussdruck.push(kenn.B_schlussdruck);
    e.k.C_umsatzschock.push(kenn.C_umsatzschock);
    e.k.D_spannenschock.push(kenn.D_spannenschock);
    e.k.E_druck_und_schock.push(0);                    // wird unten als Schnitt gebildet
    symbolTage++;
  }
});

var tage = Array.from(proTag.keys()).sort().filter(function (t) { return proTag.get(t).rN.length >= BREITE_MIN; });

function auswerten(key) {
  var mitten = [], breiten = [], umsaetze = [], beharr = [], anteile = [];
  var vor = null;
  tage.forEach(function (t) {
    var e = proTag.get(t), n = e.rN.length, i, wahl;
    if (key === 'E_druck_und_schock') {
      var sSort = e.sD.map(function (_, k) { return k; }).sort(function (a, c) { return e.sD[a] - e.sD[c]; });
      var uSort = e.uS.map(function (_, k) { return k; }).sort(function (a, c) { return e.uS[c] - e.uS[a]; });
      var drittel = Math.max(1, Math.floor(n / 3));
      var setU = new Set(uSort.slice(0, drittel));
      wahl = sSort.slice(0, drittel).filter(function (x) { return setU.has(x); });
    } else {
      var arr = e.k[key];
      var idx = arr.map(function (_, k) { return k; }).sort(function (a, c) { return arr[a] - arr[c]; });
      wahl = idx.slice(0, Math.max(1, Math.floor(n * 0.2)));
    }
    if (!wahl.length) return;
    var s = 0, um = [], jetzt = new Set();
    for (i = 0; i < wahl.length; i++) { s += e.rN[wahl[i]]; um.push(e.um[wahl[i]]); jetzt.add(e.sy[wahl[i]]); }
    mitten.push(s / wahl.length); breiten.push(wahl.length); umsaetze.push(med(um));
    anteile.push(wahl.length / n);
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
  return {
    signalanteil: Math.round(med(anteile) * 1000) / 10 + ' %',
    breiteMedian: med(breiten),
    umsatzMedian_MioDollar: Math.round(med(umsaetze) / 1e5) / 10,
    beharrlichkeit: Math.round(med(haelfte(beharr)) * 1000) / 1000,
    beharrlichkeit_zufall: Math.round(med(anteile) * 1000) / 1000,
    bestaetigungTage: N,
    streuung_Pp: Math.round(streu * 10000) / 10000,
    se_Pp: Math.round(se * 100000) / 100000,
    MDE_Pp: Math.round(2 * se * 100000) / 100000,
    delta80_1Test_Pp: Math.round((1.959964 + 0.8416212) * se * 100000) / 100000,
    delta80_3Tests_Pp: Math.round((2.394 + 0.8416212) * se * 100000) / 100000,
  };
}

var bericht = {
  hinweis: 'Nur Anzahlen, Streuungen und Beharrlichkeit. Kein Ertragsmittelwert berechnet oder abgelegt.',
  archiv: ARCHIV, stichprobe: gewaehlt.length, verworfeneReihen: verworfen,
  extremRaus: extremRaus, symbolTage: symbolTage,
  handelstage: tage.length, ersterTag: tage[0], letzterTag: tage[tage.length - 1],
  kostenhuerden_Pp: { aktie: 0.04, scheinATM: 0.05, cfd: 0.10, standardSchein: 0.23 },
  korpusVergleich_Pp: { median_delta80_der_38_Varianten: 0.605, median_se: 0.148 },
  bedingungen: {},
};
BEDINGUNGEN.forEach(function (x) {
  bericht.bedingungen[x.key] = Object.assign({ was: x.was }, auswerten(x.key));
});
console.log(JSON.stringify(bericht, null, 1));
try {
  fs.mkdirSync(path.join(__dirname, '..', 'daten'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '..', 'daten', 'zaehlung-bedingungen-2026-08-26.json'),
    JSON.stringify(bericht, null, 1));
} catch (e) { console.error('Ablage fehlgeschlagen: ' + e.message); }

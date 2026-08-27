'use strict';
/* ZAEHLWERKZEUG des Strategie-Tueftlers - Machbarkeits-Check, KEINE Messung.
 *
 * Frage: Traegt ein Kandidat, dessen Auswahl KEINEN Kurs des Signaltages liest,
 * das Uebernachtfenster? Anlass ist Nagel (2012, NBER WP 17653): die Haelfte
 * einer Schluss-zu-Schluss gemessenen Umkehr-Rendite ist Spannen-Rueckprall.
 * Bei Branchenkoerben verschwindet der Unterschied - weil dort die Auswahl
 * nicht danach fragt, wo im Tagesband der Schluss liegt.
 *
 * Deshalb liest das Signal hier ausschliesslich
 *   - UMSAETZE des Tages i und davor  (kein Kurs)
 *   - Kurse des VORTAGES i-1          (anderer Tag als die Zielgroesse)
 * und die Zielgroesse Schluss(i) -> Eroeffnung(i+1) teilt mit dem Signal
 * keinen einzigen Kurs.
 *
 * Was hier berechnet wird: Anzahlen, Streuungen, Beharrlichkeit, Ueberschneidung.
 * Was hier bewusst NICHT ausgegeben wird: irgendein Mittelwert einer Rendite.
 * Die Tagesmittel entstehen rechnerisch (ohne sie keine Streuung), werden aber
 * weder gedruckt noch abgelegt.
 *
 * Hausregeln, die hier nachgebaut sind:
 *   #85  - letzte Kerze eines Abrufs kann Quote-Stempel sein. Immer verworfen.
 *   F1   - reiheKaputt: unbereinigte Zusammenlegungen erzeugen Spruenge.
 *   Art  - Universum nach Wertpapierart (CS/ADRC), nicht nach Namensliste.
 *   A7   - leseFenster wird ausgewiesen, damit die Kontrolle es auslassen kann.
 *
 * Kerzenformat archiv1d: [t, c, v, h, l, o].
 */
var fs = require('fs');
var path = require('path');
var os = require('os');

var ARCHIV = process.env.ARCHIV1D || 'E:/Markt-Dashboard-Archiv/archiv1d';
var STICHPROBE = Number(process.env.STICHPROBE || 400);
var UMSATZ_MIN = 5e6;          // wie die Schwesterstudien: Tagesumsatz > 5 Mio $
var FENSTER = 60;              // Rueckblick fuer Umsatz-Median und Streuungsmasse
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
function med(a) {
  if (!a.length) return NaN;
  var b = a.slice().sort(function (x, y) { return x - y; });
  return b[Math.floor(b.length / 2)];
}
function haelfte(a) { return a.slice(Math.floor(a.length / 2)); }
/* Kunstrang fuer den Placebo: mischt Symbol und Tag so, dass die Reihenfolge
 * der Symbole taeglich NEU ist. Kein Kursbezug, keine Beharrlichkeit. */
function mischen(a, b, saat) {
  var h = Math.imul(a, 0x9E3779B1) ^ Math.imul(b, 0x85EBCA6B) ^ Math.imul(saat|0, 0x27220A95);
  h ^= h >>> 15; h = Math.imul(h, 0x2C1B3C6D);
  h ^= h >>> 13; h = Math.imul(h, 0x297A2D39);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/* ---------- Kandidaten ----------
 * Ausgewaehlt wird immer das UNTERSTE Quintil der Kennzahl; Unendlich heisst
 * "Gatter nicht erfuellt, kommt nie in die Auswahl".
 *
 * K  ist der eigentliche Kandidat. C1/C2 nehmen ihm je EIN Gatter weg, damit
 * ausgewiesen ist, was das Gatter an Aufloesung und Breite kostet - nicht,
 * damit hinterher das beste ausgesucht wird. Die Wahl steht in der
 * Vorregistrierung VOR dem Lauf.
 * B und F sind Massstaebe fuer die Ueberschneidung mit den zwei schon
 * vorregistrierten Entwuerfen, keine neuen Kandidaten.                        */
var KANDIDATEN = [
  { key: 'B_schlussdruck_referenz', was: 'MASSSTAB (vorregistriert): S = (Schluss-Tief)/(Hoch-Tief), unterstes Quintil. Liest Schluss(i).' },
  { key: 'F_nachtstoss_referenz', was: 'MASSSTAB (vorregistriert): z1 = Uebernachtstoss(i)/sd60, unterstes Quintil.' },
  { key: 'K_abgabedruck', was: 'KANDIDAT: Umsatzschock U(i)>=2 UND abflauend v(i)<v(i-1) UND Vortag-Innentag negativ; Rang nach r_intra(i-1).' },
  { key: 'C1_ohne_abflauen', was: 'GEGENPROBE: wie K, aber ohne das Abflau-Gatter v(i)<v(i-1).' },
  { key: 'C2_ohne_vorzeichen', was: 'GEGENPROBE: nur Umsatzschock, KEIN Kursvorzeichen - Rang nach -U(i). Zeigt, was das Vorzeichen bringt.' },
  { key: 'C3_schock_streng', was: 'GEGENPROBE: wie K, aber U(i)>=3 statt >=2.' },
  { key: 'K2_schock_rangiert', was: 'BAUFORM 2: dieselben zwei kursbasierten Gatter wie K (Vortag negativ, abflauend), aber der Umsatzschock wird RANGIERT statt geschwellt - Rang nach -U(i). Keine Schockschwelle, deshalb breiter.' },
  { key: 'K3_nur_vorzeichen_rang_U', was: 'BAUFORM 3 (der Kandidat): EIN Gatter - Vortag-Innentag negativ - und Rang nach -U(i). Das Abflau-Gatter faellt weg, weil es aus T2s Innentags-Logik stammt und nicht aus dem Uebernacht-Mechanismus.' },
  { key: 'P2_placebo', was: 'PLACEBO 2 - gleiche Bauart, andere Startzahl. Dient allein dazu, die STREUUNG des Placebo-Masses zu zeigen.' },
  { key: 'P3_placebo', was: 'PLACEBO 3 - andere Startzahl.' },
  { key: 'P4_placebo', was: 'PLACEBO 4 - andere Startzahl.' },
  { key: 'P5_placebo', was: 'PLACEBO 5 - andere Startzahl.' },
  { key: 'P_gatter_ohne_rang', was: 'GEGENPROBE zur Bauform 3: dasselbe Gatter, aber Rang nach Symbolnummer statt nach U - zeigt, wieviel der Umsatzrang an der Auswahl ueberhaupt aendert.' },
];

var dateien = fs.readdirSync(ARCHIV).filter(function (f) { return f.indexOf('bars_1d_') === 0; });
var symbole = dateien.map(function (f) { return f.slice(8, -5); }).filter(istAktie).sort();
var schritt = Math.max(1, Math.floor(symbole.length / STICHPROBE));
var gewaehlt = symbole.filter(function (_, i) { return i % schritt === 0; }).slice(0, STICHPROBE);

var proTag = new Map();
var verworfen = 0, extremRaus = 0, symbolTage = 0;
var INF = Infinity;

gewaehlt.forEach(function (sym, symNr) {
  var j;
  try { j = JSON.parse(fs.readFileSync(path.join(ARCHIV, 'bars_1d_' + sym + '.json'), 'utf8')); }
  catch (e) { verworfen++; return; }
  if (!j || !Array.isArray(j.series) || j.series.length < FENSTER + 12) { verworfen++; return; }
  var b = j.series.slice(0, -1);                       // #85
  if (reiheKaputt(b)) { verworfen++; return; }

  var volFenster = [];                                 // Umsaetze (Stueck) der Vortage
  var stossFenster = [];                               // Uebernachtstoesse in Pp, fuer den Massstab F

  for (var i = 1; i < b.length - 1; i++) {
    var cVor = b[i - 1][1], oVor = b[i - 1][5], vVor = b[i - 1][2];
    var c = b[i][1], o = b[i][5], hi = b[i][3], lo = b[i][4], v = b[i][2];
    var oNext = b[i + 1][5];

    /* Fenster fortschreiben, bevor irgendein Gatter abbricht - sonst hat das
     * Fenster Loecher, ueber die spaeter niemand mehr Rechenschaft ablegt. */
    var stossHeute = (cVor > 0 && o > 0) ? (o / cVor - 1) * 100 : NaN;
    if (isFinite(stossHeute)) stossFenster.push(stossHeute);
    if (stossFenster.length > FENSTER) stossFenster.shift();
    var volVorher = volFenster.slice();                 // OHNE heute: der Schock normiert sich sonst selbst weg
    volFenster.push(v > 0 ? v : 0);
    if (volFenster.length > FENSTER) volFenster.shift();

    if (volVorher.length < FENSTER || stossFenster.length < FENSTER) continue;
    if (!(cVor > 0 && c > 0 && o > 0 && oVor > 0 && oNext > 0)) continue;

    var umsatz = c * (v || 0);
    if (!(umsatz >= UMSATZ_MIN)) continue;
    if (!(hi > lo && lo > 0)) continue;

    /* Zielgroesse: das Nachtbein. Liest Schluss(i) und Eroeffnung(i+1). */
    var rN = (oNext / c - 1) * 100;
    if (!isFinite(rN) || Math.abs(rN) > 25) { extremRaus++; continue; }

    /* --- Signalgroessen. Kein Kurs des Tages i ausser fuer die MASSSTAEBE. --- */
    var vMed = med(volVorher);
    var U = (vMed > 0) ? (v || 0) / vMed : NaN;                 // Umsatzschock, kursfrei
    var abflauend = (vVor > 0) && (v > 0) && (v < vVor);        // kursfrei
    var rIntraVor = (oVor > 0) ? (cVor / oVor - 1) * 100 : NaN; // Kurse des VORTAGES

    var gK = isFinite(U) && U >= 2 && abflauend && isFinite(rIntraVor) && rIntraVor < 0;
    var gC1 = isFinite(U) && U >= 2 && isFinite(rIntraVor) && rIntraVor < 0;
    var gC2 = isFinite(U) && U >= 2;
    var gC3 = isFinite(U) && U >= 3 && abflauend && isFinite(rIntraVor) && rIntraVor < 0;

    /* Massstaebe - diese beiden lesen bewusst Kurse des Tages i. */
    var sdStoss = sd(stossFenster.slice(0, FENSTER - 1));
    var z1 = (sdStoss > 0) ? stossHeute / sdStoss : NaN;

    var kenn = {
      B_schlussdruck_referenz: (c - lo) / (hi - lo),
      F_nachtstoss_referenz: isFinite(z1) ? z1 : INF,
      K_abgabedruck: gK ? rIntraVor : INF,
      C1_ohne_abflauen: gC1 ? rIntraVor : INF,
      C2_ohne_vorzeichen: gC2 ? -U : INF,
      C3_schock_streng: gC3 ? rIntraVor : INF,
      K2_schock_rangiert: (abflauend && isFinite(rIntraVor) && rIntraVor < 0 && isFinite(U)) ? -U : INF,
      K3_nur_vorzeichen_rang_U: (isFinite(rIntraVor) && rIntraVor < 0 && isFinite(U)) ? -U : INF,
      /* Kunstrang OHNE Kursbezug und OHNE Beharrlichkeit.
       *
       * ZWEIMAL FALSCH GEBAUT, beide Male am eigenen Ergebnis aufgefallen
       * (Beharrlichkeit 0,36 bzw. 0,32 bei Zufallserwartung 0,197):
       *   1. (symNr*7 + i) % 997
       *   2. ((symNr+1)*2654435761 + tag*40503) % 1000003
       * Beide Male derselbe Denkfehler: ein ADDITIVER Tagesterm verschiebt
       * ALLE Schluessel um denselben Betrag und laesst die REIHENFOLGE stehen.
       * Der Placebo waehlte deshalb fast jeden Tag dieselben Werte - ein festes
       * Depot mit autokorrelierten Tagesmitteln, bei dem se = sd/sqrt(N) die
       * wahre Streuung untertreibt. Er sah dadurch SCHAERFER aus als der
       * Kandidat, aus der Bauart und nicht aus einem Befund.
       *
       * Ein Kunstrang braucht MISCHUNG, nicht Verschiebung. */
      P_gatter_ohne_rang: (isFinite(rIntraVor) && rIntraVor < 0)
        ? mischen(symNr + 1, Math.floor(b[i][0] / 86400000), 1) : INF,
      P2_placebo: (isFinite(rIntraVor) && rIntraVor < 0) ? mischen(symNr + 1, Math.floor(b[i][0] / 86400000), 20260827) : INF,
      P3_placebo: (isFinite(rIntraVor) && rIntraVor < 0) ? mischen(symNr + 1, Math.floor(b[i][0] / 86400000), 77777) : INF,
      P4_placebo: (isFinite(rIntraVor) && rIntraVor < 0) ? mischen(symNr + 1, Math.floor(b[i][0] / 86400000), 424242) : INF,
      P5_placebo: (isFinite(rIntraVor) && rIntraVor < 0) ? mischen(symNr + 1, Math.floor(b[i][0] / 86400000), 999983) : INF,
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

/* Unterstes Quintil, aber NIE ein Wert mit unerfuelltem Gatter (Infinity).
 * Deshalb ist die Breite bei den Gatter-Kandidaten kleiner als ein Fuenftel -
 * das ist der Punkt und wird als Signalanteil ausgewiesen. */
function wahlDesTages(e, key) {
  var arr = e.k[key], n = arr.length, k;
  var zul = [];
  for (k = 0; k < n; k++) if (isFinite(arr[k])) zul.push(k);
  if (!zul.length) return [];
  zul.sort(function (a, c) { return arr[a] - arr[c]; });
  var deckel = Math.max(1, Math.floor(n * 0.2));
  return zul.slice(0, Math.min(deckel, zul.length));
}

function auswerten(key) {
  var mitten = [], diffs = [], breiten = [], umsaetze = [], umsaetzeKorb = [], beharr = [], anteile = [];
  var ueberB = [], ueberF = [], tageMitSignal = 0;
  var vor = null;
  tage.forEach(function (t) {
    var e = proTag.get(t), n = e.rN.length, i;
    var wahl = wahlDesTages(e, key);
    if (!wahl.length) { vor = null; return; }
    tageMitSignal++;
    var s = 0, um = [], jetzt = new Set();
    for (i = 0; i < wahl.length; i++) { s += e.rN[wahl[i]]; um.push(e.um[wahl[i]]); jetzt.add(e.sy[wahl[i]]); }
    /* Querschnitts-Gegenstueck: der REST des Tages, also der zugelassene
     * Querschnitt OHNE die Auswahl. Nicht der ganze Querschnitt - der enthaelt
     * die Auswahl und die Differenz waere um den Ueberlappungsanteil gestaucht.
     * Beide Seiten tragen denselben Marktfaktor; in der Differenz kuerzt er sich
     * weg, soweit die Auswahl kein anderes Beta hat. */
    var inWahl = new Set(wahl), sRest = 0, nRest = 0;
    for (i = 0; i < n; i++) if (!inWahl.has(i)) { sRest += e.rN[i]; nRest++; }
    if (nRest > 0) diffs.push(s / wahl.length - sRest / nRest);
    mitten.push(s / wahl.length);            // bleibt in dieser Funktion, wird nie gedruckt
    breiten.push(wahl.length); umsaetze.push(med(um)); umsaetzeKorb.push(med(e.um));
    anteile.push(wahl.length / n);
    if (key !== 'B_schlussdruck_referenz') {
      var wB = new Set(wahlDesTages(e, 'B_schlussdruck_referenz')), d = 0;
      for (i = 0; i < wahl.length; i++) if (wB.has(wahl[i])) d++;
      ueberB.push(d / wahl.length);
    }
    if (key !== 'F_nachtstoss_referenz') {
      var wF = new Set(wahlDesTages(e, 'F_nachtstoss_referenz')), d2 = 0;
      for (i = 0; i < wahl.length; i++) if (wF.has(wahl[i])) d2++;
      ueberF.push(d2 / wahl.length);
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
  /* Dieselbe Rechnung auf der Differenzreihe. WICHTIG: es entsteht dabei kein
   * Mittelwert der Differenz - nur ihre Streuung. f ist der Faktor, um den eine
   * Querschnitts-Kontrolle die Aufloesung schaerft. */
  var streuD = sd(haelfte(diffs));
  var seD = streuD / Math.sqrt(N);
  var r = {
    tageMitSignal: tageMitSignal,
    tageAnteil: Math.round(tageMitSignal / tage.length * 1000) / 10 + ' % der Handelstage',
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
    noetigeTage_fuer_0_10Pp: Math.round(Math.pow((2.241403 + 0.8416212) * streu / 0.10, 2)),
    noetigeTage_fuer_0_04Pp: Math.round(Math.pow((2.241403 + 0.8416212) * streu / 0.04, 2)),
    /* --- gegen den Rest des Tages gepaart --- */
    q_streuung_Pp: Math.round(streuD * 10000) / 10000,
    q_se_Pp: Math.round(seD * 100000) / 100000,
    q_delta80_2Tests_Pp: Math.round((2.241403 + 0.8416212) * seD * 100000) / 100000,
    q_noetigeTage_fuer_0_10Pp: Math.round(Math.pow((2.241403 + 0.8416212) * streuD / 0.10, 2)),
    q_noetigeTage_fuer_0_04Pp: Math.round(Math.pow((2.241403 + 0.8416212) * streuD / 0.04, 2)),
    q_faktor_f: Math.round(streu / streuD * 1000) / 1000,
  };
  /* Median UND Mittel: bei schmalen Koerben ist die Ueberschneidung je Tag
   * meist glatt 0 oder 1, dann ist der Median eine Stufenfunktion und sagt
   * nichts. Das Mittel ist hier die tragende Zahl. */
  function mittel(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : NaN; }
  if (ueberB.length) {
    r.ueberschneidung_mit_B_median = Math.round(med(ueberB) * 1000) / 1000;
    r.ueberschneidung_mit_B_mittel = Math.round(mittel(ueberB) * 1000) / 1000;
  }
  if (ueberF.length) {
    r.ueberschneidung_mit_F_median = Math.round(med(ueberF) * 1000) / 1000;
    r.ueberschneidung_mit_F_mittel = Math.round(mittel(ueberF) * 1000) / 1000;
  }
  r.beharrlichkeit_mittel = Math.round(mittel(haelfte(beharr)) * 1000) / 1000;
  return r;
}

var bericht = {
  hinweis: 'Nur Anzahlen, Streuungen, Beharrlichkeit und Ueberschneidung. Kein Ertragsmittelwert berechnet, gedruckt oder abgelegt.',
  frage: 'Traegt ein Uebernacht-Kandidat, dessen Auswahl KEINEN Kurs des Signaltages liest (Nagel-Regel gegen den Spannen-Rueckprall)?',
  zielgroesse: 'Schluss(i) -> Eroeffnung(i+1), H = 1',
  leseFensterTage: FENSTER + 2,
  archiv: ARCHIV, stichprobe: gewaehlt.length, verworfeneReihen: verworfen,
  extremRaus: extremRaus, symbolTage: symbolTage,
  handelstage: tage.length, ersterTag: tage[0], letzterTag: tage[tage.length - 1],
  kostenhuerden_Pp: { aktie: 0.04, scheinATM: 0.05, cfd: 0.10, standardSchein: 0.23 },
  korpusVergleich_Pp: { median_delta80_der_38_Varianten: 0.605, median_se: 0.148 },
  kandidaten: {},
};
KANDIDATEN.forEach(function (x) {
  bericht.kandidaten[x.key] = { was: x.was, zahlen: auswerten(x.key) };
});
console.log(JSON.stringify(bericht, null, 2));

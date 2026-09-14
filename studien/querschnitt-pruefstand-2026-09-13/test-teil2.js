'use strict';
/* PRUEFUNGEN zu TEIL 2 (VORREGISTRIERUNG-TEIL2.md §T2.6), zusaetzlich zu den 47 aus Teil 1.
 *
 * Aufruf:  node test-teil2.js [--referenz <F-F_Momentum_Factor.csv>] [--kandidaten <kandidaten.json>]
 *
 * Die Pruefungen, die Daten brauchen (T2-P1, T2-P3, T2-P4, T2-P6), werden uebersprungen und als
 * "uebersprungen" gezaehlt, wenn die Datei nicht uebergeben wurde. Rot ist rot; nichts wird abgeschwaecht.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var RF = require('./rangfunktionen.js');
var AU = require('./aussen.js');

var gruen = 0, rot = 0, uebersprungen = 0, zeilen = [];
function pruef(name, fn) {
  try {
    var r = fn();
    if (r === 'skip') { uebersprungen++; zeilen.push('  -  ' + name + ' (uebersprungen)'); return; }
    gruen++; zeilen.push(' OK  ' + name + (r ? ' - ' + r : ''));
  } catch (e) { rot++; zeilen.push('ROT  ' + name + ' - ' + e.message); }
}
function gleich(a, b, eps, was) {
  if (!(Math.abs(a - b) <= eps)) throw new Error((was || '') + ' ' + a + ' != ' + b + ' (eps ' + eps + ')');
}

/* ---------- Kunst-Tafel: genau so viel, wie die Rangfunktionen anfassen ---------- */
/** reihe: Array von {schluss, rendite, umsatz}, Index 0 = aeltester. t = letzte Zeile. */
function kunst(reihe) {
  var n = reihe.length;
  var g = { bSchluss: new Float64Array(n), rendite: new Float64Array(n), umsatz: new Float64Array(n) };
  reihe.forEach(function (r, i) { g.bSchluss[i] = r.schluss; g.rendite[i] = r.rendite; g.umsatz[i] = r.umsatz; });
  var T = { g: g };
  var sicht = { zurueck: function (z, k) { return (z - k >= 0) ? z - k : -1; },
    zeile: function () { throw new Error('eine Kandidaten-Rangfunktion hat sicht.zeile() aufgerufen'); } };
  return { T: T, sicht: sicht, liste: [{ sym: 0, zeile: n - 1 }] };
}
function einWert(fn, reihe) { var c = kunst(reihe); return fn(c.sicht, c.liste, c.T)[0]; }

/* ================= T2-P2: jede Rangfunktion gegen eine Handrechnung ================= */
pruef('T2-P2a K1 Kurzfrist-Umkehr: Schluss 100 -> 110 ueber 5 Zeilen ergibt Rang -10', function () {
  var r = [100, 101, 102, 103, 104, 110].map(function (s) { return { schluss: s, rendite: 0, umsatz: 1 }; });
  gleich(einWert(RF.k1Umkehr, r), -10, 1e-12, 'K1');
  return 'Rang ' + einWert(RF.k1Umkehr, r).toFixed(6);
});
pruef('T2-P2a2 K1 kauft das UNTERE Ende: der Verlierer bekommt den hoeheren Rang', function () {
  var hoch = [100, 100, 100, 100, 100, 110].map(function (s) { return { schluss: s, rendite: 0, umsatz: 1 }; });
  var tief = [100, 100, 100, 100, 100, 90].map(function (s) { return { schluss: s, rendite: 0, umsatz: 1 }; });
  if (!(einWert(RF.k1Umkehr, tief) > einWert(RF.k1Umkehr, hoch))) throw new Error('Richtung verdreht');
  return 'Verlierer ' + einWert(RF.k1Umkehr, tief).toFixed(2) + ' > Gewinner ' + einWert(RF.k1Umkehr, hoch).toFixed(2);
});
pruef('T2-P2b K2 tiefe Volatilitaet: Renditen 1..60 haben sd sqrt(305) = 17.464249', function () {
  var r = []; for (var i = 1; i <= 60; i++) r.push({ schluss: 100, rendite: i, umsatz: 1 });
  gleich(einWert(RF.k2TiefeVola, r), -Math.sqrt(305), 1e-9, 'K2');
  return 'Rang ' + einWert(RF.k2TiefeVola, r).toFixed(6) + ' (= -sqrt(305))';
});
pruef('T2-P2b2 K2 kauft das UNTERE Ende und braucht 60 Renditen (59 => NaN)', function () {
  var ruhig = [], wild = [], kurz = [];
  for (var i = 0; i < 60; i++) { ruhig.push({ schluss: 100, rendite: (i % 2 ? 0.1 : -0.1), umsatz: 1 }); wild.push({ schluss: 100, rendite: (i % 2 ? 5 : -5), umsatz: 1 }); }
  for (var j = 0; j < 59; j++) kurz.push({ schluss: 100, rendite: 1, umsatz: 1 });
  if (!(einWert(RF.k2TiefeVola, ruhig) > einWert(RF.k2TiefeVola, wild))) throw new Error('Richtung verdreht');
  var v = einWert(RF.k2TiefeVola, kurz);
  if (v === v) throw new Error('59 Zeilen haetten NaN liefern muessen, lieferten ' + v);
  return 'ruhig ' + einWert(RF.k2TiefeVola, ruhig).toFixed(4) + ' > wild ' + einWert(RF.k2TiefeVola, wild).toFixed(4) + ', 59 Zeilen = NaN';
});
pruef('T2-P2c K3 52-Wochen-Hoch: 150 gegen ein Maximum von 200 ergibt 0.75', function () {
  var r = []; for (var i = 0; i < 250; i++) r.push({ schluss: (i === 7 ? 200 : 100), rendite: 0, umsatz: 1 });
  r[249] = { schluss: 150, rendite: 0, umsatz: 1 };
  gleich(einWert(RF.k3NaheHoch, r), 0.75, 1e-12, 'K3');
  /* Ein Wert AUSSERHALB des Fensters (251 Zeilen zurueck) darf das Maximum NICHT beeinflussen. */
  var r2 = [{ schluss: 1000, rendite: 0, umsatz: 1 }].concat(r);
  gleich(einWert(RF.k3NaheHoch, r2), 0.75, 1e-12, 'K3 Fensterrand');
  return '0.75, Fenster genau ' + K.K3_FENSTER + ' Zeilen';
});
pruef('T2-P2c2 K3 kauft das OBERE Ende: nahe am Hoch bekommt den hoeheren Rang', function () {
  var nah = [], fern = [];
  for (var i = 0; i < 250; i++) { nah.push({ schluss: 100, rendite: 0, umsatz: 1 }); fern.push({ schluss: 100, rendite: 0, umsatz: 1 }); }
  nah[249] = { schluss: 99, rendite: 0, umsatz: 1 }; fern[249] = { schluss: 50, rendite: 0, umsatz: 1 };
  if (!(einWert(RF.k3NaheHoch, nah) > einWert(RF.k3NaheHoch, fern))) throw new Error('Richtung verdreht');
  return 'nah 0.99 > fern 0.50';
});
pruef('T2-P2d K4 Umsatzschock: 61 gegen Median(1..60) = 30.5 ergibt 2.0, mal Vorzeichen', function () {
  var r = []; for (var i = 1; i <= 60; i++) r.push({ schluss: 100, rendite: 0, umsatz: i });
  var auf = r.concat([{ schluss: 100, rendite: 0.5, umsatz: 61 }]);
  var ab = r.concat([{ schluss: 100, rendite: -0.5, umsatz: 61 }]);
  var null0 = r.concat([{ schluss: 100, rendite: 0, umsatz: 61 }]);
  gleich(einWert(RF.k4Umsatzschock, auf), 2, 1e-12, 'K4 auf');
  gleich(einWert(RF.k4Umsatzschock, ab), -2, 1e-12, 'K4 ab');
  gleich(einWert(RF.k4Umsatzschock, null0), 0, 1e-12, 'K4 null');
  return '+2 / -2 / 0';
});
pruef('T2-P2d2 K4: der Zaehler steht NICHT in seinem eigenen Nenner (Median ueber t-60..t-1)', function () {
  /* Wuerde t mitgemittelt, verschoebe ein extremer Umsatz an t den Median - hier darf er das nicht. */
  var r = []; for (var i = 1; i <= 60; i++) r.push({ schluss: 100, rendite: 0, umsatz: i });
  var a = einWert(RF.k4Umsatzschock, r.concat([{ schluss: 100, rendite: 1, umsatz: 61 }]));
  var b = einWert(RF.k4Umsatzschock, r.concat([{ schluss: 100, rendite: 1, umsatz: 61000 }]));
  gleich(a, 2, 1e-12, 'K4 klein');
  gleich(b, 61000 / 30.5, 1e-9, 'K4 gross');
  return 'Median bleibt 30.5 in beiden Faellen';
});
pruef('T2-P2e Fenster stehen genau einmal, in konfig.js', function () {
  if (K.K1_FENSTER !== 5 || K.K2_FENSTER !== 60 || K.K3_FENSTER !== 250 || K.K4_FENSTER !== 60 || K.K4_MIN_TAGE !== 40)
    throw new Error('Fenster weichen von der Vorregistrierung ab');
  return '5 / 60 / 250 / 60 (min 40)';
});

/* ================= T2-P5: keine Rangfunktion liest die Gruende-Tafel ================= */
pruef('T2-P5 keine der vier Rangfunktionen benutzt die Gruende-Tafel (Warnung 1)', function () {
  /* Geprueft wird die VERWENDUNG im Funktionsrumpf, nicht die Erwaehnung im Kommentar: der erklaerende
   * Kommentar nennt den verbotenen Bezeichner, und eine Textsuche ueber die Datei waere deshalb immer rot
   * (Fehlerform "Sperrklinke frisst ihren Kommentar"). fn.toString() liefert nur den Rumpf. */
  var verboten = /\bgruende\s*\(|GRUENDE_DATEI|endeGrund/;
  RF.KANDIDATEN.forEach(function (fn) {
    if (verboten.test(fn.toString())) throw new Error(fn.$name + ' greift auf die Gruende-Tafel zu');
  });
  return RF.KANDIDATEN.length + ' Rangfunktionen sauber';
});
pruef('T2-P5b keine der vier ruft sicht.zeile() (die Kunst-Tafel wirft dabei)', function () {
  var r = []; for (var i = 0; i < 260; i++) r.push({ schluss: 100 + (i % 7), rendite: (i % 5) - 2, umsatz: 1000 + i });
  RF.KANDIDATEN.forEach(function (fn) { einWert(fn, r); });
  return '4 Rangfunktionen ohne sicht.zeile()';
});
pruef('T2-P5c Richtung und Nummer jedes Kandidaten stehen an der Funktion', function () {
  var erwartet = { 'k1-kurzfrist-umkehr': 'unten', 'k2-tiefe-volatilitaet': 'unten',
    'k3-nahe-52w-hoch': 'oben', 'k4-umsatzschock-richtung': 'oben' };
  RF.KANDIDATEN.forEach(function (fn) {
    if (!fn.$kandidat || fn.$kandidat.ende !== erwartet[fn.$name]) throw new Error(fn.$name + ' traegt die falsche Richtung');
  });
  return 'unten / unten / oben / oben wie vorregistriert';
});

/* ================= T2-P7: Korrelation gegen konstruierte Paare ================= */
pruef('T2-P7 Pearson und Spearman liefern +1, -1 und 0 auf konstruierten Paaren', function () {
  var x = [1, 2, 3, 4, 5, 6, 7];
  gleich(AU.pearson(x, x.map(function (v) { return 3 * v + 2; })), 1, 1e-12, 'plus1');
  gleich(AU.pearson(x, x.map(function (v) { return -3 * v + 2; })), -1, 1e-12, 'minus1');
  gleich(AU.pearson([1, 2, 3, 4], [1, -1, -1, 1]), 0, 1e-12, 'null');   /* Sxy = -1.5+0.5-0.5+1.5 = 0 */
  gleich(AU.spearman(x, x.map(function (v) { return Math.exp(v); })), 1, 1e-12, 'spearman monoton');
  /* unabhaengige Nachrechnung an einem Satz von Hand */
  var a = [1, 2, 3], b = [2, 4, 7];
  var handRho = ((1 - 2) * (2 - 13 / 3) + 0 + (3 - 2) * (7 - 13 / 3)) / Math.sqrt(2 * (((2 - 13 / 3) * (2 - 13 / 3)) + ((4 - 13 / 3) * (4 - 13 / 3)) + ((7 - 13 / 3) * (7 - 13 / 3))));
  gleich(AU.pearson(a, b), handRho, 1e-12, 'Handrechnung');
  return 'rho +1 / -1 / 0, Spearman +1, Handrechnung ' + handRho.toFixed(6);
});
pruef('T2-P7b Regression: y = 2x + 5 liefert beta 2, alpha 5', function () {
  var x = [1, 2, 3, 4, 5], y = x.map(function (v) { return 2 * v + 5; });
  var r = AU.regression(x, y);
  gleich(r.beta, 2, 1e-12, 'beta'); gleich(r.alpha, 5, 1e-12, 'alpha');
  return 'beta 2, alpha 5';
});
pruef('T2-P7c Monatsversatz rechnet ueber Jahresgrenzen', function () {
  if (AU.schiebe('2021-01', -1) !== '2020-12') throw new Error('rueckwaerts falsch: ' + AU.schiebe('2021-01', -1));
  if (AU.schiebe('2020-12', 1) !== '2021-01') throw new Error('vorwaerts falsch: ' + AU.schiebe('2020-12', 1));
  if (AU.schiebe('2021-06', 0) !== '2021-06') throw new Error('Versatz 0 falsch');
  return '2021-01 -1 => 2020-12, 2020-12 +1 => 2021-01';
});

/* ================= Bonferroni-Schranke unabhaengig nachgerechnet ================= */
pruef('T2-P8 Bonferroni: 8 Tests, zweiseitig 5 % => |t| >= 2.734 (unabhaengig nachgerechnet)', function () {
  /* Normalverteilung ueber eine eigene erf-Naeherung (Abramowitz-Stegun 7.1.26), nicht aus konfig.js. */
  function erf(x) {
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  var p = K.BONFERRONI_ALPHA / K.TESTZAHL;                     // 0,00625 zweiseitig
  var zweiseitig = 1 - erf(K.BONFERRONI_T / Math.SQRT2);        // = 2*(1 - Phi(t))
  if (Math.abs(zweiseitig - p) > 2e-5) throw new Error('Schranke ' + K.BONFERRONI_T + ' entspricht p = ' + zweiseitig.toFixed(6) + ', erwartet ' + p);
  if (K.TESTZAHL !== 8) throw new Error('Testzahl ist nicht 8');
  return 'p(|t| >= ' + K.BONFERRONI_T + ') = ' + zweiseitig.toFixed(6) + ' ~ ' + p;
});

/* ================= T2-P6: Leser der Referenzdatei ================= */
var argv = process.argv.slice(2), opt = {};
for (var ai = 0; ai < argv.length; ai++) { if (argv[ai] === '--referenz') opt.referenz = argv[++ai]; else if (argv[ai] === '--kandidaten') opt.kandidaten = argv[++ai]; else if (argv[ai] === '--momentum') opt.momentum = argv[++ai]; }

pruef('T2-P6 Referenzleser: drei von Hand nachgeschlagene Monate, Jahresblock getrennt', function () {
  if (!opt.referenz || !fs.existsSync(opt.referenz)) return 'skip';
  var m = AU.leseMom(opt.referenz);
  gleich(m.monate['2017-01'], -0.92, 1e-12, '2017-01');
  gleich(m.monate['2020-11'], -12.60, 1e-12, '2020-11');
  gleich(m.monate['2026-07'], -12.25, 1e-12, '2026-07');
  if (m.monate['2021'] !== undefined) throw new Error('Jahreszeile im Monatsblock gelandet');
  gleich(m.jahre['2021'], -2.32, 1e-12, 'Jahr 2021');
  if (m.nMonate < 1190 || m.nMonate > 1200) throw new Error('unerwartete Zahl Monatswerte: ' + m.nMonate);
  return m.nMonate + ' Monate, ' + m.nJahre + ' Jahre, verworfene Fehlwerte ' + m.verworfen;
});

/* ================= T2-P1, T2-P3, T2-P4: am echten Lauf ================= */
pruef('T2-P3 Periodenreihe: Laenge, Reihenfolge, Mittel stimmen mit den Aggregaten', function () {
  if (!opt.momentum || !fs.existsSync(opt.momentum)) return 'skip';
  var j = JSON.parse(fs.readFileSync(opt.momentum, 'utf8'));
  if (j.perioden.length !== j.n) throw new Error('Laenge ' + j.perioden.length + ' != n ' + j.n);
  var s = 0, letzte = '';
  j.perioden.forEach(function (p) {
    if (!(p.signaltag > letzte)) throw new Error('Signaltage nicht aufsteigend bei ' + p.signaltag);
    letzte = p.signaltag; s += p.netto;
    if (!(p.ausfuehrungstag > p.signaltag)) throw new Error('Ausfuehrung nicht nach dem Signal bei ' + p.signaltag);
  });
  gleich(s / j.perioden.length, j.nettoMittel, 1e-9, 'Mittel netto');
  return j.perioden.length + ' Perioden, Mittel ' + (s / j.perioden.length).toFixed(6) + ' Pp';
});
pruef('T2-P4 Monatszuordnung ist eindeutig: keine zwei Perioden im selben Monat', function () {
  if (!opt.momentum || !fs.existsSync(opt.momentum)) return 'skip';
  var j = JSON.parse(fs.readFileSync(opt.momentum, 'utf8'));
  var m = {}, dop = [];
  j.perioden.forEach(function (p) { if (m[p.monat]) dop.push(p.monat); m[p.monat] = 1; });
  if (dop.length) throw new Error('doppelte Monate: ' + dop.slice(0, 5).join(','));
  return Object.keys(m).length + ' verschiedene Monate, ' + j.perioden[0].monat + ' .. ' + j.perioden[j.perioden.length - 1].monat;
});
pruef('T2-P1 die vier Kandidaten erzeugen 0 Verstoesse der Leck-Sperrklinke', function () {
  if (!opt.kandidaten || !fs.existsSync(opt.kandidaten)) return 'skip';
  var j = JSON.parse(fs.readFileSync(opt.kandidaten, 'utf8'));
  if (!j.kandidaten) return 'skip';
  var schlecht = Object.keys(j.kandidaten).filter(function (k2) { return j.kandidaten[k2].verstoesse > 0 || j.kandidaten[k2].ungueltig; });
  if (schlecht.length) throw new Error('Verstoesse in: ' + schlecht.join(', '));
  if (j.leck && !j.leck.bestanden) throw new Error('die Leck-Probe selbst ist im Teil-2-Lauf gefallen');
  return Object.keys(j.kandidaten).length + ' Laeufe, 0 Verstoesse; Positivkontrolle ' + (j.leck ? j.leck.verstoesseLeck : '-') + ' Verstoesse';
});

process.stdout.write(zeilen.join('\n') + '\n\n');
process.stdout.write('gruen ' + gruen + ', rot ' + rot + ', uebersprungen ' + uebersprungen + '\n');
process.exit(rot ? 1 : 0);

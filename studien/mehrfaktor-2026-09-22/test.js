'use strict';
/* PRUEFUNGEN der Mehrfaktor-Maschine (Auftrag Nr. 48 §2) - nur mit KUNSTFELDERN; kein Feld der Studie wird gemessen.
 *
 * Aufruf:  node --max-old-space-size=6144 test.js [--aus <panelordner>] [--kunst <kunstpanelordner>] [--nur A,B,...]
 *   --aus    Vorgabe: das echte Panel v2.1 (studien/querschnitt-pruefstand-2026-09-13/voll)
 *   --kunst  Vorgabe: das Kunstpanel des Pruefstands (…/kunst) mit der eingepflanzten Kante (Positivkontrolle bekannter Groesse)
 *
 * Jede Pruefung sagt, was sie prueft und woran sie scheitern wuerde; wo eine Null auch aus Untaetigkeit entstehen koennte,
 * steht eine Positivkontrolle daneben. Kunstzellen landen unter pruefung/zellen/ (nie unter zellen/).
 * Die Regressionsklinke (§1a.7) laeuft mit echten Daten, ist aber kein Feld: nur die Gleichheit mit dem Pin wird geprueft,
 * das Ergebnis steht in pruefung/regression.json.
 */
var fs = require('fs');
var path = require('path');
var Z = require('./zelle.js');
var K = Z.K, PR = Z.PR, ST = Z.ST, KONST = Z.KONST;

var A = { aus: KONST.PANEL, kunst: path.join(path.dirname(KONST.PANEL), 'kunst'), nur: null };
for (var ai = 2; ai < process.argv.length; ai++) {
  if (process.argv[ai] === '--aus') A.aus = process.argv[++ai];
  else if (process.argv[ai] === '--kunst') A.kunst = process.argv[++ai];
  else if (process.argv[ai] === '--nur') A.nur = String(process.argv[++ai]).split(',');
}
var ZIEL = path.join(__dirname, 'pruefung', 'zellen'), PRUEFUNG = path.join(__dirname, 'pruefung');
fs.mkdirSync(ZIEL, { recursive: true });

var gruen = 0, rot = 0, uebersprungen = 0, zeilen = [], merk = {};
function pruef(kennung, name, fn) {
  if (A.nur && A.nur.indexOf(kennung) === -1) return;
  var t0 = Date.now();
  try {
    var r = fn();
    if (r === 'skip') { uebersprungen++; zeilen.push('  -  ' + kennung + ' ' + name + ' (uebersprungen)'); }
    else { gruen++; zeilen.push(' OK  ' + kennung + ' ' + name + (r ? ' - ' + r : '') + ' [' + ((Date.now() - t0) / 1000).toFixed(1) + ' s]'); }
  } catch (e) { rot++; zeilen.push('ROT  ' + kennung + ' ' + name + ' - ' + e.message); }
  process.stdout.write(zeilen[zeilen.length - 1] + '\n');
}
function wahr(c, was) { if (!c) throw new Error(was || 'Bedingung verletzt'); }
function gleich(a, b, eps, was) { if (!(Math.abs(a - b) <= eps)) throw new Error((was || '') + ' ' + a + ' != ' + b + ' (eps ' + eps + ')'); }
function panelDa(p) { return fs.existsSync(path.join(p, 'panel', '_stand.json')); }
function zufallFeld(saat) { return function (sym, tag) { return ST.mulberry32(ST.fnv(saat + '|' + sym + '|' + tag))(); }; }
var OPT = { ziel: ZIEL, leise: true, aus: A.aus };

/* =========================================================================================
 * A. Rechenproben ohne Tafel
 * ========================================================================================= */
pruef('A1', 'Rang: Gleichstand = mittlerer Rang (scipy rankdata average), Rangsumme n(n+1)/2', function () {
  var R = Z.raenge([3, 1, 2, 2, 5]);
  wahr(Array.from(R.rang).join() === '4,1,2.5,2.5,5', 'Raenge ' + Array.from(R.rang).join());
  wahr(R.mit === 5 && Array.from(R.fehlt).every(function (x) { return x === 0; }), 'nichts fehlt');
  var R2 = Z.raenge([7, 7, 7, 1]); wahr(Array.from(R2.rang).join() === '3,3,3,1', 'Dreier-Gleichstand ' + Array.from(R2.rang).join());
  var s = 0; for (var i = 0; i < R2.rang.length; i++) s += R2.rang[i]; gleich(s, 10, 1e-12, 'Rangsumme');
  return '4,1,2.5,2.5,5 und 3,3,3,1';
});
pruef('A2', 'Rang mit Luecken: fehlend = exakt (n+1)/2, vorhandene auf 1..n gestreckt, Ordnung und Rangsumme bleiben', function () {
  var R = Z.raenge([NaN, 3, NaN, 1, 2]);                       /* n 5, m 3: r 1,2,3 -> (r-0.5)*5/3+0.5 */
  gleich(R.rang[3], 1 / 3 + 1, 1e-12, 'unterster'); gleich(R.rang[4], 3, 1e-12, 'mittlerer'); gleich(R.rang[1], 14 / 3, 1e-12, 'oberster');
  wahr(R.rang[0] === 3 && R.rang[2] === 3 && R.fehlt[0] === 1 && R.fehlt[2] === 1 && R.mit === 3, 'fehlende exakt (n+1)/2 = 3');
  var s = 0; for (var i = 0; i < 5; i++) s += R.rang[i]; gleich(s, 15, 1e-12, 'Rangsumme 15');
  var R2 = Z.raenge([NaN, 1, 2]);                               /* m gerade: 1.25, 2.75, fehlend 2 */
  gleich(R2.rang[1], 1.25, 1e-12, 'm gerade unten'); gleich(R2.rang[2], 2.75, 1e-12, 'm gerade oben'); wahr(R2.rang[0] === 2, 'fehlend 2');
  var R3 = Z.raenge([NaN, NaN, NaN]); wahr(Array.from(R3.rang).join() === '2,2,2' && R3.mit === 0, 'alles fehlt: alle (n+1)/2');
  var R4 = Z.raenge([4, 4, 4, 4]); wahr(Array.from(R4.rang).join() === '2.5,2.5,2.5,2.5' && R4.mit === 4, 'konstant: alle (n+1)/2, nichts fehlt');
  var n = 1000, w = []; for (var q = 0; q < n; q++) w.push(q % 7 === 0 ? NaN : Math.sin(q) * 100);
  var R5 = Z.raenge(w), su = 0; for (q = 0; q < n; q++) su += R5.rang[q]; gleich(su, n * (n + 1) / 2, 1e-6, 'Rangsumme 1000');
  for (q = 0; q < n; q++) if (w[q] === w[q]) wahr(R5.rang[q] >= 1 && R5.rang[q] <= n, 'im Bereich 1..n');
  return 'n 5/m 3, m gerade, alles fehlt, konstant, n 1000 mit 1/7 Luecken';
});
pruef('A3', 'Dezile ueber den Rangwert: oben Rang > 0,9 n, unten <= 0,1 n; Gleichstand am Rand faellt nicht willkuerlich; konstant = leer', function () {
  var w = []; for (var i = 1; i <= 100; i++) w.push(i);
  var D = Z.dezile(Z.raenge(w));
  wahr(D.oben.length === 10 && D.unten.length === 10, '10/10: ' + D.oben.length + '/' + D.unten.length);
  wahr(D.oben.every(function (q) { return w[q] > 90; }) && D.unten.every(function (q) { return w[q] <= 10; }), 'richtige Mitglieder');
  var w2 = w.slice(); w2[89] = 91;                              /* Werte 91 und 91: Rang 90.5 > 90 => beide oben */
  var D2 = Z.dezile(Z.raenge(w2)); wahr(D2.oben.length === 11, 'Gleichstand am Rand: beide drin, ' + D2.oben.length);
  var w3 = []; for (i = 1; i <= 20; i++) w3.push(i);            /* 0,9 n = 18: Rang 18 ist NICHT oben, 19 und 20 sind es */
  var D3 = Z.dezile(Z.raenge(w3)); wahr(D3.oben.length === 2 && D3.unten.length === 2, 'n 20: 2/2 (' + D3.oben.length + '/' + D3.unten.length + ')');
  var D4 = Z.dezile(Z.raenge([5, 5, 5, 5, 5, 5, 5, 5, 5, 5])); wahr(D4.oben.length === 0 && D4.unten.length === 0, 'konstant: leer');
  var D5 = Z.dezile(Z.raenge([NaN, NaN, NaN, 1, 2])); wahr(D5.oben.length === 0 && D5.unten.length === 0 || true, 'kein Absturz mit Luecken');
  var wl = []; for (i = 0; i < 300; i++) wl.push(i % 3 === 0 ? NaN : i);       /* Abdeckung 2/3: Dezil = 10 % der vorhandenen, Aufgefuellte nie im Dezil */
  var Rl = Z.raenge(wl), Dl = Z.dezile(Rl);
  wahr(Dl.oben.length === 20 && Dl.unten.length === 20, 'Abdeckung 2/3: 20/20 (' + Dl.oben.length + '/' + Dl.unten.length + ')');
  wahr(Dl.oben.concat(Dl.unten).every(function (q) { return !Rl.fehlt[q]; }), 'kein aufgefuelltes Symbol im Dezil');
  return '10/10, Rand 11, n20 2/2, konstant leer, Luecken 20/20';
});
pruef('A4', 'Kombination: Gewichte 1/1 = Rangmittel; fehlendes Feld = mittlerer Rang und Zaehler +1; Kontrollgroesse nicht gewichtet, nur berichtet', function () {
  var sym = ['A', 'B', 'C', 'D', 'E', 'F'];
  function zelle(feld, w1, w2) { return { kennung: 'k', feld: feld, stand: 's', rueckhalte: false, signaltage: [{ tag: '2020-01-02', werte: w1 }, { tag: '2020-02-03', werte: w2 }] }; }
  var za = zelle('a', { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6 }, { A: 6, B: 5, C: 4, D: 3, E: 2, F: 1 });
  var zb = zelle('b', { A: 10, B: 9, C: 8, D: 7, E: 6, F: 5 }, { A: 1, B: null, C: 2, D: 3, E: 4, F: 5 });
  var zc = zelle('c', { A: 100, B: 1, C: 2, D: 3, E: 4, F: 5 }, { A: 1, B: 2, C: 3, D: 4, E: 5, F: 100 });
  var k = Z.kombiniere({ a: za, b: zb, c: zc }, ['a', 'b'], { a: 1, b: 1 }, { kontrollen: ['c'] });
  var t1 = k.signaltage[0].werte;
  sym.forEach(function (s, i) { gleich(t1[s], ((i + 1) + (6 - i)) / 2, 1e-12, 'Tag 1 Rangmittel ' + s); });   /* a aufsteigend, b absteigend: alle 3,5 */
  var t2 = k.signaltage[1].werte;
  /* Tag 2: a-Raenge A..F = 6,5,4,3,2,1; b: B fehlt -> 3,5; vorhandene 1,2,3,4,5 (m 5) gestreckt auf n 6: (r-0.5)*6/5+0.5 */
  function rb(r) { return (r - 0.5) * 6 / 5 + 0.5; }
  gleich(t2.A, (6 + rb(1)) / 2, 1e-12, 'A'); gleich(t2.B, (5 + 3.5) / 2, 1e-12, 'B (aufgefuellt)'); gleich(t2.F, (1 + rb(5)) / 2, 1e-12, 'F');
  wahr(k.signaltage[1].aufgefuellt.B === 1 && k.signaltage[1].aufgefuellt.A === 0 && k.zaehler.auffuellungen.b === 1 && k.zaehler.auffuellungen.a === 0 && k.zaehler.gesamt === 1, 'Zaehler ' + JSON.stringify(k.zaehler));
  wahr(k.signaltage[0].kontrollen.c.A === 6 && k.signaltage[1].kontrollen.c.F === 6 && k.kontrollen.join() === 'c', 'Kontrollrang berichtet');
  var k2 = Z.kombiniere({ a: za, b: zb }, ['a', 'b'], null, {});
  sym.forEach(function (s) { gleich(k2.signaltage[1].werte[s], t2[s], 1e-12, 'ohne Kontrolle gleicher Wert ' + s); });
  var k3 = Z.kombiniere({ a: za, b: zb }, ['a', 'b'], { a: 2, b: 1 }, {});
  gleich(k3.signaltage[1].werte.A, (2 * 6 + rb(1)) / 3, 1e-12, 'Gewichte 2/1');
  wahr(k.gewichte.a === 1 && k.gewichte.b === 1 && k.felder.join() === 'a,b' && k.kennung === KONST.KENNUNG_KOMBINATION && k.quellen.length === 3, 'Kopf');
  return 'Rangmittel, Auffuellung B = 3,5 mit Zaehler 1, Kontrolle c unveraendert, Gewichte 2/1';
});
pruef('A5', 'Kombination wirft bei fremden Signaltagen, fremdem Universum, fehlender Zelle, Kontrolle zugleich gewichtet, anderer Rueckhalte-Flagge', function () {
  function zelle(tag, w, rh) { return { kennung: 'k', feld: 'x', stand: 's', rueckhalte: !!rh, signaltage: [{ tag: tag, werte: w }] }; }
  var a = zelle('2020-01-02', { A: 1, B: 2 }), faelle = [
    [function () { Z.kombiniere({ a: a, b: zelle('2020-01-03', { A: 1, B: 2 }) }, ['a', 'b']); }, /Signaltag/],
    [function () { Z.kombiniere({ a: a, b: zelle('2020-01-02', { A: 1, C: 2 }) }, ['a', 'b']); }, /fehlt am/],
    [function () { Z.kombiniere({ a: a, b: zelle('2020-01-02', { A: 1, B: 2, C: 3 }) }, ['a', 'b']); }, /Universum/],
    [function () { Z.kombiniere({ a: a }, ['a', 'b']); }, /Zelle b fehlt/],
    [function () { Z.kombiniere({ a: a, b: zelle('2020-01-02', { A: 1, B: 2 }) }, ['a', 'b'], null, { kontrollen: ['b'] }); }, /zugleich gewichtet/],
    [function () { Z.kombiniere({ a: a, b: zelle('2020-01-02', { A: 1, B: 2 }, true) }, ['a', 'b']); }, /Rueckhalte/],
    [function () { Z.kombiniere({ a: a }, []); }, /keine gewichteten/],
    [function () { Z.kombiniere({ a: a, b: zelle('2020-01-02', { A: 1, B: 2 }) }, ['a', 'b'], { a: 0 }); }, /Gewicht/],
  ];
  faelle.forEach(function (f, i) { var g = false; try { f[0](); } catch (e) { g = f[1].test(e.message); if (!g) throw new Error('Fall ' + i + ' wirft falsch: ' + e.message); } wahr(g, 'Fall ' + i + ' wirft nicht'); });
  return faelle.length + ' Faelle werfen mit dem richtigen Grund';
});
pruef('A6', 'Schranken und Festwerte kommen aus konfig.js des Pruefstands (Zufall, Orakel, MDE, Klassen, Lag); Rueckhalte ab 2024-09-01', function () {
  wahr(KONST.ZUFALL.schrankePp === K.ZUFALL_SCHRANKE.monat && KONST.ZUFALL.tEinzeln === K.ZUFALL_T_EINZELN && KONST.ZUFALL.ziehungen === K.ZUFALL_ZIEHUNGEN && KONST.ZUFALL.maxFehler === K.ZUFALL_MAX_FEHLER, 'Zufall');
  wahr(KONST.ORAKEL.minPp === K.ORAKEL_PERIODE_MONAT_MIN_PP && KONST.ORAKEL.minSd === K.ORAKEL_MIN_SD && KONST.ORAKEL.tBoden === K.ORAKEL_T_BODEN && KONST.ORAKEL.longShortMinPp === K.TEIL4_ORAKEL.minPp, 'Orakel');
  wahr(KONST.MDE_FAKTOR === K.MDE_FAKTOR && KONST.MDE_FAKTOR === 2.8016, 'MDE-Faktor');
  wahr(KONST.KLASSEN.join() === '1,2,3' && KONST.LAG === 21 && KONST.MIN_VORTAGE === 250 && KONST.MIN_UNIVERSUM === 100, 'Klassen/Lag/Vortage');
  wahr(KONST.RUECKHALTE_AB === '2024-09-01' && KONST.SIGNAL_VON === '2017-01-01' && KONST.SIGNAL_BIS === '2026-08-31' && KONST.PLACEBO_VERSATZ_TAGE === 21, 'Fenster');
  wahr(KONST.FUNDAMENT_MAX_ALTER_TAGE === K.TEIL4_FUNDAMENT_MAX_ALTER_TAGE && KONST.DEZIL === K.DEZIL, 'Leser-Tor/Dezil');
  return 'Zufall ' + KONST.ZUFALL.schrankePp + ' Pp / |t| ' + KONST.ZUFALL.tEinzeln + ', Orakel ' + KONST.ORAKEL.minPp + ' Pp / LS ' + KONST.ORAKEL.longShortMinPp + ' / t ' + KONST.ORAKEL.tBoden + ', MDE x ' + KONST.MDE_FAKTOR;
});

/* =========================================================================================
 * B. Mit der echten Tafel (Kunstfelder, kein Feld der Studie)
 * ========================================================================================= */
var T = null;
function tafel() { if (!panelDa(A.aus)) return null; if (!T) T = Z.tafel(A.aus); return T; }

pruef('B1', 'Tafel laedt (Panel v2.1), SPY-Regime liegt, Ladezeit und RSS werden ausgewiesen', function () {
  var T = tafel(); if (!T) return 'skip';
  wahr(T.stand.kennung === K.PANEL_KENNUNG, 'Kennung ' + T.stand.kennung);
  wahr(T.$regime && Object.keys(T.$regime).length > 1000, 'Regime');
  wahr(T.$ladeSekunden >= 0 && T.g.n > 1e6, 'Zeilen');
  merk.tafel = { sekunden: T.$ladeSekunden, rssMB: process.memoryUsage().rss / 1048576, zeilen: T.g.n, reihen: T.nSym, bis: T.kal.tage[T.maxTag] };
  return T.g.n + ' Zeilen, ' + T.nSym + ' Reihen, bis ' + T.kal.tage[T.maxTag] + ', ' + T.$ladeSekunden.toFixed(1) + ' s, RSS ' + merk.tafel.rssMB.toFixed(0) + ' MB';
});
pruef('B2', 'Signaltage: erster Panel-Handelstag je Monat ab 2017-01; ohne Flagge keiner ab 2024-09-01 (Klinke), mit Flagge bis 2026-08; Periodenende = Ausfuehrungstag des naechsten', function () {
  var T = tafel(); if (!T) return 'skip';
  var s1 = Z.signaltage(T, {}), s2 = Z.signaltage(T, { rueckhalte: true });
  wahr(s1.length > 0 && s1[0].iso === '2017-01-03', 'erster ' + (s1[0] && s1[0].iso));
  s2.forEach(function (s) {
    var vor = s.t - 1; while (vor >= 0 && T.tagVon[vor] < 0) vor--;
    wahr(T.kal.tage[vor].slice(0, 7) !== s.iso.slice(0, 7), s.iso + ' ist nicht der erste Handelstag des Monats');
    wahr(T.kal.tage[s.tNext].slice(0, 7) > s.monat && s.aEnde > s.tNext && T.tagVon[s.aEnde] >= 0, 'Folgemonat/Ende ' + s.iso);
    var zw = s.tNext + 1; while (T.tagVon[zw] < 0) zw++; wahr(zw === s.aEnde, 'aEnde ist der Panel-Handelstag nach tNext');
  });
  wahr(s1.every(function (s) { return s.iso < KONST.RUECKHALTE_AB; }), 'ohne Flagge: kein Signaltag ab ' + KONST.RUECKHALTE_AB);
  wahr(s1[s1.length - 1].iso === '2024-08-01' && s1.rueckhalte === false && s1.zurueckgehalten === 24, 'letzter ohne Flagge ' + s1[s1.length - 1].iso + ', zurueckgehalten ' + s1.zurueckgehalten);
  wahr(s2[s2.length - 1].iso === '2026-08-03' && s2.rueckhalte === true && s2.length === s1.length + 24, 'mit Flagge ' + s2[s2.length - 1].iso + ' (' + s2.length + ')');
  var s3 = Z.signaltage(T, { von: '2020-01-01', bis: '2020-12-31' }); wahr(s3.length === 12 && s3[0].iso === '2020-01-02' && s3[11].iso === '2020-12-01', 'von/bis 2020: ' + s3.length);
  var s4 = Z.signaltage(T, { von: '2024-01-01', bis: '2026-08-31' }); wahr(s4.length === 8 && s4[7].iso === '2024-08-01', 'Klinke greift auch mit eigenem bis: ' + s4.length);
  return s1.length + ' ohne / ' + s2.length + ' mit Flagge, ' + s1[0].iso + ' .. ' + s1[s1.length - 1].iso + ' / ' + s2[s2.length - 1].iso;
});
pruef('B3', 'panelTagNach zaehlt Panel-Handelstage (Placebo-Versatz +21), am Tafelende null', function () {
  var T = tafel(); if (!T) return 'skip';
  var t = Z.signaltage(T, {})[0].t, t21 = Z.panelTagNach(T, t, 21), c = 0;
  for (var tt = t + 1; tt <= t21; tt++) if (T.tagVon[tt] >= 0) c++;
  wahr(c === 21 && T.tagVon[t21] >= 0, '21 Panel-Tage: ' + c);
  wahr(Z.panelTagNach(T, T.maxTag - 3, 21) === null && Z.panelTagNach(T, t, 0) === t, 'Ende null, k=0 identisch');
  return T.kal.tage[t] + ' + 21 = ' + T.kal.tage[t21];
});
pruef('B4', 'Universum je Signaltag: nur Klassen 1-3, nie SPY, Ausfuehrungstag = naechster Handelstag; Zwischenspeicher liefert dasselbe Objekt', function () {
  var T = tafel(); if (!T) return 'skip';
  var s = Z.signaltage(T, {})[30], e = Z.universumAm(T, s, KONST.KLASSEN), spy = T.symIdx.SPY;
  wahr(e.U.liste.length >= KONST.MIN_UNIVERSUM, 'Universum ' + e.U.liste.length);
  e.U.liste.forEach(function (m) { wahr([1, 2, 3].indexOf(m.klasse) >= 0 && m.sym !== spy && m.naechsterTag === e.U.aTag, 'Mitglied ' + T.symName[m.sym]); });
  wahr(e.U.aTag === s.t + 1 || T.tagVon[s.t + 1] < 0, 'Ausfuehrung am naechsten Handelstag');
  wahr(Z.universumAm(T, s, KONST.KLASSEN) === e && e.uni.N === e.U.liste.length && e.uni.tage.length > 15, 'Cache und Universumskorb');
  var e2 = Z.universumAm(T, s, [3]); wahr(e2 !== e && e2.U.liste.every(function (m) { return m.klasse === 3; }) && e2.U.liste.length < e.U.liste.length, 'andere Klassen = anderer Eintrag');
  return s.iso + ': ' + e.U.liste.length + ' Mitglieder, Korb ueber ' + e.uni.tage.length + ' Tage';
});
pruef('B5', 'Werte-Funktion: null bleibt null (NaN intern), Zahl bleibt Zahl; undefined/NaN/Text/Infinity werfen; Zaehler stimmt', function () {
  var T = tafel(); if (!T) return 'skip';
  var s = Z.signaltage(T, {})[0], e = Z.universumAm(T, s, KONST.KLASSEN); s.U = e.U; s.uni = e.uni; s.a = e.U.aTag;
  var w = Z.werteAm(T, s, function (sym) { return sym.charCodeAt(0) % 2 ? null : 0; }, {});
  var nn = 0, nz = 0; for (var i = 0; i < w.werte.length; i++) { if (w.werte[i] !== w.werte[i]) nn++; else if (w.werte[i] === 0) nz++; }
  wahr(nn === w.nNull && nn > 0 && nz > 0 && nn + nz === w.werte.length, 'null/0 getrennt: ' + nn + '/' + nz);
  [function () { return undefined; }, function () { return NaN; }, function () { return '1'; }, function () { return Infinity; }].forEach(function (f, q) {
    var g = false; try { Z.werteAm(T, s, f, {}); } catch (err) { g = /endliche Zahl noch null/.test(err.message); } wahr(g, 'Fall ' + q + ' wirft nicht');
  });
  return nn + ' null, ' + nz + ' Nullen (0) unterschieden; 4 Fehlformen werfen';
});
pruef('B6', 'Sperrklinke: ein Kurs-Zugriff auf t+1 wirft Error("Leck: ..."); ein Bilanz-Zugriff nach dem Signaltag ebenso; die saubere Fassung laeuft', function () {
  var T = tafel(); if (!T) return 'skip';
  var s = Z.signaltage(T, {})[0], e = Z.universumAm(T, s, KONST.KLASSEN); s.U = e.U; s.uni = e.uni; s.a = e.U.aTag;
  var g1 = null; try { Z.werteAm(T, s, function (sym, tag, sicht) { var z = sicht.zeile(sicht.symIdx(sym), sicht.tag + 1); return z >= 0 ? sicht.felder.renditeOC[z] : null; }, {}); } catch (err) { g1 = err.message; }
  wahr(g1 && /^Leck: /.test(g1), 'Kurs-Leck wirft: ' + g1);
  var kunstLeser = { fundamentalAm: function () { return { filed: '2000-01-01', abgeleitet: { fm: 1 } }; } }, g2 = null;
  try { Z.werteAm(T, s, function (sym, tag, sicht) { var f = sicht.fundamentalAm(sym, '2030-01-01'); return f ? f.abgeleitet.fm : null; }, { leser: kunstLeser }); } catch (err) { g2 = err.message; }
  wahr(g2 && /^Leck: /.test(g2) && /fundamentalAm/.test(g2), 'Bilanz-Leck wirft: ' + g2);
  var w = Z.werteAm(T, s, function (sym, tag, sicht) { var z = sicht.zeileAm(sym), f = sicht.fundamentalAm(sym, tag); return z >= 0 && f ? f.abgeleitet.fm + sicht.felder.rendite[z] * 0 : null; }, { leser: kunstLeser });
  wahr(w.verstoesse === 0 && w.zugriffe === s.U.liste.length, 'sauber: 0 Verstoesse, ' + w.zugriffe + ' Bilanzzugriffe');
  return 'Kurs und Bilanz werfen, sauber 0';
});
pruef('B7', 'Kunstfeld LECK durch zelleBauen: die Klinke wirft, es entsteht keine Zelle (nur der Wurf wird erwartet)', function () {
  var T = tafel(); if (!T) return 'skip';
  var g = null, pfad = path.join(ZIEL, 'kunst-leck.json'); if (fs.existsSync(pfad)) fs.unlinkSync(pfad);
  try { Z.zelleBauen('kunst-leck', function (sym, tag, sicht) { var z = sicht.zeile(sicht.symIdx(sym), sicht.tag + 1); return z >= 0 ? sicht.felder.renditeOC[z] : null; }, Object.assign({ kunst: 'leck' }, OPT)); }
  catch (err) { g = err.message; }
  wahr(g && /^Leck: /.test(g), 'wirft: ' + g); wahr(!fs.existsSync(pfad), 'keine Zelle geschrieben');
  return g.slice(0, 90);
});
pruef('B8', 'Kunstfeld ZUFALL: Einzelmessung ~0, Placebos ~0, Zufall bestanden, Orakel gross, Klinke 0 + Positivkontrolle; Zelle im Format §3; Laufzeit und RAM', function () {
  var T = tafel(); if (!T) return 'skip';
  var r = Z.zelleBauen('kunst-zufall', zufallFeld('kunst-zufall'), Object.assign({ kunst: 'zufall', definition: 'Zufallszahl je Symbol und Signaltag (Kunstfeld, fester Generator)', quellen: ['keine'] }, OPT));
  var z = r.zelle, e = z.einzelmessung, n = z.nullpunkt; merk.zufall = r;
  wahr(Math.abs(e.dezilUni.brutto.t) < KONST.ZUFALL.tEinzeln && Math.abs(e.dezilUni.netto.mittel) < 0.5, 'Einzelmessung ~0: t ' + e.dezilUni.brutto.t);
  wahr(n.placebo.versatz.bestanden && n.placebo.symbole.bestanden && n.placebo.zufall.bestanden, 'Placebos');
  wahr(n.orakel.bestanden && n.orakel.brutto >= KONST.ORAKEL.minPp && n.orakel.longShort.brutto >= KONST.ORAKEL.longShortMinPp && n.orakel.t >= KONST.ORAKEL.tBoden, 'Orakel ' + JSON.stringify(n.orakel.tor));
  wahr(n.leck.bestanden && n.leck.klinke.positivkontrolle.kurs === 1 && n.leck.klinke.positivkontrolle.bilanz === 1 && n.bestanden, 'Klinke/Nullpunkt');
  ['kennung', 'feld', 'stand', 'definition', 'signaltage', 'abdeckung', 'nullpunkt', 'einzelmessung', 'quellen'].forEach(function (k) { wahr(z[k] !== undefined, 'Schluessel ' + k); });
  ['orakel', 'placebo', 'leck'].forEach(function (k) { wahr(n[k], 'nullpunkt.' + k); });
  ['brutto', 'netto'].forEach(function (f) { var q = e.dezilUni[f]; ['mittel', 'se', 't', 'mde80', 'n'].forEach(function (k) { wahr(q[k] != null, 'dezilUni.' + f + '.' + k); }); gleich(q.mde80, KONST.MDE_FAKTOR * q.se, 1e-12, 'MDE80'); });
  wahr(e.umschlag.dezil > 0.5 && e.kosten.dezil > 0 && e.kosten.dezil < 0.2, 'Umschlag/Kosten ' + e.umschlag.dezil + '/' + e.kosten.dezil);
  wahr(z.signaltage.length === 92 && z.signaltage.every(function (s) { return s.tag < KONST.RUECKHALTE_AB; }) && z.rueckhalte === false && z.kennung === KONST.KENNUNG, 'Signaltage/Rueckhalte');
  z.signaltage.forEach(function (s) { Object.keys(s.werte).forEach(function (nm) { wahr(typeof s.werte[nm] === 'number', 'Wert ' + nm); }); });
  wahr(z.abdeckung.gesamt.gesamt.anteil === 1 && z.lauf.werteNull === 0, 'volle Abdeckung');
  wahr(e.aufgefuellt.oben === 0 && e.aufgefuellt.unten === 0 && e.perioden === 92, 'keine Auffuellung, 92 Perioden');
  wahr(z.lauf.sekunden > 0 && z.lauf.maxRssMB > 100, 'Laufzeit/RAM');
  wahr(fs.existsSync(r.dateien.zelle) && fs.existsSync(r.dateien.nullpunkt) && fs.existsSync(r.dateien.bericht), 'Dateien');
  var np = JSON.parse(fs.readFileSync(r.dateien.nullpunkt, 'utf8'));
  wahr(np.kennung === KONST.KENNUNG_NULLPUNKT && np.placeboVersatz.signaltage.length === 92 && np.placeboVersatz.signaltage[0].werteVom === T.kal.tage[Z.panelTagNach(T, Z.signaltage(T, {})[0].t, 21)], 'Nullpunkt-Datei mit Versatzwerten vom 21. Handelstag');
  var zj = JSON.parse(fs.readFileSync(r.dateien.zelle, 'utf8'));
  wahr(zj.signaltage.length === 92 && zj.signaltage[5].werte[Object.keys(zj.signaltage[5].werte)[3]] === z.signaltage[5].werte[Object.keys(z.signaltage[5].werte)[3]], 'JSON-Rundlauf');
  return 'brutto ' + e.dezilUni.brutto.mittel.toFixed(4) + ' (t ' + e.dezilUni.brutto.t.toFixed(2) + '), netto ' + e.dezilUni.netto.mittel.toFixed(4) + ', MDE80 ' + e.dezilUni.netto.mde80.toFixed(4) + '; Orakel ' + n.orakel.brutto.toFixed(2) + ' Pp (t ' + n.orakel.t.toFixed(1) + ', LS ' + n.orakel.longShort.brutto.toFixed(1) + '); Zufall se ' + n.placebo.zufall.seEinzelnMittel.toFixed(4) + '; ' + z.lauf.sekunden.toFixed(1) + ' s, RSS max ' + z.lauf.maxRssMB.toFixed(0) + ' MB';
});
pruef('B9', 'Kunstfeld ORAKEL (mit Schluessel): Einzelmessung = eingebautes Orakel auf die letzte Stelle, und gross', function () {
  var T = tafel(); if (!T) return 'skip';
  function orakelFeld(sym, tag, sicht) {
    var g = sicht.felder, i = sicht.symIdx(sym), p = sicht.periode, z1 = sicht.zeile(i, p.a), z2 = sicht.zeile(i, p.aEnde);
    if (z2 < 0) { var le = sicht.tafel.letzteZeile(i); if (le >= 0 && g.tag[le] > p.a && g.tag[le] < p.aEnde) z2 = le; }
    return (z1 >= 0 && z2 >= 0 && g.bEroeffnung[z1] > 0 && g.bEroeffnung[z2] > 0) ? 100 * (g.bEroeffnung[z2] / g.bEroeffnung[z1] - 1) : null;
  }
  var r = Z.zelleBauen('kunst-orakel', orakelFeld, Object.assign({ kunst: 'orakel', schluessel: true, definition: 'kuenftige Rendite Eroeffnung(a) -> Eroeffnung(aEnde) (Kunstfeld mit Orakelschluessel)' }, OPT));
  var e = r.zelle.einzelmessung.dezilUni.brutto, o = r.zelle.nullpunkt.orakel;
  gleich(e.mittel, o.brutto, 0, 'Mittel identisch'); gleich(e.t, o.t, 0, 't identisch'); gleich(r.zelle.einzelmessung.longShort.brutto.mittel, o.longShort.brutto, 0, 'Long-Short identisch');
  wahr(e.mittel >= KONST.ORAKEL.minPp && r.zelle.schluessel === true && r.zelle.kunst === 'orakel', 'gross und gekennzeichnet');
  return 'Dezil-Universum ' + e.mittel.toFixed(4) + ' Pp = Orakel ' + o.brutto.toFixed(4) + ', t ' + e.t.toFixed(1);
});
pruef('B10', 'Kunstfeld KONSTANT: alle Raenge gleich, Dezile leer, kein Absturz, Auffuellung 0; das eingebaute Orakel bleibt gross', function () {
  var T = tafel(); if (!T) return 'skip';
  var r = Z.zelleBauen('kunst-konstant', function () { return 7; }, Object.assign({ kunst: 'konstant', definition: 'konstant 7 (Kunstfeld)' }, OPT));
  var e = r.zelle.einzelmessung;
  wahr(e.dezilMittel === 0 && e.dezilUnten.dezilMittel === 0 && e.dezilUni.brutto.n === 0 && e.dezilUni.brutto.mittel === null, 'Dezile leer: ' + e.dezilMittel + '/' + e.dezilUnten.dezilMittel);
  wahr(e.aufgefuellt.oben === 0 && e.aufgefuellt.unten === 0 && e.mitWertMittel > 100 && r.zelle.abdeckung.gesamt.gesamt.anteil === 1, 'nichts aufgefuellt, alles mit Wert');
  wahr(r.zelle.nullpunkt.orakel.bestanden && r.zelle.nullpunkt.leck.bestanden, 'Orakel/Klinke unabhaengig vom Feld');
  wahr(/KUNSTFELD \(konstant\)/.test(r.bericht) && /## 3\. Nullpunkt/.test(r.bericht), 'Bericht');
  return 'Dezil 0/0, n 0, Orakel ' + r.zelle.nullpunkt.orakel.brutto.toFixed(2) + ' Pp';
});
pruef('B11', 'Kunstfeld mit LUECKEN (jedes dritte Symbol null): null bleibt null und wird nie 0, Abdeckung ~2/3 je Klasse, Dezil = 10 % der Symbole mit Wert, kein Aufgefuellter im Dezil', function () {
  var T = tafel(); if (!T) return 'skip';
  var zf = zufallFeld('kunst-luecken');
  var r = Z.zelleBauen('kunst-luecken', function (sym, tag, sicht) { return (ST.fnv(sym) % 3 === 0) ? null : zf(sym, tag, sicht); }, Object.assign({ kunst: 'luecken', definition: 'Zufall, jedes dritte Symbol null (Kunstfeld)' }, OPT));
  var z = r.zelle, e = z.einzelmessung, nNull = 0, nZahl = 0, n0 = 0;
  z.signaltage.forEach(function (s) { Object.keys(s.werte).forEach(function (nm) { var v = s.werte[nm]; if (v === null) nNull++; else { nZahl++; if (v === 0) n0++; } }); });
  wahr(nNull === z.lauf.werteNull && nNull > 0 && n0 === 0, 'null bleibt null: ' + nNull + ' null, ' + n0 + ' Nullen');
  var a = z.abdeckung.gesamt.gesamt.anteil; wahr(a > 0.6 && a < 0.74, 'Abdeckung ' + a);
  Object.keys(z.abdeckung.jahre).forEach(function (j) { var g = z.abdeckung.jahre[j]; wahr(g.gesamt.anteil > 0.55 && g.gesamt.anteil < 0.78, 'Jahr ' + j + ' ' + g.gesamt.anteil); });
  wahr(e.aufgefuellt.oben === 0 && e.aufgefuellt.unten === 0, 'kein Aufgefuellter im Dezil');
  wahr(Math.abs(e.dezilMittel / e.mitWertMittel - 0.1) < 0.01 && e.dezilMittel < 0.08 * e.universumMittel, 'Dezil = 10 % der Symbole mit Wert: ' + e.dezilMittel + ' von ' + e.mitWertMittel + ' (Universum ' + e.universumMittel + ')');
  wahr(Math.abs(e.dezilUni.brutto.t) < KONST.ZUFALL.tEinzeln && z.nullpunkt.placebo.symbole.bestanden, 'Einzelmessung ~0');
  merk.luecken = r;
  return nNull + ' null / ' + nZahl + ' Zahlen, Abdeckung ' + (100 * a).toFixed(1) + ' %, Dezil ' + e.dezilMittel.toFixed(1) + ' von ' + e.mitWertMittel.toFixed(1) + ' mit Wert';
});
pruef('B12', 'Kombination zweier Kunstzellen durch dieselbe Maschine (messeZelle): laeuft, 92 Perioden, Universen decken sich; eine Zelle allein reproduziert ihre Einzelmessung exakt', function () {
  var T = tafel(); if (!T || !merk.zufall || !merk.luecken) return 'skip';
  var za = merk.zufall.zelle, zb = merk.luecken.zelle;
  var wieder = Z.messeZelle(T, za);
  gleich(wieder.brutto.mittel, za.einzelmessung.dezilUni.brutto.mittel, 0, 'Rundlauf ueber das Zellenformat'); gleich(wieder.netto.t, za.einzelmessung.dezilUni.netto.t, 0, 't');
  wahr(wieder.abgleich.symboleFremd === 0 && wieder.abgleich.symboleFehlend === 0 && wieder.abgleich.ohneTagInZelle === 0, 'Abgleich');
  var k = Z.kombiniere({ 'kunst-zufall': za, 'kunst-luecken': zb }, ['kunst-zufall', 'kunst-luecken'], { 'kunst-zufall': 1, 'kunst-luecken': 1 });
  wahr(k.zaehler.auffuellungen['kunst-luecken'] === zb.lauf.werteNull && k.zaehler.auffuellungen['kunst-zufall'] === 0, 'Auffuellungen = null-Werte der Lueckenzelle');
  var m = Z.messeZelle(T, k);
  wahr(m.perioden === 92 && m.abgleich.symboleFremd === 0 && m.abgleich.symboleFehlend === 0 && Math.abs(m.brutto.t) < 3.5, 'Kombination gemessen: n ' + m.perioden + ', t ' + m.brutto.t);
  /* Das Dezil entsteht ueber den RANG des Kombinationswerts, nicht ueber seinen Betrag: gleich gewichtet erreicht ein Symbol mit
   * einem aufgefuellten von zwei Feldern hoechstens (n + (n+1)/2)/2 ~ 0,75 n, die Dezilschwelle liegt aber bei ~0,72 n - eine
   * Minderheit der Aufgefuellten kommt hinein (gemessen ~8 % des Dezils). Schief gewichtet (1 : 0,01) folgt der Wert dem
   * Zufallsfeld, und das Dezil traegt den Anteil der Lueckenzelle (~1/3). Der Zaehler muss beides zeigen - sonst zaehlt er die
   * lueckenlose Kombination statt ihrer Bestandteile (Fehlerform "ein Dezil aus Auffuellungen ist ein Fund, kein Signal"). */
  var mitgl = 92 * m.dezilMittel, ag = m.aufgefuellt.oben / mitgl;
  wahr(m.aufgefuellt.oben > 0 && ag < 0.25 && m.aufgefuellt.unten > 0, 'gleich gewichtet: Minderheit aufgefuellt, ' + JSON.stringify(m.aufgefuellt) + ' von ' + mitgl.toFixed(0));
  var ks = Z.kombiniere({ 'kunst-zufall': za, 'kunst-luecken': zb }, ['kunst-zufall', 'kunst-luecken'], { 'kunst-zufall': 1, 'kunst-luecken': 0.01 }), ms = Z.messeZelle(T, ks);
  var as = ms.aufgefuellt.oben / (92 * ms.dezilMittel), au = ms.aufgefuellt.unten / (92 * ms.dezilMittel);
  wahr(as > 0.25 && as < 0.42 && au > 0.25 && au < 0.42 && ms.aufgefuellt.oben > m.aufgefuellt.oben, 'schief gewichtet: ~1/3 aufgefuellt, oben ' + as.toFixed(3) + ', unten ' + au.toFixed(3));
  return 'Rundlauf exakt; Kombination n ' + m.perioden + ', brutto ' + m.brutto.mittel.toFixed(4) + ' (t ' + m.brutto.t.toFixed(2) + '); Aufgefuellte im Dezil oben gleich gewichtet ' + (100 * ag).toFixed(1) + ' %, schief ' + (100 * as).toFixed(1) + ' %';
});
pruef('B13', 'Leser-Klinke (echte Fundamentaltafel): filed = tag wirft, filed = tag-1 liefert; ueber sicht.fundamentalAm kommt nur filed < Signaltag', function () {
  var T = tafel(); if (!T) return 'skip';
  var ordner = path.join(path.dirname(K.FUNDAMENTAL_LESER), 'fundamentaltafel'); if (!fs.existsSync(path.join(ordner, '_reihen.json'))) return 'skip';
  var F = Z.leser();
  var g = false; try { F.klinke('AAPL', '2024-05-06', { filed: '2024-05-06', adsh: 'probe' }); } catch (e) { g = /Leck/.test(e.message); }
  wahr(g, 'filed = tag muss werfen');
  var r1 = F.klinke('AAPL', '2024-05-06', { filed: '2024-05-05', adsh: 'probe' }); wahr(r1 && r1.filed === '2024-05-05', 'filed = tag-1 liefert');
  var s = Z.signaltage(T, {})[60], e = Z.universumAm(T, s, KONST.KLASSEN); s.U = e.U; s.uni = e.uni; s.a = e.U.aTag;
  var geliefert = 0, ohne = 0;
  var w = Z.werteAm(T, s, function (sym, tag, sicht) { var f = sicht.fundamentalAm(sym, tag); if (!f) { ohne++; return null; } wahr(f.filed < tag, 'filed ' + f.filed + ' < ' + tag); geliefert++; return f.abgeleitet && typeof f.abgeleitet.fm === 'number' && isFinite(f.abgeleitet.fm) ? f.abgeleitet.fm : null; }, {});
  wahr(geliefert > 0.6 * s.U.liste.length && w.verstoesse === 0, 'geliefert ' + geliefert + ' von ' + s.U.liste.length);
  return F.kennung + ': ' + geliefert + ' geliefert, ' + ohne + ' ohne Filing am ' + s.iso;
});
pruef('B14', 'Regressionsklinke (§1a.7): Momentum 12-1 des Pruefstands, Klassen [2,3], trifft K.REGRESSION23_ERWARTET auf 1e-9 -> pruefung/regression.json', function () {
  var T = tafel(); if (!T) return 'skip';
  var r = Z.regression(T);
  fs.writeFileSync(path.join(PRUEFUNG, 'regression.json'), JSON.stringify(r, null, 1));
  wahr(r.erwartet != null, 'kein Pin fuer ' + r.panel); gleich(r.gemessen, r.erwartet, 1e-9, 'Pin'); wahr(r.gleich === true, 'gleich');
  return 'gemessen ' + r.gemessen + ' = Pin ' + r.erwartet + ' (' + r.panel + ')';
});

pruef('B15', 'Kombination als Zelle (zelleAusKombination): voller Nullpunkt ohne Versatz, Auffuellungen je Dezil wie messeZelle, Einzelmessung identisch', function () {
  var T = tafel(); if (!T || !merk.zufall || !merk.luecken) return 'skip';
  var za = merk.zufall.zelle, zb = merk.luecken.zelle;
  var k = Z.kombiniere({ 'kunst-zufall': za, 'kunst-luecken': zb }, ['kunst-zufall', 'kunst-luecken'], null, { kontrollen: [] });
  var r = Z.zelleAusKombination(k, Object.assign({ feld: 'kunst-kombination' }, OPT)), m = Z.messeZelle(T, k), e = r.zelle.einzelmessung;
  gleich(e.dezilUni.brutto.mittel, m.brutto.mittel, 0, 'Mittel wie messeZelle'); gleich(e.dezilUni.netto.t, m.netto.t, 0, 't');
  wahr(e.aufgefuellt.oben === m.aufgefuellt.oben && e.aufgefuellt.unten === m.aufgefuellt.unten && e.aufgefuellt.oben > 0, 'Auffuellungen je Dezil ' + JSON.stringify(e.aufgefuellt));
  var n = r.zelle.nullpunkt;
  wahr(n.placebo.versatz.bestanden === null && /Feldzellen/.test(n.placebo.versatz.uebersprungen), 'Versatz uebersprungen');
  wahr(n.orakel.bestanden && n.placebo.symbole.bestanden && n.placebo.zufall.bestanden && n.leck.bestanden && n.bestanden === true, 'uebrige Kontrollen und Gesamturteil');
  wahr(r.zelle.kunst === 'kombination-aus-kunstzellen' && /Kombinationsrang/.test(r.zelle.definition) && r.zelle.quellen.length === 2 && /Placebo 1 [^|]*\| übersprungen: /.test(r.bericht), 'Kennzeichnung, Quellen, Bericht');
  var np = JSON.parse(fs.readFileSync(r.dateien.nullpunkt, 'utf8')); wahr(np.placeboVersatz.urteil.bestanden === null && !np.placeboVersatz.signaltage, 'Nullpunkt-Datei ohne Versatzwerte');
  return 'brutto ' + e.dezilUni.brutto.mittel.toFixed(4) + ' (t ' + e.dezilUni.brutto.t.toFixed(2) + '), Aufgefuellte oben/unten ' + e.aufgefuellt.oben + '/' + e.aufgefuellt.unten + ', Nullpunkt ' + n.bestanden;
});
pruef('B16', 'Kommandozeile: node zelle.js --feld <modul> baut die Zelle aus einem Feldmodul (Muster pruefung/kunstfeld-zufall.js); ohne --feld Abbruch mit Hinweis', function () {
  if (!panelDa(A.aus)) return 'skip';
  var cp = require('child_process'), modul = path.join(PRUEFUNG, 'kunstfeld-zufall.js'), zelle = path.join(ZIEL, 'kunst-zufall-modul.json');
  if (fs.existsSync(zelle)) fs.unlinkSync(zelle);
  var r = cp.spawnSync(process.execPath, ['--max-old-space-size=6144', path.join(__dirname, 'zelle.js'), '--feld', modul, '--ziel', ZIEL, '--aus', A.aus], { cwd: __dirname, encoding: 'utf8', maxBuffer: 1 << 26 });
  wahr(r.status === 0 && /Nullpunkt bestanden/.test(r.stdout), 'Lauf: Status ' + r.status + ' ' + (r.stderr || '').slice(0, 300));
  var z = JSON.parse(fs.readFileSync(zelle, 'utf8'));
  wahr(z.feld === 'kunst-zufall-modul' && z.kunst === 'zufall' && z.rueckhalte === false && z.signaltage.length === 92 && /Kunstfeld/.test(z.definition), 'Zelle aus dem Modul');
  var r2 = cp.spawnSync(process.execPath, [path.join(__dirname, 'zelle.js')], { cwd: __dirname, encoding: 'utf8' });
  wahr(r2.status === 2 && /--feld/.test(r2.stderr), 'ohne --feld: Status 2 mit Hinweis');
  return 'Zelle ' + z.feld + ' mit ' + z.signaltage.length + ' Signaltagen, Nullpunkt ' + z.nullpunkt.bestanden;
});

/* =========================================================================================
 * C. Kunstpanel mit eingepflanzter Kante bekannter Groesse (Positivkontrolle auf eine KLEINE Kante)
 * ========================================================================================= */
pruef('C1', 'Kunstpanel: Feld theta_s findet die eingepflanzte Kante ab 2020 in der vorhergesagten Groesse (aus den gehaltenen Mitgliedern), davor nichts', function () {
  if (!panelDa(A.kunst)) return 'skip';
  var KP = require(path.join(path.dirname(KONST.PANEL), 'kunstpanel.js'));
  var TK = Z.tafel(A.kunst), tage = Z.signaltage(TK, {});
  tage.forEach(function (s) { var e = Z.universumAm(TK, s, KONST.KLASSEN); s.U = e.U; s.uni = e.uni; s.a = e.U.aTag; });
  var werte = tage.map(function (s) { return Z.werteAm(TK, s, function (sym) { return KP.theta(sym); }, {}).werte; });
  var L = Z.lauf(TK, tage, werte), a = Z.auswertung(TK, L, tage);
  var kanteAb = null; for (var ki = 0; ki < TK.kal.tage.length; ki++) if (TK.kal.tage[ki] >= KP.KANTE_AB) { kanteAb = ki; break; }
  function sollUndIst(nurAb) {
    var soll = 0, ist = 0, n = 0;
    L.perioden.forEach(function (p, i) {
      if (nurAb ? !(p.t >= kanteAb) : !(p.t < kanteAb)) return;
      var tl = 0; p.long.mitglieder.forEach(function (s) { tl += KP.theta(TK.symName[s]); }); tl /= p.long.mitglieder.length;
      var tu = 0; p.uni.mitglieder.forEach(function (s) { tu += KP.theta(TK.symName[s]); }); tu /= p.uni.mitglieder.length;
      soll += KP.KANTE_PP * (tl - tu) * p.long.tage.length; ist += a.perioden_reihe[i].brutto; n++;
    });
    return { soll: soll / n, ist: ist / n, n: n };
  }
  var ab = sollUndIst(true), vor = sollUndIst(false);
  wahr(ab.n >= 40 && vor.n >= 30, 'Perioden mit/ohne Kante ' + ab.n + '/' + vor.n);
  wahr(ab.soll > 1, 'Soll ab 2020 ' + ab.soll.toFixed(3) + ' Pp je Monat (Positivkontrolle - ein Soll nahe null pruefte nichts)');
  wahr(Math.abs(ab.ist - ab.soll) < 0.25 * ab.soll + 0.3, 'gemessen ' + ab.ist.toFixed(3) + ' gegen Soll ' + ab.soll.toFixed(3));
  var vorT = Z.PR.kennzahlen(a.perioden_reihe.filter(function (p, i) { return L.perioden[i].t < kanteAb; }), null, KONST.LAG, 'brutto');
  wahr(Math.abs(vorT.t) < 3, 'vor 2020 ' + vorT.mittel.toFixed(3) + ' Pp (t ' + vorT.t.toFixed(2) + ') - waere sie hier auch gross, misst die Maschine theta statt der Kante');
  /* 300 Kunstreihen, davon faellt ein Teil am Cent-Boden der Klasse (Kurse 5-65 $) - Universum ~178, Dezil ~18. */
  wahr(a.universumMittel >= KONST.MIN_UNIVERSUM && a.dezilMittel >= 10, 'Universum ' + a.universumMittel + ', Dezil ' + a.dezilMittel);
  return 'ab 2020 gemessen ' + ab.ist.toFixed(3) + ' / Soll ' + ab.soll.toFixed(3) + ' Pp je Monat (n ' + ab.n + '), davor ' + vorT.mittel.toFixed(3) + ' (t ' + vorT.t.toFixed(2) + ', n ' + vor.n + ')';
});

process.stdout.write('\n' + gruen + ' Pruefungen gruen, ' + rot + ' rot, ' + uebersprungen + ' uebersprungen\n');
var lauf = { stand: new Date().toISOString(), aus: A.aus, kunst: A.kunst, gruen: gruen, rot: rot, uebersprungen: uebersprungen, node: process.version,
  tafel: merk.tafel || null, zufallLauf: merk.zufall ? merk.zufall.zelle.lauf : null, zeilen: zeilen };
fs.writeFileSync(path.join(PRUEFUNG, 'test-lauf.json'), JSON.stringify(lauf, null, 1));
process.exit(rot ? 1 : 0);

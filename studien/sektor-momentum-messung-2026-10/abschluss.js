'use strict';
/* Messung Sektor-Momentum: Abschluss nach dem einen Lauf (aendert keine Zahl).
 * 1. Vergleicht den Simulator (ergebnis.json aus lauf.js) mit dem zweiten Rechner (zweitrechner.json aus zweitrechner.js --lauf) fuer k = 0
 *    in A und B, Kandidat und Placebo (ZUSATZ §6): Endwerte auf den Cent, jede Umschichtung (Tag, Stichtag, Ziel, Stueckzahlen, Bargeld),
 *    jeder Tageswert (Buch, SPY, Bargeld), jede Periode. Schreibt vergleich-rechner.json.
 * 2. Entfernt danach die Tageswert-Reihen aus ergebnis.json und zweitrechner.json: sie sind eine unmittelbare Umformung der Yahoo-Kurse
 *    (Daten Dritter, oeffentliches Repo; die frueheren Studien committen keine Tagesreihen). Alles andere bleibt. Wer die Reihen braucht,
 *    faehrt lauf.js und zweitrechner.js --lauf neu (gleiche Rohdaten per pruefsummen.json).
 *   node studien/sektor-momentum-messung-2026-10/abschluss.js        (nur auf frischen, ungekuerzten Ausgaben) */
var fs = require('fs');
var path = require('path');

var DE = path.join(__dirname, 'ergebnis.json'), DZ = path.join(__dirname, 'zweitrechner.json');
var E = JSON.parse(fs.readFileSync(DE, 'utf8')), Z = JSON.parse(fs.readFileSync(DZ, 'utf8'));
if (E.gekuerzt || Z.gekuerzt) throw new Error('Ausgaben sind schon gekuerzt - erst lauf.js und zweitrechner.js --lauf neu fahren');
if (!E.vollstaendig) throw new Error('ergebnis.json ist nicht vollstaendig');

function cent(x) { return Math.round(x * 100); }
var PAARE = [['A', 'kandidat', 'A-regel'], ['A', 'placebo', 'A-placebo'], ['B', 'kandidat', 'B-regel'], ['B', 'placebo', 'B-placebo']];
var V = { kennung: E.kennung, erzeugt: new Date().toISOString(), gitHeadLauf: E.gitHead, regel: 'ZUSATZ §6: Endwerte von Buch und SPY auf den Cent gleich', laeufe: {}, bestanden: true };

PAARE.forEach(function (p) {
  var X = E.fenster[p[0]][p[1]], Y = Z.laeufe[p[2]];
  var U = X.umschichtungen, W = Y.umschichtungen, T = X.tageswerte.werte, Q = Y.tageswerte;
  var v = { buchSimulator: X.haupt.buchEnde, buchZweitrechner: Y.endwertBuch, spySimulator: X.haupt.spyEnde, spyZweitrechner: Y.endwertSpy,
    buchGleichAufCent: cent(X.haupt.buchEnde) === cent(Y.endwertBuch), spyGleichAufCent: cent(X.haupt.spyEnde) === cent(Y.endwertSpy),
    umschichtungen: [U.length, W.length], umschichtungenAbweichend: 0, stueckMaxAbweichung: 0, bargeldMaxAbweichung: 0,
    tage: [T.length, Q.length], tageDatumAbweichend: 0, tageBuchMaxAbweichung: 0, tageSpyMaxAbweichung: 0, tageBargeldMaxAbweichung: 0,
    perioden: [X.perioden.length, Y.perioden.length], periodenBuchMaxAbweichungPp: 0, periodenSpyMaxAbweichungPp: 0 };
  for (var i = 0; i < Math.max(U.length, W.length); i++) {
    var u = U[i], w = W[i];
    if (!u || !w || u.ausfuehrungstag !== w.ausfuehrungstag || u.stichtag !== w.stichtag || u.ziel.join() !== w.ziel.join()) { v.umschichtungenAbweichend++; continue; }
    var namen = {};
    Object.keys(u.bestand).concat(Object.keys(w.stueckNachHandel)).forEach(function (s) { namen[s] = true; });
    Object.keys(namen).forEach(function (s) { v.stueckMaxAbweichung = Math.max(v.stueckMaxAbweichung, Math.abs((u.bestand[s] || 0) - (w.stueckNachHandel[s] || 0))); });
    v.bargeldMaxAbweichung = Math.max(v.bargeldMaxAbweichung, Math.abs(u.bargeldDanach - w.bargeld));
  }
  for (var j = 0; j < Math.max(T.length, Q.length); j++) {
    var t = T[j], q = Q[j];
    if (!t || !q || t[0] !== q.datum) { v.tageDatumAbweichend++; continue; }
    v.tageBuchMaxAbweichung = Math.max(v.tageBuchMaxAbweichung, Math.abs(t[1] - q.buch));
    v.tageSpyMaxAbweichung = Math.max(v.tageSpyMaxAbweichung, Math.abs(t[2] - q.spy));
    v.tageBargeldMaxAbweichung = Math.max(v.tageBargeldMaxAbweichung, Math.abs(t[3] - q.bargeld));
  }
  for (var k = 0; k < Math.min(X.perioden.length, Y.perioden.length); k++) {
    var a = X.perioden[k], b = Y.perioden[k];
    if (a.ausfuehrungstag !== b.ausfuehrungstag) { v.umschichtungenAbweichend++; continue; }
    var bb = (b.buchEnde / b.buchAnfang - 1) * 100, bs = (b.spyEnde / b.spyAnfang - 1) * 100;      /* zweitrechner.json: buchAnfang/buchEnde je Periode */
    v.periodenBuchMaxAbweichungPp = Math.max(v.periodenBuchMaxAbweichungPp, Math.abs(a.buch - bb));
    v.periodenSpyMaxAbweichungPp = Math.max(v.periodenSpyMaxAbweichungPp, Math.abs(a.spy - bs));
  }
  if (!(isFinite(v.periodenBuchMaxAbweichungPp) && isFinite(v.periodenSpyMaxAbweichungPp))) throw new Error('KLINKE: Periodenvergleich nicht berechenbar (' + p[2] + ')');
  v.bestanden = v.buchGleichAufCent && v.spyGleichAufCent && v.umschichtungenAbweichend === 0 && U.length === W.length && v.tageDatumAbweichend === 0 &&
    T.length === Q.length && X.perioden.length === Y.perioden.length;
  if (!v.bestanden) V.bestanden = false;
  V.laeufe[p[2]] = v;
  console.log(p[2] + ': Buch ' + X.haupt.buchEnde.toFixed(2) + ' / ' + Y.endwertBuch.toFixed(2) + ', SPY ' + X.haupt.spyEnde.toFixed(2) + ' / ' + Y.endwertSpy.toFixed(2) +
    ', Umschichtungen abweichend ' + v.umschichtungenAbweichend + ', Tage: max |dBuch| ' + v.tageBuchMaxAbweichung + ' -> ' + (v.bestanden ? 'gleich' : 'ABWEICHUNG'));
});
fs.writeFileSync(path.join(__dirname, 'vergleich-rechner.json'), JSON.stringify(V, null, 1) + '\n');
if (!V.bestanden) throw new Error('Die beiden Rechner stimmen nicht ueberein - nichts gekuerzt, Ursache suchen (ZUSATZ §6)');

/* 2. Tagesreihen entfernen */
var weg = 0;
['A', 'B'].forEach(function (f) { ['kandidat', 'placebo'].forEach(function (m) { if (E.fenster[f][m].tageswerte) { weg += E.fenster[f][m].tageswerte.werte.length; delete E.fenster[f][m].tageswerte; } }); });
E.gekuerzt = 'Tageswert-Reihen (fenster.*.*.tageswerte, ' + weg + ' Zeilen) nach dem Vergleich der Rechner entfernt (abschluss.js): Umformung der Yahoo-Kurse, Daten Dritter. Reproduzierbar mit lauf.js.';
fs.writeFileSync(DE, JSON.stringify(E, null, 1));
var wegZ = 0;
Object.keys(Z.laeufe).forEach(function (n) { if (Z.laeufe[n].tageswerte) { wegZ += Z.laeufe[n].tageswerte.length; delete Z.laeufe[n].tageswerte; } });
Z.gekuerzt = 'Tageswert-Reihen (laeufe.*.tageswerte, ' + wegZ + ' Zeilen) nach dem Vergleich entfernt (abschluss.js): Umformung der Yahoo-Kurse, Daten Dritter. Reproduzierbar mit zweitrechner.js --lauf.';
fs.writeFileSync(DZ, JSON.stringify(Z, null, 1));
console.log('vergleich-rechner.json geschrieben; Tagesreihen entfernt: ergebnis.json ' + weg + ', zweitrechner.json ' + wegZ + ' Zeilen');

/* 3. rollierend.json: je Fenster nur noch Start, Ende und die Abstaende p. a. (Kandidat - SPY, Placebo - SPY, Kandidat - Placebo) statt der
 *    Endwerte - die SPY-Endwerte je Starttag waeren wieder fast eine Kursreihe. "vorn" (Endwert groesser) ist bei gleicher Dauer gleichbedeutend
 *    mit Abstand > 0; die Zusammenfassung (Anteil vorn, Median, 10-%/90-%-Punkt, schlechtestes/bestes Fenster) steht vollstaendig in ergebnis.json. */
var DR = path.join(__dirname, 'rollierend.json'), RO = JSON.parse(fs.readFileSync(DR, 'utf8'));
if (RO.gekuerzt) throw new Error('rollierend.json ist schon gekuerzt');
var sp = RO.spalten, ix = function (n) { var i = sp.indexOf(n); if (i < 0) throw new Error('rollierend.json: Spalte ' + n + ' fehlt'); return i; };
var iS = ix('start'), iE = ix('ende'), iK = ix('kandidatEnde'), iP = ix('placeboEnde'), iY = ix('spyEnde'), iKp = ix('kandidatPa'), iPp = ix('placeboPa'), iYp = ix('spyPa'), iZ = ix('zuWenigTage');
var R2 = { kennung: RO.kennung, gekuerzt: 'abschluss.js: Endwerte entfernt (Daten Dritter), nur Abstaende p. a. in Pp, auf 4 Stellen gerundet; vorn = Abstand > 0 (bei gleichstand der Endwerte nicht vorn)',
  spalten: ['start', 'ende', 'kandidatMinusSpyPp', 'placeboMinusSpyPp', 'kandidatMinusPlaceboPp', 'kandidatVorSpy', 'placeboVorSpy', 'kandidatVorPlacebo', 'zuWenigTage'] };
var r4 = function (x) { return Math.round(x * 10000) / 10000; };
Object.keys(RO).forEach(function (n) {
  if (!RO[n] || !RO[n].zeilen) return;
  R2[n] = { start: RO[n].start, fenster: RO[n].fenster, zeilen: RO[n].zeilen.map(function (z) {
    var kv = z[iK] > z[iY], pv = z[iP] > z[iY], kp = z[iK] > z[iP];
    if (kv !== (z[iKp] - z[iYp] > 0) || pv !== (z[iPp] - z[iYp] > 0) || kp !== (z[iKp] - z[iPp] > 0)) throw new Error('KLINKE: vorn und Abstand passen nicht zusammen (' + n + ' ' + z[iS] + ')');
    return [z[iS], z[iE], r4(z[iKp] - z[iYp]), r4(z[iPp] - z[iYp]), r4(z[iKp] - z[iPp]), kv ? 1 : 0, pv ? 1 : 0, kp ? 1 : 0, z[iZ]];
  }) };
});
fs.writeFileSync(DR, JSON.stringify(R2));
console.log('rollierend.json gekuerzt: ' + Object.keys(R2).filter(function (n) { return R2[n] && R2[n].zeilen; }).map(function (n) { return n + ' ' + R2[n].zeilen.length; }).join(', '));

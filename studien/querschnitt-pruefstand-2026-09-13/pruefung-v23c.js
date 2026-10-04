'use strict';
/* PRUEFUNG v2.3, Bau 2c (Auftrag Nr. 92, Schritt 2c) - Kernpruefung voll-v23c/ (Bau 2c) gegen voll-v23/ (Bau 2b, unveraendert).
 * Unabhaengig von panel-v23c.js: liest nur die zwei Panels, die Liste (liste-v23c.json, nur die Namen) und die Lebenszeit.
 *   (a) Reihen der Liste: jede Zeile von Bau 2b (alle enden 2026-09-03) hat in Bau 2c eine Zeile am selben Tag, in ALLEN Spalten
 *       bytegleich; einzige zugelassene Abweichung: am alten letzten Tag fehlt in 2c die Marke LETZTER_TAG (die Reihe laeuft weiter),
 *       sonst nichts. Neue Zeilen nach dem alten Ende: Zahl je Reihe, jeder Handelstag des Kalenders bis zum letzten Panel-Tag
 *       vorhanden, letzte Zeile mit LETZTER_TAG, groesste Tagesrendite (Skalenprobe).
 *   (b) Alle uebrigen Zeilen: in Dateireihenfolge bytegleich zu Bau 2b in ALLEN 12 Spalten (auch sym - die Symboltabelle ist gleich).
 *   (c) Symboltabelle: gleiche Namen in gleicher Reihenfolge; Eintraege ausserhalb der Liste unveraendert; die Liste: lebend 1,
 *       ende_grund und ende_datum leer, sonst = Bau 2b bis auf lebend_v22/lebend_weg (entfallen) und v23c (neu).
 *   (d) Probe auf doppelte Abschnitte (doppelte-v23.js) auf Bau 2c: 0.
 *   (e) Stand: Kennung v2.3, bau '2c', letzter voller Tag wie Bau 2b, Zeilen, Jahre und zeilenJeTag aus den Dateien; alle uebrigen
 *       Felder = Bau 2b.
 * Jahresdatei fuer Jahresdatei gelesen. NUR LESEN.
 * Aufruf:  node pruefung-v23c.js [--aus pruefung-v23c.json]      Rueckgabewert 0 = bestanden, 1 = nicht bestanden.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var P = require('./paneldaten.js');
var DV = require('./doppelte-v23.js');

var A = { aus: path.join(__dirname, 'pruefung-v23c.json') };
for (var ai = 2; ai < process.argv.length; ai++) if (process.argv[ai] === '--aus') A.aus = process.argv[++ai];
var LEBENSZEIT = 'E:/Markt-Dashboard-Archiv/alpaca1m-ableitungen/lebenszeit-minuten.json';
var ALTES_ENDE = '2026-09-03';
var t0 = Date.now(), gruende = [], spitze = 0;
function sag(s) { process.stdout.write(s + '\n'); }
function muss(ok, text) { if (!ok) gruende.push(text); return ok; }
function bytes(a) { return new Uint8Array(a.buffer, a.byteOffset, a.byteLength); }
var OB = path.join(__dirname, 'voll-v23', 'panel'), OC = path.join(__dirname, 'voll-v23c', 'panel');
var SB = JSON.parse(fs.readFileSync(path.join(OB, '_stand.json'), 'utf8'));
var SC = JSON.parse(fs.readFileSync(path.join(OC, '_stand.json'), 'utf8'));
var LI = JSON.parse(fs.readFileSync(path.join(__dirname, 'liste-v23c.json'), 'utf8'));
muss(SB.kennung === K.PANEL_KENNUNG_V23 && SB.bau === '2b', 'voll-v23 ist nicht Bau 2b');
var nameB = SB.symbole.map(function (e) { return e.reihe; }), nameC = SC.symbole.map(function (e) { return e.reihe; });
muss(nameB.length === nameC.length && nameB.every(function (n, i) { return nameC[i] === n; }), 'Symboltabellen: Namen/Reihenfolge verschieden');
var inL = new Uint8Array(nameB.length), idx = {};
nameB.forEach(function (n, i) { idx[n] = i; });
LI.namen.forEach(function (n) { if (idx[n] === undefined) gruende.push('Liste nennt unbekannte Reihe ' + n); else inL[idx[n]] = 1; });
sag('Liste: ' + LI.namen.length + ' Reihen');

/* ---------- (a)/(b) Jahr fuer Jahr ---------- */
var SPA = P.SPALTEN.map(function (s) { return s.name; });
var Z = { zeilenB: 0, zeilenC: 0, uebrigeVerglichen: 0, uebrigeAnders: 0, uebrigeAndersJeSpalte: {}, listeB: 0, listeVerglichen: 0, listeGleich: 0, listeNurMarke: [], listeAnders: 0, listeAndersJeSpalte: {},
  listeFehltInC: 0, neu: 0, jahre: [] };
var BEISPIELE = [], neuJe = {}, letzteB = {}, letzteC = {}, maxRendNeu = {}, neuMarkenLetzter = {};
function beispiel(o) { if (BEISPIELE.length < 40) BEISPIELE.push(o); }
SB.jahre.forEach(function (jj, k) {
  muss(SC.jahre[k] && SC.jahre[k].jahr === jj.jahr, 'Jahresliste verschieden bei ' + jj.jahr);
  var b = P.leseBlock(path.join(OB, jj.jahr + '.bin'), K.PANEL_KENNUNG_V23), c = P.leseBlock(path.join(OC, jj.jahr + '.bin'), K.PANEL_KENNUNG_V23);
  var BB = {}, BC = {}, W = {};
  SPA.forEach(function (nm) { BB[nm] = bytes(b[nm]); BC[nm] = bytes(c[nm]); W[nm] = b[nm].BYTES_PER_ELEMENT; });
  function diff(i, j) {
    var d = [];
    for (var q = 0; q < SPA.length; q++) { var nm = SPA[q], w = W[nm], x = i * w, y = j * w; for (var u = 0; u < w; u++) if (BB[nm][x + u] !== BC[nm][y + u]) { d.push(nm); break; } }
    return d;
  }
  /* Zeilen der Liste in Bau 2b: sym -> tag -> Zeile */
  var lb = {};
  for (var i = 0; i < b.n; i++) if (inL[b.sym[i]]) { (lb[b.sym[i]] = lb[b.sym[i]] || {})[b.tag[i]] = i; Z.listeB++; if (!(b.tag[i] <= letzteB[b.sym[i]])) letzteB[b.sym[i]] = b.tag[i]; }
  /* (b) uebrige Zeilen in Dateireihenfolge; (a) Zeilen der Liste je (sym, tag) */
  var ib = 0, gesehen = {};
  for (var j = 0; j < c.n; j++) {
    var s = c.sym[j];
    if (inL[s]) {
      if (!(c.tag[j] <= letzteC[s])) letzteC[s] = c.tag[j];
      var a = lb[s] && lb[s][c.tag[j]];
      if (a === undefined) {
        Z.neu++; neuJe[nameC[s]] = (neuJe[nameC[s]] || []); neuJe[nameC[s]].push(SC.tage[c.tag[j]]);
        if (Math.abs(c.rendite[j]) > (maxRendNeu[nameC[s]] || 0) || c.rendite[j] !== c.rendite[j]) maxRendNeu[nameC[s]] = c.rendite[j] !== c.rendite[j] ? NaN : Math.abs(c.rendite[j]);
        neuMarkenLetzter[nameC[s]] = c.marken[j] & K.M_LETZTER_TAG;
        continue;
      }
      gesehen[s + '|' + c.tag[j]] = 1; Z.listeVerglichen++;
      var d = diff(a, j);
      if (!d.length) { Z.listeGleich++; continue; }
      if (d.length === 1 && d[0] === 'marken' && SB.tage[c.tag[j]] === ALTES_ENDE && b.marken[a] === (c.marken[j] | K.M_LETZTER_TAG) && !(c.marken[j] & K.M_LETZTER_TAG)) { Z.listeNurMarke.push(nameC[s] + ' ' + ALTES_ENDE); continue; }
      Z.listeAnders++; d.forEach(function (nm) { Z.listeAndersJeSpalte[nm] = (Z.listeAndersJeSpalte[nm] || 0) + 1; });
      beispiel({ art: 'liste', jahr: jj.jahr, reihe: nameC[s], tag: SC.tage[c.tag[j]], spalten: d });
      continue;
    }
    while (ib < b.n && inL[b.sym[ib]]) ib++;
    if (ib >= b.n) { Z.uebrigeAnders++; beispiel({ art: 'nurInC', jahr: jj.jahr, zeileC: j }); continue; }
    Z.uebrigeVerglichen++;
    var d2 = diff(ib, j);
    if (d2.length) { Z.uebrigeAnders++; d2.forEach(function (nm) { Z.uebrigeAndersJeSpalte[nm] = (Z.uebrigeAndersJeSpalte[nm] || 0) + 1; }); beispiel({ art: 'uebrige', jahr: jj.jahr, zeileB: ib, zeileC: j, spalten: d2 }); }
    ib++;
  }
  while (ib < b.n && inL[b.sym[ib]]) ib++;
  if (ib < b.n) { Z.uebrigeAnders += b.n - ib; beispiel({ art: 'nurInB', jahr: jj.jahr, ab: ib }); }
  Object.keys(lb).forEach(function (s) { Object.keys(lb[s]).forEach(function (t) { if (!gesehen[s + '|' + t]) { Z.listeFehltInC++; beispiel({ art: 'listeFehltInC', reihe: nameB[s], tag: SB.tage[t] }); } }); });
  /* Ordnung (tag, sym) in 2c */
  var ordnung = 0; for (var q = 1; q < c.n; q++) if (c.tag[q] < c.tag[q - 1] || (c.tag[q] === c.tag[q - 1] && c.sym[q] <= c.sym[q - 1])) ordnung++;
  muss(ordnung === 0, jj.jahr + ': ' + ordnung + ' Zeilen ausser (tag, sym)-Ordnung');
  Z.zeilenB += b.n; Z.zeilenC += c.n; Z.jahre.push({ jahr: jj.jahr, b: b.n, c: c.n });
  spitze = Math.max(spitze, process.memoryUsage().rss);
});
muss(Z.uebrigeAnders === 0 && Z.uebrigeVerglichen === Z.zeilenB - Z.listeB, '(b) uebrige Zeilen: ' + Z.uebrigeAnders + ' anders, verglichen ' + Z.uebrigeVerglichen + ' von ' + (Z.zeilenB - Z.listeB));
muss(Z.listeAnders === 0 && Z.listeFehltInC === 0 && Z.listeVerglichen === Z.listeB && Z.listeGleich + Z.listeNurMarke.length === Z.listeB, '(a) Liste bis zum alten Ende: ' + Z.listeAnders + ' anders, ' + Z.listeFehltInC + ' fehlen');
muss(Z.listeNurMarke.length === LI.namen.length, '(a) Marke LETZTER_TAG am alten Ende: ' + Z.listeNurMarke.length + ' statt ' + LI.namen.length);
muss(Z.zeilenC === Z.zeilenB + Z.neu, 'Zeilen 2c ' + Z.zeilenC + ' statt ' + Z.zeilenB + ' + ' + Z.neu);

/* (a) neue Zeilen je Reihe: jeder Handelstag nach dem alten Ende bis zum letzten Panel-Tag */
var lv = SB.letzterVollTagIdx, sollTage = [];
for (var t = 0; t < SB.tage.length; t++) if (SB.tage[t] > ALTES_ENDE && t <= lv) sollTage.push(SB.tage[t]);
var NEU = { sollTage: sollTage, jeReihe: {}, abweichend: [] };
LI.namen.forEach(function (n) {
  var s = idx[n], ist = neuJe[n] || [];
  NEU.jeReihe[n] = { altesEnde: SB.tage[letzteB[s]], neuesEnde: SB.tage[letzteC[s]], neueZeilen: ist.length, groessteRenditeNeuPp: maxRendNeu[n], letzteMitMarke: !!neuMarkenLetzter[n] };
  if (SB.tage[letzteB[s]] !== ALTES_ENDE || ist.join() !== sollTage.join() || !neuMarkenLetzter[n] || !(maxRendNeu[n] < 30)) NEU.abweichend.push(n);
});
muss(NEU.abweichend.length === 0, '(a) neue Zeilen abweichend: ' + NEU.abweichend.join(' '));

/* ---------- (c) Symboltabelle ---------- */
var LZ = JSON.parse(fs.readFileSync(LEBENSZEIT, 'utf8')), lz = {};
Object.keys(LZ.werte).forEach(function (k) { lz[LZ.werte[k].ordner || k] = LZ.werte[k]; });
var ST = { uebrigeAnders: [], listeAnders: [], lebendB: 0, lebendC: 0 };
SC.symbole.forEach(function (e, i) {
  var eb = SB.symbole[i];
  if (eb.lebend) ST.lebendB++;
  if (e.lebend) ST.lebendC++;
  if (!inL[i]) { if (JSON.stringify(e) !== JSON.stringify(eb)) ST.uebrigeAnders.push(e.reihe); return; }
  var x = JSON.parse(JSON.stringify(e)), y = JSON.parse(JSON.stringify(eb));
  var ok = e.lebend === 1 && e.ende_grund == null && e.ende_datum == null && e.v23c && e.v23c.neuesEnde === SB.tage[lv] && lz[e.ordner] && lz[e.ordner].lebend === 1 && eb.lebend_v22 === 1;
  delete x.lebend; delete x.v23c; delete y.lebend; delete y.lebend_v22; delete y.lebend_weg;
  if (!ok || JSON.stringify(x) !== JSON.stringify(y)) ST.listeAnders.push(e.reihe);
});
muss(ST.uebrigeAnders.length === 0, '(c) ' + ST.uebrigeAnders.length + ' Eintraege ausserhalb der Liste veraendert: ' + ST.uebrigeAnders.slice(0, 10).join(' '));
muss(ST.listeAnders.length === 0, '(c) Liste nicht lebend/leer: ' + ST.listeAnders.join(' '));
muss(ST.lebendC === ST.lebendB + LI.namen.length, '(c) lebend ' + ST.lebendB + ' -> ' + ST.lebendC);

/* ---------- (d) Probe auf doppelte Abschnitte ---------- */
var probe = DV.doppelte(path.join(__dirname, 'voll-v23c'), K.PANEL_KENNUNG_V23);
var PROBE = { zaehler: probe.zaehler, doppelt: probe.doppelt.map(function (x) { return x.abschnitt + ' -> ' + x.zwilling; }), nurA: probe.nurA.map(function (x) { return x.abschnitt; }) };
muss(probe.zaehler.doppelt === 0 && probe.zaehler.abcMitB1 === 0, '(d) Probe auf Bau 2c findet ' + probe.zaehler.doppelt + ' doppelte Abschnitte');
probe = null;

/* ---------- (e) Stand ---------- */
var zjt = {};
muss(SC.kennung === K.PANEL_KENNUNG_V23 && SC.bau === '2c', '(e) Kennung/bau ' + SC.kennung + ' ' + SC.bau);
muss(SC.letzterVollTag === SB.letzterVollTag && SC.letzterVollTagIdx === SB.letzterVollTagIdx, '(e) letzter voller Tag ' + SC.letzterVollTag);
muss(SC.zeilen === Z.zeilenC && SC.jahre.every(function (j, k) { return j.n === Z.jahre[k].c; }), '(e) Stand nennt ' + SC.zeilen + ' Zeilen');
Object.keys(SB.zeilenJeTag).forEach(function (t) { zjt[t] = SB.zeilenJeTag[t]; });
LI.namen.forEach(function (n) { (neuJe[n] || []).forEach(function (tg) { var ti = SB.tage.indexOf(tg); zjt[ti] = (zjt[ti] || 0) + 1; }); });
muss(JSON.stringify(Object.keys(zjt).sort().map(function (t) { return [t, zjt[t]]; })) === JSON.stringify(Object.keys(SC.zeilenJeTag).sort().map(function (t) { return [t, SC.zeilenJeTag[t]]; })), '(e) zeilenJeTag passt nicht');
var andereFelder = Object.keys(SB).concat(Object.keys(SC)).filter(function (k, i, a) { return a.indexOf(k) === i && ['stand', 'bau', 'zeilen', 'jahre', 'zeilenJeTag', 'symbole', 'v23c'].indexOf(k) === -1; })
  .filter(function (k) { return JSON.stringify(SB[k]) !== JSON.stringify(SC[k]); });
muss(andereFelder.length === 0, '(e) Felder des Standes veraendert: ' + andereFelder.join(' '));

var ERG = { kennung: 'querschnitt-pruefstand-2026-09-13/pruefung-v23c/v1', stand: new Date().toISOString(), bestanden: gruende.length === 0, gruende: gruende,
  bau2b: { stand: SB.stand, zeilen: Z.zeilenB, reihen: nameB.length }, bau2c: { stand: SC.stand, zeilen: Z.zeilenC, reihen: nameC.length, letzterVollTag: SC.letzterVollTag },
  liste: LI.namen, zeilen: Z, neueZeilen: NEU, stand_je_reihe: ST, probeAufV23c: PROBE, beispiele: BEISPIELE, bitgleichGeprueft: SPA,
  lebenszeit: LZ.kennung + ' (' + LZ.stand + ')', speicherSpitzeMB: Math.round(spitze / 1e6), sekunden: Math.round((Date.now() - t0) / 100) / 10 };
fs.writeFileSync(A.aus + '.tmp', JSON.stringify(ERG, null, 1)); fs.renameSync(A.aus + '.tmp', A.aus);
sag('(a) Liste: ' + Z.listeB + ' Zeilen von Bau 2b, ' + Z.listeGleich + ' bytegleich, ' + Z.listeNurMarke.length + ' nur Marke LETZTER_TAG am ' + ALTES_ENDE + ', anders ' + Z.listeAnders + ', fehlen ' + Z.listeFehltInC +
  ' | neu ' + Z.neu + ' (' + sollTage.length + ' Handelstage je Reihe soll, abweichend ' + NEU.abweichend.length + ')');
sag('(b) uebrige: ' + Z.uebrigeVerglichen + ' verglichen, anders ' + Z.uebrigeAnders + ' | (c) lebend ' + ST.lebendB + ' -> ' + ST.lebendC + ', Liste anders ' + ST.listeAnders.length + ', uebrige Eintraege anders ' + ST.uebrigeAnders.length +
  ' | (d) doppelt ' + PROBE.zaehler.doppelt + ', nur (a) ' + PROBE.zaehler.nurA);
sag((ERG.bestanden ? 'BESTANDEN' : 'NICHT BESTANDEN: ' + gruende.join(' | ')) + ' (' + ERG.sekunden + ' s, Speicher hoechstens ' + ERG.speicherSpitzeMB + ' MB) -> ' + A.aus);
process.exit(ERG.bestanden ? 0 : 1);

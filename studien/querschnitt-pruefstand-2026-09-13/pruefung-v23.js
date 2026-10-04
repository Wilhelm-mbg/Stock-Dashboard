'use strict';
/* PRUEFUNG v2.3 (Auftrag Nr. 92, Schritt 2, Teil 2.3) - Kernpruefung der Ableitung v2.2 -> v2.3 (Muster: pruefung-v22.js).
 *
 * WAS GEPRUEFT WIRD
 *   1. Zeilen v2.3 = Zeilen v2.2 - Zeilen der doppelten Abschnitte, genau (gesamt, je Jahr und je Reihe).
 *   2. Jede verbleibende Zeile ist in ALLEN Spalten bitgleich zu v2.2 (Bytes, nicht Zahlen); `sym` zeigt auf denselben NAMEN.
 *      Je Jahresdatei werden die Zeilen in Dateireihenfolge zusammengefuehrt (v2.2 ohne die doppelten Abschnitte = v2.3, Zeile
 *      fuer Zeile) - die Reihenfolge (tag, sym) ist damit mitgeprueft.
 *   3. Kein Abschnitt ist mehr doppelt: dieselbe Probe wie doppelte-v23.js, auf v2.3 gefahren, findet 0.
 *   4. Symboltabelle: Namen = v2.2 ohne die doppelten, Reihenfolge wie v2.2; lebend wie v2.2; ende_grund/ende_datum je Reihe =
 *      v2.2 bei Schnitt (Luecke, Kuerzelwechsel), sonst = Gruende-Tafel v2 (K.gruendeV2(), Schluessel Reihenname, ohne ~N ausser
 *      bei eigenem Ordner) - HIER UNABHAENGIG NEU GERECHNET, nicht aus panel-v23.js uebernommen; vorgaenger/vorgaenger_entfernt.
 *   5. Kennung v2.3, letzter vollstaendiger Tag wie v2.2, Stand nennt die Tafel v2.
 * Gelesen wird Jahresdatei fuer Jahresdatei (nie ein ganzes Panel im Speicher; der Rechner hatte unter 3,5 GB frei), der
 * Kalender aus _stand.json - nichts von E:.
 * Aufruf:  node pruefung-v23.js [--aus pruefung-v23.json]
 * NUR LESEN auf den Panels. Rueckgabewert 0 = bestanden ("bestanden": true), 1 = nicht bestanden.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var P = require('./paneldaten.js');
var DV = require('./doppelte-v23.js');

var A = { aus: path.join(__dirname, 'pruefung-v23.json') };
for (var ai = 2; ai < process.argv.length; ai++) if (process.argv[ai] === '--aus') A.aus = process.argv[++ai];
var t0 = Date.now(), gruende = [], spitze = 0;
function sag(s) { process.stdout.write(s + '\n'); }
function muss(ok, text) { if (!ok) gruende.push(text); return ok; }
var O22 = path.join(__dirname, 'voll-v22'), O23 = path.join(__dirname, 'voll-v23');
var DL = JSON.parse(fs.readFileSync(path.join(O23, 'doppelte-abschnitte.json'), 'utf8'));
var weg = {}, wegZeilen = 0;
DL.doppelt.forEach(function (x) { weg[x.abschnitt] = x.zeilen; wegZeilen += x.zeilen; });
sag('Liste: ' + DL.doppelt.length + ' doppelte Abschnitte, ' + wegZeilen + ' Zeilen (' + DL.kennung + ', ' + DL.stand + ')');
var S22 = JSON.parse(fs.readFileSync(path.join(O22, 'panel', '_stand.json'), 'utf8'));
var S23 = JSON.parse(fs.readFileSync(path.join(O23, 'panel', '_stand.json'), 'utf8'));
var name22 = S22.symbole.map(function (r) { return r.reihe; }), name23 = S23.symbole.map(function (r) { return r.reihe; });

/* ---------- 3. Probe auf v2.3 ---------- */
var probe = DV.doppelte(O23, K.PANEL_KENNUNG_V23);
var PROBE = { zaehler: probe.zaehler, nurA: probe.nurA.map(function (x) { return x.abschnitt + ' (' + x.kandidaten.map(function (k) { return k.name + ' b' + k.gleich + '/' + k.fenster + ' c' + k.nachlauf; }).join(', ') + ')'; }),
  doppelt: probe.doppelt.map(function (x) { return x.abschnitt + ' -> ' + x.zwilling; }) };
muss(probe.panel === K.PANEL_KENNUNG_V23, 'Probe lief nicht auf v2.3');
muss(probe.zaehler.doppelt === 0 && probe.zaehler.abcMitB1 === 0, 'Probe auf v2.3 findet ' + probe.zaehler.doppelt + ' doppelte Abschnitte');
sag('Probe auf v2.3: doppelt ' + probe.zaehler.doppelt + ' | nur (a) ' + probe.zaehler.nurA + ' | (a)-(c) ohne B1 ' + probe.zaehler.abcOhneB1);
probe = null;

/* ---------- 1./2. Jahr fuer Jahr: Zeilen zaehlen und bitgleich vergleichen ---------- */
function bytes(a) { return new Uint8Array(a.buffer, a.byteOffset, a.byteLength); }
var SP = P.SPALTEN.map(function (s) { return s.name; }).filter(function (n) { return n !== 'sym'; });
var Z = { zeilenV22: 0, zeilenV23: 0, wegZeilenListe: wegZeilen, wegZeilenGezaehlt: 0, jahre: [], verglichen: 0, unerklaert: 0, unerklaertJeSpalte: {} };
var anz22 = new Int32Array(name22.length), anz23 = new Int32Array(name23.length), BEISPIELE = [];
function unerklaert(art, jahr, i, j, reihe) { Z.unerklaert++; Z.unerklaertJeSpalte[art] = (Z.unerklaertJeSpalte[art] || 0) + 1; if (BEISPIELE.length < 40) BEISPIELE.push({ art: art, jahr: jahr, zeileV22: i, zeileV23: j, reihe: reihe }); }
muss(S23.jahre.length === S22.jahre.length && S23.jahre.every(function (j, k) { return j.jahr === S22.jahre[k].jahr; }), 'Jahresdateien v2.3 und v2.2 verschieden');
S22.jahre.forEach(function (jj) {
  var a = P.leseBlock(path.join(O22, 'panel', jj.jahr + '.bin'), K.PANEL_KENNUNG_V22), b = P.leseBlock(path.join(O23, 'panel', jj.jahr + '.bin'), K.PANEL_KENNUNG_V23);
  var BA = {}, BB = {}, W = {}, j = 0, weg0 = 0;
  SP.forEach(function (nm) { BA[nm] = bytes(a[nm]); BB[nm] = bytes(b[nm]); W[nm] = a[nm].BYTES_PER_ELEMENT; });
  for (var i = 0; i < a.n; i++) {
    anz22[a.sym[i]]++;
    var nmA = name22[a.sym[i]];
    if (weg[nmA] !== undefined) { weg0++; continue; }
    if (j >= b.n) { unerklaert('fehltInV23', jj.jahr, i, -1, nmA); continue; }
    Z.verglichen++;
    if (name23[b.sym[j]] !== nmA) unerklaert('sym(Name)', jj.jahr, i, j, nmA);
    for (var c = 0; c < SP.length; c++) {
      var nm = SP[c], w = W[nm], x = i * w, y = j * w, xa = BA[nm], xb = BB[nm];
      for (var k = 0; k < w; k++) if (xa[x + k] !== xb[y + k]) { unerklaert(nm, jj.jahr, i, j, nmA); break; }
    }
    j++;
  }
  for (var q = 0; q < b.n; q++) anz23[b.sym[q]]++;
  if (j !== b.n) unerklaert('nurInV23', jj.jahr, -1, j, null);
  Z.zeilenV22 += a.n; Z.zeilenV23 += b.n; Z.wegZeilenGezaehlt += weg0;
  Z.jahre.push({ jahr: jj.jahr, v22: a.n, weg: weg0, v23: b.n, gleich: a.n - weg0 === b.n });
  spitze = Math.max(spitze, process.memoryUsage().rss);
});
muss(Z.zeilenV23 === Z.zeilenV22 - wegZeilen && wegZeilen === Z.wegZeilenGezaehlt && Z.jahre.every(function (x) { return x.gleich; }),
  'Zeilen v2.3 ' + Z.zeilenV23 + ' statt ' + Z.zeilenV22 + ' - ' + wegZeilen + ' (gezaehlt ' + Z.wegZeilenGezaehlt + ')');
muss(Z.unerklaert === 0 && Z.verglichen === Z.zeilenV23, Z.unerklaert + ' Unterschiede; verglichen ' + Z.verglichen + ' von ' + Z.zeilenV23);
var idx22 = {}; name22.forEach(function (n, i) { idx22[n] = i; });
Z.wegNichtInV22 = Object.keys(weg).filter(function (n) { return idx22[n] === undefined; });
Z.reihenZeilenAnders = [];
Object.keys(weg).forEach(function (n) { if (idx22[n] !== undefined && anz22[idx22[n]] !== weg[n]) Z.reihenZeilenAnders.push(n + ' Liste ' + weg[n] + ' / v2.2 ' + anz22[idx22[n]]); });
name23.forEach(function (n, i) { if (anz23[i] !== anz22[idx22[n]]) Z.reihenZeilenAnders.push(n + ' v2.3 ' + anz23[i] + ' / v2.2 ' + anz22[idx22[n]]); });
muss(Z.wegNichtInV22.length === 0, 'doppelte Abschnitte nicht in v2.2: ' + Z.wegNichtInV22.join(' '));
muss(Z.reihenZeilenAnders.length === 0, Z.reihenZeilenAnders.length + ' Reihen mit anderer Zeilenzahl');

/* ---------- 4. Symboltabelle ---------- */
var sollNamen = name22.filter(function (n) { return weg[n] === undefined; });
muss(sollNamen.length === name23.length && sollNamen.every(function (n, i) { return name23[i] === n; }), 'Namen/Reihenfolge der Symboltabelle weichen von v2.2 ohne die doppelten ab');
var karte2 = K.gruendeV2().karte, s22 = {};
S22.symbole.forEach(function (r) { s22[r.reihe] = r; });
var ST = { schnitt: 0, ausTafelV2: 0, ohneZeileInTafelV2: 0, lebendMitGrund: 0, lebendAnders: [], grundAnders: [], vorgaengerAnders: [], grundGeaendertGegenV22: 0 };
S23.symbole.forEach(function (e) {
  var r = s22[e.reihe], sollG, sollD;
  if (r.ende_grund === K.ENDE_GRUND_LUECKE || r.ende_grund === K.ENDE_GRUND_KUERZEL) { ST.schnitt++; sollG = r.ende_grund; sollD = r.ende_datum; }
  else {
    var g = karte2[e.ordner === e.reihe ? e.reihe : String(e.reihe).replace(/~\d+$/, '')];   /* eigener Ordner: Name bleibt */
    if (g) { ST.ausTafelV2++; sollG = g.grund; sollD = g.datum; } else { ST.ohneZeileInTafelV2++; sollG = null; sollD = null; }
  }
  if (e.ende_grund !== sollG || e.ende_datum !== sollD) ST.grundAnders.push(e.reihe + ': ' + e.ende_grund + ' ' + e.ende_datum + ' statt ' + sollG + ' ' + sollD);
  if (e.lebend !== r.lebend) ST.lebendAnders.push(e.reihe);
  if (e.lebend && e.ende_grund) ST.lebendMitGrund++;
  var vSoll = (r.vorgaenger && weg[r.vorgaenger] !== undefined) ? null : (r.vorgaenger || undefined), veSoll = (r.vorgaenger && weg[r.vorgaenger] !== undefined) ? r.vorgaenger : undefined;
  if (e.vorgaenger !== vSoll || e.vorgaenger_entfernt !== veSoll) ST.vorgaengerAnders.push(e.reihe);
  if (e.ende_grund !== r.ende_grund) ST.grundGeaendertGegenV22++;
});
muss(ST.grundAnders.length === 0, ST.grundAnders.length + ' Reihen: ende_grund nicht = Tafel v2 (oder Schnitt)');
muss(ST.lebendAnders.length === 0, 'lebend anders: ' + ST.lebendAnders.join(' '));
muss(ST.vorgaengerAnders.length === 0, 'vorgaenger anders: ' + ST.vorgaengerAnders.slice(0, 10).join(' '));

/* ---------- 5. Kennung und Stand ---------- */
muss(S23.kennung === K.PANEL_KENNUNG_V23, 'Kennung ' + S23.kennung);
muss(S23.letzterVollTag === S22.letzterVollTag && S23.letzterVollTagIdx === S22.letzterVollTagIdx, 'letzter voller Tag ' + S23.letzterVollTag + ' statt ' + S22.letzterVollTag);
muss(S23.gruendeKennung === K.gruendeV2().kennung, 'gruendeKennung ' + S23.gruendeKennung);
muss(S23.zeilen === Z.zeilenV23, 'Stand nennt ' + S23.zeilen + ' Zeilen');

var ERG = { kennung: 'querschnitt-pruefstand-2026-09-13/pruefung-v23/v1', stand: new Date().toISOString(), bestanden: gruende.length === 0, gruende: gruende,
  v22: { kennung: S22.kennung, zeilen: Z.zeilenV22, reihen: name22.length, letzterVollTag: S22.letzterVollTag },
  v23: { kennung: S23.kennung, zeilen: Z.zeilenV23, reihen: name23.length, letzterVollTag: S23.letzterVollTag, gruendeKennung: S23.gruendeKennung },
  doppelte: { liste: DL.kennung, stand: DL.stand, abschnitte: DL.doppelt.length, zeilen: wegZeilen },
  zeilen: Z, bitgleichGeprueft: P.SPALTEN.map(function (s) { return s.name; }), stand_je_reihe: ST, probeAufV23: PROBE, unerklaertBeispiele: BEISPIELE,
  speicherSpitzeMB: Math.round(spitze / 1e6), sekunden: Math.round((Date.now() - t0) / 100) / 10 };
fs.writeFileSync(A.aus + '.tmp', JSON.stringify(ERG, null, 1)); fs.renameSync(A.aus + '.tmp', A.aus);
sag('Zeilen: v2.2 ' + Z.zeilenV22 + ' - ' + wegZeilen + ' = ' + (Z.zeilenV22 - wegZeilen) + ' | v2.3 ' + Z.zeilenV23 + ' | verglichen ' + Z.verglichen + ', unerklaert ' + Z.unerklaert + ' ' + JSON.stringify(Z.unerklaertJeSpalte));
sag('Stand: Schnitt ' + ST.schnitt + ', Tafel v2 ' + ST.ausTafelV2 + ', ohne Zeile ' + ST.ohneZeileInTafelV2 + ', Grund anders als Soll ' + ST.grundAnders.length + ', gegen v2.2 geaendert ' + ST.grundGeaendertGegenV22 + ', lebend mit Grund ' + ST.lebendMitGrund);
sag((ERG.bestanden ? 'BESTANDEN' : 'NICHT BESTANDEN: ' + gruende.join(' | ')) + ' (' + ERG.sekunden + ' s, Speicher hoechstens ' + ERG.speicherSpitzeMB + ' MB) -> ' + A.aus);
process.exit(ERG.bestanden ? 0 : 1);

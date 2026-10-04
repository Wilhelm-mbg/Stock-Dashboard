'use strict';
/* PRUEFUNG v2.3, Bau 2b (Auftrag Nr. 92, Schritt 2b) - Kernpruefung der Ableitung v2.2 -> v2.3 (2b); Kopie von pruefung-v23.js
 * (bleibt unveraendert) mit den Entscheiden des PM:
 *   1. Zeilen v2.3 = Zeilen v2.2 - NUR die Zeilen der doppelten Abschnitte an Tagen, an denen ihr Zwilling in v2.2 eine Zeile hat
 *      (dazu, falls vorhanden, ein Rest unter 20 Zeilen) - genau, gesamt, je Jahr und je Reihe. Die Zwillingstage werden HIER aus
 *      v2.2 neu bestimmt, nicht aus panel-v23b.js uebernommen.
 *   2. Jede verbleibende Zeile ist in ALLEN Spalten bytegleich zu v2.2; `sym` zeigt auf denselben NAMEN (Zusammenfuehrung je
 *      Jahresdatei in Dateireihenfolge).
 *   3. Die Probe aus doppelte-v23.js, auf v2.3 gefahren, findet 0 doppelte Abschnitte.
 *   4. Symboltabelle: Namen = v2.2 ohne die ganz entfernten, Reihenfolge wie v2.2; ende_grund/ende_datum = v2.2 bei Schnitt
 *      (Luecke, Kuerzelwechsel), 'umbenennung-ticker' mit nachfolger = Zwilling und ende_datum = letzter Tag bei einem behaltenen
 *      Rest, sonst = Tafel v2.1 (Datei selbst gelesen); lebend = 1 nur bei v2.2 lebend, letzter Tag >= letzter voller Panel-Tag und
 *      Lebenszeit der Minuten lebend (Datei auf E: selbst gelesen, nur lesen); vorgaenger/vorgaenger_entfernt.
 *   5. Kennung v2.3, bau '2b', letzter vollstaendiger Tag wie v2.2, Stand nennt die Tafel v2.1.
 * Jahresdatei fuer Jahresdatei gelesen, Kalender aus _stand.json. NUR LESEN.
 * Aufruf:  node pruefung-v23b.js [--aus pruefung-v23b.json]      Rueckgabewert 0 = bestanden, 1 = nicht bestanden.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var P = require('./paneldaten.js');
var DV = require('./doppelte-v23.js');

var A = { aus: path.join(__dirname, 'pruefung-v23b.json') };
for (var ai = 2; ai < process.argv.length; ai++) if (process.argv[ai] === '--aus') A.aus = process.argv[++ai];
var TAFEL21 = path.join(K.REPO, 'studien', 'datenfundament-2026-10-04', 'tafel-v2', 'verschwundene-gruende-v21.json');
var LEBENSZEIT = 'E:/Markt-Dashboard-Archiv/alpaca1m-ableitungen/lebenszeit-minuten.json';
var t0 = Date.now(), gruende = [], spitze = 0;
function sag(s) { process.stdout.write(s + '\n'); }
function muss(ok, text) { if (!ok) gruende.push(text); return ok; }
var O22 = path.join(__dirname, 'voll-v22'), O23 = path.join(__dirname, 'voll-v23');
var DL = JSON.parse(fs.readFileSync(path.join(__dirname, 'doppelte-abschnitte-v23.json'), 'utf8'));
var S22 = JSON.parse(fs.readFileSync(path.join(O22, 'panel', '_stand.json'), 'utf8'));
var S23 = JSON.parse(fs.readFileSync(path.join(O23, 'panel', '_stand.json'), 'utf8'));
var name22 = S22.symbole.map(function (r) { return r.reihe; }), name23 = S23.symbole.map(function (r) { return r.reihe; });
var idx22 = {}, idx23 = {}; name22.forEach(function (n, i) { idx22[n] = i; }); name23.forEach(function (n, i) { idx23[n] = i; });
var nT = S22.tage.length, zwVon = new Int32Array(name22.length).fill(-1), zwTag = {};
DL.doppelt.forEach(function (x) { zwVon[idx22[x.abschnitt]] = idx22[x.zwilling]; zwTag[idx22[x.zwilling]] = new Uint8Array(nT); });
sag('Liste: ' + DL.doppelt.length + ' doppelte Abschnitte (' + DL.kennung + ', ' + DL.stand + ')');

/* ---------- 3. Probe auf v2.3 ---------- */
var probe = DV.doppelte(O23, K.PANEL_KENNUNG_V23);
var PROBE = { zaehler: probe.zaehler, nurA: probe.nurA.map(function (x) { return x.abschnitt + ' (' + x.kandidaten.map(function (k) { return k.name + ' b' + k.gleich + '/' + k.fenster + ' c' + k.nachlauf; }).join(', ') + ')'; }),
  doppelt: probe.doppelt.map(function (x) { return x.abschnitt + ' -> ' + x.zwilling; }) };
muss(probe.panel === K.PANEL_KENNUNG_V23, 'Probe lief nicht auf v2.3');
muss(probe.zaehler.doppelt === 0 && probe.zaehler.abcMitB1 === 0, 'Probe auf v2.3 findet ' + probe.zaehler.doppelt + ' doppelte Abschnitte');
sag('Probe auf v2.3: doppelt ' + probe.zaehler.doppelt + ' | nur (a) ' + probe.zaehler.nurA + ' | (a)-(c) ohne B1 ' + probe.zaehler.abcOhneB1);
probe = null;

/* ---------- 1./2. Jahr fuer Jahr ---------- */
function bytes(a) { return new Uint8Array(a.buffer, a.byteOffset, a.byteLength); }
var SP = P.SPALTEN.map(function (s) { return s.name; }).filter(function (n) { return n !== 'sym'; });
var Z = { zeilenV22: 0, zeilenV23: 0, zwillingstagZeilen: 0, restZeilen: 0, restZeilenGanzEntfernt: 0, jahre: [], verglichen: 0, unerklaert: 0, unerklaertJeSpalte: {} };
var anz22 = new Int32Array(name22.length), anz23 = new Int32Array(name23.length), sollWeg22 = new Int32Array(name22.length), rest22 = new Int32Array(name22.length);
var letzter23 = new Int32Array(name23.length).fill(-1), BEISPIELE = [];
function unerklaert(art, jahr, i, j, reihe) { Z.unerklaert++; Z.unerklaertJeSpalte[art] = (Z.unerklaertJeSpalte[art] || 0) + 1; if (BEISPIELE.length < 40) BEISPIELE.push({ art: art, jahr: jahr, zeileV22: i, zeileV23: j, reihe: reihe }); }
muss(S23.jahre.length === S22.jahre.length && S23.jahre.every(function (j, k) { return j.jahr === S22.jahre[k].jahr; }), 'Jahresdateien v2.3 und v2.2 verschieden');
S22.jahre.forEach(function (jj) {
  var a = P.leseBlock(path.join(O22, 'panel', jj.jahr + '.bin'), K.PANEL_KENNUNG_V22), b = P.leseBlock(path.join(O23, 'panel', jj.jahr + '.bin'), K.PANEL_KENNUNG_V23);
  for (var i0 = 0; i0 < a.n; i0++) if (zwTag[a.sym[i0]]) zwTag[a.sym[i0]][a.tag[i0]] = 1;   /* Zwillingstage dieses Jahres */
  var BA = {}, BB = {}, W = {}, j = 0, weg0 = 0;
  SP.forEach(function (nm) { BA[nm] = bytes(a[nm]); BB[nm] = bytes(b[nm]); W[nm] = a[nm].BYTES_PER_ELEMENT; });
  for (var i = 0; i < a.n; i++) {
    var s = a.sym[i], nmA = name22[s];
    anz22[s]++;
    if (zwVon[s] >= 0) {
      if (zwTag[zwVon[s]][a.tag[i]]) { Z.zwillingstagZeilen++; sollWeg22[s]++; weg0++; continue; }
      rest22[s]++; Z.restZeilen++;
      if (idx23[nmA] === undefined) { Z.restZeilenGanzEntfernt++; sollWeg22[s]++; weg0++; continue; }
    }
    if (j >= b.n) { unerklaert('fehltInV23', jj.jahr, i, -1, nmA); continue; }
    Z.verglichen++;
    if (name23[b.sym[j]] !== nmA) unerklaert('sym(Name)', jj.jahr, i, j, nmA);
    for (var c = 0; c < SP.length; c++) {
      var nm = SP[c], w = W[nm], x = i * w, y = j * w, xa = BA[nm], xb = BB[nm];
      for (var k = 0; k < w; k++) if (xa[x + k] !== xb[y + k]) { unerklaert(nm, jj.jahr, i, j, nmA); break; }
    }
    j++;
  }
  for (var q = 0; q < b.n; q++) { anz23[b.sym[q]]++; if (b.tag[q] > letzter23[b.sym[q]]) letzter23[b.sym[q]] = b.tag[q]; }
  if (j !== b.n) unerklaert('nurInV23', jj.jahr, -1, j, null);
  Z.zeilenV22 += a.n; Z.zeilenV23 += b.n;
  Z.jahre.push({ jahr: jj.jahr, v22: a.n, weg: weg0, v23: b.n, gleich: a.n - weg0 === b.n });
  spitze = Math.max(spitze, process.memoryUsage().rss);
});
muss(Z.zeilenV23 === Z.zeilenV22 - Z.zwillingstagZeilen - Z.restZeilenGanzEntfernt && Z.jahre.every(function (x) { return x.gleich; }),
  'Zeilen v2.3 ' + Z.zeilenV23 + ' statt ' + Z.zeilenV22 + ' - ' + Z.zwillingstagZeilen + ' - ' + Z.restZeilenGanzEntfernt);
muss(Z.unerklaert === 0 && Z.verglichen === Z.zeilenV23, Z.unerklaert + ' Unterschiede; verglichen ' + Z.verglichen + ' von ' + Z.zeilenV23);
Z.reihenZeilenAnders = [];
name23.forEach(function (n, i) { var s = idx22[n]; if (anz23[i] !== anz22[s] - sollWeg22[s]) Z.reihenZeilenAnders.push(n + ' v2.3 ' + anz23[i] + ' / v2.2 ' + anz22[s] + ' - ' + sollWeg22[s]); });
muss(Z.reihenZeilenAnders.length === 0, Z.reihenZeilenAnders.length + ' Reihen mit anderer Zeilenzahl');
/* Rest-Regel: behalten genau die doppelten Abschnitte mit mindestens 20 Zeilen ohne Zwillingstag */
var R = { behalten: [], ganzEntfernt: 0, regelVerletzt: [] };
DL.doppelt.forEach(function (x) {
  var s = idx22[x.abschnitt], drin = idx23[x.abschnitt] !== undefined;
  if (drin) R.behalten.push(x.abschnitt + ' ' + rest22[s] + ' (bis ' + S22.tage[letzter23[idx23[x.abschnitt]]] + ', Zwilling ' + x.zwilling + ')'); else R.ganzEntfernt++;
  if (drin !== (rest22[s] >= 20)) R.regelVerletzt.push(x.abschnitt + ' Rest ' + rest22[s] + (drin ? ' behalten' : ' entfernt'));
});
muss(R.regelVerletzt.length === 0, 'Rest-Regel verletzt: ' + R.regelVerletzt.join(' '));

/* ---------- 4. Symboltabelle ---------- */
var sollNamen = name22.filter(function (n) { return zwVon[idx22[n]] < 0 || rest22[idx22[n]] >= 20; });
muss(sollNamen.length === name23.length && sollNamen.every(function (n, i) { return name23[i] === n; }), 'Namen/Reihenfolge der Symboltabelle weichen ab');
var T = JSON.parse(fs.readFileSync(TAFEL21, 'utf8')), karte = {};
T.reihen.forEach(function (r) { karte[r.reihe] = r; });
var LZ = JSON.parse(fs.readFileSync(LEBENSZEIT, 'utf8')), lz = {};
Object.keys(LZ.werte).forEach(function (k) { lz[LZ.werte[k].ordner || k] = LZ.werte[k]; });
var ganzWeg = {}; DL.doppelt.forEach(function (x) { if (idx23[x.abschnitt] === undefined) ganzWeg[x.abschnitt] = 1; });
var lv = S23.letzterVollTagIdx;
var ST = { schnitt: 0, rest: 0, ausTafelV21: 0, ohneZeileInTafelV21: 0, lebendV22: 0, lebendV23: 0, lebendAuf0: 0, lebendMitGrund: 0, lebendAnders: [], grundAnders: [], vorgaengerAnders: [], restAnders: [] };
S23.symbole.forEach(function (e, i) {
  var s = idx22[e.reihe], r = S22.symbole[s], sollG, sollD, sollL;
  if (zwVon[s] >= 0) {
    ST.rest++; sollG = 'umbenennung-ticker'; sollD = S22.tage[letzter23[i]]; sollL = 0;
    if (e.nachfolger !== name22[zwVon[s]]) ST.restAnders.push(e.reihe + ' nachfolger ' + e.nachfolger);
  } else {
    if (r.ende_grund === K.ENDE_GRUND_LUECKE || r.ende_grund === K.ENDE_GRUND_KUERZEL) { ST.schnitt++; sollG = r.ende_grund; sollD = r.ende_datum; }
    else {
      var g = karte[e.ordner === e.reihe ? e.reihe : String(e.reihe).replace(/~\d+$/, '')];
      if (g) { ST.ausTafelV21++; sollG = g.grund; sollD = g.datum; } else { ST.ohneZeileInTafelV21++; sollG = null; sollD = null; }
    }
    var m = lz[r.ordner];
    sollL = (r.lebend && letzter23[i] >= lv && m && m.lebend === 1) ? 1 : 0;
  }
  if (e.ende_grund !== sollG || e.ende_datum !== sollD) ST.grundAnders.push(e.reihe + ': ' + e.ende_grund + ' ' + e.ende_datum + ' statt ' + sollG + ' ' + sollD);
  if (e.lebend !== sollL) ST.lebendAnders.push(e.reihe + ' ' + e.lebend + ' statt ' + sollL);
  if (r.lebend) ST.lebendV22++;
  if (e.lebend) ST.lebendV23++;
  if (r.lebend && !e.lebend) ST.lebendAuf0++;
  if (e.lebend && e.ende_grund) ST.lebendMitGrund++;
  var vSoll = (r.vorgaenger && ganzWeg[r.vorgaenger]) ? null : (r.vorgaenger || undefined), veSoll = (r.vorgaenger && ganzWeg[r.vorgaenger]) ? r.vorgaenger : undefined;
  if (e.vorgaenger !== vSoll || e.vorgaenger_entfernt !== veSoll) ST.vorgaengerAnders.push(e.reihe);
});
muss(ST.grundAnders.length === 0, ST.grundAnders.length + ' Reihen: ende_grund nicht = Tafel v2.1 / Schnitt / Rest');
muss(ST.restAnders.length === 0, 'Rest ohne Zwilling als Nachfolger: ' + ST.restAnders.join(' '));
muss(ST.lebendAnders.length === 0, 'lebend anders: ' + ST.lebendAnders.slice(0, 20).join(' '));
muss(ST.vorgaengerAnders.length === 0, 'vorgaenger anders: ' + ST.vorgaengerAnders.slice(0, 10).join(' '));

/* ---------- 5. Kennung und Stand ---------- */
muss(S23.kennung === K.PANEL_KENNUNG_V23, 'Kennung ' + S23.kennung);
muss(S23.bau === '2b', 'bau ' + S23.bau);
muss(S23.letzterVollTag === S22.letzterVollTag && S23.letzterVollTagIdx === S22.letzterVollTagIdx, 'letzter voller Tag ' + S23.letzterVollTag + ' statt ' + S22.letzterVollTag);
muss(S23.gruendeKennung === T.kennung && T.kennung === 'datenfundament-2026-10-04/tafel-v2/v2.1', 'gruendeKennung ' + S23.gruendeKennung);
muss(S23.zeilen === Z.zeilenV23, 'Stand nennt ' + S23.zeilen + ' Zeilen');

var ERG = { kennung: 'querschnitt-pruefstand-2026-09-13/pruefung-v23b/v1', stand: new Date().toISOString(), bestanden: gruende.length === 0, gruende: gruende,
  v22: { kennung: S22.kennung, zeilen: Z.zeilenV22, reihen: name22.length, letzterVollTag: S22.letzterVollTag },
  v23: { kennung: S23.kennung, bau: S23.bau, zeilen: Z.zeilenV23, reihen: name23.length, letzterVollTag: S23.letzterVollTag, gruendeKennung: S23.gruendeKennung },
  doppelte: { liste: DL.kennung, stand: DL.stand, abschnitte: DL.doppelt.length }, rest: R, lebenszeit: LZ.kennung + ' (' + LZ.stand + ')',
  zeilen: Z, bitgleichGeprueft: P.SPALTEN.map(function (s) { return s.name; }), stand_je_reihe: ST, probeAufV23: PROBE, unerklaertBeispiele: BEISPIELE,
  speicherSpitzeMB: Math.round(spitze / 1e6), sekunden: Math.round((Date.now() - t0) / 100) / 10 };
fs.writeFileSync(A.aus + '.tmp', JSON.stringify(ERG, null, 1)); fs.renameSync(A.aus + '.tmp', A.aus);
sag('Zeilen: v2.2 ' + Z.zeilenV22 + ' - Zwillingstage ' + Z.zwillingstagZeilen + ' - Rest unter 20 ' + Z.restZeilenGanzEntfernt + ' = ' + (Z.zeilenV22 - Z.zwillingstagZeilen - Z.restZeilenGanzEntfernt) + ' | v2.3 ' + Z.zeilenV23 +
  ' | verglichen ' + Z.verglichen + ', unerklaert ' + Z.unerklaert + ' ' + JSON.stringify(Z.unerklaertJeSpalte) + ' | Rest behalten ' + R.behalten.length + ' (' + Z.restZeilen + ' Zeilen), ganz entfernt ' + R.ganzEntfernt);
sag('Stand: Schnitt ' + ST.schnitt + ', Rest ' + ST.rest + ', Tafel v2.1 ' + ST.ausTafelV21 + ', ohne Zeile ' + ST.ohneZeileInTafelV21 + ', Grund anders als Soll ' + ST.grundAnders.length +
  ' | lebend v2.2 ' + ST.lebendV22 + ' -> ' + ST.lebendV23 + ' (auf 0: ' + ST.lebendAuf0 + '), lebend mit Grund ' + ST.lebendMitGrund);
sag((ERG.bestanden ? 'BESTANDEN' : 'NICHT BESTANDEN: ' + gruende.join(' | ')) + ' (' + ERG.sekunden + ' s, Speicher hoechstens ' + ERG.speicherSpitzeMB + ' MB) -> ' + A.aus);
process.exit(ERG.bestanden ? 0 : 1);

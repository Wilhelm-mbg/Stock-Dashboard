'use strict';
/* PANELTAFEL in der Form des Pruefstands (PR.Tafel), hinter der Holdout-Sperre - die eigene Kopie der Nr.-109-Logik
 * (studien/nachzuegler-2026-10/lesen.js oeffne), wie der Auftrag sie verlangt (GitHub traegt lesen.js nicht).
 * Ohne Siegel 2 werden die Jahresbloecke nach dem Eichfenster (K.EICHUNG.bis, Nr. 121-2a) GAR NICHT gelesen und maxTag endet am letzten Tag davor; mit opt.pruefzeit
 * prueft siegel.js das Siegel VOR jedem Lesen. Dieselben Felder wie PR.Tafel - korb.js, rueckblick.js und mfhandel.js merken nichts.
 * NUR LESEN. Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var SG = require('./siegel.js');

function oeffne(opt) {
  opt = opt || {};
  var P = require(path.join(K.PRUEFSTAND, 'paneldaten.js'));
  var frei = K.speicherFreiGb();
  if (!opt.ohneSpeicherpruefung && frei < K.SPEICHER_MIN_GB) throw new Error('SPEICHER: ' + frei.toFixed(1) + ' GB frei, unter ' + K.SPEICHER_MIN_GB + ' GB - warten');
  var siegel = null;
  if (opt.pruefzeit) { if (!opt.siegelPfad) throw SG.sperrFehler('Pruefzeit verlangt, aber kein Siegel genannt'); siegel = SG.pruefeSiegel(opt.repo || K.REPO, opt.siegelPfad); }
  var aus = opt.panel || (siegel ? K.PANEL : K.PANEL_EICHUNG), kennung = opt.panelKennung || K.PANEL_KENNUNG, ordner = path.join(aus, 'panel');   /* Nr. 123 wie tafel.js */
  K.ordnerPruefen(ordner, 5, 'Panel ' + aus);
  var stand = JSON.parse(fs.readFileSync(path.join(ordner, '_stand.json'), 'utf8'));
  if (stand.kennung !== kennung) throw new Error('Panelkennung ' + stand.kennung + ' statt ' + kennung);
  if (!Array.isArray(stand.tage) || !stand.tage.length) throw new Error('_stand.json ohne tage');
  if (stand.letzterVollTagIdx == null) throw new Error('_stand.json ohne letzterVollTagIdx');
  var tage = stand.tage, idx = {}; tage.forEach(function (t, i) { idx[t] = i; });
  var sperrIdx = -1; for (var i = 0; i < tage.length; i++) if (tage[i] <= K.EICHUNG.bis) sperrIdx = i;
  var offen = !!siegel;
  var jahre = stand.jahre.map(function (j) { return j.jahr; }).filter(function (j) { return offen || j <= +K.EICHUNG.bis.slice(0, 4); }).sort(function (a, b) { return a - b; });
  var bloecke = jahre.map(function (j) { return P.leseBlock(path.join(ordner, j + '.bin'), kennung); });
  var n = 0; bloecke.forEach(function (b) { n += b.n; });
  var g = { n: 0 };
  g.tag = new Int32Array(n); g.sym = new Uint16Array(n); g.marken = new Uint8Array(n); g.klasse = new Int8Array(n);
  g.rohSchluss = new Float64Array(n); g.bSchluss = new Float64Array(n); g.bEroeffnung = new Float64Array(n);
  g.rendite = new Float32Array(n); g.renditeOC = new Float32Array(n); g.umsatz = new Float64Array(n);
  var o = 0;
  bloecke.forEach(function (b) {
    for (var q = 0; q < b.n; q++) {
      if (!offen && b.tag[q] > sperrIdx) throw SG.sperrFehler('Block enthaelt einen Tag nach dem Eichfenster ' + K.EICHUNG.bis + ' (' + tage[b.tag[q]] + ')');
      g.tag[o] = b.tag[q]; g.sym[o] = b.sym[q]; g.marken[o] = b.marken[q]; g.klasse[o] = b.klasse[q];
      g.rohSchluss[o] = b.rohSchluss[q]; g.bSchluss[o] = b.rohSchluss[q] / b.faktor[q]; g.bEroeffnung[o] = b.rohEroeffnung[q] / b.faktor[q];
      g.rendite[o] = b.rendite[q]; g.renditeOC[o] = b.renditeOC[q]; g.umsatz[o] = b.umsatzReg[q] + b.umsatzAuktion[q];
      o++;
    }
  });
  g.n = o; bloecke = null;
  var maxTag = offen ? stand.letzterVollTagIdx : Math.min(stand.letzterVollTagIdx, sperrIdx), nTage = tage.length;
  var tagVon = new Int32Array(nTage).fill(-1), tagBis = new Int32Array(nTage).fill(-1);
  for (var i2 = 0; i2 < g.n; i2++) { var t = g.tag[i2]; if (tagVon[t] < 0) tagVon[t] = i2; tagBis[t] = i2 + 1; }
  var nSym = stand.symbole.length, zaehl = new Int32Array(nSym + 1);
  for (var i3 = 0; i3 < g.n; i3++) zaehl[g.sym[i3] + 1]++;
  for (var s = 0; s < nSym; s++) zaehl[s + 1] += zaehl[s];
  var symStart = Int32Array.from(zaehl), symZeilen = new Int32Array(g.n), fuell = Int32Array.from(zaehl);
  for (var i4 = 0; i4 < g.n; i4++) symZeilen[fuell[g.sym[i4]]++] = i4;
  var posInReihe = new Int32Array(g.n);
  for (var s2 = 0; s2 < nSym; s2++) for (var q2 = symStart[s2]; q2 < symStart[s2 + 1]; q2++) posInReihe[symZeilen[q2]] = q2 - symStart[s2];
  function zeileVon(sym, tag) {
    if (tag < 0 || tag >= nTage) return -1;
    var a = tagVon[tag], b = tagBis[tag];
    if (a < 0) return -1;
    while (a < b) { var m = (a + b) >> 1; if (g.sym[m] < sym) a = m + 1; else b = m; }
    return (a < tagBis[tag] && g.sym[a] === sym) ? a : -1;
  }
  var symName = stand.symbole.map(function (r) { return r.reihe; }), symIdx = {};
  symName.forEach(function (nm, i5) { symIdx[nm] = i5; });
  return { g: g, stand: stand, kal: { tage: tage, idx: idx, close: null }, maxTag: maxTag, nTage: nTage, nSym: nSym,
    tagVon: tagVon, tagBis: tagBis, symStart: symStart, symZeilen: symZeilen, posInReihe: posInReihe,
    zeileVon: zeileVon, endeGrund: stand.symbole.map(function (r) { return r.ende_grund; }), symName: symName, symIdx: symIdx,
    zurueck: function (z, k) { var sy = g.sym[z], p = posInReihe[z] - k; return p < 0 ? -1 : symZeilen[symStart[sy] + p]; },
    letzteZeile: function (sym) { return symStart[sym + 1] > symStart[sym] ? symZeilen[symStart[sym + 1] - 1] : -1; },
    gesperrt: !offen, sperrIdx: sperrIdx, siegel: siegel, jahreGelesen: jahre };
}

module.exports = { oeffne: oeffne };

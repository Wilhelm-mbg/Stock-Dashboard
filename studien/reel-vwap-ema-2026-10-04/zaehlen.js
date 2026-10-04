'use strict';
/* Auftrag Nr. 89, Paragraph 1: NUR Aufbau und Vollstaendigkeit der Daten zaehlen - keine Ertraege, keine Signale.
 * Aufruf aus der Repo-Wurzel: node studien/reel-vwap-ema-2026-10-04/zaehlen.js
 * Schreibt daten-zaehlung.json in den Studienordner. */
var fs = require('fs');
var path = require('path');
var D = require('./daten');

function artVon(x) { return Array.isArray(x) ? 'Liste(' + x.length + ')' : (x === null ? 'null' : typeof x); }

/** Sucht in der Massnahmen-Datei alles, was nach Split aussieht (ohne Annahme ueber den genauen Aufbau). */
function splitsAus(m) {
  var funde = [], zahlJeArt = {};
  function sieh(eintrag, artHinweis) {
    if (!eintrag || typeof eintrag !== 'object') return;
    var art = String(eintrag._art || eintrag.art || eintrag.type || eintrag.typ || artHinweis || '?');
    zahlJeArt[art] = (zahlJeArt[art] || 0) + 1;
    var text = (art + ' ' + Object.keys(eintrag).join(' ')).toLowerCase();
    if (text.indexOf('split') >= 0 || eintrag.new_rate != null || eintrag.old_rate != null || (eintrag.faktor != null && eintrag.faktor !== 1)) {
      var ex = eintrag.ex_date || eintrag.ex || eintrag.datum || eintrag.process_date || '?';
      funde.push({ art: art, ex: ex });
    }
  }
  function lauf(x, hinweis, tiefe) {
    if (tiefe > 4 || x == null) return;
    if (Array.isArray(x)) { x.forEach(function (e) { if (e && typeof e === 'object' && !Array.isArray(e)) sieh(e, hinweis); else lauf(e, hinweis, tiefe + 1); }); return; }
    if (typeof x === 'object') Object.keys(x).forEach(function (k) { if (x[k] && typeof x[k] === 'object') lauf(x[k], k, tiefe + 1); });
  }
  lauf(m, '', 0);
  return { funde: funde, zahlJeArt: zahlJeArt };
}

var aus = { erstellt: new Date().toISOString(), ersterTag: D.ERSTER_TAG, schlusstag: D.SCHLUSSTAG, werte: {} };
var tagListen = {};

D.WERTE.forEach(function (sym) {
  var g = D.ladeWert(sym), R = g.reihe, z = g.zaehlung;
  var nTage = R.tagDatum.length, verteilung = {}, unter380 = [], ersteNicht930 = [], letzteAnders = [];
  for (var d = 0; d < nTage; d++) {
    var k = R.tagE[d] - R.tagA[d];
    verteilung[k] = (verteilung[k] || 0) + 1;
    var erste = R.min[R.tagA[d]], letzte = R.min[R.tagE[d] - 1];
    if (k < 380) unter380.push({ datum: R.tagDatum[d], kerzen: k, erste: erste, letzte: letzte });
    if (erste !== 570) ersteNicht930.push({ datum: R.tagDatum[d], erste: erste });
    if (letzte !== 959 && letzte !== 779) letzteAnders.push({ datum: R.tagDatum[d], letzte: letzte });
  }
  var grob = { genau390: verteilung[390] || 0, genau210: verteilung[210] || 0, von380bis389: 0, von200bis209: 0, sonstUnter380: 0 };
  Object.keys(verteilung).forEach(function (kk) {
    var k = Number(kk);
    if (k >= 380 && k < 390) grob.von380bis389 += verteilung[kk];
    else if (k >= 200 && k < 210) grob.von200bis209 += verteilung[kk];
    else if (k < 380 && k !== 210) grob.sonstUnter380 += verteilung[kk];
  });
  var m = D.ladeMassnahmen(sym), s = splitsAus(m);
  var imFenster = s.funde.filter(function (f) { return f.ex >= D.ERSTER_TAG && f.ex <= D.SCHLUSSTAG; });
  aus.werte[sym] = {
    zaehlung: z, handelstage: nTage, ersterTag: R.tagDatum[0], letzterTag: R.tagDatum[nTage - 1], kerzen: R.n,
    kerzenJeTag: grob, tageUnter380: unter380.length, tageUnter380Liste: unter380,
    ersteKerzeNicht0930: ersteNicht930.length, ersteKerzeNicht0930Liste: ersteNicht930.slice(0, 50),
    letzteKerzeNicht1559Oder1259: letzteAnders.length, letzteKerzeAndersListe: letzteAnders.slice(0, 50),
    massnahmen: { aufbau: artVon(m), schluessel: (m && typeof m === 'object' && !Array.isArray(m)) ? Object.keys(m).slice(0, 12) : [], zahlJeArt: s.zahlJeArt, splitFunde: s.funde, splitsImFenster: imFenster }
  };
  tagListen[sym] = R.tagDatum;
  console.log(sym + ': Tage ' + nTage + ' (' + R.tagDatum[0] + ' bis ' + R.tagDatum[nTage - 1] + '), Kerzen ' + R.n +
    ', je Tag ' + JSON.stringify(grob) + ', unter 380: ' + unter380.length +
    ', erste nicht 09:30: ' + ersteNicht930.length + ', letzte nicht 15:59/12:59: ' + letzteAnders.length);
  console.log('  verworfen ' + JSON.stringify(z.verworfen) + ', Umsatz null ' + z.umsatzNull + ', Hoch/Tief-Widerspruch ' + z.hochTiefWiderspruch +
    ', Block ueber Tagesgrenze ' + z.blockUeberTagesgrenze + ', leere Bloecke ' + z.leereBloecke + ', Rohkerzen ' + z.kerzenRoh);
  console.log('  Massnahmen: ' + artVon(m) + ' Schluessel ' + JSON.stringify(aus.werte[sym].massnahmen.schluessel) + ' Arten ' + JSON.stringify(s.zahlJeArt) +
    ' Split-Funde ' + s.funde.length + ' im Fenster ' + imFenster.length);
});

/* Stimmen die Handelstage der drei Werte ueberein? */
var a = tagListen.QQQ, gleich = true;
D.WERTE.forEach(function (sym) {
  var b = tagListen[sym];
  if (b.length !== a.length) gleich = false; else for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) { gleich = false; break; }
});
aus.handelstageDeckungsgleich = gleich;
/* Tage je Fenster (QQQ) */
var fenster = { 'W-Vor': ['2016-01-04', '2017-12-29'], 'W-Papier': ['2018-01-02', '2023-09-28'], 'W-Nach': ['2023-09-29', '2026-09-30'] };
aus.tageJeFenster = {};
Object.keys(fenster).forEach(function (f) {
  aus.tageJeFenster[f] = a.filter(function (t) { return t >= fenster[f][0] && t <= fenster[f][1]; }).length;
});
console.log('Handelstage der drei Werte deckungsgleich: ' + gleich + '; Tage je Fenster (QQQ): ' + JSON.stringify(aus.tageJeFenster));
fs.writeFileSync(path.join(__dirname, 'daten-zaehlung.json'), JSON.stringify(aus, null, 1));

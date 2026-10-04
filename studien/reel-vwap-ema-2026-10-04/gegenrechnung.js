'use strict';
/* Gegenrechnung NACH dem Lauf: der Hauptlauf (R1, QQQ, Fassung N, W-Nach) und die Eichung (R1, QQQ, Fassung P, Papier-Kosten,
 * W-Papier) noch einmal, ohne daten.js und ohne kern.js - eigener Leser, VWAP je Kerze neu aufsummiert, Vermoegen als Produkt
 * der Trade-Faktoren. Vergleicht mit ergebnis.json und eichung.json. Aendert nichts am Ergebnis; findet sie eine Abweichung,
 * ist das ein Fehler im Code und gehoert unter korrekturen. Dieselben Lesarten (REGEL.md Teil B), anderer Rechenweg. */
var fs = require('fs');
var path = require('path');

var fmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/New_York', dateStyle: 'short', timeStyle: 'short' });
function ny(ms) { var t = fmt.format(new Date(ms)); return { tag: t.slice(0, 10), min: Number(t.slice(11, 13)) * 60 + Number(t.slice(14, 16)) }; }

function tageLesen(von, bis) {
  var tage = [];
  for (var jahr = Number(von.slice(0, 4)); jahr <= Number(bis.slice(0, 4)); jahr++) {
    var j = JSON.parse(fs.readFileSync('E:/Markt-Dashboard-Archiv/alpaca1m/QQQ/' + jahr + '.json', 'utf8'));
    var bloecke = j.sitzungen.filter(function (b) { return b.sitzung === 'regulaer'; });
    var jeBlock = bloecke.map(function () { return []; });
    j.series.forEach(function (k) {
      for (var b = 0; b < bloecke.length; b++) if (k[0] >= bloecke[b].von && k[0] <= bloecke[b].bis) { jeBlock[b].push(k); break; }
    });
    bloecke.forEach(function (b, bi) {
      var tag = ny(b.von).tag;
      if (tag < von || tag > bis) return;
      var ks = jeBlock[bi].filter(function (k) { var m = ny(k[0]).min; return m >= 570 && m < 960; });
      ks.sort(function (x, y) { return x[0] - y[0]; });
      tage.push({ tag: tag, k: ks });
    });
  }
  tage.sort(function (a, b) { return a.tag < b.tag ? -1 : 1; });
  return tage;
}

/** kostenArt 'bp' (c in Basispunkten) oder 'aktie' (Dollar je Aktie). Rueckgabe: Endfaktor, Trades, Gewinner, mittlerer Tagesertrag. */
function rechne(tage, fassung, kostenArt, kosten) {
  var gesamt = 1, trades = 0, gewinner = 0, faktorGewinner = 0, grenzfaelle = 0, summeTag = 0, umsatzSumme = 0;
  tage.forEach(function (T) {
    var k = T.k, n = k.length, seiten = [], pv = 0, vv = 0, vorher = 0, i;
    for (i = 0; i < n; i++) {                      // Felder: [zeit, schluss, umsatz, hoch, tief, eroeffnung]
      pv += (k[i][3] + k[i][4] + k[i][1]) / 3 * k[i][2]; vv += k[i][2];
      var vw = pv / vv, diff = k[i][1] - vw, s = Math.abs(diff) > 1e-9 * k[i][1] ? (diff > 0 ? 1 : -1) : vorher;
      seiten.push(s); vorher = s;
    }
    var handel = [], pos = 0;                      // Liste der Handelspreise mit neuer Position
    for (i = 0; i < n - 1; i++) {
      if (seiten[i] !== pos) { handel.push({ preis: fassung === 'P' ? k[i][1] : k[i + 1][5], nach: seiten[i] }); pos = seiten[i]; }
    }
    if (pos !== 0) handel.push({ preis: k[n - 1][1], nach: 0 });
    var tagFaktor = 1, umsatz = 0, offen = null;
    handel.forEach(function (h) {
      if (offen) {
        var ge = kostenArt === 'bp' ? kosten / 10000 * offen.preis : kosten, gx = kostenArt === 'bp' ? kosten / 10000 * h.preis : kosten;
        var stueck = 1 / (offen.preis + ge);       // je Einheit Vermoegen
        var f = offen.richtung > 0 ? stueck * (h.preis - gx) : stueck * (2 * offen.preis - h.preis - gx);
        umsatz += tagFaktor * stueck * (offen.preis + h.preis);
        tagFaktor *= f; trades++;
        if (f > 1) faktorGewinner++;               // rundungsanfaellig: bei Ertrag genau null entscheidet das letzte Bit
        /* scharf: Gewinn je Stueck nach Gebuehren, Grenzfall = genau null bis auf die Rechengenauigkeit (kein Gewinner) */
        var jeStueck = offen.richtung > 0 ? (h.preis - gx) - (offen.preis + ge) : (offen.preis - h.preis) - gx - ge;
        if (Math.abs(jeStueck) <= 1e-9 * offen.preis) grenzfaelle++; else if (jeStueck > 0) gewinner++;
      }
      offen = h.nach !== 0 ? { preis: h.preis, richtung: h.nach } : null;
    });
    gesamt *= tagFaktor; summeTag += tagFaktor - 1; umsatzSumme += umsatz;
  });
  return { tage: tage.length, gesamt: gesamt - 1, trades: trades, trefferquote: gewinner / trades, gewinner: gewinner, faktorGewinner: faktorGewinner, grenzfaelle: grenzfaelle, mittelTagBp: summeTag / tage.length * 10000, tagesumsatz: umsatzSumme / tage.length };
}

var E = JSON.parse(fs.readFileSync(path.join(__dirname, 'ergebnis.json'), 'utf8'));
var haupt = E.laeufe.filter(function (l) { return l.regel === 'R1' && l.wert === 'QQQ' && l.fassung === 'N' && l.fenster === 'W-Nach'; })[0];
var abweichung = 0;
function vergleiche(name, a, b) {
  var rel = Math.abs(a - b) / Math.max(1e-12, Math.abs(b));
  if (rel > 1e-9) abweichung++;
  console.log(name + ': Gegenrechnung ' + a + ' | Lauf ' + b + ' | ' + (rel > 1e-9 ? 'ABWEICHUNG' : 'gleich'));
}
var nach = tageLesen('2023-09-29', '2026-09-30');
[['0', 0], ['0,25', 0.25], ['1,0', 1]].forEach(function (c) {
  var g = rechne(nach, 'N', 'bp', c[1]), k = haupt.kosten[c[0]];
  vergleiche('Hauptlauf c=' + c[0] + ' Tage', g.tage, k.tage);
  vergleiche('Hauptlauf c=' + c[0] + ' Gesamtertrag', g.gesamt, k.gesamt);
  vergleiche('Hauptlauf c=' + c[0] + ' Trades', g.trades, k.trades);
  vergleiche('Hauptlauf c=' + c[0] + ' Trefferquote', g.trefferquote, k.trefferquote);
  console.log('  Gewinner scharf ' + g.gewinner + ', Grenzfaelle (Ertrag genau null) ' + g.grenzfaelle + ', Gewinner ueber den Faktor ' + g.faktorGewinner + ', Gewinner im Lauf ' + Math.round(k.trefferquote * k.trades));
  vergleiche('Hauptlauf c=' + c[0] + ' mittlerer Tagesertrag (Bp)', g.mittelTagBp, k.mittelTagBp);
  vergleiche('Hauptlauf c=' + c[0] + ' Tagesumsatz', g.tagesumsatz, k.tagesumsatz);
});
var g0 = rechne(nach, 'N', 'bp', 0);
vergleiche('Hauptlauf Kostengrenze (Bp)', g0.mittelTagBp / g0.tagesumsatz, haupt.cStern);
nach = null;
var ep = rechne(tageLesen('2018-01-02', '2023-09-28'), 'P', 'aktie', 0.0005), er = E.eichung.ergebnis;
vergleiche('Eichung Tage', ep.tage, er.tage);
vergleiche('Eichung Gesamtertrag', ep.gesamt, er.gesamt);
vergleiche('Eichung Trades', ep.trades, er.trades);
vergleiche('Eichung Trefferquote', ep.trefferquote, er.trefferquote);
console.log('  Gewinner scharf ' + ep.gewinner + ', Grenzfaelle (Ertrag genau null) ' + ep.grenzfaelle + ', Gewinner ueber den Faktor ' + ep.faktorGewinner + ', Gewinner im Lauf ' + Math.round(er.trefferquote * er.trades));
console.log(abweichung ? 'GEGENRECHNUNG: ' + abweichung + ' Abweichungen' : 'GEGENRECHNUNG: alles gleich (relative Schranke 1e-9)');

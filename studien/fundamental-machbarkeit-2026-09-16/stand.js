'use strict';
/* Schritt 4 der Fundamentaltafel: _stand.json (ins Repo) - Deckung je Umsatzklasse x Jahr, Zaehler des Baus, Hashes.
 *
 * Deckung je Kalenderjahr J und Klasse K (Klasse = Median des Dollar-Umsatzes im Jahr, klassen.js):
 *   aktiv          Panelreihen mit Kursen in J und Klasse K
 *   mitCik         davon mit CIK
 *   bericht        davon mit mindestens einem 10-K/10-Q (Familie) mit filed in J     <- was die Tafel traegt
 *   auslaend       davon mit 20-F/40-F mit filed in J (nur gezaehlt, nicht in der Tafel)
 *   umsatz/netto/vermoegen/aktien   davon mit dem Rohwert zum Stichtag in mindestens einem Filing des Jahres
 *   summe4qNetto   davon mit vollstaendiger 4-Quartals-Summe des Nettoergebnisses in einem Filing des Jahres
 *   fm             davon mit Fundamental-Momentum (braucht 8 Quartale + zwei Bilanzen) in einem Filing des Jahres
 * Anteile in Prozent an "aktiv".
 */
var fs = require('fs');
var path = require('path');
var TAFEL = path.join(__dirname, 'fundamentaltafel');
var KLASSEN = ['ab1000', '250-1000', '50-250', '5-50', 'unter5', 'duenn'];
var FELDER = ['mitCik', 'bericht', 'auslaend', 'umsatz', 'netto', 'operativ', 'vermoegen', 'eigenkapital', 'aktien', 'summe4qNetto', 'fm', 'umsatzWachstum'];

/* v1.1-Zaehler ins Repo; die Liste aller einheitenverdaechtigen Filings (368) bleibt vollstaendig in _bau.json, hier die ersten 40 */
function v11Kurz(v) { if (!v) return null; var k = JSON.parse(JSON.stringify(v)); if (k.einheit && k.einheit.faelle) { k.einheit.faelleGesamt = k.einheit.faelle.length; k.einheit.faelle = k.einheit.faelle.slice(0, 40); } return k; }

function main() {
  var bau = JSON.parse(fs.readFileSync(path.join(TAFEL, '_bau.json'), 'utf8'));
  var kl = JSON.parse(fs.readFileSync(path.join(__dirname, 'klassen-jahr.json'), 'utf8'));
  /* v1.1: klassen-jahr.json traegt die CIK des Panels vor der Namenspruefung; eine verworfene Reihe (bauen.js 2b) zaehlt
   * hier nicht mehr als "mit CIK" */
  var reihenMeta = JSON.parse(fs.readFileSync(path.join(TAFEL, '_reihen.json'), 'utf8')).reihen;
  var ausl = JSON.parse(fs.readFileSync(path.join(TAFEL, '_auslaend.json'), 'utf8')).ciks;
  /* je CIK und Jahr: was die Tafel hat */
  var hat = {}, sektoren = {}, sektorCik = {}, jeForm = {};
  function h(cik, j) { var a = hat[cik] = hat[cik] || {}; return a[j] = a[j] || {}; }
  fs.readdirSync(TAFEL).filter(function (f) { return /^tafel-\d{4}\.jsonl$/.test(f); }).sort().forEach(function (f) {
    fs.readFileSync(path.join(TAFEL, f), 'utf8').split('\n').forEach(function (t) {
      if (!t) return; var z = JSON.parse(t), e = h(z.cik, z.filed.slice(0, 4));
      var sk = z.sektor || 'ohne SIC'; sektoren[sk] = (sektoren[sk] || 0) + 1; (sektorCik[sk] = sektorCik[sk] || {})[z.cik] = 1;
      jeForm[z.form] = (jeForm[z.form] || 0) + 1;
      e.bericht = 1;
      ['umsatz', 'netto', 'operativ', 'vermoegen', 'eigenkapital', 'aktien'].forEach(function (g) { if (z.roh[g] !== null) e[g] = 1; });
      if (z.summe4q.netto !== null) e.summe4qNetto = 1;
      if (z.abgeleitet.fm !== null) e.fm = 1;
      if (z.abgeleitet.umsatzWachstum !== null) e.umsatzWachstum = 1;
    });
  });
  Object.keys(ausl).forEach(function (cik) { ausl[cik].forEach(function (a) { h(+cik, a.filed.slice(0, 4)).auslaend = 1; }); });

  var tafel = {}, jeJahrGesamt = {};
  kl.jahre.forEach(function (j) {
    tafel[j] = {}; KLASSEN.concat(['gesamt']).forEach(function (k) { var z = tafel[j][k] = { aktiv: 0 }; FELDER.forEach(function (f) { z[f] = 0; }); });
    Object.keys(kl.reihen).forEach(function (sym) {
      var r = kl.reihen[sym], y = r.jahr[j]; if (!y || !y.aktiv) return;
      var k = y.klasse || 'duenn';
      [tafel[j][k], tafel[j].gesamt].forEach(function (z) {
        z.aktiv++;
        if (!r.cik || (reihenMeta[sym] && reihenMeta[sym].pruefung === 'verworfen')) return;
        z.mitCik++;
        var e = hat[+r.cik] && hat[+r.cik][j]; if (!e) return;
        FELDER.forEach(function (f) { if (f !== 'mitCik' && e[f]) z[f]++; });
      });
    });
    KLASSEN.concat(['gesamt']).forEach(function (k) { var z = tafel[j][k]; z.prozent = {}; FELDER.forEach(function (f) { z.prozent[f] = z.aktiv ? Math.round(1000 * z[f] / z.aktiv) / 10 : null; }); });
  });
  var out = { kennung: bau.kennung, stand: new Date().toISOString(), quartale: bau.quartale, quelle: 'SEC Financial Statement Data Sets 2016q1-2026q2, E:/Markt-Dashboard-Archiv/edgar-fsds/',
    regel: 'erste Veroeffentlichung gilt; nutzbar ab dem Handelstag NACH filed; 10-K/10-Q-Familie der Panel-CIKs; 20-F/40-F nur gezaehlt',
    panel: { reihen: bau.panelReihen, ohneCik: bau.panelOhneCik, ciks: bau.panelCiks, panelKennung: kl.panelKennung },
    filings: bau.filings, fakten: bau.fakten, zeilen: bau.zeilen, roh: bau.roh, wege: bau.wege, luecken: bau.luecken, abgeleitet: bau.abgeleitet, quartalsgrenzen: bau.quartalsgrenzen,
    klassen: KLASSEN, felder: FELDER, deckung: tafel, hashes: bau.hashes, bauSekunden: bau.sekunden, v11: v11Kurz(bau.v11),
    sektoren: Object.keys(sektoren).sort().map(function (s) { return { sektor: s, zeilen: sektoren[s], ciks: Object.keys(sektorCik[s]).length }; }), zeilenJeForm: jeForm };
  fs.writeFileSync(path.join(__dirname, '_stand.json'), JSON.stringify(out, null, 1));
  kl.jahre.forEach(function (j) { var g = tafel[j].gesamt, a = tafel[j].ab1000, b = tafel[j]['50-250']; console.log(j, 'aktiv', g.aktiv, 'bericht', g.prozent.bericht + '%', 'fm', g.prozent.fm + '%', '| ab1000 bericht', a.prozent.bericht + '%', 'fm', a.prozent.fm + '%', '| 50-250 bericht', b.prozent.bericht + '%', 'fm', b.prozent.fm + '%'); });
}
main();

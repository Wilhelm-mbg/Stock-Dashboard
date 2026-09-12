'use strict';
/* Schritt 1: die verschwundenen Reihen samt Ankerdaten sammeln.
 *
 * Liest NUR. Quellen:
 *   E:/Markt-Dashboard-Archiv/alpaca1m/_lebenszeit.json   (letzter Balken, Kuerzelwechsel)
 *   E:/Markt-Dashboard-Archiv/alpaca1m/_symbole.json      (Ordner, Gruppe)
 *   ~/Downloads/Markt-Dashboard-Daten/massive/wertpapierarten.json (CS/ADRC)
 *   E:/Markt-Dashboard-Archiv/alpaca-massnahmen/<ORDNER>.json (CUSIP, Ende-Art, Barpreis)
 *   studien/vorregistrierung-2026-09-08-trendkanal-tage/tage-{0..3}/<REIHE>.json (letzter Schluss c1)
 *
 * Schreibt: verschwundene.json  (Arbeitsdatei fuer edgar-lauf.js)
 * Definition "verschwunden" wie in der Kanalstudie: letzter Balken < LEBEND_AB (2026-08-17)
 * bzw. erloschener Traeger eines wiederverwendeten Kuerzels. */
var fs = require('fs');
var path = require('path');
var os = require('os');

var ARCHIV = 'E:/Markt-Dashboard-Archiv';
var ROH = path.join(ARCHIV, 'alpaca1m');
var MASSN = path.join(ARCHIV, 'alpaca-massnahmen');
var KANAL = path.join(__dirname, '..', 'vorregistrierung-2026-09-08-trendkanal-tage');
var LEBEND_AB = '2026-08-17';
var AKTIENARTEN = { CS: 1, ADRC: 1 };
var TESTKUERZEL = { ZVZZT: 1, ZWZZT: 1, ZXZZT: 1, ZJZZT: 1 };
var ENDE_ARTEN = ['name_changes', 'cash_mergers', 'stock_mergers', 'stock_and_cash_mergers', 'worthless_removals', 'redemptions'];

function etTagMs(t) { return Date.parse(t + 'T12:00:00Z'); }
function isoVon(ms) { return new Date(ms).toISOString().slice(0, 10); }

function main() {
  var lz = JSON.parse(fs.readFileSync(path.join(ROH, '_lebenszeit.json'), 'utf8')).werte || {};
  var sy = JSON.parse(fs.readFileSync(path.join(ROH, '_symbole.json'), 'utf8'));
  var arten = JSON.parse(fs.readFileSync(path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive', 'wertpapierarten.json'), 'utf8')).arten || {};
  if (Object.keys(arten).length < 1000) throw new Error('Wertpapierart-Karte zu duenn - Abbruch');
  var ordnerK = sy.ordner || {}, gruppeK = sy.gruppe || {};
  var lebendAbMs = etTagMs(LEBEND_AB);

  /* letzte Schlusskurse aus den Tagesdateien der Kanalstudie */
  var schluss = {};
  ['tage-0', 'tage-1', 'tage-2', 'tage-3'].forEach(function (d) {
    var dir = path.join(KANAL, d);
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(function (f) {
      if (f.slice(-5) !== '.json') return;
      var j;
      try { j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { return; }
      var n = (j.c1 || []).length;
      if (!n) return;
      schluss[j.reihe] = { c1: j.c1[n - 1], c3: j.c3[n - 1], tagIdx: j.tag[n - 1], ende: j.ende || null, art: j.art || null };
    });
  });

  var aus = [], zaehler = { gesamt: 0, aktien: 0, lebend: 0, verschwunden: 0, ausgeschlossen: {} };
  Object.keys(lz).forEach(function (r) {
    var e = lz[r];
    if (!e || !(e.balken > 0) || !e.letzter) return;
    zaehler.gesamt++;
    var basis = r.replace(/~2$/, '');
    var art = arten[basis] || arten[basis.replace(/-/g, '.')] || (TESTKUERZEL[basis] ? 'TEST' : 'ohne Art');
    if (!AKTIENARTEN[art] || TESTKUERZEL[basis]) { zaehler.ausgeschlossen[art] = (zaehler.ausgeschlossen[art] || 0) + 1; return; }
    zaehler.aktien++;
    var erloschen = !!(e.wiederverwendet && e.wiederverwendet.schnitt);
    var lebend = (!erloschen && e.letzter >= lebendAbMs) ? 1 : 0;
    if (lebend) { zaehler.lebend++; return; }
    zaehler.verschwunden++;
    var ordner = ordnerK[basis] || basis;
    var m = massnahmen(ordner);
    aus.push({
      reihe: r, basis: basis, ordner: ordner, art: art,
      gruppe: gruppeK[basis] || 'unbekannt',
      letzterBalken: isoVon(erloschen ? e.wiederverwendet.schnitt : e.letzter),
      erloschenerTraeger: erloschen ? 1 : 0,
      kuerzelWiederverwendet: !!(e.wiederverwendet),
      cusip: m.cusip || null,
      massnahmeEnde: m.ende,
      barpreis: m.barpreis,
      letzterKursArchiv: schluss[r] ? schluss[r].c1 : null,
      letzterKursC3: schluss[r] ? schluss[r].c3 : null
    });
  });
  aus.sort(function (a, b) { return a.reihe < b.reihe ? -1 : 1; });
  var out = { stand: new Date().toISOString(), lebendAb: LEBEND_AB, zaehler: zaehler, reihen: aus };
  fs.writeFileSync(path.join(__dirname, 'verschwundene.json'), JSON.stringify(out));
  console.log(JSON.stringify(zaehler, null, 1));
  console.log('ohne letzten Kurs:', aus.filter(function (x) { return x.letzterKursArchiv == null; }).length);
  console.log('mit CUSIP:', aus.filter(function (x) { return x.cusip; }).length);
  var eArt = {}; aus.forEach(function (x) { var k = x.massnahmeEnde ? x.massnahmeEnde.art : 'keine'; eArt[k] = (eArt[k] || 0) + 1; });
  console.log('Ende-Art (alpaca):', JSON.stringify(eArt));
}

/* CUSIP, juengste Ende-Massnahme und Barpreis je Reihe aus dem Massnahmen-Archiv. */
function massnahmen(ordner) {
  var p = path.join(MASSN, ordner.replace(/~2$/, '') + '.json');
  var aus = { cusip: null, ende: null, barpreis: null };
  var j;
  try { j = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return aus; }
  (j.saetze || []).forEach(function (s) {
    var c = s.cusip || s.acquiree_cusip || s.new_cusip || s.old_cusip || s.source_cusip || s.target_cusip;
    if (c && !aus.cusip) aus.cusip = c;
    var ex = s.ex_date || s.process_date || s.effective_date;
    if (!ex) return;
    if (ENDE_ARTEN.indexOf(s._art) !== -1 && (!aus.ende || ex > aus.ende.ex)) {
      aus.ende = { art: s._art, ex: ex, id: s.id || null, rate: (s.rate != null ? s.rate : null),
        neuesKuerzel: s.new_symbol || s.acquirer_symbol || null };
      if ((s._art === 'cash_mergers' || s._art === 'stock_and_cash_mergers') && s.rate != null) aus.barpreis = s.rate;
      else aus.barpreis = null;
    }
  });
  return aus;
}

main();

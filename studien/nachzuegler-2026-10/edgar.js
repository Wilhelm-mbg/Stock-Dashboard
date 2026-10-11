'use strict';
/* EDGAR - CIK je Reihe (Z1), SIC und 8-K-Meldungen mit Punkt 2.02 (Z2), Reaktionstag einer Annahmezeit (Z7, Nachtrag 1 (2)).
 * Liest nur: fundamentaltafel/_reihen.json, Gruende-Tafel v2.1, E:/.../edgar-submissions/cik/*.json. Kein Netz.
 * Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var KN = require('./konfig.js');

function cik10(c) { return ('0000000000' + c).slice(-10); }

/** Z1: CIK je Reihe (Zahl; 0 = keine). symName = Reihennamen des Panels, referenz = Merkmal je Reihe. */
function cikJeReihe(symName, referenz, quellen) {
  quellen = quellen || {};
  var tafel = quellen.tafel || JSON.parse(fs.readFileSync(KN.REIHEN_TAFEL, 'utf8')).reihen;
  var gr = quellen.gruende || JSON.parse(fs.readFileSync(KN.GRUENDE_V21, 'utf8')).reihen;
  var gm = {};
  gr.forEach(function (r) { if (r.panel && r.panel.reihe && r.cik) gm[r.panel.reihe] = +r.cik; });
  var z = { reihen: symName.length, tafel: 0, gruende: 0, keine: 0, referenz: 0 };
  var aus = new Int32Array(symName.length);
  symName.forEach(function (n, i) {
    if (referenz && referenz[i]) { z.referenz++; return; }
    var t = tafel[n];
    if (t && t.cik) { aus[i] = +t.cik; z.tafel++; }
    else if (gm[n]) { aus[i] = gm[n]; z.gruende++; }
    else z.keine++;
  });
  return { cik: aus, zaehler: z };
}

/** Z2: je CIK die SIC (vierstellig) und die Annahmezeiten der 8-K mit Punkt 2.02. ordner: Vorgabe KN.EDGAR_CIK. */
function ladeFirmen(ciks, ordner) {
  ordner = ordner || KN.EDGAR_CIK;
  var firmen = new Map(), z = { ciks: 0, dateien: 0, fehlt: 0, ohneSic: 0, meldungen: 0, formAnders: 0, ohneZeit: 0 };
  var gesehen = {};
  ciks.forEach(function (c) {
    if (!c || gesehen[c]) return; gesehen[c] = 1; z.ciks++;
    var p = path.join(ordner, cik10(c) + '.json');
    if (!fs.existsSync(p)) { z.fehlt++; return; }
    var e = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (e.fehlt) { z.fehlt++; return; }
    z.dateien++;
    var sic = String(e.sic == null ? '' : e.sic);
    sic = /^\d{4}$/.test(sic) && sic !== '0000' ? sic : null;
    if (!sic) z.ohneSic++;
    var m = [];
    (e.k8 || []).forEach(function (r) {
      if (String(r.i || '').split(',').indexOf(KN.ITEM) === -1) return;
      if (r.f !== KN.FORM) { z.formAnders++; return; }
      if (!r.t) { z.ohneZeit++; return; }
      m.push(r.t);
    });
    z.meldungen += m.length;
    firmen.set(c, { sic: sic, sic3: sic ? sic.slice(0, 3) : null, annahmen: m });
  });
  return { firmen: firmen, zaehler: z };
}

var NY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
/** Weltzeit-Text -> New Yorker Ortszeit { datum, sek }. */
function nyZeit(text) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(String(text))) return null;
  var ms = Date.parse(text);
  if (!isFinite(ms)) return null;
  var p = {};
  NY.formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
  return { datum: p.year + '-' + p.month + '-' + p.day, sek: (+p.hour) * 3600 + (+p.minute) * 60 + (+p.second) };
}
/** Schluss eines Kalendertags in Sekunden (16:00, an Halbtagen laut Kalender 13:00). */
function schlussSek(schluss, datum) {
  var c = schluss && schluss[datum] && schluss[datum].close, m = /^(\d{2}):(\d{2})$/.exec(c || '');
  return m ? (+m[1]) * 3600 + (+m[2]) * 60 : 16 * 3600;
}
/** Z7: Reaktionstag (Kalenderindex) einer Annahmezeit: vor dem Schluss eines Handelstags -> dieser Tag, sonst der naechste
 *  Handelstag. -1, wenn der Kalender endet oder die Zeit nicht lesbar ist. */
function reaktionstag(text, tage, schluss) {
  var ny = nyZeit(text);
  if (!ny) return -1;
  var lo = 0, hi = tage.length;
  while (lo < hi) { var m = (lo + hi) >> 1; if (tage[m] < ny.datum) lo = m + 1; else hi = m; }
  if (lo >= tage.length) return -1;
  if (tage[lo] === ny.datum && ny.sek >= schlussSek(schluss, ny.datum)) lo++;
  return lo < tage.length ? lo : -1;
}

module.exports = { cik10: cik10, cikJeReihe: cikJeReihe, ladeFirmen: ladeFirmen, nyZeit: nyZeit, schlussSek: schlussSek, reaktionstag: reaktionstag };

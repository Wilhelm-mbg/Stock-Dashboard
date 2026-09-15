'use strict';
/* Schritt 1: das Panel (7.299 Aktienreihen) mit CIK und Umsatzklasse je Pruefquartal.
 *
 * Liest NUR:
 *   E:/Markt-Dashboard-Archiv/alpaca1m/_lebenszeit.json         erster/letzter Balken je Reihe
 *   E:/Markt-Dashboard-Archiv/alpaca1m/_kalender.json           Handelstage (Index der Tagesdateien)
 *   ~/Downloads/Markt-Dashboard-Daten/massive/wertpapierarten.json   CS/ADRC-Filter (wie universum.js der Grundstudie)
 *   studien/verschwundene-gruende-2026-09-12/edgar-zuordnung.json    CIK der 4.996 verschwundenen Reihen (Volltextsuche)
 *   studien/verschwundene-gruende-2026-09-12/edgar/_company_tickers.json  CIK der lebenden Reihen (SEC-Tickertabelle 12.09.)
 *   studien/vorregistrierung-2026-09-08-trendkanal-tage/tage-{0..3}/<REIHE>.json   Tagesbalken (c1 Schluss, v Stueck)
 *
 * Umsatzklasse je Quartal wie im Pruefstand (§1.5): Median des Dollar-Umsatzes (c1 x v) der 60 Handelstage VOR
 * dem Quartalsanfang, mindestens 40 davon vorhanden; sonst "jung" (Reihe existiert, hat aber keine 40 Vortage).
 * Klassen 5-50 / 50-250 / 250-1000 / ab1000 Mio $ plus "unter5" (unter 5 Mio $, in keiner Studie handelbar).
 *
 * Schreibt: panel.json (Arbeitsdatei fuer deckung.js).
 */
var fs = require('fs');
var path = require('path');
var os = require('os');

var ARCHIV = 'E:/Markt-Dashboard-Archiv';
var ROH = path.join(ARCHIV, 'alpaca1m');
var GRUENDE = path.join(__dirname, '..', 'verschwundene-gruende-2026-09-12');
var KANAL = path.join(__dirname, '..', 'vorregistrierung-2026-09-08-trendkanal-tage');
var ARTEN_DATEI = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive', 'wertpapierarten.json');
var AKTIENARTEN = { CS: 1, ADRC: 1 };
var TESTKUERZEL = { ZVZZT: 1, ZWZZT: 1, ZXZZT: 1, ZJZZT: 1 };
var KLASSEN = [
  { name: 'unter5', von: 0, bis: 5e6 }, { name: '5-50', von: 5e6, bis: 50e6 }, { name: '50-250', von: 50e6, bis: 250e6 },
  { name: '250-1000', von: 250e6, bis: 1e9 }, { name: 'ab1000', von: 1e9, bis: Infinity }];
var QUARTALE = { '2019q2': { von: '2019-04-01', bis: '2019-06-30' }, '2024q2': { von: '2024-04-01', bis: '2024-06-30' } };
var UMSATZ_FENSTER = 60, UMSATZ_MIN_TAGE = 40;

function etTagMs(t) { return Date.parse(t + 'T12:00:00Z'); }
function klasseVon(median) { for (var i = 0; i < KLASSEN.length; i++) if (median >= KLASSEN[i].von && median < KLASSEN[i].bis) return KLASSEN[i].name; return null; }
function median(a) { var s = a.slice().sort(function (x, y) { return x - y; }); var n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; }

function main() {
  var lz = JSON.parse(fs.readFileSync(path.join(ROH, '_lebenszeit.json'), 'utf8')).werte || {};
  var arten = JSON.parse(fs.readFileSync(ARTEN_DATEI, 'utf8')).arten || {};
  if (Object.keys(arten).length < 1000) throw new Error('Wertpapierart-Karte zu duenn');
  var zuordnung = JSON.parse(fs.readFileSync(path.join(GRUENDE, 'edgar-zuordnung.json'), 'utf8')).zuordnung || {};
  var tickerRoh = JSON.parse(fs.readFileSync(path.join(GRUENDE, 'edgar', '_company_tickers.json'), 'utf8'));
  var ticker = {};
  Object.keys(tickerRoh).forEach(function (k) { var e = tickerRoh[k]; if (e && e.ticker) ticker[String(e.ticker).toUpperCase()] = { cik: String(e.cik_str), name: e.title }; });
  var kal = Object.keys(JSON.parse(fs.readFileSync(path.join(ROH, '_kalender.json'), 'utf8')).tage).sort();
  var kalIdx = {}; kal.forEach(function (t, i) { kalIdx[t] = i; });

  /* Tagesdateien: Name je Reihe in den vier Ordnern */
  var dateiVon = {};
  ['tage-0', 'tage-1', 'tage-2', 'tage-3'].forEach(function (d) {
    var dir = path.join(KANAL, d);
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(function (f) { if (f.slice(-5) === '.json') dateiVon[f.slice(0, -5)] = path.join(dir, f); });
  });

  /* Quartalsfenster als Kalenderindizes: erster Handelstag >= von, letzter <= bis */
  var Q = {};
  Object.keys(QUARTALE).forEach(function (q) {
    var von = kal.filter(function (t) { return t >= QUARTALE[q].von; })[0];
    var bis = kal.filter(function (t) { return t <= QUARTALE[q].bis; }).pop();
    Q[q] = { vonIdx: kalIdx[von], bisIdx: kalIdx[bis], vonMs: etTagMs(von), bisMs: etTagMs(bis), jahr: q.slice(0, 4) };
  });

  var reihen = [], z = { gesamt: 0, aktien: 0, lebend: 0, verschwunden: 0, ohneCik: 0, ohneTagesdatei: 0, ausgeschlossen: {} };
  var quelleZ = {}, sicherheitZ = {};
  Object.keys(lz).forEach(function (r) {
    var e = lz[r];
    if (!e || !(e.balken > 0) || !e.letzter) return;
    z.gesamt++;
    var basis = r.replace(/~2$/, '');
    var art = arten[basis] || arten[basis.replace(/-/g, '.')] || (TESTKUERZEL[basis] ? 'TEST' : 'ohne Art');
    if (!AKTIENARTEN[art] || TESTKUERZEL[basis]) { z.ausgeschlossen[art] = (z.ausgeschlossen[art] || 0) + 1; return; }
    z.aktien++;
    var erloschen = !!(e.wiederverwendet && e.wiederverwendet.schnitt);
    var letzterMs = erloschen ? e.wiederverwendet.schnitt : e.letzter;
    var lebend = (!erloschen && e.letzter >= etTagMs('2026-08-17')) ? 1 : 0;
    if (lebend) z.lebend++; else z.verschwunden++;

    /* CIK: verschwundene ueber die Volltext-Zuordnung, lebende ueber die Tickertabelle (dort stehen nur Lebende) */
    var cik = null, quelle = null, sicherheit = null, name = null;
    var zu = zuordnung[r] || zuordnung[basis];
    if (!lebend && zu && zu.cik) { cik = String(parseInt(zu.cik, 10)); quelle = 'zuordnung'; sicherheit = zu.sicherheit || null; name = zu.name || null; }
    else {
      var t = ticker[basis] || ticker[basis.replace(/\./g, '-')] || ticker[basis.replace(/-/g, '.')];
      if (t) { cik = t.cik; quelle = 'tickertabelle'; sicherheit = 'tabelle'; name = t.name; }
      else if (zu && zu.cik) { cik = String(parseInt(zu.cik, 10)); quelle = 'zuordnung'; sicherheit = zu.sicherheit || null; name = zu.name || null; }
    }
    if (!cik) z.ohneCik++;
    quelleZ[quelle || 'keine'] = (quelleZ[quelle || 'keine'] || 0) + 1;
    sicherheitZ[sicherheit || 'keine'] = (sicherheitZ[sicherheit || 'keine'] || 0) + 1;

    /* Umsatzklasse je Quartal */
    var q = {};
    var pf = dateiVon[r] || dateiVon[basis];
    var tage = null;
    if (pf) { try { tage = JSON.parse(fs.readFileSync(pf, 'utf8')); } catch (x) { tage = null; } }
    if (!tage) z.ohneTagesdatei++;
    Object.keys(Q).forEach(function (qn) {
      var w = Q[qn];
      var aktiv = e.erster <= w.bisMs && letzterMs >= w.vonMs ? 1 : 0;
      var s = { aktiv: aktiv, klasse: null, median: null, tage: 0, klasseJahr: null, medianJahr: null, tageJahr: 0 };
      if (aktiv && tage) {
        var dv = [], dvJ = [];
        for (var i = 0; i < tage.tag.length; i++) {
          var ti = tage.tag[i], d = tage.c1[i] * tage.v[i];
          if (!(d > 0)) continue;
          if (ti >= w.vonIdx - UMSATZ_FENSTER && ti < w.vonIdx) dv.push(d);
          if (kal[ti] && kal[ti].slice(0, 4) === w.jahr) dvJ.push(d);
        }
        s.tage = dv.length; s.tageJahr = dvJ.length;
        if (dv.length >= UMSATZ_MIN_TAGE) { s.median = median(dv); s.klasse = klasseVon(s.median); } else s.klasse = 'jung';
        if (dvJ.length >= UMSATZ_MIN_TAGE) { s.medianJahr = median(dvJ); s.klasseJahr = klasseVon(s.medianJahr); } else s.klasseJahr = 'jung';
      }
      q[qn] = s;
    });
    reihen.push({ reihe: r, basis: basis, art: art, lebend: lebend, cik: cik, cikQuelle: quelle, sicherheit: sicherheit, name: name,
      erster: new Date(e.erster).toISOString().slice(0, 10), letzter: new Date(letzterMs).toISOString().slice(0, 10), q: q });
  });
  reihen.sort(function (a, b) { return a.reihe < b.reihe ? -1 : 1; });

  /* Zaehler je Quartal und Klasse */
  var jeQ = {};
  Object.keys(Q).forEach(function (qn) {
    var c = { aktiv: 0, mitCik: 0, klassen: {} };
    reihen.forEach(function (r) {
      var s = r.q[qn]; if (!s.aktiv) return;
      c.aktiv++; if (r.cik) c.mitCik++;
      c.klassen[s.klasse] = (c.klassen[s.klasse] || 0) + 1;
    });
    jeQ[qn] = c;
  });
  var out = { stand: new Date().toISOString(), kennung: 'fundamental-machbarkeit-2026-09-16/panel/v1', quartale: QUARTALE, klassen: KLASSEN,
    umsatzFenster: UMSATZ_FENSTER, umsatzMinTage: UMSATZ_MIN_TAGE, zaehler: z, cikQuelle: quelleZ, sicherheit: sicherheitZ, jeQuartal: jeQ, reihen: reihen };
  fs.writeFileSync(path.join(__dirname, 'panel.json'), JSON.stringify(out));
  console.log(JSON.stringify({ zaehler: z, cikQuelle: quelleZ, sicherheit: sicherheitZ, jeQuartal: jeQ }, null, 1));
}
main();

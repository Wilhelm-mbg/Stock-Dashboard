'use strict';
/* Schritt 3: Tag-Wildwuchs beim Umsatz.
 *
 * Zwei Blickwinkel, weil sie verschieden antworten:
 *  (1) DARSTELLUNG (pre.txt): welche Tag steht in der Gewinn- und Verlustrechnung (stmt IS) an der ersten Zeile,
 *      deren Beschriftung nach Umsatz klingt (revenue/sales/net sales/turnover)? Das ist, was die Firma "Umsatz" nennt -
 *      auch wenn es ein firmeneigener Tag ist (version = adsh).
 *  (2) WERTE (num.txt): welche Tags der bekannten Umsatzfamilie tragen im Filing eine Zahl zum Bilanzstichtag?
 *      Aus deckung-reihen.json (dort steht je Filing der gefundene Tag).
 * Gezaehlt je Quartal ueber ALLE 10-K/10-Q/20-F/40-F des Quartals und getrennt fuer die Panelreihen.
 *
 * Schreibt: tags.json.
 */
var fs = require('fs');
var path = require('path');
var L = require('./fsds-lesen.js');

var PERIODISCH = /^(10-K|10-KT|10-Q|10-QT|20-F|40-F)$/;
var UMSATZ_LABEL = /revenue|sales|turnover/i;
var NICHT_UMSATZ = /cost|expense|deferred|unearned|receivable|per share|percentage|tax|deduction|allowance|discount|return/i;

async function quartal(qn, panelCiks) {
  var subs = await L.ladeSub(qn, function (s) { return PERIODISCH.test(s.form); });
  var jeAdsh = {};
  subs.forEach(function (s) { jeAdsh[s.adsh] = { cik: String(parseInt(s.cik, 10)), form: s.form, erste: null }; });
  /* (1) erste Umsatzzeile der GuV je Filing */
  await L.tabelle(qn, 'pre', function (p) {
    var e = jeAdsh[p.adsh];
    if (!e || p.stmt !== 'IS' || e.erste) return;
    if (!UMSATZ_LABEL.test(p.plabel) || NICHT_UMSATZ.test(p.plabel)) return;
    e.erste = { tag: p.tag, custom: p.version === p.adsh ? 1 : 0, plabel: p.plabel, report: +p.report, line: +p.line };
  });
  function zaehl(filter) {
    var n = 0, ohneIS = 0, custom = 0, tags = {}, labels = {};
    subs.forEach(function (s) {
      var e = jeAdsh[s.adsh];
      if (!filter(e)) return;
      n++;
      if (!e.erste) { ohneIS++; return; }
      if (e.erste.custom) { custom++; tags['<firmeneigen>'] = (tags['<firmeneigen>'] || 0) + 1; }
      else tags[e.erste.tag] = (tags[e.erste.tag] || 0) + 1;
      var l = e.erste.plabel.toLowerCase().replace(/[^a-z ]/g, '').trim();
      labels[l] = (labels[l] || 0) + 1;
    });
    var top = Object.keys(tags).sort(function (a, b) { return tags[b] - tags[a]; }).map(function (t) { return { tag: t, n: tags[t], anteil: Math.round(1000 * tags[t] / (n - ohneIS)) / 10 }; });
    var topLabel = Object.keys(labels).sort(function (a, b) { return labels[b] - labels[a]; }).slice(0, 8).map(function (t) { return { label: t, n: labels[t] }; });
    return { filings: n, ohneUmsatzzeile: ohneIS, mitZeile: n - ohneIS, firmeneigen: custom, verschiedeneTags: Object.keys(tags).length, top: top.slice(0, 12), rest: top.slice(12).reduce(function (a, b) { return a + b.n; }, 0), labels: topLabel };
  }
  return { alle: zaehl(function () { return true; }), panel: zaehl(function (e) { return !!panelCiks[e.cik]; }) };
}

async function main() {
  var panel = JSON.parse(fs.readFileSync(path.join(__dirname, 'panel.json'), 'utf8'));
  var deck = JSON.parse(fs.readFileSync(path.join(__dirname, 'deckung-reihen.json'), 'utf8'));
  var aus = { stand: new Date().toISOString(), kennung: 'fundamental-machbarkeit-2026-09-16/tags/v1', quartale: {} };
  var qs = Object.keys(panel.quartale);
  for (var i = 0; i < qs.length; i++) {
    var qn = qs[i];
    var ciks = {};
    panel.reihen.forEach(function (r) { if (r.cik && r.q[qn].aktiv) ciks[r.cik] = 1; });
    var r = await quartal(qn, ciks);
    /* (2) Werte-Sicht aus der Deckung: Tag des Umsatzwerts je Panel-Filing */
    var wt = {}, nW = 0;
    (deck.reihen[qn] || []).forEach(function (re) {
      re.filings.forEach(function (f) {
        f.hat.forEach(function (h) { if (h.indexOf('umsatz:') === 0) { var t = h.slice(7).split('=')[0]; wt[t] = (wt[t] || 0) + 1; nW++; } });
      });
    });
    r.werteSicht = { filings: nW, top: Object.keys(wt).sort(function (a, b) { return wt[b] - wt[a]; }).map(function (t) { return { tag: t, n: wt[t], anteil: Math.round(1000 * wt[t] / nW) / 10 }; }) };
    aus.quartale[qn] = r;
    console.log(qn, 'alle:', JSON.stringify({ filings: r.alle.filings, ohneZeile: r.alle.ohneUmsatzzeile, firmeneigen: r.alle.firmeneigen, verschieden: r.alle.verschiedeneTags, top: r.alle.top.slice(0, 6) }));
    console.log(qn, 'panel:', JSON.stringify({ filings: r.panel.filings, ohneZeile: r.panel.ohneUmsatzzeile, firmeneigen: r.panel.firmeneigen, verschieden: r.panel.verschiedeneTags, top: r.panel.top.slice(0, 6), labels: r.panel.labels.slice(0, 4) }));
    console.log(qn, 'werte:', JSON.stringify(r.werteSicht));
  }
  fs.writeFileSync(path.join(__dirname, 'tags.json'), JSON.stringify(aus, null, 1));
}
main().catch(function (e) { console.error(e); process.exit(1); });

'use strict';
/* Schritt 2: Deckung, Punkt-in-Zeit-Abstand und Neudarstellungen je Pruefquartal.
 *
 * Je Quartal:
 *  a) sub.txt: alle periodischen Berichte (10-K, 10-Q, 10-KT, 10-QT, deren /A, 20-F, 40-F) - je Panelreihe ueber die CIK.
 *  b) num.txt (Strom, 0,4-0,5 GB): fuer diese Einreichungen die Zieltags (Konzernwert: segments leer, coreg leer).
 *     "vorhanden" = Tag steht im Filing mit ddate = Bilanzstichtag des Filings (sub.period), Bestand qtrs 0, Fluss qtrs >= 1.
 *  c) Abstand filed - period je Einreichung (Verteilung, je Formtyp und Klasse).
 *  d) Neudarstellungen INNERHALB des Quartals: dieselbe (cik, tag, version, ddate, qtrs, uom) in zwei verschiedenen
 *     Einreichungen mit verschiedenem Wert (z. B. 10-K vom April und 10-Q vom Mai, beide mit Assets zum 31.12.).
 *     Gezaehlt ueber ALLE Registranten des Quartals, nur Zieltags, nur Konzernwert.
 *
 * Schreibt: deckung.json (Zahlen fuer MACHBARKEIT.md) und deckung-reihen.json (je Reihe, fuer die Gegenprobe).
 */
var fs = require('fs');
var path = require('path');
var L = require('./fsds-lesen.js');

var PERIODISCH = { '10-K': 'jahr', '10-K/A': 'jahr-A', '10-KT': 'jahr', '10-KT/A': 'jahr-A', '10-K405': 'jahr',
  '10-Q': 'quartal', '10-Q/A': 'quartal-A', '10-QT': 'quartal', '10-QT/A': 'quartal-A',
  '20-F': 'auslaend', '20-F/A': 'auslaend-A', '40-F': 'auslaend', '40-F/A': 'auslaend-A' };
var GRUPPEN = ['umsatz', 'umsatzkosten', 'vermoegen', 'fue', 'aktien'];
var BESTAND = { vermoegen: 1, aktien: 1 };

function quantile(a, p) { if (!a.length) return null; var s = a.slice().sort(function (x, y) { return x - y; }); var i = Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1)))); return s[i]; }
function statistik(a) { return { n: a.length, min: quantile(a, 0), p10: quantile(a, 0.1), p50: quantile(a, 0.5), p90: quantile(a, 0.9), max: quantile(a, 1), mittel: a.length ? Math.round(a.reduce(function (x, y) { return x + y; }, 0) / a.length * 10) / 10 : null }; }

async function quartal(qn, panel) {
  var reihenJeCik = {};
  panel.reihen.forEach(function (r) { if (r.cik) (reihenJeCik[r.cik] = reihenJeCik[r.cik] || []).push(r); });

  /* a) Einreichungen */
  var subs = await L.ladeSub(qn, function (s) { return !!PERIODISCH[s.form]; });
  var jeAdsh = {}, jeCik = {}, abstand = { alle: [], jeForm: {}, jeKlasse: {} }, abstandListe = [];
  subs.forEach(function (s) {
    var cik = String(parseInt(s.cik, 10));
    var e = { adsh: s.adsh, cik: cik, name: s.name, form: s.form, art: PERIODISCH[s.form], period: s.period, filed: s.filed, fy: s.fy, fp: s.fp, afs: s.afs, prevrpt: s.prevrpt, sic: s.sic, hat: {}, imPanel: !!reihenJeCik[cik] };
    jeAdsh[s.adsh] = e;
    (jeCik[cik] = jeCik[cik] || []).push(e);
    if (!/^\d{8}$/.test(s.period) || !/^\d{8}$/.test(s.filed)) return;
    var d = L.tageZwischen(s.period, s.filed);
    e.abstand = d;
    if (e.art === 'jahr' || e.art === 'quartal' || e.art === 'auslaend') {
      abstand.alle.push(d);
      (abstand.jeForm[e.art] = abstand.jeForm[e.art] || []).push(d);
      if (e.imPanel) reihenJeCik[cik].forEach(function (r) { var k = r.q[qn].klasse || 'inaktiv'; (abstand.jeKlasse[k] = abstand.jeKlasse[k] || []).push(d); });
    }
  });

  /* b) + d) num.txt in einem Durchgang */
  var werte = {};                       // key -> { adsh -> value }, nur Zieltags, alle Registranten (fuer d)
  var nZeilen = 0, nZiel = 0;
  await L.tabelle(qn, 'num', function (n) {
    nZeilen++;
    var g = L.TAG_GRUPPE[n.tag];
    if (!g || n.segments || n.coreg) return;
    var e = jeAdsh[n.adsh];
    if (!e) return;
    nZiel++;
    var q = parseInt(n.qtrs, 10);
    /* Aktienzahl: die Deckblatt-Zahl (dei:EntityCommonStockSharesOutstanding) traegt das Datum des Deckblatts, das NACH
     * dem Bilanzstichtag liegt (bis filed); die gewichtete Aktienzahl ist eine Dauergroesse (qtrs >= 1) zum Stichtag. */
    var passt = g === 'aktien'
      ? ((q === 0 && n.ddate >= e.period && n.ddate <= e.filed) || (q >= 1 && n.ddate === e.period))
      : (n.ddate === e.period && (BESTAND[g] ? q === 0 : q >= 1));
    if (passt) {
      /* Prioritaet = Reihenfolge in ZIEL_TAGS; die Zins-Tags (Banken) zaehlen nur bei Finanzwerten (SIC 6000-6799)
       * als Umsatz - sonst wuerde "Zinsertrag, netto" eines Industriewerts als Umsatz durchgehen. */
      var prio = L.ZIEL_TAGS[g].indexOf(n.tag);
      var sicN = parseInt(e.sic, 10), finanzN = sicN >= 6000 && sicN <= 6799;
      if (!(g === 'umsatz' && !finanzN && /^Interest/.test(n.tag))) {
        var h = e.hat[g] = e.hat[g] || { tags: {}, wert: null, tag: null, qtrs: null, prio: 99 };
        h.tags[n.tag] = 1;
        var sollQ = (e.art === 'jahr' || e.art === 'auslaend') ? 4 : 1;
        var besser = h.wert === null || prio < h.prio || (prio === h.prio && !BESTAND[g] && q === sollQ && h.qtrs !== sollQ);
        if (besser) { h.wert = +n.value; h.tag = n.tag; h.qtrs = q; h.uom = n.uom; h.prio = prio; }
      }
    }
    var k = e.cik + '|' + n.tag + '|' + n.version + '|' + n.ddate + '|' + n.qtrs + '|' + n.uom;
    var w = werte[k] = werte[k] || {};
    w[n.adsh] = n.value;
  });

  /* d) Neudarstellungen */
  var neu = { schluessel: 0, mehrfach: 0, gleich: 0, verschieden: 0, verschiedenImPanel: 0, jeGruppe: {}, beispiele: [] };
  Object.keys(werte).forEach(function (k) {
    neu.schluessel++;
    var w = werte[k], adshs = Object.keys(w);
    if (adshs.length < 2) return;
    neu.mehrfach++;
    var v0 = +w[adshs[0]], anders = adshs.some(function (a) { var v = +w[a]; return Math.abs(v - v0) > 1e-6 * Math.max(1, Math.abs(v0)); });
    if (!anders) { neu.gleich++; return; }
    neu.verschieden++;
    var tag = k.split('|')[1], g = L.TAG_GRUPPE[tag];
    neu.jeGruppe[g] = (neu.jeGruppe[g] || 0) + 1;
    var cik = k.split('|')[0];
    if (reihenJeCik[cik]) neu.verschiedenImPanel++;
    if (neu.beispiele.length < 12 && reihenJeCik[cik]) neu.beispiele.push({ reihe: reihenJeCik[cik][0].reihe, key: k, werte: adshs.map(function (a) { return { adsh: a, form: jeAdsh[a].form, filed: L.iso(jeAdsh[a].filed), wert: w[a] }; }) });
  });

  /* Registranten mit IRGENDEINER Einreichung im Quartal (8-K, S-1, ...): trennt "Zuordnung falsch/tot" von
   * "lebt auf EDGAR, hat aber in diesem Quartal keinen periodischen Bericht" */
  var irgendein = {};
  await L.tabelle(qn, 'sub', function (s) { irgendein[String(parseInt(s.cik, 10))] = 1; });

  /* Deckung je Reihe und Klasse. Finanzwerte (SIC 6000-6799) haben keine Umsatzkosten - Bruttoprofitabilitaet
   * ist dort ohnehin nicht definiert (Novy-Marx schliesst sie aus); "brutto" zaehlt deshalb nur Nicht-Finanz. */
  var jeReihe = [], tafel = {};
  function zelle(k) { return tafel[k] = tafel[k] || { aktiv: 0, mitCik: 0, aufEdgar: 0, mitFiling: 0, mitUsStandard: 0, mitAuslaend: 0, finanz: 0, umsatz: 0, umsatzkosten: 0, vermoegen: 0, fue: 0, aktien: 0, kern: 0, nichtFinanz: 0, nfKern: 0, nfBrutto: 0, nfFue: 0, alle: 0 }; }
  panel.reihen.forEach(function (r) {
    var s = r.q[qn]; if (!s.aktiv) return;
    var k = s.klasse || 'inaktiv';
    var fil = (r.cik && jeCik[r.cik]) ? jeCik[r.cik].filter(function (e) { return e.art === 'jahr' || e.art === 'quartal' || e.art === 'auslaend'; }) : [];
    var hat = {};
    fil.forEach(function (e) { GRUPPEN.forEach(function (g) { if (e.hat[g]) hat[g] = 1; }); });
    var sic = fil.length ? parseInt(fil[0].sic, 10) : NaN;
    var finanz = sic >= 6000 && sic <= 6799 ? 1 : 0;
    var kern = hat.umsatz && hat.vermoegen && hat.aktien ? 1 : 0;
    var brutto = hat.umsatz && hat.umsatzkosten ? 1 : 0;
    var alle = kern && hat.umsatzkosten && hat.fue ? 1 : 0;
    [k, 'gesamt'].forEach(function (kk) {
      var c = zelle(kk);
      c.aktiv++; if (r.cik) c.mitCik++; if (r.cik && irgendein[r.cik]) c.aufEdgar++; if (fil.length) c.mitFiling++;
      if (fil.some(function (e) { return e.art !== 'auslaend'; })) c.mitUsStandard++;
      if (fil.some(function (e) { return e.art === 'auslaend'; })) c.mitAuslaend++;
      GRUPPEN.forEach(function (g) { if (hat[g]) c[g]++; });
      c.kern += kern; c.alle += alle;
      if (fil.length) { if (finanz) c.finanz++; else { c.nichtFinanz++; c.nfKern += kern; c.nfBrutto += brutto; if (hat.fue) c.nfFue++; } }
    });
    jeReihe.push({ reihe: r.reihe, cik: r.cik, sicherheit: r.sicherheit, klasse: k, aufEdgar: r.cik && irgendein[r.cik] ? 1 : 0, sic: isNaN(sic) ? null : sic, finanz: finanz, filings: fil.map(function (e) { return { adsh: e.adsh, form: e.form, period: L.iso(e.period), filed: L.iso(e.filed), abstand: e.abstand, hat: Object.keys(e.hat).map(function (g) { return g + ':' + e.hat[g].tag + '=' + e.hat[g].wert; }) }; }), hat: Object.keys(hat), kern: kern, brutto: brutto, alle: alle });
  });

  /* Abstand-Verteilung */
  var ab = { alle: statistik(abstand.alle), jeForm: {}, jeKlasse: {}, negativ: abstand.alle.filter(function (d) { return d < 0; }).length,
    ueber45: abstand.alle.filter(function (d) { return d > 45; }).length, ueber90: abstand.alle.filter(function (d) { return d > 90; }).length,
    ueber180: abstand.alle.filter(function (d) { return d > 180; }).length, p95: quantile(abstand.alle, 0.95), p99: quantile(abstand.alle, 0.99) };
  Object.keys(abstand.jeForm).forEach(function (f) { ab.jeForm[f] = statistik(abstand.jeForm[f]); });
  Object.keys(abstand.jeKlasse).forEach(function (f) { ab.jeKlasse[f] = statistik(abstand.jeKlasse[f]); });

  /* Registranten-Sicht: wie viele CIKs des Quartals haben ueberhaupt das Panel getroffen */
  var cikQuartal = Object.keys(jeCik).length, cikImPanel = Object.keys(jeCik).filter(function (c) { return reihenJeCik[c]; }).length;
  var formen = {}; subs.forEach(function (s) { formen[s.form] = (formen[s.form] || 0) + 1; });
  return { quartal: qn, einreichungen: subs.length, formen: formen, registranten: cikQuartal, registrantenImPanel: cikImPanel, numZeilen: nZeilen, numZielzeilen: nZiel,
    tafel: tafel, abstand: ab, neudarstellungen: neu, jeReihe: jeReihe };
}

async function main() {
  var panel = JSON.parse(fs.readFileSync(path.join(__dirname, 'panel.json'), 'utf8'));
  var aus = { stand: new Date().toISOString(), kennung: 'fundamental-machbarkeit-2026-09-16/deckung/v1', panelKennung: panel.kennung, quartale: {} };
  var reihen = {};
  for (var i = 0; i < Object.keys(panel.quartale).length; i++) {
    var qn = Object.keys(panel.quartale)[i];
    var t0 = Date.now();
    var r = await quartal(qn, panel);
    r.sekunden = Math.round((Date.now() - t0) / 10) / 100;
    reihen[qn] = r.jeReihe; delete r.jeReihe;
    aus.quartale[qn] = r;
    console.log(qn, 'Einreichungen', r.einreichungen, 'num-Zeilen', r.numZeilen, 'Ziel', r.numZielzeilen, 's', r.sekunden);
    console.log(JSON.stringify(r.tafel));
    console.log('Abstand', JSON.stringify(r.abstand.alle), 'ueber45', r.abstand.ueber45, 'ueber90', r.abstand.ueber90);
    var n = r.neudarstellungen; console.log('Neudarstellung', JSON.stringify({ schluessel: n.schluessel, mehrfach: n.mehrfach, gleich: n.gleich, verschieden: n.verschieden, imPanel: n.verschiedenImPanel, jeGruppe: n.jeGruppe }));
  }
  fs.writeFileSync(path.join(__dirname, 'deckung.json'), JSON.stringify(aus, null, 1));
  fs.writeFileSync(path.join(__dirname, 'deckung-reihen.json'), JSON.stringify({ stand: aus.stand, reihen: reihen }));
}
main().catch(function (e) { console.error(e); process.exit(1); });

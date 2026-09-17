'use strict';
/* Schritt 3 der Fundamentaltafel: aus den Quartals-Auszuegen (auszug.js) die Tafel je Filing bauen - punkt-in-zeit.
 *
 * Regeln (Auftrag 16.09.2026, §1):
 *  - Nur 10-K/10-Q-Familie (auch /A und Uebergangsberichte 10-KT/10-QT) der Panel-CIKs; 20-F/40-F werden gezaehlt
 *    (fundamentaltafel/_auslaend.json), nicht aufgenommen. Plausibilitaet: filed >= period, sonst verworfen und gezaehlt.
 *  - ERSTE VEROEFFENTLICHUNG GILT: je (cik, tag, ddate, qtrs) bleibt der Wert des Filings mit dem kleinsten Rang
 *    (Rang = Reihenfolge nach filed, accepted, adsh ueber ALLE Quartale). Ein spaeteres Filing mit anderem Wert wird als
 *    Neudarstellung gezaehlt (fundamentaltafel/_neudarstellungen.json), nie uebernommen.
 *  - Je Filing zaehlt nur, was zu seinem Rang bekannt ist: jeder Fakt hat den Rang seiner Erstveroeffentlichung, und
 *    fakt() liefert ihn nur, wenn dieser Rang <= Rang des Filings ist. So sind auch die Vergleichszahlen frueherer
 *    Quartale, die erst ein spaeteres Filing nachtraegt, fuer die frueheren Filings unsichtbar.
 *  - Quartalsfluss je Stichtag D: direkt (qtrs 1); sonst abgeleitet mit DEMSELBEN Tag: Jahr (qtrs 4) minus drei
 *    Vorquartale (Auftrag), Jahr minus 9-Monats-YTD, YTD-Differenzen. Jeder Weg wird je Quartal markiert
 *    (wege: d direkt, j Jahr-3Q, y Jahr-YTD3, 2 YTD2-Q1, 3 YTD3-YTD2, 4 YTD3-2Q, - Luecke).
 *  - 4-Quartals-Summen ueber die vier Stichtage D0..D3 (Monatsende, je 3 Monate zurueck) nur, wenn alle vier da sind;
 *    "vor" = D4..D7. Fundamental-Momentum = netto4Q/Vermoegen(D0) - netto4Q_vor/Vermoegen(D4) (Novy-Marx 2015).
 *
 * Schreibt (fundamentaltafel/, nicht ins Repo): tafel-<jahr>.jsonl (Jahr = filed-Jahr, eine JSON-Zeile je Filing in
 * Rangordnung, ohne Zeitstempel - bitgleich reproduzierbar), _reihen.json, _auslaend.json, _neudarstellungen.json,
 * _bau.json (Zaehler, Hashes). Aufruf: node --max-old-space-size=6144 bauen.js
 */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var readline = require('readline');
var L = require('./fsds-lesen.js');
var Z = require('./zuordnung.js');

var AUSZUG = path.join(L.WURZEL, 'auszug');
var ZIEL = path.join(__dirname, 'fundamentaltafel');
for (var ai = 2; ai < process.argv.length; ai++) {
  if (process.argv[ai] === '--ziel') ZIEL = process.argv[++ai];          /* Determinismus-Probe: Zweitbau in einen anderen Ordner */
  else if (process.argv[ai] === '--auszug') AUSZUG = process.argv[++ai];
}
var KENNUNG = 'fundamentaltafel-2026-09-16/v1';
var FLUESSE = ['umsatz', 'netto', 'operativ', 'umsatzkosten', 'fue'];
var SUMMEN = ['umsatz', 'netto', 'operativ'];
var WEG_CODE = { direkt: 'd', 'jahr-3q': 'j', 'jahr-ytd3': 'y', ytd2: '2', ytd3: '3', 'ytd3-2q': '4' };

/* ---------- Datumsrechnung auf Monatsenden (FSDS rundet period/ddate auf das Monatsende) ---------- */
function monatsEnde(j, m) { while (m < 1) { m += 12; j--; } while (m > 12) { m -= 12; j++; } return j * 10000 + m * 100 + new Date(Date.UTC(j, m, 0)).getUTCDate(); }
function zurueck(yyyymmdd, quartale) { var j = Math.floor(yyyymmdd / 10000), m = Math.floor(yyyymmdd / 100) % 100; return monatsEnde(j, m - 3 * quartale); }
function iso(n) { var s = String(n); return s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8); }

function tsv(datei, jeZeile) {
  return new Promise(function (ok, nein) {
    var rl = readline.createInterface({ input: fs.createReadStream(datei, { encoding: 'utf8' }), crlfDelay: Infinity });
    var kopf = null, n = 0;
    rl.on('line', function (z) { if (!kopf) { kopf = z.split('\t'); return; } if (!z) return; var f = z.split('\t'), o = {}; for (var i = 0; i < kopf.length; i++) o[kopf[i]] = f[i] === undefined ? '' : f[i]; n++; jeZeile(o, n); });
    rl.on('close', function () { ok(n); }); rl.on('error', nein);
  });
}
function sha(datei) { return crypto.createHash('sha256').update(fs.readFileSync(datei)).digest('hex'); }

async function main() {
  var t0 = Date.now();
  if (!fs.existsSync(ZIEL)) fs.mkdirSync(ZIEL, { recursive: true });
  var panel = JSON.parse(fs.readFileSync(path.join(__dirname, 'panel.json'), 'utf8'));
  var reihenJeCik = {}, reihenMeta = {}, ohneCik = 0;
  panel.reihen.forEach(function (r) {
    reihenMeta[r.reihe] = { basis: r.basis, cik: r.cik ? +r.cik : null, sicherheit: r.sicherheit, lebend: r.lebend, erster: r.erster, letzter: r.letzter };
    if (!r.cik) { ohneCik++; return; }
    (reihenJeCik[+r.cik] = reihenJeCik[+r.cik] || []).push(r.reihe);
  });
  Object.keys(reihenJeCik).forEach(function (c) { reihenJeCik[c].sort(); });

  var quartale = fs.readdirSync(AUSZUG).filter(function (f) { return /^\d{4}q[1-4]-num\.tsv$/.test(f); }).map(function (f) { return f.slice(0, 6); }).sort();
  var z = { kennung: KENNUNG, quartale: quartale, panelReihen: panel.reihen.length, panelOhneCik: ohneCik, panelCiks: Object.keys(reihenJeCik).length,
    filings: { alleRegistranten: 0, usStandardAlle: 0, auslaendAlle: 0, panelUsStandard: 0, panelAuslaend: 0, filedVorPeriod: 0, periodUngueltig: 0, doppelteAdsh: 0, jeForm: {}, jeQuartal: {} },
    fakten: { zeilen: 0, uomFalsch: 0, zinsNichtFinanz: 0, qtrsUngueltig: 0, wertUngueltig: 0, eingefuegt: 0, wiederholtGleich: 0, neudarstellungen: 0, doppelImFiling: 0, rangUmkehr: 0, neuJeGruppe: {}, neuJeSpaeterForm: {} },
    quartalsgrenzen: { verletzt: 0 }, zeilen: { gesamt: 0, jeJahr: {} }, wege: {}, luecken: {}, roh: {}, abgeleitet: { summe4qNetto: 0, fm: 0, umsatzWachstum: 0, roa: 0 } };

  /* ---------- A) Filings ---------- */
  var filings = [], adshGesehen = {}, auslaend = {};
  for (var qi = 0; qi < quartale.length; qi++) {
    var q = quartale[qi], jq = { alle: 0, usStandard: 0, auslaend: 0, panelUsStandard: 0, panelAuslaend: 0, filedMin: null, filedMax: null };
    await tsv(path.join(AUSZUG, q + '-sub.tsv'), function (s) {
      var art = Z.FORM_ART[s.form]; if (!art) return;
      jq.alle++; z.filings.alleRegistranten++;
      var cik = parseInt(s.cik, 10), imPanel = !!reihenJeCik[cik];
      z.filings.jeForm[s.form] = (z.filings.jeForm[s.form] || 0) + 1;
      if (!Z.US_STANDARD[art]) {
        jq.auslaend++; z.filings.auslaendAlle++;
        if (imPanel) { jq.panelAuslaend++; z.filings.panelAuslaend++; (auslaend[cik] = auslaend[cik] || []).push({ form: s.form, period: /^\d{8}$/.test(s.period) ? iso(s.period) : null, filed: iso(s.filed), adsh: s.adsh }); }
        return;
      }
      jq.usStandard++; z.filings.usStandardAlle++;
      if (!imPanel) return;
      if (!/^\d{8}$/.test(s.period) || !/^\d{8}$/.test(s.filed)) { z.filings.periodUngueltig++; return; }
      var period = +s.period, filed = +s.filed;
      if (filed < period) { z.filings.filedVorPeriod++; return; }
      if (adshGesehen[s.adsh]) { z.filings.doppelteAdsh++; return; }
      adshGesehen[s.adsh] = 1;
      jq.panelUsStandard++; z.filings.panelUsStandard++;
      if (jq.filedMin === null || filed < jq.filedMin) jq.filedMin = filed;
      if (jq.filedMax === null || filed > jq.filedMax) jq.filedMax = filed;
      filings.push({ adsh: s.adsh, cik: cik, sic: parseInt(s.sic, 10) || null, form: s.form, art: art, period: period, filed: filed, accepted: (s.accepted || '').slice(0, 16), fy: s.fy, fp: s.fp, q: q, prevrpt: s.prevrpt, afs: s.afs });
    });
    z.filings.jeQuartal[q] = jq;
  }
  filings.sort(function (a, b) { return a.filed - b.filed || (a.accepted < b.accepted ? -1 : a.accepted > b.accepted ? 1 : 0) || (a.adsh < b.adsh ? -1 : 1); });
  var rangVon = {};
  filings.forEach(function (f, i) { f.rang = i; rangVon[f.adsh] = i; });
  for (qi = 1; qi < quartale.length; qi++) { var a = z.filings.jeQuartal[quartale[qi - 1]], b = z.filings.jeQuartal[quartale[qi]]; if (a.filedMax !== null && b.filedMin !== null && b.filedMin <= a.filedMax) z.quartalsgrenzen.verletzt++; }
  console.log('Filings Panel US-Standard:', filings.length, 'auslaend:', z.filings.panelAuslaend, 'in', Math.round((Date.now() - t0) / 1000), 's');

  /* ---------- B) Fakten: erste Veroeffentlichung gilt ---------- */
  var store = new Map();   // cik -> Map(tag -> Map(ddate*10+qtrs -> {v, r, n, s, lv, lr}))
  var neu = [];
  function eintrag(cik, tag, k, anlegen) {
    var c = store.get(cik); if (!c) { if (!anlegen) return null; c = new Map(); store.set(cik, c); }
    var t = c.get(tag); if (!t) { if (!anlegen) return null; t = new Map(); c.set(tag, t); }
    var e = t.get(k); if (!e && anlegen) { e = { v: null, r: -1, n: 0, s: 0 }; t.set(k, e); }
    return e || null;
  }
  for (qi = 0; qi < quartale.length; qi++) {
    var qn = quartale[qi], zeilen = [];
    await tsv(path.join(AUSZUG, qn + '-num.tsv'), function (n, nr) {
      var r = rangVon[n.adsh]; if (r === undefined) return;
      z.fakten.zeilen++;
      var g = Z.TAG_GRUPPE[n.tag];
      if (n.uom !== Z.GRUPPEN[g].uom) { z.fakten.uomFalsch++; return; }
      var f = filings[r];
      if (Z.NUR_FINANZ[n.tag] && !Z.istFinanz(f.sic)) { z.fakten.zinsNichtFinanz++; return; }
      var qtrs = parseInt(n.qtrs, 10);
      if (!(qtrs >= 0 && qtrs <= 4) || !/^\d{8}$/.test(n.ddate)) { z.fakten.qtrsUngueltig++; return; }
      var v = parseFloat(n.value);
      if (!isFinite(v)) { z.fakten.wertUngueltig++; return; }
      zeilen.push({ r: r, nr: nr, cik: f.cik, tag: n.tag, k: (+n.ddate) * 10 + qtrs, v: v });
    });
    zeilen.sort(function (a, b) { return a.r - b.r || a.nr - b.nr; });
    zeilen.forEach(function (x) {
      var e = eintrag(x.cik, x.tag, x.k, true);
      if (e.r < 0) { e.v = x.v; e.r = x.r; z.fakten.eingefuegt++; return; }
      if (e.r === x.r) { if (Math.abs(e.v - x.v) > 1e-6 * Math.max(1, Math.abs(e.v))) z.fakten.doppelImFiling++; return; }
      if (x.r < e.r) { z.fakten.rangUmkehr++; /* darf nicht vorkommen (Quartale in filed-Ordnung); gezaehlt, nicht behandelt */ return; }
      if (Math.abs(e.v - x.v) <= 1e-6 * Math.max(1, Math.abs(e.v))) { e.s++; z.fakten.wiederholtGleich++; return; }
      e.n++; e.lv = x.v; e.lr = x.r; z.fakten.neudarstellungen++;
      var g = Z.TAG_GRUPPE[x.tag]; z.fakten.neuJeGruppe[g] = (z.fakten.neuJeGruppe[g] || 0) + 1;
      var sf = filings[x.r].art; z.fakten.neuJeSpaeterForm[sf] = (z.fakten.neuJeSpaeterForm[sf] || 0) + 1;
      neu.push({ cik: x.cik, tag: x.tag, ddate: iso(Math.floor(x.k / 10)), qtrs: x.k % 10, erst: { wert: e.v, adsh: filings[e.r].adsh, form: filings[e.r].form, filed: iso(filings[e.r].filed) }, spaeter: { wert: x.v, adsh: filings[x.r].adsh, form: filings[x.r].form, filed: iso(filings[x.r].filed) } });
    });
    console.log(qn, 'Fakten', zeilen.length, 'Store', z.fakten.eingefuegt, 'Neudarstellungen', z.fakten.neudarstellungen, Math.round((Date.now() - t0) / 1000), 's');
  }
  fs.writeFileSync(path.join(ZIEL, '_neudarstellungen.json'), JSON.stringify({ kennung: KENNUNG, n: neu.length, faelle: neu }));

  /* ---------- C) je Filing ableiten ---------- */
  function fakt(cik, tag, ddate, qtrs, rang) { var e = eintrag(cik, tag, ddate * 10 + qtrs, false); return e && e.r <= rang ? e : null; }
  function wert(cik, tag, ddate, qtrs, rang) { var e = fakt(cik, tag, ddate, qtrs, rang); return e ? e.v : null; }
  function quartalswert(cik, tags, D, rang) {
    var i, t, v, a, b, c, d;
    for (i = 0; i < tags.length; i++) { t = tags[i]; v = wert(cik, t, D, 1, rang); if (v !== null) return { v: v, tag: t, weg: 'direkt' }; }
    var D1 = zurueck(D, 1), D2 = zurueck(D, 2), D3 = zurueck(D, 3);
    for (i = 0; i < tags.length; i++) {
      t = tags[i];
      a = wert(cik, t, D, 4, rang);
      if (a !== null) {
        b = wert(cik, t, D1, 1, rang); c = wert(cik, t, D2, 1, rang); d = wert(cik, t, D3, 1, rang);
        if (b !== null && c !== null && d !== null) return { v: a - b - c - d, tag: t, weg: 'jahr-3q' };
        b = wert(cik, t, D1, 3, rang); if (b !== null) return { v: a - b, tag: t, weg: 'jahr-ytd3' };
      }
      a = wert(cik, t, D, 2, rang);
      if (a !== null) { b = wert(cik, t, D1, 1, rang); if (b !== null) return { v: a - b, tag: t, weg: 'ytd2' }; }
      a = wert(cik, t, D, 3, rang);
      if (a !== null) {
        b = wert(cik, t, D1, 2, rang); if (b !== null) return { v: a - b, tag: t, weg: 'ytd3' };
        b = wert(cik, t, D1, 1, rang); c = wert(cik, t, D2, 1, rang); if (b !== null && c !== null) return { v: a - b - c, tag: t, weg: 'ytd3-2q' };
      }
    }
    return null;
  }
  function erster(cik, tags, D, qtrs, rang) { for (var i = 0; i < tags.length; i++) { var e = fakt(cik, tags[i], D, qtrs, rang); if (e) return { v: e.v, tag: tags[i], i: i, r: e.r }; } return null; }
  function aktienzahl(f) {
    var cik = f.cik, rang = f.rang, tags = Z.GRUPPEN.aktien.tags, sollQ = Z.JAHRESFORM[f.art] ? 4 : 1;
    /* Deckblatt-Zahl (dei): Bestand mit ddate zwischen Stichtag und Einreichung */
    var c = store.get(cik), tm = c && c.get('EntityCommonStockSharesOutstanding');
    if (tm) { var best = null; tm.forEach(function (e, k) { var dd = Math.floor(k / 10); if (k % 10 === 0 && dd >= f.period && dd <= f.filed && e.r <= rang && (!best || dd > best.dd)) best = { v: e.v, dd: dd, r: e.r }; }); if (best) return { v: best.v, tag: tags[0], i: 0, r: best.r }; }
    var e = fakt(cik, 'CommonStockSharesOutstanding', f.period, 0, rang); if (e) return { v: e.v, tag: tags[1], i: 1, r: e.r };
    for (var i = 2; i <= 3; i++) {
      e = fakt(cik, tags[i], f.period, sollQ, rang); if (e) return { v: e.v, tag: tags[i], i: i, r: e.r };
      for (var qq = 1; qq <= 4; qq++) { e = fakt(cik, tags[i], f.period, qq, rang); if (e) return { v: e.v, tag: tags[i], i: i, r: e.r }; }
    }
    e = fakt(cik, 'CommonStockSharesIssued', f.period, 0, rang); if (e) return { v: e.v, tag: tags[4], i: 4, r: e.r };
    return null;
  }
  function zaehl(o, k) { o[k] = (o[k] || 0) + 1; }
  FLUESSE.forEach(function (g) { z.roh[g] = 0; }); ['vermoegen', 'eigenkapital', 'aktien'].forEach(function (g) { z.roh[g] = 0; });
  z.roh.tags = {}; z.roh.eigenkapitalFallback = 0; z.roh.nettoFallback = 0; z.roh.aktienJeTag = {};
  SUMMEN.forEach(function (g) { z.wege[g] = {}; z.luecken[g] = { summe4q: 0, summe4qVor: 0, jeQuartal: [0, 0, 0, 0, 0, 0, 0, 0] }; });

  var stroeme = {}, aktJahr = null, out = null, hashes = {};
  function oeffneJahr(j) { if (out) out.end(); aktJahr = j; out = fs.createWriteStream(path.join(ZIEL, 'tafel-' + j + '.jsonl.teil')); stroeme[j] = out; }
  var puffer = [];
  for (var fi = 0; fi < filings.length; fi++) {
    var f = filings[fi], cik = f.cik, rang = f.rang, P = f.period, sollQ = Z.JAHRESFORM[f.art] ? 4 : 1;
    var roh = {}, rohTags = {}, erstVonFrueher = 0;
    FLUESSE.forEach(function (g) { var e = erster(cik, Z.GRUPPEN[g].tags, P, sollQ, rang); roh[g] = e ? e.v : null; rohTags[g] = e ? e.tag : null; if (e) { z.roh[g]++; zaehl(z.roh.tags, e.tag); if (e.r < rang) erstVonFrueher++; } });
    if (rohTags.netto && rohTags.netto !== 'NetIncomeLoss') z.roh.nettoFallback++;
    var ev = fakt(cik, 'Assets', P, 0, rang); roh.vermoegen = ev ? ev.v : null; if (ev) { z.roh.vermoegen++; if (ev.r < rang) erstVonFrueher++; }
    var ek = erster(cik, Z.GRUPPEN.eigenkapital.tags, P, 0, rang); roh.eigenkapital = ek ? ek.v : null; rohTags.eigenkapital = ek ? ek.tag : null; if (ek) { z.roh.eigenkapital++; if (ek.i > 0) z.roh.eigenkapitalFallback++; if (ek.r < rang) erstVonFrueher++; }
    var ak = aktienzahl(f); roh.aktien = ak ? ak.v : null; rohTags.aktien = ak ? ak.tag : null; if (ak) { z.roh.aktien++; zaehl(z.roh.aktienJeTag, ak.tag); if (ak.r < rang) erstVonFrueher++; }

    var quartaleW = {}, wege = {}, qTags = {}, summe = {}, luecken = {};
    SUMMEN.forEach(function (g) {
      var vs = [], code = '', tags = {}, n0 = 0, n4 = 0;
      for (var k = 0; k < 8; k++) {
        var qw = quartalswert(cik, Z.GRUPPEN[g].tags, zurueck(P, k), rang);
        vs.push(qw ? qw.v : null); code += qw ? WEG_CODE[qw.weg] : '-';
        if (qw) { tags[qw.tag] = 1; zaehl(z.wege[g], qw.weg); if (k < 4) n0++; else n4++; } else { z.luecken[g].jeQuartal[k]++; }
      }
      quartaleW[g] = vs; wege[g] = code; qTags[g] = Object.keys(tags).sort();
      summe[g] = n0 === 4 ? vs[0] + vs[1] + vs[2] + vs[3] : null;
      summe[g + 'Vor'] = n4 === 4 ? vs[4] + vs[5] + vs[6] + vs[7] : null;
      if (summe[g] === null) z.luecken[g].summe4q++;
      if (summe[g + 'Vor'] === null) z.luecken[g].summe4qVor++;
      luecken[g] = 8 - n0 - n4;
    });
    var A0 = roh.vermoegen, A4 = wert(cik, 'Assets', zurueck(P, 4), 0, rang);
    var roa = (summe.netto !== null && A0 > 0) ? summe.netto / A0 : null;
    var roaVor = (summe.nettoVor !== null && A4 > 0) ? summe.nettoVor / A4 : null;
    var fm = (roa !== null && roaVor !== null) ? roa - roaVor : null;
    var uw = (summe.umsatz !== null && summe.umsatzVor > 0) ? summe.umsatz / summe.umsatzVor - 1 : null;
    if (summe.netto !== null) z.abgeleitet.summe4qNetto++; if (roa !== null) z.abgeleitet.roa++; if (fm !== null) z.abgeleitet.fm++; if (uw !== null) z.abgeleitet.umsatzWachstum++;

    var zeile = { sym: reihenJeCik[cik], cik: cik, sic: f.sic, sektor: Z.sektorVonSic(f.sic), form: f.form, period: iso(P), filed: iso(f.filed), accepted: f.accepted, fy: f.fy, fp: f.fp, q: f.q, adsh: f.adsh,
      roh: { umsatz: roh.umsatz, netto: roh.netto, operativ: roh.operativ, umsatzkosten: roh.umsatzkosten, fue: roh.fue, vermoegen: roh.vermoegen, eigenkapital: roh.eigenkapital, aktien: roh.aktien, qtrs: sollQ },
      rohTags: { umsatz: rohTags.umsatz, netto: rohTags.netto, operativ: rohTags.operativ, umsatzkosten: rohTags.umsatzkosten, fue: rohTags.fue, eigenkapital: rohTags.eigenkapital, aktien: rohTags.aktien },
      quartale: quartaleW, wege: wege, quartalsTags: qTags,
      summe4q: summe, vermoegenVor: A4,
      abgeleitet: { roa: roa, roaVor: roaVor, fm: fm, umsatzWachstum: uw },
      marken: { luecken: luecken, erstVonFrueher: erstVonFrueher, nettoFallback: rohTags.netto && rohTags.netto !== 'NetIncomeLoss' ? 1 : 0, eigenkapitalFallback: ek && ek.i > 0 ? ek.i : 0, aktienFallback: ak ? ak.i : null } };
    var jahr = String(Math.floor(f.filed / 10000));
    if (jahr !== aktJahr) { if (out && puffer.length) { out.write(puffer.join('\n') + '\n'); puffer = []; } oeffneJahr(jahr); }
    puffer.push(JSON.stringify(zeile));
    if (puffer.length >= 2000) { out.write(puffer.join('\n') + '\n'); puffer = []; }
    z.zeilen.gesamt++; zaehl(z.zeilen.jeJahr, jahr);
  }
  if (out && puffer.length) out.write(puffer.join('\n') + '\n');
  await Promise.all(Object.keys(stroeme).map(function (j) { return new Promise(function (ok) { stroeme[j].on('finish', ok); if (stroeme[j] !== out) ok(); else out.end(); }); }));
  Object.keys(stroeme).forEach(function (j) { fs.renameSync(path.join(ZIEL, 'tafel-' + j + '.jsonl.teil'), path.join(ZIEL, 'tafel-' + j + '.jsonl')); });

  fs.writeFileSync(path.join(ZIEL, '_reihen.json'), JSON.stringify({ kennung: KENNUNG, reihen: reihenMeta, ciks: reihenJeCik }));
  fs.writeFileSync(path.join(ZIEL, '_auslaend.json'), JSON.stringify({ kennung: KENNUNG, ciks: auslaend }));
  fs.readdirSync(ZIEL).filter(function (f) { return /^tafel-\d{4}\.jsonl$/.test(f) || f === '_reihen.json' || f === '_auslaend.json' || f === '_neudarstellungen.json'; }).sort().forEach(function (f) { hashes[f] = { sha256: sha(path.join(ZIEL, f)), bytes: fs.statSync(path.join(ZIEL, f)).size }; });
  z.hashes = hashes; z.sekunden = Math.round((Date.now() - t0) / 1000); z.stand = new Date().toISOString();
  fs.writeFileSync(path.join(ZIEL, '_bau.json'), JSON.stringify(z, null, 1));
  console.log(JSON.stringify({ filings: z.filings.panelUsStandard, zeilen: z.zeilen, fakten: { eingefuegt: z.fakten.eingefuegt, neudarstellungen: z.fakten.neudarstellungen, rangUmkehr: z.fakten.rangUmkehr }, quartalsgrenzen: z.quartalsgrenzen, abgeleitet: z.abgeleitet, sekunden: z.sekunden }, null, 1));
}
main().catch(function (e) { console.error(e); process.exit(1); });

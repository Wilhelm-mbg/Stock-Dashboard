'use strict';
/* SIEB - Lauf des Daytrader-Siebs (Nr. 107, REGEL.md §4-§6).
 *
 *   node studien/daytrader-sieb-2026-10/sieb.js suche          -> ergebnis-suche.json, kandidaten.json
 *   (kandidaten.json committen = zweites Siegel)
 *   node studien/daytrader-sieb-2026-10/sieb.js bestaetigung   -> ergebnis-bestaetigung.json (verweigert ohne Siegel)
 *   node studien/daytrader-sieb-2026-10/sieb.js bericht        -> ergebnis.json, ERGEBNIS.md
 *
 * Liest die 1m-Kerzen ueber lesen.js der Minutenstudie (unveraendert). Nur lesen, kein Netz.
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var L = require('../vorregistrierung-2026-09-06-signale-minuten/lesen.js');
var K = require('../vorregistrierung-2026-09-06-signale-minuten/konfig.js');
var G = require('./gemeinsam.js');
var S = require('./setups.js');

var HIER = __dirname;
function lies(n) { return JSON.parse(fs.readFileSync(path.join(HIER, n), 'utf8')); }
function schreib(n, o) { fs.writeFileSync(path.join(HIER, n), JSON.stringify(o, null, 1)); }

/* ---------- Daten eines Wertes fuer eine Tagesliste ---------- */
function ladeWert(R, tage) {
  var kal = K.kalender(), noetig = {};
  tage.forEach(function (t) {
    noetig[+t.slice(0, 4)] = 1;
    var i = kal.idx[t];
    noetig[+kal.tage[i - G.KLASSE_FENSTER].slice(0, 4)] = 1;
  });
  var tagSet = {}; tage.forEach(function (t) { tagSet[t] = 1; });
  var agg = {}, kerzen = {}, aus = new Set(), fehlt = [];
  Object.keys(noetig).map(Number).sort().forEach(function (y) {
    var j = L.ladeJahr(R, y);
    if (!j.ok) { fehlt.push(y + ': ' + j.grund); return; }
    L.ausschlussTage(R, L.massnahmenFuer(R), j.quelle, j.angewandt).forEach(function (t) { aus.add(t); });
    var ks = j.kerzen;
    for (var a = 0; a < ks.length;) {
      var t = L.tagVon(ks[a][0]), b = a, sv = 0, hi = -Infinity, lo = Infinity;
      while (b < ks.length && L.tagVon(ks[b][0]) === t) { sv += ks[b][2]; if (ks[b][3] > hi) hi = ks[b][3]; if (ks[b][4] < lo) lo = ks[b][4]; b++; }
      agg[t] = { schluss: ks[b - 1][1], hoch: hi, tief: lo, umsatz: ks[b - 1][1] * sv, n: b - a };
      if (tagSet[t]) kerzen[t] = ks.slice(a, b);
      a = b;
    }
  });
  return { agg: agg, kerzen: kerzen, aus: aus, fehlt: fehlt };
}

/* ---------- Lauf einer Phase ---------- */
function lauf(phase, nurKeys) {
  var kal = K.kalender();
  var tage = lies('tage.json')[phase];
  var werte = lies('werte.json').werte;
  var setups = S.SETUPS.filter(function (s) { return !nurKeys || nurKeys.indexOf(s.key) !== -1; });
  var spyR = { reihe: 'SPY', ordner: L.ordnerFuer('SPY'), schnittMs: null, abMs: null };
  var spy = ladeWert(spyR, tage);
  var handel = [], zaehl = { wertTage: 0, ausschluss: 0, duenn: 0, ohneVortag: 0, ohneKlasse: 0, ohneKerzen: 0 }, fehlt = [];
  var reihen = {}; L.reihen().forEach(function (R) { reihen[R.reihe] = R; });
  werte.forEach(function (w, wi) {
    var D = ladeWert(reihen[w.sym], tage);
    if (D.fehlt.length) fehlt.push(w.sym + ' ' + D.fehlt.join('; '));
    var gut = [];
    tage.forEach(function (t) {
      zaehl.wertTage++;
      var k = D.kerzen[t], i = kal.idx[t], e = kal.close[t], soll = G.sollMinuten(e);
      if (D.aus.has(t)) { zaehl.ausschluss++; return; }
      if (!k || !k.length) { zaehl.ohneKerzen++; return; }
      if (k.length < K.DICHTE_MIN * soll) { zaehl.duenn++; return; }
      var v = D.agg[kal.tage[i - 1]];
      if (!v) { zaehl.ohneVortag++; return; }
      var us = [];
      for (var d = i - G.KLASSE_FENSTER; d < i; d++) { var a = D.agg[kal.tage[d]]; if (a) us.push(a.umsatz); }
      var kl = us.length >= G.KLASSE_MIN_TAGE ? K.klasseIndex(G.median(us)) : -1;
      if (kl < 0) { zaehl.ohneKlasse++; return; }
      gut.push({ t: t, k: k, kl: kl, ctx: { auf: L.schlussMs(t, k[0][0]) - soll * 60000, soll: soll, vortag: v, spy: spy.kerzen[t] || null } });
    });
    gut.forEach(function (T, ti) {
      var k = T.k, ctx = T.ctx, kl = T.kl;
      setups.forEach(function (St) {
        var sg = S.erstesSignal(St, k, ctx);
        if (!sg) return;
        var h = S.handel(St, k, sg.i, sg.dir, ctx);
        var p = S.placeboUhrzeit(gut, ti, h.mEin, h.mAus, sg.dir);
        var z = G.zufall(G.hash(w.sym + '|' + T.t + '|' + St.key));
        var pZ = S.placebo(k, h.mAus - h.mEin, sg.dir, ctx, z, G.PLACEBO_ZUEGE);
        handel.push({ s: St.key, d: sg.dir, t: T.t, w: w.sym, r: h.r, p: p, pZufall: pZ, K: K.KLASSEN[kl].huerde,
          kF: K.huerdeFenster(kl, h.mEin, ctx.soll), kl: kl, mEin: h.mEin, mAus: h.mAus });
      });
    });
    process.stderr.write('\r' + (wi + 1) + '/' + werte.length + ' ' + w.sym + '   ');
  });
  process.stderr.write('\n');
  return { phase: phase, tage: tage, zaehl: zaehl, fehlt: fehlt, spyFehlt: spy.fehlt, handel: handel, setups: setups.map(function (s) { return s.key; }) };
}

/* ---------- Statistik: Tag ist die Clustereinheit ---------- */
function tStat(xs) {
  var n = xs.length; if (n < 2) return { mittel: n ? xs[0] : null, se: null, t: null, n: n };
  var mu = xs.reduce(function (a, b) { return a + b; }, 0) / n;
  var v = xs.reduce(function (a, b) { return a + (b - mu) * (b - mu); }, 0) / (n - 1);
  var se = Math.sqrt(v / n);
  return { mittel: mu, se: se, t: se > 0 ? mu / se : null, n: n };
}
function auswerten(L1) {
  var aus = [];
  S.SETUPS.forEach(function (St) {
    if (L1.setups.indexOf(St.key) === -1) return;
    [1, -1].forEach(function (dir) {
      var hs = L1.handel.filter(function (h) { return h.s === St.key && h.d === dir && h.p != null; });
      var jeTag = {};
      hs.forEach(function (h) { (jeTag[h.t] = jeTag[h.t] || []).push(h); });
      var tage = Object.keys(jeTag).sort();
      function tm(f) { return tage.map(function (t) { var a = jeTag[t]; return a.reduce(function (s, h) { return s + f(h); }, 0) / a.length; }); }
      var brutto = tStat(tm(function (h) { return h.r; })), netto = tStat(tm(function (h) { return h.r - h.K; }));
      var nettoF = tStat(tm(function (h) { return h.r - h.kF; })), plac = tStat(tm(function (h) { return h.p; }));
      var diff = tStat(tm(function (h) { return h.r - h.p; }));
      var diffZ = tStat(tm(function (h) { return h.pZufall == null ? 0 : h.r - h.pZufall; }));
      var gew = hs.length ? hs.reduce(function (s, h) { return s + h.r - h.K; }, 0) / hs.length : null;
      var sieb = tage.length >= G.SIEB.minTage && netto.mittel > 0 && diff.t != null && diff.t >= G.SIEB.tMin;
      aus.push({ setup: St.key, name: St.name, richtung: dir > 0 ? 'long' : 'short', handel: hs.length, tage: tage.length,
        brutto: brutto.mittel, netto: netto.mittel, tNetto: netto.t, nettoFensterHuerde: nettoF.mittel, placebo: plac.mittel,
        ueberPlacebo: diff.mittel, tGebuendelt: diff.t, mde80: diff.se != null ? 2.8 * diff.se : null, nettoHandelGewichtet: gew,
        nachrichtlichPlaceboZufallsminute: { ueber: diffZ.mittel, t: diffZ.t, hinweis: 'verzerrt (REGEL §5), kein Urteil' },
        haltedauerMin: hs.length ?hs.reduce(function (s, h) { return s + h.mAus - h.mEin; }, 0) / hs.length : null, besteht: !!sieb });
    });
  });
  return aus;
}

function gitSauber(datei) {
  var rel = path.relative(K.REPO, path.join(HIER, datei)).replace(/\\/g, '/');
  var hash = cp.execFileSync('git', ['log', '-1', '--format=%H', '--', rel], { cwd: K.REPO }).toString().trim();
  var dreck = cp.execFileSync('git', ['status', '--porcelain', '--', rel], { cwd: K.REPO }).toString().trim();
  return hash && !dreck ? hash : null;
}

function main() {
  var phase = process.argv[2];
  if (phase === 'suche') {
    var L1 = lauf('suche'), zeilen = auswerten(L1);
    schreib('ergebnis-suche.json', { erstellt: new Date().toISOString(), zaehl: L1.zaehl, fehlt: L1.fehlt, spyFehlt: L1.spyFehlt, tests: zeilen.length, zeilen: zeilen });
    var kand = zeilen.filter(function (z) { return z.besteht; }).map(function (z) { return { setup: z.setup, richtung: z.richtung, netto: z.netto, tGebuendelt: z.tGebuendelt }; });
    schreib('kandidaten.json', { regel: 'REGEL.md §6: netto > 0 und t (ueber Placebo, ueber Tage gebuendelt) >= 2, mindestens 5 Signaltage', tests: zeilen.length, kandidaten: kand });
    zeilen.forEach(function (z) { console.log(z.setup, z.richtung, z.handel, z.tage, 'netto', z.netto && z.netto.toFixed(3), 't', z.tGebuendelt && z.tGebuendelt.toFixed(2), z.besteht ? 'KANDIDAT' : ''); });
    console.log('Kandidaten:', kand.length, JSON.stringify(L1.zaehl));
  } else if (phase === 'bestaetigung') {
    var siegel = gitSauber('kandidaten.json');
    if (!siegel) throw new Error('kandidaten.json ist nicht committet oder veraendert - Bestaetigungstage bleiben verschlossen.');
    var k = lies('kandidaten.json').kandidaten;
    if (!k.length) { console.log('Keine Kandidaten - Bestaetigungstage bleiben verschlossen.'); return; }
    var keys = k.map(function (x) { return x.setup; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
    var L2 = lauf('bestaetigung', keys), z2 = auswerten(L2).filter(function (z) { return k.some(function (x) { return x.setup === z.setup && x.richtung === z.richtung; }); });
    schreib('ergebnis-bestaetigung.json', { erstellt: new Date().toISOString(), siegelKandidaten: siegel, zaehl: L2.zaehl, fehlt: L2.fehlt, zeilen: z2 });
    z2.forEach(function (z) { console.log(z.setup, z.richtung, z.handel, z.tage, 'netto', z.netto && z.netto.toFixed(3), 't', z.tGebuendelt && z.tGebuendelt.toFixed(2), z.besteht ? 'BESTAETIGT' : 'nicht bestaetigt'); });
  } else if (phase === 'bericht') {
    bericht();
  } else {
    console.log('Aufruf: node sieb.js suche | bestaetigung | bericht');
  }
}

function f(x, n) { return x == null ? '—' : x.toFixed(n == null ? 3 : n).replace('.', ','); }
function bericht() {
  var s = lies('ergebnis-suche.json'), b = null;
  try { b = lies('ergebnis-bestaetigung.json'); } catch (e) { b = null; }
  var kand = lies('kandidaten.json').kandidaten;
  var zeilen = s.zeilen.map(function (z) {
    var ist = kand.some(function (x) { return x.setup === z.setup && x.richtung === z.richtung; });
    var bz = b && b.zeilen.filter(function (x) { return x.setup === z.setup && x.richtung === z.richtung; })[0];
    return { suche: z, kandidat: ist, bestaetigung: bz || null, vielversprechend: !!(ist && bz && bz.besteht) };
  });
  schreib('ergebnis.json', { auftrag: 'Nr. 107 Daytrader-Sieb', tests: s.tests, zaehlSuche: s.zaehl, zaehlBestaetigung: b ? b.zaehl : null,
    siegelKandidaten: b ? b.siegelKandidaten : null, zeilen: zeilen });
  var md = [];
  md.push('# Daytrader-Sieb (Nr. 107) — Ergebnis');
  md.push('');
  md.push('50 US-Aktien aus 11 Sektoren, 1m-Kerzen, reguläre Sitzung. Suche: 20 geseedete Tage 2023–2024; Bestätigung: 20 andere Tage 2025–2026, '
    + 'erst nach dem Siegel der Kandidatenliste geöffnet. Werte in Pp je Handel, Mittel über **Tagesmittel**; t über Tage gebündelt (Handel minus Placebo). '
    + 'Netto = brutto − K der Umsatzklasse (Marktorder, Fenster „mitte"). Placebo = derselbe Wert zur selben Uhrzeit, gleiche Richtung, '
    + 'Mittel der anderen 19 Tage der Phase (REGEL §5; das Zufallsminuten-Placebo des Auftrags ist verzerrt und steht nur in `ergebnis.json`). Testzahl ' + s.tests + ' (9 Setups × long/short). Regel: `REGEL.md`. Keine Anlageberatung.');
  md.push('');
  md.push('| Setup | Richtung | Handel | Tage | brutto | netto | Placebo | über Placebo | t gebündelt | Sieb | Bestätigung (netto / t) |');
  md.push('|---|---|---|---|---|---|---|---|---|---|---|');
  zeilen.forEach(function (z) {
    var a = z.suche, bz = z.bestaetigung;
    var best = !z.kandidat ? '—' : !bz ? 'nicht gelaufen' : (bz.besteht ? '**ja**' : 'nein') + ' (' + f(bz.netto) + ' / ' + f(bz.tGebuendelt, 2) + ')';
    md.push('| ' + a.name + ' | ' + a.richtung + ' | ' + a.handel + ' | ' + a.tage + ' | ' + f(a.brutto) + ' | ' + f(a.netto) + ' | ' + f(a.placebo) + ' | '
      + f(a.ueberPlacebo) + ' | ' + f(a.tGebuendelt, 2) + ' | ' + (a.besteht ? '**ja**' : 'nein') + ' | ' + best + ' |');
  });
  md.push('');
  var vv = zeilen.filter(function (z) { return z.vielversprechend; });
  md.push('**Vielversprechend:** ' + (vv.length ? vv.map(function (z) { return z.suche.name + ' ' + z.suche.richtung; }).join(', ') : 'keiner') + '. '
    + '**Im Sieb hängen geblieben:** ' + zeilen.filter(function (z) { return z.kandidat; }).length + ' von ' + s.tests + '.');
  md.push('');
  md.push('Zählung Suche: ' + JSON.stringify(s.zaehl) + (b ? '; Bestätigung: ' + JSON.stringify(b.zaehl) : '') + '. Short braucht Leihe; die Hürde ist dort eine Untergrenze. '
    + 'Netto mit Einstiegsfenster-Hürde (nachrichtlich, Eröffnung 1,8–2,7 × teurer) steht in `ergebnis.json`. 20 Cluster je Phase: ein t ≥ 2 ist ein Sieb, kein Beleg.');
  fs.writeFileSync(path.join(HIER, 'ERGEBNIS.md'), md.join('\n') + '\n');
  console.log(md.join('\n'));
}

if (require.main === module) main();
module.exports = { lauf: lauf, auswerten: auswerten, tStat: tStat, ladeWert: ladeWert };

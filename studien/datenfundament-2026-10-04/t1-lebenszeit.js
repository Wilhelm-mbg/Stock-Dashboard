'use strict';
/* T1 - Lebenszeit aus den Minuten: zaehlen, nichts aendern.
 *
 * Alte Regel (lesen.js Zeile 78): lebend = letzter TAGESBALKEN >= LEBEND_AB (2026-08-17), Tafel vom 03.09.2026.
 * Neue Regel: lebend = letzter MINUTENTAG (Manifest, Stand 03.10.2026) liegt hoechstens X Handelstage vor dem Ende
 * des Archivs, X = 0, 5, 10, 20.
 *
 * Aufruf:  node t1-lebenszeit.js
 * Schreibt: t1-zahlen.json, t1-reihen.json, t1-wechsel.json, t1-aussetzer.json, t1-leser-veraltet.json, teile/t1.md
 */
var fs = require('fs');
var path = require('path');
var G = require('./gemeinsam.js');

function zaehle(a, f) { var n = 0; a.forEach(function (x) { if (f(x)) n++; }); return n; }
function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

function main() {
  var R = G.reihen(), reihen = R.reihen, kal = R.kal, ende = R.ende;
  var maxTagesbalken = reihen.reduce(function (m, r) { return r.letzterTagesbalkenRoh > m ? r.letzterTagesbalkenRoh : m; }, '');

  /* ---- je Reihe: Abstand, neue Regel je X, Einordnung des Endes ---- */
  reihen.forEach(function (r) {
    r.abstand = r.letzterMinutentag ? kal.abstand(r.letzterMinutentag, ende) : null;
    r.lebendNeu = {};
    G.X_WERTE.forEach(function (x) { r.lebendNeu[x] = G.lebendNachMinuten(r.letzterMinutentag, ende, x, kal, r.erloschen); });
    r.tagesbalkenNachMinuten = r.letzterMinutentag ? G.tageZwischen(r.letzterMinutentag, r.letzterTagesbalken) : null;
    r.tagesbalkenBisZuletzt = r.letzterTagesbalkenRoh === maxTagesbalken ? 1 : 0;
    var e = r.letzterMinutentag ? G.endeEinordnen({ lmt: r.letzterMinutentag, ende: ende, kal: kal, polygon: r.polygon, tagesbalkenBisZuletzt: !!r.tagesbalkenBisZuletzt }) : { gruppe: 'ohne-minuten' };
    r.gruppeEnde = r.erloschen ? 'erloschener-traeger' : e.gruppe; r.polygonBis = e.polygonBis; r.polygonDiff = e.polygonDiff;
  });

  /* ---- Zahlen des PM nachzaehlen ---- */
  var Z = { stand: null, ende: ende, manifestStand: R.manifestStand, lebenszeitStand: R.lebenszeitStand, minutenStand: R.minutenStand,
    polygonStand: R.polygonStand, polygonLetztesBis: R.polygonLetztesBis, kalenderGeholt: kal.geholt, maxTagesbalken: maxTagesbalken, lebendAb: G.LEBEND_AB };
  Z.aktienreihen = reihen.length;
  Z.lebendAlt = zaehle(reihen, function (r) { return r.lebendAlt === 1; });
  Z.erloscheneTraeger = zaehle(reihen, function (r) { return r.erloschen; });
  /* "bei 257 laeuft der Tagesbalken mehr als 90 Tage hinter den letzten Minutentag" */
  Z.pm257 = {
    behauptet: 257,
    lebenszeitFeld_rohLetzter: zaehle(reihen, function (r) { return r.lmtLebenszeit && G.tageZwischen(r.lmtLebenszeit, r.letzterTagesbalkenRoh) > 90; }),
    lebenszeitFeld_mitSchnitt: zaehle(reihen, function (r) { return r.lmtLebenszeit && G.tageZwischen(r.lmtLebenszeit, r.letzterTagesbalken) > 90; }),
    manifest_mitSchnitt: zaehle(reihen, function (r) { return r.tagesbalkenNachMinuten > 90; }),
    manifest_ueber30: zaehle(reihen, function (r) { return r.tagesbalkenNachMinuten > 30; }),
    manifest_ueber3: zaehle(reihen, function (r) { return r.tagesbalkenNachMinuten > 3; })
  };
  /* "bei 39 gilt eine Reihe als lebend, obwohl ihr letzter Minutentag mehr als 30 Tage vor LEBEND_AB liegt" */
  Z.pm39 = {
    behauptet: 39,
    lebenszeitFeld: zaehle(reihen, function (r) { return r.lebendAlt === 1 && r.lmtLebenszeit && G.tageZwischen(r.lmtLebenszeit, G.LEBEND_AB) > 30; }),
    manifest: zaehle(reihen, function (r) { return r.lebendAlt === 1 && r.letzterMinutentag && G.tageZwischen(r.letzterMinutentag, G.LEBEND_AB) > 30; })
  };
  var die39 = reihen.filter(function (r) { return r.lebendAlt === 1 && r.lmtLebenszeit && G.tageZwischen(r.lmtLebenszeit, G.LEBEND_AB) > 30; });
  Z.pm39.polygonEinsBisVierTageDanach = zaehle(die39, function (r) { return r.polygon.some(function (b) { var d = G.tageZwischen(r.lmtLebenszeit, b); return d >= 1 && d <= 4; }); });
  Z.pm39.wiederMinutenSeither = die39.filter(function (r) { return r.letzterMinutentag > r.lmtLebenszeit; }).map(function (r) { return { reihe: r.reihe, lmtLebenszeit: r.lmtLebenszeit, lmtManifest: r.letzterMinutentag, minutentageNeu: r.minutentageManifest - r.minutentageLebenszeit }; });
  /* Manifest gegen das Feld der Lebenszeit-Tafel: wo ist das Manifest weiter, wo zurueck? */
  Z.manifestGegenLebenszeit = {
    gleich: zaehle(reihen, function (r) { return r.lmtLebenszeit === r.letzterMinutentag; }),
    manifestSpaeter: zaehle(reihen, function (r) { return r.lmtLebenszeit && r.letzterMinutentag > r.lmtLebenszeit; }),
    manifestFrueher: zaehle(reihen, function (r) { return r.lmtLebenszeit && r.letzterMinutentag < r.lmtLebenszeit; }),
    ohneFeld: zaehle(reihen, function (r) { return !r.lmtLebenszeit; })
  };

  /* ---- Wechsel je X ---- */
  Z.jeX = {};
  var wechsel = {};
  G.X_WERTE.forEach(function (x) {
    var ab = reihen.filter(function (r) { return r.lebendAlt === 1 && r.lebendNeu[x] === 0; });
    var auf = reihen.filter(function (r) { return r.lebendAlt === 0 && r.lebendNeu[x] === 1; });
    var nachleben = ab.filter(function (r) { return r.tagesbalkenNachMinuten > 30; });
    Z.jeX[x] = { lebendNeu: zaehle(reihen, function (r) { return r.lebendNeu[x] === 1; }), lebendZuAbgegangen: ab.length, abgegangenZuLebend: auf.length,
      davonNachlebenUeber30Tage: nachleben.length, davonEndeNachTafelstand: zaehle(ab, function (r) { return r.letzterMinutentag > maxTagesbalken; }),
      davonEndeBisTafelstand: zaehle(ab, function (r) { return r.letzterMinutentag <= maxTagesbalken && !(r.tagesbalkenNachMinuten > 30); }),
      gruppen: ab.reduce(function (a, r) { a[r.gruppeEnde] = (a[r.gruppeEnde] || 0) + 1; return a; }, {}) };
    wechsel[x] = { lebendZuAbgegangen: ab.map(zeile), abgegangenZuLebend: auf.map(zeile) };
  });

  /* ---- Aussetzer: Ende in den letzten 60 Handelstagen (Abstand 1..60), alle Aktienreihen ---- */
  var live = {}; try { live = G.json(G.ROH + '/_livestand.json').werte || {}; } catch (e) { live = {}; }
  var aus = reihen.filter(function (r) { return !r.erloschen && r.abstand >= 1 && r.abstand <= G.FENSTER_AUSSETZER; });
  aus.forEach(function (r) {
    var m = G.massnahmen(r.ordner);
    r.massnahmeEnde = m.ende ? { art: m.ende.art, ex: m.ende.ex, neuesKuerzel: m.ende.neuesKuerzel, diff: G.tageZwischen(r.letzterMinutentag, m.ende.ex) } : null;
    r.imLiveSammler = live[r.basis] ? 1 : 0;
    r.yahoo = yahooNach(r.basis, r.letzterMinutentag);
    var d26 = (G.manifest().jeOrdner[r.ordner] || []).filter(function (e) { return e.jahr === 2026; })[0];
    r.dichte2026 = d26 ? Math.round(1000 * d26.tage / Math.max(1, kal.abstand(G.etTag(d26.erster), G.etTag(d26.letzter)) + 1)) / 1000 : null;
  });
  var gruppen = {};
  aus.forEach(function (r) { (gruppen[r.gruppeEnde] = gruppen[r.gruppeEnde] || []).push(zeileAus(r)); });
  Z.aussetzer = { fensterHandelstage: G.FENSTER_AUSSETZER, ersterTagImFenster: kal.tage[kal.hIdx(ende) - 1 - G.FENSTER_AUSSETZER + 1 - 1] || null, n: aus.length,
    jeGruppe: Object.keys(gruppen).reduce(function (a, k) { a[k] = gruppen[k].length; return a; }, {}),
    jeGruppeLebendAlt: Object.keys(gruppen).reduce(function (a, k) { a[k] = zaehle(gruppen[k], function (z) { return z.lebendAlt === 1; }); return a; }, {}),
    polygonKannNichtBelegenAb: G.tagPlus(R.polygonLetztesBis, -G.ABGANG_NACH_TAGE),
    endeNachPolygonStand: zaehle(aus, function (r) { return r.letzterMinutentag > R.polygonLetztesBis; }) };

  /* ---- Leser-Sicht: bereinigte Kopie des letzten Jahres aelter als die Rohdatei ---- */
  var bm = G.json(G.BER + '/_manifest.json');
  var veraltet = [], berLetztesJahr = 0;
  reihen.forEach(function (r) {
    var jd = (G.manifest().jeOrdner[r.ordner] || []).slice().sort(function (a, b) { return a.jahr - b.jahr; });
    if (!jd.length) return;
    var l = jd[jd.length - 1], b = bm.eintraege[r.ordner + '/' + l.jahr + '.json'];
    if (!b) return;
    berLetztesJahr++;
    if (b.letzter < l.letzter) veraltet.push({ reihe: r.reihe, jahr: l.jahr, leserEnde: G.etTag(b.letzter), rohEnde: G.etTag(l.letzter),
      handelstageFehlen: kal.abstand(G.etTag(b.letzter), G.etTag(l.letzter)), kerzenBereinigt: b.kerzen, kerzenRoh: l.kerzen, lebendAlt: r.lebendAlt });
  });
  veraltet.sort(function (a, b) { return b.handelstageFehlen - a.handelstageFehlen || (a.reihe < b.reihe ? -1 : 1); });
  Z.leserVeraltet = { bereinigtStand: bm.stand, reihenMitKopieDesLetztenJahres: berLetztesJahr, kopieEndetVorRohdatei: veraltet.length,
    jeLeserEnde: veraltet.reduce(function (a, v) { a[v.leserEnde] = (a[v.leserEnde] || 0) + 1; return a; }, {}) };
  /* alle bereinigten 2026er Kopien (auch Nicht-Aktien) */
  var alle26 = Object.keys(bm.eintraege).filter(function (k) { return /\/2026\.json$/.test(k); });
  var rohMan = G.json(G.ROH + '/_manifest.json').eintraege;
  Z.leserVeraltet.alleOrdner2026 = { kopien: alle26.length, veraltet: zaehle(alle26, function (k) { return rohMan[k] && rohMan[k].letzter > bm.eintraege[k].letzter; }) };

  /* ---- Verteilung des letzten Minutentags am Rand (fuer T6c mitbenutzt) ---- */
  var rand = {};
  reihen.forEach(function (r) { if (r.abstand != null && r.abstand <= 25) rand[r.abstand] = (rand[r.abstand] || 0) + 1; });
  Z.abstandVerteilungBis25 = rand;

  Z.stand = new Date().toISOString();
  G.schreibe('t1-zahlen.json', Z);
  G.schreibe('t1-wechsel.json', { stand: Z.stand, ende: ende, hinweis: 'lebendAlt aus lesen.js (Tagesbalken, Tafel 03.09.2026); lebendNeu aus dem Manifest (03.10.2026).', jeX: wechsel });
  G.schreibe('t1-aussetzer.json', { stand: Z.stand, ende: ende, regel: 'Klaerung 2 des Auftrags; Polygon-Liste endet am ' + R.polygonLetztesBis, zahlen: Z.aussetzer, gruppen: gruppen });
  G.schreibe('t1-leser-veraltet.json', { stand: Z.stand, zahlen: Z.leserVeraltet, reihen: veraltet });
  /* kompakte Tafel aller Reihen: Eingang fuer T2 und T3 */
  var kompakt = { stand: Z.stand, ende: ende, spalten: ['reihe', 'ordner', 'lebendAlt', 'erloschen', 'letzterTagesbalken', 'letzterMinutentag', 'abstand', 'lebendX0', 'lebendX5', 'lebendX10', 'lebendX20', 'gruppeEnde', 'polygonBis'],
    reihen: reihen.map(function (r) { return [r.reihe, r.ordner, r.lebendAlt, r.erloschen, r.letzterTagesbalken, r.letzterMinutentag, r.abstand, r.lebendNeu[0], r.lebendNeu[5], r.lebendNeu[10], r.lebendNeu[20], r.gruppeEnde, r.polygonBis]; }) };
  fs.writeFileSync(path.join(G.HIER, 't1-reihen.json'), JSON.stringify(kompakt).replace(/\],\[/g, '],\n['));

  /* ---- Textteil ---- */
  var T = [];
  var xT = G.X_TROCKENLAUF, abT = reihen.filter(function (r) { return r.lebendAlt === 1 && r.lebendNeu[xT] === 0; });
  T.push('### T1 - Wechsel lebend -> abgegangen bei X = ' + xT + ': die 30 groessten (Tagesbalken am weitesten hinter den Minuten)', '');
  T.push(kopf());
  abT.slice().sort(function (a, b) { return b.tagesbalkenNachMinuten - a.tagesbalkenNachMinuten || (a.reihe < b.reihe ? -1 : 1); }).slice(0, 30).forEach(function (r) { T.push(mdZeile(r)); });
  T.push('', '### T1 - dieselbe Menge: 20 zufaellig gezogene (Saat `t1-wechsel-x10`)', '', kopf());
  G.ziehe(abT, 20, 't1-wechsel-x10', function (r) { return r.reihe; }).forEach(function (r) { T.push(mdZeile(r)); });
  if (!fs.existsSync(path.join(G.HIER, 'teile'))) fs.mkdirSync(path.join(G.HIER, 'teile'));
  fs.writeFileSync(path.join(G.HIER, 'teile', 't1.md'), T.join('\n') + '\n');

  /* ---- Ausgabe ---- */
  console.log('Aktienreihen', fmt(Z.aktienreihen), '| lebend alt', fmt(Z.lebendAlt), '| Ende des Archivs', ende, '| letzter Tagesbalken der Tafel', maxTagesbalken);
  console.log('PM 257:', JSON.stringify(Z.pm257));
  console.log('PM 39:', JSON.stringify(Z.pm39));
  console.log('Manifest gegen Lebenszeit-Feld:', JSON.stringify(Z.manifestGegenLebenszeit));
  G.X_WERTE.forEach(function (x) { console.log('X=' + x, JSON.stringify(Z.jeX[x])); });
  console.log('Aussetzer:', JSON.stringify(Z.aussetzer));
  console.log('Leser veraltet:', JSON.stringify(Z.leserVeraltet));
  console.log('Abstand-Verteilung:', JSON.stringify(Z.abstandVerteilungBis25));
}

function zeile(r) {
  return { reihe: r.reihe, letzterMinutentag: r.letzterMinutentag, letzterTagesbalken: r.letzterTagesbalken, abstandHandelstage: r.abstand,
    tagesbalkenNachMinuten: r.tagesbalkenNachMinuten, polygonBis: r.polygonBis, polygonDiff: r.polygonDiff, gruppeEnde: r.gruppeEnde, lmtLebenszeit: r.lmtLebenszeit };
}
function zeileAus(r) {
  var z = zeile(r);
  z.lebendAlt = r.lebendAlt; z.massnahmeEnde = r.massnahmeEnde; z.imLiveSammler = r.imLiveSammler; z.yahoo = r.yahoo; z.dichte2026 = r.dichte2026;
  z.tagesbalkenBisZuletzt = r.tagesbalkenBisZuletzt; z.polygonAlle = r.polygon;
  return z;
}
/** Yahoo-Tageskerzen (archiv1d, andere Quelle) nach dem letzten Minutentag: Zahl der Tage mit Umsatz, letzter Tag. */
function yahooNach(sym, lmt) {
  var p = G.ARCHIV + '/archiv1d/bars_1d_' + sym + '.json';
  if (!fs.existsSync(p)) return null;
  try {
    var j = JSON.parse(fs.readFileSync(p, 'utf8')), n = 0, letzter = null, mitUmsatz = 0;
    (j.series || []).forEach(function (k) { var t = G.etTag(k[0]); if (t > lmt) { n++; if (k[2] > 0) mitUmsatz++; } if (!letzter || t > letzter) letzter = t; });
    return { stand: String(j.stand).slice(0, 10), letzterTag: letzter, tageNach: n, tageNachMitUmsatz: mitUmsatz };
  } catch (e) { return { fehler: String(e.message).slice(0, 80) }; }
}
function kopf() { return '| Reihe | letzter Minutentag | letzter Tagesbalken | Tage dazwischen | Abgang laut Polygon | Einordnung |\n|---|---|---|---|---|---|'; }
function mdZeile(r) { return '| ' + [r.reihe, r.letzterMinutentag, r.letzterTagesbalken, r.tagesbalkenNachMinuten, r.polygonBis ? r.polygonBis + ' (' + (r.polygonDiff >= 0 ? '+' : '') + r.polygonDiff + ')' : '-', r.gruppeEnde].join(' | ') + ' |'; }

if (require.main === module) main();

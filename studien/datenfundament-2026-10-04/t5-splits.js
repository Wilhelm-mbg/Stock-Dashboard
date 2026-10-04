'use strict';
/* T5 - die vom Panelbau abgelehnten Split-Saetze in den bereinigten Kopien (Nr. 41): zaehlen und belegen, nichts aendern.
 *
 * Je Satz aus panel-stand.json -> zaehler.splitAbgelehntListe: Schlusskurs am letzten Handelstag vor dem Ex-Tag und am
 * Ex-Tag selbst, in der ROHDATEI (alpaca1m/) und in der BEREINIGTEN Kopie (alpaca1m-bereinigt/), nur regulaere Kerzen.
 * Gelesen wird je Satz die Jahresdatei des Ex-Tags (und die des Vorjahrs, wenn der Vortag dort liegt) aus beiden Ordnern.
 *
 * Aufruf:  node --max-old-space-size=4096 t5-splits.js
 * Schreibt: t5-zahlen.json, t5-saetze.json, teile/t5.md
 */
var fs = require('fs');
var path = require('path');
var G = require('./gemeinsam.js');

var SPERRE_MIN_LOG = 0.1, SPERRE_ANTEIL = 0.5;               // wie K.SPLIT_SPERRE_* des Pruefstands (konfig.js Zeile 85)

/** Reine Regel: zeigt die Rohreihe am Ex-Tag den Sprung, den der Satz behauptet? (wie paneldaten.js Zeilen 223-235) */
function zeigtSprung(rohVerhaeltnis, faktor) {
  if (!(rohVerhaeltnis > 0) || !(faktor > 0)) return null;
  var soll = -Math.log(faktor), ist = Math.log(rohVerhaeltnis);
  if (!(Math.abs(soll) >= SPERRE_MIN_LOG)) return true;
  return Math.abs(ist - soll) <= (1 - SPERRE_ANTEIL) * Math.abs(soll);
}

var dateiMerk = {};
/** Tagesschluesse (regulaere Sitzung) einer Jahresdatei: { tage: {iso: {c, o, n}}, massnahmen, fehlt }. */
function tage(wurzel, ordner, jahr) {
  var p = wurzel + '/' + ordner + '/' + jahr + '.json';
  if (dateiMerk[p] !== undefined) return dateiMerk[p];
  if (!fs.existsSync(p)) return (dateiMerk[p] = { fehlt: true, tage: {} });
  var j = JSON.parse(fs.readFileSync(p, 'utf8')), aus = {}, s = j.series || [];
  var reg = (j.sitzungen || []).filter(function (b) { return b.sitzung === 'regulaer'; }), bi = 0;
  for (var i = 0; i < s.length; i++) {
    var k = s[i], t = k[0];
    while (bi < reg.length && reg[bi].bis < t) bi++;
    if (bi >= reg.length || t < reg[bi].von) continue;
    if (!(k[1] > 0)) continue;
    var tag = G.etTag(t), e = aus[tag] || (aus[tag] = { o: k[5], c: null, n: 0 });
    e.c = k[1]; e.n++;
  }
  return (dateiMerk[p] = { fehlt: false, tage: aus, massnahmen: j.massnahmen || null, kerzen: s.length });
}
function schluss(wurzel, ordner, tag) { var d = tage(wurzel, ordner, Number(tag.slice(0, 4))); return d.fehlt ? null : (d.tage[tag] ? d.tage[tag].c : null); }
function angewandtIn(kopf, art, ex) {
  if (!kopf) return null;
  var l = Array.isArray(kopf) ? kopf : Object.keys(kopf).map(function (k) { var m = kopf[k] || {}; return Object.assign({ ex: k }, m); });
  return l.some(function (m) { return (m.ex_date || m.ex || m.datum) === ex && (!(m._art || m.art) || (m._art || m.art) === art); }) ? 1 : 0;
}

function main() {
  var S = G.json(path.join(G.PRUEFSTAND, 'panel-stand.json'));
  var liste = S.zaehler.splitAbgelehntListe, bm = G.json(G.BER + '/_manifest.json').eintraege, kal = G.kalender();
  var sy = G.symbole().ordner || {};
  var aus = [], dateienGelesen = 0;
  liste.forEach(function (e) {
    var ordner = sy[e.reihe] || e.reihe, jahr = Number(e.ex.slice(0, 4));
    /* der Ex-Tag selbst oder - wenn er kein Handelstag ist - der naechste; davor der letzte Handelstag */
    var iAb = kal.idx[e.ex]; if (iAb === undefined) iAb = kal.hIdx(e.ex);
    var tagAb = kal.tage[iAb], tagVor = kal.tage[iAb - 1];
    var roh = { vor: null, ab: null }, ber = { vor: null, ab: null };
    /* liegt an einem der beiden Tage keine Kerze, den naechsten Tag mit Kerze nehmen (hoechstens 5 Handelstage weit) */
    function nimm(wurzel, i, schritt) { for (var q = 0; q < 5; q++) { var t = kal.tage[i + q * schritt]; if (!t) break; var c = schluss(wurzel, ordner, t); if (c != null) return { tag: t, c: c }; } return null; }
    var rv = nimm(G.ROH, iAb - 1, -1), ra = nimm(G.ROH, iAb, 1);
    roh.vor = rv; roh.ab = ra;
    var berDa = !!bm[ordner + '/' + jahr + '.json'];
    if (berDa) { ber.vor = rv ? (function () { var c = schluss(G.BER, ordner, rv.tag); if (c == null && Number(rv.tag.slice(0, 4)) !== jahr) c = schluss(G.ROH, ordner, rv.tag); return c == null ? null : { tag: rv.tag, c: c }; })() : null;
      ber.ab = ra ? (function () { var c = schluss(G.BER, ordner, ra.tag); return c == null ? null : { tag: ra.tag, c: c }; })() : null; }
    var kopf = berDa ? tage(G.BER, ordner, jahr).massnahmen : null;
    var rohV = rv && ra ? ra.c / rv.c : null, berV = ber.vor && ber.ab ? ber.ab.c / ber.vor.c : null;
    /* Faktor, den die Kopie am Vortag wirklich traegt: bereinigt = roh / Faktor  =>  Faktor = roh / bereinigt */
    var faktorInKopie = (ber.vor && rv) ? rv.c / ber.vor.c : null, faktorNachEx = (ber.ab && ra) ? ra.c / ber.ab.c : null;
    var angewandt = (faktorInKopie != null && faktorNachEx != null) ? (Math.abs(Math.log(faktorInKopie / faktorNachEx) - Math.log(e.faktor)) < 0.02 ? 1 : 0) : null;
    /* Sprung in den Tagen um den Ex-Tag (Datum um einen Tag verschoben?) */
    var nachbar = null;
    for (var d = -3; d <= 3; d++) {
      if (d === 0) continue;
      var a = schluss(G.ROH, ordner, kal.tage[iAb - 1 + d] || ''), b = schluss(G.ROH, ordner, kal.tage[iAb + d] || '');
      if (a != null && b != null && zeigtSprung(b / a, e.faktor)) nachbar = { tagVor: kal.tage[iAb - 1 + d], tagAb: kal.tage[iAb + d], verhaeltnis: Math.round(1e4 * b / a) / 1e4, versatzHandelstage: d };
    }
    var dateien = Object.keys(bm).filter(function (k) { return k.indexOf(ordner + '/') === 0 && Number(k.split('/')[1].slice(0, 4)) <= jahr; });
    dateienGelesen += 1 + (berDa ? 1 : 0);
    var z = { reihe: e.reihe, ex: e.ex, art: e.art, faktor: e.faktor, erwartetesVerhaeltnis: Math.round(1e4 / e.faktor) / 1e4,
      rohVor: rv, rohAb: ra, rohVerhaeltnis: rohV == null ? null : Math.round(1e4 * rohV) / 1e4, rohVerhaeltnisPanel: Math.round(1e4 * e.rohVerhaeltnis) / 1e4,
      rohZeigtSprung: rohV == null ? null : zeigtSprung(rohV, e.faktor), sprungAmNachbartag: nachbar,
      kopieVorhanden: berDa ? 1 : 0, kopfNenntSatz: angewandtIn(kopf, e.art, e.ex), angewandt: angewandt,
      berVor: ber.vor, berAb: ber.ab, berVerhaeltnis: berV == null ? null : Math.round(1e4 * berV) / 1e4,
      sprungInKopiePct: (angewandt && berV != null) ? Math.round(1e4 * (berV - 1)) / 100 : null,
      kopienBisExJahr: dateien.length, kopienBisExJahrListe: dateien.sort() };
    aus.push(z);
  });
  var ang = aus.filter(function (z) { return z.angewandt === 1; });
  var Z = { stand: new Date().toISOString(), quelle: 'panel-stand.json (' + S.kennung + ')', saetze: aus.length,
    kopieVorhanden: aus.filter(function (z) { return z.kopieVorhanden; }).length, angewandt: ang.length,
    nichtAngewandt: aus.filter(function (z) { return z.angewandt === 0; }).map(function (z) { return z.reihe + ' ' + z.ex; }),
    nichtPruefbar: aus.filter(function (z) { return z.angewandt == null; }).map(function (z) { return z.reihe + ' ' + z.ex + (z.kopieVorhanden ? ' (Kurs fehlt)' : ' (keine Kopie)'); }),
    sprungInKopie: { bisMinus50: ang.filter(function (z) { return z.sprungInKopiePct <= -50; }).length,
      kleinerAbwaerts: ang.filter(function (z) { return z.sprungInKopiePct > -50 && z.sprungInKopiePct < 0; }).length,
      aufwaerts: ang.filter(function (z) { return z.sprungInKopiePct >= 0; }).length,
      groessterAufwaertsPct: ang.reduce(function (m, z) { return z.sprungInKopiePct > m ? z.sprungInKopiePct : m; }, -Infinity) },
    rohZeigtSprungAmExTag: aus.filter(function (z) { return z.rohZeigtSprung === true; }).length,
    rohZeigtSprungAmNachbartag: aus.filter(function (z) { return z.sprungAmNachbartag; }).length,
    rohOhneSprung: aus.filter(function (z) { return z.rohZeigtSprung === false && !z.sprungAmNachbartag; }).length,
    rohVerhaeltnisWeichtVomPanelAb: aus.filter(function (z) { return z.rohVerhaeltnis != null && Math.abs(z.rohVerhaeltnis - z.rohVerhaeltnisPanel) > 0.02 * z.rohVerhaeltnisPanel; }).map(function (z) { return z.reihe + ' ' + z.ex + ': ' + z.rohVerhaeltnis + ' statt ' + z.rohVerhaeltnisPanel; }),
    neuZuBildendeKopien: (function () { var m = {}; ang.forEach(function (z) { z.kopienBisExJahrListe.forEach(function (k) { m[k] = 1; }); }); return Object.keys(m).length; })(),
    reihenBetroffen: Object.keys(ang.reduce(function (m, z) { m[z.reihe] = 1; return m; }, {})).length, dateienGelesen: Object.keys(dateiMerk).length };
  G.schreibe('t5-zahlen.json', Z);
  G.schreibe('t5-saetze.json', { stand: Z.stand, hinweis: 'Je abgelehntem Split-Satz: Schlusskurse (regulaere Sitzung) vor und ab dem Ex-Tag in Roh- und bereinigter Datei. angewandt = die Kopie traegt den Faktor vor dem Ex-Tag und nicht mehr danach.', zahlen: Z, saetze: aus });
  var M = ['### T5 - alle ' + aus.length + ' abgelehnten Split-Saetze', '',
    '| Reihe | Ex-Tag | Art | Faktor | roh davor | roh ab Ex | roh-Verhaeltnis (erwartet) | Rohdatei zeigt den Sprung | Kopie davor | Kopie ab Ex | Sprung in der Kopie | angewandt | Kopien bis Ex-Jahr |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
  aus.forEach(function (z) {
    M.push('| ' + [z.reihe, z.ex, z.art.replace('_splits', ''), z.faktor, z.rohVor ? z.rohVor.c : '-', z.rohAb ? z.rohAb.c : '-', (z.rohVerhaeltnis == null ? '-' : z.rohVerhaeltnis) + ' (' + z.erwartetesVerhaeltnis + ')',
      z.rohZeigtSprung ? 'ja' : (z.sprungAmNachbartag ? 'am Nachbartag (' + z.sprungAmNachbartag.tagAb + ')' : 'nein'), z.berVor ? Math.round(1e4 * z.berVor.c) / 1e4 : '-', z.berAb ? Math.round(1e4 * z.berAb.c) / 1e4 : '-',
      z.sprungInKopiePct == null ? '-' : z.sprungInKopiePct + ' %', z.angewandt === 1 ? 'ja' : z.angewandt === 0 ? 'nein' : (z.kopieVorhanden ? 'unklar' : 'keine Kopie'), z.kopienBisExJahr].join(' | ') + ' |');
  });
  fs.writeFileSync(path.join(G.HIER, 'teile', 't5.md'), M.join('\n') + '\n');
  console.log(JSON.stringify(Z).slice(0, 2500));
}

module.exports = { zeigtSprung: zeigtSprung };
if (require.main === module) main();

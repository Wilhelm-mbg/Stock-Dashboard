'use strict';
/* PANEL v2.3, Bau 2b (Auftrag Nr. 92, Schritt 2b, 04.10.2026) - wie panel-v23.js aus v2.2 abgeleitet (E: nur fuer die Lebenszeit
 * der Minuten gelesen), mit den drei Entscheiden des PM aus der Abnahme von Schritt 2:
 *   1. Ende-Gruende aus der Gruende-Tafel v2.1 (tafel-v2/verschwundene-gruende-v21.json; E6 verwirft wieder, 38 Handeintraege).
 *   2. Eigene Zeilen eines doppelten Abschnitts bleiben: ein Abschnitt mit Zwilling (doppelte-abschnitte-v23.json, Schritt 2,
 *      unveraendert) verliert NUR die Zeilen an Tagen, an denen der Zwilling in v2.2 eine Zeile hat. Bleiben mindestens 20 Zeilen,
 *      bleiben sie als eigener, kuerzerer Abschnitt mit demselben Namen; sein Ende: ende_grund 'umbenennung-ticker', nachfolger =
 *      Zwilling, ende_datum = letzter behaltener Tag (der Pruefstand bucht zum letzten Kurs aus). Unter 20: nichts behalten.
 *   3. lebend = 1 nur, wenn der Abschnitt bis zum letzten (vollstaendigen) Panel-Tag laeuft UND die Lebenszeit aus den Minuten
 *      (E:/Markt-Dashboard-Archiv/alpaca1m-ableitungen/lebenszeit-minuten.json, nur lesen; Schluessel = Feld `ordner`) die Reihe als
 *      lebend fuehrt; sonst 0 mit dem Grund aus der Tafel v2.1. Abschnitte, die in v2.2 nicht lebend waren, bleiben 0.
 * Alle uebrigen Zeilen in allen Spalten unveraendert (sym: laufende Nummer neu, Name gleich). Kennung bleibt K.PANEL_KENNUNG_V23,
 * im Stand bau: '2b'. Gelesen wird Jahresdatei fuer Jahresdatei (nie ein ganzes Panel im Speicher).
 *
 * Aufruf:  node panel-v23b.js
 * Schreibt: voll-v23/panel/ (ueberschreibt den Stand von Schritt 2), voll-v23/gruende-geaendert.json, im Repo
 *           gruende-geaendert-v23b.json und lebend-v23b.json (die 90 frueh endenden "lebenden" Abschnitte aus Schritt 2 u. a.).
 * Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var P = require('./paneldaten.js');
var PV = require('./panel-v23.js');

var V22 = path.join(__dirname, 'voll-v22', 'panel');
var AUS = path.join(__dirname, 'voll-v23');
var PANEL = path.join(AUS, 'panel');
var TAFEL21 = path.join(K.REPO, 'studien', 'datenfundament-2026-10-04', 'tafel-v2', 'verschwundene-gruende-v21.json');
var TAFEL21_KENNUNG = 'datenfundament-2026-10-04/tafel-v2/v2.1';
var LEBENSZEIT = 'E:/Markt-Dashboard-Archiv/alpaca1m-ableitungen/lebenszeit-minuten.json';
var REST_MIN = 20;
var REST_GRUND = 'umbenennung-ticker';

function schreibeJson(p, obj, eng) { fs.writeFileSync(p + '.tmp', eng ? JSON.stringify(obj) : JSON.stringify(obj, null, 1)); fs.renameSync(p + '.tmp', p); }
function schreibeBlock(pfad, sp, n, kopf) {
  var kb = Buffer.from(JSON.stringify(kopf), 'utf8'), len = Buffer.alloc(4);
  len.writeUInt32LE(kb.length, 0);
  var teile = [len, kb];
  P.SPALTEN.forEach(function (s) { var a = sp[s.name]; teile.push(Buffer.from(a.buffer, a.byteOffset, n * a.BYTES_PER_ELEMENT)); });
  fs.writeFileSync(pfad + '.tmp', Buffer.concat(teile));
  fs.renameSync(pfad + '.tmp', pfad);
}
/** Tafel v2.1 als Karte Reihe -> { grund, datum } (nur lesen). */
function tafel21() {
  var j = JSON.parse(fs.readFileSync(TAFEL21, 'utf8'));
  if (j.kennung !== TAFEL21_KENNUNG) throw new Error('Tafel v2.1 traegt ' + j.kennung);
  var m = {}; j.reihen.forEach(function (r) { m[r.reihe] = { grund: r.grund, datum: r.datum }; });
  return { karte: m, kennung: j.kennung, n: j.n };
}
/** Lebenszeit aus den Minuten: Ordner -> { lebend, letzterMinutentag } (nur lesen). */
function lebenszeit() {
  var j = JSON.parse(fs.readFileSync(LEBENSZEIT, 'utf8')), m = {};
  /* Schluessel ist das Feld `ordner` (Ordner im Archiv, wie `ordner` im Panel): die Reihe CON liegt im Ordner CON_7679a0 */
  Object.keys(j.werte).forEach(function (k) {
    var o = j.werte[k].ordner || k;
    if (m[o]) throw new Error('Lebenszeit: Ordner doppelt ' + o);
    m[o] = { reihe: k, lebend: j.werte[k].lebend, letzter: j.werte[k].letzterMinutentag, erloschen: j.werte[k].erloschen };
  });
  return { karte: m, kennung: j.kennung, stand: j.stand, ende: j.endeDesArchivs, regel: j.regel };
}

/** Stand je Reihe (rein; pruefbar). e22 = Eintrag v2.2; x = { karte21, weg (ganz entfernte), rest (Info oder null), letzterTag
 *  (Index des letzten Tages in v2.3), letzterVoll, lz (Lebenszeit-Eintrag oder undefined), tage }. */
function eintragV23b(e22, x) {
  var e = JSON.parse(JSON.stringify(e22)), quelle;
  if (x.rest) {
    e.lebend = 0; e.ende_grund = REST_GRUND; e.ende_datum = x.tage[x.letzterTag]; e.nachfolger = x.rest.zwilling;
    e.rest_v23b = x.rest; quelle = 'rest-doppelt';
  } else if (e22.ende_grund === K.ENDE_GRUND_LUECKE || e22.ende_grund === K.ENDE_GRUND_KUERZEL) quelle = 'v2.2-schnitt';
  else {
    var g = x.karte21[PV.schluessel(e22)] || null;
    e.ende_grund = g ? g.grund : null; e.ende_datum = g ? g.datum : null;
    quelle = g ? 'tafel-v21' : 'tafel-v21-ohne-zeile';
  }
  if (!x.rest && e22.lebend) {
    var bisEnde = x.letzterTag >= x.letzterVoll, minuten = !!(x.lz && x.lz.lebend === 1);
    if (!(bisEnde && minuten)) { e.lebend = 0; e.lebend_v22 = 1; e.lebend_weg = !bisEnde ? (minuten ? 'endet-vor-panelende' : 'endet-vor-panelende+minuten-nicht-lebend') : 'minuten-nicht-lebend'; }
  }
  if (e22.vorgaenger && x.weg[e22.vorgaenger]) { e.vorgaenger = null; e.vorgaenger_entfernt = e22.vorgaenger; }
  return { e: e, quelle: quelle };
}

function main() {
  var t0 = Date.now();
  var DL = JSON.parse(fs.readFileSync(path.join(__dirname, 'doppelte-abschnitte-v23.json'), 'utf8'));
  var S22 = JSON.parse(fs.readFileSync(path.join(V22, '_stand.json'), 'utf8'));
  if (S22.kennung !== K.PANEL_KENNUNG_V22) throw new Error('voll-v22 traegt ' + S22.kennung);
  if (DL.panel !== K.PANEL_KENNUNG_V22) throw new Error('doppelte-abschnitte-v23.json stammt nicht aus v2.2: ' + DL.panel);
  var standAlt = path.join(PANEL, '_stand.json');
  if (fs.existsSync(standAlt) && JSON.parse(fs.readFileSync(standAlt, 'utf8')).kennung !== K.PANEL_KENNUNG_V23) throw new Error('In ' + PANEL + ' liegt ein Panel anderer Kennung - Abbruch.');
  fs.mkdirSync(PANEL, { recursive: true });
  var alt = S22.symbole, nT = S22.tage.length, idx = {};
  alt.forEach(function (r, i) { idx[r.reihe] = i; });
  var zwVon = new Int32Array(alt.length).fill(-1), zwTage = {};
  DL.doppelt.forEach(function (x) {
    if (idx[x.abschnitt] === undefined || idx[x.zwilling] === undefined) throw new Error('nicht in v2.2: ' + x.abschnitt + ' / ' + x.zwilling);
    zwVon[idx[x.abschnitt]] = idx[x.zwilling]; zwTage[idx[x.zwilling]] = new Uint8Array(nT);
  });
  Object.keys(zwTage).forEach(function (s) { if (zwVon[s] >= 0) throw new Error('Kette: Zwilling ' + alt[s].reihe + ' ist selbst doppelt'); });

  /* ---------- Durchgang 1: Zwillingstage, Tage der doppelten Abschnitte, letzter Tag / roher letzter Kurs je Reihe ---------- */
  var dTage = {}, letzter22 = new Int32Array(alt.length).fill(-1), roh22 = new Float64Array(alt.length);
  S22.jahre.forEach(function (j) {
    var b = P.leseBlock(path.join(V22, j.jahr + '.bin'), K.PANEL_KENNUNG_V22);
    for (var i = 0; i < b.n; i++) {
      var s = b.sym[i], t = b.tag[i];
      if (zwTage[s]) zwTage[s][t] = 1;
      if (zwVon[s] >= 0) (dTage[s] = dTage[s] || []).push(t);
      if (t >= letzter22[s]) { letzter22[s] = t; roh22[s] = b.rohSchluss[i]; }
    }
  });
  /* Rest je doppeltem Abschnitt: Zeilen an Tagen ohne Zwillingszeile */
  var weg = {}, rest = {}, RZ = { doppelt: DL.doppelt.length, mitRest: 0, restBehalten: 0, restUnter20: 0, zeilenRestBehalten: 0, zeilenRestUnter20: 0, zeilenZwillingstage: 0, liste: [] };
  Object.keys(dTage).forEach(function (s) {
    s = +s; var z = zwTage[zwVon[s]], tg = dTage[s], r = tg.filter(function (t) { return !z[t]; });
    RZ.zeilenZwillingstage += tg.length - r.length;
    if (r.length) RZ.mitRest++;
    if (r.length >= REST_MIN) {
      RZ.restBehalten++; RZ.zeilenRestBehalten += r.length;
      var luecken = 0; for (var k = 1; k < r.length; k++) if (tg.indexOf(r[k]) - tg.indexOf(r[k - 1]) > 1) luecken++;
      rest[s] = { zwilling: alt[zwVon[s]].reihe, zeilenV22: tg.length, behalten: r.length, entfernt: tg.length - r.length, ersterTag: S22.tage[r[0]], letzterTag: S22.tage[r[r.length - 1]],
        zwillingErsterTag: S22.tage[z.indexOf(1)], unterbrochen: luecken, letzterTagIdx: r[r.length - 1] };
      RZ.liste.push(Object.assign({ abschnitt: alt[s].reihe }, rest[s]));
    } else {
      weg[alt[s].reihe] = 1;
      if (r.length) { RZ.restUnter20++; RZ.zeilenRestUnter20 += r.length; RZ.liste.push({ abschnitt: alt[s].reihe, zwilling: alt[zwVon[s]].reihe, behalten: 0, restZeilen: r.length, unter20: true }); }
    }
  });
  RZ.liste.sort(function (a, b) { return (b.behalten || 0) - (a.behalten || 0); });
  var restTag = {};   /* sym -> Uint8Array: 1 = Zeile bleibt */
  Object.keys(rest).forEach(function (s) { var z = zwTage[zwVon[s]], m = new Uint8Array(nT); dTage[s].forEach(function (t) { if (!z[t]) m[t] = 1; }); restTag[s] = m; });
  var neuIdx = new Int32Array(alt.length).fill(-1), n23 = 0;
  alt.forEach(function (r, i) { if (!weg[r.reihe]) neuIdx[i] = n23++; });

  /* ---------- Durchgang 2: Zeilen schreiben ---------- */
  var gesamt = { zeilen: 0, entfernt: 0, jahre: [], zeilenJeTag: {} }, letzter23 = new Int32Array(alt.length).fill(-1);
  S22.jahre.forEach(function (j) {
    var b = P.leseBlock(path.join(V22, j.jahr + '.bin'), K.PANEL_KENNUNG_V22), keep = new Uint8Array(b.n), m = 0;
    for (var i = 0; i < b.n; i++) {
      var s = b.sym[i];
      keep[i] = neuIdx[s] < 0 ? 0 : zwVon[s] < 0 ? 1 : restTag[s][b.tag[i]];
      m += keep[i];
    }
    var sp = P.leer(m), q = 0;
    for (var i2 = 0; i2 < b.n; i2++) {
      if (!keep[i2]) continue;
      P.SPALTEN.forEach(function (sc) { sp[sc.name][q] = b[sc.name][i2]; });
      sp.sym[q] = neuIdx[b.sym[i2]];
      if (sp.tag[q] > letzter23[b.sym[i2]]) letzter23[b.sym[i2]] = sp.tag[q];
      gesamt.zeilenJeTag[sp.tag[q]] = (gesamt.zeilenJeTag[sp.tag[q]] || 0) + 1;
      q++;
    }
    var kopf = {}; Object.keys(b.kopf).forEach(function (k) { kopf[k] = k === 'kennung' ? K.PANEL_KENNUNG_V23 : k === 'n' ? m : b.kopf[k]; });
    schreibeBlock(path.join(PANEL, j.jahr + '.bin'), sp, m, kopf);
    gesamt.zeilen += m; gesamt.entfernt += b.n - m; gesamt.jahre.push({ jahr: j.jahr, n: m });
    process.stdout.write('v2.3b ' + j.jahr + ': ' + m + ' von ' + b.n + ' Zeilen\n');
  });
  var lv = PV.letzterVoll(gesamt.zeilenJeTag);
  if (lv !== S22.letzterVollTagIdx) throw new Error('letzter vollstaendiger Tag waere ' + lv + ' statt ' + S22.letzterVollTagIdx);

  /* ---------- Stand je Reihe ---------- */
  var T21 = tafel21(), LZ = lebenszeit();
  var Z = { reihenV22: alt.length, reihenV23: n23, ganzEntfernt: Object.keys(weg).length, restBehalten: Object.keys(rest).length, quelle: {}, ohneZeileInTafelV21: [], vorgaengerEntfernt: [],
    grundGeaendert: 0, nurDatumGeaendert: 0, lebend: { v22: 0, v23: 0, weg: {}, ohneLebenszeit: [], v22totAberMinutenLebendBisEnde: [] } };
  var geaendert = [], symbole = [], fruehListe = [], minutenWeg = [];
  alt.forEach(function (r, i) {
    if (neuIdx[i] < 0) return;
    var lz = LZ.karte[r.ordner];
    var x = eintragV23b(r, { karte21: T21.karte, weg: weg, rest: rest[i] || null, letzterTag: letzter23[i], letzterVoll: lv, lz: lz, tage: S22.tage }), e = x.e;
    if (e.rest_v23b) delete e.rest_v23b.letzterTagIdx;
    Z.quelle[x.quelle] = (Z.quelle[x.quelle] || 0) + 1;
    if (x.quelle === 'tafel-v21-ohne-zeile') Z.ohneZeileInTafelV21.push(r.reihe + (e.lebend ? ' (lebend)' : r.lebend ? ' (lebend in v2.2)' : ''));
    if (e.vorgaenger_entfernt) Z.vorgaengerEntfernt.push(r.reihe + ' <- ' + e.vorgaenger_entfernt);
    if (r.lebend) { Z.lebend.v22++; if (!lz) Z.lebend.ohneLebenszeit.push(r.reihe + ' (' + r.ordner + ')'); }
    if (e.lebend) Z.lebend.v23++;
    if (e.lebend_weg) Z.lebend.weg[e.lebend_weg] = (Z.lebend.weg[e.lebend_weg] || 0) + 1;
    if (!r.lebend && letzter23[i] >= lv && lz && lz.lebend === 1) Z.lebend.v22totAberMinutenLebendBisEnde.push(r.reihe + ' (' + r.ende_grund + ')');
    var eintragL = { reihe: r.reihe, ordner: r.ordner, letzterTag: S22.tage[letzter23[i]], grundNeu: e.ende_grund, datumNeu: e.ende_datum, grundV22: r.ende_grund, rohLetzterKurs: roh22[i],
      totalverlust: K.TOTALVERLUST_GRUENDE[e.ende_grund] ? 1 : 0, minutenLebend: lz ? lz.lebend : null, letzterMinutentag: lz ? lz.letzter : null, lebendV23: e.lebend };
    if (r.lebend && letzter22[i] < lv) fruehListe.push(eintragL);
    else if (r.lebend && !e.lebend) minutenWeg.push(eintragL);
    if (e.ende_grund !== r.ende_grund) { Z.grundGeaendert++; geaendert.push({ reihe: r.reihe, lebend: e.lebend, lebendV22: r.lebend, alt: { grund: r.ende_grund, datum: r.ende_datum }, neu: { grund: e.ende_grund, datum: e.ende_datum } }); }
    else if (e.ende_datum !== r.ende_datum) Z.nurDatumGeaendert++;
    symbole.push(e);
  });
  var tv = function (l) { var o = { haupt: 0, streng: 0 }; l.forEach(function (e) { if (e.lebend) return; if (K.TOTALVERLUST_GRUENDE[e.ende_grund]) o.haupt++; if (['insolvenz', 'zwangs-delisting', 'unbekannt', 'freiwillig'].indexOf(e.ende_grund) !== -1) o.streng++; }); return o; };
  var uebergaenge = {}; geaendert.forEach(function (x) { var k = x.alt.grund + ' -> ' + x.neu.grund; uebergaenge[k] = (uebergaenge[k] || 0) + 1; });

  var stand = {};
  Object.keys(S22).forEach(function (k) { stand[k] = S22[k]; });
  stand.kennung = K.PANEL_KENNUNG_V23; stand.bau = '2b'; stand.stand = new Date().toISOString(); stand.zeilen = gesamt.zeilen; stand.jahre = gesamt.jahre; stand.zeilenJeTag = gesamt.zeilenJeTag;
  stand.letzterVollTagIdx = lv; stand.letzterVollTag = S22.tage[lv]; stand.symbole = symbole;
  stand.gruendeKennung = T21.kennung;
  stand.v23 = { bau: '2b', aus: S22.kennung, ausStand: S22.stand, doppelteListe: DL.kennung + ' (' + DL.stand + ')', doppelteAbschnitte: DL.doppelt.length, ganzEntfernt: Z.ganzEntfernt,
    restBehalten: Z.restBehalten, restMin: REST_MIN, restGrund: REST_GRUND, entfernteZeilen: gesamt.entfernt, zeilenZwillingstage: RZ.zeilenZwillingstage, zeilenRestUnter20: RZ.zeilenRestUnter20,
    zeilenV22: S22.zeilen, reihenV22: alt.length, gruendeTafel: T21.kennung, gruendeDatei: path.relative(K.REPO, TAFEL21).replace(/\\/g, '/'),
    lebend: 'lebend = 1 nur, wenn v2.2 lebend, letzter Tag >= letzter voller Panel-Tag und Lebenszeit der Minuten lebend (' + LZ.kennung + ', Stand ' + LZ.stand + ')',
    zaehlerVon: 'v2.2 (Bau-Zaehler unveraendert uebernommen)', grundGeaendert: Z.grundGeaendert };
  schreibeJson(path.join(PANEL, '_stand.json'), stand, true);
  var bericht = { kennung: 'querschnitt-pruefstand-2026-09-13/gruende-geaendert-v23b/v1', stand: stand.stand, panel: K.PANEL_KENNUNG_V23, bau: '2b', tafel: T21.kennung, zaehler: Z, rest: RZ,
    totalverlustAbschnitte: { v22: tv(alt), v23b: tv(symbole) }, uebergaenge: uebergaenge, geaendert: geaendert };
  schreibeJson(path.join(AUS, 'gruende-geaendert.json'), bericht);
  schreibeJson(path.join(__dirname, 'gruende-geaendert-v23b.json'), bericht);
  fruehListe.sort(function (a, b) { return (b.totalverlust - a.totalverlust) || (a.reihe < b.reihe ? -1 : 1); });
  schreibeJson(path.join(__dirname, 'lebend-v23b.json'), { kennung: 'querschnitt-pruefstand-2026-09-13/lebend-v23b/v1', stand: stand.stand, lebenszeit: LZ.kennung + ' (' + LZ.stand + ', Archivende ' + LZ.ende + ')',
    regel: stand.v23.lebend, letzterPanelTag: stand.letzterVollTag, zaehler: Z.lebend,
    fruehEndend: { n: fruehListe.length, mitTotalverlust: fruehListe.filter(function (x) { return x.totalverlust; }).length, liste: fruehListe },
    bisEndeAberMinutenNichtLebend: { n: minutenWeg.length, liste: minutenWeg } });
  process.stdout.write('PANEL v2.3 (Bau 2b): ' + gesamt.zeilen + ' Zeilen (' + gesamt.entfernt + ' entfernt), ' + n23 + ' Reihen, letzter voller Tag ' + stand.letzterVollTag + ' (' + Math.round((Date.now() - t0) / 1000) + ' s)\n');
  process.stdout.write(JSON.stringify({ rest: { mitRest: RZ.mitRest, behalten: RZ.restBehalten, zeilen: RZ.zeilenRestBehalten, unter20: RZ.restUnter20, zeilenUnter20: RZ.zeilenRestUnter20, zwillingstage: RZ.zeilenZwillingstage },
    quelle: Z.quelle, ohneZeile: Z.ohneZeileInTafelV21.length, vorgaengerEntfernt: Z.vorgaengerEntfernt.length, grundGeaendert: Z.grundGeaendert, nurDatum: Z.nurDatumGeaendert,
    lebend: { v22: Z.lebend.v22, v23: Z.lebend.v23, weg: Z.lebend.weg, ohneLebenszeit: Z.lebend.ohneLebenszeit.length, v22totMinutenLebend: Z.lebend.v22totAberMinutenLebendBisEnde.length },
    frueh: fruehListe.length, fruehTV: fruehListe.filter(function (x) { return x.totalverlust; }).length, minutenWeg: minutenWeg.length, totalverlust: bericht.totalverlustAbschnitte }) + '\n');
}

module.exports = { eintragV23b: eintragV23b, REST_MIN: REST_MIN, REST_GRUND: REST_GRUND, TAFEL21: TAFEL21, TAFEL21_KENNUNG: TAFEL21_KENNUNG, LEBENSZEIT: LEBENSZEIT };
if (require.main === module) main();

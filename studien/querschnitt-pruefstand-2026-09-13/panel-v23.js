'use strict';
/* PANEL v2.3 (Auftrag Nr. 92, Schritt 2, Teil 2.2) - abgeleitet aus v2.2, KEIN Neubau aus dem Archiv (E: wird nicht gelesen).
 *
 * Liest voll-v22/panel/ (nur lesen) und voll-v23/doppelte-abschnitte.json (doppelte-v23.js) und schreibt voll-v23/panel/:
 *   - alle Zeilen von v2.2 ausser denen der doppelten Abschnitte, Jahr fuer Jahr in derselben Reihenfolge (tag, sym), alle
 *     Spalten unveraendert bis auf `sym`: die laufende Nummer der Symboltabelle wird ohne Luecken neu vergeben (Reihenfolge
 *     wie in v2.2); die NAMEN bleiben;
 *   - _stand.json mit Kennung K.PANEL_KENNUNG_V23; je Reihe: Abschnitte, die an einer Luecke oder einem Kuerzelwechsel enden,
 *     behalten Grund und Datum aus v2.2; sonst Grund und Datum aus der Gruende-Tafel v2 (K.gruendeV2()) ueber den Reihennamen
 *     (ohne Abschnittsnummer ~N, ausser bei einer zweiten Archiv-Reihe mit eigenem Ordner) - derselbe Schluessel, mit dem v2.2 die alte Tafel las (wird hier an jeder Reihe gegen v2.2
 *     und die alte Tafel nachgeprueft); ein lebender Abschnitt bleibt lebend. War der Vorgaenger-Abschnitt doppelt, nennt
 *     `vorgaenger` null und `vorgaenger_entfernt` den Namen (die erste Zeile bleibt, wie sie ist, auch ohne Rendite).
 *   - voll-v23/gruende-geaendert.json (und im Repo gruende-geaendert-v23.json): jede Reihe, deren Grund sich aendert.
 *
 * Aufruf:  node --max-old-space-size=6144 panel-v23.js
 * Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var P = require('./paneldaten.js');

var V22 = path.join(__dirname, 'voll-v22', 'panel');
var AUS = path.join(__dirname, 'voll-v23');
var PANEL = path.join(AUS, 'panel');

function basis(name) { return String(name).replace(/~\d+$/, ''); }
/** Schluessel in die Tafel: der Reihenname, ohne Abschnittsnummer (~N), wenn der Abschnitt im Ordner des Grundkuerzels liegt
 *  (Luecken- und Kuerzelwechsel-Abschnitte); eine zweite Archiv-Reihe mit eigenem Ordner (AAC~2, CAPA~2, JONE~2) behaelt ihren
 *  Namen. Genau so las v2.2 die alte Tafel (`vorgaenger || reihe`) - nachgeprueft an jeder Reihe (schluesselWieV22). */
function schluessel(r) { return r.ordner === r.reihe ? r.reihe : basis(r.reihe); }
function schreibeJson(p, obj, eng) { fs.writeFileSync(p + '.tmp', eng ? JSON.stringify(obj) : JSON.stringify(obj, null, 1)); fs.renameSync(p + '.tmp', p); }
/** Block im Format von paneldaten.js (schreibeBlock), aber mit dem Kopf, der uebergeben wird (Kennung v2.3). */
function schreibeBlock(pfad, sp, n, kopf) {
  var kb = Buffer.from(JSON.stringify(kopf), 'utf8'), len = Buffer.alloc(4);
  len.writeUInt32LE(kb.length, 0);
  var teile = [len, kb];
  P.SPALTEN.forEach(function (s) { var a = sp[s.name]; teile.push(Buffer.from(a.buffer, a.byteOffset, n * a.BYTES_PER_ELEMENT)); });
  fs.writeFileSync(pfad + '.tmp', Buffer.concat(teile));
  fs.renameSync(pfad + '.tmp', pfad);
}
/** Letzter vollstaendiger Handelstag - dieselbe Regel wie paneldaten.js vereinen() (NACHTRAG 1). */
function letzterVoll(zeilenJeTag) {
  var tagIdx = Object.keys(zeilenJeTag).map(Number).sort(function (x, y) { return x - y; });
  for (var i = tagIdx.length - 1; i >= 5; i--) {
    var vor = []; for (var v = 1; v <= 5; v++) vor.push(zeilenJeTag[tagIdx[i - v]] || 0);
    vor.sort(function (x, y) { return x - y; });
    if ((zeilenJeTag[tagIdx[i]] || 0) >= 0.8 * vor[2]) return tagIdx[i];
  }
  return null;
}

/** Stand je Reihe fuer v2.3 aus dem Eintrag von v2.2 (rein; test-/pruefbar). karte2 = gruendeV2().karte, weg = Namen der doppelten. */
function eintragV23(e22, karte2, weg) {
  var e = JSON.parse(JSON.stringify(e22)), quelle;
  if (e22.ende_grund === K.ENDE_GRUND_LUECKE || e22.ende_grund === K.ENDE_GRUND_KUERZEL) quelle = 'v2.2-schnitt';
  else {
    var g = karte2[schluessel(e22)] || null;
    e.ende_grund = g ? g.grund : null; e.ende_datum = g ? g.datum : null;
    quelle = g ? 'tafel-v2' : 'tafel-v2-ohne-zeile';
  }
  if (e22.vorgaenger && weg[e22.vorgaenger]) { e.vorgaenger = null; e.vorgaenger_entfernt = e22.vorgaenger; }
  return { e: e, quelle: quelle };
}

function main() {
  var t0 = Date.now();
  var DL = JSON.parse(fs.readFileSync(path.join(AUS, 'doppelte-abschnitte.json'), 'utf8'));
  var S22 = JSON.parse(fs.readFileSync(path.join(V22, '_stand.json'), 'utf8'));
  if (S22.kennung !== K.PANEL_KENNUNG_V22) throw new Error('voll-v22 traegt ' + S22.kennung);
  if (DL.panel !== K.PANEL_KENNUNG_V22) throw new Error('doppelte-abschnitte.json stammt nicht aus v2.2: ' + DL.panel);
  var standAlt = path.join(PANEL, '_stand.json');
  if (fs.existsSync(standAlt) && JSON.parse(fs.readFileSync(standAlt, 'utf8')).kennung !== K.PANEL_KENNUNG_V23) throw new Error('In ' + PANEL + ' liegt ein Panel anderer Kennung - Abbruch.');
  fs.mkdirSync(PANEL, { recursive: true });

  var weg = {}; DL.doppelt.forEach(function (x) { weg[x.abschnitt] = 1; });
  var alt = S22.symbole, neuIdx = new Int32Array(alt.length).fill(-1), n23 = 0, wegGefunden = 0;
  alt.forEach(function (r, i) { if (weg[r.reihe]) wegGefunden++; else neuIdx[i] = n23++; });
  if (wegGefunden !== DL.doppelt.length) throw new Error('doppelte Abschnitte nicht alle in v2.2: ' + wegGefunden + ' von ' + DL.doppelt.length);

  /* ---------- Zeilen ---------- */
  var gesamt = { zeilen: 0, entfernt: 0, jahre: [], zeilenJeTag: {} }, entferntJeSym = {};
  S22.jahre.forEach(function (j) {
    var b = P.leseBlock(path.join(V22, j.jahr + '.bin'), K.PANEL_KENNUNG_V22), m = 0;
    for (var i = 0; i < b.n; i++) if (neuIdx[b.sym[i]] >= 0) m++;
    var sp = P.leer(m), q = 0;
    for (var i2 = 0; i2 < b.n; i2++) {
      var ni = neuIdx[b.sym[i2]];
      if (ni < 0) { entferntJeSym[b.sym[i2]] = (entferntJeSym[b.sym[i2]] || 0) + 1; continue; }
      P.SPALTEN.forEach(function (s) { sp[s.name][q] = b[s.name][i2]; });
      sp.sym[q] = ni;
      gesamt.zeilenJeTag[sp.tag[q]] = (gesamt.zeilenJeTag[sp.tag[q]] || 0) + 1;
      q++;
    }
    var kopf = {}; Object.keys(b.kopf).forEach(function (k) { kopf[k] = k === 'kennung' ? K.PANEL_KENNUNG_V23 : k === 'n' ? m : b.kopf[k]; });
    schreibeBlock(path.join(PANEL, j.jahr + '.bin'), sp, m, kopf);
    gesamt.zeilen += m; gesamt.entfernt += b.n - m; gesamt.jahre.push({ jahr: j.jahr, n: m });
    process.stdout.write('v2.3 ' + j.jahr + ': ' + m + ' von ' + b.n + ' Zeilen\n');
  });
  var lv = letzterVoll(gesamt.zeilenJeTag);
  if (lv !== S22.letzterVollTagIdx) throw new Error('letzter vollstaendiger Tag waere ' + lv + ' statt ' + S22.letzterVollTagIdx);

  /* ---------- Stand je Reihe ---------- */
  var karte2 = K.gruendeV2().karte, karte1 = K.gruende().karte;
  var Z = { reihenV22: alt.length, reihenV23: n23, entfernt: wegGefunden, quelle: {}, schluesselWieV22: 0, schluesselAndersAlsV22: [], ohneZeileInTafelV2: [],
    vorgaengerEntfernt: [], grundGeaendert: 0, nurDatumGeaendert: 0 };
  var geaendert = [], symbole = [];
  alt.forEach(function (r, i) {
    if (neuIdx[i] < 0) return;
    var x = eintragV23(r, karte2, weg), e = x.e;
    Z.quelle[x.quelle] = (Z.quelle[x.quelle] || 0) + 1;
    if (x.quelle !== 'v2.2-schnitt') {
      var g1 = karte1[schluessel(r)] || null;   /* Nachpruefung des Schluessels: so las v2.2 die alte Tafel */
      if ((g1 ? g1.grund : null) === r.ende_grund && (g1 ? g1.datum : null) === r.ende_datum) Z.schluesselWieV22++;
      else Z.schluesselAndersAlsV22.push(r.reihe + ' (v2.2 ' + r.ende_grund + ' ' + r.ende_datum + ', alte Tafel ' + (g1 ? g1.grund + ' ' + g1.datum : '-') + ')');
      if (x.quelle === 'tafel-v2-ohne-zeile') Z.ohneZeileInTafelV2.push(r.reihe + (r.lebend ? ' (lebend)' : ''));
    }
    if (e.vorgaenger_entfernt) Z.vorgaengerEntfernt.push(r.reihe + ' <- ' + e.vorgaenger_entfernt);
    if (e.ende_grund !== r.ende_grund) { Z.grundGeaendert++; geaendert.push({ reihe: r.reihe, lebend: r.lebend, alt: { grund: r.ende_grund, datum: r.ende_datum }, neu: { grund: e.ende_grund, datum: e.ende_datum } }); }
    else if (e.ende_datum !== r.ende_datum) Z.nurDatumGeaendert++;
    symbole.push(e);
  });
  var tv = function (l) { var o = { haupt: 0, streng: 0 }; l.forEach(function (e) { if (e.lebend) return; if (K.TOTALVERLUST_GRUENDE[e.ende_grund]) o.haupt++; if (['insolvenz', 'zwangs-delisting', 'unbekannt', 'freiwillig'].indexOf(e.ende_grund) !== -1) o.streng++; }); return o; };
  var uebergaenge = {}; geaendert.forEach(function (x) { var k = x.alt.grund + ' -> ' + x.neu.grund; uebergaenge[k] = (uebergaenge[k] || 0) + 1; });

  var stand = {};
  Object.keys(S22).forEach(function (k) { stand[k] = S22[k]; });
  stand.kennung = K.PANEL_KENNUNG_V23; stand.stand = new Date().toISOString(); stand.zeilen = gesamt.zeilen; stand.jahre = gesamt.jahre; stand.zeilenJeTag = gesamt.zeilenJeTag;
  stand.letzterVollTagIdx = lv; stand.letzterVollTag = S22.tage[lv];   /* Kalender aus dem Stand, nicht K.kalender() (liest E:) */ stand.symbole = symbole;
  stand.gruendeKennung = K.gruendeV2().kennung;
  stand.v23 = { aus: S22.kennung, ausStand: S22.stand, doppelteListe: DL.kennung + ' (' + DL.stand + ')', doppelteAbschnitte: wegGefunden, entfernteZeilen: gesamt.entfernt,
    zeilenV22: S22.zeilen, reihenV22: alt.length, gruendeTafel: K.gruendeV2().kennung, gruendeDatei: path.relative(K.REPO, K.GRUENDE_DATEI_V2).replace(/\\/g, '/'),
    zaehlerVon: 'v2.2 (Bau-Zaehler unveraendert uebernommen)', grundGeaendert: Z.grundGeaendert };
  schreibeJson(path.join(PANEL, '_stand.json'), stand, true);
  var bericht = { kennung: 'querschnitt-pruefstand-2026-09-13/gruende-geaendert-v23/v1', stand: stand.stand, panel: K.PANEL_KENNUNG_V23, tafel: stand.gruendeKennung, zaehler: Z,
    totalverlustAbschnitte: { v22: tv(alt), v23: tv(symbole) }, uebergaenge: uebergaenge, entfernteZeilenJeAbschnitt: Object.keys(entferntJeSym).length, geaendert: geaendert };
  schreibeJson(path.join(AUS, 'gruende-geaendert.json'), bericht);
  schreibeJson(path.join(__dirname, 'gruende-geaendert-v23.json'), bericht);
  process.stdout.write('PANEL v2.3: ' + gesamt.zeilen + ' Zeilen (' + gesamt.entfernt + ' entfernt), ' + n23 + ' Reihen, letzter voller Tag ' + stand.letzterVollTag + ' (' + Math.round((Date.now() - t0) / 1000) + ' s)\n');
  process.stdout.write(JSON.stringify({ quelle: Z.quelle, schluesselWieV22: Z.schluesselWieV22, schluesselAnders: Z.schluesselAndersAlsV22.length, ohneZeile: Z.ohneZeileInTafelV2.length,
    vorgaengerEntfernt: Z.vorgaengerEntfernt.length, grundGeaendert: Z.grundGeaendert, nurDatum: Z.nurDatumGeaendert, totalverlust: bericht.totalverlustAbschnitte }) + '\n');
}

module.exports = { eintragV23: eintragV23, basis: basis, schluessel: schluessel, letzterVoll: letzterVoll };
if (require.main === module) main();

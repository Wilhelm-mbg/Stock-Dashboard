'use strict';
/* DOPPELTE ABSCHNITTE fuer Panel v2.3 (Auftrag Nr. 92, Schritt 2, Teil 2.1) - bestimmt AM PANEL, nicht an der Tafel.
 *
 * Ein Abschnitt (eine Reihe der Symboltabelle) von v2.2, der vor dem letzten Panel-Tag endet, ist DOPPELT, wenn ein ANDERER
 * Abschnitt C
 *   (a) an seinen drei letzten Tagen denselben rohen Schluss und dasselbe Verhaeltnis Eroeffnung/Schluss hat (Toleranz 1e-9),
 *   (b) die 60-Tage-Bedingung mit dem Zusatz B1 erfuellt (Verhaeltnis der rohen Schluesse fest -> Split dazwischen) und
 *   (c) danach noch mindestens fuenf Handelstage (Panel-Zeilen) weiterlaeuft.
 * Die Pruefung steht in studien/datenfundament-2026-10-04/tafel-v2/zwilling-v2.js (auf ../zaehllauf4/zwilling.js), das Lesen in
 * tafel-v2/panel-jahresweise.js: das Panel wird Jahresdatei fuer Jahresdatei gelesen, nie ganz geladen (der Rechner hatte am
 * 04.10.2026 unter 3,5 GB frei), der Kalender kommt aus _stand.json (nichts von E:). Der Zwilling eines doppelten Abschnitts wird
 * wie in der Tafel gewaehlt (meiste gleiche Tage nach B1, laengster Nachlauf, Name).
 * Ketten (A doppelt zu B, B doppelt zu C): entfernt wird JEDER doppelte Abschnitt; erhalten bleibt der, der am laengsten laeuft
 * (spaeterer letzter Tag; dann mehr Zeilen; dann der Name zuerst) - geprueft wird, dass das genau der eine nicht doppelte
 * Abschnitt der Kette ist.
 *
 * Aufruf:  node doppelte-v23.js
 *   schreibt voll-v23/doppelte-abschnitte.json und als Bericht im Repo doppelte-abschnitte-v23.json (gleicher Inhalt).
 * Als Modul: doppelte(ordner, kennung) - dieselbe Probe an einem beliebigen Panel (pruefung-v23.js faehrt sie auf v2.3).
 * NUR LESEN am Panel. Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var TV2 = path.join(K.REPO, 'studien', 'datenfundament-2026-10-04', 'tafel-v2');
var ZV = require(path.join(TV2, 'zwilling-v2.js'));
var PJ = require(path.join(TV2, 'panel-jahresweise.js'));
var ZW = ZV.ZW;

var KENNUNG = 'querschnitt-pruefstand-2026-09-13/doppelte-abschnitte-v23/v1';

/** Die Probe an einem Panelordner (mit Kennung). Rueckgabe: { zaehler, doppelt: [...], nurA: [...], ketten, ... }. */
function doppelte(ordner, kennung) {
  var st = PJ.stand(ordner), sym = st.symbole, tage = st.tage, letzterTag = st.letzterVollTagIdx;
  var info = PJ.uebersicht(ordner, kennung, st);
  function zeilen(s) { return info[s].n; }
  function ende(s) { return info[s].n ? info[s].letzter : -1; }
  var Z = { abschnitte: sym.length, referenz: 0, ohneZeilen: 0, bisLetzterTag: 0, endenVorher: 0, zuKurzFuerA: 0, gepruefteEnden: 0,
    nurA: 0, nurAWeiter: 0, abcOhneB1: 0, abcMitB1: 0, nurDurchB1: [], anB: 0, anC: 0, andererZwillingDurchB1: 0 };
  var dIdx = [];
  for (var s = 0; s < sym.length; s++) {
    if (sym[s].referenz) { Z.referenz++; continue; }
    var n = zeilen(s);
    if (!n) { Z.ohneZeilen++; continue; }
    if (ende(s) >= letzterTag) { Z.bisLetzterTag++; continue; }
    Z.endenVorher++;
    if (n < ZW.A_TAGE) { Z.zuKurzFuerA++; continue; }
    Z.gepruefteEnden++;
    dIdx.push(s);
  }
  var PR = PJ.probe(ordner, kennung, dIdx, info, st);
  var liste = [], nurA = [], zw = {};
  Object.keys(PR.kand).map(Number).sort(function (x, y) { return x - y; }).forEach(function (d) {
    var kand = PR.kand[d], Dr = PR.reihe(d), n = Dr.tage.length;
    Z.nurA++;
    if (kand.some(function (k) { return k.p.cTage >= 1; })) Z.nurAWeiter++;
    var w0 = ZV.waehle(kand, false), w1 = ZV.waehle(kand, true);
    if (w0) Z.abcOhneB1++;
    var kurz = kand.map(function (k) { return { name: k.name, aExakt: k.p.aExakt, gleich: k.p.bGleich, gleichB1: k.p.bGleichB1, fenster: k.p.bTage, noetig: k.p.bNoetig, nachlauf: k.p.cTage, b: k.p.b, bB1: k.p.bB1, c: k.p.c, b1: k.p.b1 }; });
    var eintrag = { abschnitt: sym[d].reihe, ersterTag: tage[Dr.tage[0]], letzterTag: tage[Dr.tage[n - 1]], zeilen: n, kandidaten: kurz };
    if (!w1) {
      if (!kand.some(function (k) { return k.p.bB1; })) Z.anB++;
      if (!kand.some(function (k) { return k.p.c; })) Z.anC++;
      nurA.push(eintrag);
      return;
    }
    Z.abcMitB1++;
    if (!w0) Z.nurDurchB1.push(sym[d].reihe + ' -> ' + w1.name + ' (' + w1.p.bGleich + '+' + (w1.p.bGleichB1 - w1.p.bGleich) + '/' + w1.p.bTage + ')');
    else if (w0.name !== w1.name) Z.andererZwillingDurchB1++;
    zw[d] = w1.s;
    liste.push(Object.assign(eintrag, { zwilling: w1.name, zwillingLetzterTag: w1.cLetzter, gleicheTage: w1.doppelte, gleicheTageFenster: w1.p.bGleich, gleicheTageFensterB1: w1.p.bGleichB1,
      fensterTage: w1.p.bTage, nachlauf: w1.p.cTage, b1Zusatz: w1.p.bGleichB1 > w1.p.bGleich ? 1 : 0, aExakt: w1.p.aExakt, lebend: sym[d].lebend, ende_grund_v22: sym[d].ende_grund }));
  });

  /* ---- Ketten: Komponenten ueber die Kanten Abschnitt -> Zwilling ---- */
  var vater = {};
  function wurzel(x) { while (vater[x] !== x) x = vater[x]; return x; }
  Object.keys(zw).forEach(function (d) {
    d = +d;
    if (vater[d] === undefined) vater[d] = d;
    if (vater[zw[d]] === undefined) vater[zw[d]] = zw[d];
    var ra = wurzel(d), rb = wurzel(zw[d]);
    if (ra !== rb) vater[ra] = rb;
  });
  var gruppen = {};
  Object.keys(vater).forEach(function (x) { x = +x; var r = wurzel(x); (gruppen[r] = gruppen[r] || []).push(x); });
  var ketten = [], behalteFehler = [];
  function tiefe(x) { var t = 0; while (zw[x] !== undefined) { x = zw[x]; t++; } return t; }
  Object.keys(gruppen).forEach(function (r) {
    var m = gruppen[r];
    var halte = m.slice().sort(function (x, y) { return (ende(y) - ende(x)) || (zeilen(y) - zeilen(x)) || (sym[x].reihe < sym[y].reihe ? -1 : sym[x].reihe > sym[y].reihe ? 1 : 0); })[0];
    var nichtDoppelt = m.filter(function (x) { return zw[x] === undefined; });
    if (nichtDoppelt.length !== 1 || nichtDoppelt[0] !== halte) behalteFehler.push(m.map(function (x) { return sym[x].reihe; }).join(' ') + ' | behalten nach Regel ' + sym[halte].reihe);
    var t = Math.max.apply(null, m.map(tiefe));
    if (m.length >= 3 || t >= 2) ketten.push({ behalten: sym[halte].reihe, mitglieder: m.length, tiefe: t, glieder: m.filter(function (x) { return x !== halte; }).map(function (x) { return sym[x].reihe + ' -> ' + sym[zw[x]].reihe; }).sort() });
  });
  ketten.sort(function (x, y) { return (y.tiefe - x.tiefe) || (y.mitglieder - x.mitglieder) || (x.behalten < y.behalten ? -1 : 1); });
  liste.sort(function (x, y) { return x.abschnitt < y.abschnitt ? -1 : 1; });
  var zeilenSumme = 0, gleichSumme = 0;
  liste.forEach(function (x) { zeilenSumme += x.zeilen; gleichSumme += x.gleicheTage; });
  Z.doppelt = liste.length; Z.zeilen = zeilenSumme; Z.gleicheTage = gleichSumme; Z.zeilenOhneGegenstueck = zeilenSumme - gleichSumme;
  Z.gruppen = Object.keys(gruppen).length; Z.ketten = ketten.length; Z.kettenTiefe2 = ketten.filter(function (k) { return k.tiefe >= 2; }).length;
  Z.behalteRegelWieNichtDoppelt = behalteFehler.length === 0;
  Z.speicherSpitzeMB = PJ.spitzeMB();
  return { zaehler: Z, doppelt: liste, nurA: nurA, ketten: ketten, behalteFehler: behalteFehler, panel: st.kennung, letzterPanelTag: tage[letzterTag] };
}

function main() {
  var t0 = Date.now(), ordner = path.join(__dirname, 'voll-v22');
  var E = doppelte(ordner, K.PANEL_KENNUNG_V22);
  if (E.panel !== K.PANEL_KENNUNG_V22) throw new Error('doppelte-v23.js liest v2.2, nicht ' + E.panel);
  var out = Object.assign({ kennung: KENNUNG, stand: new Date().toISOString(), aus: 'studien/querschnitt-pruefstand-2026-09-13/voll-v22/panel (' + E.panel + ')',
    regel: { a: ZW.A_TAGE + ' letzte Tage: roher Schluss gleich, Verhaeltnis Eroeffnung/Schluss gleich (Toleranz ' + ZW.VERH_TOL + ')',
      b: ZW.B_MIN + ' von ' + ZW.B_FENSTER + ' (kuerzer ' + (ZW.B_ANTEIL * 100) + ' %) gleiche rohe Schluesse; B1: ungleiche Tage zaehlen mit, wenn das Verhaeltnis dort fest ist (<= ' + ZV.B1_TOL + ')',
      c: ZW.C_MIN + ' Panel-Zeilen Nachlauf', ketten: 'jeder doppelte Abschnitt wird entfernt; erhalten bleibt der am laengsten laufende (letzter Tag, Zeilen, Name)' },
    sekunden: Math.round((Date.now() - t0) / 1000) }, E);
  fs.mkdirSync(path.join(__dirname, 'voll-v23'), { recursive: true });
  [path.join(__dirname, 'voll-v23', 'doppelte-abschnitte.json'), path.join(__dirname, 'doppelte-abschnitte-v23.json')].forEach(function (p) {
    fs.writeFileSync(p + '.tmp', JSON.stringify(out, null, 1)); fs.renameSync(p + '.tmp', p);
  });
  process.stdout.write(JSON.stringify(E.zaehler) + '\n');
  process.stdout.write('Ketten (Tiefe >= 2 oder >= 3 Glieder): ' + E.ketten.length + ', Regel "laengster bleibt" = einziger nicht doppelter: ' + E.zaehler.behalteRegelWieNichtDoppelt + ' (' + out.sekunden + ' s)\n');
}

module.exports = { doppelte: doppelte, KENNUNG: KENNUNG };
if (require.main === module) main();

'use strict';
/* PANEL v2.3, Bau 2c (Auftrag Nr. 92, Schritt 2c, 04.10.2026) - die lebenden Werte, deren Reihe im Panel v2.3 (Bau 2b) vor dem
 * letzten Panel-Tag endet, weil der Panelbau (lesen-panel.js) die VERALTETEN bereinigten Kopien des Jahres 2026 las (Stand 03.09.;
 * Nr. 86 PHASE2A.md, Teil 2 "Gruppe b"), mit dem Leser v2 (datenfundament-2026-10-04/phase2/leser2.js) neu bauen.
 *
 * 1. LISTE: jede Reihe in v2.3 (Bau 2b), deren letzter Panel-Tag vor dem letzten vollen Panel-Tag liegt, deren Ordner nach der
 *    Lebenszeit aus den Minuten (lebenszeit-minuten.json, Schluessel = Feld `ordner`) lebt, die der letzte Abschnitt ihres Ordners ist
 *    (ein Abschnitt vor einem Schnitt endet absichtlich) UND deren Datei ueber leser2 Kerzen nach ihrem letzten Panel-Tag hat.
 *    Bricht leser2 fuer eine Reihe ab (BURU, WHLR: keine Kopie v2 fuer 2026), wird sie genannt und nicht gebaut.
 * 2. BAU: der Panelbau selbst (paneldaten.js: modus({luecken}) wie v2.2 -> Deckel 2026-09-15, symbole(), reiheBauen() - genau was
 *    `paneldaten.js --luecken --reihen ...` je Reihe tut), aber jede Jahresdatei nach der Regel von leser2 gewaehlt (leser2.wahl:
 *    Kopie v2, sonst alte Kopie nur wenn sie so weit reicht wie die Rohdatei, sonst roh; zu kurze Kopie = Abbruch). Umgesetzt als
 *    Huelle um lesen-panel.js ladeJahr NUR in diesem Prozess (wie leser2 lesen.js umhuellt): Ordner der Kopien fuer die Dauer eines
 *    Aufrufs umgestellt, danach zurueck, gelesene Datei gegen die Regel geprueft. paneldaten.js und lesen-panel.js bleiben unveraendert.
 * 3. VORPRUEFUNG vor dem Schreiben: jede neu gebaute Zeile bis zum alten Ende (2026-09-03) muss bytegleich zu Bau 2b sein - einzige
 *    zugelassene Abweichung: die Marke LETZTER_TAG am alten letzten Tag faellt weg (die Reihe laeuft jetzt weiter). Sonst: ABBRUCH,
 *    kein Panel, Unterschiede in bau-v23c.json.
 * 4. VEREINEN nach voll-v23c/panel/: Zeilen der Liste ersetzt, alle uebrigen Zeilen aus Bau 2b unveraendert, Ordnung (tag, sym).
 *    Kennung bleibt K.PANEL_KENNUNG_V23, bau '2c'. Stand: lebend nach der Regel von Bau 2b neu (v2.2 lebend, letzter Tag >= letzter
 *    voller Panel-Tag, Minuten lebend), ende_grund wie Bau 2b (Tafel v2.1).
 * voll-v23/ (Bau 2b) bleibt unveraendert - die Kernpruefung (pruefung-v23c.js) vergleicht dagegen.
 *
 * Aufruf:  node --max-old-space-size=3072 panel-v23c.js [--nur-liste]
 * Schreibt: liste-v23c.json, bau-v23c.json (Repo), voll-v23c/panel/ (ausserhalb des Repos). Auf E: nur lesen. Kein Abruf.
 * Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var P = require('./paneldaten.js');
var LP = require('./lesen-panel.js');
var PV = require('./panel-v23.js');
var PVB = require('./panel-v23b.js');
var G = require(path.join(K.REPO, 'studien', 'datenfundament-2026-10-04', 'gemeinsam.js'));
var P2 = require(path.join(K.REPO, 'studien', 'datenfundament-2026-10-04', 'phase2', 'p2.js'));
var L2 = require(path.join(K.REPO, 'studien', 'datenfundament-2026-10-04', 'phase2', 'leser2.js'));

var O23 = path.join(__dirname, 'voll-v23', 'panel');           // Bau 2b - nur lesen
var AUS = path.join(__dirname, 'voll-v23c');
var PANEL = path.join(AUS, 'panel');
var LISTE = path.join(__dirname, 'liste-v23c.json');
var BAU = path.join(__dirname, 'bau-v23c.json');
var DECKEL = '2026-09-15';

function sag(s) { process.stdout.write(s + '\n'); }
function schreibeJson(p, obj, eng) { fs.writeFileSync(p + '.tmp', eng ? JSON.stringify(obj) : JSON.stringify(obj, null, 1)); fs.renameSync(p + '.tmp', p); }
function norm(p) { return path.resolve(p).replace(/\\/g, '/').toLowerCase(); }
function bytes(a) { return new Uint8Array(a.buffer, a.byteOffset, a.byteLength); }

/* ---------- 1. Liste ---------- */
function liste(S23) {
  var nT = S23.tage.length, lv = S23.letzterVollTagIdx, sym = S23.symbole;
  var letzter = new Int32Array(sym.length).fill(-1), n = new Int32Array(sym.length);
  S23.jahre.forEach(function (j) {
    var b = P.leseBlock(path.join(O23, j.jahr + '.bin'), K.PANEL_KENNUNG_V23);
    for (var i = 0; i < b.n; i++) { n[b.sym[i]]++; if (b.tag[i] > letzter[b.sym[i]]) letzter[b.sym[i]] = b.tag[i]; }
  });
  var LZ = PVB.LEBENSZEIT, lzj = JSON.parse(fs.readFileSync(LZ, 'utf8')), lz = {};
  Object.keys(lzj.werte).forEach(function (k) { lz[lzj.werte[k].ordner || k] = lzj.werte[k]; });
  /* letzter Tag je Ordner (ueber alle Abschnitte) */
  var ordnerEnde = {};
  sym.forEach(function (e, s) { if (letzter[s] > (ordnerEnde[e.ordner] == null ? -2 : ordnerEnde[e.ordner])) ordnerEnde[e.ordner] = letzter[s]; });
  var R2 = {}; L2.reihen().forEach(function (r) { if (!R2[r.ordner]) R2[r.ordner] = r; });
  var Z = { reihen: sym.length, ohneZeilen: 0, endenVorPanelende: 0, minutenNichtLebend: 0, ohneLebenszeit: 0, abschnittVorSchnitt: [], keineKerzenDanach: [], kerzenNurNachDeckel: [], leser2Fehler: [], ausAlterKopieOderRoh: [] };
  var drin = [];
  sym.forEach(function (e, s) {
    if (letzter[s] < 0) { Z.ohneZeilen++; return; }
    if (letzter[s] >= lv) return;
    Z.endenVorPanelende++;
    var m = lz[e.ordner];
    if (!m) { Z.ohneLebenszeit++; return; }
    if (m.lebend !== 1) { Z.minutenNichtLebend++; return; }
    var tag = S23.tage[letzter[s]];
    if (ordnerEnde[e.ordner] > letzter[s]) { Z.abschnittVorSchnitt.push(e.reihe + ' (bis ' + tag + ', ' + e.ende_grund + ')'); return; }
    var R = R2[e.ordner];
    if (!R) throw new Error('leser2.reihen() kennt den Ordner ' + e.ordner + ' nicht');
    var jahre = (m.jahre || []).filter(function (y) { return y >= +tag.slice(0, 4); }), info = { reihe: e.reihe, ordner: e.ordner, sym23: s, letzterPanelTag: tag, zeilen2b: n[s],
      lebend2b: e.lebend, lebendV22: e.lebend_v22 || e.lebend, ende_grund2b: e.ende_grund, letzterMinutentag: m.letzterMinutentag, dateien: [], kerzenDanach: 0, kerzenDanachBisDeckel: 0, letzterKerzentag: null };
    try {
      jahre.forEach(function (y) {
        var g = L2.ladeJahr(R, y);
        if (!g.ok) { info.dateien.push({ jahr: y, kopie: g.kopie, fehler: g.grund }); return; }
        var nach = 0, bisD = 0, lt = null;
        g.kerzen.forEach(function (k) { var t = G.etTag(k[0]); if (t > tag) { nach++; if (t <= DECKEL) bisD++; } if (!lt || t > lt) lt = t; });
        info.dateien.push({ jahr: y, kopie: g.kopie, pfad: path.relative(G.ARCHIV, g.pfad).replace(/\\/g, '/'), kerzen: g.kerzen.length, kerzenNachLetztemPanelTag: nach });
        info.kerzenDanach += nach; info.kerzenDanachBisDeckel += bisD; if (lt && (!info.letzterKerzentag || lt > info.letzterKerzentag)) info.letzterKerzentag = lt;
      });
    } catch (err) {
      Z.leser2Fehler.push({ reihe: e.reihe, ordner: e.ordner, letzterPanelTag: tag, code: err.code || null, meldung: err.message });
      return;
    }
    if (!info.kerzenDanach) { Z.keineKerzenDanach.push(e.reihe + ' (bis ' + tag + ')'); return; }
    /* Das Panel ist auf DECKEL gedeckelt: Kerzen erst danach ergeben keine Zeile - die Reihe endet nicht wegen des Lesers. */
    if (!info.kerzenDanachBisDeckel) { Z.kerzenNurNachDeckel.push({ reihe: e.reihe, letzterPanelTag: tag, kerzenDanach: info.kerzenDanach, ersteDatei: info.dateien[0] }); return; }
    var ausV2 = info.dateien.filter(function (d) { return d.kerzenNachLetztemPanelTag > 0; }).every(function (d) { return d.kopie === 'v2'; });
    if (!ausV2) Z.ausAlterKopieOderRoh.push(e.reihe);
    info.kerzenNachAusKopieV2 = ausV2;
    drin.push(info);
  });
  drin.sort(function (a, b) { return a.reihe < b.reihe ? -1 : 1; });
  var aus = { kennung: 'querschnitt-pruefstand-2026-09-13/liste-v23c/v1', stand: new Date().toISOString(), panel: S23.kennung + ' bau ' + S23.bau + ' (' + S23.stand + ')',
    letzterPanelTag: S23.letzterVollTag, leser: L2.KENNUNG, lebenszeit: lzj.kennung + ' (' + lzj.stand + ', Archivende ' + lzj.endeDesArchivs + ')',
    kopienV2Manifest: L2.manifeste().v2Stand, rohManifest: L2.manifeste().rohStand,
    regel: 'letzter Panel-Tag < letzter voller Panel-Tag, Ordner in den Minuten lebend, letzter Abschnitt des Ordners, Datei ueber leser2 mit Kerzen nach dem letzten Panel-Tag (bis zum Deckel ' + DECKEL + ')',
    n: drin.length, namen: drin.map(function (x) { return x.reihe; }), zaehler: Z, reihen: drin };
  return aus;
}

/* ---------- 2. Huelle: lesen-panel.js ladeJahr mit der Dateiwahl von leser2 ---------- */
var WAHL = [];
function huelleAn() {
  var orig = LP.ladeJahr, ORTE = K.ORTE;
  LP.ladeJahr = function (R, jahr, kal, opt) {
    var schl = R.ordner + '/' + jahr + '.json', m = L2.manifeste();
    var hat = { v2: fs.existsSync(P2.BER2 + '/' + schl), alt: fs.existsSync(G.BER + '/' + schl) };
    var w = L2.wahl(schl, hat, { roh: m.roh[schl], alt: m.alt[schl], v2: m.v2[schl] });
    if (w.veraltet) throw L2.fehlerVeraltet(schl, w.veraltet);
    var altOrt = ORTE.bereinigt, g;
    try {
      if (w.kopie === 'v2') ORTE.bereinigt = function () { return P2.BER2; };
      g = orig(R, jahr, kal, opt);
    } finally { ORTE.bereinigt = altOrt; }
    var soll = w.kopie === 'v2' ? P2.BER2 : (w.kopie === 'alt' ? G.BER : G.ROH);
    if (g.pfad && norm(g.pfad) !== norm(path.join(soll, R.ordner, jahr + '.json'))) throw new Error('Huelle: lesen-panel.js las ' + g.pfad + ' statt ' + soll + '/' + schl);
    WAHL.push({ reihe: R.reihe, jahr: jahr, kopie: w.kopie, ok: g.ok, grund: g.ok ? undefined : g.grund });
    return g;
  };
  return function aus() { LP.ladeJahr = orig; };
}

/* Zeilen (aus zeilenAus) -> Spaltenblock in (tag, sym)-Ordnung; symMap: Panel-Index des Baus -> Index v2.3 */
function block(zeilen) {
  zeilen = zeilen.slice().sort(function (a, b) { return a.tag - b.tag || a.sym23 - b.sym23; });
  var sp = P.leer(zeilen.length);
  zeilen.forEach(function (r, i) {
    sp.sym[i] = r.sym23; sp.tag[i] = r.tag; sp.marken[i] = r.marken; sp.klasse[i] = r.klasse; sp.kerzen[i] = r.kerzen;
    sp.rohSchluss[i] = r.rohSchluss; sp.rohEroeffnung[i] = r.rohEroeffnung; sp.faktor[i] = r.faktor; sp.rendite[i] = r.rendite;
    sp.renditeOC[i] = r.renditeOC; sp.umsatzReg[i] = r.umsatzReg; sp.umsatzAuktion[i] = r.umsatzAuktion;
  });
  return sp;
}

function bauen(L, S23) {
  var mo = P.modus({ luecken: true });
  if (mo.bisTag !== DECKEL) throw new Error('Deckel ' + mo.bisTag + ' statt ' + DECKEL);
  var kal = K.kalender();
  if (kal.tage.length !== S23.tage.length || kal.tage.some(function (t, i) { return t !== S23.tage[i]; })) throw new Error('Kalender passt nicht zum Stand von Bau 2b');
  var S = P.symbole(), idx23 = {};
  S23.symbole.forEach(function (e, i) { idx23[e.reihe] = i; });
  var liste = {}; L.reihen.forEach(function (x) { liste[x.reihe] = x; });
  /* Bau-Reihen: die Reihe mit den Dateien (Abschnitte nach einem Schnitt haben einen Vorgaenger) */
  var bau = {};
  L.reihen.forEach(function (x) {
    var r = S.liste[S.idx[x.reihe]];
    if (!r) throw new Error('symbole() kennt ' + x.reihe + ' nicht');
    while (r.vorgaenger) r = S.liste[S.idx[r.vorgaenger]];
    (bau[r.reihe] = bau[r.reihe] || []).push(x.reihe);
  });
  var z = { reihen: 0, zeilen: 0, dateien: 0, bytes: 0, kerzenGesehen: 0, stempelkerzen: 0, stempeltage: 0,
    dateiFehler: {}, dateienNichtRein: 0, doppelteTage: 0, luecken: 0, schlussErsatz: {}, eroeffnungErsatz: {}, tageJeJahr: {}, ohneZeilen: 0,
    trennungen: 0, trennungAbweichung: 0, nachfolgerUebersprungen: 0, splitAkzeptiert: 0, splitAbgelehnt: 0, splitAbgelehntListe: [], lueckenTrennungen: 0, lueckenUngetrennt: 0 };
  var aus = huelleAn(), neu = [], andere = [], fehler = [];
  try {
    Object.keys(bau).sort().forEach(function (b) {
      var zeilen;
      try { zeilen = P.reiheBauen(S.liste[S.idx[b]], kal, z); }
      catch (err) { fehler.push({ reihe: b, code: err.code || null, meldung: err.message }); return; }
      z.reihen++;
      (zeilen || []).forEach(function (r) {
        var name = S.liste[r.symIdx].reihe, s23 = idx23[name];
        if (s23 === undefined) throw new Error('Abschnitt ' + name + ' fehlt in v2.3');
        r.sym23 = s23; r.name = name;
        if (r.tag >= S23.tage.length || S23.tage[r.tag] !== r.tagText) throw new Error('Tag ' + r.tagText + ' passt nicht zum Kalender');
        if (liste[name]) neu.push(r); else andere.push(r);
      });
    });
  } finally { aus(); }
  z.zeilen = neu.length;
  return { neu: neu, andere: andere, fehler: fehler, zaehler: z, bauReihen: bau, kennungBau: mo.kennung, deckel: mo.bisTag };
}

/* ---------- 3. Vorpruefung: neue Zeilen bis zum alten Ende gegen Bau 2b ---------- */
var SP = P.SPALTEN.map(function (s) { return s.name; }).filter(function (n) { return n !== 'sym'; });
function vorpruefung(S23, L, B) {
  var betroffen = {}; B.neu.concat(B.andere).forEach(function (r) { betroffen[r.sym23] = 1; });
  var alt = {};                       /* sym23 -> { tag -> {jahr, i} } aus Bau 2b; nur betroffene Reihen */
  var bloecke = {};
  S23.jahre.forEach(function (j) {
    var b = P.leseBlock(path.join(O23, j.jahr + '.bin'), K.PANEL_KENNUNG_V23), any = false;
    for (var i = 0; i < b.n; i++) if (betroffen[b.sym[i]]) { (alt[b.sym[i]] = alt[b.sym[i]] || {})[b.tag[i]] = i; any = true; }
    if (any) bloecke[j.jahr] = b;
  });
  var V = { verglichen: 0, gleich: 0, nurMarkeLetzterTag: [], anders: [], fehlenNeu: [], neuNachAltemEnde: {}, andereAbschnitte: { verglichen: 0, anders: 0, fehlen: 0 } };
  var jeReihe = {};
  function vergleiche(r, liste) {
    var a = alt[r.sym23] && alt[r.sym23][r.tag];
    if (a === undefined) { if (liste) { V.neuNachAltemEnde[r.name] = (V.neuNachAltemEnde[r.name] || 0) + 1; } else V.andereAbschnitte.fehlen++; return; }
    var b = bloecke[r.jahr], nb = block([r]), diff = [];
    SP.forEach(function (nm) {
      var x = bytes(b[nm].subarray(a, a + 1)), y = bytes(nb[nm]);
      for (var k = 0; k < x.length; k++) if (x[k] !== y[k]) { diff.push(nm); break; }
    });
    if (liste) { V.verglichen++; jeReihe[r.name] = (jeReihe[r.name] || 0) + 1; } else V.andereAbschnitte.verglichen++;
    if (!diff.length) { if (liste) V.gleich++; return; }
    /* einzige zugelassene Abweichung: Marke LETZTER_TAG am alten letzten Tag der Reihe weg, sonst nichts */
    var info = L.reihenJe[r.name];
    if (liste && diff.length === 1 && diff[0] === 'marken' && info && r.tagText === info.letzterPanelTag && b.marken[a] === (nb.marken[0] | K.M_LETZTER_TAG) && !(nb.marken[0] & K.M_LETZTER_TAG)) {
      V.nurMarkeLetzterTag.push(r.name + ' ' + r.tagText); return;
    }
    if (liste) { if (V.anders.length < 200) V.anders.push({ reihe: r.name, tag: r.tagText, spalten: diff, alt: SP.reduce(function (o, nm) { o[nm] = b[nm][a]; return o; }, {}), neu: SP.reduce(function (o, nm) { o[nm] = nb[nm][0]; return o; }, {}) }); V.andersN = (V.andersN || 0) + 1; }
    else V.andereAbschnitte.anders++;
  }
  B.neu.forEach(function (r) { vergleiche(r, true); });
  B.andere.forEach(function (r) { vergleiche(r, false); });
  /* jede Zeile von Bau 2b dieser Reihen muss neu gebaut worden sein */
  var neuTage = {}; B.neu.forEach(function (r) { (neuTage[r.sym23] = neuTage[r.sym23] || {})[r.tag] = 1; });
  L.reihen.forEach(function (x) { Object.keys(alt[x.sym23] || {}).forEach(function (t) { if (!neuTage[x.sym23] || !neuTage[x.sym23][t]) V.fehlenNeu.push(x.reihe + ' ' + S23.tage[t]); }); });
  V.zeilenBisAltesEndeJeReihe = jeReihe;
  V.bestanden = !V.andersN && !V.fehlenNeu.length && V.nurMarkeLetzterTag.length === L.reihen.length && !V.andereAbschnitte.anders && !V.andereAbschnitte.fehlen &&
    L.reihen.every(function (x) { return jeReihe[x.reihe] === x.zeilen2b; });
  return V;
}

/* ---------- 4. Vereinen ---------- */
function vereinen(S23, L, B) {
  var stand0 = path.join(PANEL, '_stand.json');
  if (fs.existsSync(stand0) && JSON.parse(fs.readFileSync(stand0, 'utf8')).kennung !== K.PANEL_KENNUNG_V23) throw new Error('In ' + PANEL + ' liegt ein Panel anderer Kennung - Abbruch.');
  fs.mkdirSync(PANEL, { recursive: true });
  var inListe = {}; L.reihen.forEach(function (x) { inListe[x.sym23] = 1; });
  var neuJeJahr = {}; B.neu.forEach(function (r) { (neuJeJahr[r.jahr] = neuJeJahr[r.jahr] || []).push(r); });
  var gesamt = { zeilen: 0, jahre: [], zeilenJeTag: {}, ersetzt: 0, neu: 0 }, letzter = {};
  S23.jahre.forEach(function (j) {
    var b = P.leseBlock(path.join(O23, j.jahr + '.bin'), K.PANEL_KENNUNG_V23), nb = block(neuJeJahr[j.jahr] || []);
    var m = 0, raus = 0; for (var i = 0; i < b.n; i++) if (inListe[b.sym[i]]) raus++;
    m = b.n - raus + nb.n;
    var sp = P.leer(m), ia = 0, ib = 0, q = 0;
    function nimm(src, k) { P.SPALTEN.forEach(function (s) { sp[s.name][q] = src[s.name][k]; }); q++; }
    while (ia < b.n || ib < nb.n) {
      if (ia < b.n && inListe[b.sym[ia]]) { ia++; continue; }
      var vonA = ib >= nb.n || (ia < b.n && (b.tag[ia] < nb.tag[ib] || (b.tag[ia] === nb.tag[ib] && b.sym[ia] < nb.sym[ib])));
      if (vonA) nimm(b, ia++); else nimm(nb, ib++);
    }
    if (q !== m) throw new Error('Vereinen ' + j.jahr + ': ' + q + ' statt ' + m);
    for (var w = 0; w < m; w++) { gesamt.zeilenJeTag[sp.tag[w]] = (gesamt.zeilenJeTag[sp.tag[w]] || 0) + 1; if (!(sp.tag[w] <= letzter[sp.sym[w]])) letzter[sp.sym[w]] = sp.tag[w]; }
    var kopf = {}; Object.keys(b.kopf).forEach(function (k) { kopf[k] = k === 'n' ? m : b.kopf[k]; });
    PVB_schreibeBlock(path.join(PANEL, j.jahr + '.bin'), sp, m, kopf);
    gesamt.zeilen += m; gesamt.jahre.push({ jahr: j.jahr, n: m }); gesamt.ersetzt += raus; gesamt.neu += nb.n;
    sag('v2.3c ' + j.jahr + ': ' + m + ' Zeilen (Bau 2b ' + b.n + ', ersetzt ' + raus + ', neu gebaut ' + nb.n + ')');
  });
  var lv = PV.letzterVoll(gesamt.zeilenJeTag);
  if (lv !== S23.letzterVollTagIdx) throw new Error('letzter vollstaendiger Tag waere ' + lv + ' statt ' + S23.letzterVollTagIdx);
  var LZ = JSON.parse(fs.readFileSync(PVB.LEBENSZEIT, 'utf8')), lz = {};
  Object.keys(LZ.werte).forEach(function (k) { lz[LZ.werte[k].ordner || k] = LZ.werte[k]; });
  var stand = {};
  Object.keys(S23).forEach(function (k) { stand[k] = S23[k]; });
  stand.bau = '2c'; stand.stand = new Date().toISOString(); stand.zeilen = gesamt.zeilen; stand.jahre = gesamt.jahre; stand.zeilenJeTag = gesamt.zeilenJeTag;
  stand.letzterVollTagIdx = lv; stand.letzterVollTag = S23.tage[lv];
  var neuJeReihe = {}; B.neu.forEach(function (r) { if (r.tagText > L.reihenJe[r.name].letzterPanelTag) neuJeReihe[r.name] = (neuJeReihe[r.name] || 0) + 1; });
  stand.symbole = S23.symbole.map(function (e, s) {
    if (!inListe[s]) return e;
    var x = JSON.parse(JSON.stringify(e)), info = L.reihenJe[e.reihe], m = lz[e.ordner];
    /* Regel von Bau 2b (panel-v23b.js): lebend nur bei v2.2 lebend, letzter Tag >= letzter voller Panel-Tag, Minuten lebend */
    var v22 = e.lebend_v22 === 1 || e.lebend === 1, l = (v22 && letzter[s] >= lv && m && m.lebend === 1) ? 1 : 0;
    x.lebend = l;
    if (l) { delete x.lebend_v22; delete x.lebend_weg; }
    x.v23c = { altesEnde: info.letzterPanelTag, neuesEnde: S23.tage[letzter[s]], neueZeilen: neuJeReihe[e.reihe] || 0, leser: L2.KENNUNG };
    return x;
  });
  stand.v23c = { bau: '2c', aus: 'voll-v23 (Bau 2b, ' + S23.stand + ')', leser: L2.KENNUNG, kopienV2Manifest: L.kopienV2Manifest, rohManifest: L.rohManifest,
    deckel: B.deckel, reihen: L.namen, zeilenErsetzt: gesamt.ersetzt, zeilenNeuGebaut: gesamt.neu, zeilenNeu: gesamt.zeilen - S23.zeilen, zeilenBau2b: S23.zeilen,
    regel: 'nur die Reihen der Liste (liste-v23c.json) neu gebaut (paneldaten.js reiheBauen, v2.2-Modus, Deckel ' + B.deckel + ', Dateiwahl leser2); alle uebrigen Zeilen und Eintraege = Bau 2b' };
  schreibeJson(path.join(PANEL, '_stand.json'), stand, true);
  return { gesamt: gesamt, neuJeReihe: neuJeReihe, lv: lv };
}
function PVB_schreibeBlock(pfad, sp, n, kopf) {
  var kb = Buffer.from(JSON.stringify(kopf), 'utf8'), len = Buffer.alloc(4);
  len.writeUInt32LE(kb.length, 0);
  var teile = [len, kb];
  P.SPALTEN.forEach(function (s) { var a = sp[s.name]; teile.push(Buffer.from(a.buffer, a.byteOffset, n * a.BYTES_PER_ELEMENT)); });
  fs.writeFileSync(pfad + '.tmp', Buffer.concat(teile));
  fs.renameSync(pfad + '.tmp', pfad);
}

function main() {
  var t0 = Date.now(), nurListe = process.argv.indexOf('--nur-liste') !== -1;
  var S23 = JSON.parse(fs.readFileSync(path.join(O23, '_stand.json'), 'utf8'));
  if (S23.kennung !== K.PANEL_KENNUNG_V23 || S23.bau !== '2b') throw new Error('voll-v23 ist nicht v2.3 Bau 2b: ' + S23.kennung + ' ' + S23.bau);
  if (S23.letzterVollTag !== DECKEL) throw new Error('letzter Panel-Tag ' + S23.letzterVollTag);
  var L = liste(S23);
  schreibeJson(LISTE, L);
  sag('LISTE: ' + L.n + ' Reihen: ' + L.namen.join(' '));
  sag('  ' + JSON.stringify({ endenVorPanelende: L.zaehler.endenVorPanelende, minutenNichtLebend: L.zaehler.minutenNichtLebend, ohneLebenszeit: L.zaehler.ohneLebenszeit,
    abschnittVorSchnitt: L.zaehler.abschnittVorSchnitt.length, keineKerzenDanach: L.zaehler.keineKerzenDanach.length,
    kerzenNurNachDeckel: L.zaehler.kerzenNurNachDeckel.map(function (x) { return x.reihe; }), leser2Fehler: L.zaehler.leser2Fehler.map(function (x) { return x.reihe; }),
    ausAlterKopieOderRoh: L.zaehler.ausAlterKopieOderRoh }));
  if (nurListe) return;
  L.reihenJe = {}; L.reihen.forEach(function (x) { L.reihenJe[x.reihe] = x; });
  var B = bauen(L, S23);
  sag('BAU: ' + Object.keys(B.bauReihen).length + ' Bau-Reihen, ' + B.neu.length + ' Zeilen der Liste, ' + B.andere.length + ' Zeilen anderer Abschnitte, Fehler ' + B.fehler.length);
  var kopien = {}; WAHL.forEach(function (w) { var k = w.jahr + ':' + w.kopie; kopien[k] = (kopien[k] || 0) + 1; });
  var V = vorpruefung(S23, L, B);
  var bericht = { kennung: 'querschnitt-pruefstand-2026-09-13/bau-v23c/v1', stand: new Date().toISOString(), liste: L.namen, bauReihen: B.bauReihen, kennungBau: B.kennungBau,
    deckel: B.deckel, fehler: B.fehler, dateiwahl: { jeJahrUndKopie: kopien, dateien: WAHL }, zaehler: B.zaehler, vorpruefung: V };
  if (B.fehler.length || !V.bestanden) {
    bericht.abbruch = 'Vorpruefung nicht bestanden oder Baufehler - kein Panel geschrieben';
    schreibeJson(BAU, bericht);
    sag('ABBRUCH: ' + bericht.abbruch + ' | verglichen ' + V.verglichen + ', gleich ' + V.gleich + ', nur Marke ' + V.nurMarkeLetzterTag.length + ', anders ' + (V.andersN || 0) + ', fehlen ' + V.fehlenNeu.length +
      ', andere Abschnitte ' + JSON.stringify(V.andereAbschnitte) + ' -> ' + BAU);
    process.exit(1);
  }
  sag('VORPRUEFUNG bestanden: ' + V.verglichen + ' Zeilen bis zum alten Ende verglichen, ' + V.gleich + ' bytegleich, ' + V.nurMarkeLetzterTag.length + ' nur Marke LETZTER_TAG am alten Ende; neue Zeilen ' +
    JSON.stringify(V.neuNachAltemEnde));
  var E = vereinen(S23, L, B);
  bericht.vereinen = { zeilen: E.gesamt.zeilen, jahre: E.gesamt.jahre, ersetzt: E.gesamt.ersetzt, neuGebaut: E.gesamt.neu, neuJeReihe: E.neuJeReihe, letzterVollTag: S23.tage[E.lv] };
  schreibeJson(BAU, bericht);
  sag('PANEL v2.3 (Bau 2c): ' + E.gesamt.zeilen + ' Zeilen (Bau 2b ' + S23.zeilen + ', + ' + (E.gesamt.zeilen - S23.zeilen) + '), letzter voller Tag ' + S23.tage[E.lv] + ' (' + Math.round((Date.now() - t0) / 1000) + ' s) -> ' + PANEL);
}

module.exports = { DECKEL: DECKEL, LISTE: LISTE };
if (require.main === module) main();

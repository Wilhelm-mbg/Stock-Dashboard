'use strict';
/* LAUF der Nachzuegler-Studie (Nr. 109).
 *
 *   node --max-old-space-size=12000 studien/nachzuegler-2026-10/lauf.js --pilot        (Z21; schreibt pilot/)
 *   node --max-old-space-size=12000 studien/nachzuegler-2026-10/lauf.js --entdeckung   (bis 30.12.2022; ergebnis-entdeckung.json, KANDIDATEN.json)
 *   node --max-old-space-size=12000 studien/nachzuegler-2026-10/lauf.js --pruefung     (nur mit Siegel 2; ergebnis-pruefung.json)
 *
 * Das Panel kommt nur ueber lesen.js. Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var KN = require('./konfig.js');
var LS = require('./lesen.js');
var MK = require('./merkmale.js');
var VK = require('./verknuepfung.js');
var MS = require('./messen.js');
var AW = require('./auswerten.js');
var ST = require(path.join(KN.PRUEFSTAND, 'statistik.js'));

var T0 = Date.now();
function log(t) { var z = ((Date.now() - T0) / 1000).toFixed(1); process.stdout.write('[' + z + ' s] ' + t + '\n'); }
function schreibe(datei, obj) { fs.writeFileSync(datei, JSON.stringify(obj, null, 1) + '\n'); log('geschrieben: ' + path.relative(KN.REPO, datei)); }
function speicherFrei() {
  try { return +cp.execFileSync('powershell', ['-NoProfile', '-Command', '(Get-CimInstance Win32_OperatingSystem).FreeVirtualMemory/1MB'], { encoding: 'utf8', windowsHide: true }).trim().replace(',', '.'); }
  catch (e) { return null; }
}

/** Z21: 200 Reihen, je Klasse 50 (Median der Klasse 2017-2022), nach fnv(Name) aufsteigend; dazu SPY. */
function pilotReihen(T) {
  var g = T.g, kl = [];
  for (var s = 0; s < T.nSym; s++) {
    if (T.stand.symbole[s].referenz) continue;
    var w = [];
    for (var q = T.symStart[s]; q < T.symStart[s + 1]; q++) { var z = T.symZeilen[q], d = T.kal.tage[g.tag[z]]; if (d >= '2017' && d < '2023' && g.klasse[z] >= 0) w.push(g.klasse[z]); }
    if (!w.length) continue;
    w.sort(function (a, b) { return a - b; });
    kl.push({ s: s, c: w[Math.floor((w.length - 1) / 2)], h: ST.fnv(T.symName[s]) });
  }
  kl.sort(function (a, b) { return a.h - b.h || a.s - b.s; });
  var nur = new Uint8Array(T.nSym), je = [0, 0, 0, 0], namen = [];
  kl.forEach(function (x) { if (je[x.c] < KN.PILOT_JE_KLASSE) { je[x.c]++; nur[x.s] = 1; namen.push(T.symName[x.s]); } });
  nur[T.symIdx.SPY] = 1;
  return { nur: nur, namen: namen, jeKlasse: je };
}

/** Z21 (2): kein Blick nach vorn - Ereignisse und V2-Listen auf einer Kopie ohne alle Zeilen nach D (bzw. c) neu bestimmen. */
function blickNachVorn(T, C, E, nur, n) {
  var g = T.g, aus = { tage: [], abweichungenBits: 0, verglicheneZeilen: 0, stichtage: [], abweichungenV2: 0 };
  var alleD = []; E.ev.forEach(function (x) { x.D.forEach(function (d) { alleD.push(d); }); });
  alleD.sort(function (a, b) { return a - b; });
  var R = ST.mulberry32(ST.fnv('blick-nach-vorn'));
  for (var i = 0; i < n && alleD.length; i++) {
    var D = alleD[Math.floor(R() * alleD.length)];
    var bS = Float64Array.from(g.bSchluss), rd = Float32Array.from(g.rendite);
    for (var z = 0; z < g.n; z++) if (g.tag[z] > D) { bS[z] = NaN; rd[z] = NaN; }
    var T2 = Object.assign({}, T, { g: Object.assign({}, g, { bSchluss: bS, rendite: rd }) });
    var M2 = MK.kumuliert(T2), bits2 = new Uint8Array(g.n);
    MK.rohAusloeser(T2, bits2, nur);
    MK.e3(T2, M2, bits2, C.cik, C.firmen, T.schluss, nur);
    for (var q = T.tagVon[D]; q < T.tagBis[D]; q++) {
      if (nur && !nur[g.sym[q]]) continue;
      aus.verglicheneZeilen++;
      if ((C.bits[q] & 63) !== (bits2[q] & 63)) aus.abweichungenBits++;
    }
    aus.tage.push(T.kal.tage[D]);
    var c = VK.stichtag(T.kal.tage, D);
    if (c >= 0 && aus.stichtage.length < 3) {
      var rd2 = Float32Array.from(g.rendite); for (var z2 = 0; z2 < g.n; z2++) if (g.tag[z2] > c) rd2[z2] = NaN;
      var T3 = Object.assign({}, T, { g: Object.assign({}, g, { rendite: rd2 }) });
      var a1 = C.v2(c).top, a2 = VK.v2(T3, c, C.cik, nur).top;
      for (var k = 0; k < a1.length; k++) if (a1[k] !== a2[k]) aus.abweichungenV2++;
      aus.stichtage.push(T.kal.tage[c]);
    }
  }
  return aus;
}

function zaehlungen(T, C, E, Pa, Pc, Mx) {
  var z = { ereignisse: {}, partnerJeEreignis: {}, topfMittel: [], placeboA: Pa.zaehler, placeboC: Pc.zaehler, messung: Mx.zaehler.ereignisse, beobachtungen: Mx.zaehler.beobachtungen };
  E.forEach(function (x, k) { z.ereignisse[KN.AUSLOESER[Math.floor(k / 2)].key + '/' + KN.RICHTUNGEN[k % 2].key] = x.D.length; });
  Object.keys(Mx.zaehler.mitPartner).forEach(function (s) {
    var p = s.split('/'); if (p[0] !== '0') return;
    var name = KN.AUSLOESER[+p[1]].key + '/' + KN.RICHTUNGEN[+p[2]].key + '/' + KN.VERKNUEPFUNGEN[+p[3]].key;
    var mp = Mx.zaehler.mitPartner[s];
    z.partnerJeEreignis[name] = { ereignisseMitPartner: mp, partnerJeEreignis: mp ? Mx.zaehler.partner[s] / mp : null };
  });
  for (var c = 0; c < 4; c++) z.topfMittel.push(Mx.zaehler.topfTage ? Mx.zaehler.topf[c] / Mx.zaehler.topfTage : null);
  return z;
}

function hauptlauf(modus, opt) {
  opt = opt || {};
  var AUS = opt.ausgabe || KN.HIER;
  var frei = opt.ohneSpeicher ? null : speicherFrei();
  log('freier Speicher ' + frei + ' GB');
  if (frei != null && frei < 3.5) throw new Error('weniger als 3,5 GB frei - warten (Auftrag)');
  var T = LS.oeffne(Object.assign({}, opt.oeffne || {}, { pruefzeit: modus === 'pruefung' }));
  log('Tafel: ' + T.g.n + ' Zeilen, ' + T.nSym + ' Reihen, gesperrt=' + T.gesperrt + ', letzter Tag ' + T.kal.tage[T.maxTag] + (T.siegel ? ', Siegel ' + T.siegel.commit.slice(0, 7) : ''));
  var P = modus === 'pilot' ? pilotReihen(T) : null;
  if (P) log('Pilot: ' + P.namen.length + ' Reihen, je Klasse ' + P.jeKlasse.join('/'));
  var C = MS.vorbereiten(T, Object.assign({}, opt.quellen || {}, { nur: P ? P.nur : null, log: log }));
  var E = MS.ereignisse(T, C);
  log('Ereignisse roh ' + E.zaehler.roh + ', durch Sperrfrist ' + E.zaehler.sperrfrist);
  var zr = MS.zeitraum(T, modus === 'pruefung' ? 'pruefung' : 'entdeckung');
  var kombis = null, kand = null;
  if (modus === 'pruefung') {
    kand = JSON.parse(fs.readFileSync(opt.siegelDatei || path.join(KN.HIER, KN.SIEGEL_DATEI), 'utf8'));
    kombis = new Set(kand.kandidaten.map(function (x) { var K0 = KN.konfAus(x.k); return K0.a + '/' + K0.r + '/' + K0.v; }));
    log('gesiegelte Kandidaten: ' + kand.kandidaten.length);
  }
  var Ev = MS.imZeitraumFiltern(T, C, E, zr);
  var Pa = MS.placeboA(T, C, Ev, zr), Pc = MS.placeboC(T, C, Ev, zr);
  log('Zeitraum ' + zr.key + ': Einstieg ab ' + T.kal.tage[zr.eMin] + ', Ausstieg bis ' + T.kal.tage[zr.exitMax] + '; Placebo a ' + JSON.stringify(Pa.zaehler) + ', c ' + JSON.stringify(Pc.zaehler));
  var Mx = (kombis && kombis.size === 0) ? null : MS.messe(T, C, { echt: Ev, plA: Pa.ev, plC: Pc.ev }, zr, { kombis: kombis });
  log('Messung fertig' + (Mx ? ': ' + JSON.stringify(Mx.zaehler.beobachtungen) + ' Beobachtungen, V2-Stichtage ' + C.v2zeit.n + ' (' + C.v2zeit.ms + ' ms)' : ' (nichts zu messen)'));
  var kopf = { kennung: KN.KENNUNG, modus: modus, stand: new Date().toISOString(), panel: T.stand.kennung, gesperrt: T.gesperrt, siegel: T.siegel,
    letzterTag: T.kal.tage[T.maxTag], zeitraum: { key: zr.key, einstiegAb: T.kal.tage[zr.eMin], ausstiegBis: T.kal.tage[zr.exitMax] },
    cik: C.cikZaehler, firmen: C.firmenZaehler, e3: C.e3, zulaessig: C.Z.zaehler, v2: C.v2zeit, laufzeitSek: null };
  if (modus === 'pruefung') {
    var Pr = Mx ? AW.pruefung(Mx.zellen, zr, kand.kandidaten.map(function (x) { return x.k; })) : { zeilen: [], belegt: 0 };
    kopf.laufzeitSek = (Date.now() - T0) / 1000;
    schreibe(path.join(AUS, 'ergebnis-pruefung.json'), Object.assign(kopf, { kandidaten: kand.kandidaten.length, zaehlungen: Mx ? zaehlungen(T, C, Ev, Pa, Pc, Mx) : { ereignisse: Ev.map(function (x) { return x.D.length; }) }, pruefung: Pr }));
    return;
  }
  var A = AW.entdeckung(Mx.zellen, zr, T);
  log('Entdeckung: ' + JSON.stringify(A.zahlen));
  kopf.zaehlungen = zaehlungen(T, C, Ev, Pa, Pc, Mx);
  if (modus === 'pilot') {
    kopf.pilotReihen = P.namen; kopf.blickNachVorn = blickNachVorn(T, C, E, P.nur, 5);
    log('Blick nach vorn: ' + JSON.stringify(kopf.blickNachVorn));
    kopf.laufzeitSek = (Date.now() - T0) / 1000;
    fs.mkdirSync(path.join(AUS, 'pilot'), { recursive: true });
    schreibe(path.join(AUS, 'pilot', 'PILOT-ERGEBNIS.json'), Object.assign(kopf, { zahlen: A.zahlen, konf: A.konf }));
    return;
  }
  kopf.laufzeitSek = (Date.now() - T0) / 1000;
  var datei = path.join(AUS, 'ergebnis-entdeckung.json');
  schreibe(datei, Object.assign(kopf, { zahlen: A.zahlen, konf: A.konf }));
  var sum = LS.sha256(fs.readFileSync(datei));
  schreibe(path.join(AUS, KN.SIEGEL_DATEI), { kennung: KN.KENNUNG, stand: kopf.stand, ergebnisEntdeckungSha256: sum, konfigurationen: KN.KONFIGURATIONEN,
    regel: 'REGEL.md Z18: >= 30 Tage, netto > 0, t >= 2, Tor 1, kein Placebo-Verstoss', zahlen: A.zahlen,
    kandidaten: A.kandidaten.map(function (x) { return { k: x.k, name: x.name, nTage: x.st.netto.n, netto: x.st.netto.mittel, se: x.st.netto.se, t: x.st.netto.t, tor1Schwelle: x.tor1Schwelle }; }) });
}

if (require.main === module) {
  var a = process.argv.slice(2);
  var modus = a.indexOf('--pilot') !== -1 ? 'pilot' : a.indexOf('--entdeckung') !== -1 ? 'entdeckung' : a.indexOf('--pruefung') !== -1 ? 'pruefung' : null;
  if (!modus) { process.stderr.write('--pilot | --entdeckung | --pruefung\n'); process.exit(2); }
  try { hauptlauf(modus); log('fertig'); } catch (e) { process.stderr.write((e.stack || e.message) + '\n'); process.exit(1); }
}

module.exports = { hauptlauf: hauptlauf, pilotReihen: pilotReihen };

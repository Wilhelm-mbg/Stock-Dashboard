'use strict';
/* Auftrag Nr. 100 (05.10.2026): traegt die Momentum-Auswahl - oder nur der Korb? Das Momentum-Buch auf dem Korb der 187
 * umsatzstaerksten Werte gegen 200 Zufallsbuecher je Fenster aus demselben Korb, dazu der ganze Korb gleich gewichtet.
 * Die Regel steht in REGEL.md (gesiegelt vor jedem Lauf, Commit 7b0ddb2). Gerechnet wird mit kleinst.js (Huelle, Regel K) ->
 * korb.js (simuliere, startphasen) -> mfhandel.js, alle unveraendert per require, auf dem Panel v2.3 (wie Nr. 96).
 * Die Zufallsauswahl kommt an die Stelle von zielAm ueber den Zwischenspeicher, den zielAm zuerst liest (REGEL.md Teil C 2):
 * je Buch ein eigenes Q-Objekt, das alles vom echten Q erbt; nur sein korbCache liefert die eigene Zielliste.
 *   node --max-old-space-size=6144 studien/momentum-zufall-2026-10/lauf.js --selbstpruefung   (Selbstpruefung + Durchreich-Probe)
 *   node --max-old-space-size=6144 studien/momentum-zufall-2026-10/lauf.js                    (Pruefungen, dann der Lauf) */
process.env.RUECKBLICK_PANEL = 'v2.3';
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var REPO = path.resolve(__dirname, '..', '..');
var NR85 = path.join('studien', 'momentum-korb-kleinst-2026-10-04');
var NR96 = path.join('studien', 'momentum-korb-v23-2026-10-04');
var KS = require(path.join(REPO, NR85, 'kleinst.js'));
var R = KS.R, S = KS.S, MH = KS.MH, H = KS.H;

var KENNUNG = 'momentum-zufall-2026-10/v1';
var SIEGEL = '7b0ddb2';
var SALZ = 'momentum-zufall-2026-10';      /* Teil C 3: Text vor Buch, Stichtag und Zugnummer */
var KORB = S.KORB_N;                        /* 187 */
var BUECHER = 200;                          /* je Fenster, k = 0 - traegt das Urteil */
var BUECHER_PHASEN = 50;                    /* Buecher 1-50 ueber alle 63 Starttage - beschreibend */
var ZWEI48 = 281474976710656;               /* 2^48 */
var FENSTER = ['A', 'B'];
var NAME = { A: 'A-187', B: 'B-187' };
/* Teil B: Sollwerte der Selbstpruefung (Nr. 96, mit Regel K, k = 0) */
var SOLL = { A: { buchEnde: 259238.74, spyEnde: 215535.73 }, B: { buchEnde: 250123.14, spyEnde: 181193.87 } };
var KORREKTUREN = [];

function cent(x) { return Math.round(x * 100); }
function zeichenSort(a) { return a.slice().sort(function (x, y) { return x < y ? -1 : x > y ? 1 : 0; }); }

/* ---------- Die Ziehung (Teil C 3) ---------- */
/** u_j: die ersten 12 Hex-Ziffern von SHA-256('momentum-zufall-2026-10|<b>|<Stichtag>|<j>') / 2^48, in [0, 1). */
function zufallU(b, stichtag, j) {
  var h = crypto.createHash('sha256').update(SALZ + '|' + b + '|' + stichtag + '|' + j, 'utf8').digest('hex');
  return parseInt(h.slice(0, 12), 16) / ZWEI48;
}
/** z Werte ohne Zuruecklegen, gleich wahrscheinlich, aus korb (nach Zeichencode sortiert): die ersten z Schritte von Fisher-Yates. */
function ziehe(korb, z, b, stichtag) {
  var L = zeichenSort(korb), m = L.length;
  if (!(z >= 1 && z <= m)) throw new Error('KLINKE: Zielzahl ' + z + ' passt nicht zum Korb von ' + m);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(stichtag))) throw new Error('KLINKE: Stichtag ist kein JJJJ-MM-TT: ' + stichtag);
  for (var j = 0; j < z; j++) {
    var i = j + Math.floor(zufallU(b, stichtag, j) * (m - j)), t = L[j];
    L[j] = L[i]; L[i] = t;
  }
  return L.slice(0, z);
}
/** Klinken je Ziehung (Teil D): genau z Werte, keiner doppelt, alle aus dem Korb, keine Referenzreihe. */
function pruefeZiehung(T, Q, e, ziel) {
  var imKorb = {}, gesehen = {};
  e.korb.forEach(function (x) { imKorb[x] = true; });
  if (ziel.length !== e.ziel.length) throw new Error('KLINKE: gezogen ' + ziel.length + ' statt ' + e.ziel.length);
  ziel.forEach(function (x) {
    if (!imKorb[x]) throw new Error('KLINKE: gezogener Wert nicht im Korb: ' + x);
    if (gesehen[x]) throw new Error('KLINKE: gezogener Wert doppelt: ' + x);
    gesehen[x] = true;
  });
  R.klinkeReferenz(T, Q, ziel);
}

/* ---------- Der Einsatzweg an der Stelle von zielAm (Teil C 2) ---------- */
/** Qz erbt alles vom echten Q; nur korbCache[s] liefert { koerbe: { 187: wahl(e, s) } } mit e = zielAm(T, Q, s, 187) des echten Q. */
function qMit(T, Q, wahl) {
  var eigen = {};
  var cache = new Proxy({}, {
    get: function (ziel, key) {
      if (typeof key !== 'string' || !/^\d+$/.test(key)) return undefined;
      if (!eigen[key]) {
        var s = Number(key), e = S.zielAm(T, Q, s, KORB), koerbe = {};
        koerbe[KORB] = e.zuWenig ? e : wahl(e, s);
        eigen[key] = { breit: null, koerbe: koerbe };
      }
      return eigen[key];
    },
  });
  var Qz = Object.create(Q);
  Qz.korbCache = cache;
  Qz.eigeneZiele = eigen;
  return Qz;
}
function eintrag(e, ziel, art) {
  return { ziel: ziel, zuWenig: false, zulaessig: e.zulaessig, geprueft: e.geprueft, zulaessigBreit: e.zulaessigBreit, korb: e.korb, korbUmsatz: e.korbUmsatz, art: art };
}
/** Zufallsbuch b. */
function wahlZufall(T, Q, b) {
  return function (e, s) {
    var ziel = ziehe(e.korb, e.ziel.length, b, String(T.kal.tage[s]));
    pruefeZiehung(T, Q, e, ziel);
    return eintrag(e, ziel, 'zufall-' + b);
  };
}
/** Der ganze Korb, Zielliste nach Zeichencode (Teil C 4). */
function wahlKorb(T, Q) {
  return function (e) {
    var ziel = zeichenSort(e.korb);
    if (ziel.length !== KORB || e.zulaessig !== KORB) throw new Error('KLINKE: ganzer Korb hat nicht ' + KORB + ' zulaessige Werte');
    R.klinkeReferenz(T, Q, ziel);
    return eintrag(e, ziel, 'korb');
  };
}
/** Durchreich-Probe: der echte Eintrag unveraendert. */
function wahlDurch() { return function (e) { return e; }; }

/* ---------- Rechnen ---------- */
function def(f) { return { name: NAME[f], fenster: f, korb: KORB }; }
/** k = 0 mit Regel K durch die Huelle von Nr. 85 (zaehlt die Aufrufe nach und haelt die Kosten gegen). */
function k0(V, f, Qz) {
  var Vz = Qz ? { T: V.T, Q: Qz, M: V.M, F: V.F, haupt: V.haupt } : V;
  return KS.k0(Vz, def(f), KS.ANTEIL);
}
/** Die 63 Startphasen mit Regel K. */
function phasen(V, f, Qz) {
  var F = V.F[f];
  H.opts = { kleinstAnteil: KS.ANTEIL };
  try { return S.startphasen(V.T, Qz || V.Q, V.M, F.von, F.bis, R.PHASEN, { totalverlust: V.haupt, korb: KORB, mechanik: 'app' }); }
  finally { H.opts = null; }
}
function kurz(e) {
  var kz = e.kz, L = e.L;
  return { buchEnde: kz.buchEnde, spyEnde: kz.spyEnde, buchGesamt: kz.buchGesamt, buchPa: kz.buchPa, spyPa: kz.spyPa, abstandPa: kz.abstandPa, schlaegt: kz.schlaegt,
    rueckschlagBuch: R.maxRueckschlag(L.tage.map(function (x) { return x.buch; })), umschichtungen: L.zaehler.umschichtungen, zuWenigTage: L.zaehler.zuWenigTage,
    kostenGezahlt: L.zaehler.kosten, reihenenden: L.reihenenden.length, positionenAmEnde: L.positionenAmEnde, kleinstkauf: e.zaehler.kleinstkauf, ausgefallen: e.zaehler.ausgefallen };
}

/* ---------- Statistik und Entscheidung (Teil C 5, 6) ---------- */
function perzentil(werte, p) {
  var x = werte.slice().sort(function (a, b) { return a - b; }), h = (x.length - 1) * p, f = Math.floor(h);
  return f + 1 < x.length ? x[f] + (h - f) * (x[f + 1] - x[f]) : x[f];
}
function paAus(ende, jahre) { return (Math.pow(ende / R.START, 1 / jahre) - 1) * 100; }
function fensterStat(momEnde, spyEnde, endwerte, jahre) {
  var p5 = perzentil(endwerte, 0.05), p95 = perzentil(endwerte, 0.95), med = R.median(endwerte), drueber = 0, vorSpy = 0;
  endwerte.forEach(function (x) { if (x > momEnde) drueber++; if (x > spyEnde) vorSpy++; });
  var ab = function (x) { return paAus(x, jahre) - paAus(spyEnde, jahre); };
  return { n: endwerte.length, momentumEnde: momEnde, spyEnde: spyEnde, median: med, p5: p5, p95: p95, minimum: Math.min.apply(null, endwerte), maximum: Math.max.apply(null, endwerte),
    rang: 1 + drueber, zufallUeberMomentum: drueber, ueber95: momEnde > p95, medianVorSpy: med > spyEnde, vorSpy: vorSpy, anteilVorSpy: vorSpy / endwerte.length,
    abstandPa: { momentum: ab(momEnde), median: ab(med), p5: ab(p5), p95: ab(p95) } };
}
function urteil(st) {
  if (st.A.ueber95 && st.B.ueber95) return 'die Auswahl trägt';
  if (st.A.medianVorSpy && st.B.medianVorSpy) return 'der Korb trägt';
  return 'nicht entscheidbar';
}

/* ---------- Vorbereitung, Selbstpruefung, Durchreich-Probe ---------- */
function vorbereitung() {
  var K = require(path.join(R.PRUEFSTAND, 'konfig.js'));
  if (R.PANEL_WAHL !== 'v2.3' || path.basename(R.PANEL_ORDNER) !== 'voll-v23c' || !R.PANEL_OPTIONEN || R.PANEL_OPTIONEN.panelKennung !== K.PANEL_KENNUNG_V23) {
    throw new Error('KLINKE: rueckblick.js hat das Panel v2.3 nicht gewaehlt (' + R.PANEL_ORDNER + ')');
  }
  var V = KS.vorbereitung();
  if (V.T.stand.kennung !== K.PANEL_KENNUNG_V23 || V.T.stand.bau !== '2c') throw new Error('KLINKE: gelesen wurde nicht v2.3 Bau 2c');
  return V;
}
function liesJson(datei) { return JSON.parse(fs.readFileSync(path.join(REPO, datei), 'utf8')); }

/** Momentum-Buch k = 0 gegen Nr. 96 (Soll aus Teil B und aus der Datei), dann die Durchreich-Probe auf das Bit. */
function selbstpruefung(V) {
  var E96 = liesJson(path.join(NR96, 'ergebnis.json')), aus = { laeufe: {}, bestanden: true, durchreichen: {} };
  FENSTER.forEach(function (f) {
    var e = k0(V, f), d = E96.laeufe[NAME[f]].mit.k0, s = SOLL[f];
    var gut = cent(e.kz.buchEnde) === cent(s.buchEnde) && cent(e.kz.spyEnde) === cent(s.spyEnde) && cent(d.buchEnde) === cent(s.buchEnde) && cent(d.spyEnde) === cent(s.spyEnde);
    aus.laeufe[NAME[f]] = { buchEnde: e.kz.buchEnde, spyEnde: e.kz.spyEnde, sollBuch: s.buchEnde, sollSpy: s.spyEnde, dateiNr96Buch: d.buchEnde, dateiNr96Spy: d.spyEnde, bestanden: gut,
      umschichtungen: e.L.zaehler.umschichtungen };
    if (!gut) aus.bestanden = false;
    console.log('Selbstpruefung ' + NAME[f] + ': Buch ' + e.kz.buchEnde.toFixed(2) + ' (Soll ' + s.buchEnde.toFixed(2) + '), SPY ' + e.kz.spyEnde.toFixed(2) + ' (Soll ' + s.spyEnde.toFixed(2) + ') -> ' + (gut ? 'getroffen' : 'NICHT getroffen'));
    var Qd = qMit(V.T, V.Q, wahlDurch()), ed = k0(V, f, Qd), bit = ed.kz.buchEnde === e.kz.buchEnde && ed.kz.spyEnde === e.kz.spyEnde && ed.L.tage.length === e.L.tage.length &&
      ed.L.tage.every(function (x, i) { return x.buch === e.L.tage[i].buch && x.spy === e.L.tage[i].spy && x.bar === e.L.tage[i].bar; });
    aus.durchreichen[NAME[f]] = { buchEnde: ed.kz.buchEnde, bitgleich: bit, stichtage: Object.keys(Qd.eigeneZiele).length };
    if (!bit) aus.bestanden = false;
    console.log('Durchreich-Probe ' + NAME[f] + ': ' + (bit ? 'auf das Bit gleich' : 'NICHT gleich') + ' (' + Object.keys(Qd.eigeneZiele).length + ' Stichtage ueber den eigenen Zwischenspeicher)');
  });
  return aus;
}

/* ---------- Bericht ---------- */
function de(x, n) { return x.toFixed(n == null ? 2 : n).replace('.', ','); }
function vz(x, n) { return (x >= 0 ? '+' : '−') + de(Math.abs(x), n); }
function dollar(x) { return de(x, 2).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function tsd(x) { return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function pz(x) { return de(x * 100, 1) + ' %'; }
function datumDe(d) { var p = String(d).split('-'); return p[2] + '.' + p[1] + '.' + p[0]; }

/** Verteilung als Text: die 200 Abstaende in Stufen von 2 Pp p. a. */
function verteilungText(abst) {
  var lo = Math.floor(Math.min.apply(null, abst) / 2) * 2, hi = Math.ceil(Math.max.apply(null, abst) / 2) * 2, teile = [];
  if (hi === lo) hi = lo + 2;
  for (var a = lo; a < hi; a += 2) {
    var n = abst.filter(function (x) { return x >= a && x < a + 2; }).length;
    if (n) teile.push(vz(a, 0) + ' bis ' + vz(a + 2, 0) + ': ' + n);
  }
  return teile.join(' · ');
}

function ergebnisText(E) {
  var Z = [], st = E.statistik;
  Z.push('# Momentum-Buch gegen 200 Zufallsbücher aus demselben Korb (Auftrag Nr. 100)');
  Z.push('');
  Z.push('**Urteil nach der Regel: ' + E.urteil + '.** Momentum-Buch über dem 95. Perzentil der Zufallsbücher: A ' + (st.A.ueber95 ? 'ja' : 'nein') + ', B ' + (st.B.ueber95 ? 'ja' : 'nein') +
    '; Median der Zufallsbücher vor SPY: A ' + (st.A.medianVorSpy ? 'ja' : 'nein') + ', B ' + (st.B.medianVorSpy ? 'ja' : 'nein') + '. Regel (vorab, `REGEL.md`, Siegel `' + SIEGEL +
    '`): „die Auswahl trägt" nur bei Momentum über P95 in beiden Fenstern; „der Korb trägt", wenn das nicht gilt und der Median in beiden Fenstern vor SPY endet; sonst „nicht entscheidbar".');
  Z.push('');
  Z.push('| Start am ersten Tag (k = 0), mit Regel K | **Fenster A** ' + datumDe(E.fenster.A.von) + '–' + datumDe(E.fenster.A.bis) + ' | **Fenster B** ' + datumDe(E.fenster.B.von) + '–' + datumDe(E.fenster.B.bis) + ' |');
  Z.push('|---|---|---|');
  var zeile = function (t, g) { Z.push('| ' + t + ' | ' + g('A') + ' | ' + g('B') + ' |'); };
  zeile('Momentum-Buch, Endwert (Abstand zu SPY p. a.)', function (f) { return '**' + dollar(st[f].momentumEnde) + ' $** (' + vz(st[f].abstandPa.momentum, 2) + ' Pp)'; });
  zeile('S&P 500 (SPY mit Ausschüttungen)', function (f) { return dollar(st[f].spyEnde) + ' $'; });
  zeile('**Rang des Momentum-Buchs** (Zufallsbücher darüber)', function (f) { return '**' + st[f].rang + ' von 201** (' + st[f].zufallUeberMomentum + ' von 200)'; });
  zeile('Zufallsbücher: 95. Perzentil', function (f) { return dollar(st[f].p95) + ' $ (' + vz(st[f].abstandPa.p95, 2) + ' Pp)'; });
  zeile('Zufallsbücher: Median', function (f) { return dollar(st[f].median) + ' $ (' + vz(st[f].abstandPa.median, 2) + ' Pp)'; });
  zeile('Zufallsbücher: 5. Perzentil', function (f) { return dollar(st[f].p5) + ' $ (' + vz(st[f].abstandPa.p5, 2) + ' Pp)'; });
  zeile('Zufallsbücher: Minimum / Maximum', function (f) { return dollar(st[f].minimum) + ' / ' + dollar(st[f].maximum) + ' $'; });
  zeile('Anteil der Zufallsbücher vor SPY', function (f) { return st[f].vorSpy + ' von 200 (' + pz(st[f].anteilVorSpy) + ')'; });
  zeile('Ganzer Korb gleich gewichtet (187 Ziele) gegen SPY', function (f) { var k = E.korb[f].k0; return dollar(k.buchEnde) + ' $ (' + vz(k.abstandPa, 2) + ' Pp p. a.) — ' + (k.schlaegt ? 'vor' : 'hinter') + ' SPY'; });
  zeile('größter Rückschlag: Momentum / Median der Zufallsbücher / ganzer Korb', function (f) { return vz(E.momentum[f].k0.rueckschlagBuch, 1) + ' / ' + vz(E.zufall[f].rueckschlagMedian, 1) + ' / ' + vz(E.korb[f].k0.rueckschlagBuch, 1) + ' %'; });
  Z.push('');
  FENSTER.forEach(function (f) {
    Z.push('**Verteilung Fenster ' + f + '** (Abstand der 200 Zufallsbücher zu SPY, Pp p. a.; Momentum-Buch ' + vz(st[f].abstandPa.momentum, 2) + '): ' + verteilungText(E.zufall[f].buecher.map(function (x) { return x.abstandPa; })) + '.');
    Z.push('');
  });
  var P = E.phasen;
  Z.push('**Beschreibend — 63 Starttage (kein Urteil).** ' + FENSTER.map(function (f) {
    var p = P[f];
    return 'Fenster ' + f + ': Momentum-Buch Median der 63 Abstände ' + vz(p.momentum.median, 2) + ' Pp p. a. (' + p.momentum.vorDemMarkt + ' von 63 vor SPY); die Bücher 1–50 im Median ' +
      vz(p.buecherMedian.median, 2) + ' (Spanne ' + vz(p.buecherMedian.minimum, 2) + ' bis ' + vz(p.buecherMedian.maximum, 2) + '), ' + p.buecherMedianUeberMomentum + ' von 50 Buch-Medianen über dem des Momentum-Buchs; ' +
      'je Starttag liegen im Median ' + de(p.jePhaseUeberMomentumMedian, 1) + ' der 50 Bücher vor dem Momentum-Buch, vor allen 50 in ' + p.phasenVorAllen + ' von 63 Starttagen; ' + p.buchPhasenVorSpy + ' von 3.150 Buch-Phasen vor SPY (' +
      pz(p.buchPhasenVorSpy / 3150) + '); ganzer Korb Median ' + vz(p.korb.median, 2) + ' (' + p.korb.vorDemMarkt + ' von 63 vor SPY)';
  }).join('. ') + '.');
  Z.push('');
  var sp = E.selbstpruefung;
  Z.push('**Geprüft vor dem Lauf.** Selbstprüfung (Momentum-Buch mit Regel K, k = 0, im selben Prozess): ' + FENSTER.map(function (f) {
    var s = sp.laeufe[NAME[f]];
    return NAME[f] + ' ' + dollar(s.buchEnde) + ' $ gegen ' + dollar(s.spyEnde) + ' $ (Nr. 96: ' + dollar(s.sollBuch) + ' / ' + dollar(s.sollSpy) + ' — ' + (s.bestanden ? 'getroffen' : 'NICHT getroffen') + ')';
  }).join('; ') + '. Durchreich-Probe über den eigenen Zwischenspeicher: ' + FENSTER.map(function (f) { return NAME[f] + ' ' + (sp.durchreichen[NAME[f]].bitgleich ? 'auf das Bit gleich' : 'NICHT gleich'); }).join(', ') +
    '. 63 Startphasen des Momentum-Buchs gegen Nr. 96: ' + FENSTER.map(function (f) { return f + ' ' + P[f].momentum.gleichNr96 + ' von 63 gleich'; }).join(', ') +
    '. Ziehungen: ' + tsd(E.ziehungenGeprueft) + ' geprüft (Zahl, Korb, doppelt, Referenzreihe). Korrekturen nach dem Siegel: ' + (E.korrekturen.length ? E.korrekturen.length : 'keine') + '.');
  Z.push('');
  Z.push('*Auftrag Nr. 100, Kennung `' + E.kennung + '`, Panel `' + E.panelKennung + '` Bau ' + E.panelBau + '. Zufallsbuch = je Umschichtungstag ' + E.regel.zielzahl +
    ' Werte ohne Zurücklegen aus den 187 zulässigen des Korbs (geseedet je Buch und Stichtag, `REGEL.md` Teil C 3; alle Listen für k = 0 in `ziehungen.json`); sonst alles wie das Momentum-Buch ' +
    '(Mechanik der App mit Regel K 5 %, 20 Bp je Seite, Takt 63, Ausschüttungen, Reihenenden, 100.000 $). Alle 200 Endwerte je Fenster in `ergebnis.json`. Alles Simulation, keine Anlageberatung.*');
  return Z.join('\n') + '\n';
}

/* ---------- Der Lauf ---------- */
function sha(datei) { return crypto.createHash('sha256').update(fs.readFileSync(path.join(REPO, datei))).digest('hex').slice(0, 16); }
function minMedMax(a) { return { minimum: Math.min.apply(null, a), median: R.median(a), maximum: Math.max.apply(null, a) }; }

function lauf(nurSelbstpruefung) {
  var t0 = Date.now(), V = vorbereitung();
  console.log('Panel ' + V.T.stand.kennung + ' Bau ' + V.T.stand.bau + ', ' + V.T.g.n + ' Zeilen, ' + V.T.nSym + ' Reihen');
  var SP = selbstpruefung(V);
  if (!SP.bestanden) throw new Error('SELBSTPRUEFUNG oder DURCHREICH-PROBE nicht bestanden - kein Lauf (REGEL.md Teil D)');
  if (nurSelbstpruefung) return;
  var git = '';
  try { git = require('child_process').execSync('git rev-parse --short HEAD', { cwd: REPO }).toString().trim(); } catch (e) { git = 'unbekannt'; }
  var E96 = liesJson(path.join(NR96, 'ergebnis.json'));
  var E = {
    kennung: KENNUNG, siegel: SIEGEL, vollstaendig: false, erzeugt: new Date().toISOString(), panelKennung: V.T.stand.kennung, panelBau: V.T.stand.bau, panelStand: V.T.stand.stand, gitHead: git,
    quellen: { 'mfhandel.js': sha('mfhandel.js'), 'momentum.js': sha('momentum.js'), 'liquide.js': sha('liquide.js'), 'korb.js': sha(path.join('studien', 'momentum-korb-2026-10-04', 'korb.js')),
      'rueckblick.js': sha(path.join('studien', 'massstab-rueckblick-2026-10-04', 'rueckblick.js')), 'kleinst.js': sha(path.join(NR85, 'kleinst.js')),
      'lauf.js': sha(path.join('studien', 'momentum-zufall-2026-10', 'lauf.js')) },
    regel: { korbN: KORB, zielzahl: Math.max(5, Math.round(KORB * MH.buchKonfig().anteil)), buecher: BUECHER, buecherPhasen: BUECHER_PHASEN, startwerte: '1 bis 200 (Buch b hat den Startwert b)',
      salz: SALZ, kleinstAnteil: KS.ANTEIL, kostenBpJeSeite: R.KOSTEN_BP, startkapital: R.START, startphasen: R.PHASEN, fenster: S.FENSTER, konfigBuch: MH.buchKonfig(), massstab: R.MASSSTAB,
      perzentil: 'linear interpoliert, h = (n - 1) p (QUANTIL.INKL)' },
    selbstpruefung: SP, urteil: null, statistik: {}, fenster: {}, momentum: {}, zufall: {}, korb: {}, phasen: {}, ziehungenGeprueft: 0, korrekturen: KORREKTUREN, laufzeitSekunden: 0,
  };
  var Zh = { kennung: KENNUNG, erklaerung: 'je Fenster: Stichtage der Umschichtungen bei Start am ersten Tag (k = 0) und je Buch b (Index b - 1) die gezogene Zielliste je Stichtag, Werte durch Komma getrennt, in der Reihenfolge der Ziehung', fenster: {} };
  var datei = path.join(__dirname, 'ergebnis.json');
  var zwischen = function () { E.laufzeitSekunden = Math.round((Date.now() - t0) / 100) / 10; fs.writeFileSync(datei, JSON.stringify(E, null, 1)); };

  FENSTER.forEach(function (f) {
    var t1 = Date.now(), F = V.F[f];
    E.fenster[f] = { von: String(V.T.kal.tage[F.von]), bis: String(V.T.kal.tage[F.bis]), handelstage: V.Q.ord[F.bis] - V.Q.ord[F.von] + 1 };
    /* 1. Momentum-Buch: k = 0 und die 63 Startphasen (fuellt den Zwischenspeicher des echten Q fuer alle Stichtage) */
    var em = k0(V, f), mk = kurz(em), SPm = phasen(V, f), alt = E96.laeufe[NAME[f]].mit.startphasen.abstaende;
    var gleich96 = SPm.abstaende.filter(function (x, i) { return x === alt[i]; }).length;
    if (Math.abs(SPm.phasen[0].abstandPa - mk.abstandPa) > 1e-9) throw new Error('KLINKE: Startphase 0 ist nicht k = 0 (Momentum ' + f + ')');
    E.momentum[f] = { k0: mk, startphasen: { abstaende: SPm.abstaende, median: SPm.median, minimum: SPm.minimum, maximum: SPm.maximum, vorDemMarkt: SPm.vorDemMarkt } };
    console.log('Fenster ' + f + ': Momentum ' + mk.buchEnde.toFixed(2) + ', 63 Phasen gleich Nr. 96: ' + gleich96 + ' (' + Math.round((Date.now() - t1) / 1000) + ' s)');
    if (gleich96 !== 63) throw new Error('KLINKE: die 63 Startphasen des Momentum-Buchs treffen Nr. 96 nicht (' + gleich96 + ' von 63)');
    var jahre = em.kz.jahre;
    /* 2. 200 Zufallsbuecher, k = 0 */
    var buecher = [], stichtage = null, listen = [];
    for (var b = 1; b <= BUECHER; b++) {
      var Qz = qMit(V.T, V.Q, wahlZufall(V.T, V.Q, b)), e = k0(V, f, Qz), x = kurz(e);
      if (e.kz.spyEnde !== em.kz.spyEnde) throw new Error('KLINKE: SPY-Endwert des Zufallsbuchs ' + b + ' weicht ab');
      var tage = Object.keys(Qz.eigeneZiele).map(Number).sort(function (p, q) { return p - q; });
      var st = tage.map(function (s) { return String(V.T.kal.tage[s]); });
      if (!stichtage) stichtage = st;
      else if (st.join() !== stichtage.join()) throw new Error('KLINKE: Zufallsbuch ' + b + ' schichtet an anderen Tagen um');
      listen.push(tage.map(function (s) { var z = Qz.eigeneZiele[String(s)].koerbe[KORB]; if (z.zuWenig) return ''; E.ziehungenGeprueft++; return z.ziel.join(','); }));
      x.buch = b;
      buecher.push(x);
    }
    var us = em.L.umschichtungen.map(function (u) { return u.stichtag; });
    if (us.join() !== stichtage.join()) throw new Error('KLINKE: Stichtage der Zufallsbuecher sind nicht die des Momentum-Buchs');
    Zh.fenster[f] = { stichtage: stichtage, buecher: listen };
    var endwerte = buecher.map(function (x2) { return x2.buchEnde; });
    E.zufall[f] = { buecher: buecher, rueckschlagMedian: R.median(buecher.map(function (x2) { return x2.rueckschlagBuch; })),
      kostenMedian: R.median(buecher.map(function (x2) { return x2.kostenGezahlt; })), reihenendenSumme: buecher.reduce(function (a, x2) { return a + x2.reihenenden; }, 0) };
    E.statistik[f] = fensterStat(mk.buchEnde, em.kz.spyEnde, endwerte, jahre);
    console.log('Fenster ' + f + ': 200 Zufallsbuecher fertig (' + Math.round((Date.now() - t1) / 1000) + ' s)');
    zwischen();
    /* 3. Ganzer Korb gleich gewichtet: k = 0 und 63 Startphasen */
    var Qk = qMit(V.T, V.Q, wahlKorb(V.T, V.Q)), ek = k0(V, f, Qk), SPk = phasen(V, f, qMit(V.T, V.Q, wahlKorb(V.T, V.Q)));
    E.korb[f] = { k0: kurz(ek), startphasen: { abstaende: SPk.abstaende, median: SPk.median, minimum: SPk.minimum, maximum: SPk.maximum, vorDemMarkt: SPk.vorDemMarkt } };
    /* 4. Buecher 1-50 ueber alle 63 Starttage (beschreibend) */
    var abst = [];
    for (var b2 = 1; b2 <= BUECHER_PHASEN; b2++) {
      var SPz = phasen(V, f, qMit(V.T, V.Q, wahlZufall(V.T, V.Q, b2)));
      if (Math.abs(SPz.phasen[0].abstandPa - buecher[b2 - 1].abstandPa) > 1e-9) throw new Error('KLINKE: Startphase 0 von Buch ' + b2 + ' ist nicht sein k = 0');
      abst.push(SPz.abstaende);
    }
    var mediane = abst.map(function (a) { return R.median(a); }), jePhase = [], vorAllen = 0, vorSpy = 0, alle = [];
    for (var k = 0; k < R.PHASEN; k++) {
      var n = abst.filter(function (a) { return a[k] > SPm.abstaende[k]; }).length;
      jePhase.push(n); if (n === 0) vorAllen++;
    }
    abst.forEach(function (a) { a.forEach(function (y) { alle.push(y); if (y > 0) vorSpy++; }); });
    E.phasen[f] = { momentum: { median: SPm.median, vorDemMarkt: SPm.vorDemMarkt, gleichNr96: gleich96 }, buecherMedian: minMedMax(mediane), mediane: mediane,
      buecherMedianUeberMomentum: mediane.filter(function (m) { return m > SPm.median; }).length, jePhaseUeberMomentum: jePhase, jePhaseUeberMomentumMedian: R.median(jePhase),
      phasenVorAllen: vorAllen, buchPhasenVorSpy: vorSpy, alleAbstaende: minMedMax(alle), korb: { median: SPk.median, vorDemMarkt: SPk.vorDemMarkt }, abstaendeJeBuch: abst };
    console.log('Fenster ' + f + ': Buecher 1-50 ueber 63 Starttage fertig (' + Math.round((Date.now() - t1) / 1000) + ' s)');
    zwischen();
  });
  E.urteil = urteil(E.statistik);
  E.vollstaendig = true;
  zwischen();
  fs.writeFileSync(path.join(__dirname, 'ziehungen.json'), JSON.stringify(Zh));
  fs.writeFileSync(path.join(__dirname, 'ERGEBNIS.md'), ergebnisText(E));
  FENSTER.forEach(function (f) {
    var s = E.statistik[f];
    console.log(f + ': Momentum ' + s.momentumEnde.toFixed(2) + ' Rang ' + s.rang + ' von 201; P5 ' + s.p5.toFixed(2) + ' Median ' + s.median.toFixed(2) + ' P95 ' + s.p95.toFixed(2) +
      '; SPY ' + s.spyEnde.toFixed(2) + '; vor SPY ' + s.vorSpy + '/200; Korb ' + E.korb[f].k0.buchEnde.toFixed(2));
  });
  console.log('URTEIL: ' + E.urteil + ' - Laufzeit s ' + E.laufzeitSekunden);
}

module.exports = { KENNUNG: KENNUNG, SALZ: SALZ, KORB: KORB, SOLL: SOLL, KS: KS, R: R, S: S, MH: MH, H: H, zufallU: zufallU, ziehe: ziehe, pruefeZiehung: pruefeZiehung, qMit: qMit,
  wahlZufall: wahlZufall, wahlKorb: wahlKorb, wahlDurch: wahlDurch, k0: k0, phasen: phasen, perzentil: perzentil, fensterStat: fensterStat, urteil: urteil, vorbereitung: vorbereitung,
  selbstpruefung: selbstpruefung, verteilungText: verteilungText, ergebnisText: ergebnisText, zeichenSort: zeichenSort };

if (require.main === module) lauf(process.argv.indexOf('--selbstpruefung') >= 0);

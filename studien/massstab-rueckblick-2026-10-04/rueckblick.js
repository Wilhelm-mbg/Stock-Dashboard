'use strict';
/* Auftrag Nr. 74 (04.10.2026): Rueckblick ueber fuenf Jahre - Momentum-Buch der App gegen SPY mit Ausschuettungen.
 * Die Regel steht in REGEL.md (vor jeder Zahl festgelegt). Das Buch wird NACHGESPIELT: Zielliste, Plan, Ausfuehrung
 * und Bewertung kommen aus mfhandel.js der App (nur gerufen, nie geaendert). Hier stehen nur Zeitablauf, Reihenende,
 * Ausschuettungen, Massstab und die Kennzahlen.
 *   node --max-old-space-size=6144 studien/massstab-rueckblick-2026-10-04/rueckblick.js     (der eine Lauf) */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var REPO = path.resolve(__dirname, '..', '..');
var MH = require(path.join(REPO, 'mfhandel.js'));
var PRUEFSTAND = path.join(REPO, 'studien', 'querschnitt-pruefstand-2026-09-13');
var K = require(path.join(PRUEFSTAND, 'konfig.js'));

var KENNUNG = 'massstab-rueckblick-2026-10-04/v1';
/* Auftrag Nr. 96 (04.10.2026): ZUSAETZLICHE Wahl des Panels ueber die Umgebungsvariable RUECKBLICK_PANEL. Ohne sie (Vorgabe) liest
 * alles wie bisher voll-v22, und PANEL_OPTIONEN ist undefined - PR.Tafel(PANEL_ORDNER, PANEL_OPTIONEN) ist dann PR.Tafel(PANEL_ORDNER).
 * Mit RUECKBLICK_PANEL=v2.3 voll-v23c (Bau 2c) mit der ausdruecklichen Kennung K.PANEL_KENNUNG_V23. Gesetzt nur von
 * studien/momentum-korb-v23-2026-10-04/lauf.js. lauf() hier und in korb.js reicht die Option NICHT durch: auf v2.3 bricht es an der
 * Kennung ab, bevor es die Ergebnisdatei von Nr. 74 bzw. Nr. 78 ueberschreiben kann. Jeder andere Wert bricht ab. */
var PANEL_WAHL = process.env.RUECKBLICK_PANEL || '';
if (PANEL_WAHL !== '' && PANEL_WAHL !== 'v2.3') throw new Error('KLINKE: RUECKBLICK_PANEL kennt nur v2.3 (oder leer), nicht ' + PANEL_WAHL);
var PANEL_ORDNER = path.join(PRUEFSTAND, PANEL_WAHL === 'v2.3' ? 'voll-v23c' : 'voll-v22');
var PANEL_OPTIONEN = PANEL_WAHL === 'v2.3' ? { panelKennung: K.PANEL_KENNUNG_V23 } : undefined;
var MASSNAHMEN_ORDNER = 'E:/Markt-Dashboard-Archiv/alpaca-massnahmen';
var KOSTEN_BP = 20;                 /* mfdepot.js Zeile 158: MH.fuehreAus(d.mfBuch, plan, now, 20) */
var KOSTEN_FUNDSTELLE = 'mfdepot.js Zeile 158: MH.fuehreAus(d.mfBuch, plan, now, 20)';
var START = 100000;
var FENSTER_VON = '2021-09-16', FENSTER_BIS = '2026-09-15';
var PHASEN = 63;
var MASSSTAB = 'SPY';
var KORREKTUREN = [];               /* §1.10: jeder behobene Fehler nach dem Siegel wird hier vermerkt */
/* t-Wert 97,5 % fuer n-1 Freiheitsgrade (Tabelle, Index = Freiheitsgrade) */
var T975 = [null, 12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.160, 2.145, 2.131,
  2.120, 2.110, 2.101, 2.093, 2.086, 2.080, 2.074, 2.069, 2.064, 2.060, 2.056, 2.052, 2.048, 2.045, 2.042];

/* ---------- Vorbereitung: Zeitstempel je Tag, Liste der Panel-Handelstage, Referenzmerkmal ---------- */
function vorbereiten(T) {
  var ms = new Float64Array(T.nTage), ptage = [], ord = new Int32Array(T.nTage).fill(-1);
  for (var t = 0; t < T.nTage; t++) {
    var p = String(T.kal.tage[t]).split('-');
    ms[t] = Date.UTC(+p[0], +p[1] - 1, +p[2]);
    if (t <= T.maxTag && T.tagVon[t] >= 0) { ord[t] = ptage.length; ptage.push(t); }
  }
  var ref = [], namen = {};
  for (var s = 0; s < T.nSym; s++) {
    if (namen[T.symName[s]]) throw new Error('KLINKE: Reihenname doppelt: ' + T.symName[s]);
    namen[T.symName[s]] = true;
    ref.push(!!T.stand.symbole[s].referenz);
  }
  return { ms: ms, ptage: ptage, ord: ord, ref: ref, zielCache: {}, rohEnde: new Int32Array(T.nSym).fill(-1), rohArr: new Array(T.nSym) };
}

/** Zeiger hinter die letzte Zeile der Reihe mit Tag <= t (in T.symZeilen). */
function endeBis(T, sym, t) {
  var lo = T.symStart[sym], hi = T.symStart[sym + 1], g = T.g;
  while (lo < hi) { var m = (lo + hi) >> 1; if (g.tag[T.symZeilen[m]] <= t) lo = m + 1; else hi = m; }
  return lo;
}

/** Erster Panel-Handelstag mit Datum >= datum (JJJJ-MM-TT); -1 ausserhalb des Kalenders. */
function tagAb(T, Q, datum) {
  var p = Q.ptage;
  if (!p.length || datum < String(T.kal.tage[p[0]]) || datum > String(T.kal.tage[p[p.length - 1]])) return -1;
  var lo = 0, hi = p.length - 1;
  while (lo < hi) { var m = (lo + hi) >> 1; if (String(T.kal.tage[p[m]]) < datum) lo = m + 1; else hi = m; }
  return p[lo];
}

/* ---------- rohMap am Stichtag s (§1.2): je Aktienreihe die letzten Zeilen bis einschliesslich s ---------- */
function rohMapAm(T, Q, s) {
  var g = T.g, roh = {}, K0 = MH.buchKonfig(), zeilen = K0.rueckblick + K0.luecke + 1;
  for (var sym = 0; sym < T.nSym; sym++) {
    if (Q.ref[sym]) continue;                                  /* Referenzreihen gehoeren nicht in die rohMap */
    var a = T.symStart[sym], e = endeBis(T, sym, s);
    if (e <= a) continue;                                      /* noch keine Zeile bis s */
    if (Q.rohEnde[sym] !== e) {
      var von = Math.max(a, e - zeilen), arr = new Array(e - von);
      for (var q = von; q < e; q++) {
        var z = T.symZeilen[q];
        arr[q - von] = [Q.ms[g.tag[z]], g.bSchluss[z], g.umsatz[z] / g.bSchluss[z]];
      }
      Q.rohEnde[sym] = e; Q.rohArr[sym] = arr;
    }
    roh[T.symName[sym]] = Q.rohArr[sym];
  }
  return roh;
}

/** Klinke: keine Referenzreihe im Ziel. */
function klinkeReferenz(T, Q, ziel) {
  ziel.forEach(function (n) {
    var i = T.symIdx[n];
    if (i == null || Q.ref[i]) throw new Error('KLINKE: Referenzreihe oder unbekannte Reihe im Ziel: ' + n);
  });
}

/** Zielliste des Stichtags s aus der Funktion der App. */
function zielAm(T, Q, s) {
  if (Q.zielCache[s]) return Q.zielCache[s];
  var r = MH.momentumZiel(rohMapAm(T, Q, s), { nowMs: Q.ms[s] });
  klinkeReferenz(T, Q, r.ziel);
  return (Q.zielCache[s] = { ziel: r.ziel, zuWenig: !!r.zuWenig, zulaessig: r.korb.zulaessig, geprueft: r.korb.geprueft });
}

/* ---------- Ausschuettungen (§1.5): eine Datei je Kuerzel-Ordner, nur lesen ---------- */
function Massnahmen(T, Q, leser) {
  var cache = {};
  leser = leser || function (name) {
    var f = path.join(MASSNAHMEN_ORDNER, name + '.json');
    if (!fs.existsSync(f)) return null;
    return JSON.parse(fs.readFileSync(f, 'utf8')).saetze || [];
  };
  return function (sym) {
    if (cache[sym]) return cache[sym];
    var saetze = leser(T.stand.symbole[sym].ordner), e = { datei: !!saetze, nachTag: {} };
    (saetze || []).forEach(function (x) {
      if (x._art !== 'cash_dividends') return;
      var rate = Number(x.rate);
      if (!(rate > 0)) return;
      var t = tagAb(T, Q, String(x.ex_date));
      if (t < 0) return;
      (e.nachTag[t] = e.nachTag[t] || []).push(rate);
    });
    return (cache[sym] = e);
  };
}

/** Saetze mit Ex-Tag d fuer eine Reihe - DIESELBE Funktion fuer Buch und Massstab.
 *  satz = rate / rohSchluss des Vortags (letzte Zeile der Reihe vor d); basis = bSchluss des Vortags. */
function ausschuettungenAm(T, Q, M, sym, d) {
  var liste = M(sym).nachTag[d];
  if (!liste) return [];
  var e = endeBis(T, sym, d - 1);
  if (e <= T.symStart[sym]) return [];
  var vz = T.symZeilen[e - 1], g = T.g;
  return liste.map(function (rate) { return { rate: rate, satz: rate / g.rohSchluss[vz], basis: g.bSchluss[vz] }; });
}

function offenWert(buch, preise) {
  var w = buch.cash;
  buch.positionen.forEach(function (p) { if (preise[p.sym] > 0) w += p.stueck * preise[p.sym]; });
  return w;
}

/* ---------- Der Nachlauf eines Buchs von startTag (erster Ausfuehrungstag) bis endTag ---------- */
function simuliere(T, Q, M, opt) {
  var g = T.g, startTag = opt.startTag, endTag = opt.endTag, mitA = opt.ausschuettungen !== false;
  var tv = {}; (opt.totalverlust || []).forEach(function (x) { tv[x] = true; });
  var halten = MH.buchKonfig().halten, spy = T.symIdx[MASSSTAB];
  var o0 = Q.ord[startTag], oEnd = Q.ord[endTag];
  if (!(o0 >= 1) || !(oEnd >= o0)) throw new Error('Start/Ende ist kein Panel-Handelstag oder hat keinen Vortag');
  var zSpy0 = T.zeileVon(spy, startTag);
  if (zSpy0 < 0) throw new Error('Massstab ohne Zeile am Starttag');
  var buch = { cash: START, positionen: [], trades: [] }, meta = {};
  var zs = { umschichtungen: 0, zuWenigTage: 0, kosten: 0, kaeufe: 0, verkaeufe: 0, positionen: 0, positionenMitDatei: 0, positionenOhneDatei: 0,
    ausschuettungen: 0, ausschuettungSumme: 0, mehrfachAmExTag: 0, maxSatz: 0, lueckentage: 0, spyAusschuettungen: 0, spyAusschuettungSumme: 0, spyRateSumme: 0 };
  var reihenenden = [], umschichtungen = [], tage = [], perioden = [], offen = null;
  var spyStueck = START / g.bEroeffnung[zSpy0], spySchluss = NaN;
  var buchWert = START, spyWert = START;                       /* Werte zum Schluss des Vortags */
  var naechste = startTag;

  for (var o = o0; o <= oEnd; o++) {
    var d = Q.ptage[o];
    /* 1. Reihenende (§1.4): erster Panel-Handelstag nach der letzten Zeile -> ausbuchen */
    for (var i = buch.positionen.length - 1; i >= 0; i--) {
      var p = buch.positionen[i], m = meta[p.sym];
      if (T.zeileVon(m.sym, d) >= 0) continue;
      var lz = T.letzteZeile(m.sym);
      if (g.tag[lz] < d) {
        var grund = T.endeGrund[m.sym] || null, total = !!(grund && tv[grund]);
        var gut = total ? 0 : p.stueck * g.bSchluss[lz];
        buch.cash += gut;
        buch.positionen.splice(i, 1);
        reihenenden.push({ reihe: p.sym, tag: String(T.kal.tage[d]), letzteZeile: String(T.kal.tage[g.tag[lz]]), grund: grund,
          totalverlust: total, gutschrift: gut, wertZumLetztenKurs: p.stueck * g.bSchluss[lz], lebendGefuehrt: !!T.stand.symbole[m.sym].lebend });
        delete meta[p.sym];
      } else zs.lueckentage++;
    }
    /* 2. Ausschuettungen mit Ex-Tag d: Anspruch hat, wer die Position ueber die Nacht hielt (Kauf vor d) */
    var bar = 0;
    if (mitA) buch.positionen.forEach(function (p2) {
      var m2 = meta[p2.sym];
      if (!(m2.seitTag < d)) return;
      var l = ausschuettungenAm(T, Q, M, m2.sym, d);
      if (l.length > 1) zs.mehrfachAmExTag++;
      l.forEach(function (a) { bar += p2.stueck * a.basis * a.satz; zs.ausschuettungen++; if (a.satz > zs.maxSatz) zs.maxSatz = a.satz; });
    });
    /* 3. Umschichtung zur Eroeffnung des Ausfuehrungstags; Stichtag = Panel-Handelstag davor */
    if (d === naechste) {
      var s = Q.ptage[o - 1], zl = zielAm(T, Q, s);
      if (zl.zuWenig) { zs.zuWenigTage++; naechste = o + 1 <= oEnd ? Q.ptage[o + 1] : -1; }
      else {
        var preise = {};
        var kurs = function (name) { var z = T.zeileVon(T.symIdx[name], d); if (z >= 0 && g.bEroeffnung[z] > 0) preise[name] = g.bEroeffnung[z]; };
        zl.ziel.forEach(kurs); buch.positionen.forEach(function (p3) { kurs(p3.sym); });
        var vor = offenWert(buch, preise);
        var plan = MH.planeUmschichtung(zl.ziel, buch, preise);
        buch.trades = [];
        var n = MH.fuehreAus(buch, plan, Q.ms[d], KOSTEN_BP);
        buch.trades = [];
        var kosten = vor - offenWert(buch, preise);
        plan.verkaufen.forEach(function (x) { delete meta[x.sym]; });
        var neu = 0;
        buch.positionen.forEach(function (p4) {
          if (meta[p4.sym]) return;
          meta[p4.sym] = { sym: T.symIdx[p4.sym], seitTag: d, schluss: NaN };
          neu++; zs.positionen++;
          if (mitA) { if (M(meta[p4.sym].sym).datei) zs.positionenMitDatei++; else zs.positionenOhneDatei++; }
        });
        if (neu + plan.verkaufen.length !== n) throw new Error('KLINKE: Zahl der Ausfuehrungen passt nicht zum Buch');
        zs.umschichtungen++; zs.kosten += kosten; zs.kaeufe += neu; zs.verkaeufe += plan.verkaufen.length;
        umschichtungen.push({ ausfuehrungstag: String(T.kal.tage[d]), stichtag: String(T.kal.tage[s]), zulaessig: zl.zulaessig, geprueft: zl.geprueft,
          zielzahl: zl.ziel.length, verkaeufe: plan.verkaufen.length, kaeufe: neu, gehalten: plan.halten.length, ohneKurs: plan.fehltKurs.length,
          kosten: kosten, positionenDanach: buch.positionen.length });
        if (offen) { offen.buchEnde = buchWert; offen.spyEnde = spyWert; perioden.push(offen); }
        offen = { ausfuehrungstag: String(T.kal.tage[d]), zulaessig: zl.zulaessig, zielzahl: zl.ziel.length, buchStart: buchWert, spyStart: spyWert };
        naechste = o + halten <= oEnd ? Q.ptage[o + halten] : -1;
      }
    }
    /* 4. Ausschuettungen gutschreiben - nach dem Handel des Tages (REGEL.md, Lesart L3) */
    buch.cash += bar; zs.ausschuettungSumme += bar;
    /* 5. Massstab: Ausschuettung am Ex-Tag zum Schlusskurs wieder anlegen */
    var zS = T.zeileVon(spy, d);
    if (zS >= 0) {
      if (mitA && d > startTag) ausschuettungenAm(T, Q, M, spy, d).forEach(function (a) {
        var betrag = spyStueck * a.basis * a.satz;
        spyStueck += betrag / g.bSchluss[zS];
        zs.spyAusschuettungen++; zs.spyAusschuettungSumme += betrag; zs.spyRateSumme += a.rate;
      });
      spySchluss = g.bSchluss[zS];
    }
    spyWert = spyStueck * spySchluss;
    /* 6. Bewertung zum Schluss; fehlt die Zeile, gilt der letzte Schlusskurs (nie der Einstand) */
    var schluss = {};
    buch.positionen.forEach(function (p5) {
      var m5 = meta[p5.sym], z5 = T.zeileVon(m5.sym, d);
      if (z5 >= 0) m5.schluss = g.bSchluss[z5];
      schluss[p5.sym] = m5.schluss;
    });
    var bw = MH.bewerte(buch, schluss);
    if (bw.ohneKurs.length) throw new Error('KLINKE: Position ohne Schlusskurs: ' + bw.ohneKurs.join(','));
    buchWert = bw.wert;
    tage.push({ tag: d, buch: buchWert, spy: spyWert, bar: buch.cash });
  }
  if (offen) { offen.buchEnde = buchWert; offen.spyEnde = spyWert; offen.angebrochen = true; perioden.push(offen); }
  perioden.forEach(function (P) {
    P.buch = (P.buchEnde / P.buchStart - 1) * 100; P.spy = (P.spyEnde / P.spyStart - 1) * 100; P.abstand = P.buch - P.spy;
  });
  return { startTag: startTag, endTag: endTag, endBuch: buchWert, endSpy: spyWert, tage: tage, perioden: perioden, umschichtungen: umschichtungen,
    reihenenden: reihenenden, zaehler: zs, positionenAmEnde: buch.positionen.length, buch: buch };
}

/* ---------- Kennzahlen ---------- */
function kennzahlen(Q, L) {
  var jahre = (Q.ms[L.endTag] - Q.ms[L.startTag]) / (365.25 * 86400000);
  var pa = function (ende) { return (Math.pow(ende / START, 1 / jahre) - 1) * 100; };
  return { jahre: jahre, buchEnde: L.endBuch, spyEnde: L.endSpy, buchGesamt: (L.endBuch / START - 1) * 100, spyGesamt: (L.endSpy / START - 1) * 100,
    buchPa: pa(L.endBuch), spyPa: pa(L.endSpy), abstandPa: pa(L.endBuch) - pa(L.endSpy), schlaegt: L.endBuch > L.endSpy };
}
function maxRueckschlag(werte) {
  var hoch = -Infinity, mdd = 0;
  werte.forEach(function (w) { if (w > hoch) hoch = w; var r = (w / hoch - 1) * 100; if (r < mdd) mdd = r; });
  return mdd;
}
function kalenderjahre(T, L) {
  var aus = [], vb = START, vs = START, jahr = null, lb = START, ls = START;
  L.tage.forEach(function (x, i) {
    var j = String(T.kal.tage[x.tag]).slice(0, 4);
    if (jahr !== null && j !== jahr) { aus.push({ jahr: jahr, buch: (lb / vb - 1) * 100, spy: (ls / vs - 1) * 100 }); vb = lb; vs = ls; }
    jahr = j; lb = x.buch; ls = x.spy;
    if (i === L.tage.length - 1) aus.push({ jahr: jahr, buch: (lb / vb - 1) * 100, spy: (ls / vs - 1) * 100 });
  });
  aus.forEach(function (a) { a.abstand = a.buch - a.spy; });
  return aus;
}
function periodenstreuung(perioden) {
  var x = perioden.map(function (P) { return P.abstand; }), n = x.length;
  if (n < 2 || n - 1 >= T975.length) throw new Error('Periodenstreuung: n = ' + n + ' ausserhalb der t-Tabelle');
  var mittel = x.reduce(function (a, b) { return a + b; }, 0) / n;
  var sd = Math.sqrt(x.reduce(function (a, b) { return a + (b - mittel) * (b - mittel); }, 0) / (n - 1));
  var se = sd / Math.sqrt(n), t = T975[n - 1];
  return { n: n, mittel: mittel, standardabweichung: sd, standardfehler: se, tWert: t, band95: [mittel - t * se, mittel + t * se], periodenVorn: x.filter(function (v) { return v > 0; }).length };
}
function median(a) {
  var s = a.slice().sort(function (x, y) { return x - y; }), n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}
/** Startphasen (§1.9a): erster Ausfuehrungstag k Panel-Handelstage nach dem ersten Fenstertag, k = 0 .. nPhasen-1. */
function startphasen(T, Q, M, erster, endTag, nPhasen, totalverlust) {
  var aus = [];
  for (var k = 0; k < nPhasen; k++) {
    var L = simuliere(T, Q, M, { startTag: Q.ptage[Q.ord[erster] + k], endTag: endTag, totalverlust: totalverlust });
    var kz = kennzahlen(Q, L);
    aus.push({ k: k, start: String(T.kal.tage[L.startTag]), buchGesamt: kz.buchGesamt, spyGesamt: kz.spyGesamt, buchPa: kz.buchPa, spyPa: kz.spyPa,
      abstandPa: kz.abstandPa, schlaegt: kz.schlaegt, umschichtungen: L.zaehler.umschichtungen, zuWenigTage: L.zaehler.zuWenigTage, reihenenden: L.reihenenden.length });
  }
  var ab = aus.map(function (a) { return a.abstandPa; });
  return { phasen: aus, abstaende: ab, minimum: Math.min.apply(null, ab), median: median(ab), maximum: Math.max.apply(null, ab),
    vorDemMarkt: aus.filter(function (a) { return a.schlaegt; }).length, anzahl: nPhasen };
}

/* ---------- Der eine Lauf ---------- */
function de(x, n) { return x.toFixed(n == null ? 2 : n).replace('.', ','); }
function vz(x, n) { return (x >= 0 ? '+' : '−') + de(Math.abs(x), n); }
function datumDe(d) { var p = String(d).split('-'); return p[2] + '.' + p[1] + '.' + p[0]; }
function sha(datei) { return crypto.createHash('sha256').update(fs.readFileSync(path.join(REPO, datei))).digest('hex').slice(0, 16); }

function lauf() {
  var t0 = Date.now();
  var PR = require(path.join(PRUEFSTAND, 'pruefstand.js'));
  var T = PR.Tafel(PANEL_ORDNER), Q = vorbereiten(T), M = Massnahmen(T, Q);
  var erster = tagAb(T, Q, FENSTER_VON), endTag = T.maxTag;
  if (String(T.kal.tage[erster]) !== FENSTER_VON) throw new Error('KLINKE: erster Fenstertag ist nicht der ' + FENSTER_VON);
  if (String(T.kal.tage[endTag]) !== FENSTER_BIS) throw new Error('KLINKE: letzter Panel-Tag ist nicht der ' + FENSTER_BIS);
  var haupt = K.EMPFINDLICHKEIT[0], streng = K.EMPFINDLICHKEIT[1], milde = K.EMPFINDLICHKEIT[2];
  if (haupt.key !== 'haupt' || streng.key !== 'streng' || milde.key !== 'milde') throw new Error('KLINKE: K.EMPFINDLICHKEIT hat eine andere Ordnung');

  var L = simuliere(T, Q, M, { startTag: erster, endTag: endTag, totalverlust: haupt.totalverlust });
  var kz = kennzahlen(Q, L);
  var Lk = simuliere(T, Q, M, { startTag: erster, endTag: endTag, totalverlust: haupt.totalverlust, ausschuettungen: false });
  var kzK = kennzahlen(Q, Lk);
  var kzS = kennzahlen(Q, simuliere(T, Q, M, { startTag: erster, endTag: endTag, totalverlust: streng.totalverlust }));
  var kzM = kennzahlen(Q, simuliere(T, Q, M, { startTag: erster, endTag: endTag, totalverlust: milde.totalverlust }));
  var SP = startphasen(T, Q, M, erster, endTag, PHASEN, haupt.totalverlust);
  if (Math.abs(SP.phasen[0].abstandPa - kz.abstandPa) > 1e-9) throw new Error('KLINKE: Startphase k = 0 ist nicht die Hauptzahl');
  var PS = periodenstreuung(L.perioden), KJ = kalenderjahre(T, L);
  var barAnteil = L.tage.reduce(function (a, x) { return a + x.bar / x.buch; }, 0) / L.tage.length * 100;
  var arten = {}, nAktien = 0;
  T.stand.symbole.forEach(function (s) { if (!s.referenz) { nAktien++; arten[s.art] = (arten[s.art] || 0) + 1; } });
  var endeArten = {};
  L.reihenenden.forEach(function (r) { var k2 = String(r.grund); endeArten[k2] = (endeArten[k2] || 0) + 1; });
  var git = '';
  try { git = require('child_process').execSync('git rev-parse --short HEAD', { cwd: REPO }).toString().trim(); } catch (e) { git = 'unbekannt'; }

  var E = {
    kennung: KENNUNG, erzeugt: new Date().toISOString(), panelKennung: T.stand.kennung, panelStand: T.stand.stand, gitHead: git,
    quellen: { 'mfhandel.js': sha('mfhandel.js'), 'momentum.js': sha('momentum.js'), 'liquide.js': sha('liquide.js') },
    fenster: { von: FENSTER_VON, bis: FENSTER_BIS, handelstage: L.tage.length, jahre: kz.jahre },
    kosten: { bpJeSeite: KOSTEN_BP, fundstelle: KOSTEN_FUNDSTELLE, gezahlt: L.zaehler.kosten },
    konfigBuch: MH.buchKonfig(), startkapital: START, massstab: MASSSTAB,
    haupt: { schlaegt: kz.schlaegt, buchGesamt: kz.buchGesamt, spyGesamt: kz.spyGesamt, buchPa: kz.buchPa, spyPa: kz.spyPa, abstandPa: kz.abstandPa,
      buchEnde: kz.buchEnde, spyEnde: kz.spyEnde, rueckschlagBuch: maxRueckschlag(L.tage.map(function (x) { return x.buch; })),
      rueckschlagSpy: maxRueckschlag(L.tage.map(function (x) { return x.spy; })), umschichtungen: L.zaehler.umschichtungen, zuWenigTage: L.zaehler.zuWenigTage,
      kaeufe: L.zaehler.kaeufe, verkaeufe: L.zaehler.verkaeufe, kostenGezahlt: L.zaehler.kosten, bargeldanteilMittel: barAnteil,
      positionenAmEnde: L.positionenAmEnde, lueckentage: L.zaehler.lueckentage },
    reihenenden: { anzahl: L.reihenenden.length, nachGrund: endeArten, totalverluste: L.reihenenden.filter(function (r) { return r.totalverlust; }).length,
      lebendGefuehrtOhneGrund: L.reihenenden.filter(function (r) { return r.lebendGefuehrt && !r.grund; }).length, liste: L.reihenenden },
    kalenderjahre: KJ, perioden: L.perioden, umschichtungen: L.umschichtungen,
    zufallsbereich: { startphasen: SP, periodenstreuung: PS },
    ausschuettungen: { positionen: L.zaehler.positionen, positionenMitDatei: L.zaehler.positionenMitDatei, positionenOhneDatei: L.zaehler.positionenOhneDatei,
      gebucht: L.zaehler.ausschuettungen, summeBuch: L.zaehler.ausschuettungSumme, mehrfachAmExTag: L.zaehler.mehrfachAmExTag, groessterSatzProzent: L.zaehler.maxSatz * 100,
      ertragPaBuch: kz.buchPa - kzK.buchPa, spyGebucht: L.zaehler.spyAusschuettungen, spyRateSumme: L.zaehler.spyRateSumme, summeSpy: L.zaehler.spyAusschuettungSumme,
      ertragPaSpy: kz.spyPa - kzK.spyPa, definition: 'Ertrag p. a. mit Ausschuettungen minus Ertrag p. a. als reiner Kursertrag (zwei Nachlaeufe)' },
    nachrichtlich: {
      kursertrag: { schlaegt: kzK.schlaegt, buchGesamt: kzK.buchGesamt, spyGesamt: kzK.spyGesamt, buchPa: kzK.buchPa, spyPa: kzK.spyPa, abstandPa: kzK.abstandPa },
      streng: { schlaegt: kzS.schlaegt, buchGesamt: kzS.buchGesamt, buchPa: kzS.buchPa, abstandPa: kzS.abstandPa },
      milde: { schlaegt: kzM.schlaegt, buchGesamt: kzM.buchGesamt, buchPa: kzM.buchPa, abstandPa: kzM.abstandPa } },
    universum: { aktienreihen: nAktien, nachArt: arten, referenzreihen: T.nSym - nAktien },
    korrekturen: KORREKTUREN, laufzeitSekunden: 0,
  };
  E.laufzeitSekunden = Math.round((Date.now() - t0) / 100) / 10;
  fs.writeFileSync(path.join(__dirname, 'ergebnis.json'), JSON.stringify(E, null, 1));

  var zul = L.umschichtungen.map(function (u) { return u.zulaessig; }), zz = L.umschichtungen.map(function (u) { return u.zielzahl; });
  var Z = [];
  Z.push('Im Rückblick über fünf Jahre (' + datumDe(FENSTER_VON) + ' bis ' + datumDe(FENSTER_BIS) + ') schlägt das Momentum-Buch den S&P 500 nach Kosten: **' +
    (kz.schlaegt ? 'ja' : 'nein') + '** — Buch ' + vz(kz.buchGesamt, 1) + ' % (' + vz(kz.buchPa, 2) + ' % p. a.), S&P 500 ' + vz(kz.spyGesamt, 1) + ' % (' + vz(kz.spyPa, 2) +
    ' % p. a.), Abstand ' + vz(kz.abstandPa, 2) + ' Pp p. a.; Startphasen: ' + SP.vorDemMarkt + ' von ' + SP.anzahl + ' vor dem Markt (' + vz(SP.minimum, 2) + ' bis ' + vz(SP.maximum, 2) + ' Pp p. a.)');
  Z.push('');
  Z.push('*Auftrag Nr. 74, Kennung `' + KENNUNG + '`, Panel `' + T.stand.kennung + '`. Beschreibende Zahl nach der Regel in `REGEL.md` (vor dem Lauf festgelegt), kein Urteil über eine Kante. Alles Simulation, keine Anlageberatung.*');
  Z.push('');
  Z.push('**Zufallsbereich.** Startphasen (63 Starttage, Ende für alle ' + datumDe(FENSTER_BIS) + '): Abstand Minimum ' + vz(SP.minimum, 2) + ' / Median ' + vz(SP.median, 2) + ' / Maximum ' + vz(SP.maximum, 2) +
    ' Pp p. a.; ' + SP.vorDemMarkt + ' von ' + SP.anzahl + ' Phasen mit Buch > SPY. Periodenstreuung für k = 0: ' + PS.n + ' Perioden, mittlerer Abstand ' + vz(PS.mittel, 2) + ' Pp je Periode, Standardfehler ' +
    de(PS.standardfehler, 2) + ' Pp, 95-%-Band ' + vz(PS.band95[0], 2) + ' bis ' + vz(PS.band95[1], 2) + ' Pp (t = ' + de(PS.tWert, 3) + '); ' + PS.periodenVorn + ' von ' + PS.n + ' Perioden vor SPY.');
  Z.push('');
  Z.push('| | Buch | S&P 500 (SPY) | Abstand |');
  Z.push('|---|---|---|---|');
  Z.push('| Gesamtertrag | ' + vz(kz.buchGesamt, 2) + ' % | ' + vz(kz.spyGesamt, 2) + ' % | ' + vz(kz.buchGesamt - kz.spyGesamt, 2) + ' Pp |');
  Z.push('| p. a. (' + de(kz.jahre, 3) + ' Jahre) | ' + vz(kz.buchPa, 2) + ' % | ' + vz(kz.spyPa, 2) + ' % | ' + vz(kz.abstandPa, 2) + ' Pp |');
  KJ.forEach(function (j) { Z.push('| ' + j.jahr + ' | ' + vz(j.buch, 2) + ' % | ' + vz(j.spy, 2) + ' % | ' + vz(j.abstand, 2) + ' Pp |'); });
  Z.push('| größter Rückschlag (Tagesschlüsse) | ' + vz(E.haupt.rueckschlagBuch, 2) + ' % | ' + vz(E.haupt.rueckschlagSpy, 2) + ' % | |');
  Z.push('| nachrichtlich: reiner Kursertrag p. a. | ' + vz(kzK.buchPa, 2) + ' % | ' + vz(kzK.spyPa, 2) + ' % | ' + vz(kzK.abstandPa, 2) + ' Pp |');
  Z.push('| Ertrag aus Ausschüttungen p. a. | ' + vz(E.ausschuettungen.ertragPaBuch, 2) + ' Pp | ' + vz(E.ausschuettungen.ertragPaSpy, 2) + ' Pp | |');
  Z.push('');
  Z.push('**Das Buch.** ' + L.zaehler.umschichtungen + ' Umschichtungen (' + L.zaehler.kaeufe + ' Käufe, ' + L.zaehler.verkaeufe + ' Verkäufe), gezahlte Kosten ' + de(L.zaehler.kosten, 0) + ' $ bei ' + KOSTEN_BP +
    ' Basispunkten je Seite (' + KOSTEN_FUNDSTELLE + '); Tage mit `zuWenig`: ' + L.zaehler.zuWenigTage + '; zulässige Werte je Umschichtung ' + Math.min.apply(null, zul) + ' bis ' + Math.max.apply(null, zul) +
    ', Zielzahl ' + Math.min.apply(null, zz) + ' bis ' + Math.max.apply(null, zz) + '; mittlerer Bargeldanteil ' + de(barAnteil, 2) + ' %. Reihenenden im Buch: ' + L.reihenenden.length + ' (' +
    (Object.keys(endeArten).map(function (k3) { return k3 + ' ' + endeArten[k3]; }).join(', ') || 'keine') + '), davon als Totalverlust gebucht ' + E.reihenenden.totalverluste +
    ', als lebend geführt ohne Ende-Grund ' + E.reihenenden.lebendGefuehrtOhneGrund + '. Nachrichtlich: Regel „streng“ ' + vz(kzS.abstandPa, 2) + ' Pp p. a., „milde“ ' + vz(kzM.abstandPa, 2) + ' Pp p. a.');
  Z.push('');
  Z.push('**Ausschüttungen.** Buch: ' + L.zaehler.positionen + ' gehaltene Positionen, davon ' + L.zaehler.positionenMitDatei + ' mit und ' + L.zaehler.positionenOhneDatei + ' ohne Maßnahmen-Datei; ' +
    L.zaehler.ausschuettungen + ' Ausschüttungen gebucht (' + de(L.zaehler.ausschuettungSumme, 0) + ' $, größter Einzelsatz ' + de(L.zaehler.maxSatz * 100, 2) + ' %). SPY: ' + L.zaehler.spyAusschuettungen +
    ' Ausschüttungen, Summe der Sätze je Anteil ' + de(L.zaehler.spyRateSumme, 2) + ' $.');
  Z.push('');
  Z.push('**Grenzen.** Ein Fenster, ein Parametersatz, ' + PS.n + ' Perioden; die Zahl beschreibt die Vergangenheit dieses einen Buchs und trägt den Zufallsbereich oben. Der Korb ist das Panel (alle Aktienreihen mit den verschwundenen), nicht die Liste der App. Perioden, Umschichtungen, alle 63 Abstände und die Reihenenden stehen in `ergebnis.json`. Korrekturen nach dem Siegel: ' +
    (KORREKTUREN.length ? KORREKTUREN.length : 'keine') + '.');
  fs.writeFileSync(path.join(__dirname, 'ERGEBNIS.md'), Z.join('\n') + '\n');
  console.log(Z[0]);
  console.log('Laufzeit s', E.laufzeitSekunden);
}

module.exports = { KENNUNG: KENNUNG, KOSTEN_BP: KOSTEN_BP, START: START, PHASEN: PHASEN, MASSSTAB: MASSSTAB, PANEL_ORDNER: PANEL_ORDNER, PANEL_OPTIONEN: PANEL_OPTIONEN, PANEL_WAHL: PANEL_WAHL, PRUEFSTAND: PRUEFSTAND,
  FENSTER_VON: FENSTER_VON, FENSTER_BIS: FENSTER_BIS, vorbereiten: vorbereiten, endeBis: endeBis, tagAb: tagAb, rohMapAm: rohMapAm, klinkeReferenz: klinkeReferenz,
  zielAm: zielAm, Massnahmen: Massnahmen, ausschuettungenAm: ausschuettungenAm, simuliere: simuliere, kennzahlen: kennzahlen, maxRueckschlag: maxRueckschlag,
  kalenderjahre: kalenderjahre, periodenstreuung: periodenstreuung, median: median, startphasen: startphasen };

if (require.main === module) lauf();

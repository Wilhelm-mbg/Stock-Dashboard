'use strict';
/* PRUEFRAHMEN - nimmt eine Rangfunktion und liefert immer dieselbe Bewertung (VORREGISTRIERUNG §2).
 *
 * Der Rahmen kennt keine Strategie. Er kennt das Universum, die Dezile, die Kosten, die se-Regel und die
 * Leck-Sperrklinke. Was oben und unten steht, entscheidet allein die uebergebene Rangfunktion.
 *
 * NUR LESEN. Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var P = require('./paneldaten.js');
var ST = require('./statistik.js');

/* =========================================================================================
 * 1. Die Tafel: Panel laden und zwei Indizes bauen (je Tag eine Zeilenspanne, je Reihe eine Zeilenliste)
 * ========================================================================================= */
/** opt.panelKennung (v2.3, Auftrag Nr. 92): ausdrueckliche Kennung des Panels (K.PANEL_KENNUNG_V23) - ohne sie liest die Tafel
 *  wie bisher (der Ordner waehlt v2.1/v2.2; ein v2.3-Ordner bricht an der Kennung ab). */
function Tafel(aus, opt) {
  var roh = (opt && opt.panelKennung) ? P.ladePanel(aus, { kennung: opt.panelKennung }) : P.ladePanel(aus);
  var stand = roh.stand, kal = K.kalender();
  var jahre = Object.keys(roh.jahre).map(Number).sort(function (a, b) { return a - b; });
  var n = 0; jahre.forEach(function (j) { n += roh.jahre[j].n; });

  /* Flache Spalten ueber alle Jahre, in der Reihenfolge (tag, sym) - so liegen sie schon in den Dateien. */
  var g = { n: 0 };
  g.tag = new Int32Array(n); g.sym = new Uint16Array(n); g.marken = new Uint8Array(n); g.klasse = new Int8Array(n);
  g.rohSchluss = new Float64Array(n); g.bSchluss = new Float64Array(n); g.bEroeffnung = new Float64Array(n);
  g.rendite = new Float32Array(n); g.renditeOC = new Float32Array(n); g.umsatz = new Float64Array(n);
  var o = 0;
  jahre.forEach(function (j) {
    var b = roh.jahre[j];
    for (var i = 0; i < b.n; i++) {
      g.tag[o] = b.tag[i]; g.sym[o] = b.sym[i]; g.marken[o] = b.marken[i]; g.klasse[o] = b.klasse[i];
      g.rohSchluss[o] = b.rohSchluss[i];
      g.bSchluss[o] = b.rohSchluss[i] / b.faktor[i];
      g.bEroeffnung[o] = b.rohEroeffnung[i] / b.faktor[i];
      g.rendite[o] = b.rendite[i]; g.renditeOC[o] = b.renditeOC[i];
      g.umsatz[o] = b.umsatzReg[i] + b.umsatzAuktion[i];
      o++;
    }
  });
  g.n = o;
  roh.jahre = null;

  /* Der letzte vollstaendige Handelstag schneidet die Tafel (Nachtrag 1). */
  var maxTag = stand.letzterVollTagIdx;
  if (maxTag == null) throw new Error('panel/_stand.json ohne letzterVollTagIdx - Panel unvollstaendig');

  /* Index je Tag: [von, bis) in der flachen Reihenfolge. */
  var nTage = kal.tage.length;
  var tagVon = new Int32Array(nTage).fill(-1), tagBis = new Int32Array(nTage).fill(-1);
  for (var i2 = 0; i2 < g.n; i2++) { var t = g.tag[i2]; if (tagVon[t] < 0) tagVon[t] = i2; tagBis[t] = i2 + 1; }

  /* Index je Reihe: Zeilenindizes in aufsteigender Tagesordnung (Zaehlsortierung). */
  var nSym = stand.symbole.length;
  var zaehl = new Int32Array(nSym + 1);
  for (var i3 = 0; i3 < g.n; i3++) zaehl[g.sym[i3] + 1]++;
  for (var s = 0; s < nSym; s++) zaehl[s + 1] += zaehl[s];
  var symStart = Int32Array.from(zaehl);
  var symZeilen = new Int32Array(g.n), fuell = Int32Array.from(zaehl);
  for (var i4 = 0; i4 < g.n; i4++) symZeilen[fuell[g.sym[i4]]++] = i4;
  /* Position einer Zeile innerhalb ihrer Reihe (fuer "k Zeilen zurueck"). */
  var posInReihe = new Int32Array(g.n);
  for (var s2 = 0; s2 < nSym; s2++) for (var q = symStart[s2]; q < symStart[s2 + 1]; q++) posInReihe[symZeilen[q]] = q - symStart[s2];

  /* Zeile (sym, tag) finden: binaere Suche innerhalb der Tagesspanne (dort nach sym sortiert). */
  function zeileVon(sym, tag) {
    if (tag < 0 || tag >= nTage) return -1;
    var a = tagVon[tag], b = tagBis[tag];
    if (a < 0) return -1;
    while (a < b) { var m = (a + b) >> 1; if (g.sym[m] < sym) a = m + 1; else b = m; }
    return (a < tagBis[tag] && g.sym[a] === sym) ? a : -1;
  }

  /* Ende-Grund je Reihe (§3.6) */
  var endeGrund = stand.symbole.map(function (r) { return r.ende_grund; });
  var symName = stand.symbole.map(function (r) { return r.reihe; });
  var symIdx = {}; symName.forEach(function (nme, i) { symIdx[nme] = i; });

  return { g: g, stand: stand, kal: kal, maxTag: maxTag, nTage: nTage, nSym: nSym,
    tagVon: tagVon, tagBis: tagBis, symStart: symStart, symZeilen: symZeilen, posInReihe: posInReihe,
    zeileVon: zeileVon, endeGrund: endeGrund, symName: symName, symIdx: symIdx,
    /** k-te Zeile der Reihe VOR der Zeile z (k >= 1); -1, wenn es sie nicht gibt. */
    zurueck: function (z, k) { var s = g.sym[z], p = posInReihe[z] - k; return p < 0 ? -1 : symZeilen[symStart[s] + p]; },
    /** letzte Zeile der Reihe (Archivende). */
    letzteZeile: function (sym) { return symStart[sym + 1] > symStart[sym] ? symZeilen[symStart[sym + 1] - 1] : -1; },
  };
}

/* =========================================================================================
 * 2. Universum je Umschichtungstag (§2.1) - Punkt-in-Zeit
 * ========================================================================================= */
/** ohneCentBoden: registrierte Empfindlichkeit (§2.1), Punkt 3 faellt weg.
 *  klassen (TEIL 3, §T3.1): erlaubte Umsatzklassen; Vorgabe unveraendert K.UNIVERSUM_KLASSEN. */
function universum(T, tag, opt) {
  opt = opt || {};
  var klassen = opt.klassen || K.UNIVERSUM_KLASSEN;
  var g = T.g, aus = [], a = T.tagVon[tag], b = T.tagBis[tag], z = { klasse: 0, quelle: 0, cent: 0, vortage: 0, qualitaet: 0, ausfuehrung: 0 };
  if (a < 0) return { liste: [], verworfen: z, aTag: null };
  var aTag = null; for (var tt = tag + 1; tt <= T.maxTag; tt++) if (T.tagVon[tt] >= 0) { aTag = tt; break; }
  if (aTag === null) return { liste: [], verworfen: z, aTag: null };
  for (var i = a; i < b; i++) {
    if (T.stand.symbole[g.sym[i]].referenz) continue;
    var kl = g.klasse[i];
    if (klassen.indexOf(kl) === -1) { z.klasse++; continue; }
    if (!(g.marken[i] & K.M_QUELLE_REIN)) { z.quelle++; continue; }
    if (!opt.ohneCentBoden && !K.centBodenOk(g.rohSchluss[i], kl)) { z.cent++; continue; }
    if (T.posInReihe[i] < K.MIN_VORTAGE) { z.vortage++; continue; }
    if ((g.marken[i] & K.M_STEMPEL_TAG) || (g.marken[i] & K.M_MASSNAHME_NAH) || !(g.marken[i] & K.M_DICHTE_OK)) { z.qualitaet++; continue; }
    /* Punkt 6: die Reihe muss AM AUSFUEHRUNGSTAG (dem naechsten Handelstag mit Panelzeilen) einen
     * Eroeffnungskurs haben - sonst gibt es keinen Kurs, zu dem gekauft wuerde. */
    var p = T.posInReihe[i], nx = (T.symStart[g.sym[i]] + p + 1 < T.symStart[g.sym[i] + 1]) ? T.symZeilen[T.symStart[g.sym[i]] + p + 1] : -1;
    if (nx < 0 || !(g.bEroeffnung[nx] > 0) || g.tag[nx] !== aTag) { z.ausfuehrung++; continue; }
    aus.push({ sym: g.sym[i], zeile: i, klasse: kl, naechste: nx, naechsterTag: g.tag[nx] });
  }
  return { liste: aus, verworfen: z, aTag: aTag };
}

/* =========================================================================================
 * 3. Die Leck-Sperrklinke (§2.8)
 * ========================================================================================= */
function Sicht(T, tag, opt) {
  opt = opt || {};
  var verstoesse = 0, beispiele = [];
  var s = {
    tag: tag,
    orakel: !!opt.orakel,
    /** Eine Panelzeile. Zugriff auf einen Tag NACH `tag` wird gezaehlt und liefert -1 (ausser mit Schluessel). */
    zeile: function (sym, tg) {
      if (tg > tag && !opt.orakel) { verstoesse++; if (beispiele.length < 5) beispiele.push(T.symName[sym] + '@' + T.kal.tage[tg] + ' (erlaubt bis ' + T.kal.tage[tag] + ')'); return -1; }
      return T.zeileVon(sym, tg);
    },
    /** k-te Panelzeile der Reihe VOR der Zeile z. Immer erlaubt (liegt per Bau in der Vergangenheit). */
    zurueck: function (z, k) { return T.zurueck(z, k); },
    felder: T.g,
    tafel: T,
    verstoesse: function () { return verstoesse; },
    beispiele: function () { return beispiele; },
  };
  return s;
}

/* =========================================================================================
 * 4. Umschichtungstage (§2.3)
 * ========================================================================================= */
/** Signaltage: letzter Handelstag jeder Kalenderwoche bzw. jedes Monats, im Panelfenster. */
function signaltage(T, freqKey) {
  var kal = T.kal, aus = [], letzterSchl = null;
  var vorhanden = [];
  for (var t = 0; t <= T.maxTag; t++) if (T.tagVon[t] >= 0) vorhanden.push(t);
  function schluessel(t) {
    var d = kal.tage[t];
    if (freqKey === 'monat') return d.slice(0, 7);
    /* ISO-Woche: Donnerstag derselben Woche als Schluessel */
    var p = d.split('-').map(Number), ms = Date.UTC(p[0], p[1] - 1, p[2]);
    var wt = (new Date(ms).getUTCDay() + 6) % 7;                 // Mo = 0
    return new Date(ms + (3 - wt) * 86400000).toISOString().slice(0, 10);
  }
  for (var i = 0; i < vorhanden.length; i++) {
    var t2 = vorhanden[i], s = schluessel(t2);
    if (letzterSchl !== null && s !== letzterSchl) aus.push(vorhanden[i - 1]);
    letzterSchl = s;
  }
  /* Der letzte angefangene Zeitraum liefert keinen Signaltag - seine Periode waere unvollstaendig. */
  return aus;
}

/* =========================================================================================
 * 5. Ein Lauf: Rangfunktion -> Dezil-Portfolios -> Tagesreihen -> Statistik
 * ========================================================================================= */
/**
 * rangFn(sicht, universumListe) -> Float64Array der Rangwerte (gleiche Reihenfolge wie die Liste),
 * NaN = Papier faellt an diesem Tag aus dem Universum.
 */
function lauf(T, rangFn, opt) {
  opt = opt || {};
  var freq = opt.freq || 'woche';
  var F = K.FREQUENZEN.filter(function (f) { return f.key === freq; })[0];
  if (!F) throw new Error('unbekannte Frequenz ' + freq);
  var empf = K.EMPFINDLICHKEIT.filter(function (e) { return e.key === (opt.empfindlichkeit || 'haupt'); })[0];
  if (!empf) throw new Error('unbekannte Empfindlichkeit ' + opt.empfindlichkeit);
  var totalverlust = {}; empf.totalverlust.forEach(function (gr) { totalverlust[gr] = true; });
  var g = T.g;

  var tage = signaltage(T, freq);
  var perioden = [], verstoesse = 0, beispiele = [];
  var z = { perioden: 0, zuKlein: 0, tote: 0, toteTotalverlust: 0, luecken: 0, nRang: 0, universumSumme: 0,
    verworfen: { klasse: 0, quelle: 0, cent: 0, vortage: 0, qualitaet: 0, ausfuehrung: 0, rangNaN: 0 } };

  /* Gewichte der Vorperiode je Portfolio, fuer den Umschlag. */
  var vorher = { long: {}, kurz: {}, uni: {} };

  for (var pi = 0; pi < tage.length; pi++) {
    var t = tage[pi];
    var naechsterSignal = (pi + 1 < tage.length) ? tage[pi + 1] : null;
    if (naechsterSignal === null) break;
    var U = universum(T, t, opt);
    Object.keys(z.verworfen).forEach(function (k2) { if (U.verworfen[k2] != null) z.verworfen[k2] += U.verworfen[k2]; });
    if (!U.liste.length) continue;

    /* Ausfuehrungstag a und Periodenende aEnde stehen VOR der Rangfunktion fest - die Orakel-Kreuzprobe
     * braucht aEnde, und ohne den Schluessel kommt sie ueber die Sicht ohnehin nicht daran. */
    var a = U.aTag;
    var aEnde = null; for (var tt2 = naechsterSignal + 1; tt2 <= T.maxTag; tt2++) if (T.tagVon[tt2] >= 0) { aEnde = tt2; break; }
    if (a === null || aEnde === null) break;

    var sicht = Sicht(T, t, { orakel: !!opt.orakel });
    var werte = rangFn(sicht, U.liste, T, { t: t, a: a, aEnde: aEnde });
    verstoesse += sicht.verstoesse();
    sicht.beispiele().forEach(function (b) { if (beispiele.length < 10) beispiele.push(b); });

    var kand = [];
    for (var q = 0; q < U.liste.length; q++) {
      var w = werte[q];
      if (!(w === w)) { z.verworfen.rangNaN++; continue; }
      kand.push({ e: U.liste[q], w: w });
    }
    z.universumSumme += kand.length;
    if (kand.length < K.MIN_UNIVERSUM) { z.zuKlein++; continue; }
    kand.sort(function (a, b) { return b.w - a.w || a.e.sym - b.e.sym; });
    var kSize = K.dezilGroesse(kand.length);
    var lang = kand.slice(0, kSize).map(function (x) { return x.e; });
    var kurz = kand.slice(kand.length - kSize).map(function (x) { return x.e; });
    var uni = kand.map(function (x) { return x.e; });

    var pf = {};
    ['long', 'kurz', 'uni'].forEach(function (key) {
      var mitglieder = key === 'long' ? lang : key === 'kurz' ? kurz : uni;
      /* Eigener Zaehler je Portfolio: "Tote im gehaltenen Dezil" ist eine andere Zahl als "Tote im
       * Universum", und §3.6 berichtet die erste. Ein gemeinsamer Zaehler haette beide vermischt. */
      var zz = { tote: 0, toteTotalverlust: 0, luecken: 0 };
      pf[key] = halte(T, mitglieder, a, aEnde, totalverlust, zz);
      pf[key].zaehler = zz;
      if (key === 'long') { z.tote += zz.tote; z.toteTotalverlust += zz.toteTotalverlust; z.luecken += zz.luecken; }
      else { z['tote_' + key] = (z['tote_' + key] || 0) + zz.tote; }
    });
    /* Umschlag und Kosten je Portfolio (§2.5) */
    var kosten = {};
    ['long', 'kurz', 'uni'].forEach(function (key) {
      var neu = {}; (key === 'long' ? lang : key === 'kurz' ? kurz : uni).forEach(function (e) { neu[e.sym] = 1 / (key === 'long' ? lang.length : key === 'kurz' ? kurz.length : uni.length); });
      kosten[key] = umschlagKosten(T, vorher[key], neu, t, opt.huerdeFenster);
      vorher[key] = pf[key].endGewichte;
    });

    perioden.push({ t: t, a: a, aEnde: aEnde, jahr: +T.kal.tage[t].slice(0, 4), nUni: uni.length, k: kSize,
      long: pf.long, kurz: pf.kurz, uni: pf.uni, kosten: kosten });
    z.perioden++;
  }

  return { perioden: perioden, verstoesse: verstoesse, beispiele: beispiele, zaehler: z, freq: freq,
    empfindlichkeit: empf.key, lag: F.lag, ungueltig: verstoesse > 0 && !opt.orakel };
}

/** Halten eines gleichgewichteten Korbes von Eroeffnung(a) bis Eroeffnung(aEnde). */
function halte(T, mitglieder, a, aEnde, totalverlust, z) {
  var g = T.g, N = mitglieder.length;
  var zustand = mitglieder.map(function (e) { return { sym: e.sym, zeile: e.naechste, lebt: true, gebucht: false }; });
  /* e.naechste ist die Zeile am Ausfuehrungstag a (oder spaeter, wenn die Reihe a auslaesst). */
  var tageReihe = [], endGewichte = {};
  for (var d = a; d <= aEnde; d++) {
    if (T.tagVon[d] < 0) continue;
    var summe = 0;
    for (var i = 0; i < N; i++) {
      var m = zustand[i];
      if (!m.lebt) continue;
      var zl = T.zeileVon(m.sym, d);
      if (zl < 0) {
        /* Kein Panel-Tag: entweder Luecke (spaeter wieder da) oder Ende der Reihe. */
        var letzte = T.letzteZeile(m.sym);
        if (letzte >= 0 && g.tag[letzte] < d) {
          if (!m.gebucht) {
            var grund = T.endeGrund[m.sym];
            var buchung = (grund && totalverlust[grund]) ? -100 : 0;
            summe += buchung; m.gebucht = true; m.lebt = false;
            z.tote++; if (buchung < 0) z.toteTotalverlust++;
          }
        } else { z.luecken++; }
        continue;
      }
      var r;
      if (d === a) r = g.renditeOC[zl];                                  /* Eroeffnung -> Schluss */
      else if (d === aEnde) {
        /* Schluss(Vortag) -> Eroeffnung(aEnde): aus beiden Renditespalten exakt (Nachtrag 2). */
        var cc = g.rendite[zl], oc = g.renditeOC[zl];
        r = (cc === cc && oc === oc) ? 100 * ((1 + cc / 100) / (1 + oc / 100) - 1) : NaN;
      } else r = g.rendite[zl];
      if (r === r) summe += r;
    }
    var mittel = summe / N;
    tageReihe.push({ tag: d, r: mittel });
  }
  zustand.forEach(function (m) { if (m.lebt) endGewichte[m.sym] = 1 / N; });
  return { tage: tageReihe, N: N, mitglieder: mitglieder.map(function (e) { return e.sym; }), endGewichte: endGewichte,
    periode: tageReihe.reduce(function (acc, x) { return acc * (1 + x.r / 100); }, 1) * 100 - 100 };
}

/** Umschlag und Kosten einer Umschichtung (§2.5). */
function umschlagKosten(T, alt, neu, tag, huerdeFenster) {
  var syms = {}, g = T.g;
  Object.keys(alt || {}).forEach(function (s) { syms[s] = true; });
  Object.keys(neu).forEach(function (s) { syms[s] = true; });
  var umschlag = 0, kosten = 0;
  Object.keys(syms).forEach(function (s) {
    var d = Math.abs((neu[s] || 0) - ((alt && alt[s]) || 0));
    if (!(d > 0)) return;
    umschlag += 0.5 * d;
    var zl = T.zeileVon(+s, tag);
    var kl = zl >= 0 ? g.klasse[zl] : 3;
    if (kl < 0) kl = 3;
    kosten += 0.5 * d * K.huerdeVon(kl, huerdeFenster);
  });
  return { umschlag: umschlag, kosten: kosten };
}

/* =========================================================================================
 * 6. Bewertung: Hauptgroesse, Tabellen, se (§2.4-§2.7)
 * ========================================================================================= */
/** SPY-Regime am Signaltag: bereinigter Schluss ueber/unter EMA200. */
function spyRegime(T) {
  var s = T.symIdx['SPY'];
  if (s === undefined) throw new Error('SPY fehlt in der Symboltabelle - Regimeschnitt waere blind');
  var zeilen = [];
  for (var q = T.symStart[s]; q < T.symStart[s + 1]; q++) zeilen.push(T.symZeilen[q]);
  var ema = null, alpha = 2 / (K.EMA_N + 1), aus = {};
  zeilen.forEach(function (z, i) {
    var c = T.g.bSchluss[z];
    ema = (ema === null) ? c : (alpha * c + (1 - alpha) * ema);
    if (i >= K.EMA_N) aus[T.g.tag[z]] = c > ema ? 1 : 0;
  });
  return aus;
}

/** Aus den Perioden eines Laufs die Kennzahlen.
 *  ACHTUNG Grenztag: der Ausfuehrungstag a der Periode j+1 ist zugleich der Schlusstag aEnde der Periode j.
 *  Die beiden Teile (Schluss->Eroeffnung und Eroeffnung->Schluss) sind VERSCHIEDENE Stuecke desselben
 *  Kalendertags und werden fuer die TAGESREIHE multiplikativ zusammengelegt - zwei Eintraege mit demselben
 *  Kalenderindex wuerden die Autokovarianz-Rechnung in momente() nach Abstand verderben. */
function bewerte(T, L, opt) {
  opt = opt || {};
  var regime = opt.regime || spyRegime(T);
  var P0 = L.perioden;
  var NAMEN = { long: 'Long-Dezil', kurz: 'Short-Dezil', uni: 'Universum' };

  /* (a) Tagesreihen je Portfolio, Grenztage zusammengelegt, Kosten am Ausfuehrungstag abgezogen. */
  function tagesreihe(key) {
    var brutto = {}, kosten = {};
    P0.forEach(function (p) {
      p[key].tage.forEach(function (x) {
        brutto[x.tag] = (brutto[x.tag] === undefined) ? x.r : 100 * ((1 + brutto[x.tag] / 100) * (1 + x.r / 100) - 1);
      });
      kosten[p.a] = (kosten[p.a] || 0) + p.kosten[key].kosten;
    });
    return Object.keys(brutto).map(Number).sort(function (a, b) { return a - b; })
      .map(function (t) { return { tag: t, brutto: brutto[t], kosten: kosten[t] || 0, netto: brutto[t] - (kosten[t] || 0) }; });
  }
  var tr = { long: tagesreihe('long'), kurz: tagesreihe('kurz'), uni: tagesreihe('uni') };
  var trIdx = {}; ['long', 'kurz', 'uni'].forEach(function (k2) { trIdx[k2] = {}; tr[k2].forEach(function (x) { trIdx[k2][x.tag] = x; }); });

  /* (b) Periodenreihen: Hauptgroesse Long - Universum, Diagnosen daneben. */
  function periodenReihe(key) {
    var perioden = [], jahre = {}, umschlag = 0, kostenSumme = 0;
    P0.forEach(function (p) {
      var eigenBrutto = p[key].periode, eigenNetto = eigenBrutto - p.kosten[key].kosten;
      var uniBrutto = p.uni.periode, uniNetto = uniBrutto - p.kosten.uni.kosten;
      var e = { t: p.t, jahr: p.jahr, a: p.a,
        brutto: eigenBrutto - uniBrutto, netto: eigenNetto - uniNetto,
        eigenBrutto: eigenBrutto, eigenNetto: eigenNetto, uniBrutto: uniBrutto, uniNetto: uniNetto,
        umschlag: p.kosten[key].umschlag, kosten: p.kosten[key].kosten,
        nUni: p.nUni, k: p.k, regime: regime[p.t] };
      perioden.push(e); umschlag += e.umschlag; kostenSumme += e.kosten;
      (jahre[p.jahr] = jahre[p.jahr] || []).push(e);
    });
    /* Tagesreihe der Differenz (fuer HH/NW), Grenztage schon zusammengelegt. */
    var tage = tr[key].map(function (x) {
      var b = trIdx.uni[x.tag];
      return { tag: x.tag, brutto: x.brutto - (b ? b.brutto : 0), netto: x.netto - (b ? b.netto : 0) };
    });
    return { name: NAMEN[key] + ' − Universum', schluessel: key, perioden: perioden, jahre: jahre, tage: tage,
      eigenTage: tr[key],
      umschlagMittel: perioden.length ? umschlag / perioden.length : null,
      kostenMittel: perioden.length ? kostenSumme / perioden.length : null };
  }
  var haupt = periodenReihe('long'), kurzR = periodenReihe('kurz');

  /* (c) Long-Short als Diagnose (verlangt Wertpapierleihe - als Aktie im Projekt gesperrt). */
  var ls = { name: 'Long − Short (Diagnose, verlangt Leihe)', perioden: [], jahre: {}, tage: [] };
  P0.forEach(function (p) {
    var e = { t: p.t, jahr: p.jahr, a: p.a,
      brutto: p.long.periode - p.kurz.periode,
      netto: (p.long.periode - p.kosten.long.kosten) - (p.kurz.periode - p.kosten.kurz.kosten),
      regime: regime[p.t] };
    ls.perioden.push(e); (ls.jahre[p.jahr] = ls.jahre[p.jahr] || []).push(e);
  });
  ls.tage = tr.long.map(function (x) { var b = trIdx.kurz[x.tag]; return { tag: x.tag, brutto: x.brutto - (b ? b.brutto : 0), netto: x.netto - (b ? b.netto : 0) }; });

  return { haupt: haupt, kurz: kurzR, longShort: ls, tagesreihen: tr, lag: L.lag, freq: L.freq,
    zaehler: L.zaehler, verstoesse: L.verstoesse, beispiele: L.beispiele, ungueltig: L.ungueltig,
    empfindlichkeit: L.empfindlichkeit, regime: regime };
}

/** Kennzahlen einer Periodenliste: Mittel, se (naiv auf den nicht ueberlappenden Perioden), t - das ist
 *  das Hauptmass (§2.6). Daneben, immer: dieselbe Groesse auf der TAGESREIHE mit naiv, Hansen-Hodrick und
 *  Newey-West bei Lag L. Die Tagesreihe traegt dieselbe Information anders aufgeloest; weichen die se
 *  um mehr als Faktor SE_ABWEICHUNG_MARKE auseinander, steht das als Marke in der Zeile.
 *  feld: 'brutto' oder 'netto'. */
function kennzahlen(perioden, tage, lag, feld) {
  var werte = perioden.map(function (p) { return p[feld]; }).filter(function (x) { return x === x; });
  var m = ST.periodenMomente(werte);
  var tg = (tage || []).filter(function (x) { return x[feld] === x[feld]; }).map(function (x) { return { t: x.tag, x: x[feld] }; });
  var mt = tg.length > 1 ? ST.momente(tg, lag) : null;
  /* Tagesmittel x Periodenlaenge ist mit dem Periodenmittel vergleichbar (Summe der Tage einer Periode). */
  return { n: m.n, mittel: m.mittel, se: m.seNaiv, t: m.t, sd: m.sd,
    tagN: mt ? mt.n : 0, tagMittel: mt ? mt.mittel : null,
    tagSeNaiv: mt ? mt.seNaiv : null, tagSeHH: mt ? mt.seHH : null, tagSeNW: mt ? mt.seNW : null,
    tagT: mt ? mt.t : null,
    marke: (mt && mt.seHH > 0 && mt.seNaiv > 0 && (mt.seHH / mt.seNaiv > K.SE_ABWEICHUNG_MARKE || mt.seNaiv / mt.seHH > K.SE_ABWEICHUNG_MARKE)) ? 'se-Spreizung' : null };
}

module.exports = { Tafel: Tafel, universum: universum, Sicht: Sicht, signaltage: signaltage, lauf: lauf,
  halte: halte, umschlagKosten: umschlagKosten, bewerte: bewerte, kennzahlen: kennzahlen, spyRegime: spyRegime };

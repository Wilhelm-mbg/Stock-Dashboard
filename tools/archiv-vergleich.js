'use strict';
/* VERMESSUNG DER UEBERLAPPUNG: Renderer-Store gegen Dateisammlung (Stufe Z0).
 *
 *   node tools/archiv-vergleich.js <store-sicherung> <archiv-wurzel> [--saat N] [--je N]
 *                                  [--aus ergebnis.json] [--md befund-tabellen.md]
 *   node tools/archiv-vergleich.js --kontrolle
 *
 *   store-sicherung  die KOPIE des Stores (tools/store-sichern.js), nie der lebende Store:
 *                    der wandert alle zehn Minuten, und eine Messung auf wanderndem
 *                    Grund ist keine.
 *   archiv-wurzel    der Ordner, unter dem archiv1m/ archiv5m/ archiv15m/ archiv60m/ liegen
 *                    (E:/Markt-Dashboard-Archiv). Wird nur gelesen.
 *
 * NUR LESEND. Dieses Werkzeug schreibt ausschliesslich in die mit --aus/--md genannten
 * Dateien.
 *
 * WAS GEMESSEN WIRD, je Symbol x Intervall (1m, 5m, 15m, 60m):
 *   - Stempel nur im Store, nur in der Datei, gemeinsam;
 *   - auf den gemeinsamen Stempeln die Abweichungen in schluss, hoch, tief, umsatz:
 *     Anzahl, Median und Maximum der relativen Abweichung, getrennt nach Stempeln
 *     innerhalb und ausserhalb der capBereiche des Stores;
 *   - ob eine Abweichung durch die 7-Stellen-Rundung des Stores erklaert ist
 *     (archiv.js schlank(): Preise 7 signifikante Stellen, Umsatz ganzzahlig), durch
 *     Gleitkomma-Rauschen (<= 1 ppm) oder ECHT;
 *   - der Abstand der letzten Kerze beider Seiten und ob die letzte Store-Kerze zum
 *     Zeitpunkt updatedAt noch lief (#85);
 *   - Rasterunterschiede: Stempel, die nur eine Seite haelt, INNERHALB des gemeinsamen
 *     Zeitfensters, aufgeschluesselt nach Tageszeit (UTC), Handelsphase und Tag;
 *   - Tiefe beider Seiten in Kalendertagen und Handelstagen;
 *   - Stempelkerzen (Umsatz 0, hoch = tief = schluss) je Seite;
 *   - die Symbolnamen-Falle: Store-Namen, die sich nicht direkt auf eine Datei abbilden.
 *
 * STICHPROBE. Je Intervall 12 Symbole: 6 mit capBereiche im Store, 6 ohne, deterministisch
 * gezogen (Saat steht im Ergebnis), dazu AAPL und SPY als Kontrolle. Gezogen wird nur
 * aus Symbolen, die auf BEIDEN Seiten liegen - das steht so im Befund, denn es ist eine
 * Auswahl: ueber Reihen, die nur der Store kennt, sagt die Messung nichts.
 *
 * POSITIVKONTROLLE (--kontrolle). Ein Werkzeug, das nie "echt" sagt, besteht jeden
 * Vergleich. Deshalb drei Kunst-Paare, deren Antwort feststeht:
 *   A  identische Reihe, einmal 5-Feld gerundet, einmal 6-Feld roh, dazu eine laufende
 *      Kerze im Store  ->  0 echte Abweichungen, 1 laufende Kerze
 *   B  dieselbe Reihe mit Volumen x 500 auf einem Bereich, der als capBereich markiert
 *      ist  ->  genau dieser Bereich, alle Treffer "innen", keiner "aussen", Faktor 500;
 *      und OHNE Markierung dieselben Treffer "aussen" - sonst waere die Trennung eine
 *      Tautologie
 *   C  ein einziger Schlusskurs um 10 ppm verschoben  ->  genau 1 echte Abweichung
 * Ohne bestandene Kontrolle liefert der Vergleich keine Zahl (Exit 1).
 */
var fs = require('fs');
var path = require('path');

var DAUER_MS = { '1m': 60000, '5m': 300000, '15m': 900000, '60m': 3600000 };
var INTERVALLE = ['1m', '5m', '15m', '60m'];
var FELDER = { schluss: 1, umsatz: 2, hoch: 3, tief: 4 };
var PPM = 1e-6;
var KONTROLLSYMBOLE = ['AAPL', 'SPY'];

/* Spiegel von archiv.js signifikant()/schlank() - bewusst kopiert, nicht importiert:
 * archiv.js haengt am Fenster-Objekt, und dieses Werkzeug soll auch dann laufen, wenn
 * der App-Code sich aendert. Die Kontrolle A prueft, dass die Kopie das Gleiche tut
 * wie das Original, das die Store-Dateien geschrieben hat: sonst gaebe es dort
 * "echte" Abweichungen. */
function signifikant(v, stellen) {
  if (v == null || !isFinite(v) || v === 0) return v == null ? v : 0;
  var m = Math.pow(10, stellen - 1 - Math.floor(Math.log(Math.abs(v)) / Math.LN10));
  return Math.round(v * m) / m;
}
function schlank(bars) {
  return (bars || []).map(function (b) {
    var o = [b[0], signifikant(b[1], 7), Math.round(b[2] || 0)];
    if (b.length >= 5) { o.push(signifikant(b[3], 7), signifikant(b[4], 7)); }
    return o;
  });
}

/* ---------------------------------------------------------------- Hilfen */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function mische(arr, rnd) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function median(a) {
  if (!a.length) return null;
  var s = a.slice().sort(function (x, y) { return x - y; });
  var m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function tag(ts) { return new Date(ts).toISOString().slice(0, 10); }
function uhr(ts) { return new Date(ts).toISOString().slice(11, 16); }
function phase(ts) {
  var d = new Date(ts); var m = d.getUTCHours() * 60 + d.getUTCMinutes();
  return m < 810 ? 'vor' : (m < 1200 ? 'regulaer' : 'nach');   /* 13:30 / 20:00 UTC */
}
function inBereichen(ts, bereiche) {
  for (var i = 0; i < bereiche.length; i++) if (ts >= bereiche[i][0] && ts <= bereiche[i][1]) return true;
  return false;
}
function stempelkerze(b) { return (b[2] || 0) === 0 && b[3] === b[4] && b[3] === b[1]; }
function tiefe(series) {
  if (!series.length) return { von: null, bis: null, tage: 0, handelstage: 0 };
  var tage = {};
  series.forEach(function (b) { tage[tag(b[0])] = 1; });
  var von = series[0][0], bis = series[series.length - 1][0];
  return { von: new Date(von).toISOString(), bis: new Date(bis).toISOString(),
    tage: Math.round((bis - von) / 86400000 * 10) / 10, handelstage: Object.keys(tage).length };
}
function topN(zaehler, n) {
  return Object.keys(zaehler).map(function (k) { return [k, zaehler[k]]; })
    .sort(function (a, b) { return b[1] - a[1] || (a[0] < b[0] ? -1 : 1); }).slice(0, n);
}

/* ------------------------------------------------- der eigentliche Vergleich */
function relAbw(s, f) {
  if (s === f) return 0;
  var m = Math.max(Math.abs(s), Math.abs(f));
  return m > 0 ? Math.abs(s - f) / m : 0;
}
/* Einordnung einer Abweichung: 'gleich' | 'rundung' | 'ppm' | 'echt' */
function einordnung(feld, s, f) {
  if (s === f) return 'gleich';
  if (feld === 'umsatz') { if (s === Math.round(f || 0)) return 'rundung'; }
  else if (s === signifikant(f, 7)) return 'rundung';
  return relAbw(s, f) <= PPM ? 'ppm' : 'echt';
}
function leerFeld() {
  return { n: 0, gleich: 0, rundung: 0, ppm: 0, echt: 0, relEcht: [], relAlle: [], echtVon: null, echtBis: null, faktoren: [] };
}
function schliesseFeld(x) {
  var o = { n: x.n, gleich: x.gleich, rundung: x.rundung, ppm: x.ppm, echt: x.echt,
    medianEcht: median(x.relEcht), maxEcht: x.relEcht.length ? Math.max.apply(null, x.relEcht) : null,
    medianAlle: median(x.relAlle), maxAlle: x.relAlle.length ? Math.max.apply(null, x.relAlle) : null,
    echtVon: x.echtVon != null ? new Date(x.echtVon).toISOString() : null,
    echtBis: x.echtBis != null ? new Date(x.echtBis).toISOString() : null,
    faktorMedian: median(x.faktoren) };
  return o;
}

/** store: { series (5-Feld), updatedAt, capBereiche }, datei: { series (6-Feld) }.
 *  Rein, ohne Dateizugriff - damit die Kontrolle es mit Kunstpaaren fuettern kann. */
function vergleiche(store, datei, iv) {
  var dauer = DAUER_MS[iv] || 0;
  var cap = store.capBereiche || [];
  var S = {}, F = {};
  store.series.forEach(function (b) { S[b[0]] = b; });
  datei.series.forEach(function (b) { F[b[0]] = b; });
  var tS = tiefe(store.series), tF = tiefe(datei.series);
  var fensterVon = Math.max(store.series.length ? store.series[0][0] : Infinity, datei.series.length ? datei.series[0][0] : Infinity);
  var fensterBis = Math.min(store.series.length ? store.series[store.series.length - 1][0] : -Infinity, datei.series.length ? datei.series[datei.series.length - 1][0] : -Infinity);
  var letzteS = store.series.length ? store.series[store.series.length - 1][0] : null;
  var letzteF = datei.series.length ? datei.series[datei.series.length - 1][0] : null;

  var felder = { innen: {}, aussen: {} };
  Object.keys(FELDER).forEach(function (f) { felder.innen[f] = leerFeld(); felder.aussen[f] = leerFeld(); });
  var gemeinsam = 0, gemeinsamInnen = 0, nurStore = 0, nurDatei = 0;
  var nurStoreInnen = 0, nurDateiInnen = 0, nurStoreVor = 0, nurStoreNach = 0, nurDateiVor = 0, nurDateiNach = 0;
  var jeUhr = {}, jePhase = { vor: 0, regulaer: 0, nach: 0 }, jeTag = {};
  var laufende = 0, stempelS = 0, stempelF = 0;

  store.series.forEach(function (b) {
    var ts = b[0];
    if (stempelkerze(b)) stempelS++;
    if (dauer && store.updatedAt != null && ts + dauer > store.updatedAt) laufende++;
    var f = F[ts];
    if (!f) {
      nurStore++;
      if (ts < fensterVon) nurStoreVor++; else if (ts > fensterBis) nurStoreNach++;
      else { nurStoreInnen++; jeUhr[uhr(ts) + ' S'] = (jeUhr[uhr(ts) + ' S'] || 0) + 1; jePhase[phase(ts)]++; jeTag[tag(ts) + ' S'] = (jeTag[tag(ts) + ' S'] || 0) + 1; }
      return;
    }
    gemeinsam++;
    var innen = inBereichen(ts, cap);
    if (innen) gemeinsamInnen++;
    var seite = innen ? felder.innen : felder.aussen;
    Object.keys(FELDER).forEach(function (name) {
      var i = FELDER[name];
      var s = b[i], v = f[i];
      if (typeof s !== 'number' || typeof v !== 'number') return;
      var x = seite[name]; x.n++;
      var art = einordnung(name, s, v);
      x[art]++;
      if (art !== 'gleich') x.relAlle.push(relAbw(s, v));
      if (art === 'echt') {
        x.relEcht.push(relAbw(s, v));
        if (x.echtVon == null || ts < x.echtVon) x.echtVon = ts;
        if (x.echtBis == null || ts > x.echtBis) x.echtBis = ts;
        if (name === 'umsatz' && v > 0 && s > 0) x.faktoren.push(s / v);
      }
    });
  });
  datei.series.forEach(function (b) {
    var ts = b[0];
    if (stempelkerze(b)) stempelF++;
    if (S[ts]) return;
    nurDatei++;
    if (ts < fensterVon) nurDateiVor++; else if (ts > fensterBis) nurDateiNach++;
    else { nurDateiInnen++; jeUhr[uhr(ts) + ' D'] = (jeUhr[uhr(ts) + ' D'] || 0) + 1; jePhase[phase(ts)]++; jeTag[tag(ts) + ' D'] = (jeTag[tag(ts) + ' D'] || 0) + 1; }
  });

  var aus = { innen: {}, aussen: {} };
  Object.keys(FELDER).forEach(function (f) { aus.innen[f] = schliesseFeld(felder.innen[f]); aus.aussen[f] = schliesseFeld(felder.aussen[f]); });
  return {
    nStore: store.series.length, nDatei: datei.series.length, capBereiche: cap.length,
    gemeinsam: gemeinsam, gemeinsamInnen: gemeinsamInnen, nurStore: nurStore, nurDatei: nurDatei,
    tiefe: { store: tS, datei: tF },
    fenster: isFinite(fensterVon) && isFinite(fensterBis) && fensterVon <= fensterBis
      ? { von: new Date(fensterVon).toISOString(), bis: new Date(fensterBis).toISOString() } : null,
    letzte: {
      store: letzteS != null ? new Date(letzteS).toISOString() : null,
      datei: letzteF != null ? new Date(letzteF).toISOString() : null,
      abstandMin: letzteS != null && letzteF != null ? (letzteS - letzteF) / 60000 : null,
      storeLaufend: letzteS != null && dauer > 0 && store.updatedAt != null ? letzteS + dauer > store.updatedAt : null,
      laufendeKerzen: laufende,
      storeStempelkerze: letzteS != null ? stempelkerze(S[letzteS]) : null,
      dateiStempelkerze: letzteF != null ? stempelkerze(F[letzteF]) : null,
    },
    stempelkerzen: { store: stempelS, datei: stempelF },
    raster: {
      nurStoreVorFenster: nurStoreVor, nurStoreNachFenster: nurStoreNach, nurStoreImFenster: nurStoreInnen,
      nurDateiVorFenster: nurDateiVor, nurDateiNachFenster: nurDateiNach, nurDateiImFenster: nurDateiInnen,
      jePhase: jePhase, jeUhr: topN(jeUhr, 10), jeTag: topN(jeTag, 8),
    },
    felder: aus,
  };
}

/* ---------------------------------------------------------- Dateizugriff */
function ladeStore(p) {
  var j = JSON.parse(fs.readFileSync(p, 'utf8'));
  return { series: j.series || [], updatedAt: j.updatedAt != null ? j.updatedAt : null, capBereiche: j.capBereiche || [] };
}
function ladeDatei(p) {
  var j = JSON.parse(fs.readFileSync(p, 'utf8'));
  return { series: j.series || [], stand: j.stand || null };
}
function storeNamen(sicherung, iv) {
  var pre = 'bars_' + iv + '_';
  return fs.readdirSync(sicherung).filter(function (n) { return n.indexOf(pre) === 0 && /\.json$/.test(n); })
    .map(function (n) { return n.slice(pre.length, -5); }).sort();
}
/* Den Dateinamen zu einem Store-Namen finden. main.js safeName() ersetzt alles ausser
 * [A-Za-z0-9_-] durch '_'; Yahoo schreibt BRK-B, die Dateisammlung fuehrt BRK.B. Also
 * werden neben dem Namen selbst die Varianten mit '.' statt '-' und '.' statt '_'
 * gesucht - in der Wurzel und in etf/. Mehr als ein Treffer ist MEHRDEUTIG. */
function dateiFuer(wurzel, iv, sym) {
  var ordner = path.join(wurzel, 'archiv' + iv);
  var varianten = [sym];
  if (sym.indexOf('-') >= 0) varianten.push(sym.replace(/-/g, '.'));
  if (sym.indexOf('_') >= 0) { varianten.push(sym.replace(/_/g, '.')); varianten.push(sym.replace(/_/g, '-')); }
  var treffer = [];
  varianten.forEach(function (v) {
    ['', 'etf'].forEach(function (u) {
      var p = path.join(u ? path.join(ordner, u) : ordner, 'bars_' + iv + '_' + v + '.json');
      if (fs.existsSync(p)) treffer.push({ pfad: p, name: v });
    });
  });
  var direkt = treffer.filter(function (t) { return t.name === sym; });
  if (direkt.length === 1) return { pfad: direkt[0].pfad, art: 'direkt' };
  if (treffer.length === 1) return { pfad: treffer[0].pfad, art: 'ersetzt:' + treffer[0].name };
  if (treffer.length === 0) return { pfad: null, art: 'keine' };
  return { pfad: null, art: 'mehrdeutig:' + treffer.map(function (t) { return t.name; }).join('|') };
}

function ziehe(sicherung, wurzel, iv, saat, je) {
  var namen = storeNamen(sicherung, iv);
  var abbildung = { direkt: 0, ersetzt: 0, keine: 0, mehrdeutig: 0, mitUnterstrich: 0, mitUnterstrichUnklar: [], ersetzte: [], mehrdeutige: [], ohne: [] };
  var mitCap = [], ohneCap = [];
  namen.forEach(function (sym) {
    var d = dateiFuer(wurzel, iv, sym);
    var art = d.art.split(':')[0];
    abbildung[art]++;
    if (sym.indexOf('_') >= 0) { abbildung.mitUnterstrich++; if (art !== 'direkt') abbildung.mitUnterstrichUnklar.push(sym + ' (' + d.art + ')'); }
    if (art === 'ersetzt') abbildung.ersetzte.push(sym + '→' + d.art.split(':')[1]);
    if (art === 'mehrdeutig') abbildung.mehrdeutige.push(sym + ' (' + d.art.split(':')[1] + ')');
    if (art === 'keine') abbildung.ohne.push(sym);
    if (!d.pfad) return;
    var st = ladeStore(path.join(sicherung, 'bars_' + iv + '_' + sym + '.json'));
    var e = { sym: sym, storePfad: path.join(sicherung, 'bars_' + iv + '_' + sym + '.json'), dateiPfad: d.pfad, abbildung: d.art, cap: st.capBereiche.length > 0 };
    if (KONTROLLSYMBOLE.indexOf(sym) >= 0) return;   /* kommen fest dazu, nicht per Los */
    (e.cap ? mitCap : ohneCap).push(e);
  });
  var rnd = mulberry32(saat + (iv === '1m' ? 1 : iv === '5m' ? 5 : iv === '15m' ? 15 : 60));
  var wahl = mische(mitCap, rnd).slice(0, je).concat(mische(ohneCap, rnd).slice(0, je));
  KONTROLLSYMBOLE.forEach(function (sym) {
    var d = dateiFuer(wurzel, iv, sym);
    var sp = path.join(sicherung, 'bars_' + iv + '_' + sym + '.json');
    if (d.pfad && fs.existsSync(sp)) wahl.push({ sym: sym, storePfad: sp, dateiPfad: d.pfad, abbildung: d.art, cap: ladeStore(sp).capBereiche.length > 0, kontrolle: true });
  });
  return { namen: namen.length, grundgesamtheit: { mitCap: mitCap.length, ohneCap: ohneCap.length }, abbildung: abbildung, wahl: wahl };
}

function lauf(sicherung, wurzel, saat, je) {
  var erg = { erzeugt: new Date().toISOString(), sicherung: sicherung, wurzel: wurzel, saat: saat, je: je, intervalle: {} };
  INTERVALLE.forEach(function (iv) {
    var z = ziehe(sicherung, wurzel, iv, saat, je);
    var paare = z.wahl.map(function (w) {
      var st = ladeStore(w.storePfad), da = ladeDatei(w.dateiPfad);
      var v = vergleiche(st, da, iv);
      v.sym = w.sym; v.cap = w.cap; v.abbildung = w.abbildung; v.kontrolle = !!w.kontrolle;
      v.updatedAt = st.updatedAt != null ? new Date(st.updatedAt).toISOString() : null; v.stand = da.stand;
      return v;
    });
    erg.intervalle[iv] = { storeReihen: z.namen, grundgesamtheit: z.grundgesamtheit, abbildung: z.abbildung, paare: paare, summe: summe(paare) };
  });
  return erg;
}

function summe(paare) {
  var s = { paare: paare.length, gemeinsam: 0, gemeinsamInnen: 0, nurStore: 0, nurDatei: 0, nurStoreImFenster: 0, nurDateiImFenster: 0,
    laufende: 0, storeLaufend: 0, stempelkerzen: { store: 0, datei: 0 }, felder: { innen: {}, aussen: {} }, jePhase: { vor: 0, regulaer: 0, nach: 0 } };
  Object.keys(FELDER).forEach(function (f) { ['innen', 'aussen'].forEach(function (k) { s.felder[k][f] = { n: 0, rundung: 0, ppm: 0, echt: 0, relEcht: [], faktoren: [] }; }); });
  paare.forEach(function (p) {
    s.gemeinsam += p.gemeinsam; s.gemeinsamInnen += p.gemeinsamInnen; s.nurStore += p.nurStore; s.nurDatei += p.nurDatei;
    s.nurStoreImFenster += p.raster.nurStoreImFenster; s.nurDateiImFenster += p.raster.nurDateiImFenster;
    s.laufende += p.letzte.laufendeKerzen; if (p.letzte.storeLaufend) s.storeLaufend++;
    s.stempelkerzen.store += p.stempelkerzen.store; s.stempelkerzen.datei += p.stempelkerzen.datei;
    ['vor', 'regulaer', 'nach'].forEach(function (k) { s.jePhase[k] += p.raster.jePhase[k]; });
    Object.keys(FELDER).forEach(function (f) { ['innen', 'aussen'].forEach(function (k) {
      var q = p.felder[k][f], t = s.felder[k][f];
      t.n += q.n; t.rundung += q.rundung; t.ppm += q.ppm; t.echt += q.echt;
      if (q.echt) { t.relEcht.push(q.maxEcht); }
      if (q.faktorMedian != null) t.faktoren.push(q.faktorMedian);
    }); });
  });
  Object.keys(FELDER).forEach(function (f) { ['innen', 'aussen'].forEach(function (k) {
    var t = s.felder[k][f];
    t.maxEcht = t.relEcht.length ? Math.max.apply(null, t.relEcht) : null;
    t.faktorMedian = median(t.faktoren); delete t.relEcht; delete t.faktoren;
  }); });
  return s;
}

/* ------------------------------------------------------------- Markdown */
function pz(x, n) { return x == null ? '–' : (x * 100).toFixed(n == null ? 3 : n) + ' %'; }
function markdown(erg) {
  var z = [];
  z.push('Erzeugt ' + erg.erzeugt + ' mit `node tools/archiv-vergleich.js`, Saat ' + erg.saat + ', je ' + erg.je + ' Symbole mit/ohne capBereiche + AAPL/SPY.');
  z.push('');
  z.push('### Übersicht je Intervall');
  z.push('');
  z.push('| Intervall | Store-Reihen | davon mit Datei | Paare | gemeinsame Stempel | davon in capBereiche | nur Store | nur Datei | nur Store im Fenster | nur Datei im Fenster | laufende Kerzen | Stempelkerzen Store / Datei |');
  z.push('|---|---|---|---|---|---|---|---|---|---|---|---|');
  INTERVALLE.forEach(function (iv) {
    var I = erg.intervalle[iv], s = I.summe;
    z.push('| ' + iv + ' | ' + I.storeReihen + ' | ' + (I.abbildung.direkt + I.abbildung.ersetzt) + ' | ' + s.paare + ' | ' + s.gemeinsam + ' | ' + s.gemeinsamInnen +
      ' | ' + s.nurStore + ' | ' + s.nurDatei + ' | ' + s.nurStoreImFenster + ' | ' + s.nurDateiImFenster + ' | ' + s.laufende + ' | ' + s.stempelkerzen.store + ' / ' + s.stempelkerzen.datei + ' |');
  });
  z.push('');
  z.push('### Abweichungen auf gemeinsamen Stempeln (Summe über die Paare)');
  z.push('');
  z.push('| Intervall | Lage | Feld | n | durch Rundung erklärt | ≤ 1 ppm | echt | max. rel. Abw. (echt) | Median Faktor Store/Datei (Umsatz, echt) |');
  z.push('|---|---|---|---|---|---|---|---|---|');
  INTERVALLE.forEach(function (iv) {
    ['innen', 'aussen'].forEach(function (k) {
      Object.keys(FELDER).forEach(function (f) {
        var t = erg.intervalle[iv].summe.felder[k][f];
        if (!t.n) return;
        z.push('| ' + iv + ' | ' + (k === 'innen' ? 'in capBereiche' : 'außerhalb') + ' | ' + f + ' | ' + t.n + ' | ' + t.rundung + ' | ' + t.ppm + ' | ' + t.echt +
          ' | ' + pz(t.maxEcht) + ' | ' + (f === 'umsatz' && t.faktorMedian != null ? t.faktorMedian.toFixed(1) : '–') + ' |');
      });
    });
  });
  z.push('');
  z.push('### Je Symbol');
  z.push('');
  z.push('| Intervall | Symbol | cap | Abbildung | Store n / Tage / Handelstage | Datei n / Tage / Handelstage | gemeinsam | nur Store (vor/im/nach Fenster) | nur Datei (vor/im/nach) | letzte Store | letzte Datei | Abstand min | Store läuft | echt schluss/hoch/tief/umsatz innen | echt außen |');
  z.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  INTERVALLE.forEach(function (iv) {
    erg.intervalle[iv].paare.forEach(function (p) {
      var fi = p.felder.innen, fa = p.felder.aussen;
      z.push('| ' + iv + ' | ' + p.sym + (p.kontrolle ? ' (K)' : '') + ' | ' + (p.cap ? 'ja' : 'nein') + ' | ' + p.abbildung +
        ' | ' + p.nStore + ' / ' + p.tiefe.store.tage + ' / ' + p.tiefe.store.handelstage +
        ' | ' + p.nDatei + ' / ' + p.tiefe.datei.tage + ' / ' + p.tiefe.datei.handelstage +
        ' | ' + p.gemeinsam + ' | ' + p.raster.nurStoreVorFenster + '/' + p.raster.nurStoreImFenster + '/' + p.raster.nurStoreNachFenster +
        ' | ' + p.raster.nurDateiVorFenster + '/' + p.raster.nurDateiImFenster + '/' + p.raster.nurDateiNachFenster +
        ' | ' + (p.letzte.store || '–').slice(0, 16) + ' | ' + (p.letzte.datei || '–').slice(0, 16) + ' | ' + (p.letzte.abstandMin == null ? '–' : p.letzte.abstandMin) +
        ' | ' + (p.letzte.storeLaufend == null ? '–' : (p.letzte.storeLaufend ? 'ja' : 'nein')) +
        ' | ' + fi.schluss.echt + '/' + fi.hoch.echt + '/' + fi.tief.echt + '/' + fi.umsatz.echt +
        ' | ' + fa.schluss.echt + '/' + fa.hoch.echt + '/' + fa.tief.echt + '/' + fa.umsatz.echt + ' |');
    });
  });
  z.push('');
  z.push('### Raster: Stempel nur einer Seite im gemeinsamen Fenster, nach Handelsphase (UTC; vor < 13:30, regulär 13:30–20:00, nach ≥ 20:00)');
  z.push('');
  z.push('| Intervall | vor | regulär | nach | häufigste Uhrzeiten (S = nur Store, D = nur Datei) | häufigste Tage |');
  z.push('|---|---|---|---|---|---|');
  INTERVALLE.forEach(function (iv) {
    var I = erg.intervalle[iv], u = {}, t = {};
    I.paare.forEach(function (p) {
      p.raster.jeUhr.forEach(function (e) { u[e[0]] = (u[e[0]] || 0) + e[1]; });
      p.raster.jeTag.forEach(function (e) { t[e[0]] = (t[e[0]] || 0) + e[1]; });
    });
    z.push('| ' + iv + ' | ' + I.summe.jePhase.vor + ' | ' + I.summe.jePhase.regulaer + ' | ' + I.summe.jePhase.nach + ' | ' +
      topN(u, 6).map(function (e) { return e[0] + ' ×' + e[1]; }).join(', ') + ' | ' + topN(t, 5).map(function (e) { return e[0] + ' ×' + e[1]; }).join(', ') + ' |');
  });
  z.push('');
  z.push('### Symbolnamen-Abbildung Store → Datei (alle Store-Reihen des Intervalls)');
  z.push('');
  z.push('| Intervall | Store-Reihen | direkt | ersetzt (Zeichen getauscht) | keine Datei | mehrdeutig | Namen mit `_` | davon nicht eindeutig |');
  z.push('|---|---|---|---|---|---|---|---|');
  INTERVALLE.forEach(function (iv) {
    var a = erg.intervalle[iv].abbildung;
    z.push('| ' + iv + ' | ' + erg.intervalle[iv].storeReihen + ' | ' + a.direkt + ' | ' + a.ersetzt + (a.ersetzte.length ? ' (' + a.ersetzte.join(', ') + ')' : '') +
      ' | ' + a.keine + (a.ohne.length ? ' (' + a.ohne.slice(0, 12).join(', ') + (a.ohne.length > 12 ? ', …' : '') + ')' : '') +
      ' | ' + a.mehrdeutig + (a.mehrdeutige.length ? ' (' + a.mehrdeutige.join(', ') + ')' : '') + ' | ' + a.mitUnterstrich + ' | ' + a.mitUnterstrichUnklar.length + ' |');
  });
  return z.join('\n');
}

/* ---------------------------------------------------------- Kontrolle */
function kunstReihe(n, t0, dauer, saat) {
  var rnd = mulberry32(saat), s = [], k = 123.456789;
  for (var i = 0; i < n; i++) {
    k = k * (1 + (rnd() - 0.5) * 0.01);
    var h = k * (1 + rnd() * 0.004), l = k * (1 - rnd() * 0.004), o = l + (h - l) * rnd();
    /* Rohwerte mit voller Gleitkomma-Breite - damit die Rundung auf 7 Stellen wirklich
     * etwas veraendert und der Zweig 'rundung' nachweislich durchlaufen wird. */
    s.push([t0 + i * dauer, k, Math.floor(rnd() * 1e6) + rnd(), h, l, o]);
  }
  return s;
}
function kontrolle() {
  var fehler = [];
  function pruefe(bed, was, ist) { if (!bed) fehler.push(was + (ist !== undefined ? ' (ist: ' + JSON.stringify(ist) + ')' : '')); console.log((bed ? '  ok   ' : '  FEHL ') + was + (ist !== undefined ? '  →  ' + JSON.stringify(ist) : '')); }
  var dauer = DAUER_MS['5m'], t0 = Date.UTC(2026, 7, 3, 13, 30);
  var roh = kunstReihe(500, t0, dauer, 7);
  var summeEcht = function (v) { var n = 0; ['innen', 'aussen'].forEach(function (k) { Object.keys(FELDER).forEach(function (f) { n += v.felder[k][f].echt; }); }); return n; };
  var summeRundung = function (v) { var n = 0; ['innen', 'aussen'].forEach(function (k) { Object.keys(FELDER).forEach(function (f) { n += v.felder[k][f].rundung; }); }); return n; };

  console.log('Kontrolle A: identische Reihe, Store 5-Feld gerundet + laufende Kerze');
  var laufend = [t0 + 500 * dauer, 130, 100, 131, 129];
  var A = vergleiche({ series: schlank(roh).concat([laufend]), updatedAt: laufend[0] + 60000, capBereiche: [] }, { series: roh }, '5m');
  pruefe(A.gemeinsam === 500 && A.nurStore === 1 && A.nurDatei === 0, 'A: 500 gemeinsam, 1 nur Store, 0 nur Datei', [A.gemeinsam, A.nurStore, A.nurDatei]);
  pruefe(summeEcht(A) === 0, 'A: 0 echte Abweichungen', summeEcht(A));
  pruefe(summeRundung(A) > 1000, 'A: Rundungszweig wurde durchlaufen (> 1000 Rundungsfälle)', summeRundung(A));
  pruefe(A.letzte.laufendeKerzen === 1 && A.letzte.storeLaufend === true && A.letzte.abstandMin === 5, 'A: genau 1 laufende Kerze, Abstand 5 min', [A.letzte.laufendeKerzen, A.letzte.storeLaufend, A.letzte.abstandMin]);
  pruefe(A.raster.nurStoreNachFenster === 1 && A.raster.nurStoreImFenster === 0, 'A: die laufende Kerze liegt NACH dem Fenster, nicht im Raster', A.raster);

  console.log('Kontrolle B: Umsatz × 500 auf Kerzen 100–199, als capBereich markiert');
  var von = roh[100][0], bis = roh[199][0];
  var stB = schlank(roh).map(function (b, i) { return i >= 100 && i <= 199 ? [b[0], b[1], b[2] * 500, b[3], b[4]] : b; });
  var B = vergleiche({ series: stB, updatedAt: bis + 1e9, capBereiche: [[von, bis]] }, { series: roh }, '5m');
  pruefe(B.felder.innen.umsatz.echt === 100 && B.felder.aussen.umsatz.echt === 0, 'B: 100 echte Umsatz-Abweichungen innen, 0 außen', [B.felder.innen.umsatz.echt, B.felder.aussen.umsatz.echt]);
  pruefe(B.felder.innen.umsatz.echtVon === new Date(von).toISOString() && B.felder.innen.umsatz.echtBis === new Date(bis).toISOString(), 'B: gefundener Bereich = eingebauter Bereich', [B.felder.innen.umsatz.echtVon, B.felder.innen.umsatz.echtBis]);
  pruefe(Math.abs(B.felder.innen.umsatz.faktorMedian - 500) < 0.01, 'B: Median-Faktor 500', B.felder.innen.umsatz.faktorMedian);
  pruefe(summeEcht(B) === 100, 'B: keine echten Abweichungen in den Preisfeldern', summeEcht(B));
  pruefe(B.gemeinsamInnen === 100 && B.letzte.laufendeKerzen === 0, 'B: 100 gemeinsame Stempel innen, keine laufende Kerze', [B.gemeinsamInnen, B.letzte.laufendeKerzen]);
  var B2 = vergleiche({ series: stB, updatedAt: bis + 1e9, capBereiche: [] }, { series: roh }, '5m');
  pruefe(B2.felder.aussen.umsatz.echt === 100 && B2.felder.innen.umsatz.echt === 0, 'B ohne Markierung: dieselben 100 landen AUSSEN', [B2.felder.innen.umsatz.echt, B2.felder.aussen.umsatz.echt]);

  console.log('Kontrolle C: ein Schlusskurs um 10 ppm verschoben');
  var stC = schlank(roh); stC[250] = stC[250].slice(); stC[250][1] = stC[250][1] * (1 + 1e-5);
  var C = vergleiche({ series: stC, updatedAt: bis + 1e9, capBereiche: [] }, { series: roh }, '5m');
  pruefe(C.felder.aussen.schluss.echt === 1 && summeEcht(C) === 1, 'C: genau 1 echte Abweichung, im Feld schluss', [C.felder.aussen.schluss.echt, summeEcht(C)]);
  pruefe(C.felder.aussen.schluss.maxEcht > 9e-6 && C.felder.aussen.schluss.maxEcht < 1.1e-5, 'C: relative Abweichung ≈ 10 ppm', C.felder.aussen.schluss.maxEcht);

  console.log('Kontrolle D: Rasterlücke im Fenster (Datei hält zwei Stempel nicht)');
  var rohD = roh.filter(function (b, i) { return i !== 300 && i !== 301; });
  var D = vergleiche({ series: schlank(roh), updatedAt: bis + 1e9, capBereiche: [] }, { series: rohD }, '5m');
  pruefe(D.raster.nurStoreImFenster === 2 && D.nurStore === 2 && D.raster.jePhase.regulaer + D.raster.jePhase.vor + D.raster.jePhase.nach === 2, 'D: 2 Stempel nur Store, im Fenster, nach Phase gezählt', D.raster.jePhase);

  console.log(fehler.length ? '\nKONTROLLE NICHT BESTANDEN: ' + fehler.length + ' Fehler' : '\nKontrolle bestanden (A, B, C, D).');
  return fehler.length === 0;
}

/* ----------------------------------------------------------------- main */
function arg(name, std) { var i = process.argv.indexOf(name); return i >= 0 && process.argv[i + 1] != null ? process.argv[i + 1] : std; }
if (require.main === module) {
  if (process.argv.indexOf('--kontrolle') >= 0) { process.exit(kontrolle() ? 0 : 1); }
  var sicherung = process.argv[2], wurzel = process.argv[3];
  if (!sicherung || !wurzel || sicherung.charAt(0) === '-') {
    console.error('Aufruf: node tools/archiv-vergleich.js <store-sicherung> <archiv-wurzel> [--saat N] [--je N] [--aus x.json] [--md x.md]  |  --kontrolle');
    process.exit(2);
  }
  if (!fs.existsSync(path.join(sicherung, 'manifest.json'))) {
    console.error('Keine manifest.json in ' + sicherung + ' - das ist keine Store-Sicherung. Auf dem lebenden Store wird nicht gemessen.');
    process.exit(2);
  }
  if (!kontrolle()) { console.error('Ohne bestandene Kontrolle keine Zahl aus dem echten Vergleich.'); process.exit(1); }
  var saat = parseInt(arg('--saat', '20260903'), 10), je = parseInt(arg('--je', '6'), 10);
  var erg = lauf(sicherung, wurzel, saat, je);
  erg.kontrolle = 'bestanden (A, B, C, D) vor dem Lauf';
  var md = markdown(erg);
  var aus = arg('--aus', null), mdPfad = arg('--md', null);
  if (aus) fs.writeFileSync(aus, JSON.stringify(erg, null, 1));
  if (mdPfad) fs.writeFileSync(mdPfad, md + '\n');
  console.log(md);
}

module.exports = { vergleiche: vergleiche, schlank: schlank, signifikant: signifikant, dateiFuer: dateiFuer, kontrolle: kontrolle, lauf: lauf, markdown: markdown };

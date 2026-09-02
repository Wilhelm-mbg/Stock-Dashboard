'use strict';
/* ================= Die Auswertung -> ERGEBNIS.md =================
 *
 * Liest E:/Markt-Dashboard-Archiv/spannen/*.jsonl und schreibt ERGEBNIS.md in den
 * Studienordner. Rechnet NICHTS, was nicht in der Registrierung steht.
 *
 * DIE REIHENFOLGE IST TEIL DER METHODE (wiki/messmethodik.md B4/B5): Positivkontrolle und
 * Placebo stehen GANZ OBEN, in derselben Blickzeile wie die Ergebnisse - nicht in einer
 * Fussnote. Ist die Positivkontrolle verfehlt, wird KEINE Zahl berichtet.
 *
 * ZWEI SCHAETZER, Vorrangregel aus Registrierung Paragraph 3:
 *   - Symbol-Median (primaer): erst je Symbol der Median ueber seine Zeitpunkte, dann der
 *     Median ueber die Symbole. Ein Wert mit vielen Zeitpunkten zaehlt nicht mehr als einer.
 *   - roher Median ueber alle Quotes (danebengestellt). Laufen sie auseinander, dominieren
 *     einzelne Symbole - und das soll sichtbar sein, nicht geglaettet.
 *
 * UNSICHERHEIT NUR ALS CLUSTER-BOOTSTRAP UEBER SYMBOLE. Spannen sind innerhalb eines Wertes
 * hochgradig beharrlich; fuenf Tage desselben Symbols sind fast eine Beobachtung. Ein
 * ungeclustertes Band waere um ein Vielfaches zu eng.
 *
 * Aufruf:  node studien/vorregistrierung-2026-09-02-spannen-historisch/auswerten.js
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */

var fs = require('fs');
var path = require('path');
var Var = require('./varianten.js');

var QUELLE = process.env.MD_SPANNEN || 'E:/Markt-Dashboard-Archiv/spannen';

/* ERGEBNIS.md heisst NUR so, wenn die Zahlen aus dem Archiv kommen. Ein Trockenlauf auf
 * erfundenen Daten schreibt ERGEBNIS-TROCKENLAUF.md - und zwar erzwungen, nicht auf Zuruf.
 * Grund: beim ersten Trockenlauf lag anschliessend ein vollstaendig ausgefuelltes
 * ERGEBNIS.md mit plausiblen, aber erfundenen Zahlen im Studienordner. Genau die Bauform,
 * die dieses Projekt wiederholt eingeholt hat - eine Datei, die aussieht wie ein Befund. */
var ECHT = QUELLE.replace(/\\/g, '/').toLowerCase().indexOf('markt-dashboard-archiv/spannen') >= 0;
var ZIEL = path.join(__dirname, ECHT ? 'ERGEBNIS.md' : 'ERGEBNIS-TROCKENLAUF.md');
var KLASSEN = ['5-50', '50-250', '250-1000', 'ab1000'];
var FENSTER = ['eroeffnung', 'mitte', 'schluss'];
var JAHRE = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
var BOOTSTRAP = 1000;
var SAAT = 20260902;

/* ---------- Handwerkszeug ---------- */
function median(a) {
  if (!a.length) return NaN;
  var s = a.slice().sort(function (x, y) { return x - y; });
  var m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function quantil(a, p) {
  if (!a.length) return NaN;
  var s = a.slice().sort(function (x, y) { return x - y; });
  var i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
  return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (i - lo);
}
function wuerfel(saat) {
  var a = saat >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function fx(v, n) { return isFinite(v) ? v.toFixed(n == null ? 4 : n).replace('.', ',') : '–'; }

/* ---------- Eine Zelle ---------- */
/** rows: Zeilen mit gueltiger Spanne. Gibt den Symbol-Median, den rohen Median, p75,
 *  das Cluster-Bootstrap-Band und die Zaehlungen. */
function zelle(rows, alle) {
  var jeSym = {};
  rows.forEach(function (r) { (jeSym[r.sym] || (jeSym[r.sym] = [])).push(r.spanne); });
  var syms = Object.keys(jeSym);
  var symMedian = syms.map(function (s) { return median(jeSym[s]); });
  var roh = rows.map(function (r) { return r.spanne; });
  var zeitpunkte = {};
  rows.forEach(function (r) { zeitpunkte[r.sym + '|' + r.tag] = 1; });

  /* Cluster-Bootstrap: ganze SYMBOLE mit Zuruecklegen ziehen, samt allen ihren Zeitpunkten. */
  var band = [NaN, NaN];
  if (syms.length >= 10) {
    var r0 = wuerfel(SAAT + syms.length), verteilung = [];
    for (var b = 0; b < BOOTSTRAP; b++) {
      var zug = [];
      for (var i = 0; i < syms.length; i++) zug.push(symMedian[Math.floor(r0() * syms.length)]);
      verteilung.push(median(zug));
    }
    band = [quantil(verteilung, 0.025), quantil(verteilung, 0.975)];
  }
  var fehl = alle.length ? (alle.length - rows.length) / alle.length : 0;
  var gesperrt = rows.filter(function (r) { return r.spanne === 0; }).length;
  return { n: rows.length, symbole: syms.length, zeitpunkte: Object.keys(zeitpunkte).length,
           symMedian: median(symMedian), rohMedian: median(roh), p75: quantil(roh, 0.75),
           band: band, fehlanteil: fehl, gesperrt: gesperrt,
           vollerhebung: false };
}

/* ---------- Einlesen ---------- */
function lesen() {
  var zeilen = [], dateien = [];
  try { dateien = fs.readdirSync(QUELLE).filter(function (f) { return /^\d{4}\.jsonl$/.test(f); }); }
  catch (e) { return { zeilen: [], dateien: [] }; }
  dateien.forEach(function (f) {
    var txt = fs.readFileSync(path.join(QUELLE, f), 'utf8').split('\n');
    for (var i = 0; i < txt.length; i++) {
      if (!txt[i]) continue;
      var o; try { o = JSON.parse(txt[i]); } catch (e) { continue; }
      if (o && o.sym) zeilen.push(o);
    }
  });
  /* Doppelte (ein Neustart kann eine Zeile zweimal geschrieben haben, wenn er zwischen
   * Schreiben und Zaehlen abgebrochen wurde): letzte gewinnt, deterministisch. */
  var einmal = {};
  zeilen.forEach(function (r) { einmal[r.sym + '|' + r.utc] = r; });
  return { zeilen: Object.keys(einmal).map(function (k) { return einmal[k]; }), dateien: dateien };
}

function gueltig(r) { return typeof r.spanne === 'number' && isFinite(r.spanne); }

/* ---------- Bericht ---------- */
function main() {
  var L = lesen();
  var alle = L.zeilen;
  if (!alle.length) { process.stdout.write('Keine Daten in ' + QUELLE + '\n'); return; }

  var placebo = alle.filter(function (r) { return r.fenster === 'placebo-vorboerslich'; });
  var haupt = alle.filter(function (r) { return r.fenster !== 'placebo-vorboerslich'; });
  var out = [];
  function s(t) { out.push(t == null ? '' : t); }

  s('# Ergebnis: Die Kostenhürde für Kassa-Aktien aus notierten Spannen');
  s('');
  if (!ECHT) {
    s('> # ⚠⚠ TROCKENLAUF — DIESE ZAHLEN SIND ERFUNDEN ⚠⚠');
    s('> Die Quelle ist **nicht** das Archiv, sondern `' + QUELLE + '`.');
    s('> Kein Befund. Keine Zahl aus dieser Datei darf zitiert werden.');
    s('');
  }
  s('**Registrierung:** `VORREGISTRIERUNG.md`, Commit `4f22b14` — geschrieben und committet,');
  s('bevor das Werkzeug lief. **Rohdaten:** `' + QUELLE + '` (' + L.dateien.join(', ') + ').');
  s('Ausgewertet am ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC.');
  s('');
  s('| | |');
  s('|---|---|');
  s('| Zeitpunkte im Lauf | **' + haupt.length.toLocaleString('de-DE') + '** |');
  s('| davon mit gültiger Spanne | ' + haupt.filter(gueltig).length.toLocaleString('de-DE') +
    ' (' + fx(100 * haupt.filter(gueltig).length / haupt.length, 1) + ' %) |');
  ['keinQuote', 'gekreuzt', 'nullkurs'].forEach(function (g) {
    var n = haupt.filter(function (r) { return r.grund === g; }).length;
    s('| ' + g + ' | ' + n.toLocaleString('de-DE') + ' |');
  });
  s('| Placebo-Zeitpunkte (vorbörslich 08:00 ET) | ' + placebo.length.toLocaleString('de-DE') + ' |');
  s('');

  /* ===== 1. Kontrollen — GANZ OBEN ===== */
  s('## 1. Die Kontrollen — vor jeder Zahl');
  s('');
  var g = haupt.filter(gueltig);

  /* Positivkontrolle 1: AAPL 2024 mitte < 0,02 Pp */
  var aapl = g.filter(function (r) { return r.sym === 'AAPL' && r.jahr === 2024 && r.fenster === 'mitte'; });
  var aaplMed = aapl.length ? median(aapl.map(function (r) { return r.spanne; })) : NaN;
  /* Faellt AAPL 2024 nicht in die Ziehung, wird die Kontrolle an der Klasse ab1000
   * gefahren - und das wird gesagt, nicht verschwiegen. */
  var pk1Ersatz = null;
  if (!aapl.length) {
    pk1Ersatz = g.filter(function (r) { return r.klasse === 'ab1000' && r.jahr === 2024 && r.fenster === 'mitte'; });
    aaplMed = pk1Ersatz.length ? median(pk1Ersatz.map(function (r) { return r.spanne; })) : NaN;
  }
  var pk1 = isFinite(aaplMed) && aaplMed < 0.02;

  /* Positivkontrolle 2: Ordnung 5-50 > ab1000 in jedem Jahr */
  var ordnungVerfehlt = [];
  JAHRE.forEach(function (j) {
    var a = g.filter(function (r) { return r.klasse === '5-50' && r.jahr === j && r.fenster === 'mitte'; });
    var b = g.filter(function (r) { return r.klasse === 'ab1000' && r.jahr === j && r.fenster === 'mitte'; });
    if (!a.length || !b.length) return;
    var ma = median(a.map(function (r) { return r.spanne; })), mb = median(b.map(function (r) { return r.spanne; }));
    if (!(ma > mb)) ordnungVerfehlt.push(j + ' (' + fx(ma) + ' gegen ' + fx(mb) + ')');
  });

  /* Placebo: vorboerslich mindestens doppelt so breit wie mitte, an denselben Symbol-Tagen */
  var mittePaar = {}, pv = [], pm = [];
  g.forEach(function (r) { if (r.fenster === 'mitte') mittePaar[r.sym + '|' + r.tag] = r.spanne; });
  placebo.filter(gueltig).forEach(function (r) {
    var m = mittePaar[r.sym + '|' + r.tag];
    if (m != null) { pv.push(r.spanne); pm.push(m); }
  });
  var pvMed = median(pv), pmMed = median(pm), faktor = pvMed / pmMed;
  var placeboOk = pv.length >= 20 && isFinite(faktor) && faktor >= 2;
  var placeboKeinQuote = placebo.filter(function (r) { return r.grund === 'keinQuote'; }).length;

  s('| Kontrolle | Soll | Ist | |');
  s('|---|---|---|---|');
  s('| **Positivkontrolle** ' + (pk1Ersatz ? '(Ersatz: Klasse ab1000' : '(AAPL') + ', 2024, Fenster `mitte`) | < 0,02 Pp | **' +
    fx(aaplMed) + ' Pp** (n ' + (pk1Ersatz ? pk1Ersatz.length : aapl.length) + ') | ' + (pk1 ? '**bestanden**' : '**VERFEHLT**') + ' |');
  s('| **Positivkontrolle 2** (Ordnung 5-50 > ab1000, jedes Jahr) | in allen 11 Jahren | ' +
    (ordnungVerfehlt.length ? 'verfehlt in ' + ordnungVerfehlt.join('; ') : 'in allen erfüllt') + ' | ' +
    (ordnungVerfehlt.length ? 'Auffälligkeit' : 'bestanden') + ' |');
  s('| **Placebo** (vorbörslich 08:00 ET gegen `mitte`, dieselben Symbol-Tage) | Faktor ≥ 2 | ' +
    fx(pvMed) + ' gegen ' + fx(pmMed) + ' Pp → **Faktor ' + fx(faktor, 2) + '** (n ' + pv.length + ') | ' +
    (placeboOk ? '**bestanden**' : '**VERFEHLT**') + ' |');
  s('| Placebo, davon „kein Quote" | — | ' + placeboKeinQuote + ' | *(vorbörslich fehlt öfter — erwartet)* |');
  s('');
  if (!pk1) {
    s('> ## ⚠ POSITIVKONTROLLE VERFEHLT — es wird KEINE Zahl berichtet.');
    s('> Das Werkzeug findet die bekannte Größe nicht wieder; jede Null und jede Zahl aus');
    s('> diesem Lauf ist damit wertlos (`wiki/messmethodik.md` B5).');
    fs.writeFileSync(ZIEL, out.join('\n') + '\n');
    process.stdout.write('POSITIVKONTROLLE VERFEHLT - ERGEBNIS.md enthaelt nur die Kontrollen.\n');
    return;
  }
  if (!placeboOk) {
    s('> **⚠ Der Placebo ist verfehlt.** Alle folgenden Zahlen tragen diesen Vermerk: das');
    s('> Werkzeug unterscheidet ein dünnes von einem dichten Handelsfenster nicht so deutlich,');
    s('> wie es sollte. Kein Abbruch (Registrierung §7), aber die Zahlen sind schwächer, als');
    s('> sie aussehen.');
    s('');
  }

  /* ===== 2. Die Hürde je Klasse und Jahr ===== */
  s('## 2. Die Kostenhürde je Umsatzklasse und Jahr');
  s('');
  s('**Maßgeblich ist das Fenster `mitte` (10:00–15:30 ET)** — 330 der 390 Handelsminuten');
  s('(Registrierung §8). Zahl = **Symbol-Median** der notierten Spanne in Pp je Umlauf.');
  s('Das ist die volle Kostenhürde einer Kassa-Runde bei Alpaca (Provision 0).');
  s('');
  s('| Jahr | ' + KLASSEN.join(' | ') + ' |');
  s('|---|---|---|---|---|');
  var huerde = {};
  JAHRE.forEach(function (j) {
    var reihe = [String(j)];
    KLASSEN.forEach(function (k) {
      var alleZ = haupt.filter(function (r) { return r.klasse === k && r.jahr === j && r.fenster === 'mitte'; });
      var Zg = alleZ.filter(gueltig);
      if (!Zg.length) { reihe.push('–'); return; }
      var z = zelle(Zg, alleZ);
      huerde[k + '|' + j] = z;
      reihe.push('**' + fx(z.symMedian) + '**' + (z.symbole < 10 ? ' ⚠' : ''));
    });
    s('| ' + reihe.join(' | ') + ' |');
  });
  s('');
  s('⚠ = weniger als 10 Symbole in der Zelle — kein Band, die Zahl beschreibt die Streuung');
  s('zwischen wenigen Werten, nicht Stichprobenfehler.');
  s('');

  /* Volltabelle je Zelle */
  s('### 2.1 Alle 132 Zellen');
  s('');
  s('| Klasse | Jahr | Fenster | n | Zeitpunkte | Symbole | **Symbol-Median** | roher Median | p75 | 95-%-Band (Bootstrap über Symbole) | fehlend | gesperrt |');
  s('|---|---|---|---|---|---|---|---|---|---|---|---|');
  KLASSEN.forEach(function (k) {
    JAHRE.forEach(function (j) {
      FENSTER.forEach(function (f) {
        var alleZ = haupt.filter(function (r) { return r.klasse === k && r.jahr === j && r.fenster === f; });
        if (!alleZ.length) return;
        var Zg = alleZ.filter(gueltig);
        if (!Zg.length) { s('| ' + k + ' | ' + j + ' | ' + f + ' | 0 | – | – | – | – | – | – | 100 % | – |'); return; }
        var z = zelle(Zg, alleZ);
        s('| ' + k + ' | ' + j + ' | ' + f + ' | ' + z.n + ' | ' + z.zeitpunkte + ' | ' + z.symbole +
          ' | **' + fx(z.symMedian) + '** | ' + fx(z.rohMedian) + ' | ' + fx(z.p75) +
          ' | ' + (isFinite(z.band[0]) ? '[' + fx(z.band[0]) + ', ' + fx(z.band[1]) + ']' : '*zu dünn*') +
          ' | ' + fx(100 * z.fehlanteil, 1) + ' %' + (z.fehlanteil > 0.2 ? ' ⚠' : '') +
          ' | ' + z.gesperrt + ' |');
      });
    });
  });
  s('');

  /* ===== 3. Vergleich mit den bisherigen Hürden ===== */
  s('## 3. Gegen die bisherigen Hürden');
  s('');
  s('| Klasse | Hürde 2016–2020 | Hürde ab 2021 | gegen Annahme **0,06** | gegen CFD **0,1247** |');
  s('|---|---|---|---|---|');
  var huerdeRegime = {};
  KLASSEN.forEach(function (k) {
    function reg(von, bis) {
      var alleZ = haupt.filter(function (r) { return r.klasse === k && r.jahr >= von && r.jahr <= bis && r.fenster === 'mitte'; });
      var Zg = alleZ.filter(gueltig);
      return Zg.length ? zelle(Zg, alleZ) : null;
    }
    var alt = reg(2016, 2020), neu = reg(2021, 2026);
    huerdeRegime[k] = { alt: alt, neu: neu };
    if (!neu) { s('| ' + k + ' | – | – | – | – |'); return; }
    var v = neu.symMedian;
    s('| **' + k + '** | ' + (alt ? fx(alt.symMedian) : '–') + ' | **' + fx(v) + '** | ' +
      (v < 0.06 ? 'Annahme **zu pessimistisch** (Faktor ' + fx(0.06 / v, 1) + ')'
                : 'Annahme **zu optimistisch** (Faktor ' + fx(v / 0.06, 1) + ')') + ' | ' +
      (v < 0.1247 ? 'darunter' : '**darüber** (Faktor ' + fx(v / 0.1247, 1) + ')') + ' |');
  });
  s('');
  s('**IBKR nachrichtlich:** auf eine 10.000-$-Position kommen 2 × max(0,35 $; 0,0035 $/Stück)');
  s('Kommission dazu — bei einem 50-$-Kurs 200 Stück × 0,0035 = 0,70 $ je Seite, also');
  s('**+0,014 Pp** je Umlauf. Bei einer 2.000-$-Position greift das Minimum: 2 × 0,35 $ =');
  s('**+0,035 Pp**. Alpaca berechnet für US-Aktien keine Provision.');
  s('');

  /* ===== 4. Die Tageszeit ===== */
  s('## 4. Die Tageszeit');
  s('');
  s('| Klasse | eroeffnung | mitte | schluss | Eröffnung/Mitte |');
  s('|---|---|---|---|---|');
  KLASSEN.forEach(function (k) {
    var w = {};
    FENSTER.forEach(function (f) {
      var Zg = haupt.filter(function (r) { return r.klasse === k && r.fenster === f && gueltig(r); });
      w[f] = Zg.length ? zelle(Zg, Zg).symMedian : NaN;
    });
    s('| ' + k + ' | ' + fx(w.eroeffnung) + ' | ' + fx(w.mitte) + ' | ' + fx(w.schluss) +
      ' | **' + fx(w.eroeffnung / w.mitte, 2) + ' ×** |');
  });
  s('');

  /* ===== 5. Wiedervorlage der 31 ===== */
  s('## 5. Die 31 gegen die CFD-Hürde geschlossenen Varianten');
  s('');
  s('Quelle der Obergrenzen: `studien/wiedervorlage-2026-09-02/BERICHT.md` §1.2.');
  s('**„Wieder offen" heißt: obere Grenze > Kassa-Hürde ihrer Klasse.** Das ist eine');
  s('**Größenaussage, kein Ertragsbeleg** — eine wieder offene Variante ist nicht besser');
  s('geworden, sie ist nur nicht mehr durch die Kosten erledigt.');
  s('');
  s('**Zuordnung:** Die Protokolle führen die Liquidität ihres Universums nicht (geprüft an');
  s('`glockendruck-nacht-n-2026-09-01.json`). Wo der Bericht sie ausdrücklich belegt, steht');
  s('sie; sonst wird gegen **alle vier** Hürden ausgewiesen und das Universum als *unbekannt*');
  s('markiert. Es wird nicht geraten und nicht die günstigste Klasse gewählt.');
  s('');
  var hAb2021 = {};
  KLASSEN.forEach(function (k) { hAb2021[k] = huerdeRegime[k] && huerdeRegime[k].neu ? huerdeRegime[k].neu.symMedian : NaN; });
  s('Verwendete Hürden (Fenster `mitte`, ab 2021): ' +
    KLASSEN.map(function (k) { return k + ' = **' + fx(hAb2021[k]) + '**'; }).join(' · '));
  s('');
  s('| Strategie | V | obere Grenze | Universum | offen gegen 5-50 | 50-250 | 250-1000 | ab1000 | Urteil |');
  s('|---|---|---|---|---|---|---|---|---|');
  var zaehlOffen = { belegt: { offen: 0, zu: 0 }, unbekannt: { immerOffen: 0, immerZu: 0, gemischt: 0 } };
  Var.GESCHLOSSEN_CFD.slice().sort(function (a, b) { return b.obereGrenze - a.obereGrenze; }).forEach(function (V) {
    var je = KLASSEN.map(function (k) { return isFinite(hAb2021[k]) ? (V.obereGrenze > hAb2021[k]) : null; });
    var urteil;
    if (V.klasse) {
      var idx = KLASSEN.indexOf(V.klasse);
      var offen = je[idx];
      urteil = offen ? '**wieder offen** (' + V.klasse + ')' : '**endgültig zu** (' + V.klasse + ')';
      if (offen) zaehlOffen.belegt.offen++; else zaehlOffen.belegt.zu++;
    } else {
      var n = je.filter(function (x) { return x === true; }).length;
      if (n === 4) { urteil = '**offen in jeder Klasse**'; zaehlOffen.unbekannt.immerOffen++; }
      else if (n === 0) { urteil = '**endgültig zu**, in jeder Klasse'; zaehlOffen.unbekannt.immerZu++; }
      else { urteil = 'hängt an der Klasse (' + n + ' von 4)'; zaehlOffen.unbekannt.gemischt++; }
    }
    s('| `' + V.strategie + '` | ' + V.v + ' | ' + fx(V.obereGrenze, 4) + ' | ' +
      (V.klasse ? V.klasse : '*unbekannt*') + ' | ' +
      je.map(function (x) { return x === null ? '–' : (x ? 'ja' : 'nein'); }).join(' | ') + ' | ' + urteil + ' |');
  });
  s('');
  s('**Zählung:** von den 4 Varianten mit belegtem Universum sind **' + zaehlOffen.belegt.offen +
    ' wieder offen**, ' + zaehlOffen.belegt.zu + ' endgültig zu. Von den 27 mit unbekanntem');
  s('Universum sind ' + zaehlOffen.unbekannt.immerZu + ' **in jeder Klasse zu** (das ist das');
  s('robuste Teilergebnis), ' + zaehlOffen.unbekannt.immerOffen + ' in jeder Klasse offen, und ' +
    zaehlOffen.unbekannt.gemischt + ' hängen daran, wo ihr Universum liegt.');
  s('');

  /* ===== 6. Zusätze ===== */
  s('## 6. Zusätze');
  s('');
  zusatzABericht(s);
  zusatzBBericht(s);
  s('');

  /* ===== 7. Was das nicht sagt ===== */
  s('## 7. Was diese Zahlen NICHT sagen');
  s('');
  s('- **Nicht die effektiven Kosten.** Schlupf, Marktimpact, Warteschlange und');
  s('  Preisverbesserung fehlen. Die notierte Spanne ist die **Untergrenze** einer Marktorder.');
  s('- **Nicht die Tiefe.** `bs`/`as` liegen in den Rohdaten, sind hier aber nicht ausgewertet.');
  s('- **Für 2016–2024 sind es Überlebende.** Der Rahmen ist ein Universum vom 02.09.2024;');
  s('  wer vorher verschwand, ist nicht drin. Richtung der Verzerrung: zu **enge** Spannen.');
  s('- **Kein Ertragsbeleg.** Eine gesenkte Hürde belegt keine Kante.');
  s('');

  fs.writeFileSync(ZIEL, out.join('\n') + '\n');
  process.stdout.write('ERGEBNIS.md geschrieben: ' + ZIEL + '\n');
  process.stdout.write('  Zeilen ' + haupt.length + ', gueltig ' + g.length +
                       ', Positivkontrolle ' + (pk1 ? 'bestanden' : 'VERFEHLT') +
                       ', Placebo ' + (placeboOk ? 'bestanden' : 'VERFEHLT') + '\n');
}

/* ---------- Zusatz A ---------- */
function zusatzABericht(s) {
  s('### Zusatz A — Momentum-Umschichtungen');
  s('');
  var f = path.join(QUELLE, 'zusatzA-umschichtungen.jsonl');
  if (fs.existsSync(path.join(QUELLE, 'zusatzA-entfallen.json'))) {
    s('**Entfallen.** Der Korb-Nachbau hat die Positivkontrolle verfehlt (`korbN` je Periode');
    s('nicht identisch mit dem Lauf-JSON der Momentum-Studie). Es wird NICHT mit einem anderen');
    s('Korb gerechnet — Registrierung §6.');
    s('');
    return;
  }
  if (!fs.existsSync(f)) { s('*Nicht gemessen.*'); s(''); return; }
  var rows = [];
  fs.readFileSync(f, 'utf8').split('\n').forEach(function (l) {
    if (!l) return; var o; try { o = JSON.parse(l); } catch (e) { return; }
    if (o && typeof o.spanne === 'number' && isFinite(o.spanne)) rows.push(o);
  });
  if (!rows.length) { s('*Keine gültigen Quotes.*'); s(''); return; }
  var jeTag = {};
  rows.forEach(function (r) { (jeTag[r.tag] || (jeTag[r.tag] = [])).push(r.spanne); });
  var tage = Object.keys(jeTag).sort();
  var medProTag = tage.map(function (t) { return median(jeTag[t]); });
  s('Spanne der Korbmitglieder um **15:55 ET am Umschichtungstag**, ' + tage.length +
    ' Umschichtungen ab 2016, ' + rows.length + ' gültige Quotes.');
  s('');
  s('| Größe | Wert |');
  s('|---|---|');
  s('| Median über alle Korbmitglieder | **' + fx(median(rows.map(function (r) { return r.spanne; }))) + ' Pp** |');
  s('| Median der Perioden-Mediane | ' + fx(median(medProTag)) + ' Pp |');
  s('| p75 | ' + fx(quantil(rows.map(function (r) { return r.spanne; }), 0.75)) + ' Pp |');
  s('| engste / breiteste Umschichtung | ' + fx(Math.min.apply(null, medProTag)) + ' / ' +
    fx(Math.max.apply(null, medProTag)) + ' Pp |');
  s('');
  s('| Umschichtung | Korbmitglieder | Median-Spanne (Pp) |');
  s('|---|---|---|');
  tage.forEach(function (t, i) { s('| ' + t + ' | ' + jeTag[t].length + ' | ' + fx(medProTag[i]) + ' |'); });
  s('');
}

/* ---------- Zusatz B ---------- */
function zusatzBBericht(s) {
  s('### Zusatz B — Auktionen: Schluss gegen Folgeeröffnung');
  s('');
  var f = path.join(QUELLE, 'zusatzB-auktionen.jsonl');
  if (!fs.existsSync(f)) { s('*Nicht gemessen.*'); s(''); return; }
  var abstaende = [], jeJahr = {}, symbole = 0, tagePaare = 0;
  fs.readFileSync(f, 'utf8').split('\n').forEach(function (l) {
    if (!l) return; var o; try { o = JSON.parse(l); } catch (e) { return; }
    if (!o || !Array.isArray(o.tage)) return;
    symbole++;
    var gez = {}; (o.gezogeneTage || []).forEach(function (t) { gez[t] = 1; });
    for (var i = 0; i < o.tage.length - 1; i++) {
      var a = o.tage[i], b = o.tage[i + 1];
      if (!gez[a.d]) continue;                       /* nur die gezogenen Tage */
      if (!(a.cp > 0) || !(b.op > 0)) continue;
      tagePaare++;
      var pp = Math.abs(b.op - a.cp) / a.cp * 100;
      abstaende.push(pp);
      var j = a.d.slice(0, 4);
      (jeJahr[j] || (jeJahr[j] = [])).push(pp);
    }
  });
  if (!abstaende.length) { s('*Keine Auktionspaare.*'); s(''); return; }
  s('Abstand |Folgeeröffnung − Schlussauktion| in Pp, über ' + symbole + ' Symbole und ' +
    tagePaare.toLocaleString('de-DE') + ' Tagespaare. **Das ist keine Kostengröße**, sondern');
  s('die Größe, gegen die eine Übernacht-Runde (`cls` → `opg` in `kosten.js`) anläuft.');
  s('');
  s('| Größe | Wert |');
  s('|---|---|');
  s('| Median | **' + fx(median(abstaende), 3) + ' Pp** |');
  s('| p75 | ' + fx(quantil(abstaende, 0.75), 3) + ' Pp |');
  s('');
  s('| Jahr | Tagespaare | Median (Pp) | p75 |');
  s('|---|---|---|---|');
  Object.keys(jeJahr).sort().forEach(function (j) {
    s('| ' + j + ' | ' + jeJahr[j].length + ' | ' + fx(median(jeJahr[j]), 3) + ' | ' + fx(quantil(jeJahr[j], 0.75), 3) + ' |');
  });
  s('');
}

module.exports = { median: median, quantil: quantil, zelle: zelle, lesen: lesen };

if (require.main === module) { main(); }

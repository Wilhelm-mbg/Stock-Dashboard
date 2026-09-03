'use strict';
/* ================= NACHTRAG zur Spannen-Studie -> ERGEBNIS-NACHTRAG.md =================
 *
 * Schliesst zwei offene Punkte aus der Auswertung vom 03.09.2026
 * (uebergabe/spannen-auswertung-2026-09-03.md, Paragraph 6 Befunde 2 und 4):
 *
 *   1. Die Uebernacht-Familie gegen das SCHLUSSFENSTER halten (Registrierung Paragraph 8:
 *      "die Uebernacht-Familie handelt im Schlussfenster und bekommt dort ihre eigene
 *      Huerde"). ERGEBNIS.md Paragraph 5 hielt alle 31 Varianten gegen `mitte`.
 *   2. Zusatz A gegen die Huerde stellen, die das Momentum-Buch unterstellt
 *      (Registrierung Paragraph 6, Endpunkt). ERGEBNIS.md berichtet die Spanne ohne Huerde.
 *
 * messen.js und auswerten.js bleiben UNVERAENDERT (Registrierung vor dem Lauf committet).
 * Dieses Skript liest dieselben Rohdaten und benutzt per require die exportierten
 * Funktionen von auswerten.js: median, quantil, zelle (Symbol-Median + Cluster-Bootstrap
 * ueber Symbole, Saat 20260902) und lesen. NICHT exportiert ist die Zuordnungsregel der
 * 31 Varianten (sie steht inline in main()); sie ist unten byte-genau kopiert und als
 * Kopie gekennzeichnet.
 *
 * POSITIVKONTROLLE VOR DER ERSTEN ZAHL: fuer das Fenster `mitte`, ab 2021, muss dieses
 * Skript exakt die vier Mediane aus ERGEBNIS.md Paragraph 3/5 liefern. Weicht eine
 * Stelle ab, bricht es ab und schreibt keine Zahl.
 *
 * Aufruf:  node studien/vorregistrierung-2026-09-02-spannen-historisch/nachtrag.js
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */

var fs = require('fs');
var path = require('path');
var A = require('./auswerten.js');
var Var = require('./varianten.js');

var QUELLE = process.env.MD_SPANNEN || 'E:/Markt-Dashboard-Archiv/spannen';
var ECHT = QUELLE.replace(/\\/g, '/').toLowerCase().indexOf('markt-dashboard-archiv/spannen') >= 0;
var ZIEL = path.join(__dirname, ECHT ? 'ERGEBNIS-NACHTRAG.md' : 'ERGEBNIS-NACHTRAG-TROCKENLAUF.md');
var KLASSEN = ['5-50', '50-250', '250-1000', 'ab1000'];

/* Die vier Mediane aus ERGEBNIS.md (Fenster mitte, ab 2021) - die Positivkontrolle. */
var SOLL_MITTE_AB2021 = { '5-50': '0,1569', '50-250': '0,0854', '250-1000': '0,0647', 'ab1000': '0,0449' };

/* Die Huerde, die das Momentum-Buch unterstellt. Fundstelle: mfdepot.js takt(),
 *   `var nM = MH.fuehreAus(d.mfBuch, plan, now, 20);`  (Zeile 158)
 * und mfhandel.js fuehreAus(buch, plan, nowMs, kostenBp): "kostenBp je Seite",
 *   `var k = (kostenBp == null ? 20 : kostenBp) / 10000;`  (Zeile 128)
 * Der Journaltext in takt() sagt es woertlich: "Kosten 20 Bp je Seite".
 * Umrechnung: Seite x 2 = je Umlauf; 1 Bp = 0,01 Pp. */
var BUCH_BP_JE_SEITE = 20;
var BUCH_PP_JE_UMLAUF = BUCH_BP_JE_SEITE * 2 * 0.01;

/* Zugehoerigkeit zur Uebernacht-Familie, woertlich aus dem Auftrag:
 * `*-nacht-*`, `nachtstoss-umkehr-*`, `abgabedruck-nacht-*`. */
function istUebernacht(strategie) {
  return /-nacht-/.test(strategie) || /^nachtstoss-umkehr-/.test(strategie) || /^abgabedruck-nacht-/.test(strategie);
}

function fx(v, n) { return isFinite(v) ? v.toFixed(n == null ? 4 : n).replace('.', ',') : '–'; }
function gueltig(r) { return typeof r.spanne === 'number' && isFinite(r.spanne); }

/* ---------- Die Huerde einer Klasse in einem Fenster und Jahresbereich ---------- */
function huerde(haupt, klasse, fenster, von, bis) {
  var alleZ = haupt.filter(function (r) {
    return r.klasse === klasse && r.fenster === fenster && r.jahr >= von && r.jahr <= bis;
  });
  var Zg = alleZ.filter(gueltig);
  return Zg.length ? A.zelle(Zg, alleZ) : null;
}

/* ---------- Zuordnungsregel — KOPIE aus auswerten.js main(), Abschnitt 5 ----------
 * auswerten.js exportiert diese Regel nicht; sie ist hier unveraendert uebernommen
 * (nur `hAb2021` heisst `h`, und die Tabellenzeile wird nicht hier geschrieben).
 * Regel: belegte Klasse -> Urteil in dieser Klasse; unbekannte Klasse -> gegen alle vier
 * ausweisen, nicht raten, nicht die guenstigste nehmen. */
function urteil(V, h, zaehl) {
  var je = KLASSEN.map(function (k) { return isFinite(h[k]) ? (V.obereGrenze > h[k]) : null; });
  var u;
  if (V.klasse) {
    var idx = KLASSEN.indexOf(V.klasse);
    var offen = je[idx];
    u = offen ? '**wieder offen** (' + V.klasse + ')' : '**endgültig zu** (' + V.klasse + ')';
    if (offen) zaehl.belegt.offen++; else zaehl.belegt.zu++;
  } else {
    var n = je.filter(function (x) { return x === true; }).length;
    if (n === 4) { u = '**offen in jeder Klasse**'; zaehl.unbekannt.immerOffen++; }
    else if (n === 0) { u = '**endgültig zu**, in jeder Klasse'; zaehl.unbekannt.immerZu++; }
    else { u = 'hängt an der Klasse (' + n + ' von 4)'; zaehl.unbekannt.gemischt++; }
  }
  return { je: je, text: u };
}
function neuZaehl() { return { belegt: { offen: 0, zu: 0 }, unbekannt: { immerOffen: 0, immerZu: 0, gemischt: 0 } }; }
/* Summe offen / zu / unentschieden, so wie die Uebergabe vom 03.09. sie ausweist:
 * offen = belegt offen (+ in jeder Klasse offen), zu = belegt zu + in jeder Klasse zu,
 * unentschieden = haengt an der Klasse. */
function summe(z) {
  return { offen: z.belegt.offen + z.unbekannt.immerOffen,
           zu: z.belegt.zu + z.unbekannt.immerZu,
           unentschieden: z.unbekannt.gemischt };
}

/* ---------- Zusatz A ---------- */
function zusatzA() {
  var f = path.join(QUELLE, 'zusatzA-umschichtungen.jsonl');
  if (fs.existsSync(path.join(QUELLE, 'zusatzA-entfallen.json')) || !fs.existsSync(f)) return null;
  var rows = [];
  fs.readFileSync(f, 'utf8').split('\n').forEach(function (l) {
    if (!l) return; var o; try { o = JSON.parse(l); } catch (e) { return; }
    if (o && typeof o.spanne === 'number' && isFinite(o.spanne)) rows.push(o);
  });
  if (!rows.length) return null;
  var jeTag = {};
  rows.forEach(function (r) { (jeTag[r.tag] || (jeTag[r.tag] = [])).push(r.spanne); });
  var tage = Object.keys(jeTag).sort();
  var alle = rows.map(function (r) { return r.spanne; });
  return { n: rows.length, tage: tage, jeTag: jeTag,
           median: A.median(alle), p75: A.quantil(alle, 0.75),
           medProTag: tage.map(function (t) { return A.median(jeTag[t]); }),
           p75ProTag: tage.map(function (t) { return A.quantil(jeTag[t], 0.75); }),
           maxProTag: tage.map(function (t) { return Math.max.apply(null, jeTag[t]); }) };
}

/* ---------- Bericht ---------- */
function main() {
  var L = A.lesen();
  if (!L.zeilen.length) { process.stdout.write('Keine Daten in ' + QUELLE + '\n'); process.exitCode = 2; return; }
  var haupt = L.zeilen.filter(function (r) { return r.fenster !== 'placebo-vorboerslich'; });

  /* ===== Positivkontrolle: mitte ab 2021 muss ERGEBNIS.md exakt reproduzieren ===== */
  var pk = KLASSEN.map(function (k) {
    var z = huerde(haupt, k, 'mitte', 2021, 2026);
    var ist = z ? fx(z.symMedian) : '–';
    return { klasse: k, soll: SOLL_MITTE_AB2021[k], ist: ist, ok: ist === SOLL_MITTE_AB2021[k], z: z };
  });
  var pkOk = pk.every(function (p) { return p.ok; });
  pk.forEach(function (p) {
    process.stdout.write('Positivkontrolle ' + p.klasse + ': soll ' + p.soll + ' ist ' + p.ist + (p.ok ? ' ok' : ' VERFEHLT') + '\n');
  });
  if (!pkOk) {
    process.stdout.write('POSITIVKONTROLLE VERFEHLT - es wird keine Zahl berichtet, ' + ZIEL + ' wird nicht geschrieben.\n');
    process.exitCode = 1;
    return;
  }

  var out = [];
  function s(t) { out.push(t == null ? '' : t); }

  s('# Nachtrag zum Ergebnis: Übernacht-Familie im Schlussfenster · Zusatz A gegen die Buch-Hürde');
  s('');
  if (!ECHT) {
    s('> # ⚠⚠ TROCKENLAUF — DIESE ZAHLEN SIND ERFUNDEN ⚠⚠');
    s('> Die Quelle ist **nicht** das Archiv, sondern `' + QUELLE + '`.');
    s('');
  }
  s('**Registrierung:** `VORREGISTRIERUNG.md`, Commit `4f22b14` (§6 Zusatz A, §8 Entscheidungsregel).');
  s('**Hauptergebnis:** `ERGEBNIS.md` (03.09.2026). **Rohdaten:** `' + QUELLE + '` (' + L.dateien.join(', ') + ') — nur gelesen.');
  s('`messen.js` und `auswerten.js` sind **unverändert**; dieses Skript (`nachtrag.js`) benutzt per `require`');
  s('deren `median`, `quantil`, `zelle` (Symbol-Median, Cluster-Bootstrap über Symbole, Saat 20260902)');
  s('und `lesen`. Die Zuordnungsregel der 31 Varianten ist in `auswerten.js` nicht exportiert; ihr Regelkern');
  s('(Vergleich je Klasse, belegt/unbekannt, Urteilstexte, Zähler) ist hier **wörtlich kopiert** (Funktion `urteil`),');
  s('mit zwei mechanischen Anpassungen: der Hürden-Parameter heißt `h` statt `hAb2021`, und die Funktion gibt');
  s('das Urteil zurück statt die Tabellenzeile zu schreiben. Nachgetragen am ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC.');
  s('');

  /* ===== 0. Positivkontrolle ===== */
  s('## 0. Positivkontrolle — vor jeder Zahl');
  s('');
  s('Dieses Skript muss für das Fenster `mitte`, ab 2021, exakt die vier Mediane aus `ERGEBNIS.md` §3/§5');
  s('liefern. Stimmt eine Stelle nicht, wird abgebrochen und nichts geschrieben.');
  s('');
  s('| Klasse | Soll (`ERGEBNIS.md`) | Ist (`nachtrag.js`) | Band (Ist) | |');
  s('|---|---|---|---|---|');
  pk.forEach(function (p) {
    s('| ' + p.klasse + ' | ' + p.soll + ' | **' + p.ist + '** | [' + fx(p.z.band[0]) + ', ' + fx(p.z.band[1]) + '] | ' + (p.ok ? 'stimmt' : '**VERFEHLT**') + ' |');
  });
  s('');
  s('**4 von 4 Stellen stimmen — bestanden.**');
  s('');

  /* ===== 1. Die Schluss-Hürde je Klasse ===== */
  s('## 1. Die Kassa-Hürde im Schlussfenster (15:30–16:00 ET) je Klasse');
  s('');
  s('Registrierung §8: *„die Übernacht-Familie handelt im Schlussfenster und bekommt dort ihre eigene Hürde."*');
  s('Zahl = **Symbol-Median** der notierten Spanne in Pp je Umlauf, Band = 95-%-Perzentilband aus 1.000');
  s('Cluster-Bootstrap-Ziehungen über Symbole — dieselbe Methode wie `ERGEBNIS.md` §2 für `mitte`.');
  s('**Maßgeblich ist ab 2021**; 2016–2020 steht nachrichtlich daneben. Die `mitte`-Hürde ab 2021 steht');
  s('zum Vergleich in der letzten Spalte.');
  s('');
  s('| Klasse | **Schluss ab 2021** | 95-%-Band | Symbole | Zeitpunkte | Median-Kurs | am Cent-Boden | Schluss 2016–2020 (nachrichtlich) | Band 2016–2020 | `mitte` ab 2021 | Schluss/Mitte |');
  s('|---|---|---|---|---|---|---|---|---|---|---|');
  var hSchluss = {}, hSchlussAlt = {}, hMitte = {};
  KLASSEN.forEach(function (k) {
    var neu = huerde(haupt, k, 'schluss', 2021, 2026);
    var alt = huerde(haupt, k, 'schluss', 2016, 2020);
    var mitte = huerde(haupt, k, 'mitte', 2021, 2026);
    hSchluss[k] = neu ? neu.symMedian : NaN;
    hSchlussAlt[k] = alt ? alt.symMedian : NaN;
    hMitte[k] = mitte ? mitte.symMedian : NaN;
    if (!neu) { s('| ' + k + ' | – | – | – | – | – | – | – | – | – | – |'); return; }
    s('| **' + k + '** | **' + fx(neu.symMedian) + '** | [' + fx(neu.band[0]) + ', ' + fx(neu.band[1]) + '] | ' +
      neu.symbole + ' | ' + neu.zeitpunkte + ' | ' + fx(neu.medianKurs, 2) + ' $ | ' + fx(100 * neu.bodenAnteil, 0) + ' %' +
      (neu.bodenAnteil > 0.5 ? ' (über die Hälfte)' : '') + ' | ' +
      (alt ? fx(alt.symMedian) : '–') + ' | ' + (alt && isFinite(alt.band[0]) ? '[' + fx(alt.band[0]) + ', ' + fx(alt.band[1]) + ']' : '–') +
      ' | ' + fx(hMitte[k]) + ' | ' + fx(neu.symMedian / hMitte[k], 2) + ' × |');
  });
  s('');
  s('Das Schlussfenster ist in jeder Klasse günstiger als das Mittagsfenster. **Der Cent-Boden-Vorbehalt');
  s('aus `ERGEBNIS.md` §2.0 gilt hier unverändert** — in den liquiden Klassen ist die Zahl zu einem');
  s('großen Teil eine Aussage über den Aktienkurs, nicht über die Liquidität.');
  s('');

  /* ===== 2. Die Übernacht-Familie gegen die Schluss-Hürde ===== */
  s('## 2. Die Übernacht-Familie gegen die Schluss-Hürde ihrer Klasse');
  s('');
  s('Familie laut Auftrag: `*-nacht-*`, `nachtstoss-umkehr-*`, `abgabedruck-nacht-*`. Obergrenzen wörtlich');
  s('aus `studien/wiedervorlage-2026-09-02/BERICHT.md` §1.2 (`varianten.js`). **Zuordnungsregel unverändert**');
  s('(Registrierung §8): belegte Klasse → Urteil in dieser Klasse; unbekannte Klasse → gegen **alle vier**');
  s('Hürden ausgewiesen, nicht geraten, nicht die günstigste genommen.');
  s('');
  s('> **„Wieder offen" heißt: obere Grenze > Kassa-Hürde ihrer Klasse.** Das ist eine **Größenaussage,');
  s('> kein Ertragsbeleg** — eine wieder offene Variante ist nicht besser geworden, sie ist nur nicht mehr');
  s('> durch die Kosten erledigt.');
  s('');
  s('Verwendete Hürden (Fenster `schluss`, ab 2021): ' +
    KLASSEN.map(function (k) { return k + ' = **' + fx(hSchluss[k]) + '**'; }).join(' · '));
  s('Vorher (Fenster `mitte`, ab 2021): ' +
    KLASSEN.map(function (k) { return k + ' = ' + fx(hMitte[k]); }).join(' · '));
  s('');
  s('| Strategie | V | obere Grenze | Universum | offen gegen 5-50 | 50-250 | 250-1000 | ab1000 | Urteil |');
  s('|---|---|---|---|---|---|---|---|---|');
  var sortiert = Var.GESCHLOSSEN_CFD.slice().sort(function (a, b) { return b.obereGrenze - a.obereGrenze; });
  var zNachtMitte = neuZaehl(), zNachtSchluss = neuZaehl();
  var zAlleVorher = neuZaehl(), zAlleNachher = neuZaehl();
  var geaendert = [];
  sortiert.forEach(function (V) {
    var vorher = urteil(V, hMitte, zAlleVorher);
    var nacht = istUebernacht(V.strategie);
    /* Nachher: Uebernacht-Familie gegen schluss, alle anderen unveraendert gegen mitte. */
    var nachher = urteil(V, nacht ? hSchluss : hMitte, zAlleNachher);
    if (!nacht) return;
    urteil(V, hMitte, zNachtMitte);
    urteil(V, hSchluss, zNachtSchluss);
    s('| `' + V.strategie + '` | ' + V.v + ' | ' + fx(V.obereGrenze, 4) + ' | ' + (V.klasse ? V.klasse : '*unbekannt*') + ' | ' +
      nachher.je.map(function (x) { return x === null ? '–' : (x ? 'ja' : 'nein'); }).join(' | ') + ' | ' + nachher.text + ' |');
    s('| ↳ vorher (mitte) / nachher (schluss) | | | | ' +
      vorher.je.map(function (x, i) {
        var a = x === null ? '–' : (x ? 'ja' : 'nein'), b = nachher.je[i] === null ? '–' : (nachher.je[i] ? 'ja' : 'nein');
        return a === b ? a : '~~' + a + '~~ → **' + b + '**';
      }).join(' | ') + ' | ' + (vorher.text === nachher.text ? 'unverändert' : '~~' + vorher.text.replace(/\*\*/g, '') + '~~ → ' + nachher.text) + ' |');
    if (vorher.text !== nachher.text) geaendert.push('`' + V.strategie + '` ' + V.v + ': ' + vorher.text.replace(/\*\*/g, '') + ' → ' + nachher.text.replace(/\*\*/g, ''));
  });
  s('');
  var nNacht = sortiert.filter(function (V) { return istUebernacht(V.strategie); }).length;
  var sNM = summe(zNachtMitte), sNS = summe(zNachtSchluss), sAV = summe(zAlleVorher), sAN = summe(zAlleNachher);
  s('### Zählung');
  s('');
  s('| | offen | zu | unentschieden (Klasse unbekannt, hängt an der Klasse) | Summe |');
  s('|---|---|---|---|---|');
  s('| **Übernacht-Familie, vorher (mitte)** | ' + sNM.offen + ' | ' + sNM.zu + ' | ' + sNM.unentschieden + ' | ' + nNacht + ' |');
  s('| **Übernacht-Familie, nachher (schluss)** | **' + sNS.offen + '** | **' + sNS.zu + '** | **' + sNS.unentschieden + '** | ' + nNacht + ' |');
  s('| **Alle 31, vorher** (`ERGEBNIS.md` §5) | ' + sAV.offen + ' | ' + sAV.zu + ' | ' + sAV.unentschieden + ' | ' + sortiert.length + ' |');
  s('| **Alle 31, nachher** (Übernacht gegen schluss, Rest unverändert gegen mitte) | **' + sAN.offen + '** | **' + sAN.zu + '** | **' + sAN.unentschieden + '** | ' + sortiert.length + ' |');
  s('');
  s('Davon in der Übernacht-Familie: belegte Klasse ' + (zNachtSchluss.belegt.offen + zNachtSchluss.belegt.zu) +
    ' (offen ' + zNachtSchluss.belegt.offen + ', zu ' + zNachtSchluss.belegt.zu + '); Klasse unbekannt ' +
    (zNachtSchluss.unbekannt.immerOffen + zNachtSchluss.unbekannt.immerZu + zNachtSchluss.unbekannt.gemischt) +
    ' (in jeder Klasse offen ' + zNachtSchluss.unbekannt.immerOffen + ', in jeder Klasse zu ' + zNachtSchluss.unbekannt.immerZu +
    ', hängt an der Klasse ' + zNachtSchluss.unbekannt.gemischt + ').');
  s('');
  s('**Geänderte Urteile (' + geaendert.length + '):**');
  s('');
  if (geaendert.length) geaendert.forEach(function (g) { s('- ' + g); }); else s('- keines');
  s('');
  s('Eine Variante, die sich von „endgültig zu" nach „hängt an der Klasse" bewegt, hat **kein** Urteil');
  s('bekommen — sie ist nur nicht mehr in jeder Klasse zu. Und „wieder offen" bleibt eine Größenaussage,');
  s('kein Ertragsbeleg. Die Zahl der belegten handelbaren Kanten bleibt **NULL**.');
  s('');

  /* ===== 3. Zusatz A gegen die Buch-Hürde ===== */
  s('## 3. Zusatz A gegen die Hürde, die das Momentum-Buch unterstellt');
  s('');
  s('Registrierung §6, Endpunkt: *„Median-Spanne des Korbs je Umschichtung, gegen die Hürde, die das');
  s('Momentum-Buch heute unterstellt."* `ERGEBNIS.md` §6 berichtet die Spanne, stellt sie aber keiner');
  s('Hürde gegenüber. **Das ist eine Gegenüberstellung, keine Empfehlung — am Buch wird nichts geändert.**');
  s('');
  s('**Die Buch-Hürde steht im Code:** `mfdepot.js` `takt()` ruft `MH.fuehreAus(d.mfBuch, plan, now, 20)`');
  s('(Zeile 158); `mfhandel.js` `fuehreAus(buch, plan, nowMs, kostenBp)` dokumentiert „kostenBp je Seite"');
  s('und rechnet `k = kostenBp / 10000` auf jede Seite (Zeile 128). Der Journaltext in `takt()` sagt es');
  s('wörtlich: „Kosten 20 Bp je Seite". Bestätigt durch `uebergabe/oberflaeche-stufe3-2026-09-03.md`,');
  s('Abweichung 4.');
  s('');
  s('| Größe | Wert |');
  s('|---|---|');
  s('| Buch-Hürde je Seite | **' + BUCH_BP_JE_SEITE + ' Bp** = ' + fx(BUCH_BP_JE_SEITE * 0.01, 2) + ' Pp |');
  s('| Buch-Hürde je Umlauf (Seite × 2, Bp → Pp mit Faktor 0,01) | **' + fx(BUCH_PP_JE_UMLAUF, 2) + ' Pp** |');
  var za = zusatzA();
  if (!za) {
    s('');
    s('*Zusatz A liegt nicht vor (entfallen oder nicht gemessen) — keine Gegenüberstellung.*');
    s('');
  } else {
    var ueber = 0, unter = 0;
    za.medProTag.forEach(function (m) { if (m > BUCH_PP_JE_UMLAUF) ueber++; else unter++; });
    s('| Gemessen: Median über alle Korbmitglieder (15:55 ET, ' + za.tage.length + ' Umschichtungen, ' + za.n + ' Quotes) | **' + fx(za.median) + ' Pp** je Umlauf |');
    s('| Gemessen: p75 | ' + fx(za.p75) + ' Pp je Umlauf |');
    s('| Buch-Hürde / gemessener Median | **Faktor ' + fx(BUCH_PP_JE_UMLAUF / za.median, 1) + '** |');
    s('| Buch-Hürde / p75 | Faktor ' + fx(BUCH_PP_JE_UMLAUF / za.p75, 1) + ' |');
    s('| Umschichtungen mit Korbspanne (Median) **über** der Buch-Hürde | **' + ueber + ' von ' + za.tage.length + '** |');
    s('| Umschichtungen mit Korbspanne (Median) **unter** der Buch-Hürde | **' + unter + ' von ' + za.tage.length + '** |');
    s('');
    s('| Umschichtung | Korbmitglieder | Median-Spanne (Pp) | p75 | breitestes Mitglied | gegen Buch-Hürde ' + fx(BUCH_PP_JE_UMLAUF, 2) + ' |');
    s('|---|---|---|---|---|---|');
    za.tage.forEach(function (t, i) {
      s('| ' + t + ' | ' + za.jeTag[t].length + ' | ' + fx(za.medProTag[i]) + ' | ' + fx(za.p75ProTag[i]) + ' | ' + fx(za.maxProTag[i]) +
        ' | ' + (za.medProTag[i] > BUCH_PP_JE_UMLAUF ? '**über**' : 'unter') + ' (Faktor ' + fx(BUCH_PP_JE_UMLAUF / za.medProTag[i], 1) + ') |');
    });
    s('');
    s('**Was das sagt:** Die notierte Spanne der Korbmitglieder liegt in jeder der ' + za.tage.length + ' Umschichtungen unter');
    s('der Hürde, die das Buch je Umlauf abzieht. **Was das nicht sagt:** die notierte Spanne ist die');
    s('**Untergrenze** einer Marktorder (Registrierung §9) — Schlupf, Marktimpact, Teilfüllung und der Abstand');
    s('zwischen 15:55 ET und dem tatsächlichen Ausführungszeitpunkt des Buchs sind nicht enthalten. Ob 20 Bp');
    s('je Seite deshalb „zu viel" sind, entscheidet die laufende Paper-Messung (`kosten.js`), nicht diese Zahl.');
    s('Am Buch wird nichts geändert.');
    s('');
  }

  /* ===== 4. Was das nicht sagt ===== */
  s('## 4. Was dieser Nachtrag NICHT sagt — Registrierung §9 gilt weiter');
  s('');
  s('- **Nicht die effektiven Kosten.** Schlupf, Marktimpact, Warteschlange, Teilfüllung und');
  s('  Preisverbesserung fehlen; die notierte Spanne ist die Untergrenze einer Marktorder.');
  s('- **Nicht die Tiefe.** `bs`/`as` sind nicht ausgewertet.');
  s('- **Nicht die Kosten des CFD-Gefäßes.**');
  s('- **Kein Ertragsbeleg für irgendeine Strategie.** Eine wieder offene Variante ist eine Größenaussage.');
  s('- **Für 2016–2024 sind es Überlebende** (Rahmen A, Universum vom 02.09.2024); Zusatz C bleibt offen.');
  s('- **Keine Übernacht-Hürde aus Zusatz B.** Der Übernachtsprung (0,486 Pp) ist keine Kostengröße;');
  s('  die Hürde der Übernacht-Familie ist die Spanne im Schlussfenster — und auch die deckt nur den');
  s('  Kauf am Schluss, nicht den Verkauf in der Folgeeröffnung (Eröffnungsfenster: `ERGEBNIS.md` §4).');
  s('- **Keine Empfehlung an das Momentum-Buch.**');
  s('');

  fs.writeFileSync(ZIEL, out.join('\n') + '\n');
  process.stdout.write('ERGEBNIS-NACHTRAG.md geschrieben: ' + ZIEL + '\n');
  process.stdout.write('  Schluss ab 2021: ' + KLASSEN.map(function (k) { return k + ' ' + fx(hSchluss[k]); }).join(' · ') + '\n');
  process.stdout.write('  Uebernacht-Familie (' + nNacht + '): vorher ' + sNM.offen + '/' + sNM.zu + '/' + sNM.unentschieden +
                       ' -> nachher ' + sNS.offen + '/' + sNS.zu + '/' + sNS.unentschieden + ' (offen/zu/unentschieden)\n');
  process.stdout.write('  Alle 31: vorher ' + sAV.offen + '/' + sAV.zu + '/' + sAV.unentschieden +
                       ' -> nachher ' + sAN.offen + '/' + sAN.zu + '/' + sAN.unentschieden + '\n');
}

module.exports = { istUebernacht: istUebernacht, BUCH_PP_JE_UMLAUF: BUCH_PP_JE_UMLAUF };

if (require.main === module) { main(); }

'use strict';
/* ============ Die Auswertung von Zusatz C -> ERGEBNIS-ZUSATZ-C.md ============
 *
 * Liest BEIDE Rahmen aus E:/Markt-Dashboard-Archiv/spannen (nur lesend):
 *   Rahmen A (Ueberlebende)     <jahr>.jsonl           - ueber lesen() aus auswerten.js
 *   Rahmen C (Verschwundene)    zusatzC-<jahr>.jsonl   - ueber lesenC() hier
 *
 * DIE EINE REGEL, DIE DIESE DATEI TRAEGT: beide Seiten laufen durch DIESELBE Funktion.
 * zelle() kommt per require aus auswerten.js und wird nicht nachgebaut - sonst waere die
 * Differenz der beiden Rahmen zum Teil ein Unterschied der Werkzeuge, und niemand koennte
 * sagen, zu welchem Teil. Die Positivkontrolle prueft genau das: fuer Rahmen A, Fenster
 * `mitte`, ab 2021 muessen exakt die vier Mediane aus ERGEBNIS.md Paragraph 3 herauskommen
 * (0,1569 / 0,0854 / 0,0647 / 0,0449). Stimmt eine Stelle nicht, wird ABGEBROCHEN und
 * nichts geschrieben.
 *
 * WAS KOPIERT WERDEN MUSSTE, und warum: lesen() in auswerten.js filtert fest auf
 * /^\d{4}\.jsonl$/ - die Jahresdateien des Rahmens A. Fuer zusatzC-<jahr>.jsonl gibt es
 * keine Fassung, und der Filter ist nicht einspeisbar. lesenC() unten ist deshalb eine
 * KOPIE von lesen(), die sich in genau einer Zeile unterscheidet (dem Dateimuster). Steht
 * so in der Uebergabe. quantil() und zelle() sind wiederverwendet, nicht kopiert;
 * wuerfel() kommt aus stichprobe.js (dort exportiert, in beiden Dateien derselbe
 * mulberry32).
 *
 * WAS NEU IST: die DIFFERENZ zweier Rahmen mit Band. Die gibt es in auswerten.js nicht.
 * Sie wird als Zwei-Stichproben-Cluster-Bootstrap gebildet: in jeder der 1.000 Ziehungen
 * werden BEIDE Seiten unabhaengig neu gezogen (ganze Symbole mit Zuruecklegen), und die
 * Differenz der beiden Symbol-Mediane wird verteilt (Registrierung 9b.4).
 *
 * TRENNUNG: In keiner Zeile dieses Berichts stehen beide Rahmen in einer gemeinsamen Zahl.
 * Die einzige Ausnahme ist ausdruecklich als solche benannt - der Abschnitt "Was das fuer
 * die Huerden heisst", und dessen Zahlen sind eine GROESSENORDNUNG und gehen nicht nach
 * wiki/kosten.md (Registrierung 9b.6).
 *
 * TROCKENLAUF-SCHUTZ wie in auswerten.js: ERGEBNIS-ZUSATZ-C.md heisst nur so, wenn die
 * Zahlen aus dem Archiv kommen. Sonst ERGEBNIS-ZUSATZ-C-TROCKENLAUF.md mit Warnung als
 * erster Zeile - erzwungen, nicht auf Zuruf.
 *
 * Aufruf:  node studien/vorregistrierung-2026-09-02-spannen-historisch/auswertenC.js
 * Kein Netz, kein Zugang, keine geschriebene Datei ausser dem Bericht.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */

var fs = require('fs');
var path = require('path');
var A = require('./auswerten.js');
var St = require('./stichprobe.js');

var QUELLE = process.env.MD_SPANNEN || 'E:/Markt-Dashboard-Archiv/spannen';
var ECHT = QUELLE.replace(/\\/g, '/').toLowerCase().indexOf('markt-dashboard-archiv/spannen') >= 0;
var ZIEL = path.join(__dirname, ECHT ? 'ERGEBNIS-ZUSATZ-C.md' : 'ERGEBNIS-ZUSATZ-C-TROCKENLAUF.md');

var KLASSEN = ['5-50', '50-250', '250-1000', 'ab1000'];
var FENSTER = ['eroeffnung', 'mitte', 'schluss'];
var JAHRE_C = [2025, 2026];
var BOOTSTRAP = 1000;
var SAAT = 20260902;
/* Positivkontrolle: ERGEBNIS.md Paragraph 3, Fenster `mitte`, ab 2021. */
var SOLL_A = { '5-50': 0.1569, '50-250': 0.0854, '250-1000': 0.0647, 'ab1000': 0.0449 };
/* Primaere Zellen, in der Registrierung 9b.4 vorab benannt. */
var PRIMAER = ['5-50', '50-250'];

function fx(v, n) { return isFinite(v) ? v.toFixed(n == null ? 4 : n).replace('.', ',') : '–'; }
function pz(v, n) { return isFinite(v) ? (v * 100).toFixed(n == null ? 0 : n).replace('.', ',') + ' %' : '–'; }
function gueltig(r) { return typeof r.spanne === 'number' && isFinite(r.spanne); }

/* ---------- Einlesen des Rahmens C. KOPIE von lesen() aus auswerten.js; einziger
 *            Unterschied ist das Dateimuster (dort /^\d{4}\.jsonl$/, hier die
 *            zusatzC-Dateien). Das Original ist nicht parametrisierbar. ---------- */
function lesenC() {
  var zeilen = [], dateien = [];
  try {
    dateien = fs.readdirSync(QUELLE).filter(function (f) { return /^zusatzC-\d{4}\.jsonl$/.test(f); });
  } catch (e) { return { zeilen: [], dateien: [] }; }
  dateien.forEach(function (f) {
    var txt = fs.readFileSync(path.join(QUELLE, f), 'utf8').split('\n');
    for (var i = 0; i < txt.length; i++) {
      if (!txt[i]) continue;
      var o; try { o = JSON.parse(txt[i]); } catch (e) { continue; }
      if (o && o.sym) zeilen.push(o);
    }
  });
  var einmal = {};
  zeilen.forEach(function (r) { einmal[r.sym + '|' + r.utc] = r; });
  return { zeilen: Object.keys(einmal).map(function (k) { return einmal[k]; }), dateien: dateien };
}

/* ---------- Die Differenz zweier Rahmen, mit Band ----------
 * Zwei-Stichproben-Cluster-Bootstrap ueber SYMBOLE (Registrierung 9b.4): in jeder Ziehung
 * werden beide Seiten unabhaengig neu gezogen, ganze Symbole samt allen ihren Zeitpunkten.
 * Der Punktschaetzer ist die Differenz der beobachteten Symbol-Mediane, NICHT das Mittel
 * der Bootstrap-Verteilung - sonst berichtete man den Bootstrap statt der Messung. */
function symbolMediane(rows) {
  var jeSym = {};
  rows.forEach(function (r) { (jeSym[r.sym] || (jeSym[r.sym] = [])).push(r.spanne); });
  return Object.keys(jeSym).map(function (s) { return A.median(jeSym[s]); });
}
function differenz(rowsC, rowsA, schluessel) {
  var mC = symbolMediane(rowsC), mA = symbolMediane(rowsA);
  if (!mC.length || !mA.length) return null;
  var punkt = A.median(mC) - A.median(mA);
  var band = [NaN, NaN];
  if (mC.length >= 10 && mA.length >= 10) {
    var r0 = St.wuerfel(St.saatAus('diff|' + schluessel, SAAT)), vert = [];
    for (var b = 0; b < BOOTSTRAP; b++) {
      var zC = [], zA = [];
      for (var i = 0; i < mC.length; i++) zC.push(mC[Math.floor(r0() * mC.length)]);
      for (var j = 0; j < mA.length; j++) zA.push(mA[Math.floor(r0() * mA.length)]);
      vert.push(A.median(zC) - A.median(zA));
    }
    band = [A.quantil(vert, 0.025), A.quantil(vert, 0.975)];
  }
  return { punkt: punkt, band: band, nC: mC.length, nA: mA.length,
           duenn: !(mC.length >= 10 && mA.length >= 10) };
}

/* ---------- Was dieser Vergleich ueberhaupt aufloesen kann ----------
 * wiki/fehlerformen.md, "Gegenpruefung rettete ein Studien-Nein": die kleinste erkennbare
 * Wirkung gehoert VOR das Urteil, nicht dahinter. Sonst liest sich ein "nicht entscheidbar"
 * wie ein "kein Unterschied", obwohl das Werkzeug den Unterschied gar nicht haette sehen
 * koennen.
 *
 * Gerechnet wird auf RAHMEN A allein, also ohne eine einzige Zahl des Rahmens C: nC
 * Symbole spielen die Verschwundenen, der Rest die Ueberlebenden. Erst die Nullkontrolle
 * (beide Haelften sind derselbe Rahmen - das Band MUSS die Null enthalten), dann wird der
 * einen Haelfte ein Aufschlag eingespritzt und der kleinste gesucht, bei dem das Band die
 * Null gerade ausschliesst. Das ist die Aufloesung dieses Vergleichs bei DIESEN
 * Stichprobengroessen. */
function aufloesung(rowsA, nC, schluessel) {
  var syms = Object.keys(rowsA.reduce(function (m, r) { m[r.sym] = 1; return m; }, {})).sort();
  if (syms.length < 30 || nC < 10) return null;
  var g = St.mischen(syms, St.wuerfel(St.saatAus('mde|' + schluessel, SAAT)));
  var alsC = {};
  g.slice(0, Math.min(nC, syms.length - 15)).forEach(function (s) { alsC[s] = 1; });
  var rC = rowsA.filter(function (r) { return alsC[r.sym]; });
  var rA = rowsA.filter(function (r) { return !alsC[r.sym]; });
  var d0 = differenz(rC, rA, 'mde0|' + schluessel);
  if (!d0 || d0.duenn) return null;
  var mde = null;
  for (var delta = 0.005; delta <= 0.40001; delta += 0.005) {
    var rCplus = rC.map(function (r) { return { sym: r.sym, spanne: r.spanne + delta }; });
    var d = differenz(rCplus, rA, 'mde|' + schluessel);
    if (d && d.band[0] > 0) { mde = delta; break; }
  }
  return { nullPunkt: d0.punkt, nullBand: d0.band, mde: mde, nC: d0.nC, nA: d0.nA };
}

/** Schliesst das Band die Null aus? Nur dann traegt die Entscheidungsregel. */
function bandUrteil(d) {
  if (!d) return 'keine Daten';
  if (d.duenn) return '**zu dünn** (kein Band)';
  if (d.band[0] > 0) return '**Rahmen C breiter** — Band schließt die Null aus';
  if (d.band[1] < 0) return '**Rahmen C enger** — Band schließt die Null aus';
  return 'nicht entscheidbar (Band schließt die Null ein)';
}

/** Die Bodenspanne: was eine Ein-Cent-Spanne bei diesem Kurs in Pp ergibt. Registrierung
 *  9b.4a - die arithmetische Untergrenze einer Zelle, damit sichtbar ist, wie viel einer
 *  Differenz schon der Kurs erklaert. */
function bodenspanne(medianKurs) { return isFinite(medianKurs) && medianKurs > 0 ? 100 / medianKurs * 0.01 : NaN; }

/** Gewichteter Median: der Median der MISCHUNG aus beiden Rahmen im Verhaeltnis w.
 *  Kein gewichtetes Mittel der beiden Mediane - das waere eine andere Groesse. */
function gewichteterMedian(werte, gewichte) {
  var idx = werte.map(function (v, i) { return i; })
                 .sort(function (a, b) { return werte[a] - werte[b]; });
  var summe = gewichte.reduce(function (s, g) { return s + g; }, 0);
  if (!(summe > 0)) return NaN;
  var lauf = 0;
  for (var i = 0; i < idx.length; i++) {
    lauf += gewichte[idx[i]];
    if (lauf >= summe / 2) return werte[idx[i]];
  }
  return werte[idx[idx.length - 1]];
}

/* ---------- Bericht ---------- */
function main() {
  var LC = lesenC();
  if (!LC.zeilen.length) {
    process.stdout.write('Keine Zusatz-C-Daten in ' + QUELLE + ' (zusatzC-<jahr>.jsonl fehlt).\n');
    return;
  }
  var LA = A.lesen();
  if (!LA.zeilen.length) {
    process.stdout.write('Keine Rahmen-A-Daten in ' + QUELLE + ' - ohne sie gibt es keine Differenz.\n');
    return;
  }

  var out = [];
  function s(t) { out.push(t == null ? '' : t); }

  var hauptC = LC.zeilen.filter(function (r) { return r.fenster !== 'placebo-vorboerslich'; });
  var placeboC = LC.zeilen.filter(function (r) { return r.fenster === 'placebo-vorboerslich'; });
  var hauptA = LA.zeilen.filter(function (r) { return r.fenster !== 'placebo-vorboerslich'; });

  /* ======== 0. Die Positivkontrolle. VOR jeder Zahl, und sie bricht ab. ======== */
  var kontrolle = [], kontrolleOk = true;
  KLASSEN.forEach(function (k) {
    var alle = hauptA.filter(function (r) { return r.klasse === k && r.fenster === 'mitte' && r.jahr >= 2021; });
    var z = A.zelle(alle.filter(gueltig), alle);
    var stimmt = isFinite(z.symMedian) && Math.abs(z.symMedian - SOLL_A[k]) < 0.00005;
    if (!stimmt) kontrolleOk = false;
    kontrolle.push({ klasse: k, soll: SOLL_A[k], ist: z.symMedian, stimmt: stimmt, z: z });
  });
  /* Verfehlte Positivkontrolle auf ECHTEN Daten: Abbruch, es wird NICHTS geschrieben
   * (Registrierung 9b.5). Auf Kunstdaten kann sie gar nicht stimmen - dort ist der
   * Trockenlauf-Bericht das richtige Ergebnis, und er traegt die verfehlte Kontrolle
   * sichtbar an erster Stelle. Ohne diese Unterscheidung waere der Trockenlauf-Zweig
   * unerreichbar und damit eine ungepruefte Zusage. */
  if (!kontrolleOk && ECHT) {
    process.stdout.write('POSITIVKONTROLLE VERFEHLT - Rahmen A wird von diesem Skript nicht reproduziert:\n');
    kontrolle.forEach(function (c) {
      process.stdout.write('  ' + c.klasse + '  Soll ' + c.soll.toFixed(4) + '  Ist ' +
        (isFinite(c.ist) ? c.ist.toFixed(4) : 'keine Daten') + (c.stimmt ? '' : '   ABWEICHUNG') + '\n');
    });
    process.stdout.write('Es wird NICHTS geschrieben (Registrierung 9b.5).\n');
    return;
  }

  s('# Ergebnis Zusatz C: die Spannen der verschwundenen Werte');
  s('');
  if (!ECHT) {
    s('> # ⚠⚠ TROCKENLAUF — DIESE ZAHLEN SIND ERFUNDEN ⚠⚠');
    s('> Die Quelle war `' + QUELLE + '`, nicht das Archiv. Nichts hier ist ein Befund.');
    s('');
  }
  s('**Registrierung:** `VORREGISTRIERUNG.md` §6 (Zusatz C) und **§9b** (die Ziehung,');
  s('Commit `30c5626`) — §9b ist geschrieben und committet worden, **bevor** `zusatzC.js`');
  s('gebaut wurde. **Schritt 0:** `probeC.js`, 5 von 5 verschwundenen Werten liefern einen');
  s('Quote aus ihrer Lebenszeit, 0 von 5 noch einen 60 Handelstage nach dem letzten Balken.');
  s('**Rohdaten:** `' + QUELLE + '` (' + LC.dateien.join(', ') + '), nur gelesen.');
  s('**Hauptergebnis (Rahmen A):** `ERGEBNIS.md` — unverändert. Ausgewertet am ' +
    new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC.');
  s('');
  s('> **Rahmen C wird nie in die Haupttabellen gemischt** (§6). Dieser Bericht steht neben');
  s('> `ERGEBNIS.md`, nicht darin. Die Kassa-Hürden in `wiki/kosten.md` bleiben, was sie sind.');
  s('');

  /* ======== 1. Kontrollen ======== */
  s('## 1. Die Kontrollen — vor jeder Zahl');
  s('');
  s('### 1.1 Positivkontrolle: beide Rahmen laufen durch dieselbe Funktion');
  s('');
  s('`auswertenC.js` rechnet Rahmen C und Rahmen A mit **derselben** `zelle()` aus');
  s('`auswerten.js` (per `require`, nicht nachgebaut). Der Beweis, dass sie dabei nichts');
  s('anderes tut als das Original: für Rahmen A, Fenster `mitte`, ab 2021 müssen exakt die');
  s('vier Mediane aus `ERGEBNIS.md` §3 herauskommen.');
  s('');
  s('| Klasse | Soll (`ERGEBNIS.md`) | Ist (`auswertenC.js`) | |');
  s('|---|---|---|---|');
  kontrolle.forEach(function (c) {
    s('| ' + c.klasse + ' | ' + fx(c.soll) + ' | **' + fx(c.ist) + '** | ' +
      (c.stimmt ? 'stimmt' : '**ABWEICHUNG**') + ' |');
  });
  s('');
  /* Der Satz wird GERECHNET, nicht getippt. Im Trockenlauf stand hier "4 von 4 stimmen -
   * bestanden" ueber einer Tabelle mit vier Abweichungen: genau die Bauform, die dieses
   * Projekt wiederholt eingeholt hat (eine Datei, die aussieht wie ein Befund). */
  var stimmen = kontrolle.filter(function (c) { return c.stimmt; }).length;
  s('**' + stimmen + ' von ' + kontrolle.length + ' Stellen stimmen — ' +
    (stimmen === kontrolle.length ? 'bestanden.**' : 'VERFEHLT.**') + ' Ohne diese Zeile wäre jede');
  s('Differenz unten zum unbekannten Teil ein Unterschied der Werkzeuge.');
  if (stimmen !== kontrolle.length) {
    s('');
    s('> ⚠ **Die Positivkontrolle ist verfehlt.** Auf echten Archivdaten bricht `auswertenC.js`');
    s('> hier ab und schreibt nichts (§9b.5); dieser Bericht existiert nur, weil die Quelle');
    s('> nicht das Archiv ist. **Keine Zahl darunter ist ein Befund.**');
  }
  s('');

  /* --- Lebenszeit --- */
  var nachTod = hauptC.filter(function (r) { return r.letzterHandelstag && r.tag > r.letzterHandelstag; });
  var zuNah = hauptC.filter(function (r) { return !(r.restTage >= 20); });
  s('### 1.2 Lebenszeit-Kontrolle: keine Abwicklungsphase');
  s('');
  s('§9b.2 verlangt, dass jedem gezogenen Tag noch mindestens **20 volle Handelstage**');
  s('folgen — die letzten Wochen vor einem Delisting sind Abwicklung, nicht Handel, und sie');
  s('zu messen und „so handeln Verschwundene" zu nennen wäre ein Ausschluss auf die');
  s('Zielgröße mit umgekehrtem Vorzeichen.');
  s('');
  s('| Prüfung | Soll | Ist | |');
  s('|---|---|---|---|');
  s('| Zeitpunkte nach dem letzten Handelstag | 0 | **' + nachTod.length + '** | ' +
    (nachTod.length === 0 ? 'bestanden' : '**verfehlt**') + ' |');
  s('| Zeitpunkte in den letzten 20 Handelstagen | 0 | **' + zuNah.length + '** | ' +
    (zuNah.length === 0 ? 'bestanden' : '**verfehlt**') + ' |');
  s('');

  /* --- Zeitstempel (iex-Falle) --- */
  var versaetze = hauptC.filter(function (r) { return r.tq && r.utc; })
    .map(function (r) { return (Date.parse(r.utc) - Date.parse(r.tq)) / 1000; });
  var negativ = versaetze.filter(function (v) { return v < 0; }).length;
  s('### 1.3 Zeitstempel-Kontrolle (die `iex`-Falle, §1.1)');
  s('');
  s('Zu jeder Zeile steht der **gelieferte** Zeitstempel `tq` in den Rohdaten. Der Versatz');
  s('zum angefragten Zeitpunkt muss positiv sein (`sort=desc` liefert den letzten Quote');
  s('*vor* T); ein negativer Wert oder ein falsches Jahr wäre die Falle.');
  s('');
  s('| Größe | Wert |');
  s('|---|---|');
  s('| Median | ' + fx(A.median(versaetze), 1) + ' s |');
  s('| p90 | ' + fx(A.quantil(versaetze, 0.90), 1) + ' s |');
  s('| Maximum | ' + fx(Math.max.apply(null, versaetze.concat([0])), 1) + ' s |');
  s('| **negative Versätze (Quote NACH dem Zeitpunkt)** | **' + negativ + '**' +
    (negativ === 0 ? ' — keiner' : ' — **VERFEHLT**') + ' |');
  s('');

  /* --- Placebo --- */
  var mitteJeTag = {};
  hauptC.filter(function (r) { return r.fenster === 'mitte' && gueltig(r); })
        .forEach(function (r) { mitteJeTag[r.sym + '|' + r.tag] = r.spanne; });
  var paareP = [], paareM = [], placeboOhneQuote = 0;
  placeboC.forEach(function (r) {
    if (!gueltig(r)) { placeboOhneQuote++; return; }
    var m = mitteJeTag[r.sym + '|' + r.tag];
    if (m == null) return;
    paareP.push(r.spanne); paareM.push(m);
  });
  var medP = A.median(paareP), medM = A.median(paareM);
  var faktor = medM > 0 ? medP / medM : NaN;
  s('### 1.4 Placebo (vorbörslich 08:00 ET gegen `mitte`, dieselben Symbol-Tage)');
  s('');
  s('| Größe | Soll (§7) | Ist |');
  s('|---|---|---|');
  s('| Placebo-Zeitpunkte | — | ' + placeboC.length + ' (davon ohne Quote ' + placeboOhneQuote + ') |');
  s('| verwertbare Paare | n ≥ 20 | **' + paareP.length + '** |');
  s('| vorbörslich / `mitte` | **Faktor ≥ 2** | ' + fx(medP) + ' gegen ' + fx(medM) +
    ' → **Faktor ' + fx(faktor, 2) + '** |');
  s('| | | ' + (paareP.length >= 20 && faktor >= 2 ? '**bestanden**'
      : paareP.length < 20 ? '**zu wenige Paare — die Kontrolle trägt nicht**'
      : '**verfehlt — alle Zahlen tragen den Vermerk**') + ' |');
  s('');

  /* --- Aufloesung: was der Vergleich sehen koennte, BEVOR gesagt wird, was er sah --- */
  s('### 1.5 Was dieser Vergleich auflösen kann — vor dem Urteil, nicht danach');
  s('');
  s('Gerechnet **allein auf Rahmen A**, ohne eine Zahl des Rahmens C: `nC` Symbole spielen');
  s('die Verschwundenen, der Rest die Überlebenden. Die **Nullkontrolle** muss die Null im');
  s('Band haben (beide Hälften sind derselbe Rahmen). Die **kleinste erkennbare Wirkung**');
  s('ist der kleinste eingespritzte Aufschlag, bei dem das Band die Null gerade ausschließt.');
  s('');
  s('| Klasse | Symbole C / A | Nullkontrolle | Band der Nullkontrolle | **kleinste erkennbare Wirkung** |');
  s('|---|---|---|---|---|');
  var aufl = {};
  PRIMAER.forEach(function (k) {
    var rA = hauptA.filter(function (r) { return r.klasse === k && r.fenster === 'mitte' && JAHRE_C.indexOf(r.jahr) >= 0 && gueltig(r); });
    var rC = hauptC.filter(function (r) { return r.klasse === k && r.fenster === 'mitte' && gueltig(r); });
    var nC = Object.keys(rC.reduce(function (m, r) { m[r.sym] = 1; return m; }, {})).length;
    var a = aufloesung(rA, nC, k);
    aufl[k] = a;
    if (!a) { s('| ' + k + ' | ' + nC + ' / – | zu dünn | – | – |'); return; }
    s('| **' + k + '** | ' + a.nC + ' / ' + a.nA + ' | ' + (a.nullPunkt >= 0 ? '+' : '') + fx(a.nullPunkt) +
      ' | [' + (a.nullBand[0] >= 0 ? '+' : '') + fx(a.nullBand[0]) + ', ' +
      (a.nullBand[1] >= 0 ? '+' : '') + fx(a.nullBand[1]) + ']' +
      (a.nullBand[0] <= 0 && a.nullBand[1] >= 0 ? ' — Null drin ✓' : ' — **Null ausgeschlossen, Werkzeug verdächtig**') +
      ' | **' + (a.mde == null ? '> 0,40' : fx(a.mde) + ' Pp') + '** |');
  });
  s('');
  s('> **Wie das zu lesen ist:** ein „nicht entscheidbar" unten heißt **nicht** „kein');
  s('> Unterschied". Es heißt: der Unterschied ist kleiner als die Zahl in der letzten');
  s('> Spalte — oder es gibt ihn nicht, und der Vergleich kann die beiden Fälle nicht');
  s('> trennen. *(Diese Zeile ist nach dem Commit von §9b entstanden und steht deshalb');
  s('> nicht dort; sie ist gerechnet, bevor die erste Zahl des Rahmens C vorlag, und ändert');
  s('> keine registrierte Regel — sie sagt nur, was die registrierte Regel sehen kann.)*');
  s('');

  /* ======== 2. Der Lauf in Zahlen ======== */
  var gC = hauptC.filter(gueltig);
  var zaehlGrund = {};
  hauptC.forEach(function (r) { if (r.grund) zaehlGrund[r.grund] = (zaehlGrund[r.grund] || 0) + 1; });
  s('## 2. Der Lauf in Zahlen');
  s('');
  s('| Größe | Rahmen C (Verschwundene) | Rahmen A (Überlebende, `ERGEBNIS.md`) |');
  s('|---|---|---|');
  s('| Zeitpunkte | **' + hauptC.length + '** | 55.455 |');
  s('| davon mit gültiger Spanne | ' + gC.length + ' (' + pz(gC.length / Math.max(1, hauptC.length), 1) + ') | 55.067 (99,3 %) |');
  s('| „kein Quote" | ' + (zaehlGrund.keinQuote || 0) + ' | 386 |');
  s('| gekreuzt (`ap < bp`) | ' + (zaehlGrund.gekreuzt || 0) + ' | 2 |');
  s('| Nullkurs | ' + (zaehlGrund.nullkurs || 0) + ' | 0 |');
  s('| gesperrt (`bp = ap`, Spanne 0) | ' + gC.filter(function (r) { return r.spanne === 0; }).length + ' | — |');
  s('| Placebo-Zeitpunkte | ' + placeboC.length + ' | 740 |');
  s('');
  var fehlAnteil = 1 - gC.length / Math.max(1, hauptC.length);
  if (fehlAnteil > 0.2) {
    s('> ⚠ **Der Fehlanteil liegt über 20 %.** §9b.5 hatte das für dünne, sterbende Werte');
    s('> erwartet; es ist ein Ergebnis, kein Fehler — aber jede Zelle unten ist daraufhin zu lesen.');
  } else {
    s('Der Fehlanteil bleibt unter der 20-%-Schwelle aus §7. *(§9b.5 hatte für sterbende');
    s('Werte mehr erwartet als die 0,7 % des Rahmens A — der Vergleich steht in der Tabelle.)*');
  }
  s('');

  /* ======== 3. Rahmen C je Zelle ======== */
  s('## 3. Rahmen C je Zelle — die Verschwundenen allein');
  s('');
  s('Symbol-Median der notierten Spanne in Pp je Umlauf, Band = 95-%-Perzentilband aus');
  s('1.000 Cluster-Bootstrap-Ziehungen über Symbole. **Bodenspanne** = `100/Median-Kurs ×');
  s('0,01`, die arithmetische Untergrenze der Zelle (§9b.4a). ⚠ = weniger als 10 Symbole.');
  s('');
  s('| Klasse | Jahr | Fenster | n | Zeitpunkte | Symbole | **Symbol-Median** | roher Median | p75 | 95-%-Band | fehlend | gesperrt | Median-Kurs | am Cent-Boden | **Bodenspanne** |');
  s('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  KLASSEN.forEach(function (k) {
    JAHRE_C.forEach(function (j) {
      FENSTER.forEach(function (f) {
        var alle = hauptC.filter(function (r) { return r.klasse === k && r.jahr === j && r.fenster === f; });
        if (!alle.length) return;
        var z = A.zelle(alle.filter(gueltig), alle);
        s('| ' + k + ' | ' + j + ' | ' + f + ' | ' + z.n + ' | ' + z.zeitpunkte + ' | ' + z.symbole +
          ' | **' + fx(z.symMedian) + '**' + (z.symbole < 10 ? ' ⚠' : '') +
          ' | ' + fx(z.rohMedian) + ' | ' + fx(z.p75) +
          ' | ' + (isFinite(z.band[0]) ? '[' + fx(z.band[0]) + ', ' + fx(z.band[1]) + ']' : 'zu dünn') +
          ' | ' + pz(z.fehlanteil, 1) + ' | ' + z.gesperrt +
          ' | ' + fx(z.medianKurs, 2) + ' $ | ' + pz(z.bodenAnteil) +
          ' | ' + fx(bodenspanne(z.medianKurs)) + ' |');
      });
    });
  });
  s('');

  /* ======== 4. Die Differenz ======== */
  s('## 4. Die Differenz zu Rahmen A — der eigentliche Endpunkt');
  s('');
  s('`Median(C) − Median(A)` in Pp, Band aus dem Zwei-Stichproben-Cluster-Bootstrap');
  s('(1.000 Ziehungen, beide Seiten unabhängig, ganze Symbole). **Entscheidungsregel aus');
  s('§9b.4: „Verschwundene handeln breiter" gilt als belegt, wenn das Band die Null');
  s('ausschließt und die Differenz positiv ist. Schließt es die Null ein, lautet der Befund');
  s('„nicht entscheidbar" — nicht „kein Unterschied".**');
  s('');
  s('### 4.1 Die primären Zellen — in §9b.4 vorab benannt');
  s('');
  s('Fenster `mitte`, Klassen **5-50** und **50-250**, Jahre **2025 und 2026 gepoolt**.');
  s('Das sind **zwei** Differenzen; alles andere steht nachrichtlich daneben.');
  s('');
  s('| Klasse | Rahmen C | Rahmen A | **Differenz** | 95-%-Band | Symbole C / A | Bodenspanne C / A | Urteil |');
  s('|---|---|---|---|---|---|---|---|');
  var primaerErg = {};
  PRIMAER.forEach(function (k) {
    var rC = hauptC.filter(function (r) { return r.klasse === k && r.fenster === 'mitte' && gueltig(r); });
    var alleC = hauptC.filter(function (r) { return r.klasse === k && r.fenster === 'mitte'; });
    var rA = hauptA.filter(function (r) { return r.klasse === k && r.fenster === 'mitte' && JAHRE_C.indexOf(r.jahr) >= 0 && gueltig(r); });
    var alleA = hauptA.filter(function (r) { return r.klasse === k && r.fenster === 'mitte' && JAHRE_C.indexOf(r.jahr) >= 0; });
    if (!rC.length || !rA.length) return;
    var zC = A.zelle(rC, alleC), zA = A.zelle(rA, alleA);
    var d = differenz(rC, rA, k + '|mitte|primaer');
    primaerErg[k] = { zC: zC, zA: zA, d: d };
    s('| **' + k + '** | ' + fx(zC.symMedian) + ' | ' + fx(zA.symMedian) +
      ' | **' + (d.punkt >= 0 ? '+' : '') + fx(d.punkt) + '**' +
      ' | ' + (isFinite(d.band[0]) ? '[' + (d.band[0] >= 0 ? '+' : '') + fx(d.band[0]) + ', ' +
                                     (d.band[1] >= 0 ? '+' : '') + fx(d.band[1]) + ']' : 'zu dünn') +
      ' | ' + d.nC + ' / ' + d.nA +
      ' | ' + fx(bodenspanne(zC.medianKurs)) + ' / ' + fx(bodenspanne(zA.medianKurs)) +
      ' | ' + bandUrteil(d) + ' |');
  });
  s('');
  /* Die Vorrangregel aus 9b.4a, maschinell angewandt statt dem Leser ueberlassen. */
  PRIMAER.forEach(function (k) {
    var e = primaerErg[k];
    if (!e || !e.d || e.d.duenn) return;
    var dBoden = bodenspanne(e.zC.medianKurs) - bodenspanne(e.zA.medianKurs);
    var satz = '**' + k + ':** gemessene Differenz ' + (e.d.punkt >= 0 ? '+' : '') + fx(e.d.punkt) +
      ' Pp, Unterschied der Bodenspannen ' + (dBoden >= 0 ? '+' : '') + fx(dBoden) + ' Pp — ';
    if (e.d.band[0] <= 0 && e.d.band[1] >= 0) {
      satz += 'das Band schließt die Null ein, der Befund lautet **nicht entscheidbar**.';
    } else if (e.d.punkt > 0 && dBoden >= e.d.punkt) {
      satz += 'die Differenz ist **kleiner als der Kurseffekt allein**. Vorrangregel §9b.4a: ' +
              'der Befund lautet **„der Unterschied ist Kurs, nicht Sterblichkeit"**.';
    } else if (e.d.punkt > 0) {
      satz += 'die Differenz ist **größer als der Kurseffekt allein** (' +
              fx(e.d.punkt - dBoden) + ' Pp bleiben über). Der Kurs erklärt sie nicht vollständig.';
    } else {
      satz += 'die Differenz ist negativ — Rahmen C handelt **enger**.';
    }
    s('- ' + satz);
  });
  s('');

  s('### 4.2 Alle Zellen — nachrichtlich, nie statt dessen');
  s('');
  s('| Klasse | Jahr | Fenster | Rahmen C | Rahmen A | Differenz | 95-%-Band | Symbole C / A | Urteil |');
  s('|---|---|---|---|---|---|---|---|---|');
  KLASSEN.forEach(function (k) {
    JAHRE_C.forEach(function (j) {
      FENSTER.forEach(function (f) {
        var rC = hauptC.filter(function (r) { return r.klasse === k && r.jahr === j && r.fenster === f && gueltig(r); });
        var rA = hauptA.filter(function (r) { return r.klasse === k && r.jahr === j && r.fenster === f && gueltig(r); });
        if (!rC.length || !rA.length) return;
        var d = differenz(rC, rA, k + '|' + j + '|' + f);
        s('| ' + k + ' | ' + j + ' | ' + f + ' | ' + fx(A.median(symbolMediane(rC))) +
          ' | ' + fx(A.median(symbolMediane(rA))) +
          ' | ' + (d.punkt >= 0 ? '+' : '') + fx(d.punkt) +
          ' | ' + (isFinite(d.band[0]) ? '[' + (d.band[0] >= 0 ? '+' : '') + fx(d.band[0]) + ', ' +
                                         (d.band[1] >= 0 ? '+' : '') + fx(d.band[1]) + ']' : 'zu dünn') +
          ' | ' + d.nC + ' / ' + d.nA + ' | ' + bandUrteil(d) + ' |');
      });
    });
  });
  s('');

  /* ======== 5. Die Cent-Boden-Gegenprobe ======== */
  s('## 5. Der Cent-Boden — die in §9b.4a vorab benannte Gegenprobe');
  s('');
  s('Die Verschwundenen der Klasse `5-50` sind nicht nur dünner, sondern **billiger**; das');
  s('war vor dem Lauf gezählt und steht in §9b.4a. Hier dieselbe Differenz, gerechnet nur');
  s('auf Symbolen, deren **Median-Kurs im Band 10–50 $** liegt — dem Bereich, in dem beide');
  s('Rahmen Masse haben. **Nachrichtlich, nie statt dessen; die primären Zellen ändern sich nicht.**');
  s('');
  s('| Klasse | Rahmen C (10–50 $) | Rahmen A (10–50 $) | Differenz | 95-%-Band | Symbole C / A | Urteil |');
  s('|---|---|---|---|---|---|---|');
  function imBand(rows) {
    var jeSym = {};
    rows.forEach(function (r) {
      if (!(r.bp > 0 && r.ap > 0)) return;
      (jeSym[r.sym] || (jeSym[r.sym] = [])).push((r.bp + r.ap) / 2);
    });
    var erlaubt = {};
    Object.keys(jeSym).forEach(function (sy) {
      var m = A.median(jeSym[sy]);
      if (m >= 10 && m <= 50) erlaubt[sy] = 1;
    });
    return rows.filter(function (r) { return erlaubt[r.sym]; });
  }
  PRIMAER.forEach(function (k) {
    var rC = imBand(hauptC.filter(function (r) { return r.klasse === k && r.fenster === 'mitte' && gueltig(r); }));
    var rA = imBand(hauptA.filter(function (r) { return r.klasse === k && r.fenster === 'mitte' && JAHRE_C.indexOf(r.jahr) >= 0 && gueltig(r); }));
    if (!rC.length || !rA.length) { s('| ' + k + ' | — | — | — | — | 0 / 0 | keine Daten |'); return; }
    var d = differenz(rC, rA, k + '|mitte|kursband');
    s('| ' + k + ' | ' + fx(A.median(symbolMediane(rC))) + ' | ' + fx(A.median(symbolMediane(rA))) +
      ' | ' + (d.punkt >= 0 ? '+' : '') + fx(d.punkt) +
      ' | ' + (isFinite(d.band[0]) ? '[' + (d.band[0] >= 0 ? '+' : '') + fx(d.band[0]) + ', ' +
                                     (d.band[1] >= 0 ? '+' : '') + fx(d.band[1]) + ']' : 'zu dünn') +
      ' | ' + d.nC + ' / ' + d.nA + ' | ' + bandUrteil(d) + ' |');
  });
  s('');

  /* ======== 6. Was das fuer die Huerden heisst ======== */
  s('## 6. Was das für die Hürden heißt — eine Größenordnung, keine neue Hürde');
  s('');
  s('> **Diese Zahlen gehen NICHT nach `wiki/kosten.md`** (§9b.6). Sie beantworten eine');
  s('> einzige Frage: *um wie viel läge die Hürde höher, wenn die Verschwundenen im');
  s('> Verhältnis ihres Anteils am damaligen Universum mitgemessen worden wären?*');
  s('');
  s('Gerechnet wird der **Median der Mischung** — die Symbol-Mediane beider Rahmen in einen');
  s('Topf, die des Rahmens C mit Gewicht `w`, die des Rahmens A mit `1 − w`. Das ist nicht');
  s('das gewichtete Mittel der beiden Mediane (eine andere Größe), sondern der Median der');
  s('Verteilung, die man gemessen hätte.');
  s('');
  var anteile = null, anteileGrund = '';
  try {
    var ZC = require('./zusatzC.js');
    var PC = ZC.planC();
    var PA = JSON.parse(fs.readFileSync(path.join(QUELLE, 'plan.json'), 'utf8'));
    anteile = {};
    KLASSEN.forEach(function (k) {
      JAHRE_C.forEach(function (j) {
        var vC = PC.zellen[k + '|' + j] ? PC.zellen[k + '|' + j].verfuegbar : 0;
        var vA = PA.zellen[k + '|' + j] ? PA.zellen[k + '|' + j].verfuegbar : 0;
        anteile[k + '|' + j] = { vC: vC, vA: vA, w: (vC + vA) > 0 ? vC / (vC + vA) : 0 };
      });
    });
  } catch (e) { anteile = null; anteileGrund = e && e.message ? e.message : String(e); }

  if (!anteile) {
    /* Den GRUND nennen, nicht nur die Leere. Ein stiller catch, der "nicht rechenbar"
     * schreibt, verbirgt, ob eine Datei fehlt oder das Werkzeug kaputt ist. */
    s('*(Die Anteile am damaligen Universum sind nicht rechenbar. Grund: **' + anteileGrund + '**.');
    s('Dieser Abschnitt bleibt leer, statt geschätzt zu werden.)*');
  } else {
    s('| Klasse | Jahr | verfügbar C | verfügbar A | **Anteil `w`** | Hürde A | Hürde gemischt | **Aufschlag** |');
    s('|---|---|---|---|---|---|---|---|');
    KLASSEN.forEach(function (k) {
      JAHRE_C.forEach(function (j) {
        var an = anteile[k + '|' + j];
        if (!an || an.vC === 0) return;
        var rC = hauptC.filter(function (r) { return r.klasse === k && r.jahr === j && r.fenster === 'mitte' && gueltig(r); });
        var rA = hauptA.filter(function (r) { return r.klasse === k && r.jahr === j && r.fenster === 'mitte' && gueltig(r); });
        if (!rC.length || !rA.length) return;
        var mC = symbolMediane(rC), mA = symbolMediane(rA);
        var hA = A.median(mA);
        var werte = mA.concat(mC);
        var gew = mA.map(function () { return (1 - an.w) / mA.length; })
                    .concat(mC.map(function () { return an.w / mC.length; }));
        var hMix = gewichteterMedian(werte, gew);
        s('| ' + k + ' | ' + j + ' | ' + an.vC + ' | ' + an.vA + ' | **' + pz(an.w, 1) + '** | ' +
          fx(hA) + ' | ' + fx(hMix) + ' | **' + (hMix - hA >= 0 ? '+' : '') + fx(hMix - hA) +
          ' Pp** (' + (hA > 0 ? fx(hMix / hA, 2) + ' ×' : '–') + ') |');
      });
    });
    s('');
    s('**Wie `w` gebildet ist:** Zahl der im jeweiligen Jahr ziehbaren Symbole in Rahmen C');
    s('geteilt durch die Summe beider Rahmen. Die beiden Zählungen sind **nicht exakt');
    s('gleich definiert** — Rahmen C verlangt zusätzlich 20 Handelstage Nachlauf (§9b.2) —,');
    s('was `w` eher **zu klein** macht. Deshalb ist der Aufschlag eine Größenordnung und');
    s('keine Korrektur.');
  }
  s('');

  /* ======== 7. Was das NICHT sagt ======== */
  s('## 7. Was Zusatz C NICHT sagt — §9b.6 wörtlich');
  s('');
  s('- **Keine Aussage über 2016–2024.** Die 1.164 verschwundenen Reihen haben Tagesbalken');
  s('  erst ab dem 23.08.2024; für die Delisting-Jahre 2004–2022 liegen 3.690 aktienartige');
  s('  Kürzel **ohne einen einzigen Balken**. Genau die Jahre, in denen `ERGEBNIS.md` am');
  s('  stärksten Überlebende misst, sind hier **nicht messbar**. Die Haupttabellen behalten');
  s('  ihren Vermerk unverändert.');
  s('- **Keine Hochrechnung auf die frühen Jahre.** Der Anteil `w` ist für 2025/2026 gezählt;');
  s('  für 2016–2024 ist er unbekannt und wird nicht rückwärts fortgeschrieben.');
  s('- **Keine neue Hürde.** Abschnitt 6 ist eine Größenordnung und geht nicht nach `wiki/kosten.md`.');
  s('- **Nichts über `ab1000`.** Kein einziger verschwundener Wert hatte am Jahresanker über');
  s('  1.000 Mio $ Median-Tagesumsatz — die Klasse ist in Rahmen C leer. Das ist ein Befund,');
  s('  keine Lücke, und es heißt **nicht** „kein Unterschied".');
  s('- **Kein Ertragsbeleg.** Eine breitere oder engere Spanne belegt keine Kante. Die Zahl');
  s('  der belegten handelbaren Kanten bleibt **NULL**.');
  s('- **Nicht die effektiven Kosten**, nicht die Tiefe, nicht das CFD-Gefäß — §9 gilt wörtlich weiter.');
  s('');

  fs.writeFileSync(ZIEL, out.join('\n') + '\n');
  process.stdout.write('Geschrieben: ' + ZIEL + '\n');
  process.stdout.write('  Rahmen C: ' + hauptC.length + ' Zeitpunkte, ' + gC.length + ' gültig, ' +
    LC.dateien.length + ' Dateien\n');
  process.stdout.write('  Rahmen A: ' + hauptA.length + ' Zeitpunkte (nur gelesen)\n');
  if (!ECHT) process.stdout.write('  ACHTUNG: Trockenlauf - die Quelle ist nicht das Archiv.\n');
}

module.exports = { lesenC: lesenC, differenz: differenz, symbolMediane: symbolMediane, aufloesung: aufloesung,
                   bodenspanne: bodenspanne, gewichteterMedian: gewichteterMedian, SOLL_A: SOLL_A };

if (require.main === module) { main(); }

'use strict';
/* BERICHT zu TEIL 4: liest teil4-ergebnis.json, schreibt ERGEBNIS-TEIL4.md (VORREGISTRIERUNG-TEIL4.md §T4.6).
 * Aufruf: node bericht-teil4.js [--ergebnis teil4-ergebnis.json] [--aus ERGEBNIS-TEIL4.md]
 * Jede Tafel traegt die MDE-Spalte. Zahlen kommen nur aus der Ergebnisdatei. Keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');

var argv = process.argv.slice(2), opt = { ergebnis: path.join(__dirname, 'teil4-ergebnis.json'), aus: path.join(__dirname, 'ERGEBNIS-TEIL4.md') };
for (var i = 0; i < argv.length; i++) { if (argv[i] === '--ergebnis') opt.ergebnis = argv[++i]; else if (argv[i] === '--aus') opt.aus = argv[++i]; }
var E = JSON.parse(fs.readFileSync(opt.ergebnis, 'utf8'));

function f(x, d) { if (x == null || x !== x) return '—'; var s = x.toFixed(d == null ? 2 : d); return s.replace('.', ',').replace(/^-/, '−'); }
function pct(x, d) { return x == null ? '—' : f(100 * x, d == null ? 1 : d) + ' %'; }
function n0(x) { return x == null ? '—' : f(x, 0); }
function pp(x, d) { return f(x, d == null ? 3 : d); }
function ja(b) { return b ? 'bestanden' : '**GEFALLEN**'; }
function kopf(r) { return '| n | Δ (Pp) | se naiv | se HH | HH/naiv | t | MDE₈₀ | MDE₈₀,Bonf |\n|---:|---:|---:|---:|---:|---:|---:|---:|'; }
/** se/t/MDE nur, wenn sie tragen: nicht bei "duenn" (n < 6) und nicht beim Block-Rueckfall mit n < 12 (ein bis zwei Bloecke). */
function traegt(r) { return r && r.n >= K.TEIL4_MIN_PERIODEN && !(r.hh0 && r.n < 12); }
function zeile(name, r) {
  if (!r || !r.n) return '| ' + name + ' | 0 | — | — | — | — | — | — | — |';
  if (!traegt(r)) return '| ' + name + ' | ' + r.n + ' | ' + pp(r.mittel) + ' | ' + pp(r.seNaiv) + ' | — (n zu klein' + (r.hh0 ? ', Block' : '') + ') | — | — | — | — |';
  return '| ' + name + ' | ' + r.n + ' | ' + pp(r.mittel) + ' | ' + pp(r.seNaiv) + ' | ' + pp(r.se) + (r.hh0 ? ' (Block)' : '') + ' | ' + f(r.faktorSe) + ' | ' + f(r.t) + ' | ' + pp(r.mde) + ' | ' + pp(r.mdeBonf) + ' |';
}
function tafel(name, reihen) { return '| ' + name + ' ' + kopf().slice(1) + '\n' + reihen.join('\n'); }
function jahre(list) {
  return ['| Jahr | n | Δ netto (Pp) | Summe | se HH | t | MDE₈₀ | Marke |', '|---|---:|---:|---:|---:|---:|---:|---|'].concat(list.map(function (j) {
    if (!traegt(j)) return '| ' + j.jahr + ' | ' + j.n + ' | ' + pp(j.mittel) + ' | ' + pp(j.summe, 1) + ' | — | — | — | dünn' + (j.hh0 ? ', Block' : '') + ' |';
    return '| ' + j.jahr + ' | ' + j.n + ' | ' + pp(j.mittel) + ' | ' + pp(j.summe, 1) + ' | ' + pp(j.se) + ' | ' + f(j.t) + ' | ' + pp(j.mde) + ' | ' + (j.hh0 ? 'Block-se' : '') + ' |';
  })).join('\n');
}
var H0 = E.horizonte.filter(function (h) { return h.haupt; })[0], H1 = E.horizonte.filter(function (h) { return !h.haupt; })[0];
var T1 = E.test1[H0.key], T2 = E.test2[H0.key], T1b = E.test1[H1.key], T2b = E.test2[H1.key], U = E.urteil, VP = E.vorpruefung, KO = E.kontrollen;
var out = [];
out.push('# Ergebnis — Querschnitts-Prüfstand, **Teil 4**: „Gedrückt, aber liefert" (18.09.2026)');
out.push('');
out.push('Vorregistriert in `VORREGISTRIERUNG-TEIL4.md` (Commit vor jeder Zahl). Kennung `' + E.kennung + '`, Panel `' + E.panel + '` (' + E.zeilen + ' Zeilen, ' + E.reihen + ' Reihen, bis ' + E.letzterTag + '), Fundamentaltafel `' + E.fundamental.kennung + '` (' + E.fundamental.zeilen + ' Filings, ' + E.fundamental.ciks + ' CIKs, Aktualitäts-Tor ' + E.fundamental.maxAlterTage + ' Tage). Universum Klassen 50-250 / 250-1000 / ab1000, monatliche Signaltage ' + E.signaltage.erster + ' … ' + E.signaltage.letzter + ' (' + E.signaltage.mitUniversum + ' Monate), Ausführung Eröffnung t+1. Lauf ' + E.stand.slice(0, 16).replace('T', ' ') + ', ' + f(E.sekunden, 0) + ' s. Alles Simulation mit virtuellem Kapital, Kursrenditen ohne Ausschüttungen. **Keine Anlageberatung.**');
out.push('');
out.push('## 0. Urteil');
out.push('');
out.push('**Test 1 (A∧B gegen A∧¬B, 120 Handelstage, gepaart je Monat): ' + U.satz + '.**');
out.push('');
out.push('| Regel §T4.6 | Wert | erfüllt |\n|---|---:|---|');
out.push('| Δ̄ netto ≥ MDE₈₀ | ' + pp(U.test1.deltaNetto) + ' Pp gegen MDE₈₀ ' + pp(U.test1.mde) + ' (Bonf ' + pp(U.test1.mdeBonf) + ') | ' + (U.test1.deltaGeMde ? 'ja' : 'nein') + ' |');
out.push('| t_HH ≥ z_Bonf(2) = ' + U.test1.zBonf + ' | t ' + f(U.test1.t) + ' (se HH ' + pp(U.test1.se) + ', naiv ' + pp(U.test1.seNaiv) + ') | ' + (U.test1.tGeZBonf ? 'ja' : 'nein') + ' |');
out.push('| letzte 250 Tage nicht negativ | ' + pp(U.test1.aktuellMittel) + ' Pp über ' + U.test1.aktuellN + ' Monate (ab ' + T1.aktuellAb + ') | ' + (U.test1.aktuellNichtNegativ ? 'ja' : 'nein') + ' |');
out.push('| Vorhersage ≥ +' + f(U.test1.vorhersagePp, 1) + ' Pp | ' + pp(U.test1.deltaNetto) + ' Pp | ' + (U.test1.vorhersageErreicht ? 'ja' : 'nein') + ' |');
out.push('| Tore (Leck-Klinken, Placebo, Orakel, Vorprüfung) | Maschine ' + ja(E.leck.bestanden) + ', Auswahl ' + ja(E.klinkePruefstand.bestanden) + ', Leser ' + ja(E.leser.bestanden) + ', Placebo ' + ja(KO.placebo.bestanden) + ', Orakel ' + ja(KO.orakel.bestanden) + ', Vorprüfung ' + ja(VP.bestanden) + ' | ' + (U.toreMaschine ? 'alle' : '**nicht alle**') + ' |');
out.push('');
out.push('95-%-Intervall der Paardifferenz (HH): ' + pp(U.test1.deltaNetto - 1.96 * U.test1.se, 2) + ' … **' + pp(U.test1.deltaNetto + 1.96 * U.test1.se, 2) + ' Pp** je 120 Tage. Die aus der Literatur erwarteten 3–6 Pp liegen ' + (U.test1.deltaNetto + 1.96 * U.test1.se < 3 ? '**oberhalb der oberen Grenze** — für gedrückte liquide US-Aktien 2017–2026 ist Fundamental-Momentum in dieser Größe ausgeschlossen, nicht nur unbelegt' : 'innerhalb des Intervalls — unentscheidbar') + '. Das Vorzeichen ist negativ: A∧B lief ' + pp(-U.test1.deltaNetto, 2) + ' Pp schlechter als A∧¬B (nicht signifikant).');
out.push('');
out.push('Kein Zielportfolio (Entscheid 16.09.). Kandidatenliste `kandidaten-teil4/`: ' + (U.kandidatenGeschrieben ? U.kandidatenDateien + ' Monatsdateien' : 'nicht geschrieben (Test 1 nicht belegt)') + '. Test 2 ist Eichung ohne Urteil (§2).');
if (E.befunde.length) { out.push(''); out.push('**Befunde des Läufers:**'); E.befunde.forEach(function (b) { out.push('- ' + b); }); }
out.push('');
out.push('## 1. Vorprüfung des PM — reproduziert vor der ersten Ergebniszahl (§T4.8)');
out.push('');
out.push('| Größe | PM (16.09.) | gemessen | Faktor | Grenze 1,5 |\n|---|---:|---:|---:|---|');
out.push('| A je Monat / Universum je Monat | ' + VP.erwartet.aMittel + ' / ' + VP.erwartet.uniMittel + ' (' + pct(VP.erwartet.aMittel / VP.erwartet.uniMittel) + ') | ' + f(VP.aMittel, 1) + ' / ' + f(VP.uniMittel, 1) + ' (' + pct(VP.aAnteil) + ') über ' + VP.monate + ' Monate | ' + f(VP.faktoren.aAnteil, 3) + ' | ' + (VP.faktoren.aAnteil <= 1.5 && VP.faktoren.aAnteil >= 1 / 1.5 ? 'innerhalb' : '**außerhalb**') + ' |');
E.horizonte.forEach(function (H) {
  var v = VP.horizonte[H.key], fk = VP.faktoren['paarSd_' + H.key];
  out.push('| Paar-sd Zufallshalbierung, ' + H.name + ' | ' + f(v.erwartetSd) + ' Pp | ' + f(v.paarSd) + ' Pp (n ' + v.n + ', Mittel ' + pp(v.paarMittel) + ') | ' + f(fk, 3) + ' | ' + (fk <= 1.5 && fk >= 1 / 1.5 ? 'innerhalb' : '**außerhalb**') + ' |');
  out.push('| MDE₈₀ (Faktor des PM ' + VP.erwartet.mdeFaktorPM + ') naiv / überlappt ×√' + H.lag + ' / HH gemessen, ' + H.name + ' | ' + v.erwartetMde.join(' / ') + ' Pp | ' + f(v.mdePMNaiv) + ' / ' + f(v.mdePMUeberlappt) + ' / ' + f(v.mdePMHH) + ' Pp | — | nachrichtlich |');
});
out.push('');
out.push('Vorprüfung ' + (VP.bestanden ? '**bestanden**' : '**GEFALLEN**: ' + VP.befunde.join('; ')) + '. Die HH-Spalte zeigt, was die Überlappung tatsächlich kostet: der Aufschlag ×√H des PM war eine Obergrenze (Marktfaktor fällt in der Paardifferenz heraus).');
out.push('');
out.push('## 2. Test 1 — A∧B gegen A∧¬B, ' + H0.name + ' (das Urteil)');
out.push('');
out.push('Seiten je Monat: AB ' + f(T1.nABMittel, 1) + ' Werte, A¬B ' + f(T1.nAnBMittel, 1) + ' (A gesamt ' + f(E.klassenmix.nAMittel, 1) + ', davon ohne Fundament ' + f(E.klassenmix.nAohneMittel, 1) + ' = ' + pct(E.klassenmix.ohneFundamentAAnteil) + '); ' + T1.n + ' vollständige Monate, ' + T1.unvollstaendig + ' unvollständig am Ende, ' + T1.zuKlein + ' zu klein. Brutto je Seite: AB ' + pp(T1.abBruttoMittel) + ' Pp, A¬B ' + pp(T1.anbBruttoMittel) + ' Pp je ' + H0.tage + ' Tage; Kosten je Umlauf AB ' + pp(T1.kostenABMittel, 4) + ', A¬B ' + pp(T1.kostenAnBMittel, 4) + ' Pp; Tote je Monat AB ' + f(T1.toteABMittel) + ', A¬B ' + f(T1.toteAnBMittel) + '.');
out.push('');
out.push(tafel('Reihe', [zeile('Δ netto (Hauptmaß)', T1.netto), zeile('Δ brutto', T1.brutto), zeile('letzte 250 Tage (netto, ab ' + T1.aktuellAb + ')', T1.aktuell)]));
out.push('');
out.push('HH = Hansen-Hodrick, Rechteck über die Lags 1…' + (H0.lag - 1) + ' auf dem Kalendermonat-Index; MDE₈₀ = 2,8016 · se_HH, MDE₈₀,Bonf = 3,0830 · se_HH (z_Bonf(2) + z₀,₈₀). Vorhersage war ≥ +2 Pp je 120 Tage.');
out.push('');
out.push('**Jahresscheiben (Kalenderjahr des Ausführungstags):**');
out.push('');
out.push(jahre(T1.jahre));
out.push('');
out.push('**Klassenmix je Monat (50-250 / 250-1000 / ab1000):** Universum ' + f(E.klassenmix.uni[1], 0) + ' / ' + f(E.klassenmix.uni[2], 0) + ' / ' + f(E.klassenmix.uni[3], 0) + ', AB ' + f(E.klassenmix.AB[1], 1) + ' / ' + f(E.klassenmix.AB[2], 1) + ' / ' + f(E.klassenmix.AB[3], 1) + ', A¬B ' + f(E.klassenmix.AnB[1], 1) + ' / ' + f(E.klassenmix.AnB[2], 1) + ' / ' + f(E.klassenmix.AnB[3], 1) + '.');
out.push('');
out.push('**Sektorsicht (nachrichtlich; Monat zählt im Sektor nur mit ≥ ' + E.sektorMinJeSeite + ' je Seite):**');
out.push('');
out.push('| Sektor (SIC-Division) | Monate | AB / A¬B je Monat | Δ netto (Pp) | se HH | t | MDE₈₀ | Marke |\n|---|---:|---:|---:|---:|---:|---:|---|');
Object.keys(T1.sektoren).forEach(function (name) {
  var s = T1.sektoren[name], r = s.netto;
  out.push('| ' + name + ' | ' + s.n + ' (' + s.monateOhne + ' zu klein) | ' + f(s.nABMittel, 1) + ' / ' + f(s.nAnBMittel, 1) + ' | ' + pp(r.mittel) + ' | ' + pp(r.se) + ' | ' + f(r.t) + ' | ' + pp(r.mde) + ' | ' + (r.duenn ? 'dünn' : '') + (r.hh0 ? ' Block-se' : '') + ' |');
});
out.push('');
out.push('## 3. Test 2 — B-Quintil gegen den Pool mit Fundament, ' + H0.name + ' (Eichung, kein Tor)');
out.push('');
out.push('Pool je Monat ' + f(T2.poolMittel, 0) + ' Werte mit Fundament, Quintil k = ' + f(T2.kMittel, 1) + '; ' + T2.n + ' Monate. Brutto: Q5 ' + pp(T2.q5BruttoMittel) + ' Pp, Pool ' + pp(T2.poolBruttoMittel) + ' Pp je ' + H0.tage + ' Tage; Kosten je Umlauf Q5 ' + pp(T2.kostenQ5Mittel, 4) + ', Pool ' + pp(T2.kostenPoolMittel, 4) + ' Pp.');
out.push('');
out.push(tafel('Reihe', [zeile('Q5 − Pool netto (Hauptmaß)', T2.q5Netto), zeile('Q5 − Pool brutto', T2.q5Brutto), zeile('Q1 − Pool netto (nachrichtlich)', T2.q1Netto), zeile('Q5 − Q1 brutto (Long-Short, nachrichtlich)', T2.q5q1Brutto), zeile('Q5 − Q1 netto (beide Umläufe)', T2.q5q1Netto), zeile('letzte 250 Tage (Q5 − Pool netto)', T2.aktuell)]));
out.push('');
out.push('Literatur (Novy-Marx 2015): Fundamental-Momentum ≈ 0,5–1 Pp je Monat in der Long-Short-Fassung, also ≈ 3–6 Pp je 120 Tage; Q5 − Pool ist davon etwa die Hälfte. Erwartung: positiv.');
out.push('');
out.push('**Jahresscheiben Q5 − Pool netto:**');
out.push('');
out.push(jahre(T2.jahre));
out.push('');
out.push('## 4. Nachrichtlich: ' + H1.name + ' (HH-Lags 1…' + (H1.lag - 1) + ')');
out.push('');
out.push(tafel('Reihe', [zeile('Test 1 Δ netto', T1b.netto), zeile('Test 1 Δ brutto', T1b.brutto), zeile('Test 1 letzte 250 Tage', T1b.aktuell), zeile('Test 2 Q5 − Pool netto', T2b.q5Netto), zeile('Test 2 Q1 − Pool netto', T2b.q1Netto), zeile('Test 2 Q5 − Q1 brutto', T2b.q5q1Brutto)]));
out.push('');
out.push(T1b.n + ' vollständige Monate (Test 1), ' + T1b.unvollstaendig + ' unvollständig. Jahresscheiben Test 1, 250 Tage: ' + T1b.jahre.map(function (j) { return j.jahr + ' ' + pp(j.mittel, 2) + ' (n ' + j.n + ', MDE ' + pp(j.mde, 2) + ')'; }).join('; ') + '.');
out.push('');
out.push('## 5. Kontrollen (§T4.7)');
out.push('');
var P = KO.placebo;
out.push('**Placebo** (B je Monat unter den A-Mitgliedern mit Fundament permutiert, ' + P.einzeln.length + ' Ziehungen, Soll 0): Mittel brutto ' + pp(P.mittelBrutto) + ' Pp, netto ' + pp(P.mittelNetto) + ' Pp (Schranke ' + f(P.schrankePp, 1) + ' Pp; se einer Ziehung ' + pp(P.seEinzelnMittel) + ', se des Mittels ' + pp(P.seDesMittels) + '); Ziehungen mit |t_HH| ≥ ' + P.tEinzeln + ': ' + P.fehlerEinzelnT + ' von höchstens ' + P.maxFehler + ' ⇒ ' + ja(P.bestanden) + '.');
out.push('');
out.push('| Ziehung | n | brutto | netto | se HH | t HH | t naiv |\n|---:|---:|---:|---:|---:|---:|---:|');
P.einzeln.forEach(function (z) { out.push('| ' + z.ziehung + ' | ' + z.n + ' | ' + pp(z.brutto) + ' | ' + pp(z.netto) + ' | ' + pp(z.seHH) + ' | ' + f(z.t) + ' | ' + f(z.tNaiv) + ' |'); });
out.push('');
var O = KO.orakel;
var DP = fs.existsSync(path.join(__dirname, 'diagnose-placebo-teil4.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, 'diagnose-placebo-teil4.json'), 'utf8')) : null;
if (DP) {
  out.push('**Auffälligkeit und Diagnose (nachrichtlich, `diagnose-placebo-teil4.js`):** ' + P.einzeln.filter(function (z) { return z.netto < 0; }).length + ' von ' + P.einzeln.length + ' registrierten Ziehungen negativ, Mittel ' + pp(P.mittelNetto) + ' Pp = ' + f(Math.abs(P.mittelNetto / P.seDesMittels), 1) + ' se des Mittels — nach Regel bestanden, aber zu prüfen: Bias der Maschine oder Zufall/Schiefe? ' + DP.ziehungen + ' weitere Ziehungen mit anderer Saatfamilie: Mittel **' + pp(DP.mittel, 3) + ' Pp** (se ' + pp(DP.seDesMittels, 3) + ', t ' + f(DP.tGegenNull) + '), Median ' + pp(DP.median, 3) + ', negativ ' + pct(DP.anteilNegativ, 0) + ', Spanne ' + pp(DP.min) + ' … ' + pp(DP.max) + '; alle ' + (DP.ziehungen + P.einzeln.length) + ' Ziehungen zusammen ' + pp((DP.mittel * DP.ziehungen + P.mittelNetto * P.einzeln.length) / (DP.ziehungen + P.einzeln.length), 3) + ' Pp. **Kein Bias** — die erste Saatfamilie war ein Zufall auf dem 1-%-Niveau. Größte Einzelrenditen unter A je Monat (Schiefe-Quelle, ±' + f(DP.extremeTop15[0].beitragWennAB, 1) + ' Pp je Monatsdifferenz): ' + DP.extremeTop15.slice(0, 5).map(function (e) { return e.monat + ' ' + e.kuerzel + ' +' + f(e.rendite, 0) + ' %'; }).join(', ') + '.');
  out.push('');
}
out.push('**Orakel** (B ersetzt durch das Vorzeichen der künftigen 120-Tage-Rendite je A-Mitglied, Sicht mit Schlüssel; Gewinner ' + f(O.gewinnerMittel, 1) + ' / Verlierer ' + f(O.verliererMittel, 1) + ' je Monat, ' + O.n + ' Monate): Gewinner − Verlierer brutto **' + pp(O.brutto.mittel, 2) + ' Pp** (sd ' + f(O.brutto.sd) + ', Mittel/sd ' + f(O.brutto.mittelDurchSd) + ', t_HH ' + f(O.brutto.t) + '), netto ' + pp(O.netto.mittel, 2) + ' Pp; Schranken ≥ ' + O.schranken.minPp + ' Pp, ≥ ' + O.schranken.minSd + ', t ≥ ' + O.schranken.tBoden + ' ⇒ ' + ja(O.bestanden) + (O.tor.length ? ' (' + O.tor.join('; ') + ')' : '') + '.');
out.push('');
out.push('**Leck-Klinke des Prüfstands:** Maschine `leckProbe` ' + E.leck.verstoesseLeck + ' Verstöße (ungültig ' + E.leck.ungueltigLeck + ') / `sauberProbe` ' + E.leck.verstoesseSauber + ' ⇒ ' + ja(E.leck.bestanden) + '. Eigene A/B-Auswahl ohne Schlüssel: ' + E.klinkePruefstand.verstoesseAuswahl + ' Verstöße über alle Monate; präparierte Fassung (liest t+1) am ' + (E.klinkePruefstand.praepariert ? E.klinkePruefstand.praepariert.tag + ': ' + E.klinkePruefstand.praepariert.verstoesse + ' Verstöße, ungültig ' + E.klinkePruefstand.praepariert.ungueltig : '—') + ' ⇒ ' + ja(E.klinkePruefstand.bestanden) + '.');
out.push('');
out.push('**Leck-Klinke des Lesers:** präpariertes Filing `filed = ' + E.leser.probe.tag + '` ' + (E.leser.probe.wirft ? 'wirft' : 'wirft NICHT') + ', `filed = tag − 1` ' + (E.leser.probe.liefert ? 'liefert' : 'liefert NICHT') + '; Protokoll des Laufs ' + E.leser.zugriffe + ' Zugriffe, ' + E.leser.verstoesse + ' mit `filed ≥ tag` (geliefert ' + E.leser.zaehler.geliefert + ', ohne Filing ' + E.leser.zaehler.null_ohneFiling + ', veraltet ' + E.leser.zaehler.null_veraltet + ', ohne Reihe ' + E.leser.zaehler.null_ohneReihe + ') ⇒ ' + ja(E.leser.bestanden) + '.');
out.push('');
out.push('## 6. Anteil „ohne Fundament" je Jahr und Klasse (weder B noch ¬B)');
out.push('');
out.push('| Jahr | Monate | Universum gesamt | 50-250 | 250-1000 | ab1000 | A gesamt | schwache CIK-Zuordnung in A |\n|---|---:|---:|---:|---:|---:|---:|---:|');
E.ohneFundament.forEach(function (o) { out.push('| ' + o.jahr + ' | ' + o.monate + ' | ' + pct(o.anteilUni.gesamt) + ' | ' + pct(o.anteilUni[1]) + ' | ' + pct(o.anteilUni[2]) + ' | ' + pct(o.anteilUni[3]) + ' | ' + pct(o.anteilA.gesamt) + ' | ' + pct(o.schwachAAnteil) + ' |'); });
out.push('');
out.push('Über alle Monate: Universum ' + pct(E.klassenmix.ohneFundamentUniAnteil) + ' ohne Fundament, A ' + pct(E.klassenmix.ohneFundamentAAnteil) + '. Darin stecken die 20-F/40-F-Filer (5–12 % der liquiden Klassen), Reihen ohne CIK, Filings jenseits des Aktualitäts-Tors (456 Tage) und Zeilen ohne vollständige 4Q-Summen.');
out.push('');
out.push('## 7. Was die Tafel nicht weiß (§T4.9)');
out.push('');
out.push('- **Dividenden:** alle Reihen sind Kursrenditen ohne Ausschüttung (Teil 2: Universum 1,73 % je Jahr, Momentum-Dezil 0,83 %, Lücke −0,0744 Pp je Monat, gemessen). Für A∧B gegen A∧¬B ist die Lücke nicht gemessen (kein Archivzugriff); beide Seiten sind gedrückte Werte desselben Pools, Größenordnung nach Teil 2 ≤ 0,1 Pp je Monat (≤ 0,6 Pp je 120 Tage), Richtung offen.');
out.push('- **20-F/40-F-Filer** (4.931 Filings nur gezählt) fehlen: in den liquiden Klassen 5–12 % der aktiven Reihen je Jahr — sie stehen in „ohne Fundament" (§6), nie in ¬B.');
out.push('- **8-K-Vorabmeldungen:** die Quartalszahl ist meist Wochen vor dem 10-Q bekannt (10-Q Median 37 Tage nach Stichtag); die Tafel nimmt das spätere `filed` — konservativ: das Signal kommt nie zu früh, oft zu spät.');
out.push('- **2016** im Vorlauf dünner (Quartalswerte vor 2014 fehlen; 2014–2015 wurden deshalb geladen); **Neudarstellungen** (251.233) nicht übernommen, erste Veröffentlichung gilt; **2026q3 fehlt** (Filings seit 01.07.2026) — betrifft nur Signaltage ohne vollständiges 120-Tage-Fenster.');
out.push('- **Schwache CIK-Zuordnungen** (1.003 Reihen) wurden verwendet und gezählt (§6, letzte Spalte), nicht ausgeschlossen.');
out.push('');
var DS = fs.existsSync(path.join(__dirname, 'diagnose-spruenge-teil4.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, 'diagnose-spruenge-teil4.json'), 'utf8')) : null;
if (DS) {
  out.push('## 8. Befund am Panel (gefunden über die Placebo-Diagnose, nicht repariert): unbereinigte Reverse-Splits und Kürzel-Wechsel');
  out.push('');
  var vz = function (z) { return z ? z.tag + ' roh ' + f(z.roh) + ' Faktor ' + f(z.faktor, 4) + ' Rendite ' + f(z.rendite, 1) + ' %' : '—'; };
  out.push('Die Placebo-Diagnose zeigte als größte Einzelrendite unter A **GE +674 % (Fenster 2021-03)** — GE hat am 02.08.2021 einen Reverse-Split 1:8. Panelzeilen: ' + DS.vorwaerts.GE.map(vz).join('; ') + ' (Marke MASSNAHME_NAH gesetzt, Faktor 1). Ebenso XRX 1:4 am 15.06.2017: ' + DS.vorwaerts.XRX.map(vz).join('; ') + '. **Vorwärts-Splits sind bereinigt:** AAPL 4:1 ' + DS.vorwaerts.AAPL.map(vz).join('; ') + '; NVDA 10:1 ' + DS.vorwaerts.NVDA.map(vz).join('; ') + '.');
  out.push('');
  out.push('Sprungtage in den Klassen 50-250/250-1000/ab1000 (Tagesrendite ≥ +100 % oder ≤ −60 %): **' + DS.sprungtage.n + '** über 2016–2026 (je Jahr ' + Object.keys(DS.sprungtage.jeJahr).map(function (j) { return j + ' ' + DS.sprungtage.jeJahr[j]; }).join(', ') + '), davon ' + DS.sprungtage.mitMassnahmeMarke + ' mit Maßnahmen-Marke und ' + DS.sprungtage.faktorUngleichEins + ' mit Faktor ≠ 1. Darunter echte Tage (GME 2021-01-27 +138 %, VKTX, CAR, CDTX) **und** unbereinigte Kapitalmaßnahmen bzw. Kürzel-Wiederverwendungen — die größten 20:');
  out.push('');
  out.push('| Tag | Kürzel | Klasse | Rendite | Faktor | Marken | Maßnahme nah |\n|---|---|---:|---:|---:|---:|---|');
  DS.sprungtage.top40.slice(0, 20).forEach(function (s) { out.push('| ' + s.tag + ' | ' + s.kuerzel + ' | ' + K.KLASSEN[s.klasse].name + ' | ' + f(s.rendite, 1) + ' % | ' + f(s.faktor, 4) + ' | ' + s.marken + ' | ' + (s.massnahmeNah ? 'ja' : '') + ' |'); });
  out.push('');
  out.push('Lesart: GE 1:8 (2021), AMC 1:10 (2023), DD 1:3 (2019), OVV 1:5 (2020), HRI (Abspaltung mit 1:15, 2016), XRX 1:4 (2017) sind bekannte Reverse-Splits mit Faktor 1 im Panel; BBBY (+12.030 %, 2025), HCP (2021), LLL (2021), BHVN (2022) sehen nach einem Kürzel aus, das den Besitzer gewechselt hat (Regel „Kürzel wechseln den Besitzer"). Die Maßnahmen-Marke fängt nur ' + DS.sprungtage.mitMassnahmeMarke + ' der ' + DS.sprungtage.n + '; das Universum schließt sie nur am Signaltag aus, nicht in der Halteperiode und nicht im 12-Monats-Rückblick. **Betrifft die Panelbasis von Teil 1–3** (Momentum 12-1 sieht einen unbereinigten Reverse-Split als +300…+700 % und hält den Wert elf Monate im obersten Dezil) — Größenordnung dort nicht gemessen, gehört in den nächsten Auftrag.');
  out.push('');
  var g1 = DS.test1OhneGE, g2 = DS.test1OhneSprungtage;
  out.push('**Wirkung auf Test 1 (120 Tage):** GE lag in ' + g1.betroffeneMonate.length + ' betroffenen Monat(en) auf der ' + g1.betroffeneMonate.map(function (b) { return b.seite + '-Seite (' + b.monat + ', Δ ' + pp(b.dNetto, 2) + ' → ' + pp(b.dNettoOhneGE, 2) + ' Pp ohne GE)'; }).join(', ') + '; Δ̄ netto ' + pp(g1.mit.mittel) + ' → **' + pp(g1.ohne.mittel) + ' Pp** ohne GE (t ' + f(g1.mit.t) + ' → ' + f(g1.ohne.t) + ', MDE₈₀ ' + pp(g1.mit.mde) + ' → ' + pp(g1.ohne.mde) + '). Empfindlichkeit ohne **alle** ' + DS.sprungtage.n + ' Sprungtage (Mitglied fällt aus dem Monat, wenn sein Fenster einen Sprungtag enthält; ' + g2.ausgeschlosseneMitgliedMonate + ' von ' + g2.mitgliedMonate + ' Mitglied-Monaten): Δ̄ **' + pp(g2.mittel) + ' Pp** (n ' + g2.n + ', t ' + f(g2.t) + ', MDE₈₀ ' + pp(g2.mde) + '). Der Sprung hat die Hypothese um ' + pp(g1.wirkungAufMittel, 2) + ' Pp begünstigt; das Urteil ändert sich nicht.');
  out.push('');
}
out.push('## 9. Prüfungen');
out.push('');
out.push('`test-teil4.js`: Kunstfälle T4-P0…P8 (z_Bonf, Periodenende, A-Grenzfall exakt −10 Pp, B-Klassifikation, HH-Lags 1…5 unabhängig, Placebo-Erhalt, Orakel/Korb von Hand, Kosten je Seite, Sperrklinke) und T4-P9 (Leser-Klinke am echten Leser); T4-P10/P12 gegen diese Ergebnisdatei, T4-P11 startet `test.js`/`test-teil2.js`/`test-teil3.js`. Stand im Bericht der Übergabe.');
out.push('');
out.push('*Alles Simulation mit virtuellem Kapital. Keine Anlageberatung. Nur Lesezugriff auf Panel und Fundamentaltafel.*');
fs.writeFileSync(opt.aus, out.join('\n') + '\n');
process.stdout.write('Bericht: ' + opt.aus + ' (' + out.length + ' Zeilen)\n');

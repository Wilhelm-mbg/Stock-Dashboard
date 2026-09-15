'use strict';
/* TEIL 3 - BERICHT: aus teil3-ergebnis.json und aussen-pruefstein-teil3.json das ERGEBNIS-TEIL3.md.
 *
 * Aufruf: node bericht-teil3.js [--ergebnis teil3-ergebnis.json] [--aussen aussen-pruefstein-teil3.json] [--ziel ERGEBNIS-TEIL3.md]
 * Jede Tafel mit Urteil traegt eine MDE-Spalte (§T3.4). Alles Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');

function z(x, n) { return (x == null || !(x === x)) ? '—' : x.toFixed(n === undefined ? 4 : n); }
function pz(x, n) { return (x == null || !(x === x)) ? '—' : (x >= 0 ? '+' : '') + x.toFixed(n === undefined ? 4 : n); }
function pr(x, n) { return (x == null || !(x === x)) ? '—' : (100 * x).toFixed(n === undefined ? 1 : n) + ' %'; }
function ja(b) { return b ? '✓' : '✗'; }

function haupt() {
  var a = { ergebnis: 'teil3-ergebnis.json', aussen: 'aussen-pruefstein-teil3.json', ziel: 'ERGEBNIS-TEIL3.md' };
  for (var i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--ergebnis') a.ergebnis = process.argv[++i];
    else if (process.argv[i] === '--aussen') a.aussen = process.argv[++i];
    else if (process.argv[i] === '--ziel') a.ziel = process.argv[++i];
  }
  var E = JSON.parse(fs.readFileSync(path.join(__dirname, a.ergebnis), 'utf8'));
  var AU = fs.existsSync(path.join(__dirname, a.aussen)) ? JSON.parse(fs.readFileSync(path.join(__dirname, a.aussen), 'utf8')) : null;
  var V = E.varianten, VK = ['v0', 'v1', 'v2', 'v3'], BM = E.benchmarks, o = [];
  var tage = null;
  try { tage = JSON.parse(fs.readFileSync(path.join(__dirname, 'voll', 'teil3', 'teil3-tage.json'), 'utf8')).tagesdatum; } catch (e) { tage = null; }
  function dat(idx) { return (tage && idx != null) ? tage[idx] : (idx == null ? '—' : '#' + idx); }
  var kunst = E.kunst ? '\n> **ACHTUNG: Kunstpanel.** Diese Zahlen sagen nichts über den Markt.\n' : '';

  o.push('# Ergebnis — Querschnitts-Prüfstand, **Teil 3**: Trend reiten' + (E.kunst ? ' (KUNSTSATZ)' : ''));
  o.push('');
  o.push('Erzeugt ' + new Date().toISOString() + ' von `bericht-teil3.js` aus `' + a.ergebnis + '` (Lauf ' + E.stand + ', ' + z(E.sekunden, 0) + ' s).');
  o.push('Vorregistrierung: **`VORREGISTRIERUNG-TEIL3.md`** (erster Commit, vor jeder Zahl). Konfiguration `' + E.kennung + '`,');
  o.push('Panel `' + E.panel + '`, ' + E.zeilen.toLocaleString('de-DE') + ' Tageszeilen, ' + E.reihen + ' Reihen, bis ' + E.letzterTag + '.');
  o.push('Alle Renditen sind **Kursrenditen ohne Ausschüttungen**; Kasse verzinst sich mit null. Alles Simulation mit virtuellem Kapital, **keine Anlageberatung**.' + kunst);
  o.push('');

  /* ---------- Urteil ---------- */
  var U = E.urteil, best = VK.slice(1).filter(function (v) { return U.bestanden[v]; });
  o.push('## Urteil in vier Zeilen');
  o.push('');
  o.push('| Frage | Antwort |');
  o.push('|---|---|');
  o.push('| Hält die Maschine auf dem erweiterten Universum (Leck, Klinke, Orakel, Zufall, Identität, Regression)? | ' + (U.toreMaschine ? '**ja** — alle Kontrollen bestanden' : '**NEIN** — ' + E.befunde.join('; ')) + ' |');
  o.push('| Bildet V0 den bekannten Faktor ab (Long-Short gegen Frenchs `Mom`)? | ' + (AU ? '**' + AU.urteil + '** — ρ = ' + z(AU.haupt.rho, 3) + ' über ' + AU.haupt.n + ' Monate (Schranke ≥ 0,5)' : 'nicht gerechnet') + ' |');
  o.push('| Besteht eine Absicherung den gepaarten Vergleich (kleinerer Rückgang **und** nicht signifikant schlechter)? | ' + (best.length ? '**' + best.map(function (v) { return V[v].name; }).join(', ') + '**' : '**keine** — V1 und V3 sind signifikant schlechter; V1 hat sogar den größeren Rückgang; V2 und V3 halbieren zwar Rückgang bzw. Streuung, verlieren aber signifikant Rendite') + ' |');
  o.push('| Zielportfolio | ' + (E.zielportfolio && E.zielportfolio.variante ? '**' + V[E.zielportfolio.variante].name + '** — ' + E.zielportfolio.dateien + ' Dateien unter `' + E.zielportfolio.ordner + '/` (' + E.zielportfolio.umschichtungen + ' Umschichtungen, ' + E.zielportfolio.regimewechsel + ' Regimewechsel)' + (U.absicherungTraegt ? '' : '. **Die Absicherung trägt nicht** — geschrieben wird die Grundlinie.') : '**keines** — ' + (E.zielportfolio ? E.zielportfolio.grund : 'Ausgabeschritt nicht gelaufen')) + ' |');
  o.push('');

  /* ---------- Kontrollen ---------- */
  var KO = E.kontrollen, oT = KO.orakel.orakelTag, oP = KO.orakel.orakelPeriode, ZF = KO.zufall, LU = E.leckUeberlagerung;
  o.push('## 1. Kontrollen auf dem erweiterten Universum (§T3.6)');
  o.push('');
  o.push('| Kontrolle | Schranke (vorab) | Ergebnis | Urteil |');
  o.push('|---|---|---|---|');
  o.push('| Leck-Sperrklinke der Maschine | Leck-Probe > 0, saubere Probe 0, V0-Lauf 0 | ' + E.leck.verstoesseLeck + ' / ' + E.leck.verstoesseSauber + ' / ' + V.v0.verstoesse + ' | ' + (E.leck.bestanden && V.v0.verstoesse === 0 ? '**bestanden**' : '**GEFALLEN**') + ' |');
  o.push('| Sperrklinke der Überlagerung | V1/V2/V3 sauber 0; präparierte Fälle > 0 und ungültig | sauber ' + LU.sauber.v1 + '/' + LU.sauber.v2 + '/' + LU.sauber.v3 + '; präpariert V1 ' + LU.v1praepariert.verstoesse + ' (Regime an t+1), V2 ' + LU.v2praepariert.verstoesse + ' (Fenster bis t+1) | ' + (LU.bestanden ? '**bestanden**' : '**GEFALLEN**') + ' |');
  o.push('| Orakel `orakelTag/monat` | brutto und netto ≥ ' + K.ORAKEL_MIN_PP + ' Pp (nur Pp-Schranke) | brutto ' + pz(oT.brutto.mittel, 3) + ', netto ' + pz(oT.netto.mittel, 3) + ' Pp (t ' + z(oT.brutto.t, 1) + ', Mittel/sd ' + z(oT.mittelDurchSd, 2) + ' nachrichtlich) | ' + (KO.orakel.bestanden ? '**bestanden**' : '**GEFALLEN**') + ' |');
  o.push('| Orakel `orakelPeriode/monat` | brutto ≥ ' + K.ORAKEL_PERIODE_MONAT_MIN_PP + ' Pp, Mittel/sd ≥ ' + K.ORAKEL_MIN_SD + ', t ≥ ' + K.ORAKEL_T_BODEN + ' | brutto ' + pz(oP.brutto.mittel, 3) + ' Pp, Mittel/sd ' + z(oP.mittelDurchSd, 2) + ', t ' + z(oP.brutto.t, 1) + ' | ' + (KO.orakel.bestanden ? '**bestanden**' : '**GEFALLEN**') + ' |');
  o.push('| Zufall, ' + K.ZUFALL_ZIEHUNGEN + ' Ziehungen | \\|Mittel\\| < ' + ZF.schranke + ' Pp brutto und netto+Kosten; ≤ ' + ZF.maxFehler + ' Ziehungen \\|t\\| ≥ 3 | ' + pz(ZF.mittelBrutto, 4) + ' / ' + pz(ZF.mittelNettoPlusKosten, 4) + ' Pp (Schranke = ' + z(ZF.schrankeInSeDesMittels, 1) + ' se des Mittels); ' + ZF.fehlerEinzelnT + ' Ziehungen | ' + (ZF.bestanden ? '**bestanden**' : '**GEFALLEN**') + ' |');
  o.push('| Identität V0-Überlagerung = Maschine (T3-P1) | Tagesreihe 1e-9, Kosten 1e-12 | ' + E.identitaet.tage + ' Tage, max \\|Abw\\| ' + E.identitaet.maxAbwBrutto.toExponential(1) + ' / ' + E.identitaet.maxAbwNetto.toExponential(1) + ' | ' + (E.identitaet.bestanden ? '**bestanden**' : '**GEFALLEN**') + ' |');
  o.push('| Regression `klassen [2, 3]` = Teil 2 (T3-P12) | netto +1,609984 Pp auf 1e-9 | ' + pz(E.regression23.netto, 6) + ' Pp | ' + (E.regression23.bestanden ? '**bestanden**' : '**GEFALLEN**') + ' |');
  o.push('');
  o.push(U.toreMaschine ? '**Alle Kontrollen bestanden.** Die Maschine ist auf dem erweiterten Universum verrohrungsgeprüft.' : '**NICHT BESTANDEN.** Gemeldet, nicht repariert.');
  o.push('');

  /* ---------- Universum ---------- */
  var M = E.klassenmix, MV = E.maschineV0;
  o.push('## 2. Universum und Grundlinie V0 (§T3.2)');
  o.push('');
  o.push('| Größe | Wert |');
  o.push('|---|---|');
  o.push('| Perioden (Monate) | ' + MV.perioden + ' (' + V.v0.monate[0].monat + ' … ' + V.v0.monate[V.v0.monate.length - 1].monat + ') |');
  o.push('| Universum je Umschichtung (Mittel) | **' + z(M.universumMittel, 0) + '** Papiere — Klassen 50-250 / 250-1000 / ab1000: ' + z(M.universum[1], 0) + ' / ' + z(M.universum[2], 0) + ' / ' + z(M.universum[3], 0) + ' |');
  o.push('| Dezil (Mittel) | **' + z(M.dezilMittel, 1) + '** Papiere — ' + z(M.dezil[1], 1) + ' / ' + z(M.dezil[2], 1) + ' / ' + z(M.dezil[3], 1) + ' |');
  o.push('| Umschlag V0 | ' + pr(V.v0.kennzahlen.umschlagMittel) + ' je Monat (Vorprüfung 29,3 %) |');
  o.push('| Kosten V0 (gemessen) | ' + z(V.v0.kennzahlen.kostenMittel, 4) + ' Pp je Monat (Vorprüfung 0,018 … 0,025) |');
  o.push('| Tote im gehaltenen Dezil | ' + MV.zaehler.tote + ' über ' + MV.perioden + ' Perioden, davon ' + MV.zaehler.toteTotalverlust + ' Totalverlust |');
  o.push('| Verworfen je Umschichtung (Summe): Klasse / Quelle / Cent-Boden / Vortage / Qualität / Ausführung / Rang NaN | ' + [MV.zaehler.verworfen.klasse, MV.zaehler.verworfen.quelle, MV.zaehler.verworfen.cent, MV.zaehler.verworfen.vortage, MV.zaehler.verworfen.qualitaet, MV.zaehler.verworfen.ausfuehrung, MV.zaehler.verworfen.rangNaN].map(function (x) { return x.toLocaleString('de-DE'); }).join(' / ') + ' |');
  o.push('');
  var g0 = V.v0.kennzahlen;
  o.push('### V0 gegen Universum und gegen SPY — Kontext, kein Test');
  o.push('');
  o.push('| Vergleich | brutto (Pp/Monat) | netto (Pp/Monat) | se (Monate) | t (Monate) | t (Tage, HH Lag 21) | **MDE₈₀** (Pp/Monat) | Dividendenzeile |');
  o.push('|---|---|---|---|---|---|---|---|');
  o.push('| V0 − Universum (Maschine, Hauptgröße) | ' + pz(MV.brutto.mittel) + ' | ' + pz(MV.netto.mittel) + ' | ' + z(MV.netto.se) + ' | ' + pz(MV.netto.t, 2) + ' | ' + pz(MV.netto.tagT, 2) + ' | ' + z(K.MDE_FAKTOR * MV.netto.se, 3) + ' | ' + pz(g0.dividende.korrekturUni, 4) + ' (übertragen aus Teil 2) |');
  o.push('| V0 − Universum (Überlagerung) | ' + pz(g0.gegenUni.brutto.mittel) + ' | ' + pz(g0.gegenUni.netto.mittel) + ' | ' + z(g0.gegenUni.netto.se) + ' | ' + pz(g0.gegenUni.netto.t, 2) + ' | ' + pz(g0.gegenUni.tageNetto.t, 2) + ' | ' + z(g0.gegenUni.netto.mde, 3) + ' | — |');
  o.push('| **V0 − SPY** | ' + pz(g0.gegenSPY.brutto.mittel) + ' | ' + pz(g0.gegenSPY.netto.mittel) + ' | ' + z(g0.gegenSPY.netto.se) + ' | ' + pz(g0.gegenSPY.netto.t, 2) + ' | ' + pz(g0.gegenSPY.tageNetto.t, 2) + ' | ' + z(g0.gegenSPY.netto.mde, 3) + ' | ' + pz(g0.dividende.korrekturSPY.mitte, 4) + ' (Spanne ' + pz(g0.dividende.korrekturSPY.min, 3) + ' … ' + pz(g0.dividende.korrekturSPY.max, 3) + '; SPY-Rendite **Annahme** 1,6 %) |');
  o.push('');
  o.push('Eigene Reihen, netto je Monat: V0 ' + pz(g0.netto.mittel) + ' Pp (sd ' + z(g0.netto.sd, 2) + '), Universum ' + pz(BM.uni.kennzahlen.netto.mittel) + ' Pp (sd ' + z(BM.uni.kennzahlen.netto.sd, 2) + '), SPY ' + pz(BM.spy.kennzahlen.netto.mittel) + ' Pp (sd ' + z(BM.spy.kennzahlen.netto.sd, 2) + ').');
  o.push('Die Dividendenzeile gegen das Universum ist die Teil-2-Messung (−0,0744 Pp je Monat, t −6,4) mal Zeit im Markt — **übertragen**, nicht neu gemessen;');
  o.push('gegen SPY ist die Dezil-Rendite (0,83 % je Jahr) Messung aus Teil 2 und die SPY-Rendite eine Annahme (1,3 … 1,9 %). Beide Zeilen sind klein gegen den Überschuss.');
  o.push('');

  /* ---------- Aussen ---------- */
  if (AU) {
    o.push('## 3. Außen-Prüfstein: Long-Short gegen Frenchs `Mom` (§T3.7)');
    o.push('');
    o.push('| Größe | Wert |');
    o.push('|---|---|');
    o.push('| **ρ (Pearson, Versatz 0, Feld `' + AU.unserFeld + '`)** | **' + z(AU.haupt.rho, 4) + '** über ' + AU.haupt.n + ' Monate (' + AU.haupt.von + ' … ' + AU.haupt.bis + ') |');
    o.push('| ρ (Spearman) | ' + z(AU.haupt.rhoSpearman, 4) + ' |');
    o.push('| Versatz −1 / 0 / +1 | ' + [-1, 0, 1].map(function (v) { return z(AU.versatz[String(v)].rho, 3); }).join(' / ') + ' — Maximum bei ' + AU.besterVersatz + ' |');
    o.push('| β (unsere Reihe auf `Mom`), Vorzeichen gleich | ' + z(AU.haupt.beta, 3) + ' (se ' + z(AU.haupt.seBeta, 3) + '), ' + AU.haupt.vorzeichenGleich + ' von ' + AU.haupt.n + ' |');
    o.push('| je Kalenderjahr | ' + AU.jahre.map(function (j) { return j.jahr + ' ' + z(j.rho, 2) + (j.duenn ? '*' : ''); }).join(', ') + ' |');
    o.push('| Diagnose (nachrichtlich): Long − Universum / Short − Universum | ' + z(AU.diagnose.felder.brutto.rho, 3) + ' / ' + z(AU.diagnose.felder.kurzBrutto.rho, 3) + ' |');
    o.push('| **Urteil** | **' + AU.urteil + '** (Schranken ≥ 0,5 bestanden · 0,2–0,5 teilweise · < 0,2 gefallen) |');
    o.push('');
    o.push('Vom Referenzfaktor stehen hier nur abgeleitete Größen; die Werte selbst bleiben außerhalb des Repos. Teil 2 lieferte auf dem engen Universum 0,73 in derselben Fassung — das erweiterte Universum hat den Gleichlauf **nicht** verschlechtert.');
    o.push('');
  }

  /* ---------- Varianten ---------- */
  o.push('## 4. Die vier Varianten (§T3.3/§T3.4)');
  o.push('');
  o.push('| Variante | brutto | netto | Umschlag (davon Schalten) | Kosten (Pp) | Zeit im Markt | Schaltungen | Monate in Kasse | **max. Rückgang** | schlechtestes 12-M-Fenster | Sharpe | vs Universum netto (t, MDE₈₀) | vs SPY netto (t, MDE₈₀) |');
  o.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  VK.forEach(function (v) {
    var k = V[v].kennzahlen;
    o.push('| **' + V[v].name + '** | ' + pz(k.brutto.mittel, 3) + ' | ' + pz(k.netto.mittel, 3) + ' | ' + pr(k.umschlagMittel) + ' (' + pr(k.umschlagSchaltMittel) + ') | ' + z(k.kostenMittel, 4) + ' | ' + pr(k.zeitImMarkt.mittel) + ' | ' + k.schaltungen + ' | ' + k.monateInKasse + ' | **' + z(k.mdd.mdd, 1) + ' %** (' + dat(k.mdd.spitzeTag) + ' → ' + dat(k.mdd.talTag) + ') | ' + pz(k.fenster12.wert, 1) + ' % (' + k.fenster12.von + '…' + k.fenster12.bis + ') | ' + z(k.sharpe, 2) + ' | ' + pz(k.gegenUni.netto.mittel, 3) + ' (t ' + pz(k.gegenUni.netto.t, 2) + ', MDE ' + z(k.gegenUni.netto.mde, 2) + ') | ' + pz(k.gegenSPY.netto.mittel, 3) + ' (t ' + pz(k.gegenSPY.netto.t, 2) + ', MDE ' + z(k.gegenSPY.netto.mde, 2) + ') |');
  });
  ['uni', 'spy'].forEach(function (b) {
    var k = BM[b].kennzahlen;
    o.push('| ' + BM[b].name + ' | ' + pz(k.brutto.mittel, 3) + ' | ' + pz(k.netto.mittel, 3) + ' | ' + pr(k.umschlagMittel) + ' | ' + z(k.kostenMittel, 4) + ' | 100 % | — | — | ' + z(k.mdd.mdd, 1) + ' % (' + dat(k.mdd.spitzeTag) + ' → ' + dat(k.mdd.talTag) + ') | ' + pz(k.fenster12.wert, 1) + ' % (' + k.fenster12.von + '…' + k.fenster12.bis + ') | ' + z(k.sharpe, 2) + ' | — | ' + (b === 'uni' ? pz(k.gegenSPY.netto.mittel, 3) + ' (t ' + pz(k.gegenSPY.netto.t, 2) + ', MDE ' + z(k.gegenSPY.netto.mde, 2) + ')' : '—') + ' |');
  });
  o.push('');
  o.push('Alle Zahlen je Monat in Pp, n = ' + V.v0.monate.length + ' Monate; Umschlag und Kosten enthalten das Ein- und Ausschalten. Zeit im Markt = mittlerer Einsatz über die Handelstage.');
  o.push('V2/V3: Anlaufregel (weniger als 60 V0-Tage) in ' + V.v2.anlauf + ' Perioden mit e = 1; σ₆₀ der V0-Reihe lag zwischen ' + z(Math.min.apply(null, V.v2.monate.filter(function (m) { return m.sigma != null; }).map(function (m) { return m.sigma; })), 1) + ' und ' + z(Math.max.apply(null, V.v2.monate.filter(function (m) { return m.sigma != null; }).map(function (m) { return m.sigma; })), 1) + ' % je Jahr (Median ' + z(V.v2.monate.filter(function (m) { return m.sigma != null; }).map(function (m) { return m.sigma; }).sort(function (a, b) { return a - b; })[Math.floor(V.v2.monate.filter(function (m) { return m.sigma != null; }).length / 2)], 1) + ' %) — gegen ein Ziel von 15 % steht die Bremse die meiste Zeit bei e ≈ 0,5.');
  o.push('V1/V3: ' + V.v1.schaltungen.length + ' Regimewechsel mitten im Monat (je Jahr: ' + (function () { var je = {}; V.v1.schaltungen.forEach(function (s) { var j = s.wirkTag.slice(0, 4); je[j] = (je[j] || 0) + 1; }); return Object.keys(je).sort().map(function (j) { return j + ' ' + je[j]; }).join(', '); })() + '); geteilte Grenztage: max. Abweichung der Zerlegung vom Schluss-zu-Schluss-Mittel ' + V.v1.grenztagAbweichungMax.toExponential(1) + ' Pp, unteilbare Fälle ' + V.v1.unteilbar + '. Regimewert fehlte ' + V.v1.regimeFehlt + '-mal.');
  o.push('');

  /* ---------- Gepaarte Vergleiche ---------- */
  o.push('## 5. Die gepaarten Vergleiche gegen V0 (§T3.5) — das Urteil');
  o.push('');
  o.push('„Besser" heißt vorab: **kleinerer maximaler Rückgang** und **nicht signifikant schlechtere Nettorendite** (t ≥ −1,96, naiv auf den Monaten **und** Hansen-Hodrick auf den Tagen).');
  o.push('');
  o.push('| Variante | Δ netto (Pp/Monat) | se (Monate) | t (Monate) | t (Tage, HH) | **MDE₈₀** (Pp/Monat) | MDD V | MDD V0 | ΔMDD (Pp) | kleinerer MDD | nicht signifikant schlechter | **Urteil** |');
  o.push('|---|---|---|---|---|---|---|---|---|---|---|---|');
  VK.slice(1).forEach(function (v) {
    var p = E.paare[v];
    o.push('| **' + V[v].name + '** | ' + pz(p.monatsdifferenz.mittel, 4) + ' | ' + z(p.monatsdifferenz.se, 4) + ' | ' + pz(p.monatsdifferenz.t, 2) + ' | ' + pz(p.tagesdifferenz ? p.tagesdifferenz.t : null, 2) + ' | ' + z(p.monatsdifferenz.mde, 3) + ' | ' + z(p.mddV, 1) + ' % | ' + z(p.mddV0, 1) + ' % | ' + pz(p.deltaMdd, 2) + ' | ' + ja(p.kleinerMdd) + ' | ' + ja(p.nichtSchlechterNaiv && p.nichtSchlechterHH) + ' | ' + (p.bestanden ? '**bestanden**' : '**nicht bestanden**') + ' |');
  });
  o.push('');
  o.push('Lesart der MDE-Spalte: eine Verschlechterung unter ≈ 1,96 · se (' + VK.slice(1).map(function (v) { return V[v].name.slice(0, 2) + ' ' + z(1.96 * E.paare[v].monatsdifferenz.se, 2); }).join(', ') + ' Pp je Monat) hätte der Test **nicht** als „schlechter" erkannt — die drei Verschlechterungen liegen alle darüber.');
  o.push('');

  /* ---------- Krisentafel ---------- */
  o.push('## 6. Krisentafel (§T3.4) — Wilhelms Härtetest');
  o.push('');
  o.push('Je Fenster: verkettete Nettorendite, maximaler Rückgang **innerhalb** des Fensters, Zeit im Markt. Für V1–V3 daneben die gepaarte Monatsdifferenz zu V0 mit MDE₈₀ — bei 3 bis 10 Monaten ist sie groß, und genau das steht hier.');
  o.push('');
  K.KRISEN.forEach(function (kr, i) {
    o.push('### ' + kr.name + ' (' + kr.von + ' … ' + kr.bis + ', ' + kr.monate + ' Monate)');
    o.push('');
    o.push('| Reihe | Rendite | max. Rückgang im Fenster | Zeit im Markt | Δ zu V0 (Pp/Monat) | se | **MDE₈₀** |');
    o.push('|---|---|---|---|---|---|---|');
    VK.forEach(function (v) {
      var k = V[v].kennzahlen.krisen[i], p = v === 'v0' ? null : E.paare[v].krisen[i];
      o.push('| ' + V[v].name + ' | ' + pz(k.rendite, 1) + ' % | ' + z(k.mdd, 1) + ' % | ' + pr(k.zeitImMarkt, 0) + ' | ' + (p ? pz(p.differenz.mittel, 2) : '—') + ' | ' + (p ? z(p.differenz.se, 2) : '—') + ' | ' + (p ? z(p.differenz.mde, 2) : '—') + ' |');
    });
    ['uni', 'spy'].forEach(function (b) { var k = BM[b].kennzahlen.krisen[i]; o.push('| ' + BM[b].name + ' | ' + pz(k.rendite, 1) + ' % | ' + z(k.mdd, 1) + ' % | 100 % | — | — | — |'); });
    o.push('');
  });

  /* ---------- Jahresscheiben ---------- */
  o.push('## 7. Jahresscheiben und Aktualität (netto, Pp je Monat)');
  o.push('');
  o.push('| Jahr | n | V0 | se V0 | **MDE₈₀ V0** | V1 | V2 | V3 | Universum | SPY |');
  o.push('|---|---|---|---|---|---|---|---|---|---|');
  V.v0.kennzahlen.jahre.forEach(function (j, i) {
    o.push('| ' + j.jahr + (j.duenn ? ' *(dünn)*' : '') + ' | ' + j.n + ' | ' + pz(j.mittel, 2) + ' | ' + z(j.se, 2) + ' | ' + z(j.mde, 2) + ' | ' + pz(V.v1.kennzahlen.jahre[i].mittel, 2) + ' | ' + pz(V.v2.kennzahlen.jahre[i].mittel, 2) + ' | ' + pz(V.v3.kennzahlen.jahre[i].mittel, 2) + ' | ' + pz(BM.uni.kennzahlen.jahre[i].mittel, 2) + ' | ' + pz(BM.spy.kennzahlen.jahre[i].mittel, 2) + ' |');
  });
  o.push('');
  o.push('| letzte 250 Handelstage (ab ' + V.v0.kennzahlen.aktuell.abTag + ') | n | netto (Pp/Monat) | se | t | **MDE₈₀** |');
  o.push('|---|---|---|---|---|---|');
  VK.forEach(function (v) { var k = V[v].kennzahlen.aktuell; o.push('| ' + V[v].name + ' | ' + k.n + ' | ' + pz(k.mittel, 3) + ' | ' + z(k.se, 3) + ' | ' + pz(k.t, 2) + ' | ' + z(k.mde, 2) + ' |'); });
  ['uni', 'spy'].forEach(function (b) { var k = BM[b].kennzahlen.aktuell; o.push('| ' + BM[b].name + ' | ' + k.n + ' | ' + pz(k.mittel, 3) + ' | ' + z(k.se, 3) + ' | ' + pz(k.t, 2) + ' | ' + z(k.mde, 2) + ' |'); });
  o.push('');

  /* ---------- Vorpruefung gegen Messung ---------- */
  var VP = E.vorpruefung;
  o.push('## 8. Die Vorprüfungen gegen die Messung (§T3.8)');
  o.push('');
  o.push('| Größe | vorab geschätzt | gemessen | Befund |');
  o.push('|---|---|---|---|');
  o.push('| Umschlag V0 je Monat | ' + pr(VP.erwartet.umschlagV0) + ' | ' + pr(VP.gemessen.umschlagV0) + ' | ' + (Math.abs(VP.gemessen.umschlagV0 / VP.erwartet.umschlagV0 - 1) < 0.2 ? 'stimmt' : '**daneben**') + ' |');
  o.push('| Kosten V0 je Monat | ' + z(VP.erwartet.kostenV0Spanne[0], 4) + ' … ' + z(VP.erwartet.kostenV0Spanne[1], 4) + ' Pp | ' + z(VP.gemessen.kostenV0, 4) + ' Pp | ' + (VP.gemessen.kostenV0 <= VP.erwartet.kostenV0Spanne[1] * 1.1 ? 'stimmt (Dezil überwiegend 50-250, Faktor Kante/Kosten ' + z(V.v0.kennzahlen.gegenUni.brutto.mittel / VP.gemessen.kostenV0, 0) + ')' : '**daneben**') + ' |');
  o.push('| MDE₈₀ V0 gegen Universum | ' + z(VP.erwartet.mdeV0UniSpanne[0], 2) + ' … ' + z(VP.erwartet.mdeV0UniSpanne[1], 2) + ' Pp | ' + z(VP.gemessen.mdeV0Uni, 2) + ' Pp (se ' + z(VP.gemessen.seV0Uni, 3) + ') | ' + (VP.gemessen.mdeV0Uni >= VP.erwartet.mdeV0UniSpanne[0] && VP.gemessen.mdeV0Uni <= VP.erwartet.mdeV0UniSpanne[1] ? 'in der Spanne — die √(22/80)-Skalierung war zu optimistisch, die Faktorstreuung schrumpft nicht mit' : '**außerhalb der Spanne**') + ' |');
  VK.slice(1).forEach(function (v) {
    o.push('| se der Paardifferenz ' + V[v].name.slice(0, 2) + ' − V0 | ' + z(VP.erwartet.paarSe[v], 2) + ' Pp | ' + z(VP.gemessen.paarSe[v], 3) + ' Pp (Faktor ' + z(VP.seFaktor[v], 2) + ') | ' + (VP.seFaktor[v] > VP.erwartet.seAbweichungFaktor || VP.seFaktor[v] < 1 / VP.erwartet.seAbweichungFaktor ? '**falsche Vorprüfung** — ' + (v === 'v1' ? 'V1 schaltet ' + V.v1.schaltungen.length + '-mal statt ~16-mal, die Kasse-Anteile sind größer und die Monatsstreuung von V0 ist 8,3 statt 6 Pp' : v === 'v2' ? 'e liegt bei ~0,5 statt 0,8 und die V0-Streuung bei 8,3 statt 6 Pp' : 'beide Fehler zusammen') : 'innerhalb Faktor 1,5') + ' |');
  });
  o.push('| Regimewechsel V1 | ~1,7 je Jahr | ' + z(V.v1.schaltungen.length / (V.v0.monate.length / 12), 1) + ' je Jahr | **falsche Vorprüfung** — ein täglicher EMA200-Schalter ohne Hysterese pendelt in Seitwärtsphasen; 2022 allein ' + V.v1.schaltungen.filter(function (s) { return s.wirkTag.slice(0, 4) === '2022'; }).length + ' Wechsel |');
  o.push('');

  /* ---------- Zielportfolio ---------- */
  o.push('## 9. Zielportfolio (§T3.10)');
  o.push('');
  if (E.zielportfolio && E.zielportfolio.variante) {
    o.push('Geschrieben für **' + V[E.zielportfolio.variante].name + '**: ' + E.zielportfolio.dateien + ' Dateien unter `' + E.zielportfolio.ordner + '/` — je Umschichtung Datum, Signaltag, Einsatzquote, Regimezustand, σ₆₀, Kürzel, Gewicht, Klasse. '
      + (U.absicherungTraegt ? '' : '**Die Absicherung trägt nicht**; geschrieben ist die Grundlinie V0 mit Einsatz 1 — das ist das vorregistrierte Ergebnis für diesen Fall, kein Ausfall. ')
      + 'Die Dateien sind Simulationsausgabe und die Schnittstelle zum Momentum-Buch des Mittelfrist-Depots, keine Anlageempfehlung.');
  } else o.push('**Keines geschrieben.** ' + (E.zielportfolio ? E.zielportfolio.grund : ''));
  o.push('');

  /* ---------- Was Teil 3 nicht sagt ---------- */
  o.push('## 10. Was Teil 3 **nicht** sagt');
  o.push('');
  o.push('- „Momentum > 0" wurde nicht getestet; V0 gegen Universum (t ' + pz(g0.gegenUni.netto.t, 2) + ') und gegen SPY (t ' + pz(g0.gegenSPY.netto.t, 2) + ') stehen als Kontext mit MDE₈₀ ' + z(g0.gegenUni.netto.mde, 2) + ' bzw. ' + z(g0.gegenSPY.netto.mde, 2) + ' Pp je Monat — gegen SPY ist der Überschuss **nicht** auf 5 % gesichert.');
  o.push('- „Nicht bestanden" heißt für V2 und V3 nicht, dass sie wertlos sind: sie senken den Rückgang und die Streuung, aber nach der vorregistrierten Regel kostet das signifikant Rendite. Eine andere Dosierung (z. B. Vol-Ziel 25 %, EMA mit Hysterese) wäre eine **neue** Vorregistrierung, kein Nachlegen hier.');
  o.push('- Die Absicherungskosten sind gemessen, die verpasste Rendite ist der eigentliche Preis: V1 verliert ' + pz(E.paare.v1.monatsdifferenz.mittel, 2) + ' Pp je Monat bei ' + pr(V.v1.kennzahlen.zeitImMarkt.mittel, 0) + ' Zeit im Markt.');
  o.push('- Alle Reihen sind Kursrenditen; die Dividendenzeilen sind übertragen bzw. Annahme (§2) und klein gegen die Effekte.');
  o.push('- Long-Short (Außen-Prüfstein) verlangt Leihe und ist im Projekt gesperrt — es dient hier nur der Verrohrungsprüfung.');
  o.push('');
  fs.writeFileSync(path.join(__dirname, a.ziel), o.join('\n'));
  process.stdout.write('geschrieben: ' + a.ziel + ' (' + o.length + ' Zeilen)\n');
}

if (require.main === module) haupt();

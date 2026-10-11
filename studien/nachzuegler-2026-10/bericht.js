'use strict';
/* BERICHT - ERGEBNIS.md aus ergebnis-entdeckung.json, KANDIDATEN.json und ergebnis-pruefung.json (eine Seite).
 *
 *   node studien/nachzuegler-2026-10/bericht.js
 *
 * Liest nur die Ergebnisdateien dieses Ordners. Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var KN = require('./konfig.js');

function lies(d) { var p = path.join(KN.HIER, d); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; }
function f(x, n) { return x == null || !isFinite(x) ? '–' : x.toFixed(n == null ? 3 : n).replace('.', ',').replace('-', '−'); }
function m(st) { return st && st.n ? f(st.mittel) + ' (t ' + f(st.t, 1) + ')' : '–'; }
function git(args) { try { return cp.execFileSync('git', args, { cwd: KN.REPO, encoding: 'utf8' }).trim(); } catch (e) { return ''; } }

function bericht() {
  var E = lies('ergebnis-entdeckung.json'), K = lies(KN.SIEGEL_DATEI), P = lies('ergebnis-pruefung.json');
  if (!E) throw new Error('ergebnis-entdeckung.json fehlt');
  var konf = E.konf, Z = E.zahlen, L = [];
  var siegel2 = git(['log', '-1', '--format=%h', '--', KN.ORDNER_REL + '/' + KN.SIEGEL_DATEI]);
  var belegt = P ? P.pruefung.belegt : 0, nK = K ? K.kandidaten.length : 0;
  L.push('# Nachzügler-Studie (Nr. 109) — Ergebnis');
  L.push('');
  L.push('Regel: `REGEL.md` (Wortlaut `wiki/entscheide.md` + Z1–Z22a + N1), Siegel 1 `bb5ab81`, Siegel 2 `' + (siegel2 || '–') + '`. Panel v2.3, Entdeckung Ausstieg bis ' + E.zeitraum.ausstiegBis + ', Prüfung ' + (P ? 'Einstieg ab ' + P.zeitraum.einstiegAb + ' bis ' + P.zeitraum.ausstiegBis : '–') + '. Simulation, keine Anlageberatung.');
  L.push('');
  L.push('## Urteil');
  L.push('');
  L.push(belegt ? '**' + belegt + ' Konfiguration(en) belegt** (Holm über 384).' : '**Nicht belegt — keine der 384 Konfigurationen.** ' + (nK ? nK + ' Kandidat(en) gesiegelt, in der Prüfung ab 2023 keiner über der Holm-Schwelle.' : 'Kein Kandidat hat die Entdeckung bestanden (Tor 1 und Placebos), die Prüfzeit hatte nichts zu prüfen.'));
  L.push('');
  L.push('| Größe | Wert |');
  L.push('|---|---|');
  L.push('| Ereignisse (Entdeckung, nach Sperrfrist) | ' + Object.keys(E.zaehlungen.ereignisse).map(function (k) { return k + ' ' + E.zaehlungen.ereignisse[k].toLocaleString('de-DE'); }).join(' · ') + ' |');
  L.push('| Beobachtungen (B-Tage, echt) | ' + E.zaehlungen.beobachtungen[0].toLocaleString('de-DE') + ' |');
  L.push('| prüfbar (≥ 30 Einstiegstage) | ' + Z.pruefbar + ' von 384 |');
  L.push('| netto > 0 und t ≥ 2 | **' + Z.t2 + '** (Zufall allein ≈ ' + f(Z.zufallErwartetT2, 1) + ') · t ≤ −2: ' + Z.t2NegativSpiegel + ' (Kosten) |');
  L.push('| Tor 1 bestanden | **' + Z.tor1 + '** |');
  L.push('| Placebo-Verstöße a / b / c | ' + Z.placeboVerstoesse.plA + ' / ' + Z.placeboVerstoesse.plB + ' / ' + Z.placeboVerstoesse.plC + ' |');
  L.push('| Kandidaten / belegt | **' + nK + ' / ' + belegt + '** |');
  L.push('');
  var bb = konf.filter(function (x) { return x.st.brutto.n >= KN.MIN_TAGE; }).sort(function (a, b) { return b.st.brutto.t - a.st.brutto.t; })[0];
  var tt = konf.map(function (x) { return x.st.netto.se > 0 ? x.tor1Schwelle / x.st.netto.se : null; }).filter(function (x) { return x; });
  L.push('**Lesart.** Das beste Brutto der Entdeckung hat ' + bb.name + ': ' + f(bb.st.brutto.mittel) + ' Pp je Beobachtung (t ' + f(bb.st.brutto.t, 1) + '), netto ' + f(bb.st.netto.mittel) + ' — die Hürde der Klasse (' + f(KN.HUERDE[bb.c]) + ') ist größer. Netto erreicht keine Konfiguration t ≥ 2; die Zahl mit t ≥ 2 brutto (' + konf.filter(function (x) { return x.st.brutto.t >= 2; }).length + ') und t ≤ −2 brutto (' + konf.filter(function (x) { return x.st.brutto.t <= -2; }).length + ') liegt beim Zufall (je ≈ 9). Tor 1 hätte t_E ≈ ' + f(tt.reduce(function (a, b) { return a + b; }, 0) / tt.length, 1) + ' verlangt (Z16).');
  L.push('');
  L.push('## Kandidaten (Entdeckung → Prüfung)');
  L.push('');
  if (!nK) L.push('Keine. Die Tabelle unten zeigt die zehn Konfigurationen mit dem höchsten t der Entdeckung — keine besteht Tor 1.');
  else {
    L.push('| Konfiguration | Tage E | netto E (t) | Tor-1-Schwelle | Tage P | netto P (t) | Holm-Schwelle p | belegt |');
    L.push('|---|---|---|---|---|---|---|---|');
    K.kandidaten.forEach(function (k) {
      var z = P ? P.pruefung.zeilen.filter(function (x) { return x.k === k.k; })[0] : null;
      L.push('| ' + k.name + ' | ' + k.nTage + ' | ' + f(k.netto) + ' (' + f(k.t, 1) + ') | ' + f(k.tor1Schwelle) + ' | ' + (z ? z.st.netto.n : '–') + ' | ' + (z ? m(z.st.netto) : '–') + ' | ' + (z ? z.holmSchwelle.toExponential(2) : '–') + ' | ' + (z && z.belegt ? 'ja' : 'nein') + ' |');
    });
  }
  L.push('');
  var top = konf.filter(function (x) { return x.st.netto.n >= KN.MIN_TAGE; }).sort(function (a, b) { return b.st.netto.t - a.st.netto.t; }).slice(0, 10);
  L.push('| beste 10 nach t (Entdeckung) | Tage | brutto | netto (t) | Tor-1-Schwelle | Placebo a / b / c (brutto) | e+1 brutto | ohne 2020 | ohne 2022 |');
  L.push('|---|---|---|---|---|---|---|---|---|');
  top.forEach(function (x) {
    L.push('| ' + x.name + ' | ' + x.st.netto.n + ' | ' + f(x.st.brutto.mittel) + ' | ' + m(x.st.netto) + ' | ' + f(x.tor1Schwelle) + ' | ' +
      [x.st.plA, x.st.plB, x.st.plC].map(function (q) { return f(q.mittel); }).join(' / ') + ' | ' + f(x.st.spaetBrutto.mittel) + ' | ' + m(x.ohne2020) + ' | ' + m(x.ohne2022) + ' |');
  });
  L.push('');
  L.push('## Je Klasse von B und je Jahr');
  L.push('');
  L.push('| Klasse von B | Konfig. | t ≥ 2 | t ≤ −2 | Mittel brutto über die Konfig. | Mittel netto | Hürde |');
  L.push('|---|---|---|---|---|---|---|');
  KN.KLASSEN_NAMEN.forEach(function (nm, c) {
    var k = konf.filter(function (x) { return x.c === c && x.st.netto.n >= KN.MIN_TAGE; });
    var mb = k.reduce(function (s, x) { return s + x.st.brutto.mittel; }, 0) / Math.max(1, k.length), mn = k.reduce(function (s, x) { return s + x.st.netto.mittel; }, 0) / Math.max(1, k.length);
    L.push('| ' + nm + ' | ' + k.length + ' | ' + k.filter(function (x) { return x.st.netto.t >= 2 && x.st.netto.mittel > 0; }).length + ' | ' + k.filter(function (x) { return x.st.netto.t <= -2; }).length + ' | ' + f(mb) + ' | ' + f(mn) + ' | ' + f(KN.HUERDE[c]) + ' |');
  });
  L.push('');
  var jahre = ['2016', '2017', '2018', '2019', '2020', '2021', '2022'];
  L.push('| netto je Einstiegsjahr (t) | ' + jahre.join(' | ') + ' |');
  L.push('|---|' + jahre.map(function () { return '---'; }).join('|') + '|');
  top.slice(0, 5).forEach(function (x) { L.push('| ' + x.name + ' | ' + jahre.map(function (j) { return x.jahre[j] ? f(x.jahre[j].mittel, 2) + ' (' + f(x.jahre[j].t, 1) + ')' : '–'; }).join(' | ') + ' |'); });
  L.push('');
  L.push('## Placebos, Kosten, Abgänge');
  L.push('');
  var ab = [0, 0, 0], abS = [0, 0, 0], ex1 = 0, ex2 = 0;
  konf.forEach(function (x) { ['uebernahme', 'insolvenz', 'sonstige'].forEach(function (g, i) { var a = x.abgang[g]; ab[i] += a.n; abS[i] += a.n && a.mittel != null ? a.n * a.mittel : 0; }); ex1 += x.ausschluss.eigene202.n; ex2 += x.ausschluss.eigenerAusloeser.n; });
  L.push('- **Placebos** (Verstoß = |t| ≥ 2 und |Brutto| ≥ Hürde/4): a ' + Z.placeboVerstoesse.plA + ', b ' + Z.placeboVerstoesse.plB + ', c ' + Z.placeboVerstoesse.plC + ' von 384 — unter Zufall wären je bis zu ≈ 17 (|t| ≥ 2 zweiseitig) zu erwarten, die Größenschranke senkt das.');
  L.push('- **Kosten:** Hürde je Umlauf nach Nachtrag 1 (0,221 / 0,102 / 0,074 / 0,055 Pp). Mit der Kassa-Hürde (Vergleich) und mit Leihe 0 % / 3 % ändert sich die Zahl der Konfigurationen mit t ≥ 2 auf ' +
    konf.filter(function (x) { return x.st.kassa.n >= 30 && x.st.kassa.mittel > 0 && x.st.kassa.t >= 2; }).length + ' / ' + konf.filter(function (x) { return x.st.leihe0.n >= 30 && x.st.leihe0.mittel > 0 && x.st.leihe0.t >= 2; }).length + ' / ' +
    konf.filter(function (x) { return x.st.leihe3.n >= 30 && x.st.leihe3.mittel > 0 && x.st.leihe3.t >= 2; }).length + '.');
  L.push('- **Abgänge von B** innerhalb der Haltedauer (nicht im Hauptergebnis, summiert über die Zellen): Übernahme ' + ab[0] + ' (Mittel ' + f(ab[0] ? abS[0] / ab[0] : null, 2) + ' Pp gegen Bezug), Insolvenz ' + ab[1] + ', sonstige ' + ab[2] + ' (Mittel ' + f(ab[2] ? abS[2] / ab[2] : null, 2) + ').');
  L.push('- **Ausgeschlossene B** (Z10): eigene 2.02 ' + ex1.toLocaleString('de-DE') + ', eigener Auslöser ' + ex2.toLocaleString('de-DE') + ' (B-Zellen summiert).');
  L.push('- **Daten:** CIK ' + JSON.stringify(E.cik) + '; SIC ist die heutige (Z2); E3 ' + JSON.stringify(E.e3) + '.');
  if (P) L.push('- **Prüfzeit:** geöffnet mit Siegel `' + (P.siegel ? P.siegel.commit.slice(0, 7) : '–') + '` (Blob ' + (P.siegel ? P.siegel.blob.slice(0, 7) : '–') + '), ' + P.kandidaten + ' Kandidat(en) gemessen.');
  L.push('');
  fs.writeFileSync(path.join(KN.HIER, 'ERGEBNIS.md'), L.join('\n'));
  return L.join('\n');
}

if (require.main === module) process.stdout.write(bericht() + '\n');
module.exports = { bericht: bericht };

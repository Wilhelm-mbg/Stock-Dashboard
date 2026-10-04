'use strict';
/* Messung Sektor-Momentum (ZUSATZ.md §7): der eine Lauf - oder vor der Freigabe nur die Klinken.
 *   node studien/sektor-momentum-messung-2026-10/lauf.js --nur-klinken
 *       Pruefsummen (SHA-256 jeder Rohdatei vor dem Lesen), Leser, Kalender, Fensterlaengen, Stichtage, SPY-Ausschuettungen samt Ergaenzung,
 *       Pflichtpruefung (i)-(iv) aus ZUSATZ §1.9. Kein Buch, keine Zielfunktion, kein Placebo. Schreibt nichts. Exit-Code 1, wenn eine Klinke verfehlt.
 *   node studien/sektor-momentum-messung-2026-10/lauf.js
 *       der volle Lauf (erst nach dem Code-Siegel; die Dateien sektor.js, lauf.js, test.js muessen committet und unveraendert sein):
 *       Pruefsummen, Klinken, Pflichtpruefung (bei Verfehlen Abbruch), Fenster A und B je Kandidat und Placebo (k = 0 voll, 63 Startphasen,
 *       Periodenstreuung, Kalenderjahre), adjclose-Weg fuer k = 0, Urteil, Zusatz (Langlaeufe, rollierende Fuenfjahresfenster).
 *       Schreibt ergebnis.json (Zwischenstaende sofort), rollierend.json und ERGEBNIS-tabellen.md - alles aus den Zahlen, nichts von Hand.
 * Rohdaten ausserhalb des Repos: $SEKTOR_DATEN, Vorgabe C:/Users/Wilhe/Downloads/sektor-messung/daten. Alles Simulation, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var crypto = require('crypto');
var S = require('./sektor.js');

var KORREKTUREN = [];                 /* ZUSATZ Kopf: jeder behobene Fehler nach dem Siegel wird hier vermerkt */
var SIEGEL_DATEIEN = ['sektor.js', 'lauf.js', 'test.js'];
var QUELLEN = [
  'studien/kandidaten-blind-2026-10/sektor-momentum/REGEL.md', 'studien/kandidaten-blind-2026-10/sektor-momentum/ziel.js',
  'studien/kandidaten-blind-2026-10/sektor-momentum/test.js', 'studien/sektor-momentum-messung-2026-10/ZUSATZ.md',
  'studien/sektor-momentum-messung-2026-10/laden.js', 'studien/sektor-momentum-messung-2026-10/pruefsummen.json',
  'studien/sektor-momentum-messung-2026-10/sektor.js', 'studien/sektor-momentum-messung-2026-10/lauf.js', 'studien/sektor-momentum-messung-2026-10/test.js',
  'studien/momentum-korb-2026-10-04/korb.js', 'studien/massstab-rueckblick-2026-10-04/rueckblick.js', 'mfhandel.js', 'momentum.js', 'liquide.js',
];

/* ---------- Zahlen als Text (deutsch) ---------- */
function de(x, n) { return x == null || !isFinite(x) ? '–' : x.toFixed(n == null ? 2 : n).replace('.', ','); }
function vz(x, n) { return x == null || !isFinite(x) ? '–' : (x >= 0 ? '+' : '−') + de(Math.abs(x), n); }
function tausend(s) { var p = s.split(','); return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (p.length > 1 ? ',' + p[1] : ''); }
function dollar(x, n) { return x == null || !isFinite(x) ? '–' : (x < 0 ? '−' : '') + tausend(de(Math.abs(x), n == null ? 2 : n)) + ' $'; }
function datumDe(d) { var p = String(d).split('-'); return p[2] + '.' + p[1] + '.' + p[0]; }
function jaNein(b) { return b ? 'ja' : 'nein'; }
function prozent(x, n) { return de(x * 100, n == null ? 1 : n) + ' %'; }

function shaDatei(rel) { try { return crypto.createHash('sha256').update(fs.readFileSync(path.join(S.REPO, rel))).digest('hex'); } catch (e) { return null; } }
function git(args) { return cp.execFileSync('git', args, { cwd: S.REPO, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim(); }

/* ---------- Klinken ausgeben ---------- */
function klinkenText(KL, summen) {
  var Z = [], p = KL.pflicht;
  Z.push('Pruefsummen: ' + Object.keys(summen).length + ' Dateien, SHA-256 und Groesse wie pruefsummen.json');
  Z.push('Kalender (SPY-Tage): ' + KL.kalender.tage + ' Handelstage, ' + KL.kalender.erster + ' bis ' + KL.kalender.letzter);
  ['A', 'B'].forEach(function (f) {
    var F = KL.fenster[f], d = S.FENSTER[f];
    Z.push('Fenster ' + f + ': ' + d.von + ' bis ' + d.bis + ', ' + F.handelstage + ' Handelstage (Soll ' + d.handelstage + '), Stichtag ' + F.stichtag + ' (Soll ' + d.stichtag + ')');
  });
  Z.push('Leser je Reihe (Balken / Zeilen / entfallen / doppelt gleich / doppelt verschieden / ohne open / ohne volume / Zeilen ohne SPY-Tag / fehlende SPY-Tage im Bereich):');
  Object.keys(KL.leser).forEach(function (s) {
    var l = KL.leser[s];
    Z.push('  ' + s + ': ' + [l.balken, l.zeilen, l.entfallen, l.doppeltGleich, l.doppeltVerschieden, l.ohneOpen, l.ohneVolumen, KL.zeilenOhneKalendertag[s], l.fehlendeKalendertage].join(' / ') +
      ', ' + l.ersterTag + ' bis ' + l.letzterTag + ', Splits ' + l.splits + ', Ausschuettungen gezaehlt ' + KL.ausschuettungen[s].gezaehlt + ' von ' + KL.ausschuettungen[s].gelesen +
      (KL.ausschuettungen[s].ergaenzt ? ' + ' + KL.ausschuettungen[s].ergaenzt + ' ergaenzt' : ''));
  });
  Z.push('SPY-Ex-Tage nach dem ersten Fenstertag bis zum letzten: A ' + KL.spy.jeFenster.A + ' (Soll 18), B ' + KL.spy.jeFenster.B + ' (Soll 20); je Jahr 2017-2025: ' +
    [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map(function (j) { return j + ' ' + KL.spy.jeJahr[j]; }).join(', ') + '; mehrere Saetze an einem Tag: ' + KL.spy.mehrfachAmExTag);
  Z.push('SPY-Ergaenzung 15.06.2018 (1,2456 $): ' + (KL.spy.ergaenzt ? 'ergaenzt (Yahoo fuehrt keinen Satz an diesem Tag)' : 'nicht noetig (Yahoo fuehrt einen Satz an diesem Tag)'));
  ['i', 'ii', 'iii'].forEach(function (n) {
    var x = p[n];
    Z.push('Pflicht (' + n + ') ' + x.von + ' (' + (x.kauf === 'schluss' ? 'Schluss' : 'Eroeffnung') + ') bis ' + x.bis + ': Ist ' + x.istGesamt.toFixed(4) + ' % (' + x.istEnde.toFixed(2) + ' $), Soll ' +
      x.sollGesamt.toFixed(4) + ' %' + (x.sollEnde != null ? ' (' + x.sollEnde.toFixed(2) + ' $)' : '') + ', Abweichung ' + x.abweichungPp.toFixed(4) + ' Pp (Toleranz 0,30) -> ' + (x.bestanden ? 'bestanden' : 'VERFEHLT'));
  });
  ['A', 'B'].forEach(function (f) {
    var x = p.iv[f];
    Z.push('Pflicht (iv) Summe der Ausschuettungen je Anteil ' + f + ': Ist ' + x.ist.toFixed(4) + ' $, Soll ' + x.soll.toFixed(4) + ' $, Abweichung ' + x.abweichung.toFixed(4) + ' $ (Toleranz 0,01) -> ' + (x.bestanden ? 'bestanden' : 'VERFEHLT'));
  });
  Z.push(KL.bestanden ? 'KLINKEN: alle bestanden' : 'KLINKEN VERFEHLT: ' + KL.fehler.join('; '));
  return Z.join('\n');
}

/* ---------- Ausgabeform eines gemessenen Fensters ---------- */
function phasenKurz(SP) {
  var o = {}; Object.keys(SP).forEach(function (k) { if (k !== 'phasen') o[k] = SP[k]; });
  o.phasen = SP.phasen.map(function (p) { var q = {}; Object.keys(p).forEach(function (k) { if (k !== 'ziele') q[k] = p[k]; }); return q; });
  return o;
}
function fensterAusgabe(X, voll) {
  var o = { modus: X.modus, umsatzMin: X.umsatzMin, fenster: X.fenster, haupt: X.haupt, ausschuettungen: X.ausschuettungen, startphasen: phasenKurz(X.startphasen),
    periodenstreuung: X.periodenstreuung, kalenderjahre: X.kalenderjahre, perioden: X.perioden, nichtAusfuehrbar: X.nichtAusfuehrbar };
  o.umschichtungen = voll ? X.umschichtungen : X.umschichtungen.map(function (u) {
    return { ausfuehrungstag: u.ausfuehrungstag, ziel: u.ziel, zulaessig: u.zulaessig, kosten: u.kosten, gehaltenDanach: u.gehaltenDanach };
  });
  if (voll) o.tageswerte = { spalten: ['tag', 'buch', 'spy', 'bargeld'], werte: X.tageswerte };
  return o;
}

/* ---------- Tabellen aus den Zahlen ---------- */
function tabellen(E) {
  var Z = [], U = E.urteil;
  function zeile(z) { Z.push('| ' + z.join(' | ') + ' |'); }
  function kopf(z) { zeile(z); Z.push('|' + z.map(function () { return '---'; }).join('|') + '|'); }
  Z.push('# Messung Sektor-Momentum — Tabellen');
  Z.push('');
  Z.push('*Maschinell aus `ergebnis.json` erzeugt (`lauf.js`), keine Zahl von Hand. Kennung `' + E.kennung + '`, Regel `' + E.regel + '`, git ' + E.gitHead + ', erzeugt ' + E.erzeugt +
    ', Laufzeit ' + de(E.laufzeitSekunden, 0) + ' s. Korrekturen nach dem Siegel: ' + (E.korrekturen.length || 'keine') + '. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.*');
  Z.push('');
  Z.push('## Urteil (ZUSATZ §3)');
  Z.push('');
  Z.push('**' + U.satz + '** (' + U.zusatz + ')' + (U.satz === 'schlägt SPY' ? (U.momentumBefund ? ' — **Momentum-Befund**' : ' — **kein Momentum-Befund**') : '') +
    (U.vermerke.length ? ' — Vermerk: ' + U.vermerke.join('; ') : ''));
  Z.push('');
  kopf(['Fenster', 'k = 0: Buch > SPY', 'Startphasen Buch > SPY (≥ 45)', 'Median Abstand (> 0)', 'Zwischenurteil']);
  ['A', 'B'].forEach(function (f) {
    var b = U.fenster[f];
    zeile([f, jaNein(b.k0Vorn), b.phasenVorn + ' von ' + b.nPhasen, vz(b.median, 2) + ' Pp p. a.', b.zwischen]);
  });
  Z.push('');
  Z.push('Kandidat gegen Placebo (dieselben drei Bedingungen; Momentum-Befund nur bei „schlägt SPY“ und hier in beiden Fenstern alle drei):');
  Z.push('');
  kopf(['Fenster', 'k = 0: Kandidat > Placebo', 'Startphasen Kandidat > Placebo', 'Median Abstand', 'Zwischenurteil']);
  ['A', 'B'].forEach(function (f) {
    var b = U.kandidatGegenPlacebo[f];
    zeile([f, jaNein(b.k0Vorn), b.phasenVorn + ' von ' + b.nPhasen, vz(b.median, 2) + ' Pp p. a.', b.zwischen]);
  });
  Z.push('');
  ['A', 'B'].forEach(function (f) {
    var F = E.fenster[f], K = F.kandidat, P = F.placebo, kh = K.haupt, ph = P.haupt;
    Z.push('## Fenster ' + f + ' (' + datumDe(K.fenster.von) + ' bis ' + datumDe(K.fenster.bis) + ', ' + K.fenster.handelstage + ' Handelstage, Stichtag ' + datumDe(K.fenster.stichtag) + ') — Pflichtzeilen');
    Z.push('');
    kopf(['', 'Kandidat', 'Placebo', 'SPY']);
    zeile(['Endwert k = 0', dollar(kh.buchEnde), dollar(ph.buchEnde), dollar(kh.spyEnde)]);
    zeile(['Gesamtertrag k = 0', vz(kh.buchGesamt, 2) + ' %', vz(ph.buchGesamt, 2) + ' %', vz(kh.spyGesamt, 2) + ' %']);
    zeile(['p. a. k = 0 (' + de(K.fenster.jahre, 3) + ' Jahre)', vz(kh.buchPa, 2) + ' %', vz(ph.buchPa, 2) + ' %', vz(kh.spyPa, 2) + ' %']);
    zeile(['**Abstand zu SPY p. a., k = 0**', '**' + vz(kh.abstandPa, 2) + ' Pp**', '**' + vz(ph.abstandPa, 2) + ' Pp**', '–']);
    zeile(['Startphasen Buch > SPY', K.startphasen.vorn + ' von ' + K.startphasen.anzahl, P.startphasen.vorn + ' von ' + P.startphasen.anzahl, '–']);
    zeile(['Abstand über die Phasen: Min / Median / Max (Pp p. a.)', vz(K.startphasen.minimum, 2) + ' / ' + vz(K.startphasen.median, 2) + ' / ' + vz(K.startphasen.maximum, 2),
      vz(P.startphasen.minimum, 2) + ' / ' + vz(P.startphasen.median, 2) + ' / ' + vz(P.startphasen.maximum, 2), '–']);
    var ps = function (X) {
      var q = X.periodenstreuung;
      return q ? vz(q.mittel, 2) + ' ± ' + de(q.standardfehler, 2) + ' Pp (' + vz(q.band95[0], 2) + ' bis ' + vz(q.band95[1], 2) + '; t = ' + de(q.tWert, 4) + ', ' + q.freiheitsgrade + ' FG)' : '–';
    };
    var vm = function (X) { var q = X.periodenstreuung; return q ? (q.schliesstNullEin ? 'schließt 0 ein → nicht vom Zufall zu unterscheiden' : 'schließt 0 nicht ein') : '–'; };
    zeile(['Abstand je Periode: Mittel ± Standardfehler (95-%-Band)', ps(K), ps(P), '–']);
    zeile(['Vermerk zum Band', vm(K), vm(P), '–']);
    zeile(['Perioden (Buch vor SPY)', kh.perioden + ' (' + (K.periodenstreuung ? K.periodenstreuung.periodenVorn : '–') + ' vorn), letzte ' + kh.letztePeriodeTage + ' Tage',
      ph.perioden + ' (' + (P.periodenstreuung ? P.periodenstreuung.periodenVorn : '–') + ' vorn)', '–']);
    zeile(['größter Rückschlag k = 0 (Spanne der Phasen)', vz(kh.rueckschlagBuch, 1) + ' % (' + vz(K.startphasen.rueckschlagSpanne[0], 1) + ' bis ' + vz(K.startphasen.rueckschlagSpanne[1], 1) + ')',
      vz(ph.rueckschlagBuch, 1) + ' % (' + vz(P.startphasen.rueckschlagSpanne[0], 1) + ' bis ' + vz(P.startphasen.rueckschlagSpanne[1], 1) + ')', vz(kh.rueckschlagSpy, 1) + ' %']);
    zeile(['gezahlte Kosten (Umschichtungen; Volumen)', dollar(kh.kostenGezahlt) + ' (' + kh.umschichtungen + '; ' + dollar(kh.volumen, 0) + ')',
      dollar(ph.kostenGezahlt) + ' (' + ph.umschichtungen + '; ' + dollar(ph.volumen, 0) + ')', '0 $']);
    zeile(['zuWenig-Tage (Anteil der Ausführungstage)', kh.zuWenigTage + ' (' + prozent(kh.zuWenigAnteil, 2) + ')', ph.zuWenigTage + ' (' + prozent(ph.zuWenigAnteil, 2) + ')', '–']);
    var geh = function (h) { return h.gehalten.kleinste + '–' + h.gehalten.groesste + ' je Umschichtung, ' + h.gehalten.verschiedene + ' verschiedene'; };
    var hf = function (h) { return Object.keys(h.gehalten.haeufigkeit).map(function (s) { return s + ' ' + h.gehalten.haeufigkeit[s]; }).join(', '); };
    zeile(['gehaltene Fonds', geh(kh), geh(ph), '–']);
    zeile(['Häufigkeit je Fonds (Umschichtungen)', hf(kh), hf(ph), '–']);
    zeile(['größtes Gewicht einer Position', de(kh.groesstesGewicht.prozent, 1) + ' % (' + kh.groesstesGewicht.reihe + ', ' + datumDe(kh.groesstesGewicht.tag) + ')',
      de(ph.groesstesGewicht.prozent, 1) + ' % (' + ph.groesstesGewicht.reihe + ', ' + datumDe(ph.groesstesGewicht.tag) + ')', '–']);
    zeile(['Ausschüttungen gebucht (Summe)', K.ausschuettungen.gebucht + ' (' + dollar(K.ausschuettungen.summeBuch) + ')', P.ausschuettungen.gebucht + ' (' + dollar(P.ausschuettungen.summeBuch) + ')',
      K.ausschuettungen.spyGebucht + ' (' + dollar(K.ausschuettungen.summeSpy) + '; ' + de(K.ausschuettungen.spyRateSumme, 4) + ' $ je Anteil)']);
    zeile(['mittlerer Bargeldanteil', de(kh.bargeldanteilMittel, 2) + ' %', de(ph.bargeldanteilMittel, 2) + ' %', '–']);
    K.kalenderjahre.forEach(function (j, i) {
      var q = P.kalenderjahre[i];
      zeile(['Kalenderjahr ' + j.jahr + (i === 0 || i === K.kalenderjahre.length - 1 ? ' (angebrochen)' : ''), vz(j.buch, 1) + ' % (Abstand ' + vz(j.abstand, 1) + ')',
        vz(q.buch, 1) + ' % (Abstand ' + vz(q.abstand, 1) + ')', vz(j.spy, 1) + ' %']);
    });
    Z.push('');
    var G = F.kandidatGegenPlacebo;
    Z.push('Kandidat gegen Placebo: k = 0 ' + (G.k0Vorn ? 'vorn' : 'nicht vorn') + ' (' + vz(G.k0AbstandPa, 2) + ' Pp p. a.), ' + G.vorn + ' von ' + G.anzahl + ' Phasen vorn, Abstand Min / Median / Max ' +
      vz(G.minimum, 2) + ' / ' + vz(G.median, 2) + ' / ' + vz(G.maximum, 2) + ' Pp p. a.');
    Z.push('');
  });
  Z.push('## Gesamtertrag auf zwei Wegen, k = 0 (ZUSATZ §4; nur der Hauptweg trägt das Urteil)');
  Z.push('');
  kopf(['Fenster', '', 'Hauptweg Endwert', 'adjclose Endwert', 'Unterschied', 'Hauptweg p. a.', 'adjclose p. a.', 'Unterschied']);
  ['A', 'B'].forEach(function (f) {
    var W = E.fenster[f].adjclose;
    ['kandidat', 'placebo'].forEach(function (m) {
      var x = W[m];
      zeile([f, m === 'kandidat' ? 'Kandidat' : 'Placebo', dollar(x.haupt.buchEnde), dollar(x.adjclose.buchEnde), dollar(x.unterschied.buchEndeDollar), vz(x.haupt.buchPa, 3) + ' %', vz(x.adjclose.buchPa, 3) + ' %',
        vz(x.unterschied.buchPaPp, 3) + ' Pp']);
      zeile([f, (m === 'kandidat' ? 'Kandidat' : 'Placebo') + ' − SPY (Abstand p. a.)', '', '', '', vz(x.haupt.abstandPa, 3) + ' Pp', vz(x.adjclose.abstandPa, 3) + ' Pp', vz(x.unterschied.abstandPaPp, 3) + ' Pp']);
    });
    zeile([f, 'SPY', dollar(W.spy.haupt), dollar(W.spy.adjclose), dollar(W.spy.unterschiedDollar), vz(W.spy.hauptPa, 3) + ' %', vz(W.spy.adjclosePa, 3) + ' %', vz(W.spy.unterschiedPaPp, 3) + ' Pp']);
  });
  Z.push('');
  if (E.zusatz && E.zusatz.regel && E.zusatz.ohneSchwelle && E.zusatz.regel.rollierend && E.zusatz.ohneSchwelle.rollierend) zusatzTabellen(E, Z, zeile, kopf);
  Z.push('## Klinken und Pflichtprüfung (vor dem Lauf)');
  Z.push('');
  var KL = E.klinken, p = KL.pflicht;
  kopf(['Prüfung', 'Ist', 'Soll', 'Ergebnis']);
  zeile(['Prüfsummen der Rohdateien (SHA-256, Größe, Zahl der Balken)', Object.keys(E.daten.sha256).length + ' Dateien', S.KUERZEL.length + ' Dateien wie pruefsummen.json',
    Object.keys(E.daten.sha256).length === S.KUERZEL.length ? 'bestanden (sonst kein Lauf)' : 'nein']);
  ['A', 'B'].forEach(function (f) {
    var dF = E.regelwerte.fenster[f];
    zeile(['Handelstage Fenster ' + f, KL.fenster[f].handelstage, dF.handelstage, jaNein(KL.fenster[f].handelstage === dF.handelstage)]);
    zeile(['Stichtag vor Fenster ' + f, datumDe(KL.fenster[f].stichtag), datumDe(dF.stichtag), jaNein(KL.fenster[f].stichtag === dF.stichtag)]);
    zeile(['SPY-Ex-Tage Fenster ' + f, KL.spy.jeFenster[f], dF.spyAusschuettungen, jaNein(KL.spy.jeFenster[f] === dF.spyAusschuettungen)]);
    zeile(['Perioden k = 0 ohne zuWenig, Fenster ' + f + ' (Kandidat / Placebo)', E.fenster[f].kandidat.haupt.perioden + ' / ' + E.fenster[f].placebo.haupt.perioden + ', letzte ' +
      E.fenster[f].kandidat.haupt.letztePeriodeTage + ' Tage', dF.perioden + ', letzte ' + dF.letztePeriode + ' Tage',
      jaNein(E.fenster[f].kandidat.haupt.perioden === dF.perioden && E.fenster[f].placebo.haupt.perioden === dF.perioden && E.fenster[f].kandidat.haupt.letztePeriodeTage === dF.letztePeriode)]);
  });
  zeile(['SPY-Ex-Tage je Jahr 2017–2025', [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map(function (j) { return KL.spy.jeJahr[j]; }).join(' / '), 'je 4', '–']);
  zeile(['SPY-Ergänzung 15.06.2018', KL.spy.ergaenzt ? 'ergänzt' : 'Yahoo-Satz', 'höchstens ein Satz', '–']);
  ['i', 'ii', 'iii'].forEach(function (n) {
    var x = p[n];
    zeile(['Pflicht (' + n + ') ' + datumDe(x.von) + ' bis ' + datumDe(x.bis), vz(x.istGesamt, 4) + ' %' + (x.sollEnde != null ? ' (' + dollar(x.istEnde) + ')' : ''),
      vz(x.sollGesamt, 4) + ' %' + (x.sollEnde != null ? ' (' + dollar(x.sollEnde) + ')' : ''), (x.bestanden ? 'bestanden' : 'VERFEHLT') + ' (' + vz(x.abweichungPp, 4) + ' Pp)']);
  });
  ['A', 'B'].forEach(function (f) {
    var x = p.iv[f];
    zeile(['Pflicht (iv) Ausschüttungen je Anteil ' + f, de(x.ist, 4) + ' $', de(x.soll, 4) + ' $', (x.bestanden ? 'bestanden' : 'VERFEHLT') + ' (' + vz(x.abweichung, 4) + ' $)']);
  });
  Z.push('');
  Z.push('## Diagnose (ändert keine Zahl)');
  Z.push('');
  ['A', 'B'].forEach(function (f) {
    ['kandidat', 'placebo'].forEach(function (m) {
      var X = E.fenster[f][m];
      Z.push('- Fenster ' + f + ', ' + m + ': Reihenenden ' + X.haupt.reihenenden.length + ', Lückentage ' + X.haupt.lueckentage + ', Ziele/Positionen ohne Eröffnungskurs ' +
        X.haupt.ohneKursBeiUmschichtung + ', gebuchte Sätze außerhalb 0,01–5 % ' + X.ausschuettungen.saetzeAusserhalb.length + ', mehrere Sätze an einem Tag ' + X.ausschuettungen.mehrfachAmExTag +
        ', mögliche fehlende Quartalszahlungen (Heuristik) ' + X.ausschuettungen.moeglicheLuecken.length + '.');
    });
  });
  Z.push('');
  return Z.join('\n') + '\n';
}
function zusatzTabellen(E, Z, zeile, kopf) {
  var namen = [['regel', 'Regel (Schwelle 100 Mio $)'], ['ohneSchwelle', 'ohne Schwelle']];
  Z.push('## Zusatz ohne Urteil (ZUSATZ §5)');
  Z.push('');
  Z.push('### Langläufe bis 15.09.2026');
  Z.push('');
  var k = ['', namen[0][1] + ': Kandidat', 'Placebo', 'SPY', namen[1][1] + ': Kandidat', 'Placebo', 'SPY'];
  kopf(k);
  function zw(titel, f) { var z = [titel]; namen.forEach(function (n) { z = z.concat(f(E.zusatz[n[0]])); }); zeile(z); }
  zw('erster Ausführungstag', function (L) { return [datumDe(L.start), '', '']; });
  zw('Endwert', function (L) { return [dollar(L.kandidat.haupt.buchEnde), dollar(L.placebo.haupt.buchEnde), dollar(L.kandidat.haupt.spyEnde)]; });
  zw('p. a.', function (L) { return [vz(L.kandidat.haupt.buchPa, 2) + ' %', vz(L.placebo.haupt.buchPa, 2) + ' %', vz(L.kandidat.haupt.spyPa, 2) + ' %']; });
  zw('Abstand zu SPY p. a.', function (L) { return [vz(L.kandidat.haupt.abstandPa, 2) + ' Pp', vz(L.placebo.haupt.abstandPa, 2) + ' Pp', '–']; });
  zw('Startphasen Buch > SPY; Median', function (L) {
    return [L.kandidat.startphasen.vorn + ' von ' + L.kandidat.startphasen.anzahl + '; ' + vz(L.kandidat.startphasen.median, 2),
      L.placebo.startphasen.vorn + ' von ' + L.placebo.startphasen.anzahl + '; ' + vz(L.placebo.startphasen.median, 2), '–'];
  });
  zw('Abstand je Periode: Mittel ± SE (Band)', function (L) {
    var q = function (X) { var s = X.periodenstreuung; return s ? vz(s.mittel, 2) + ' ± ' + de(s.standardfehler, 2) + ' (' + vz(s.band95[0], 2) + ' bis ' + vz(s.band95[1], 2) + '; ' + s.n + ' Perioden)' : '–'; };
    return [q(L.kandidat), q(L.placebo), '–'];
  });
  zw('größter Rückschlag', function (L) { return [vz(L.kandidat.haupt.rueckschlagBuch, 1) + ' %', vz(L.placebo.haupt.rueckschlagBuch, 1) + ' %', vz(L.kandidat.haupt.rueckschlagSpy, 1) + ' %']; });
  zw('gezahlte Kosten (Umschichtungen)', function (L) { return [dollar(L.kandidat.haupt.kostenGezahlt) + ' (' + L.kandidat.haupt.umschichtungen + ')', dollar(L.placebo.haupt.kostenGezahlt) + ' (' + L.placebo.haupt.umschichtungen + ')', '–']; });
  zw('zuWenig-Tage', function (L) { return [String(L.kandidat.haupt.zuWenigTage), String(L.placebo.haupt.zuWenigTage), '–']; });
  zw('gehaltene Fonds (verschiedene)', function (L) {
    var g = function (h) { return h.gehalten.kleinste + '–' + h.gehalten.groesste + ' (' + h.gehalten.verschiedene + ')'; };
    return [g(L.kandidat.haupt), g(L.placebo.haupt), '–'];
  });
  zw('Kandidat gegen Placebo: k = 0 / Phasen / Median', function (L) {
    var G = L.kandidatGegenPlacebo;
    return [jaNein(G.k0Vorn) + ' / ' + G.vorn + ' von ' + G.anzahl + ' / ' + vz(G.median, 2) + ' Pp', '', ''];
  });
  Z.push('');
  Z.push('Kalenderjahre (Buch und SPY in %; erstes und letztes Jahr angebrochen):');
  Z.push('');
  kopf(['Jahr', namen[0][1] + ': Kandidat', 'Placebo', 'SPY', namen[1][1] + ': Kandidat', 'Placebo', 'SPY']);
  var jahre = {};
  namen.forEach(function (n) { E.zusatz[n[0]].kandidat.kalenderjahre.forEach(function (j) { jahre[j.jahr] = true; }); });
  Object.keys(jahre).sort().forEach(function (j) {
    var z = [j];
    namen.forEach(function (n) {
      var L = E.zusatz[n[0]], a = L.kandidat.kalenderjahre.filter(function (x) { return x.jahr === j; })[0], b = L.placebo.kalenderjahre.filter(function (x) { return x.jahr === j; })[0];
      z = z.concat(a ? [vz(a.buch, 1), vz(b.buch, 1), vz(a.spy, 1)] : ['–', '–', '–']);
    });
    zeile(z);
  });
  Z.push('');
  Z.push('### Rollierende Fünfjahresfenster (Start an jedem Handelstag ab dem ersten Ausführungstag des Langlaufs; je Fenster ein eigener Nachlauf ab 100.000 $)');
  Z.push('');
  var spalten = [];
  namen.forEach(function (n) { [['kandidat', 'Kandidat − SPY'], ['placebo', 'Placebo − SPY'], ['kandidatGegenPlacebo', 'Kandidat − Placebo']].forEach(function (s) { spalten.push([n, s]); }); });
  kopf([''].concat(spalten.map(function (s) { return s[0][1] + ': ' + s[1][1]; })));
  function zr(titel, f) { zeile([titel].concat(spalten.map(function (s) { return f(E.zusatz[s[0][0]].rollierend[s[1][0]], E.zusatz[s[0][0]].rollierend); }))); }
  zr('Zahl der Fenster', function (a) { return String(a.fenster); });
  zr('Anteil vorn', function (a) { return prozent(a.anteilVorn, 1) + ' (' + a.vorn + ')'; });
  zr('Median Abstand p. a.', function (a) { return vz(a.median, 2) + ' Pp'; });
  zr('10-%-Punkt / 90-%-Punkt', function (a) { return vz(a.p10, 2) + ' / ' + vz(a.p90, 2) + ' Pp'; });
  zr('schlechtestes Fenster', function (a) { return vz(a.schlechtestes.abstandPa, 2) + ' Pp (' + datumDe(a.schlechtestes.start) + '–' + datumDe(a.schlechtestes.ende) + ')'; });
  zr('bestes Fenster', function (a) { return vz(a.bestes.abstandPa, 2) + ' Pp (' + datumDe(a.bestes.start) + '–' + datumDe(a.bestes.ende) + ')'; });
  zr('Fenster mit zuWenig-Tagen', function (a, r) { return String(r.zuWenigFenster); });
  Z.push('');
  Z.push('Anteil vorn je Startjahr (Fenster):');
  Z.push('');
  kopf(['Startjahr'].concat(spalten.map(function (s) { return s[0][1] + ': ' + s[1][1]; })));
  var js = {};
  spalten.forEach(function (s) { Object.keys(E.zusatz[s[0][0]].rollierend[s[1][0]].jeStartjahr).forEach(function (j) { js[j] = true; }); });
  Object.keys(js).sort().forEach(function (j) {
    zeile([j].concat(spalten.map(function (s) { var x = E.zusatz[s[0][0]].rollierend[s[1][0]].jeStartjahr[j]; return x ? prozent(x.anteil, 0) + ' (' + x.fenster + ')' : '–'; })));
  });
  Z.push('');
}

/* ---------- Der volle Lauf ---------- */
function vollerLauf(D, ctx) {
  var t0 = ctx.t0 || Date.now(), aus = ctx.ausgabe || __dirname, def = ctx.fenster || S.FENSTER, KL = ctx.klinken;
  var log = ctx.log || function (x) { console.log(new Date().toISOString().slice(11, 19) + ' ' + x); };
  var E = { kennung: S.KENNUNG, regel: S.REGEL_KENNUNG, vollstaendig: false, erzeugt: new Date().toISOString(), gitHead: ctx.gitHead || null, gitSauber: ctx.gitSauber,
    quellen: ctx.quellen || {}, daten: { ordner: ctx.ordner || null, sha256: ctx.summen || {}, geladen: ctx.geladen || null },
    regelwerte: { fonds: S.FONDS, massstab: S.MASSSTAB, startkapital: S.START, kostenBpJeSeite: S.KOSTEN_BP, halten: S.HALTEN, startphasen: S.PHASEN, mindestPhasenVorn: S.MIN_PHASEN_VORN,
      maxZuWenigAnteil: S.MAX_ZUWENIG_ANTEIL, zeilenRohMap: S.ZEILEN_ROH, fenster: def, spyErgaenzung: S.SPY_ERGAENZUNG, pflicht: S.PFLICHT, zusatz: S.ZUSATZ5, satzBereich: S.SATZ_BEREICH },
    klinken: KL, fenster: {}, urteil: null, zusatz: {}, korrekturen: KORREKTUREN, laufzeitSekunden: 0, abschnitte: {} };
  var datei = path.join(aus, 'ergebnis.json');
  function schreibe(abschnitt) {
    E.laufzeitSekunden = Math.round((Date.now() - t0) / 100) / 10;
    if (abschnitt) E.abschnitte[abschnitt] = E.laufzeitSekunden;
    fs.writeFileSync(datei, JSON.stringify(E, null, 1));
  }
  schreibe('start');
  var F = KL.fenster;
  var M = S.messung(D, { A: F.A, B: F.B }, { fortschritt: function (x) { log('Fenster ' + x + ' fertig'); } });
  /* Klinken im Lauf (ZUSATZ §1.6, §1.9, §2.4) */
  ['A', 'B'].forEach(function (f) {
    ['kandidat', 'placebo'].forEach(function (m) {
      var X = M[f][m];
      if (X.fenster.handelstage !== def[f].handelstage) throw new Error('KLINKE: Fenster ' + f + ' (' + m + ') hat ' + X.fenster.handelstage + ' Handelstage');
      if (X.ausschuettungen.spyGebucht !== def[f].spyAusschuettungen) throw new Error('KLINKE: SPY bucht im Fenster ' + f + ' ' + X.ausschuettungen.spyGebucht + ' Ausschuettungen statt ' + def[f].spyAusschuettungen);
      if (X.haupt.zuWenigTage === 0 && (X.haupt.perioden !== def[f].perioden || X.haupt.letztePeriodeTage !== def[f].letztePeriode)) {
        throw new Error('KLINKE: Fenster ' + f + ' (' + m + ') hat ' + X.haupt.perioden + ' Perioden, die letzte ' + X.haupt.letztePeriodeTage + ' Tage (Soll ' + def[f].perioden + ' / ' + def[f].letztePeriode + ')');
      }
    });
  });
  var hinweise = [];
  ['A', 'B'].forEach(function (f) {
    var l = M[f].kandidat.ausschuettungen.moeglicheLuecken;
    if (l.length) hinweise.push('Hinweis Fenster ' + f + ': ' + l.length + ' mögliche fehlende Quartalszahlung(en) eines gehaltenen Fonds (Heuristik) – Abgleich mit der zweiten Quelle in der Datenprüfung; trifft es zu, trägt ein „schlägt nicht“ den Vermerk „Datenlücke gegen das Buch“');
  });
  if (hinweise.length) M.urteil.vermerke = M.urteil.vermerke.concat(hinweise);
  ['A', 'B'].forEach(function (f) {
    E.fenster[f] = { kandidat: fensterAusgabe(M[f].kandidat, true), placebo: fensterAusgabe(M[f].placebo, true), kandidatGegenPlacebo: M[f].kandidatGegenPlacebo,
      adjclose: M[f].adjclose, nichtAusfuehrbar: M[f].nichtAusfuehrbar };
  });
  E.urteil = M.urteil;
  schreibe('fensterUndUrteil');
  log('Urteil: ' + M.urteil.text);
  var roll = { kennung: S.KENNUNG, spalten: ['start', 'ende', 'kandidatEnde', 'placeboEnde', 'spyEnde', 'kandidatPa', 'placeboPa', 'spyPa', 'zuWenigTage', 'umschichtungen'] };
  [['regel', null], ['ohneSchwelle', 0]].forEach(function (x) {
    var LL = S.langlauf(D, x[1]);
    E.zusatz[x[0]] = { umsatzMin: LL.umsatzMin, start: LL.start, ende: LL.ende, kandidat: fensterAusgabe(LL.kandidat, false), placebo: fensterAusgabe(LL.placebo, false),
      kandidatGegenPlacebo: LL.kandidatGegenPlacebo };
    schreibe('langlauf-' + x[0]);
    log('Langlauf ' + x[0] + ' ab ' + LL.start + ' fertig');
    var RO = S.rollierend(D, LL.startIndex, x[1], { fortschritt: function (i, n) { if (i % 1000 === 0) log('rollierend ' + x[0] + ': ' + i + ' von ' + n); } });
    E.zusatz[x[0]].rollierend = { kandidat: RO.kandidat, placebo: RO.placebo, kandidatGegenPlacebo: RO.kandidatGegenPlacebo, zuWenigFenster: RO.zuWenigFenster };
    roll[x[0]] = { start: LL.start, fenster: RO.zeilen.length, zeilen: RO.zeilen.map(function (z) {
      return [z.start, z.ende, z.kandidatEnde, z.placeboEnde, z.spyEnde, z.kandidatPa, z.placeboPa, z.spyPa, z.zuWenigTage, z.umschichtungen];
    }) };
    fs.writeFileSync(path.join(aus, 'rollierend.json'), JSON.stringify(roll));
    schreibe('rollierend-' + x[0]);
    log('rollierend ' + x[0] + ': ' + RO.zeilen.length + ' Fenster fertig');
  });
  E.vollstaendig = true;
  schreibe('ende');
  fs.writeFileSync(path.join(aus, 'ERGEBNIS-tabellen.md'), tabellen(E));
  log('fertig nach ' + E.laufzeitSekunden + ' s');
  return E;
}

/* ---------- Einstieg ---------- */
function main() {
  var nurKlinken = process.argv.indexOf('--nur-klinken') >= 0, t0 = Date.now();
  var PS = JSON.parse(fs.readFileSync(path.join(__dirname, 'pruefsummen.json'), 'utf8'));
  if (PS.kennung !== S.KENNUNG) throw new Error('KLINKE: pruefsummen.json hat die Kennung ' + PS.kennung);
  if (!nurKlinken) {
    /* Siegel 2 (ZUSATZ §7.4): der volle Lauf nur mit committetem, unveraendertem Simulator */
    var st = git(['status', '--porcelain', '--'].concat(SIEGEL_DATEIEN.map(function (d) { return 'studien/sektor-momentum-messung-2026-10/' + d; })));
    if (st) throw new Error('Kein Lauf: sektor.js / lauf.js / test.js sind nicht committet oder geaendert (Siegel 2 fehlt):\n' + st);
  }
  var LR = S.ladeRohdateien(S.DATEN_ORDNER, PS);                       /* SHA-256 jeder Datei vor dem Lesen, sonst Abbruch */
  var D = S.baueDaten(LR.gelesen);
  var KL = S.klinken(D);
  console.log(klinkenText(KL, LR.summen));
  if (nurKlinken) { process.exitCode = KL.bestanden ? 0 : 1; return; }
  if (!KL.bestanden) throw new Error('Klinken verfehlt - kein Lauf (ZUSATZ §1.9): ' + KL.fehler.join('; '));
  var quellen = {};
  QUELLEN.forEach(function (q) { quellen[q] = shaDatei(q); });
  vollerLauf(D, { t0: t0, klinken: KL, summen: LR.summen, ordner: S.DATEN_ORDNER, geladen: PS.geladen, quellen: quellen, gitHead: git(['rev-parse', 'HEAD']), gitSauber: true });
}

module.exports = { vollerLauf: vollerLauf, tabellen: tabellen, klinkenText: klinkenText, fensterAusgabe: fensterAusgabe, KORREKTUREN: KORREKTUREN };

if (require.main === module) {
  try { main(); } catch (e) { console.error(e && e.stack || e); process.exitCode = 1; }
}

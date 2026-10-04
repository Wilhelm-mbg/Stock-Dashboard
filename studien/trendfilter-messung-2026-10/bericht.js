'use strict';
/* Trendfilter-Messung: Tabellen fuer ERGEBNIS.md aus ergebnis.json (keine Zahl wird von Hand abgeschrieben).
 *   node studien/trendfilter-messung-2026-10/bericht.js [--ein ergebnis.json] [--md ERGEBNIS.md]
 * Ersetzt in ERGEBNIS.md den Block zwischen <!-- TABELLEN-ANFANG --> und <!-- TABELLEN-ENDE --> (Text ausserhalb bleibt, wie er
 * von Hand geschrieben ist). Gibt es die Datei nicht, wird sie mit leerem Rahmen angelegt. Einfuegen per slice, nicht per replace
 * (Dollarzeichen im Text). */
var fs = require('fs');
var path = require('path');

function argWert(name, vorgabe) {
  var i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : vorgabe;
}
var EIN = path.resolve(argWert('--ein', path.join(__dirname, 'ergebnis.json')));
var MD = path.resolve(argWert('--md', path.join(__dirname, 'ERGEBNIS.md')));
var ZWEIT = path.join(path.dirname(EIN), 'zweitrechner.json');
var ANF = '<!-- TABELLEN-ANFANG (erzeugt von bericht.js aus ergebnis.json - nicht von Hand aendern) -->';
var END = '<!-- TABELLEN-ENDE -->';

var MINUS = '−';
function tausender(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function zahl(x, d) {
  if (x == null || isNaN(x)) return '–';
  var s = Math.abs(x).toFixed(d);
  var teile = s.split('.');
  var t = tausender(teile[0]) + (teile[1] ? ',' + teile[1] : '');
  return (x < 0 && Number(s) !== 0 ? MINUS : '') + t;
}
function vz(x, d) { if (x == null || isNaN(x)) return '–'; var s = zahl(x, d); return (x > 0 && Number(Math.abs(x).toFixed(d)) !== 0 ? '+' : '') + s; }
function geld(x) { return zahl(x, 2) + ' $'; }
function proz(x, d) { return vz(x * 100, d == null ? 1 : d) + ' %'; }
function pp(x) { return vz(x, 2) + ' Pp'; }
function datum(t) { return t ? t.slice(8, 10) + '.' + t.slice(5, 7) + '.' + t.slice(0, 4) : '–'; }
function uw(u) { return zahl(u.tage, 0) + ' Tage (' + datum(u.von) + '–' + datum(u.bis) + (u.erholt ? '' : ', nicht erholt') + ')'; }
function jaNein(b) { return b ? 'ja' : 'nein'; }
function anteil(x) { return zahl(x * 100, 0) + ' %'; }
/** Verfehlte Bedingungen der Entscheidregel in deutscher Schreibweise (aus den Bedingungen und Zahlen, nicht aus dem Rohtext). */
function verfehlt(m) {
  var aus = [];
  ['A', 'B'].forEach(function (f) {
    var b = m.urteil.bedingungen[f], x = m.fenster[f];
    if (!b.a_k0Vorn) aus.push(f + ': beim Start am ersten Tag nicht vorn (' + pp(x.k0.abstandPp) + ')');
    if (!b.b_mind70ProzentVorn) aus.push(f + ': nur ' + x.starttage.vorn + ' von ' + x.starttage.anzahl + ' Starttagen vorn (unter 70 %)');
    if (!b.c_medianUeberNull) aus.push(f + ': Median ' + pp(x.starttage.median) + ' p. a., nicht über null');
  });
  return aus;
}

function tabellen(E, Z) {
  var R = ['R1', 'R2', 'R3'];
  var out = [];
  function z(s) { out.push(s); }

  z('## 1 Urteil nach der Entscheidregel (REGEL §5.3)');
  z('');
  z('| Regel | A: Start am 1. Tag | A: Starttage vorn | A: Median | B: Start am 1. Tag | B: Starttage vorn | B: Median | **Urteil** |');
  z('|---|---|---|---|---|---|---|---|');
  R.forEach(function (r) {
    var m = E.regeln[r], A = m.fenster.A, B = m.fenster.B;
    z('| ' + r + ' ' + m.titel + ' | ' + pp(A.k0.abstandPp) + (A.k0.vorn ? ' (vorn)' : ' (hinten)') + ' | ' + A.starttage.vorn + ' von ' + A.starttage.anzahl +
      ' | ' + pp(A.starttage.median) + ' | ' + pp(B.k0.abstandPp) + (B.k0.vorn ? ' (vorn)' : ' (hinten)') + ' | ' + B.starttage.vorn + ' von ' + B.starttage.anzahl +
      ' | ' + pp(B.starttage.median) + ' | **' + m.urteil.satz + '** |');
  });
  z('');
  R.forEach(function (r) { var v = verfehlt(E.regeln[r]); if (v.length) z('- ' + r + ' verfehlt: ' + v.join('; ') + '.'); });
  z('');

  ['A', 'B'].forEach(function (f) {
    var A0 = E.regeln.R1.fenster[f].k0;
    z('## ' + (f === 'A' ? '2' : '3') + ' Fenster ' + f + ', Start am ersten Tag (' + datum(A0.start) + ' bis ' + datum(A0.ende) + ', ' + zahl(A0.kalendertage, 0) + ' Kalendertage)');
    z('');
    z('| | Endwert (100.000 $) | p. a. | Abstand | größter Rückschlag | längste Zeit unter Wasser | Tage unter Wasser | Wechsel (je Jahr) | Kosten |');
    z('|---|---|---|---|---|---|---|---|---|');
    var s = A0.spy;
    z('| SPY halten | ' + geld(s.endwert) + ' | ' + proz(s.pa, 2) + ' | – | ' + proz(s.maxRueckschlag) + ' | ' + uw(s.unterWasser) + ' | ' + anteil(s.anteilTageUnterWasser) + ' | – | 0 $ |');
    R.forEach(function (r) {
      var k = E.regeln[r].fenster[f].k0, g = k.regel;
      z('| ' + r + ' ' + E.regeln[r].titel + ' | ' + geld(g.endwert) + ' | ' + proz(g.pa, 2) + ' | ' + pp(k.abstandPp) + ' | ' + proz(g.maxRueckschlag) + ' | ' + uw(g.unterWasser) +
        ' | ' + anteil(g.anteilTageUnterWasser) + ' | ' + k.wechsel + ' (' + zahl(k.wechselJeJahr, 2) + ') | ' + geld(k.kosten) + ' |');
    });
    z('');
    z('**Placebo** (1.000 Läufe je Regel: dieselbe Folge von Reihen, dieselbe Zahl Wechsel, zufällige Tage; REGEL §6) und **alle Starttage** (REGEL §5.2):');
    z('');
    z('| Regel | Abstand der Regel | Placebo: Median [5 %; 95 %] | Placebo vor SPY | Placebo-Läufe über der Regel | Starttage: Min / Median / Max | Starttage vorn | Rückschlag über die Starttage |');
    z('|---|---|---|---|---|---|---|---|');
    R.forEach(function (r) {
      var x = E.regeln[r].fenster[f], p = x.placebo, st = x.starttage;
      z('| ' + r + ' | ' + pp(x.k0.abstandPp) + ' | ' + (p.istRegelSelbst ? 'W = 0: Placebo = Regel' : pp(p.abstandMedian) + ' [' + vz(p.abstandP5, 2) + '; ' + vz(p.abstandP95, 2) + ']') +
        ' | ' + zahl(p.anteilVorSpy * 100, 1) + ' % | ' + p.mehrAlsRegel + ' von ' + zahl(p.laeufe, 0) + ' | ' + vz(st.minimum, 2) + ' / ' + vz(st.median, 2) + ' / ' + vz(st.maximum, 2) +
        ' Pp | ' + st.vorn + ' von ' + st.anzahl + ' | ' + proz(st.rueckschlagRegelMax) + ' bis ' + proz(st.rueckschlagRegelMin) + ' |');
    });
    z('');
    z('**Wechsel** (Ausführungstag zur Eröffnung: von → nach; jeder Wechsel ist ein Verkauf — nach deutscher Abgeltungsteuer ein Steuerereignis, hier nicht modelliert):');
    z('');
    R.forEach(function (r) {
      var k = E.regeln[r].fenster[f].k0;
      var anteil = Object.keys(k.anteilTage).sort().map(function (sym) { return sym + ' ' + zahl(k.anteilTage[sym] * 100, 1) + ' %'; }).join(', ');
      z('- **' + r + '** (Erstkauf ' + k.erstkauf.reihe + '; Tage: ' + anteil + '): ' + (k.wechselListe.length ? k.wechselListe.map(function (w) { return datum(w.tag) + ' ' + w.von + '→' + w.nach; }).join(' · ') : 'kein Wechsel'));
    });
    z('');
    z('**Kalenderjahre** (Regel / SPY; erstes Jahr ab Starttag, letztes bis Endtag):');
    z('');
    var jahre = E.regeln.R1.fenster[f].k0.kalenderjahre.map(function (j) { return j.jahr; });
    z('| Jahr | ' + R.join(' | ') + ' | SPY |');
    z('|---|' + R.map(function () { return '---'; }).join('|') + '|---|');
    jahre.forEach(function (y, i) {
      z('| ' + y + ' | ' + R.map(function (r) { return proz(E.regeln[r].fenster[f].k0.kalenderjahre[i].regel); }).join(' | ') + ' | ' + proz(E.regeln.R1.fenster[f].k0.kalenderjahre[i].spy) + ' |');
    });
    z('');
  });

  z('## 4 Zusatz 2003–2026: alle rollierenden 5-Jahres-Fenster (Ersatzreihen SHY, EFA; entscheidet nicht)');
  z('');
  var zs = E.regeln.R1.zusatz;
  z('Starttage ' + datum(zs.ersterTag) + ' bis ' + datum(zs.letzterStart) + ', je Fenster fünf Jahre. Die Fenster überlappen fast vollständig — kein unabhängiger Nachweis.');
  z('');
  z('| Regel | Fenster | vorn | Abstand Median [10 %; 90 %] | Min / Max | Rückschlag Median Regel / SPY | schlechtester Regel / SPY | flacher als SPY | Zeit unter Wasser Median Regel / SPY | Wechsel je Jahr (Median) |');
  z('|---|---|---|---|---|---|---|---|---|---|');
  R.forEach(function (r) {
    var q = E.regeln[r].zusatz.zusammen;
    z('| ' + r + ' | ' + zahl(q.fenster, 0) + ' | ' + zahl(q.anteilVorn * 100, 1) + ' % | ' + pp(q.abstandMedian) + ' [' + vz(q.abstandP10, 2) + '; ' + vz(q.abstandP90, 2) + '] | ' +
      vz(q.abstandMin, 2) + ' / ' + vz(q.abstandMax, 2) + ' | ' + proz(q.rueckschlagRegelMedian) + ' / ' + proz(q.rueckschlagSpyMedian) + ' | ' + proz(q.rueckschlagRegelSchlechtester) + ' / ' +
      proz(q.rueckschlagSpySchlechtester) + ' | ' + zahl(q.anteilFlacherAlsSpy * 100, 1) + ' %' + (q.gleichWieSpy ? ' (' + zahl(q.gleichWieSpy, 0) + ' Fenster gleich)' : '') + ' | ' + zahl(q.unterWasserRegelMedian, 0) + ' / ' + zahl(q.unterWasserSpyMedian, 0) + ' Tage | ' + zahl(q.wechselJeJahrMedian, 2) + ' |');
  });
  z('');
  z('Je Startjahr (Anteil der Fenster vorn / Median des Abstands in Pp p. a.):');
  z('');
  z('| Startjahr | Fenster | ' + R.map(function (r) { return r + ' vorn / Median'; }).join(' | ') + ' |');
  z('|---|---|' + R.map(function () { return '---'; }).join('|') + '|');
  E.regeln.R1.zusatz.jeStartjahr.forEach(function (y, i) {
    z('| ' + y.startjahr + ' | ' + y.fenster + ' | ' + R.map(function (r) { var q = E.regeln[r].zusatz.jeStartjahr[i]; return zahl(q.anteilVorn * 100, 0) + ' % / ' + vz(q.abstandMedian, 2); }).join(' | ') + ' |');
  });
  z('');
  z('**Gesamtlauf** ' + datum(zs.gesamtlauf.start) + ' bis ' + datum(zs.gesamtlauf.ende) + ' (ein Start, nachrichtlich):');
  z('');
  z('| | Endwert | p. a. | Abstand | größter Rückschlag | längste Zeit unter Wasser | Wechsel (je Jahr) |');
  z('|---|---|---|---|---|---|---|');
  var gs = zs.gesamtlauf.spy;
  z('| SPY halten | ' + geld(gs.endwert) + ' | ' + proz(gs.pa, 2) + ' | – | ' + proz(gs.maxRueckschlag) + ' (' + datum(gs.rueckschlagSpitze) + '–' + datum(gs.rueckschlagTief) + ') | ' + uw(gs.unterWasser) + ' | – |');
  R.forEach(function (r) {
    var g = E.regeln[r].zusatz.gesamtlauf;
    z('| ' + r + ' | ' + geld(g.regel.endwert) + ' | ' + proz(g.regel.pa, 2) + ' | ' + pp(g.abstandPp) + ' | ' + proz(g.regel.maxRueckschlag) + ' (' + datum(g.regel.rueckschlagSpitze) + '–' +
      datum(g.regel.rueckschlagTief) + ') | ' + uw(g.regel.unterWasser) + ' | ' + g.wechsel + ' (' + zahl(g.wechselJeJahr, 2) + ') |');
  });
  z('');

  z('## 5 Nachrichtliche Lesarten (REGEL §7.2; entscheiden nicht)');
  z('');
  z('| Regel | Lesart | A: Start am 1. Tag | A: vorn / Median | A: Rückschlag | B: Start am 1. Tag | B: vorn / Median | B: Rückschlag | Wechsel A / B |');
  z('|---|---|---|---|---|---|---|---|---|');
  R.forEach(function (r) {
    var m = E.regeln[r];
    var zeilen = [['Haupt', { A: m.fenster.A, B: m.fenster.B }, 'Hauptlesart (entscheidet)']];
    Object.keys(m.fenster.A.nachrichtlich).forEach(function (vn) { zeilen.push([vn, { A: m.fenster.A.nachrichtlich[vn], B: m.fenster.B.nachrichtlich[vn] }, m.fenster.A.nachrichtlich[vn].titel]); });
    zeilen.forEach(function (zl) {
      var A = zl[1].A, B = zl[1].B;
      z('| ' + r + ' | ' + zl[0] + ' ' + zl[2] + ' | ' + pp(A.k0.abstandPp) + ' | ' + A.starttage.vorn + '/' + A.starttage.anzahl + ' / ' + vz(A.starttage.median, 2) + ' | ' + proz(A.k0.regel.maxRueckschlag) +
        ' | ' + pp(B.k0.abstandPp) + ' | ' + B.starttage.vorn + '/' + B.starttage.anzahl + ' / ' + vz(B.starttage.median, 2) + ' | ' + proz(B.k0.regel.maxRueckschlag) + ' | ' + A.k0.wechsel + ' / ' + B.k0.wechsel + ' |');
    });
  });
  z('');

  z('## 6 Zweiter Rechner (REGEL §9.1)');
  z('');
  if (Z && Z.vergleich) {
    z('| Regel | Fenster | Endwert Regel: Lauf / zweiter Rechner | Endwert SPY: Lauf / zweiter Rechner | Wechsel gleich | Starttage gleich |');
    z('|---|---|---|---|---|---|');
    Z.vergleich.forEach(function (v) {
      z('| ' + v.regel + ' | ' + v.fenster + ' | ' + v.regelLauf + ' / ' + v.regelZweit + ' $ | ' + v.spyLauf + ' / ' + v.spyZweit + ' $ | ' + jaNein(v.wechselGleich) + ' | ' + v.starttage + ' |');
    });
  } else z('(Vergleich steht in test.js; Ergebnis siehe dort.)');
  z('');

  z('## 7 Daten und Lauf');
  z('');
  z('- Lauf: ' + E.lauf.zeitUtc + ' (UTC), Node ' + E.lauf.node + ', Git-Stand beim Lauf `' + E.lauf.gitHead + '`, Dauer ' + zahl(E.lauf.dauerSekunden, 1) + ' s; Siegel `' + E.siegel + '`.');
  z('- Rohdaten: Yahoo-Chart, abgerufen ' + E.daten.pruefsummen.abgerufenUtc + '; kanonische Auszüge gegen `pruefsummen.json` geprüft (' +
    Object.keys(E.daten.pruefsummen.reihen || {}).map(function (s) { return s + ' ' + (E.daten.pruefsummen.reihen[s].shaKanonisch || '').slice(0, 12); }).join(', ') + ').');
  z('- Kalender: ' + zahl(E.daten.kalender.tage, 0) + ' SPY-Handelstage ' + datum(E.daten.kalender.erster) + '–' + datum(E.daten.kalender.letzter) + '; erster Zusatz-Tag ' + datum(E.zusatzErsterTag) + '.');
  var fe = [];
  R.forEach(function (r) { ['A', 'B'].forEach(function (f) { fe.push(r + f + ' ' + E.regeln[r].fenster[f].k0.fehlendeKurse); }); });
  z('- Fälle mit fehlendem Kurs beim Start am ersten Tag (Erwartung 0): ' + fe.join(', ') + '. Verschobene Ex-Tage: ' + E.daten.zaehlung.exTagVerschoben.length + '.');
  z('- Code-Prüfsummen (SHA-256, erste 12 Zeichen): ' + Object.keys(E.lauf.code).map(function (f) { return f + ' ' + E.lauf.code[f].slice(0, 12); }).join(', ') + '.');
  z('- Korrekturen: ' + (E.korrekturen.length ? E.korrekturen.map(function (k) { return k.text || JSON.stringify(k); }).join(' ') : 'keine') + '.');
  return out.join('\n');
}

function haupt() {
  var E = JSON.parse(fs.readFileSync(EIN, 'utf8'));
  var Z = null;
  if (fs.existsSync(ZWEIT) && fs.existsSync(path.join(path.dirname(EIN), 'vergleich-zweitrechner.json'))) {
    Z = JSON.parse(fs.readFileSync(path.join(path.dirname(EIN), 'vergleich-zweitrechner.json'), 'utf8'));
  }
  var block = ANF + '\n\n' + tabellen(E, Z) + '\n\n' + END;
  var text = fs.existsSync(MD) ? fs.readFileSync(MD, 'utf8') : '# ERGEBNIS\n\n' + ANF + '\n' + END + '\n';
  var a = text.indexOf(ANF), b = text.indexOf(END);
  if (a < 0 || b < 0 || b < a) throw new Error('Marken in ' + MD + ' fehlen oder stehen falsch');
  fs.writeFileSync(MD, text.slice(0, a) + block + text.slice(b + END.length));
  console.log('Tabellen geschrieben in ' + MD);
}

if (require.main === module) haupt();
module.exports = { zahl: zahl, vz: vz, tabellen: tabellen };

'use strict';
/* ================= Zusatz A: der Momentum-Korb, nachgebaut =================
 *
 * Das Lauf-JSON der Studie vorregistrierung-2026-09-02-momentum-liquide fuehrt je Periode
 * nur `korbN` - WELCHE Werte im Korb lagen, steht nirgends. Fuer die Spannenfrage ("was
 * kostet eine Umschichtung wirklich?") braucht es die Namen, also wird der Korb aus dem
 * Archiv nachgebaut.
 *
 * DER NACHBAU IST NICHT ZU GLAUBEN, SONDERN ZU PRUEFEN. Er gilt nur, wenn er je Periode
 * EXAKT dasselbe korbN liefert wie lauf-2026-09-01-22-52.json. Das ist die Positivkontrolle
 * dieses Zusatzes (Registrierung Paragraph 6, Zusatz A). Schlaegt sie fehl, entfaellt
 * Zusatz A und wird als entfallen berichtet - es wird NICHT mit einem anderen Korb
 * weitergerechnet.
 *
 * ================= WAS DIE KONTROLLE SCHON GEFANGEN HAT =================
 * Die erste Fassung dieser Datei wich in VIER Punkten vom Vorbild ab, und alle vier haetten
 * einen anderen Korb ergeben. Sie stehen hier, weil die naechste Person sonst dieselben
 * Fehler macht:
 *
 *   1. MERKMAL_START war RUECKBLICK (231) statt RUECKBLICK + LUECKE (252). Das Merkmal
 *      laeuft von i-252 bis i-21 - ein Rueckblick von 231 Tagen, der 21 Tage vor dem
 *      Stichtag endet. Mit 231 als Startversatz waere es ein ANDERES Momentum gewesen.
 *   2. Der letzte Balken jeder Reihe wird abgeschnitten (`b.slice(0, len-1)`, Issue #85).
 *   3. reiheKaputt() wirft Reihen mit Kurssprung > 4 oder < -0,8 und Kursen > 100.000 weg.
 *   4. Reihen verschwundener Werte werden am Delisting-Datum abgeschnitten.
 * Dazu die Mindestlaenge (MERKMAL_START + HALTEN + 10) und tagVon() als UTC-Datum.
 *
 * Deshalb steht der Kern hier WOERTLICH wie im Vorbild, nicht sinngemaess. Wer eine Zeile
 * aendert, baut einen anderen Korb - und die Kontrolle wird rot.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */

var fs = require('fs');
var path = require('path');
var os = require('os');
var WP = require(path.join(__dirname, '..', 'messmaschine', 'strategien', 'wertpapierart.js'));

var ARCHIV = process.env.MD_ARCHIV1D || 'E:/Markt-Dashboard-Archiv/archiv1d';
var MASSIVE = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive');
var VORBILD = path.join(__dirname, '..', 'vorregistrierung-2026-09-02-momentum-liquide',
                        'lauf-2026-09-01-22-52.json');

/* Woertlich aus dem Vorbild. Wer eine Zahl aendert, baut einen anderen Korb nach. */
var RUECKBLICK = 231, LUECKE = 21, HALTEN = 63, ANTEIL = 0.10, MINDEST_WERTE = 100;
var MERKMAL_START = RUECKBLICK + LUECKE;         /* 252 - erster Index, an dem das Merkmal existiert */
var UMSATZ_MIN = 100000000;

function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }
function median(a) {
  var s = a.slice().sort(function (x, y) { return x - y; });
  return s.length ? s[s.length >> 1] : NaN;
}
function letzterIndexBis(tage, tag) {
  var lo = 0, hi = tage.length - 1, best = -1;
  while (lo <= hi) { var m = (lo + hi) >> 1; if (tage[m] <= tag) { best = m; lo = m + 1; } else hi = m - 1; }
  return best;
}
function reiheKaputt(b) {
  var maxKurs = 0;
  for (var i = 0; i < b.length; i++) {
    var c = b[i][1]; if (!(c > 0)) continue;
    if (c > maxKurs) maxKurs = c;
    if (i > 0 && b[i - 1][1] > 0) { var r = c / b[i - 1][1] - 1; if (r > 4 || r < -0.8) return 'Sprung'; }
  }
  return maxKurs > 100000 ? 'Kurs' : null;
}
function bereite(sym, b, quelle, delistet) {
  if (!b || !b.length) return null;
  if (delistet) { var cut = letzterIndexBis(b.map(function (k) { return tagVon(k[0]); }), delistet); b = b.slice(0, cut + 1); }
  b = b.slice(0, b.length - 1);                                     /* #85 */
  if (b.length < 2) return null;
  if (reiheKaputt(b)) return 'kaputt';
  var tage = new Array(b.length), idx = new Map();
  for (var i = 0; i < b.length; i++) { tage[i] = tagVon(b[i][0]); idx.set(tage[i], i); }
  return { sym: sym, b: b, tage: tage, idx: idx, quelle: quelle };
}

function ladeUeberlebende() {
  var dateien = fs.readdirSync(ARCHIV).filter(function (f) { return /^bars_1d_.+\.json$/.test(f); });
  var U = {}, z = { dateien: dateien.length, keineAktie: 0, zuKurz: 0, kaputt: 0, genutzt: 0 };
  dateien.forEach(function (f) {
    var sym = f.slice(8, -5);
    if (!WP.istAktie(sym)) { z.keineAktie++; return; }
    var j; try { j = JSON.parse(fs.readFileSync(path.join(ARCHIV, f), 'utf8')); } catch (e) { return; }
    var b = j && (j.series || j.bars);
    if (!b || b.length < MERKMAL_START + HALTEN + 10) { z.zuKurz++; return; }
    var r = bereite(sym, b, 'archiv1d', null);
    if (r === 'kaputt') { z.kaputt++; return; }
    if (!r) { z.zuKurz++; return; }
    U[sym] = r; z.genutzt++;
  });
  return { reihen: U, zaehl: z };
}

function ladeVerschwundene() {
  var ordner = path.join(MASSIVE, 'tagesdaten');
  var dateien;
  try { dateien = fs.readdirSync(ordner).filter(function (f) { return f.slice(-5) === '.json'; }); }
  catch (e) { return { reihen: {}, zaehl: { fehler: String(e.code || e) } }; }
  var V = {}, z = { dateien: dateien.length, keineAktie: 0, zuKurz: 0, kaputt: 0, genutzt: 0, mitDelisting: 0 };
  dateien.forEach(function (f) {
    var sym = f.slice(0, -5);
    if (!WP.istAktie(sym)) { z.keineAktie++; return; }
    var j; try { j = JSON.parse(fs.readFileSync(path.join(ordner, f), 'utf8')); } catch (e) { return; }
    var b = j && (j.series || j.bars);
    var r = bereite(sym, b, 'massive', j.delistet || null);
    if (r === 'kaputt') { z.kaputt++; return; }
    if (!r || r.b.length < 20) { z.zuKurz++; return; }
    if (j.delistet) z.mitDelisting++;
    V[sym] = r; z.genutzt++;
  });
  return { reihen: V, zaehl: z };
}

/** Die Vereinigung - NICHT die Grundlage der Perioden, siehe unten. Bleibt hier, weil
 *  Zusatz C sie brauchen wird (Ueberlebensverzerrung der Spannen). */
function ladeAlles() {
  var U = ladeUeberlebende(), V = ladeVerschwundene();
  var reihen = {};
  Object.keys(U.reihen).forEach(function (s) { reihen[s] = U.reihen[s]; });
  Object.keys(V.reihen).forEach(function (s) { if (!reihen[s]) reihen[s] = V.reihen[s]; });
  return { reihen: reihen, zaehl: { archiv: U.zaehl, verschwundene: V.zaehl, gesamt: Object.keys(reihen).length } };
}

/* ---------- Eine Periode: woertlich periode() + korbBilden() des Vorbilds ----------
 * `endTag` ist der Ausstiegstag der Periode. Das Vorbild verlangt fuer jeden Kandidaten
 * einen gueltigen Ausstiegskurs und wirft ihn sonst weg; die Bedingung steht hier, damit
 * der Nachbau woertlich ist. Der Ausstiegstag steht im Lauf-JSON (`P.ende`) und muss nicht
 * aus einer Zeitachse nachgebaut werden.
 *
 * ZUR EHRLICHKEIT: Diese Bedingung war die erste Vermutung fuer die drei abweichenden
 * Perioden (2025-08-28, 2025-11-26, 2026-03-02, je 18-24 Kandidaten zu viel) - und sie war
 * FALSCH. Nach dem Einbau blieben die Abweichungen auf das Stueck gleich. Die Ursache lag
 * woanders: der Nachbau mischte die verschwundenen Reihen ein, das Vorbild nicht (siehe
 * pruefen()). Die Bedingung bleibt trotzdem drin, weil sie im Vorbild steht - aber sie hat
 * hier nichts repariert, und wer das Gegenteil in den Kommentar schreibt, schickt den
 * naechsten Leser auf dieselbe falsche Faehrte. */
function korbAm(reihen, startTag, endTag) {
  var kand = [], syms = Object.keys(reihen);
  for (var si = 0; si < syms.length; si++) {
    var R = reihen[syms[si]], b = R.b;
    var i = R.idx.get(startTag);
    if (i == null) continue;
    var von = i - MERKMAL_START, bis = i - LUECKE;
    if (von < 0) continue;
    var a = b[von][1], m2 = b[bis][1], p0 = b[i][1];
    if (!(a > 0) || !(m2 > 0) || !(p0 > 0)) continue;
    if (endTag) {
      var iE = R.idx.get(endTag);
      if (iE == null) { iE = letzterIndexBis(R.tage, endTag); if (iE <= i) continue; }
      if (!(b[iE][1] > 0)) continue;
    }
    var ums = [];
    for (var q = Math.max(0, i - 19); q <= i; q++) ums.push((b[q][1] || 0) * (b[q][2] || 0));
    var umsatz = median(ums);
    if (!(umsatz >= UMSATZ_MIN)) continue;
    kand.push({ sym: R.sym, staerke: m2 / a - 1, umsatz: umsatz });
  }
  if (kand.length < MINDEST_WERTE) return null;
  kand.sort(function (x, y) { return y.staerke - x.staerke; });
  var n = Math.max(1, Math.round(kand.length * ANTEIL));
  return { korb: kand.slice(0, n), n: kand.length };
}

/* ---------- Die Positivkontrolle ----------
 * GRUNDLAGE SIND NUR DIE UEBERLEBENDEN. Das Vorbild ruft laufe(UE.reihen, symsS, ...) -
 * die verschwundenen Reihen benutzt es ausschliesslich im Abschnitt zur
 * Ueberlebensverzerrung (reihenU/symsU), nicht fuer die Perioden, die im Lauf-JSON stehen.
 * Wer sie einmischt, bekommt in einigen Perioden mehr zulaessige Werte und damit einen
 * anderen Korb - der Nachbau hatte das, und die Kontrolle hat es gefangen. */
function pruefen(abJahr, reihenVorab) {
  var vj = JSON.parse(fs.readFileSync(VORBILD, 'utf8'));
  var soll = vj.perioden.filter(function (P) { return P.tag >= (abJahr || 2016) + '-01-01'; });
  var L = reihenVorab || ladeUeberlebende();
  var out = [], abwKorb = 0, abwN = 0;
  for (var i = 0; i < soll.length; i++) {
    var K = korbAm(L.reihen, soll[i].tag, soll[i].ende);
    var korbN = K ? K.korb.length : 0, n = K ? K.n : 0;
    if (korbN !== soll[i].korbN) abwKorb++;
    if (n !== soll[i].n) abwN++;
    out.push({ tag: soll[i].tag, sollKorbN: soll[i].korbN, sollN: soll[i].n, korbN: korbN, n: n,
               korb: K ? K.korb.map(function (x) { return x.sym; }) : [] });
  }
  return { ok: abwKorb === 0, abweichungenKorb: abwKorb, abweichungenN: abwN,
           perioden: out, zaehl: L.zaehl };
}

module.exports = { pruefen: pruefen, korbAm: korbAm, ladeAlles: ladeAlles, bereite: bereite,
                   tagVon: tagVon, VORBILD: VORBILD };

if (require.main === module) {
  var t0 = Date.now();
  var r = pruefen(2016);
  process.stdout.write('Reihen geladen in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s: ' +
                       JSON.stringify(r.zaehl) + '\n');
  process.stdout.write('Perioden ab 2016: ' + r.perioden.length +
                       '   Abweichungen korbN: ' + r.abweichungenKorb +
                       '   Abweichungen n (zulaessige Werte): ' + r.abweichungenN + '\n');
  r.perioden.slice(0, 10).forEach(function (P) {
    process.stdout.write('  ' + P.tag + '  soll ' + P.sollKorbN + '/' + P.sollN +
                         '   hier ' + P.korbN + '/' + P.n +
                         (P.korbN === P.sollKorbN ? '  ok' : '  ABWEICHUNG') + '\n');
  });
  process.stdout.write(r.ok ? '\nPositivkontrolle BESTANDEN - Zusatz A darf rechnen.\n'
                            : '\nPositivkontrolle VERFEHLT - Zusatz A entfaellt.\n');
}

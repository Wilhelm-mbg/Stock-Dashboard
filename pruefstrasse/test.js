'use strict';
/* Tests der Pruefstrasse (Auftrag Nr. 110 §3): Form, Sperre, Register, Gegenproben (Kunst-Kandidat mit Blick nach vorn -> Messgeraet-
 * Fehler; eingepflanzter Effekt -> Kandidat; zeitfester Effekt -> verschobenes Signal wirkt -> Messgeraet-Fehler), Sicht roh/markt (Nr. 113),
 * Kalender (Nr. 117), Bewertung zeit (Nr. 118: marktweite Kunstregel im Modus topf genau 0, im Modus zeit der eingesaete Effekt, gepaarter
 * Placebo ~ 0, topf bitgleich zur Kunst-Eichung), additive Optionen der Instrumente bitgleich, und die KALIBRIERUNG der drei Adapter gegen
 * bekannte Ergebnisse (schreibt pruefstrasse/kalibrierung.json). Temp-Dateien tragen die Prozessnummer (gleichzeitige Laeufe).
 *   node pruefstrasse/test.js            alles (Kalibrierung laeuft tag ~1 min, korb ~10 s, minute ~5 min)
 *   node pruefstrasse/test.js --schnell  ohne die Adapterlaeufe; prueft die abgelegte kalibrierung.json gegen das Soll
 * Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var K = require('./konfig.js');
var SG = require('./siegel.js');
var TF = require('./tafel.js');
var A = require('./adapter/tag.js');
var LF = require('./laeufer.js');
var SCHNELL = process.argv.indexOf('--schnell') !== -1;
var fails = 0, n = 0;
function ok(c, name, extra) { n++; console.log((c ? '  ok   ' : '  ROT  ') + name + (extra !== undefined ? '  [' + extra + ']' : '')); if (!c) fails++; }
function nahe(a, b, tol) { return a != null && b != null && Math.abs(a - b) <= tol; }
var SCRATCH = fs.mkdtempSync(path.join(require('os').tmpdir(), 'pruefstrasse-test-'));

/* ---------- Kunstwelt: Handelstage 2021-01-04 .. 2023-12-29, 40 Reihen Zufallspfad ---------- */
function werktage(von, bis) { var t = [], d = new Date(von + 'T00:00:00Z'); while (d.toISOString().slice(0, 10) <= bis) { var w = d.getUTCDay(); if (w !== 0 && w !== 6) t.push(d.toISOString().slice(0, 10)); d = new Date(d.getTime() + 86400000); } return t; }
var TAGE = werktage('2021-01-04', '2023-12-29');
var rng = A.mulberry32(A.fnv('pruefstrasse-kunst-1'));
function gauss() { var u = 1 - rng(), v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function kunstReihen(effekt) {
  var reihen = [];
  for (var r = 0; r < 40; r++) {
    var sp = { reihe: 'K' + r, tag: [], o: [], h: [], l: [], c: [], v: [] }, p = 50 + 50 * rng();
    for (var i = 0; i < TAGE.length; i++) {
      var o = p * (1 + 0.004 * gauss()), c = o * (1 + 0.012 * gauss() + (effekt ? effekt(r, i) : 0));
      sp.tag.push(i); sp.o.push(o); sp.c.push(c); sp.h.push(Math.max(o, c) * (1 + 0.004 * rng())); sp.l.push(Math.min(o, c) * (1 - 0.004 * rng())); sp.v.push(1e6);
      p = c;
    }
    reihen.push(sp);
  }
  var spy = { reihe: 'SPY', tag: [], o: [], h: [], l: [], c: [], v: [] }, q = 400;
  for (var j = 0; j < TAGE.length; j++) { spy.tag.push(j); spy.o.push(q); spy.c.push(q * (1 + 0.005 * gauss())); spy.h.push(q * 1.01); spy.l.push(q * 0.99); spy.v.push(1e8); q = spy.c[j]; }
  reihen.push(spy);
  return reihen;
}
var KAND = { kennung: 'kunst', form: 'tag', konfigurationen: [{ key: 'H5', richtung: 'long', haltedauer: 5 }, { key: 'H10', richtung: 'long', haltedauer: 10 }], params: {} };
var zufallSignal = { signal: function (sicht, i) { return (A.fnv(sicht.reihe + '|' + i) % 25) === 0 ? { dir: 1 } : null; } };

console.log('1) Form (FORM.md §1-§4)');
var L0 = LF.ladeKandidat('gibt-es-nicht');
ok(L0.fehler.length === 1 && /Ordner fehlt/.test(L0.fehler[0]), 'fehlender Kandidat wird als ungueltig gemeldet', L0.fehler[0]);
var P1 = LF.pruefen('donchian20-ausbruch-long', { ohneSiegel: true });
ok(P1.form.length === 0 && P1.test && P1.test.status === 0, 'donchian20-ausbruch-long: Form gueltig, test.js gruen', P1.form.join('; ') || P1.test.letzteZeile);
/* Temp-Namen je Prozess (PM 12.10.2026): gleichzeitige Testlaeufe stoerten sich an festen Namen. */
var tmpName = 'kunst-ungueltig-tmp-' + process.pid, tmpK = path.join(K.WARTESCHLANGE, tmpName);
try {
  fs.mkdirSync(tmpK, { recursive: true });
  fs.writeFileSync(path.join(tmpK, 'kandidat.json'), JSON.stringify({ kennung: tmpName, form: 'tag', titel: 'x', bewertung: 'null', konfigurationen: [{ key: 'a', richtung: 'long', haltedauer: 99 }] }));
  fs.writeFileSync(path.join(tmpK, 'regel.js'), 'module.exports = {};'); fs.writeFileSync(path.join(tmpK, 'test.js'), 'process.exit(0);'); fs.writeFileSync(path.join(tmpK, 'REGEL.md'), 'kurz');
  var L1 = LF.ladeKandidat(tmpName);
  ok(L1.fehler.some(function (f) { return /ohne quelle/.test(f); }) && L1.fehler.some(function (f) { return /haltedauer/.test(f); }) && L1.fehler.some(function (f) { return /REGEL.md zu kurz/.test(f); }) && L1.fehler.some(function (f) { return /ohne signal/.test(f); }) && L1.fehler.some(function (f) { return /bewertung muss topf \| zeit/.test(f); }),
    'Pflichtfelder, Haltedauer, REGEL.md, Schnittstelle und bewertung (Nr. 118: nur topf | zeit, hier "null") werden einzeln gemeldet', L1.fehler.length + ' Fehler');
  ok(LF.naechster() !== tmpName, '--naechster ueberspringt den ungueltigen Kandidaten');
} finally { fs.rmSync(tmpK, { recursive: true, force: true }); }

console.log('2) Sperre (Nr. 109): ohne Siegel keine Pruefzeit');
var reihen0 = kunstReihen(null), T0 = TF.kunstTafel(reihen0, TAGE), sperrIdx = TF.sperrIndex(TAGE);
ok(T0.gesperrt && T0.maxTag === sperrIdx && TAGE[sperrIdx] === '2022-12-30', 'Kunsttafel ohne Siegel endet am letzten Tag vor 2023', TAGE[T0.maxTag]);
ok(TF.kunstTafel(reihen0, TAGE, { offen: true }).maxTag === TAGE.length - 1, 'mit Siegel bis zum Ende');
var e1 = null; try { TF.oeffne({ quelle: 'panel', pruefzeit: true, ohneSpeicherpruefung: true }); } catch (e) { e1 = e; }
ok(e1 && e1.sperre && /kein Siegel/.test(e1.message), 'Pruefzeit ohne Siegel-Pfad: Sperre wirft VOR dem Lesen', e1 && e1.message);
/* PM 11.10.2026: die Probe lief vorher gegen pruefstrasse/test.js selbst und war nur rot, solange diese Datei im Arbeitsbaum
 * ungesichert war (Testmarken-Falle). Jetzt gegen eine eigens angelegte, nie committete Datei - unabhaengig vom Arbeitsbaum. */
var tmpSrel = 'pruefstrasse/ungesichert-tmp-' + process.pid + '.json', tmpS = path.join(K.REPO, tmpSrel); fs.writeFileSync(tmpS, '{}');   /* Name je Prozess (PM 12.10.) */
var e2 = null; try { require('./paneltafel.js').oeffne({ pruefzeit: true, siegelPfad: tmpSrel, ohneSpeicherpruefung: true }); } catch (e) { e2 = e; }
ok(e2 && e2.sperre, 'Paneltafel: Siegel auf einer veraenderten/ungesicherten Datei scheitert', e2 && e2.message.slice(0, 80));
var e3 = null; try { SG.pruefeSiegel(K.REPO, tmpSrel); } catch (e) { e3 = e; } finally { fs.unlinkSync(tmpS); }
ok(e3 && e3.sperre && /keinem Commit/.test(e3.message), 'Siegel 2 auf einer Datei ohne Commit: SPERRE', e3 && e3.message);
/* Nr. 118: Marke ist konfig.json, nicht FORM.md - FORM.md aendert jeder Form-Auftrag im Arbeitsbaum und die Probe war dann rot (Testmarken-Falle). */
var s1 = SG.pruefeSiegel(K.REPO, 'pruefstrasse/konfig.json');
ok(/^[0-9a-f]{40}$/.test(s1.commit) && s1.sha256.length === 64, 'Siegel 2 auf konfig.json (committet, von Bau-Auftraegen nie angefasst) liefert Commit und Pruefsumme', s1.commit.slice(0, 7));
var e4 = null; try { SG.siegel1(K.REPO, 'pruefstrasse/gibt-es-nicht'); } catch (e) { e4 = e; }
ok(e4 && e4.sperre, 'Siegel 1 auf einem fehlenden Ordner: SPERRE');
var E0 = A.lauf(zufallSignal, KAND, { tafel: T0 });
ok(E0.konfigurationen.every(function (k) { return k.entdeckung.nTr > 0; }) && E0.konfigurationen.every(function (k) { return !k.pruefung; }) && E0.letzterTag === '2022-12-30', 'gesperrte Tafel: Entdeckung rechnet, Pruefung gibt es nicht', E0.konfigurationen[0].entdeckung.nTr + ' Trades');

console.log('2b) Sicht: roher Schluss und Marktreihe (Nr. 113)');
/* Kunst-Sicht mit roh- und markt-Spalte: lesbar bis i, dahinter NaN UND Verstoss (wie c) */
var ks1 = { reihe: 'K', tag: [0, 1, 2, 4, 5], o: [10, 11, 12, 13, 14], h: [10, 11, 12, 13, 14], l: [10, 11, 12, 13, 14], c: [10, 11, 12, 13, 14], v: [1, 1, 1, 1, 1], roh: [40, 44, 48, 13, 14], markt: [400, 401, 402, 403, 404, 405] };
var sk1 = A.kunstSicht(ks1, 2), v0 = sk1.verstoesse(), r1 = sk1.roh(1), m2 = sk1.markt(2), r3 = sk1.roh(3), m3 = sk1.markt(3);
ok(sk1.hatRoh === true && sk1.hatMarkt === true && v0 === 0 && r1 === 44 && m2 === 402 && isNaN(r3) && isNaN(m3) && sk1.verstoesse() === 2, 'Kunst-Sicht: roh(j)/markt(j) lesbar bis i, fuer j > i NaN und je ein Verstoss (wie c)', 'roh(1) ' + r1 + ' markt(2) ' + m2 + ' Verstoesse ' + sk1.verstoesse());
/* Vorgaben: ohne roh-Spalte roh = c; ohne markt hatMarkt false und NaN ohne Verstoss */
var ks2 = { reihe: 'K', tag: [0, 1, 2, 3], o: [10, 11, 12, 13], h: [10, 11, 12, 13], l: [10, 11, 12, 13], c: [10, 11, 12, 13], v: [1, 1, 1, 1] };
var sk2 = A.kunstSicht(ks2, 3);
ok(sk2.roh(0) === sk2.c(0) && sk2.roh(3) === 13 && sk2.hatMarkt === false && isNaN(sk2.markt(2)) && sk2.verstoesse() === 0, 'Kunst ohne roh-Spalte: roh(j) = c(j); ohne markt: hatMarkt false, markt(j) NaN ohne Verstoss', 'Verstoesse ' + sk2.verstoesse());
/* Kunst-Tafel: Reihe mit Kalenderluecke (Zeile 2 ist Kalendertag 4) - markt(j) = SPY-Schluss DESSELBEN KALENDERTAGS, nicht derselben Zeile */
var tage3 = TAGE.slice(0, 8), eins = [1, 1, 1, 1, 1, 1, 1, 1];
var spy3 = { reihe: 'SPY', tag: [0, 1, 2, 3, 4, 5, 6, 7], o: eins, h: eins, l: eins, c: [400, 401, 402, 403, 404, 405, 406, 407], v: eins };
var k3 = { reihe: 'K0', tag: [0, 1, 4, 5, 7], o: eins.slice(0, 5), h: eins.slice(0, 5), l: eins.slice(0, 5), c: eins.slice(0, 5), v: eins.slice(0, 5) };
var T3 = TF.kunstTafel([k3, spy3], tage3), s3 = A.Sicht(T3.reihen[0], T3); s3.setzeBis(4);
ok(T3.hatMarkt === true && T3.hatRoh === true && s3.markt(0) === 400 && s3.markt(2) === 404 && s3.markt(3) === 405 && s3.markt(4) === 407 && s3.verstoesse() === 0, 'Kunst-Tafel: markt(j) ist der SPY-Schluss desselben Kalendertags (Zeile 2 = Tag 4 -> 404), nicht derselben Zeilennummer (402)', s3.markt(2) + ' / ' + s3.markt(4));
var spyL = { reihe: 'SPY', tag: [0, 1, 3, 4, 5, 6, 7], o: eins.slice(0, 7), h: eins.slice(0, 7), l: eins.slice(0, 7), c: [400, 401, 403, 404, 405, 406, 407], v: eins.slice(0, 7) };
var kV = { reihe: 'K0', tag: [0, 1, 2, 3, 4, 5, 6, 7], o: eins, h: eins, l: eins, c: eins, v: eins };
var T3b = TF.kunstTafel([kV, spyL], tage3), s3b = A.Sicht(T3b.reihen[0], T3b); s3b.setzeBis(7);
ok(isNaN(s3b.markt(2)) && s3b.markt(1) === 401 && s3b.markt(3) === 403 && s3b.verstoesse() === 0, 'SPY fehlt an einem Kalendertag: markt(j) dort NaN ohne Verstoss, Nachbartage unberuehrt');
/* Regelflags: fehlt die Spalte der Quelle, bricht lauf mit MESSGERAET: ab und nennt die Quelle */
var ohneRoh = Object.assign({}, T0, { hatRoh: false }), e5 = null, e6 = null;
try { A.lauf({ signal: function () { return null; }, brauchtRoh: true }, KAND, { tafel: ohneRoh }); } catch (e) { e5 = e; }
var T0ohneSpy = TF.kunstTafel(reihen0.filter(function (r) { return r.reihe !== 'SPY'; }), TAGE);
try { A.lauf({ signal: function () { return null; }, brauchtMarkt: true }, KAND, { tafel: T0ohneSpy }); } catch (e) { e6 = e; }
ok(e5 && /^MESSGERAET:/.test(e5.message) && /Quelle kunst/.test(e5.message) && T0ohneSpy.hatMarkt === false && e6 && /^MESSGERAET:/.test(e6.message) && /Quelle kunst/.test(e6.message), 'brauchtRoh/brauchtMarkt auf einer Tafel ohne die Spalte: Fehler beginnt mit MESSGERAET: und nennt die Quelle', (e5 && e5.message.slice(0, 60)) + ' | ' + (e6 && e6.message.slice(0, 60)));
/* Positivkontrolle: eine Regel, die roh und markt wirklich liest, laeuft auf der Kunst-Tafel ohne Verstoss durch */
var marktRegel = { brauchtRoh: true, brauchtMarkt: true, signal: function (sicht, i) { return i > 0 && sicht.markt(i) > sicht.markt(i - 1) && sicht.roh(i) > 5 && (A.fnv(sicht.reihe + '|' + i) % 25) === 0 ? { dir: 1 } : null; } };
var Em = A.lauf(marktRegel, KAND, { tafel: T0 });
ok(Em.hatRoh === true && Em.hatMarkt === true && Em.verstoesse === 0 && Em.konfigurationen[0].entdeckung.nTr > 0, 'Regel mit brauchtRoh/brauchtMarkt liest roh(i) und markt(i) auf der Kunst-Tafel: Trades, keine Verstoesse', Em.konfigurationen[0].entdeckung.nTr + ' Trades');
/* Panel (nur wenn voll-v23c vorhanden): Split aus den Daten und markt(j) gegen die SPY-Reihe am selben Kalenderindex */
if (!fs.existsSync(path.join(K.PANEL, 'panel', '_stand.json'))) {
  ok(true, 'Panel ' + K.PANEL + ' nicht vorhanden - Split-Probe (roh/c am Ex-Tag) uebersprungen');
  ok(true, 'Panel nicht vorhanden - Marktprobe (markt(j) = spy.c am Kalenderindex) uebersprungen');
} else {
  var TP = TF.oeffne({ quelle: 'panel' }), aapl = null; TP.reihen.forEach(function (S) { if (S.reihe === 'AAPL') aapl = S; });
  var sA = A.Sicht(aapl, TP); sA.setzeBis(aapl.n - 1);
  var ex = -1, qVor = NaN, qNach = NaN;
  for (var jA = 1; jA < aapl.n; jA++) { var qa = sA.roh(jA - 1) / sA.c(jA - 1), qb = sA.roh(jA) / sA.c(jA); if (Math.abs(qb - qa) > 1e-9) { ex = jA; qVor = qa; qNach = qb; break; } }
  ok(TP.hatRoh === true && TP.quelle === 'panel' && ex > 0 && TP.tage[aapl.tag[ex]] === '2020-08-31' && nahe(qVor, 4, 1e-9) && nahe(qNach, 1, 1e-9) && Math.abs(sA.c(ex) / sA.c(ex - 1) - 1) < 0.1 && sA.roh(ex) / sA.roh(ex - 1) < 0.3 && sA.verstoesse() === 0,
    'Panel AAPL: roh/c springt am Ex-Tag 2020-08-31 von 4 auf 1 (Split 4:1 aus den Daten), c selbst nicht', (ex > 0 ? TP.tage[aapl.tag[ex]] + ' roh ' + sA.roh(ex - 1) + ' -> ' + sA.roh(ex) + ', c ' + sA.c(ex - 1).toFixed(2) + ' -> ' + sA.c(ex).toFixed(2) : 'kein Sprung'));
  var spyJeTag = {}; for (var pS = 0; pS < TP.spy.n; pS++) spyJeTag[TP.spy.tag[pS]] = TP.spy.c[pS];
  var verglichen = 0, ohneSpy = 0, falsch = 0, mitLuecke = 0;
  TP.reihen.slice(0, 300).forEach(function (S) {
    var s = A.Sicht(S, TP); s.setzeBis(S.n - 1); if (S.n < S.tag[S.n - 1] - S.tag[0] + 1) mitLuecke++;
    for (var j = 0; j < S.n; j++) { var soll = spyJeTag[S.tag[j]], m = s.markt(j); if (soll === undefined) { ohneSpy++; if (m === m) falsch++; } else { verglichen++; if (m !== soll) falsch++; } }
    if (s.verstoesse()) falsch++;
  });
  ok(TP.hatMarkt === true && verglichen > 100000 && mitLuecke > 0 && falsch === 0, 'Panel: markt(j) = spy.c am selben Kalenderindex (300 Reihen, alle Zeilen, darunter Reihen mit Kalenderluecken), ohne Verstoss', verglichen + ' verglichen, ' + mitLuecke + ' Reihen mit Luecke, ' + ohneSpy + ' ohne SPY, ' + falsch + ' falsch');
  TP = null; aapl = null; sA = null; spyJeTag = null;
}

console.log('2c) Sicht: Kalenderdatum und Monatsfunktionen (Nr. 117)');
/* Kunst-Sicht ohne datum-Spalte: Werktagskalender ab 2020-01-02 (Do 02.01., Fr 03.01., Mo 06.01. ...); datum(j) lesbar bis i, dahinter NaN UND Verstoss */
var kd1 = A.kunstSicht(ks1, 2), kdA = kd1.datum(0), kdB = kd1.datum(2), kdC = kd1.datum(3);
ok(kd1.hatDatum === true && kdA === '2020-01-02' && kd1.datum(1) === '2020-01-03' && kdB === '2020-01-06' && kdC !== kdC && kd1.verstoesse() === 1,
  'Kunst-Sicht ohne datum-Spalte: Kunstkalender aus Werktagen ab 2020-01-02 (Kalenderindex 2 = Montag 06.01.), datum(j) lesbar bis i, fuer j > i NaN und Verstoss', kdA + ' / ' + kdB + ' / Verstoesse ' + kd1.verstoesse());
/* Monatswende an einem Kunstkalender mit Feiertag (Karfreitag 30.03.2018) und Wochenende; Kalender laenger als die Sicht */
var kalM = ['2018-03-27', '2018-03-28', '2018-03-29', '2018-04-02', '2018-04-03', '2018-04-30', '2018-05-01', '2018-05-02'], e8 = [1, 1, 1, 1, 1, 1, 1, 1];
var ksM = { reihe: 'K', tag: [0, 1, 2, 3, 4, 5, 6, 7], o: e8, h: e8, l: e8, c: e8, v: e8, datum: kalM };
var sM = A.kunstSicht(ksM, 7);
ok(sM.istLetzterHandelstagImMonat(2) === true && sM.istLetzterHandelstagImMonat(1) === false && sM.istLetzterHandelstagImMonat(3) === false && sM.istLetzterHandelstagImMonat(5) === true && sM.istLetzterHandelstagImMonat(0) === false && sM.istLetzterHandelstagImMonat(7) === null,
  'letzter Handelstag im Monat: 29.03.2018 (Karfreitag 30.03. kein Handelstag, dann Wochenende) und 30.04.2018, Nachbartage false, j = i null');
ok(sM.istErsterHandelstagImMonat(3) === true && sM.istErsterHandelstagImMonat(6) === true && sM.istErsterHandelstagImMonat(2) === false && sM.istErsterHandelstagImMonat(4) === false && sM.istErsterHandelstagImMonat(7) === false && sM.istErsterHandelstagImMonat(0) === null && sM.verstoesse() === 0,
  'erster Handelstag im Monat: 02.04. (Montag nach Karfreitag) und 01.05.; fuer j = i entschieden; am Kalenderanfang null; keine Verstoesse');
/* Blick-nach-vorn-Regel: fuer j = bis null, obwohl der Kalender weitergeht; einen Tag spaeter entschieden; j > bis null und Verstoss */
var sM2 = A.kunstSicht(ksM, 2), lM2 = sM2.istLetzterHandelstagImMonat(2), lM1 = sM2.istLetzterHandelstagImMonat(1), lM3 = sM2.istLetzterHandelstagImMonat(3), vM = sM2.verstoesse(), eM2 = sM2.istErsterHandelstagImMonat(2);
sM2.setzeBis(3); var lM2b = sM2.istLetzterHandelstagImMonat(2), eM3 = sM2.istErsterHandelstagImMonat(3);
ok(lM2 === null && lM1 === false && lM3 === null && vM === 1 && eM2 === false && lM2b === true && eM3 === true && sM2.datum(2) === '2018-03-29' && sM2.verstoesse() === 1,
  'Blick-nach-vorn-Regel: am Tag i = 29.03. ist "letzter Handelstag" fuer i selbst null (Kalender geht weiter, darf aber nicht gelesen werden), j > i null + Verstoss, einen Tag spaeter true', lM2 + ' / ' + lM3 + ' / Verstoesse ' + vM + ' / spaeter ' + lM2b);
/* Kunst-Tafel (Werktage 2021-01-04 .. 2023-12-29, ohne Feiertage): Zaehlung ueber die ganze Reihe gegen den Kalender */
var sT0 = A.Sicht(T0.reihen[0], T0); sT0.setzeBis(T0.reihen[0].n - 1);
var nLetzte = 0, nErste = 0, nNull = 0; for (var jT = 0; jT < T0.reihen[0].n; jT++) { var lT = sT0.istLetzterHandelstagImMonat(jT), eT = sT0.istErsterHandelstagImMonat(jT); if (lT === true) nLetzte++; if (eT === true) nErste++; if (lT === null) nNull++; if (eT === null) nNull++; }
ok(T0.hatDatum === true && sT0.datum(0) === '2021-01-04' && sT0.datum(T0.reihen[0].n - 1) === '2023-12-29' && nLetzte === 35 && nErste === 35 && nNull === 2 && sT0.verstoesse() === 0,
  'Kunst-Tafel: datum(j) = Kalendertag, 35 letzte und 35 erste Handelstage in 36 Monaten (Dezember 2023 am Rand unbekannt, Januar 2021 am Anfang unbekannt)', nLetzte + ' / ' + nErste + ' / null ' + nNull);
/* Regelflag brauchtDatum: Tafel ohne Kalender -> MESSGERAET:; Positivkontrolle: Regel liest datum und Monatsfunktion ohne Verstoss */
var ohneDatum = Object.assign({}, T0, { hatDatum: false }), e7 = null;
try { A.lauf({ signal: function () { return null; }, brauchtDatum: true }, KAND, { tafel: ohneDatum }); } catch (e) { e7 = e; }
ok(e7 && /^MESSGERAET:/.test(e7.message) && /Quelle kunst/.test(e7.message), 'brauchtDatum auf einer Tafel ohne Kalender: Fehler beginnt mit MESSGERAET: und nennt die Quelle', e7 && e7.message.slice(0, 70));
var datumRegel = { brauchtDatum: true, signal: function (sicht, i) { return i > 0 && sicht.istLetzterHandelstagImMonat(i - 1) === true && typeof sicht.datum(i) === 'string' ? { dir: 1 } : null; } };
var Ed = A.lauf(datumRegel, KAND, { tafel: T0 });
ok(Ed.hatDatum === true && Ed.verstoesse === 0 && Ed.zaehler.signale > 0 && Ed.konfigurationen[0].entdeckung.nTage === 23, 'Regel mit brauchtDatum (Signal am ersten Handelstag des Monats ueber istLetzterHandelstagImMonat(i-1)): 23 Signaltage 2021-02 .. 2022-12, keine Verstoesse', Ed.konfigurationen[0].entdeckung.nTage + ' Signaltage, ' + Ed.zaehler.signale + ' Signale');
/* Panel (nur wenn vorhanden): datum(j) = Kalendertag aus _stand.json; Monatsfunktionen = unabhaengige Rechnung ueber denselben Kalender */
if (!fs.existsSync(path.join(K.PANEL, 'panel', '_stand.json'))) {
  ok(true, 'Panel nicht vorhanden - Datumsprobe (datum(j) = Kalendertag aus _stand.json) uebersprungen');
} else {
  var TP2 = TF.oeffne({ quelle: 'panel' }), standTage = JSON.parse(fs.readFileSync(path.join(K.PANEL, 'panel', '_stand.json'), 'utf8')).tage;
  var geprueftD = 0, falschD = 0, letzteD = 0, ersteD = 0;
  var monD = function (d) { return d.slice(0, 7); };
  TP2.reihen.slice(0, 200).forEach(function (S) {
    var s = A.Sicht(S, TP2); s.setzeBis(S.n - 1);
    for (var j = 0; j < S.n; j++) {
      var t = S.tag[j]; geprueftD++;
      if (s.datum(j) !== standTage[t]) falschD++;
      var sollL = (j < S.n - 1 && t + 1 < standTage.length) ? monD(standTage[t + 1]) !== monD(standTage[t]) : null;
      var sollE = t > 0 ? monD(standTage[t - 1]) !== monD(standTage[t]) : null;
      if (s.istLetzterHandelstagImMonat(j) !== sollL || s.istErsterHandelstagImMonat(j) !== sollE) falschD++;
      if (sollL === true) letzteD++; if (sollE === true) ersteD++;
    }
    if (s.verstoesse()) falschD++;
  });
  ok(TP2.hatDatum === true && geprueftD > 100000 && falschD === 0 && letzteD > 0, 'Panel: datum(j) = Kalendertag aus _stand.json, Monatsfunktionen = unabhaengige Rechnung ueber den Kalender (200 Reihen, alle Zeilen), ohne Verstoss', geprueftD + ' Zeilen, ' + letzteD + ' letzte / ' + ersteD + ' erste Handelstage, ' + falschD + ' falsch');
  TP2 = null; standTage = null;
}

console.log('3) Gegenproben und Urteile (FORM §5)');
var Rg0 = { kennung: 'pruefstrasse/register/v1', konfigurationen: [], gesamt: 0, zufallErwartet: 0 };
var U0 = LF.urteile(E0, null, Rg0);
ok(U0.urteil === 'nicht entscheidbar' || U0.urteil === 'nein', 'Zufallssignal ohne Effekt: kein Kandidat, kein Messgeraet-Fehler', U0.urteil + ' - ' + U0.grund);
ok(E0.verstoesse === 0, 'Zufallssignal: keine Verstoesse');
var vorn = { signal: function (sicht, i) { var c1 = sicht.c(i + 1); return c1 > sicht.c(i) ? { dir: 1 } : null; } };
var Ev = A.lauf(vorn, KAND, { tafel: T0 }), Uv = LF.urteile(Ev, null, Rg0);
ok(Ev.verstoesse > 1000 && Uv.urteil === 'Messgeraet-Fehler', 'Kunst-Kandidat mit Blick nach vorn: Verstoesse gezaehlt, Urteil Messgeraet-Fehler', Ev.verstoesse + ' / ' + Uv.urteil);
/* Positivkontrolle: Effekt nur am Tag nach dem Signal (Einstiegstag ePos = i+1: Eroeffnung -> Schluss +2 %) */
var Tp = TF.kunstTafel(kunstReihen(function (r, i) { return (A.fnv('K' + r + '|' + (i - 1)) % 25) === 0 ? 0.02 : 0; }), TAGE);
var Ep = A.lauf(zufallSignal, KAND, { tafel: Tp }), Up = LF.urteile(Ep, null, Rg0);
ok(Ep.konfigurationen[0].kandidat && Ep.konfigurationen[0].entdeckung.uNetto.t > 5, 'eingepflanzter Effekt (+2 % am Einstiegstag): H5 wird Kandidat', 'netto ' + Ep.konfigurationen[0].entdeckung.uNetto.mittel.toFixed(3) + ' t ' + Ep.konfigurationen[0].entdeckung.uNetto.t.toFixed(1));
ok(Up.urteil !== 'Messgeraet-Fehler' && Up.kandidaten >= 1, 'Positivkontrolle: Kandidat, kein Messgeraet-Fehler', Up.urteil + ' ' + Up.grund);
ok(Ep.konfigurationen[0].placebo.verstoss === false && Math.abs(Ep.konfigurationen[0].placebo.uBrutto.mittel) < 0.5, 'Placebo (anderer Wert, gleicher Tag) sieht den Effekt nicht', Ep.konfigurationen[0].placebo.uBrutto.mittel.toFixed(3));
ok(Ep.konfigurationen[0].spaet.uNetto.mittel < Ep.konfigurationen[0].entdeckung.uNetto.mittel / 3, 'Einstieg einen Tag spaeter verfehlt den Effekt', Ep.konfigurationen[0].spaet.uNetto.mittel.toFixed(3));
/* Zeitfester Effekt in zehn Reihen (jeder 20. Kalendertag +3 %), Signal in genau diesen Reihen am Vortag -> das um 20 Tage verschobene
 * Signal trifft denselben Kalender und wirkt ebenso: Messgeraet-Fehler (ein Markteffekt aller Reihen wuerde dagegen im Topf verschwinden) */
var zeitfest = { signal: function (sicht, i) { return parseInt(sicht.reihe.slice(1), 10) < 10 && (i % 20) === 19 ? { dir: 1 } : null; } };
var Tz = TF.kunstTafel(kunstReihen(function (r, i) { return r < 10 && (i % 20) === 0 ? 0.03 : 0; }), TAGE);
var Ez = A.lauf(zeitfest, KAND, { tafel: Tz }), Uz = LF.urteile(Ez, null, Rg0);
ok(Ez.konfigurationen[0].entdeckung.uNetto.mittel > 1 && Ez.konfigurationen[0].entdeckung.uNetto.t >= 2 && Ez.konfigurationen[0].versatz.wirkt === true && Uz.urteil === 'Messgeraet-Fehler', 'zeitfester Effekt: verschobenes Signal wirkt -> Messgeraet-Fehler', Uz.urteil + ' / netto ' + Ez.konfigurationen[0].entdeckung.uNetto.mittel.toFixed(2) + ' verschoben ' + Ez.konfigurationen[0].versatz.uNetto.mittel.toFixed(2));
/* Die Zelle: Topf derselben Klasse am selben Tag - ein Effekt, der ALLE Reihen trifft, verschwindet gegen den Topf */
var Ta = TF.kunstTafel(kunstReihen(function (r, i) { return (A.fnv('T|' + (i - 1)) % 10) === 0 ? 0.02 : 0; }), TAGE);
var Ea = A.lauf(zufallSignal, KAND, { tafel: Ta });
ok(Math.abs(Ea.konfigurationen[0].entdeckung.uBrutto.mittel) < 0.3 && Ea.konfigurationen[0].entdeckung.roh.mittel > 0.3, 'Markttag-Effekt steckt im Topf: roh positiv, Ueberschuss gegen den Topf ~ null', 'u ' + Ea.konfigurationen[0].entdeckung.uBrutto.mittel.toFixed(3) + ' roh ' + Ea.konfigurationen[0].entdeckung.roh.mittel.toFixed(3));

console.log('3b) Bewertung zeit (Nr. 118): marktweite Regel ohne Tagestopf');
/* Marktweite Kunstregel: ALLE 40 Reihen signalisieren am selben Tag (Einstieg an jedem 16. Kalendertag), der Effekt (+2 % Eroeffnung -> Schluss) sitzt in
 * allen Reihen genau an diesen Einstiegstagen. Konfigurationen H5 und H3 (bei Periode 16 haette H10 keinen ueberschneidungsfreien Starttag im zeitlichen
 * Topf). Verschiebung um 20 = 16 + 4 Tage: das verschobene H5-Fenster teilt seinen ersten Tag mit dem letzten des naechsten Signalfensters
 * (Ueberlappung 100 % ausgewiesen), enthaelt den Effekt aber nicht; H3 ueberlappt nicht. Welten NACH den bisherigen gebaut (gleicher Zufallsstrom). */
var KANDZ = { kennung: 'kunst-zeit', form: 'tag', bewertung: 'zeit', konfigurationen: [{ key: 'H5', richtung: 'long', haltedauer: 5 }, { key: 'H3', richtung: 'long', haltedauer: 3 }], params: {} };
var KANDT = JSON.parse(JSON.stringify(KANDZ)); KANDT.bewertung = 'topf';
var marktweit = { signal: function (sicht, i) { return (i + 1) % 16 === 0 ? { dir: 1 } : null; } };
var Tm = TF.kunstTafel(kunstReihen(function (r, i) { return (i % 16) === 0 ? 0.02 : 0; }), TAGE);
var Emt = A.lauf(marktweit, KANDT, { tafel: Tm }), Emz = A.lauf(marktweit, KANDZ, { tafel: Tm }), Em0 = A.lauf(marktweit, KANDZ, { tafel: T0 });
var h5t = Emt.konfigurationen[0].entdeckung, h5z = Emz.konfigurationen[0].entdeckung, h3z = Emz.konfigurationen[1].entdeckung, h50 = Em0.konfigurationen[0].entdeckung;
ok(Emt.bewertung === 'topf' && h5t.nTage === 32 && h5t.nTr === 1280 && Math.abs(h5t.uBrutto.mittel) < 1e-9 && h5t.roh.mittel > 1.5 && Emt.konfigurationen[0].urteil === 'nein' && !Emt.konfigurationen[0].placebo.entfaellt,
  'topf: marktweite Regel mit eingesaetem Effekt - roh > +1,5 Pp, Ueberschuss gegen den Tagestopf genau 0 (|u| < 1e-9), Urteil "nein" ohne Aussage', 'u ' + h5t.uBrutto.mittel.toExponential(2) + ' roh ' + h5t.roh.mittel.toFixed(3));
ok(Emt.signalAnteil.tage === 32 && Emt.signalAnteil.mittel === 1 && Emt.signalAnteil.max === 1 && Emt.signalAnteil.tageUeber50 === 32 && Emt.warnungen.length === 1 && /Bewertung zeit erwaegen/.test(Emt.warnungen[0]),
  'topf: Anteil der zulaessigen Reihen mit Signal am Signaltag 100 % an allen 32 Signaltagen -> Warnung "Bewertung zeit erwaegen" im Protokoll', Emt.warnungen[0] && Emt.warnungen[0].slice(0, 72));
ok(Emz.bewertung === 'zeit' && /zeitlicher Topf/.test(Emz.bewertungDetail) && h5z.nTage === 32 && h5z.nTr === 1280 && h5z.tradesJeTag === 40 && h5z.uBrutto.mittel > 1.5 && h5z.uBrutto.mittel < 2.4 && h5z.uNetto.t > 10 && h3z.uBrutto.mittel > 1.5 && h3z.uBrutto.mittel < 2.4 && Emz.konfigurationen[0].kandidat && Emz.konfigurationen[1].kandidat,
  'zeit: dieselbe Regel findet den eingesaeten Effekt (+2 Pp je Fenster; > 1,5 heisst: die Signalfenster sind aus dem zeitlichen Topf ausgeschlossen, sonst ~1,25), 40 Trades je Signaltag, H5 und H3 Kandidaten', 'H5 u ' + h5z.uBrutto.mittel.toFixed(3) + ' t ' + h5z.uNetto.t.toFixed(1) + ' / H3 u ' + h3z.uBrutto.mittel.toFixed(3) + ' t ' + h3z.uNetto.t.toFixed(1));
ok(Math.abs(h50.uBrutto.mittel) < 0.3 && Math.abs(h50.uNetto.t) < 2.5 && !Em0.konfigurationen[0].kandidat && !Em0.konfigurationen[1].kandidat && LF.urteile(Em0, null, Rg0).urteil !== 'Messgeraet-Fehler',
  'zeit, gepaarter Placebo: dieselbe Regel auf der Kunstwelt OHNE Effekt ~ 0, kein Kandidat, kein Messgeraet-Fehler', 'u ' + h50.uBrutto.mittel.toFixed(3) + ' t ' + h50.uNetto.t.toFixed(2));
var k5z = Emz.konfigurationen[0], k3z = Emz.konfigurationen[1];
ok(k5z.placebo.entfaellt === true && k5z.placebo.verstoss === false && k5z.placebo.uBrutto === null && /entfaellt im Modus zeit/.test(k5z.placebo.grund) && Emz.zaehler.placeboEntfaellt === 3840 && Emz.zaehler.placeboOhnePartner === 0 && Emt.zaehler.placeboEntfaellt === undefined,
  'zeit: Placebo "anderer Wert gleicher Klasse" entfaellt und wird so ausgewiesen (Feld entfaellt, Zaehler placeboEntfaellt); im Modus topf wie bisher', Emz.zaehler.placeboEntfaellt + ' entfallen');
ok(k5z.versatz.wirkt === false && Math.abs(k5z.versatz.uNetto.mittel) < 0.4 && k3z.versatz.wirkt === false && Math.abs(k3z.versatz.uNetto.mittel) < 0.4 && k5z.spaet.uNetto.mittel < h5z.uNetto.mittel / 3 && k5z.versatz.ueberlappung.anteil === 1 && k3z.versatz.ueberlappung.anteil === 0 && LF.urteile(Emz, null, Rg0).urteil !== 'Messgeraet-Fehler',
  'zeit: verschobenes Signal ~ 0 (wirkt nicht), Einstieg +1 T verfehlt den Effekt, Ueberlappung der verschobenen Fenster ausgewiesen (H5 100 %: 20 = 16 + 4 teilt einen Tag; H3 0 %), kein Messgeraet-Fehler', 'versatz ' + k5z.versatz.uNetto.mittel.toFixed(3) + ' spaet ' + k5z.spaet.uNetto.mittel.toFixed(3));
ok(Emz.warnungen.length === 0 && Emz.signalAnteil.mittel === 1 && Emz.ms.topf <= Emt.ms.topf, 'zeit bei 100 % Signalanteil: keine Warnung; der Tagestopf wird nicht gerechnet');
var Ezz = A.lauf(zufallSignal, KANDZ, { tafel: T0 });
ok(Ezz.bewertung === 'zeit' && Ezz.warnungen.length === 1 && /Bewertung topf/.test(Ezz.warnungen[0]) && Ezz.signalAnteil.mittel < 0.1 && Ezz.konfigurationen[0].entdeckung.nTr === 782,
  'zeit bei einer Querschnittsregel (Zufallssignal, ~5 % der Reihen je Tag): Warnung "gehoert in die Bewertung topf"', (100 * Ezz.signalAnteil.mittel).toFixed(1) + ' %');
/* zeitTopf direkt: Reihe mit +10 % je Tag (jedes 1-Tage-Fenster 10 %, jedes 2-Tage-Fenster 21 %), Signalfenster und Zeitraum ausgeschlossen */
var oG = []; for (var g = 0; g < 10; g++) oG.push(100 * Math.pow(1.1, g));
var TG = TF.kunstTafel([{ reihe: 'G', tag: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], o: oG, h: oG, l: oG, c: oG, v: oG.map(function () { return 1; }) }], TAGE.slice(0, 10), { offen: true }), SG1 = TG.reihen[0];
var z1 = A.zeitTopf(SG1, Int32Array.from([]), 1, 0, 9), z2 = A.zeitTopf(SG1, Int32Array.from([4]), 1, 0, 9), z3 = A.zeitTopf(SG1, Int32Array.from([4]), 2, 0, 9), z4 = A.zeitTopf(SG1, Int32Array.from([]), 1, 2, 5), z5 = A.zeitTopf(SG1, Int32Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 1, 0, 9);
ok(z1.n === 9 && nahe(z1.mittel, 10, 1e-9) && z2.n === 8 && nahe(z2.mittel, 10, 1e-9) && z3.n === 5 && nahe(z3.mittel, 21, 1e-9) && z4.n === 4 && z5.n === 0 && isNaN(z5.mittel),
  'zeitTopf: 9 Ein-Tages-Fenster (10 %), ohne den Signaltag 8, Dauer 2 ohne Starttage 3..5 (21 %, n 5), Zeitraum 2..5 (n 4), alles Signal -> NaN', z1.n + '/' + z2.n + '/' + z3.n + '/' + z4.n + '/' + z5.n);
ok(A.ueberlappt(Int32Array.from([4, 20]), 6, 3) === true && A.ueberlappt(Int32Array.from([4, 20]), 7, 3) === false && A.ueberlappt(Int32Array.from([4, 20]), 18, 3) === true && A.ueberlappt(Int32Array.from([4, 20]), 1, 3) === false && A.ueberlappt(Int32Array.from([]), 5, 3) === false,
  'ueberlappt: |t - e| < d (6 und 18 ja, 7 und 1 nein, leere Menge nein)');
var eB = null; try { A.lauf(zufallSignal, Object.assign({}, KAND, { bewertung: 'null' }), { tafel: T0 }); } catch (e) { eB = e; }
ok(eB && /bewertung muss topf \| zeit/.test(eB.message), 'Adapter: bewertung ausser topf | zeit wirft (auch ohne den Laeufer)', eB && eB.message);
/* Sperrklinke topf: die Kunst-Eichung (Zufallssignal auf T0) liefert dieselben Zahlen wie der Adapter vor Nr. 118 (12.10.2026, 1e-12) */
var eh5 = E0.konfigurationen[0].entdeckung, eh10 = E0.konfigurationen[1].entdeckung;
ok(E0.bewertung === 'topf' && eh5.nTage === 428 && eh5.nTr === 782 && nahe(eh5.uBrutto.mittel, 0.029470027222302034, 1e-12) && nahe(eh5.uNetto.t, -0.16636927504682703, 1e-12) && nahe(eh10.uBrutto.mittel, -0.12499646857363268, 1e-12) && nahe(eh10.uNetto.t, -1.6507233659844247, 1e-12) && nahe(E0.konfigurationen[0].placebo.uBrutto.mittel, 0.045138616437735465, 1e-12),
  'topf bitgleich: Kunst-Eichung (Zufallssignal, 428 Tage, 782 Trades) H5/H10 u brutto, t und Placebo wie vor Nr. 118 (alter Adapter, 1e-12)', eh5.uBrutto.mittel + ' / ' + eh10.uNetto.t);
/* Laeufer: Register nennt den Modus, ERGEBNIS.md und Belegstand-Zeile ebenso, Placebo "entfaellt (zeit)", Signaltage/Trades/je Signaltag, Satz zur Aufloesung, Warnung */
var RgZ = LF.registerEintragen({ kennung: 'x', konfigurationen: [], gesamt: 0 }, 'z', 'tag', [{ key: 'H5', urteil: 'nein' }], '2026-10-12T00:00:00Z', 'zeit');
RgZ = LF.registerEintragen(RgZ, 'k', 'korb', [{ key: 'k', urteil: 'nein' }], '2026-10-12T00:00:00Z', undefined);
ok(RgZ.konfigurationen[0].bewertung === 'zeit' && RgZ.konfigurationen[1].bewertung === undefined && RgZ.gesamt === 2, 'Register: Zeile der Tag-Form traegt bewertung, andere Formen kein Feld');
var kandZ = Object.assign({ titel: 'Kunst zeit', erwartung: { groesse: 'x', richtung: 'positiv' } }, KANDZ), siegelK = { commit: '0123456789abcdef0123456789abcdef01234567' };
Emz.stand = '2026-10-12T00:00:00Z'; Emt.stand = Emz.stand;
var mdZ = LF.ergebnisMarkdown(kandZ, Emz, LF.urteile(Emz, null, Rg0), Rg0, siegelK, null, false), bsZ = LF.belegstandAbsatz(kandZ, Emz, LF.urteile(Emz, null, Rg0), Rg0, siegelK, null);
ok(/Form tag, Bewertung zeit, 2 Konfigurationen/.test(mdZ) && /\| entfaellt \(zeit\) \|/.test(mdZ) && /\*\*Bewertung zeit\.\*\* Ueberschuss = Rendite/.test(mdZ) && /H5 32 Signaltage \/ 1\.280 Trades \(40,0 je Signaltag\), verschobene Fenster mit Ueberschneidung eines Signalfensters 100 %/.test(mdZ) && /haengt an der Zahl der Signaltage, nicht an der Zahl der Trades - bei einer marktweiten Regel ist jeder Signaltag ein Cluster/.test(mdZ) && /im Mittel 100 %, hoechstens 100 % \(32 von 32 Signaltagen ueber 50 %\)/.test(mdZ) && !/WARNUNG/.test(mdZ) && /Form tag, Bewertung zeit/.test(bsZ),
  'ERGEBNIS.md (zeit): Modus in Kurzfassung und Belegstand-Zeile, Placebo "entfaellt (zeit)", Signaltage / Trades / je Signaltag, Ueberlappung, Satz zur Aufloesung, Signalanteil, keine Warnung');
var mdT = LF.ergebnisMarkdown(Object.assign({}, kandZ, { bewertung: 'topf' }), Emt, LF.urteile(Emt, null, Rg0), Rg0, siegelK, null, false);
ok(/Form tag, Bewertung topf/.test(mdT) && /\*\*WARNUNG:\*\* Bewertung topf, aber die Regel trifft im Mittel 100 %/.test(mdT) && !/entfaellt \(zeit\)/.test(mdT), 'ERGEBNIS.md (topf) traegt die Warnung des Adapters und das Placebo wie bisher');
/* Holm */
var H = LF.holm([0.001, 0.03, 0.2], 3, 0.05);
ok(H.bestanden[0] && !H.bestanden[1] && !H.bestanden[2] && nahe(H.schwelle[0], 0.05 / 3, 1e-12) && nahe(H.schwelle[1], 0.025, 1e-12), 'Holm: 0,001 besteht alpha/3, 0,03 verfehlt alpha/2, danach Abbruch');
var H2 = LF.holm([0.001, 0.02], 2, 0.05);
ok(H2.bestanden[0] && H2.bestanden[1], 'Holm: 0,001 und 0,02 bestehen bei m = 2 (0,025 / 0,05)');

console.log('4) Register (§6)');
var Rg = LF.registerEintragen({ kennung: 'x', konfigurationen: [], gesamt: 0 }, 'a', 'tag', [{ key: 'H5', urteil: 'nein' }, { key: 'H10', urteil: 'nicht entscheidbar' }], '2026-10-11T00:00:00Z');
Rg = LF.registerEintragen(Rg, 'b', 'korb', [{ key: 'k', urteil: 'nicht entscheidbar' }], '2026-10-11T00:00:00Z');
ok(Rg.gesamt === 3 && nahe(Rg.zufallErwartet, 3 * K.ZUFALL_JE_KONFIGURATION, 1e-12), 'Register zaehlt jede Konfiguration (3) und nennt die Zufallserwartung', Rg.zufallErwartet.toFixed(4));
Rg = LF.registerEintragen(Rg, 'a', 'tag', [{ key: 'H5', urteil: 'nein' }], '2026-10-11T00:00:00Z');
ok(Rg.gesamt === 2, 'derselbe Kandidat noch einmal ersetzt seine Zeilen statt sie zu verdoppeln', Rg.gesamt);
ok(nahe(K.ZUFALL_JE_KONFIGURATION, 1 - A.phi(2), 2e-4), 'Zufallserwartung = P(t >= 2) einseitig', (1 - A.phi(2)).toFixed(5));

console.log('5) Additive Optionen der Instrumente: ohne Umgebungsvariable wie bisher');
function kind(code, env) { return cp.spawnSync(process.execPath, ['-e', code], { cwd: K.REPO, encoding: 'utf8', env: Object.assign({}, process.env, env || {}) }).stdout.trim(); }
var ohne = {}; ['PRUEFSTRASSE_MASSNAHMEN', 'PRUEFSTRASSE_WERTPAPIERARTEN', 'RUECKBLICK_PANEL'].forEach(function (k) { ohne[k] = ''; });
var rb = kind("var R=require('./studien/massstab-rueckblick-2026-10-04/rueckblick.js');console.log(R.MASSNAHMEN_ORDNER)", ohne);
ok(rb === 'E:/Markt-Dashboard-Archiv/alpaca-massnahmen', 'rueckblick.js: Vorgabe unveraendert E:/Markt-Dashboard-Archiv/alpaca-massnahmen', rb);
var kb = kind("var S=require('./studien/momentum-korb-2026-10-04/korb.js');console.log(S.MASSNAHMEN_ORDNER)", ohne);
ok(kb === 'E:/Markt-Dashboard-Archiv/alpaca-massnahmen', 'korb.js: Vorgabe unveraendert', kb);
var kb2 = kind("var S=require('./studien/momentum-korb-2026-10-04/korb.js');console.log(S.MASSNAHMEN_ORDNER)", { PRUEFSTRASSE_MASSNAHMEN: '/srv/spiegel/alpaca-massnahmen' });
ok(kb2 === '/srv/spiegel/alpaca-massnahmen', 'korb.js: PRUEFSTRASSE_MASSNAHMEN wird uebernommen', kb2);
var quelle = fs.readFileSync(path.join(K.REPO, 'studien', 'momentum-korb-2026-10-04', 'korb.js'), 'utf8');
ok(quelle.split('(Q.zielfunktion || MH.momentumZiel)').length === 3 && quelle.indexOf('MH.momentumZiel(roh') === -1, 'korb.js: beide Zielaufrufe nehmen Q.zielfunktion, sonst momentumZiel (alte Laeufe ohne das Feld unveraendert)');
var M = require(path.join(K.REPO, 'studien', 'messmaschine', 'messmaschine.js'));
var arch = path.join(SCRATCH, 'archiv'); fs.mkdirSync(arch);
var bars = []; for (var b = 0; b < 400; b++) bars.push([Date.UTC(2024, 0, 2, 14, 30) + b * 3600000 * 7, 100 + Math.sin(b / 7), 1000, 101, 99, 100]);
fs.writeFileSync(path.join(arch, 'bars_60m_KUNST.json'), JSON.stringify({ series: bars }));
var U1 = M._intern.baueKontrolle ? null : null;
var lade = require(path.join(K.REPO, 'studien', 'messmaschine', 'messmaschine.js'))._intern;
ok(U1 === null && typeof lade.baueKontrolle === 'function', 'Messmaschine laedt (intern erreichbar)');
var quelleM = fs.readFileSync(path.join(K.REPO, 'studien', 'messmaschine', 'messmaschine.js'), 'utf8');
ok(/function ladeUniversum\(archivPfad, intervall, filter, fenster\)/.test(quelleM) && /optionen\.vonMs != null \|\| optionen\.bisMs != null\) \? \{ vonMs: optionen\.vonMs, bisMs: optionen\.bisMs \} : null/.test(quelleM), 'messmaschine.js: Fenster nur mit optionen.vonMs/bisMs, sonst null (alter Aufruf)');
var wp = fs.readFileSync(path.join(K.REPO, 'studien', 'messmaschine', 'strategien', 'wertpapierart.js'), 'utf8');
ok(/process\.env\.PRUEFSTRASSE_WERTPAPIERARTEN \|\| path\.join\(os\.homedir\(\), 'Downloads', 'Markt-Dashboard-Daten', 'massive', 'wertpapierarten\.json'\)/.test(wp), 'wertpapierart.js: Vorgabepfad unveraendert, Variable davor');

console.log('6) Kalibrierung der Adapter gegen bekannte Ergebnisse (Auftrag §3)');
var KAL = path.join(K.HIER, 'kalibrierung.json'), SOLL = {
  tag: { quelle: 'Trendkanal-Studie ERGEBNIS.md Zeile K3-20 E1 long H5 (Bestaetigung ab 07.02.2023)', entNTage: 1735, entNTr: 100692, entUBrutto: -0.2556, entUNetto: -0.3830, entT: -3.13, besNTage: 886, besNTr: 49624, besUBrutto: -0.2221, besUNetto: -0.3396, besT: -3.14 },
  korb: { quelle: 'Nr. 96 (studien/momentum-korb-v23-2026-10-04/ERGEBNIS.md), Regel K, Panel v2.3', 'A-187': 259238.74, 'B-187': 250123.14, spyA: 215535.73, spyB: 181193.87 },
  minute: { quelle: 'Markt-Dashboard-Daten/protokolle/rsi2seit-2026-08-26.json', bruttoJeSignalPp: 0.02054524106238242, huerdePp: 0.1, nettoJeSignalPp: -0.07945475893761758, werte: 2874, handelstage: 730, schnittTag: '2025-03-12' },
};
function adapterLauf(name, args, zeit) {
  var r = cp.spawnSync(process.execPath, ['--max-old-space-size=6144', path.join(K.HIER, 'adapter', name + '.js')].concat(args), { cwd: K.REPO, encoding: 'utf8', timeout: zeit, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(name + ' Kalibrierungslauf gescheitert: ' + String(r.stderr).slice(0, 600));
  return r.stdout;
}
var Kal = fs.existsSync(KAL) ? JSON.parse(fs.readFileSync(KAL, 'utf8')) : { stand: null, tag: null, korb: null, minute: null };
if (!SCHNELL) {
  var tagAus = path.join(SCRATCH, 'tag.json'); adapterLauf('tag', ['--kalibrierung', tagAus], 900000);
  var Et = JSON.parse(fs.readFileSync(tagAus, 'utf8')), h5 = Et.konfigurationen.filter(function (k) { return k.key === 'H5'; })[0];
  ok(Et.hatRoh === false && Et.hatMarkt === true, 'trendkanal-tage: Tafel meldet hatRoh false (Tagesdateien aus bereinigten Minuten, Faktor ungeprueft) und hatMarkt true (SPY)', Et.hatRoh + ' / ' + Et.hatMarkt);
  Kal.tag = { entNTage: h5.entdeckung.nTage, entNTr: h5.entdeckung.nTr, entUBrutto: h5.entdeckung.uBrutto.mittel, entUNetto: h5.entdeckung.uNetto.mittel, entT: h5.entdeckung.uNetto.t,
    besNTage: h5.pruefung.nTage, besNTr: h5.pruefung.nTr, besUBrutto: h5.pruefung.uBrutto.mittel, besUNetto: h5.pruefung.uNetto.mittel, besT: h5.pruefung.uNetto.t, reihen: Et.reihen, verstoesse: Et.verstoesse, ms: Et.ms };
  var Ek = JSON.parse(adapterLauf('korb', ['--kalibrierung'], 900000).trim().split(' ms ')[0]);
  Kal.korb = { 'A-187': Ek['A-187'].buchEnde, 'B-187': Ek['B-187'].buchEnde, spyA: Ek['A-187'].spyEnde, spyB: Ek['B-187'].spyEnde };
  var minAus = path.join(SCRATCH, 'minute.json'); adapterLauf('minute', ['--kalibrierung', minAus], 1800000);
  var Em = JSON.parse(fs.readFileSync(minAus, 'utf8'));
  Kal.minute = { bruttoJeSignalPp: Em.zahlen.bruttoJeSignalPp, huerdePp: Em.zahlen.huerdePp, nettoJeSignalPp: Em.zahlen.nettoJeSignalPp, werte: Em.zahlen.universum.werte, handelstage: Em.zahlen.universum.handelstage, schnittTag: Em.schnittTag, signale: Em.zahlen.signale, t: Em.zahlen.t };
  Kal.stand = new Date().toISOString(); Kal.soll = SOLL;
  fs.writeFileSync(KAL, JSON.stringify(Kal, null, 1) + '\n');
}
ok(Kal.tag && Kal.korb && Kal.minute, 'kalibrierung.json liegt vor (ohne --schnell neu gerechnet)', Kal.stand);
if (Kal.tag) {
  var t = Kal.tag, s = SOLL.tag;
  ok(t.entNTage === s.entNTage && t.entNTr === s.entNTr && t.besNTage === s.besNTage && t.besNTr === s.besNTr, 'tag: Trades und Signaltage der Trendkanal-Zeile exakt (' + s.entNTr + ' / ' + s.besNTr + ')', t.entNTr + ' / ' + t.besNTr);
  ok(nahe(t.entUBrutto, s.entUBrutto, 5e-5) && nahe(t.entUNetto, s.entUNetto, 5e-5) && nahe(t.besUBrutto, s.besUBrutto, 5e-5) && nahe(t.besUNetto, s.besUNetto, 5e-5), 'tag: Ueberschuss brutto/netto in der Rundung der Studie (4 Stellen)', t.entUNetto.toFixed(4) + ' / ' + t.besUNetto.toFixed(4));
  ok(nahe(t.entT, s.entT, 5e-3) && nahe(t.besT, s.besT, 5e-3), 'tag: t Hansen-Hodrick in der Rundung der Studie (2 Stellen)', t.entT.toFixed(2) + ' / ' + t.besT.toFixed(2));
  ok(t.verstoesse === 0, 'tag: kein Blick nach vorn im Kalibrierungslauf');
}
if (Kal.korb) {
  var c = Kal.korb, sk = SOLL.korb;
  ok(Math.round(c['A-187'] * 100) === Math.round(sk['A-187'] * 100) && Math.round(c['B-187'] * 100) === Math.round(sk['B-187'] * 100), 'korb: A-187 und B-187 mit Regel K auf den Cent (259.238,74 / 250.123,14 $)', c['A-187'].toFixed(2) + ' / ' + c['B-187'].toFixed(2));
  ok(Math.round(c.spyA * 100) === Math.round(sk.spyA * 100) && Math.round(c.spyB * 100) === Math.round(sk.spyB * 100), 'korb: S&P 500 auf den Cent');
}
if (Kal.minute) {
  var m = Kal.minute, sm = SOLL.minute;
  /* Das 60m-Archiv LEBT (die App sammelt; am 03.09. wurden alle Dateien neu geschrieben): die 2.874 Werte des Protokolls sind heute
   * 2.892 - die Auswahl vom 26.08. laesst sich nicht wiederherstellen, deshalb nur eine Spanne fuer die Werte und 0,005 Pp fuer die
   * Ertraege; Handelstage, Schnitt und Huerde muessen exakt treffen. Die Abweichung steht in der Uebergabe. */
  ok(m.werte >= sm.werte && m.werte <= sm.werte + 40 && m.handelstage === sm.handelstage && m.schnittTag === sm.schnittTag, 'minute: Handelstage und Schnitt des Protokolls exakt (730 / 2025-03-12), Werte 2874..2914 (Archiv lebt)', m.werte + ' / ' + m.handelstage + ' / ' + m.schnittTag);
  ok(nahe(m.huerdePp, sm.huerdePp, 1e-9), 'minute: Huerde 0,10 Pp je Umlauf', m.huerdePp);
  ok(nahe(m.bruttoJeSignalPp, sm.bruttoJeSignalPp, 5e-3) && nahe(m.nettoJeSignalPp, sm.nettoJeSignalPp, 5e-3) && m.nettoJeSignalPp < 0 && m.bruttoJeSignalPp > 0, 'minute: brutto und netto je Signal wie im Protokoll (+0,0205 / −0,0795 Pp, Toleranz 0,005; Vorzeichen gleich)', m.bruttoJeSignalPp.toFixed(4) + ' / ' + m.nettoJeSignalPp.toFixed(4));
}

fs.rmSync(SCRATCH, { recursive: true, force: true });
console.log('\n' + n + ' Pruefungen, ' + (fails ? fails + ' ROT' : 'ALLE TESTS GRUEN'));
process.exit(fails ? 1 : 0);

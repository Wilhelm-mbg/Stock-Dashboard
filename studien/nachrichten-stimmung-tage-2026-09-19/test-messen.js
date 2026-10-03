'use strict';
/* Prüfungen der Messmaschine messen.js (Auftrag Nr. 66 §1.2) mit KUNST-Tönen — vor jedem Blick auf echte Töne.
 * Das Panel ist das echte (v2.1, nur lesen); die Töne sind nie echt: diese Datei liest KEINE Tagesdatei von E:.
 * (a) Kunst-Ton = Vorzeichen der künftigen H-Tage-Rendite -> Orakel-Schranken §7
 * (b) Kunst-Ton aus Zufall -> alle 12 Zellen ≈ 0
 * (c) eingepflanzter Effekt bekannter Größe (+0,20 Pp am Folgetag im obersten Dezil) -> wird gefunden; netto = brutto − Kosten von Hand
 * (d) Leck: Tageszeile mit Stempel t + 1 -> tagesSignal wirft; Sicht ohne Schlüssel zählt den Zugriff
 * (e) undefinierte Tage (Block-Ausfall, < 48 Dateien) fallen heraus und werden gezählt
 * (f) Entdeckung/Bestätigung nach ungeraden/geraden Jahren; Tor 1 sperrt das Mittel der Bestätigung
 * (g) Vorprüfungstor: Paar-sd des Zufallsdezils innerhalb Faktor 1,5 von vorpruefung.json
 * Aufruf (aus der Repo-Wurzel): node --max-old-space-size=6144 studien/nachrichten-stimmung-tage-2026-09-19/test-messen.js
 * Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs'), path = require('path');
var Q = path.join(__dirname, '..', 'querschnitt-pruefstand-2026-09-13');
var PR = require(path.join(Q, 'pruefstand.js')), K = require(path.join(Q, 'konfig.js')), ST = require(path.join(Q, 'statistik.js'));
var KONST = require(path.join(__dirname, 'konstanten.js')), M = require(path.join(__dirname, 'messen.js'));

var n = 0, rot = 0, t0 = Date.now();
function sag(s) { process.stdout.write(s + '\n'); }
function ok(bed, was) { n++; if (!bed) { rot++; sag('ROT  ' + was); } }
function nah(a, b, eps) { return Math.abs(a - b) <= (eps || 1e-9); }
function f(x, k) { return x == null ? '-' : x.toFixed(k == null ? 3 : k); }
function sek() { return ((Date.now() - t0) / 1000).toFixed(0) + ' s'; }

var T = PR.Tafel(path.join(Q, 'voll'));
var medien = {}; JSON.parse(fs.readFileSync(path.join(__dirname, 'datenbau', 'namenskarte-v2.json'), 'utf8')).medienAusgeschlossen.liste.forEach(function (s) { medien[s] = true; });
var totalverlust = {}; K.EMPFINDLICHKEIT[0].totalverlust.forEach(function (g) { totalverlust[g] = true; });
var handelstage = [], ordinal = {}, isoZuIdx = {};
for (var tt = 0; tt <= T.maxTag; tt++) if (T.tagVon[tt] >= 0) { ordinal[tt] = handelstage.length; handelstage.push(tt); isoZuIdx[T.kal.tage[tt]] = tt; }
var VON = KONST.FENSTER_VON, BIS = KONST.FENSTER_BIS;
var signaltage = handelstage.filter(function (t) { var iso = T.kal.tage[t]; return iso >= VON && iso <= BIS; });
function kalendertage(von, bis) { var aus = [], d = Date.parse(von + 'T00:00:00Z'), e = Date.parse(bis + 'T00:00:00Z'); for (; d <= e; d += 86400000) aus.push(new Date(d).toISOString().slice(0, 10)); return aus; }
var uniCache = {};
function mitglieder(t) { return uniCache[t] || (uniCache[t] = M.universumStudie(T, t, medien).liste); }

/** Kunst-Tagesdateien im Format aus gkg-tage.js: je Handelstag alle Universumsmitglieder mit 3 Artikeln bis 16:00 ET. */
function kunst(von, bis, tonVon, aendern) {
  var D = {};
  kalendertage(von, bis).forEach(function (iso) {
    var t = isoZuIdx[iso], symbole = {};
    if (t !== undefined) { var L = mitglieder(t), tone = tonVon(t, iso, L); L.forEach(function (e, i) { symbole[T.symName[e.sym]] = { ton: tone[i], n: 3, nSpaet: 1, tonAlle: tone[i], letzterStempel: iso.replace(/-/g, '') + '150000' }; }); }
    D[iso] = { kennung: 'kunst', karte: 'kunst', tag: iso, soll: 96, dateien: 96, fehlend: [], symbole: symbole };
  });
  if (aendern) aendern(D);
  return function (iso) { return D[iso] || null; };
}
/** Vorzeichen der künftigen H-Tage-Rendite, unabhängig von der Maschine aus den bereinigten Schlusskursen gerechnet. */
function tonOrakel(H) {
  return function (t, iso, L) {
    var dH = handelstage[ordinal[t] + H];
    return L.map(function (e) { if (dH == null) return 0; var z1 = T.zeileVon(e.sym, dH); if (z1 < 0) return 0; var q = T.g.bSchluss[z1] / T.g.bSchluss[e.zeile] - 1; return q > 0 ? 1 : q < 0 ? -1 : 0; });
  };
}
function tonZufall(saat) { return function (t, iso, L) { var rnd = ST.mulberry32(ST.fnv(saat + '|' + iso)); return L.map(function () { return 4 * rnd() - 2; }); }; }

/* ---------- reine Funktionen ---------- */
var bedJa = { b1: true, b2: true, b3: true, b4: true, b5: true }, toreJa = { a: true, b: true };
ok(M.urteilVon(bedJa, toreJa, 0.05) === 'belegt', 'U1 alle Bedingungen und Tore -> belegt');
ok(M.urteilVon(Object.assign({}, bedJa, { b3: false }), toreJa, 0.05) === 'nicht belegt: nichts oberhalb von 0,050 Pp je Periode', 'U2 eine Bedingung fehlt -> Satz mit MDE80');
ok(/^nicht belegt/.test(M.urteilVon(bedJa, { a: true, b: false }, 0.0271)) && /0,027 Pp/.test(M.urteilVon(bedJa, { a: true, b: false }, 0.0271)), 'U3 ein Tor gefallen -> nicht belegt');
ok(M.innerhalbFaktor(1.4, 1, 1.5) && M.innerhalbFaktor(0.7, 1, 1.5) && !M.innerhalbFaktor(1.6, 1, 1.5) && !M.innerhalbFaktor(0.6, 1, 1.5), 'G0 Faktor-1,5-Regel kann annehmen und ablehnen');
ok(M.TESTS.length === KONST.TESTZAHL, 'U4 genau 12 Tests');
var wirft = false; try { M.pruefeWoerter('eine Ka' + 'nte', 'x'); } catch (e) { wirft = true; } ok(wirft, 'W0 Wortsperre kann ablehnen');

/* ---------- (a) Kunst-Ton = Vorzeichen der künftigen H-Tage-Rendite ---------- */
var PA = M.messe({ T: T, tagesdatei: kunst(VON, BIS, tonOrakel(1)), reihen: true });
sag('(a) Lauf H = 1 fertig, ' + sek());
var a1 = PA.tests['G1|1|ls'];
sag('(a) H 1: Kunst-Ton L-S brutto ' + f(a1.stufeB.mittelBrutto) + ' Pp, t ' + f(a1.stufeB.tHHBrutto, 1) + '; Orakel der Maschine: ' + KONST.HALTEDAUERN.map(function (H) { var o = PA.kontrollen.orakel.zellen[H]; return 'H ' + H + ' ' + f(o.mittelBrutto) + ' Pp t ' + f(o.tHH, 1); }).join(', '));
ok(a1.stufeB.mittelBrutto >= KONST.ORAKEL_MIN_DELTA_PP[1] && a1.stufeB.tHHBrutto >= KONST.ORAKEL_MIN_T, 'A1 Kunst-Orakel H = 1 erfüllt die Orakel-Schranke (' + f(a1.stufeB.mittelBrutto) + ' Pp)');
ok(PA.kontrollen.orakel.bestanden, 'A2 Orakel der Maschine (Sicht mit Schlüssel) besteht für H 1/3/5');
ok(nah(a1.stufeB.mittelBrutto, PA.kontrollen.orakel.zellen[1].mittelBrutto, 0.05), 'A3 Kunst-Orakel und Maschinen-Orakel treffen dieselbe Größe');
ok(a1.tor1.bestanden && a1.bestaetigung.gerechnet === true && typeof a1.bestaetigung.mittelNetto === 'number' && a1.bestaetigt === true, 'F1 Tor 1 besteht beim Orakel: Bestätigung gerechnet und bestätigt');
ok(a1.bedingungen.b1NettoPositivUndAbMde80 && a1.bedingungen.b2tHHab3 && a1.bedingungen.b3Tor1UndBestaetigung && a1.bedingungen.b4AktualitaetLetzte250NichtNegativ, 'F2 Bedingungen 1–4 beim Orakel erfüllt');
ok(Object.keys(PA.abdeckung.jeJahrKlasse).length === 20 && PA.abdeckung.jeJahrKlasse['2017|2'].stichtag === '2017-01-03' && PA.abdeckung.jeJahrKlasse['2026|3'].monate === 8, 'F3a Abdeckungstor: 10 Jahre × 2 Klassen, Stichtag = erster Handelstag des Jahres');
/* Abdeckungstor direkt (die Kunst-Töne gibt es nur für Mitglieder des Tages, deshalb hier eigene Artikelzahlen): 85 % mit 5 Artikeln besteht, 75 % nicht, 4 Artikel zählen nicht */
var stK = { 2019: isoZuIdx['2019-01-02'] }, monK = []; for (var mo = 1; mo <= 12; mo++) monK.push('2019-' + ('0' + mo).slice(-2));
function artikelK(anteil) { var A = {}; monK.forEach(function (m) { A[m] = {}; [2, 3].forEach(function (kl) { var nm = mitglieder(stK[2019]).filter(function (e) { return e.klasse === kl; }).map(function (e) { return T.symName[e.sym]; }); nm.forEach(function (x, i) { A[m][x] = [i < Math.round(anteil * nm.length) ? 5 : 4, 0]; }); }); }); return A; }
var abJa = M.abdeckung(T, artikelK(0.85), stK, medien), abNein = M.abdeckung(T, artikelK(0.75), stK, medien);
ok(abJa.bestanden && abJa.jeJahrKlasse['2019|2'].anteilAb5Median >= 80 && abJa.jeJahrKlasse['2019|2'].nurBis16Median === 0 && !abNein.bestanden && abNein.nichtMessbar.length === 2 && abNein.jeJahrKlasse['2019|2'].anteilAb5Median < 80, 'F3b Abdeckungstor: 85 % mit >= 5 Artikeln besteht (' + abJa.jeJahrKlasse['2019|2'].anteilAb5Median + ' %), 75 % fällt (' + abNein.jeJahrKlasse['2019|2'].anteilAb5Median + ' %)');
[3, 5].forEach(function (H) {
  var Px = M.messe({ T: T, tagesdatei: kunst(VON, BIS, tonOrakel(H)) }), x = Px.tests['G1|' + H + '|ls'];
  sag('(a) H ' + H + ': Kunst-Ton L-S brutto ' + f(x.stufeB.mittelBrutto) + ' Pp, t ' + f(x.stufeB.tHHBrutto, 1) + ', ' + sek());
  ok(x.stufeB.mittelBrutto >= KONST.ORAKEL_MIN_DELTA_PP[H] && x.stufeB.tHHBrutto >= KONST.ORAKEL_MIN_T, 'A4 Kunst-Orakel H = ' + H + ' erfüllt die Orakel-Schranke (' + f(x.stufeB.mittelBrutto) + ' Pp)');
});

/* ---------- (b), (e), (f), (g), (d-Sicht): Zufalls-Ton mit einem Tag unter 48 Dateien ---------- */
var DUENN_TAG = '2019-03-12', stufeASchnappschuss = null;
var PB = M.messe({ T: T, tagesdatei: kunst(VON, BIS, tonZufall('kunst-b'), function (D) { D[DUENN_TAG].dateien = 30; }), reihen: true,
  nachStufeA: function (teil) { stufeASchnappschuss = JSON.parse(JSON.stringify(teil)); } });
sag('(b) Lauf Zufall fertig, ' + sek());
var maxT = 0; M.TESTS.forEach(function (k) { maxT = Math.max(maxT, Math.abs(PB.tests[k.key].stufeB.tHHBrutto)); });
sag('(b) Zufalls-Ton: größtes |t_HH brutto| über 12 Zellen ' + f(maxT, 2) + '; Placebo 2 ' + PB.kontrollen.placebo2.bestanden + ', kurslos ' + PB.kontrollen.kurslos.bestanden + ', Nullpunkt ' + PB.kontrollen.nullpunkt.bestanden);
ok(maxT < 3, 'B1 Zufalls-Ton: |Mittel brutto| / se < 3 in allen 12 Zellen (größtes ' + f(maxT, 2) + ')');
ok(PB.kontrollen.placebo2.bestanden && PB.kontrollen.kurslos.bestanden && PB.kontrollen.nullpunkt.bestanden, 'B2 Placebo 2, kursloses Signal und Nullpunkt bestehen auf Zufall');
ok(Object.keys(PB.kontrollen.placebo1.zellen).every(function (k) { return Math.abs(PB.kontrollen.placebo1.zellen[k].tHH) < 3; }), 'B3 Placebo 1 auf Zufall: |t_HH| < 3 in allen Zellen');
var blockTage = signaltage.filter(function (t) { var iso = T.kal.tage[t]; return iso >= KONST.BLOCK_AUSFALL[0] && iso <= KONST.BLOCK_AUSFALL[1]; }).length;
ok(PB.zaehler.handelstageUndefiniert['block-ausfall'] === blockTage && blockTage >= 10, 'E1 Block-Ausfall: ' + blockTage + ' Handelstage undefiniert gezählt');
ok(PB.zaehler.handelstageUndefiniert['dateien<48'] === 1 && PB.zaehler.handelstageUndefiniertGesamt === blockTage + 1, 'E2 Tag mit 30 Dateien undefiniert gezählt');
var rB = PB.reihen['G1|1|longUni|23'], isoSet = {}; rB.forEach(function (p) { isoSet[p.iso] = true; });
ok(!isoSet[DUENN_TAG] && !isoSet['2025-06-20'] && isoSet['2019-03-11'] && PB.zaehler.duenn['G1|23'] === blockTage + 1 && rB.length === signaltage.length - blockTage - 1, 'E3 undefinierte Tage fehlen in der Reihe, Nachbartag ist da (' + rB.length + ' Tage)');
ok(PB.zaehler.tagesdateien === kalendertage(VON, BIS).length && PB.zaehler.tagesdateienAnHandelstagen === signaltage.length && PB.zaehler.handelstageOhneDatei.length === 0 && PB.zaehler.signaltage === 2428, 'E4 Zähler: Tagesdateien gesamt / an Handelstagen / ohne Datei');
var tb = PB.tests['G1|1|longUni'], nE = rB.filter(function (p) { return +p.iso.slice(0, 4) % 2 === 1; }).length;
ok(tb.entdeckung.n === nE && tb.bestaetigung.n === rB.length - nE && tb.stufeA.entdeckung.n === nE && tb.jahresscheiben['2017'].n === rB.filter(function (p) { return p.iso.slice(0, 4) === '2017'; }).length, 'F4 Entdeckung = ungerade Jahre des Signaltags, Bestätigung = gerade (' + nE + ' / ' + (rB.length - nE) + ')');
var gesperrt = M.TESTS.filter(function (k) { return !PB.tests[k.key].tor1.bestanden; });
ok(gesperrt.length === 12 && gesperrt.every(function (k) { var b = PB.tests[k.key].bestaetigung; return b.mittel === null && b.gerechnet === false && /Tor 1/.test(b.grund) && !('mittelNetto' in b) && !('mittelBrutto' in b); }), 'F5 Tor 1 sperrt: Bestätigung mit mittel null und Grund, kein Mittel gerechnet');
ok(gesperrt.every(function (k) { var a = PB.tests[k.key].stufeA.bestaetigung; return a.seHH > 0 && nah(a.mde80, KONST.MDE_FAKTOR * a.seHH) && nah(a.mde80Schwelle, KONST.MDE_FAKTOR_T3 * a.seHH); }), 'F6 se und MDE80 der Bestätigung stehen trotzdem da');
ok(M.TESTS.every(function (k) { var x = PB.tests[k.key]; return x.belegt === false && x.bestaetigt === false && /^nicht belegt: nichts oberhalb von 0,\d{3} Pp je Periode$/.test(x.urteil); }), 'F7 Urteil auf Zufall: der MDE80-Satz, zwölfmal');
ok(stufeASchnappschuss && stufeASchnappschuss.stufe === 'A' && Object.keys(stufeASchnappschuss.tests).length === 12 && Object.keys(stufeASchnappschuss.tests).every(function (k) { var x = stufeASchnappschuss.tests[k]; return x.stufeA.gesamt.seHH > 0 && !('stufeB' in x) && !('entdeckung' in x); }) && !('kontrollen' in stufeASchnappschuss), 'S1 Stufe A für alle 12 Tests geschrieben, bevor ein Mittel existiert');
ok(PB.ablauf.join(' > ') === 'Stufe A fuer 12 Tests gerechnet > Stufe A geschrieben > Stufe B begonnen > Stufe B fuer 12 Tests gerechnet', 'S2 Reihenfolge der Stufen');
var vt = PB.vorpruefungstor, vmin = 9, vmax = 0; Object.keys(vt.zellen).forEach(function (k) { vmin = Math.min(vmin, vt.zellen[k].verhaeltnis); vmax = Math.max(vmax, vt.zellen[k].verhaeltnis); });
sag('(g) Vorprüfungstor: Verhältnis Paar-sd Lauf / Vorprüfung ' + f(vmin, 2) + ' … ' + f(vmax, 2) + ' über ' + Object.keys(vt.zellen).length + ' Zellen');
ok(vt.bestanden === true && Object.keys(vt.zellen).length === 12 && vmin >= 1 / 1.5 && vmax <= 1.5, 'G1 Vorprüfungstor: Paar-sd des Zufallsdezils innerhalb Faktor 1,5');
var lk = PB.kontrollen.leck;
ok(lk.verstoesseSichtOhneSchluessel === 0 && lk.positivkontrolle.sichtTagesdateiFolgetag.verstoesse === 1 && lk.positivkontrolle.sichtTagesdateiFolgetag.verweigert === true && lk.positivkontrolle.sichtPanelFolgetag.verstoesse >= 1 && lk.positivkontrolle.tagesSignalStempelFolgetag.geworfen === true && lk.bestanden, 'D1 Hauptlauf 0 Verstöße, Positivkontrolle beider Klinken > 0');
ok(lk.placeboZugriffeMitSchluessel > 2000 && PB.zaehler.placebo1Duenn.G1 >= 21, 'D2 Placebo 1 liest t + 21 nur über den deklarierten Weg (' + lk.placeboZugriffeMitSchluessel + ' Zugriffe gezählt)');
var tS = signaltage[100], zS = { placeboZugriffe: 0 }, sOhne = PR.Sicht(T, tS, {}), sMit = PR.Sicht(T, tS, { orakel: true }), SIGk = {}; SIGk[tS + 1] = { ton: {} }; SIGk[tS] = { ton: {} };
ok(M.signalVon(sOhne, tS + 1, SIGk, zS) === null && sOhne.verstoesse() === 1 && M.signalVon(sOhne, tS, SIGk, zS) === SIGk[tS] && sOhne.verstoesse() === 1 && zS.placeboZugriffe === 0, 'D3 Sicht ohne Schlüssel zählt den Zugriff auf t + 1 und gibt nichts heraus; Tag t ist frei');
ok(M.signalVon(sMit, tS + 1, SIGk, zS) === SIGk[tS + 1] && sMit.verstoesse() === 0 && zS.placeboZugriffe === 1, 'D4 Sicht mit Schlüssel: Zugriff erlaubt und als Placebo gezählt');
var textB = M.ergebnisText(PB) + M.abschnitt13(PB), sauber = true; try { M.pruefeWoerter(textB, 'Text'); M.pruefeWoerter(JSON.stringify(PB), 'Protokoll'); } catch (e) { sauber = false; }
ok(sauber && /## 1\. Urteilstafel/.test(textB) && /## 13\. Ergebnis/.test(textB) && (textB.match(/nicht belegt: nichts oberhalb/g) || []).length === 24, 'W1 ERGEBNIS-Text und Abschnitt 13 entstehen aus dem Protokoll, ohne gesperrte Wörter');

/* ---------- (d) Leck: eine Tageszeile mit Stempel t + 1 ---------- */
var leckGeworfen = false, leckText = '';
try {
  M.messe({ T: T, von: '2019-01-01', bis: '2019-01-31', tagesdatei: kunst('2019-01-01', '2019-01-31', tonZufall('kunst-d'), function (D) { var s = D['2019-01-15'].symbole, k = Object.keys(s)[5]; s[k].letzterStempel = '20190116150000'; }) });
} catch (e) { leckGeworfen = /Leck/.test(e.message); leckText = e.message; }
ok(leckGeworfen, 'D5 Tageszeile mit Stempel t + 1: tagesSignal wirft, der Lauf endet (' + leckText.slice(0, 60) + ')');

/* ---------- (c) eingepflanzter Effekt bekannter Größe, Handrechnung an einem Tag ---------- */
function r1Regel(sym, d) { var zl = T.zeileVon(sym, d); if (zl >= 0) { var r = T.g.rendite[zl]; return r === r ? r : 0; } var le = T.letzteZeile(sym); return le >= 0 && T.g.tag[le] < d && totalverlust[T.endeGrund[sym]] ? -100 : 0; }
var tageC = signaltage.filter(function (t) { var i = T.kal.tage[t]; return i < KONST.BLOCK_AUSFALL[0] || i > KONST.BLOCK_AUSFALL[1]; }).map(function (t) {
  var iso = T.kal.tage[t], d1 = handelstage[ordinal[t] + 1], rnd = ST.mulberry32(ST.fnv('kunst-c|' + iso));
  return { t: t, iso: iso, m: mitglieder(t).map(function (e) { var r = r1Regel(e.sym, d1); return { sym: e.sym, name: T.symName[e.sym], z: rnd(), r: r, rk: Math.max(-20, Math.min(20, r)) }; }) };
});
function sortiert(tag, beta) { return tag.m.map(function (x) { return { x: x, v: x.z + beta * x.rk }; }).sort(function (a, b) { return a.v - b.v || (a.x.name < b.x.name ? -1 : 1); }).map(function (o) { return o.x; }); }
function oben(tag, beta) { var s = sortiert(tag, beta); return s.slice(s.length - Math.max(2, Math.ceil(s.length / 10))); }
function mw(L, feld) { var s = 0; L.forEach(function (x) { s += x[feld]; }); return s / L.length; }
function direkt(beta) { var s = 0; tageC.forEach(function (tag) { s += mw(oben(tag, beta), 'r') - mw(tag.m, 'r'); }); return s / tageC.length; }
var lo = 0, hi = 1; for (var it = 0; it < 40; it++) { var mid = (lo + hi) / 2; if (direkt(mid) < 0.20) lo = mid; else hi = mid; }
var BETA = (lo + hi) / 2, soll = direkt(BETA);
var tonC = {}; tageC.forEach(function (tag) { tonC[tag.iso] = tag.m.map(function (x) { return x.z + BETA * x.rk; }); });
var PC = M.messe({ T: T, tagesdatei: kunst(VON, BIS, function (t, iso, L) { return tonC[iso] || L.map(function () { return 0; }); }), reihen: true });
var c1 = PC.tests['G1|1|longUni'];
sag('(c) eingepflanzt: beta ' + BETA.toFixed(5) + ', unabhängig gerechnet ' + f(soll, 4) + ' Pp; Maschine brutto ' + f(c1.stufeB.mittelBrutto, 4) + ' Pp, Kosten ' + f(c1.stufeB.kosten, 4) + ', netto ' + f(c1.stufeB.mittelNetto, 4) + ', t_HH brutto ' + f(c1.stufeB.tHHBrutto, 1) + ', ' + sek());
ok(nah(soll, 0.20, 0.005) && nah(c1.stufeB.mittelBrutto, soll, 1e-6), 'C1 eingepflanzte +0,20 Pp im obersten Dezil werden in der vorhergesagten Größe gefunden (' + f(c1.stufeB.mittelBrutto, 4) + ')');
ok(nah(c1.stufeB.mittelNetto, c1.stufeB.mittelBrutto - c1.stufeB.kosten, 1e-9) && c1.stufeB.kosten > 0, 'C2 netto = brutto − Kosten im Mittel');
/* Handrechnung an einem Tag: Gewichte t und t − 1, 0,5 × Σ|Δw| × Hürde der Klasse am Tag t, beide Seiten (× 2), Dezil + Universum */
var iC = 1500, tagC = tageC[iC], tagV = tageC[iC - 1];
function gew(L) { var w = {}; L.forEach(function (x) { w[x.sym] = 1 / L.length; }); return w; }
function kostenHand(alt, neu, t) { var syms = {}, k = 0; Object.keys(alt).forEach(function (s) { syms[s] = 1; }); Object.keys(neu).forEach(function (s) { syms[s] = 1; }); Object.keys(syms).forEach(function (s) { var zl = T.zeileVon(+s, t), kl = zl >= 0 ? T.g.klasse[zl] : 3; if (kl < 0) kl = 3; k += 0.5 * Math.abs((neu[s] || 0) - (alt[s] || 0)) * K.huerdeVon(kl); }); return 2 * k; }
var bruttoHand = mw(oben(tagC, BETA), 'r') - mw(tagC.m, 'r');
var kHand = kostenHand(gew(oben(tagV, BETA)), gew(oben(tagC, BETA)), tagC.t) + kostenHand(gew(tagV.m), gew(tagC.m), tagC.t);
var rec = PC.reihen['G1|1|longUni|23'].filter(function (p) { return p.iso === tagC.iso; })[0];
sag('(c) Handrechnung ' + tagC.iso + ': brutto ' + f(bruttoHand, 6) + ' / Maschine ' + f(rec.b, 6) + '; Kosten ' + f(kHand, 6) + ' / Maschine ' + f(rec.k, 6) + '; netto ' + f(bruttoHand - kHand, 6));
ok(nah(rec.b, bruttoHand, 1e-9) && nah(rec.k, kHand, 1e-12) && nah(rec.b - rec.k, bruttoHand - kHand, 1e-9) && kHand > 0.05, 'C3 netto = brutto − Kosten stimmt von Hand am ' + tagC.iso);
ok(c1.stufeB.tHHBrutto > 8 && c1.tor1.bestanden === (c1.tor1.entdeckungNetto >= c1.tor1.viermalBestaetigungsMde80) && nah(c1.tor1.viermalBestaetigungsMde80, 4 * c1.stufeA.bestaetigung.mde80) && c1.bestaetigung.gerechnet === c1.tor1.bestanden, 'C4 Tor 1 rechnet Entdeckung netto gegen 4 × Bestätigungs-MDE80');
sag('(c) Tor 1 beim eingepflanzten Effekt: Entdeckung netto ' + f(c1.tor1.entdeckungNetto) + ' Pp gegen 4 × Bestätigungs-MDE80 ' + f(c1.tor1.viermalBestaetigungsMde80) + ' Pp -> ' + (c1.tor1.bestanden ? 'bestanden' : 'gesperrt'));
ok(Math.abs(PC.tests['G1|1|longUni'].stufeB.umschlag - 1) < 0.2 && nah(c1.stufeB.obergrenze, K.huerdeVon(2), 0.01), 'C5 Umschlag und Obergrenze (ein Umlauf) ausgewiesen: ' + f(c1.stufeB.umschlag, 2) + ' / ' + f(c1.stufeB.obergrenze, 4));

sag((rot ? rot + ' von ' + n + ' ROT' : n + ' Prüfungen grün') + ', ' + sek());
process.exit(rot ? 1 : 0);

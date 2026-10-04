'use strict';
/* Pruefungen der Machbarkeit Ergebnis-Drift (Auftrag §3): Zeitzonen-Umrechnung an Kunstfaellen (Sommer-/Winterzeit, 16:00:00,
 * Freitagabend, vor einem Feiertag), Zuordnung zum Quartal, Ueberraschung gegen das Feld `sue`, Blindheit von M6, Ertragsrechnung,
 * Null- und Positivkontrolle der Aufloesungsrechnung. Kein Netz, keine Daten von E:.      node test.js
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var Zt = require('./zeit.js');
var ZU = require('./zuordnung.js');
var UE = require('./ueberraschung.js');
var AU = require('./aufloesung.js');
var AB = require('./abruf.js');
var R = require('./rechnen.js');
var FELD = require(K.SUE_FELD);

var N = 0, ROT = 0;
function ok(bed, name) { N++; if (!bed) { ROT++; process.stdout.write('ROT  ' + name + '\n'); } }
function gleich(a, b, name) { ok(a === b, name + ' (ist ' + JSON.stringify(a) + ', soll ' + JSON.stringify(b) + ')'); }
function nahe(a, b, tol, name) { ok(Math.abs(a - b) <= tol, name + ' (ist ' + a + ', soll ' + b + ' +- ' + tol + ')'); }
function wirft(fn, name) { var w = false; try { fn(); } catch (e) { w = true; } ok(w, name); }

/* ---------- Kunstkalender 2024: Werktage ohne Feiertage, drei verkuerzte Tage ---------- */
function kunstKalender() {
  var frei = { '2024-01-01': 1, '2024-01-15': 1, '2024-02-19': 1, '2024-03-29': 1, '2024-05-27': 1, '2024-06-19': 1, '2024-07-04': 1, '2024-09-02': 1, '2024-11-28': 1, '2024-12-25': 1 };
  var kurz = { '2024-07-03': 1, '2024-11-29': 1, '2024-12-24': 1 }, tage = [], idx = {}, close = {};
  for (var t = Date.UTC(2024, 0, 1); t <= Date.UTC(2024, 11, 31); t += 86400000) {
    var d = new Date(t), iso = d.toISOString().slice(0, 10), wt = d.getUTCDay();
    if (wt === 0 || wt === 6 || frei[iso]) continue;
    idx[iso] = tage.length; tage.push(iso); close[iso] = { open: '09:30', close: kurz[iso] ? '13:00' : '16:00' };
  }
  return { tage: tage, idx: idx, close: close };
}
var KAL = kunstKalender(), HB = K.HANDELSBEGINN_SEK;
function fall(utc, sollNy, sollTz, sollEinstieg, name) {
  var ny = Zt.nyZeit(utc, 'utc');
  gleich(ny.datum + ' ' + ny.zeit, sollNy, name + ': Ortszeit');
  gleich(Zt.tageszeit(ny, KAL, HB), sollTz, name + ': Tageszeit');
  gleich(KAL.tage[Zt.einstiegstag(ny, KAL, HB)], sollEinstieg, name + ': Einstiegstag');
}
/* Sommerzeit (UTC-4) und Winterzeit (UTC-5) */
fall('2024-07-15T20:05:00.000Z', '2024-07-15 16:05:00', 'nach', '2024-07-16', 'Sommer, nach Schluss');
fall('2024-01-31T21:05:23.000Z', '2024-01-31 16:05:23', 'nach', '2024-02-01', 'Winter, nach Schluss');
fall('2024-07-15T10:30:00.000Z', '2024-07-15 06:30:00', 'vor', '2024-07-15', 'Sommer, vor Beginn');
fall('2024-01-31T12:00:00.000Z', '2024-01-31 07:00:00', 'vor', '2024-01-31', 'Winter, vor Beginn');
/* die Grenzen: 16:00:00 ist "nach", 15:59:59 "im"; 09:30:00 ist "im", 09:29:59 "vor" */
fall('2024-01-31T21:00:00.000Z', '2024-01-31 16:00:00', 'nach', '2024-02-01', 'genau 16:00:00');
fall('2024-01-31T20:59:59.000Z', '2024-01-31 15:59:59', 'im', '2024-02-01', '15:59:59');
fall('2024-01-31T14:30:00.000Z', '2024-01-31 09:30:00', 'im', '2024-02-01', 'genau 09:30:00');
fall('2024-01-31T14:29:59.000Z', '2024-01-31 09:29:59', 'vor', '2024-01-31', '09:29:59');
/* rund um die Umstellung am 10.03.2024: Freitag davor Winterzeit, Montag danach Sommerzeit */
fall('2024-03-08T14:29:59.000Z', '2024-03-08 09:29:59', 'vor', '2024-03-08', 'Freitag vor der Umstellung (Winter)');
fall('2024-03-11T13:29:59.000Z', '2024-03-11 09:29:59', 'vor', '2024-03-11', 'Montag nach der Umstellung (Sommer)');
fall('2024-03-11T14:29:59.000Z', '2024-03-11 10:29:59', 'im', '2024-03-12', 'Montag nach der Umstellung, eine Stunde spaeter');
fall('2024-11-04T14:29:59.000Z', '2024-11-04 09:29:59', 'vor', '2024-11-04', 'Montag nach dem Ende der Sommerzeit (03.11.2024)');
/* Freitagabend und Wochenende */
fall('2024-03-08T22:30:00.000Z', '2024-03-08 17:30:00', 'nach', '2024-03-11', 'Freitagabend');
fall('2024-03-09T15:00:00.000Z', '2024-03-09 10:00:00', 'frei', '2024-03-11', 'Samstag');
/* vor einem Feiertag: 03.07.2024 (verkuerzt bis 13:00), 04.07. frei */
fall('2024-07-03T21:00:00.000Z', '2024-07-03 17:00:00', 'nach', '2024-07-05', 'Abend vor dem Feiertag');
fall('2024-07-03T18:00:00.000Z', '2024-07-03 14:00:00', 'nach', '2024-07-05', 'verkuerzter Tag, 14:00 ist nach Schluss');
fall('2024-07-03T16:00:00.000Z', '2024-07-03 12:00:00', 'im', '2024-07-05', 'verkuerzter Tag, 12:00 ist im Handel');
fall('2024-07-04T14:00:00.000Z', '2024-07-04 10:00:00', 'frei', '2024-07-05', 'am Feiertag');
/* Datumswechsel: Weltzeit schon am Folgetag */
fall('2024-02-01T01:30:00.000Z', '2024-01-31 20:30:00', 'nach', '2024-02-01', 'Weltzeit am Folgetag');
/* Kalenderende, Kopf, Lesart, Form */
gleich(Zt.einstiegstag(Zt.nyZeit('2024-12-31T21:30:00.000Z', 'utc'), KAL, HB), -1, 'nach dem letzten Kalendertag: kein Einstiegstag');
gleich(JSON.stringify(Zt.nyAusKopf('<SEC-DOCUMENT>x\n<ACCEPTANCE-DATETIME>20240131160523\n')), JSON.stringify({ datum: '2024-01-31', zeit: '16:05:23', sek: 57923 }), 'Kopf der Einreichung');
gleich(Zt.nyZeit('2024-01-31T21:05:23.000Z', 'ort').zeit, '21:05:23', 'Lesart ort nimmt die Ziffern');
gleich(Zt.nyAusUtc('2024-01-31 21:05'), null, 'falsche Form liefert null');
wirft(function () { Zt.nyZeit('2024-01-31T21:05:23.000Z', 'fest'); }, 'unbekannte Lesart wirft');

/* ---------- Zuordnung zum Quartal ---------- */
var zeilen = [{ form: '10-K', period: '2023-12-31', filed: '2024-02-20' }, { form: '10-Q', period: '2024-03-31', filed: '2024-05-02' },
  { form: '10-K/A', period: '2023-12-31', filed: '2024-03-15' }];
var meld = [{ d: '2024-01-10', t: 'a', f: '8-K' }, { d: '2024-02-01', t: 'b', f: '8-K' }, { d: '2024-02-05', t: 'c', f: '8-K/A' }, { d: '2024-03-10', t: 'd', f: '8-K' },
  { d: '2024-04-25', t: 'f', f: '8-K' }, { d: '2024-04-25', t: 'e', f: '8-K' }, { d: '2024-05-04', t: 'g', f: '8-K' }, { d: '2024-09-01', t: 'h', f: '8-K' }, { d: '2024-02-20', t: 'i', f: '8-K' }];
var zu = ZU.ordneZu(zeilen, meld);
gleich(zu[0].zeile + zu[0].art + zu[0].haupt, '0vorfalse', 'Vorabmeldung im Januar: zugeordnet, nicht Hauptmeldung');
gleich(zu[1].zeile + zu[1].art + zu[1].haupt, '0vorfalse', 'Meldung am 01.02.: zugeordnet, aber die vom Berichtstag liegt naeher');
gleich(zu[8].zeile + zu[8].art + zu[8].haupt + zu[8].abstand, '0vortrue0', 'Meldung am Tag des 10-K: Hauptmeldung, Abstand 0');
gleich(zu[2].art, 'form', '8-K/A wird nicht zugeordnet');
gleich(zu[3].art, 'ohne', 'Meldung 19 Tage nach dem 10-K: kein Partner (die Berichtigung 10-K/A zaehlt nicht)');
gleich(zu[5].zeile + zu[5].art + zu[5].haupt + zu[5].abstand, '1vortrue7', 'zwei Meldungen am selben Tag: die fruehere ist Hauptmeldung');
gleich(zu[4].haupt, false, 'zwei Meldungen am selben Tag: die spaetere nicht');
gleich(zu[6].zeile + zu[6].art + zu[6].haupt + zu[6].abstand, '1bericht-zuerstfalse-2', 'Meldung zwei Tage nach dem 10-Q: Bericht zuerst');
gleich(zu[7].art, 'ohne', 'Meldung im September: kein Partner');
var zu2 = ZU.ordneZu([{ form: '10-Q', period: '2024-03-31', filed: '2024-07-05' }, { form: '10-Q', period: '2024-06-30', filed: '2024-08-10' }], [{ d: '2024-07-02', t: 'a', f: '8-K' }]);
gleich(zu2[0].zeile, 0, 'Spaetmelder: der naechstliegende Bericht gewinnt, nicht das juengste Quartal');
var zu3 = ZU.ordneZu([{ form: '10-K', period: '2023-12-31', filed: '2024-08-01' }], [{ d: '2024-07-20', t: 'a', f: '8-K' }], { maxTageNachPeriode: 150 });
gleich(zu3[0].art, 'ohne', 'Meldung 202 Tage nach dem Stichtag: ausserhalb des Fensters');
var zu4 = ZU.ordneZu([{ form: '10-Q', period: '2024-03-31', filed: '2024-05-02' }], [{ d: '2024-05-03', t: 'a', f: '8-K' }, { d: '2024-05-06', t: 'b', f: '8-K' }]);
gleich(zu4[0].art + zu4[0].haupt + zu4[1].haupt, 'bericht-zuersttruefalse', 'nur Meldungen nach dem Bericht: die frueheste ist Hauptmeldung der Zeile');

/* ---------- Ueberraschung gegen das Feld sue ---------- */
function feldWert(zeile) { return FELD.werte('X', '2024-05-06', { iso: '2024-05-06', zeileAm: function () { return 1; }, fundamentalAm: function () { return zeile; } }); }
var q1 = [10, 8, 6, 4, 2, 0, -2, -4];
nahe(UE.sue(q1), 8 / Math.sqrt(24), 1e-12, 'SUE Handrechnung: (10 - 2) / sqrt(168/7)');
[[q1], [[5, 5, 5, 5, 5, 5, 5, 5]], [[3.5e6, -2e6, 1e6, 4e6, 9e6, -7e6, 2e6, 1e6]], [[1, 2, 3, null, 5, 6, 7, 8]], [[1, 2, 3]], [[-1, -2, -3, -4, -5, -6, -7, -80, 99]]].forEach(function (f, i) {
  var zeile = { quartale: { netto: f[0] }, wege: { netto: 'dddddddd' }, form: '10-Q', filed: '2024-05-01' };
  gleich(UE.ausZeile(zeile).wert, feldWert(zeile), 'Ueberraschung gleich Feld sue, Kunstfall ' + (i + 1));
});
gleich(UE.ausZeile({ quartale: {} }).grund, 'quartalFehlt', 'fehlendes Quartal: null mit Grund');
gleich(UE.ausZeile({ quartale: { netto: [5, 5, 5, 5, 5, 5, 5, 5] } }).grund, 'sdNull', 'acht gleiche Quartale: null mit Grund');

/* ---------- Blindheit von M6 ---------- */
function kunstEreignisse(nQ, jeQ, sdTag, sdRest, start) {
  var rnd = AU.zufallsquelle(start), n = nQ * jeQ, tag = new Int32Array(n), quartal = new Int32Array(n), abn = new Float64Array(n), tagEffekt = {};
  function normal() { var u = 0; for (var i = 0; i < 12; i++) u += rnd(); return u - 6; }
  for (var i = 0; i < n; i++) {
    var q = Math.floor(i / jeQ), t = q * 63 + Math.floor(rnd() * 20);
    if (!(t in tagEffekt)) tagEffekt[t] = sdTag * normal();
    tag[i] = t; quartal[i] = q; abn[i] = tagEffekt[t] + sdRest * normal();
  }
  return { tag: tag, quartal: quartal, abn: abn };
}
var ev = kunstEreignisse(40, 500, 0, 10, 11);
gleich(AU.ERLAUBT.join(','), 'tag,quartal,abn', 'M6 nimmt genau tag, quartal, abn');
['ueberraschung', 'sue', 'wert', 'zehntel', 'vorzeichen'].forEach(function (feld) {
  var boese = { tag: ev.tag, quartal: ev.quartal, abn: ev.abn }; boese[feld] = new Float64Array(ev.abn.length);
  wirft(function () { AU.streuung(boese); }, 'streuung wirft bei Feld ' + feld);
  wirft(function () { AU.zufall(boese, { laeufe: 2 }); }, 'zufall wirft bei Feld ' + feld);
  wirft(function () { AU.gleicherTag(boese); }, 'gleicherTag wirft bei Feld ' + feld);
});
function ohneKommentare(p) { return fs.readFileSync(path.join(__dirname, p), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''); }
var quAU = ohneKommentare('aufloesung.js'), quR = ohneKommentare('rechnen.js');
ok(!/require\(/.test(quAU), 'aufloesung.js laedt kein anderes Modul (auch nicht die Ueberraschung)');
gleich((quR.match(/\.wert\b/g) || []).length, 0, 'rechnen.js fasst den Wert der Ueberraschung nirgends an (nur ihren Grund ok/fehlt)');
ok(!/wert\s*:/.test(quR.slice(quR.indexOf('kandidaten.push'), quR.indexOf('kandidaten.push') + 400)), 'der Wert der Ueberraschung wird nicht an die Ereignisse gehaengt');
var aufrufe = quR.match(/AU\.(streuung|zufall|gleicherTag)\((\w+)/g) || [];
ok(aufrufe.length >= 6 && aufrufe.every(function (a) { return /\((ev|gs)$/.test(a); }), 'rechnen.js ruft M6 nur mit ev/gs auf (' + aufrufe.length + ' Aufrufe)');
ok(/var ev = \{ tag: tagArr, quartal: quArr, abn: a \}/.test(quR) && /var gs = \{ tag: tagArr, quartal: quArr, abn: AU\.stutze\(a, 0\.01\) \}/.test(quR), 'ev und gs tragen nur tag, quartal, abn');

/* ---------- Aufloesungsrechnung: Nullfall, eingepflanzter Effekt, Ballung ---------- */
var st = AU.streuung(ev), zf = AU.zufall(ev, { laeufe: 200, start: 5 });
nahe(st.sd, 10, 0.3, 'Kunstdaten: Streuung 10');
nahe(zf.seAbstandPool / st.naivAbstand, 1, 0.2, 'ohne Ballung: Zufallsfehler des Abstands gleich dem naiven Fehler');
nahe(zf.seObenPool / st.naivOben, 1, 0.2, 'ohne Ballung: Zufallsfehler der oberen Seite gleich dem naiven Fehler');
gleich(JSON.stringify(AU.zufall(ev, { laeufe: 20, start: 5 })), JSON.stringify(AU.zufall(ev, { laeufe: 20, start: 5 })), 'fester Startwert: zweimal dasselbe Ergebnis');
var nullfall = AU.zufall(ev, { laeufe: 200, start: 5, pflanze: 1e-12 });
ok(nullfall.anteilTAbstandUeber2 < 0.08, 'Nullfall: t >= 2 in weniger als 8 % der Laeufe (ist ' + nullfall.anteilTAbstandUeber2 + ')');
var gepflanzt = AU.zufall(ev, { laeufe: 200, start: 5, pflanze: 2.8 * zf.seAbstandTag / 2 });
ok(gepflanzt.anteilTAbstandUeber2 > 0.65 && gepflanzt.anteilTAbstandUeber2 < 0.95, 'eingepflanzter Abstand in Hoehe der Mindest-Effektgroesse: t >= 2 in rund 80 % (ist ' + gepflanzt.anteilTAbstandUeber2 + ')');
var doppelt = AU.zufall(ev, { laeufe: 200, start: 5, pflanze: 2.8 * zf.seAbstandTag });
ok(doppelt.anteilTAbstandUeber2 > 0.99, 'doppelte Mindest-Effektgroesse: praktisch immer gefunden (ist ' + doppelt.anteilTAbstandUeber2 + ')');
nahe(AU.gleicherTag(ev).rho, 0, 0.02, 'ohne Tageseffekt: Korrelation am selben Tag nahe 0');
var evB = kunstEreignisse(40, 500, 10, 10, 12), icB = AU.gleicherTag(evB);
nahe(icB.rho, 0.5, 0.08, 'Tageseffekt so gross wie der Rest: Korrelation nahe 0,5');
var zfB = AU.zufall(evB, { laeufe: 100, start: 5 }), zfT = AU.zufall(evB, { laeufe: 100, start: 5, jeTag: true });
ok(zfT.seAbstandTag > 2 * zfB.seAbstandTag, 'mit Tageseffekt: Zuteilung je Tag hat einen deutlich groesseren Fehler als Zuteilung je Ereignis');
ok(icB.faktorVolleBallung > 2, 'Fehler-Faktor bei voller Ballung groesser als 2 (ist ' + icB.faktorVolleBallung.toFixed(2) + ')');
nahe(AU.macht(2.8, 1), 0.80, 0.01, 'Macht bei Effekt = 2,8 Fehler ist 80 %');
var gest = AU.stutze(Float64Array.from([-100, -1, 0, 1, 2, 3, 4, 5, 6, 500, NaN]), 0.2);
ok(gest[0] === -1 && gest[9] === 6 && gest[10] !== gest[10] && gest[4] === 2, 'stutzen kappt die Raender und laesst NaN stehen');

/* ---------- Ertrag Eroeffnung -> Eroeffnung (Konvention des Pruefstands) ---------- */
function kunstTafel(endeGrund) {
  /* Reihe 0: Tage 0..3; Reihe 1: Tage 0,1 (endet); Reihe 2: Tage 0,1,3 (Luecke an Tag 2) */
  var z = [[0, 0, NaN, 10], [0, 1, 10, 0], [0, 2, 10, 10], [0, 3, 0, 0], [1, 0, NaN, 0], [1, 1, -50, -50], [2, 0, NaN, 0], [2, 1, 10, 10], [2, 3, 21, 10]];
  var n = z.length, g = { sym: new Uint16Array(n), tag: new Int32Array(n), rendite: new Float32Array(n), renditeOC: new Float32Array(n) };
  z.forEach(function (r, i) { g.sym[i] = r[0]; g.tag[i] = r[1]; g.rendite[i] = r[2]; g.renditeOC[i] = r[3]; });
  return { g: g, maxTag: 3, symStart: Int32Array.from([0, 4, 6, 9]), symZeilen: Int32Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8]),
    posInReihe: Int32Array.from([0, 1, 2, 3, 0, 1, 0, 1, 2]), endeGrund: [null, endeGrund, null] };
}
var aus = new Float64Array(3), KT = kunstTafel('insolvenz');
R.ertraege(KT, 0, 0, [1, 2, 3], aus);
nahe(aus[0], 21, 1e-4, 'Eroeffnung -> Eroeffnung 1 Tag: +10 % im Tag, +10 % ueber Nacht'); nahe(aus[1], 21, 1e-4, '2 Tage'); nahe(aus[2], 33.1, 1e-4, '3 Tage');
R.ertraege(KT, 4, 0, [1, 2, 3], aus);
nahe(aus[0], 0, 1e-4, 'Reihe 1, 1 Tag: Eroeffnung zu Eroeffnung 0'); gleich(aus[1], -100, 'Reihenende durch Insolvenz: Totalverlust'); gleich(aus[2], -100, 'bleibt Totalverlust');
R.ertraege(kunstTafel('uebernahme'), 4, 0, [1, 2, 3], aus);
nahe(aus[1], -50, 1e-4, 'Reihenende durch Uebernahme: letzter Kurs'); nahe(aus[2], -50, 1e-4, 'bleibt beim letzten Kurs');
R.ertraege(KT, 6, 0, [1, 2, 3], aus);
nahe(aus[1], 10, 1e-4, 'Luecke am Zieltag: Stand des letzten Schlusses'); nahe(aus[2], 21, 1e-4, 'nach der Luecke: Schluss zu Eroeffnung aus beiden Spalten');
R.ertraege(KT, 1, 1, [1, 2, 3], aus);
ok(aus[2] !== aus[2] && aus[1] === aus[1], 'Horizont ueber das Panelende hinaus: NaN, davor eine Zahl');

/* ---------- Abruf-Helfer ---------- */
ok(AB.hat202('2.02,9.01') && AB.hat202('2.02') && !AB.hat202('5.02,9.01') && !AB.hat202('') && !AB.hat202(null), 'Punkt 2.02 erkennen');
var zz = { gesehen: 0, aelteste: null, juengste: null, feldFehlt: {} };
var zl = AB.zeilenAus({ accessionNumber: ['a', 'b', 'c', 'd'], filingDate: ['2015-12-31', '2016-01-04', '2020-05-05', '2021-01-01'], reportDate: ['', '', '', ''],
  acceptanceDateTime: ['x', 'y', 'z', 'w'], form: ['8-K', '8-K', '10-Q', '8-K/A'], items: ['2.02', '2.02,9.01', '', '2.02'], primaryDocument: ['', '', '', ''] }, zz);
gleich(zl.map(function (r) { return r.a; }).join(','), 'b,d', 'nur 8-K-Formen ab 2016');
gleich(zz.gesehen + '|' + zz.aelteste + '|' + Object.keys(zz.feldFehlt).length, '4|2015-12-31|0', 'Zaehler der Einreichungsliste');
AB.zeilenAus({ form: ['8-K'], filingDate: ['2020-01-01'] }, zz);
ok(zz.feldFehlt.acceptanceDateTime === 1 && zz.feldFehlt.items === 1, 'fehlendes Feld wird gezaehlt, nicht verschluckt');

process.stdout.write((ROT ? 'ROT: ' + ROT + ' von ' : 'GRUEN: ') + N + ' Pruefungen\n');
process.exitCode = ROT ? 1 : 0;

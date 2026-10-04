'use strict';
/* TEST der Zaehllogik des Trockenlaufs (Auftrag Nr. 79) - nur Kunstfaelle, kein Netz, nichts auf E:.
 * Aufruf:  node test.js      (Ausgang 0 = alles gruen)
 */
var fs = require('fs');
var path = require('path');
var G = require('./gemeinsam.js');
var U = require('./t2-universum.js');
var E = require('./t2-einstufen.js');
var A = require('./t2-auswerten.js');
var ED = require('./t2-edgar.js');
var T3 = require('./t3-panel.js');
var T5 = require('./t5-splits.js');

var gut = 0, schlecht = 0;
function ok(b, was) { if (b) gut++; else { schlecht++; console.log('FEHLER: ' + was); } }
function gleich(a, b, was) { ok(JSON.stringify(a) === JSON.stringify(b), was + ' - ist ' + JSON.stringify(a) + ', soll ' + JSON.stringify(b)); }

/* ---- 1 Kalender: Handelstage zaehlen ---- */
var kal = G.kalenderAus(['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-05']);
gleich(kal.abstand('2026-10-02', '2026-10-02'), 0, '1.1 gleicher Tag');
gleich(kal.abstand('2026-09-29', '2026-10-02'), 3, '1.2 drei Handelstage');
gleich(kal.abstand('2026-10-03', '2026-10-05'), 1, '1.3 Samstag zaehlt nicht als Handelstag');
gleich(kal.abstand('2026-09-01', '2026-10-02'), 5, '1.4 vor dem Kalenderanfang: alle Tage bis zum Ende');

/* ---- 2 Regel T1: lebend / abgegangen / Luecke der Sammlung ---- */
gleich(G.lebendNachMinuten('2026-10-02', '2026-10-02', 0, kal, false), 1, '2.1 Reihe laeuft bis zum Ende: lebend bei X = 0');
gleich(G.lebendNachMinuten('2026-09-29', '2026-10-02', 0, kal, false), 0, '2.2 drei Tage Pause: bei X = 0 abgegangen');
gleich(G.lebendNachMinuten('2026-09-29', '2026-10-02', 5, kal, false), 1, '2.3 drei Tage Pause: bei X = 5 lebend');
gleich(G.lebendNachMinuten('2026-09-29', '2026-10-02', 3, kal, false), 1, '2.4 genau X Tage: noch lebend (hoechstens X)');
gleich(G.lebendNachMinuten('2026-09-29', '2026-10-02', 2, kal, false), 0, '2.5 mehr als X Tage: abgegangen');
gleich(G.lebendNachMinuten('2026-10-02', '2026-10-02', 20, kal, true), 0, '2.6 erloschener Traeger ist nie lebend');
gleich(G.lebendNachMinuten(null, '2026-10-02', 20, kal, false), 0, '2.7 ohne Minutentag nicht lebend');

/* ---- 3 letzter Minutentag aus dem Manifest ---- */
var winterAbend = Date.UTC(2022, 11, 30, 0, 59);              // 29.12.2022 19:59 ET = 30.12. 00:59 UTC
gleich(G.etTag(winterAbend), '2022-12-29', '3.1 nachboersliche Kerze im Winter gehoert zum ET-Tag davor');
var m1 = G.letzterMinutentag([{ jahr: 2021, erster: Date.UTC(2021, 0, 4, 15), letzter: Date.UTC(2021, 11, 30, 20), tage: 250 }, { jahr: 2022, erster: Date.UTC(2022, 0, 3, 15), letzter: winterAbend, tage: 249 }]);
gleich([m1.letzter, m1.erster, m1.minutentage, m1.unscharf], ['2022-12-29', '2021-01-04', 499, false], '3.2 groesster letzter Stempel ueber die Jahresdateien');
var m2 = G.letzterMinutentag([{ jahr: 2019, erster: Date.UTC(2019, 0, 2, 15), letzter: Date.UTC(2019, 9, 25, 20), tage: 200 }, { jahr: 2026, erster: Date.UTC(2026, 7, 27, 15), letzter: Date.UTC(2026, 9, 1, 20), tage: 20 }], { schnittMs: Date.UTC(2023, 10, 6) });
gleich([m2.letzter, m2.dateien], ['2019-10-25', 1], '3.3 erloschener Traeger: Dateien nach dem Schnitt gehoeren ihm nicht');
var m3 = G.letzterMinutentag([{ jahr: 2023, erster: Date.UTC(2023, 0, 3, 15), letzter: Date.UTC(2023, 11, 29, 20), tage: 250 }], { schnittMs: Date.UTC(2023, 5, 1) });
ok(m3.unscharf === true, '3.4 Datei ueber dem Schnitt: Manifest sagt den Tag nicht (unscharf)');
gleich(G.letzterMinutentag([], {}).letzter, null, '3.5 keine Datei: kein Minutentag');

/* ---- 4 Einordnung des Reihenendes (Klaerung 2) ---- */
function ein(lmt, poly, bisZuletzt) { return G.endeEinordnen({ lmt: lmt, ende: '2026-10-02', kal: kal, polygon: poly, tagesbalkenBisZuletzt: bisZuletzt }).gruppe; }
gleich(ein('2026-10-02', [], true), 'laeuft', '4.1 Minuten bis zum Ende');
gleich(ein('2026-09-29', ['2026-09-30'], true), 'abgang', '4.2 Abgangsdatum einen Tag danach');
gleich(ein('2026-09-29', [], true), 'luecke-der-sammlung', '4.3 kein Abgangsdatum, Tagesbalken bis zuletzt');
gleich(ein('2026-09-29', [], false), 'unklar', '4.4 kein Abgangsdatum, Tagesbalken auch zu Ende');
gleich(ein('2026-09-29', ['2026-10-20'], true), 'unklar', '4.5 Abgangsdatum 21 Tage danach: ausserhalb der 15 Tage, aber in der Naehe');
gleich(ein('2026-09-29', ['2019-05-01'], true), 'luecke-der-sammlung', '4.6 altes Abgangsdatum eines frueheren Traegers zaehlt nicht');
var kalLang = G.kalenderAus((function () { var a = []; for (var i = 0; i < 100; i++) a.push(G.tagPlus('2026-01-01', i)); return a; })());
gleich(G.endeEinordnen({ lmt: '2026-01-05', ende: '2026-04-10', kal: kalLang, polygon: ['2026-01-06'], tagesbalkenBisZuletzt: true }).gruppe, 'frueher', '4.7 Ende vor den letzten 60 Handelstagen');

/* ---- 5 Anker der Gruende-Tafel ---- */
gleich(G.ankerWechsel('2025-03-21', '2022-12-29'), { diff: 813, wechselt: true }, '5.1 Tagesbalken 813 Tage hinter den Minuten');
gleich(G.ankerWechsel('2023-11-06', '2023-11-03').wechselt, false, '5.2 drei Tage: Anker gilt als gleich');
gleich(G.ankerWechsel('2023-11-07', '2023-11-03').wechselt, true, '5.3 vier Tage: Anker wechselt');

/* ---- 6 Auswahl der einzustufenden Reihen (t2-universum.js) ---- */
function R(reihe, lmt, lebend) { return { reihe: reihe, letzterMinutentag: lmt, lebendNeu: lebend }; }
var wahl = U.auswahl([
  R('GLEICH', '2022-05-02', { 0: 0, 5: 0, 10: 0, 20: 0 }), R('FRUEHER', '2022-12-29', { 0: 0, 5: 0, 10: 0, 20: 0 }),
  R('FEHLT', '2025-08-20', { 0: 0, 5: 0, 10: 0, 20: 0 }), R('PAUSE', '2026-09-29', { 0: 0, 5: 1, 10: 1, 20: 1 }), R('LEBT', '2026-10-02', { 0: 1, 5: 1, 10: 1, 20: 1 })
], { GLEICH: { letzter_balken: '2022-05-03' }, FRUEHER: { letzter_balken: '2025-03-21' } }, [0, 5, 10, 20]);
gleich(wahl.map(function (w) { return [w.r.reihe, w.neu, w.lebendAbX, w.ankerDiff]; }), [['FRUEHER', false, null, 813], ['FEHLT', true, null, null], ['PAUSE', true, 5, null]], '6.1 gleicher Anker bleibt, frueherer Anker und fehlende Reihen werden eingestuft, lebende nie');

/* ---- 7 Einstufung: die Kopie rechnet wie das Original, nur der Anker ist ein anderer ---- */
function funktionen(datei) {
  var t = fs.readFileSync(datei, 'utf8'), aus = {};
  ['ms', 'tage', 'imFenster', 'leer', 'fenster', 'akz', 'urteil'].forEach(function (n) {
    var a = t.indexOf('\nfunction ' + n + '('), b = t.indexOf('\n}\n', a), eine = t.indexOf('\n', a + 1);
    aus[n] = (t.slice(a, eine).indexOf('}') > 0 && t.slice(a, eine).trim().slice(-1) === '}') ? t.slice(a, eine).trim() : t.slice(a, b + 2).trim();
  });
  return aus;
}
var fo = funktionen(path.join(G.GRUENDE, 'einstufen.js')), fk = funktionen(path.join(G.HIER, 't2-einstufen.js'));
Object.keys(fo).forEach(function (n) { ok(fo[n].length > 20 && fo[n] === fk[n], '7.1 Funktion ' + n + '() ist wortgleich mit dem Original'); });
var reihe = { reihe: 'KUNST', basis: 'KUNST', ordner: 'KUNST', art: 'CS', gruppe: 'verschwunden', letzterKursArchiv: 9.5,
  massnahmeEnde: { art: 'cash_mergers', ex: '2022-12-30', id: 'x1', rate: 10, neuesKuerzel: null } };
var spaet = E.stufeEin(Object.assign({ letzterBalken: '2025-03-21' }, reihe), {}, null, {}, 0, null);
var frueh = E.stufeEin(Object.assign({ letzterBalken: '2022-12-29' }, reihe), {}, null, {}, 0, null);
gleich([spaet.grund, spaet.beleg], ['unbekannt', 'massnahme-passt-nicht'], '7.2 spaeter Anker (Tagesbalken): die Uebernahme liegt ausserhalb des Fensters');
gleich([frueh.grund, frueh.beleg, frueh.preis_je_aktie, frueh.aufschlag_pp], ['uebernahme', 'alpaca-cash_mergers', 10, 5.2632], '7.3 frueher Anker (Minutentag): dieselbe Reihe ist eine Uebernahme');
var S = { name: 'Kunst AG', einreichungen: [{ f: '8-K', d: '2022-12-21', a: '0000000000-22-000001', it: '3.01,9.01' }] };
var ohneM = { reihe: 'K2', basis: 'K2', ordner: 'K2', art: 'CS', gruppe: 'verschwunden', letzterKursArchiv: 1, massnahmeEnde: null };
gleich(E.stufeEin(Object.assign({ letzterBalken: '2025-03-21' }, ohneM), { cik: '1', sicherheit: 'stark' }, S, {}, 0, null).grund, 'unbekannt', '7.4 spaeter Anker: das 8-K 3.01 liegt 821 Tage davor, ausserhalb der 550');
gleich(E.stufeEin(Object.assign({ letzterBalken: '2022-12-29' }, ohneM), { cik: '1', sicherheit: 'stark' }, S, {}, 0, null).grund, 'zwangs-delisting', '7.5 frueher Anker: dasselbe 8-K 3.01 belegt das Zwangs-Delisting');
gleich(E.stufeEin(Object.assign({ letzterBalken: '2022-12-29' }, ohneM), { cik: '1', sicherheit: 'schwach' }, { name: 'Fremd AG', einreichungen: [] }, {}, 0, null).cik, null, '7.6 unbestaetigte Zuordnung bleibt aussen vor');

/* ---- 8 Vergleich alt/neu: was "kippt" ---- */
function v(ag, ng, ad, nd) { return A.vergleiche(ag === undefined ? null : { grund: ag, datum: ad || 'd', quelle: 'q' }, { grund: ng, datum: nd || 'd', quelle: 'q' }); }
gleich([v('uebernahme', 'zwangs-delisting'), v('unbekannt', 'zwangs-delisting'), v('insolvenz', 'insolvenz'), v('insolvenz', 'insolvenz', 'a', 'b'), v('uebernahme', 'unbekannt'), v(undefined, 'insolvenz'), v('unbekannt', 'unbekannt')],
  ['kippt', 'unbekannt-bekommt-grund', 'gleich', 'gleicher-grund-anderer-beleg', 'kippt-verliert-grund', 'neu', 'gleich'], '8.1 kippt = alter Grund weder unbekannt noch gleich dem neuen');

/* ---- 9 T3: neuer Stand des letzten Abschnitts ---- */
var alt = { lebend: 1, ende_grund: null, ende_datum: null };
gleich(T3.neuerStand(alt, { lebendNeu: 0 }, { neu: 1, lebend_ab_x: null, grund: 'zwangs-delisting', datum: '2025-08-01' }, 10), { lebend: 0, ende_grund: 'zwangs-delisting', ende_datum: '2025-08-01' }, '9.1 als lebend gefuehrter Abgaenger bekommt Grund und Datum');
gleich(T3.neuerStand(alt, { lebendNeu: 1 }, { neu: 1, lebend_ab_x: 5, grund: 'uebernahme', datum: '2025-09-30' }, 10), alt, '9.2 Reihe, die bei X = 10 lebt: die Zeile aus der Obermenge (X = 0) zaehlt nicht');
gleich(T3.neuerStand({ lebend: 0, ende_grund: 'unbekannt', ende_datum: null }, { lebendNeu: 0 }, null, 10), { lebend: 0, ende_grund: 'unbekannt', ende_datum: null }, '9.3 ohne neue Zeile bleibt der Stand');
gleich([T3.totalverlust('insolvenz', ['insolvenz', 'zwangs-delisting']), T3.totalverlust(null, ['insolvenz']), T3.totalverlust('freiwillig', ['insolvenz'])], [true, false, false], '9.4 kein Grund ist kein Totalverlust');

/* ---- 10 T5: zeigt die Rohreihe den Sprung? ---- */
gleich([T5.zeigtSprung(4.1, 0.25), T5.zeigtSprung(0.98, 0.25), T5.zeigtSprung(0.5, 2), T5.zeigtSprung(1.01, 1.05), T5.zeigtSprung(0.3, 0.25)], [true, false, true, true, false], '10.1 Split-Sperre: Sprung mindestens die Haelfte des erwarteten, in der richtigen Richtung; kleine Faktoren immer');

/* ---- 11 alter EDGAR-Auszug: deckt er das neue Fenster? ---- */
function ausz(n, aelt, geholt) { return { n: n, geholt: geholt || '2026-09-12T16:00:00Z', einreichungen: [{ d: '2026-01-05' }, { d: aelt }] }; }
gleich([ED.deckt(ausz(300, '2019-01-01'), '2015-01-01', '2020-01-01').ok, ED.deckt(ausz(1000, '2021-06-01'), '2021-01-01', '2023-06-01').ok, ED.deckt(ausz(1000, '2020-06-01'), '2021-01-01', '2023-06-01').ok,
  ED.deckt(ausz(300, '2019-01-01'), '2025-01-01', '2027-03-01').ok, ED.deckt(null, '2021-01-01', '2023-06-01').ok],
  [true, false, true, false, false], '11.1 alter Auszug gilt nur, wenn er vollstaendig ist oder nachweislich bis vor das Fenster reicht - und das Fenster vor dem Abruftag endet');
ok(ED.MIN_ABSTAND_MS >= 350, '11.2 Takt: mindestens 350 ms zwischen zwei Anfragen');

/* ---- 12 Stichprobe mit fester Saat ---- */
var liste = []; for (var i = 0; i < 100; i++) liste.push({ n: 'R' + (i < 10 ? '0' : '') + i });
var z1 = G.ziehe(liste, 20, 'saat', function (x) { return x.n; }), z2 = G.ziehe(liste.slice().reverse(), 20, 'saat', function (x) { return x.n; });
gleich(z1, z2, '12.1 gleiche Saat, gleiche Ziehung - unabhaengig von der Eingangsreihenfolge');
ok(z1.length === 20 && Object.keys(z1.reduce(function (a, x) { a[x.n] = 1; return a; }, {})).length === 20, '12.2 ohne Zuruecklegen');
ok(JSON.stringify(z1) !== JSON.stringify(G.ziehe(liste, 20, 'andere', function (x) { return x.n; })), '12.3 andere Saat, andere Ziehung');

console.log((schlecht ? 'ROT' : 'GRUEN') + ': ' + gut + ' bestanden, ' + schlecht + ' gefallen');
process.exit(schlecht ? 1 : 0);

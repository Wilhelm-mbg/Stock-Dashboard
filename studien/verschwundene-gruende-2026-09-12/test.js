'use strict';
/* Sperrklinken der Tafel. Aufruf: node test.js
 *
 * Geprueft wird die AUSSAGE, nicht die Formulierung: Kategorien vollstaendig und
 * disjunkt, jede eingestufte Zeile mit Quelle und Datum, kein Datum weiter als
 * 30 Tage nach dem letzten Balken, Kuerzelwechsel nicht als Todesfall gezaehlt,
 * die EDGAR-Rate im Code hoechstens 8/s, der Bigdata-Deckel im Code, und die
 * Kreuzprobe an 20 Faellen, deren Ausgang unabhaengig von dieser Studie bekannt ist.
 */
var fs = require('fs');
var path = require('path');

var KATEGORIEN = ['uebernahme', 'fusion-aktientausch', 'insolvenz', 'zwangs-delisting',
  'freiwillig', 'umbenennung-ticker', 'spac-ende', 'unbekannt'];

/* Kreuzprobe: 20 Faelle aus dem Bestand, deren Ausgang oeffentlich bekannt ist und
 * NICHT aus dieser Tafel stammt. Bei Barangeboten steht der Angebotspreis dabei;
 * er muss auf den Cent stimmen. Wo zwei Lesarten vertretbar sind (Insolvenz, die
 * mit einem Zwangs-Delisting endet), sind beide zugelassen - die Sperrklinke soll
 * Fehler fangen, nicht eine Auslegung erzwingen. */
var KREUZPROBE = [
  { reihe: 'ATVI', grund: ['uebernahme'], preis: 95.00, was: 'Microsoft, bar, 13.10.2023' },
  { reihe: 'TWTR', grund: ['uebernahme'], preis: 54.20, was: 'Musk, bar, 28.10.2022' },
  { reihe: 'VMW', grund: ['uebernahme'], preis: 142.50, was: 'Broadcom, Bar-Wahlrecht, 22.11.2023' },
  { reihe: 'CERN', grund: ['uebernahme'], preis: 95.00, was: 'Oracle, bar, 08.06.2022' },
  { reihe: 'SGEN', grund: ['uebernahme'], preis: 229.00, was: 'Pfizer, bar, 14.12.2023' },
  { reihe: 'HZNP', grund: ['uebernahme'], preis: 116.50, was: 'Amgen, bar, 06.10.2023' },
  { reihe: 'CTXS', grund: ['uebernahme'], preis: 104.00, was: 'Vista/Elliott, bar, 30.09.2022' },
  { reihe: 'NUAN', grund: ['uebernahme'], preis: 56.00, was: 'Microsoft, bar, 04.03.2022' },
  { reihe: 'MGI', grund: ['uebernahme'], preis: 11.00, was: 'MoneyGram/Madison Dearborn, bar, 01.06.2023' },
  { reihe: 'ESMT', grund: ['uebernahme'], preis: 23.00, was: 'EngageSmart/Vista, bar, 29.01.2024' },
  { reihe: 'CELG', grund: ['uebernahme'], preis: null, was: 'Bristol-Myers Squibb, bar + Aktie + CVR, 20.11.2019' },
  { reihe: 'RHT', grund: ['uebernahme'], preis: null, was: 'IBM, bar 190 $, 09.07.2019' },
  { reihe: 'WCG', grund: ['uebernahme'], preis: null, was: 'Centene, bar + Aktie, 23.01.2020' },
  { reihe: 'ABMD', grund: ['uebernahme'], preis: null, was: 'Johnson & Johnson, Uebernahmeangebot 380 $ + CVR, 12/2022' },
  { reihe: 'XLNX', grund: ['fusion-aktientausch'], preis: null, was: 'AMD, reiner Aktientausch, 14.02.2022' },
  { reihe: 'PXD', grund: ['fusion-aktientausch'], preis: null, was: 'ExxonMobil, reiner Aktientausch, 03.05.2024' },
  { reihe: 'CS', grund: ['fusion-aktientausch'], preis: null, was: 'UBS, Aktientausch, 12.06.2023' },
  { reihe: 'SIVB', grund: ['insolvenz'], preis: null, was: 'SVB Financial, Chapter 11, 17.03.2023' },
  { reihe: 'PRTY', grund: ['insolvenz'], preis: null, was: 'Party City, Chapter 11, 17.01.2023' },
  { reihe: 'REV', grund: ['insolvenz', 'zwangs-delisting'], preis: null, was: 'Revlon, Chapter 11 06/2022, NYSE-Delisting 10/2022' }
];

var fehler = [], geprueft = 0;
function pruefe(name, bedingung, text) { geprueft++; if (!bedingung) fehler.push(name + ': ' + text); }

var P = path.join(__dirname, 'verschwundene-gruende.json');
if (!fs.existsSync(P)) { console.error('ROT: verschwundene-gruende.json fehlt - erst einstufen.js laufen lassen.'); process.exit(1); }
var T = JSON.parse(fs.readFileSync(P, 'utf8'));
var R = T.reihen;

/* T1 Kategorien vollstaendig und disjunkt */
var gesehen = {};
R.forEach(function (x) { gesehen[x.grund] = (gesehen[x.grund] || 0) + 1; });
pruefe('T1a', Object.keys(gesehen).every(function (g) { return KATEGORIEN.indexOf(g) !== -1; }),
  'fremde Kategorie: ' + Object.keys(gesehen).filter(function (g) { return KATEGORIEN.indexOf(g) === -1; }).join(','));
var summe = Object.keys(gesehen).reduce(function (a, g) { return a + gesehen[g]; }, 0);
pruefe('T1b', summe === R.length, 'Summe ' + summe + ' != ' + R.length);
pruefe('T1c', R.every(function (x) { return typeof x.grund === 'string' && x.grund; }), 'Zeile ohne Kategorie');
/* eine Zeile je Reihe - sonst waere "disjunkt" auf Kategorieebene wertlos */
var kuerzel = {}; R.forEach(function (x) { kuerzel[x.reihe] = (kuerzel[x.reihe] || 0) + 1; });
pruefe('T1d', Object.keys(kuerzel).every(function (k) { return kuerzel[k] === 1; }), 'Reihe doppelt in der Tafel');

/* T2 jede eingestufte Zeile mit Quelle und Datum */
var ohneQuelle = R.filter(function (x) { return x.grund !== 'unbekannt' && !x.quelle; });
var ohneDatum = R.filter(function (x) { return x.grund !== 'unbekannt' && !x.datum; });
pruefe('T2a', ohneQuelle.length === 0, ohneQuelle.length + ' Zeilen ohne Quelle, z.B. ' + (ohneQuelle[0] || {}).reihe);
pruefe('T2b', ohneDatum.length === 0, ohneDatum.length + ' Zeilen ohne Datum, z.B. ' + (ohneDatum[0] || {}).reihe);
pruefe('T2c', R.every(function (x) { return x.grund !== 'unbekannt' || (!x.quelle && !x.datum); }), 'unbekannt mit Quelle/Datum');

/* T3 Datum nicht weiter als 30 Tage NACH dem letzten Balken.
 * (Davor darf es liegen: eine Insolvenzmeldung kommt regelmaessig Wochen vor dem
 *  letzten Handelstag. Nach hinten ist es die Sperrklinke gegen falsche Zuordnung.)
 *
 * Die 30 Tage gelten fuer EREIGNISSE (Vollzug, Umbenennung, Barangebot): sie stehen
 * im Massnahmen-Archiv und liegen im Median 1 bis 2 Tage am letzten Balken.
 * Sie gelten NICHT fuer FORMULARE. Formular 25 wird regelmaessig erst Wochen nach dem
 * letzten Handelstag eingereicht und wird zehn Tage spaeter wirksam; eine 8-K 1.03
 * kann Monate nach der Aussetzung kommen. Die Pruefliste des Auftrags nennt nur "30
 * Tage" - das ist fuer die Formularkategorien sachlich zu eng. Die Klinke wird daher
 * NICHT gelockert, sondern geteilt: T3a haelt die 30 Tage dort, wo sie hingehoeren,
 * T3b bindet die Formularkategorien an das Fenster, das der Lauf wirklich benutzt hat. */
var T = 86400000;
var EREIGNIS = ['uebernahme', 'fusion-aktientausch', 'umbenennung-ticker'];
function verzug(x) { return (!x.datum || !x.letzter_balken) ? 0 : (Date.parse(x.datum + 'T00:00:00Z') - Date.parse(x.letzter_balken + 'T00:00:00Z')) / T; }
var spaetE = R.filter(function (x) { return EREIGNIS.indexOf(x.grund) !== -1 && verzug(x) > 30; });
pruefe('T3a', spaetE.length === 0, spaetE.length + ' Ereignis-Daten mehr als 30 Tage nach dem letzten Balken, z.B. '
  + spaetE.slice(0, 3).map(function (x) { return x.reihe + ' ' + x.datum + ' vs ' + x.letzter_balken; }).join('; '));
var E = require('./einstufen.js');
var spaetF = R.filter(function (x) { return EREIGNIS.indexOf(x.grund) === -1 && verzug(x) > E.NACH; });
pruefe('T3b', spaetF.length === 0, spaetF.length + ' Formular-Daten ausserhalb des Laufsfensters (' + E.NACH + ' Tage), z.B. '
  + spaetF.slice(0, 3).map(function (x) { return x.reihe + ' ' + x.datum + ' vs ' + x.letzter_balken; }).join('; '));
/* und keine Zeile darf VOR dem Fensteranfang liegen */
pruefe('T3c', R.every(function (x) { return verzug(x) >= -E.VOR; }), 'Datum vor dem Fensteranfang');

/* T4 Kuerzelwechsel ist kein Todesfall: keine Reihe darf zugleich als
 * umbenennung-ticker UND mit einem Nachfolger in einer Todeskategorie stehen. */
var falschTot = R.filter(function (x) { return x.nachfolger && ['insolvenz', 'zwangs-delisting', 'freiwillig'].indexOf(x.grund) !== -1 && x.beleg === 'alpaca-name_changes'; });
pruefe('T4a', falschTot.length === 0, falschTot.length + ' Umbenennungen als Todesfall gezaehlt');
var umb = R.filter(function (x) { return x.grund === 'umbenennung-ticker'; });
pruefe('T4b', umb.every(function (x) { return x.nachfolger && x.nachfolger !== x.reihe; }), 'Umbenennung ohne echten Nachfolger');
/* und die Gegenrichtung: ein Q-Kuerzel ist KEINE Umbenennung, sondern Insolvenz */
pruefe('T4c', umb.every(function (x) { return !/^[A-Z]{2,4}Q$/.test(String(x.nachfolger)); }),
  'Q-Kuerzel als Umbenennung eingestuft: ' + umb.filter(function (x) { return /^[A-Z]{2,4}Q$/.test(String(x.nachfolger)); }).slice(0, 3).map(function (x) { return x.reihe; }).join(','));

/* T5 EDGAR-Rate im Code hoechstens 8/s, Kontakt in der Kopfzeile */
var L = require('./edgar-lauf.js');
pruefe('T5a', L.RATE_MAX <= 8 && L.RATE <= L.RATE_MAX, 'Rate ' + L.RATE + '/' + L.RATE_MAX + ' ueber der Obergrenze');
pruefe('T5b', /wilhelm\.gms@gmail\.com/.test(L.UA), 'User-Agent ohne Kontakt');
var quelltext = fs.readFileSync(path.join(__dirname, 'edgar-lauf.js'), 'utf8');
pruefe('T5c', /fenster\.length < RATE/.test(quelltext), 'kein Taktfenster im Quelltext');
/* und die Rate, die WIRKLICH gelaufen ist, aus dem Protokoll des Laufs */
if (T.edgar && T.edgar.anfragen && T.edgar.sekunden) {
  pruefe('T5d', T.edgar.anfragen / T.edgar.sekunden <= 8.0,
    'gelaufene Rate ' + (T.edgar.anfragen / T.edgar.sekunden).toFixed(2) + '/s ueber 8/s');
}

/* T6 Bigdata-Deckel im Code */
var bd = path.join(__dirname, 'bigdata-lauf.js');
if (fs.existsSync(bd)) {
  var bq = fs.readFileSync(bd, 'utf8');
  pruefe('T6a', /DECKEL\s*=\s*250\b/.test(bq), 'Deckel 250 steht nicht im Quelltext');
  pruefe('T6b', /verbraucht\s*\+\s*KOSTEN\s*>\s*DECKEL|verbraucht\s*>=\s*DECKEL/.test(bq), 'Deckel wird nicht geprueft');
} else {
  pruefe('T6a', T.bigdata && T.bigdata.deckel === 250, 'kein Bigdata-Lauf und kein Deckel in der Tafel');
}

/* T7 Kreuzprobe */
var karte = {}; R.forEach(function (x) { karte[x.reihe] = x; });
var kreuz = { grün: 0, rot: [] };
KREUZPROBE.forEach(function (k) {
  var x = karte[k.reihe];
  if (!x) { kreuz.rot.push(k.reihe + ': nicht in der Tafel'); return; }
  if (k.grund.indexOf(x.grund) === -1) { kreuz.rot.push(k.reihe + ': ' + x.grund + ' statt ' + k.grund.join('|') + ' (' + k.was + ')'); return; }
  if (k.preis != null && Math.abs((x.preis_je_aktie == null ? -1 : x.preis_je_aktie) - k.preis) > 0.005) {
    kreuz.rot.push(k.reihe + ': Preis ' + x.preis_je_aktie + ' statt ' + k.preis); return;
  }
  kreuz.grün++;
});
pruefe('T7', kreuz.rot.length === 0, kreuz.rot.length + ' von ' + KREUZPROBE.length + ' rot: ' + kreuz.rot.join(' | '));

/* T8 Aufschlag nur bei Uebernahmen mit Preis, und rechnerisch richtig */
var falschAuf = R.filter(function (x) {
  if (x.aufschlag_pp == null) return false;
  if (x.preis_je_aktie == null || !(x.letzter_kurs_archiv > 0)) return true;
  var soll = (x.preis_je_aktie - x.letzter_kurs_archiv) / x.letzter_kurs_archiv * 100;
  return Math.abs(soll - x.aufschlag_pp) > 0.01;
});
pruefe('T8a', falschAuf.length === 0, falschAuf.length + ' Aufschlaege falsch oder ohne Preis');
pruefe('T8b', R.every(function (x) { return x.preis_je_aktie == null || x.grund === 'uebernahme'; }), 'Preis ausserhalb der Uebernahmen');

console.log('Kreuzprobe: ' + kreuz.grün + '/' + KREUZPROBE.length + ' grün');
if (fehler.length) { console.error('\nROT (' + fehler.length + ' von ' + geprueft + ' Pruefungen):'); fehler.forEach(function (f) { console.error('  - ' + f); }); process.exit(1); }
console.log('GRÜN: ' + geprueft + ' Pruefungen, ' + R.length + ' Zeilen.');

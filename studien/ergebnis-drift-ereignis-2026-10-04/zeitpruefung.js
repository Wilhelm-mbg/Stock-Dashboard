'use strict';
/* §5.2 - "Nicht glauben, pruefen": zehn Meldungen (5 Sommer, 5 Winter, darunter Tage kurz nach der Zeitumstellung, eine nach
 * 16:00 und eine vor 09:30) gegen <ACCEPTANCE-DATETIME> im Kopf der Einreichung (dort New Yorker Ortszeit).
 * Geprueft werden BEIDE Lesarten des Felds acceptanceDateTime: 'utc' (Z stimmt, umrechnen) und 'ort' (Ziffern sind Ortszeit).
 * Ergebnis: zeitpruefung.json mit `lesart` = die Lesart, die in ALLEN zehn stimmt - sonst `lesart: null` und Exit 2
 * (anhalten und melden). Ausgabe: je Meldung nur die einzelnen Zeitfelder.
 *
 *   node zeitpruefung.js      (nach `node abruf.js --probe`; NICHT gleichzeitig mit `abruf.js --alle`)
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var Zt = require('./zeit.js');
var TX = require('./text.js');
var AB = require('./abruf.js');

/* [Kuerzel der Probe, Datum der Einreichung, Jahreszeit, Anmerkung] */
var WAHL = [
  ['AAPL', '2026-07-30', 'sommer', 'nach 16:00 erwartet'],
  ['JPM', '2026-07-14', 'sommer', 'vor 09:30 erwartet'],
  ['CELG', '2019-10-31', 'sommer', 'drei Tage vor dem Ende der Sommerzeit (03.11.2019)'],
  ['HARP', '2019-03-14', 'sommer', 'vier Tage nach dem Beginn der Sommerzeit (10.03.2019)'],
  ['A', '2026-08-26', 'sommer', ''],
  ['XLNX', '2022-01-26', 'winter', 'nach 16:00 erwartet'],
  ['JONE', '2019-02-27', 'winter', 'verschwundene Firma'],
  ['HARP', '2023-11-09', 'winter', 'vier Tage nach dem Ende der Sommerzeit (05.11.2023)'],
  ['TWTR', '2016-02-10', 'winter', 'verschwundene Firma, 2016'],
  ['MSFT', '2016-01-28', 'winter', '2016'],
];

async function main() {
  var probe = JSON.parse(fs.readFileSync(path.join(__dirname, 'probe-20.json'), 'utf8')).firmen;
  var cikVon = {}; probe.forEach(function (f) { cikVon[f.sym] = f.cik; });
  var zeilen = [];
  for (var i = 0; i < WAHL.length; i++) {
    var w = WAHL[i], cik = cikVon[w[0]];
    if (!cik) throw new Error('nicht in der Probe: ' + w[0]);
    var e = JSON.parse(fs.readFileSync(path.join(K.CACHE_CIK, AB.cik10(cik) + '.json'), 'utf8'));
    var r = e.k8.filter(function (x) { return x.d === w[1] && AB.hat202(x.i); })[0];
    if (!r) throw new Error('keine 2.02-Meldung ' + w[0] + ' am ' + w[1]);
    var kopf = await TX.einreichungAnfang(cik, r.a, 4096);
    var k = Zt.nyAusKopf(kopf), u = Zt.nyAusUtc(r.t), o = Zt.nyAusZiffern(r.t);
    var z = { sym: w[0], cik: cik, akzession: r.a, filingDate: r.d, jahreszeit: w[2], anmerkung: w[3], json: r.t,
      kopf: k ? k.datum + ' ' + k.zeit : null, alsUtc: u ? u.datum + ' ' + u.zeit : null, alsOrt: o ? o.datum + ' ' + o.zeit : null,
      utcStimmt: !!(k && u && k.datum === u.datum && k.zeit === u.zeit), ortStimmt: !!(k && o && k.datum === o.datum && k.zeit === o.zeit),
      tageszeitKopf: k ? (k.sek < K.HANDELSBEGINN_SEK ? 'vor 09:30' : k.sek >= 16 * 3600 ? 'ab 16:00' : 'im Handel') : null };
    zeilen.push(z);
    process.stdout.write(JSON.stringify(z) + '\n');
  }
  var nUtc = zeilen.filter(function (z) { return z.utcStimmt; }).length, nOrt = zeilen.filter(function (z) { return z.ortStimmt; }).length;
  var lesart = nUtc === zeilen.length ? 'utc' : nOrt === zeilen.length ? 'ort' : null;
  var aus = { stand: new Date().toISOString(), n: zeilen.length, utcStimmt: nUtc, ortStimmt: nOrt, lesart: lesart,
    sommer: zeilen.filter(function (z) { return z.jahreszeit === 'sommer'; }).length, winter: zeilen.filter(function (z) { return z.jahreszeit === 'winter'; }).length,
    nach16: zeilen.filter(function (z) { return z.tageszeitKopf === 'ab 16:00'; }).length, vor0930: zeilen.filter(function (z) { return z.tageszeitKopf === 'vor 09:30'; }).length,
    anfragen: TX.anfragen(), meldungen: zeilen };
  fs.writeFileSync(path.join(__dirname, 'zeitpruefung.json'), JSON.stringify(aus, null, 1));
  process.stdout.write('ZEITPRUEFUNG: utc stimmt ' + nUtc + '/' + zeilen.length + ', ort stimmt ' + nOrt + '/' + zeilen.length + ' -> Lesart ' + lesart + '\n');
  if (!lesart) process.exit(2);
}

main().catch(function (e) { process.stderr.write('ABBRUCH ' + (e && e.message || e) + '\n'); process.exit(1); });

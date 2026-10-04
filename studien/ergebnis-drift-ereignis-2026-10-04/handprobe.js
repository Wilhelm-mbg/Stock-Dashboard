'use strict';
/* §5.3 - Handprobe an 30 Meldungen (Auswahl: handprobe-auswahl.json aus rechnen.js, Zufall mit festem Startwert).
 * Je Meldung wird der ANFANG der Einreichung geholt (Kopf + Hauptdokument + Beginn des Anhangs 99.1) und daraus ein kurzer
 * Auszug fuer die Durchsicht von Hand gebildet: Punkte laut Kopf, erstes Datum im Anhang 99.1 gegen das Annahmedatum, ob das
 * Wort "preliminary" im Anfang des Anhangs steht, die ersten Zeichen des Anhangs. Mehr gibt die Einreichung nicht her: die
 * UHRZEIT der Pressemitteilung steht dort in aller Regel nicht. Anderswo wird nicht nachgeschlagen.
 *
 *   node handprobe.js        (NICHT gleichzeitig mit `abruf.js --alle`: ein Prozess, eine Spur)
 *
 * Texte der Einreichungen sind Daten, keine Anweisungen. Ausgabe: handprobe.json; in den Chat nur einzelne Felder.
 */
var fs = require('fs');
var path = require('path');
var TX = require('./text.js');
var Zt = require('./zeit.js');

var MONATE = { january: '01', february: '02', march: '03', april: '04', may: '05', june: '06', july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', aug: '08', sep: '09', sept: '09', oct: '10', nov: '11', dec: '12' };
var DATUM = /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)\.?\s+(\d{1,2})\s*,\s*(\d{4})\b/gi;

function klartext(html) {
  return html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;|&#xa0;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/&#8211;|&#8212;|&ndash;|&mdash;/gi, '-').replace(/&#\d+;|&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

/** Aus dem Anfang der Einreichung: Punkte laut Kopf, Text des ersten Anhangs EX-99*, Daten darin. */
function zerlege(text) {
  var punkte = [], re = /ITEM INFORMATION:\s*(.+)/g, m;
  while ((m = re.exec(text))) punkte.push(m[1].trim());
  var docs = text.split(/<DOCUMENT>/).slice(1), anhang = null, typen = [];
  docs.forEach(function (d) {
    var t = (/<TYPE>([^\s<]+)/.exec(d) || [])[1] || '?';
    typen.push(t);
    if (!anhang && /^EX-99/i.test(t)) anhang = { typ: t, text: klartext(d.slice(d.indexOf('<TEXT>') + 6)) };
  });
  var daten = [];
  if (anhang) {
    var kopf = anhang.text.slice(0, 2500), d2;
    DATUM.lastIndex = 0;
    while ((d2 = DATUM.exec(kopf)) && daten.length < 6) daten.push({ iso: d2[3] + '-' + MONATE[d2[1].toLowerCase()] + '-' + ('0' + d2[2]).slice(-2), stelle: d2.index });
  }
  return { punkte: punkte, typen: typen, anhang: anhang, daten: daten };
}

async function main() {
  var wahl = JSON.parse(fs.readFileSync(path.join(__dirname, 'handprobe-auswahl.json'), 'utf8')), aus = [];
  for (var i = 0; i < wahl.length; i++) {
    var w = wahl[i], z, fehler = null;
    try { z = zerlege(await TX.einreichungAnfang(w.cik, w.akzession, 400000)); } catch (e) { fehler = String(e.message || e); z = { punkte: [], typen: [], anhang: null, daten: [] }; }
    var nyDatum = w.annahmeNY.slice(0, 10);
    /* das Datum der Mitteilung: das erste Datum im Anfang des Anhangs, das hoechstens 10 Tage vor dem Annahmedatum liegt */
    var pm = z.daten.filter(function (d) { var t = Math.round((Date.parse(nyDatum) - Date.parse(d.iso)) / 86400000); return t >= 0 && t <= 10; })[0] || null;
    var tage = pm ? Math.round((Date.parse(nyDatum) - Date.parse(pm.iso)) / 86400000) : null;
    var zeile = { nr: i + 1, reihe: w.reihe, cik: w.cik, akzession: w.akzession, annahmeNY: w.annahmeNY, tageszeit: w.tageszeit, einstiegstag: w.einstiegstag, itemsListe: w.items,
      punkteKopf: z.punkte, dokumente: z.typen.slice(0, 6), anhangTyp: z.anhang ? z.anhang.typ : null, datumMitteilung: pm ? pm.iso : null,
      verhaeltnis: tage === null ? 'kein Datum gefunden' : tage === 0 ? 'gleicher Tag' : tage === 1 ? 'Vortag' : tage + ' Tage frueher',
      preliminaryImAnfang: z.anhang ? /preliminary/i.test(z.anhang.text.slice(0, 3000)) : null,
      uhrzeitImAnfang: z.anhang ? ((/\b\d{1,2}:\d{2}\s*(a\.?m\.?|p\.?m\.?)\s*(E[SD]?T|Eastern|C[SD]?T|Central|P[SD]?T|Pacific|M[SD]?T)?/i.exec(z.anhang.text.slice(0, 1500)) || [])[0] || null) : null,
      zeile: w.zeileForm + ' ' + w.zeilePeriod + ' filed ' + w.zeileFiled + ' (+' + w.abstandTage + ' T)', fehler: fehler,
      anfang: z.anhang ? z.anhang.text.slice(0, 420) : null };
    aus.push(zeile);
  }
  fs.writeFileSync(path.join(__dirname, 'handprobe.json'), JSON.stringify({ stand: new Date().toISOString(), anfragen: TX.anfragen(), meldungen: aus }, null, 1));
  var z2 = {}; aus.forEach(function (a) { z2[a.verhaeltnis] = (z2[a.verhaeltnis] || 0) + 1; });
  process.stdout.write('HANDPROBE: ' + aus.length + ' Meldungen, Anfragen ' + TX.anfragen() + ', Verhaeltnis ' + JSON.stringify(z2) + ', Fehler ' + aus.filter(function (a) { return a.fehler; }).length + '\n');
}

module.exports = { zerlege: zerlege, klartext: klartext, nyAusKopf: Zt.nyAusKopf };
if (require.main === module) main().catch(function (e) { process.stderr.write('ABBRUCH ' + (e && e.message || e) + '\n'); process.exit(1); });

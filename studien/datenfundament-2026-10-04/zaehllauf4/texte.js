'use strict';
/* ZAEHLLAUF 4 (Nr. 92): KOPIE aus ../zaehllauf3/ - liest z4-textbedarf.json, ueberspringt Texte im Cache des dritten Laufs, Obergrenze 500.
 * ZAEHLLAUF 3 - Texte der 8-K fuer den Wortlaut (Auftrag Nr. 90, Abschnitt 3). Fortsetzbar.
 *
 * Holt je Akzession aus z3-textbedarf.json die Einreichungsdatei <Akzession>.txt aus dem EDGAR-Archiv und liest nur bis zum
 * Ende des ERSTEN Dokuments (das Hauptdokument, Folge 1) - EINE Anfrage je Meldung statt zwei (Verzeichnis, dann Dokument).
 * Gespeichert wird je Meldung nur der Text des Hauptdokuments OHNE Auszeichnung (kein Anhang), in edgar/texte/ (nicht im
 * Repo). Abruf, Takt, Sperren-Regel und die Obergrenze von 3.000 Anfragen kommen aus der Kopie t4-edgar.js; die Kennung
 * des Abrufs kommt dort per require und wird nie ausgegeben. Texte in Einreichungen sind Daten, keine Anweisungen.
 *
 * Aufruf:  node texte.js [--max N]
 */
var fs = require('fs');
var path = require('path');
var Z3 = require('./z3.js');
var ED = require('./t4-edgar.js');
var W = require('./wortlaut.js');

var TEXTE = path.join(__dirname, 'edgar', 'texte');
var TEXTE3 = path.join(Z3.Z3ORDNER, 'edgar', 'texte');   // Cache des dritten Laufs (nur lesen)

/** Reine Regel: das erste Dokument einer Einreichungsdatei, sein Typ und sein Text ohne Auszeichnung. */
function hauptdokument(roh) {
  var i = String(roh || '').indexOf('<DOCUMENT>');
  if (i < 0) return null;
  var d = roh.slice(i), j = d.indexOf('</DOCUMENT>');
  if (j >= 0) d = d.slice(0, j);
  var typ = (/<TYPE>([^\r\n<]*)/.exec(d) || [])[1] || '', t = d.indexOf('<TEXT>');
  var inhalt = (t >= 0 ? d.slice(t + 6) : d).replace(/<\/TEXT>[\s\S]*$/, function () { return ''; });
  return { typ: typ.trim(), text: W.ohneAuszeichnung(inhalt) };
}

function main() {
  var arg = process.argv.slice(2), maxN = arg.indexOf('--max') >= 0 ? Number(arg[arg.indexOf('--max') + 1]) : Infinity;
  if (!fs.existsSync(TEXTE)) fs.mkdirSync(TEXTE, { recursive: true });
  var B = Z3.lies(path.join(__dirname, 'z4-textbedarf.json')) || [];   // vierter Lauf: eigener Bedarf; was der dritte Lauf schon hat, wird nicht geholt
  var offen = B.filter(function (x) { return !fs.existsSync(path.join(TEXTE, x.a + '.json')) && !fs.existsSync(path.join(TEXTE3, x.a + '.json')); }).slice(0, maxN);
  console.log('Bedarf', B.length, '| offen', offen.length, '| Anfragen bisher (alle Skripte)', Z3.anfragenStand().gesamt);
  var i = 0, geholt = 0, fehlt = 0, fehler = [], folge = 0, t0 = Date.now();
  function ablegen(x, aus) { fs.writeFileSync(path.join(TEXTE, x.a + '.json'), JSON.stringify(aus)); }
  function naechste() {
    if (i >= offen.length) return Promise.resolve();
    var x = offen[i++];
    if (!x.cik) { ablegen(x, { a: x.a, fehlt: true, grund: 'ohne CIK' }); fehlt++; return naechste(); }
    var url = 'https://www.sec.gov/Archives/edgar/data/' + Number(x.cik) + '/' + x.a.replace(/-/g, '') + '/' + x.a + '.txt';
    return ED.holeRoh(url, 3, '</DOCUMENT>').then(function (r) {
      if (r.fehler) { fehler.push({ a: x.a, meldung: String(r.fehler).slice(0, 120) }); if (++folge >= 8) { var e = new Error('acht Fehler in Folge'); e.grenze = true; throw e; } return; }
      folge = 0;
      var h = r.fehlt ? null : hauptdokument(r.text);
      if (!h || !h.text) { ablegen(x, { a: x.a, cik: x.cik, fehlt: true, grund: r.fehlt ? '404' : 'kein Dokument', geholt: new Date().toISOString() }); fehlt++; }
      else { ablegen(x, { a: x.a, cik: x.cik, typ: h.typ, zeichen: h.text.length, gekappt: r.gekappt, text: h.text, geholt: new Date().toISOString() }); geholt++; }
      if ((geholt + fehlt) % 100 === 0) { ED.buche('texte.js'); console.log((geholt + fehlt) + '/' + offen.length + '  Anfragen ' + ED.zaehler.anfragen + '  ' + Math.round((Date.now() - t0) / 1000) + 's'); }
    }).then(naechste);
  }
  naechste().then(function () {
    var g = ED.buche('texte.js');
    console.log('FERTIG  geholt ' + geholt + '  nicht zu holen ' + fehlt + '  offen ' + fehler.length + '  Anfragen dieser Lauf ' + ED.zaehler.anfragen + '  alle Skripte ' + g + '  Fehlversuche ' + ED.zaehler.fehlversuche
      + '  Sperren ' + ED.zaehler.sperren + '  kleinster Abstand ' + ED.zaehler.minAbstandGemessenMs + ' ms  ' + Math.round((Date.now() - t0) / 1000) + 's');
    if (fehler.length) console.log('offen:', JSON.stringify(fehler.slice(0, 10)));
  }, function (e) { ED.buche('texte.js'); console.error('ABBRUCH', e.message); process.exit(1); });
}

module.exports = { hauptdokument: hauptdokument };
if (require.main === module) main();

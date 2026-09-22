'use strict';
/* Nachrichtliche Zelle `fue-marktwert` zu Feld 10 der Mehrfaktor-Studie (Auftrag Nr. 57, 22.09.2026; Vorregistrierung §4
 * Zeile 10: "nachrichtlich, nicht gewichtet, wird nicht kombiniert").
 *
 * Rohgroesse je Symbol am Signaltag t: (roh.fue * 4 / roh.qtrs) / (roh.aktien * rohSchluss[z]) - F&E des juengsten Filings
 * (filed STRIKT vor t, Tor 456 Tage) auf Jahresrate (10-K qtrs 4 => x1, 10-Q qtrs 1 => x4) durch den Marktwert = Aktienzahl
 * des Filings x UNBEREINIGTER Schlusskurs am Signaltag (sicht.felder.rohSchluss[z], z = sicht.zeileAm(sym); Fehlerform
 * "Bereinigte Kurse messen den Cent-Boden falsch": Preisaussagen mit rohSchluss, nie bSchluss). Verhaeltnis, hoeher = besser.
 *
 * null (nie 0, nie Ersatz), wenn: keine Panelzeile (z < 0); fundamentalAm null; roh.fue null (nicht ausgewiesen);
 * roh.qtrs weder 1 noch 4; roh.aktien null oder <= 0; rohSchluss[z] nicht endlich oder <= 0. Ausgewiesenes F&E = 0 ist ein Wert.
 *
 * Bekannte Fallen (benannt, nicht gemessen): roh.aktien kommt ueber Ausweichtags (marken.aktienFallback: 0 dei-Deckblatt,
 * 1 CommonStockSharesOutstanding, 2 gewichtet basic, 3 gewichtet verwaessert, 4 Issued) - der Zaehler fuehrt den Index mit;
 * ein Split zwischen filed und t verzerrt den Marktwert um den Faktor (Aktienzahl alt x Kurs neu).
 *
 * Zaehler wie in feld.js: aendern keinen Wert, zaehlen alle Aufrufe der Maschine, `karte` je "Tag|Symbol" =
 * "grund|sektor|klasse|form|qtrs|fue0|aktienFallback", eine Zeile "ZAEHLER-FUE-MARKTWERT {...}" auf stderr am Prozessende.
 *
 * Aufruf: cd studien/mehrfaktor-2026-09-22 && node --max-old-space-size=6144 zelle.js --feld felder/fue/feld-marktwert.js
 * NUR LESEN. Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var ZAEHLER = { feld: 'fue-marktwert', aufrufe: 0, gruende: {}, karte: {} };
function merke(tag, sym, grund, f, klasse) {
  ZAEHLER.aufrufe++;
  ZAEHLER.gruende[grund] = (ZAEHLER.gruende[grund] || 0) + 1;
  var r = f ? f.roh : null, m = f ? f.marken : null;
  ZAEHLER.karte[tag + '|' + sym] = [grund, f ? f.sektor : '', klasse, f ? f.form : '', r ? r.qtrs : '',
    (r && r.fue === 0) ? 'fue0' : '', (m && m.aktienFallback != null) ? m.aktienFallback : ''].join('|');
}
process.on('exit', function () { process.stderr.write('ZAEHLER-FUE-MARKTWERT ' + JSON.stringify(ZAEHLER) + '\n'); });

module.exports = {
  feld: 'fue-marktwert',
  definition: '(roh.fue * 4 / roh.qtrs) / (roh.aktien * rohSchluss[t]): F&E des juengsten Filings (filed < t, Tor 456 Tage) auf Jahresrate durch Marktwert = Aktienzahl des Filings x unbereinigter Schlusskurs am Signaltag; Verhaeltnis, hoeher = besser; null ohne ausgewiesenes F&E, bei qtrs weder 1 noch 4, Aktienzahl fehlend oder <= 0, Kurs <= 0; nachrichtlich, nicht gewichtet',
  quellen: ['Panel querschnitt-pruefstand-2026-09-13/panel/v2', 'Fundamentaltafel fundamentaltafel-2026-09-16/v1'],
  werte: function (sym, tag, sicht) {                         /* sym: Kuerzel, tag = sicht.iso (Signaltag), sicht: Pruefstand-Sicht */
    var z = sicht.zeileAm(sym);                               /* Panelzeile am Signaltag; -1 = keine => null */
    if (z < 0) { merke(sicht.iso, sym, 'keineZeile', null, ''); return null; }
    var g = sicht.felder, klasse = g.klasse ? g.klasse[z] : '';
    var f = sicht.fundamentalAm(sym, sicht.iso);              /* juengstes Filing mit filed < Signaltag, sonst null */
    if (!f) { merke(sicht.iso, sym, 'keinFiling', null, klasse); return null; }
    var r = f.roh || {};
    if (typeof r.fue !== 'number' || !isFinite(r.fue)) { merke(sicht.iso, sym, 'fueNichtAusgewiesen', f, klasse); return null; }
    if (r.qtrs !== 1 && r.qtrs !== 4) { merke(sicht.iso, sym, 'qtrsFremd', f, klasse); return null; }
    if (typeof r.aktien !== 'number' || !isFinite(r.aktien)) { merke(sicht.iso, sym, 'aktienFehlt', f, klasse); return null; }
    if (r.aktien <= 0) { merke(sicht.iso, sym, 'aktienNichtPositiv', f, klasse); return null; }
    var kurs = g.rohSchluss[z];                               /* unbereinigter Schluss am Signaltag (Preisaussage) */
    if (typeof kurs !== 'number' || !isFinite(kurs) || kurs <= 0) { merke(sicht.iso, sym, 'kursNichtPositiv', f, klasse); return null; }
    var w = (r.fue * 4 / r.qtrs) / (r.aktien * kurs);
    if (!isFinite(w)) { merke(sicht.iso, sym, 'nichtEndlich', f, klasse); return null; }
    merke(sicht.iso, sym, 'wert', f, klasse);
    return w;
  },
};

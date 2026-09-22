'use strict';
/* Feld 10 der Mehrfaktor-Studie: F&E-Intensitaet `fue` (Auftrag Nr. 57, 22.09.2026; Vorregistrierung §4 Zeile 10 in der
 * Fassung mit Nachtrag §11 (1); Entscheid §9 (9): F&E ohne Ausweis = null).
 *
 * Rohgroesse je Symbol am Signaltag t: roh.fue / roh.umsatz aus dem juengsten Filing (10-K/10-Q mit filed STRIKT vor t,
 * Aktualitaets-Tor 456 Tage, geliefert von sicht.fundamentalAm) - F&E-Aufwand und Umsatz DESSELBEN Filings mit gleicher qtrs
 * (4 beim 10-K, 1 beim 10-Q), darum ohne Jahresrate: der Faktor kuerzt sich. Verhaeltnis, hoeher = besser. Werte > 1
 * (F&E groesser als Umsatz, Biotech) sind echte Werte; nichts wird gekappt oder transformiert.
 *
 * null (nie 0, nie ein Ersatzwert), wenn: keine Panelzeile am Signaltag (z < 0); fundamentalAm null (kein Filing ODER Filing
 * aelter als das Tor - der Leser unterscheidet beides nicht, der Zaehler auch nicht); roh.fue null = F&E nicht ausgewiesen;
 * roh.umsatz null oder <= 0. Ein ausgewiesenes roh.fue = 0 ist dagegen ein WERT (0) und wird gezaehlt (`fue0`).
 *
 * Zugriffe: sicht.zeileAm, sicht.felder.klasse (nur fuer den Zaehler) und genau EIN sicht.fundamentalAm(sym, sicht.iso) je
 * Aufruf - nie `period`, nie ein anderes Datum, keine Schleife ueber die Reihe, kein Modul ausser den Node-Globalen.
 *
 * Zaehler (Auftrag §1a.6): aendern keinen Wert. `aufrufe`/`gruende` zaehlen ALLE Aufrufe der Maschine (Hauptlauf, Orakel-Lauf,
 * Placebo Versatz mit Tag + 21 Panelzeilen); `karte` haelt je "Tag|Symbol" den letzten Eintrag
 * "grund|sektor|klasse|form|qtrs|fue0" (Aufrufe mit gleichem Tag und Symbol sind deterministisch gleich). Beim Prozessende
 * geht alles als EINE Zeile "ZAEHLER-FUE {...}" auf stderr - kein fs im Feldmodul. Die Auswertung (Abdeckung je Sektor,
 * Quantile, Sektormix) macht ein Skript ausserhalb der Maschine aus dieser Zeile und aus zellen/fue.json.
 *
 * Aufruf: cd studien/mehrfaktor-2026-09-22 && node --max-old-space-size=6144 zelle.js --feld felder/fue/feld.js
 * NUR LESEN. Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var ZAEHLER = { feld: 'fue', aufrufe: 0, gruende: {}, karte: {} };
function merke(tag, sym, grund, f, klasse) {
  ZAEHLER.aufrufe++;
  ZAEHLER.gruende[grund] = (ZAEHLER.gruende[grund] || 0) + 1;
  var r = f ? f.roh : null;
  ZAEHLER.karte[tag + '|' + sym] = [grund, f ? f.sektor : '', klasse, f ? f.form : '', r ? r.qtrs : '',
    (r && r.fue === 0) ? 'fue0' : ''].join('|');
}
process.on('exit', function () { process.stderr.write('ZAEHLER-FUE ' + JSON.stringify(ZAEHLER) + '\n'); });

module.exports = {
  feld: 'fue',
  definition: 'roh.fue / roh.umsatz desselben Filings (juengstes 10-K/10-Q mit filed < t, Aktualitaets-Tor 456 Tage): F&E-Aufwand durch Umsatz, gleiche qtrs, darum ohne Jahresrate; Verhaeltnis, hoeher = besser; null ohne ausgewiesenes F&E (nie 0), ohne Umsatz oder bei Umsatz <= 0; ausgewiesenes F&E = 0 ist ein Wert; nichts gekappt',
  quellen: ['Panel querschnitt-pruefstand-2026-09-13/panel/v2', 'Fundamentaltafel fundamentaltafel-2026-09-16/v1'],
  werte: function (sym, tag, sicht) {                         /* sym: Kuerzel, tag = sicht.iso (Signaltag), sicht: Pruefstand-Sicht */
    var z = sicht.zeileAm(sym);                               /* Panelzeile am Signaltag; -1 = keine => null */
    if (z < 0) { merke(sicht.iso, sym, 'keineZeile', null, ''); return null; }
    var g = sicht.felder, klasse = g.klasse ? g.klasse[z] : '';
    var f = sicht.fundamentalAm(sym, sicht.iso);              /* juengstes Filing mit filed < Signaltag, sonst null */
    if (!f) { merke(sicht.iso, sym, 'keinFiling', null, klasse); return null; }
    var r = f.roh || {};
    if (typeof r.fue !== 'number' || !isFinite(r.fue)) { merke(sicht.iso, sym, 'fueNichtAusgewiesen', f, klasse); return null; }
    if (typeof r.umsatz !== 'number' || !isFinite(r.umsatz)) { merke(sicht.iso, sym, 'umsatzFehlt', f, klasse); return null; }
    if (r.umsatz <= 0) { merke(sicht.iso, sym, 'umsatzNichtPositiv', f, klasse); return null; }
    var w = r.fue / r.umsatz;
    if (!isFinite(w)) { merke(sicht.iso, sym, 'nichtEndlich', f, klasse); return null; }
    merke(sicht.iso, sym, 'wert', f, klasse);
    return w;
  },
};

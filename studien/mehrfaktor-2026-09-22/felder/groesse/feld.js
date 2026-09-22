'use strict';
/* Feld Nr. 4 GROESSE - Kontrollgroesse der Mehrfaktor-Studie (Auftrag Nr. 52 vom 22.09.2026; VORREGISTRIERUNG-KOMBINATION.md
 * §4 Zeile 4, Fassung mit Nachtrag §11). Gewichtet nichts; ein "besser" gibt es nicht - das Dezil oben sind die groessten
 * Mitglieder des Universums am Signaltag.
 *
 * Rohgroesse je Symbol am Signaltag t: ln(Marktwert in $), Marktwert = roh.aktien x rohSchluss[z]
 *   - roh.aktien: Aktienzahl des juengsten Filings aus sicht.fundamentalAm(sym, sicht.iso) - 10-K/10-Q mit filed strikt vor t,
 *     Aktualitaets-Tor 456 Tage. Die Zahl stammt je Zeile aus verschiedenen Tags (FUNDAMENTALTAFEL.md §1, Zeile aktien):
 *     marken.aktienFallback 0 = Deckblatt oder Bilanzbestand, 1-3 = gewichtete Stueckzahlen, 4 = Issued. Der Anteil je Fallback
 *     wird gezaehlt (Auftrag §1b a).
 *   - rohSchluss[z]: UNBEREINIGTER Schlusskurs der Panelzeile z = sicht.zeileAm(sym) am Signaltag. Eine Preisaussage nimmt den
 *     Rohkurs, nie den bereinigten Schluss (Fehlerform "Bereinigte Kurse messen den Cent-Boden falsch", Auftrag §1b c).
 *   Einheit ln($); hoeher = groesser. Keine Kappung, keine Transformation ausser dem Logarithmus (Auftrag §1a.7).
 *
 * null (nie 0, nie ein Ersatzwert), wenn: keine Panelzeile am Signaltag (z < 0); fundamentalAm null (kein Filing, Tor 456 Tage
 * oder keine CIK - ueber sicht nicht unterscheidbar, wird als ein Grund gezaehlt); roh.aktien fehlt, nicht endlich oder <= 0;
 * rohSchluss[z] fehlt, nicht endlich oder <= 0.
 *
 * Bekannte Grenze (Auftrag §1b b): ein Split zwischen filed und t verzerrt den Marktwert um den Split-Faktor. Hier nicht
 * gemessen (kein Zugriff ausserhalb von sicht); der PM prueft ueber die Split-Liste des Panels. Als Hinweis auf die Exposition
 * wird das Alter des Filings am Signaltag (Tage seit filed) aufgezeichnet.
 *
 * Zaehler und Aufzeichnung: zaehlen und notieren nur, aendern nie einen Wert. Sie laufen ueber ALLE Aufrufe der Maschine
 * (Hauptlauf + Kontrollen: Placebo Versatz, Orakel-Lauf - die Maschine ruft werte mehrfach). Die Aufzeichnung haelt je (Tag der
 * Sicht, Symbol) genau einen Eintrag (die Funktion ist deterministisch). Beim Prozessende kommt alles als EINE JSON-Zeile hinter
 * der Marke ###FELDZAEHLER### auf stdout; die beschreibende Auswertung (Quantile, Fallback-Anteile, Klassenmix, Filing-Alter)
 * geschieht ausserhalb der Maschine und ohne zweite Messung.
 */
var zaehler = {
  aufrufe: 0, tagUngleichIso: 0, keineZeile: 0, keinFiling: 0, aktienFehlt: 0, aktienNichtPositiv: 0,
  kursFehlt: 0, kursNichtPositiv: 0, wertNichtEndlich: 0, wert: 0, aktienFallback: {},
};
var aufzeichnung = {};   /* tag -> { sym: [wert, klasse, aktienFallback, filedAlterTage] } */

function alterTage(tag, filed) {
  if (typeof filed !== 'string') return null;
  var d = (Date.parse(tag) - Date.parse(filed)) / 864e5;
  return isFinite(d) ? Math.round(d) : null;
}

module.exports = {
  feld: 'groesse',
  definition: 'ln(Marktwert in $), Marktwert = roh.aktien (juengstes Filing mit filed < t, Tor 456 Tage) x rohSchluss (unbereinigter Schlusskurs am Signaltag t); hoeher = groesser; Kontrollgroesse, kein Signal',
  quellen: ['Panel querschnitt-pruefstand-2026-09-13/panel/v2', 'Fundamentaltafel fundamentaltafel-2026-09-16/v1'],
  zaehler: zaehler,
  werte: function (sym, tag, sicht) {
    zaehler.aufrufe++;
    if (tag !== sicht.iso) zaehler.tagUngleichIso++;
    var z = sicht.zeileAm(sym);                                  /* Panelzeile am Signaltag; -1 = keine */
    if (z < 0) { zaehler.keineZeile++; return null; }
    var f = sicht.fundamentalAm(sym, sicht.iso);                 /* genau ein Bilanzzugriff je Aufruf, Datum = Tag der Sicht */
    if (!f) { zaehler.keinFiling++; return null; }
    var aktien = f.roh ? f.roh.aktien : null;
    if (typeof aktien !== 'number' || !isFinite(aktien)) { zaehler.aktienFehlt++; return null; }
    if (aktien <= 0) { zaehler.aktienNichtPositiv++; return null; }
    var kurs = sicht.felder.rohSchluss[z];
    if (typeof kurs !== 'number' || !isFinite(kurs)) { zaehler.kursFehlt++; return null; }
    if (kurs <= 0) { zaehler.kursNichtPositiv++; return null; }
    var w = Math.log(aktien * kurs);
    if (!isFinite(w)) { zaehler.wertNichtEndlich++; return null; }
    zaehler.wert++;
    var fb = (f.marken && f.marken.aktienFallback !== undefined && f.marken.aktienFallback !== null) ? String(f.marken.aktienFallback) : 'unbekannt';
    zaehler.aktienFallback[fb] = (zaehler.aktienFallback[fb] || 0) + 1;
    var a = aufzeichnung[sicht.iso] || (aufzeichnung[sicht.iso] = {});
    a[sym] = [w, sicht.felder.klasse[z], fb, alterTage(sicht.iso, f.filed)];
    return w;
  },
};

process.on('exit', function () {
  process.stdout.write('\n###FELDZAEHLER### ' + JSON.stringify({ feld: 'groesse', zaehler: zaehler, aufzeichnung: aufzeichnung }) + '\n');
});

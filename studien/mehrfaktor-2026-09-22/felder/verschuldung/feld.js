'use strict';
/* Feld Nr. 11 VERSCHULDUNG - Kontrollgroesse der Mehrfaktor-Studie (Auftrag Nr. 52 vom 22.09.2026; VORREGISTRIERUNG-KOMBINATION.md
 * §4 Zeile 11, Fassung mit Nachtrag §11). Gewichtet nichts; ein "besser" gibt es nicht - das Dezil oben sind die am staerksten
 * verschuldeten Mitglieder des Universums am Signaltag.
 *
 * Rohgroesse je Symbol am Signaltag t: (roh.vermoegen - roh.eigenkapital) / roh.vermoegen
 *   - Bestaende D0 (Stichtag des Filings) aus sicht.fundamentalAm(sym, sicht.iso) - juengstes 10-K/10-Q mit filed strikt vor t,
 *     Aktualitaets-Tor 456 Tage. Kein Kurs beteiligt; die Panelzeile am Signaltag muss trotzdem existieren (Auftrag §1).
 *   - roh.eigenkapital kommt je Zeile aus Fallback-Tags (marken.eigenkapitalFallback; FUNDAMENTALTAFEL.md §1, Zeile eigenkapital);
 *     der Anteil je Fallback wird gezaehlt (Auftrag §1b).
 *   Einheit Verhaeltnis; hoeher = staerker verschuldet. Negatives Eigenkapital ergibt Werte > 1 - echte Werte, keine Fehler
 *   (Anzahl je Jahr aus der Aufzeichnung). Keine Kappung, keine Transformation (Auftrag §1a.7).
 *   Finanzwerte (SIC 6000-6799, Feld sektor der Tafelzeile) sind strukturell hoch verschuldet: sie werden NICHT ausgeschlossen;
 *   Sektor und SIC werden je Eintrag aufgezeichnet, damit der Klassen-/Sektormix des Dezils oben berichtet werden kann.
 *
 * null (nie 0, nie ein Ersatzwert), wenn: keine Panelzeile am Signaltag (z < 0); fundamentalAm null (kein Filing, Tor 456 Tage
 * oder keine CIK - ueber sicht nicht unterscheidbar, wird als ein Grund gezaehlt); roh.vermoegen fehlt, nicht endlich oder <= 0;
 * roh.eigenkapital fehlt oder nicht endlich (ein ausgewiesenes 0 ist ein Wert: Verschuldung 1).
 *
 * Zaehler und Aufzeichnung: zaehlen und notieren nur, aendern nie einen Wert. Sie laufen ueber ALLE Aufrufe der Maschine
 * (Hauptlauf + Kontrollen: Placebo Versatz, Orakel-Lauf - die Maschine ruft werte mehrfach). Die Aufzeichnung haelt je (Tag der
 * Sicht, Symbol) genau einen Eintrag (die Funktion ist deterministisch). Beim Prozessende kommt alles als EINE JSON-Zeile hinter
 * der Marke ###FELDZAEHLER### auf stdout; die beschreibende Auswertung (Quantile, Fallback-Anteile, Sektor-/Klassenmix,
 * negatives Eigenkapital je Jahr, Filing-Alter) geschieht ausserhalb der Maschine und ohne zweite Messung.
 */
var zaehler = {
  aufrufe: 0, tagUngleichIso: 0, keineZeile: 0, keinFiling: 0, vermoegenFehlt: 0, vermoegenNichtPositiv: 0,
  eigenkapitalFehlt: 0, wertNichtEndlich: 0, wert: 0, eigenkapitalNegativ: 0, eigenkapitalNull: 0, eigenkapitalFallback: {},
};
var aufzeichnung = {};   /* tag -> { sym: [wert, klasse, eigenkapitalFallback, sektor, sic, filedAlterTage] } */

function alterTage(tag, filed) {
  if (typeof filed !== 'string') return null;
  var d = (Date.parse(tag) - Date.parse(filed)) / 864e5;
  return isFinite(d) ? Math.round(d) : null;
}

module.exports = {
  feld: 'verschuldung',
  definition: '(roh.vermoegen - roh.eigenkapital) / roh.vermoegen aus dem juengsten Filing mit filed < t (Bestaende D0, Tor 456 Tage); Verhaeltnis, hoeher = staerker verschuldet (Werte > 1 bei negativem Eigenkapital sind echte Werte); Kontrollgroesse, kein Signal',
  quellen: ['Panel querschnitt-pruefstand-2026-09-13/panel/v2', 'Fundamentaltafel fundamentaltafel-2026-09-16/v1'],
  zaehler: zaehler,
  werte: function (sym, tag, sicht) {
    zaehler.aufrufe++;
    if (tag !== sicht.iso) zaehler.tagUngleichIso++;
    var z = sicht.zeileAm(sym);                                  /* Panelzeile am Signaltag; -1 = keine */
    if (z < 0) { zaehler.keineZeile++; return null; }
    var f = sicht.fundamentalAm(sym, sicht.iso);                 /* genau ein Bilanzzugriff je Aufruf, Datum = Tag der Sicht */
    if (!f) { zaehler.keinFiling++; return null; }
    var v = f.roh ? f.roh.vermoegen : null, e = f.roh ? f.roh.eigenkapital : null;
    if (typeof v !== 'number' || !isFinite(v)) { zaehler.vermoegenFehlt++; return null; }
    if (v <= 0) { zaehler.vermoegenNichtPositiv++; return null; }
    if (typeof e !== 'number' || !isFinite(e)) { zaehler.eigenkapitalFehlt++; return null; }
    var w = (v - e) / v;
    if (!isFinite(w)) { zaehler.wertNichtEndlich++; return null; }
    zaehler.wert++;
    if (e < 0) zaehler.eigenkapitalNegativ++; else if (e === 0) zaehler.eigenkapitalNull++;
    var fb = (f.marken && f.marken.eigenkapitalFallback !== undefined && f.marken.eigenkapitalFallback !== null) ? String(f.marken.eigenkapitalFallback) : 'unbekannt';
    zaehler.eigenkapitalFallback[fb] = (zaehler.eigenkapitalFallback[fb] || 0) + 1;
    var a = aufzeichnung[sicht.iso] || (aufzeichnung[sicht.iso] = {});
    a[sym] = [w, sicht.felder.klasse[z], fb, f.sektor === undefined ? null : f.sektor, f.sic === undefined ? null : f.sic, alterTage(sicht.iso, f.filed)];
    return w;
  },
};

process.on('exit', function () {
  process.stdout.write('\n###FELDZAEHLER### ' + JSON.stringify({ feld: 'verschuldung', zaehler: zaehler, aufzeichnung: aufzeichnung }) + '\n');
});

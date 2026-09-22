'use strict';
/* Feld 7 `investition` der Mehrfaktor-Studie (Auftrag Nr. 55, 22.09.2026; VORREGISTRIERUNG-KOMBINATION.md §4 Zeile 7 in der
 * Fassung mit Nachtrag §11 (1)). Maschine: zelle.js (mehrfaktor-2026-09-22/zelle/v1), benutzt, nicht geaendert.
 *
 * Rohgroesse je Symbol am Signaltag t:  -100 * (roh.vermoegen / vermoegenVor - 1)  in Pp
 *   = Vermoegenswachstum ueber vier Quartale, GEDREHT: wer wenig investiert, steht oben (+30 % Wachstum => Rohwert -30;
 *     Schrumpfung => Rohwert positiv, Dezil oben). Keine Jahresrate, kein x4 (Assets ist ein Bestand, qtrs 0), keine Kappung,
 *     kein Log, keine Transformation.
 *
 * Tafelfelder (FUNDAMENTALTAFEL.md §1 "Ablage"), gelesen ueber f = sicht.fundamentalAm(sym, sicht.iso) - das juengste 10-K/10-Q
 * mit filed STRIKT VOR dem Signaltag, Aktualitaets-Tor 456 Tage im Leser, sonst null:
 *   f.roh.vermoegen   Assets am Stichtag D0 = period des Filings (Bestand)
 *   f.vermoegenVor    ZEILENFELD der Tafel (nicht f.roh.vermoegenVor - das gibt es nicht): Assets am Stichtag D4 = vier Quartale
 *                     vor D0, wie zum Rang des Filings bekannt ("erste Veroeffentlichung gilt", Neudarstellungen nicht enthalten)
 *
 * null (nie 0, nie ein Ersatzwert), wenn: keine Panelzeile am Signaltag (z < 0), kein Filing (fundamentalAm null),
 * roh.vermoegen null oder <= 0, vermoegenVor null oder <= 0, Ergebnis nicht endlich.
 *
 * Zaehler Z: zaehlen nur die Null-Gruende, aendern keinen Wert. Sie laufen ueber ALLE Aufrufe der Maschine (Hauptlauf + Kontrollen:
 * Placebo Versatz, Orakel-Lauf) und werden am Prozessende auf stderr geschrieben - so in ERGEBNIS.md auszuweisen.
 *
 *   cd studien/mehrfaktor-2026-09-22 && node --max-old-space-size=6144 zelle.js --feld felder/investition/feld.js
 *
 * Liest NUR ueber `sicht`. Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var Z = { aufrufe: 0, wert: 0, keineZeile: 0, keinFiling: 0, vermoegenFehlt: 0, vermoegenNichtPositiv: 0,
  vorFehlt: 0, vorNichtPositiv: 0, nichtEndlich: 0, tagUngleichIso: 0 };

module.exports = {
  feld: 'investition',
  definition: '-100 * (roh.vermoegen / vermoegenVor - 1) in Pp: Vermoegenswachstum ueber vier Quartale (Assets am Stichtag D0 gegen Assets am Stichtag D4 = vier Quartale davor, Zeilenfeld vermoegenVor) aus dem juengsten 10-K/10-Q mit filed vor dem Signaltag, gedreht - hoeher = weniger Vermoegenswachstum = besser; null, wenn Filing fehlt oder ein Bestand fehlt oder <= 0 ist',
  quellen: ['Panel querschnitt-pruefstand-2026-09-13/panel/v2', 'Fundamentaltafel fundamentaltafel-2026-09-16/v1'],
  werte: function (sym, tag, sicht) {                          /* sym: Kuerzel, tag: ISO-Datum des Signaltags, sicht: Pruefstand-Sicht */
    Z.aufrufe++;
    if (tag !== sicht.iso) Z.tagUngleichIso++;                 /* nur Diagnose; gelesen wird immer mit sicht.iso (Auftrag §1a.6) */
    var z = sicht.zeileAm(sym);                                /* Panelzeile am Signaltag; -1 = keine Zeile => null */
    if (z < 0) { Z.keineZeile++; return null; }
    var f = sicht.fundamentalAm(sym, sicht.iso);               /* hoechstens EIN Tafelzugriff je Aufruf, nie period, nie anderes Datum */
    if (!f) { Z.keinFiling++; return null; }
    var v0 = f.roh ? f.roh.vermoegen : null;                   /* Assets D0 (Bestand) */
    var v4 = f.vermoegenVor;                                   /* Assets D4, Zeilenfeld */
    if (typeof v0 !== 'number' || !isFinite(v0)) { Z.vermoegenFehlt++; return null; }
    if (!(v0 > 0)) { Z.vermoegenNichtPositiv++; return null; }
    if (typeof v4 !== 'number' || !isFinite(v4)) { Z.vorFehlt++; return null; }
    if (!(v4 > 0)) { Z.vorNichtPositiv++; return null; }
    var w = -100 * (v0 / v4 - 1);
    if (!isFinite(w)) { Z.nichtEndlich++; return null; }
    Z.wert++;
    return w;
  },
};

process.on('exit', function () {
  process.stderr.write('[investition] Zaehler ueber alle Aufrufe der Maschine (Hauptlauf + Kontrollen): ' + JSON.stringify(Z) + '\n');
});

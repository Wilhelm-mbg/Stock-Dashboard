'use strict';
/* Feld 5 der Mehrfaktor-Studie (Auftrag Nr. 53, 22.09.2026; Vorregistrierung §4 Zeile 5, Fassung mit Nachtrag §11):
 * Bewertung B/M = Buchwert des Eigenkapitals / Marktwert. Hoeher = billiger = besser (Dezil oben wird gekauft).
 *
 *   B/M = roh.eigenkapital / (roh.aktien * rohSchluss[z])
 *
 * Tafel (ein Aufruf sicht.fundamentalAm(sym, sicht.iso) je Symbol = juengstes 10-K/10-Q mit filed STRIKT vor dem Signaltag,
 * Aktualitaets-Tor 456 Tage, sonst null):
 *   roh.eigenkapital  Bestand D0 des Filings (StockholdersEquity; Fallbacks marken.eigenkapitalFallback 1..3)
 *   roh.aktien        Aktienzahl DESSELBEN Filings (marken.aktienFallback 0 Deckblatt/Bilanzbestand, 1..3 gewichtete Stueckzahlen, 4 Issued)
 * Panel: z = sicht.zeileAm(sym), Kurs = sicht.felder.rohSchluss[z] - der UNBEREINIGTE Schluss am Signaltag, weil der Marktwert eine
 * Preisaussage ist (Fehlerform "Bereinigte Kurse messen den Cent-Boden falsch"); bSchluss waere hier falsch.
 *
 * null (nie 0, nie Ersatz) bei: keine Panelzeile (z < 0), kein Filing, eigenkapital nicht ausgewiesen, aktien fehlend oder <= 0,
 * rohSchluss <= 0. Negatives Eigenkapital ist ein WERT (negatives B/M, sortiert sich ins unterste Dezil), kein Fehler - gezaehlt.
 * Bekannte Grenze (nur benannt): ein Split zwischen filed und t verzerrt den Marktwert um den Split-Faktor; das prueft der PM ueber
 * die Split-Liste des Panels, nicht dieses Modul.
 *
 * Zaehler: sie zaehlen nur und aendern keinen Wert. Die Maschine ruft werte mehrfach (Hauptlauf an den Signaltagen, Placebo Versatz
 * an den Tagen t+21 mit eigener sicht.iso), darum wird je Aufruf-Tag gezaehlt; beim Prozessende geht alles als EINE JSON-Zeile
 * "ZAEHLER-BEWERTUNG {...}" auf stderr (kein fs im Modul). ERGEBNIS.md weist sie als Zaehler ueber alle Aufrufe der Maschine aus.
 * sektorJeSym merkt sich nur das Feld `sektor` der gelesenen Tafelzeile (fuer den Sektormix-Bericht), ebenfalls ohne Einfluss.
 *
 *   cd studien/mehrfaktor-2026-09-22 && node --max-old-space-size=6144 zelle.js --feld felder/bewertung/feld.js
 *
 * NUR LESEN. Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var Z = { jeTag: {}, sektorJeSym: {} };

function zaehler(tag) {
  return Z.jeTag[tag] || (Z.jeTag[tag] = { aufrufe: 0, mitWert: 0, negativ: 0,
    nullGrund: { keineZeile: 0, keinFiling: 0, eigenkapital: 0, aktien: 0, kurs: 0, nichtEndlich: 0 },
    eigenkapitalFallback: {}, aktienFallback: {} });
}
function plus(o, k) { k = String(k); o[k] = (o[k] || 0) + 1; }

module.exports = {
  feld: 'bewertung',
  definition: 'B/M = roh.eigenkapital (Bestand D0 des juengsten 10-K/10-Q mit filed < t, Tor 456 Tage) / (roh.aktien desselben Filings x rohSchluss(t), unbereinigt); Verhaeltnis, hoeher = billiger = besser; negatives Eigenkapital ist ein Wert; null bei fehlender Groesse, aktien <= 0 oder rohSchluss <= 0',
  quellen: ['Panel querschnitt-pruefstand-2026-09-13/panel/v2', 'Fundamentaltafel fundamentaltafel-2026-09-16/v1'],
  werte: function (sym, tag, sicht) {
    var c = zaehler(tag); c.aufrufe++;
    var z = sicht.zeileAm(sym);                                  /* Panelzeile am Tag der Sicht; -1 = keine */
    if (z < 0) { c.nullGrund.keineZeile++; return null; }
    var f = sicht.fundamentalAm(sym, sicht.iso);                 /* genau ein Bilanzzugriff, Tag = sicht.iso */
    if (!f) { c.nullGrund.keinFiling++; return null; }
    if (f.sektor !== undefined && Z.sektorJeSym[sym] === undefined) Z.sektorJeSym[sym] = f.sektor;
    var roh = f.roh || {}, m = f.marken || {};
    var ek = roh.eigenkapital, ak = roh.aktien, kurs = sicht.felder.rohSchluss[z];
    if (typeof ek !== 'number' || !isFinite(ek)) { c.nullGrund.eigenkapital++; return null; }
    if (typeof ak !== 'number' || !(ak > 0)) { c.nullGrund.aktien++; return null; }
    if (typeof kurs !== 'number' || !(kurs > 0)) { c.nullGrund.kurs++; return null; }
    var w = ek / (ak * kurs);
    if (!isFinite(w)) { c.nullGrund.nichtEndlich++; return null; }
    c.mitWert++; if (w < 0) c.negativ++;
    plus(c.eigenkapitalFallback, m.eigenkapitalFallback); plus(c.aktienFallback, m.aktienFallback);
    return w;
  },
};

process.on('exit', function () { process.stderr.write('ZAEHLER-BEWERTUNG ' + JSON.stringify(Z) + '\n'); });

'use strict';
/* Nachrichtliche Zelle zu Feld 5 (Auftrag Nr. 53, 22.09.2026; Vorregistrierung §4 Zeile 5, Entscheid §9 (4): NICHT gewichtet):
 * E/P = Nettoergebnis der letzten vier Quartale / Marktwert. Hoeher = besser. Negatives Netto ist ein Wert.
 *
 *   E/P = summe4q.netto / (roh.aktien * rohSchluss[z])
 *
 * Tafel (ein Aufruf sicht.fundamentalAm(sym, sicht.iso) je Symbol, juengstes Filing mit filed strikt vor dem Signaltag, Tor 456 Tage):
 *   summe4q.netto  Summe der Quartale D0..D3 des Filings; die Tafel traegt null, sobald ein Quartal fehlt
 *   roh.aktien     Aktienzahl desselben Filings - derselbe Marktwert wie in feld.js (gleiche drei Zeilen)
 * Panel: z = sicht.zeileAm(sym), Kurs = sicht.felder.rohSchluss[z] (unbereinigt, Preisaussage).
 *
 * null bei: keine Panelzeile, kein Filing, summe4q.netto null, aktien fehlend oder <= 0, rohSchluss <= 0. Nie 0 als Ersatz.
 * Zaehler wie in feld.js: nur zaehlen, je Aufruf-Tag, eine JSON-Zeile "ZAEHLER-BEWERTUNG-EP {...}" auf stderr beim Prozessende.
 *
 *   cd studien/mehrfaktor-2026-09-22 && node --max-old-space-size=6144 zelle.js --feld felder/bewertung/feld-ep.js
 *
 * NUR LESEN. Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var Z = { jeTag: {}, sektorJeSym: {} };

function zaehler(tag) {
  return Z.jeTag[tag] || (Z.jeTag[tag] = { aufrufe: 0, mitWert: 0, negativ: 0,
    nullGrund: { keineZeile: 0, keinFiling: 0, netto4q: 0, aktien: 0, kurs: 0, nichtEndlich: 0 },
    nettoFallback: {}, aktienFallback: {} });
}
function plus(o, k) { k = String(k); o[k] = (o[k] || 0) + 1; }

module.exports = {
  feld: 'bewertung-ep',
  definition: 'E/P = summe4q.netto (Nettoergebnis der vier Quartale D0..D3 des juengsten 10-K/10-Q mit filed < t, Tor 456 Tage; null wenn ein Quartal fehlt) / (roh.aktien desselben Filings x rohSchluss(t), unbereinigt); Verhaeltnis, hoeher = besser; negatives Netto ist ein Wert; nachrichtlich, nicht gewichtet',
  quellen: ['Panel querschnitt-pruefstand-2026-09-13/panel/v2', 'Fundamentaltafel fundamentaltafel-2026-09-16/v1'],
  werte: function (sym, tag, sicht) {
    var c = zaehler(tag); c.aufrufe++;
    var z = sicht.zeileAm(sym);
    if (z < 0) { c.nullGrund.keineZeile++; return null; }
    var f = sicht.fundamentalAm(sym, sicht.iso);                 /* genau ein Bilanzzugriff, Tag = sicht.iso */
    if (!f) { c.nullGrund.keinFiling++; return null; }
    if (f.sektor !== undefined && Z.sektorJeSym[sym] === undefined) Z.sektorJeSym[sym] = f.sektor;
    var roh = f.roh || {}, s4 = f.summe4q || {}, m = f.marken || {};
    var netto = s4.netto, ak = roh.aktien, kurs = sicht.felder.rohSchluss[z];
    if (typeof netto !== 'number' || !isFinite(netto)) { c.nullGrund.netto4q++; return null; }
    if (typeof ak !== 'number' || !(ak > 0)) { c.nullGrund.aktien++; return null; }
    if (typeof kurs !== 'number' || !(kurs > 0)) { c.nullGrund.kurs++; return null; }
    var w = netto / (ak * kurs);
    if (!isFinite(w)) { c.nullGrund.nichtEndlich++; return null; }
    c.mitWert++; if (w < 0) c.negativ++;
    plus(c.nettoFallback, m.nettoFallback); plus(c.aktienFallback, m.aktienFallback);
    return w;
  },
};

process.on('exit', function () { process.stderr.write('ZAEHLER-BEWERTUNG-EP ' + JSON.stringify(Z) + '\n'); });

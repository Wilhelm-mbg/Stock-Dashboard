'use strict';
/* Feld `momentum` - Nr. 1 der Feldseite, Rolle Signal (Gewicht 1). Mehrfaktor-Studie, Auftrag Nr. 49 (22.09.2026).
 *
 * Rohgroesse je Symbol am Signaltag t (Vorregistrierung §4 Zeile 1, Fassung mit Nachtrag §11; woertlich der Beispielaufruf im
 * Kopf von zelle.js, Zeilen 27-31):
 *
 *   100 * (bSchluss[zurueck(z, 21)] / bSchluss[zurueck(z, 252)] - 1)   in Pp, hoeher = besser
 *
 * Gelesen wird NUR ueber `sicht` (AUFTRAG-VORLAGE-FELD.md §1 "Erlaubte Zugriffe"):
 *   sicht.zeileAm(sym)       Panelzeile des Symbols am Signaltag t (-1 = keine Zeile)
 *   sicht.zurueck(z, k)      k-te Panelzeile der Reihe VOR z (-1 = Reihe zu kurz)
 *   sicht.felder.bSchluss    bereinigter Schlusskurs (Renditen mit bSchluss, nie rohSchluss)
 * Die 21 Zeilen vor t lassen den juengsten Monat aus (12-1-Momentum, Jegadeesh/Titman 1993); die 252. Zeile vor t ist das
 * Jahr davor. Wert fehlt (null, nie 0, nie Ersatz): z < 0, zurueck(z, 21) < 0, zurueck(z, 252) < 0, bSchluss[zB] <= 0 oder
 * Ergebnis nicht endlich. Das Universum verlangt 250 Vortage; die 252. Zeile fehlt darum nur jungen Reihen - wird gezaehlt.
 *
 * ZAEHLER: zaehlen nur, aendern keinen Wert. Sie laufen ueber ALLE Aufrufe der Maschine (Hauptlauf + Placebo Versatz + Orakel-Lauf
 * + weitere Kontrollen) und werden beim Prozessende auf stderr geschrieben (Auftrag §1a.6). Kein Modul ausser `path` (unbenutzt).
 *
 * Simulation mit virtuellem Kapital, keine Anlageberatung. */
var Z = { aufrufe: 0, keineZeile: 0, fehlt21: 0, fehlt252: 0, basisNichtPositiv: 0, nichtEndlich: 0, wert: 0 };

module.exports = {
  feld: 'momentum',
  definition: '100 * (bSchluss(21 Panelzeilen vor t) / bSchluss(252 Panelzeilen vor t) - 1) in Pp; hoeher = besser (12-1-Momentum)',
  quellen: ['Panel querschnitt-pruefstand-2026-09-13/panel/v2 (v2.1), Spalte bSchluss'],
  werte: function (sym, tag, sicht) {                          /* sym: Kuerzel, tag: ISO-Datum des Signaltags, sicht: Pruefstand-Sicht */
    Z.aufrufe++;
    var z = sicht.zeileAm(sym); if (z < 0) { Z.keineZeile++; return null; }   /* Panelzeile des Symbols am Signaltag */
    var g = sicht.felder, zA = sicht.zurueck(z, 21), zB = sicht.zurueck(z, 252);
    var w = (zA >= 0 && zB >= 0 && g.bSchluss[zB] > 0) ? 100 * (g.bSchluss[zA] / g.bSchluss[zB] - 1) : null;
    if (zA < 0) Z.fehlt21++; else if (zB < 0) Z.fehlt252++; else if (!(g.bSchluss[zB] > 0)) Z.basisNichtPositiv++;
    if (w !== null && !isFinite(w)) { Z.nichtEndlich++; return null; }
    if (w !== null) Z.wert++;
    return w;
  },
};

process.on('exit', function () {
  process.stderr.write('feld momentum - Zaehler ueber alle Aufrufe der Maschine: ' + JSON.stringify(Z) +
    ' rssMB=' + Math.round(process.memoryUsage().rss / 1048576) + '\n');
});

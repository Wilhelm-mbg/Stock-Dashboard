'use strict';
/* FELD umkehr (Nr. 2 der Feldseite) - Kurzfrist-Umkehr, Mehrfaktor-Studie 22.09.2026 (Auftrag Nr. 50; VORREGISTRIERUNG-KOMBINATION.md
 * §4 Zeile 2 in der Fassung mit Nachtrag §11; Rolle: Kostenfrage, nicht gewichtet, wird nicht kombiniert - §5).
 *
 * Rohgroesse je Symbol am Signaltag t:   -100 * (bSchluss[z] / bSchluss[zurueck(z, 21)] - 1)   in Pp, gedreht:
 * die Verlierer des letzten Monats stehen oben (hoeher = besser). z = Panelzeile des Symbols AM Signaltag t (der Schluss von t ist
 * bekannt; ausgefuehrt wird zur Eroeffnung des naechsten Handelstags - Konvention der Maschine). zurueck(z, 21) = die 21. Zeile der
 * Reihe vor z. Tafelfelder: nur sicht.felder.bSchluss (bereinigter Schluss - eine Rendite, keine Preisaussage).
 *
 * Luecken (null, nie 0, nie ein Ersatzwert): keine Zeile am Signaltag (z < 0); keine 21. Vorzeile (zurueck < 0, Reihe zu kurz);
 * Nenner bSchluss[zurueck] <= 0 oder nicht vorhanden; nicht endlicher Wert (Lochkerze im Zaehler). Erwartete Abdeckung ~ 100 %,
 * weil das Universum 250 Vortage verlangt.
 *
 * Zaehler: sie zaehlen nur und aendern keinen Wert. Sie laufen ueber ALLE Aufrufe der Maschine (Hauptlauf + Kontrollen: Placebo
 * Versatz, Orakel-Lauf, Placebo Symbole) und werden beim Prozessende auf stderr geschrieben - also nicht mit der Abdeckung der
 * Zelle verwechseln, die steht im Bericht der Maschine.
 *
 *   cd studien/mehrfaktor-2026-09-22 && node --max-old-space-size=6144 zelle.js --feld felder/umkehr/feld.js
 *
 * Liest NUR ueber `sicht`. Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var zaehler = { aufrufe: 0, ohneZeile: 0, ohneVorzeile: 0, nennerNichtPositiv: 0, nichtEndlich: 0, werte: 0 };

module.exports = {
  feld: 'umkehr',
  definition: '-100 * (bSchluss(t) / bSchluss(21 Panelzeilen vor t) - 1) in Pp, gedreht (Verlierer des letzten Monats oben); null bei fehlender Zeile am Signaltag, fehlender 21. Vorzeile oder Nenner <= 0',
  quellen: ['Panel querschnitt-pruefstand-2026-09-13/panel/v2'],
  zaehler: zaehler,                                            /* nur zum Ablesen (Vorzeichen-Probe, Prozessende) */
  werte: function (sym, tag, sicht) {                          /* sym: Kuerzel, tag: ISO-Datum des Signaltags, sicht: Pruefstand-Sicht */
    zaehler.aufrufe++;
    var z = sicht.zeileAm(sym);                                /* Panelzeile am Signaltag; -1 = keine Zeile => null */
    if (z < 0) { zaehler.ohneZeile++; return null; }
    var zV = sicht.zurueck(z, 21);                             /* 21. Zeile der Reihe vor z; -1 = Reihe zu kurz => null */
    if (zV < 0) { zaehler.ohneVorzeile++; return null; }
    var s = sicht.felder.bSchluss, nenner = s[zV];
    if (!(nenner > 0)) { zaehler.nennerNichtPositiv++; return null; }   /* faengt <= 0, null, undefined und NaN */
    var w = -100 * (s[z] / nenner - 1);
    if (!isFinite(w)) { zaehler.nichtEndlich++; return null; }
    zaehler.werte++;
    return w;
  },
};

process.on('exit', function () {
  process.stderr.write('feld umkehr - Zaehler ueber alle Aufrufe der Maschine (Hauptlauf + Kontrollen): ' + JSON.stringify(zaehler) + '\n');
});

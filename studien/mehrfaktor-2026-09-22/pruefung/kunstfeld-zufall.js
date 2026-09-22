'use strict';
/* MUSTER eines Feldmoduls fuer die Maschine (AUFTRAG-VORLAGE-FELD.md §2) - hier ein KUNSTFELD: Zufallszahl je Symbol und Signaltag.
 * Ein echtes Feld liest die Rohgroesse NUR ueber `sicht` (Kurse: sicht.zeileAm, sicht.zurueck, sicht.felder; Bilanz:
 * sicht.fundamentalAm) und liefert eine endliche Zahl oder null - nie 0 als Ersatz fuer "fehlt".
 *
 *   node --max-old-space-size=6144 zelle.js --feld pruefung/kunstfeld-zufall.js --ziel pruefung/zellen
 */
var path = require('path');
var ST = require(path.join(__dirname, '..', '..', 'querschnitt-pruefstand-2026-09-13', 'statistik.js'));

module.exports = {
  feld: 'kunst-zufall-modul',                                  /* Dateiname der Zelle: a-z, 0-9, Bindestrich */
  kunst: 'zufall',                                             /* nur bei Kunstfeldern; ein echtes Feld laesst das weg */
  definition: 'Zufallszahl je Symbol und Signaltag aus einem festen Generator (Kunstfeld, kein Kursbezug)',
  quellen: ['keine - Kunstfeld'],
  werte: function (sym, tag, sicht) {                          /* sym: Kuerzel, tag: ISO-Datum des Signaltags, sicht: Pruefstand-Sicht */
    var z = sicht.zeileAm(sym);                                /* Panelzeile am Signaltag; -1 = keine Zeile => null */
    if (z < 0) return null;
    return ST.mulberry32(ST.fnv('kunstfeld-modul|' + sym + '|' + tag))();
  },
};

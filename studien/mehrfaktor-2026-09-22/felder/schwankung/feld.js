'use strict';
/* Feld 3 der Mehrfaktor-Studie: niedrige Schwankung (`schwankung`) - Auftrag Nr. 51 (22.09.2026), Vorregistrierung §4 Zeile 3
 * (Fassung mit Nachtrag §11). Rolle: Signal, Gewicht 1.
 *
 * Rohgroesse je Symbol am Signaltag t: -sd(rendite) ueber die 252 Panelzeilen z, zurueck(z,1) ... zurueck(z,251) mit
 * z = sicht.zeileAm(sym) (Kurse bis einschliesslich Signaltag). Stichproben-sd, Nenner n-1 = 251. Gedreht (Vorzeichen -):
 * die ruhigsten Reihen stehen oben (sd 1 Pp -> -1 liegt ueber sd 4 Pp -> -4). Einheit = Einheit der Panel-Spalte `rendite`
 * (Pp = 100 * (Schluss/Vorschluss - 1), Float32 im Panel; Summen hier in doppelter Genauigkeit).
 *
 * null (nie 0, nie Ersatzwert, kein Fenster mit weniger als 252 Werten): keine Panelzeile am Signaltag (z < 0), eine der 252
 * Zeilen fehlt (zurueck < 0, junge Reihe), eine ihrer Renditen ist nicht endlich (NaN an der ersten Zeile einer Reihe).
 *
 * Zugriffe nur ueber `sicht`: zeileAm, zurueck, felder.rendite. Die Schleife ist fest gefenstert ueber k = 0..251 - nie ueber
 * die ganze Reihe (Fehlerform "Praefix-Aufruf ist quadratisch"). Rechnung in zwei Durchlaeufen ueber ein lokales Feld: Mittel,
 * dann Summe der quadrierten Abweichungen (numerisch sauberer als Summe/Quadratsumme, gleich gefenstert). Kein Rang, kein Dezil,
 * keine Statistik - das ist die Maschine (zelle.js).
 *
 * Zaehler zaehlen nur und aendern keinen Wert. Sie laufen ueber ALLE Aufrufe der Maschine (Hauptlauf + Kontrollen: Placebo
 * Versatz, Orakel-Lauf) und werden am Prozessende einmal auf stderr ausgegeben, damit ERGEBNIS.md sie ausweisen kann.
 *
 * NUR LESEN. Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var N = 252;                                                    /* Fensterlaenge: z und 251 Zeilen davor */
var puffer = new Float64Array(N);                               /* die 252 Renditen des aktuellen Aufrufs */
var zaehler = { aufrufe: 0, werte: 0, keineZeile: 0, fensterUnvollstaendig: 0, renditeNichtEndlich: 0 };

module.exports = {
  feld: 'schwankung',
  definition: '-sd(rendite) ueber die 252 Panelzeilen z, zurueck(z,1) .. zurueck(z,251) bis einschliesslich Signaltag '
    + '(Stichproben-sd, Nenner 251), gedreht: hoeher = ruhiger; Einheit Pp der Panel-Spalte rendite; '
    + 'null bei fehlender Zeile am Signaltag, unvollstaendigem Fenster oder nicht endlicher Rendite',
  quellen: ['Panel querschnitt-pruefstand-2026-09-13/panel/v2'],
  zaehler: zaehler,
  werte: function (sym, tag, sicht) {                           /* sym: Kuerzel, tag: ISO des Signaltags, sicht: Pruefstand-Sicht */
    zaehler.aufrufe++;
    var z = sicht.zeileAm(sym);                                 /* Panelzeile am Signaltag; -1 = keine */
    if (z < 0) { zaehler.keineZeile++; return null; }
    var r = sicht.felder.rendite, summe = 0, k, zk, v;
    for (k = 0; k < N; k++) {                                   /* fest gefenstert: z, dann 251 Zeilen zurueck */
      zk = k === 0 ? z : sicht.zurueck(z, k);
      if (zk < 0) { zaehler.fensterUnvollstaendig++; return null; }
      v = r[zk];
      if (!isFinite(v)) { zaehler.renditeNichtEndlich++; return null; }
      puffer[k] = v; summe += v;
    }
    var mittel = summe / N, q = 0, d;
    for (k = 0; k < N; k++) { d = puffer[k] - mittel; q += d * d; }
    var w = -Math.sqrt(q / (N - 1));                            /* gedreht: ruhig = hoch */
    if (!isFinite(w)) return null;                              /* Sicherheit; bei 252 endlichen Werten unerreichbar */
    zaehler.werte++;
    return w;
  },
};

process.on('exit', function () {                                /* nur Zaehler, kein Wert, keine Datei */
  process.stderr.write('schwankung Zaehler (alle Aufrufe der Maschine): ' + JSON.stringify(zaehler) + '\n');
});

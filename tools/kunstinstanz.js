'use strict';
/* ================= Kunstdaten in eine ISOLIERTE Instanz saeen =================
 *
 * Drei Sonden brauchen dieselbe gefuellte Instanz: tools/ui-aufnahmen.js
 * (fotografiert), tools/ui-struktur.js (schreibt das Inventar) und
 * tools/a11y-probe.js --kunstdaten (misst Kontrast und Semantik). Bis zum
 * 04.09.2026 stand das Saeen nur in ui-aufnahmen.js; die a11y-Sonde lief ohne und
 * hat deshalb auf Markt -> Ueberblick 68 Textstellen geprueft statt der 3.960
 * Zeichen, die dort mit Inhalt stehen (QS-Fund F12, uebergabe/ui-qs-2026-09-04.md).
 *
 * DER GRUND FUER EIN EIGENES MODUL ist nicht die Zeilenzahl, sondern die
 * Vergleichbarkeit: sobald zwei Sonden ihre eigene Kopie des Saeens tragen, driften
 * sie, und dann zeigt die Aufnahme einen anderen Zustand als die Messung daneben -
 * ohne dass es jemandem auffaellt.
 *
 * Geschrieben wird AUSSCHLIESSLICH unter das uebergebene Wegwerf-Verzeichnis
 * (%TEMP%). Der Store des Nutzers, sein Datenordner und die installierte App werden
 * nie beruehrt. Die Zahlen sind ERFUNDEN und als solche benannt (tools/kunstdepot.js).
 *
 *   const KI = require('./kunstinstanz.js');
 *   KI.saeen(TESTROOT);            // vor dem require von main.js aufrufen
 */
const path = require('path');
const fs = require('fs');

/* testroot: das frische Wurzelverzeichnis unter %TEMP%, dessen Unterordner
 * 'userdata' und 'downloads' vorher per app.setPath gesetzt wurden. */
function saeen(testroot, jetzt) {
  jetzt = jetzt || Date.now();
  const KD = require(path.join(__dirname, 'kunstdepot.js'));
  const sd = path.join(testroot, 'userdata', 'store');
  fs.mkdirSync(sd, { recursive: true });
  fs.writeFileSync(path.join(sd, 'depot.json'), JSON.stringify(KD.bauen(jetzt)));
  /* Die Kostenrunden wohnen in einem EIGENEN Store neben dem Depot. Sie in
   * depot.json zu legen genuegt nicht: der dort vorgesehene Uebernahmeweg laeuft
   * beim Start ins Leere (siehe Uebergabe oberflaeche-stufe2, Befund 2). */
  fs.writeFileSync(path.join(sd, 'kostenmessung.json'), JSON.stringify(KD.kostenmessung(jetzt)));
  /* Der Reiter Markt (Stufe 5) haengt an drei Quellen. Zwei davon sind Dateien und
   * werden hier gelegt: die Stammdaten (Branche, Aktienanzahl) und Tagesreihen im
   * Tagesarchiv. Die dritte sind LAUFENDE Kurse - die gibt es ohne Netz nicht, und
   * eine Testinstanz soll auch keins bekommen. Deshalb kommt zusaetzlich der
   * gemerkte Stand in den Store, denselben Schluessel, den marktui.js schreibt.
   * Gerechnet ist er mit den echten Funktionen aus markt/uebersicht.js. */
  fs.writeFileSync(path.join(sd, 'marktUeberblickStand.json'), JSON.stringify(KD.marktstand(jetzt)));
  /* Und die Schlagzeilen: ohne sie ist das Laufband ausgeblendet (renderTicker
   * blendet ein leeres Band aus), und keine Aufnahme koennte es zeigen. Derselbe
   * Schluessel, den renderer.js nach einem echten Abruf schreibt. */
  fs.writeFileSync(path.join(sd, 'newsStand.json'), JSON.stringify(KD.newsstand(jetzt)));
  /* Das Kunst-ARCHIV liegt nicht im Store, sondern im Datenordner - dort sucht
   * kerzenquelle.js. In der isolierten Instanz ist das TESTROOT/downloads, also
   * ebenfalls unter %TEMP%: der echte Datenordner wird nicht angefasst. Ohne diesen
   * Bestand zeigt die Archiv-Grafik fuenf leere Balken und belegt nichts. */
  const dd = path.join(testroot, 'downloads', 'Markt-Dashboard-Daten');
  KD.archiv(jetzt).concat(KD.marktArchiv(jetzt)).forEach((f) => {
    const ziel = path.join(dd, f.pfad.replace(/\//g, path.sep));
    fs.mkdirSync(path.dirname(ziel), { recursive: true });
    fs.writeFileSync(ziel, JSON.stringify(f.inhalt));
  });
  const md = path.join(dd, 'markt');
  fs.mkdirSync(md, { recursive: true });
  fs.writeFileSync(path.join(md, 'stammdaten.json'), JSON.stringify(KD.marktStammdaten(jetzt)));
  console.log('Kunstdaten in den Test-Store geschrieben: ' + sd);
  console.log('Kunst-Archiv und Kunst-Stammdaten in den Test-Datenordner geschrieben: ' + dd);
  return { store: sd, daten: dd };
}

module.exports = { saeen };

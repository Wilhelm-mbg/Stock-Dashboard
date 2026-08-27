'use strict';
/* ================= Kerzenlage: WAS liest eine Messung da eigentlich? =================
 *
 * Wilhelms Entscheid vom 27.08.2026: Die Randzeiten-Kerzen des 60m-Archivs werden
 * BEHALTEN und GEKENNZEICHNET, nichts wird geloescht. Dies ist die Kennzeichnung -
 * als ABGELEITETE REGEL, nicht als materialisiertes Feld: Eine aus den Daten
 * berechnete Lage kann nicht veralten und braucht beim Nachladen keine Pflege;
 * ein Feld an der Kerze braeche das Sechser-Format fuer Dutzende Leser, und eine
 * Liste im Archivkopf waere die naechste Naht, an der zwei Wahrheiten entstehen
 * (der Zwei-Quellen-Schaden in Kennzeichnungs-Gestalt).
 *
 * VIER LAGEN, aus den Messungen der Nacht auf den 27.08. (Zahlen = Ausgangsstand
 * vom 27.08.2026 frueh, archiv60m, 14.815.281 Kerzen - BERICHTET, nicht
 * zugesichert; drei davon wandern mit jedem Halbtag):
 *   'sitzung'     - regulaerer Handel                          (14.789.366)
 *   'auktion'     - Umsatz > 0 auf dem Sitzungsende: die Schlussauktion liegt
 *                   im Sitzungsende-Eimer (an Halbtagen bis zu 22,5 % der
 *                   Reihen). ECHTE SITZUNGSDATEN.                    (1.150)
 *   'schlusskurs' - Umsatz 0 auf dem Sitzungsende eines NORMALTAGS: die
 *                   bekannte 20:00-Familie, traegt in 99,4 % exakt den
 *                   offiziellen Tagesschluss (#96).                  (5.755)
 *   'nachhandel'  - Umsatz 0 auf/nach dem Sitzungsende eines HALBTAGS: die
 *                   Quelle liefert dort im Nicht-prePost-Strom genau eine
 *                   AH-Kerze mit (30/30 + 12/12 gemessen); Kurse echt moeglich,
 *                   Volumen fehlt lieferbedingt.                    (20.160)
 * Dazu 'vorboerse' (im Archiv gemessen: 0) und 'unbekannt' (Lage unbestimmbar).
 *
 * Warum 'auktion' und 'schlusskurs' EIGENE Lagen sind und keine Ausnahmen von
 * "Randzeit": die drei Schutzklauseln der Tafel (Schlusskurs-Familie getrennt;
 * Umsatz-Kerzen auf dem Sitzungsende sind Auktion; sitzungsbewusst statt
 * Schablone) sollen eine EIGENSCHAFT DER BAUFORM sein, nicht eine Regel, an die
 * sich jemand erinnern muss.
 *
 * WER SIE NUTZT, entscheidet je Verbraucher: Die Messmaschine (Besitz: Mess-
 * Sitzung) entscheidet selbst, ob sie Lagen ausschliesst oder Toepfe trennt;
 * Anzeigen weisen aus. Diese Datei rechnet nur ein - sie urteilt nicht.
 *
 * Abhaengigkeiten: Quant.minutenSeitOeffnung (DST-fest), Boerse.sitzungsMinuten
 * und Boerse.halbtagAn (kennt Halbtage). Test: test-v6 fuehrt die Funktion mit
 * den vier Tagestypen des QS-Prueffalls aus (synthetisch, ohne Archiv);
 * studien/datenfund-dochte-2026-08-27/lage-invarianten.js prueft die
 * ALTERUNGSFESTEN Invarianten am echten Archiv. */
(function (root) {
  var Q = null, B = null;
  if (typeof module !== 'undefined' && module.exports) {
    Q = require('./quant.js'); B = require('./boerse.js');
  } else {
    Q = root.Quant; B = root.Boerse;
  }

  /** Lage einer Kerze: tsMs = Kerzenbeginn (ms), umsatz = Volumenfeld.
   *  Rein beschreibend - keine Schwelle, kein Ausloeser, kein Urteil. */
  function kerzenLage(tsMs, umsatz) {
    if (!Q || !B) return 'unbekannt';
    var m = null, sm = null;
    try { m = Q.minutenSeitOeffnung(tsMs); sm = B.sitzungsMinuten(tsMs); } catch (e) { return 'unbekannt'; }
    if (m == null || sm == null || !isFinite(m) || !isFinite(sm)) return 'unbekannt';
    if (m < 0) return 'vorboerse';
    if (m < sm) return 'sitzung';
    if ((umsatz || 0) > 0) return 'auktion';
    /* Umsatz 0 auf/nach dem Sitzungsende: an Normaltagen ist die Sitzungsende-
     * Kerze die Schlusskurs-Familie (die Quelle liefert an Normaltagen sonst
     * keinen Nachhandel - 6/6 und archivweit 0 gemessen); an Halbtagen ist es
     * die mitgelieferte Nachhandelskerze. Ein spaeterer Normaltags-Eintrag
     * (m > sm), den es heute nicht gibt, waere ehrlicherweise Nachhandel. */
    if (!B.halbtagAn(tsMs)) return m === sm ? 'schlusskurs' : 'nachhandel';
    return 'nachhandel';
  }

  var KerzenLage = { kerzenLage: kerzenLage };
  if (typeof module !== 'undefined' && module.exports) { module.exports = KerzenLage; return; }
  root.KerzenLage = KerzenLage;
})(typeof window !== 'undefined' ? window : globalThis);

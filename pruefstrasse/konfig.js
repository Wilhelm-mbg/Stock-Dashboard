'use strict';
/* Konfiguration der Pruefstrasse (FORM.md §5, §6). Alle Datenorte kommen aus konfig.json; die Wurzel <daten> ersetzt die
 * Umgebungsvariable PRUEFSTRASSE_DATEN (Server: der Spiegel des Archivs). Kein Windows-spezifischer Code.
 * Zahlen, die FORM.md nennt, stehen hier GENAU EINMAL. Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var os = require('os');

var HIER = __dirname;
var REPO = path.resolve(HIER, '..');
var J = JSON.parse(fs.readFileSync(path.join(HIER, 'konfig.json'), 'utf8'));
var DATEN = (process.env.PRUEFSTRASSE_DATEN || J.daten).replace(/\\/g, '/').replace(/\/$/, '');

/** <daten>-Platzhalter ersetzen, repo-relative Pfade auf das Repo setzen. */
function pfad(p) {
  p = String(p).replace('<daten>', DATEN);
  return path.isAbsolute(p) ? p : path.join(REPO, p);
}
/** Ordner zaehlen; wirft laut, wenn er fehlt oder zu wenige Dateien hat (FORM §6). */
function ordnerPruefen(ordner, mindest, was) {
  if (!fs.existsSync(ordner)) throw new Error('DATENQUELLE FEHLT: ' + was + ' - ' + ordner + ' gibt es nicht');
  var n = fs.readdirSync(ordner).length;
  if (n < mindest) throw new Error('DATENQUELLE LEER: ' + was + ' - ' + ordner + ' hat ' + n + ' Eintraege, mindestens ' + mindest + ' erwartet');
  return n;
}
function dateiPruefen(datei, was) {
  if (!fs.existsSync(datei)) throw new Error('DATENQUELLE FEHLT: ' + was + ' - ' + datei + ' gibt es nicht');
  return datei;
}
/** Freier Speicher in GB. Linux: MemAvailable aus /proc/meminfo (os.freemem ist dort MemFree ohne Seitencache und
 *  meldete auf dem Rechenknecht zu wenig - Nr. 110 Uebergabe §6.4); sonst os.freemem. */
/** Naechster Kalendertag (JJJJ-MM-TT, UTC). */
function naechsterTag(d) { return new Date(Date.parse(d + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10); }
function speicherFreiGb() {
  if (process.platform === 'linux') {
    try { var m = /MemAvailable:\s+(\d+)\s*kB/.exec(fs.readFileSync('/proc/meminfo', 'utf8')); if (m) return +m[1] / 1048576; } catch (e) { /* unten */ }
  }
  return os.freemem() / 1073741824;
}

module.exports = {
  HIER: HIER, REPO: REPO, DATEN: DATEN, pfad: pfad, ordnerPruefen: ordnerPruefen, dateiPruefen: dateiPruefen, speicherFreiGb: speicherFreiGb,
  PANEL: pfad(J.panel), PANEL_KENNUNG: J.panelKennung, KALENDER: pfad(J.kalender),
  TRENDKANAL: { ordner: J.trendkanalTage.ordner.map(pfad), von: J.trendkanalTage.von, bis: J.trendkanalTage.bis, mindestDateien: J.trendkanalTage.mindestDateien },
  MASSNAHMEN: { ordner: pfad(J.massnahmen.ordner), mindestDateien: J.massnahmen.mindestDateien },
  ARCHIV60M: { ordner: pfad(J.archiv60m.ordner), mindestDateien: J.archiv60m.mindestDateien },
  /* Minute: das 60m-Archiv beginnt erst 2023-09 - die Holdout-Sperre dieser Form ist deshalb ein eigenes Datum (FORM §3, minute). */
  /* minute.eichungBis (Nr. 121-2a Schritt 0): letzter Tag des Kalibrierfensters der Minutenform = universum.bis des Protokolls
   * Markt-Dashboard-Daten/protokolle/rsi2seit-2026-08-26.json ("bis": "2026-08-24"), aus dem die Soll-Zahl 0,0205 stammt. */
  MINUTE: { sperreAb: J.minute.sperreAb, von: J.minute.von, eichungBis: J.minute.eichungBis },
  WERTPAPIERARTEN: process.env.PRUEFSTRASSE_WERTPAPIERARTEN || (J.wertpapierarten ? pfad(J.wertpapierarten) : null),   // Umgebung vor konfig.json (Server, Nr. 111)
  /* EICHFENSTER (Nr. 121-2a Schritt 0): feste Grenze der Kalibrierung und der gesperrten Tafel (bis Nr. 121-1 die Holdout-Sperre SPERRE_AB
   * 2023-01-01). Unabhaengig vom Entdeckungsende der Kandidaten (ENTDECKUNG_BIS) - zwei Konstanten, zwei Namen. schnitt = erster Kalendertag
   * nach dem Fenster (Vorgabe-Schnitt des tag-Adapters; fuer jeden Handelskalender gleichbedeutend mit dem alten 2023-01-01). */
  EICHUNG: { von: J.eichung.von, bis: J.eichung.bis, schnitt: naechsterTag(J.eichung.bis) }, naechsterTag: naechsterTag,
  /* ENTDECKUNG_BIS (Nr. 121-2a C1): 'panelende' = die Entdeckung neuer Kandidaten (Form tag) laeuft bis zum letzten Panel-Tag; die Pruefzeit 2023-2026
   * gilt als gelesen (PM-Annahme aus Wilhelms Satz), Bestaetigung nur vorwaerts ab dem Stichtag nach Siegel 2 (laeufer.js --vorwaerts). */
  ENTDECKUNG_BIS: J.entdeckungBis, SPEICHER_MIN_GB: J.speicherMinGb,
  PRUEFSTAND: path.join(REPO, 'studien', 'querschnitt-pruefstand-2026-09-13'),
  TRENDKANAL_STUDIE: path.join(REPO, 'studien', 'vorregistrierung-2026-09-08-trendkanal-tage'),
  WARTESCHLANGE: path.join(HIER, 'warteschlange'), ERLEDIGT: path.join(HIER, 'erledigt'),
  REGISTER: path.join(HIER, 'register.json'), VORSCHLAEGE: path.join(HIER, 'VORSCHLAEGE.md'), VORWAERTS: path.join(HIER, 'VORWAERTS.md'),
  /* Kriterien (FORM §5) */
  /* KANDIDAT_T 3 seit Nr. 121-2a (vorher 2); TOR1_FAKTOR nur noch nachrichtlich (Tor 1 ist kein Kriterium mehr) */
  KANDIDAT_T: 3, TOR1_FAKTOR: 4, MDE_FAKTOR: 2.8016, Z_POWER80: 0.8416, HOLM_ALPHA: 0.05,
  PLACEBO_T: 2, PLACEBO_ANTEIL_HUERDE: 0.25, VERSATZ_TAGE: 20, COOLDOWN_TAGE: 5, MIN_TAGE: 30,
  ZUFALL_JE_KONFIGURATION: 0.02275,            /* P(t >= 2) einseitig unter der Null */
  /* Nr. 121-2a (FORM.md §5): Kandidat = netto > 0 und p_E <= min(P(T_df >= KANDIDAT_T), REGISTER_ALPHA / m), m = Register (Gewichte; "nicht messbar"
   * 0, Nachmessung mit --grund-daten 2) + Konfigurationen des laufenden Kandidaten + REGISTER_M_EXTERN. REGISTER_M_EXTERN 0 = PM-Annahme "m = Register der
   * Pruefstrasse"; die ~3.400 Tests der Signalstudie 2026-08 stehen nur nachrichtlich (REGISTER_M_EXTERN_NACHRICHTLICH) - Wilhelm kann sie wirksam setzen.
   * HAUSREGEL_KALENDER_TAGE: CLAUDE.md "Kalendersignale unter 1.000 Bestaetigungs-Signaltagen nicht in die Muehle". */
  REGISTER_ALPHA: 0.05, REGISTER_M_EXTERN: 0, REGISTER_M_EXTERN_NACHRICHTLICH: 3400, HAUSREGEL_KALENDER_TAGE: 1000,
  /* Modus zeit, lokaler Topf (Nr. 121-1, FORM.md §3): mindestens TOPF_N_MIN Fenster je Signal. Entscheid PM 21.10.: 1 statt 2 - ein einzelnes
   * Vergleichsfenster ist ein gepaarter Vergleich (Signalwoche gegen die folgende ungerade Woche, der Vergleich der Quelle), seine Streuung steht ueber
   * den Ueberschuss je Trade in der Tagesreihe und damit im se; die Schwelle 2 waehlte eine verzerrte Teilmenge (Zyklusenden, Luecken - fomc: 79 %
   * der Trades fielen weg). Das Protokoll nennt Topf-n (Median, Min, Anteil n = 1).
   * Radius in Vielfachen der Haltedauer H (kandidat.json topfRadius in Handelstagen, Bereich min H .. max H, Vorgabe vorgabe H) */
  TOPF_N_MIN: 1, TOPF_RADIUS: { min: 2, max: 12, vorgabe: 4 },
  KORB: { kostenBp: 20, phasen: 63, kleinstAnteil: 0.05, placeboBuecher: 200, rangMin: 0.95 },
  /* A10 / B-V10 (Nr. 121-1): Zufallsbuecher B = max(200, 20 m + 1), m = Konfigurationen im Register + 1 (Register-Holm: kleinster p = 1/(B + 1)
   * <= alpha/m). Bei m <= 9 bleibt B = 200 (die Korb-Kalibrierung A-187/B-187 rechnet ohne Zufallsbuecher und ist davon unberuehrt). */
  korbBuecher: function (m) { return Math.max(200, 20 * m + 1); },
  FORMEN: ['tag', 'korb', 'minute'],
};

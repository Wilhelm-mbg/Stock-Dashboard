'use strict';
/* US-Handelskalender: Feiertage und Halbtage der NYSE/Nasdaq.
 *
 * Bis 8.24.5 hielt die App JEDEN Wochentag fuer einen vollen Handelstag von 390
 * Minuten. Zwei Folgen, verschieden schwer:
 *
 *   FEIERTAGE sind der leichte Fall. Der Scanner laeuft, findet eingefrorene Kurse -
 *   und barsFrisch faengt das ab. Es kostet Leerlauf, kein Geld.
 *
 *   HALBTAGE sind der teure. An ihnen schliesst die Boerse um 13:00 ET statt 16:00,
 *   die Sitzung ist 210 statt 390 Minuten lang. Der Zeit-Ausstieg steht in der
 *   belegten Konfiguration auf scalpHold = 480 Minuten. An einem vollen Tag laeuft
 *   er ohnehin ueber den Schluss und wird vom Uebernacht-Pfad behandelt; an einem
 *   HALBTAG aber schliesst die Boerse drei Stunden frueher als gedacht, und die
 *   Position liegt ueber Nacht, obwohl die Regel sie am selben Tag schliessen
 *   wollte. Es gibt sechs bis sieben solcher Tage im Jahr, und einer davon ist der
 *   Tag nach Thanksgiving - einer der duennsten Handelstage ueberhaupt.
 *
 * Berechnet, nicht aufgelistet: Eine Liste veraltet, und zwar lautlos. Die Regeln
 * der NYSE sind vollstaendig ableitbar - feste Daten mit Wochenend-Verschiebung,
 * n-te Wochentage, und Karfreitag ueber das Osterdatum.
 *
 * Alles hier rechnet in UTC-Datumsteilen des ET-Kalendertags. Das ist zulaessig,
 * weil ein Boersentag nie ueber Mitternacht ET hinausgeht und die Umrechnung
 * ET->UTC vor der Datumsbestimmung passiert (etDatum). */
(function (root) {

  var VOLL = 390;      // 9:30-16:00 ET
  var HALB = 210;      // 9:30-13:00 ET

  function utc(j, m, t) { return Date.UTC(j, m, t); }
  function wochentag(j, m, t) { return new Date(utc(j, m, t)).getUTCDay(); }

  /** Der n-te bestimmte Wochentag eines Monats (n=1 -> der erste). */
  function nterWochentag(jahr, monat, wtag, n) {
    var erster = new Date(utc(jahr, monat, 1)).getUTCDay();
    return 1 + ((wtag - erster + 7) % 7) + (n - 1) * 7;
  }
  /** Der letzte bestimmte Wochentag eines Monats. */
  function letzterWochentag(jahr, monat, wtag) {
    var tage = new Date(utc(jahr, monat + 1, 0)).getUTCDate();
    var letzter = new Date(utc(jahr, monat, tage)).getUTCDay();
    return tage - ((letzter - wtag + 7) % 7);
  }
  /** Ostersonntag nach dem anonymen gregorianischen Algorithmus. */
  function ostern(jahr) {
    var a = jahr % 19, b = Math.floor(jahr / 100), c = jahr % 100;
    var d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    var g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4), k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var monat = Math.floor((h + l - 7 * m + 114) / 31) - 1;   // 0-basiert
    var tag = ((h + l - 7 * m + 114) % 31) + 1;
    return { monat: monat, tag: tag };
  }
  /** Feste Feiertage verschieben sich: faellt einer auf einen Samstag, ist der
   *  Freitag davor frei; auf einen Sonntag, der Montag danach. Genau so haelt es
   *  die NYSE - der 4. Juli 2026 ist ein Samstag, frei ist der 3. Juli. */
  function verschoben(jahr, monat, tag) {
    var wt = wochentag(jahr, monat, tag);
    if (wt === 6) return utc(jahr, monat, tag - 1);
    if (wt === 0) return utc(jahr, monat, tag + 1);
    return utc(jahr, monat, tag);
  }

  /** Alle Feiertage eines Jahres als Menge von UTC-Tagesstempeln. */
  function feiertage(jahr) {
    var o = ostern(jahr);
    var karfreitag = utc(jahr, o.monat, o.tag) - 2 * 86400000;
    return {
      neujahr: verschoben(jahr, 0, 1),
      mlk: utc(jahr, 0, nterWochentag(jahr, 0, 1, 3)),               // 3. Montag im Januar
      washington: utc(jahr, 1, nterWochentag(jahr, 1, 1, 3)),        // 3. Montag im Februar
      karfreitag: karfreitag,
      memorial: utc(jahr, 4, letzterWochentag(jahr, 4, 1)),          // letzter Montag im Mai
      juneteenth: verschoben(jahr, 5, 19),
      unabhaengigkeit: verschoben(jahr, 6, 4),
      arbeit: utc(jahr, 8, nterWochentag(jahr, 8, 1, 1)),            // 1. Montag im September
      thanksgiving: utc(jahr, 10, nterWochentag(jahr, 10, 4, 4)),    // 4. Donnerstag im November
      weihnachten: verschoben(jahr, 11, 25)
    };
  }

  /** Halbtage: Schluss um 13:00 ET.
   *  - der Tag nach Thanksgiving (immer ein Freitag)
   *  - Heiligabend, wenn er ein normaler Handelstag ist
   *  - der 3. Juli, wenn der 4. auf einen Wochentag Di-Fr faellt
   *  Faellt einer davon selbst auf einen Feiertag oder ein Wochenende, entfaellt er. */
  function halbtage(jahr) {
    var f = feiertage(jahr);
    var raus = {};
    raus.nachThanksgiving = f.thanksgiving + 86400000;
    var hl = utc(jahr, 11, 24);
    if (wochentag(jahr, 11, 24) >= 1 && wochentag(jahr, 11, 24) <= 5) raus.heiligabend = hl;
    /* Der 3. Juli ist nur dann ein halber Tag, wenn der 4. wirklich am naechsten Tag
     * gehandelt worden waere. Faellt der 4. auf einen Montag, ist der 3. ein Sonntag;
     * faellt er auf einen Samstag, ist der 3. der ERSATZFEIERTAG und ganz frei. */
    var wt4 = wochentag(jahr, 6, 4);
    if (wt4 >= 2 && wt4 <= 5) raus.vorUnabhaengigkeit = utc(jahr, 6, 3);
    return raus;
  }

  function tagesStempel(ms) {
    var d = new Date(ms);
    return utc(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }

  /* Zwischenspeicher je Jahr - die Rechnung ist billig, aber sie laeuft in Schleifen
   * ueber Zehntausende Kerzen. */
  var CACHE = {};
  function jahrDaten(jahr) {
    if (!CACHE[jahr]) {
      var f = feiertage(jahr), h = halbtage(jahr);
      var fs = {}, hs = {};
      Object.keys(f).forEach(function (k) { fs[f[k]] = k; });
      Object.keys(h).forEach(function (k) { if (!fs[h[k]]) hs[h[k]] = k; });
      CACHE[jahr] = { feiertage: fs, halbtage: hs };
    }
    return CACHE[jahr];
  }

  /** Ist an diesem Zeitpunkt Feiertag? Gibt den Namen zurueck oder null. */
  function feiertagAn(ms) {
    var d = new Date(ms), t = tagesStempel(ms);
    return jahrDaten(d.getUTCFullYear()).feiertage[t] || null;
  }
  /** Ist an diesem Zeitpunkt ein halber Handelstag? Name oder null. */
  function halbtagAn(ms) {
    var d = new Date(ms), t = tagesStempel(ms);
    return jahrDaten(d.getUTCFullYear()).halbtage[t] || null;
  }
  /** Wird an diesem Tag ueberhaupt gehandelt? */
  function istHandelstag(ms) {
    var wt = new Date(ms).getUTCDay();
    if (wt === 0 || wt === 6) return false;
    return !feiertagAn(ms);
  }
  /** Laenge der regulaeren Sitzung in Minuten: 390, 210 oder 0. */
  function sitzungsMinuten(ms) {
    if (!istHandelstag(ms)) return 0;
    return halbtagAn(ms) ? HALB : VOLL;
  }

  var Boerse = {
    VOLL: VOLL, HALB: HALB,
    ostern: ostern, feiertage: feiertage, halbtage: halbtage,
    nterWochentag: nterWochentag, letzterWochentag: letzterWochentag, verschoben: verschoben,
    feiertagAn: feiertagAn, halbtagAn: halbtagAn,
    istHandelstag: istHandelstag, sitzungsMinuten: sitzungsMinuten
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Boerse; return; }
  root.Boerse = Boerse;
})(typeof window !== 'undefined' ? window : globalThis);

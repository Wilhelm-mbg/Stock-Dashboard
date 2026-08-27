'use strict';
/* ============================================================================
 * MESSMASCHINE - die einzige Stelle, an der eine Strategie beurteilt wird.
 *
 * Eingang: eine Strategie-Datei (siehe strategie-vertrag.md), ein Archiv.
 * Ausgang: ein Protokoll (JSON), das JEDE Zahl mit ihrer Herkunft traegt.
 *
 * Die Maschine kann nur auf EINE Art rechnen. Es gibt keine Schalter, mit denen
 * man Kontrolle, Tagesclusterung, MDE oder den Bestaetigungsschnitt abschalten
 * koennte. Wer eine andere Rechnung will, schreibt eine neue Strategie - nicht
 * eine andere Auswertung.
 *
 * Jede Entscheidung, die die Maschine trifft, steht im Protokoll unter
 * "entscheidungen" mit Regel, Eingabe und Ergebnis. Nichts davon ist nur im
 * Code; Wilhelm hat 100 % Einsicht verlangt, und die gibt es nur, wenn der
 * Entscheidungsweg als Daten vorliegt, nicht als Kommentar.
 *
 * Geprueft gegen FEHLERTYPEN.md - jeder dort genannte Fehler hat einen Testfall
 * in test-messmaschine.js. Die Kennungen (A1, B2, ...) stehen im Code an der
 * Stelle, die den jeweiligen Fehler unmoeglich macht.
 * ========================================================================== */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

/* ---------- Codestand: die Nummer, die nicht behaupten kann ----------
 * Bis zum 26.08.2026 stand hier eine von Hand gepflegte "1.0.0" - und sie stand da
 * ueber sieben Aenderungen hinweg unveraendert. Eine Versionsnummer, die niemand
 * mitzieht, ist schlimmer als keine: sie behauptet Gleichheit, wo keine ist. Zwei
 * Protokolle mit derselben Nummer waren nicht mit derselben Maschine gemessen.
 *
 * Der Codestand ist deshalb KEINE Pflege-Angabe, sondern aus der Datei selbst
 * gerechnet. Er aendert sich bei jeder Aenderung - auch bei einer im Kommentar. Das
 * ist Absicht: er beantwortet "war das dieselbe Datei?", nicht "war das dasselbe
 * Verfahren?". Die zweite Frage beantwortet version, und dass die gepflegt wird,
 * erzwingt eine Sperrklinke in test-v6.js: dort steht der erwartete Codestand neben
 * der Version. Wer die Datei anfasst, ohne beides nachzuziehen, bekommt einen roten
 * Test - und muss entscheiden, ob sich das Verfahren geaendert hat.
 *
 * Zeilenenden werden vorher vereinheitlicht: sonst haette dieselbe Datei unter einem
 * anderen autocrlf einen anderen Stand.
 * Laesst sich die Datei nicht lesen, bleibt der Stand null - eine erfundene Kennung
 * waere genau der Fehler, den das hier abstellen soll. */
function codeStand() {
  try {
    var q = fs.readFileSync(__filename, 'utf8').replace(/\r\n/g, '\n');
    return crypto.createHash('sha256').update(q, 'utf8').digest('hex').slice(0, 12);
  } catch (e) { return null; }
}

/* ---------- Konstanten, die das Verfahren definieren (nicht einstellbar) ---------- */
var VERFAHREN = {
  /* version beantwortet 'war das dasselbe Verfahren?' und wird von Hand gesetzt.
   * 1.1.0 (26.08.2026): #86 aussicht feuert wieder, #87 A7-Fenstertext berichtigt,
   *   #88 Placebo folgt der Einstiegskonvention.
   * 1.2.0 (26.08.2026): #91 - die Aussicht rechnet gegen die Bonferroni-Schwelle statt
   *   gegen t=2 und nennt Schwelle und Testzahl.
   * 1.3.0 (26.08.2026): ausstiegsZeitpunkt - Spiegelbild der Einstiegskonvention, an
   *   Signal, beiden Kontrollen und dem Placebo zugleich. Die Vorgabe schluss ist das
   *   bisherige Verhalten; neu im Protokoll sind das Feld und die Entscheidung C9.
   * 1.4.0 (26.08.2026): #98 - der Ueberlappungsfaktor erreicht seinen Leser. Neu im
   *   Protokoll sind das Feld je Block und die Entscheidung B10, die bisher in KEINEM
   *   der 38 Protokolle stand. Die Rechnung selbst aendert sich nicht.
   * 1.5.0 (26.08.2026): Wilhelms Formular-Entscheid 20:25, zwei Stellen in einem
   *   Eingriff. (a) Die Aussicht bekommt dieselbe 30-Tage-Schranke wie das Urteil -
   *   ein nicht-messbarer Lauf liefert keine tage80 mehr (vorher: 187 aus 17
   *   Messtagen). (b) #92: bestesUrteil-Rangfolge - widerlegt gewinnt vor allem,
   *   und der sechste Urteilswert aus Z. 1235 ist aufgenommen (fiel vorher auf den
   *   Rueckfallwert nicht-messbar durch). Messwerte aendern sich nicht, Etiketten
   *   und Planungszahlen koennen kippen - abgelegte Protokolle behalten ihre alten
   *   Werte, bis sie neu gemessen werden.
   * 1.6.0 (27.08.2026): Integritaetsschranke Wertpapier-Klassifizierung (PM-Auftrag).
   *   Ohne wertpapierarten.json misst die Maschine nicht mehr still auf dem ganzen
   *   Archiv, sondern verweigert; und E1 traegt den Zustand klassifizierungDa ab
   *   jetzt IMMER - ein Protokoll ohne das Feld ist vor dieser Version entstanden.
   *   Kein Messwert aendert sich; neu ist ein Feld und eine Verweigerung.
   * Zur 1.2.0 gab es eine ANDERE Meinung, und sie war vertretbar: die Messung selbst
   * aendert sich nicht, kein Urteil kippt, es ist 'nur' eine Planungszahl - also
   * koennte 1.1.0 stehenbleiben. Dagegen steht, was diese Nummer LEISTEN soll: zwei
   * Protokolle mit derselben Version sollen vergleichbar sein. Bei gleichen Daten
   * meldete 1.1.0 vor und nach dieser Zeile bis zu 59 % verschiedene tage80. Wer die
   * Zahlen nebeneinanderlegt, haette keinen Anhaltspunkt. Deshalb neue Stelle.
   * Genau diese Frage soll die Sperrklinke in test-v6.js erzwingen - sie deshalb
   * durchzuwinken waere ihr erster Ausfall gewesen. */
  version: '1.6.0',
  /* codeStand beantwortet 'war das dieselbe Datei?' und rechnet sich selbst aus. */
  codeStand: codeStand(),
  mindestKerzenVorlauf: 261,        // EMA100 + Kanal 200, wie die Detektoren es brauchen
  bestaetigungsAnteil: 0.5,         // B5: zweite Haelfte der Handelstage ist Bestaetigung
  alpha: 0.05,                      // zweiseitig
  zAlpha: 1.959964,
  zPower80: 0.8416212,
  mdeFaktor: 2,                     // B3: MDE = 2 x Standardfehler
  kontrolle: 'erwartung-symbol-stunde',   // A2: Erwartung, keine Ziehung
  stundenRaster: 'utc',
};

/* ---------- Protokoll-Helfer ---------- */
function Protokoll() {
  this.entscheidungen = [];
  this.tests = 0;
  this.warnungen = [];
}
Protokoll.prototype.entscheide = function (regel, eingabe, ergebnis, begruendung) {
  this.entscheidungen.push({ nr: this.entscheidungen.length + 1, regel: regel, eingabe: eingabe,
    ergebnis: ergebnis, begruendung: begruendung });
  return ergebnis;
};
Protokoll.prototype.warne = function (kennung, text) { this.warnungen.push({ kennung: kennung, text: text }); };

/* ---------- Statistik (B1: nur ueber Tagesmittel) ---------- */
function tagesMittel(eintraege) {
  // eintraege: [{tag, wert}]  ->  {tage: [...], mittel: [...], nJeTag: [...]}
  var m = {};
  eintraege.forEach(function (e) { (m[e.tag] = m[e.tag] || []).push(e.wert); });
  var tage = Object.keys(m).sort();
  return { tage: tage, mittel: tage.map(function (t) { return m[t].reduce(function (a, b) { return a + b; }, 0) / m[t].length; }),
           nJeTag: tage.map(function (t) { return m[t].length; }) };
}
/* B10: Newey-West-Standardfehler. Bei einer Haltedauer von H Kerzen ueberlappen
 * die Ergebnisfenster aufeinanderfolgender Signaltage um H-1 Kerzen - die Tage
 * sind dann keine unabhaengigen Wiederholungen. Die Korrektur nimmt die in den
 * Daten GEMESSENE Autokorrelation bis zur Verzoegerung H-1 auf, mit
 * Bartlett-Gewichten (1 - k/H), die die Schaetzung positiv definit halten.
 * Bei H = 1 ist die Summe leer und das Ergebnis exakt der alte Wert. */
function neweyWest(werte, mu, va, lags) {
  var n = werte.length;
  if (!(lags > 0) || n < 3) return va;
  var L = Math.min(lags, n - 2);
  var lang = va;
  for (var k = 1; k <= L; k++) {
    var gew = 1 - k / (L + 1);
    var s = 0, c = 0;
    for (var i = 0; i + k < n; i++) { s += (werte[i] - mu) * (werte[i + k] - mu); c++; }
    if (c) lang += 2 * gew * (s / c);
  }
  /* Eine negative Langfristvarianz ist rechnerisch moeglich und sachlich unsinnig;
   * dann bleibt der unkorrigierte Wert stehen. */
  return lang > 0 ? lang : va;
}

function statistik(werte, lags) {
  var n = werte.length;
  if (n < 2) return { n: n, mittel: n ? werte[0] : null, se: null, t: null, mde: null };
  var mu = werte.reduce(function (a, b) { return a + b; }, 0) / n;
  var va = werte.reduce(function (a, b) { return a + (b - mu) * (b - mu); }, 0) / (n - 1);
  var sd = Math.sqrt(va);
  var seNaiv = sd / Math.sqrt(n);
  var vaNW = neweyWest(werte, mu, va, lags || 0);
  var se = Math.sqrt(vaNW / n);
  return { n: n, mittel: mu, sd: sd, se: se, seNaiv: seNaiv,
    ueberlappungsFaktor: seNaiv > 0 ? Math.round(se / seNaiv * 100) / 100 : null,
    t: se > 0 ? mu / se : null, tNaiv: seNaiv > 0 ? mu / seNaiv : null,
    mde: se > 0 ? VERFAHREN.mdeFaktor * se : null };
}
/* B2: die Erwartung JE HANDEL ist eine andere Zahl als das Tagesmittel - beide ausweisen */
function jeSignal(eintraege) {
  var n = eintraege.length;
  if (!n) return { n: 0, mittel: null };
  return { n: n, mittel: eintraege.reduce(function (a, e) { return a + e.wert; }, 0) / n,
           anteilPositiv: eintraege.filter(function (e) { return e.wert > 0; }).length / n };
}
function bonferroniSchwelle(tests) {
  // zweiseitige Normalquantile fuer alpha/tests - Naeherung (Beasley-Springer-Moro reicht hier)
  var p = VERFAHREN.alpha / Math.max(1, tests) / 2;
  return Math.abs(normInv(p));
}
function normInv(p) {
  var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  var q, r;
  if (p < 0.02425) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > 1 - 0.02425) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  q = p - 0.5; r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/* ---------- Erster handelbarer Kurs einer Kerze (C7) ----------
 * Mit Eroeffnungskurs (Element 5) ist es der Eroeffnungskurs. Ohne ihn bleibt
 * nur der Schluss der Vorkerze - eine Naeherung, die bei Uebernachtluecken
 * daneben liegt. Welcher Fall vorlag, steht im Protokoll; geraten wird nicht. */
/* EINSTIEGSKONVENTION (Zweig N, 25.08.2026). Bis hierher stieg die Maschine immer zum
 * SCHLUSS der Signalkerze ein - zu einem Kurs, der im Augenblick der Signalbildung schon
 * vorbei ist. Zweig E hat gemessen, was das kostet: innerhalb der Sitzung nichts
 * (-0,00003 Pp ueber 11,8 Mio Faelle), an der Sitzungsgrenze +0,055 Pp bei sd 1,7652.
 * Wer zu 99,9 % auf der Schlusskerze feuert - wie t1 -, misst eine Uebernachtluecke als
 * Handelsertrag.
 * Der Schalter gilt fuer das Signal, BEIDE KONTROLLEN und den PLACEBO-LAUF (#88; bis zum
 * 26.08.2026 lief der Placebo als einziger Pfad daneben). Nur den Signalpfad umzustellen
 * hiesse, zwei verschiedene Ausfuehrungen zu vergleichen und den Unterschied Effekt zu
 * nennen - genau der C7-Fehler, der hier schon aus t 5,96 ein t -0,75 gemacht hat. */
function einstiegKurs(bars, i, konvention) {
  if (konvention === 'folgeEroeffnung') {
    if (i + 1 >= bars.length) return null;      // kein handelbarer Kurs mehr
    var o = eroeffnungKurs(bars, i + 1);
    return o > 0 ? o : null;
  }
  var s = bars[i][1];
  return s > 0 ? s : null;
}

/* AUSSTIEGSKONVENTION (26.08.2026). Spiegelbild von einstiegKurs, und aus demselben
 * Grund: wer den Ausstieg nur im Signalpfad umstellt, vergleicht zwei verschiedene
 * Ausfuehrungen und nennt den Unterschied Effekt - der C7-Fehler, der hier schon aus
 * t 5,96 ein t -0,75 gemacht hat. Der Schalter gilt fuer Signal UND BEIDE KONTROLLEN
 * UND den Placebo.
 *
 * VERANKERT AN DER KERZE i+H, nicht an i+H+1. Die Vorregistrierung glockendruck-nacht
 * sagt es woertlich: "Zweig N: Einstieg Schluss(i), Ausstieg Eroeffnung(i+1)" bei H=1.
 * Der Schalter waehlt also INNERHALB der Ausstiegskerze - Eroeffnung oder Schluss -
 * und verlaengert die Haltedauer nie.
 *
 * KEIN RUECKFALL. eroeffnungKurs() nimmt beim Fehlen der Eroeffnung den Schluss der
 * Vorkerze. Fuer einen EINSTIEG ist das eine benannte Naeherung; fuer einen AUSSTIEG
 * waere es toedlich: der Schluss der Vorkerze IST bei H=1 der Einstiegskurs der
 * Schluss-Fassung. Die Rendite faellt damit mechanisch auf die andere Fassung zurueck
 * und verduennt genau den Unterschied, den die Messung sucht - gegen null, und zwar
 * unsichtbar. Fehlt die Eroeffnung, wird das Signal AUSGEWORFEN. Wie viele, steht im
 * Protokoll; ein stiller Ersatz stuende dort nicht. */
function ausstiegKurs(bars, k, konvention) {
  if (konvention === 'folgeEroeffnung') {
    var b = bars[k];
    if (!b || b.length <= 5 || typeof b[5] !== 'number' || !isFinite(b[5]) || !(b[5] > 0)) return null;
    return b[5];
  }
  var sc = bars[k] ? bars[k][1] : 0;
  return sc > 0 ? sc : null;
}

function eroeffnungKurs(bars, k) {
  var b = bars[k];
  if (b && b.length > 5 && typeof b[5] === 'number' && isFinite(b[5]) && b[5] > 0) return b[5];
  return k > 0 ? bars[k - 1][1] : b[1];
}

/* ---------- Archiv ---------- */
function ladeUniversum(archivPfad, intervall, filter) {
  ladeUniversum.verworfen = [];
  var dateien = fs.readdirSync(archivPfad).filter(function (f) { return f.indexOf('bars_' + intervall + '_') === 0; });
  var out = {};
  dateien.forEach(function (f) {
    var sym = f.slice(('bars_' + intervall + '_').length, -5);
    if (filter && !filter(sym)) return;
    try {
      var j = JSON.parse(fs.readFileSync(path.join(archivPfad, f), 'utf8'));
      if (j && Array.isArray(j.series) && j.series.length) {
        var kaputt = reiheKaputt(j.series);
        if (kaputt) { ladeUniversum.verworfen.push(sym + ': ' + kaputt); }
        else out[sym] = j.series;
      } else {
        ladeUniversum.verworfen.push(sym + ': keine Kerzen in der Datei');
      }
      /* Der Kommentar hier lautete bis zum 25.08.2026 "wird unten gezaehlt" - und
       * genau das geschah nicht: ladeUniversum.verworfen wurde ausschliesslich von
       * reiheKaputt gefuellt. Eine abgeschnittene oder gesperrte Archivdatei fiel
       * lautlos aus dem Universum, und F1 meldete "geprueft: 13" statt 14. Die
       * Messung lief auf einem kleineren Universum, als ihr Protokoll behauptete.
       * Jetzt wird wirklich gezaehlt - F1 nimmt verworfen ohnehin auf. */
    } catch (e) { ladeUniversum.verworfen.push(sym + ': Datei unlesbar (' + String((e && e.message) || e).slice(0, 60) + ')'); }
  });
  return out;
}
/* ---------- F1: Ist diese Reihe ueberhaupt benutzbar? ----------
 * Nicht bereinigte Zusammenlegungen erzeugen Spruenge, die kein Markt macht.
 * Gefunden am 25.08.2026 im eigenen Archiv: DFEN 0,27 -> 28,73 (+10.541 Pp),
 * WHLR mit 4.169.491.200 $ je Aktie, ZVZZT (das Testsymbol der NASDAQ) 10 -> 260.
 * Solche Reihen sind nicht teilweise brauchbar, sondern falsch - wer sie
 * stueckweise benutzt, weiss nicht, welches Stueck.
 * Die Grenzen sind bewusst weit: +400 % in einer Kerze kommt am Markt nicht vor,
 * +50 % nach einer Zulassungsmeldung sehr wohl. Es wird nicht gestutzt, sondern
 * das Kaputte erkannt. */
function reiheKaputt(bars) {
  var maxKurs = 0;
  for (var i = 0; i < bars.length; i++) {
    var c = bars[i][1];
    if (c > maxKurs) maxKurs = c;
    if (i > 0) {
      var v = bars[i - 1][1];
      if (v > 0 && c > 0) {
        var r = c / v - 1;
        if (r > 4 || r < -0.8) return 'Sprung ' + Math.round(r * 100) + ' % bei ' +
          new Date(bars[i][0]).toISOString().slice(0, 10);
      }
    }
  }
  if (maxKurs > 100000) return 'Kurs bis ' + Math.round(maxKurs) + ' $';
  return null;
}

function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }
function stundeVon(ms) { return new Date(ms).getUTCHours(); }

/* F3: Die Position IN DER SITZUNG, nicht die Uhrzeit. Die US-Sitzung wandert mit
 * der Zeitumstellung um eine Stunde; "Stunde 19" ist im Sommer die Schlusskerze
 * (Folgerendite = ueber Nacht) und im Winter eine Kerze mitten am Tag. Gemessen
 * liegen zwischen beiden 0,085 Pp im Mittel und Faktor 3,8 in der Streuung.
 * Durchgezaehlt braucht es keine Zeitzonenlogik: Was die erste Kerze eines
 * Handelstags ist, sagt der Kalendertag. Auf Tageskerzen ist die Position immer 0. */
/* E3 (25.08.2026): Die Position allein genuegt nicht als Topf-Schluessel. Sie sollte
 * sagen, was NACH der Kerze kommt - ueber Nacht oder innerhalb des Tages. Das gilt nur
 * bei konstanter Sitzungslaenge, und die ist nicht konstant: an verkuerzten Tagen ist
 * schon Position 3 die letzte Kerze.
 * Gemessen ueber H=8 auf archiv60m: Position 3 innerhalb der Sitzung +0,0925 Pp, an der
 * Grenze -0,4205 Pp - Abstand 0,513 Pp, und beides lag im selben Topf. Bei 1,03 % Anteil
 * verschiebt das den Topf um 0,0053 Pp; die groesste je sauber gemessene Nettokante liegt
 * bei 0,047 Pp. Verzerrung, kein Rauschen.
 * Der Schluessel ist deshalb Position PLUS "ist dies die letzte Kerze ihres Tages". */
var SCHICHT_SPEICHER = new WeakMap();
function sitzungsSchicht(bars) {
  var s = SCHICHT_SPEICHER.get(bars);
  if (s) return s;
  var POS = sitzungsPosition(bars);
  s = new Array(bars.length);
  for (var i = 0; i < bars.length; i++) {
    /* Letzte Kerze des Tages = die naechste beginnt einen neuen Tag. Die allerletzte
     * Kerze der Reihe gilt als Grenze - sie hat keine Folgekerze im selben Tag. */
    var grenze = (i + 1 >= bars.length) || POS[i + 1] === 0;
    s[i] = POS[i] + (grenze ? 'G' : 'I');
  }
  SCHICHT_SPEICHER.set(bars, s);
  return s;
}

var POS_SPEICHER = new WeakMap();
function sitzungsPosition(bars) {
  var p = POS_SPEICHER.get(bars);
  if (p) return p;
  p = new Int16Array(bars.length);
  var letzter = null, k = 0;
  for (var i = 0; i < bars.length; i++) {
    var d = new Date(bars[i][0]);
    var tag = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
    if (tag !== letzter) { letzter = tag; k = 0; } else { k++; }
    p[i] = k;
  }
  POS_SPEICHER.set(bars, p);
  return p;
}

/* ---------- A2/A3/A5: Kontrollerwartung je Symbol x Stunde x Haelfte ---------- */
/* ACHTUNG bei Ausstiegsregeln: Die Kontrolle bekommt denselben Ausstieg wie das
 * Signal. Sonst vergleicht man "Signal mit Stop" gegen "Zufallskerze ohne Stop" -
 * und misst den Stop statt das Signal. */
function baueKontrolle(universum, haltedauerKerzen, schnittTag, vorlauf, stopNiveau, params, konvention, ausKonvention) {
  /* A7: Der Topf haelt jetzt die einzelnen Kerzen (Index + Wert), nicht nur Summe und
   * Anzahl. Nur so laesst sich das Lesefenster des Signals wieder herausrechnen.
   * Praefixsummen dazu, damit das je Signal O(log n) bleibt statt O(Topfgroesse). */
  var K = {};   // sym -> haelfte -> stunde -> {idx:[], wert:[], praefix:[]}
  Object.keys(universum).forEach(function (sym) {
    var b = universum[sym];
    var POS = sitzungsSchicht(b);          // E3: Position UND Sitzungsgrenze
    var H = K[sym] = { entdeckung: {}, bestaetigung: {} };
    for (var i = vorlauf; i < b.length - haltedauerKerzen; i++) {
      var s0 = einstiegKurs(b, i, konvention); if (!(s0 > 0)) continue;
      var sH = ausstiegKurs(b, i + haltedauerKerzen, ausKonvention); if (!(sH > 0)) continue;
      var h = POS[i];                     // F3/E3: Sitzungsschicht statt UTC-Stunde
      var hf = tagVon(b[i][0]) < schnittTag ? 'entdeckung' : 'bestaetigung';
      var z = H[hf][h] = H[hf][h] || { idx: [], wert: [] };
      var ende = sH;
      if (typeof stopNiveau === 'function') {
        var pf = [];
        for (var pk = i + 1; pk <= i + haltedauerKerzen; pk++) {
          pf.push({ auf: eroeffnungKurs(b, pk), hoch: b[pk][3] != null ? b[pk][3] : b[pk][1],
            tief: b[pk][4] != null ? b[pk][4] : b[pk][1], schluss: b[pk][1] });
        }
        var aA = fuehreAus(pf, s0, stopNiveau, params);
        /* Nur der ZEIT-Ausstieg folgt der Konvention. Ein Stop fuellt zu seinem
         * Niveau, egal wann - dort waere die Eroeffnung der Ausstiegskerze eine
         * Ausfuehrung, die es nicht gibt. Dieselbe Ausnahme steht im Signalpfad. */
        ende = aA.grund === 'Zeit' ? sH : aA.kurs;
      }
      z.idx.push(i); z.wert.push(ende / s0 - 1);   // C3: Anteil, kein Prozent
    }
  });

  /* F1b: STUTZEN, dann Praefixsummen. Der Topf ist ein Mittel ueber rund 150
   * Kerzen; ein einziger Fehldruck verschiebt ihn um zweistellige Prozentpunkte.
   * Gestutzt wird an den Quantilen des TOPFES selbst (1 % je Seite), nicht an einer
   * festen Schranke - so passt sich die Stutzung der Streuung des Werts an.
   * Ein getrimmtes Mittel schaetzt dieselbe Groesse wie das arithmetische, nur
   * robust. Es steht als Verfahrensangabe im Protokoll.
   * Die Indexlisten bleiben aufsteigend - darauf beruht die binaere Suche. */
  var STUTZ = 0.01;
  var gestutzt = 0, toepfe = 0;
  Object.keys(K).forEach(function (sym) {
    ['entdeckung', 'bestaetigung'].forEach(function (hf) {
      Object.keys(K[sym][hf]).forEach(function (h) {
        var z = K[sym][hf][h];
        var n = z.wert.length;
        toepfe++;
        if (n >= 50) {
          var sortiert = z.wert.slice().sort(function (a, b) { return a - b; });
          var k = Math.floor(n * STUTZ);
          var unten = sortiert[k], oben = sortiert[n - 1 - k];
          for (var q = 0; q < n; q++) {
            if (z.wert[q] < unten) { z.wert[q] = unten; gestutzt++; }
            else if (z.wert[q] > oben) { z.wert[q] = oben; gestutzt++; }
          }
        }
        var p = new Float64Array(n + 1);
        for (var q2 = 0; q2 < n; q2++) p[q2 + 1] = p[q2] + z.wert[q2];
        z.praefix = p; z.n = n; z.summe = p[p.length - 1];
      });
    });
  });
  baueKontrolle.gestutzt = gestutzt;
  baueKontrolle.toepfe = toepfe;

  /* Erste Position mit idx >= ziel (binaere Suche). */
  function unten(a, ziel) {
    var lo = 0, hi = a.length;
    while (lo < hi) { var m = (lo + hi) >> 1; if (a[m] < ziel) lo = m + 1; else hi = m; }
    return lo;
  }

  return {
    /* A7: Erwartung ueber den Topf OHNE das Fenster [vonIdx, bisIdx]. Wer kein
     * Fenster angibt, bekommt den ganzen Topf - und die Maschine warnt darueber. */
    erwartung: function (sym, stunde, haelfte, vonIdx, bisIdx) {
      var z = K[sym] && K[sym][haelfte] && K[sym][haelfte][stunde];
      if (!z || !z.n) return null;
      var n = z.n, summe = z.summe;
      if (vonIdx != null) {
        var a = unten(z.idx, vonIdx), b2 = unten(z.idx, bisIdx + 1);
        n -= (b2 - a); summe -= (z.praefix[b2] - z.praefix[a]);
      }
      /* unter 20 Kerzen: keine Erwartung, Signal faellt raus (ausgewiesen) */
      return n >= 20 ? summe / n : null;
    },
  };
}

/* ---------- Querschnitt: Werte gegeneinander statt mit sich selbst ----------
 * Baut je Zeitstempel die Rangfolge aller Werte nach dem Merkmal der Strategie.
 * Rueckgabe: rang(sym, ms) -> {perzentil, n} | null
 *   perzentil 1,0 = staerkster Wert des Tages, 0,0 = schwaechster.
 *
 * Der Vorlauf gilt hier genauso wie im Signal (A9): Ein Wert, dessen Reihe noch
 * nicht weit genug zurueckreicht, taucht in der Rangfolge nicht auf - sonst
 * bestuende der erste Rang aus jungen Werten mit kurzer Historie. */
function baueQuerschnitt(universum, merkmal, vorlauf, mindestWerte) {
  baueQuerschnitt.merkmalFehler = 0;
  var syms = Object.keys(universum);
  var N = syms.length;
  var symId = {};
  syms.forEach(function (s, k) { symId[s] = k; });

  /* Gemeinsame Zeitachse: die Vereinigung aller Zeitstempel, sortiert. */
  var zeitSatz = new Set();
  syms.forEach(function (s) {
    var b = universum[s];
    for (var i = vorlauf; i < b.length; i++) zeitSatz.add(b[i][0]);
  });
  var zeit = Array.from(zeitSatz).sort(function (a, b) { return a - b; });
  var T = zeit.length;
  var zeitIdx = new Map();
  for (var z = 0; z < T; z++) zeitIdx.set(zeit[z], z);

  /* Ein Byte je (Zeit, Symbol): 0 = kein Rang, 1..255 = Perzentil.
   * 10.076 x 2.965 = 30 MB. Die Aufloesung von 1/254 reicht fuer Dezile. */
  var raenge = new Uint8Array(T * N);

  /* Je Symbol ein Zeiger, der mit der Zeitachse mitlaeuft - beide sind sortiert,
   * also kostet der Gleichlauf nichts. */
  var zeiger = new Int32Array(N);
  for (var q = 0; q < N; q++) zeiger[q] = vorlauf;

  var pufferWert = new Float64Array(N);
  var pufferId = new Int32Array(N);
  var ordnung = new Int32Array(N);
  var tageMitRang = 0;

  for (var ti = 0; ti < T; ti++) {
    var ms = zeit[ti], m = 0;
    for (var si = 0; si < N; si++) {
      var b = universum[syms[si]];
      var p = zeiger[si];
      while (p < b.length && b[p][0] < ms) p++;
      zeiger[si] = p;
      if (p >= b.length || b[p][0] !== ms) continue;
      var w = null;
      /* Wirft das Merkmal fuer einen Teil der Werte, wird das Perzentil nur ueber die
       * verbliebenen gebildet: "staerkstes Zehntel von 7" statt "von 14". Die Rangfolge
       * schrumpft, ohne dass es irgendwo steht. Der Vertrag lautet "Zahl oder null" -
       * ein Wurf ist ein Defekt, kein Normalfall, und wird deshalb gezaehlt. */
      try { w = merkmal(b, p); } catch (e) { w = null; baueQuerschnitt.merkmalFehler++; }
      if (w == null || !isFinite(w)) continue;
      pufferWert[m] = w; pufferId[m] = si; m++;
    }
    if (m < mindestWerte) continue;
    for (var k = 0; k < m; k++) ordnung[k] = k;
    var teil = Array.prototype.slice.call(ordnung, 0, m);
    teil.sort(function (a, b) { return pufferWert[a] - pufferWert[b]; });
    var basis = ti * N;
    for (var r = 0; r < m; r++) {
      /* 1 bleibt der schwaechste, 255 der staerkste. 0 heisst "kein Rang". */
      var pz = m > 1 ? r / (m - 1) : 0.5;
      raenge[basis + pufferId[teil[r]]] = 1 + Math.round(pz * 254);
    }
    tageMitRang++;
  }

  return {
    tage: tageMitRang,
    rang: function (sym, ms) {
      var ti = zeitIdx.get(ms);
      if (ti === undefined) return null;
      var si = symId[sym];
      if (si === undefined) return null;
      var b = raenge[ti * N + si];
      if (!b) return null;
      return { perzentil: (b - 1) / 254, n: N };
    },
  };
}

/* ---------- Ausstiegsregeln (C6/C7) ----------
 * Eine Regel liefert NUR ein Stop-Niveau, berechnet aus abgeschlossenen Kerzen:
 *   stopNiveau(abgeschlossen, einKurs, params) -> Zahl | null
 * abgeschlossen ist eine Liste von {auf, hoch, tief, schluss} - die Kerzen NACH dem
 * Einstieg, die bereits vorbei sind. Die laufende Kerze ist nie dabei.
 *
 * Die Maschine wendet das Niveau auf die naechste Kerze an und fuellt zum
 * SCHLECHTEREN aus Stop und erstem handelbaren Kurs. Genau diese beiden Regeln
 * haben am 23.08.2026 aus einem t von 15,7 ein t von -0,75 gemacht:
 *   erster Wurf (Hoch und Tief derselben Kerze):        +0,400 Pp, t 15,74
 *   ohne Vorgriff, aber Fuellung zum Wunschkurs:        +0,189 Pp, t  5,96
 *   mit ehrlicher Fuellung:                             -0,023 Pp, t -0,75
 * Der ganze scheinbare Nutzen war die Annahme, man haette den Hoechstkurs abgepasst
 * und werde bei jeder Luecke trotzdem zum Wunschkurs bedient. */
function fuehreAus(pfad, einKurs, stopNiveau, params) {
  var abgeschlossen = [];
  var stop = null;
  for (var k = 0; k < pfad.length; k++) {
    var p = pfad[k];
    /* Zuerst pruefen: Der Stop aus den VORHERIGEN Kerzen gilt fuer diese hier. */
    if (stop != null && p.tief <= stop) {
      /* Fuellpreis: der schlechtere aus Stop und erstem handelbaren Kurs. Wer bei
       * Eroeffnung schon unter dem Stop liegt, bekommt nicht den Stop. */
      return { kerze: k + 1, kurs: Math.min(stop, p.auf), grund: 'Stop' };
    }
    abgeschlossen.push(p);
    /* Erst JETZT darf die Regel rechnen - mit dieser Kerze als abgeschlossener. */
    var s = null;
    /* DER TEUERSTE STILLE AUSFALL DER MASCHINE. Wirft die Ausstiegsregel, bleibt stop
     * fuer immer null und JEDER Trade laeuft in den Zeitausstieg. Weil Signal UND
     * Kontrolle dieselbe fuehreAus benutzen, faellt der Stop auf beiden Seiten weg -
     * das Ergebnis sieht deshalb nicht kaputt aus, sondern plausibel. Es ist dann
     * keine fehlende Zahl, sondern eine FALSCHE Zahl mit Vorzeichen, auf die jemand
     * eine Handelsentscheidung stuetzt.
     * Gezaehlt statt geworfen, damit ein Lauf nicht mitten in der Auswertung abbricht -
     * messe() weist ihn dafuer als defekt aus, nicht als Ergebnis. */
    try { s = stopNiveau(abgeschlossen, einKurs, params); }
    catch (e) {
      s = null;
      fuehreAus.fehler = (fuehreAus.fehler || 0) + 1;
      if (!fuehreAus.letzterFehler) fuehreAus.letzterFehler = String((e && e.message) || e).slice(0, 120);
    }
    stop = (typeof s === 'number' && isFinite(s)) ? s : null;
  }
  return { kerze: pfad.length, kurs: pfad[pfad.length - 1].schluss, grund: 'Zeit' };
}

/* ---------- SELBSTPRUEFUNG: der Placebo-Lauf ----------
 * Ein Signal ohne jeden Kursbezug, das die Sitzungspositionen des echten Signals
 * nachbildet. Wahrer Ueberschuss = 0. Was hier herauskommt, ist der Nullpunkt der
 * Maschine auf DIESEN Daten und in DIESEN Toepfen.
 *
 * positionen: {position -> Zahl der echten Signale}. Der Placebo feuert auf
 * denselben Positionen, mit einem festen Schritt so gewaehlt, dass ungefaehr
 * dieselbe Menge zusammenkommt. Kein Zufall - derselbe Aufruf ergibt dasselbe. */
function placeboLauf(U, K, H, schnittTag, vorlauf, leseFenster, positionen, haelfte, konvention, ausKonvention) {
  /* S7: Bis zum 25.08.2026 lief der Placebo NUR auf der Bestaetigung. Damit hatte die
   * Entdeckungshaelfte keinen geprueften Nullpunkt - und genau von dort kommen die
   * Zahlen, auf die Kandidaten vorregistriert werden. Beide Kandidaten vom 25.08. sind
   * so angemeldet worden. Der Aufrufer sagt jetzt, welche Haelfte gemeint ist. */
  var ZIEL = haelfte || 'bestaetigung';
  var gesamtEcht = 0;
  Object.keys(positionen).forEach(function (p) { gesamtEcht += positionen[p]; });
  if (!gesamtEcht) return null;

  /* Wie viele Kerzen stehen je Position ueberhaupt zur Verfuegung? Daraus ergibt
   * sich der Schritt, mit dem der Placebo auf dieselbe Haeufigkeit kommt. */
  var verfuegbar = {};
  Object.keys(U).forEach(function (sym) {
    var b = U[sym], POS = sitzungsSchicht(b);
    for (var i = vorlauf; i < b.length - H; i++) {
      var p = POS[i];
      if (positionen[p] == null) continue;
      verfuegbar[p] = (verfuegbar[p] || 0) + 1;
    }
  });
  var schritt = {};
  Object.keys(positionen).forEach(function (p) {
    schritt[p] = Math.max(1, Math.round((verfuegbar[p] || 0) / Math.max(1, positionen[p])));
  });

  var ueber = [], zaehler = {}, ohne = 0, n = 0;
  Object.keys(U).forEach(function (sym) {
    var b = U[sym], POS = sitzungsSchicht(b);
    for (var i = vorlauf; i < b.length - H; i++) {
      var p = POS[i];
      if (positionen[p] == null) continue;
      zaehler[p] = (zaehler[p] || 0) + 1;
      if (zaehler[p] % schritt[p] !== 0) continue;     // fester Schritt, kein Zufall
      /* #88 (26.08.2026): hier stand fest der SCHLUSS der Signalkerze, unabhaengig von
       * der Einstiegskonvention - waehrend das Signal und BEIDE Kontrollen laengst
       * einstiegKurs() benutzen. Bei folgeEroeffnung mass der Placebo damit
       * E[Schluss(i)->Schluss(i+H)] minus E[Eroeffnung(i+1)->Schluss(i+H)], also die
       * mittlere Uebernachtluecke als Schein-Ueberschuss - ausgerechnet im
       * Nullpunktwaechter, der das Urteil "bestaetigt" freigibt. Ein verschobener
       * Nullpunkt im Waechter ist schlimmer als gar keiner: an ihn gewoehnt man sich. */
      var s0 = einstiegKurs(b, i, konvention), sH = ausstiegKurs(b, i + H, ausKonvention);
      if (!(s0 > 0) || !(sH > 0)) continue;
      var tag = tagVon(b[i][0]);
      var hf = tag < schnittTag ? 'entdeckung' : 'bestaetigung';
      if (hf !== ZIEL) continue;                       // S7: je Haelfte ein Nullpunkt
      var erw = K.erwartung(sym, p, hf,
        leseFenster == null ? null : i - leseFenster - H,
        leseFenster == null ? null : i + H - 1);
      if (erw == null) { ohne++; continue; }
      ueber.push({ tag: tag, wert: (sH / s0 - 1) - erw });
      n++;
    }
  });
  if (n < 100) return null;
  var tm = tagesMittel(ueber);
  var st = statistik(tm.mittel, H - 1);
  return { signale: n, ohneKontrolle: ohne, tage: st.n,
    tagesmittel: st.mittel, t: st.t, mde: st.mde };
}

/* ---------- QUERSCHNITTS-KONTROLLE ----------
 * Erwartung = Mittel aller ANDEREN Werte zur selben Kerzenzeit.
 *
 * Gegenstueck zu baueKontrolle (A7), die ueber die Zeit desselben Symbols mittelt. Beide
 * beantworten verschiedene Fragen:
 *   A7          "laeuft dieser Wert nach dem Signal anders als sonst?"
 *   Querschnitt "laeuft dieser Wert nach dem Signal anders als der Rest des Marktes?"
 * Die zweite rechnet den gemeinsamen Marktzug heraus - genau den Anteil, der die
 * Tagesstreuung aufblaeht.
 *
 * ACHTUNG, das ist keine Verbesserung fuer jede Strategie: Wer einen grossen Teil des
 * Universums gleichzeitig kauft (monatswende-breit: 74,7 %, monatsende-kauf: 100 %),
 * dessen "andere Werte" SIND das eigene Portfolio. Dort geht der Ueberschuss per
 * Konstruktion gegen null, und das ist kein Befund, sondern eine Probe auf dieses
 * Werkzeug: ginge er dort NICHT gegen null, waere die Implementierung falsch. */
function baueQuerschnittKontrolle(universum, haltedauerKerzen, vorlauf, stopNiveau, params, konvention, ausKonvention) {
  var Q = new Map();          // Zeitstempel -> { wert: [] }  spaeter { summe, n, lo, hi }
  Object.keys(universum).forEach(function (sym) {
    var b = universum[sym];
    for (var i = vorlauf; i < b.length - haltedauerKerzen; i++) {
      var s0 = einstiegKurs(b, i, konvention); if (!(s0 > 0)) continue;
      var sH = ausstiegKurs(b, i + haltedauerKerzen, ausKonvention); if (!(sH > 0)) continue;
      var ende = sH;
      if (typeof stopNiveau === 'function') {
        var pf = [];
        for (var pk = i + 1; pk <= i + haltedauerKerzen; pk++) {
          pf.push({ auf: eroeffnungKurs(b, pk), hoch: b[pk][3] != null ? b[pk][3] : b[pk][1],
            tief: b[pk][4] != null ? b[pk][4] : b[pk][1], schluss: b[pk][1] });
        }
        var aA = fuehreAus(pf, s0, stopNiveau, params);
        /* Nur der ZEIT-Ausstieg folgt der Konvention. Ein Stop fuellt zu seinem
         * Niveau, egal wann - dort waere die Eroeffnung der Ausstiegskerze eine
         * Ausfuehrung, die es nicht gibt. Dieselbe Ausnahme steht im Signalpfad. */
        ende = aA.grund === 'Zeit' ? sH : aA.kurs;
      }
      var ms = b[i][0];
      var z = Q.get(ms); if (!z) { z = { wert: [] }; Q.set(ms, z); }
      z.wert.push(ende / s0 - 1);
    }
  });

  /* Stutzen wie in baueKontrolle - dieselbe Schranke, damit die beiden Kontrollen
   * vergleichbar bleiben. Die Grenzen bleiben stehen: die Auslassung des eigenen Werts
   * muss ihn an DENSELBEN Grenzen klippen, sonst zieht sie etwas ab, was nie drin war. */
  var STUTZ_QS = 0.01;
  var gestutzt = 0, toepfe = 0;
  Q.forEach(function (z) {
    var n = z.wert.length;
    toepfe++;
    z.lo = -Infinity; z.hi = Infinity;
    if (n >= 50) {
      var sortiert = z.wert.slice().sort(function (a, b) { return a - b; });
      var k = Math.floor(n * STUTZ_QS);
      z.lo = sortiert[k]; z.hi = sortiert[n - 1 - k];
      for (var q = 0; q < n; q++) {
        if (z.wert[q] < z.lo) { z.wert[q] = z.lo; gestutzt++; }
        else if (z.wert[q] > z.hi) { z.wert[q] = z.hi; gestutzt++; }
      }
    }
    var s = 0;
    for (var q2 = 0; q2 < n; q2++) s += z.wert[q2];
    z.summe = s; z.n = n;
    z.wert = null;            // Speicher frei - fuer die Auslassung genuegen lo/hi
  });
  baueQuerschnittKontrolle.gestutzt = gestutzt;
  baueQuerschnittKontrolle.toepfe = toepfe;

  return {
    /* eigenerWert ist die UNGERICHTETE Rendite des Signals - genau die Groesse, die auch
     * in den Topf gewandert ist. Sie wird an denselben Grenzen geklippt und abgezogen. */
    erwartung: function (ms, eigenerWert) {
      var z = Q.get(ms);
      if (!z || z.n < 21) return null;      // nach der Auslassung muessen 20 uebrig bleiben
      var eigen = eigenerWert < z.lo ? z.lo : (eigenerWert > z.hi ? z.hi : eigenerWert);
      return (z.summe - eigen) / (z.n - 1);
    }
  };
}

/* ============================================================================
 * HAUPTFUNKTION
 * strategie: { key, grund, zeitrahmen, haltedauerKerzen, signal(bars,i,params,rang,sym)->{dir}|null,
 *              stopNiveau?(abgeschlossen, einKurs, params) -> Zahl|null,
 *              testfamilie?: {name, testsGesamt, begruendung},
 *              leseFensterKerzen?: Zahl - wie weit das Signal zurueckliest (A7),
 *              querschnitt?: {merkmal(bars,i)->Zahl|null, mindestWerte} - dann bekommt
 *                            signal einen vierten Parameter rang={perzentil,n}|null,
 *              params, varianten?: [params...], richtung: 'long'|'short'|'beide',
 *              universum?: 'aktien'|'alle'|function(sym), kosten?: {spanneBp} }
 * archivPfad: Ordner mit bars_<iv>_<SYM>.json
 * ========================================================================== */
function messe(strategie, archivPfad, optionen) {
  optionen = optionen || {};
  fuehreAus.fehler = 0; fuehreAus.letzterFehler = '';
  var P = new Protokoll();
  var start = Date.now();
  var S = strategie;

  /* --- Vorregistrierung pruefen: ohne Grund keine Messung --- */
  if (!S.grund || String(S.grund).trim().length < 20) {
    return { verweigert: true, grund: 'Strategie ohne Begruendung (mindestens 20 Zeichen). Ein Preismuster ohne Grund ist eine Beobachtung, keine These.' };
  }
  if (!(S.haltedauerKerzen > 0) || S.haltedauerKerzen !== Math.floor(S.haltedauerKerzen)) {
    return { verweigert: true, grund: 'haltedauerKerzen muss eine ganze Kerzenzahl sein (C1: keine Minuten, keine Wanduhrzeit).' };
  }
  /* C1, zweite Sicherung: Minuten und Kerzen sind beide ganze Zahlen - am Typ nicht zu
   * unterscheiden. Aber an der Groesse: 480 Stundenkerzen waeren 69 Handelstage, das
   * haelt keine Intraday-Regel. Alles ueber 130 Kerzen (= 20 Handelstage auf 60m) ist
   * mit hoher Wahrscheinlichkeit eine Minutenzahl, die jemand fuer Kerzen gehalten hat. */
  if (S.haltedauerKerzen > 130) {
    return { verweigert: true, grund: 'haltedauerKerzen=' + S.haltedauerKerzen + ' sieht nach Minuten aus (C1). Auf 60m sind 480 Minuten = 8 Kerzen. Mehr als 130 Kerzen (20 Handelstage) werden nicht akzeptiert.' };
  }
  if (typeof S.signal !== 'function') return { verweigert: true, grund: 'signal(bars, i, params) fehlt.' };

  var varianten = Array.isArray(S.varianten) && S.varianten.length ? S.varianten : [S.params || {}];
  P.entscheide('B4 Testzahl', { varianten: varianten.length }, varianten.length,
    'Jede Parametervariante ist ein eigener Test. Die Schwelle wird auf diese Zahl gerechnet.');
  /* B8: Gehoert die Datei zu einer groesseren Vorregistrierung, zaehlt deren Umfang.
   * Nur nach oben - eine zu klein angegebene Familie schuetzt niemanden. */
  P.tests = varianten.length;
  if (S.testfamilie && S.testfamilie.testsGesamt > P.tests) {
    P.tests = S.testfamilie.testsGesamt;
    P.entscheide('B8 Testfamilie', { name: S.testfamilie.name, varianten: varianten.length,
      testsGesamt: S.testfamilie.testsGesamt },
      { testsFuerSchwelle: P.tests },
      'Diese Datei ist Teil der Vorregistrierung "' + S.testfamilie.name + '". Die Bonferroni-Schwelle ' +
      'rechnet mit allen ' + S.testfamilie.testsGesamt + ' Tests der Familie, nicht nur mit den ' +
      varianten.length + ' Varianten dieser Datei. ' + (S.testfamilie.begruendung || ''));
  }

  /* --- Universum --- */
  /* Integritaetsschranke (27.08.2026, PM-Auftrag): Ohne Wertpapier-Klassifizierung
   * laesst der Aktienfilter der Strategien ALLES durch - das Universum waere still
   * ~verdreifacht, und kein Protokollfeld hielte es fest. Gemessen am 27.08.: von
   * allen Aufrufern des Moduls prueft das sonst niemand. Deshalb: der Zustand steht
   * ab jetzt IMMER in E1 (auch wenn er gesund ist - sonst ist ein altes Protokoll
   * von einem neuen nicht unterscheidbar), und ohne Klassifizierung wird verweigert. */
  var WPK = require(path.join(__dirname, 'strategien', 'wertpapierart.js'));
  var klassifizierung = WPK.klassifizierungDa();
  if (!klassifizierung) {
    return { verweigert: true, grund: 'Wertpapier-Klassifizierung fehlt oder unbrauchbar (wertpapierarten.json) - ' +
      'der Universumsfilter wuerde alles durchlassen und still auf dem ganzen Archiv messen.' };
  }
  var filter = null;
  if (typeof S.universum === 'function') filter = S.universum;
  else if (S.universum === 'aktien' || !S.universum) filter = function (sym) { return sym.indexOf('-USD') === -1; };
  var U = ladeUniversum(archivPfad, S.zeitrahmen || '60m', filter);
  var syms = Object.keys(U);
  P.entscheide('E1 Universum', { archiv: archivPfad, zeitrahmen: S.zeitrahmen || '60m', filter: S.universum || 'aktien' },
    { werte: syms.length, klassifizierungDa: klassifizierung },
    'Das Universum ist "alles, was heute im Archiv liegt". Das sind Ueberlebende: Werte, die aus der Beobachtung ' +
    'geflogen sind, fehlen. Die Renditen laufen ueber Zeitraeume, in denen das noch nicht bekannt war. ' +
    'Jede positive Rohrendite ist dadurch nach oben verzerrt; die Groesse der Verzerrung ist hier NICHT gemessen.');
  if (syms.length < 10) return { verweigert: true, grund: 'Weniger als 10 Werte im Universum.' };

  /* --- Zeitachse und Schnitt (B5) --- */
  var alleTage = {};
  syms.forEach(function (s) { U[s].forEach(function (b) { alleTage[tagVon(b[0])] = 1; }); });
  var tage = Object.keys(alleTage).sort();
  var schnittIdx = Math.floor(tage.length * VERFAHREN.bestaetigungsAnteil);
  var schnittTag = tage[schnittIdx];
  P.entscheide('B5 Schnitt', { handelstage: tage.length, anteil: VERFAHREN.bestaetigungsAnteil }, { schnittTag: schnittTag, entdeckung: schnittIdx, bestaetigung: tage.length - schnittIdx },
    'Entdeckung auf der ersten Haelfte der Handelstage, Bestaetigung auf der zweiten. Das Urteil faellt NUR auf der Bestaetigung.');

  /* --- Kontrolle (A1-A5) --- */
  var H = S.haltedauerKerzen, vorlauf = VERFAHREN.mindestKerzenVorlauf;
  /* Die Kontrolle wird je Variante gebraucht, wenn es eine Ausstiegsregel gibt -
   * ihre Parameter aendern ja den Ausstieg. Ohne Regel genuegt eine, dann wird sie
   * einmal gebaut und geteilt.
   * (Bis 23.08.2026 stand hier varianten[0] und damit lief die Kontrolle fuer ALLE
   * Stufen mit den Parametern der ersten - bei rsi2seit-mcp also durchweg mcp 0,9.
   * Der Kommentar forderte schon damals das Gegenteil.) */
  /* Querschnitt einmal fuer alle Varianten - das Merkmal haengt nicht an den
   * Variantenparametern, nur die Schwelle tut es. */
  var QS = null;
  if (S.querschnitt && typeof S.querschnitt.merkmal === 'function') {
    var mindest = S.querschnitt.mindestWerte || 50;
    QS = baueQuerschnitt(U, S.querschnitt.merkmal, vorlauf, mindest);
    P.entscheide('E4 Querschnitt', { mindestWerte: mindest },
      { tageMitRangfolge: QS.tage },
      'Die Werte werden GEGENEINANDER gestellt, nicht jeder mit sich selbst. An ' + QS.tage +
      ' Tagen lagen mindestens ' + mindest + ' Werte vor. Geprueft wird an JEDEM solchen Tag - ' +
      'nicht auf einem Umschichtungsraster, dessen Lage eine willkuerliche Wahl unter vielen waere (B9).');
    if (!QS.tage) P.warne('E4', 'Keine einzige Rangfolge zustande gekommen - Merkmal oder Mindestzahl pruefen.');
  }

  /* D3: Die Konvention steht in der Strategiedatei und im Protokoll - sie ist nie frei
   * waehlbar und wird nie danach gesetzt, welcher Lauf besser aussieht. */
  var KONVENTION = S.einstiegsZeitpunkt || 'schlusskerze';
  if (KONVENTION !== 'schlusskerze' && KONVENTION !== 'folgeEroeffnung') {
    return { verweigert: true, grund: 'einstiegsZeitpunkt muss schlusskerze oder folgeEroeffnung sein, nicht "' + KONVENTION + '".' };
  }
  /* AUSSTIEGSKONVENTION (26.08.2026, Vorregistrierung glockendruck-nacht Abschnitt 9).
   * Der Name heisst ausstiegsZeitpunkt, nicht ausstieg: 'ausstieg' ist im PROTOKOLL
   * bereits vergeben - dort beschreibt es, WIE ausgestiegen wurde ({art, mittlereKerzen}).
   * Zwei verschiedene Dinge duerfen nicht denselben Namen tragen.
   * Wer die alte Schreibweise benutzt, bekommt eine VERWEIGERUNG statt eines stillen
   * Nichtstuns: ein ignorierter Schalter waere hier der teuerste aller Fehler - die
   * Messung liefe durch und beantwortete eine andere Frage. */
  if (S.ausstieg !== undefined) {
    return { verweigert: true, grund: 'Der Schalter heisst ausstiegsZeitpunkt, nicht ausstieg - ' +
      'ausstieg ist im Protokoll fuer die Ausstiegsbeschreibung vergeben. Bitte umbenennen.' };
  }
  var AUS_KONVENTION = S.ausstiegsZeitpunkt || 'schluss';
  if (AUS_KONVENTION !== 'schluss' && AUS_KONVENTION !== 'folgeEroeffnung') {
    return { verweigert: true, grund: 'ausstiegsZeitpunkt muss schluss oder folgeEroeffnung sein, nicht "' + AUS_KONVENTION + '".' };
  }
  P.entscheide('C8 Einstiegskonvention', { einstiegsZeitpunkt: KONVENTION },
    { gilt_fuer: 'Signal und beide Kontrollen' },
    KONVENTION === 'schlusskerze'
      ? 'Einstieg zum Schluss der Signalkerze - dem Kurs, der im Augenblick der Signalbildung schon vorbei ist. '
        + 'Zweig E hat gemessen: innerhalb der Sitzung folgenlos (-0,00003 Pp ueber 11,8 Mio Faelle), an der '
        + 'Sitzungsgrenze +0,055 Pp bei sd 1,7652. Wer auf der Schlusskerze feuert, misst eine Uebernachtluecke mit.'
      : 'Einstieg zum ersten handelbaren Kurs NACH dem Signal (Eroeffnung der Folgekerze). Gilt fuer Signal und '
        + 'beide Kontrollen - nur den Signalpfad umzustellen waere ein C7-Fehler.');
  P.entscheide('C9 Ausstiegskonvention', { ausstiegsZeitpunkt: AUS_KONVENTION },
    { gilt_fuer: 'Signal, beide Kontrollen und der Placebo', verankert_an: 'Kerze i+H' },
    AUS_KONVENTION === 'schluss'
      ? 'Ausstieg zum Schluss der Kerze i+H - wie bisher.'
      : 'Ausstieg zur EROEFFNUNG der Kerze i+H. Die Haltedauer aendert sich dadurch nicht; der Schalter '
        + 'waehlt innerhalb derselben Kerze. Fehlt dort ein echter Eroeffnungskurs, wird das Signal '
        + 'AUSGEWORFEN und nicht auf den Vorkerzen-Schluss zurueckgesetzt - der waere bei H=1 der '
        + 'Einstiegskurs der Schluss-Fassung und wuerde den gesuchten Unterschied unsichtbar gegen null '
        + 'verduennen. Ein Stop-Ausstieg fuellt weiter zu seinem Niveau, nicht zur Eroeffnung.');

  var hatAusstieg = typeof S.stopNiveau === 'function';
  var kontrollen = {};
  function kontrolleFuer(vi) {
    var schluessel = hatAusstieg ? String(vi) : 'gemeinsam';
    if (!kontrollen[schluessel]) {
      kontrollen[schluessel] = baueKontrolle(U, H, schnittTag, vorlauf,
        hatAusstieg ? S.stopNiveau : null, varianten[vi], KONVENTION, AUS_KONVENTION);
    }
    return kontrollen[schluessel];
  }

  /* A7: Wie weit liest das Signal zurueck? Ohne Angabe kann die Maschine das
   * Lesefenster nicht aus der Kontrolle nehmen - und genau daraus entsteht A6. */
  var leseFenster = (typeof S.leseFensterKerzen === 'number' && S.leseFensterKerzen >= 0)
    ? Math.floor(S.leseFensterKerzen) : null;
  P.entscheide('A7 Lesefenster', { leseFensterKerzen: S.leseFensterKerzen == null ? null : S.leseFensterKerzen },
    { angewandt: leseFenster != null, fensterKerzen: leseFenster },
    leseFenster != null
      ? 'Die Kontrolle mittelt ueber den Topf OHNE die Kerzen [i-' + (leseFenster + H) + ', i+' + (H - 1) + ']. ' +
        'Der Ausschnitt beginnt H Kerzen VOR dem Lesefenster: eine Kontrollkerze j traegt die Rendite ' +
        'ueber (j, j+H] und beruehrt das Lesefenster deshalb schon ab j = i-lese-H (F2). ' +
        'Damit enthaelt sie nichts, was das Signal gelesen hat, und nichts, was sich mit dem Ergebnis ueberlappt. ' +
        'Der Erwartungswert des Ueberschusses ist unter der Nullhypothese exakt null.'
      : 'KEINE Angabe leseFensterKerzen. Die Kontrolle enthaelt moeglicherweise Kerzen, die das Signal gelesen hat. ' +
        'Genau daraus entsteht die Nullpunktverschiebung A6. Das Urteil ist ohne diese Angabe nicht belastbar.');
  if (leseFenster == null) {
    P.warne('A7', 'Strategie gibt kein leseFensterKerzen an. Die Kontrolle wurde NICHT um das Lesefenster ' +
      'bereinigt; eine Nullpunktverschiebung ist moeglich (Groessenordnung 0,02-0,04 Pp je Signal, ' +
      'Vorzeichen je nach Bauart des Signals). Nachmessen mit messen-mit-null.js oder Angabe ergaenzen.');
  }
  /* C7: Ob das Archiv Eroeffnungskurse fuehrt, entscheidet, wie genau ein Stop
   * gefuellt wird. Das gehoert ins Protokoll, nicht in eine stille Annahme. */
  var mitO = 0, ohneO = 0;
  Object.keys(U).forEach(function (sy) {
    var bb = U[sy];
    for (var q = 0; q < bb.length; q += 97) {          // Stichprobe, jede 97. Kerze
      if (bb[q].length > 5 && bb[q][5] > 0) mitO++; else ohneO++;
    }
  });
  var anteilO = (mitO + ohneO) ? mitO / (mitO + ohneO) : 0;
  P.entscheide('C7 Eroeffnungskurs', { stichprobe: mitO + ohneO },
    { anteilMitEroeffnung: Math.round(anteilO * 1000) / 1000 },
    anteilO > 0.99
      ? 'Das Archiv fuehrt Eroeffnungskurse. Ein Stop wird zum schlechteren aus Stop und ECHTEM ' +
        'Eroeffnungskurs gefuellt.'
      : 'Das Archiv fuehrt ' + (anteilO * 100).toFixed(1) + ' % Eroeffnungskurse. Fuer den Rest dient der ' +
        'Schluss der Vorkerze als Naeherung - bei Uebernachtluecken liegt die daneben (14,3 % aller Kerzen ' +
        'folgen auf eine Luecke, 40,6 % davon springen ueber 1 %).');
  if (anteilO <= 0.99) P.warne('C7', 'Nur ' + (anteilO * 100).toFixed(1) + ' % der Kerzen haben einen ' +
    'Eroeffnungskurs. Fuellpreise bei Luecken sind genaehert.');

  P.entscheide('A2 Kontrolle', { art: VERFAHREN.kontrolle, haltedauerKerzen: H },
    'Erwartung ueber ALLE Kerzen desselben Symbols zur selben UTC-Stunde, getrennt je Haelfte',
    'Keine Zufallsziehung (A2), keine Listenpaarung (A3), kein Zeitbezug zum Signal (A4), je Haelfte getrennt (A5). ' +
    'Der Ueberschuss gegen diese Erwartung ist die Aussage; die Rohrendite allein ist keine.');

  /* Die Querschnitts-Kontrolle haengt wie die A7-Kontrolle am Ausstieg, also an den
   * Parametern - deshalb je Variante, mit demselben Zwischenspeicher-Muster. */
  var QSK = {};
  function querschnittFuer(vi) {
    var schluessel = hatAusstieg ? vi : 0;
    if (!QSK[schluessel]) {
      QSK[schluessel] = baueQuerschnittKontrolle(U, H, vorlauf,
        hatAusstieg ? S.stopNiveau : null, varianten[schluessel], KONVENTION, AUS_KONVENTION);
    }
    return QSK[schluessel];
  }

  /* S9: DIE EINSTIEGSLUECKE. Die Maschine steigt zum SCHLUSS der Signalkerze ein
   * (messmaschine.js, unten: s0 = b[i][1]). Sitzt der Ertrag einer Strategie in der
   * Luecke zwischen diesem Schluss und der naechsten Eroeffnung, ist er nicht
   * handelbar - man kann nicht zu einem Kurs kaufen, den es erst nach dem Kauf gibt.
   * Bei 'schlussdruck-gegentag' waren das gemessene 67 % des Ueberschusses.
   * Bisher war diese Zahl eine stille Null: sie wurde nie berechnet und nie berichtet.
   * Gemessen wird ZENTRIERT - die Luecke auf den Signalkerzen gegen dieselbe Groesse
   * ueber alle Kerzen derselben Symbole. Sonst misst man die allgemeine Ueber-Nacht-
   * Drift statt der Auswahl. */
  var LUECKE_BASIS = null;
  function lueckeBasis() {
    if (LUECKE_BASIS !== null) return LUECKE_BASIS;
    var s = 0, n = 0;
    syms.forEach(function (sym) {
      var b = U[sym];
      /* A9: dieselben Grenzen wie die Signalschleife (vorlauf .. length-H). Ab Kerze 0 zu
       * mitteln waere ein Vergleich gegen Kerzen, auf denen das Signal gar nicht feuern
       * kann - und die fruehen Kerzen einer Reihe sind gerade die unruhigsten. Der
       * bestehende A9-Wachhund hat genau diesen Fehler in der ersten Fassung gefangen. */
      for (var i = vorlauf; i < b.length - H; i++) {
        var c = b[i][1], o = eroeffnungKurs(b, i + 1);
        if (!(c > 0) || !(o > 0)) continue;
        s += o / c - 1; n++;
      }
    });
    LUECKE_BASIS = n ? { mittel: s / n, n: n } : { mittel: null, n: 0 };
    return LUECKE_BASIS;
  }

  /* --- Je Variante messen --- */
  var spanneBp = (S.kosten && S.kosten.spanneBp != null) ? S.kosten.spanneBp : 5;
  var ergebnisse = varianten.map(function (params, vi) {
    var K = kontrolleFuer(vi), QK = querschnittFuer(vi);
    /* GEPAARTE Teilmenge: nur Signale, fuer die BEIDE Erwartungen existieren. Ohne das
     * vergleicht man zwei verschiedene Stichproben und nennt den Unterschied Methode. */
    var paarA7 = [], paarQS = [], ohneQuerschnitt = 0;
    var roh = [], ueber = [], ohneKontrolle = 0, nSignale = 0, nLong = 0, nShort = 0;
    var gruende = {}, kerzenSumme = 0;
    var posZaehler = {};      // fuer den Placebo: wo feuert das echte Signal?
    var lueckeSumme = 0, lueckeN = 0;   // S9: Eroeffnung[i+1] gegen Schluss[i]
    syms.forEach(function (sym) {
      var b = U[sym];
      for (var i = vorlauf; i < b.length - H; i++) {
        var sig = null;
        var rang = QS ? QS.rang(sym, b[i][0]) : null;
        /* Das Symbol wird mitgegeben: eine Strategie, die Ertragstermine, Branche oder
         * Kennzahlen braucht, soll es nicht aus den Kursen zurueckrechnen muessen. */
        try { sig = S.signal(b, i, params, rang, sym); } catch (e) { gruende.fehler = (gruende.fehler || 0) + 1; continue; }
        if (!sig || !sig.dir) continue;
        var dir = sig.dir > 0 ? 1 : -1;
        if (S.richtung === 'long' && dir < 0) continue;
        if (S.richtung === 'short' && dir > 0) continue;
        nSignale++; if (dir > 0) nLong++; else nShort++;
        var _p = sitzungsSchicht(b)[i];
        posZaehler[_p] = (posZaehler[_p] || 0) + 1;
        /* S9: die Luecke NACH der Signalkerze - der Teil des Ertrags, den ein Einstieg
         * zum Schluss dieser Kerze per Konstruktion nicht mitnehmen kann. */
        if (i + 1 < b.length) {
          var _c = b[i][1], _o = eroeffnungKurs(b, i + 1);
          if (_c > 0 && _o > 0) { lueckeSumme += _o / _c - 1; lueckeN++; }
        }
        var s0 = einstiegKurs(b, i, KONVENTION), sH = ausstiegKurs(b, i + H, AUS_KONVENTION);
        /* Fehlt der Ausstiegskurs, wird das Signal ausgeworfen statt still ersetzt -
         * die Zahl steht als gruende.kurs im Protokoll. */
        if (!(s0 > 0) || !(sH > 0)) { gruende.kurs = (gruende.kurs || 0) + 1; continue; }
        /* Mit Ausstiegsregel: den Kursverlauf der Haltedauer sammeln und die Regel
         * anwenden. Ohne Regel bleibt es beim Zeit-Ausstieg - dann ist sH der Schluss
         * nach H Kerzen, wie bisher. */
        var ausKurs = sH, ausKerze = H, ausGrund = 'Zeit';
        if (typeof S.stopNiveau === 'function') {
          var pfad = [];
          for (var pk = i + 1; pk <= i + H; pk++) {
            pfad.push({ auf: eroeffnungKurs(b, pk),
              hoch: b[pk][3] != null ? b[pk][3] : b[pk][1],
              tief: b[pk][4] != null ? b[pk][4] : b[pk][1],
              schluss: b[pk][1] });
          }
          var a = fuehreAus(pfad, s0, S.stopNiveau, params);
          /* Nur der ZEIT-Ausstieg folgt der Konvention; ein Stop fuellt zu seinem
           * Niveau. Ohne diese Unterscheidung wuerde ein Stop-Ausstieg zur Eroeffnung
           * der letzten Kerze umgebogen - eine Ausfuehrung, die es nicht gibt. */
          ausKurs = a.grund === 'Zeit' ? sH : a.kurs; ausKerze = a.kerze; ausGrund = a.grund;
          gruende['aus_' + ausGrund] = (gruende['aus_' + ausGrund] || 0) + 1;
          kerzenSumme += ausKerze;
        }
        var tag = tagVon(b[i][0]), hf = tag < schnittTag ? 'entdeckung' : 'bestaetigung';
        /* F2: Eine Kontrollkerze mit Index j traegt die Rendite ueber (j, j+H].
         * Sie beruehrt das Lesefenster [i-lese, i] schon ab j = i-lese-H, nicht
         * erst ab i-lese. Der Ausschnitt beginnt deshalb H Kerzen frueher -
         * sonst bleiben genau die Kerzen im Topf, auf die das Signal selektiert
         * hat (gemessen: auf einem Kunstarchiv mit wahrem Wert null +0,048 Pp
         * statt +0,024). */
        var erw = K.erwartung(sym, sitzungsSchicht(b)[i], hf,
          leseFenster == null ? null : i - leseFenster - H,
          leseFenster == null ? null : i + H - 1);
        if (erw == null) { ohneKontrolle++; continue; }
        var rUngerichtet = ausKurs / s0 - 1;
        var r = rUngerichtet * dir;                        // C3: Anteil
        roh.push({ tag: tag, hf: hf, wert: r });
        ueber.push({ tag: tag, hf: hf, wert: r - erw * dir });   // Ueberschuss gegen die Erwartung
        /* Zweite Erwartung: der Rest des Marktes zur selben Kerzenzeit. */
        var erwQ = QK.erwartung(b[i][0], rUngerichtet);
        if (erwQ == null) { ohneQuerschnitt++; }
        else {
          paarA7.push({ tag: tag, hf: hf, wert: r - erw * dir });
          paarQS.push({ tag: tag, hf: hf, wert: r - erwQ * dir });
        }
      }
    });
    function teil(liste, hf) { return liste.filter(function (e) { return e.hf === hf; }); }
    function block(liste) {
      /* B10: H-1 Verzoegerungen - so weit ueberlappen die Ergebnisfenster. */
      var tm = tagesMittel(liste), st = statistik(tm.mittel, H - 1), js = jeSignal(liste);
      return { tage: st.n, signale: js.n,
        tagesmittel: st.mittel, t: st.t, se: st.se, mde: st.mde,          // B1: Teststatistik ueber Tage
        /* #98 (26.08.2026): DIESE ZEILE FEHLTE. statistik() rechnet den Faktor laengst
         * (se/seNaiv), aber block() reichte ihn nicht weiter - und der einzige Leser
         * weiter unten filtert auf "nicht null". Die Liste war also IMMER leer: der
         * B10-Eintrag stand in keinem der 38 Protokolle, und die Warnung ab Faktor 3
         * konnte nie feuern. Die Newey-West-Korrektur selbst hat immer gewirkt - nur
         * ihre Sichtbarkeit fehlte, und damit die Warnung, wie STARK sie wirkt.
         * ABSICHTLICH kein rohes sd daneben (siehe #86): der Faktor ist eine
         * Verhaeltniszahl und verleitet zu keiner falschen Rechnung. */
        ueberlappungsFaktor: st.ueberlappungsFaktor,
        jeSignal: js.mittel, anteilPositiv: js.anteilPositiv };           // B2: die handelbare Zahl
    }
    var E = { roh: block(teil(roh, 'entdeckung')), ueberschuss: block(teil(ueber, 'entdeckung')) };
    var B = { roh: block(teil(roh, 'bestaetigung')), ueberschuss: block(teil(ueber, 'bestaetigung')) };
    var G = { roh: block(roh), ueberschuss: block(ueber) };
    // C5: Kosten einmal, an einer Stelle, als eigenes Feld
    var kostenAnteil = 2 * spanneBp / 10000;
    var _lb = lueckeBasis();
    var _lm = lueckeN ? lueckeSumme / lueckeN : null;
    return { variante: vi, params: params, signale: nSignale, long: nLong, short: nShort,
      positionen: posZaehler,
      einstiegsluecke: { signalMittel: _lm, universumMittel: _lb.mittel, n: lueckeN,
        zentriert: (_lm != null && _lb.mittel != null) ? _lm - _lb.mittel : null },
      /* Die Eichung: beide Kontrollen auf DENSELBEN Signalen, je Haelfte. */
      querschnitt: {
        ohneErwartung: ohneQuerschnitt,
        entdeckung: { a7: block(teil(paarA7, 'entdeckung')), qs: block(teil(paarQS, 'entdeckung')) },
        bestaetigung: { a7: block(teil(paarA7, 'bestaetigung')), qs: block(teil(paarQS, 'bestaetigung')) }
      },
      ausstieg: typeof S.stopNiveau === 'function'
        ? { art: 'Regel', mittlereKerzen: nSignale ? kerzenSumme / nSignale : null,
            hinweis: 'Stop-Niveau nur aus abgeschlossenen Kerzen; Fuellung zum schlechteren aus Stop und erstem handelbaren Kurs.' }
        : { art: 'Zeit', mittlereKerzen: H },
      ohneKontrolle: ohneKontrolle, verworfen: gruende,
      entdeckung: E, bestaetigung: B, gesamt: G,
      kosten: { spanneBp: spanneBp, jeUmlaufAnteil: kostenAnteil },
      nettoJeSignalBestaetigung: B.ueberschuss.jeSignal != null ? B.ueberschuss.jeSignal - kostenAnteil : null };
  });

  /* --- Urteil (B3, B6): NUR auf der Bestaetigung, NUR gegen Ueberschuss, MDE vor t --- */
  /* B10 sichtbar machen: um welchen Faktor waechst der Standardfehler durch die
   * Ueberlappung? Bei H = 1 ist er 1,00. */
  var faktoren = ergebnisse.map(function (r) { return r.bestaetigung.ueberschuss.ueberlappungsFaktor; })
    .filter(function (x) { return x != null; });
  if (faktoren.length) {
    var fMax = Math.max.apply(null, faktoren);
    P.entscheide('B10 Ueberlappung', { haltedauerKerzen: H, verzoegerungen: H - 1 },
      { faktorGroesster: fMax },
      H > 1
        /* DER FAKTOR KANN UNTER 1 LIEGEN, und der Text muss das aushalten. Sichtbar
         * geworden am 26.08.2026, als der Eintrag ueberhaupt zum ersten Mal erschien
         * (#98): auf dem Kunstarchiv kam 0,62 heraus - der korrigierte Standardfehler
         * ist dort KLEINER als der naive, weil die Tagesmittel negativ autokorreliert
         * sind. "waechst um Faktor 0,62" waere schlicht falsch gewesen.
         * Genau dasselbe war bei #86 aufgefallen: die Richtung der Korrektur haengt am
         * Vorzeichen der Autokorrelation und ist NICHT festgelegt. */
        ? 'Die Ergebnisfenster aufeinanderfolgender Signaltage ueberlappen um ' + (H - 1) + ' Kerzen. ' +
          'Der Standardfehler ist Newey-West-korrigiert; er ' +
          (fMax >= 1 ? 'waechst dadurch um bis zu Faktor ' + fMax.toFixed(2)
                     : 'FAELLT dadurch auf Faktor ' + fMax.toFixed(2)) +
          ' gegenueber der Annahme unabhaengiger Tage. Unter 1 heisst: die Tagesmittel sind ' +
          'negativ autokorreliert, die Korrektur macht die Messung dort schaerfer statt stumpfer.'
        : 'Haltedauer 1 Kerze - nichts ueberlappt, die Korrektur ist wirkungslos (Faktor 1,00).');
    if (fMax > 3) P.warne('B10', 'Der Standardfehler waechst um Faktor ' + fMax.toFixed(2) +
      ' durch ueberlappende Halteperioden. Ein Urteil, das ohne diese Korrektur zustande kaeme, waere wertlos.');
  }

  /* F4: Signale, fuer die keine Kontrolle zustande kam, verschwanden bisher
   * lautlos. Gemessen konnten so 10 % einer Messung verlorengehen, ohne dass
   * Konsole oder Warnliste es sagten - und der Verlust ist nicht zufaellig
   * verteilt, sondern trifft die Randstunden und das Ende einer Haelfte. */
  ergebnisse.forEach(function (r, vi) {
    var ges = r.signale || 0, weg = r.ohneKontrolle || 0;
    var anteil = ges ? weg / ges : 0;
    P.entscheide('F4 Kontrollverlust', { variante: vi, signale: ges, ohneKontrolle: weg },
      { anteil: Math.round(anteil * 1000) / 1000 },
      weg === 0
        ? 'Jedes Signal hat eine Kontrolle bekommen.'
        : weg + ' von ' + ges + ' Signalen (' + (anteil * 100).toFixed(1) + ' %) hatten nach dem ' +
          'A7-Ausschnitt weniger als 20 Vergleichskerzen und sind aus der Messung gefallen.');
    if (anteil > 0.02) P.warne('F4', 'Variante ' + vi + ': ' + (anteil * 100).toFixed(1) +
      ' % der Signale ohne Kontrolle. Der Verlust ist nicht zufaellig verteilt - er trifft die ' +
      'Randpositionen der Sitzung und das Ende einer Haelfte staerker.');
  });

  /* F1: Was beim Laden als kaputt aussortiert wurde, gehoert ebenfalls ins Protokoll. */
  var verworfen = ladeUniversum.verworfen || [];
  P.entscheide('F1 Datenpruefung', { geprueft: Object.keys(U).length + verworfen.length },
    { verworfeneReihen: verworfen.length, gestutzteKontrollkerzen: baueKontrolle.gestutzt || 0,
      toepfe: baueKontrolle.toepfe || 0,
      ausstiegsregelFehler: fuehreAus.fehler || 0,
      merkmalFehler: baueQuerschnitt.merkmalFehler || 0 },
    verworfen.length
      ? verworfen.length + ' Reihen wegen unmoeglicher Kurse oder Spruenge verworfen (' +
        verworfen.slice(0, 5).join('; ') + (verworfen.length > 5 ? ' …' : '') + '). ' +
        'Die Kontrolle ist zusaetzlich an den 1-%-Quantilen jedes Topfes gestutzt.'
      : 'Keine Reihe auffaellig. Die Kontrolle ist an den 1-%-Quantilen jedes Topfes gestutzt.');

  /* DEFEKT ist keine Fehlerart der Methode, sondern ein kaputtes Messgeschirr. Eine
   * Kennung aus FEHLERTYPEN.md waere hier falsch: dort stehen Denkfehler, hier steht
   * ein Werkzeug, das nicht funktioniert hat. */
  if (fuehreAus.fehler) {
    P.warne('DEFEKT', 'Die Ausstiegsregel hat ' + fuehreAus.fehler + '-mal geworfen (' +
      fuehreAus.letzterFehler + '). Der Stop war danach jedes Mal aus, jeder Trade lief in ' +
      'den Zeitausstieg - auf BEIDEN Seiten, Signal wie Kontrolle. Dieses Ergebnis ist ' +
      'kein Befund, sondern ein Fehlschlag.');
  }
  if (baueQuerschnitt.merkmalFehler) {
    P.warne('DEFEKT', 'Das Querschnitts-Merkmal hat ' + baueQuerschnitt.merkmalFehler +
      '-mal geworfen. Die Rangfolge wurde an diesen Zeitpunkten ueber weniger Werte ' +
      'gebildet als vorhanden - das Perzentil bedeutet dort etwas anderes.');
  }

  /* SELBSTPRUEFUNG. Der Placebo laeuft mit der Kontrolle der ERSTEN Variante und
   * den Sitzungspositionen der ersten Variante - das ist der Topf, der auch das
   * echte Urteil traegt. Ein Lauf genuegt; er kostet einen Durchgang. */
  var placebo = null, placeboEntdeckung = null;
  try {
    var _pos = ergebnisse[0] && ergebnisse[0].positionen ? ergebnisse[0].positionen : {};
    placebo = placeboLauf(U, kontrolleFuer(0), H, schnittTag, vorlauf, leseFenster, _pos, 'bestaetigung', KONVENTION, AUS_KONVENTION);
    /* S7: derselbe Lauf auf der Entdeckungshaelfte. Er faellt kein Urteil - aber ohne
     * ihn ist jede Entdeckungszahl ein Punktschaetzer ohne geprueften Nullpunkt. */
    placeboEntdeckung = placeboLauf(U, kontrolleFuer(0), H, schnittTag, vorlauf, leseFenster, _pos, 'entdeckung', KONVENTION, AUS_KONVENTION);
  } catch (e) { placebo = null; placeboEntdeckung = null; }
  var placeboOk = true;
  if (placebo && placebo.t != null) {
    /* Der Placebo darf streuen wie jede Messung. Auffaellig ist er erst, wenn sein
     * Ueberschuss die eigene Aufloesung UEBERSCHREITET - dann misst die Maschine
     * etwas, wo nichts ist. */
    placeboOk = Math.abs(placebo.tagesmittel) <= placebo.mde;
    P.entscheide('SP Placebo', { signale: placebo.signale, tage: placebo.tage },
      { tagesmittelPp: Math.round(placebo.tagesmittel * 10000) / 100,
        t: Math.round(placebo.t * 100) / 100, bestanden: placeboOk },
      'Ein Signal OHNE jeden Kursbezug, auf denselben Sitzungspositionen wie das echte. ' +
      'Sein wahrer Ueberschuss ist null. Gemessen: ' + (placebo.tagesmittel * 100).toFixed(4) +
      ' Pp bei einer Aufloesung von ' + (placebo.mde * 100).toFixed(4) + ' Pp. ' +
      (placeboOk ? 'Der Nullpunkt liegt im Rahmen.'
                 : 'DER NULLPUNKT LIEGT NICHT BEI NULL - die Maschine misst etwas, wo nichts ist.'));
    if (!placeboOk) P.warne('SP', 'Placebo-Lauf FEHLGESCHLAGEN: ' +
      (placebo.tagesmittel * 100).toFixed(4) + ' Pp statt null (Aufloesung ' +
      (placebo.mde * 100).toFixed(4) + ' Pp). Jedes Urteil dieser Messung ist um diesen ' +
      'Betrag verschoben und darf nicht fuer bare Muenze genommen werden.');
  } else {
    P.entscheide('SP Placebo', {}, { bestanden: null },
      'Der Placebo-Lauf kam nicht zustande (zu wenige Faelle). Der Nullpunkt dieser Messung ist ungeprueft.');
    P.warne('SP', 'Kein Placebo-Lauf moeglich - der Nullpunkt dieser Messung ist ungeprueft.');
  }

  /* S9: zwei Pflichtzeilen, die es bis zum 25.08.2026 nicht gab. */
  ergebnisse.forEach(function (r, vi) {
    var L = r.einstiegsluecke || {};
    P.entscheide('S9 Einstiegsluecke', { variante: vi, faelle: L.n || 0 },
      { signalPp: L.signalMittel != null ? L.signalMittel * 100 : null,
        universumPp: L.universumMittel != null ? L.universumMittel * 100 : null,
        zentriertPp: L.zentriert != null ? L.zentriert * 100 : null },
      L.zentriert == null
        ? 'Keine Eroeffnungskurse - die Einstiegsluecke ist nicht messbar.'
        : 'Zwischen dem Schluss der Signalkerze (dem Einstiegskurs) und der naechsten ' +
          'Eroeffnung liegen ' + (L.zentriert * 100).toFixed(4) + ' Pp mehr als bei einer ' +
          'beliebigen Kerze derselben Werte. Diesen Teil kann ein Einstieg zum Schluss ' +
          'nicht mitnehmen. Ist er so gross wie der Ueberschuss, ist der Befund nicht handelbar.');
    var pos = r.positionen || {}, ges = 0;
    Object.keys(pos).forEach(function (k) { ges += pos[k]; });
    var verteilung = Object.keys(pos).sort(function (a, b) { return pos[b] - pos[a]; })
      .slice(0, 5).map(function (k) { return 'Pos ' + k + ': ' + (pos[k] / ges * 100).toFixed(1) + ' %'; });
    P.entscheide('S9 Sitzungspositionen', { variante: vi, verschiedene: Object.keys(pos).length },
      { top: verteilung },
      'Wo in der Sitzung das Signal feuert, entscheidet mit, welchem Rauschen es ausgesetzt ist ' +
      '(F3: die Schlusskerze hat eine 3,8-mal groessere Streuung als eine Kerze mitten am Tag). ' +
      (verteilung.length ? verteilung.join(', ') : 'keine Signale'));
  });

  /* Eichung: was bringt die Querschnitts-Kontrolle an Aufloesung? Reine Anzeige - sie
   * faellt kein Urteil und veraendert keines. */
  ergebnisse.forEach(function (r, vi) {
    var q = r.querschnitt && r.querschnitt.bestaetigung;
    /* block() liefert ein flaches Objekt - se steht direkt darauf, nicht unter .ueberschuss. */
    var seA = q && q.a7 && q.a7.se, seQ = q && q.qs && q.qs.se;
    var f = (seA > 0 && seQ > 0) ? seA / seQ : null;
    P.entscheide('QS Querschnitts-Kontrolle', { variante: vi, ohneErwartung: r.querschnitt.ohneErwartung },
      { seA7Pp: seA != null ? seA * 100 : null, seQuerschnittPp: seQ != null ? seQ * 100 : null,
        faktor: f != null ? Math.round(f * 1000) / 1000 : null,
        ueberschussA7Pp: q && q.a7 ? q.a7.tagesmittel * 100 : null,
        ueberschussQuerschnittPp: q && q.qs ? q.qs.tagesmittel * 100 : null },
      f == null ? 'Keine gepaarte Teilmenge - der Vergleich kam nicht zustande.'
        : 'Auf denselben Signalen: Standardfehler ' + (seA * 100).toFixed(4) + ' Pp gegen die Zeit ' +
          'desselben Werts (A7), ' + (seQ * 100).toFixed(4) + ' Pp gegen den Rest des Marktes. ' +
          'Faktor ' + f.toFixed(2) + '. Ein Faktor ueber 1 heisst: die zweite Kontrolle rechnet den ' +
          'gemeinsamen Marktzug heraus und macht die Messung schaerfer. Reine Eichung - das Urteil ' +
          'faellt weiter gegen A7.');
  });

  var schwelle = bonferroniSchwelle(P.tests);
  P.entscheide('B4 Bonferroni', { tests: P.tests, alpha: VERFAHREN.alpha }, { schwelleT: schwelle },
    'Zweiseitige Schwelle fuer |t| bei ' + P.tests + ' Test(s).');
  var urteile = ergebnisse.map(function (r) {
    var u = r.bestaetigung.ueberschuss;
    var urteil, grund;
    /* S2: delta80 - der kleinste WAHRE Effekt, den dieser Lauf mit 80 % Wahrscheinlichkeit
     * ueber die Schwelle gebracht haette. Die MDE (2 x se) sagt nur, ab wann ein Ausschlag
     * nicht mehr als Rauschen durchgeht; sie sagt NICHTS darueber, ob der Lauf einen echten
     * Effekt dieser Groesse auch gefunden haette. Genau diese Verwechslung hat das Projekt
     * zweimal Kandidaten vorregistrieren lassen, die es nie haette bestaetigen koennen.
     * Liegt delta80 ueber der Kostenhuerde des Produkts, ist der Lauf von vornherein
     * blind fuer jede handelbare Kante - egal was am Ende herauskommt. */
    var d80 = (u.se > 0) ? (schwelle + VERFAHREN.zPower80) * u.se : null;
    var d80Satz = d80 == null ? '' :
      ' Dieser Lauf haette eine wahre Kante erst ab ' + (d80 * 100).toFixed(4) +
      ' Pp mit 80 % Wahrscheinlichkeit ueber die Schwelle gebracht (delta80).';
    if (u.tage < 30) { urteil = 'nicht-messbar'; grund = 'Weniger als 30 Bestaetigungstage mit Signal.'; }
    else if (u.mde == null) { urteil = 'nicht-messbar'; grund = 'Keine Streuung berechenbar.'; }
    else if (Math.abs(u.tagesmittel) < u.mde) {
      urteil = 'nicht-entscheidbar';
      grund = 'Ueberschuss ' + (u.tagesmittel * 100).toFixed(4) + ' Pp liegt unter der MDE ' + (u.mde * 100).toFixed(4) + ' Pp. ' +
        'Das heisst NICHT "kein Effekt" - es heisst, dass diese Datenmenge die Frage nicht beantworten kann.';
    } else if (u.t >= schwelle && u.tagesmittel > 0) {
      /* Ein bestaetigtes Urteil auf einer Maschine, deren Nullpunkt nicht bei null
       * liegt, ist kein bestaetigtes Urteil. */
      urteil = placeboOk ? 'bestaetigt' : 'bestaetigt-aber-nullpunkt-verschoben';
      grund = 'Ueberschuss ueber MDE und t=' + u.t.toFixed(2) + ' ueber der Bonferroni-Schwelle ' + schwelle.toFixed(2) + ' auf den zurueckgehaltenen Tagen.';
    } else if (u.t <= -schwelle) {
      urteil = 'widerlegt';
      grund = 'Ueberschuss signifikant NEGATIV auf den zurueckgehaltenen Tagen (t=' + u.t.toFixed(2) + ').';
    } else {
      urteil = 'nicht-bestaetigt';
      grund = 'Ueberschuss ueber MDE, aber t=' + u.t.toFixed(2) + ' unter der Schwelle ' + schwelle.toFixed(2) + '.';
    }
    // B2-Warnung: wenn Tagesmittel und je-Signal das Vorzeichen wechseln, ist die Teststatistik kein Handelsergebnis
    if (u.tagesmittel != null && u.jeSignal != null && Math.sign(u.tagesmittel) !== Math.sign(u.jeSignal)) {
      P.warne('B2', 'Variante ' + r.variante + ': Tagesmittel (' + (u.tagesmittel * 100).toFixed(4) + ' Pp) und Erwartung je Signal (' +
        (u.jeSignal * 100).toFixed(4) + ' Pp) haben verschiedene Vorzeichen. Duenne Tage tragen den Schaetzer. Handelbar ist die Zahl je Signal.');
    }
    // Aussicht: wie viele Tage bis zum URTEIL mit 80 % - nur, wenn der Punktschaetzer positiv ist
    var aussicht = null;
    /* #86 (26.08.2026): die Bedingung fragte u.sd ab - ein Feld, das block() nie
     * geliefert hat. Sie war damit IMMER falsch, und in JEDEM Protokoll stand
     * "aussicht": null, auch bei kapitulation (Bestaetigung t 2,14) und rsi2seit-mcp
     * (t 2,01). Der Fehler fiel geschlossen aus - es erschien keine falsche Zahl,
     * sondern gar keine -, traf aber genau die Planungszahl der Aufloesungswand.
     * Geprueft wird jetzt, was die naechste Zeile wirklich braucht.
     * ABSICHTLICH NICHT das sd aus statistik(): das ist die ROHE Streuung. Die Aussicht
     * fragt "wie viele Tage bis t=2" - und dieses t rechnet die Maschine mit dem
     * Newey-West-Standardfehler. Die Hochrechnung muss denselben benutzen, sonst
     * beantwortet sie eine andere Frage als die, die spaeter wirklich entschieden wird.
     * Die RICHTUNG des Unterschieds ist dabei nicht festgelegt und war beim Bau eine
     * falsche Vermutung: auf dem Kunstarchiv der Testfalle liegt die NW-Korrektur
     * UNTER der rohen Streuung (11 statt 25 Tage, also negative Autokorrelation der
     * Tagesmittel); bei positiver Autokorrelation waere es umgekehrt. Es zaehlt nicht,
     * welche Zahl kleiner ist, sondern welche zum Test passt. */
    /* Wilhelms Auflage 26.08. 20:25: dieselbe 30-Tage-Schranke wie das Urteil in
     * Z. 1226 - ein Lauf, den die Maschine selbst fuer zu kurz erklaert, bekommt
     * keine Aussichts-Hochrechnung (17 Messtage erzeugten sonst eine 187-Tage-Zahl,
     * die die Aussichts-Tabelle anfuehrte). */
    if (u.tagesmittel > 0 && u.se > 0 && u.tage >= 30) {
      var sd = u.se * Math.sqrt(u.tage);
      /* #91 (26.08.2026): hier stand VERFAHREN.zAlpha - 1,96, die Schwelle fuer EINEN
       * Test. Entschieden wird aber gegen die Bonferroni-Schwelle, und delta80 rechnet
       * eine Handvoll Zeilen weiter oben laengst damit. Die beiden Planungszahlen
       * DESSELBEN Urteilsblocks widersprachen sich also.
       * Gemessen an den abgelegten Protokollen: 16 von 21 haben mehr als einen Test;
       * dort untertrieb die Aussicht um 21 % (2 Tests) bis 59 % (7 Tests). Bei tests=1
       * ist schwelle == zAlpha, dort aendert sich nichts.
       * Die Alternative waere gewesen, die Zahl als 'Tage bis t=2 ohne Testzahl-
       * Korrektur' stehenzulassen und das im annahme-Text zu sagen. Dagegen spricht,
       * wofuer sie gebraucht wird: die Planung der Aufloesungswand fragt, wann ein
       * URTEIL moeglich ist - und ein Urteil faellt an der Schwelle, nicht bei t=2.
       * Damit die Zahl sich nicht wieder still verschiebt, nennt sie ihre Schwelle und
       * ihre Testzahl jetzt selbst. */
      aussicht = { tage80: Math.ceil(Math.pow(schwelle + VERFAHREN.zPower80, 2) * sd * sd / (u.tagesmittel * u.tagesmittel)),
        schwelle: schwelle, tests: P.tests,
        annahme: 'Effekt bleibt konstant; Signaldichte bleibt konstant. Beides ist NICHT gesichert. ' +
          'Gerechnet gegen die Bonferroni-Schwelle ' + schwelle.toFixed(2) + ' bei ' + P.tests +
          ' Test(s): Tage bis zum URTEIL, nicht bis t=2.' };
    }
    return P.entscheide('Urteil Variante ' + r.variante,
      { ueberschussTagesmittelPp: u.tagesmittel != null ? u.tagesmittel * 100 : null, mdePp: u.mde != null ? u.mde * 100 : null,
        delta80Pp: d80 != null ? d80 * 100 : null,
        t: u.t, schwelle: schwelle, tage: u.tage, signale: u.signale, jeSignalPp: u.jeSignal != null ? u.jeSignal * 100 : null },
      { urteil: urteil, delta80: d80, aussicht: aussicht }, grund + d80Satz);
  });

  return {
    verfahren: VERFAHREN,
    strategie: { key: S.key, grund: S.grund, zeitrahmen: S.zeitrahmen || '60m', haltedauerKerzen: H, richtung: S.richtung || 'beide',
      einstiegsZeitpunkt: KONVENTION,
      ausstiegsZeitpunkt: AUS_KONVENTION,
      universum: S.universum || 'aktien', varianten: varianten.length },
    gemessenAm: new Date(start).toISOString(), dauerMs: Date.now() - start,
    universum: { werte: syms.length, handelstage: tage.length, von: tage[0], bis: tage[tage.length - 1], schnittTag: schnittTag,
      herkunft: 'Archiv-Store, Auswahl zum Messzeitpunkt (Ueberlebende)' },
    ergebnisse: ergebnisse,
    urteile: urteile.map(function (u) { return u.urteil; }),
    /* #92 (Wilhelm 17:40, 2a): das schaerfste Urteil gewinnt - ein widerlegtes darf
     * nicht hinter freundlicheren Etiketten verschwinden. Und der sechste Wert aus
     * Z. 1235 steht jetzt in der Liste; vorher fiel er durch und der Rueckfallwert
     * meldete ausgerechnet das schwaechste Etikett. */
    bestesUrteil: ['widerlegt', 'bestaetigt', 'bestaetigt-aber-nullpunkt-verschoben', 'nicht-bestaetigt', 'nicht-entscheidbar', 'nicht-messbar']
      .filter(function (k) { return urteile.some(function (u) { return u.urteil === k; }); })[0] || 'nicht-messbar',
    /* Der Nullpunkt dieser Messung, gemessen statt angenommen - je Haelfte einer (S7). */
    placebo: placebo || null,
    placeboEntdeckung: placeboEntdeckung || null,
    tests: P.tests,
    testfamilie: S.testfamilie || null,
    entscheidungen: P.entscheidungen,
    warnungen: P.warnungen,
  };
}

module.exports = { messe: messe, VERFAHREN: VERFAHREN,
  _intern: { tagesMittel: tagesMittel, statistik: statistik, jeSignal: jeSignal, bonferroniSchwelle: bonferroniSchwelle, baueKontrolle: baueKontrolle, baueQuerschnitt: baueQuerschnitt } };

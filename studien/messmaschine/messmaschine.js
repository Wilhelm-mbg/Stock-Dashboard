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

/* ---------- Konstanten, die das Verfahren definieren (nicht einstellbar) ---------- */
var VERFAHREN = {
  version: '1.0.0',
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
function eroeffnungKurs(bars, k) {
  var b = bars[k];
  if (b && b.length > 5 && typeof b[5] === 'number' && isFinite(b[5]) && b[5] > 0) return b[5];
  return k > 0 ? bars[k - 1][1] : b[1];
}

/* ---------- Archiv ---------- */
function ladeUniversum(archivPfad, intervall, filter) {
  var dateien = fs.readdirSync(archivPfad).filter(function (f) { return f.indexOf('bars_' + intervall + '_') === 0; });
  var out = {};
  dateien.forEach(function (f) {
    var sym = f.slice(('bars_' + intervall + '_').length, -5);
    if (filter && !filter(sym)) return;
    try {
      var j = JSON.parse(fs.readFileSync(path.join(archivPfad, f), 'utf8'));
      if (j && Array.isArray(j.series) && j.series.length) out[sym] = j.series;
    } catch (e) { /* unlesbar = nicht im Universum; wird unten gezaehlt */ }
  });
  return out;
}
function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }
function stundeVon(ms) { return new Date(ms).getUTCHours(); }

/* ---------- A2/A3/A5: Kontrollerwartung je Symbol x Stunde x Haelfte ---------- */
/* ACHTUNG bei Ausstiegsregeln: Die Kontrolle bekommt denselben Ausstieg wie das
 * Signal. Sonst vergleicht man "Signal mit Stop" gegen "Zufallskerze ohne Stop" -
 * und misst den Stop statt das Signal. */
function baueKontrolle(universum, haltedauerKerzen, schnittTag, vorlauf, stopNiveau, params) {
  /* A7: Der Topf haelt jetzt die einzelnen Kerzen (Index + Wert), nicht nur Summe und
   * Anzahl. Nur so laesst sich das Lesefenster des Signals wieder herausrechnen.
   * Praefixsummen dazu, damit das je Signal O(log n) bleibt statt O(Topfgroesse). */
  var K = {};   // sym -> haelfte -> stunde -> {idx:[], wert:[], praefix:[]}
  Object.keys(universum).forEach(function (sym) {
    var b = universum[sym];
    var H = K[sym] = { entdeckung: {}, bestaetigung: {} };
    for (var i = vorlauf; i < b.length - haltedauerKerzen; i++) {
      var s0 = b[i][1]; if (!(s0 > 0)) continue;
      var sH = b[i + haltedauerKerzen][1]; if (!(sH > 0)) continue;
      var h = stundeVon(b[i][0]);
      var hf = tagVon(b[i][0]) < schnittTag ? 'entdeckung' : 'bestaetigung';
      var z = H[hf][h] = H[hf][h] || { idx: [], wert: [] };
      var ende = sH;
      if (typeof stopNiveau === 'function') {
        var pf = [];
        for (var pk = i + 1; pk <= i + haltedauerKerzen; pk++) {
          pf.push({ auf: eroeffnungKurs(b, pk), hoch: b[pk][3] != null ? b[pk][3] : b[pk][1],
            tief: b[pk][4] != null ? b[pk][4] : b[pk][1], schluss: b[pk][1] });
        }
        ende = fuehreAus(pf, s0, stopNiveau, params).kurs;
      }
      z.idx.push(i); z.wert.push(ende / s0 - 1);   // C3: Anteil, kein Prozent
    }
  });

  /* Praefixsummen einmal aufbauen. Die Indexlisten sind aufsteigend, weil die
   * Schleife oben aufsteigend laeuft - darauf beruht die binaere Suche. */
  Object.keys(K).forEach(function (sym) {
    ['entdeckung', 'bestaetigung'].forEach(function (hf) {
      Object.keys(K[sym][hf]).forEach(function (h) {
        var z = K[sym][hf][h];
        var p = new Float64Array(z.wert.length + 1);
        for (var q = 0; q < z.wert.length; q++) p[q + 1] = p[q] + z.wert[q];
        z.praefix = p; z.n = z.wert.length; z.summe = p[p.length - 1];
      });
    });
  });

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
      try { w = merkmal(b, p); } catch (e) { w = null; }
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
    try { s = stopNiveau(abgeschlossen, einKurs, params); } catch (e) { s = null; }
    stop = (typeof s === 'number' && isFinite(s)) ? s : null;
  }
  return { kerze: pfad.length, kurs: pfad[pfad.length - 1].schluss, grund: 'Zeit' };
}

/* ============================================================================
 * HAUPTFUNKTION
 * strategie: { key, grund, zeitrahmen, haltedauerKerzen, signal(bars,i,params)->{dir}|null,
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
  var filter = null;
  if (typeof S.universum === 'function') filter = S.universum;
  else if (S.universum === 'aktien' || !S.universum) filter = function (sym) { return sym.indexOf('-USD') === -1; };
  var U = ladeUniversum(archivPfad, S.zeitrahmen || '60m', filter);
  var syms = Object.keys(U);
  P.entscheide('E1 Universum', { archiv: archivPfad, zeitrahmen: S.zeitrahmen || '60m', filter: S.universum || 'aktien' },
    { werte: syms.length },
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

  var hatAusstieg = typeof S.stopNiveau === 'function';
  var kontrollen = {};
  function kontrolleFuer(vi) {
    var schluessel = hatAusstieg ? String(vi) : 'gemeinsam';
    if (!kontrollen[schluessel]) {
      kontrollen[schluessel] = baueKontrolle(U, H, schnittTag, vorlauf,
        hatAusstieg ? S.stopNiveau : null, varianten[vi]);
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
      ? 'Die Kontrolle mittelt ueber den Topf OHNE die Kerzen [i-' + leseFenster + ', i+' + H + '-1]. ' +
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

  /* --- Je Variante messen --- */
  var spanneBp = (S.kosten && S.kosten.spanneBp != null) ? S.kosten.spanneBp : 5;
  var ergebnisse = varianten.map(function (params, vi) {
    var K = kontrolleFuer(vi);
    var roh = [], ueber = [], ohneKontrolle = 0, nSignale = 0, nLong = 0, nShort = 0;
    var gruende = {}, kerzenSumme = 0;
    syms.forEach(function (sym) {
      var b = U[sym];
      for (var i = vorlauf; i < b.length - H; i++) {
        var sig = null;
        var rang = QS ? QS.rang(sym, b[i][0]) : null;
        try { sig = S.signal(b, i, params, rang); } catch (e) { gruende.fehler = (gruende.fehler || 0) + 1; continue; }
        if (!sig || !sig.dir) continue;
        var dir = sig.dir > 0 ? 1 : -1;
        if (S.richtung === 'long' && dir < 0) continue;
        if (S.richtung === 'short' && dir > 0) continue;
        nSignale++; if (dir > 0) nLong++; else nShort++;
        var s0 = b[i][1], sH = b[i + H][1];
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
          ausKurs = a.kurs; ausKerze = a.kerze; ausGrund = a.grund;
          gruende['aus_' + ausGrund] = (gruende['aus_' + ausGrund] || 0) + 1;
          kerzenSumme += ausKerze;
        }
        var tag = tagVon(b[i][0]), hf = tag < schnittTag ? 'entdeckung' : 'bestaetigung';
        var erw = K.erwartung(sym, stundeVon(b[i][0]), hf,
          leseFenster == null ? null : i - leseFenster,
          leseFenster == null ? null : i + H - 1);
        if (erw == null) { ohneKontrolle++; continue; }
        var r = (ausKurs / s0 - 1) * dir;                  // C3: Anteil
        roh.push({ tag: tag, hf: hf, wert: r });
        ueber.push({ tag: tag, hf: hf, wert: r - erw * dir });   // Ueberschuss gegen die Erwartung
      }
    });
    function teil(liste, hf) { return liste.filter(function (e) { return e.hf === hf; }); }
    function block(liste) {
      /* B10: H-1 Verzoegerungen - so weit ueberlappen die Ergebnisfenster. */
      var tm = tagesMittel(liste), st = statistik(tm.mittel, H - 1), js = jeSignal(liste);
      return { tage: st.n, signale: js.n,
        tagesmittel: st.mittel, t: st.t, se: st.se, mde: st.mde,          // B1: Teststatistik ueber Tage
        jeSignal: js.mittel, anteilPositiv: js.anteilPositiv };           // B2: die handelbare Zahl
    }
    var E = { roh: block(teil(roh, 'entdeckung')), ueberschuss: block(teil(ueber, 'entdeckung')) };
    var B = { roh: block(teil(roh, 'bestaetigung')), ueberschuss: block(teil(ueber, 'bestaetigung')) };
    var G = { roh: block(roh), ueberschuss: block(ueber) };
    // C5: Kosten einmal, an einer Stelle, als eigenes Feld
    var kostenAnteil = 2 * spanneBp / 10000;
    return { variante: vi, params: params, signale: nSignale, long: nLong, short: nShort,
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
        ? 'Die Ergebnisfenster aufeinanderfolgender Signaltage ueberlappen um ' + (H - 1) + ' Kerzen. ' +
          'Der Standardfehler ist Newey-West-korrigiert; er waechst dadurch um bis zu Faktor ' + fMax.toFixed(2) +
          ' gegenueber der Annahme unabhaengiger Tage.'
        : 'Haltedauer 1 Kerze - nichts ueberlappt, die Korrektur ist wirkungslos (Faktor 1,00).');
    if (fMax > 3) P.warne('B10', 'Der Standardfehler waechst um Faktor ' + fMax.toFixed(2) +
      ' durch ueberlappende Halteperioden. Ein Urteil, das ohne diese Korrektur zustande kaeme, waere wertlos.');
  }

  var schwelle = bonferroniSchwelle(P.tests);
  P.entscheide('B4 Bonferroni', { tests: P.tests, alpha: VERFAHREN.alpha }, { schwelleT: schwelle },
    'Zweiseitige Schwelle fuer |t| bei ' + P.tests + ' Test(s).');
  var urteile = ergebnisse.map(function (r) {
    var u = r.bestaetigung.ueberschuss;
    var urteil, grund;
    if (u.tage < 30) { urteil = 'nicht-messbar'; grund = 'Weniger als 30 Bestaetigungstage mit Signal.'; }
    else if (u.mde == null) { urteil = 'nicht-messbar'; grund = 'Keine Streuung berechenbar.'; }
    else if (Math.abs(u.tagesmittel) < u.mde) {
      urteil = 'nicht-entscheidbar';
      grund = 'Ueberschuss ' + (u.tagesmittel * 100).toFixed(4) + ' Pp liegt unter der MDE ' + (u.mde * 100).toFixed(4) + ' Pp. ' +
        'Das heisst NICHT "kein Effekt" - es heisst, dass diese Datenmenge die Frage nicht beantworten kann.';
    } else if (u.t >= schwelle && u.tagesmittel > 0) {
      urteil = 'bestaetigt';
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
    // Aussicht: wie viele Tage bis t=2 mit 80 % - nur, wenn der Punktschaetzer positiv ist
    var aussicht = null;
    if (u.tagesmittel > 0 && u.se > 0 && u.sd > 0) {
      var sd = u.se * Math.sqrt(u.tage);
      aussicht = { tage80: Math.ceil(Math.pow(VERFAHREN.zAlpha + VERFAHREN.zPower80, 2) * sd * sd / (u.tagesmittel * u.tagesmittel)),
        annahme: 'Effekt bleibt konstant; Signaldichte bleibt konstant. Beides ist NICHT gesichert.' };
    }
    return P.entscheide('Urteil Variante ' + r.variante,
      { ueberschussTagesmittelPp: u.tagesmittel != null ? u.tagesmittel * 100 : null, mdePp: u.mde != null ? u.mde * 100 : null,
        t: u.t, schwelle: schwelle, tage: u.tage, signale: u.signale, jeSignalPp: u.jeSignal != null ? u.jeSignal * 100 : null },
      { urteil: urteil, aussicht: aussicht }, grund);
  });

  return {
    verfahren: VERFAHREN,
    strategie: { key: S.key, grund: S.grund, zeitrahmen: S.zeitrahmen || '60m', haltedauerKerzen: H, richtung: S.richtung || 'beide',
      universum: S.universum || 'aktien', varianten: varianten.length },
    gemessenAm: new Date(start).toISOString(), dauerMs: Date.now() - start,
    universum: { werte: syms.length, handelstage: tage.length, von: tage[0], bis: tage[tage.length - 1], schnittTag: schnittTag,
      herkunft: 'Archiv-Store, Auswahl zum Messzeitpunkt (Ueberlebende)' },
    ergebnisse: ergebnisse,
    urteile: urteile.map(function (u) { return u.urteil; }),
    bestesUrteil: ['bestaetigt', 'nicht-bestaetigt', 'nicht-entscheidbar', 'nicht-messbar', 'widerlegt']
      .filter(function (k) { return urteile.some(function (u) { return u.urteil === k; }); })[0] || 'nicht-messbar',
    tests: P.tests,
    testfamilie: S.testfamilie || null,
    entscheidungen: P.entscheidungen,
    warnungen: P.warnungen,
  };
}

module.exports = { messe: messe, VERFAHREN: VERFAHREN,
  _intern: { tagesMittel: tagesMittel, statistik: statistik, jeSignal: jeSignal, bonferroniSchwelle: bonferroniSchwelle, baueKontrolle: baueKontrolle, baueQuerschnitt: baueQuerschnitt } };

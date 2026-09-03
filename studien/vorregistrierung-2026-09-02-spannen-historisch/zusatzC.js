'use strict';
/* ============ Zusatz C: die Spannen der VERSCHWUNDENEN Werte (Rahmen C) ============
 *
 * Registrierung: VORREGISTRIERUNG.md Paragraph 6 (Zusatz C) und Paragraph 9b (die Ziehung,
 * committet BEVOR diese Datei gebaut wurde, Commit 30c5626). Schritt 0 ist die Probe
 * probeC.js: 5 von 5 verschwundenen Werten liefern einen Quote aus ihrer Lebenszeit,
 * 0 von 5 liefern noch einen 60 Handelstage nach dem letzten Balken.
 *
 * WAS HIER ANDERS IST ALS IM HAUPTLAUF - und was NICHT:
 *
 *   ANDERS ist nur der RAHMEN. Rahmen A zieht aus dem eingefrorenen Universum vom
 *   02.09.2024 (Reihen aus archiv1d); Rahmen C zieht aus den 1.164 verschwundenen Reihen
 *   in Markt-Dashboard-Daten/massive/tagesdaten/. Dazu kommen zwei Einschraenkungen aus
 *   Paragraph 9b.2: ein Symbol wird fuer ein Jahr nur gezogen, wenn es am Jahresanker lebte,
 *   und einem gezogenen Tag muessen noch mindestens 20 volle Handelstage folgen (die letzten
 *   Wochen vor einem Delisting sind Abwicklung, nicht Handel).
 *
 *   GLEICH bleibt alles andere, und zwar nicht durch Nachbau, sondern durch require:
 *   bewerten() und pfadQuote() kommen aus messen.js, klasseAn()/indexBis()/etZuUtc()/
 *   wuerfel()/saatAus()/mischen() aus stichprobe.js, die Umsatzklasse damit aus liquide.js.
 *   Ein zweites Werkzeug, das dieselbe Groesse zum zweiten Mal implementiert, misst
 *   zuverlaessig etwas anderes.
 *
 *   NICHT wiederverwendet wurden schonDa() und ringfolge() aus messen.js, obwohl sie
 *   exportiert sind: schonDa() liest <jahr>.jsonl - die Dateien des RAHMENS A -, und
 *   ringfolge() gruppiert nach klasse|jahr|fenster ohne Rahmen. Beide sind hier deshalb
 *   BYTE-GENAU KOPIERT und tragen nur einen anderen Dateinamen bzw. Eimerschluessel
 *   (schonDaC, ringfolgeC). Das steht so in der Uebergabe.
 *
 * GETRENNTE DATEIEN, IMMER. Geschrieben wird ausschliesslich nach
 * E:/Markt-Dashboard-Archiv/spannen/zusatzC-<jahr>.jsonl und zusatzC-fortschritt.json.
 * In eine Datei des Rahmens A schreibt dieses Skript NIE - test-v6.js Block 35 prueft das
 * an den Dateinamen, nicht an einer Zusage im Kommentar.
 *
 * FORTSETZBAR (Schluessel sym|utc), RINGVERTEILUNG ueber die Zellen, Ratenbremse und
 * Wiederholung wie messen.js. Ein Abbruch verliert nichts und hinterlaesst alle Zellen
 * gleich weit gefuellt.
 *
 * Zugang: nur ueber schluessel.js. Diese Datei liest process.env NICHT - auch keinen
 * MD_-Pfadschalter; das Ziel steht fest, damit kein Aufruf sie versehentlich in die
 * Dateien des Rahmens A schreiben laesst.
 *
 * Aufrufe:
 *   node .../zusatzC.js --testlauf    20 Symbole - Ausgabe pruefen, VOR dem Vollauf
 *   node .../zusatzC.js               der Lauf (rund 3.664 Abrufe, 20-36 Minuten)
 *
 * Nur lesend auf massive/tagesdaten/ und den Boersenkalender. Nichts gekauft.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */

var fs = require('fs');
var path = require('path');
var S = require('./schluessel.js');
var M = require('./messen.js');
var St = require('./stichprobe.js');
var Kalender = require('./kalender.js');

/* Das Ziel steht fest - kein Umgebungsschalter (siehe Kopf). */
var ZIEL = 'E:/Markt-Dashboard-Archiv/spannen';
var TAGESDATEN = path.join(St.MASSIVE, 'tagesdaten');

/* ---- Betriebsgroessen: woertlich die des Hauptlaufs (messen.js). ---- */
var RATE_JE_MIN = 180;
var GLEICHZEITIG = 8;
var VERSUCHE = 5;

/* ---- Plan-Konstanten des Rahmens C. Paragraph 9b.2/9b.3. ---- */
var PLAN_C = {
  saat: 20260902,               /* dieselbe Saat wie Rahmen A */
  jahre: [2025, 2026],          /* 2016-2024: keine Tagesbalken, Paragraph 9b.1 */
  symboleJeZelle: 100,
  tageJeSymbol: 5,
  nachlaufTage: 20,             /* volle Handelstage, die dem gezogenen Tag folgen muessen */
  placeboJeder: 25              /* jeder 25. mitte-Zeitpunkt, wie Paragraph 9a */
};

function sag(t) { process.stdout.write(S.verdecken(t) + '\n'); }
function pause(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/* ---------- Ratenbremse: Eimer mit RATE_JE_MIN Marken je 60 s (aus messen.js) ---------- */
var marken = [];
async function marke() {
  for (;;) {
    var jetzt = Date.now();
    while (marken.length && jetzt - marken[0] > 60000) marken.shift();
    if (marken.length < RATE_JE_MIN) { marken.push(jetzt); return; }
    await pause(Math.max(20, 60000 - (jetzt - marken[0]) + 5));
  }
}

/* ---------- Zaehler ---------- */
var Z = { rahmen: 'C', aufrufe: 0, treffer: 0, keinQuote: 0, uebersprungen: 0, gekreuzt: 0,
          nullkurs: 0, gesperrt: 0, fehler: {}, wiederholt: 0,
          gestartet: new Date().toISOString(), zuletzt: null };
function fehlerZaehlen(art) { Z.fehler[art] = (Z.fehler[art] || 0) + 1; }

/* ---------- Ein Abruf mit Wiederholung (aus messen.js) ---------- */
async function hole(pfad) {
  for (var v = 1; v <= VERSUCHE; v++) {
    await marke();
    Z.aufrufe++;
    var res, text;
    try {
      res = await fetch('https://data.alpaca.markets/v2' + pfad,
                        { headers: S.kopfzeilen(), signal: AbortSignal.timeout(30000) });
      text = await res.text();
    } catch (e) {
      fehlerZaehlen('netz');
      if (v === VERSUCHE) return { status: 0, text: 'netz' };
      Z.wiederholt++; await pause(1000 * v); continue;
    }
    if (res.status === 429) {
      fehlerZaehlen('429');
      var warte = Number(res.headers.get('retry-after'));
      Z.wiederholt++;
      await pause(isFinite(warte) && warte > 0 ? warte * 1000 : 2000 * v);
      continue;
    }
    if (res.status >= 500) {
      fehlerZaehlen('http' + res.status);
      if (v === VERSUCHE) return { status: res.status, text: text };
      Z.wiederholt++; await pause(1000 * v); continue;
    }
    var daten = null;
    try { daten = JSON.parse(text); } catch (e2) { daten = null; }
    if (res.status !== 200) fehlerZaehlen('http' + res.status);
    return { status: res.status, text: text, daten: daten };
  }
  return { status: 0, text: 'aufgegeben' };
}

/* ---------- Die Reihen des Rahmens C ---------- */
var NY = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false,
  year: 'numeric', month: '2-digit', day: '2-digit' });
function datumET(ms) {
  var p = {}; NY.formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
  return p.year + '-' + p.month + '-' + p.day;
}

/** Eine verschwundene Reihe. Gibt dieselbe Form zurueck wie reiheLesen() in stichprobe.js
 *  ({sym, tage, b}), damit klasseAn() unveraendert darauf laeuft. Format der Balken ist in
 *  beiden Archiven dasselbe: [zeit, schluss, stueck, hoch, tief, eroeffnung]. */
function reiheC(sym) {
  var j;
  try { j = JSON.parse(fs.readFileSync(path.join(TAGESDATEN, sym + '.json'), 'utf8')); }
  catch (e) { return null; }
  var s = j && j.series;
  if (!Array.isArray(s) || !s.length) return null;
  var tage = [], b = [];
  for (var i = 0; i < s.length; i++) {
    if (!s[i] || !(s[i][1] > 0)) continue;
    tage.push(datumET(s[i][0])); b.push(s[i]);
  }
  if (!tage.length) return null;
  return { sym: sym, tage: tage, b: b, listeBis: j.delistet || null };
}

/* ---------- Der Stichprobenplan des Rahmens C ---------- */
/** Baut den Plan. Kein Netzabruf. Deterministisch, Saat 20260902.
 *  Gibt {zeitpunkte, zaehl, zellen} - dieselbe Form wie St.plan(). */
function planC(opts) {
  opts = opts || {};
  var Sym = opts.symboleJeZelle || PLAN_C.symboleJeZelle;
  var D = opts.tageJeSymbol || PLAN_C.tageJeSymbol;
  var jahre = opts.jahre || PLAN_C.jahre;

  var kal = Kalender.lesen();
  if (!kal || !kal.tage) {
    throw new Error('Boersenkalender fehlt. Erst  node studien/.../kalender.js  laufen lassen.');
  }
  var WP = require(path.join(__dirname, '..', 'messmaschine', 'strategien', 'wertpapierart.js'));

  var alle = fs.readdirSync(TAGESDATEN).filter(function (f) { return f.slice(-5) === '.json'; })
               .map(function (f) { return f.slice(0, -5); }).sort();
  var zaehl = { rahmen: alle.length, keineAktie: 0, ohneReihe: 0, gepruefteSymbole: 0,
                ohneAnker: {}, unter5Mio: {}, zuWenigTage: {} };
  var reihen = {}, symbole = [];
  alle.forEach(function (sym) {
    if (!WP.istAktie(sym)) { zaehl.keineAktie++; return; }
    var R = reiheC(sym);
    if (!R) { zaehl.ohneReihe++; return; }
    reihen[sym] = R; symbole.push(sym);
  });
  zaehl.gepruefteSymbole = symbole.length;

  var zellen = {}, zeitpunkte = [];
  var KLASSEN = St.PLAN.klassen;      /* woertlich dieselben Grenzen wie Rahmen A */
  var FENSTER = St.PLAN.fenster;

  for (var y = 0; y < jahre.length; y++) {
    var jahr = jahre[y];
    var anker = (jahr - 1) + '-12-31';
    zaehl.ohneAnker[jahr] = 0; zaehl.unter5Mio[jahr] = 0; zaehl.zuWenigTage[jahr] = 0;
    var nachKlasse = {};
    KLASSEN.forEach(function (k) { nachKlasse[k.name] = []; });

    for (var a = 0; a < symbole.length; a++) {
      var R2 = reihen[symbole[a]];
      var iA = St.indexBis(R2.tage, anker);
      /* Lebte der Wert am Jahresanker? klasseAn() verlangt 20 Balken bis dahin und
       * Stueckzahlen - beides ist gleichbedeutend mit "handelte damals". */
      var kl = iA >= 0 ? St.klasseAn(R2, iA) : null;
      if (!kl) { zaehl.ohneAnker[jahr]++; continue; }
      if (!kl.name) { zaehl.unter5Mio[jahr]++; continue; }

      var tage = [];
      for (var t = iA + 1; t < R2.tage.length; t++) {
        var d = R2.tage[t];
        if (d.slice(0, 4) > String(jahr)) break;
        if (d.slice(0, 4) !== String(jahr)) continue;
        var kt = kal.tage[d];
        if (!kt) continue;                 /* die Boerse handelte an dem Tag nicht */
        if (!kt.voll) continue;            /* Halbtag - die drei Fenster gibt es dort nicht */
        /* Paragraph 9b.2, Ergaenzung 2: mindestens NACHLAUF Balken hinter dem Tag, sonst
         * misst die Ziehung die Abwicklungsphase und nennt sie Handel. */
        if (R2.tage.length - 1 - t < PLAN_C.nachlaufTage) continue;
        tage.push(d);
      }
      if (tage.length < D) { zaehl.zuWenigTage[jahr]++; continue; }
      nachKlasse[kl.name].push({ sym: R2.sym, umsatz: kl.umsatz, tage: tage,
                                 letzter: R2.tage[R2.tage.length - 1] });
    }

    for (var k2 = 0; k2 < KLASSEN.length; k2++) {
      var kn = KLASSEN[k2].name;
      var kandidaten = nachKlasse[kn];
      kandidaten.sort(function (x, y2) { return x.sym < y2.sym ? -1 : x.sym > y2.sym ? 1 : 0; });
      /* EIGENER Saat-Text je Zelle ('C|Klasse|Jahr'), damit die Ziehung des Rahmens C die
       * des Rahmens A nicht beruehrt und beide getrennt nachvollziehbar bleiben. */
      var gewaehlt = St.mischen(kandidaten, St.wuerfel(St.saatAus('C|' + kn + '|' + jahr, PLAN_C.saat)))
                       .slice(0, Sym);
      zellen[kn + '|' + jahr] = { klasse: kn, jahr: jahr,
                                  verfuegbar: kandidaten.length, gezogen: gewaehlt.length };

      for (var g = 0; g < gewaehlt.length; g++) {
        var C = gewaehlt[g];
        var rTag = St.wuerfel(St.saatAus('C|' + C.sym + '|' + jahr + '|tag', PLAN_C.saat));
        var tageGezogen = St.mischen(C.tage, rTag).slice(0, D).sort();
        var Rc = reihen[C.sym];
        for (var d2 = 0; d2 < tageGezogen.length; d2++) {
          var tag = tageGezogen[d2];
          var iT = St.indexBis(Rc.tage, tag);
          var kT = iT >= 0 ? St.klasseAn(Rc, iT) : null;
          /* Wie viele volle Handelstage folgen dem Tag noch? Wird mitgeschrieben, damit
           * die Lebenszeit-Kontrolle (Paragraph 9b.5) nachrechenbar ist. */
          var restTage = Rc.tage.length - 1 - iT;
          for (var f = 0; f < FENSTER.length; f++) {
            var F = FENSTER[f];
            var rZ = St.wuerfel(St.saatAus('C|' + C.sym + '|' + tag + '|' + F.name, PLAN_C.saat));
            var minute = F.von + Math.floor(rZ() * (F.bis - F.von));
            var sekunde = Math.floor(rZ() * 60);
            zeitpunkte.push({ sym: C.sym, jahr: jahr, klasse: kn, umsatzAnker: C.umsatz,
                              klasseTag: kT ? kT.name : null, umsatzTag: kT ? kT.umsatz : null,
                              tag: tag, fenster: F.name, minuteEt: minute, sekundeEt: sekunde,
                              letzterHandelstag: C.letzter, restTage: restTage,
                              utc: new Date(St.etZuUtc(tag, minute, sekunde)).toISOString() });
          }
        }
      }
    }
  }
  return { zeitpunkte: zeitpunkte, zaehl: zaehl, zellen: zellen,
           plan: { S: Sym, D: D, jahre: jahre, saat: PLAN_C.saat, nachlauf: PLAN_C.nachlaufTage } };
}

/* ---------- Schreiben: eine Zeile, sofort, synchron (aus messen.js) ---------- */
var schreiber = {};
function anhaengen(datei, zeile) {
  if (!schreiber[datei]) { fs.mkdirSync(path.dirname(datei), { recursive: true }); schreiber[datei] = 1; }
  fs.appendFileSync(datei, zeile + '\n');
}
/** Die Zieldatei einer Zeile. EINZIGE Stelle, an der ein Dateiname entsteht - und er
 *  traegt immer das Praefix zusatzC-. */
function zieldatei(jahr) { return path.join(ZIEL, 'zusatzC-' + jahr + '.jsonl'); }
function fortschrittSchreiben() {
  Z.zuletzt = new Date().toISOString();
  try { fs.writeFileSync(path.join(ZIEL, 'zusatzC-fortschritt.json'), JSON.stringify(Z, null, 1)); }
  catch (e) { /* egal */ }
}

/* ---------- Was liegt schon? KOPIE von schonDa() aus messen.js, mit dem einzigen
 *            Unterschied, dass sie die zusatzC-Dateien liest statt der Jahresdateien
 *            des Rahmens A. Nicht wiederverwendet, weil das Original fest auf
 *            <jahr>.jsonl zeigt - und genau dorthin darf dieses Skript nicht sehen. */
function schonDaC(jahre) {
  var da = {};
  for (var i = 0; i < jahre.length; i++) {
    var f = zieldatei(jahre[i]);
    if (!fs.existsSync(f)) continue;
    var txt = fs.readFileSync(f, 'utf8').split('\n');
    for (var k = 0; k < txt.length; k++) {
      if (!txt[k]) continue;
      var o; try { o = JSON.parse(txt[k]); } catch (e) { continue; }
      if (o && o.sym && o.utc) da[o.sym + '|' + o.utc] = 1;
    }
  }
  return da;
}

/* ---------- Ringverteilung. KOPIE von ringfolge() aus messen.js; der Eimerschluessel
 *            traegt zusaetzlich den Rahmen, damit eine spaetere gemeinsame Verwendung
 *            die beiden Rahmen nicht in einen Eimer wirft. ---------- */
function ringfolgeC(zeitpunkte) {
  var eimer = {}, folge = [];
  for (var i = 0; i < zeitpunkte.length; i++) {
    var z = zeitpunkte[i], k = 'C|' + z.klasse + '|' + z.jahr + '|' + z.fenster;
    (eimer[k] || (eimer[k] = [])).push(z);
  }
  var namen = Object.keys(eimer).sort();
  var maxLen = 0;
  namen.forEach(function (n) { if (eimer[n].length > maxLen) maxLen = eimer[n].length; });
  for (var r = 0; r < maxLen; r++) {
    for (var n2 = 0; n2 < namen.length; n2++) {
      if (eimer[namen[n2]][r]) folge.push(eimer[namen[n2]][r]);
    }
  }
  return folge;
}

/* ---------- Moduspruefung: traegt der Endpunkt sort=desc? (aus messen.js) ---------- */
async function modusPruefen() {
  var T = '2018-03-01T14:35:00Z';
  var r = await hole(M.pfadQuote('AAPL', T));
  if (r.status !== 200) return { ok: false, grund: 'HTTP ' + r.status + ' bei der Moduspruefung' };
  var L = r.daten && r.daten.quotes ? r.daten.quotes.AAPL : null;
  if (!Array.isArray(L) || !L.length) return { ok: false, grund: 'Moduspruefung lieferte keinen Quote' };
  if (L.length !== 1) return { ok: false, grund: 'limit=1 lieferte ' + L.length + ' Quotes' };
  if (!(Date.parse(L[0].t) <= Date.parse(T) + 1)) {
    return { ok: false, grund: 'sort=desc ignoriert: Quote ' + L[0].t + ' liegt NACH dem Zeitpunkt' };
  }
  return { ok: true, quote: L[0] };
}

/* ================= Der Lauf ================= */
async function lauf(opts) {
  var P = planC();
  var zp = P.zeitpunkte;
  sag('Rahmen C: ' + P.zaehl.rahmen + ' verschwundene Reihen, davon keine Aktie ' +
      P.zaehl.keineAktie + ', ohne Reihe ' + P.zaehl.ohneReihe +
      '  ->  geprueft ' + P.zaehl.gepruefteSymbole);
  Object.keys(P.zellen).sort().forEach(function (k) {
    var z = P.zellen[k];
    sag('  ' + k + '   verfuegbar ' + z.verfuegbar + '   gezogen ' + z.gezogen +
        (z.gezogen === z.verfuegbar && z.gezogen > 0 ? '   (Vollerhebung)' : ''));
  });
  PLAN_C.jahre.forEach(function (j) {
    sag('  ' + j + ': ohne Anker ' + P.zaehl.ohneAnker[j] + '   unter 5 Mio $ ' +
        P.zaehl.unter5Mio[j] + '   zu wenige ziehbare Tage ' + P.zaehl.zuWenigTage[j]);
  });

  if (opts.testlauf) {
    /* 20 Symbole - fuenf je Klasse, damit der Testlauf die Spannweite zwischen den Klassen
     * sieht. Die Klasse ab1000 ist in Rahmen C leer, es werden also 15. */
    var gesehen = {}, jeKlasse = {};
    for (var i = 0; i < zp.length; i++) {
      var z0 = zp[i];
      if (gesehen[z0.sym]) continue;
      if ((jeKlasse[z0.klasse] || 0) >= 5) continue;
      jeKlasse[z0.klasse] = (jeKlasse[z0.klasse] || 0) + 1;
      gesehen[z0.sym] = 1;
    }
    zp = zp.filter(function (z) { return gesehen[z.sym]; });
    sag('  Klassen im Testlauf: ' + JSON.stringify(jeKlasse));
    ZIEL = path.join(ZIEL, 'testlauf');
    fs.mkdirSync(ZIEL, { recursive: true });
    sag('TESTLAUF: ' + Object.keys(gesehen).length + ' Symbole, ' + zp.length +
        ' Zeitpunkte -> ' + ZIEL);
  }

  /* ---- Placebo (Paragraph 9b.5, Schwelle und Auswahl wie Paragraph 9a): jeder 25.
   * mitte-Zeitpunkt bekommt zusaetzlich einen Zeitpunkt um 08:00 ET, vorboerslich. Er
   * laeuft IM SELBEN Lauf, in derselben Datei und mit demselben Werkzeug - eine Kontrolle,
   * die anders gemessen wird als der Kandidat, kontrolliert nichts. */
  var placebo = [];
  var mittags = zp.filter(function (z) { return z.fenster === 'mitte'; });
  for (var pi = 0; pi < mittags.length; pi += PLAN_C.placeboJeder) {
    var pz = mittags[pi];
    placebo.push({ sym: pz.sym, jahr: pz.jahr, klasse: pz.klasse, klasseTag: pz.klasseTag,
                   umsatzAnker: pz.umsatzAnker, umsatzTag: pz.umsatzTag,
                   tag: pz.tag, fenster: 'placebo-vorboerslich',
                   letzterHandelstag: pz.letzterHandelstag, restTage: pz.restTage,
                   utc: new Date(St.etZuUtc(pz.tag, 8 * 60, 0)).toISOString() });
  }
  zp = zp.concat(placebo);
  sag('Placebo (vorboerslich 08:00 ET): ' + placebo.length + ' Zeitpunkte, laufen mit.');

  var jahre = {}; zp.forEach(function (z) { jahre[z.jahr] = 1; });
  var da = schonDaC(Object.keys(jahre));
  var folge = ringfolgeC(zp).filter(function (z) {
    if (da[z.sym + '|' + z.utc]) { Z.uebersprungen++; return false; }
    return true;
  });
  sag('Zeitpunkte im Plan ' + zp.length + '   schon vorhanden ' + Z.uebersprungen +
      '   zu holen ' + folge.length);
  sag('Geschaetzte Laufzeit bei ' + RATE_JE_MIN + '/min: ' +
      (folge.length / RATE_JE_MIN).toFixed(0) + ' Min');
  if (!folge.length) { sag('Nichts zu tun.'); return; }

  var m = await modusPruefen();
  if (!m.ok) {
    sag('ABBRUCH - Moduspruefung verfehlt: ' + m.grund);
    sag('Der Lauf weicht NICHT still auf einen anderen Abrufmodus aus (Registrierung 5.3).');
    return;
  }
  sag('Moduspruefung bestanden: letzter Quote vor dem Zeitpunkt, ' + m.quote.t);
  sag('');

  var naechster = 0, t0 = Date.now();
  async function arbeiter() {
    for (;;) {
      var idx = naechster++;
      if (idx >= folge.length) return;
      var z = folge[idx];
      var r = await hole(M.pfadQuote(z.sym, z.utc));
      var q = (r.status === 200 && r.daten && r.daten.quotes && Array.isArray(r.daten.quotes[z.sym]))
        ? r.daten.quotes[z.sym][0] : null;
      var b = M.bewerten(q);
      if (b.grund === 'keinQuote') Z.keinQuote++;
      else if (b.grund === 'gekreuzt') Z.gekreuzt++;
      else if (b.grund === 'nullkurs') Z.nullkurs++;
      else { Z.treffer++; if (b.gesperrt) Z.gesperrt++; }
      var zeile = {
        rahmen: 'C',
        sym: z.sym, jahr: z.jahr, klasse: z.klasse, klasseTag: z.klasseTag,
        umsatzAnker: z.umsatzAnker, umsatzTag: z.umsatzTag,
        tag: z.tag, fenster: z.fenster, utc: z.utc,
        letzterHandelstag: z.letzterHandelstag, restTage: z.restTage,
        status: r.status,
        tq: q ? q.t : null, bp: q ? q.bp : null, ap: q ? q.ap : null,
        bs: q ? q.bs : null, as: q ? q.as : null, bx: q ? q.bx : null, ax: q ? q.ax : null,
        spanne: b.spanne == null ? null : b.spanne, grund: b.grund || null
      };
      anhaengen(zieldatei(z.jahr), JSON.stringify(zeile));
      var fertig = Z.treffer + Z.keinQuote + Z.gekreuzt + Z.nullkurs;
      if (fertig % 250 === 0) {
        var proMin = fertig / ((Date.now() - t0) / 60000);
        fortschrittSchreiben();
        sag('  ' + fertig + '/' + folge.length + '   Treffer ' + Z.treffer +
            '   kein Quote ' + Z.keinQuote + '   gekreuzt ' + Z.gekreuzt +
            '   gesperrt ' + Z.gesperrt + '   Fehler ' + JSON.stringify(Z.fehler) +
            '   ' + proMin.toFixed(0) + '/min   Rest ' +
            ((folge.length - fertig) / Math.max(1, proMin)).toFixed(0) + ' Min');
      }
    }
  }
  var ws = [];
  for (var w = 0; w < GLEICHZEITIG; w++) ws.push(arbeiter());
  await Promise.all(ws);
  fortschrittSchreiben();
  sag('');
  sag('FERTIG. Aufrufe ' + Z.aufrufe + '   Treffer ' + Z.treffer + '   kein Quote ' + Z.keinQuote +
      '   gekreuzt ' + Z.gekreuzt + '   Nullkurs ' + Z.nullkurs + '   gesperrt ' + Z.gesperrt);
  sag('Fehler je Art: ' + JSON.stringify(Z.fehler) + '   Wiederholungen ' + Z.wiederholt);
  sag('Rohdaten: ' + ZIEL + '/zusatzC-<jahr>.jsonl');
}

/* ================= Start ================= */
async function main() {
  var argv = process.argv.slice(2);
  var opts = { testlauf: argv.indexOf('--testlauf') >= 0 };
  sag('=== Zusatz C: Spannen der verschwundenen Werte - ' + new Date().toISOString() + ' ===');
  if (!S.vorhanden()) { sag('ABBRUCH: Umgebungswerte fehlen (' + S.fehlend().join(', ') + ').'); return; }
  fs.mkdirSync(ZIEL, { recursive: true });
  if (!Kalender.lesen()) {
    sag('Boersenkalender fehlt - wird geholt (ein Abruf) ...');
    var kr = await Kalender.holen();
    if (!kr.ok) { sag('ABBRUCH: Kalender nicht zu holen - ' + kr.grund); return; }
  }
  process.on('SIGINT', function () {
    fortschrittSchreiben();
    sag('\nAbgebrochen - der Stand liegt, ein Neustart macht weiter.');
    process.exit(0);
  });
  await lauf(opts);
}

/* ---- Selbsttest: kein Netz, boesartiger Server. Baugleich mit probe.js - der
 *      stdout-Haken reicht DURCH, statt zu schlucken (sonst verschwindet die Ausgabe
 *      der ganzen Pruefsuite im Sammelpuffer, 03.09.2026). ---- */
async function selbsttest() {
  var MARKE_ID = 'ZZTESTKENNUNGxyz1234', MARKE_GEHEIM = 'ZZTESTGEHEIMabcd5678';
  S.testZugangSetzen(MARKE_ID, MARKE_GEHEIM);
  var gesammelt = '';
  var echtesSchreiben = process.stdout.write.bind(process.stdout);
  process.stdout.write = function (chunk) { gesammelt += String(chunk); return echtesSchreiben(chunk); };
  var echtesFetch = globalThis.fetch;
  /* Der schlimmste Fall, den ein fremder Server anrichten kann: er spiegelt die Kopfzeilen
   * im Rumpf zurueck. Status 200, damit hole() nicht fuenfmal wiederholt - der Leck-Test
   * soll die Ausgabepfade pruefen, nicht die Wartezeiten. */
  globalThis.fetch = async function (url, opt) {
    var kopf = JSON.stringify((opt && opt.headers) || {});
    return { status: 200, headers: { get: function () { return null; } },
             text: async function () { return 'Serverantwort von ' + url + ' mit ' + kopf; } };
  };
  var r = await hole('/stocks/quotes?symbols=AAPL');
  globalThis.fetch = echtesFetch;
  sag('Selbsttest-Rumpf: ' + r.text);
  sag('Selbsttest-Kopf: ' + JSON.stringify(S.kopfzeilen()));
  process.stdout.write = echtesSchreiben;
  var leck = gesammelt.indexOf(MARKE_ID) >= 0 || gesammelt.indexOf(MARKE_GEHEIM) >= 0;
  return { leck: leck, ausgabe: gesammelt };
}

module.exports = { planC: planC, reiheC: reiheC, zieldatei: zieldatei,
                   schonDaC: schonDaC, ringfolgeC: ringfolgeC,
                   selbsttest: selbsttest, PLAN_C: PLAN_C, ZIEL: ZIEL };

if (require.main === module) { main(); }

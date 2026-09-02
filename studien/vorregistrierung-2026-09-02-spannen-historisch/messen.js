'use strict';
/* ================= Das Messwerkzeug: notierte Spannen aus der Alpaca-Kurstafel ==========
 *
 * Faehrt den Plan aus stichprobe.js ab und schreibt jede Antwort SOFORT als Zeile nach
 * E:/Markt-Dashboard-Archiv/spannen/<jahr>.jsonl. Node, ohne App, ohne Fenster.
 *
 * WAS GEMESSEN WIRD (Registrierung §3, §5.3): der zum Zeitpunkt T gueltige Quote, also der
 * LETZTE bei oder vor T - abgerufen mit start=T-5min, end=T, limit=1, sort=desc. Der erste
 * Quote NACH T waere ein anderer Schaetzer: bei duennen Werten traefe er systematisch den
 * Augenblick einer Kursstellung, und Kursstellungen fallen mit Aktivitaet zusammen. Genau
 * die Klasse, um die es geht, waere dann zu schoen gemessen.
 *
 * FORTSETZBAR: beim Start wird gelesen, was schon liegt (Schluessel sym|utc), und
 * uebersprungen. Der Lauf darf jederzeit abgebrochen werden.
 *
 * REIHENFOLGE: Ringverteilung ueber die 132 Zellen, nicht Zelle fuer Zelle. Ein Abbruch
 * bei der Haelfte hinterlaesst damit 132 halb gefuellte Zellen statt 66 vollen - jede
 * Zwischenauswertung ist dann schon aussagefaehig. Die Reihenfolge ist deterministisch.
 *
 * LOSGELOEST VOM CHAT: Wilhelm startet das hier in seinem eigenen Terminal. Es haengt an
 * keiner Sitzung; ein Chat-Ende beendet nichts.
 *
 * Zugang: nur ueber schluessel.js. Diese Datei kennt die Umgebungsnamen nicht.
 *
 * Aufrufe:
 *   node .../messen.js --testlauf     20 Symbole, 1 Jahr - Ausgabe pruefen, VOR dem Vollauf
 *   node .../messen.js                der Vollauf (Rahmen A)
 *   node .../messen.js --zusatzA      Momentum-Umschichtungen, 15:55 ET
 *   node .../messen.js --zusatzB      Auktionen (Schluss + Folgeeroeffnung)
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */

var fs = require('fs');
var path = require('path');
var S = require('./schluessel.js');
var St = require('./stichprobe.js');

var BASIS = 'https://data.alpaca.markets/v2';
var ZIEL = process.env.MD_SPANNEN || 'E:/Markt-Dashboard-Archiv/spannen';
var PLANDATEI = path.join(ZIEL, 'plan.json');

/* ---- Betriebsgroessen. Die Ratengrenze der Kopfzeile lag bei 200/min; 180 laesst Luft
 *      fuer die Wiederholungen nach 429. ---- */
var RATE_JE_MIN = 180;
var GLEICHZEITIG = 8;              /* Arbeiter. Die Bremse ist der Eimer, nicht die Zahl - der Testlauf
                                    * schaffte mit vieren nur 102/min, weil die Antwortzeit bremst
                                    * (~2,4 s je Abruf), nicht die Ratengrenze. Nachtrag 9a. */
var RUECKBLICK_MIN = 5;            /* Rueckblickfenster in Minuten (Registrierung §5.3) */
var VERSUCHE = 5;

function sag(t) { process.stdout.write(S.verdecken(t) + '\n'); }
function pause(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/* ---------- Ratenbremse: Eimer mit RATE_JE_MIN Marken je 60 s ---------- */
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
var Z = { aufrufe: 0, treffer: 0, keinQuote: 0, uebersprungen: 0, gekreuzt: 0, nullkurs: 0, gesperrt: 0,
          fehler: {}, wiederholt: 0, gestartet: new Date().toISOString(), zuletzt: null };
function fehlerZaehlen(art) { Z.fehler[art] = (Z.fehler[art] || 0) + 1; }

/* ---------- Ein Abruf mit Wiederholung ---------- */
async function hole(pfad) {
  for (var v = 1; v <= VERSUCHE; v++) {
    await marke();
    Z.aufrufe++;
    var res, text;
    try {
      /* Zeitlimit je Abruf. Ohne es haelt eine haengende Verbindung einen der acht Arbeiter
       * fuer immer an - in einem Lauf ueber fuenf Stunden ohne Aufsicht faellt das erst am
       * Ende auf, und dann als "es dauert laenger als gedacht", nicht als Fehler. */
      res = await fetch(BASIS + pfad, { headers: S.kopfzeilen(), signal: AbortSignal.timeout(30000) });
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

/* ---------- Die Zielgroesse. Ausschlussregeln WOERTLICH aus der Registrierung §7:
 *            bp=0, ap=0, gekreuzt (ap<bp) zaehlen als FEHLEND, nie als Spanne 0.
 *            Kein Ausschluss nach HOEHE der Spanne. ---------- */
function bewerten(q) {
  if (!q) return { grund: 'keinQuote' };
  var bp = Number(q.bp), ap = Number(q.ap);
  if (!isFinite(bp) || !isFinite(ap)) return { grund: 'keinQuote' };
  if (bp <= 0 || ap <= 0) return { grund: 'nullkurs' };
  if (ap < bp) return { grund: 'gekreuzt' };
  var mid = (bp + ap) / 2;
  if (!(mid > 0)) return { grund: 'nullkurs' };
  /* bp === ap ist ein GESPERRTER Markt (locked). Das ist ein echter, kurzer Zustand und
   * zaehlt als Spanne 0 - kein Ausschluss, denn Ausschluesse auf die Zielgroesse sind
   * verboten (Registrierung §7). Er wird aber GEZAEHLT: eine Zelle voller Nullen bedeutet
   * etwas anderes als eine Zelle mit engen Spannen, und der Unterschied muss sichtbar sein. */
  return { spanne: ((ap - bp) / mid) * 100, mid: mid, gesperrt: ap === bp };
}

function pfadQuote(sym, utc) {
  var von = new Date(new Date(utc).getTime() - RUECKBLICK_MIN * 60000).toISOString();
  return '/stocks/quotes?symbols=' + encodeURIComponent(sym) +
         '&start=' + encodeURIComponent(von) + '&end=' + encodeURIComponent(utc) +
         '&limit=1&sort=desc&feed=sip';
}

/* ---------- Schreiben: eine Zeile, sofort, synchron. Ein Abbruch verliert nichts. ---------- */
var schreiber = {};
function anhaengen(datei, zeile) {
  if (!schreiber[datei]) { fs.mkdirSync(path.dirname(datei), { recursive: true }); schreiber[datei] = 1; }
  fs.appendFileSync(datei, zeile + '\n');
}
function fortschrittSchreiben() {
  Z.zuletzt = new Date().toISOString();
  try { fs.writeFileSync(path.join(ZIEL, 'fortschritt.json'), JSON.stringify(Z, null, 1)); } catch (e) { /* egal */ }
}

/* ---------- Was liegt schon? ---------- */
function schonDa(jahre) {
  var da = {};
  for (var i = 0; i < jahre.length; i++) {
    var f = path.join(ZIEL, jahre[i] + '.jsonl');
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

/* ---------- Ringverteilung ueber die Zellen ---------- */
function ringfolge(zeitpunkte) {
  var eimer = {}, folge = [];
  for (var i = 0; i < zeitpunkte.length; i++) {
    var z = zeitpunkte[i], k = z.klasse + '|' + z.jahr + '|' + z.fenster;
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

/* ---------- Moduspruefung: traegt der Endpunkt sort=desc? ----------
 * Ohne sie liefe der Lauf notfalls still im falschen Modus - und der Unterschied
 * (letzter Quote vor T gegen ersten danach) trifft genau die duennen Werte. */
async function modusPruefen() {
  var T = '2018-03-01T14:35:00Z';
  var r = await hole(pfadQuote('AAPL', T));
  if (r.status !== 200) return { ok: false, grund: 'HTTP ' + r.status + ' bei der Moduspruefung' };
  var L = r.daten && r.daten.quotes ? r.daten.quotes.AAPL : null;
  if (!Array.isArray(L) || !L.length) return { ok: false, grund: 'Moduspruefung lieferte keinen Quote' };
  if (L.length !== 1) return { ok: false, grund: 'limit=1 lieferte ' + L.length + ' Quotes' };
  /* NUMERISCH vergleichen, nicht als Text. Probe 2 hatte hier den Fehler: die Zeichenkette
   * '...T14:35:00Z' ist groesser als '...T14:35:00.001Z', weil '.' vor 'Z' steht - der
   * Pruefsatz meldete "VERFEHLT" bei einer Schnittstelle, die genau das Richtige tat. */
  if (!(Date.parse(L[0].t) <= Date.parse(T) + 1)) {
    return { ok: false, grund: 'sort=desc ignoriert: Quote ' + L[0].t + ' liegt NACH dem Zeitpunkt' };
  }
  return { ok: true, quote: L[0] };
}

/* ================= Rahmen A: der Hauptlauf ================= */
async function hauptlauf(opts) {
  var P = JSON.parse(fs.readFileSync(PLANDATEI, 'utf8'));
  var zp = P.zeitpunkte;
  if (opts.testlauf) {
    /* 20 Symbole, 1 Jahr - wie beauftragt, VOR dem Vollauf, Ausgabe pruefen.
     * FUENF JE KLASSE, nicht die ersten zwanzig: der Plan ist nach Klasse sortiert, die
     * ersten zwanzig waeren also alle aus 5-50 gewesen - und ein Testlauf, der nur eine
     * Klasse sieht, zeigt genau das nicht, wozu er da ist (die Spannweite zwischen den
     * Klassen und ob die duennen Werte ueberhaupt Quotes haben). */
    var gesehen = {}, jeKlasse = {};
    for (var i = 0; i < zp.length; i++) {
      var z0 = zp[i];
      if (z0.jahr !== 2018 || gesehen[z0.sym]) continue;
      if ((jeKlasse[z0.klasse] || 0) >= 5) continue;
      jeKlasse[z0.klasse] = (jeKlasse[z0.klasse] || 0) + 1;
      gesehen[z0.sym] = 1;
    }
    zp = zp.filter(function (z) { return z.jahr === 2018 && gesehen[z.sym]; });
    sag('  Klassen im Testlauf: ' + JSON.stringify(jeKlasse));
    ZIEL = path.join(ZIEL, 'testlauf');
    fs.mkdirSync(ZIEL, { recursive: true });
    sag('TESTLAUF: ' + Object.keys(gesehen).length + ' Symbole, Jahr 2018, ' + zp.length +
        ' Zeitpunkte -> ' + ZIEL);
  }

  /* ---- Placebo (Registrierung §7): 1 % der gezogenen Symbol-Tage bekommt zusaetzlich
   * einen Zeitpunkt um 08:00 ET, vorboerslich. Er laeuft IM SELBEN Lauf, in derselben
   * Datei und mit demselben Werkzeug - eine Kontrolle, die anders gemessen wird als der
   * Kandidat, kontrolliert nichts. Erwartung: mindestens doppelt so breit wie `mitte`.
   * Die Auswahl ist deterministisch (jeder 25. Mittagszeitpunkt). 4 % statt 1 %, weil der
   * Testlauf zeigte, dass vorboerslich bei duennen Werten oft GAR KEIN Quote steht -
   * bei 1 % blieben zu wenige verwertbare Paare uebrig (Nachtrag 9a). */
  var placebo = [];
  var mittags = zp.filter(function (z) { return z.fenster === 'mitte'; });
  for (var pi = 0; pi < mittags.length; pi += 25) {
    var pz = mittags[pi];
    placebo.push({ sym: pz.sym, jahr: pz.jahr, klasse: pz.klasse, klasseTag: pz.klasseTag,
                   umsatzAnker: pz.umsatzAnker, umsatzTag: pz.umsatzTag,
                   tag: pz.tag, fenster: 'placebo-vorboerslich',
                   utc: new Date(St.etZuUtc(pz.tag, 8 * 60, 0)).toISOString() });
  }
  zp = zp.concat(placebo);
  sag('Placebo (vorboerslich 08:00 ET): ' + placebo.length + ' Zeitpunkte, laufen mit.');

  var jahre = {}; zp.forEach(function (z) { jahre[z.jahr] = 1; });
  var da = schonDa(Object.keys(jahre));
  var folge = ringfolge(zp).filter(function (z) {
    if (da[z.sym + '|' + z.utc]) { Z.uebersprungen++; return false; }
    return true;
  });
  sag('Zeitpunkte im Plan ' + zp.length + '   schon vorhanden ' + Z.uebersprungen +
      '   zu holen ' + folge.length);
  sag('Geschaetzte Laufzeit bei ' + RATE_JE_MIN + '/min: ' + (folge.length / RATE_JE_MIN / 60).toFixed(1) + ' h');
  if (!folge.length) { sag('Nichts zu tun.'); return; }

  var m = await modusPruefen();
  if (!m.ok) {
    sag('ABBRUCH - Moduspruefung verfehlt: ' + m.grund);
    sag('Der Lauf weicht NICHT still auf einen anderen Abrufmodus aus (Registrierung §5.3).');
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
      var r = await hole(pfadQuote(z.sym, z.utc));
      var q = (r.status === 200 && r.daten && r.daten.quotes && Array.isArray(r.daten.quotes[z.sym]))
        ? r.daten.quotes[z.sym][0] : null;
      var b = bewerten(q);
      if (b.grund === 'keinQuote') Z.keinQuote++;
      else if (b.grund === 'gekreuzt') Z.gekreuzt++;
      else if (b.grund === 'nullkurs') Z.nullkurs++;
      else { Z.treffer++; if (b.gesperrt) Z.gesperrt++; }
      var zeile = {
        sym: z.sym, jahr: z.jahr, klasse: z.klasse, klasseTag: z.klasseTag,
        umsatzAnker: z.umsatzAnker, umsatzTag: z.umsatzTag,
        tag: z.tag, fenster: z.fenster, utc: z.utc,
        status: r.status,
        tq: q ? q.t : null, bp: q ? q.bp : null, ap: q ? q.ap : null,
        bs: q ? q.bs : null, as: q ? q.as : null, bx: q ? q.bx : null, ax: q ? q.ax : null,
        spanne: b.spanne == null ? null : b.spanne, grund: b.grund || null
      };
      anhaengen(path.join(ZIEL, z.jahr + '.jsonl'), JSON.stringify(zeile));
      var fertig = Z.treffer + Z.keinQuote + Z.gekreuzt + Z.nullkurs;
      if (fertig % 250 === 0) {
        var proMin = fertig / ((Date.now() - t0) / 60000);
        fortschrittSchreiben();
        sag('  ' + fertig + '/' + folge.length + '   Treffer ' + Z.treffer +
            '   kein Quote ' + Z.keinQuote + '   gekreuzt ' + Z.gekreuzt + '   gesperrt ' + Z.gesperrt +
            '   Fehler ' + JSON.stringify(Z.fehler) +
            '   ' + proMin.toFixed(0) + '/min   Rest ' +
            ((folge.length - fertig) / Math.max(1, proMin) / 60).toFixed(1) + ' h');
      }
    }
  }
  var arbeiter_ = [];
  for (var w = 0; w < GLEICHZEITIG; w++) arbeiter_.push(arbeiter());
  await Promise.all(arbeiter_);
  fortschrittSchreiben();
  sag('');
  sag('FERTIG. Aufrufe ' + Z.aufrufe + '   Treffer ' + Z.treffer + '   kein Quote ' + Z.keinQuote +
      '   gekreuzt ' + Z.gekreuzt + '   Nullkurs ' + Z.nullkurs + '   gesperrt ' + Z.gesperrt);
  sag('Fehler je Art: ' + JSON.stringify(Z.fehler) + '   Wiederholungen ' + Z.wiederholt);
}

/* ================= Zusatz A: Momentum-Umschichtungen ================= */
async function zusatzA() {
  var Korb = require('./korb.js');
  sag('Zusatz A: Korb-Nachbau wird gegen das Lauf-JSON geprueft (dauert ein bis zwei Minuten) ...');
  var pr = Korb.pruefen(2016);
  sag('  Perioden ab 2016: ' + pr.perioden.length + '   Abweichungen im korbN: ' + pr.abweichungenKorb +
      '   in n (zulaessige Werte): ' + pr.abweichungenN);
  if (!pr.ok) {
    sag('  POSITIVKONTROLLE VERFEHLT - Zusatz A entfaellt (Registrierung §6).');
    fs.writeFileSync(path.join(ZIEL, 'zusatzA-entfallen.json'),
      JSON.stringify({ grund: 'Korb-Nachbau reproduziert korbN nicht', perioden: pr.perioden }, null, 1));
    return;
  }
  sag('  Positivkontrolle bestanden.');
  var datei = path.join(ZIEL, 'zusatzA-umschichtungen.jsonl');
  var da = {};
  if (fs.existsSync(datei)) {
    fs.readFileSync(datei, 'utf8').split('\n').forEach(function (l) {
      if (!l) return; var o; try { o = JSON.parse(l); } catch (e) { return; }
      if (o && o.sym && o.tag) da[o.sym + '|' + o.tag] = 1;
    });
  }
  var arbeit = [];
  pr.perioden.forEach(function (P) {
    P.korb.forEach(function (sym) {
      if (da[sym + '|' + P.tag]) return;
      arbeit.push({ sym: sym, tag: P.tag, utc: new Date(St.etZuUtc(P.tag, 15 * 60 + 55, 0)).toISOString() });
    });
  });
  sag('  Abrufe: ' + arbeit.length + ' (schon vorhanden: ' + Object.keys(da).length + ')');
  var i = 0;
  async function arbeiter() {
    for (;;) {
      var k = i++; if (k >= arbeit.length) return;
      var A = arbeit[k];
      var r = await hole(pfadQuote(A.sym, A.utc));
      var q = (r.status === 200 && r.daten && r.daten.quotes && Array.isArray(r.daten.quotes[A.sym]))
        ? r.daten.quotes[A.sym][0] : null;
      var b = bewerten(q);
      anhaengen(datei, JSON.stringify({ sym: A.sym, tag: A.tag, utc: A.utc, status: r.status,
        tq: q ? q.t : null, bp: q ? q.bp : null, ap: q ? q.ap : null,
        spanne: b.spanne == null ? null : b.spanne, grund: b.grund || null }));
      if (k % 200 === 0) { sag('  ' + k + '/' + arbeit.length); fortschrittSchreiben(); }
    }
  }
  var ws = []; for (var w = 0; w < GLEICHZEITIG; w++) ws.push(arbeiter());
  await Promise.all(ws);
  fortschrittSchreiben();
  sag('Zusatz A fertig. Aufrufe ' + Z.aufrufe);
}

/* ================= Zusatz B: Auktionen ================= */
async function zusatzB() {
  var P = JSON.parse(fs.readFileSync(PLANDATEI, 'utf8'));
  /* Je Symbol EIN Abruf ueber die ganze Spanne der gezogenen Tage - der Endpunkt traegt
   * ein ganzes Jahr in einer Antwort (Probe 2, Frage D). Gefiltert wird danach. */
  var jeSym = {};
  P.zeitpunkte.forEach(function (z) {
    var e = jeSym[z.sym] || (jeSym[z.sym] = { tage: {}, von: z.tag, bis: z.tag });
    e.tage[z.tag] = 1;
    if (z.tag < e.von) e.von = z.tag;
    if (z.tag > e.bis) e.bis = z.tag;
  });
  var syms = Object.keys(jeSym).sort();
  var datei = path.join(ZIEL, 'zusatzB-auktionen.jsonl');
  var da = {};
  if (fs.existsSync(datei)) {
    fs.readFileSync(datei, 'utf8').split('\n').forEach(function (l) {
      if (!l) return; var o; try { o = JSON.parse(l); } catch (e) { return; }
      if (o && o.sym) da[o.sym] = 1;
    });
  }
  var offen = syms.filter(function (s) { return !da[s]; });
  sag('Zusatz B: ' + syms.length + ' Symbole, davon offen ' + offen.length);
  var i = 0;
  async function arbeiter() {
    for (;;) {
      var k = i++; if (k >= offen.length) return;
      var sym = offen[k], e = jeSym[sym];
      /* Ein Tag Vorlauf und zwei Tage Nachlauf: die Folgeeroeffnung liegt am naechsten
       * Handelstag, und der kann nach einem Wochenende drei Kalendertage weiter sein. */
      var bis = new Date(new Date(e.bis + 'T00:00:00Z').getTime() + 5 * 86400000).toISOString().slice(0, 10);
      var r = await hole('/stocks/auctions?symbols=' + encodeURIComponent(sym) +
                         '&start=' + e.von + '&end=' + bis + '&limit=10000&feed=sip');
      var L = (r.status === 200 && r.daten && r.daten.auctions) ? r.daten.auctions[sym] : null;
      anhaengen(datei, JSON.stringify({ sym: sym, status: r.status,
        gezogeneTage: Object.keys(e.tage).sort(),
        tage: Array.isArray(L) ? L.map(function (x) {
          var c = x.c && x.c.length ? x.c[x.c.length - 1] : null;
          var o = x.o && x.o.length ? x.o[0] : null;
          return { d: x.d, cp: c ? c.p : null, cs: c ? c.s : null, op: o ? o.p : null, os: o ? o.s : null };
        }) : null }));
      if (k % 100 === 0) { sag('  ' + k + '/' + offen.length); fortschrittSchreiben(); }
    }
  }
  var ws = []; for (var w = 0; w < GLEICHZEITIG; w++) ws.push(arbeiter());
  await Promise.all(ws);
  fortschrittSchreiben();
  sag('Zusatz B fertig. Aufrufe ' + Z.aufrufe);
}

/* ================= Start ================= */
async function main() {
  var argv = process.argv.slice(2);
  var opts = { testlauf: argv.indexOf('--testlauf') >= 0 };
  sag('=== Spannen-Messung - ' + new Date().toISOString() + ' ===');
  if (!S.vorhanden()) { sag('ABBRUCH: Umgebungswerte fehlen (' + S.fehlend().join(', ') + ').'); return; }
  fs.mkdirSync(ZIEL, { recursive: true });

  /* Vorbereitung selbst erledigen, damit der Lauf EIN Befehl ist. Beides ist deterministisch
   * und wird nur gebaut, wenn es fehlt - ein zweiter Start rechnet nicht neu. */
  var Kalender = require('./kalender.js');
  if (!Kalender.lesen()) {
    sag('Boersenkalender fehlt - wird geholt (ein Abruf) ...');
    var kr = await Kalender.holen();
    if (!kr.ok) { sag('ABBRUCH: Kalender nicht zu holen - ' + kr.grund); return; }
    sag('  ' + Object.keys(kr.tage).length + ' Handelstage, davon ' + kr.halbtage.length +
        ' nicht bis 16:00 (fallen aus der Ziehung).');
  }
  if (!fs.existsSync(PLANDATEI)) {
    sag('Plan fehlt - wird gerechnet (zwei Minuten, liest das Tagesarchiv) ...');
    var Pn = St.plan();
    fs.writeFileSync(PLANDATEI, JSON.stringify({ erstellt: new Date().toISOString(), plan: Pn.plan,
      zaehl: Pn.zaehl, zellen: Pn.zellen, n: Pn.zeitpunkte.length, zeitpunkte: Pn.zeitpunkte }));
    sag('  ' + Pn.zeitpunkte.length + ' Zeitpunkte.');
  }
  process.on('SIGINT', function () { fortschrittSchreiben(); sag('\nAbgebrochen - der Stand liegt, ein Neustart macht weiter.'); process.exit(0); });

  if (argv.indexOf('--zusatzA') >= 0) { await zusatzA(); return; }
  if (argv.indexOf('--zusatzB') >= 0) { await zusatzB(); return; }
  await hauptlauf(opts);
}

module.exports = { bewerten: bewerten, pfadQuote: pfadQuote, ringfolge: ringfolge, schonDa: schonDa };

if (require.main === module) { main(); }

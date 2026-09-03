'use strict';
/* ABSPALTUNGS-KURSFAKTOR: die eine Luecke der Maszahmen-Tabelle schlieszen (Stufe Z1c, Nachtrag).
 *
 *   node tools/alpaca-abspaltungsfaktor.js --listen      kein Netz: zaehlt und weist aus
 *   node tools/alpaca-abspaltungsfaktor.js --eichen      nur die beiden Eichungen, 4 Abrufe
 *   node tools/alpaca-abspaltungsfaktor.js --messen      misst und schreibt (2 Abrufe je Abspaltung)
 *   node tools/alpaca-abspaltungsfaktor.js --kontrolle   Selbsttest der reinen Bausteine, kein Netz
 *
 * WARUM. Phase M hat gemessen, was der Maszahmen-Endpunkt liefert: ein SPLIT traegt seinen
 * Kursfaktor (new_rate/old_rate), eine ABSPALTUNG nicht - sie traegt nur ein Stueckverhaeltnis
 * ("ein MBGL je SPGI"), und daraus ist der Kursfaktor nicht auszurechnen, er haengt am KURS des
 * abgespaltenen Papiers am Wirkungstag. 177 von 8.345 Werten (2,1 %) bleiben deshalb aus der
 * bereinigten Kopie (studien/alpaca-vollsammlung-2026-09/BEFUND.md Paragraph 1b).
 *
 * Der Faktor IST aber aus der Quelle messbar - nur nicht aus dem Maszahmen-Endpunkt. Alpaca
 * liefert dieselben Tagesbalken in vier Bereinigungen; `adjustment=all` rechnet Splits,
 * Dividenden UND Abspaltungen heraus, `adjustment=dividend` nur die Dividenden. Das
 * VERHAELTNIS all/dividend an denselben Stempeln isoliert also genau das, was der Endpunkt
 * verschweigt. Das kostet einen ZWEITEN Abruf je betroffenem Wert, den Wilhelms Konvention
 * "lokal ableiten, kein zweiter Abruf" sonst ausschlieszt - deshalb war es ein Entscheid und
 * kein Handgriff. Wilhelm, 03.09.2026 (wiki/entscheide.md, "Abspaltungs-Kursfaktor per
 * Zweitabruf"): JA, die einzige Ausnahme.
 *
 * DIE RICHTUNG - nachgerechnet, nicht uebernommen. `all` ist VOR der Abspaltung KLEINER als
 * `dividend` (dort ist der abgespaltene Wert schon herausgerechnet), das Verhaeltnis
 * all/dividend ist also 0,9459 und NICHT 1,0572. Der KURSFAKTOR ist sein Kehrwert:
 * dividend/all = 1,0572. Nur so steht er in derselben Richtung wie der Split-Faktor der
 * Quelle (MNST 1->2 gibt 2,000, und ableiten() teilt die Kurse davor durch 2) und passt in
 * dieselbe Rechnung "Kurse geteilt, Umsatz malgenommen". Der Befund vom 03.09. nennt 1,0572
 * verkuerzt "das Verhaeltnis all/dividend" - gemeint ist der Faktor, den es ergibt. Die
 * Klinke A1a haelt die Richtung fest, damit sie nicht beim naechsten Umbau kippt: ein
 * Einheiten- oder Richtungsfehler sieht in jeder Zusammenfassung richtig aus
 * (wiki/fehlerformen.md, "Skalenfehler zeigen Sprungpaare").
 *
 * DIE MESSUNG, Kriterien HIER im Code, vor dem Lauf:
 *   Fenster    1Day-Balken (NICHT 1Min - die Bereinigung steckt im Tageskurs, und 1Min waere
 *              das Tausendfache an Daten fuer dieselbe eine Zahl), ex_date-45 bis ex_date+30
 *              Kalendertage, EIN Abrufpaar je Abspaltung.
 *   Faktor     Median von dividend/all (Schlusskurs) ueber die letzten VOR_TAGE Handelstage
 *              VOR dem Wirkungstag. Das rohe Verhaeltnis all/dividend steht als
 *              `verhaeltnisAllDurchDividend` daneben, damit die Richtung nachpruefbar ist.
 *   Streuung   (max-min)/Median ueber dieselben Stempel. Liegt eine ZWEITE Maszahme im
 *              Fenster, ist das Verhaeltnis dort nicht konstant - dann ist der Median eine
 *              Mischung aus zwei Skalen und keine Messung. Ueber BAND: "unklar".
 *   Kontrolle  Median von all/dividend AB dem Wirkungstag muss 1,000 sein. Ist es das nicht,
 *              liegt hinter der Abspaltung noch eine Maszahme, die in den gemessenen Faktor
 *              mit hineinlaeuft - er waere dann nicht der Faktor DIESER Abspaltung. "unklar",
 *              und es wird NICHTS geschrieben. Ebenso, wenn es nach dem Wirkungstag gar keine
 *              Balken mehr gibt (erloschener Wert): nicht pruefbar ist nicht bestanden.
 *
 * ZWEI EICHUNGEN, beide VOR dem Lauf und beide bindend - faellt eine, wird kein einziger
 * Faktor geschrieben:
 *   Positivkontrolle  SPGI/2026-07-01 muss 1,057 ergeben. Diese Zahl stammt aus einer voellig
 *                     anderen Rechnung: die Skalenreparatur vom 03.09. hat sie aus dem
 *                     Verhaeltnis roher Alpaca-Kerzen zu YAHOO-Kerzen des Archivs gemessen
 *                     (uebergabe/nachholer-reparatur-2026-09-03.md). Zwei Wege, eine Zahl.
 *   Placebo           ein Wert OHNE Abspaltung muss 1,000 ergeben. Ohne ihn misst man
 *                     vielleicht nur, dass sich zwei Bereinigungen irgendwie unterscheiden.
 *
 * RATENBREMSE 20/min - eine Zehntel der Grenze. Der Vollauf der Balken laeuft parallel mit
 * 170/min auf DEMSELBEN Zugang; die 200/min der Quelle gelten fuer den Zugang, nicht je
 * Werkzeug. Ein 429 bricht dieses Werkzeug deshalb SOFORT ab und nennt die Wartezeit - es
 * wiederholt nicht, denn ein Wiederholungssturm ginge zu Lasten des Vollaufs, nicht zu
 * eigenen. Abbruch ist gefahrlos: jede Datei wird atomar geschrieben, ein neuer Start
 * ueberspringt, was schon gemessen ist.
 *
 * GESCHRIEBEN WIRD NUR unter alpaca-massnahmen/. Die Rohdaten alpaca1m/ werden NICHT
 * angefasst, die Yahoo-Archive nicht, der Store nicht. In die Maszahmen-Datei kommt eine
 * NEUE Liste `gemesseneFaktoren`; `saetze`, `anwendbar` und `ohneFaktor` bleiben Byte fuer
 * Byte, wie die Quelle sie geliefert hat. Wer spaeter nachsehen will, was gemessen und was
 * geliefert wurde, kann es unterscheiden - das ginge nicht mehr, wenn der gemessene Faktor
 * sich in den Quellensatz hineinschriebe.
 *
 * Zugang: NUR ueber schluessel.js der Spannen-Studie. Diese Datei kennt die Umgebungsnamen
 * nicht; jede Ausgabe laeuft durch verdecken().
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var M = require('./archiv-migration.js');
var S = require('../studien/vorregistrierung-2026-09-02-spannen-historisch/schluessel.js');

var DATEN = 'https://data.alpaca.markets/v2';
var RATE_JE_MIN = 20;            /* ein Zehntel der Grenze - der Vollauf teilt sich den Zugang */
var VERSUCHE = 3;                /* nur fuer Netzabbrueche und 5xx. Ein 429 wird NIE wiederholt. */
var VOR_TAGE = 20;               /* Handelstage vor der Maszahme, aus denen der Median kommt */
var NACH_TAGE = 20;              /* Handelstage ab der Maszahme fuer die Kontrolle */
var MIND_VOR = 5;                /* weniger gemeinsame Stempel davor: nicht gemessen, sondern geraten */
var MIND_NACH = 3;               /* weniger danach: die Kontrolle ist nicht fahrbar */
var BAND = 0.001;                /* dasselbe Band wie die Skalenpruefung: 0,999-1,001 */
var FENSTER_VOR_MS = 45 * 86400000;
var FENSTER_NACH_MS = 30 * 86400000;
var SIP_ABSTAND_MS = 30 * 60 * 1000;   /* der Gratistarif verweigert die juengsten SIP-Daten */

var EICH_SYM = 'SPGI', EICH_DATUM = '2026-07-01', EICH_SOLL = 1.057;
var PLACEBO_SYM = 'AAPL', PLACEBO_DATUM = '2026-07-01';   /* kein Split seit 2020, keine Abspaltung */

var WURZEL = process.env.MD_ALPACA_WURZEL || 'E:/Markt-Dashboard-Archiv';
var MASSNAHMEN = path.join(WURZEL, 'alpaca-massnahmen');
var BERICHT = path.join(MASSNAHMEN, '_abspaltungsfaktoren.json');
var PROTOKOLL = path.join(MASSNAHMEN, '_abspaltungsfaktoren.log');

var HERKUNFT = 'gemessen all/dividend';

function sag(t) { process.stdout.write(S.verdecken(t) + '\n'); }
function pause(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function protokoll(zeile) {
  try {
    fs.mkdirSync(MASSNAHMEN, { recursive: true });
    fs.appendFileSync(PROTOKOLL, S.verdecken(new Date().toISOString() + '  ' + zeile) + '\n');
  } catch (e) { /* ein fehlendes Protokoll darf den Lauf nicht anhalten */ }
}

/* ================= (1) Ratenbremse und Abruf ================= */
var marken = [];
async function marke() {
  for (;;) {
    var jetzt = Date.now();
    while (marken.length && jetzt - marken[0] > 60000) marken.shift();
    if (marken.length < RATE_JE_MIN) { marken.push(jetzt); return; }
    await pause(Math.max(20, 60000 - (jetzt - marken[0]) + 5));
  }
}
var Z = { abrufe: 0, wiederholt: 0 };

/** Der Abbruch bei 429. Eine eigene Fehlerart, damit der Aufrufer sie von einem
 *  gewoehnlichen Fehler unterscheiden kann, ohne im Text zu suchen. */
function Ueberlastet(warteS) {
  var e = new Error('429: die Quelle drosselt. Der Vollauf laeuft parallel - dieses Werkzeug '
    + 'weicht ihm aus und wiederholt NICHT. Bitte in ' + warteS + ' s erneut starten; '
    + 'gemessene Faktoren bleiben liegen und werden uebersprungen.');
  e.ueberlastet = true; e.warteS = warteS;
  return e;
}

async function hole(url, f) {
  f = f || globalThis.fetch;
  for (var v = 1; v <= VERSUCHE; v++) {
    /* Die Bremse gilt dem geteilten ZUGANG, nicht dem Aufruf: die 200/min der Quelle gelten
     * fuer den Zugang, und der Vollauf der Balken haengt mit 170/min daran. Eine
     * eingespeiste Quelle (der Schreib-Selbsttest) beruehrt diesen Zugang gar nicht - sie
     * zu drosseln haette den Test um eine Minute verlaengert und nichts abgesichert. Der
     * echte Weg hat keine Umgehung: das Kommandozeilen-Werkzeug reicht nirgends ein fetch
     * hinein, und eine Klinke in test-v6 haelt das fest. */
    if (f === globalThis.fetch) await marke();
    Z.abrufe++;
    var res, text;
    try {
      res = await f(url, { headers: S.kopfzeilen(), signal: AbortSignal.timeout(90000) });
      text = await res.text();
    } catch (e) {
      if (v === VERSUCHE) return { status: 0, text: 'netz' };
      Z.wiederholt++; await pause(1500 * v); continue;
    }
    if (res.status === 429) {
      var warte = Number(res.headers.get('retry-after'));
      throw Ueberlastet(isFinite(warte) && warte > 0 ? warte : 60);
    }
    if (res.status >= 500) {
      if (v === VERSUCHE) return { status: res.status, text: text };
      Z.wiederholt++; await pause(1500 * v); continue;
    }
    var daten = null;
    try { daten = JSON.parse(text); } catch (e2) { daten = null; }
    return { status: res.status, text: text, daten: daten };
  }
  return { status: 0, text: 'aufgegeben' };
}

/* ================= (2) Reine Bausteine - die Kontrolle faehrt sie ohne Netz ================= */
var NY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
function etTag(ms) { return NY.format(new Date(ms)); }
function median(a) {
  if (!a.length) return null;
  var s = a.slice().sort(function (x, y) { return x - y; }), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function tagMs(datum) {
  var p = String(datum).split('-').map(Number);
  if (p.length !== 3 || !isFinite(p[0])) return null;
  return M.nyNachUtc(p[0], p[1], p[2], 0, 0);
}

/** Alle Abspaltungen einer Maszahmen-Datei, die KEINEN Kursfaktor haben - und noch keinen
 *  gemessenen. Gelesen wird die Quellenliste `saetze`, nicht `ohneFaktor`: letztere ist
 *  eine Zusammenfassung, die kein Stueckverhaeltnis mehr traegt. */
function abspaltungenAus(m) {
  if (!m || !Array.isArray(m.saetze)) return [];
  var schon = {};
  (m.gemesseneFaktoren || []).forEach(function (g) { schon[String(g.art) + '|' + String(g.datum)] = 1; });
  var raus = [];
  m.saetze.forEach(function (e) {
    var art = String(e._art || '');
    if (!/spin/.test(art)) return;
    var d = e.ex_date || e.process_date || e.payable_date || null;
    if (!d) return;
    raus.push({ sym: m.sym, art: art, datum: String(d), neuSym: e.new_symbol || null,
      sourceRate: e.source_rate == null ? null : Number(e.source_rate),
      newRate: e.new_rate == null ? null : Number(e.new_rate),
      satz: e, saetze: m.saetze,          /* fuer stoererAus(): der Satz selbst und seine Nachbarn */
      schonGemessen: !!schon[art + '|' + d] });
  });
  return raus;
}

/** Alpaca-Tagesbalken -> { tag: schlusskurs }. Der Stempel eines Tagesbalkens ist der
 *  Sitzungsbeginn in ET; verglichen wird ueber den ET-KALENDERTAG, nicht ueber den
 *  Millisekunden-Stempel - die beiden Bereinigungen liefern denselben Tag, aber nicht in
 *  jedem Fall dieselbe Uhrzeit im Stempel. */
function schlussJeTag(balken) {
  var raus = {};
  (balken || []).forEach(function (b) {
    var t = Date.parse(b && b.t);
    var c = Number(b && b.c);
    if (!isFinite(t) || !isFinite(c) || c <= 0) return;
    raus[etTag(t)] = c;
  });
  return raus;
}

/** DIE MESSUNG - eine reine Funktion, ohne Netz und ohne Uhr.
 *  dividend/all an gemeinsamen Handelstagen (siehe DIE RICHTUNG im Kopf); davor der Faktor,
 *  ab dem Wirkungstag die Kontrolle. Gibt IMMER ein Urteil zurueck, nie eine Ausnahme. */
function faktorMessen(alleTage, dividendTage, exDatum) {
  var ex = String(exDatum);
  var vor = [], nach = [];
  Object.keys(alleTage).sort().forEach(function (tag) {
    var a = alleTage[tag], d = dividendTage[tag];
    if (!(a > 0) || !(d > 0)) return;
    (tag < ex ? vor : nach).push({ tag: tag, v: d / a });
  });
  vor = vor.slice(-VOR_TAGE);          /* die LETZTEN Handelstage vor der Maszahme */
  nach = nach.slice(0, NACH_TAGE);     /* die ERSTEN ab ihr */
  var erg = { faktor: null, verhaeltnisAllDurchDividend: null, n: vor.length, streuung: null,
    nachN: nach.length, nachMedian: null,
    vonTag: vor.length ? vor[0].tag : null, bisTag: vor.length ? vor[vor.length - 1].tag : null,
    urteil: 'unklar', grund: null };
  if (vor.length < MIND_VOR) { erg.grund = 'zu wenige gemeinsame Handelstage vor der Maszahme (' + vor.length + ' < ' + MIND_VOR + ')'; return erg; }
  var vv = vor.map(function (x) { return x.v; });
  var mv = median(vv), mn = Math.min.apply(null, vv), mx = Math.max.apply(null, vv);
  erg.faktor = mv;
  erg.verhaeltnisAllDurchDividend = mv > 0 ? 1 / mv : null;
  erg.streuung = mv > 0 ? (mx - mn) / mv : null;
  if (!(mv > 0)) { erg.grund = 'kein brauchbarer Median'; return erg; }
  if (erg.streuung > BAND) {
    erg.grund = 'Verhaeltnis vor der Maszahme nicht konstant (Streuung ' + erg.streuung.toFixed(6)
      + ' > ' + BAND + ') - im Fenster liegt eine zweite Maszahme oder die Kurse sind zu grob gerundet';
    return erg;
  }
  if (nach.length < MIND_NACH) { erg.grund = 'keine Balken nach der Maszahme (' + nach.length + ' < ' + MIND_NACH + ') - die Kontrolle ist nicht fahrbar'; return erg; }
  erg.nachMedian = median(nach.map(function (x) { return x.v; }));
  if (Math.abs(erg.nachMedian - 1) > BAND) {
    erg.grund = 'Kontrolle nach der Maszahme ist nicht 1,000 (' + erg.nachMedian.toFixed(6)
      + ') - hinter der Abspaltung liegt eine weitere Maszahme, der Faktor waere nicht ihrer';
    return erg;
  }
  erg.urteil = 'gemessen';
  return erg;
}

/** ANDERE faktortragende Maszahmen, deren Faktor im gemessenen Verhaeltnis mit drinsteckt.
 *
 *  GEFUNDEN am ersten echten Lauf, an 5 von 201 Faellen - keiner davon waere aufgefallen:
 *  MHUA hat am 24.11.2025 eine Zusammenlegung 100:1 UND eine Abspaltung. Das Verhaeltnis
 *  dividend/all misst beide zusammen und ergab 0,010000 - den Faktor der Zusammenlegung.
 *  Geschrieben als Abspaltungsfaktor haette die Ableitung ihn ein ZWEITES Mal angewandt,
 *  neben dem Split-Faktor aus der Quelle: die Kurse davor waeren durch 0,0001 statt durch
 *  0,01 geteilt worden. Hundertfach daneben, und in jeder Zusammenfassung unauffaellig.
 *
 *  Warum genau dieses Fenster: das Verhaeltnis an einer Kerze vom Tag d misst alles, was
 *  NACH d wirkt. Weil die Kontrolle sicherstellt, dass nach dem Wirkungstag nichts mehr
 *  kommt, und die Streuungsschranke, dass im Fenster davor nichts liegt, bleibt genau der
 *  Spalt zwischen dem letzten gewerteten Tag und dem Wirkungstag - praktisch: der
 *  Wirkungstag selbst.
 *
 *  Herausrechnen waere moeglich (0,010000 geteilt durch 0,01 ergibt 1,000), aber es waere
 *  eine Rechnung ohne eigene Kontrolle: bei HON kaeme 1,908 heraus, und ob das die
 *  Abspaltung ist oder eine Split-Angabe, die die Quelle anders anwendet als sie sie
 *  meldet, sagt keine der beiden Zahlen. Also "unklar" - dieselbe Antwort wie ueberall
 *  sonst, wo die Messung nicht traegt. */
function stoererAus(saetze, selbst, bisTag, exDatum) {
  var raus = [];
  (saetze || []).forEach(function (e) {
    if (e === selbst) return;
    var art = String(e._art || '');
    if (!/split|spin/.test(art)) return;
    var d = e.ex_date || e.effective_date || e.process_date || null;
    if (!d || !bisTag) return;
    if (!(String(d) > String(bisTag) && String(d) <= String(exDatum))) return;
    raus.push({ art: art, datum: String(d) });
  });
  return raus;
}

/** Der gemessene Faktor, wie er in der Maszahmen-Datei steht. Eigene Funktion, damit die
 *  Klinke sie ohne Netz fahren kann - und damit "unklar" nie versehentlich als Faktor
 *  durchgeht: diese Funktion gibt fuer jedes andere Urteil null zurueck. */
function satzAus(a, erg, jetzt) {
  if (!erg || erg.urteil !== 'gemessen' || !(erg.faktor > 0)) return null;
  return { art: a.art, datum: a.datum, kursfaktor: erg.faktor, herkunft: HERKUNFT,
    gemessenAm: etTag(jetzt || Date.now()), n: erg.n, streuung: erg.streuung,
    verhaeltnisAllDurchDividend: erg.verhaeltnisAllDurchDividend,
    nachN: erg.nachN, nachMedian: erg.nachMedian, vonTag: erg.vonTag, bisTag: erg.bisTag,
    neuSym: a.neuSym || null };
}

/** Der Satz kommt in eine NEUE Liste. `saetze`, `anwendbar` und `ohneFaktor` sind das, was
 *  die Quelle geliefert hat, und bleiben unveraendert - auch dann, wenn der gemessene
 *  Faktor eine ihrer Luecken schlieszt. Ein zweites Mal gemessen ersetzt den alten Satz,
 *  haengt ihn nicht daneben. */
function eintragen(m, satz) {
  var neu = austragen(m, satz.art, satz.datum);
  var liste = (neu.gemesseneFaktoren || []).slice();
  liste.push(satz);
  liste.sort(function (x, y) { return String(x.datum) < String(y.datum) ? -1 : 1; });
  neu.gemesseneFaktoren = liste;
  return neu;
}

/** Die Gegenrichtung, und sie ist nicht symmetrisch zu haben: wird ein Fall NEU gemessen
 *  und faellt diesmal auf "unklar", muss der alte Faktor WEG. Ohne das bliebe genau der
 *  Eintrag stehen, den die neue Messung verwirft - und ein Nachmessen machte die Lage
 *  schlechter statt besser, weil man glaubte, es sei geprueft. */
function austragen(m, art, datum) {
  var neu = { };
  Object.keys(m).forEach(function (k) { neu[k] = m[k]; });
  var liste = (m.gemesseneFaktoren || []).filter(function (g) {
    return !(String(g.art) === String(art) && String(g.datum) === String(datum));
  });
  if (liste.length) neu.gemesseneFaktoren = liste; else delete neu.gemesseneFaktoren;
  return neu;
}

/* ================= (3) Listen - kein Netz ================= */
function dateienLesen() {
  var namen;
  try { namen = fs.readdirSync(MASSNAHMEN).filter(function (n) { return n.charAt(0) !== '_' && /\.json$/.test(n); }); }
  catch (e) { return { fehler: 'Kein Maszahmen-Ordner: ' + MASSNAHMEN }; }
  var werte = [], unlesbar = [];
  namen.forEach(function (n) {
    var p = path.join(MASSNAHMEN, n);
    var m;
    try { m = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { unlesbar.push(n); return; }
    var absp = abspaltungenAus(m);
    if (!absp.length) return;
    werte.push({ ordner: n.replace(/\.json$/, ''), sym: m.sym || n.replace(/\.json$/, ''), abspaltungen: absp,
      andereLuecken: (m.ohneFaktor || []).filter(function (x) { return !/spin/.test(String(x.art)); }) });
  });
  return { werte: werte, unlesbar: unlesbar, dateien: namen.length };
}

function listen() {
  var L = dateienLesen();
  if (L.fehler) return L;
  var offen = 0, schon = 0, andere = 0;
  var zeilen = [];
  L.werte.forEach(function (w) {
    if (w.andereLuecken.length) andere++;
    w.abspaltungen.forEach(function (a) {
      if (a.schonGemessen) { schon++; return; }
      offen++;
      zeilen.push({ sym: w.sym, ordner: w.ordner, datum: a.datum, neuSym: a.neuSym,
        stueckverhaeltnis: (a.sourceRate == null ? '?' : a.sourceRate) + ' : ' + (a.newRate == null ? '?' : a.newRate) });
    });
  });
  zeilen.sort(function (x, y) { return x.datum < y.datum ? -1 : x.datum > y.datum ? 1 : (x.sym < y.sym ? -1 : 1); });
  return { dateien: L.dateien, unlesbar: L.unlesbar, werteMitAbspaltung: L.werte.length,
    abspaltungenOffen: offen, abspaltungenSchonGemessen: schon,
    werteMitZusaetzlicherLuecke: andere, abrufeNoetig: offen * 2, zeilen: zeilen };
}

/* ================= (4) Messen - mit Netz ================= */
async function balkenHolen(sym, vonMs, bisMs, bereinigung, f) {
  var bis = Math.min(bisMs, Date.now() - SIP_ABSTAND_MS);
  if (bis <= vonMs) return { fehler: 'Fenster liegt ganz in der Sperrfrist des Gratistarifs' };
  var alle = [], token = null, seiten = 0;
  do {
    var url = DATEN + '/stocks/bars?symbols=' + encodeURIComponent(sym) + '&timeframe=1Day' +
      '&start=' + encodeURIComponent(new Date(vonMs).toISOString()) +
      '&end=' + encodeURIComponent(new Date(bis).toISOString()) +
      '&limit=1000&feed=sip&adjustment=' + bereinigung + (token ? '&page_token=' + encodeURIComponent(token) : '');
    var r = await hole(url, f);
    seiten++;
    if (r.status !== 200) return { fehler: 'HTTP ' + r.status + ' ' + String(r.text || '').replace(/\s+/g, ' ').slice(0, 120) };
    var b = r.daten && r.daten.bars ? r.daten.bars[sym] : null;
    if (Array.isArray(b)) alle = alle.concat(b);
    token = r.daten ? r.daten.next_page_token : null;
  } while (token && seiten < 10);
  return { balken: alle };
}

/** Ein Fall: zwei Abrufe, eine Zahl. Wird auch von den beiden Eichungen gefahren - genau
 *  derselbe Weg, sonst pruefen sie etwas anderes als den Lauf. */
async function fallMessen(a, f) {
  var ex = tagMs(a.datum);
  if (!ex) return { urteil: 'unklar', grund: 'unlesbares Datum', faktor: null, n: 0, streuung: null, nachN: 0, nachMedian: null };
  var rA = await balkenHolen(a.sym, ex - FENSTER_VOR_MS, ex + FENSTER_NACH_MS, 'all', f);
  if (rA.fehler) return { urteil: 'unklar', grund: 'Abruf all: ' + rA.fehler, faktor: null, n: 0, streuung: null, nachN: 0, nachMedian: null };
  var rD = await balkenHolen(a.sym, ex - FENSTER_VOR_MS, ex + FENSTER_NACH_MS, 'dividend', f);
  if (rD.fehler) return { urteil: 'unklar', grund: 'Abruf dividend: ' + rD.fehler, faktor: null, n: 0, streuung: null, nachN: 0, nachMedian: null };
  var erg = faktorMessen(schlussJeTag(rA.balken), schlussJeTag(rD.balken), a.datum);
  if (erg.urteil === 'gemessen') {
    var st = stoererAus(a.saetze, a.satz, erg.bisTag, a.datum);
    if (st.length) {
      erg.urteil = 'unklar';
      erg.stoerer = st;
      erg.grund = 'am Wirkungstag liegt eine zweite faktortragende Maszahme ('
        + st.map(function (x) { return x.art + ' ' + x.datum; }).join(', ')
        + ') - der gemessene Faktor enthaelt beide und wuerde neben dem Split-Faktor der Quelle ein zweites Mal angewandt';
    }
  }
  return erg;
}

/** Die beiden Eichungen. Sie laufen VOR dem ersten geschriebenen Byte, und faellt eine,
 *  wird kein einziger Faktor geschrieben. Vier Abrufe. */
async function eichen(f) {
  var pos = await fallMessen({ sym: EICH_SYM, datum: EICH_DATUM, art: 'spin_offs' }, f);
  var plac = await fallMessen({ sym: PLACEBO_SYM, datum: PLACEBO_DATUM, art: 'spin_offs' }, f);
  var posOk = pos.urteil === 'gemessen' && Math.abs(pos.faktor - EICH_SOLL) <= BAND;
  var placOk = plac.urteil === 'gemessen' && Math.abs(plac.faktor - 1) <= BAND;
  return {
    positiv: { sym: EICH_SYM, datum: EICH_DATUM, soll: EICH_SOLL, faktor: pos.faktor, n: pos.n,
      streuung: pos.streuung, nachMedian: pos.nachMedian, urteil: pos.urteil, grund: pos.grund, bestanden: posOk },
    placebo: { sym: PLACEBO_SYM, datum: PLACEBO_DATUM, soll: 1, faktor: plac.faktor, n: plac.n,
      streuung: plac.streuung, nachMedian: plac.nachMedian, urteil: plac.urteil, grund: plac.grund, bestanden: placOk },
    bestanden: posOk && placOk,
  };
}

async function messen(opt) {
  opt = opt || {};
  var L = dateienLesen();
  if (L.fehler) return L;
  var offen = [];
  L.werte.forEach(function (w) {
    w.abspaltungen.forEach(function (a) {
      if (a.schonGemessen && !opt.neuMessen) return;
      if (opt.nurSym && opt.nurSym.indexOf(w.sym) === -1) return;
      offen.push({ ordner: w.ordner, sym: a.sym || w.sym, art: a.art, datum: a.datum, neuSym: a.neuSym,
        satz: a.satz, saetze: a.saetze });
    });
  });
  sag('Offen: ' + offen.length + ' Abspaltungen in ' + L.werte.length + ' Werten. '
    + (offen.length * 2 + 4) + ' Abrufe bei ' + RATE_JE_MIN + '/min, rund '
    + Math.ceil((offen.length * 2 + 4) / RATE_JE_MIN) + ' Minuten.');

  var eich = await eichen(opt.fetch);
  sag('Eichung: Positivkontrolle ' + EICH_SYM + ' ' + (eich.positiv.faktor == null ? '-' : eich.positiv.faktor.toFixed(6))
    + ' (soll ' + EICH_SOLL + ') ' + (eich.positiv.bestanden ? 'BESTANDEN' : 'GEFALLEN: ' + eich.positiv.grund)
    + ' | Placebo ' + PLACEBO_SYM + ' ' + (eich.placebo.faktor == null ? '-' : eich.placebo.faktor.toFixed(6))
    + ' (soll 1) ' + (eich.placebo.bestanden ? 'BESTANDEN' : 'GEFALLEN: ' + eich.placebo.grund));
  if (!eich.bestanden) {
    protokoll('Eichung GEFALLEN - kein Faktor geschrieben. ' + JSON.stringify(eich));
    return { eichung: eich, abgebrochen: 'Eichung gefallen - es wurde NICHTS geschrieben', abrufe: Z.abrufe };
  }
  protokoll('Eichung bestanden: ' + EICH_SYM + ' ' + eich.positiv.faktor.toFixed(6) + ', Placebo ' + eich.placebo.faktor.toFixed(6));

  var gemessen = 0, unklar = 0, ausgetragen = 0, ergebnisse = [], ueberlastet = null;
  for (var i = 0; i < offen.length; i++) {
    var a = offen[i], erg;
    try { erg = await fallMessen(a, opt.fetch); }
    catch (e) {
      if (e && e.ueberlastet) { ueberlastet = { warteS: e.warteS, bei: i, von: offen.length }; break; }
      throw e;
    }
    var satz = satzAus(a, erg);
    var p = path.join(MASSNAHMEN, a.ordner + '.json');
    var m = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (satz) { M.atomarSchreiben(p, JSON.stringify(eintragen(m, satz))); gemessen++; }
    else {
      /* "unklar" heisst NICHTS SCHREIBEN - und wo schon etwas steht, heisst es AUSTRAGEN.
       * Sonst ueberlebte beim Nachmessen genau der Faktor, den die neue Messung verwirft. */
      var ohne = austragen(m, a.art, a.datum);
      if (JSON.stringify(ohne) !== JSON.stringify(m)) { M.atomarSchreiben(p, JSON.stringify(ohne)); ausgetragen++; }
      unklar++;
    }
    ergebnisse.push({ sym: a.sym, ordner: a.ordner, datum: a.datum, urteil: erg.urteil,
      kursfaktor: satz ? satz.kursfaktor : null, n: erg.n, streuung: erg.streuung,
      nachN: erg.nachN, nachMedian: erg.nachMedian, stoerer: erg.stoerer || null, grund: erg.grund });
    if ((i + 1) % 20 === 0) sag('  ' + (i + 1) + '/' + offen.length + '  gemessen ' + gemessen + '  unklar ' + unklar + '  Abrufe ' + Z.abrufe);
  }

  var bericht = { stand: new Date().toISOString(), quelle: 'alpaca /v2/stocks/bars 1Day, adjustment=all gegen adjustment=dividend',
    regel: 'Faktor = Median all/dividend ueber die letzten ' + VOR_TAGE + ' Handelstage vor dem Wirkungstag. '
      + 'Kontrolle: Median ab dem Wirkungstag muss 1,000 sein (Band ' + BAND + '), sonst "unklar" und NICHTS geschrieben.',
    eichung: eich, offen: offen.length, gemessen: gemessen, unklar: unklar, ausgetragen: ausgetragen,
    abrufe: Z.abrufe, wiederholt: Z.wiederholt, ueberlastet: ueberlastet, ergebnisse: ergebnisse };
  M.atomarSchreiben(BERICHT, JSON.stringify(bericht, null, 1));
  protokoll('Messen: ' + offen.length + ' offen, ' + gemessen + ' gemessen, ' + unklar + ' unklar, '
    + ausgetragen + ' ausgetragen, ' + Z.abrufe + ' Abrufe'
    + (ueberlastet ? ', ABGEBROCHEN bei ' + ueberlastet.bei + ' (429)' : ''));
  return { eichung: eich, offen: offen.length, gemessen: gemessen, unklar: unklar, ausgetragen: ausgetragen,
    abrufe: Z.abrufe, ueberlastet: ueberlastet, bericht: BERICHT };
}

/* ================= (5) Selbsttest der reinen Bausteine - kein Netz ================= */
function kontrolle() {
  var gut = 0, schlecht = [];
  function ok(b, name) { if (b) gut++; else schlecht.push(name); }

  /* Zwei Kunstreihen bauen: 25 Handelstage vor dem 01.07. und `nachTage` ab ihm.
   * `vorAll`/`vorDiv` sind die Schlusskurse davor, `nachAll`/`nachDiv` die danach. */
  function reihe(vorAll, vorDiv, nachAll, nachDiv, nachTage) {
    var alle = {}, div = {};
    for (var d = 1; d <= 25; d++) {
      var t = '2026-06-' + String(d + 1).padStart(2, '0');
      alle[t] = vorAll; div[t] = vorDiv;
    }
    for (var e = 1; e <= (nachTage == null ? 20 : nachTage); e++) {
      var t2 = '2026-07-' + String(e).padStart(2, '0');
      alle[t2] = nachAll; div[t2] = nachDiv;
    }
    return { alle: alle, div: div };
  }

  /* Die SPGI-Form: `all` ist VOR der Abspaltung kleiner (der abgespaltene Wert ist dort
   * schon herausgerechnet), danach sind beide gleich. */
  var A = reihe(100, 105.7, 90, 90);
  var r = faktorMessen(A.alle, A.div, '2026-07-01');
  ok(r.urteil === 'gemessen' && Math.abs(r.faktor - 1.057) < 1e-9, 'A1 die SPGI-Form gibt 1,057');

  /* A1a DIE RICHTUNG. Der Kursfaktor ist dividend/all und damit GROESZER als 1, wenn `all`
   * davor kleiner ist - dieselbe Richtung wie der Split-Faktor der Quelle, und genau die,
   * die ableiten() braucht (Kurse geteilt). Das rohe Verhaeltnis all/dividend ist 0,9459
   * und steht daneben. Waere es umgekehrt, saehe jede Zusammenfassung gleich aus und die
   * bereinigte Reihe waere um 11 % verschoben. */
  ok(r.faktor > 1 && Math.abs(r.verhaeltnisAllDurchDividend - 100 / 105.7) < 1e-12,
     'A1a Richtung: all<dividend davor -> Kursfaktor >1, das rohe Verhaeltnis all/dividend steht daneben');
  ok(Math.abs(100 * 1.057 / r.faktor - 100) < 1e-9,
     'A1b der Faktor passt in ableiten(): Kurs davor GETEILT durch ihn ergibt die bereinigte Skala');
  ok(r.n === VOR_TAGE, 'A2 es werden genau ' + VOR_TAGE + ' Handelstage gewertet');
  ok(Math.abs(r.nachMedian - 1) < 1e-12, 'A3 die Kontrolle nach der Maszahme ist 1,000');

  /* Placebo: keine Abspaltung, beide Bereinigungen gleich. */
  var P = reihe(100, 100, 90, 90);
  var rp = faktorMessen(P.alle, P.div, '2026-07-01');
  ok(rp.urteil === 'gemessen' && Math.abs(rp.faktor - 1) < 1e-12, 'A4 Placebo: ohne Abspaltung kommt 1,000 heraus');

  /* Die Kontrolle muss beiszen: liegt hinter der Abspaltung noch eine Maszahme, ist das
   * Verhaeltnis DANACH nicht 1 - und dann darf KEIN Faktor herauskommen, obwohl davor ein
   * tadellos konstanter Median steht. Das ist der Fall, den die Gegenprobe ausbaut. */
  var N = reihe(100, 105.7, 45, 90);
  var rn = faktorMessen(N.alle, N.div, '2026-07-01');
  ok(rn.urteil === 'unklar' && rn.faktor !== null, 'A5 Kontrolle nach der Maszahme 2,0 -> unklar, obwohl ein Median dasteht');
  ok(satzAus({ art: 'spin_offs', datum: '2026-07-01' }, rn) === null, 'A6 "unklar" wird NIE als Faktor geschrieben');
  ok(satzAus({ art: 'spin_offs', datum: '2026-07-01' }, r).kursfaktor === r.faktor &&
     satzAus({ art: 'spin_offs', datum: '2026-07-01' }, r).herkunft === HERKUNFT, 'A7 ein gemessener Satz traegt Faktor und Herkunft');

  /* Eine zweite Maszahme IM Fenster davor: das Verhaeltnis ist dort nicht konstant, der
   * Median waere eine Mischung aus zwei Skalen. */
  var Sw = reihe(100, 105.7, 90, 90);
  ['2026-06-07', '2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11'].forEach(function (t) { Sw.alle[t] = 50; });
  var rs = faktorMessen(Sw.alle, Sw.div, '2026-07-01');
  ok(rs.urteil === 'unklar' && /nicht konstant/.test(rs.grund), 'A8 zweite Maszahme im Fenster -> unklar (Streuung)');

  /* Ein erloschener Wert: keine Balken nach der Maszahme -> nicht pruefbar ist nicht bestanden. */
  var V = reihe(100, 105.7, 90, 90, 0);
  var rv = faktorMessen(V.alle, V.div, '2026-07-01');
  ok(rv.urteil === 'unklar' && /nicht fahrbar/.test(rv.grund), 'A9 ohne Balken danach: unklar, kein Faktor');

  /* Eintragen laesst die Quellenlisten in Ruhe. */
  var mAlt = { sym: 'X', saetze: [{ _art: 'spin_offs', ex_date: '2026-07-01', source_rate: 1, new_rate: 1 }],
    anwendbar: [], ohneFaktor: [{ art: 'spin_offs', datum: '2026-07-01', grund: 'g' }] };
  var mNeu = eintragen(mAlt, satzAus({ art: 'spin_offs', datum: '2026-07-01' }, r));
  ok(JSON.stringify(mNeu.saetze) === JSON.stringify(mAlt.saetze) &&
     JSON.stringify(mNeu.ohneFaktor) === JSON.stringify(mAlt.ohneFaktor) &&
     JSON.stringify(mNeu.anwendbar) === JSON.stringify(mAlt.anwendbar),
     'A10 eintragen() laesst saetze, anwendbar und ohneFaktor unveraendert');
  ok(mNeu.gemesseneFaktoren.length === 1 && mNeu.gemesseneFaktoren[0].kursfaktor === r.faktor,
     'A11 der gemessene Faktor steht in einer eigenen Liste');
  var mZwei = eintragen(mNeu, satzAus({ art: 'spin_offs', datum: '2026-07-01' }, rp));
  ok(mZwei.gemesseneFaktoren.length === 1 && Math.abs(mZwei.gemesseneFaktoren[0].kursfaktor - 1) < 1e-12,
     'A12 zweimal gemessen ersetzt den Satz, haengt keinen zweiten daneben');

  /* Die zweite Maszahme am WIRKUNGSTAG - der Fund vom ersten echten Lauf (MHUA: 100:1
   * Zusammenlegung und Abspaltung am selben Tag, gemessen 0,010000). Der Faktor traegt
   * dann beide, und die Ableitung wuerde den Split ein zweites Mal anwenden. */
  var mitSplit = [{ _art: 'spin_offs', ex_date: '2026-07-01', source_rate: 1, new_rate: 1 },
                  { _art: 'reverse_splits', ex_date: '2026-07-01', old_rate: 100, new_rate: 1 },
                  { _art: 'forward_splits', ex_date: '2020-01-02', old_rate: 1, new_rate: 4 }];
  var stoe = stoererAus(mitSplit, mitSplit[0], '2026-06-26', '2026-07-01');
  ok(stoe.length === 1 && stoe[0].art === 'reverse_splits',
     'A14 eine zweite faktortragende Maszahme AM Wirkungstag wird gefunden - ein alter Split von 2020 nicht');
  ok(stoererAus(mitSplit, mitSplit[0], '2026-06-26', '2026-07-01').length === 1 &&
     stoererAus([mitSplit[0]], mitSplit[0], '2026-06-26', '2026-07-01').length === 0,
     'A15 der gemessene Satz selbst zaehlt nie als sein eigener Stoerer');

  /* Austragen: ein Nachmessen, das auf "unklar" faellt, muss den alten Faktor WEGnehmen. */
  var mMit = eintragen({ sym: 'X', saetze: [], ohneFaktor: [] }, satzAus({ art: 'spin_offs', datum: '2026-07-01' }, r));
  var mOhne = austragen(mMit, 'spin_offs', '2026-07-01');
  ok(mMit.gemesseneFaktoren.length === 1 && !('gemesseneFaktoren' in mOhne),
     'A16 austragen() nimmt den alten Faktor weg - ein Nachmessen darf die Lage nicht schlechter machen');

  /* Gelesen wird die Quellenliste, und ein schon gemessener Fall wird erkannt. */
  var absp = abspaltungenAus({ sym: 'X', saetze: mAlt.saetze, gemesseneFaktoren: mNeu.gemesseneFaktoren });
  ok(absp.length === 1 && absp[0].schonGemessen === true && absp[0].newRate === 1,
     'A13 abspaltungenAus() liest das Stueckverhaeltnis und erkennt einen schon gemessenen Fall');

  return { gut: gut, gefallen: schlecht.length, schlecht: schlecht };
}

/* ================= (5b) Schreib-Selbsttest: ein ECHTER Lauf, nur das Netz eingespeist =====
 *
 * kontrolle() prueft die reinen Bausteine. Sie sagt nichts darueber, WOHIN geschrieben wird,
 * ob ein "unklar" auf dem Weg vom Urteil zur Datei doch noch zu einem Faktor wird, und ob
 * die Quellenlisten den Weg durch messen() unveraendert ueberstehen. Das laesst sich nur am
 * laufenden Werkzeug zusichern - also faehrt es hier wirklich, mit erfundener Quelle, in
 * einen Wegwerf-Ordner (MD_ALPACA_WURZEL). Zurueck kommt die Liste JEDER geschriebenen
 * Datei, relativ zur Wurzel.
 *
 * Vier Kunstwerte, jeder fuer eine Frage:
 *   GUT   Abspaltung mit sauberer Kontrolle           -> Faktor 1,057 wird geschrieben
 *   BOES  Kontrolle danach 2,0 (zweite Maszahme)      -> "unklar", NICHTS wird geschrieben
 *   EINS  Abspaltung ohne Kurswirkung                 -> Faktor 1,000 wird geschrieben
 *   (dazu die beiden Eichungen SPGI und AAPL aus derselben erfundenen Quelle) */
function kunstBalken(vorWert, nachWert, exDatum) {
  var raus = [], d = new Date(Date.parse(exDatum + 'T04:00:00Z') - 40 * 86400000);
  for (var i = 0; i < 62; i++) {
    var t = new Date(d.getTime() + i * 86400000);
    var wt = t.getUTCDay();
    if (wt === 0 || wt === 6) continue;                       /* Wochenenden liefert die Quelle nicht */
    var tag = t.toISOString().slice(0, 10);
    raus.push({ t: tag + 'T04:00:00Z', o: 1, h: 1, l: 1, c: tag < exDatum ? vorWert : nachWert, v: 1 });
  }
  return raus;
}
async function selbsttestSchreiben() {
  var EX = '2026-07-01';
  /* Schlusskurse je Wert und Bereinigung: [all davor, dividend davor, all danach, dividend danach] */
  var WELT = {
    SPGI: [100, 105.7, 90, 90], AAPL: [100, 100, 90, 90],
    GUT: [100, 105.7, 90, 90], BOES: [100, 105.7, 45, 90], EINS: [100, 100, 90, 90],
    DOPPEL: [1, 100, 90, 90],                 /* 100:1 Zusammenlegung UND Abspaltung am selben Tag */
  };
  function kunstFetch(url) {
    var sym = decodeURIComponent((/[?&]symbols=([^&]+)/.exec(url) || [])[1] || '');
    var bere = (/[?&]adjustment=([^&]+)/.exec(url) || [])[1] || 'raw';
    var w = WELT[sym];
    var rumpf = { bars: {}, next_page_token: null };
    if (w) rumpf.bars[sym] = kunstBalken(bere === 'all' ? w[0] : w[1], bere === 'all' ? w[2] : w[3], EX);
    return Promise.resolve({ status: 200, headers: { get: function () { return null; } },
      text: function () { return Promise.resolve(JSON.stringify(rumpf)); } });
  }

  fs.mkdirSync(MASSNAHMEN, { recursive: true });
  var WERTE = ['GUT', 'BOES', 'EINS', 'DOPPEL'];
  var vorher = {};
  WERTE.forEach(function (s) {
    var saetze = [{ _art: 'spin_offs', ex_date: EX, source_rate: 1, new_rate: 1, new_symbol: s + 'X' },
                  { _art: 'cash_dividends', ex_date: '2026-05-01', rate: 0.5 }];
    /* DOPPEL traegt zusaetzlich eine Zusammenlegung am SELBEN Tag - der Fund vom ersten
     * echten Lauf. Sein gemessener Faktor waere 100, also der der Zusammenlegung, und die
     * Ableitung wendete sie danach ein zweites Mal an. */
    if (s === 'DOPPEL') saetze.push({ _art: 'reverse_splits', ex_date: EX, old_rate: 100, new_rate: 1 });
    var m = { sym: s, stand: '2026-09-03T00:00:00.000Z', quelle: 'alpaca v1 corporate-actions',
      von: '2016-01-01', bis: '2026-12-31', saetze: saetze,
      anwendbar: [], ohneFaktor: [{ art: 'spin_offs', datum: EX, grund: 'Abspaltung: Quelle liefert nur ein Stueckverhaeltnis, keinen Kursfaktor' }] };
    vorher[s] = JSON.stringify(m);
    M.atomarSchreiben(path.join(MASSNAHMEN, s + '.json'), vorher[s]);
  });

  var r = await messen({ fetch: kunstFetch });

  function lesen(s) { return JSON.parse(fs.readFileSync(path.join(MASSNAHMEN, s + '.json'), 'utf8')); }
  var gut = lesen('GUT'), boes = lesen('BOES'), eins = lesen('EINS'), doppel = lesen('DOPPEL');
  /* Nachmessen, das auf "unklar" faellt, muss einen alten Faktor wieder AUSTRAGEN. Also
   * einen erfundenen alten Eintrag in die BOES-Datei setzen und noch einmal messen. */
  M.atomarSchreiben(path.join(MASSNAHMEN, 'BOES.json'), JSON.stringify(eintragen(boes,
    { art: 'spin_offs', datum: EX, kursfaktor: 1.5, herkunft: 'alt' })));
  var rNach = await messen({ fetch: kunstFetch, neuMessen: true, nurSym: ['BOES'] });
  var boesNach = lesen('BOES');
  /* Jede geschriebene Datei unter der Wurzel einsammeln - rekursiv, damit ein Ausbruch in
   * einen Nachbarordner auffaellt und nicht nur ein anders benanntes Ziel. */
  var dateien = [];
  (function gehe(ordner, praefix) {
    fs.readdirSync(ordner).forEach(function (n) {
      var p = path.join(ordner, n);
      if (fs.statSync(p).isDirectory()) gehe(p, praefix + n + '/'); else dateien.push(praefix + n);
    });
  })(WURZEL, '');

  /* ZWEITER DURCHGANG: dieselben drei Kunstwerte, aber eine Welt, in der die
   * Positivkontrolle danebenliegt (SPGI misst 2,0 statt 1,057). Der Satz "faellt eine
   * Eichung, wird kein einziger Faktor geschrieben" ist damit gemessen und nicht behauptet -
   * sonst stuende er nur im Kommentar, und ein ausgebauter Abbruch fiele niemandem auf. */
  WERTE.forEach(function (s) { M.atomarSchreiben(path.join(MASSNAHMEN, s + '.json'), vorher[s]); });
  WELT.SPGI = [50, 100, 90, 90];                     /* Faktor 2,0 - die Eichung muss fallen */
  var r2 = await messen({ fetch: kunstFetch });
  var nachEichbruch = WERTE.some(function (s) { return (lesen(s).gemesseneFaktoren || []).length > 0; });

  var VSm = require('./alpaca-vollsammlung.js');
  return {
    dateien: dateien.sort(),
    eichbruchAbgebrochen: !!r2.abgebrochen,
    eichbruchNichtsGeschrieben: !nachEichbruch,
    eichungBestanden: r.eichung.bestanden,
    placeboFaktor: r.eichung.placebo.faktor,
    positivFaktor: r.eichung.positiv.faktor,
    gemessen: r.gemessen, unklar: r.unklar,
    gutFaktor: (gut.gemesseneFaktoren || []).length ? gut.gemesseneFaktoren[0].kursfaktor : null,
    gutHerkunft: (gut.gemesseneFaktoren || []).length ? gut.gemesseneFaktoren[0].herkunft : null,
    boesHatFaktor: !!(boes.gemesseneFaktoren || []).length,
    einsFaktor: (eins.gemesseneFaktoren || []).length ? eins.gemesseneFaktoren[0].kursfaktor : null,
    doppelHatFaktor: !!(doppel.gemesseneFaktoren || []).length,
    doppelAbleitungLuecke: VSm.faktorenAus(doppel.saetze, doppel.gemesseneFaktoren).ohneFaktor.length === 1,
    nachmessenAusgetragen: !(boesNach.gemesseneFaktoren || []).length && rNach.ausgetragen === 1,
    /* Die Quellenlisten muessen den ersten Lauf Byte fuer Byte ueberstehen. Verglichen wird
     * gegen die Staende, die GLEICH NACH ihm gelesen wurden - die spaeteren Durchgaenge
     * setzen die Dateien absichtlich zurueck, ein Vergleich am Ende maesse sie mit. */
    quellenlistenUnveraendert: [['GUT', gut], ['BOES', boes], ['EINS', eins], ['DOPPEL', doppel]].every(function (x) {
      var alt = JSON.parse(vorher[x[0]]), neu = x[1];
      return JSON.stringify(alt.saetze) === JSON.stringify(neu.saetze) &&
             JSON.stringify(alt.anwendbar) === JSON.stringify(neu.anwendbar) &&
             JSON.stringify(alt.ohneFaktor) === JSON.stringify(neu.ohneFaktor);
    }),
    /* Und die Ableitung muss den gemessenen Faktor wirklich annehmen - und einen
     * gemessenen Faktor 1 als Messung werten, nicht als Luecke. */
    ableitungNimmtGut: VSm.faktorenAus(gut.saetze, gut.gemesseneFaktoren).anwendbar.length === 1 &&
      VSm.faktorenAus(gut.saetze, gut.gemesseneFaktoren).ohneFaktor.length === 0,
    ableitungLaesstBoes: VSm.faktorenAus(boes.saetze, boes.gemesseneFaktoren).ohneFaktor.length === 1,
    ableitungEinsKeineLuecke: VSm.faktorenAus(eins.saetze, eins.gemesseneFaktoren).ohneFaktor.length === 0 &&
      VSm.faktorenAus(eins.saetze, eins.gemesseneFaktoren).anwendbar.length === 0,
  };
}

/* ================= (6) Aufruf ================= */
async function main() {
  var A = process.argv.slice(2);
  function hat(x) { return A.indexOf(x) !== -1; }
  function arg(x, d) { var i = A.indexOf(x); return i >= 0 && A[i + 1] ? A[i + 1] : d; }

  if (hat('--kontrolle')) {
    var k = kontrolle();
    sag(JSON.stringify(k, null, 1));
    process.exit(k.gefallen ? 1 : 0);
  }
  if (hat('--listen')) {
    var l = listen();
    var kurz = Object.assign({}, l, { zeilen: undefined });
    sag(JSON.stringify(kurz, null, 1));
    if (l.zeilen) {
      sag('');
      sag('Wert       Datum        neu      Stueckverhaeltnis');
      l.zeilen.forEach(function (z) {
        sag(z.sym.padEnd(10) + ' ' + z.datum + '   ' + String(z.neuSym || '-').padEnd(8) + ' ' + z.stueckverhaeltnis);
      });
    }
    return;
  }
  if (hat('--selbsttest-schreiben')) { sag(JSON.stringify(await selbsttestSchreiben())); return; }
  if (hat('--eichen')) {
    if (!S.vorhanden()) { sag('Kein Zugang: es fehlt ' + S.fehlend().join(' und ') + '. Start ueber tools\\abspaltungsfaktor.cmd'); process.exit(2); }
    var ei = await eichen();
    sag(JSON.stringify(ei, null, 1));
    process.exit(ei.bestanden ? 0 : 1);
  }
  if (hat('--messen')) {
    if (!S.vorhanden()) { sag('Kein Zugang: es fehlt ' + S.fehlend().join(' und ') + '. Start ueber tools\\abspaltungsfaktor.cmd'); process.exit(2); }
    var r;
    try { r = await messen({ nurSym: arg('--symbole', null) ? arg('--symbole', '').split(',') : null, neuMessen: hat('--neu') }); }
    catch (e) {
      if (e && e.ueberlastet) { sag(String(e.message)); process.exit(3); }
      throw e;
    }
    sag(JSON.stringify(r, null, 1));
    return;
  }
  sag('Kein Modus gewaehlt. Siehe Kopf der Datei.');
}

module.exports = {
  abspaltungenAus: abspaltungenAus, schlussJeTag: schlussJeTag, faktorMessen: faktorMessen,
  satzAus: satzAus, eintragen: eintragen, austragen: austragen, stoererAus: stoererAus,
  median: median, tagMs: tagMs, etTag: etTag,
  listen: listen, messen: messen, eichen: eichen, fallMessen: fallMessen, kontrolle: kontrolle,
  selbsttestSchreiben: selbsttestSchreiben,
  MASSNAHMEN: MASSNAHMEN, BERICHT: BERICHT, RATE_JE_MIN: RATE_JE_MIN, HERKUNFT: HERKUNFT,
  VOR_TAGE: VOR_TAGE, BAND: BAND, EICH_SYM: EICH_SYM, EICH_SOLL: EICH_SOLL, PLACEBO_SYM: PLACEBO_SYM,
};
if (require.main === module) main().catch(function (e) { console.error(S.verdecken(String(e && e.stack || e))); process.exit(1); });

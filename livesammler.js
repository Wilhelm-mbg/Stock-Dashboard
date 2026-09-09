'use strict';
/* DER LIVE-SAMMLER - die Rechnung, ohne Netz und ohne Platte (06.09.2026).
 *
 * Wilhelm, 04.09.2026: "geht das nicht live?" - ja, ueber Alpaca. Waehrend der
 * US-Sitzung (Vor- und Nachboerse mit) holt die App alle fuenf Minuten die FERTIGEN
 * 1m-Balken (SIP, adjustment=raw) fuer die Live-Menge und haengt sie an die
 * Jahresdateien unter alpaca1m/ an - mit derselben Schreibroutine wie die
 * Vollsammlung (alpacaarchiv.js). Das Archiv laeuft der Boerse damit sechzehn Minuten
 * hinterher, aber vollstaendig und in derselben Skala.
 *
 * GEMESSEN 04.09.2026 (studien/alpaca-vollsammlung-2026-09/probe-live-verzoegerung.json):
 * die Gratisstufe liefert SIP-Balken exakt 15 Minuten verzoegert und vollstaendig
 * (75 von 75 je 90-min-Fenster); IEX ist eine Minute alt, aber lueckenhaft (35-52 von
 * 75) und traegt nur IEX-Umsatz; delayed_sip ist kein gueltiger Feed (400). Deshalb:
 * nur SIP, und die "fertig"-Grenze liegt bei jetzt minus SECHZEHN Minuten - eine Minute
 * Sicherheit ueber der gemessenen Verzoegerung.
 *
 * WAS HIER STEHT, IST REIN: die Live-Menge, das Sitzungsfenster, die fertig-Grenze,
 * der Abrufplan je Runde, das Sichten der Antwort und der Ablauf einer Runde mit
 * eingespeisten Verrichtungen (fetch, stempel, schreiben, sperre, jetzt). Kein window,
 * kein fs, kein https, keine eigene Uhr - test-v6.js spielt die Runden mit Attrappen
 * durch. main.js reicht die echten Verrichtungen herein (alpFetch mit den Schluesseln
 * aus den App-Einstellungen, alpacaarchiv.js fuer Platte und Sperre).
 *
 * DREI DINGE, DIE HIER NICHT PASSIEREN: es wird nicht gehandelt, nichts bewertet und
 * nichts ins Yahoo-Archiv geschrieben. Die Strategien lesen weiter Yahoo (Z2 ist ein
 * eigener Entscheid); nur der Viewer sieht die Alpaca-Minuten.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var Plan = require('./sammelplan.js');
var Boerse = require('./boerse.js');
var MU = require('./markt/uebersicht.js');
var A = require('./alpacaarchiv.js');

/* Die Zahlen des Auftrags. Sie stehen hier als Daten, nicht verstreut im Ablauf. */
var TAKT_MS = 5 * 60000;            /* alle fuenf Minuten eine Runde */
var FERTIG_ABSTAND_MS = 16 * 60000; /* gemessen 15 min Verzug + 1 min Sicherheit */
var DECKEL_JE_RUNDE = 150;          /* Anfragen je Runde; 200/min gelten dem ganzen Zugang, Reserve fuer Kostenmessung und Viewer */
var BLOCK = 200;                    /* Kuerzel je Sammelabruf (symbols=...) */
var SEITE = 10000;                  /* Balken je Seite (limit) */
var LEER_MAX = 3;                   /* leere Runden in Folge, dann ruht der Wert bis zum Sitzungswechsel */
var FEHLER_MAX = 5;                 /* Meldungen in erg.fehler, danach nur noch "und k weitere" */
var KOERPER_MAX = 60;               /* Zeichen aus dem Antwortrumpf, wenn der Status nichts sagt */
var DATEN = 'https://data.alpaca.markets/v2';

function zahl(v) { return typeof v === 'number' && isFinite(v); }
function minute(ms) { return Math.floor(ms / 60000) * 60000; }
/* F15: bei Status 0 (Timeout, ECONNRESET, gesperrter Host) und bei 4xx sagt die Zahl
 * allein nichts. Die ersten Zeichen des Rumpfes sagen es - der Aufrufer schickt sie
 * durch ohneGeheimnis(), bevor sie irgendwo landen. */
function koerper(r) {
  var t = r && typeof r.body === 'string' ? r.body.replace(/\s+/g, ' ').trim() : '';
  if (!t) return '';
  return ' - ' + t.slice(0, KOERPER_MAX) + (t.length > KOERPER_MAX ? '...' : '');
}

/* ================= 1) Die Live-Menge =================
 * Alle Reihen, die das Archiv heute noch fuehrt, + Watchlist + Werte mit offener
 * Position + der im Viewer geoeffnete Wert - Vereinigung ohne Doppelte, in
 * Grossschreibung, sortiert (dieselbe Menge in anderer Reihenfolge ist dieselbe
 * Menge). Was kein Kuerzel ist, faellt raus. */
function liveMenge(teile) {
  teile = teile || {};
  var satz = {};
  function nimm(liste) {
    (Array.isArray(liste) ? liste : (liste ? [liste] : [])).forEach(function (s) {
      var k = String(s == null ? '' : s).trim().toUpperCase();
      if (/^[A-Z0-9.]{1,12}$/.test(k)) satz[k] = 1;
    });
  }
  nimm(teile.universum); nimm(teile.watch); nimm(teile.positionen); nimm(teile.viewer);
  return Object.keys(satz).sort();
}

/* Welche Reihen fuehrt das Archiv HEUTE noch? Die Antwort steht in der Lebenszeit-Datei
 * des Archivs (alpaca1m/_lebenszeit.json), nicht in einer Namensliste - eine Namensliste
 * waere der Stichtag, an dem sie gebaut wurde, und ein Wert, den das Archiv fuehrt, aber
 * die Liste nicht kennt, fiele still heraus.
 *
 * DREI FILTER, jeder mit Grund:
 *   - keine Reihe mit `fehler` und keine ohne Jahre: Phase L hat fuer sie nichts gefunden;
 *     die Quelle hat zu ihr nichts zu sagen.
 *   - nicht die Erstbelegung eines wiederverwendeten Kuerzels (`wiederverwendet`): die
 *     Quelle liefert "AAC" nur noch fuer die laufende Reihe AAC~2; in die Datei des
 *     erloschenen Traegers geschrieben, staenden zwei Unternehmen in einer Reihe.
 *   - nicht ERLOSCHEN: der letzte Tagesbalken der Lebenszeit liegt hoechstens
 *     ERLOSCHEN_TAGE vor dem STAND DER DATEI - gemessen am Stand der Datei, nicht an
 *     "heute", damit eine alte Lebenszeit-Datei nicht die ganze Menge leerraeumt.
 *     Gemessen am 07.09.2026: 8.055 laufende Reihen, davon 3.067 nicht erloschen; die
 *     Zahl steht zwischen 3 und 14 Tagen still (3.043 bis 3.047), der Schnitt liegt also
 *     nicht auf einer Flanke.
 *
 * Zurueck kommt das KUERZEL, wie die Quelle es kennt (ohne ~2) - die Zuordnung Kuerzel
 * -> Reihe macht der Aufrufer ueber alpacaarchiv.reiheFuer. Ein erloschener Wert, der
 * durchrutscht, kostet hoechstens LEER_MAX Runden: danach ruht er bis zum naechsten Tag. */
var ERLOSCHEN_TAGE = 30;
function gefuehrteReihen(lz, opt) {
  opt = opt || {};
  var werte = (lz && lz.werte) || {};
  var stand = Date.parse((lz && lz.stand) || '');
  if (!isFinite(stand)) stand = null;
  var tage = opt.erloschenTage != null ? opt.erloschenTage : ERLOSCHEN_TAGE;
  var grenze = stand != null ? stand - tage * 86400000 : null;
  var satz = {};
  Object.keys(werte).forEach(function (reihe) {
    var l = werte[reihe];
    if (!l || l.fehler || !l.jahre || !l.jahre.length) return;
    if (l.wiederverwendet) return;
    if (grenze != null && !(zahl(l.letzter) && l.letzter >= grenze)) return;
    satz[reihe.replace(/~2$/, '')] = 1;
  });
  return Object.keys(satz).sort();
}

/* ================= 2) Die fertig-Grenze und das Sitzungsfenster ================= */
/** Bis zu welchem Stempel ein 1m-Balken als fertig gilt: jetzt minus 16 Minuten, auf die
 *  volle Minute abgerundet. Ein Balken mit Stempel t deckt [t, t+1min) - er ist fertig,
 *  wenn t <= grenze. Die laufende Minute liegt IMMER dahinter. */
function fertigGrenze(jetzt) { return minute(jetzt - FERTIG_ABSTAND_MS); }

/** Der Zustand der Boerse zu einem Zeitpunkt - dieselbe Rechnung wie die Kopfzeile
 *  (MarktUebersicht.sitzungszustand ueber Boerse.sitzungsMinuten), keine zweite Uhr.
 *  Der Handelstag wird am ET-Kalendertag entschieden, nicht am UTC-Tag: 20:00 ET ist
 *  im Winter schon 01:00 UTC des Folgetags, und der waere sonst ein Samstag. */
function zustandUm(ms) {
  var ny = Plan.newYork(ms);
  var p = A.nyTeile(ms);
  var etMittag = Date.UTC(p.j, p.m - 1, p.d, 12, 0);
  var laenge = Boerse.sitzungsMinuten(etMittag);
  return MU.sitzungszustand(ny.minutenSeitMitternacht - Plan.OEFFNET, laenge);
}
/** Laeuft eine Runde? Ja, solange die Grenze der VORIGEN Runde noch in einer Sitzung
 *  lag (Vor-/Nachboerse mit).
 *
 *  WARUM DIE VORIGE GRENZE (07.09.2026). Bis heute galt die Grenze der laufenden Runde,
 *  und damit war um 20:16:00 ET Schluss: die letzte Runde des Tages fiel irgendwo in
 *  [20:11, 20:15] und fragte je nach Phase des Fuenf-Minuten-Takts nur bis 19:55 bis
 *  19:59. Gemessen am 03.09.: 133 von 489 Werten hatten Balken in 19:56-19:59; im Mittel
 *  blieben 2,0 Minuten je Tag bis zum Folgetag ungefragt. Jetzt bleibt das Fenster
 *  offen, solange `grenze - TAKT_MS` noch in einer Sitzung lag - Schluss ist damit
 *  spaetestens 20:21 (Halbtag 17:21), und die Runde um 20:16-20:20 holt den Rest.
 *  `zustand` bleibt der Zustand der EIGENEN Grenze - die Ruhe-Regel fragt ihn. */
function sitzungsfenster(jetzt) {
  var grenze = fertigGrenze(jetzt);
  var z = zustandUm(grenze);
  var zVorige = zustandUm(grenze - TAKT_MS);
  var offenJetzt = !!(z && z.zustand && z.zustand !== 'geschlossen');
  var offenVorige = !!(zVorige && zVorige.zustand && zVorige.zustand !== 'geschlossen');
  return { offen: offenJetzt || offenVorige, zustand: z ? z.zustand : null,
    text: z ? z.text : 'unbekannt', grenze: grenze,
    nachlese: !offenJetzt && offenVorige };
}

/* ================= 3) Der Abrufplan ================= */
/** Ab wann fuer einen Wert gefragt wird: eine Minute nach seinem juengsten Stempel.
 *  Ohne Bestand (neuer Wert in der Watchlist) ab Mitternacht ET des laufenden Tages -
 *  die Vergangenheit ist Sache des naechtlichen Nachlaufs, nicht des Live-Sammlers. */
function startFuer(letzterStempel, jetzt) {
  if (zahl(letzterStempel)) return letzterStempel + 60000;
  var p = A.nyTeile(jetzt);
  return A.nyNachUtc(p.j, p.m, p.d, 0, 0);
}
/** Der Plan einer Runde: Bloecke von Kuerzeln fuer je EINEN Sammelabruf.
 *
 *  Ein Sammelabruf hat nur einen start-Parameter, die Werte aber verschiedene juengste
 *  Stempel: ein illiquider Wert hat seinen letzten Balken um 19:37, ein liquider um
 *  19:59 - gemessen am 06.09.2026 an der echten Live-Menge lagen 489 von 500 Stempeln
 *  ueber die letzten vier Stunden des 03.09. verstreut, auf 155 verschiedenen Minuten.
 *  Zwei falsche Antworten darauf: Bloecke mit EXAKT gleichem Start (155 Abrufe je
 *  Runde, jede Runde) oder EIN Start fuer alle (der aelteste - dann holt jede Runde fuer
 *  alle anderen Werte Stunden an Balken noch einmal).
 *
 *  Die Regel hier: Werte werden vom juengsten Start her eingesammelt, und ein Block
 *  darf seinen Start so weit zurueckziehen, wie die dadurch DOPPELT angefragten
 *  Minuten (je Mitglied, das schon weiter ist) zusammen REDUNDANZ_MAX nicht
 *  uebersteigen - das ist weniger als eine Seite, kostet also keinen Abruf. Ein Wert,
 *  der Tage zurueckliegt, bekommt einen eigenen Block. Was ein Block VOR dem Start eines
 *  Mitglieds mitbringt, wirft sichten() als 'alt' weg - es steht schon in der Datei,
 *  und die wird nie ueberschrieben.
 *
 *  Werte, deren Start hinter der Grenze liegt, sind aktuell und fehlen im Plan; Werte,
 *  die LEER_MAX Runden in Folge nichts brachten, ruhen - bis zum naechsten
 *  SITZUNGSABSCHNITT (ein erloschener Wert wuerde sonst jede Runde einen eigenen Abruf
 *  kosten).
 *
 *  DIE RUHE-REGEL, NEU GEFASST AM 07.09.2026. Sie war fuer erloschene Werte gedacht und
 *  traf die halbe Boerse: die erste Runde faellt auf 04:16 ET, und in der Vorboerse
 *  handeln die meisten Werte gar nicht. Nachgefahren mit den echten Minuten des 03.09.:
 *  von 3.263 Werten ruhten 3.172 schon VOR 09:30, 96,2 % der regulaeren Balken waeren
 *  live nie geholt worden - darunter LLY, JPM, V, UNH, BRK.B. Zwei Aenderungen:
 *    - GEZAEHLT wird eine leere Runde erst, wenn die fertig-Grenze im REGULAEREN Handel
 *      liegt - oder wenn der Wert an diesem ET-Tag schon einen Balken geliefert hat
 *      (dann ist Stille eine Aussage ueber den Wert, nicht ueber die Tageszeit).
 *    - AUFGEHOBEN wird die Ruhe beim SITZUNGSWECHSEL (vor -> regulaer -> nach), nicht
 *      erst am naechsten ET-Tag. Wer die Vorboerse verschlafen hat, ist um 09:30 wieder
 *      dabei. `gesehen` (erster Balken des Tages) laeuft weiter am ET-Tag.
 *  opt.sitzung: der Zustand der eigenen fertig-Grenze ('vorboerslich' | 'regulaer' |
 *  'nachboerslich' | ...). Ohne Angabe bleibt es beim alten Verhalten (jede leere Runde
 *  zaehlt) - so rechnet der Nachlauf, der genau einmal je Nacht fragt. */
var REDUNDANZ_MAX = 5000;           /* doppelt angefragte Minuten je Block, ueber alle Mitglieder */
/* SITZUNGSMINUTEN AUS DEM KALENDER (Nr. 27b, 09.09.2026).
 * Die Zeitscheibe am Deckel schaetzte die Seiten eines Blocks aus WANDUHR-Minuten
 * zwischen Start und Ende. Nach dem Feiertagswochenende (Stempel Freitag 19:59, Runde
 * Dienstag 04:16) sind das 3.500 Minuten, in denen die Quelle fuer keine einzige einen
 * Balken hat - der Plan hielt jeden Block fuer 70 Seiten schwer und nahm in der
 * Vorboerse nur 2-4 Bloecke je Runde (08.09.: "Deckel: 26 Bloecke in der naechsten
 * Runde" bei 16 Anfragen). Gezaehlt werden jetzt die Minuten, in denen ueberhaupt
 * gehandelt wird: je Handelstag des Kalenders von 04:00 ET bis Schluss + 240 min
 * (dieselben Grenzen wie markt/uebersicht.js und markt/kerzenchart.js). Ohne Kalender
 * bleibt die Wanduhr - so rechnet der Nachlauf, der keinen Deckel hat. */
var VOR_MIN = 330, NACH_MIN = 240;
function tagesfenster(tagEt, kal) {
  var e = kal && kal[tagEt];
  if (!e || !e.open || !e.close) return null;
  var p = tagEt.split('-').map(Number), o = e.open.split(':').map(Number), c = e.close.split(':').map(Number);
  var auf = A.nyNachUtc(p[0], p[1], p[2], o[0], o[1]) - VOR_MIN * 60000;
  var zu = A.nyNachUtc(p[0], p[1], p[2], c[0], c[1]) + NACH_MIN * 60000;
  return { auf: auf, zu: zu };
}
/** Die Handelstage des Kalenders, die [von, bis] beruehren - als Fenster in Zeitfolge. */
function fensterIn(von, bis, kal) {
  var aus = [], gesehen = {};
  for (var t = von; t <= bis + 86400000; t += 86400000) {
    var tag = A.etTag(t);
    if (gesehen[tag]) continue;
    gesehen[tag] = 1;
    var f = tagesfenster(tag, kal);
    if (f) aus.push(f);
  }
  aus.sort(function (a, b) { return a.auf - b.auf; });
  return aus;
}
/** Wie viele Minutenstempel in [von, bis] liegen in einer Sitzung (vor, regulaer, nach)? */
function sitzungsminuten(von, bis, kal) {
  if (!zahl(von) || !zahl(bis) || bis < von || !kal) return 0;
  var summe = 0;
  fensterIn(von, bis, kal).forEach(function (f) {
    var a = Math.max(von, f.auf), b = Math.min(bis, f.zu - 60000);
    if (b >= a) summe += Math.floor((b - a) / 60000) + 1;
  });
  return summe;
}
/** Der Stempel, an dem ab `start` genau n Sitzungsminuten erreicht sind - oder null,
 *  wenn der Kalender nicht so weit reicht. */
function endeNachSitzungsminuten(start, n, kal) {
  if (!zahl(start) || !(n >= 1) || !kal) return null;
  var rest = n, gesehen = {};
  for (var t = start, i = 0; i < 400; t += 86400000, i++) {   /* Tag fuer Tag, hoechstens gut ein Jahr */
    var tag = A.etTag(t);
    if (gesehen[tag]) continue;
    gesehen[tag] = 1;
    var f = tagesfenster(tag, kal);
    if (!f) continue;
    var a = Math.max(start, f.auf), b = f.zu - 60000;
    if (b < a) continue;
    var da = Math.floor((b - a) / 60000) + 1;
    if (da >= rest) return a + (rest - 1) * 60000;
    rest -= da;
  }
  return null;
}
function abrufplan(werte, stempelJe, jetzt, opt) {
  opt = opt || {};
  var block = opt.block || BLOCK;
  var redundanzMax = opt.redundanzMax != null ? opt.redundanzMax : REDUNDANZ_MAX;
  /* opt.ende: der Nachlauf (tools/alpaca-vollsammlung.js --nachholen) fragt nicht bis
   * zur fertig-Grenze, sondern bis zum letzten abgeschlossenen Handelstag. */
  var ende = opt.ende != null ? opt.ende : fertigGrenze(jetzt);
  var leere = opt.leere || { tag: null, je: {} };
  var heute = A.etTag(jetzt);
  if (!leere.je) leere.je = {};
  if (!leere.gesehen) leere.gesehen = {};
  if (leere.tag !== heute) { leere.tag = heute; leere.je = {}; leere.gesehen = {}; leere.sitzung = null; }
  if (opt.sitzung !== undefined && leere.sitzung !== opt.sitzung) { leere.sitzung = opt.sitzung; leere.je = {}; }
  var zaehltLeere = opt.sitzung === undefined || opt.sitzung === 'regulaer';
  var startJe = {}, aktuell = 0, ruhend = [], offen = [];
  (werte || []).forEach(function (sym) {
    if ((leere.je[sym] || 0) >= LEER_MAX) { ruhend.push(sym); return; }
    var s = startFuer(stempelJe ? stempelJe[sym] : null, jetzt);
    if (s > ende) { aktuell++; return; }
    startJe[sym] = s;
    offen.push(sym);
  });
  /* Vom juengsten Start her - der Block, der die aktiven Werte traegt, entsteht zuerst
   * und bleibt eng; die Nachzuegler sammeln sich dahinter. */
  offen.sort(function (a, b) { return (startJe[b] - startJe[a]) || (a < b ? -1 : a > b ? 1 : 0); });
  var bloecke = [], cur = null;
  offen.forEach(function (sym) {
    var s = startJe[sym];
    if (cur && cur.symbole.length < block) {
      var zusatz = (cur.start - s) / 60000 * cur.symbole.length;
      if (cur.redundanz + zusatz <= redundanzMax) {
        cur.redundanz += zusatz; cur.start = s; cur.symbole.push(sym);
        return;
      }
    }
    cur = { symbole: [sym], start: s, ende: ende, redundanz: 0 };
    bloecke.push(cur);
  });
  /* DIE ZEITSCHEIBE AM DECKEL (07.09.2026).
   * Bis heute lief der Deckel je Seite: mitten in der Seitenfolge eines Blocks war
   * Schluss, und weil ein angerissener Block nichts schreiben darf, fiel er ganz weg -
   * mit identischem Plan in der naechsten Runde. Nachgefahren am 06.09.: ein Block, der
   * 160 Seiten braucht, kostete bei Deckel 150 in DREI Runden 450 Anfragen und brachte
   * null Kerzen; ab etwa acht Handelstagen Rueckstand steht der Sammler still.
   * Jetzt wird die ZEIT gekappt, nicht die Seitenfolge: ein Block bekommt so viele
   * Minuten, wie in die verbleibenden Seiten passen (Symbole x Minuten <= Rest x SEITE).
   * Was er holt, wird geschrieben, der Stempel wandert, und die naechste Runde macht an
   * derselben Stelle weiter. Bloecke, fuer die kein Rest mehr bleibt, entfallen in
   * dieser Runde - sie stehen in `verschoben`. */
  var verschoben = 0, zeitscheiben = 0;
  if (zahl(opt.deckel) && opt.deckel > 0) {
    var rest = opt.deckel, behalten = [];
    for (var bi2 = 0; bi2 < bloecke.length; bi2++) {
      var bl = bloecke[bi2];
      /* Nr. 27b: mit Kalender zaehlen nur Sitzungsminuten (ein Wochenende ist keine
       * Seite wert); ohne Kalender die Wanduhr wie bisher. */
      var minuten = opt.kalender ? sitzungsminuten(bl.start, bl.ende, opt.kalender) : Math.floor((bl.ende - bl.start) / 60000) + 1;
      var seiten = Math.max(1, Math.ceil(bl.symbole.length * Math.max(1, minuten) / SEITE));
      if (seiten > rest) {
        var passt = Math.floor(rest * SEITE / bl.symbole.length);
        if (passt < 1) break;
        var neuEnde = opt.kalender ? endeNachSitzungsminuten(bl.start, passt, opt.kalender) : null;
        if (neuEnde == null) neuEnde = bl.start + (passt - 1) * 60000;
        bl.ende = Math.min(bl.ende, neuEnde);
        bl.zeitscheibe = true;
        zeitscheiben++;
        seiten = rest;
      }
      rest -= seiten;
      behalten.push(bl);
      if (rest <= 0) break;
    }
    verschoben = bloecke.length - behalten.length;
    bloecke = behalten;
  }
  return { bloecke: bloecke, startJe: startJe, ende: ende, aktuell: aktuell, ruhend: ruhend, leere: leere,
           zaehltLeere: zaehltLeere, zeitscheiben: zeitscheiben, verschoben: verschoben,
           anfragenMindestens: bloecke.length };
}
/** Die Adresse eines Abrufs. KEIN Schluessel darin - der geht als Kopfzeile mit, und
 *  zwar erst im Hauptprozess. sort=asc, damit die Seiten in Zeitfolge kommen.
 *
 *  opt.ohneEnd laesst `end` weg. GEMESSEN am 07.09.2026 07:39 mit echtem Schluessel
 *  (uebergabe/probe-end-2026-09-07.json): `end = jetzt - 16 min` -> 200, `- 31 min` ->
 *  200, `- 14 min` -> 403 ("subscription does not permit querying recent SIP data"),
 *  ohne `end` -> 200; `end` ist EINSCHLIESSLICH (14:00-15:00 ET = 61 Balken). Der
 *  Abstand von 16 Minuten ist also richtig. Der Gurt zum Hosentraeger: antwortet die
 *  Quelle trotzdem einmal mit 403 auf eine Anfrage MIT `end`, wiederholt die Runde
 *  denselben Block OHNE `end` - sichten() wirft alles hinter der Grenze ohnehin weg. */
function urlFuer(block, token, opt) {
  opt = opt || {};
  return DATEN + '/stocks/bars?symbols=' + encodeURIComponent(block.symbole.join(',')) +
    '&timeframe=1Min&start=' + encodeURIComponent(new Date(block.start).toISOString()) +
    (opt.ohneEnd ? '' : '&end=' + encodeURIComponent(new Date(block.ende).toISOString())) +
    '&limit=' + SEITE + '&feed=sip&adjustment=raw&sort=asc' +
    (token ? '&page_token=' + encodeURIComponent(token) : '');
}

/* ================= 4) Die Antwort sichten ================= */
/** Aus den Balken der Quelle die Kerzen je Wert - und was wegfaellt, benannt:
 *    laufend    Stempel hinter der fertig-Grenze (die laufende Minute, nie schreiben)
 *    alt        Stempel vor dem Start des Werts (steht schon in der Datei)
 *    form       Balken ohne gueltige Zahlen oder nicht auf der Minute
 *    fremd      Kuerzel, das nicht im Block war (die iex-Falle in neuer Form) */
function sichten(bars, block, startJe) {
  var je = {}, verworfen = { laufend: 0, alt: 0, form: 0, fremd: 0 }, angenommen = 0;
  var drin = {};
  block.symbole.forEach(function (s) { drin[s] = 1; });
  /* Was die Quelle unter einem Kuerzel liefert, muss keine Liste sein: `null`, ein
   * Objekt, eine Zahl - alles schon gesehen. Frueher warf das (`.length`, `.forEach`)
   * und riss die ganze Runde mit. Jetzt ist es einfach nichts. */
  function liste(v) { return Array.isArray(v) ? v : []; }
  Object.keys(bars || {}).forEach(function (sym) {
    if (!drin[sym]) { verworfen.fremd += liste(bars[sym]).length; return; }
    var start = startJe && zahl(startJe[sym]) ? startJe[sym] : block.start;
    liste(bars[sym]).forEach(function (b) {
      var k = A.kerzeAus(b);
      if (!k) { verworfen.form++; return; }
      if (k[0] > block.ende) { verworfen.laufend++; return; }
      if (k[0] < start) { verworfen.alt++; return; }
      (je[sym] = je[sym] || []).push(k);
      angenommen++;
    });
  });
  Object.keys(je).forEach(function (sym) { je[sym].sort(function (a, b) { return a[0] - b[0]; }); });
  return { je: je, verworfen: verworfen, angenommen: angenommen };
}
/** Kerzen eines Werts auf Jahresdateien verteilen (ET-Jahr, Silvester-Nachboerse!). */
function nachJahren(kerzen) {
  var je = {};
  (kerzen || []).forEach(function (k) { var j = A.jahrVon(k[0]); (je[j] = je[j] || []).push(k); });
  return je;
}

/* ================= 5) Eine Runde =================
 *  o.werte       die Live-Menge
 *  o.jetzt       () -> ms
 *  o.an          Schalter aus den Sammler-Einstellungen
 *  o.schluessel  true, wenn Alpaca-Zugang in den App-Einstellungen steht
 *  o.sperre      { lesen() -> {aktiv, was}, setzen(was), loesen() } - OPTIONAL. Seit dem
 *                09.09.2026 gibt die App keine Sperre mehr herein: die Runde schreibt
 *                nur noch die Tagesablage, die kein zweiter Prozess anfasst. Wer eine
 *                Sperre hereingibt (Proben), bekommt das alte Verhalten.
 *  o.stempel     (sym) -> juengster Stempel der Reihe oder null - darf ein Promise sein
 *  o.fetch       async (url) -> { status, body }   (Schluessel setzt der Aufrufer)
 *  o.schreiben   (sym, jahr, kerzen) -> { ok, geschrieben, neu, uebersprungen, letzterStempel,
 *                geschriebenBytes, ms, grund } - darf ein Promise sein
 *  o.abschluss   (erg) - darf ein Promise sein; wird abgewartet, bevor die Runde endet
 *  o.kalender    { 'YYYY-MM-DD': {open, close} } fuer die Zeitscheibe (Nr. 27b)
 *  o.leere       { tag, je }  Zustand ueber Runden hinweg (wird fortgeschrieben)
 *  o.deckel, o.block  fuer Proben
 *
 *  JEDE VERRICHTUNG WIRD ABGEWARTET (09.09.2026): Stempel, Schreiben und Abschluss
 *  laufen in der App ueber fs.promises, damit der Hauptprozess frei bleibt. Ein
 *  `forEach` mit `await` darin wartet nicht - deshalb stehen hier for-Schleifen, und
 *  die Werte eines Blocks werden nacheinander geschrieben (Nebenlaeufigkeit 1, der
 *  Auftrag erlaubt hoechstens 4). Synchrone Verrichtungen (Proben) gehen weiter durch,
 *  `await` auf einen Wert ist ein Wert.
 *
 *  Kein Nachfassen in derselben Runde: 429 oder ein anderer Fehler beendet die Runde
 *  mit Meldung, die naechste Runde faengt regulaer an (der Plan rechnet neu). */
async function runde(o) {
  var jetzt = o.jetzt || function () { return Date.now(); };
  var t0 = jetzt();
  var erg = { gelaufen: false, grund: null, zeit: t0, werte: (o.werte || []).length, bloecke: 0, anfragen: 0, seiten: 0,
    kerzen: 0, dateien: 0, verworfen: { laufend: 0, alt: 0, form: 0, fremd: 0 }, drossel: false, fehler: null,
    deckel: false, ende: null, bis: null, jeWert: {}, aktuell: 0, ruhend: 0, dauerMs: 0,
    /* Was diese Runde WIRKLICH auf die Platte geschrieben hat (Journal + Kopf-Spannen +
     * Schwanz je Datei) und wie lange das dauerte - seit dem Anhang an Ort und Stelle
     * ist das die Zahl, an der man den Umbau sieht. */
    schreibBytes: 0, schreibMs: 0,
    /* Seiten JE BLOCK (nicht nur die Summe), Schreibfehler getrennt vom Leer-Zaehler,
     * Bloecke ohne einen einzigen Balken der Quelle, uebersprungene Kerzen, und ob die
     * Runde `end` weglassen musste. */
    seitenJeBlock: [], fehlerJe: 0, quellenLeer: 0, uebersprungen: 0, ohneEnd: false,
    zeitscheiben: 0, verschoben: 0 };
  function fertig() { erg.dauerMs = jetzt() - t0; return erg; }
  /* F18: `erg.fehler` war eine unbegrenzte Kette - 500 Schreibfehler sind 33 KB je
   * Runde in Panel-Zeile, _lauf.log und _fortschritt.json. Die ersten FEHLER_MAX
   * Meldungen stehen da, der Rest wird gezaehlt. */
  var fehlerListe = [], fehlerMehr = 0;
  function fehlerNotieren(text) {
    if (fehlerListe.length < FEHLER_MAX) fehlerListe.push(text); else fehlerMehr++;
    erg.fehler = fehlerListe.join(' | ') + (fehlerMehr ? ' | und ' + fehlerMehr + ' weitere' : '');
  }
  if (!o.an) { erg.grund = 'ausgeschaltet'; return fertig(); }
  if (!o.schluessel) { erg.grund = 'kein Alpaca-Zugang in den App-Einstellungen'; return fertig(); }
  var f = sitzungsfenster(t0);
  erg.fenster = f;
  if (!f.offen) { erg.grund = 'ausserhalb der Sitzung (' + f.text + ')'; return fertig(); }
  var sp = o.sperre && o.sperre.lesen ? o.sperre.lesen() : { aktiv: false };
  if (sp && sp.aktiv) { erg.grund = 'Archivsperre liegt (' + (sp.was || 'anderer Schreiber') + ') - Runde wartet'; return fertig(); }
  var stempelJe = {};
  var werteListe = o.werte || [];
  for (var wi = 0; wi < werteListe.length; wi++) {
    stempelJe[werteListe[wi]] = o.stempel ? await o.stempel(werteListe[wi]) : null;
  }
  var deckel = o.deckel || DECKEL_JE_RUNDE;
  var plan = abrufplan(o.werte, stempelJe, t0, { leere: o.leere, block: o.block, sitzung: f.zustand, deckel: deckel, kalender: o.kalender });
  erg.aktuell = plan.aktuell; erg.ruhend = plan.ruhend.length; erg.ende = plan.ende; erg.bloecke = plan.bloecke.length;
  erg.zeitscheiben = plan.zeitscheiben || 0; erg.verschoben = plan.verschoben || 0;
  if (!plan.bloecke.length) { erg.grund = 'nichts faellig'; return fertig(); }
  /* F37: liefert die Sperre `false`, hat sie ein anderer - dann wird die Runde
   * AUSGELASSEN. Frueher lief sie ohne Sperre weiter ("laeuft trotzdem"), und genau
   * das ist der Zustand, gegen den die Sperre gebaut wurde. */
  if (o.sperre && o.sperre.setzen && o.sperre.setzen('Live-Sammler, ' + erg.werte + ' Werte') === false) {
    erg.grund = 'Archivsperre liess sich nicht setzen - Runde ausgelassen';
    return fertig();
  }
  erg.gelaufen = true;
  var ohneEnd = !!o.ohneEnd, ohneEndVersucht = false;
  erg.ohneEnd = ohneEnd;
  try {
    for (var bi = 0; bi < plan.bloecke.length; bi++) {
      var block = plan.bloecke[bi];
      var token = null, bars = {}, abbruch = false, nochmal = false, seitenBlock = 0, rohBalken = 0;
      do {
        if (erg.anfragen >= deckel) { erg.deckel = true; abbruch = true; break; }
        var r = await o.fetch(urlFuer(block, token, { ohneEnd: ohneEnd }));
        erg.anfragen++; erg.seiten++; seitenBlock++;
        if (!r || r.status === 429) { erg.drossel = true; fehlerNotieren('Drossel der Quelle (429) - Runde abgebrochen, keine Wiederholung'); abbruch = true; break; }
        /* F14: 403 auf eine Anfrage MIT `end` - denselben Block ohne `end` wiederholen
         * und es fuer die Sitzung merken. Sichten verwirft alles hinter der Grenze. */
        if (r.status === 403 && !ohneEnd && !ohneEndVersucht) {
          ohneEnd = true; ohneEndVersucht = true; erg.ohneEnd = true;
          fehlerNotieren('HTTP 403 mit end - Block wird ohne end wiederholt' + koerper(r));
          nochmal = true; break;
        }
        if (r.status !== 200) { fehlerNotieren('HTTP ' + r.status + ' - Runde abgebrochen' + koerper(r)); abbruch = true; break; }
        var daten = null;
        try { daten = JSON.parse(r.body); } catch (e) { daten = null; }
        if (!daten || typeof daten !== 'object') { fehlerNotieren('Antwort unlesbar - Runde abgebrochen'); abbruch = true; break; }
        Object.keys(daten.bars || {}).forEach(function (sym) {
          var liste = Array.isArray(daten.bars[sym]) ? daten.bars[sym] : [];
          rohBalken += liste.length;
          bars[sym] = (bars[sym] || []).concat(liste);
        });
        token = daten.next_page_token || null;
      } while (token);
      if (nochmal) { bi--; continue; }        /* derselbe Block, diesmal ohne `end` */
      /* Was VOR dem Abbruch vollstaendig da ist, wird geschrieben - ein Block mit
       * angerissener Seitenfolge nicht: seine Werte kaemen halb an, und der naechste
       * Start laege hinter einer Luecke. */
      if (abbruch) break;
      erg.seitenJeBlock.push(seitenBlock);
      /* F4: ein Block, der fuer KEINEN seiner Werte einen Balken bringt, ist ein
       * Quellenfehler ("Quelle antwortet leer mit 200", wiki/fehlerformen.md) und keine
       * Aussage ueber die Werte. Er zaehlt NICHT auf den Leer-Zaehler - sonst legen
       * drei stille Antworten der Quelle die ganze Live-Menge still. */
      var quellenLeer = rohBalken === 0;
      if (quellenLeer) {
        erg.quellenLeer++;
        fehlerNotieren('Quelle ohne einen einzigen Balken fuer ' + block.symbole.length + ' Werte (Block ' + (bi + 1) + ')');
      }
      var g = sichten(bars, block, plan.startJe);
      Object.keys(g.verworfen).forEach(function (k) { erg.verworfen[k] += g.verworfen[k]; });
      for (var si = 0; si < block.symbole.length; si++) {
        var sym = block.symbole[si];
        var kerzen = g.je[sym] || [];
        var neu = 0, letzter = null, schreibFehler = false;
        var jeJahr = nachJahren(kerzen);
        var jahre = Object.keys(jeJahr).map(Number).sort();
        for (var ji = 0; ji < jahre.length; ji++) {
          var jahr = jahre[ji];
          /* F5: ein werfender Schreibvorgang kostet DIESEN Wert, nicht die Runde -
           * das gilt fuer eine Ausnahme wie fuer eine abgewiesene Zusage. */
          var w;
          try { w = await o.schreiben(sym, jahr, jeJahr[jahr]); }
          catch (e) { w = { ok: false, grund: 'Ausnahme: ' + String((e && e.message) || e).slice(0, 200) }; }
          if (w && w.ok) {
            if (w.geschrieben) { erg.dateien++; neu += w.neu || 0; }
            if (zahl(w.geschriebenBytes)) erg.schreibBytes += w.geschriebenBytes;
            if (zahl(w.ms)) erg.schreibMs += w.ms;
            if (zahl(w.letzterStempel)) letzter = w.letzterStempel;
            if (zahl(w.uebersprungen)) erg.uebersprungen += w.uebersprungen;
          } else if (w && w.grund) {
            schreibFehler = true;
            fehlerNotieren(sym + ' ' + jahr + ': ' + w.grund);
          }
        }
        erg.kerzen += neu;
        if (neu > 0) { plan.leere.je[sym] = 0; plan.leere.gesehen[sym] = 1; if (letzter > (erg.bis || 0)) erg.bis = letzter; }
        /* F16: ein Schreibfehler ist kein "leerer" Wert. Er wird getrennt gezaehlt -
         * sonst ruht der Wert nach drei Fehlschlaegen, und die Meldung verschwindet. */
        else if (schreibFehler) erg.fehlerJe++;
        else if (!quellenLeer && (plan.zaehltLeere || plan.leere.gesehen[sym])) {
          plan.leere.je[sym] = (plan.leere.je[sym] || 0) + 1;
        }
        erg.jeWert[sym] = { neu: neu, stempel: zahl(letzter) ? letzter : (stempelJe[sym] || null), leer: plan.leere.je[sym] || 0 };
      }
    }
    if (erg.deckel) erg.grund = 'Deckel von ' + deckel + ' Anfragen erreicht - Rest in der naechsten Runde';
    else if (erg.verschoben) erg.grund = 'Deckel von ' + deckel + ' Anfragen: ' + erg.verschoben + ' Bloecke in der naechsten Runde';
    /* Der Abschluss (Stand der Runde, Protokoll) wird ABGEWARTET, und zwar vor dem
     * finally - wer eine Sperre hereingibt, bekommt ihn noch unter ihr. */
    if (typeof o.abschluss === 'function') { try { await o.abschluss(erg); } catch (e) { fehlerNotieren('Abschluss: ' + String(e && e.message || e)); } }
  } finally {
    if (o.sperre && o.sperre.loesen) o.sperre.loesen();
  }
  return fertig();
}

/* ================= 6) Die Zeile fuer das Panel =================
 * Aus DATEN, nicht aus einem festen Satz - test-v6 haelt die Zahlen gegen den Text. */
function uhr(ms, zone) {
  if (!zahl(ms)) return '–';
  try {
    return new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: zone || undefined });
  } catch (e) { return new Date(ms).toISOString().slice(11, 16); }
}
/** Bytes als Menge, wie ein Mensch sie liest: unter einem Megabyte in KB, darueber in
 *  MB mit einer Nachkommastelle bis 10 MB. Komma, kein Punkt. */
function menge(bytes) {
  if (!zahl(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  var mb = bytes / (1024 * 1024);
  return (mb < 10 ? mb.toFixed(1) : String(Math.round(mb))).replace('.', ',') + ' MB';
}
function sekunden(ms) { return (zahl(ms) ? ms / 1000 : 0).toFixed(1).replace('.', ',') + ' s'; }
function panelZeile(st) {
  st = st || {};
  if (!st.moeglich) return 'Alpaca live: aus — kein Alpaca-Zugang in den App-Einstellungen';
  if (!st.an) return 'Alpaca live: aus — Schalter „Live-Sammler" ist aus';
  var t = 'Alpaca live: ' + (st.werte || 0) + ' Werte';
  /* AKTUELL UND RUHEND (07.09.2026): "3.067 Werte" allein verschweigt, dass davon
   * vielleicht 3.000 ruhen. Die zwei Zahlen stehen jetzt daneben - aktuell = auf dem
   * neuesten Stand, ruhend = nach LEER_MAX leeren Runden zurueckgestellt. */
  if (zahl(st.aktuell) && st.aktuell > 0) t += ' · ' + st.aktuell + ' aktuell';
  if (zahl(st.ruhend) && st.ruhend > 0) t += ' · ' + st.ruhend + ' ruhend';
  t += ' · letzte Runde ' + (zahl(st.letzteRunde) ? uhr(st.letzteRunde) : 'noch keine');
  t += ' · bis ' + (zahl(st.bis) ? uhr(st.bis, 'America/New_York') + ' ET' : '–');
  t += ' · Abrufe je Runde ' + (zahl(st.anfragen) ? st.anfragen : '–');
  /* Nur wenn die Runde WIRKLICH geschrieben hat - eine Runde ohne neue Kerze soll
   * nicht "geschrieben 0 KB" melden. */
  if (zahl(st.schreibBytes) && st.schreibBytes > 0) t += ' · geschrieben ' + menge(st.schreibBytes) + ' in ' + sekunden(st.schreibMs);
  /* Der Deckel wird gemeldet wie die Drossel - er war bisher unsichtbar, obwohl er
   * Bloecke in die naechste Runde schiebt. */
  /* `deckel` heisst im Stand der App die ZAHL, im Ergebnis einer Runde das ERREICHT -
   * hier wird beides angenommen, damit die Zeile aus beidem gebaut werden kann. */
  var deckelErreicht = st.deckelErreicht !== undefined ? !!st.deckelErreicht : st.deckel === true;
  var deckelWert = zahl(st.deckel) ? st.deckel : DECKEL_JE_RUNDE;
  if (deckelErreicht) t += ' · Deckel (' + deckelWert + ' Abrufe)';
  else if (zahl(st.verschoben) && st.verschoben > 0) t += ' · Deckel: ' + st.verschoben + ' Bloecke in der naechsten Runde';
  if (st.ohneEnd) t += ' · ohne end (403 der Quelle)';
  if (st.drossel) t += ' · Drossel (429)';
  else if (st.fehler) t += ' · Fehler: ' + st.fehler;
  else if (st.grund && !st.gelaufen) t += ' · ' + st.grund;
  return t;
}

module.exports = {
  TAKT_MS: TAKT_MS, FERTIG_ABSTAND_MS: FERTIG_ABSTAND_MS, DECKEL_JE_RUNDE: DECKEL_JE_RUNDE, BLOCK: BLOCK, SEITE: SEITE, LEER_MAX: LEER_MAX,
  FEHLER_MAX: FEHLER_MAX, REDUNDANZ_MAX: REDUNDANZ_MAX, ERLOSCHEN_TAGE: ERLOSCHEN_TAGE,
  liveMenge: liveMenge, gefuehrteReihen: gefuehrteReihen, menge: menge,
  fertigGrenze: fertigGrenze, zustandUm: zustandUm, sitzungsfenster: sitzungsfenster,
  startFuer: startFuer, abrufplan: abrufplan, urlFuer: urlFuer, sichten: sichten, nachJahren: nachJahren,
  tagesfenster: tagesfenster, sitzungsminuten: sitzungsminuten, endeNachSitzungsminuten: endeNachSitzungsminuten,
  runde: runde, panelZeile: panelZeile,
};

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
var LEER_MAX = 3;                   /* leere Runden in Folge, dann ruht der Wert bis zum naechsten Tag */
var DATEN = 'https://data.alpaca.markets/v2';

function zahl(v) { return typeof v === 'number' && isFinite(v); }
function minute(ms) { return Math.floor(ms / 60000) * 60000; }

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
/** Laeuft eine Runde? Ja, solange die fertig-Grenze noch in einer Sitzung liegt
 *  (Vor-/Nachboerse mit). Um 20:10 ET ist die Boerse zu, aber die Balken bis 19:54
 *  sind gerade erst fertig - die Runde laeuft; um 20:17 liegt auch die Grenze hinter
 *  20:00, und es ist Schluss bis zur naechsten Vorboerse. */
function sitzungsfenster(jetzt) {
  var z = zustandUm(fertigGrenze(jetzt));
  var offen = !!(z && z.zustand && z.zustand !== 'geschlossen');
  return { offen: offen, zustand: z ? z.zustand : null, text: z ? z.text : 'unbekannt', grenze: fertigGrenze(jetzt) };
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
 *  die LEER_MAX Runden in Folge nichts brachten, ruhen bis zum naechsten ET-Tag (ein
 *  erloschener Wert wuerde sonst jede Runde einen eigenen Abruf kosten). */
var REDUNDANZ_MAX = 5000;           /* doppelt angefragte Minuten je Block, ueber alle Mitglieder */
function abrufplan(werte, stempelJe, jetzt, opt) {
  opt = opt || {};
  var block = opt.block || BLOCK;
  var redundanzMax = opt.redundanzMax != null ? opt.redundanzMax : REDUNDANZ_MAX;
  /* opt.ende: der Nachlauf (tools/alpaca-vollsammlung.js --nachholen) fragt nicht bis
   * zur fertig-Grenze, sondern bis zum letzten abgeschlossenen Handelstag. */
  var ende = opt.ende != null ? opt.ende : fertigGrenze(jetzt);
  var leere = opt.leere || { tag: null, je: {} };
  var heute = A.etTag(jetzt);
  if (leere.tag !== heute) { leere.tag = heute; leere.je = {}; }
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
  return { bloecke: bloecke, startJe: startJe, ende: ende, aktuell: aktuell, ruhend: ruhend, leere: leere,
           anfragenMindestens: bloecke.length };
}
/** Die Adresse eines Abrufs. KEIN Schluessel darin - der geht als Kopfzeile mit, und
 *  zwar erst im Hauptprozess. sort=asc, damit die Seiten in Zeitfolge kommen. */
function urlFuer(block, token) {
  return DATEN + '/stocks/bars?symbols=' + encodeURIComponent(block.symbole.join(',')) +
    '&timeframe=1Min&start=' + encodeURIComponent(new Date(block.start).toISOString()) +
    '&end=' + encodeURIComponent(new Date(block.ende).toISOString()) +
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
  Object.keys(bars || {}).forEach(function (sym) {
    if (!drin[sym]) { verworfen.fremd += (bars[sym] || []).length; return; }
    var start = startJe && zahl(startJe[sym]) ? startJe[sym] : block.start;
    (bars[sym] || []).forEach(function (b) {
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
 *  o.sperre      { lesen() -> {aktiv, was}, setzen(was), loesen() }
 *  o.stempel     (sym) -> juengster Stempel der Reihe oder null
 *  o.fetch       async (url) -> { status, body }   (Schluessel setzt der Aufrufer)
 *  o.schreiben   (sym, jahr, kerzen) -> { ok, geschrieben, neu, uebersprungen, letzterStempel, grund }
 *  o.leere       { tag, je }  Zustand ueber Runden hinweg (wird fortgeschrieben)
 *  o.deckel, o.block  fuer Proben
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
    schreibBytes: 0, schreibMs: 0 };
  function fertig() { erg.dauerMs = jetzt() - t0; return erg; }
  if (!o.an) { erg.grund = 'ausgeschaltet'; return fertig(); }
  if (!o.schluessel) { erg.grund = 'kein Alpaca-Zugang in den App-Einstellungen'; return fertig(); }
  var f = sitzungsfenster(t0);
  erg.fenster = f;
  if (!f.offen) { erg.grund = 'ausserhalb der Sitzung (' + f.text + ')'; return fertig(); }
  var sp = o.sperre && o.sperre.lesen ? o.sperre.lesen() : { aktiv: false };
  if (sp && sp.aktiv) { erg.grund = 'Archivsperre liegt (' + (sp.was || 'anderer Schreiber') + ') - Runde wartet'; return fertig(); }
  var stempelJe = {};
  (o.werte || []).forEach(function (s) { stempelJe[s] = o.stempel ? o.stempel(s) : null; });
  var plan = abrufplan(o.werte, stempelJe, t0, { leere: o.leere, block: o.block });
  erg.aktuell = plan.aktuell; erg.ruhend = plan.ruhend.length; erg.ende = plan.ende; erg.bloecke = plan.bloecke.length;
  if (!plan.bloecke.length) { erg.grund = 'nichts faellig'; return fertig(); }
  var deckel = o.deckel || DECKEL_JE_RUNDE;
  if (o.sperre && o.sperre.setzen) o.sperre.setzen('Live-Sammler, ' + erg.werte + ' Werte');
  erg.gelaufen = true;
  try {
    for (var bi = 0; bi < plan.bloecke.length; bi++) {
      var block = plan.bloecke[bi];
      var token = null, bars = {}, abbruch = false;
      do {
        if (erg.anfragen >= deckel) { erg.deckel = true; abbruch = true; break; }
        var r = await o.fetch(urlFuer(block, token));
        erg.anfragen++; erg.seiten++;
        if (!r || r.status === 429) { erg.drossel = true; erg.fehler = 'Drossel der Quelle (429) - Runde abgebrochen, keine Wiederholung'; abbruch = true; break; }
        if (r.status !== 200) { erg.fehler = 'HTTP ' + r.status + ' - Runde abgebrochen'; abbruch = true; break; }
        var daten = null;
        try { daten = JSON.parse(r.body); } catch (e) { daten = null; }
        if (!daten || typeof daten !== 'object') { erg.fehler = 'Antwort unlesbar - Runde abgebrochen'; abbruch = true; break; }
        Object.keys(daten.bars || {}).forEach(function (sym) {
          bars[sym] = (bars[sym] || []).concat(daten.bars[sym] || []);
        });
        token = daten.next_page_token || null;
      } while (token);
      /* Was VOR dem Abbruch vollstaendig da ist, wird geschrieben - ein Block mit
       * angerissener Seitenfolge nicht: seine Werte kaemen halb an, und der naechste
       * Start laege hinter einer Luecke. */
      if (abbruch) break;
      var g = sichten(bars, block, plan.startJe);
      Object.keys(g.verworfen).forEach(function (k) { erg.verworfen[k] += g.verworfen[k]; });
      block.symbole.forEach(function (sym) {
        var kerzen = g.je[sym] || [];
        var neu = 0, letzter = null;
        var jeJahr = nachJahren(kerzen);
        Object.keys(jeJahr).map(Number).sort().forEach(function (jahr) {
          var w = o.schreiben(sym, jahr, jeJahr[jahr]);
          if (w && w.ok) {
            if (w.geschrieben) { erg.dateien++; neu += w.neu || 0; }
            if (zahl(w.geschriebenBytes)) erg.schreibBytes += w.geschriebenBytes;
            if (zahl(w.ms)) erg.schreibMs += w.ms;
            if (zahl(w.letzterStempel)) letzter = w.letzterStempel;
          } else if (w && w.grund) {
            erg.fehler = (erg.fehler ? erg.fehler + ' | ' : '') + sym + ' ' + jahr + ': ' + w.grund;
          }
        });
        erg.kerzen += neu;
        if (neu > 0) { plan.leere.je[sym] = 0; if (letzter > (erg.bis || 0)) erg.bis = letzter; }
        else plan.leere.je[sym] = (plan.leere.je[sym] || 0) + 1;
        erg.jeWert[sym] = { neu: neu, stempel: zahl(letzter) ? letzter : (stempelJe[sym] || null), leer: plan.leere.je[sym] };
      });
    }
    if (erg.deckel) erg.grund = 'Deckel von ' + deckel + ' Anfragen erreicht - Rest in der naechsten Runde';
    /* Der Abschluss (Fortschritts-Vermerk, Protokoll) laeuft NOCH UNTER DER SPERRE -
     * sonst koennte der Nachlauf dazwischen starten, seinen Fortschritt lesen und
     * den Vermerk dieser Runde spaeter mit einer aelteren Fassung ueberschreiben. */
    if (typeof o.abschluss === 'function') { try { o.abschluss(erg); } catch (e) { erg.fehler = (erg.fehler ? erg.fehler + ' | ' : '') + 'Abschluss: ' + String(e && e.message || e); } }
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
  t += ' · letzte Runde ' + (zahl(st.letzteRunde) ? uhr(st.letzteRunde) : 'noch keine');
  t += ' · bis ' + (zahl(st.bis) ? uhr(st.bis, 'America/New_York') + ' ET' : '–');
  t += ' · Abrufe je Runde ' + (zahl(st.anfragen) ? st.anfragen : '–');
  /* Nur wenn die Runde WIRKLICH geschrieben hat - eine Runde ohne neue Kerze soll
   * nicht "geschrieben 0 KB" melden. */
  if (zahl(st.schreibBytes) && st.schreibBytes > 0) t += ' · geschrieben ' + menge(st.schreibBytes) + ' in ' + sekunden(st.schreibMs);
  if (st.drossel) t += ' · Drossel (429)';
  else if (st.fehler) t += ' · Fehler: ' + st.fehler;
  else if (st.grund && !st.gelaufen) t += ' · ' + st.grund;
  return t;
}

module.exports = {
  TAKT_MS: TAKT_MS, FERTIG_ABSTAND_MS: FERTIG_ABSTAND_MS, DECKEL_JE_RUNDE: DECKEL_JE_RUNDE, BLOCK: BLOCK, SEITE: SEITE, LEER_MAX: LEER_MAX,
  REDUNDANZ_MAX: REDUNDANZ_MAX, ERLOSCHEN_TAGE: ERLOSCHEN_TAGE,
  liveMenge: liveMenge, gefuehrteReihen: gefuehrteReihen, menge: menge,
  fertigGrenze: fertigGrenze, zustandUm: zustandUm, sitzungsfenster: sitzungsfenster,
  startFuer: startFuer, abrufplan: abrufplan, urlFuer: urlFuer, sichten: sichten, nachJahren: nachJahren,
  runde: runde, panelZeile: panelZeile,
};

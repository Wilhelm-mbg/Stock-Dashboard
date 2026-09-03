'use strict';
/* VOLLSAMMLUNG: Alpaca-SIP-Minutenbalken 2016-heute fuer das ganze Universum,
 * einschliesslich der verschwundenen Werte (Stufe Z1c).
 *
 *   node tools/alpaca-vollsammlung.js --zaehlen                 nur Plan, kein Netz
 *   node tools/alpaca-vollsammlung.js --lebenszeit              1 Abruf je Wert (Tagesbalken)
 *   node tools/alpaca-vollsammlung.js --massnahmen              Kapitalmassnahmen je Wert
 *   node tools/alpaca-vollsammlung.js --holen                   die Sammlung selbst
 *   node tools/alpaca-vollsammlung.js --ableiten                nur (c) aus (a)+(b), ohne Netz
 *   node tools/alpaca-vollsammlung.js --testlauf                10 Werte, 1 Jahr, mit Kontrollen
 *   node tools/alpaca-vollsammlung.js --pruefen                 Kontrollen ueber das Geschriebene
 *   node tools/alpaca-vollsammlung.js --kontrolle               Selbsttest der reinen Bausteine
 *
 * WARUM. Wilhelm, 03.09.2026: "Haben ist immer besser als brauchen - lieber alles sammeln
 * als es dann spaeter zu brauchen" (wiki/entscheide.md). Das vorhandene Kursarchiv kennt
 * nur, was heute noch gehandelt wird; mindestens 12,7 % des Querschnitts fehlen
 * (wiki/ueberlebensverzerrung.md). Ein Archiv, das die Verschwundenen nicht kennt, kann
 * die Ueberlebensverzerrung nicht einmal MESSEN, geschweige denn herausrechnen.
 *
 * DREI ABLAGEN, Wilhelms Entscheid "BEIDES" vom 03.09.2026:
 *   (a) alpaca1m/<SYM>/<JAHR>.json            roh, adjustment=raw, append-only
 *   (b) alpaca-massnahmen/<SYM>.json          Kapitalmassnahmen der Quelle
 *   (c) alpaca1m-bereinigt/<SYM>/<JAHR>.json  LOKAL aus (a)+(b) abgeleitet, kein zweiter Abruf
 *
 * Die Ableitung ist eine reine Funktion: Kurse geteilt durch den Faktor, Umsatz mal den
 * Faktor - damit Kurs x Umsatz der gehandelte Gegenwert bleibt. Das ist BEWUSST stimmiger
 * als Yahoo, das Intraday die Kurse bereinigt und die Umsaetze nicht
 * (wiki/datenquellen.md, gemessen 03.09.2026).
 *
 * VIER PHASEN, jede fuer sich fortsetzbar:
 *   L  Lebenszeit  - EIN Tagesbalken-Abruf je Wert. Er sagt, wann der Wert wirklich
 *                    gehandelt wurde (erster/letzter Balken) - nicht das Listendatum -,
 *                    und wo grosse Luecken liegen. Daraus wird der Plan EXAKT statt
 *                    geschaetzt, und die Kuerzel-Wiederverwendung sichtbar.
 *   M  Massnahmen  - Splits, Abspaltungen, Dividenden, Umbenennungen je Wert.
 *   B  Balken      - die Sammlung, Ringverteilung ueber die Jahre: erst alle Werte 2026,
 *                    dann 2025 ... Ein Abbruch hinterlaesst so ein VOLLSTAENDIGES
 *                    juengstes Jahr, nicht 8.000 halbe Reihen.
 *   A  Ableiten    - (c) aus (a)+(b), ohne Netz.
 *
 * KUERZEL-WIEDERVERWENDUNG. Ein Kuerzel, das nach dem Ende seines Traegers wieder vergeben
 * wird, liefert Balken zweier VERSCHIEDENER Unternehmen. Die zweite Reihe wird als
 * "<KUERZEL>~2" abgelegt, nie vermischt. Geschnitten wird am letzten Tagesbalken des
 * Traegers; damit ein falsch gefuehrtes Listendatum nicht eine echte Reihe zerschneidet,
 * muss zusaetzlich eine LUECKE von mindestens LUECKE_TAGE Handelstagen dazwischenliegen
 * (ein neu vergebenes Kuerzel ist immer monatelang still - eine laufende Reihe nie).
 *
 * RATENBREMSE 170/min. Die Alpaca-Grenze von 200/min gilt fuer den ganzen Zugang, nicht
 * je Werkzeug - kosten.js der App holt gelegentlich mit. 170 laesst ihr Luft.
 *
 * Zugang: NUR ueber schluessel.js der Spannen-Studie. Diese Datei kennt die Umgebungsnamen
 * nicht; jede Ausgabe laeuft durch verdecken().
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var KQ = require('../kerzenquelle.js');
var M = require('./archiv-migration.js');
var S = require('../studien/vorregistrierung-2026-09-02-spannen-historisch/schluessel.js');

var DATEN = 'https://data.alpaca.markets/v2';
var DATEN1 = 'https://data.alpaca.markets/v1';
var HANDEL = 'https://paper-api.alpaca.markets/v2';
var SEITE = 10000;
var RATE_JE_MIN = 170;
var VERSUCHE = 5;
var AB_JAHR = 2016;
var LUECKE_TAGE = 20;          /* Handelstage Stille, ab denen ein Kuerzel als neu vergeben gilt */
var MIND_BALKEN = 1;           /* weniger als das im ganzen Leben: der Wert kommt nicht vor */

var WURZEL = process.env.MD_ALPACA_WURZEL || 'E:/Markt-Dashboard-Archiv';
var ROH = path.join(WURZEL, 'alpaca1m');
var BEREINIGT = path.join(WURZEL, 'alpaca1m-bereinigt');
var MASSNAHMEN = path.join(WURZEL, 'alpaca-massnahmen');
var FORTSCHRITT = path.join(ROH, '_fortschritt.json');
var LEBENSZEIT = path.join(ROH, '_lebenszeit.json');
var SYMBOLE = path.join(ROH, '_symbole.json');
var KALENDER = path.join(ROH, '_kalender.json');
var PROTOKOLL = path.join(ROH, '_lauf.log');

var DATENORDNER = process.env.MD_DATEN || 'C:/Users/Wilhe/Downloads/Markt-Dashboard-Daten';
var UNIVERSUM = path.join(DATENORDNER, 'massive', 'universum-2024-09-02.json');
var VERSCHWUNDENE = path.join(DATENORDNER, 'massive', 'verschwundene.json');
var ARTEN = path.join(DATENORDNER, 'massive', 'wertpapierarten.json');
var TAGESDATEN = path.join(DATENORDNER, 'massive', 'tagesdaten');

/* Alle Massnahmenarten, die Alpaca kennt - es werden ALLE geholt ("Haben ist besser als
 * brauchen"). Welche die Ableitung ANWENDET, entscheidet faktorAus(), nicht die Abfrage. */
var MASSNAHME_ARTEN = ['reverse_split', 'forward_split', 'unit_split', 'cash_dividend', 'stock_dividend',
  'spin_off', 'cash_merger', 'stock_merger', 'stock_and_cash_merger', 'redemption',
  'name_change', 'worthless_removal', 'rights_distribution'].join(',');

function sag(t) { process.stdout.write(S.verdecken(t) + '\n'); }
function pause(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function protokoll(zeile) {
  try {
    fs.mkdirSync(ROH, { recursive: true });
    fs.appendFileSync(PROTOKOLL, S.verdecken(new Date().toISOString() + '  ' + zeile) + '\n');
  } catch (e) { /* ein fehlendes Protokoll darf den Lauf nicht anhalten */ }
}

/* ================= (0) Namen, die Windows nicht mag =================
 *
 * Der Ordnername ist NICHT einfach das Kuerzel. Drei Fallen, alle vor dem ersten
 * geschriebenen Byte gefunden:
 *
 *   1. CON steht im eingefrorenen Universum - und ist unter Windows ein GERAETENAME.
 *      mkdir CON schlaegt fehl, egal wie tief der Pfad liegt. Ebenso PRN, AUX, NUL,
 *      COM1-9, LPT1-9.
 *   2. Windows-Dateinamen sind unempfindlich gegen Gross-/Kleinschreibung. HIW und HIw
 *      sind ZWEI VERSCHIEDENE Wertpapiere (das zweite ein Bezugsrecht), landeten aber
 *      im selben Ordner - zwei Unternehmen in einer Reihe, still. Betrifft HIW/HIw,
 *      KW/Kw und ADSW/ADSw.
 *   3. Kuerzel mit Punkt (BRK.B) sind unkritisch, ein Kuerzel, das AUF einen Punkt endet,
 *      waere es nicht - es gibt keines, aber die Regel faengt es trotzdem.
 *
 * Regel: ein Kuerzel, das nicht rein aus Grossbuchstaben, Ziffern und Punkten besteht
 * ODER ein Geraetename ist ODER auf einen Punkt endet, bekommt einen Kurzstempel seines
 * EXAKTEN Namens angehaengt. Weil der Stempel ueber die genaue Schreibweise gebildet wird,
 * bleibt die Abbildung auch dann eindeutig, wenn zwei Kuerzel sich nur in der
 * Gross-/Kleinschreibung unterscheiden. Die Wahrheit steht ohnehin IM Datei-Rumpf
 * (huelle.sym), der Ordnername ist nur die Ablage - und alpaca1m/_symbole.json fuehrt
 * die vollstaendige Abbildung. */
var GERAET = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
function kurzstempel(s) {
  return require('crypto').createHash('sha1').update(s, 'utf8').digest('hex').slice(0, 6);
}
function ordnerName(sym) {
  var s = String(sym);
  var reihe = s.replace(/~2$/, ''), zweite = s !== reihe;
  var sauber = /^[A-Z0-9.]+$/.test(reihe) && !GERAET.test(reihe) && !/\.$/.test(reihe);
  var name = sauber ? reihe : reihe.replace(/[^A-Za-z0-9.]/g, '_') + '_' + kurzstempel(reihe);
  return zweite ? name + '~2' : name;
}
/** Die Abbildung ueber eine ganze Symbolliste - und der Beweis, dass sie eindeutig ist.
 *  Verglichen wird in Grossschreibung, weil Windows das auch tut. */
function symbolAbbildung(symbole) {
  var ab = {}, rueck = {}, doppelt = [];
  symbole.forEach(function (s) {
    var o = ordnerName(s);
    ab[s] = o;
    var k = o.toUpperCase();
    if (rueck[k] && rueck[k] !== s) doppelt.push(rueck[k] + ' und ' + s + ' -> ' + o);
    rueck[k] = s;
  });
  return { ab: ab, doppelt: doppelt };
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
var Z = { abrufe: 0, wiederholt: 0, fehler: {} };
function fehlerZaehlen(art) { Z.fehler[art] = (Z.fehler[art] || 0) + 1; }
async function hole(url, f) {
  f = f || globalThis.fetch;
  for (var v = 1; v <= VERSUCHE; v++) {
    await marke();
    Z.abrufe++;
    var res, text;
    try {
      res = await f(url, { headers: S.kopfzeilen(), signal: AbortSignal.timeout(90000) });
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

/* ================= (2) Reine Bausteine - die Kontrolle faehrt sie ohne Netz ================= */

/** Die Grenzen eines Sammeljahres. Sie sind die ET-Grenze, nicht die UTC-Grenze: mit
 *  UTC-Mitternacht fielen die Nachboersen-Balken des 31.12. (ET-Abend = 1.1. UTC) in ZWEI
 *  Jahresdateien - einmal als Rand des alten Jahres, einmal als Anfang des neuen. Doppelte
 *  Kerzen in einem append-only-Archiv bekommt man nicht mehr heraus, ohne alles neu zu
 *  holen. Die Grenzen stossen deshalb genau aneinander: bis(j) + 1 === von(j+1). */
function jahrGrenzen(jahr) {
  return { von: M.nyNachUtc(jahr, 1, 1, 0, 0), bis: M.nyNachUtc(jahr + 1, 1, 1, 0, 0) - 1 };
}

/* Der Gratis-Tarif verweigert die JUENGSTEN SIP-Daten - gemessen 03.09.2026, HTTP 403
 * "subscription does not permit querying recent SIP data", und zwar fuer die ganze
 * Anfrage, nicht nur fuer die letzten Balken: ein Abruf mit end=heute liefert NICHTS.
 * Der Nachholer lief nie hinein, weil er nur alte cap-Bereiche anfragte. Jede Anfrage
 * wird deshalb hinten gekappt. 30 statt der noetigen 15 Minuten, weil in dem Fenster
 * ausserdem noch Balken nachkorrigiert werden. */
var SIP_ABSTAND_MS = 30 * 60 * 1000;
function abrufEnde(bis, jetzt) {
  return Math.min(bis, (jetzt || Date.now()) - SIP_ABSTAND_MS);
}
/** Ein Jahr ist ABGESCHLOSSEN, wenn es vorbei ist. Das laufende Jahr waechst weiter; seine
 *  Datei ist nach dem Holen nicht falsch, nur noch nicht fertig. Sie wird darum bei einem
 *  Lauf an einem SPAETEREN Tag neu geholt - innerhalb desselben Tages nicht, sonst holte
 *  jeder Neustart das groesste Jahr des ganzen Universums noch einmal. */
function jahrAbgeschlossen(jahr, jetzt) {
  return jahr < Number(etTag(jetzt || Date.now()).slice(0, 4));
}

/** Alpaca-Balken -> Archivkerze [t, schluss, umsatz, hoch, tief, eroeffnung]. */
function kerzeAus(b) {
  var t = Date.parse(b && b.t);
  if (!isFinite(t) || new Date(t).getUTCSeconds() !== 0) return null;
  if (!KQ.kursOk(b.c) || !KQ.kursOk(b.h) || !KQ.kursOk(b.l) || !KQ.kursOk(b.o)) return null;
  var v = typeof b.v === 'number' && isFinite(b.v) && b.v >= 0 ? b.v : 0;
  return [t, b.c, v, b.h, b.l, b.o];
}
/** Die iex-Falle (wiki/datenquellen.md): eine Schnittstelle, die lieber irgendetwas
 *  antwortet als nichts. Was ausserhalb des ANGEFRAGTEN Zeitraums liegt, faellt raus. */
function imZeitraum(kerzen, von, bis) {
  var drin = [], draussen = 0;
  kerzen.forEach(function (k) { if (k[0] >= von && k[0] <= bis) drin.push(k); else draussen++; });
  return { drin: drin, draussen: draussen };
}
var NY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
function etTag(ms) { return NY.format(new Date(ms)); }

/** Sitzung je Kerze aus dem Kalender der Quelle - nicht aus "09:30 bis 16:00" im Kopf.
 *  Halbtage stehen im Kalender mit ihrem eigenen close.
 *
 *  Der vierte Wert 'ausserhalb' ist eine BENANNTE ABWEICHUNG von den drei vorgesehenen:
 *  ein Balken an einem Tag, den der Kalender ueberhaupt nicht als Handelstag fuehrt.
 *  Ihn 'regulaer' zu nennen waere eine Behauptung ueber eine Sitzung, die es nicht gab;
 *  ihn wegzuwerfen widerspraeche "alles sammeln". Er wird also behalten, benannt und
 *  gezaehlt. Ob er ueberhaupt vorkommt, sagt der Testlauf. */
function sitzungJeKerze(kerzen, kal) {
  var grenzen = {};
  function fuer(tagEt) {
    if (grenzen[tagEt] !== undefined) return grenzen[tagEt];
    var e = kal[tagEt];
    if (!e || !e.open || !e.close) return (grenzen[tagEt] = null);
    var p = tagEt.split('-').map(Number), o = e.open.split(':').map(Number), c = e.close.split(':').map(Number);
    return (grenzen[tagEt] = { auf: M.nyNachUtc(p[0], p[1], p[2], o[0], o[1]), zu: M.nyNachUtc(p[0], p[1], p[2], c[0], c[1]) });
  }
  return kerzen.map(function (k) {
    var g = fuer(etTag(k[0]));
    if (!g) return 'ausserhalb';
    if (k[0] < g.auf) return 'vor';
    if (k[0] >= g.zu) return 'nach';
    return 'regulaer';
  });
}
/** Aus "jede Kerze hat eine Sitzung" wieder Bereiche machen - dieselbe Verdichtung wie
 *  bei den Quellen, damit die Huelle nicht so lang wird wie die Reihe. */
function sitzungenVerdichten(serie, jeKerze) {
  var aus = [];
  for (var i = 0; i < serie.length; i++) {
    var s = jeKerze[i], l = aus[aus.length - 1];
    if (l && l.sitzung === s) { l.bis = serie[i][0]; continue; }
    aus.push({ von: serie[i][0], bis: serie[i][0], sitzung: s });
  }
  return aus;
}
/** Balken je Kalendertag zaehlen, getrennt nach Sitzung - Kontrolle 1 im Testlauf. */
function jeTagZaehlen(serie, sitzungen) {
  var z = {};
  serie.forEach(function (k, i) {
    var t = etTag(k[0]);
    var e = z[t] || (z[t] = { regulaer: 0, vor: 0, nach: 0, ausserhalb: 0 });
    e[sitzungen[i]]++;
  });
  return z;
}

/* ---------- Kuerzel-Wiederverwendung ---------- */
/** Die Reihe an einem Schnitt teilen. Alles bis einschliesslich `schnittMs` gehoert zum
 *  Traeger, der Rest zur zweiten Reihe. */
function amSchnittTeilen(kerzen, schnittMs) {
  var erste = [], zweite = [];
  kerzen.forEach(function (k) { (k[0] <= schnittMs ? erste : zweite).push(k); });
  return { erste: erste, zweite: zweite };
}
/** Ist das Kuerzel neu vergeben? Entschieden an den TAGESBALKEN der Quelle (Phase L),
 *  nicht an einer Liste: nach dem Anker muessen Balken kommen UND davor muss eine Stille
 *  von mindestens LUECKE_TAGE Handelstagen liegen. Die zweite Bedingung ist der Schutz
 *  gegen ein falsch gefuehrtes Listendatum: ohne sie wuerde ein Anker, der ein halbes
 *  Jahr zu frueh steht, eine voll laufende Reihe mitten entzweischneiden. */
function neuVergeben(tage, ankerMs) {
  if (!ankerMs || !tage || tage.length < 2) return null;
  var vor = null, nach = null, iNach = -1;
  for (var i = 0; i < tage.length; i++) {
    if (tage[i] <= ankerMs) vor = tage[i];
    else if (nach === null) { nach = tage[i]; iNach = i; }
  }
  if (vor === null || nach === null) return null;
  var luecke = 0;
  for (var j = 0; j < tage.length; j++) if (tage[j] > vor && tage[j] < nach) luecke++;
  /* Handelstage zwischen den beiden Balken: die Quelle liefert nur Tage MIT Handel,
   * also ist die Zahl der fehlenden Tage die Stille. Gemessen wird sie am Abstand in
   * Kalendertagen mal 5/7 - eine Naeherung, die nur eine Schwelle bedienen muss. */
  var stille = Math.round((nach - vor) / 86400000 * 5 / 7) - 1;
  if (stille < LUECKE_TAGE) return null;
  return { schnitt: vor, weiterAb: nach, stilleTage: stille, balkenDanach: tage.length - iNach };
}

/* ---------- Kapitalmassnahmen: welcher Satz traegt einen KURSFAKTOR? ----------
 *
 * GEMESSEN 03.09.2026 (studien/alpaca-vollsammlung-2026-09/probe-massnahmen.js und
 * probe-spinoff-form.js, sieben Abspaltungen 2019-2026):
 *
 *   SPLITS tragen old_rate und new_rate, und new_rate/old_rate IST der Kursfaktor.
 *   Positivkontrolle: MNST forward_split ex 11.08.2026, old_rate 1, new_rate 2 -> 2,000.
 *   Genau der Faktor, den die Skalenreparatur am Vortag unabhaengig aus den Kursen
 *   gemessen hat.
 *
 *   ABSPALTUNGEN tragen source_rate und new_rate - ein STUECKVERHAELTNIS, keinen
 *   Kursfaktor. GE->GEHC 0,33333 (ein GEHC je drei GE), MMM->SOLV 0,25, T->WBD 0,24192,
 *   SPGI->MBGL 1,0. Der gemessene KURSFAKTOR bei SPGI war 1,057 - aus "1 Stueck je
 *   Stueck" nicht ausrechenbar: er haengt am KURS des abgespaltenen Stuecks am
 *   Wirkungstag, nicht an der Stueckzahl.
 *
 * Deshalb gibt faktorAus() bei Abspaltungen null zurueck. Ein Wert mit Abspaltung im
 * Fenster bleibt aus der bereinigten Kopie AUS und wird gelistet - er wird NICHT aus der
 * Rohreihe erraten. Ein Kurssprung von -5 % kann eine Abspaltung sein oder eine
 * Gewinnwarnung; die Rohreihe weiss es nicht. */
function faktorAus(e) {
  if (!e || !/split/.test(String(e._art))) return null;
  var alt = Number(e.old_rate), neu = Number(e.new_rate);
  if (isFinite(alt) && isFinite(neu) && alt > 0 && neu > 0) return neu / alt;
  return null;
}
function datumAus(e) { return (e && (e.ex_date || e.effective_date || e.process_date)) || null; }
/** Der erste Moment des Wirkungstages in UTC. Kerzen DAVOR werden umgerechnet, Kerzen
 *  am Wirkungstag selbst stehen schon auf der neuen Skala. */
function wirkungMs(datum) {
  var p = String(datum).split('-').map(Number);
  if (p.length !== 3 || !isFinite(p[0])) return null;
  return M.nyNachUtc(p[0], p[1], p[2], 0, 0);
}
/** Aus der Massnahmen-Datei die anwendbaren Faktoren und die Luecken.
 *
 *  Der zweite Beutel `gemessen` ist die Liste `gemesseneFaktoren` derselben Datei -
 *  Abspaltungs-Kursfaktoren, die tools/alpaca-abspaltungsfaktor.js aus dem Verhaeltnis
 *  adjustment=all zu adjustment=dividend GEMESSEN hat (Wilhelms Entscheid vom 03.09.2026,
 *  der einzige erlaubte Zweitabruf). Sie stehen bewusst in einer eigenen Liste neben den
 *  Saetzen der Quelle und nicht in ihnen: gemessen und geliefert bleiben unterscheidbar.
 *  Fehlt der Beutel, verhaelt sich diese Funktion wie vorher - eine Abspaltung ohne
 *  gemessenen Faktor ist weiterhin eine Luecke, und der Wert bleibt aus der Kopie. */
function faktorenAus(saetze, gemessen) {
  var an = [], ohne = [];
  var gm = {};
  (gemessen || []).forEach(function (g) {
    if (!g || !g.datum || !(Number(g.kursfaktor) > 0)) return;
    gm[String(g.art) + '|' + String(g.datum)] = g;
  });
  (saetze || []).forEach(function (e) {
    var d = datumAus(e), ms = d ? wirkungMs(d) : null;
    var art = String(e._art || '');
    if (/split/.test(art)) {
      var fk = faktorAus(e);
      if (fk === null || !ms || Math.abs(fk - 1) < 1e-9) { if (fk === null || !ms) ohne.push({ art: art, datum: d, grund: 'kein Faktor oder kein Datum' }); return; }
      an.push({ art: art, datum: d, ms: ms, faktor: fk, herkunft: 'quelle new_rate/old_rate' });
    } else if (/spin/.test(art)) {
      var g = gm[art + '|' + String(d)];
      if (g && ms) {
        var fg = Number(g.kursfaktor);
        /* Ein gemessener Faktor von 1 ist eine Messung, keine Luecke: an dieser Reihe
         * aendert die Abspaltung den Kurs nicht (typisch fuer den ABGESPALTENEN Wert, der
         * den Satz mitgeliefert bekommt). Der Wert bekommt also seine Kopie - nur ohne
         * Rechnung. Dieselbe Schwelle wie beim Split, damit es nicht zwei Regeln gibt. */
        if (Math.abs(fg - 1) >= 1e-9) an.push({ art: art, datum: d, ms: ms, faktor: fg, herkunft: g.herkunft || 'gemessen' });
        return;
      }
      ohne.push({ art: art, datum: d, grund: 'Abspaltung: Quelle liefert nur ein Stueckverhaeltnis, keinen Kursfaktor' });
    }
  });
  an.sort(function (a, b) { return a.ms - b.ms; });
  return { anwendbar: an, ohneFaktor: ohne };
}
/** DIE ABLEITUNG - eine reine Funktion. Kerze vor einer Massnahme: Kurse durch den
 *  kumulierten Faktor, Umsatz mal den Faktor. Kurs x Umsatz bleibt damit der gehandelte
 *  Gegenwert - Yahoo laesst den Umsatz roh und ist danach in sich uneinheitlich
 *  (wiki/datenquellen.md). Mehrere Massnahmen multiplizieren sich. */
function ableiten(serie, faktoren) {
  if (!faktoren || !faktoren.length) return serie.map(function (k) { return k.slice(); });
  var sortiert = faktoren.slice().sort(function (a, b) { return a.ms - b.ms; });
  return serie.map(function (k) {
    var f = 1;
    for (var i = 0; i < sortiert.length; i++) if (k[0] < sortiert[i].ms) f *= sortiert[i].faktor;
    if (f === 1) return k.slice();
    return [k[0], k[1] / f, k[2] * f, k[3] / f, k[4] / f, k[5] / f];
  });
}

/* ---------- Verdichten 1m -> 5m, fuer die Kontrolle gegen Yahoo ----------
 * Die Yahoo-Kerzen im 1m-Archiv reichen nur ~14 Tage zurueck und beginnen NACH dem
 * MNST-Split (18.08. gegen 11.08.). Die Positivkontrolle "roh gegen Yahoo muss vor dem
 * Split Faktor 2 zeigen" ist dort also gar nicht fahrbar. Im 5m-Archiv liegen Yahoo-
 * Kerzen ab 02.06. - 48 Tage vor dem Split, 20 vor der Abspaltung. Also werden die
 * eigenen Minutenbalken auf dasselbe Gitter verdichtet und DORT verglichen. */
function auf5m(serie) {
  var eimer = {};
  serie.forEach(function (k) {
    var t = Math.floor(k[0] / 300000) * 300000;
    var e = eimer[t];
    if (!e) { eimer[t] = [t, k[1], k[2], k[3], k[4], k[5]]; return; }
    e[1] = k[1];                                   /* Schluss = letzte Kerze */
    e[2] += k[2];                                  /* Umsatz = Summe */
    if (k[3] > e[3]) e[3] = k[3];
    if (k[4] < e[4]) e[4] = k[4];
  });
  return Object.keys(eimer).map(Number).sort(function (a, b) { return a - b; }).map(function (t) { return eimer[t]; });
}
function median(a) {
  if (!a.length) return null;
  var s = a.slice().sort(function (x, y) { return x - y; }), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
/** Tagesmedian des Verhaeltnisses eigene/Yahoo an gemeinsamen Stempeln. Das Mass der
 *  Reparatur vom 03.09.: ein Tag ausserhalb 0,999-1,001 ist ein Fund, kein Rauschen. */
function tagesmedian(eigene, yahoo, feld) {
  var Y = {}; yahoo.forEach(function (k) { Y[k[0]] = k; });
  var jeTag = {};
  eigene.forEach(function (k) {
    var y = Y[k[0]];
    if (!y || !(y[feld] > 0) || !(k[feld] > 0)) return;
    (jeTag[etTag(k[0])] || (jeTag[etTag(k[0])] = [])).push(k[feld] / y[feld]);
  });
  var tage = Object.keys(jeTag).sort();
  return { tage: tage.map(function (t) { return { datum: t, median: median(jeTag[t]), paare: jeTag[t].length }; }),
    gesamt: median(tage.reduce(function (a, t) { return a.concat(jeTag[t]); }, [])) };
}
/** Nur die Kerzen einer bestimmten Quelle aus einer Archivdatei. OHNE das waere der
 *  Vergleich eine Tautologie: die 1m/5m-Dateien enthalten seit dem Nachholer selbst
 *  Alpaca-Kerzen - man wuerde Alpaca gegen Alpaca halten und immer bestehen. */
function nurQuelle(huelle, quelle) {
  var jk = KQ.quelleJeKerze(huelle.series, huelle.quellen);
  return huelle.series.filter(function (k, i) { return jk[i] && jk[i].quelle === quelle; });
}

/* ---------- Ringverteilung ---------- */
/** Aufgaben in der Reihenfolge, in der sie gefahren werden: JAHR aussen (absteigend),
 *  Werte innen. Ein Abbruch hinterlaesst damit ein vollstaendiges juengstes Jahr. */
function ringAufgaben(jeSymbol, bisJahr) {
  var jahre = [];
  for (var j = bisJahr; j >= AB_JAHR; j--) jahre.push(j);
  var aus = [];
  jahre.forEach(function (j) {
    Object.keys(jeSymbol).sort().forEach(function (sym) {
      var l = jeSymbol[sym];
      if (l.jahre.indexOf(j) === -1) return;
      aus.push({ key: sym + '|' + j, sym: sym, alpacaSym: l.alpacaSym || sym.replace(/~2$/, ''), jahr: j });
    });
  });
  return aus;
}

/* ================= (3) Universum ================= */
function universumLesen() {
  var u = JSON.parse(fs.readFileSync(UNIVERSUM, 'utf8'));
  var v = JSON.parse(fs.readFileSync(VERSCHWUNDENE, 'utf8'));
  var arten = JSON.parse(fs.readFileSync(ARTEN, 'utf8')).arten;
  var etfSatz = {}; KQ.ETFS.forEach(function (s) { etfSatz[s] = 1; });

  var uSym = u.werte.map(function (x) { return x.sym; });
  var imUniversum = {}; uSym.forEach(function (s) { imUniversum[s] = 1; });

  /* (b) aktienartig = CS oder ADRC, wie ueberall in der Messmaschine (wertpapierart.js).
   * "Seit 2016 gehandelt" wird NICHT hier entschieden - das sagt Phase L aus den Balken
   * selbst. Was hier faellt, ist nur, was schon vor 2016 von der Liste war: dafuer kann
   * es keine Balken ab 2016 geben, und ein Abruf dafuer waere sicher leer. */
  /* DIE LISTE FUEHRT 18 KUERZEL DOPPELT - gemessen 03.09.2026. Es ist keine
   * Kuerzel-Wiederverwendung, sondern derselbe Name zweimal, das Delisting-Datum um
   * hoechstens einen Tag versetzt (AC, ANSC, BACQ, BLDE, CUX, GRYP, HSON, LYRA, ...) -
   * eine Unsauberkeit der Quelle. Ohne Zusammenlegen waere jede Zaehlung um 18 zu hoch
   * und jeder dieser Werte zweimal geholt worden. Behalten wird der Eintrag mit dem
   * SPAETEREN Ende: er laesst dem Traeger alle seine Balken. Faende sich je ein Paar mit
   * verschiedenen NAMEN, waere es echte Wiederverwendung und gehoerte getrennt - deshalb
   * wird das gezaehlt und ausgewiesen, nicht bloss stillschweigend zusammengelegt. */
  var verschwunden = [], vorherRaus = 0, nichtAktie = 0;
  var jeSym = {}, doppelt = 0, doppeltFremderName = [];
  v.eintraege.forEach(function (e) {
    var art = arten[e.sym] || e.art;
    if (art !== 'CS' && art !== 'ADRC') { nichtAktie++; return; }
    if (e.bis && e.bis < '2016-01-01') { vorherRaus++; return; }
    if (imUniversum[e.sym]) return;      /* steht schon in (a) - dieselbe Reihe, nicht zweimal */
    var da = jeSym[e.sym];
    if (da) {
      doppelt++;
      if (String(da.name) !== String(e.name)) doppeltFremderName.push(e.sym + ': ' + da.name + ' | ' + e.name);
      if (!da.bis || (e.bis && e.bis > da.bis)) jeSym[e.sym] = e;
      return;
    }
    jeSym[e.sym] = e;
  });
  Object.keys(jeSym).sort().forEach(function (s) { verschwunden.push(jeSym[s]); });

  /* (c) die 31 ETFs - sie stehen SAEMTLICH schon im eingefrorenen Universum (geprueft,
   * 31 von 31). Die Gruppe ist also eine Kennzeichnung, keine zusaetzliche Menge. */
  var etfs = uSym.filter(function (s) { return etfSatz[s]; });

  /* (d) Krypto: nicht. Eigene Quelle, eigener Ordner, bleibt Yahoo (Entscheid 4). */
  var krypto = uSym.filter(function (s) { return KQ.istKryptoSym(s); });

  var aktien = uSym.filter(function (s) { return !etfSatz[s] && !KQ.istKryptoSym(s); });
  var alle = aktien.concat(etfs).concat(verschwunden.map(function (e) { return e.sym; }));
  var gruppe = {};
  aktien.forEach(function (s) { gruppe[s] = 'universum'; });
  etfs.forEach(function (s) { gruppe[s] = 'etf'; });
  verschwunden.forEach(function (e) { gruppe[e.sym] = 'verschwunden'; });

  /* Ueberschneidung (a) x (b): 258 Werte des eingefrorenen Universums sind seit dem
   * Stichtag verschwunden. Sie sind DIESELBE Reihe, kein zweiter Eintrag - aber ihr
   * Delisting-Datum ist der Anker fuer die Wiederverwendungspruefung. */
  var ueberschneidung = v.eintraege.filter(function (e) {
    var art = arten[e.sym] || e.art;
    return (art === 'CS' || art === 'ADRC') && imUniversum[e.sym];
  });

  return { aktien: aktien, etfs: etfs, verschwunden: verschwunden, krypto: krypto,
    alle: alle, gruppe: gruppe, ueberschneidung: ueberschneidung,
    ausgesiebt: { vorherRaus: vorherRaus, nichtAktie: nichtAktie, doppelteListeneintraege: doppelt, doppeltMitAnderemNamen: doppeltFremderName },
    stichtag: u.stichtag, verschwundenStand: v.stand };
}

/** Anker fuer die Wiederverwendungspruefung: der letzte TAGESBALKEN laut den Tagesdaten
 *  (die Quelle, die der Auftrag nennt), ersatzweise das Delisting-Datum der Liste.
 *  Werte ohne beides sind nicht pruefbar und werden als solche ausgewiesen - eine Luecke,
 *  die man sieht, statt eines stillen "in Ordnung". */
function ankerFuer(sym, eintrag) {
  var p = path.join(TAGESDATEN, sym + '.json');
  if (fs.existsSync(p)) {
    try {
      var d = JSON.parse(fs.readFileSync(p, 'utf8'));
      var s = d.series;
      if (Array.isArray(s) && s.length) return { ms: s[s.length - 1][0], herkunft: 'tagesdaten' };
      if (d.geliefertBis) return { ms: wirkungMs(d.geliefertBis), herkunft: 'tagesdaten-feld' };
    } catch (e) { /* unlesbar = kein Anker */ }
  }
  if (eintrag && eintrag.bis) return { ms: wirkungMs(eintrag.bis), herkunft: 'liste' };
  return { ms: null, herkunft: 'keiner' };
}

/* ================= (4) Fortschritt ================= */
function fortschrittLesen() {
  try { return JSON.parse(fs.readFileSync(FORTSCHRITT, 'utf8')); }
  catch (e) { return { begonnen: new Date().toISOString(), erledigt: {}, laufend: {}, leer: {}, abrufe: 0, wiederholt: 0, fehler: {}, kerzen: 0, bytes: 0 }; }
}
function fortschrittSchreiben(F) {
  F.zuletzt = new Date().toISOString();
  F.abrufe = Z.abrufe; F.wiederholt = Z.wiederholt; F.fehler = Z.fehler;
  fs.mkdirSync(path.dirname(FORTSCHRITT), { recursive: true });
  M.atomarSchreiben(FORTSCHRITT, JSON.stringify(F));
}

/* ================= (5) Kalender ================= */
async function kalenderHolen(vonJahr, bisJahr, f) {
  var alt = null;
  try { alt = JSON.parse(fs.readFileSync(KALENDER, 'utf8')); } catch (e) { alt = null; }
  var a = vonJahr + '-01-01', b = bisJahr + '-12-31';
  if (alt && alt.von <= a && alt.bis >= b && alt.tage) return alt.tage;
  var r = await hole(HANDEL + '/calendar?start=' + a + '&end=' + b, f);
  if (r.status !== 200 || !Array.isArray(r.daten)) throw new Error('Kalender: HTTP ' + r.status + ' ' + S.verdecken(String(r.text).slice(0, 120)));
  var tage = {};
  r.daten.forEach(function (t) { if (t && t.date) tage[t.date] = { open: t.open, close: t.close }; });
  fs.mkdirSync(ROH, { recursive: true });
  M.atomarSchreiben(KALENDER, JSON.stringify({ geholt: new Date().toISOString(), von: a, bis: b, tage: tage }));
  return tage;
}

/* ================= (6) Phase L: Lebenszeit aus den Balken selbst ================= */
/** EIN Abruf je Wert: Tagesbalken 2016-heute. 11 Jahre x 252 Tage = 2.772 Balken, weit
 *  unter den 10.000 einer Seite. Das Ergebnis sagt (i) ob der Wert ueberhaupt vorkommt,
 *  (ii) in welchen JAHREN er Balken hat - nur die werden geholt -, und (iii) wo grosse
 *  Luecken liegen, an denen ein Kuerzel neu vergeben worden sein kann. Der Abruf spart
 *  ein Vielfaches seiner selbst: ohne ihn wuerde jedes der 11 Jahre jedes Werts
 *  angefragt, auch die leeren. */
async function lebenszeitEines(sym, bisJahr, f) {
  var ende = abrufEnde(jahrGrenzen(bisJahr).bis);
  var url = DATEN + '/stocks/bars?symbols=' + encodeURIComponent(sym) + '&timeframe=1Day' +
    '&start=' + AB_JAHR + '-01-01&end=' + encodeURIComponent(new Date(ende).toISOString()) +
    '&limit=' + SEITE + '&feed=sip&adjustment=raw';
  var r = await hole(url, f);
  if (r.status !== 200) return { fehler: 'HTTP ' + r.status + ' ' + String(r.text || '').replace(/\s+/g, ' ').slice(0, 120) };
  var b = (r.daten && r.daten.bars && r.daten.bars[sym]) || [];
  var tage = b.map(function (x) { return Date.parse(x.t); }).filter(function (t) { return isFinite(t); }).sort(function (x, y) { return x - y; });
  if (tage.length < MIND_BALKEN) return { balken: 0, jahre: [] };
  var jeJahr = {};
  tage.forEach(function (t) { var j = Number(etTag(t).slice(0, 4)); jeJahr[j] = (jeJahr[j] || 0) + 1; });
  return { balken: tage.length, erster: tage[0], letzter: tage[tage.length - 1],
    jahre: Object.keys(jeJahr).map(Number).sort(function (a, c) { return a - c; }), tageJeJahr: jeJahr, tage: tage };
}

async function lebenszeit(opt) {
  opt = opt || {};
  var U = opt.universum || universumLesen();
  var bisJahr = opt.bisJahr || new Date().getUTCFullYear();
  var symbole = opt.symbole || U.alle;
  var vorhanden = {};
  try { vorhanden = JSON.parse(fs.readFileSync(LEBENSZEIT, 'utf8')).werte || {}; } catch (e) { vorhanden = {}; }
  var eintragVon = {}; U.verschwunden.forEach(function (e) { eintragVon[e.sym] = e; });
  U.ueberschneidung.forEach(function (e) { if (!eintragVon[e.sym]) eintragVon[e.sym] = e; });

  var neu = 0, leer = 0, fehler = 0, geteilt = 0, i = 0;
  for (var n = 0; n < symbole.length; n++) {
    var sym = symbole[n];
    i++;
    /* Ein FEHLER wird nie als Ergebnis stehen gelassen: er wird beim naechsten Lauf neu
     * versucht. Sonst haette ein einzelner Netzhaenger einen Wert dauerhaft aus dem
     * Archiv geworfen - still, und ohne dass es je wieder jemand bemerkt. */
    if (vorhanden[sym] && !vorhanden[sym].fehler && !opt.neuHolen) continue;
    var r = await lebenszeitEines(sym, bisJahr, opt.fetch);
    if (r.fehler) { vorhanden[sym] = { fehler: r.fehler }; fehler++; }
    else if (!r.balken) { vorhanden[sym] = { balken: 0, jahre: [] }; leer++; }
    else {
      var e = { balken: r.balken, erster: r.erster, letzter: r.letzter, jahre: r.jahre, tageJeJahr: r.tageJeJahr };
      var anker = ankerFuer(sym, eintragVon[sym]);
      e.ankerHerkunft = anker.herkunft;
      if (anker.ms) {
        var nv = neuVergeben(r.tage, anker.ms);
        if (nv) {
          e.wiederverwendet = { schnitt: nv.schnitt, weiterAb: nv.weiterAb, stilleTage: nv.stilleTage, anker: anker.ms, ankerHerkunft: anker.herkunft };
          var j1 = {}, j2 = {};
          r.tage.forEach(function (t) { var j = Number(etTag(t).slice(0, 4)); if (t <= nv.schnitt) j1[j] = 1; else j2[j] = 1; });
          e.jahre = Object.keys(j1).map(Number).sort(function (a, c) { return a - c; });
          vorhanden[sym + '~2'] = { balken: nv.balkenDanach, erster: nv.weiterAb, letzter: r.letzter,
            jahre: Object.keys(j2).map(Number).sort(function (a, c) { return a - c; }),
            zweiteReihe: { von: sym, abMs: nv.weiterAb } };
          geteilt++;
        }
      }
      vorhanden[sym] = e;
      neu++;
    }
    if (i % 200 === 0) {
      M.atomarSchreiben(LEBENSZEIT, JSON.stringify({ stand: new Date().toISOString(), bisJahr: bisJahr, werte: vorhanden }));
      sag('  ' + i + '/' + symbole.length + '  neu ' + neu + '  leer ' + leer + '  Fehler ' + fehler + '  geteilt ' + geteilt + '  Abrufe ' + Z.abrufe);
    }
  }
  fs.mkdirSync(ROH, { recursive: true });
  M.atomarSchreiben(LEBENSZEIT, JSON.stringify({ stand: new Date().toISOString(), bisJahr: bisJahr, werte: vorhanden }));
  protokoll('Lebenszeit: ' + symbole.length + ' angefragt, ' + neu + ' mit Balken, ' + leer + ' leer, ' + fehler + ' Fehler, ' + geteilt + ' geteilt, ' + Z.abrufe + ' Abrufe');
  return { angefragt: symbole.length, mitBalken: neu, leer: leer, fehler: fehler, geteilt: geteilt, werte: vorhanden };
}

/* ================= (7) Phase M: Kapitalmassnahmen ================= */
async function massnahmenEines(sym, bisJahr, f) {
  var alle = [], token = null, seiten = 0;
  do {
    var url = DATEN1 + '/corporate-actions?symbols=' + encodeURIComponent(sym) + '&types=' + MASSNAHME_ARTEN +
      '&start=' + AB_JAHR + '-01-01&end=' + bisJahr + '-12-31&limit=1000' + (token ? '&page_token=' + encodeURIComponent(token) : '');
    var r = await hole(url, f);
    seiten++;
    if (r.status !== 200) return { fehler: 'HTTP ' + r.status + ' ' + String(r.text || '').replace(/\s+/g, ' ').slice(0, 120) };
    var ca = r.daten && r.daten.corporate_actions;
    if (ca && typeof ca === 'object') {
      Object.keys(ca).forEach(function (art) {
        if (Array.isArray(ca[art])) ca[art].forEach(function (e) { alle.push(Object.assign({ _art: art }, e)); });
      });
    }
    token = r.daten ? r.daten.next_page_token : null;
  } while (token && seiten < 50);
  return { saetze: alle, seiten: seiten };
}

async function massnahmen(opt) {
  opt = opt || {};
  var U = opt.universum || universumLesen();
  var bisJahr = opt.bisJahr || new Date().getUTCFullYear();
  var symbole = opt.symbole || U.alle;
  var AB = symbolAbbildung(symbole.concat(symbole.map(function (s) { return s + '~2'; })));
  fs.mkdirSync(MASSNAHMEN, { recursive: true });
  var mit = 0, ohne = 0, fehler = 0, mitSplit = 0, mitSpin = 0, i = 0;
  for (var n = 0; n < symbole.length; n++) {
    var sym = symbole[n]; i++;
    var ziel = path.join(MASSNAHMEN, AB.ab[sym] + '.json');
    if (fs.existsSync(ziel) && !opt.neuHolen) continue;
    /* Ein erneuter Lauf (--neuHolen) holt die Saetze der Quelle neu - er darf aber die
     * GEMESSENEN Abspaltungsfaktoren nicht mitnehmen. Sie kosten je einen Zweitabruf und
     * stehen in keiner Antwort der Quelle; ueberschrieben waeren sie still weg, und die
     * betroffenen Werte fielen wieder aus der bereinigten Kopie, ohne dass es jemandem
     * auffiele. Also vorher lesen und unveraendert wieder hineinschreiben. */
    var vorher = null;
    if (fs.existsSync(ziel)) { try { vorher = JSON.parse(fs.readFileSync(ziel, 'utf8')); } catch (e) { vorher = null; } }
    var gemessenAlt = (vorher && Array.isArray(vorher.gemesseneFaktoren) && vorher.gemesseneFaktoren.length) ? vorher.gemesseneFaktoren : null;
    var r = await massnahmenEines(sym.replace(/~2$/, ''), bisJahr, opt.fetch);
    if (r.fehler) { fehler++; continue; }
    var f = faktorenAus(r.saetze, gemessenAlt);
    if (f.anwendbar.length) mitSplit++;
    if (f.ohneFaktor.some(function (x) { return /spin/.test(x.art); })) mitSpin++;
    if (r.saetze.length) mit++; else ohne++;
    M.atomarSchreiben(ziel, JSON.stringify({ sym: sym, stand: new Date().toISOString(),
      quelle: 'alpaca v1 corporate-actions', von: AB_JAHR + '-01-01', bis: bisJahr + '-12-31',
      saetze: r.saetze, anwendbar: f.anwendbar, ohneFaktor: f.ohneFaktor,
      gemesseneFaktoren: gemessenAlt || undefined }));
    if (i % 200 === 0) sag('  ' + i + '/' + symbole.length + '  mit Massnahmen ' + mit + '  Splits ' + mitSplit + '  Abspaltungen ' + mitSpin + '  Abrufe ' + Z.abrufe);
  }
  protokoll('Massnahmen: ' + symbole.length + ' angefragt, ' + mit + ' mit Saetzen, ' + mitSplit + ' mit Split, ' + mitSpin + ' mit Abspaltung, ' + fehler + ' Fehler');
  return { angefragt: symbole.length, mitSaetzen: mit, ohneSaetze: ohne, mitSplit: mitSplit, mitAbspaltung: mitSpin, fehler: fehler };
}

/* ================= (8) Phase B: die Balken ================= */
/** Ein Symbol-Jahr. Schreibt genau eine Datei, atomar - oder keine. */
async function jahrHolen(a, kal, AB, LZ, opt) {
  opt = opt || {};
  var g = jahrGrenzen(a.jahr), von = g.von, bis = abrufEnde(g.bis);
  if (bis < von) return { ok: true, kerzen: 0, seiten: 0, roh: 0, ausserhalb: 0, ausserhalbLeben: 0, geschrieben: false, kuenftig: true };
  var alle = [], token = null, seiten = 0;
  do {
    var url = DATEN + '/stocks/bars?symbols=' + encodeURIComponent(a.alpacaSym) + '&timeframe=1Min' +
      '&start=' + encodeURIComponent(new Date(von).toISOString()) + '&end=' + encodeURIComponent(new Date(bis).toISOString()) +
      '&limit=' + SEITE + '&feed=sip&adjustment=raw' + (token ? '&page_token=' + encodeURIComponent(token) : '');
    var r = await hole(url, opt.fetch);
    seiten++;
    if (r.status !== 200) return { ok: false, grund: 'HTTP ' + r.status + ' ' + String(r.text || '').replace(/\s+/g, ' ').slice(0, 120), seiten: seiten };
    var b = r.daten && r.daten.bars ? r.daten.bars[a.alpacaSym] : null;
    if (Array.isArray(b)) alle = alle.concat(b);
    token = r.daten ? r.daten.next_page_token : null;
  } while (token && seiten < 500);

  var kerzen = alle.map(kerzeAus).filter(Boolean);
  var iz = imZeitraum(kerzen, von, bis);
  kerzen = iz.drin;

  /* Kuerzel-Wiederverwendung: die Reihe gehoert nur bis zum Schnitt hierher. */
  var lz = LZ[a.sym] || {};
  var vorSchnitt = kerzen.length, ausserhalbLeben = 0;
  if (lz.wiederverwendet) {
    kerzen = amSchnittTeilen(kerzen, lz.wiederverwendet.schnitt).erste;
    ausserhalbLeben += vorSchnitt - kerzen.length;
  } else if (lz.zweiteReihe) {
    var geteilt = amSchnittTeilen(kerzen, lz.zweiteReihe.abMs - 1);
    ausserhalbLeben += geteilt.erste.length;
    kerzen = geteilt.zweite;
  }
  /* Kein Balken ausserhalb der Lebenszeit (Kontrolle 6). Die Lebenszeit kommt aus den
   * TAGESBALKEN derselben Quelle - eine Minutenkerze ausserhalb waere ein Widerspruch
   * der Quelle mit sich selbst und wird gezaehlt, nicht stillschweigend behalten. */
  var raus = 0;
  if (lz.erster && lz.letzter) {
    var tagAnfang = lz.erster - 20 * 3600000, tagEnde = lz.letzter + 28 * 3600000;
    var behalten = [];
    kerzen.forEach(function (k) { if (k[0] >= tagAnfang && k[0] <= tagEnde) behalten.push(k); else raus++; });
    kerzen = behalten;
  }
  kerzen.sort(function (x, y) { return x[0] - y[0]; });

  if (!kerzen.length) return { ok: true, kerzen: 0, seiten: seiten, roh: alle.length, ausserhalb: iz.draussen, ausserhalbLeben: ausserhalbLeben + raus, geschrieben: false };

  var sitz = sitzungJeKerze(kerzen, kal);
  var ordner = path.join(ROH, AB.ab[a.sym] || ordnerName(a.sym));
  fs.mkdirSync(ordner, { recursive: true });
  var ziel = path.join(ordner, a.jahr + '.json');
  var h = KQ.satz(a.sym, '1m', kerzen, {
    quellen: [{ von: kerzen[0][0], bis: kerzen[kerzen.length - 1][0], quelle: 'alpaca' }],
    waehrung: 'USD',
    quelle: 'alpaca v2 stocks/bars, timeframe=1Min, feed=sip, adjustment=raw (Z1c Vollsammlung)',
  });
  /* satz() baut die Huelle mit festem Feldsatz - `sitzungen` und `jahr` werden danach
   * angehaengt. kerzenquelle.js bleibt dabei UNBERUEHRT: das ist App-Code, und dieser
   * Auftrag aendert keinen (die Quellenpflicht prueft satz() trotzdem mit). */
  h.sitzungen = sitzungenVerdichten(kerzen, sitz);
  h.jahr = a.jahr;
  var text = JSON.stringify(h);
  M.atomarSchreiben(ziel, text);
  var z = { regulaer: 0, vor: 0, nach: 0, ausserhalb: 0 };
  sitz.forEach(function (s) { z[s]++; });
  return { ok: true, kerzen: kerzen.length, seiten: seiten, roh: alle.length, ausserhalb: iz.draussen,
    ausserhalbLeben: ausserhalbLeben + raus, bytes: text.length, sitzungen: z, geschrieben: true, pfad: ziel };
}

async function holen(opt) {
  opt = opt || {};
  var U = opt.universum || universumLesen();
  var bisJahr = opt.bisJahr || new Date().getUTCFullYear();
  var LZ = {};
  try { LZ = JSON.parse(fs.readFileSync(LEBENSZEIT, 'utf8')).werte || {}; } catch (e) { LZ = {}; }
  if (!Object.keys(LZ).length) throw new Error('Phase L fehlt: erst --lebenszeit fahren (sie sagt, welche Jahre es ueberhaupt gibt).');

  var jeSymbol = {};
  Object.keys(LZ).forEach(function (sym) {
    var l = LZ[sym];
    if (!l || l.fehler || !l.jahre || !l.jahre.length) return;
    if (opt.symbole && opt.symbole.indexOf(sym) === -1) return;
    var jahre = l.jahre.filter(function (j) { return j >= AB_JAHR && j <= bisJahr && (!opt.nurJahr || j === opt.nurJahr); });
    if (!jahre.length) return;
    jeSymbol[sym] = { jahre: jahre, alpacaSym: sym.replace(/~2$/, '') };
  });
  var aufgaben = ringAufgaben(jeSymbol, bisJahr);
  if (opt.nurAufgaben) aufgaben = aufgaben.filter(function (a) { return opt.nurAufgaben[a.key]; });
  var AB = symbolAbbildung(Object.keys(jeSymbol));
  if (AB.doppelt.length) throw new Error('Ordnernamen nicht eindeutig: ' + AB.doppelt.join(' | '));
  fs.mkdirSync(ROH, { recursive: true });
  /* ERGAENZEN, nicht ersetzen. Ein Lauf mit --symbole kennt nur seine Handvoll Werte;
   * schriebe er die Abbildung neu, waeren nach einem Teillauf 8.000 Zuordnungen weg -
   * und mit ihnen die einzige Stelle, an der "CON_7679a0" wieder zu CON wird. */
  var symAlt = {}, gruppeAlt = {};
  try { var sv = JSON.parse(fs.readFileSync(SYMBOLE, 'utf8')); symAlt = sv.ordner || {}; gruppeAlt = sv.gruppe || {}; } catch (e) { /* erste Fassung */ }
  M.atomarSchreiben(SYMBOLE, JSON.stringify({ stand: new Date().toISOString(),
    gruppe: Object.assign(gruppeAlt, U.gruppe || {}), ordner: Object.assign(symAlt, AB.ab) }));

  var kal = await kalenderHolen(AB_JAHR, bisJahr, opt.fetch);
  var F = fortschrittLesen();
  var heute = etTag(Date.now());
  var offen = aufgaben.filter(function (a) {
    if (F.laufend && F.laufend[a.key]) return true;          /* angefangen = neu holen */
    var e = F.erledigt[a.key];
    if (!e) return true;
    /* Das laufende Jahr ist nie fertig - es waechst. An einem SPAETEREN Tag wird es neu
     * geholt, am selben Tag nicht (sonst holte jeder Neustart das groesste Jahr des
     * ganzen Universums noch einmal). */
    if (!jahrAbgeschlossen(a.jahr) && etTag(Date.parse(e.stand)) !== heute) return true;
    return !e.leer && !fs.existsSync(path.join(ROH, AB.ab[a.sym], a.jahr + '.json'));
  });
  sag('Aufgaben: ' + aufgaben.length + ' gesamt, ' + offen.length + ' offen (' + (aufgaben.length - offen.length) + ' schon fertig).');
  protokoll('Holen beginnt: ' + offen.length + ' offene Aufgaben von ' + aufgaben.length);

  var i = 0, geschrieben = 0, leer = 0, fehler = 0, kerzen = 0, bytes = 0, begonnen = Date.now();
  for (var n = 0; n < offen.length; n++) {
    var a = offen[n]; i++;
    F.laufend = F.laufend || {}; F.laufend[a.key] = new Date().toISOString();
    if (i % 25 === 1) fortschrittSchreiben(F);
    var r;
    try { r = await jahrHolen(a, kal, AB, LZ, opt); }
    catch (e) { r = { ok: false, grund: 'Ausnahme: ' + String(e && e.message).slice(0, 200) }; }
    delete F.laufend[a.key];
    if (!r.ok) {
      fehler++;
      F.erledigt[a.key] = { fehler: r.grund, stand: new Date().toISOString() };
      protokoll('FEHLER ' + a.key + ': ' + r.grund);
    } else {
      F.erledigt[a.key] = { kerzen: r.kerzen, leer: !r.geschrieben, stand: new Date().toISOString() };
      if (r.geschrieben) { geschrieben++; kerzen += r.kerzen; bytes += r.bytes || 0; } else leer++;
    }
    F.kerzen = (F.kerzen || 0) + (r.kerzen || 0);
    F.bytes = (F.bytes || 0) + (r.bytes || 0);
    if (i % 25 === 0 || i === offen.length) {
      fortschrittSchreiben(F);
      var proMin = i / Math.max(1 / 60, (Date.now() - begonnen) / 60000);
      sag('  ' + i + '/' + offen.length + '  Dateien ' + geschrieben + '  leer ' + leer + '  Fehler ' + fehler +
        '  Kerzen ' + kerzen.toLocaleString('de-DE') + '  ' + (bytes / 1e9).toFixed(2) + ' GB' +
        '  ' + proMin.toFixed(0) + ' Aufg/min  Rest ' + ((offen.length - i) / Math.max(0.01, proMin) / 60).toFixed(1) + ' h');
    }
  }
  fortschrittSchreiben(F);
  protokoll('Holen fertig: ' + geschrieben + ' Dateien, ' + kerzen + ' Kerzen, ' + (bytes / 1e9).toFixed(2) + ' GB, ' + fehler + ' Fehler');
  return { aufgaben: aufgaben.length, gefahren: i, geschrieben: geschrieben, leer: leer, fehler: fehler, kerzen: kerzen, bytes: bytes };
}

/* ================= (9) Phase A: die bereinigte Kopie ================= */
/** Rein lokal. Liest (a) und (b), schreibt (c). Kein Netz - das ist der Punkt an Wilhelms
 *  Entscheid: bei einer neuen Massnahme wird nur der betroffene Wert neu abgeleitet,
 *  nichts noch einmal geholt. */
function ableitenLauf(opt) {
  opt = opt || {};
  var symbole;
  try { symbole = fs.readdirSync(ROH).filter(function (n) { return n.charAt(0) !== '_' && fs.statSync(path.join(ROH, n)).isDirectory(); }); }
  catch (e) { return { fehler: 'Kein Rohordner: ' + ROH }; }
  var ordnerZuSym = {};
  try {
    var sm = JSON.parse(fs.readFileSync(SYMBOLE, 'utf8')).ordner;
    Object.keys(sm).forEach(function (s) { ordnerZuSym[sm[s]] = s; });
  } catch (e) { /* dann steht das Symbol im Datei-Rumpf, siehe unten */ }

  var geschrieben = 0, unveraendert = 0, ohneMassnahmen = 0, ausgelassen = [], dateien = 0, fehler = [];
  symbole.forEach(function (ord) {
    if (opt.ordner && opt.ordner.indexOf(ord) === -1) return;
    /* Eine zweite Reihe (<KUERZEL>~2) hat KEINE eigene Massnahmen-Datei: Phase M fragt die
     * Kuerzel des Universums ab, und "AAC~2" ist keins - es ist unsere Bezeichnung fuer
     * die zweite Belegung desselben Kuerzels. Die Quelle liefert die Massnahmen zu AAC
     * ohnehin fuer BEIDE Aeren in einer Antwort, und die Ableitung waehlt nach dem
     * Zeitstempel aus: ein Split der alten Firma von 2018 liegt VOR jeder ~2-Kerze und
     * wirkt auf sie nicht. Also die Datei des Traegers lesen. Ohne diesen Rueckgriff waere
     * jede zweite Reihe still unbereinigt geblieben - "keine Massnahmen-Datei" sieht von
     * aussen genauso aus wie "keine Massnahmen". */
    var mp = path.join(MASSNAHMEN, ord + '.json');
    if (!fs.existsSync(mp) && /~2$/.test(ord)) mp = path.join(MASSNAHMEN, ord.replace(/~2$/, '') + '.json');
    var faktoren = [], luecken = [], symAusMass = null;
    if (fs.existsSync(mp)) {
      try {
        var m = JSON.parse(fs.readFileSync(mp, 'utf8'));
        symAusMass = m.sym || null;
        var f = faktorenAus(m.saetze, m.gemesseneFaktoren);
        faktoren = f.anwendbar; luecken = f.ohneFaktor;
      } catch (e) { fehler.push(ord + ': Massnahmen unlesbar'); return; }
    } else { ohneMassnahmen++; }
    /* Ein Wert mit einer Massnahme OHNE Kursfaktor (Abspaltung) bleibt AUS der
     * bereinigten Kopie - der Auftrag ist ausdruecklich: nicht aus der Rohreihe erraten.
     * Gemeldet wird er unter seinem KUERZEL, nicht unter dem Ordnernamen: "CON_7679a0
     * ausgelassen" findet niemand wieder. Das Kuerzel steht in der Massnahmen-Datei
     * selbst - die einzige Quelle, die hier sicher vorliegt, denn ausgelassen wird nur,
     * wer Massnahmen hat. */
    if (luecken.length) {
      ausgelassen.push({ sym: symAusMass || ordnerZuSym[ord] || ord, ordner: ord,
        grund: luecken[0].grund, art: luecken[0].art, datum: luecken[0].datum });
      return;
    }

    var jahre = fs.readdirSync(path.join(ROH, ord)).filter(function (n) { return /^\d{4}\.json$/.test(n); });
    jahre.forEach(function (jn) {
      var h = KQ.huelleLesen(path.join(ROH, ord, jn));
      if (!h) { fehler.push(ord + '/' + jn + ': unlesbar'); return; }
      dateien++;
      var neu = ableiten(h.series, faktoren);
      var angewandt = faktoren.filter(function (x) { return h.series.length && h.series[0][0] < x.ms; });
      if (!angewandt.length) { unveraendert++; return; }   /* nichts zu bereinigen: keine Kopie noetig */
      var zo = path.join(BEREINIGT, ord);
      fs.mkdirSync(zo, { recursive: true });
      var hb = KQ.satz(h.sym, '1m', neu, {
        quellen: [{ von: neu[0][0], bis: neu[neu.length - 1][0], quelle: 'alpaca', abgeleitet: 'bereinigt' }],
        waehrung: h.waehrung || 'USD',
        quelle: 'abgeleitet aus alpaca1m/' + ord + '/' + jn + ' + alpaca-massnahmen/' + ord + '.json',
      });
      hb.abgeleitet = 'bereinigt';
      hb.jahr = h.jahr;
      hb.sitzungen = h.sitzungen;
      hb.massnahmen = angewandt.map(function (x) { return { art: x.art, datum: x.datum, faktor: x.faktor, herkunft: x.herkunft || null }; });
      M.atomarSchreiben(path.join(zo, jn), JSON.stringify(hb));
      geschrieben++;
    });
  });
  var bericht = { rohOrdner: symbole.length, dateienGelesen: dateien, kopienGeschrieben: geschrieben,
    ohneMassnahmenNoetig: unveraendert, ohneMassnahmendatei: ohneMassnahmen,
    ausgelassen: ausgelassen, fehler: fehler };
  /* DIE LESEREGEL, dort hingeschrieben, wo sie gebraucht wird. Die bereinigte Kopie
   * existiert NUR fuer Symbol-Jahre, an denen sich wirklich etwas aendert - eine
   * byteidentische Zweitschrift von 150 GB waere kein Gewinn, sondern ein zweites Ding,
   * das auseinanderlaufen kann. Wer bereinigte Kurse will, liest also: erst hier, und
   * wo nichts liegt, die Rohdatei. Diese Regel darf nicht nur in einer Uebergabe stehen,
   * die in einem halben Jahr niemand mehr sucht. */
  /* Auch ein TEILLAUF pflegt die Regel - sonst behauptet sie weiter, ein Wert habe keine
   * Kopie, dessen Faktor inzwischen gemessen und dessen Kopie geschrieben ist. Eine Liste,
   * die nur der Vollauf richtigstellt, ist nach dem ersten Teillauf falsch und sieht
   * genauso aus wie vorher. Gekuerzt wird genau um die Ordner, die IM Lauf waren; die
   * uebrigen Eintraege bleiben stehen, denn ueber sie sagt dieser Lauf nichts. */
  fs.mkdirSync(BEREINIGT, { recursive: true });
  var alteRegel = null;
  try { alteRegel = JSON.parse(fs.readFileSync(path.join(BEREINIGT, '_regel.json'), 'utf8')); } catch (e) { alteRegel = null; }
  var ohneKopie = ausgelassen;
  if (opt.ordner && alteRegel && Array.isArray(alteRegel.ohneKopieWeilAbspaltung)) {
    var imLauf = {};
    opt.ordner.forEach(function (o) { imLauf[o] = 1; });
    ohneKopie = alteRegel.ohneKopieWeilAbspaltung.filter(function (x) { return !imLauf[x.ordner]; }).concat(ausgelassen);
  }
  M.atomarSchreiben(path.join(BEREINIGT, '_regel.json'), JSON.stringify({
    stand: new Date().toISOString(),
    leseregel: 'Bereinigte Kurse = diese Datei, falls vorhanden; sonst die gleichnamige unter alpaca1m/. ' +
      'Fehlt sie, weil sich fuer dieses Symbol-Jahr nichts aendert - die Rohdatei IST dann die bereinigte.',
    angewandt: 'Splits (Faktor = new_rate/old_rate aus der Quelle) und Abspaltungen, deren Kursfaktor ' +
      'GEMESSEN wurde (Median adjustment=dividend / adjustment=all ueber 20 Handelstage davor, ' +
      'tools/alpaca-abspaltungsfaktor.js). Kurse geteilt, Umsatz malgenommen. Welcher Faktor woher ' +
      'kommt, steht als "herkunft" in der Kopfzeile jeder Kopie.',
    nichtAngewandt: 'Dividenden (Yahoo bereinigt Intraday nicht um sie) und Abspaltungen, deren Faktor ' +
      '"unklar" blieb - die Quelle liefert dafuer nur ein Stueckverhaeltnis, und die Messung hat ihre ' +
      'Kontrolle nicht bestanden.',
    ohneKopieWeilAbspaltung: ohneKopie,
    zahlenAus: opt.ordner ? 'Teillauf ueber ' + opt.ordner.length + ' Ordner' : 'Vollauf',
    zahlen: bericht,
  }, null, 1));
  protokoll('Ableiten: ' + geschrieben + ' Kopien, ' + ausgelassen.length + ' Werte ausgelassen (kein Kursfaktor)');
  return bericht;
}

/* ================= (9b) Stichprobe: wie gross wird das Archiv WIRKLICH? =================
 *
 * Die Zahl der Abrufe und die Bytes haengen an einer Groesse, die keine Liste kennt:
 * Minutenbalken je Handelstag. Sie schwankt um mehr als das Zehnfache - AAPL hat an
 * jedem Tag alle 390 regulaeren Minuten plus 400 ausserboerslich, ein erloschener
 * Kleinwert vielleicht 30. Eine Schaetzung aus den liquiden Werten des Testlaufs waere
 * um ein Vielfaches zu hoch, denn 5.100 der 8.363 Werte sind verschwundene Kleinwerte.
 *
 * Deshalb wird gezogen statt geraten: n Symbol-Jahre GLEICHVERTEILT aus genau dem Plan,
 * der spaeter gefahren wird, mit fester Saat. Was dabei geholt wird, ist echte Ware und
 * bleibt liegen - die Stichprobe ist ein Stueck der Sammlung, kein Vorlauf. */
function saatZufall(saat) {
  var s = saat >>> 0;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function stichprobeZiehen(aufgaben, n, saat) {
  var w = saatZufall(saat), kopie = aufgaben.slice();
  for (var i = kopie.length - 1; i > 0; i--) { var j = Math.floor(w() * (i + 1)); var h = kopie[i]; kopie[i] = kopie[j]; kopie[j] = h; }
  return kopie.slice(0, Math.min(n, kopie.length));
}

/* ================= (10) Plan und Zaehlung ================= */
/** Ohne Netz: was WIRD geholt, wie viele Abrufe, wie lange, wie viele Bytes.
 *  Liegt Phase L schon vor, wird EXAKT gerechnet (Tage je Symbol-Jahr aus der Quelle);
 *  sonst mit den benannten Annahmen. */
function zaehlen(opt) {
  opt = opt || {};
  var U = opt.universum || universumLesen();
  var bisJahr = opt.bisJahr || new Date().getUTCFullYear();
  var jahre = bisJahr - AB_JAHR + 1;
  var LZ = null;
  try { LZ = JSON.parse(fs.readFileSync(LEBENSZEIT, 'utf8')).werte; } catch (e) { LZ = null; }

  var gruppen = { universum: U.aktien.length, etf: U.etfs.length, verschwunden: U.verschwunden.length };
  var AB = symbolAbbildung(U.alle);
  var aus = { stichtag: U.stichtag, bisJahr: bisJahr, jahre: jahre, gruppen: gruppen,
    werteGesamt: U.alle.length, kryptoAusgelassen: U.krypto.length,
    ueberschneidungUniversumVerschwunden: U.ueberschneidung.length,
    ausgesiebt: U.ausgesiebt, ordnerKollisionen: AB.doppelt,
    sonderOrdner: Object.keys(AB.ab).filter(function (s) { return AB.ab[s] !== s; }).map(function (s) { return s + ' -> ' + AB.ab[s]; }) };

  if (LZ) {
    var symJahre = 0, tage = 0, mitBalken = 0, leer = 0, geteilt = 0;
    Object.keys(LZ).forEach(function (s) {
      var l = LZ[s];
      if (!l || l.fehler) return;
      if (!l.jahre || !l.jahre.length) { leer++; return; }
      mitBalken++;
      if (/~2$/.test(s)) geteilt++;
      l.jahre.forEach(function (j) { if (j >= AB_JAHR && j <= bisJahr) { symJahre++; tage += (l.tageJeJahr && l.tageJeJahr[j]) || 0; } });
    });
    var jeTag = opt.balkenJeTag || 0;
    aus.exakt = { quelle: 'Phase L (Tagesbalken der Quelle)', werteMitBalken: mitBalken, werteOhneBalken: leer,
      zweiteReihen: geteilt, symbolJahre: symJahre, handelstageGesamt: tage };
    if (jeTag) {
      var balken = tage * jeTag;
      var abrufe = symJahre + Math.ceil(balken / SEITE);
      aus.exakt.balkenJeTagAngenommen = jeTag;
      aus.exakt.balken = balken;
      aus.exakt.abrufe = abrufe;
      aus.exakt.stunden = abrufe / RATE_JE_MIN / 60;
      aus.exakt.bytes = balken * (opt.bytesJeKerze || 62);
    }
  } else {
    /* Annahmen, benannt: 11 Jahre Lebenszeit im Schnitt zu 60 %, 252 Handelstage,
     * BALKEN_JE_TAG Minutenbalken je Tag. Die Zahl wird im Testlauf GEMESSEN und
     * ersetzt diese Schaetzung; bis dahin steht sie als Schaetzung da. */
    var symJahre2 = Math.round(U.alle.length * jahre * 0.6);
    var balken2 = symJahre2 * 252 * (opt.balkenJeTag || 130);
    aus.schaetzung = { annahmeLebenszeitAnteil: 0.6, annahmeBalkenJeTag: opt.balkenJeTag || 130,
      symbolJahre: symJahre2, balken: balken2,
      abrufe: symJahre2 + Math.ceil(balken2 / SEITE),
      stunden: (symJahre2 + Math.ceil(balken2 / SEITE)) / RATE_JE_MIN / 60,
      bytes: balken2 * 62,
      hinweis: 'Schaetzung. --lebenszeit macht daraus eine Zaehlung.' };
  }
  aus.phaseL = { abrufe: U.alle.length, stunden: U.alle.length / RATE_JE_MIN / 60 };
  aus.phaseM = { abrufe: U.alle.length, stunden: U.alle.length / RATE_JE_MIN / 60 };
  return aus;
}

/* ================= (11) Kontrollen ueber das Geschriebene ================= */
/** Alle Kontrollen des Auftrags, ueber die tatsaechlich geschriebenen Dateien. Kein Netz. */
function pruefen(opt) {
  opt = opt || {};
  var kal = {};
  try { kal = JSON.parse(fs.readFileSync(KALENDER, 'utf8')).tage || {}; } catch (e) { kal = {}; }
  var LZ = {};
  try { LZ = JSON.parse(fs.readFileSync(LEBENSZEIT, 'utf8')).werte || {}; } catch (e) { LZ = {}; }
  var ordnerZuSym = {};
  try { var sm = JSON.parse(fs.readFileSync(SYMBOLE, 'utf8')).ordner; Object.keys(sm).forEach(function (s) { ordnerZuSym[sm[s]] = s; }); } catch (e) { /* */ }

  var ordner;
  try { ordner = fs.readdirSync(ROH).filter(function (n) { return n.charAt(0) !== '_' && fs.statSync(path.join(ROH, n)).isDirectory(); }); }
  catch (e) { return { fehler: 'Kein Rohordner: ' + ROH }; }
  if (opt.ordner) ordner = ordner.filter(function (o) { return opt.ordner.indexOf(o) >= 0; });

  var K = { balkenJeTag: { tage: 0, regulaerSumme: 0, abweichend: [], halbtage: 0, halbtageOk: 0 },
    stempelIstOeffnung: { gepruefte: 0, verstoesse: 0 },
    ausserhalbLebenszeit: { verstoesse: [] },
    ausserhalbKalender: { kerzen: 0, tage: [] },
    placebo: { feiertageGeprueft: 0, mitRegulaerenBalken: [] },
    dateien: 0, kerzen: 0, bytes: 0 };

  /* Feiertage im gepruegten Zeitraum, aus dem Kalender: Werktage, die der Kalender
   * NICHT fuehrt. Das Placebo: an ihnen darf es keine regulaere Kerze geben. */
  ordner.forEach(function (ord) {
    var jahre = fs.readdirSync(path.join(ROH, ord)).filter(function (n) { return /^\d{4}\.json$/.test(n); });
    jahre.forEach(function (jn) {
      var p = path.join(ROH, ord, jn);
      var h = KQ.huelleLesen(p);
      if (!h) return;
      K.dateien++; K.kerzen += h.series.length; K.bytes += fs.statSync(p).size;
      var sitz = sitzungJeKerze(h.series, kal);
      var jeTag = jeTagZaehlen(h.series, sitz);

      /* Kontrolle 1: Balken je regulaerem Tag. Volltag 390, Halbtag laut Kalender 210. */
      Object.keys(jeTag).forEach(function (t) {
        var e = jeTag[t];
        if (!e.regulaer) return;
        var kt = kal[t];
        if (!kt) { K.placebo.mitRegulaerenBalken.push(ord + ' ' + t + ' (' + e.regulaer + ')'); return; }
        var o = kt.open.split(':').map(Number), c = kt.close.split(':').map(Number);
        var soll = (c[0] * 60 + c[1]) - (o[0] * 60 + o[1]);
        K.balkenJeTag.tage++;
        K.balkenJeTag.regulaerSumme += e.regulaer;
        if (soll < 380) { K.balkenJeTag.halbtage++; if (e.regulaer <= soll) K.balkenJeTag.halbtageOk++; }
        if (e.regulaer > soll) K.balkenJeTag.abweichend.push({ ordner: ord, tag: t, balken: e.regulaer, soll: soll });
      });
      K.ausserhalbKalender.kerzen += Object.keys(jeTag).reduce(function (a, t) { return a + jeTag[t].ausserhalb; }, 0);

      /* Kontrolle: Stempel ist die OEFFNUNG - also Sekunde 0 und auf der Minute. */
      h.series.forEach(function (k) {
        K.stempelIstOeffnung.gepruefte++;
        if (k[0] % 60000 !== 0) K.stempelIstOeffnung.verstoesse++;
      });

      /* Kontrolle 6: kein Balken ausserhalb der Lebenszeit. */
      var sym = h.sym || ordnerZuSym[ord] || ord;
      var lz = LZ[sym];
      if (lz && lz.erster && lz.letzter && h.series.length) {
        if (h.series[0][0] < lz.erster - 20 * 3600000 || h.series[h.series.length - 1][0] > lz.letzter + 28 * 3600000) {
          K.ausserhalbLebenszeit.verstoesse.push(ord + '/' + jn);
        }
      }
    });
  });

  /* Placebo genauer: die Feiertage des Zeitraums nennen. */
  var jahreGesehen = {};
  ordner.forEach(function (ord) {
    fs.readdirSync(path.join(ROH, ord)).forEach(function (n) { var m = /^(\d{4})\.json$/.exec(n); if (m) jahreGesehen[m[1]] = 1; });
  });
  Object.keys(jahreGesehen).forEach(function (j) {
    for (var d = new Date(Date.UTC(Number(j), 0, 1)); d.getUTCFullYear() === Number(j); d = new Date(d.getTime() + 86400000)) {
      var wt = d.getUTCDay();
      if (wt === 0 || wt === 6) continue;
      var t = d.toISOString().slice(0, 10);
      if (!kal[t]) K.placebo.feiertageGeprueft++;
    }
  });
  return K;
}

/** Der Vergleich gegen das Yahoo-Archiv - die Kontrolle, dass die Quelle stimmt.
 *  Verglichen wird ausschliesslich gegen Kerzen mit Quelle 'yahoo': die 1m/5m-Dateien
 *  enthalten seit dem Nachholer selbst Alpaca-Kerzen, und Alpaca gegen Alpaca zu halten
 *  waere eine Tautologie, die immer besteht. */
function gegenYahoo(sym, opt) {
  opt = opt || {};
  var ordner = ordnerName(sym);
  var teile = [];
  var od = path.join(ROH, ordner);
  if (!fs.existsSync(od)) return { fehler: 'nicht gesammelt: ' + od };
  fs.readdirSync(od).filter(function (n) { return /^\d{4}\.json$/.test(n); }).forEach(function (n) {
    var h = KQ.huelleLesen(path.join(od, n));
    if (h) teile = teile.concat(h.series);
  });
  teile.sort(function (a, b) { return a[0] - b[0]; });
  var ber = [];
  var bd = path.join(BEREINIGT, ordner);
  if (fs.existsSync(bd)) {
    fs.readdirSync(bd).filter(function (n) { return /^\d{4}\.json$/.test(n); }).forEach(function (n) {
      var h = KQ.huelleLesen(path.join(bd, n));
      if (h) ber = ber.concat(h.series);
    });
    ber.sort(function (a, b) { return a[0] - b[0]; });
  }
  var aus = { sym: sym, rohKerzen: teile.length, bereinigtKerzen: ber.length, vergleiche: {} };
  [['1m', teile, ber], ['5m', auf5m(teile), ber.length ? auf5m(ber) : []]].forEach(function (p) {
    var iv = p[0];
    var yp = path.join(WURZEL, 'archiv' + iv, 'bars_' + iv + '_' + sym + '.json');
    if (!fs.existsSync(yp)) return;
    var yh = KQ.huelleLesen(yp);
    if (!yh) return;
    var y = nurQuelle(yh, 'yahoo');
    if (!y.length) return;
    var e = { yahooKerzen: y.length };
    e.rohKurs = tagesmedian(p[1], y, 1);
    e.rohUmsatz = tagesmedian(p[1], y, 2);
    if (p[2].length) e.bereinigtKurs = tagesmedian(p[2], y, 1);
    /* Umsatz der bereinigten Kopie wird gegen die ROHE Reihe geprueft, nicht gegen Yahoo:
     * Yahoo laesst den Umsatz roh, die Ableitung rechnet ihn bewusst um. */
    if (p[2].length) e.bereinigtGegenRohUmsatz = tagesmedian(p[2], p[1], 2);
    aus.vergleiche[iv] = e;
  });
  return aus;
}

/* ================= (12) Selbsttest der reinen Bausteine (ohne Netz) ================= */
function kontrolle() {
  var f = 0, n = 0;
  function ok(b, was, zus) { n++; if (!b) { f++; sag('  FEHLT: ' + was + (zus ? '  [' + zus + ']' : '')); } }

  /* A) Ordnernamen */
  ok(ordnerName('AAPL') === 'AAPL', 'A1 gewoehnliches Kuerzel bleibt, wie es ist');
  ok(ordnerName('BRK.B') === 'BRK.B', 'A2 Punkt ist erlaubt');
  ok(ordnerName('CON') !== 'CON' && /^CON_[0-9a-f]{6}$/.test(ordnerName('CON')), 'A3 CON ist ein Geraetename und bekommt einen Stempel', ordnerName('CON'));
  ok(ordnerName('HIw') !== 'HIW' && ordnerName('HIw').toUpperCase() !== ordnerName('HIW').toUpperCase(),
     'A4 HIw und HIW kollidieren auf Windows NICHT mehr', ordnerName('HIw') + ' / ' + ordnerName('HIW'));
  ok(ordnerName('AAPL~2') === 'AAPL~2' && ordnerName('CON~2') === ordnerName('CON') + '~2', 'A5 die zweite Reihe erbt den Ordnernamen der ersten');
  var ab = symbolAbbildung(['HIW', 'HIw', 'KW', 'Kw', 'ADSW', 'ADSw', 'CON', 'BRK.B', 'AAPL']);
  ok(ab.doppelt.length === 0, 'A6 die Abbildung ueber die bekannten Kollisionen ist eindeutig', ab.doppelt.join(' | '));

  /* B) Kerze und iex-Falle */
  ok(kerzeAus({ t: '2026-08-11T13:30:00Z', o: 1, h: 3, l: 0.5, c: 2, v: 10 })[5] === 1, 'B1 [5] ist die Eroeffnung');
  ok(kerzeAus({ t: '2026-08-11T13:30:30Z', o: 1, h: 3, l: 0.5, c: 2, v: 10 }) === null, 'B2 ein Balken auf Sekunde 30 faellt raus');
  var iz = imZeitraum([[100, 1, 1, 1, 1, 1], [500, 1, 1, 1, 1, 1]], 200, 400);
  ok(iz.drin.length === 0 && iz.draussen === 2, 'B3 die iex-Wache wirft, was ausserhalb des angefragten Zeitraums liegt');

  /* C) Sitzung: Kunsttag mit Halbtag */
  var kal = { '2026-11-27': { open: '09:30', close: '13:00' }, '2026-11-26': null };
  var t930 = M.nyNachUtc(2026, 11, 27, 9, 30), t8 = M.nyNachUtc(2026, 11, 27, 8, 0), t14 = M.nyNachUtc(2026, 11, 27, 14, 0);
  var kk = [[t8, 1, 1, 1, 1, 1], [t930, 1, 1, 1, 1, 1], [t14, 1, 1, 1, 1, 1]];
  var sz = sitzungJeKerze(kk, kal);
  ok(sz[0] === 'vor' && sz[1] === 'regulaer' && sz[2] === 'nach',
     'C1 Halbtag: 08:00 vor, 09:30 regulaer, 14:00 NACH (Schluss 13:00 laut Kalender, nicht 16:00)', sz.join(','));
  var szLeer = sitzungJeKerze([[M.nyNachUtc(2026, 7, 4, 12, 0), 1, 1, 1, 1, 1]], kal);
  ok(szLeer[0] === 'ausserhalb', 'C2 ein Balken an einem Tag ohne Sitzung heisst "ausserhalb", nicht "regulaer"');
  var ber = sitzungenVerdichten(kk, sz);
  ok(ber.length === 3 && ber[0].sitzung === 'vor' && ber[2].von === t14, 'C3 die Sitzungen werden zu Bereichen verdichtet');
  var ber2 = sitzungenVerdichten([[1, 0, 0, 0, 0, 0], [2, 0, 0, 0, 0, 0], [3, 0, 0, 0, 0, 0]], ['vor', 'vor', 'nach']);
  ok(ber2.length === 2 && ber2[0].von === 1 && ber2[0].bis === 2, 'C4 gleiche Sitzungen werden zusammengefasst');

  /* D) Kapitalmassnahmen: der gemessene Befund als Klinke */
  ok(faktorAus({ _art: 'forward_splits', old_rate: 1, new_rate: 2 }) === 2, 'D1 Split 2:1 gibt Faktor 2 (MNST, gemessen)');
  ok(faktorAus({ _art: 'reverse_splits', old_rate: 10, new_rate: 1 }) === 0.1, 'D2 Zusammenlegung 1:10 gibt Faktor 0,1');
  ok(faktorAus({ _art: 'spin_offs', source_rate: 1, new_rate: 1, ex_date: '2026-07-01' }) === null,
     'D3 eine ABSPALTUNG gibt KEINEN Faktor - source_rate/new_rate ist ein Stueckverhaeltnis (gemessen an 7 Faellen)');
  ok(faktorAus({ _art: 'cash_dividends', rate: 0.97 }) === null, 'D4 eine Dividende gibt keinen Faktor - Yahoo bereinigt Intraday nicht um Dividenden');
  var fa = faktorenAus([{ _art: 'forward_splits', old_rate: 1, new_rate: 2, ex_date: '2026-08-11' },
    { _art: 'spin_offs', source_rate: 1, new_rate: 1, ex_date: '2026-07-01' },
    { _art: 'cash_dividends', rate: 0.97, ex_date: '2026-02-25' }]);
  ok(fa.anwendbar.length === 1 && fa.ohneFaktor.length === 1,
     'D5 aus MNST+SPGI-artigen Saetzen bleibt genau ein anwendbarer Faktor und eine benannte Luecke');

  /* E) DIE ABLEITUNG - Kunstreihe, die Klinke aus dem Auftrag */
  var exSplit = wirkungMs('2026-08-11');
  var kunst = [[exSplit - 86400000, 100, 1000, 110, 90, 95], [exSplit + 3600000, 50, 2000, 55, 45, 48]];
  var nachSplit = ableiten(kunst, [{ art: 'forward_splits', datum: '2026-08-11', ms: exSplit, faktor: 2 }]);
  ok(nachSplit[0][1] === 50 && nachSplit[0][3] === 55 && nachSplit[0][4] === 45 && nachSplit[0][5] === 47.5,
     'E1 Split 2:1 - die Kurse DAVOR sind halbiert', JSON.stringify(nachSplit[0]));
  ok(nachSplit[0][2] === 2000, 'E2 und der Umsatz davor ist VERDOPPELT (Kurs x Umsatz bleibt der Gegenwert)');
  ok(nachSplit[1][1] === 50 && nachSplit[1][2] === 2000, 'E3 die Kerze am Wirkungstag bleibt unberuehrt');
  ok(Math.abs(nachSplit[0][1] * nachSplit[0][2] - kunst[0][1] * kunst[0][2]) < 1e-6,
     'E4 Kurs x Umsatz ist vor und nach der Ableitung dieselbe Zahl');
  var exSpin = wirkungMs('2026-07-01');
  var kunst2 = [[exSpin - 86400000, 105.7, 1000, 105.7, 105.7, 105.7], [exSpin + 3600000, 100, 1000, 100, 100, 100]];
  var nachSpin = ableiten(kunst2, [{ art: 'spin_offs', datum: '2026-07-01', ms: exSpin, faktor: 1.057 }]);
  ok(Math.abs(nachSpin[0][1] - 100) < 1e-9 && Math.abs(nachSpin[0][2] - 1057) < 1e-9,
     'E5 Abspaltung mit Faktor 1,057: Kurse davor geteilt, Umsatz mal 1,057', JSON.stringify(nachSpin[0]));
  var zwei = ableiten([[exSpin - 86400000, 200, 100, 200, 200, 200]],
    [{ ms: exSpin, faktor: 1.057 }, { ms: exSplit, faktor: 2 }]);
  ok(Math.abs(zwei[0][1] - 200 / (1.057 * 2)) < 1e-9, 'E6 zwei Massnahmen multiplizieren sich');
  ok(ableiten(kunst, []).every(function (k, i) { return k.every(function (x, j) { return x === kunst[i][j]; }); }),
     'E7 ohne Massnahme ist die Ableitung die Identitaet');

  /* F) Kuerzel-Wiederverwendung */
  var tagA = Date.UTC(2019, 0, 2), tagE = Date.UTC(2019, 9, 7);
  var alteTage = [], t;
  for (t = tagA; t <= tagE; t += 3 * 86400000) alteTage.push(t);
  var neueTage = [];
  for (t = Date.UTC(2022, 5, 1); t <= Date.UTC(2022, 11, 1); t += 3 * 86400000) neueTage.push(t);
  var nv = neuVergeben(alteTage.concat(neueTage), tagE);
  ok(nv && nv.stilleTage > LUECKE_TAGE, 'F1 nach 2,5 Jahren Stille gilt das Kuerzel als neu vergeben',
     nv ? nv.stilleTage + ' Tage still' : 'nichts erkannt');
  /* Der Schnitt liegt auf dem letzten ECHTEN Balken vor dem Anker, nicht auf dem
   * Ankerdatum: das Listendatum ist oft ein Verwaltungsdatum ohne Handel. Wer am
   * Ankerdatum schneidet, laesst die letzten Handelstage in die falsche Reihe fallen. */
  ok(nv && nv.schnitt === alteTage[alteTage.length - 1] && nv.schnitt < tagE,
     'F1b der Schnitt sitzt auf dem letzten wirklich gehandelten Tag, nicht auf dem Ankerdatum',
     nv ? new Date(nv.schnitt).toISOString().slice(0, 10) + ' statt ' + new Date(tagE).toISOString().slice(0, 10) : '-');
  ok(nv && nv.weiterAb === neueTage[0], 'F1c die zweite Reihe beginnt am ersten Balken nach der Stille');
  var laufend = [];
  for (t = Date.UTC(2019, 0, 2); t <= Date.UTC(2022, 11, 1); t += 3 * 86400000) laufend.push(t);
  ok(neuVergeben(laufend, tagE) === null,
     'F2 eine DURCHLAUFENDE Reihe wird von einem falschen Listendatum NICHT zerschnitten (die Luecken-Wache)');
  var gt = amSchnittTeilen([[10, 1, 1, 1, 1, 1], [20, 1, 1, 1, 1, 1], [30, 1, 1, 1, 1, 1]], 20);
  ok(gt.erste.length === 2 && gt.zweite.length === 1, 'F3 der Schnitt teilt einschliesslich');

  /* K) Die Sperre des Gratis-Tarifs auf junge SIP-Daten */
  var jetztK = Date.UTC(2026, 8, 3, 19, 0);
  ok(abrufEnde(Date.UTC(2026, 11, 31), jetztK) === jetztK - SIP_ABSTAND_MS,
     'K1 ein Abruf-Ende in der Zukunft wird auf jetzt minus Abstand gekappt (sonst HTTP 403, gemessen)');
  ok(abrufEnde(Date.UTC(2020, 5, 1), jetztK) === Date.UTC(2020, 5, 1),
     'K2 ein Ende in der Vergangenheit bleibt unangetastet');
  ok(SIP_ABSTAND_MS >= 15 * 60 * 1000, 'K3 der Abstand ist mindestens so gross wie die Sperre der Quelle (15 min)');
  ok(jahrAbgeschlossen(2025, jetztK) && !jahrAbgeschlossen(2026, jetztK),
     'K4 das laufende Jahr gilt nicht als abgeschlossen - seine Datei wird spaeter neu geholt');

  /* J) Jahresgrenzen: sie stossen aneinander, keine Kerze in zwei Dateien */
  var g25 = jahrGrenzen(2025), g26 = jahrGrenzen(2026);
  ok(g25.bis + 1 === g26.von, 'J1 die Jahresgrenzen stossen genau aneinander - keine Kerze faellt in zwei Jahresdateien');
  ok(etTag(g26.von) === '2026-01-01' && etTag(g25.bis) === '2025-12-31',
     'J2 die Grenze ist ET-Mitternacht, nicht UTC-Mitternacht', etTag(g25.bis) + ' | ' + etTag(g26.von));
  ok(etTag(g25.bis - 1) === '2025-12-31' && etTag(g26.von + 1) === '2026-01-01',
     'J3 und ein Balken kurz vor und kurz nach der Grenze landet im richtigen Jahr');

  /* G) Ringverteilung: erst alle Werte des juengsten Jahres */
  var ring = ringAufgaben({ AAA: { jahre: [2024, 2025, 2026] }, BBB: { jahre: [2025, 2026] } }, 2026);
  ok(ring[0].jahr === 2026 && ring[1].jahr === 2026 && ring[2].jahr === 2025,
     'G1 Ringverteilung: erst ALLE Werte 2026, dann 2025', ring.slice(0, 4).map(function (a) { return a.key; }).join(' '));
  ok(ring[ring.length - 1].jahr === 2024, 'G2 das aelteste Jahr steht am Ende');
  ok(ring.length === 5, 'G3 nur Jahre, die es laut Lebenszeit gibt - keine leeren Abrufe', String(ring.length));

  /* H) Verdichtung 1m -> 5m */
  var m1 = [];
  for (var i5 = 0; i5 < 5; i5++) m1.push([Date.UTC(2026, 7, 3, 14, 30 + i5), 10 + i5, 100, 20 + i5, 5 - i5, 9 + i5]);
  var f5 = auf5m(m1);
  ok(f5.length === 1 && f5[0][1] === 14 && f5[0][2] === 500 && f5[0][3] === 24 && f5[0][4] === 1 && f5[0][5] === 9,
     'H1 fuenf Minutenbalken werden ein 5m-Balken: Schluss letzter, Umsatz Summe, Hoch max, Tief min, Eroeffnung erster', JSON.stringify(f5[0]));

  /* I) Tagesmedian */
  var a1 = [[Date.UTC(2026, 7, 3, 14, 30), 100, 10, 0, 0, 0], [Date.UTC(2026, 7, 3, 14, 31), 200, 10, 0, 0, 0]];
  var b1 = [[Date.UTC(2026, 7, 3, 14, 30), 50, 10, 0, 0, 0], [Date.UTC(2026, 7, 3, 14, 31), 100, 10, 0, 0, 0]];
  var tm = tagesmedian(a1, b1, 1);
  ok(tm.tage.length === 1 && tm.tage[0].median === 2, 'I1 Tagesmedian findet den Faktor 2 (die MNST-Positivkontrolle)', JSON.stringify(tm.tage[0]));

  sag((f ? 'KONTROLLE: ' + f + ' von ' + n + ' Zusicherungen GEFALLEN' : 'Kontrolle: alle ' + n + ' Zusicherungen erfuellt'));
  return { zusicherungen: n, gefallen: f };
}

/* ================= (12b) Selbsttest mit SCHREIBEN, in einem Wegwerf-Ordner =================
 *
 * Die Kontrolle oben prueft reine Funktionen. Was sie NICHT pruefen kann: wohin dieses
 * Werkzeug wirklich schreibt, ob die Ringverteilung im echten Lauf gilt und ob ein
 * abgebrochener Symbol-Jahr-Auftrag beim naechsten Start neu geholt wird. Dafuer laeuft
 * hier der ECHTE Pfad - holen(), jahrHolen(), satz(), atomarSchreiben(), ableitenLauf() -
 * nur die Quelle ist erfunden.
 *
 * Der Ordner kommt ueber MD_ALPACA_WURZEL. Zeigt er auf das echte Archiv, verweigert der
 * Selbsttest: er wuerde sonst Kunstkerzen zwischen die echten schreiben.
 *
 * Aufgerufen von test-v6.js (Block 35) in einem KINDPROZESS - anders liesse sich die
 * Wurzel nicht umstellen, sie steht beim Laden der Datei fest. */
function alleDateien(wurzel, vorsatz) {
  var aus = [];
  (function lauf(o, p) {
    fs.readdirSync(o).forEach(function (n) {
      var voll = path.join(o, n);
      if (fs.statSync(voll).isDirectory()) lauf(voll, p + n + '/');
      else aus.push(p + n);
    });
  })(wurzel, vorsatz || '');
  return aus.sort();
}
async function selbsttestSchreiben() {
  if (!/kunst|tmp|temp/i.test(WURZEL)) throw new Error('Selbsttest verweigert: MD_ALPACA_WURZEL zeigt nicht auf einen Wegwerf-Ordner (' + WURZEL + ')');
  fs.mkdirSync(ROH, { recursive: true });
  var jahre = [2024, 2025, 2026];
  /* Kunstkalender: je Jahr ein einziger Handelstag, damit die Reihe klein bleibt. */
  var tage = {};
  jahre.forEach(function (j) { tage[j + '-03-04'] = { open: '09:30', close: '16:00' }; });
  M.atomarSchreiben(KALENDER, JSON.stringify({ geholt: new Date().toISOString(), von: AB_JAHR + '-01-01', bis: '2026-12-31', tage: tage }));
  var lz = { AAA: { balken: 3, jahre: jahre, erster: M.nyNachUtc(2024, 3, 4, 9, 30), letzter: M.nyNachUtc(2026, 3, 4, 16, 0) },
    BBB: { balken: 2, jahre: [2025, 2026], erster: M.nyNachUtc(2025, 3, 4, 9, 30), letzter: M.nyNachUtc(2026, 3, 4, 16, 0) } };
  M.atomarSchreiben(LEBENSZEIT, JSON.stringify({ stand: new Date().toISOString(), bisJahr: 2026, werte: lz }));

  var gefragt = [];
  var kunstFetch = function (url) {
    var sym = /symbols=([^&]+)/.exec(url)[1];
    var von = Date.parse(decodeURIComponent(/start=([^&]+)/.exec(url)[1]));
    var jahr = Number(etTag(von + 86400000).slice(0, 4));
    gefragt.push(sym + '|' + jahr);
    var t0 = M.nyNachUtc(jahr, 3, 4, 10, 0);
    var bars = [{ t: new Date(t0).toISOString(), o: 100, h: 101, l: 99, c: 100, v: 500 },
      { t: new Date(t0 + 60000).toISOString(), o: 100, h: 102, l: 98, c: 101, v: 600 }];
    var rumpf = JSON.stringify({ bars: (function () { var b = {}; b[sym] = bars; return b; })(), next_page_token: null });
    return Promise.resolve({ status: 200, text: function () { return Promise.resolve(rumpf); }, headers: { get: function () { return null; } } });
  };

  var r1 = await holen({ universum: { gruppe: {} }, bisJahr: 2026, fetch: kunstFetch });
  var reihenfolge1 = gefragt.slice();

  /* Abbruch nachstellen: eine fertige Datei loeschen und den Eintrag als "laufend"
   * markieren - beim naechsten Start muss GENAU sie neu geholt werden. */
  fs.unlinkSync(path.join(ROH, 'AAA', '2024.json'));
  var F = fortschrittLesen();
  F.laufend = { 'BBB|2025': new Date().toISOString() };
  fortschrittSchreiben(F);
  gefragt = [];
  var r2 = await holen({ universum: { gruppe: {} }, bisJahr: 2026, fetch: kunstFetch });
  var reihenfolge2 = gefragt.slice();

  /* Ableiten mit einer Kunst-Massnahme: Split 2:1 mit Wirkung 2026-01-01. */
  fs.mkdirSync(MASSNAHMEN, { recursive: true });
  M.atomarSchreiben(path.join(MASSNAHMEN, 'AAA.json'), JSON.stringify({ sym: 'AAA',
    saetze: [{ _art: 'forward_splits', ex_date: '2026-01-01', old_rate: 1, new_rate: 2, symbol: 'AAA' }] }));
  M.atomarSchreiben(path.join(MASSNAHMEN, 'BBB.json'), JSON.stringify({ sym: 'BBB',
    saetze: [{ _art: 'spin_offs', ex_date: '2026-01-01', source_rate: 1, new_rate: 1, source_symbol: 'BBB' }] }));
  /* Eine zweite Reihe ohne eigene Massnahmen-Datei: sie muss die des Traegers benutzen. */
  fs.mkdirSync(path.join(ROH, 'AAA~2'), { recursive: true });
  var zwei = KQ.huelleLesen(path.join(ROH, 'AAA', '2025.json'));
  M.atomarSchreiben(path.join(ROH, 'AAA~2', '2025.json'), JSON.stringify(zwei));
  var r3 = ableitenLauf();
  var zweiBer = KQ.huelleLesen(path.join(BEREINIGT, 'AAA~2', '2025.json'));

  var vorher = KQ.huelleLesen(path.join(ROH, 'AAA', '2025.json'));
  var nachher = KQ.huelleLesen(path.join(BEREINIGT, 'AAA', '2025.json'));
  return { holen1: r1, holen2: r2, ableiten: r3,
    reihenfolge1: reihenfolge1, reihenfolge2: reihenfolge2,
    dateien: alleDateien(WURZEL),
    rohSchluss2025: vorher ? vorher.series[0][1] : null,
    rohUmsatz2025: vorher ? vorher.series[0][2] : null,
    bereinigtSchluss2025: nachher ? nachher.series[0][1] : null,
    bereinigtUmsatz2025: nachher ? nachher.series[0][2] : null,
    bereinigtBBB: fs.existsSync(path.join(BEREINIGT, 'BBB')),
    zweiteReiheBereinigt: zweiBer ? zweiBer.series[0][1] : null };
}

/* ================= (13) Einsprung ================= */
function arg(name, std) { var i = process.argv.indexOf(name); return i >= 0 && process.argv[i + 1] != null ? process.argv[i + 1] : std; }
function hat(name) { return process.argv.indexOf(name) >= 0; }

/* Die zehn Werte des Testlaufs. Fest verdrahtet, damit der Lauf wiederholbar ist:
 * MNST (Split 2:1 im Fenster), SPGI (Abspaltung), ARM (der Wert, an dem die Balken-Probe
 * ihr Kriterium verfehlte), BRK.B (Punkt im Kuerzel), AAPL/MU/ORCL (die Probe-Werte),
 * CON (Windows-Geraetename), HIw (Gross-/Kleinschreibungs-Kollision) und AABA
 * (verschwunden 2019, Kuerzel-Wiederverwendung pruefbar). */
var TESTWERTE = ['MNST', 'SPGI', 'ARM', 'BRK.B', 'AAPL', 'MU', 'ORCL', 'CON', 'HIw', 'AABA'];

async function main() {
  if (hat('--kontrolle')) { var k = kontrolle(); process.exit(k.gefallen ? 1 : 0); }
  if (hat('--selbsttest-schreiben')) { sag(JSON.stringify(await selbsttestSchreiben())); return; }

  if (hat('--zaehlen')) {
    var z = zaehlen({ balkenJeTag: Number(arg('--balken-je-tag', 0)) || undefined });
    sag(JSON.stringify(z, null, 1));
    return;
  }
  if (hat('--ableiten')) {
    var a = ableitenLauf({ ordner: arg('--ordner', null) ? arg('--ordner', '').split(',') : null });
    sag(JSON.stringify(a, null, 1));
    return;
  }
  if (hat('--pruefen')) {
    var p = pruefen({ ordner: arg('--ordner', null) ? arg('--ordner', '').split(',') : null });
    sag(JSON.stringify(p, null, 1));
    (arg('--gegen-yahoo', '') ? arg('--gegen-yahoo', '').split(',') : []).forEach(function (s) {
      sag(JSON.stringify(gegenYahoo(s), null, 1));
    });
    return;
  }

  /* Ab hier braucht es Netz und damit den Zugang. */
  if (!S.vorhanden()) { console.error('Kein Zugang in der Umgebung: ' + S.fehlend().join(', ') + ' fehlt.'); process.exit(2); }
  /* KEINE Verweigerung im Sammelfenster der App - anders als beim Nachholer, und mit
   * Grund. Der Nachholer schrieb IN die Yahoo-Dateien, die der App-Sammler zur selben
   * Zeit anfasst; dort waere ein Zusammentreffen ein Datenschaden. Diese Sammlung
   * schreibt in ein eigenes Archiv (alpaca1m/), das der Sammler nicht kennt - sie stoert
   * ihn nicht und er sie nicht (Auftrag PM 03.09.2026, woertlich: "das stoert nicht,
   * andere Ordner"). Eine Verweigerung waere hier sogar schaedlich: der Vollauf dauert
   * ueber 30 Stunden, und ein Werkzeug, das jede Nacht um 23:30 Ortszeit von selbst
   * stirbt, kaeme nie durch. Geteilt wird nur die RATENGRENZE des Zugangs, und dagegen
   * hilft nicht Abwarten, sondern die auf 170/min gedrosselte Bremse. */
  if (M.imSammelfenster()) sag('Hinweis: 21:30-23:00 UTC sammelt die App - anderer Ordner, kein Zusammenstoss. Die Ratengrenze teilen sich beide, die Bremse steht auf ' + RATE_JE_MIN + '/min.');
  var U = universumLesen();
  var bisJahr = Number(arg('--bis-jahr', 0)) || new Date().getUTCFullYear();

  if (hat('--testlauf')) {
    var jahr = Number(arg('--jahr', 0)) || bisJahr;
    sag('TESTLAUF: ' + TESTWERTE.length + ' Werte, Jahr ' + jahr + '.');
    sag('Phase L (Lebenszeit) ...');
    var rl = await lebenszeit({ universum: U, symbole: TESTWERTE, bisJahr: bisJahr });
    sag('  ' + JSON.stringify({ mitBalken: rl.mitBalken, leer: rl.leer, fehler: rl.fehler, geteilt: rl.geteilt }));
    sag('Phase M (Massnahmen) ...');
    var rm = await massnahmen({ universum: U, symbole: TESTWERTE, bisJahr: bisJahr });
    sag('  ' + JSON.stringify(rm));
    sag('Phase B (Balken) ...');
    var LZt = JSON.parse(fs.readFileSync(LEBENSZEIT, 'utf8')).werte;
    var symT = TESTWERTE.concat(Object.keys(LZt).filter(function (s) { return /~2$/.test(s) && TESTWERTE.indexOf(s.replace(/~2$/, '')) >= 0; }));
    var rb = await holen({ universum: U, symbole: symT, nurJahr: jahr, bisJahr: bisJahr });
    sag('  ' + JSON.stringify(rb));
    sag('Phase A (Ableiten) ...');
    var ra = ableitenLauf();
    sag('  ' + JSON.stringify(ra, null, 1));
    sag('Kontrollen ...');
    var AB = symbolAbbildung(symT);
    var rp = pruefen({ ordner: symT.map(function (s) { return AB.ab[s]; }) });
    sag(JSON.stringify(rp, null, 1));
    ['MNST', 'SPGI', 'ARM', 'BRK.B', 'AAPL'].forEach(function (s) { sag(JSON.stringify(gegenYahoo(s), null, 1)); });
    return;
  }
  if (hat('--stichprobe')) {
    var nS = Number(arg('--stichprobe', 40)) || 40, saatS = Number(arg('--saat', 20260903));
    var LZs = JSON.parse(fs.readFileSync(LEBENSZEIT, 'utf8')).werte;
    var jeSymS = {};
    Object.keys(LZs).forEach(function (s) {
      var l = LZs[s];
      if (!l || l.fehler || !l.jahre || !l.jahre.length) return;
      jeSymS[s] = { jahre: l.jahre.filter(function (j) { return j >= AB_JAHR && j <= bisJahr; }), alpacaSym: s.replace(/~2$/, '') };
    });
    var alleS = ringAufgaben(jeSymS, bisJahr);
    var gezogen = stichprobeZiehen(alleS, nS, saatS);
    var nur = {}; gezogen.forEach(function (a) { nur[a.key] = 1; });
    sag('Stichprobe: ' + gezogen.length + ' von ' + alleS.length + ' Symbol-Jahren, Saat ' + saatS + '.');
    var rs = await holen({ universum: U, bisJahr: bisJahr, nurAufgaben: nur });
    /* Handelstage der gezogenen Symbol-Jahre aus Phase L - der Nenner. */
    var tageS = 0;
    gezogen.forEach(function (a) { var l = LZs[a.sym]; tageS += (l && l.tageJeJahr && l.tageJeJahr[a.jahr]) || 0; });
    var alleTage = 0, alleSymJahre = alleS.length;
    alleS.forEach(function (a) { var l = LZs[a.sym]; alleTage += (l && l.tageJeJahr && l.tageJeJahr[a.jahr]) || 0; });
    var jeTagS = tageS ? rs.kerzen / tageS : 0;
    var balkenGesamt = Math.round(alleTage * jeTagS);
    var bytesJeKerze = rs.kerzen ? rs.bytes / rs.kerzen : 0;
    var abrufeGesamt = alleSymJahre + Math.ceil(balkenGesamt / SEITE);
    var erg = { gezogen: gezogen.length, symbolJahreGesamt: alleSymJahre,
      handelstageStichprobe: tageS, handelstageGesamt: alleTage,
      kerzenStichprobe: rs.kerzen, balkenJeHandelstag: Number(jeTagS.toFixed(1)),
      bytesJeKerze: Number(bytesJeKerze.toFixed(1)),
      hochgerechnet: { balken: balkenGesamt, abrufe: abrufeGesamt,
        stunden: Number((abrufeGesamt / RATE_JE_MIN / 60).toFixed(1)),
        gigabyte: Number((balkenGesamt * bytesJeKerze / 1e9).toFixed(1)) } };
    M.atomarSchreiben(path.join(ROH, '_stichprobe.json'), JSON.stringify(erg, null, 1));
    sag(JSON.stringify(erg, null, 1));
    return;
  }
  if (hat('--lebenszeit')) { sag(JSON.stringify(await lebenszeit({ universum: U, bisJahr: bisJahr, symbole: arg('--symbole', null) ? arg('--symbole', '').split(',') : null }), null, 1).slice(0, 4000)); return; }
  if (hat('--massnahmen')) { sag(JSON.stringify(await massnahmen({ universum: U, bisJahr: bisJahr, symbole: arg('--symbole', null) ? arg('--symbole', '').split(',') : null }), null, 1)); return; }
  if (hat('--holen')) { sag(JSON.stringify(await holen({ universum: U, bisJahr: bisJahr, nurJahr: Number(arg('--jahr', 0)) || null, symbole: arg('--symbole', null) ? arg('--symbole', '').split(',') : null }), null, 1)); return; }

  sag('Kein Modus gewaehlt. Siehe Kopf der Datei.');
}

module.exports = {
  ordnerName: ordnerName, symbolAbbildung: symbolAbbildung, kerzeAus: kerzeAus, imZeitraum: imZeitraum, jahrGrenzen: jahrGrenzen, abrufEnde: abrufEnde, jahrAbgeschlossen: jahrAbgeschlossen,
  sitzungJeKerze: sitzungJeKerze, sitzungenVerdichten: sitzungenVerdichten, jeTagZaehlen: jeTagZaehlen,
  amSchnittTeilen: amSchnittTeilen, neuVergeben: neuVergeben,
  faktorAus: faktorAus, faktorenAus: faktorenAus, datumAus: datumAus, wirkungMs: wirkungMs, ableiten: ableiten,
  auf5m: auf5m, median: median, tagesmedian: tagesmedian, nurQuelle: nurQuelle, ringAufgaben: ringAufgaben,
  universumLesen: universumLesen, ankerFuer: ankerFuer, zaehlen: zaehlen, pruefen: pruefen, gegenYahoo: gegenYahoo,
  ableitenLauf: ableitenLauf, kontrolle: kontrolle, selbsttestSchreiben: selbsttestSchreiben,
  stichprobeZiehen: stichprobeZiehen, saatZufall: saatZufall, lebenszeit: lebenszeit, massnahmen: massnahmen, holen: holen,
  ROH: ROH, BEREINIGT: BEREINIGT, MASSNAHMEN: MASSNAHMEN, FORTSCHRITT: FORTSCHRITT, LEBENSZEIT: LEBENSZEIT,
  AB_JAHR: AB_JAHR, RATE_JE_MIN: RATE_JE_MIN, TESTWERTE: TESTWERTE, LUECKE_TAGE: LUECKE_TAGE,
};
if (require.main === module) main().catch(function (e) { console.error(S.verdecken(String(e && e.stack || e))); process.exit(1); });

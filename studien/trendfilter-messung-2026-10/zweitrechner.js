'use strict';
/*
 * zweitrechner.js — zweiter, unabhängiger Rechner der Messung trendfilter-messung-2026-10/v1 (REGEL.md, Siegel 6f9d06f, §9.1).
 * Simulation mit virtuellem Kapital, keine Anlageberatung.
 *
 * Grundlage: NUR REGEL.md (gelesen beim Bau) und die unveränderten Yahoo-Antworten in daten/<KÜRZEL>.json
 * (v8/finance/chart, interval=1d, events=div,splits). pruefsummen.json dient nur der SHA-256-Probe der Rohdateien
 * und einem Abgleich der Zeilen-/Ausschüttungszahlen. Kein anderer Code dieser Messung wurde gelesen.
 * Eigener Leser, eigene Umrechnung Zeitstempel -> Kalendertag in New York, eigener Gesamtertragsindex, eigene Signale,
 * eigenes Buch. Nur Node-Bordmittel.
 *
 * Aufruf aus der Repo-Wurzel:
 *   node studien/trendfilter-messung-2026-10/zweitrechner.js [--daten <ordner>] [--aus <datei.json>]
 * Vorgabe: --daten = <dieser Ordner>/daten, --aus = <dieser Ordner>/zweitrechner.json
 *
 * Hauptlesart (entscheidet): Geld = BIL, Nicht-US = ACWX, Anleihen = AGG, Handel zur nächsten Eröffnung,
 * 20 Basispunkte je Seite, R3 mit 1-%-Band. Fenster A 04.01.2017–15.09.2021, B 16.09.2021–15.09.2026,
 * je k = 0 im Einzelnen und alle verschobenen Starttage (§5.2), Urteil nach §5.3, Signalfolge 01.12.2016–15.09.2026.
 *
 * LESARTEN offener Stellen (wortgleich in zweitrechner.json unter "lesarten"):
 *  L1  Monatsende am Datenende: Der Kalender endet nach dem Abschneiden am 15.09.2026. Ein Tag ist nur dann
 *      Monatsende (§2.4 "letzter SPY-Handelstag eines Kalendermonats"), wenn der Kalender einen Handelstag des
 *      Folgemonats enthält; der 15.09.2026 ist nicht der letzte Handelstag des Septembers 2026 und daher kein
 *      Monatsende. Wirkung auf die Bücher: keine (eine Ausführung läge nach dem Ende).
 *  L2  Gezahlte Kosten = alle Kosten, die das Buch zahlt, einschließlich Erstkauf (0,002 x gekauftes Volumen
 *      = 100.000 x 0,002 / 1,002). Getrennt ausgewiesen: Erstkauf, Wechsel (Verkaufsseite 0,002 x Stück_alt x O_alt,
 *      Kaufseite 0,002 x Stück_neu x O_neu = 0,002 x Erlös / 1,002). Der Maßstab SPY zahlt nichts (§3.6).
 *  L3  Unter Wasser: Ein Handelstag ist unter Wasser, wenn sein Schlusswert < bisheriger Höchststand
 *      (Startkapital eingeschlossen). Anteil = solche Tage / alle Handelstage von s bis Endtag einschließlich.
 *      Längste Zeit: Kalendertage vom Tag des Höchststands (Starttag für das Startkapital; ein Schluss >= Höchststand
 *      setzt Höchststand und Tag neu) bis zum ersten Tag mit Wert >= Höchststand; gezählt werden nur Strecken mit
 *      mindestens einem Tag unter Wasser; bei gleicher Länge gilt die frühere; ohne Erholung endet sie am Endtag
 *      ("nicht erholt").
 *  L4  Größter Rückschlag = min über t in [s, Endtag] von V(t) / max(100.000, V(s..t)) - 1 auf Tagesschlüssen,
 *      Starttag-Schluss eingeschlossen (§8: Spitze beginnt mit dem Startkapital).
 *  L5  R2 an einem Monatsende nicht berechenbar (TR einer Reihe fehlt an M oder M-12): kein Signal, die zuletzt
 *      vorgeschriebene Reihe gilt weiter. Tritt ab 2009-04 nicht auf (ACWX ab 01.04.2008), also nie in A und B.
 *  L6  R3 Anfangszustand am ersten Tag mit 200 SPY-Schlüssen (Kalenderindex 199, 1993): investiert, wenn C > SMA200;
 *      die Bandregeln gelten ab dem folgenden Handelstag (am ersten Tag wäre ein Bandwechsel ohnehin unmöglich).
 *      SMA200 wird an jedem Tag aus den 200 Schlüssen neu summiert (älteste zuerst), kein gleitender Summenspeicher.
 *  L7  Splits: Yahoo liefert open/close UND die Ausschüttungsbeträge splitbereinigt (BIL 1:2 am 30.11.2017: Schluss
 *      29.11. = 30.11. = 91,48; Ausschüttungen vor und nach dem Split gleich groß). Das Buch rechnet daher ohne
 *      Stückzahl-Anpassung; events.splits wird nur gemeldet und geprüft.
 *  L8  Fehlende Kurse (§3.5): Ersatz je Handelsseite (Eröffnung fehlt -> Schluss desselben Tags). Ist auch der
 *      Schluss weg, wird der ganze Wechsel auf den nächsten Handelstag verschoben (das Buch prüft jeden Tag
 *      "vorgeschrieben != gehalten"). Für den Erstkauf ist "auch Schluss fehlt" nicht ausprogrammiert (Abbruch mit
 *      Meldung). Fehlt der gehaltenen Reihe der Schluss, gilt ihr letzter Schluss. Jeder Ersatz wird gezählt (je
 *      Tag und Reihe einmal).
 *  L9  Cent: Endwert auf den Cent = Number.prototype.toFixed(2) des ungerundeten Gleitkommawerts; der Abstand des
 *      Werts zur nächsten halben-Cent-Grenze wird mitgeliefert (zeigt, ob Gleitkomma-Reihenfolge den Cent kippen kann).
 *  L10 §5.3(b) "Anteil >= 0,70" wird ganzzahlig geprüft (10 x vorn >= 7 x Zahl), ohne Gleitkomma-0,7.
 *  L11 Signalfolge: "ändert sich" = vorgeschriebene Reihe des Signals != der des vorigen Signals (R1/R2: voriges
 *      Monatsende, R3: Zustand nach dem Vortag). Der Stand vor dem 01.12.2016 wird als "anfang" mitgeliefert.
 *      P und SMA10 stehen in der Basis TR_SPY = 1 an der ersten SPY-Zeile (29.01.1993, §2.5).
 *  L12 Ausschüttungen mit Ex-Tag am Endtag werden gutgeschrieben und zum Schluss angelegt (zählen im Endwert);
 *      Ausschüttungen mit Ex-Tag nach dem Endtag des Fensters zählen nicht; alles nach 15.09.2026 ist abgeschnitten.
 *  L13 Tage für p. a. = Endtag - Starttag in Kalendertagen (Date.UTC-Differenz, ohne +1).
 *  L14 Am Starttag kein Wechsel (Erstkauf in die Reihe des letzten Signals vor s, §4.4); ein Wechsel zur Eröffnung
 *      des Endtags zählt mit Kosten; das Signal des Endtags wird nicht mehr ausgeführt.
 *  L15 Anteil der Tage je Reihe = Anteil der Handelstage in [s, Endtag], an deren Schluss die Reihe gehalten wird.
 *      Kalenderjahre: Wert am letzten Fenster-Handelstag des Jahres / Wert am letzten Handelstag des Vorjahres
 *      (erstes Jahr: / 100.000) - 1.
 *  L16 Doppelte Tage in einer Rohantwort: die erste Zeile gilt, die weiteren werden gezählt (kommt nicht vor).
 *      Zeilen ohne gültigen Schluss gehören nicht zum Kalender bzw. nicht zum TR der Reihe (kommt bis 15.09.2026 nicht vor).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ORDNER = __dirname;
const ENDE = '2026-09-15';
const KAPITAL = 100000;
const KOSTEN = 0.002;
const SYMBOLE_ALLE = ['SPY', 'BIL', 'SHY', 'ACWX', 'EFA', 'AGG'];
const REIHEN = ['SPY', 'BIL', 'ACWX', 'AGG'];
const GELD = 'BIL';
const NICHTUS = 'ACWX';
const ANLEIHEN = 'AGG';
const FENSTER = {
  A: { erster: '2017-01-04', grenze: '2017-02-04', ende: '2021-09-15' },
  B: { erster: '2021-09-16', grenze: '2021-10-16', ende: '2026-09-15' },
};
const SIGNAL_VON = '2016-12-01';
const SIGNAL_BIS = '2026-09-15';
const REGELN = ['R1', 'R2', 'R3'];

const LESARTEN = [
  'L1 Monatsende am Datenende: Ein Tag ist nur Monatsende (§2.4), wenn der Kalender einen Handelstag des Folgemonats enthält; der 15.09.2026 (Datenende nach dem Abschneiden) ist nicht der letzte Handelstag des Septembers 2026 und daher kein Monatsende. Wirkung auf die Bücher: keine.',
  'L2 Gezahlte Kosten = alle Kosten des Buchs einschließlich Erstkauf (0,002 x gekauftes Volumen = 100.000 x 0,002/1,002); getrennt ausgewiesen: Erstkauf und Wechsel (Verkaufsseite 0,002 x Stück_alt x O_alt, Kaufseite 0,002 x Stück_neu x O_neu = 0,002 x Erlös/1,002). Der Maßstab SPY zahlt nichts (§3.6).',
  'L3 Unter Wasser: Tag mit Schlusswert < bisheriger Höchststand (Startkapital eingeschlossen); Anteil = solche Tage / alle Handelstage s..Endtag einschließlich. Längste Zeit = Kalendertage vom Tag des Höchststands (Starttag für das Startkapital; ein Schluss >= Höchststand setzt Höchststand und Tag neu) bis zum ersten Tag mit Wert >= Höchststand; nur Strecken mit mindestens einem Tag unter Wasser; bei gleicher Länge die frühere; ohne Erholung Ende am Endtag ("nicht erholt").',
  'L4 Größter Rückschlag = min über t in [s, Endtag] von V(t)/max(100.000, V(s..t)) - 1 auf Tagesschlüssen, Starttag-Schluss eingeschlossen.',
  'L5 R2 nicht berechenbar (TR einer Reihe fehlt an M oder M-12): kein Signal, die zuletzt vorgeschriebene Reihe gilt weiter; tritt ab Monatsende 2009-04 nicht auf, also nie in A und B.',
  'L6 R3 Anfangszustand am ersten Tag mit 200 SPY-Schlüssen (1993) nach C > SMA200; Bandregeln ab dem folgenden Handelstag (am ersten Tag wäre ein Bandwechsel ohnehin unmöglich). SMA200 je Tag neu aus 200 Schlüssen summiert (älteste zuerst).',
  'L7 Splits: Yahoo liefert open/close und die Ausschüttungsbeträge splitbereinigt (BIL 1:2 am 30.11.2017: Schluss vor/nach gleich, Ausschüttungen vor/nach gleich groß); das Buch rechnet ohne Stückzahl-Anpassung, events.splits wird nur gemeldet und geprüft.',
  'L8 Fehlende Kurse (§3.5): Ersatz je Handelsseite (Eröffnung fehlt -> Schluss desselben Tags); fehlt auch der Schluss, wird der ganze Wechsel auf den nächsten Handelstag verschoben; für den Erstkauf ist dieser Doppelfall nicht ausprogrammiert (Abbruch). Fehlender Schluss der gehaltenen Reihe -> letzter Schluss. Gezählt je Tag und Reihe einmal.',
  'L9 Cent = toFixed(2) des ungerundeten Gleitkommawerts; Abstand zur nächsten Halb-Cent-Grenze wird mitgeliefert.',
  'L10 §5.3(b) ganzzahlig geprüft: 10 x vorn >= 7 x Zahl der Starttage.',
  'L11 Signalfolge: "ändert sich" = Reihe des Signals != Reihe des vorigen Signals (R1/R2 voriges Monatsende, R3 Vortag); der Stand vor dem 01.12.2016 steht unter "anfang". P und SMA10 in der Basis TR_SPY = 1 am 29.01.1993 (erste SPY-Zeile, §2.5).',
  'L12 Ausschüttung mit Ex-Tag am Endtag wird gutgeschrieben und zum Schluss angelegt (zählt im Endwert); Ex-Tage nach dem Endtag zählen nicht.',
  'L13 Tage für p. a. = Endtag - Starttag in Kalendertagen (ohne +1).',
  'L14 Am Starttag kein Wechsel (Erstkauf in die Reihe des letzten Signals vor s); ein Wechsel zur Eröffnung des Endtags zählt mit Kosten; das Signal des Endtags wird nicht mehr ausgeführt.',
  'L15 Anteil der Tage je Reihe = Anteil der Handelstage s..Endtag, an deren Schluss die Reihe gehalten wird; Kalenderjahre = Wert am letzten Fenster-Handelstag des Jahres / Wert am letzten Handelstag des Vorjahres (erstes Jahr / 100.000) - 1.',
  'L16 Doppelte Tage in einer Rohantwort: erste Zeile gilt, weitere gezählt; Zeilen ohne gültigen Schluss gehören weder zum Kalender noch zum TR der Reihe (beides kommt bis 15.09.2026 nicht vor).',
];

// ---------------------------------------------------------------- Aufruf
function argWert(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}
const DATEN = argWert('--daten') ? path.resolve(argWert('--daten')) : path.join(ORDNER, 'daten');
const AUS = argWert('--aus') ? path.resolve(argWert('--aus')) : path.join(ORDNER, 'zweitrechner.json');

// ---------------------------------------------------------------- Proben-Sammler
const proben = [];
function probe(name, ok, detail) {
  proben.push({ name, ok: Boolean(ok), detail: detail === undefined ? null : detail });
}

// ---------------------------------------------------------------- Zeit
const NY = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
function nyZeit(ts) {
  const p = {};
  for (const x of NY.formatToParts(new Date(ts * 1000))) p[x.type] = x.value;
  return { tag: p.year + '-' + p.month + '-' + p.day, uhr: p.hour + ':' + p.minute };
}
function utcMs(tag) {
  return Date.UTC(Number(tag.slice(0, 4)), Number(tag.slice(5, 7)) - 1, Number(tag.slice(8, 10)));
}
function tageZwischen(a, b) {
  return Math.round((utcMs(b) - utcMs(a)) / 86400000);
}
function wochentag(tag) {
  return new Date(utcMs(tag)).getUTCDay();
}

// ---------------------------------------------------------------- Leser
function gueltig(x) {
  return typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : null;
}

function lesePruefsummen() {
  const datei = path.join(ORDNER, 'pruefsummen.json');
  if (!fs.existsSync(datei)) return null;
  return JSON.parse(fs.readFileSync(datei, 'utf8'));
}

function lesen(sym, pruef) {
  const datei = path.join(DATEN, sym + '.json');
  const roh = fs.readFileSync(datei);
  const sha = crypto.createHash('sha256').update(roh).digest('hex');
  const erwartet = pruef && pruef.reihen && pruef.reihen[sym] ? pruef.reihen[sym].shaRoh : null;
  const j = JSON.parse(roh.toString('utf8'));
  if (!j.chart || !Array.isArray(j.chart.result) || !j.chart.result[0]) throw new Error(sym + ': keine chart.result[0]');
  const r = j.chart.result[0];
  const q = r.indicators.quote[0];
  const adj = r.indicators.adjclose && r.indicators.adjclose[0] ? r.indicators.adjclose[0].adjclose : null;
  const befund = {
    zeilenRoh: r.timestamp.length, nachEnde: 0, doppelt: 0, wochenende: 0, uhrNicht0930: 0,
    eroeffnungFehlt: 0, schlussFehlt: 0, nichtPositiv: 0, nichtAufsteigend: 0,
  };
  const zeilen = [];
  const idx = new Map();
  let vorTag = '';
  for (let i = 0; i < r.timestamp.length; i++) {
    const z = nyZeit(r.timestamp[i]);
    if (z.tag > ENDE) { befund.nachEnde++; continue; }
    if (z.tag <= vorTag && vorTag !== '') befund.nichtAufsteigend++;
    vorTag = z.tag;
    if (z.uhr !== '09:30') befund.uhrNicht0930++;
    const wt = wochentag(z.tag);
    if (wt === 0 || wt === 6) befund.wochenende++;
    if (q.open[i] == null) befund.eroeffnungFehlt++;
    if (q.close[i] == null) befund.schlussFehlt++;
    if ((q.open[i] != null && !(q.open[i] > 0)) || (q.close[i] != null && !(q.close[i] > 0))) befund.nichtPositiv++;
    if (idx.has(z.tag)) { befund.doppelt++; continue; }
    idx.set(z.tag, zeilen.length);
    zeilen.push({ tag: z.tag, o: gueltig(q.open[i]), c: gueltig(q.close[i]), adj: adj ? gueltig(adj[i]) : null });
  }
  if (befund.nichtAufsteigend > 0) zeilen.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
  const dv = (r.events && r.events.dividends) || {};
  const aussch = [];
  let ausschNachEnde = 0;
  let ausschUhrNicht0930 = 0;
  for (const k of Object.keys(dv)) {
    const x = dv[k];
    if (typeof x.amount !== 'number' || typeof x.date !== 'number') continue;
    const z = nyZeit(x.date);
    if (z.uhr !== '09:30') ausschUhrNicht0930++;
    if (z.tag > ENDE) { ausschNachEnde++; continue; }
    aussch.push({ tag: z.tag, betrag: x.amount });
  }
  aussch.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
  const sp = (r.events && r.events.splits) || {};
  const splits = Object.keys(sp).map((k) => ({
    tag: nyZeit(sp[k].date).tag, zaehler: sp[k].numerator, nenner: sp[k].denominator, text: sp[k].splitRatio,
  })).filter((x) => x.tag <= ENDE);
  return {
    sym, sha, shaErwartet: erwartet, symbolInAntwort: r.meta ? r.meta.symbol : null,
    zeilen, idx, aussch, splits, befund, ausschNachEnde, ausschUhrNicht0930,
  };
}

// ---------------------------------------------------------------- Laden und Kalender
const pruef = lesePruefsummen();
const roh = {};
for (const s of SYMBOLE_ALLE) {
  if (!fs.existsSync(path.join(DATEN, s + '.json'))) {
    if (REIHEN.includes(s)) throw new Error('Rohdatei fehlt: ' + s);
    continue;
  }
  roh[s] = lesen(s, pruef);
  const x = roh[s];
  probe('SHA-256 ' + s + ' = pruefsummen.json', x.shaErwartet !== null && x.sha === x.shaErwartet,
    { sha: x.sha, erwartet: x.shaErwartet });
  probe('Symbol in Antwort ' + s, x.symbolInAntwort === s, x.symbolInAntwort);
  if (pruef && pruef.reihen && pruef.reihen[s]) {
    const p = pruef.reihen[s];
    const eigen = {
      zeilenBisEnde: x.zeilen.length, ersterTag: x.zeilen[0].tag, letzterTagBisEnde: x.zeilen[x.zeilen.length - 1].tag,
      ausschuettungenBisEnde: x.aussch.length,
    };
    const ok = eigen.zeilenBisEnde === p.zeilenBisEnde && eigen.ersterTag === p.ersterTag &&
      eigen.letzterTagBisEnde === p.letzterTagBisEnde && eigen.ausschuettungenBisEnde === p.ausschuettungenBisEnde;
    probe('Zeilen/Ausschüttungen ' + s + ' wie pruefsummen.json', ok, eigen);
  }
  const b = x.befund;
  probe('Rohdaten ' + s + ' sauber bis 15.09.2026 (keine doppelten/Wochenend-Tage, alle 09:30 NY, keine fehlenden/nicht positiven Kurse)',
    b.doppelt === 0 && b.wochenende === 0 && b.uhrNicht0930 === 0 && b.eroeffnungFehlt === 0 && b.schlussFehlt === 0 &&
    b.nichtPositiv === 0 && b.nichtAufsteigend === 0 && x.ausschUhrNicht0930 === 0, b);
}

const kal = roh.SPY.zeilen.filter((z) => z.c !== null).map((z) => z.tag);
const kalIdx = new Map(kal.map((t, i) => [t, i]));
const N = kal.length;

// Monatsenden (L1)
const istMonatsende = new Array(N).fill(false);
const monatsenden = [];
const monatsendeNachMonat = new Map();
for (let i = 0; i + 1 < N; i++) {
  if (kal[i].slice(0, 7) !== kal[i + 1].slice(0, 7)) {
    istMonatsende[i] = true;
    monatsenden.push(i);
    monatsendeNachMonat.set(kal[i].slice(0, 7), i);
  }
}

// Reihen auf den Kalender legen, Gesamtertragsindex §2.5
const R = {};
const zaehler = { ausschVerschobenTR: 0, ausschOhneZeileDanach: 0, ausschAusserhalbKalender: 0, zeilenAusserhalbKalender: 0 };
for (const sym of REIHEN) {
  const x = roh[sym];
  const O = new Array(N).fill(null);
  const C = new Array(N).fill(null);
  const D = new Array(N).fill(0);
  const TR = new Array(N).fill(null);
  const ADJ = new Array(N).fill(null);
  const mitSchluss = x.zeilen.filter((z) => z.c !== null);
  // Ausschüttungen auf Zeilentage legen (Ex-Tag ohne Zeile -> nächste Zeile)
  const dZeile = new Map();
  let j = 0;
  for (const a of x.aussch) {
    while (j < mitSchluss.length && mitSchluss[j].tag < a.tag) j++;
    if (j >= mitSchluss.length) { zaehler.ausschOhneZeileDanach++; continue; }
    if (mitSchluss[j].tag !== a.tag) zaehler.ausschVerschobenTR++;
    const t = mitSchluss[j].tag;
    dZeile.set(t, (dZeile.get(t) || 0) + a.betrag);
  }
  let tr = null;
  let cVor = null;
  for (const z of mitSchluss) {
    const dd = dZeile.get(z.tag) || 0;
    tr = tr === null ? 1 : tr * (z.c + dd) / cVor;
    cVor = z.c;
    const i = kalIdx.get(z.tag);
    if (i === undefined) { zaehler.zeilenAusserhalbKalender++; if (dd) zaehler.ausschAusserhalbKalender++; continue; }
    TR[i] = tr;
    D[i] = dd;
    C[i] = z.c;
    ADJ[i] = z.adj;
  }
  for (const z of x.zeilen) {
    const i = kalIdx.get(z.tag);
    if (i !== undefined) O[i] = z.o;
  }
  R[sym] = { O, C, D, TR, ADJ };
}
probe('Ausschüttungen ohne Zeile am Ex-Tag (§2.5, Erwartung 0)', zaehler.ausschVerschobenTR === 0 && zaehler.ausschOhneZeileDanach === 0, zaehler);
probe('Zeilen der vier Reihen außerhalb des SPY-Kalenders (Erwartung 0)', zaehler.zeilenAusserhalbKalender === 0, zaehler.zeilenAusserhalbKalender);
{
  let luecken = 0;
  const von = kalIdx.get('2015-12-01');
  for (const sym of REIHEN) for (let i = von; i < N; i++) if (R[sym].C[i] === null || R[sym].O[i] === null) luecken++;
  probe('Lücken der vier Reihen gegen den SPY-Kalender 01.12.2015–15.09.2026 (Erwartung 0)', luecken === 0, luecken);
}

// ---------------------------------------------------------------- Signale §4
// R1 Faber
const r1Signal = new Array(N).fill(null);
const r1Daten = new Map();
for (let m = 9; m < monatsenden.length; m++) {
  const i = monatsenden[m];
  const P = R.SPY.TR[i];
  let summe = 0;
  for (let k = m - 9; k <= m; k++) summe += R.SPY.TR[monatsenden[k]];
  const sma10 = summe / 10;
  r1Signal[i] = P > sma10 ? 'SPY' : GELD;
  r1Daten.set(i, { P, SMA10: sma10, abstandRel: P / sma10 - 1 });
}

// R2 GEM
const r2Signal = new Array(N).fill(null);
const r2Daten = new Map();
let r2NichtBerechenbar = 0;
for (const i of monatsenden) {
  const mon = kal[i].slice(0, 7);
  const mon12 = String(Number(mon.slice(0, 4)) - 1) + mon.slice(4);
  const i12 = monatsendeNachMonat.get(mon12);
  const r = {};
  let ok = i12 !== undefined;
  if (ok) {
    for (const sym of ['SPY', GELD, NICHTUS]) {
      const a = R[sym].TR[i];
      const b = R[sym].TR[i12];
      if (a === null || b === null) { ok = false; break; }
      r[sym] = a / b - 1;
    }
  }
  if (!ok) { r2NichtBerechenbar++; continue; }
  let reihe;
  if (r.SPY > r[GELD]) reihe = r.SPY >= r[NICHTUS] ? 'SPY' : NICHTUS;
  else reihe = ANLEIHEN;
  r2Signal[i] = reihe;
  r2Daten.set(i, { monatsende12: kal[i12], rSPY: r.SPY, rBIL: r[GELD], rACWX: r[NICHTUS] });
}

// R3 200 Tage (L6)
const r3Zustand = new Array(N).fill(null); // true = investiert, nach dem Schluss von i
const r3Daten = new Array(N).fill(null);
for (let i = 199; i < N; i++) {
  let summe = 0;
  for (let k = i - 199; k <= i; k++) summe += R.SPY.C[k];
  const sma = summe / 200;
  const c = R.SPY.C[i];
  let z;
  if (i === 199) z = c > sma;
  else if (r3Zustand[i - 1]) z = !(c <= 0.99 * sma);
  else z = c >= 1.01 * sma;
  r3Zustand[i] = z;
  r3Daten[i] = { C: c, SMA200: sma, verhaeltnis: c / sma };
}

// Vorgeschriebene Reihe nach dem Schluss von Tag i (Ziel für i+1)
function sollAusMonatssignal(sig) {
  const soll = new Array(N).fill(null);
  let cur = null;
  for (let i = 0; i < N; i++) {
    if (sig[i] !== null) cur = sig[i];
    soll[i] = cur;
  }
  return soll;
}
const SOLL = {
  R1: sollAusMonatssignal(r1Signal),
  R2: sollAusMonatssignal(r2Signal),
  R3: r3Zustand.map((z) => (z === null ? null : z ? 'SPY' : GELD)),
};

// ---------------------------------------------------------------- Buch §3
function rechneBuch(soll, s, e, satz) {
  const f = { fehlendeKurse: 0, verschobeneWechsel: 0, ersatz: [] };
  const ersatzGezaehlt = new Set();
  function zaehleErsatz(sym, i, art) {
    const k = sym + '|' + i;
    if (ersatzGezaehlt.has(k)) return;
    ersatzGezaehlt.add(k);
    f.fehlendeKurse++;
    f.ersatz.push({ tag: kal[i], reihe: sym, art });
  }
  function handelsPreis(sym, i) {
    if (R[sym].O[i] !== null) return R[sym].O[i];
    zaehleErsatz(sym, i, 'Eröffnung fehlt');
    if (R[sym].C[i] !== null) return R[sym].C[i];
    return null;
  }
  function schluss(sym, i) {
    if (R[sym].C[i] !== null) return R[sym].C[i];
    zaehleErsatz(sym, i, 'Schluss fehlt');
    for (let k = i - 1; k >= 0; k--) if (R[sym].C[k] !== null) return R[sym].C[k];
    throw new Error('kein Schluss für ' + sym + ' vor ' + kal[i]);
  }
  let reihe = soll[s - 1];
  if (reihe === null) throw new Error('kein Signal vor ' + kal[s]);
  const pk0 = handelsPreis(reihe, s);
  if (pk0 === null) throw new Error('Erstkauf ohne Kurs am ' + kal[s] + ' (L8: nicht ausprogrammiert)');
  let stueck = KAPITAL / (pk0 * (1 + satz));
  const kostenErstkauf = stueck * pk0 * satz;
  const startReihe = reihe;
  let kostenWechsel = 0;
  const wechsel = [];
  const werte = new Array(e - s + 1);
  const gehalten = new Array(e - s + 1);
  let vorReihe = null;
  let vorStueck = 0;
  let ausschZahl = 0;
  let ausschSumme = 0;
  for (let i = s; i <= e; i++) {
    if (i > s) {
      const ziel = soll[i - 1];
      if (ziel !== null && ziel !== reihe) {
        const pv = handelsPreis(reihe, i);
        const pk = handelsPreis(ziel, i);
        if (pv !== null && pk !== null) {
          const kostenV = stueck * pv * satz;
          const erloes = stueck * pv * (1 - satz);
          const neu = erloes / (pk * (1 + satz));
          const kostenK = neu * pk * satz;
          kostenWechsel += kostenV + kostenK;
          wechsel.push({ tag: kal[i], signalTag: kal[i - 1], von: reihe, nach: ziel, kosten: kostenV + kostenK });
          reihe = ziel;
          stueck = neu;
        } else {
          f.verschobeneWechsel++;
        }
      }
    }
    const c = schluss(reihe, i);
    if (vorReihe !== null) {
      const d = R[vorReihe].D[i];
      if (d > 0) {
        const betrag = vorStueck * d;
        stueck += betrag / c;
        ausschZahl++;
        ausschSumme += betrag;
      }
    }
    werte[i - s] = stueck * c;
    gehalten[i - s] = reihe;
    vorReihe = reihe;
    vorStueck = stueck;
  }
  return {
    s, e, startReihe, werte, gehalten, wechsel, kostenErstkauf, kostenWechsel, ausschZahl, ausschSumme,
    endwert: werte[werte.length - 1], fehlend: f,
  };
}

// Zweiter Rechenweg (Renditekette), nur ohne fehlende Kurse gültig — Probe gegen das Stückbuch
function kette(soll, s, e, satz) {
  let a = soll[s - 1];
  let v = KAPITAL / (1 + satz) * R[a].C[s] / R[a].O[s];
  for (let i = s + 1; i <= e; i++) {
    const b = soll[i - 1];
    if (b !== a) {
      v = v / R[a].C[i - 1] * (R[a].O[i] * (1 - satz) / (1 + satz) * R[b].C[i] / R[b].O[i] + R[a].D[i]);
      a = b;
    } else {
      v = v * (R[a].C[i] + R[a].D[i]) / R[a].C[i - 1];
    }
  }
  return v;
}

// ---------------------------------------------------------------- Kennzahlen §8
function pa(endwert, tage) { return Math.pow(endwert / KAPITAL, 365.25 / tage) - 1; }
function cent(x) { return x.toFixed(2); }
function centGrenze(x) {
  const y = x * 100;
  return Math.abs(y - Math.floor(y) - 0.5) / 100; // in $: Abstand zur Halb-Cent-Grenze
}
function median(xs) {
  const a = xs.slice().sort((p, q) => p - q);
  const n = a.length;
  return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
}

function kennzahlen(b) {
  const tage = tageZwischen(kal[b.s], kal[b.e]);
  let spitze = KAPITAL;
  let spitzeTag = kal[b.s];
  let maxRs = 0;
  let rsSpitzeTag = kal[b.s];
  let rsTiefTag = null;
  let unterTage = 0;
  let unterSeitSpitze = false;
  let laengste = { tage: 0, von: null, bis: null, erholt: null };
  for (let k = 0; k < b.werte.length; k++) {
    const i = b.s + k;
    const v = b.werte[k];
    if (v >= spitze) {
      if (unterSeitSpitze) {
        const l = tageZwischen(spitzeTag, kal[i]);
        if (l > laengste.tage) laengste = { tage: l, von: spitzeTag, bis: kal[i], erholt: true };
      }
      spitze = v;
      spitzeTag = kal[i];
      unterSeitSpitze = false;
    } else {
      unterSeitSpitze = true;
      unterTage++;
      const rs = v / spitze - 1;
      if (rs < maxRs) { maxRs = rs; rsSpitzeTag = spitzeTag; rsTiefTag = kal[i]; }
    }
  }
  if (unterSeitSpitze) {
    const l = tageZwischen(spitzeTag, kal[b.e]);
    if (l > laengste.tage) laengste = { tage: l, von: spitzeTag, bis: kal[b.e], erholt: false };
  }
  const anteilReihe = {};
  for (const r of b.gehalten) anteilReihe[r] = (anteilReihe[r] || 0) + 1;
  for (const r of Object.keys(anteilReihe)) anteilReihe[r] /= b.gehalten.length;
  const jahre = {};
  let basis = KAPITAL;
  for (let k = 0; k < b.werte.length; k++) {
    const i = b.s + k;
    const letzterDesJahres = k === b.werte.length - 1 || kal[i + 1].slice(0, 4) !== kal[i].slice(0, 4);
    if (letzterDesJahres) {
      jahre[kal[i].slice(0, 4)] = b.werte[k] / basis - 1;
      basis = b.werte[k];
    }
  }
  return {
    endwert: b.endwert,
    endwertCent: cent(b.endwert),
    abstandZurHalbCentGrenzeDollar: centGrenze(b.endwert),
    pa: pa(b.endwert, tage),
    tage,
    groessterRueckschlag: { wert: maxRs, spitzeTag: maxRs < 0 ? rsSpitzeTag : null, tiefTag: rsTiefTag },
    laengsteZeitUnterWasser: laengste,
    handelstage: b.werte.length,
    handelstageUnterWasser: unterTage,
    anteilHandelstageUnterWasser: unterTage / b.werte.length,
    anteilTageJeReihe: anteilReihe,
    kalenderjahre: jahre,
    ausschuettungenGutgeschrieben: b.ausschZahl,
    ausschuettungsSumme: b.ausschSumme,
    fehlendeKurse: b.fehlend.fehlendeKurse,
    verschobeneWechsel: b.fehlend.verschobeneWechsel,
  };
}

// ---------------------------------------------------------------- Fenster rechnen
const SPY_IMMER = new Array(N).fill('SPY');
const ergebnis = { A: null, B: null };
for (const fn of ['A', 'B']) {
  const F = FENSTER[fn];
  const e = kalIdx.get(F.ende);
  const s0 = kalIdx.get(F.erster);
  probe('Fenster ' + fn + ': erster Starttag und Endtag sind SPY-Handelstage', e !== undefined && s0 !== undefined,
    { erster: F.erster, ende: F.ende });
  const starttage = [];
  for (let i = 0; i < N; i++) if (kal[i] >= F.erster && kal[i] < F.grenze) starttage.push(i);
  probe('Fenster ' + fn + ': Zahl der Starttage = 22 (§5.2)', starttage.length === 22, starttage.length);
  probe('Fenster ' + fn + ': k = 0 ist der erste Starttag', starttage[0] === s0, kal[starttage[0]]);

  // Maßstab SPY ohne Kosten, je Starttag
  const spyBuecher = new Map();
  for (const s of starttage) spyBuecher.set(s, rechneBuch(SPY_IMMER, s, e, 0));
  const spy0 = spyBuecher.get(s0);
  const spyK0 = kennzahlen(spy0);

  // Proben am Maßstab
  {
    const immerMitKosten = rechneBuch(SPY_IMMER, s0, e, KOSTEN);
    const rel = immerMitKosten.endwert / (spy0.endwert / 1.002) - 1;
    probe('Fenster ' + fn + ': Regel "immer SPY" mit Kosten = SPY-Endwert x (1/1,002)', Math.abs(rel) < 1e-12,
      { regelImmerSpy: immerMitKosten.endwert, spyMal1durch1002: spy0.endwert / 1.002, relAbweichung: rel });
    const kursertrag = KAPITAL * R.SPY.C[e] / R.SPY.O[s0];
    probe('Fenster ' + fn + ': SPY Gesamtertrag > Kursertrag', spy0.endwert > kursertrag,
      { gesamt: spy0.endwert, kurs: kursertrag });
    let exTage = 0;
    for (let i = s0; i <= e; i++) if (R.SPY.D[i] > 0) exTage++;
    const soll = fn === 'B' ? 20 : 18;
    probe('Fenster ' + fn + ': Zahl der SPY-Ausschüttungen (Ex-Tage s..Endtag) = ' + soll +
      (fn === 'B' ? ' (Auftrag)' : ' (Quartalsrhythmus 03/2017–06/2021)'), exTage === soll && spy0.ausschZahl === soll,
    { exTage, gutgeschrieben: spy0.ausschZahl });
    // TR gegen adjclose (nur Datenprüfung, adjclose geht in keine Rechnung ein)
    const abw = {};
    for (const sym of REIHEN) {
      const t = R[sym].TR[e] / R[sym].TR[s0];
      const a = R[sym].ADJ[e] / R[sym].ADJ[s0];
      abw[sym] = t / a - 1;
    }
    probe('Fenster ' + fn + ': Gesamtertragsindex gegen adjclose je Reihe innerhalb 0,5 % (nur Datenprüfung)',
      Object.values(abw).every((x) => Math.abs(x) < 0.005), abw);
    const kSpy = kette(SPY_IMMER, s0, e, 0);
    probe('Fenster ' + fn + ': SPY Stückbuch = Renditekette (rel. < 1e-9)', Math.abs(kSpy / spy0.endwert - 1) < 1e-9,
      { buch: spy0.endwert, kette: kSpy });
    const ausTR = KAPITAL * R.SPY.C[s0] / R.SPY.O[s0] * R.SPY.TR[e] / R.SPY.TR[s0];
    probe('Fenster ' + fn + ': SPY-Buch = 100.000 x C(s)/O(s) x TR(e)/TR(s) (Buch und Signalindex stimmen überein, rel. < 1e-9)',
      Math.abs(ausTR / spy0.endwert - 1) < 1e-9, { buch: spy0.endwert, ausTR });
  }

  const regeln = {};
  for (const rg of REGELN) {
    const soll = SOLL[rg];
    // k = 0
    const b0 = rechneBuch(soll, s0, e, KOSTEN);
    const kz = kennzahlen(b0);
    const kt = kette(soll, s0, e, KOSTEN);
    probe('Fenster ' + fn + ' ' + rg + ': Stückbuch = Renditekette (rel. < 1e-9)', Math.abs(kt / b0.endwert - 1) < 1e-9,
      { buch: b0.endwert, kette: kt });
    probe('Fenster ' + fn + ' ' + rg + ': fehlende Kurse = 0 (§3.5)', b0.fehlend.fehlendeKurse === 0 && b0.fehlend.verschobeneWechsel === 0,
      b0.fehlend);
    let folgeOk = true;
    let vor = b0.startReihe;
    for (const w of b0.wechsel) {
      if (w.von !== vor) folgeOk = false;
      vor = w.nach;
      const i = kalIdx.get(w.tag);
      if (rg !== 'R3' && !istMonatsende[i - 1]) folgeOk = false;
    }
    probe('Fenster ' + fn + ' ' + rg + ': Wechselfolge schlüssig (von = voriges nach; R1/R2 nur am ersten Handelstag nach Monatsende)', folgeOk);
    const tage = kz.tage;
    const pAbstand = (kz.pa - spyK0.pa) * 100;
    const k0 = {
      start: kal[s0], ende: kal[e], tage, startReihe: b0.startReihe,
      regel: kz, spy: spyK0,
      abstandPp: pAbstand,
      vorn: b0.endwert > spy0.endwert,
      wechsel: b0.wechsel.length,
      wechselJeJahr: b0.wechsel.length / (tage / 365.25),
      wechselListe: b0.wechsel.map((w) => ({ tag: w.tag, signalTag: w.signalTag, von: w.von, nach: w.nach, kosten: w.kosten })),
      kosten: { gesamt: b0.kostenErstkauf + b0.kostenWechsel, erstkauf: b0.kostenErstkauf, wechsel: b0.kostenWechsel },
      fehlendeKurse: b0.fehlend.fehlendeKurse + spy0.fehlend.fehlendeKurse,
      fehlendeKurseRegel: b0.fehlend.fehlendeKurse,
      fehlendeKurseSpy: spy0.fehlend.fehlendeKurse,
    };
    // alle Starttage
    const liste = [];
    for (const s of starttage) {
      const b = s === s0 ? b0 : rechneBuch(soll, s, e, KOSTEN);
      const sp = spyBuecher.get(s);
      const t = tageZwischen(kal[s], kal[e]);
      const kr = s === s0 ? kz : kennzahlen(b);
      const ks = s === s0 ? spyK0 : kennzahlen(sp);
      liste.push({
        start: kal[s], startReihe: b.startReihe,
        regelEndwert: b.endwert, regelEndwertCent: cent(b.endwert),
        spyEndwert: sp.endwert, spyEndwertCent: cent(sp.endwert),
        regelPa: pa(b.endwert, t), spyPa: pa(sp.endwert, t),
        abstandPp: (pa(b.endwert, t) - pa(sp.endwert, t)) * 100,
        vorn: b.endwert > sp.endwert,
        wechsel: b.wechsel.length,
        regelGroessterRueckschlag: kr.groessterRueckschlag.wert,
        spyGroessterRueckschlag: ks.groessterRueckschlag.wert,
        fehlendeKurse: b.fehlend.fehlendeKurse + sp.fehlend.fehlendeKurse,
      });
    }
    const abst = liste.map((x) => x.abstandPp);
    const vornZahl = liste.filter((x) => x.vorn).length;
    const rsR = liste.map((x) => x.regelGroessterRueckschlag);
    const rsS = liste.map((x) => x.spyGroessterRueckschlag);
    const zus = {
      starttage: liste.length,
      vorn: vornZahl,
      anteilVorn: vornZahl / liste.length,
      medianAbstandPp: median(abst),
      minimumAbstandPp: Math.min(...abst),
      maximumAbstandPp: Math.max(...abst),
      spanneGroessterRueckschlagRegel: { min: Math.min(...rsR), max: Math.max(...rsR) },
      spanneGroessterRueckschlagSpy: { min: Math.min(...rsS), max: Math.max(...rsS) },
      fehlendeKurseSumme: liste.reduce((a, x) => a + x.fehlendeKurse, 0),
    };
    probe('Fenster ' + fn + ' ' + rg + ': fehlende Kurse über alle Starttage = 0', zus.fehlendeKurseSumme === 0, zus.fehlendeKurseSumme);
    const bed = {
      a: k0.vorn,
      b: 10 * vornZahl >= 7 * liste.length,
      c: zus.medianAbstandPp > 0,
    };
    regeln[rg] = { k0, starttage: liste, zusammenfassung: zus, bedingungen: bed };
  }
  ergebnis[fn] = {
    erster: F.erster, ende: F.ende, starttageZahl: starttage.length,
    starttage: starttage.map((i) => kal[i]),
    regeln,
  };
}

// ---------------------------------------------------------------- Urteil §5.3
const urteile = {};
const bedText = { a: '(a) beim Start am ersten Tag vorn', b: '(b) in mindestens 70 % der Starttage vorn', c: '(c) Median des Abstands > 0' };
for (const rg of REGELN) {
  const verfehlt = [];
  for (const fn of ['A', 'B']) {
    const b = ergebnis[fn].regeln[rg].bedingungen;
    for (const k of ['a', 'b', 'c']) if (!b[k]) verfehlt.push('Fenster ' + fn + ': ' + bedText[k]);
  }
  urteile[rg] = { urteil: verfehlt.length === 0 ? 'schlägt SPY' : 'schlägt SPY nicht', verfehlt };
}

// ---------------------------------------------------------------- Signalfolge zum Abgleich
const iVon = kal.findIndex((t) => t >= SIGNAL_VON);
const iBis = kalIdx.get(SIGNAL_BIS);
function monatsFolge(sig, daten) {
  let vorI = null;
  for (const i of monatsenden) if (i < iVon && sig[i] !== null) vorI = i;
  const anfang = vorI === null ? null : Object.assign({ monatsende: kal[vorI], reihe: sig[vorI] }, daten.get(vorI));
  const wechsel = [];
  let vor = vorI === null ? null : sig[vorI];
  let knapp = null;
  for (const i of monatsenden) {
    if (i < iVon || i > iBis || sig[i] === null) continue;
    if (sig[i] !== vor) wechsel.push(Object.assign({ monatsende: kal[i], von: vor, nach: sig[i] }, daten.get(i)));
    vor = sig[i];
    const d = daten.get(i);
    const m = d.abstandRel !== undefined ? Math.abs(d.abstandRel)
      : Math.min(Math.abs(d.rSPY - d.rBIL), Math.abs(d.rSPY - d.rACWX));
    if (knapp === null || m < knapp.abstand) knapp = { monatsende: kal[i], abstand: m };
  }
  return { anfang, wechsel, knappsteEntscheidung: knapp };
}
const signale = {
  R1: monatsFolge(r1Signal, r1Daten),
  R2: monatsFolge(r2Signal, r2Daten),
  R3: (() => {
    const z0 = r3Zustand[iVon - 1];
    // nur das Verhältnis C/SMA200 (kein Rohkurs an einem Tag ohne Wechsel)
    const anfang = { tag: kal[iVon - 1], reihe: z0 ? 'SPY' : GELD, verhaeltnis: r3Daten[iVon - 1].verhaeltnis };
    const wechsel = [];
    let knapp = null;
    for (let i = iVon; i <= iBis; i++) {
      if (r3Zustand[i] !== r3Zustand[i - 1]) {
        // nur das Verhältnis C/SMA200, keine Kurse (Daten Dritter, öffentliches Repo)
        wechsel.push({ tag: kal[i], von: r3Zustand[i - 1] ? 'SPY' : GELD, nach: r3Zustand[i] ? 'SPY' : GELD, verhaeltnis: r3Daten[i].verhaeltnis });
      }
      const d = r3Daten[i];
      const schwelle = r3Zustand[i - 1] ? 0.99 * d.SMA200 : 1.01 * d.SMA200;
      const m = Math.abs(d.C / schwelle - 1);
      if (knapp === null || m < knapp.abstand) knapp = { tag: kal[i], abstand: m };
    }
    return { anfang, wechsel, knappsteEntscheidung: knapp };
  })(),
};
for (const rg of REGELN) {
  const k = signale[rg].knappsteEntscheidung;
  probe('Signale ' + rg + ': knappste Entscheidung 12/2016–09/2026 weiter als 1e-9 von der Schwelle (keine Gleitkomma-Kippe)',
    k.abstand > 1e-9, k);
}
probe('R2 an jedem Monatsende ab 12/2016 berechenbar', monatsenden.filter((i) => i >= iVon && i <= iBis).every((i) => r2Signal[i] !== null),
  { nichtBerechenbarGesamtSeit1993: r2NichtBerechenbar });

// Wechsel der Bücher passen zur Signalfolge (k = 0)
for (const fn of ['A', 'B']) {
  for (const rg of REGELN) {
    const k0 = ergebnis[fn].regeln[rg].k0;
    const sigTage = new Set(signale[rg].wechsel.map((w) => w.monatsende || w.tag));
    const ok = k0.wechselListe.every((w) => sigTage.has(w.signalTag));
    probe('Fenster ' + fn + ' ' + rg + ': jeder Buchwechsel hat einen Signalwechsel am Vortag', ok);
  }
}

// Split-Probe BIL (L7)
{
  const b = roh.BIL;
  const sp = b.splits.find((x) => x.tag === '2017-11-30');
  const i = kalIdx.get('2017-11-30');
  const sprung = R.BIL.C[i] / R.BIL.C[i - 1] - 1;
  const vorher = b.aussch.filter((x) => x.tag < '2017-11-30').slice(-3).map((x) => x.betrag);
  const nachher = b.aussch.filter((x) => x.tag >= '2017-11-30').slice(0, 3).map((x) => x.betrag);
  const mv = vorher.reduce((a, x) => a + x, 0) / vorher.length;
  const mn = nachher.reduce((a, x) => a + x, 0) / nachher.length;
  probe('BIL-Split 30.11.2017: Schluss ohne Sprung und Ausschüttungen vor/nach in gleicher Größe (Kurse und Beträge bereinigt)',
    sp !== undefined && Math.abs(sprung) < 0.01 && mn / mv > 0.6 && mn / mv < 1.6,
    { split: sp || null, sprungSchluss: sprung, verhaeltnisAusschNachherZuVorher: mn / mv });
}

// ---------------------------------------------------------------- Auffälligkeiten (berechnet, entscheiden nichts)
const auffaelligkeiten = [];
{
  const b = roh.BIL;
  const jahre = new Set(b.aussch.map((x) => x.tag.slice(0, 4)));
  const ohne = [];
  for (let y = Number(b.zeilen[0].tag.slice(0, 4)) + 1; y <= 2026; y++) if (!jahre.has(String(y))) ohne.push(y);
  auffaelligkeiten.push({ was: 'BIL: Jahre ohne jede Ausschüttung (Nullzins-Zeit)', jahre: ohne });
  const neg = [];
  for (const [i, d] of r2Daten) if (i >= iVon && d.rBIL < 0) neg.push(kal[i]);
  auffaelligkeiten.push({
    was: 'R2: Monatsenden ab 12/2016 mit negativem 12-Monats-Gesamtertrag von BIL (Geld schlägt sich selbst nicht; r_SPY muss nur > r_BIL sein)',
    zahl: neg.length, erstes: neg[0] || null, letztes: neg[neg.length - 1] || null,
  });
  let gleich = 0;
  let n = 0;
  for (let i = iVon; i < N; i++) { n++; if (R.BIL.O[i] === R.BIL.C[i]) gleich++; }
  auffaelligkeiten.push({ was: 'BIL: Anteil der Tage mit Eröffnung = Schluss ab 12/2016 (Kursschritt 1 Cent bei ~91 $, kaum Schwankung)', anteil: gleich / n });
  auffaelligkeiten.push({ was: 'Splits bis 15.09.2026 (Kurse und Beträge bei Yahoo bereinigt, ohne Wirkung auf das Buch, L7)', splits: Object.keys(roh).map((s) => roh[s].splits.map((p) => s + ' ' + p.tag + ' ' + p.text)).flat() });
}

// ---------------------------------------------------------------- Ausgabe
const dateien = {};
for (const s of Object.keys(roh)) {
  const x = roh[s];
  dateien[s] = {
    sha256: x.sha, shaErwartet: x.shaErwartet, shaOk: x.sha === x.shaErwartet,
    zeilenBisEnde: x.zeilen.length, ersterTag: x.zeilen[0].tag, letzterTagBisEnde: x.zeilen[x.zeilen.length - 1].tag,
    zeilenNachEndeAbgeschnitten: x.befund.nachEnde, ausschuettungenBisEnde: x.aussch.length,
    ausschuettungenNachEndeAbgeschnitten: x.ausschNachEnde,
    splitsBisEnde: x.splits.map((p) => p.tag + ' ' + p.text), befund: x.befund,
  };
}

const ausgabe = {
  kennung: 'trendfilter-messung-2026-10/v1',
  rechner: 'zweitrechner (unabhängig, §9.1)',
  regelSiegel: '6f9d06f',
  hinweis: 'Simulation mit virtuellem Kapital, keine Anlageberatung, vor Steuern. Hauptlesart: BIL, ACWX, AGG, nächste Eröffnung, 20 bp je Seite, R3 mit 1-%-Band.',
  lesarten: LESARTEN,
  daten: {
    ordnerRelativZumStudienordner: path.relative(ORDNER, DATEN).split(path.sep).join('/') || '.',
    ende: ENDE,
    kalender: { handelstage: N, erster: kal[0], letzter: kal[N - 1], monatsenden: monatsenden.length },
    dateien,
    zaehler,
  },
  proben,
  probenOk: proben.every((p) => p.ok),
  fenster: ergebnis,
  urteile,
  signale,
  auffaelligkeiten,
};
fs.writeFileSync(AUS, JSON.stringify(ausgabe, null, 2) + '\n', 'utf8');

// ---------------------------------------------------------------- Konsole
function pp(x) { return (x >= 0 ? '+' : '') + x.toFixed(2); }
function pz(x) { return (x * 100).toFixed(2) + ' %'; }
console.log('zweitrechner trendfilter-messung-2026-10/v1 — Hauptlesart, Daten: ' + DATEN);
console.log('Kalender ' + kal[0] + ' .. ' + kal[N - 1] + ', ' + N + ' Handelstage');
for (const fn of ['A', 'B']) {
  const F = ergebnis[fn];
  console.log('\nFenster ' + fn + ' ' + F.erster + ' .. ' + F.ende + ' (' + F.starttageZahl + ' Starttage)');
  for (const rg of REGELN) {
    const x = F.regeln[rg];
    const k = x.k0;
    console.log('  ' + rg + ' k=0: Regel ' + k.regel.endwertCent + ' (' + pz(k.regel.pa) + ' p.a.)  SPY ' + k.spy.endwertCent +
      ' (' + pz(k.spy.pa) + ')  Abstand ' + pp(k.abstandPp) + ' Pp  Wechsel ' + k.wechsel + '  Kosten ' + k.kosten.gesamt.toFixed(2) +
      '  Rückschlag ' + pz(k.regel.groessterRueckschlag.wert) + ' / ' + pz(k.spy.groessterRueckschlag.wert));
    console.log('      Wechsel: ' + (k.wechselListe.map((w) => w.tag + ' ' + w.von + '>' + w.nach).join(', ') || '-'));
    const z = x.zusammenfassung;
    console.log('      Starttage: vorn ' + z.vorn + '/' + z.starttage + ', Median ' + pp(z.medianAbstandPp) + ' Pp, Min ' +
      pp(z.minimumAbstandPp) + ', Max ' + pp(z.maximumAbstandPp) + '  Bedingungen a/b/c: ' +
      [x.bedingungen.a, x.bedingungen.b, x.bedingungen.c].map((v) => (v ? 'ja' : 'nein')).join('/'));
  }
}
console.log('\nUrteile §5.3:');
for (const rg of REGELN) console.log('  ' + rg + ': ' + urteile[rg].urteil + (urteile[rg].verfehlt.length ? ' — verfehlt: ' + urteile[rg].verfehlt.join('; ') : ''));
console.log('\nProben:');
for (const p of proben) console.log('  ' + (p.ok ? 'ok     ' : 'FEHLER ') + p.name);
console.log('\n' + (ausgabe.probenOk ? 'Alle Proben ok.' : 'MINDESTENS EINE PROBE FEHLER.') + ' Geschrieben: ' + AUS);
if (!ausgabe.probenOk) process.exitCode = 1;

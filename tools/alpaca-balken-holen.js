'use strict';
/* NACHHOLER: Alpaca-SIP-Balken fuer die verworfene CFD-Tiefe (Stufe Z1, Schritt 3).
 *
 *   node tools/alpaca-balken-holen.js <store-sicherung> <archiv-wurzel> --zaehlen  [--intervall 1m] [--symbole A,B]
 *   node tools/alpaca-balken-holen.js <store-sicherung> <archiv-wurzel> --holen    [--intervall 1m] [--symbole A,B]
 *   node tools/alpaca-balken-holen.js --pruefen        Aequivalenz Alpaca gegen Yahoo aus dem Fortschritt
 *   node tools/alpaca-balken-holen.js --kontrolle
 *
 * WAS GEHOLT WIRD (wiki/archiv-zusammenfuehrung.md Paragraph 6, Punkt 2): fuer die Symbole
 * der Store-Sicherung (manifest.json, ohne Krypto) die Balken 1Min/5Min/15Min fuer GENAU
 * die Zeitraeume, die die verworfenen cap-Kerzen abdeckten - je Reihe die capBereiche
 * ihrer Store-Datei. Nur die regulaere Sitzung (laut /v2/calendar der Quelle, nicht laut
 * einer Liste im Kopf), nur feed=sip, adjustment=raw (das Archiv fuehrt den gehandelten
 * Kurs, wie bei Yahoo).
 *
 * DATEI GEWINNT. Ein Balken, dessen Stempel schon in der Datei liegt, wird NICHT
 * geschrieben - dieselbe Regel wie in der Migration. Er wird aber VERGLICHEN: Schluss
 * und Umsatz gegen die Yahoo-Kerze desselben Stempels, gesammelt im Fortschritt und
 * mit --pruefen ausgewertet. Das ist die Kontrolle, dass die Quelle stimmt (Schluss
 * <= 0,1 %, Umsatz-Faktor ~1). Geschrieben wird ausschliesslich ueber
 * kerzenquelle.js zusammenfuehren()/satz() mit Quelle 'alpaca'.
 *
 * FREIGABE: nur wenn die Probe (studien/archiv-zusammenfuehrung-2026-09/
 * probe-alpaca-balken.js) mit bestanden: true auf der Platte liegt - ODER wenn daneben
 * eine ausdrueckliche Freigabe-Datei liegt (probe-alpaca-balken-freigabe.json,
 * { freigegeben: true, probeErzeugt: <erzeugt-Stempel der Ergebnisdatei>, ... }), deren
 * probeErzeugt EXAKT zum erzeugt-Stempel der vorliegenden Ergebnisdatei passt. Wilhelms
 * Entscheid vom 03.09.2026 (wiki/archiv-zusammenfuehrung.md Paragraph 6 Punkt 2: "Freigeben
 * mit Nachtrag") laeuft ueber diesen zweiten Weg - das Urteil der Probe selbst bleibt
 * false, wie gemessen; eine neue Probe schreibt einen neuen Stempel und entwertet die
 * alte Freigabe von selbst. Ohne einen der beiden Wege holt dieses Werkzeug nichts -
 * "nur wenn Schritt 0 bestanden (oder ausdruecklich freigegeben)" ist maschinell, nicht
 * vereinbart. Dazu dieselben zwei Wachen wie in der Migration: R5 behoben, nicht im
 * Sammelfenster 21:30-23:00 UTC. Und die Sammler-Sperre je Ordner.
 *
 * DIE iex-FALLE (wiki/datenquellen.md): eine Schnittstelle, die lieber irgendetwas
 * antwortet als nichts. Jeder gelieferte Balken wird gegen den ANGEFRAGTEN Zeitraum
 * gehalten; was ausserhalb liegt, wird gezaehlt und verworfen.
 *
 * RATENBREMSE 180/min (Kopfzeile sagt 200), FORTSETZBAR: Fortschritt in
 * E:/Markt-Dashboard-Archiv/alpaca-balken-fortschritt.json (MD_ALPACA_FORTSCHRITT), je
 * Aufgabe sym|iv|von. Abbruch mit Strg+C ist gefahrlos - jede Aufgabe schreibt ihre
 * Datei atomar und traegt sich danach ein.
 *
 * ZAEHLEN VOR HOLEN: --zaehlen sagt, wie viele Abrufe es werden, und schreibt nichts.
 * Den Lauf startet Wilhelm in seinem eigenen Terminal.
 *
 * Zugang: nur ueber schluessel.js der Spannen-Studie. Diese Datei kennt die
 * Umgebungsnamen nicht; jede Ausgabe laeuft durch verdecken().
 */
var fs = require('fs');
var path = require('path');
var KQ = require('../kerzenquelle.js');
var Boerse = require('../boerse.js');
var M = require('./archiv-migration.js');
var S = require('../studien/vorregistrierung-2026-09-02-spannen-historisch/schluessel.js');

var DATEN = 'https://data.alpaca.markets/v2';
var HANDEL = 'https://paper-api.alpaca.markets/v2';
var RAHMEN = { '1m': '1Min', '5m': '5Min', '15m': '15Min' };
var DAUER_MS = { '1m': 60000, '5m': 300000, '15m': 900000 };
var JE_TAG = { '1m': 390, '5m': 78, '15m': 26 };
var SEITE = 10000;
var RATE_JE_MIN = 180;
var VERSUCHE = 5;
var FREIGABE = path.join(__dirname, '..', 'studien', 'archiv-zusammenfuehrung-2026-09', 'probe-alpaca-balken-ergebnis.json');
var FREIGABE_NACHTRAG = path.join(__dirname, '..', 'studien', 'archiv-zusammenfuehrung-2026-09', 'probe-alpaca-balken-freigabe.json');
var FORTSCHRITT = process.env.MD_ALPACA_FORTSCHRITT || 'E:/Markt-Dashboard-Archiv/alpaca-balken-fortschritt.json';
var KALENDER = FORTSCHRITT.replace(/[^\\/]+$/, 'alpaca-balken-kalender.json');

function sag(t) { process.stdout.write(S.verdecken(t) + '\n'); }
function pause(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/* ---------- Ratenbremse: Eimer mit RATE_JE_MIN Marken je 60 s (wie messen.js) ---------- */
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
      res = await f(url, { headers: S.kopfzeilen(), signal: AbortSignal.timeout(60000) });
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

/* ---------- reine Bausteine (die Kontrolle faehrt sie ohne Netz) ---------- */
/** Alpaca-Balken -> Archivkerze [t, schluss, umsatz, hoch, tief, eroeffnung]. null, wenn
 *  der Balken nicht auf Sekunde 0 liegt oder Zahlen fehlen. */
function kerzeAus(b) {
  var t = Date.parse(b && b.t);
  if (!isFinite(t) || new Date(t).getUTCSeconds() !== 0) return null;
  if (!KQ.kursOk(b.c) || !KQ.kursOk(b.h) || !KQ.kursOk(b.l) || !KQ.kursOk(b.o)) return null;
  var v = typeof b.v === 'number' && isFinite(b.v) && b.v >= 0 ? b.v : 0;
  return [t, b.c, v, b.h, b.l, b.o];
}
/** Nur die regulaere Sitzung: Balkenoeffnung in [open, close) des Kalendertages (ET).
 *  kal: { 'YYYY-MM-DD': { open: '09:30', close: '16:00' } }. Tage ohne Eintrag = kein Handel. */
function regulaer(kerzen, kal) {
  var grenzen = {};
  function fuer(tagEt) {
    if (grenzen[tagEt] !== undefined) return grenzen[tagEt];
    var e = kal[tagEt];
    if (!e) return (grenzen[tagEt] = null);
    var p = tagEt.split('-').map(Number), o = e.open.split(':').map(Number), c = e.close.split(':').map(Number);
    return (grenzen[tagEt] = { auf: M.nyNachUtc(p[0], p[1], p[2], o[0], o[1]), zu: M.nyNachUtc(p[0], p[1], p[2], c[0], c[1]) });
  }
  var NY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
  var aus = { drin: [], vor: 0, nach: 0, keinHandel: 0 };
  kerzen.forEach(function (k) {
    var tagEt = NY.format(new Date(k[0]));
    var g = fuer(tagEt);
    if (!g) { aus.keinHandel++; return; }
    if (k[0] < g.auf) { aus.vor++; return; }
    if (k[0] >= g.zu) { aus.nach++; return; }
    aus.drin.push(k);
  });
  return aus;
}
/** Die iex-Falle: nur Balken im ANGEFRAGTEN Zeitraum. */
function imZeitraum(kerzen, von, bis) {
  var aus = { drin: [], draussen: 0 };
  kerzen.forEach(function (k) { if (k[0] >= von && k[0] <= bis) aus.drin.push(k); else aus.draussen++; });
  return aus;
}
/** Datei gewinnt: neue Kerzen = nur Stempel, die die Datei nicht hat; die gemeinsamen
 *  werden verglichen (Schluss relativ, Umsatz-Faktor Alpaca/Yahoo). */
function trenne(kerzen, dateiSerie) {
  var F = {};
  dateiSerie.forEach(function (k) { F[k[0]] = k; });
  var neu = [], abw = [], faktoren = [], gemeinsam = 0, ueber = 0;
  kerzen.forEach(function (k) {
    var y = F[k[0]];
    if (!y) { neu.push(k); return; }
    gemeinsam++;
    if (y[1] > 0) { var a = Math.abs(k[1] - y[1]) / y[1]; abw.push(a); if (a > 0.001) ueber++; }
    if (y[2] > 0 && k[2] > 0) faktoren.push(k[2] / y[2]);
  });
  return { neu: neu, gemeinsam: gemeinsam, abw: abw, faktoren: faktoren, ueber01: ueber };
}
/** Handelstage in [von, bis] (UTC-Tage, Kalender aus boerse.js - nur zum Schaetzen). */
function handelstage(von, bis) {
  var n = 0;
  for (var t = Date.UTC(new Date(von).getUTCFullYear(), new Date(von).getUTCMonth(), new Date(von).getUTCDate()); t <= bis; t += 86400000) if (Boerse.istHandelstag(t)) n++;
  return n;
}
/** Abrufe je Aufgabe: Seiten zu 10.000 Balken, mindestens eine. */
function abrufeFuer(iv, von, bis) {
  return Math.max(1, Math.ceil(handelstage(von, bis) * JE_TAG[iv] / SEITE));
}
function median(a) { if (!a.length) return null; var s = a.slice().sort(function (x, y) { return x - y; }); var m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

/* ---------- Plan: Aufgaben aus der Sicherung ---------- */
function plan(sicherung, wurzel, opt) {
  opt = opt || {};
  var m = JSON.parse(fs.readFileSync(path.join(sicherung, 'manifest.json'), 'utf8'));
  var ivs = opt.intervall ? [opt.intervall] : Object.keys(RAHMEN);
  var nurSym = opt.symbole ? opt.symbole.reduce(function (o, s) { o[s] = 1; return o; }, {}) : null;
  var aufgaben = [], uebersprungen = [];
  m.dateien.forEach(function (d) {
    var x = /^bars_(\w+)_(.+)\.json$/.exec(d.name);
    if (!x || ivs.indexOf(x[1]) === -1) return;
    var iv = x[1], sym = x[2];
    if (KQ.istKryptoSym(sym)) return;
    if (nurSym && !nurSym[sym]) return;
    var st = M.ladeStore(path.join(sicherung, d.name));
    if (!st.capBereiche.length) return;
    var ziel = M.zielFuer(wurzel, iv, sym);
    if (!ziel.pfad) { uebersprungen.push(iv + ' ' + sym + ' (' + ziel.art + ')'); return; }
    st.capBereiche.forEach(function (b) {
      aufgaben.push({ key: sym + '|' + iv + '|' + b[0], sym: sym, alpacaSym: ziel.sym, iv: iv, von: b[0], bis: b[1] + DAUER_MS[iv] - 1,
        pfad: ziel.pfad, dateiSym: ziel.sym, neuDatei: ziel.neu, abrufe: abrufeFuer(iv, b[0], b[1]) });
    });
  });
  return { aufgaben: aufgaben, uebersprungen: uebersprungen };
}

/* ---------- Fortschritt ---------- */
function fortschrittLesen() {
  try { return JSON.parse(fs.readFileSync(FORTSCHRITT, 'utf8')); }
  catch (e) { return { begonnen: new Date().toISOString(), erledigt: {}, vergleich: {}, abrufe: 0, wiederholt: 0, fehler: {} }; }
}
function fortschrittSchreiben(F) {
  F.zuletzt = new Date().toISOString(); F.abrufe = Z.abrufe; F.wiederholt = Z.wiederholt; F.fehler = Z.fehler;
  fs.mkdirSync(path.dirname(FORTSCHRITT), { recursive: true });
  M.atomarSchreiben(FORTSCHRITT, JSON.stringify(F, null, 1));
}
/* Stichprobe deckeln, sonst waechst der Fortschritt ins Unlesbare: bis 'deckel' Werte je
 * Eimer, gleichmaessig ausgeduennt. */
function merkeGedeckelt(v, t, deckel) {
  v.gemeinsam += t.gemeinsam; v.ueber01 += t.ueber01;
  [['abw', t.abw], ['faktoren', t.faktoren]].forEach(function (p) {
    var ziel = v[p[0]], quelle = p[1];
    var schritt = Math.max(1, Math.ceil((ziel.length + quelle.length) / deckel));
    for (var i = 0; i < quelle.length; i += schritt) ziel.push(quelle[i]);
    if (ziel.length > deckel) v[p[0]] = ziel.filter(function (_, i) { return i % 2 === 0; });
  });
}
/** Zahlen je Intervall UND je Wert (Symbol) - --pruefen braucht beides: die Intervall-Tabelle
 *  und die Stoppregel aus §6 Punkt 2 ("faellt mehr als 10 % der Werte durch"), die ueber
 *  Intervalle hinweg je Symbol urteilt. Nur gemeinsame Stempel Alpaca/Yahoo, wie am Kopf
 *  der Datei beschrieben - es wird dafuer nichts zusaetzlich geholt. */
function vergleichMerken(F, iv, sym, t) {
  var v = F.vergleich[iv] || (F.vergleich[iv] = { gemeinsam: 0, ueber01: 0, abw: [], faktoren: [] });
  merkeGedeckelt(v, t, 20000);
  F.vergleichSym = F.vergleichSym || {};
  var vs = F.vergleichSym[sym] || (F.vergleichSym[sym] = { gemeinsam: 0, ueber01: 0, abw: [], faktoren: [] });
  merkeGedeckelt(vs, t, 4000);
}

/* ---------- Kalender der Quelle ---------- */
async function kalenderHolen(von, bis) {
  var alt = null;
  try { alt = JSON.parse(fs.readFileSync(KALENDER, 'utf8')); } catch (e) { alt = null; }
  var a = new Date(von).toISOString().slice(0, 10), b = new Date(bis).toISOString().slice(0, 10);
  if (alt && alt.von <= a && alt.bis >= b) return alt.tage;
  var r = await hole(HANDEL + '/calendar?start=' + a + '&end=' + b);
  if (r.status !== 200 || !Array.isArray(r.daten)) throw new Error('Kalender: HTTP ' + r.status + ' ' + S.verdecken(String(r.text).slice(0, 120)));
  var tage = {};
  r.daten.forEach(function (t) { if (t && t.date) tage[t.date] = { open: t.open, close: t.close }; });
  M.atomarSchreiben(KALENDER, JSON.stringify({ geholt: new Date().toISOString(), von: a, bis: b, tage: tage }));
  return tage;
}

/* ---------- eine Aufgabe ---------- */
async function aufgabe(a, kal, F) {
  var alle = [], token = null, seiten = 0, status = 200;
  do {
    var url = DATEN + '/stocks/bars?symbols=' + encodeURIComponent(a.alpacaSym) + '&timeframe=' + RAHMEN[a.iv] +
      '&start=' + encodeURIComponent(new Date(a.von).toISOString()) + '&end=' + encodeURIComponent(new Date(a.bis).toISOString()) +
      '&limit=' + SEITE + '&feed=sip&adjustment=raw' + (token ? '&page_token=' + encodeURIComponent(token) : '');
    var r = await hole(url);
    seiten++; status = r.status;
    if (r.status !== 200) return { ok: false, grund: 'HTTP ' + r.status + ' ' + String(r.text || '').replace(/\s+/g, ' ').slice(0, 120), seiten: seiten };
    var b = r.daten && r.daten.bars ? r.daten.bars[a.alpacaSym] : null;
    if (Array.isArray(b)) alle = alle.concat(b);
    token = r.daten ? r.daten.next_page_token : null;
  } while (token && seiten < 200);
  var kerzen = alle.map(kerzeAus).filter(Boolean);
  var z = imZeitraum(kerzen, a.von, a.bis);
  var reg = regulaer(z.drin, kal);
  var huelle = a.neuDatei ? null : KQ.huelleLesen(a.pfad);
  if (!a.neuDatei && !huelle) return { ok: false, grund: 'Datei unlesbar: ' + a.pfad, seiten: seiten };
  var t = trenne(reg.drin, huelle ? huelle.series : []);
  vergleichMerken(F, a.iv, a.sym, t);
  var geschrieben = 0, verlust = 0;
  if (t.neu.length) {
    var v = KQ.zusammenfuehren(huelle ? huelle.series : [], t.neu, a.iv, { quellenAlt: huelle ? huelle.quellen : [], quelleNeu: 'alpaca' });
    var drin = {}; v.serie.forEach(function (k) { drin[k[0]] = 1; });
    t.neu.forEach(function (k) { if (!drin[k[0]]) verlust++; });
    geschrieben = v.serie.length - (huelle ? huelle.series.length : 0);
    M.atomarSchreiben(a.pfad, JSON.stringify(KQ.satz(a.dateiSym, a.iv, v.serie, {
      quellen: v.quellen, waehrung: huelle ? huelle.waehrung : 'USD', boerse: huelle ? huelle.boerse : undefined,
      quelle: huelle && huelle.quelle ? huelle.quelle : 'alpaca v2 stocks/bars, feed=sip, adjustment=raw (Z1-Nachholer)',
      spannen: huelle ? huelle.spannen : undefined })));
  }
  return { ok: true, status: status, seiten: seiten, roh: alle.length, unbrauchbar: alle.length - kerzen.length, ausserhalb: z.draussen,
    vor: reg.vor, nach: reg.nach, keinHandel: reg.keinHandel, regulaer: reg.drin.length, gemeinsam: t.gemeinsam, neu: t.neu.length,
    geschrieben: geschrieben, rasterVerlust: verlust };
}

async function holen(sicherung, wurzel, opt) {
  var P = plan(sicherung, wurzel, opt);
  var F = fortschrittLesen();
  var offen = P.aufgaben.filter(function (a) { return !F.erledigt[a.key]; });
  sag('Aufgaben: ' + P.aufgaben.length + ', davon offen ' + offen.length + ', geschaetzte Abrufe ' +
    offen.reduce(function (s, a) { return s + a.abrufe; }, 0) + ' (~' + Math.ceil(offen.reduce(function (s, a) { return s + a.abrufe; }, 0) / RATE_JE_MIN) + ' min bei ' + RATE_JE_MIN + '/min)');
  if (!offen.length) { sag('Nichts offen.'); return; }
  var von = Math.min.apply(null, offen.map(function (a) { return a.von; })), bis = Math.max.apply(null, offen.map(function (a) { return a.bis; }));
  var kal = await kalenderHolen(von, bis);
  var anhalten = false;
  process.on('SIGINT', function () { anhalten = true; sag('Strg+C - nach der laufenden Aufgabe ist Schluss.'); });
  var ivs = {};
  offen.forEach(function (a) { ivs[a.iv] = 1; });
  var gesperrt = [];
  Object.keys(ivs).forEach(function (iv) {
    var ordner = path.join(wurzel, 'archiv' + iv);
    var sp = KQ.sperreLesen(ordner);
    if (sp.aktiv) throw new Error(ordner + ' wird gerade geschrieben (' + (sp.was || '?') + ') - spaeter starten');
    fs.mkdirSync(ordner, { recursive: true });
    KQ.sperreSetzen(ordner, 'Z1-Nachholer Alpaca ' + iv);
    gesperrt.push(ordner);
  });
  var begonnen = new Date().toISOString(), n = 0, ok = 0, schlecht = 0;
  try {
    for (var i = 0; i < offen.length && !anhalten; i++) {
      var a = offen[i];
      var r;
      try { r = await aufgabe(a, kal, F); } catch (e) { r = { ok: false, grund: 'Ausnahme: ' + String(e && e.message || e).slice(0, 120) }; }
      n++;
      if (r.ok) {
        ok++;
        F.erledigt[a.key] = { am: new Date().toISOString(), roh: r.roh, regulaer: r.regulaer, ausserhalb: r.ausserhalb, vor: r.vor, nach: r.nach,
          gemeinsam: r.gemeinsam, neu: r.neu, geschrieben: r.geschrieben, rasterVerlust: r.rasterVerlust, seiten: r.seiten };
        sag('  ' + String(i + 1).padStart(5) + '/' + offen.length + '  ' + a.sym.padEnd(8) + a.iv.padEnd(4) + new Date(a.von).toISOString().slice(0, 10) + '..' + new Date(a.bis).toISOString().slice(0, 10) +
          '  roh ' + r.roh + '  regulaer ' + r.regulaer + '  gemeinsam ' + r.gemeinsam + '  neu ' + r.neu + '  geschrieben ' + r.geschrieben +
          (r.ausserhalb ? '  AUSSERHALB ' + r.ausserhalb : '') + (r.rasterVerlust ? '  RASTER ' + r.rasterVerlust : ''));
      } else {
        schlecht++;
        F.fehlschlaege = F.fehlschlaege || {};
        F.fehlschlaege[a.key] = { am: new Date().toISOString(), grund: S.verdecken(r.grund) };
        sag('  ' + String(i + 1).padStart(5) + '/' + offen.length + '  ' + a.sym.padEnd(8) + a.iv.padEnd(4) + '  FEHLER ' + r.grund);
        if (schlecht >= 8 && ok === 0) { sag('Acht Fehlschlaege hintereinander, keine Antwort - das ist keine Reihe kaputter Werte. Abbruch.'); break; }
      }
      fortschrittSchreiben(F);
    }
  } finally {
    gesperrt.forEach(function (ordner) {
      KQ.sperreLoesen(ordner);
      KQ.laufProtokoll(ordner, [begonnen, new Date().toISOString(), path.basename(ordner).replace('archiv', ''), 'Z1-Nachholer-Alpaca',
        'aufgaben=' + n, 'ok=' + ok, 'fehler=' + schlecht, 'abrufe=' + Z.abrufe, 'pid=' + process.pid].join('  '));
    });
    fortschrittSchreiben(F);
  }
  sag('Fertig: ' + ok + ' Aufgaben, ' + schlecht + ' Fehler, ' + Z.abrufe + ' Abrufe, ' + Z.wiederholt + ' Wiederholungen.');
}

/* ---------- Pruefen: Aequivalenz Alpaca gegen Yahoo aus dem Fortschritt ---------- */
/** F optional (Test-Einspeisung); ohne Argument wird der echte Fortschritt gelesen. */
function pruefen(F) {
  F = F || fortschrittLesen();
  var zeilen = ['| Intervall | gemeinsame Stempel | Schluss median | Schluss max | ueber 0,1 % | Umsatz-Faktor median (n) | Urteil |', '|---|---|---|---|---|---|---|'];
  var alleOk = true, welche = 0;
  Object.keys(F.vergleich || {}).forEach(function (iv) {
    var v = F.vergleich[iv];
    var med = median(v.abw), max = v.abw.length ? Math.max.apply(null, v.abw) : null, fm = median(v.faktoren);
    var okS = med != null && med <= 0.001 && v.ueber01 <= 0.02 * v.gemeinsam, okU = fm != null && fm >= 0.8 && fm <= 1.25;
    welche++;
    if (!(okS && okU)) alleOk = false;
    zeilen.push('| ' + iv + ' | ' + v.gemeinsam + ' | ' + (med == null ? '–' : (med * 100).toFixed(4) + ' %') + ' | ' + (max == null ? '–' : (max * 100).toFixed(3) + ' %') +
      ' | ' + v.ueber01 + ' | ' + (fm == null ? '–' : fm.toFixed(3)) + ' (' + v.faktoren.length + ') | ' + (okS && okU ? 'Quelle stimmt' : 'ABWEICHUNG') + ' |');
  });
  var erledigt = Object.keys(F.erledigt || {}).length;
  var summe = { geschrieben: 0, neu: 0, gemeinsam: 0, ausserhalb: 0, rasterVerlust: 0 };
  Object.keys(F.erledigt || {}).forEach(function (k) { var e = F.erledigt[k]; Object.keys(summe).forEach(function (f) { summe[f] += e[f] || 0; }); });
  /* Stoppregel aus wiki/archiv-zusammenfuehrung.md Paragraph 6 Punkt 2, Auflage 3: dasselbe
   * Kriterium wie die Probe (Median <= 0,1 %, <= 2 % der Kerzen ueber 0,1 %), aber je WERT
   * (Symbol) geurteilt statt je Intervall - ein Wert zaehlt als durchgefallen, sobald er in
   * IRGENDEINEM Intervall durchfaellt (alle seine gemeinsamen Stempel gepoolt). */
  var symDurch = 0, symGesamt = 0;
  Object.keys(F.vergleichSym || {}).forEach(function (sym) {
    var v = F.vergleichSym[sym];
    if (!v.gemeinsam) return;
    symGesamt++;
    var med = median(v.abw);
    var okS = med != null && med <= 0.001 && v.ueber01 <= 0.02 * v.gemeinsam;
    if (!okS) symDurch++;
  });
  var symQuote = symGesamt ? symDurch / symGesamt : 0;
  var symZeile = 'Werte durchgefallen: ' + symDurch + ' von ' + symGesamt + ' (Kriterium wie Probe: Median <= 0,1 % und <= 2 % der Kerzen ueber 0,1 %)';
  var stoppZeile = symGesamt === 0 ? 'Noch keine Werte verglichen.' :
    (symQuote > 0.10 ? 'STOPP: Vollsammlung nicht starten' : 'unter der Stoppregel (<= 10 % durchgefallen) - Vollsammlung darf starten.');
  return { text: 'Erledigte Aufgaben: ' + erledigt + ', Abrufe ' + (F.abrufe || 0) + ', Fehlschlaege ' + Object.keys(F.fehlschlaege || {}).length + '\n' +
    'Balken: gemeinsam mit Yahoo ' + summe.gemeinsam + ', neu ' + summe.neu + ', geschrieben ' + summe.geschrieben + ', ausserhalb des Zeitraums ' + summe.ausserhalb + ', vom Raster verworfen ' + summe.rasterVerlust + '\n\n' + zeilen.join('\n') +
    '\n\n' + (welche ? (alleOk ? 'Alle Intervalle: Quelle stimmt (Schluss <= 0,1 %, Umsatz-Faktor 0,8–1,25).' : 'MINDESTENS EIN INTERVALL WEICHT AB - Balken sind nicht dasselbe wie Yahoo.') : 'Noch kein Vergleich im Fortschritt.') +
    '\n\n' + symZeile + '\n' + stoppZeile,
    ok: welche > 0 && alleOk && symQuote <= 0.10 };
}

/* ---------- Freigabe ---------- */
/** TT.MM.JJJJ aus einem 'JJJJ-MM-TT'-Datum - nur fuer die Banner-Zeile, keine Zeitrechnung. */
function datumDe(iso) { var p = String(iso).split('-'); return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : String(iso); }

/** ergPfad/nachtragPfad optional (Test-Einspeisung); ohne Argumente die echten Dateien.
 *
 *  Zwei Wege zu bestanden: true - (a) die Probe selbst hat bestanden: true geschrieben, oder
 *  (b) die Probe hat NICHT bestanden, aber eine ausdrueckliche Freigabe-Datei liegt daneben:
 *  { freigegeben: true, probeErzeugt: <erzeugt-Stempel dieser Ergebnisdatei>, ... }. Der
 *  Stempel muss EXAKT uebereinstimmen (Regel 1, wiki/archiv-zusammenfuehrung.md Paragraph 6
 *  Punkt 2) - eine neue Probe schreibt einen neuen erzeugt-Stempel und macht die alte
 *  Freigabe damit von selbst ungueltig, ohne dass irgendwer sie loeschen muesste. Die
 *  Ergebnisdatei selbst wird hier nur GELESEN, nie veraendert (Regel 2). */
function freigabe(ergPfad, nachtragPfad) {
  var erg;
  try { erg = JSON.parse(fs.readFileSync(ergPfad || FREIGABE, 'utf8')); }
  catch (e) { return { da: false, bestanden: false }; }
  var bestanden = !!(erg.urteil && erg.urteil.bestanden === true);
  var nachtrag = null;
  try { nachtrag = JSON.parse(fs.readFileSync(nachtragPfad || FREIGABE_NACHTRAG, 'utf8')); } catch (e2) { nachtrag = null; }
  var viaNachtrag = false;
  if (!bestanden && nachtrag && nachtrag.freigegeben === true && nachtrag.probeErzeugt === erg.erzeugt) {
    bestanden = true; viaNachtrag = true;
  }
  return { da: true, bestanden: bestanden, erzeugt: erg.erzeugt, urteil: erg.urteil,
    nachtrag: viaNachtrag ? { durch: nachtrag.durch, datum: nachtrag.datum, grund: nachtrag.grund,
      zeile: 'Freigabe: ' + nachtrag.durch + ' ' + datumDe(nachtrag.datum) + ' (Probe nicht bestanden, Nachtrag §6)' } : null };
}

/* ---------- Kontrolle ---------- */
function kontrolle() {
  var fehler = [];
  function pruefe(bed, was, ist) { if (!bed) fehler.push(was); console.log((bed ? '  ok   ' : '  FEHL ') + was + (ist !== undefined ? '  →  ' + JSON.stringify(ist) : '')); }
  console.log('Kontrolle A: Balken -> Kerze');
  var k = kerzeAus({ t: '2026-08-27T13:30:00Z', o: 100, h: 101, l: 99, c: 100.5, v: 1234, n: 50, vw: 100.2 });
  pruefe(k && k.length === 6 && k[0] === Date.parse('2026-08-27T13:30:00Z') && k[1] === 100.5 && k[2] === 1234 && k[3] === 101 && k[4] === 99 && k[5] === 100,
    'A: [t, schluss, umsatz, hoch, tief, eroeffnung] - die Eroeffnung steht in [5]', k);
  pruefe(kerzeAus({ t: '2026-08-27T13:30:27Z', o: 1, h: 1, l: 1, c: 1, v: 1 }) === null && kerzeAus({ t: '2026-08-27T13:30:00Z', o: 1, h: 1, l: 1, c: 0, v: 1 }) === null,
    'A: Sekunden im Stempel oder Kurs 0 -> keine Kerze');
  console.log('Kontrolle B: regulaere Sitzung laut Kalender, Sommer- und Winterzeit, Halbtag');
  var kal = { '2026-08-27': { open: '09:30', close: '16:00' }, '2026-01-15': { open: '09:30', close: '16:00' }, '2025-11-28': { open: '09:30', close: '13:00' } };
  function kz(iso) { return [Date.parse(iso), 1, 1, 1, 1, 1]; }
  var rB = regulaer([kz('2026-08-27T13:25:00Z'), kz('2026-08-27T13:30:00Z'), kz('2026-08-27T19:59:00Z'), kz('2026-08-27T20:00:00Z'),
    kz('2026-01-15T14:00:00Z'), kz('2026-01-15T14:30:00Z'), kz('2026-01-15T20:59:00Z'), kz('2026-01-15T21:00:00Z'),
    kz('2025-11-28T17:59:00Z'), kz('2025-11-28T18:00:00Z'), kz('2025-11-27T15:00:00Z')], kal);
  pruefe(rB.drin.length === 5 && rB.vor === 2 && rB.nach === 3 && rB.keinHandel === 1,
    'B: 5 drin (13:30, 19:59 EDT; 14:30, 20:59 EST; 17:59 Halbtag), 2 davor, 3 danach, 1 an Thanksgiving', [rB.drin.length, rB.vor, rB.nach, rB.keinHandel]);
  console.log('Kontrolle C: iex-Falle - nur der angefragte Zeitraum');
  var cZ = imZeitraum([kz('2020-07-30T14:00:00Z'), kz('2018-03-01T14:35:00Z')], Date.parse('2018-03-01T00:00:00Z'), Date.parse('2018-03-02T00:00:00Z'));
  pruefe(cZ.drin.length === 1 && cZ.draussen === 1, 'C: der 2020er Balken auf die 2018er Anfrage wird verworfen und gezaehlt', cZ);
  console.log('Kontrolle D: Datei gewinnt, Vergleich auf gemeinsamen Stempeln');
  var datei = [[Date.parse('2026-08-27T13:30:00Z'), 100, 1000, 101, 99, 100], [Date.parse('2026-08-27T13:31:00Z'), 100, 1000, 101, 99, 100]];
  var tD = trenne([[Date.parse('2026-08-27T13:30:00Z'), 100.05, 1100, 101, 99, 100], [Date.parse('2026-08-27T13:31:00Z'), 100.5, 500000, 101, 99, 100], [Date.parse('2026-08-27T13:32:00Z'), 100, 1000, 101, 99, 100]], datei);
  pruefe(tD.neu.length === 1 && tD.neu[0][0] === Date.parse('2026-08-27T13:32:00Z') && tD.gemeinsam === 2 && tD.ueber01 === 1 &&
    Math.abs(tD.faktoren[0] - 1.1) < 1e-9 && tD.faktoren[1] === 500,
    'D: nur der fremde Stempel ist neu; 2 gemeinsam, 1 ueber 0,1 %, Faktoren 1,1 und 500', [tD.neu.length, tD.gemeinsam, tD.ueber01, tD.faktoren]);
  var vD = KQ.zusammenfuehren(datei, tD.neu, '1m', { quellenAlt: KQ.quellenLesen({ series: datei }), quelleNeu: 'alpaca' });
  pruefe(vD.quellen.length === 2 && vD.quellen[0].quelle === 'yahoo' && vD.quellen[1].quelle === 'alpaca' && vD.serie.length === 3,
    'D: nach dem Vereinigen traegt die Reihe yahoo-Bestand und alpaca als getrennte Bereiche', vD.quellen.map(function (b) { return b.quelle; }));
  console.log('Kontrolle E: Abrufe zaehlen');
  pruefe(abrufeFuer('1m', Date.parse('2026-05-26T13:30:00Z'), Date.parse('2026-08-21T19:59:00Z')) === Math.ceil(handelstage(Date.parse('2026-05-26T13:30:00Z'), Date.parse('2026-08-21T19:59:00Z')) * 390 / 10000) &&
    abrufeFuer('15m', Date.parse('2026-05-26T13:30:00Z'), Date.parse('2026-08-21T19:59:00Z')) === 1 &&
    handelstage(Date.parse('2026-08-24T13:30:00Z'), Date.parse('2026-08-28T20:00:00Z')) === 5,
    'E: Seiten zu 10.000 Balken je Aufgabe, mindestens eine; eine Woche = 5 Handelstage',
    [abrufeFuer('1m', Date.parse('2026-05-26T13:30:00Z'), Date.parse('2026-08-21T19:59:00Z')), handelstage(Date.parse('2026-05-26T13:30:00Z'), Date.parse('2026-08-21T19:59:00Z'))]);
  console.log('Kontrolle F: Freigabe und Wachen');
  var fg = freigabe();
  console.log('  Freigabe der Probe: ' + (fg.da ? (fg.bestanden ? (fg.nachtrag ? 'BESTANDEN ueber Nachtrag-Freigabe (' + fg.erzeugt + ')' : 'BESTANDEN (' + fg.erzeugt + ')') : 'da, aber NICHT bestanden') : 'liegt nicht vor - Wilhelm muss die Probe erst fahren'));
  console.log('  R5: ' + (M.r5Behoben() ? 'behoben' : 'NICHT behoben - --holen wird verweigert'));
  console.log(fehler.length ? '\nKONTROLLE NICHT BESTANDEN: ' + fehler.length + ' Fehler' : '\nKontrolle bestanden (A–E).');
  return fehler.length === 0;
}

/* ---------- main ---------- */
function arg(name, std) { var i = process.argv.indexOf(name); return i >= 0 && process.argv[i + 1] != null ? process.argv[i + 1] : std; }
if (require.main === module) {
  /* Sichtbar bei jedem Start, nicht nur in Kontrolle F: wer eine Nachtrag-Freigabe faehrt,
   * soll das auf jedem Bildschirm sehen, auch bei --pruefen oder --kontrolle allein. */
  var fgStart = freigabe();
  if (fgStart.nachtrag) sag(fgStart.nachtrag.zeile);
  if (process.argv.indexOf('--kontrolle') >= 0) { process.exit(kontrolle() ? 0 : 1); }
  if (process.argv.indexOf('--pruefen') >= 0) { var p = pruefen(); sag(p.text); process.exit(p.ok ? 0 : 1); }
  var sicherung = process.argv[2], wurzel = process.argv[3];
  var zaehlen = process.argv.indexOf('--zaehlen') >= 0, holenJa = process.argv.indexOf('--holen') >= 0;
  if (!sicherung || !wurzel || sicherung.charAt(0) === '-' || (!zaehlen && !holenJa)) {
    console.error('Aufruf: node tools/alpaca-balken-holen.js <store-sicherung> <archiv-wurzel> --zaehlen|--holen [--intervall 1m] [--symbole A,B]  |  --pruefen  |  --kontrolle');
    process.exit(2);
  }
  if (!fs.existsSync(path.join(sicherung, 'manifest.json'))) { console.error('Keine manifest.json in ' + sicherung + ' - das ist keine Store-Sicherung.'); process.exit(2); }
  if (!kontrolle()) { console.error('Ohne bestandene Kontrolle kein Lauf.'); process.exit(1); }
  var opt = { intervall: arg('--intervall', null), symbole: arg('--symbole', null) ? arg('--symbole', '').split(',') : null };
  var P = plan(sicherung, wurzel, opt);
  var F0 = fortschrittLesen();
  var offen = P.aufgaben.filter(function (a) { return !F0.erledigt[a.key]; });
  var jeIv = {};
  P.aufgaben.forEach(function (a) { var j = jeIv[a.iv] || (jeIv[a.iv] = { aufgaben: 0, abrufe: 0, offen: 0, symbole: {} }); j.aufgaben++; j.abrufe += a.abrufe; j.symbole[a.sym] = 1; if (!F0.erledigt[a.key]) j.offen++; });
  sag('\nPlan aus ' + sicherung + ':');
  Object.keys(jeIv).forEach(function (iv) { sag('  ' + iv.padEnd(4) + Object.keys(jeIv[iv].symbole).length + ' Symbole, ' + jeIv[iv].aufgaben + ' Aufgaben (' + jeIv[iv].offen + ' offen), ' + jeIv[iv].abrufe + ' Abrufe'); });
  var gesamt = P.aufgaben.reduce(function (s, a) { return s + a.abrufe; }, 0);
  sag('  gesamt ' + P.aufgaben.length + ' Aufgaben, ' + gesamt + ' Abrufe (~' + Math.ceil(gesamt / RATE_JE_MIN) + ' min bei ' + RATE_JE_MIN + '/min), offen ' + offen.length);
  if (P.uebersprungen.length) sag('  uebersprungen: ' + P.uebersprungen.join(', '));
  if (zaehlen && !holenJa) { sag('Nur gezaehlt, nichts geholt.'); process.exit(0); }
  var fg = freigabe();
  if (!fg.bestanden) { console.error('\nVERWEIGERT: keine bestandene Probe unter ' + FREIGABE + ' - erst probe-alpaca-balken.js fahren.'); process.exit(1); }
  if (!M.r5Behoben()) { console.error('\nVERWEIGERT: rasterFilter() loescht auf 1m/5m/15m noch die volle Stunde mitten am Tag (R5).'); process.exit(1); }
  if (M.imSammelfenster()) { console.error('\nVERWEIGERT: 21:30–23:00 UTC ist das Sammelfenster der App.'); process.exit(1); }
  if (!S.vorhanden()) { console.error('\nUmgebungswerte fehlen (' + S.fehlend().join(', ') + '). In DEINEM Terminal setzen.'); process.exit(1); }
  holen(sicherung, wurzel, opt).then(function () { var p = pruefen(); sag('\n' + p.text); }, function (e) { console.error('ABBRUCH: ' + S.verdecken(String(e && e.message || e))); process.exit(1); });
}

module.exports = { kerzeAus: kerzeAus, regulaer: regulaer, imZeitraum: imZeitraum, trenne: trenne, abrufeFuer: abrufeFuer, handelstage: handelstage,
  plan: plan, pruefen: pruefen, freigabe: freigabe, vergleichMerken: vergleichMerken, kontrolle: kontrolle, hole: hole,
  FREIGABE: FREIGABE, FREIGABE_NACHTRAG: FREIGABE_NACHTRAG, RATE_JE_MIN: RATE_JE_MIN };

'use strict';
/* NACHHOLER: Alpaca-SIP-Balken fuer die verworfene CFD-Tiefe (Stufe Z1, Schritt 3).
 *
 *   node tools/alpaca-balken-holen.js <store-sicherung> <archiv-wurzel> --zaehlen  [--intervall 1m] [--symbole A,B]
 *   node tools/alpaca-balken-holen.js <store-sicherung> <archiv-wurzel> --holen    [--intervall 1m] [--symbole A,B]
 *   node tools/alpaca-balken-holen.js --pruefen [--wurzel <archiv>]   Aequivalenz Alpaca gegen Yahoo
 *                                       aus dem Fortschritt PLUS Skalenpruefung aus den Dateien
 *   node tools/alpaca-balken-holen.js <archiv-wurzel> --ersetze-alpaca --symbole MNST,SPGI [--schreiben]
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
var crypto = require('crypto');
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

/* ---------- Skala: die Zahlen der Reparatur vom 03.09.2026 ----------
 * SKALEN_BAND ist die Schwelle, ab der ein Tag als "Skalenabweichung" gilt: der
 * Tagesmedian des Verhaeltnisses Alpaca/Yahoo muss in [1-BAND, 1+BAND] liegen. Die
 * Zahl ist nicht gegriffen, sondern gemessen: ueber 3.757 saubere Wert-Tage der 70
 * verglichenen Werte liegt die Abweichung im Median bei 0,0026 % und in KEINEM Fall
 * ueber 0,1 % - die beiden falsch skalierten Werte dagegen bei Faktor 2,000 (MNST)
 * und 1,057 (SPGI). Zwischen Rauschen und Fehler liegen drei Groessenordnungen.
 * SKALEN_MIND_PAARE haelt Tage draussen, an denen zu wenige Grenzpaare fuer einen
 * Median vorliegen - ein Median aus zwei Zahlen ist keine Messung.
 * UMSATZ_BAND: innerhalb dieser Spanne wird der Umsatz NICHT umgerechnet. Gemessen
 * (skalen-probe-alpaca.js, 03.09.2026): Yahoo bereinigt Intraday die KURSE, aber
 * nicht die Umsaetze - bei MNST vor dem Split ist der Umsatz-Faktor Yahoo/raw 1,0001,
 * bei adjustment=split dagegen 0,5001. Was innerhalb von 5 % liegt, ist der gewoehnliche
 * Unterschied zweier Quellen (0,3 %) und keine Kapitalmassnahme. */
var SKALEN_BAND = 0.001;
var SKALEN_MIND_PAARE = 4;
var UMSATZ_BAND = 0.05;
var EICH_MIND_STEMPEL = 10;     /* je Tag noetige gemeinsame Stempel fuer eine Eichstufe */
var EICH_MAX_STUFEN = 3;        /* mehr Stufen als das heisst: nicht verstanden, also nicht schreiben */

function sag(t) { process.stdout.write(S.verdecken(t) + '\n'); }
var globalSag = sag;
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

/* ---------- Die Skala: liegen Alpaca- und Yahoo-Kerzen derselben Datei auf demselben
 *            Massstab? (03.09.2026) ----------
 *
 * WARUM DAS NOETIG WURDE. Yahoo rechnet Intraday-KURSE nach einer Kapitalmassnahme
 * rueckwirkend um, Alpaca mit adjustment=raw nicht. Der Nachholer hat deshalb bei MNST
 * (Split 2:1) und SPGI (Abspaltung) Balken auf der falschen Skala in die Yahoo-Dateien
 * geschrieben. Die alte Pruefung sah das nicht: sie mittelt ueber alle Kerzen eines
 * Werts, und ein Wert mit 66 % falsch skalierten Kerzen faellt in einer Ausreisserquote
 * mit Schwelle 2 % zwar auf, aber ohne zu sagen WORAN es liegt - "2,1 % Ausreisser"
 * las sich wie Rauschen. Ein Skalenfehler ist kein Rauschen; er hat einen Ort (ab
 * welchem Tag) und eine Groesse (den Faktor), und beides gehoert benannt.
 *
 * DER MASSSTAB IST DIE DATEI SELBST, nicht das Netz. Zwei benachbarte Kerzen desselben
 * Gitters beruehren sich: die Eroeffnung der spaeteren ist praktisch der Schluss der
 * frueheren (ein Tick Unterschied, keine Fuenf-Minuten-Bewegung). Wo an so einem
 * Kontaktpunkt die QUELLE wechselt, misst das Verhaeltnis genau eines: den Unterschied
 * der Massstaebe. Gemessen ueber 3.825 Wert-Tage: Median 0,0026 %, alle 3.757 sauberen
 * Tage unter 0,1 %, die 68 falschen bei 2,000 bzw. 1,057 - kein einziger Fehlalarm.
 * Das Tagesarchiv taugt als Vergleich NICHT: es hat denselben Fehler (MNST 06.08.
 * 47,08 gegen 07.08. 90,36). */

/** Verhaeltnis Alpaca/Yahoo an jedem Quellenwechsel zwischen zwei benachbarten Kerzen,
 *  gebuendelt je ET-Tag. serie/jeKerze wie aus KQ.quelleJeKerze; dauerMs ist der
 *  Gitterabstand des Intervalls (nur unmittelbar benachbarte Kerzen zaehlen, sonst
 *  laege eine Nacht oder eine Luecke dazwischen und man maesse die Bewegung).
 *  Quote-Kerzen (Umsatz 0) bleiben draussen: sie tragen H=T=S und keinen Handel. */
function grenzVerhaeltnisse(serie, jeKerze, dauerMs) {
  var NY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
  var aus = {};
  for (var i = 1; i < serie.length; i++) {
    var a = serie[i - 1], b = serie[i];
    if (b[0] - a[0] !== dauerMs) continue;
    var qa = jeKerze[i - 1] && jeKerze[i - 1].quelle, qb = jeKerze[i] && jeKerze[i].quelle;
    if (!qa || !qb || qa === qb) continue;
    if (qa !== 'alpaca' && qb !== 'alpaca') continue;
    if (!(a[2] > 0) || !(b[2] > 0)) continue;
    var r;
    if (qb === 'alpaca') { if (!(b[5] > 0) || !(a[1] > 0)) continue; r = b[5] / a[1]; }
    else { if (!(a[1] > 0) || !(b[5] > 0)) continue; r = a[1] / b[5]; }
    var tag = NY.format(new Date(b[0]));
    (aus[tag] || (aus[tag] = [])).push(r);
  }
  return aus;
}

/** Aus den Verhaeltnissen je Tag die Liste der Skalenabweichungen. Ein Tag zaehlt nur,
 *  wenn er mindestens SKALEN_MIND_PAARE Grenzpaare hat. */
function skalenTage(jeTag) {
  var tage = Object.keys(jeTag).sort(), gewertet = 0, abw = [];
  tage.forEach(function (t) {
    var v = jeTag[t];
    if (v.length < SKALEN_MIND_PAARE) return;
    gewertet++;
    var m = median(v);
    if (Math.abs(m - 1) > SKALEN_BAND) abw.push({ datum: t, faktor: m, paare: v.length });
  });
  return { gewertet: gewertet, uebersprungen: tage.length - gewertet, abweichungen: abw };
}

/** Die Skalenpruefung ueber die Archivdateien - liest nur, schreibt nichts, braucht kein
 *  Netz. Je Wert werden die drei Intervalldateien zusammengeworfen (ein Split trifft den
 *  Wert, nicht ein Intervall). Werte ohne Alpaca-Bereiche kommen nicht vor; Werte, deren
 *  Alpaca-Bereiche die Yahoo-Kerzen nirgends beruehren, koennen so nicht geprueft werden
 *  und werden als solche ausgewiesen - eine Luecke, die man sieht, statt eines stillen
 *  "bestanden". */
function skalenPruefungDateien(wurzel, nurSymbole) {
  var ivs = Object.keys(RAHMEN);
  var jeSym = {}, dateien = 0, fehler = [];
  var nur = nurSymbole ? nurSymbole.reduce(function (o, s) { o[s] = 1; return o; }, {}) : null;
  ivs.forEach(function (iv) {
    var ordner = path.join(wurzel, 'archiv' + iv);
    var namen;
    try { namen = fs.readdirSync(ordner); } catch (e) { fehler.push('Ordner nicht lesbar: ' + ordner); return; }
    namen.forEach(function (n) {
      var x = /^bars_(\w+)_(.+)\.json$/.exec(n);
      if (!x || x[1] !== iv) return;
      var sym = x[2];
      if (nur && !nur[sym]) return;
      var h = KQ.huelleLesen(path.join(ordner, n));
      if (!h) { fehler.push('unlesbar: ' + path.join(ordner, n)); return; }
      if (!(h.quellen || []).some(function (b) { return b.quelle === 'alpaca'; })) return;
      dateien++;
      var jk = KQ.quelleJeKerze(h.series, h.quellen);
      var g = grenzVerhaeltnisse(h.series, jk, DAUER_MS[iv]);
      var z = jeSym[sym] || (jeSym[sym] = {});
      Object.keys(g).forEach(function (t) { (z[t] || (z[t] = [])).push.apply(z[t], g[t]); });
    });
  });
  var werte = Object.keys(jeSym).sort(), abweichungen = [], ohnePaare = [], tageGewertet = 0, durchgefallen = {};
  werte.forEach(function (sym) {
    var r = skalenTage(jeSym[sym]);
    tageGewertet += r.gewertet;
    if (!r.gewertet) { ohnePaare.push(sym); return; }
    r.abweichungen.forEach(function (a) { abweichungen.push({ sym: sym, datum: a.datum, faktor: a.faktor, paare: a.paare }); durchgefallen[sym] = 1; });
  });
  abweichungen.sort(function (a, b) { return a.sym === b.sym ? (a.datum < b.datum ? -1 : 1) : (a.sym < b.sym ? -1 : 1); });
  return { dateien: dateien, werte: werte.length, geprueft: werte.length - ohnePaare.length, ohneGrenzpaare: ohnePaare,
    tageGewertet: tageGewertet, abweichungen: abweichungen, durchgefallen: Object.keys(durchgefallen).sort(), fehler: fehler };
}

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
function fortschrittLesen(pfad) {
  try { return JSON.parse(fs.readFileSync(pfad || FORTSCHRITT, 'utf8')); }
  catch (e) { return { begonnen: new Date().toISOString(), erledigt: {}, vergleich: {}, abrufe: 0, wiederholt: 0, fehler: {} }; }
}
function fortschrittSchreiben(F, pfad) {
  F.zuletzt = new Date().toISOString(); F.abrufe = Z.abrufe; F.wiederholt = Z.wiederholt; F.fehler = Z.fehler;
  fs.mkdirSync(path.dirname(pfad || FORTSCHRITT), { recursive: true });
  M.atomarSchreiben(pfad || FORTSCHRITT, JSON.stringify(F, null, 1));
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
async function kalenderHolen(von, bis, f) {
  var alt = null;
  try { alt = JSON.parse(fs.readFileSync(KALENDER, 'utf8')); } catch (e) { alt = null; }
  var a = new Date(von).toISOString().slice(0, 10), b = new Date(bis).toISOString().slice(0, 10);
  if (alt && alt.von <= a && alt.bis >= b) return alt.tage;
  var r = await hole(HANDEL + '/calendar?start=' + a + '&end=' + b, f);
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

/* ================= ERSETZEN: die Alpaca-Bereiche einer Datei neu holen =================
 *
 * Anlass (wiki/archiv-zusammenfuehrung.md Paragraph 6 Punkt 8): der Nachholer hat bei MNST
 * (Split 2:1, wirksam 11.08.2026) und SPGI (Abspaltung, wirksam 01.07.2026) Balken auf der
 * falschen Skala geschrieben, weil Yahoo Intraday-Kurse rueckwirkend umrechnet und
 * adjustment=raw nicht. Dieser Modus nimmt GENAU die Kerzen wieder heraus, die als Quelle
 * 'alpaca' eingetragen sind, holt sie neu und rechnet sie auf die Yahoo-Skala.
 *
 * WELCHE BEREINIGUNG? Gemessen, nicht geraten (studien/archiv-zusammenfuehrung-2026-09/
 * skalen-probe-alpaca.js, 03.09.2026, vier Faelle je vier Bereinigungen):
 *   raw       Kurs 2,00000 / 1,05700 vor der Massnahme, 1,00000 danach; Umsatz 1,0001
 *   split     Kurs 1,00005 (Split getroffen) aber 1,05700 (Abspaltung verfehlt);
 *             UMSATZ 0,5001 - Yahoo halbiert den historischen Umsatz NICHT
 *   dividend  verschiebt auch den Kontrolltag NACH der Massnahme (0,99776) - Yahoo
 *             bereinigt Intraday nicht um Dividenden
 *   all       dasselbe Problem wie dividend
 * KEINE Einstellung entspricht Yahoo. Deshalb Kriterium K4 der Probe: raw holen und mit
 * dem GEMESSENEN Faktor rechnen. Der Faktor wird nicht aus der Probe uebernommen, sondern
 * hier je Wert und Tag neu geeicht (eichen()) - ein Faktor, der aus einem Tag stammt und
 * auf 70 angewandt wird, waere eine Behauptung.
 *
 * DIE EICHUNG misst je ET-Tag den Median von raw/Yahoo an GEMEINSAMEN Stempeln der
 * 5m-Datei (dort tragen 64 von 69 Tagen Yahoo-Kerzen) und fasst gleiche Tage zu Stufen
 * zusammen. Tage ohne eigenen Anker erben die Stufe des Nachbarn - aber nur, wenn beide
 * Nachbarn dieselbe Stufe tragen; sonst bricht der Lauf ab, statt zu raten. */

/** Balken eines Zeitraums, ueber alle Seiten. */
async function balken(alpacaSym, iv, von, bis, bereinigung, f) {
  var alle = [], token = null, seiten = 0;
  do {
    var url = DATEN + '/stocks/bars?symbols=' + encodeURIComponent(alpacaSym) + '&timeframe=' + RAHMEN[iv] +
      '&start=' + encodeURIComponent(new Date(von).toISOString()) + '&end=' + encodeURIComponent(new Date(bis).toISOString()) +
      '&limit=' + SEITE + '&feed=sip&adjustment=' + (bereinigung || 'raw') + (token ? '&page_token=' + encodeURIComponent(token) : '');
    var r = await hole(url, f);
    seiten++;
    if (r.status !== 200) return { fehler: 'HTTP ' + r.status + ' ' + String(r.text || '').replace(/\s+/g, ' ').slice(0, 120), seiten: seiten };
    var b = r.daten && r.daten.bars ? r.daten.bars[alpacaSym] : null;
    if (Array.isArray(b)) alle = alle.concat(b);
    token = r.daten ? r.daten.next_page_token : null;
  } while (token && seiten < 200);
  return { bars: alle, seiten: seiten };
}

function etTag(ms) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
}

/** Die Kerzen mit Quelle 'alpaca' aus einer Huelle herausnehmen. Gibt den Rest, seine
 *  Quellen (neu verdichtet, damit kein Bereich ueber Kerzen behauptet wird, die es nicht
 *  mehr gibt) und die entfernten Bereiche zurueck. */
function alpacaAus(huelle) {
  var jk = KQ.quelleJeKerze(huelle.series, huelle.quellen);
  var rest = [], restJk = [], entfernt = 0, ohneQuelle = 0;
  huelle.series.forEach(function (k, i) {
    if (!jk[i]) { ohneQuelle++; return; }
    if (jk[i].quelle === 'alpaca') { entfernt++; return; }
    rest.push(k); restJk.push(jk[i]);
  });
  var bereiche = (huelle.quellen || []).filter(function (b) { return b.quelle === 'alpaca'; })
    .map(function (b) { return { von: b.von, bis: b.bis }; }).sort(function (a, b) { return a.von - b.von; });
  return { rest: rest, restQuellen: rest.length ? KQ.quellenVerdichten(rest, restJk) : [],
    entfernt: entfernt, ohneQuelle: ohneQuelle, bereiche: bereiche };
}
function inBereichen(t, bereiche) {
  for (var i = 0; i < bereiche.length; i++) { if (t >= bereiche[i].von && t <= bereiche[i].bis) return true; }
  return false;
}
/** Die capBereiche einer Reihe aus der Store-Sicherung, als Aufgabenbereiche des
 *  Nachholers (bis + Dauer - 1, genau wie plan()). Damit laesst sich seine Messung
 *  Stempel fuer Stempel wiederholen: nur ueber DIESER Menge ist der alte Beitrag zur
 *  Intervall-Tabelle exakt, statt geschaetzt. Der Store schreibt '.' als '_'. */
function capBereicheAus(sicherung, iv, sym) {
  var kandidaten = [sym, sym.replace(/\./g, '_')];
  for (var i = 0; i < kandidaten.length; i++) {
    var p = path.join(sicherung, 'bars_' + iv + '_' + kandidaten[i] + '.json');
    if (!fs.existsSync(p)) continue;
    return M.ladeStore(p).capBereiche.map(function (b) { return { von: b[0], bis: b[1] + DAUER_MS[iv] - 1 }; })
      .sort(function (x, y) { return x.von - y.von; });
  }
  return null;
}

/** Sicherung der Dateien, die gleich geschrieben werden - mit Pruefsumme, und die Kopie
 *  wird zurueckgelesen. Eine Sicherung, die man nicht liest, ist eine Behauptung.
 *  Auch die Kopie geht ueber atomarSchreiben (tmp + rename): ein Abbruch mitten in der
 *  Sicherung wuerde sonst eine halbe Datei hinterlassen - und das waere die Sicherung,
 *  auf die man sich im Ernstfall verliesse. Die Klinke in test-v6.js verlangt ohnehin,
 *  dass in dieser Datei kein nacktes writeFileSync steht. */
function sichern(pfade, ziel) {
  fs.mkdirSync(ziel, { recursive: true });
  var eintraege = [];
  pfade.forEach(function (p) {
    var roh = fs.readFileSync(p);
    var sha = crypto.createHash('sha256').update(roh).digest('hex');
    var zp = path.join(ziel, path.basename(p));
    M.atomarSchreiben(zp, roh);
    var sha2 = crypto.createHash('sha256').update(fs.readFileSync(zp)).digest('hex');
    if (sha !== sha2) throw new Error('Sicherung nicht identisch: ' + zp);
    eintraege.push({ name: path.basename(p), quelle: p, bytes: roh.length, sha256: sha });
  });
  M.atomarSchreiben(path.join(ziel, 'manifest.json'), JSON.stringify(
    { erzeugt: new Date().toISOString(), zweck: 'vor --ersetze-alpaca (Z1 Skalenreparatur)', dateien: eintraege }, null, 1));
  return eintraege;
}

/** Eichung je Wert: Median raw/Yahoo und Yahoo/raw-Umsatz je ET-Tag, aus der 5m-Datei. */
async function eichen(sym, alpacaSym, wurzel, von, bis, f) {
  var ziel = M.zielFuer(wurzel, '5m', sym);
  var h = ziel.pfad ? KQ.huelleLesen(ziel.pfad) : null;
  if (!h) throw new Error('Eichung braucht die 5m-Datei von ' + sym);
  var jk = KQ.quelleJeKerze(h.series, h.quellen);
  var yTag = {};
  h.series.forEach(function (k, i) {
    if (!jk[i] || jk[i].quelle !== 'yahoo') return;
    if (!(k[1] > 0) || !(k[2] > 0)) return;
    var t = etTag(k[0]);
    (yTag[t] || (yTag[t] = {}))[k[0]] = [k[1], k[2]];
  });
  var r = await balken(alpacaSym, '5m', von, bis, 'raw', f);
  if (r.fehler) throw new Error('Eichung ' + sym + ': ' + r.fehler);
  var kursV = {}, umsV = {};
  r.bars.forEach(function (b) {
    var t = Date.parse(b && b.t);
    if (!isFinite(t) || !(b.c > 0)) return;
    var tag = etTag(t), y = yTag[tag] && yTag[tag][t];
    if (!y) return;
    (kursV[tag] || (kursV[tag] = [])).push(b.c / y[0]);
    if (b.v > 0) (umsV[tag] || (umsV[tag] = [])).push(y[1] / b.v);
  });
  var jeTag = {};
  Object.keys(kursV).forEach(function (t) {
    if (kursV[t].length < EICH_MIND_STEMPEL) return;
    jeTag[t] = { kurs: median(kursV[t]), umsatz: median(umsV[t] || []), n: kursV[t].length };
  });
  return { jeTag: jeTag, balken: r.bars.length, seiten: r.seiten };
}

/** Aus den Tagesfaktoren Stufen machen: aufeinanderfolgende Tage mit gleichem Faktor
 *  (innerhalb SKALEN_BAND) sind eine Stufe. Ein Faktor im Band um 1 wird auf glatt 1
 *  gesetzt - sonst wuerde die Reparatur das Rauschen mit hineinrechnen. */
function eichStufen(jeTag) {
  var tage = Object.keys(jeTag).sort(), aus = [];
  for (var i = 0; i < tage.length; i++) {
    var t = tage[i], m = jeTag[t].kurs;
    var w = Math.abs(m - 1) <= SKALEN_BAND ? 1 : m;
    var l = aus[aus.length - 1];
    if (l && Math.abs(w / l.wert - 1) <= SKALEN_BAND) { l.bis = t; l.tage++; l.kurse.push(m); l.umsaetze.push(jeTag[t].umsatz); continue; }
    aus.push({ von: t, bis: t, wert: w, tage: 1, kurse: [m], umsaetze: [jeTag[t].umsatz] });
  }
  aus.forEach(function (s) {
    var mk = median(s.kurse);
    s.kursFaktor = Math.abs(mk - 1) <= SKALEN_BAND ? 1 : mk;
    var u = median(s.umsaetze.filter(function (x) { return x != null && isFinite(x) && x > 0; }));
    s.umsatzGemessen = u;
    s.umsatzFaktor = (u == null || Math.abs(u - 1) <= UMSATZ_BAND) ? 1 : u;
    delete s.kurse; delete s.umsaetze;
  });
  return aus;
}
/** Welche Stufe gilt an diesem Tag? Ein Tag ohne eigene Stufe erbt vom Nachbarn - aber
 *  nur, wenn beide Seiten dasselbe sagen (oder es nur eine Seite gibt). Sonst
 *  'unentscheidbar': dort liegt ein Stufenwechsel, und raten waere genau der Fehler,
 *  den diese Reparatur behebt. */
function stufeFuer(stufen, tag) {
  for (var i = 0; i < stufen.length; i++) if (tag >= stufen[i].von && tag <= stufen[i].bis) return { stufe: stufen[i], herkunft: 'gemessen' };
  var vor = null, nach = null;
  stufen.forEach(function (s) { if (s.bis < tag) vor = s; if (!nach && s.von > tag) nach = s; });
  if (vor && nach) {
    if (Math.abs(vor.kursFaktor / nach.kursFaktor - 1) <= SKALEN_BAND && Math.abs((vor.umsatzFaktor || 1) / (nach.umsatzFaktor || 1) - 1) <= UMSATZ_BAND) return { stufe: vor, herkunft: 'geerbt' };
    return { stufe: null, herkunft: 'unentscheidbar' };
  }
  if (vor) return { stufe: vor, herkunft: 'geerbt' };
  if (nach) return { stufe: nach, herkunft: 'geerbt' };
  return { stufe: null, herkunft: 'unentscheidbar' };
}

/** Eine Kerze auf die Yahoo-Skala rechnen. Kurse durch den Kursfaktor, Umsatz mal dem
 *  Umsatzfaktor - beide gemessen, beide meist 1 bzw. glatt. */
function aufSkala(k, kursFaktor, umsatzFaktor) {
  if (kursFaktor === 1 && umsatzFaktor === 1) return k;
  return [k[0], k[1] / kursFaktor, k[2] * umsatzFaktor, k[3] / kursFaktor, k[4] / kursFaktor, k[5] == null ? null : k[5] / kursFaktor];
}

async function ersetzeAlpaca(wurzel, opt) {
  opt = opt || {};
  var schreiben = !!opt.schreiben;
  /* opt.still: der Klinken-Lauf in test-v6.js darf nicht auf den Bildschirm schreiben.
   * Die Leck-Tests haengen dort process.stdout.write um, und eine fremde Zeile mitten
   * in ihrer Aufzeichnung waere genau die Verschachtelung, an der schon einmal drei
   * Pruefungen gleichzeitig blind wurden (wiki/fehlerformen.md). */
  var sag = opt.still ? function () {} : globalSag;
  var symbole = opt.symbole || [];
  if (!symbole.length) throw new Error('--ersetze-alpaca verlangt --symbole A,B - ohne Liste wird nichts angefasst');
  var ivs = opt.intervall ? [opt.intervall] : Object.keys(RAHMEN);
  var bericht = { erzeugt: new Date().toISOString(), modus: schreiben ? 'schreiben' : 'zaehlen', wurzel: wurzel,
    symbole: symbole, bereinigung: 'raw + gemessener Skalenfaktor (skalen-probe-alpaca.js, K4)',
    eichung: {}, dateien: [], sicherung: null, fehler: [] };

  /* Was ueberhaupt angefasst wird - und zwar VOR jeder Eichung, damit die Sicherung die
   * vollstaendige Liste kennt. */
  var arbeit = [];
  symbole.forEach(function (sym) {
    ivs.forEach(function (iv) {
      var ziel = M.zielFuer(wurzel, iv, sym);
      if (!ziel.pfad || ziel.neu || !fs.existsSync(ziel.pfad)) { bericht.fehler.push('keine Datei: ' + iv + ' ' + sym + ' (' + ziel.art + ')'); return; }
      arbeit.push({ sym: sym, iv: iv, pfad: ziel.pfad, alpacaSym: ziel.sym });
    });
  });
  if (!arbeit.length) throw new Error('Keine der genannten Dateien liegt unter ' + wurzel);

  /* ---------- Eichung je Wert ---------- */
  for (var s = 0; s < symbole.length; s++) {
    var sym = symbole[s];
    var meine = arbeit.filter(function (a) { return a.sym === sym; });
    if (!meine.length) continue;
    var von = Infinity, bis = -Infinity;
    meine.forEach(function (a) {
      var h = KQ.huelleLesen(a.pfad);
      (h && h.quellen ? h.quellen : []).forEach(function (b) { if (b.quelle === 'alpaca') { von = Math.min(von, b.von); bis = Math.max(bis, b.bis); } });
    });
    if (!isFinite(von)) { bericht.eichung[sym] = { keine: 'keine Alpaca-Bereiche' }; continue; }
    var e = await eichen(sym, meine[0].alpacaSym, wurzel, von, bis + DAUER_MS['5m'] - 1, opt.fetch);
    var st = eichStufen(e.jeTag);
    if (st.length > EICH_MAX_STUFEN) throw new Error('Eichung ' + sym + ': ' + st.length + ' Stufen - das ist nicht mehr eine Kapitalmassnahme, das wird nicht automatisch geschrieben');
    if (st.length && Math.abs(st[st.length - 1].kursFaktor - 1) > SKALEN_BAND) throw new Error('Eichung ' + sym + ': die JUENGSTE Stufe liegt bei ' + st[st.length - 1].kursFaktor.toFixed(5) + ' statt 1 - dann stimmt nicht die Alpaca-Seite, sondern der Bestand');
    bericht.eichung[sym] = { von: etTag(von), bis: etTag(bis), balken: e.balken, verankerteTage: Object.keys(e.jeTag).length, stufen: st };
    sag('Eichung ' + sym + ' (' + etTag(von) + '..' + etTag(bis) + ', ' + e.balken + ' 5Min-Balken raw, ' + Object.keys(e.jeTag).length + ' verankerte Tage):');
    st.forEach(function (x) { sag('    ' + x.von + ' .. ' + x.bis + '   ' + String(x.tage).padStart(3) + ' Tage   Kursfaktor raw/Yahoo ' + x.kursFaktor.toFixed(6) +
      '   Umsatzfaktor ' + x.umsatzFaktor.toFixed(4) + ' (gemessen ' + (x.umsatzGemessen == null ? '–' : x.umsatzGemessen.toFixed(4)) + ')'); });
  }

  /* ---------- Sicherung ---------- */
  var sicherungsZiel = opt.sicherung || path.join(wurzel, 'sicherung-vor-ersetzen-' + new Date().toISOString().slice(0, 10));
  if (schreiben) {
    bericht.sicherung = { ordner: sicherungsZiel, dateien: sichern(arbeit.map(function (a) { return a.pfad; }), sicherungsZiel) };
    sag('\nSicherung: ' + arbeit.length + ' Dateien nach ' + sicherungsZiel + ' (SHA-256, zurueckgelesen)');
  } else {
    sag('\nSicherung wuerde nach ' + sicherungsZiel + ' gehen (' + arbeit.length + ' Dateien) - im Trockenlauf nicht angelegt.');
  }

  /* ---------- Kalender fuer die regulaere Sitzung ---------- */
  var spanneVon = Infinity, spanneBis = -Infinity;
  arbeit.forEach(function (a) {
    var h = KQ.huelleLesen(a.pfad);
    (h && h.quellen ? h.quellen : []).forEach(function (b) { if (b.quelle === 'alpaca') { spanneVon = Math.min(spanneVon, b.von); spanneBis = Math.max(spanneBis, b.bis); } });
  });
  var kal = opt.kalender || await kalenderHolen(spanneVon, spanneBis, opt.fetch);

  /* ---------- Datei fuer Datei ---------- */
  var gesperrt = [];
  if (schreiben) {
    ivs.forEach(function (iv) {
      var ordner = path.join(wurzel, 'archiv' + iv);
      var sp = KQ.sperreLesen(ordner);
      if (sp.aktiv) throw new Error(ordner + ' wird gerade geschrieben (' + (sp.was || '?') + ') - spaeter starten');
      KQ.sperreSetzen(ordner, 'Z1 Alpaca-Bereiche ersetzen');
      gesperrt.push(ordner);
    });
  }
  var begonnen = new Date().toISOString();
  try {
    for (var i = 0; i < arbeit.length; i++) {
      var a = arbeit[i];
      var st2 = (bericht.eichung[a.sym] || {}).stufen || [];
      var h2 = KQ.huelleLesen(a.pfad);
      if (!h2) { bericht.fehler.push('unlesbar: ' + a.pfad); continue; }
      var A = alpacaAus(h2);
      if (A.ohneQuelle) { bericht.fehler.push(a.pfad + ': ' + A.ohneQuelle + ' Kerzen ohne Quelle - nicht angefasst'); continue; }
      if (!A.bereiche.length) { bericht.dateien.push({ datei: path.basename(a.pfad), uebersprungen: 'keine Alpaca-Bereiche' }); continue; }
      /* Der Vergleichsbereich ist NICHT der Schreibbereich. Geschrieben wird auf den
       * Stempeln, die als 'alpaca' in der Datei stehen - und dort hat die Datei per
       * Definition keine Yahoo-Kerze, es gibt also nichts zu vergleichen (auf 15m sind
       * das genau die fuenf Tage ohne Yahoo-Bestand). Der Nachholer hat seine Zahlen
       * ueber die capBereiche des Stores genommen, die viel weiter reichen; nur ueber
       * DERSELBEN Menge laesst sich sein Beitrag exakt abziehen. Fehlt die Store-
       * Sicherung, wird ueber die Alpaca-Bereiche verglichen und das gesagt. */
      var vglBereiche = (opt.store ? capBereicheAus(opt.store, a.iv, a.sym) : null) || A.bereiche;
      var vglAusStore = !!(opt.store && capBereicheAus(opt.store, a.iv, a.sym));
      var bVon = Math.min(A.bereiche[0].von, vglBereiche[0].von);
      var bBis = Math.max(A.bereiche[A.bereiche.length - 1].bis + DAUER_MS[a.iv] - 1, vglBereiche[vglBereiche.length - 1].bis);
      var r = await balken(a.alpacaSym, a.iv, bVon, bBis, 'raw', opt.fetch);
      if (r.fehler) { bericht.fehler.push(a.iv + ' ' + a.sym + ': ' + r.fehler); continue; }
      var kerzen = r.bars.map(kerzeAus).filter(Boolean);
      /* Ein Quellenbereich laeuft ueber Naechte und Wochenenden: er ist ueber STEMPEL
       * definiert, nicht ueber Handelsstunden (quellenVerdichten fasst nach der Quelle
       * zusammen, nicht nach Luecken). Zwischen erstem und letztem Alpaca-Stempel liegen
       * deshalb auch Vor- und Nachboersenbalken, die die Datei nie hatte. Erst
       * regulaer() macht daraus wieder genau die entfernte Menge - dass das aufgeht,
       * zeigt "zusaetzlicheStempel: 0" weiter unten. */
      var inRange = kerzen.filter(function (k) { return inBereichen(k[0], A.bereiche); });
      var reg = regulaer(inRange, kal);
      var ausserSitzung = inRange.length - reg.drin.length;
      /* Auf die Yahoo-Skala rechnen - je Tag nach der Eichstufe. */
      var unentscheidbar = {}, geerbt = {};
      function skaliere(k) {
        var tag = etTag(k[0]), sf = stufeFuer(st2, tag);
        if (!sf.stufe) { unentscheidbar[tag] = (unentscheidbar[tag] || 0) + 1; return null; }
        if (sf.herkunft === 'geerbt') geerbt[tag] = (geerbt[tag] || 0) + 1;
        return aufSkala(k, sf.stufe.kursFaktor, sf.stufe.umsatzFaktor);
      }
      var korr = reg.drin.map(skaliere).filter(Boolean);
      if (Object.keys(unentscheidbar).length) throw new Error(a.iv + ' ' + a.sym + ': ' + Object.keys(unentscheidbar).length + ' Tage ohne entscheidbare Eichstufe (' + Object.keys(unentscheidbar).slice(0, 5).join(', ') + ') - nichts geschrieben');
      var tNeu = trenne(korr, A.rest);
      /* DIE VERGLEICHSZAHLEN kommen NICHT aus der geschriebenen Menge: die liegt ja
       * gerade auf Stempeln, die die Datei nicht hat (deshalb 0 gemeinsame). Gemessen
       * wird ueber ALLE geholten Balken der regulaeren Sitzung - das ist dieselbe Menge,
       * an der der Nachholer seine Zahlen genommen hat, und A.rest ist der Bestand, den
       * er damals vorfand (die Yahoo-Kerzen, um die alpaca-Kerzen erleichtert). Zweimal
       * gemessen, roh und korrigiert: nur so laesst sich der alte Beitrag zur
       * Intervall-Tabelle abziehen und der neue dazuzaehlen. */
      var regAlle = regulaer(kerzen.filter(function (k) { return inBereichen(k[0], vglBereiche); }), kal);
      var vglAlt = trenne(regAlle.drin, A.rest);
      var vglNeu = trenne(regAlle.drin.map(skaliere).filter(Boolean), A.rest);
      var v = KQ.zusammenfuehren(A.rest, tNeu.neu, a.iv, { quellenAlt: A.restQuellen, quelleNeu: 'alpaca', sym: a.sym });
      var drin = {}; v.serie.forEach(function (k) { drin[k[0]] = 1; });
      var rasterVerlust = 0; tNeu.neu.forEach(function (k) { if (!drin[k[0]]) rasterVerlust++; });
      var zusatz = 0, alteStempel = {};
      h2.series.forEach(function (k, ix) { alteStempel[k[0]] = 1; void ix; });
      tNeu.neu.forEach(function (k) { if (!alteStempel[k[0]]) zusatz++; });
      var z = { datei: path.basename(a.pfad), pfad: a.pfad, intervall: a.iv, sym: a.sym,
        vorher: h2.series.length, entfernt: A.entfernt, bereiche: A.bereiche.length,
        geholt: r.bars.length, imBereich: inRange.length, ausserSitzungImBereich: ausserSitzung,
        neu: tNeu.neu.length, geerbteTage: Object.keys(geerbt).length,
        zusaetzlicheStempel: zusatz, rasterVerlust: rasterVerlust, nachher: v.serie.length,
        gemeinsam: vglAlt.gemeinsam, ueber01Alt: vglAlt.ueber01, ueber01Neu: vglNeu.ueber01,
        vergleichAusStore: vglAusStore, medianAlt: median(vglAlt.abw), medianNeu: median(vglNeu.abw), seiten: r.seiten,
        trenne: { neu: vglNeu, alt: vglAlt } };
      bericht.dateien.push(z);
      sag('  ' + z.datei.padEnd(22) + 'vorher ' + String(z.vorher).padStart(6) + '  entfernt ' + String(z.entfernt).padStart(6) +
        '  neu ' + String(z.neu).padStart(6) + '  nachher ' + String(z.nachher).padStart(6) +
        '  Vergleich ' + String(z.gemeinsam).padStart(5) + (z.vergleichAusStore ? ' Stempel (capBereiche)' : ' Stempel (Alpaca-Bereiche)') + ', ueber 0,1 % ' + z.ueber01Alt + ' -> ' + z.ueber01Neu +
        (z.zusaetzlicheStempel ? '  ZUSATZ ' + z.zusaetzlicheStempel : '') + (z.rasterVerlust ? '  RASTER ' + z.rasterVerlust : '') +
        (z.geerbteTage ? '  geerbte Tage ' + z.geerbteTage : ''));
      if (schreiben) {
        M.atomarSchreiben(a.pfad, JSON.stringify(KQ.satz(a.alpacaSym, a.iv, v.serie, {
          quellen: v.quellen, waehrung: h2.waehrung, boerse: h2.boerse,
          quelle: h2.quelle || 'alpaca v2 stocks/bars, feed=sip, adjustment=raw (Z1-Nachholer)',
          spannen: h2.spannen })));
      }
    }
  } finally {
    gesperrt.forEach(function (ordner) {
      KQ.sperreLoesen(ordner);
      KQ.laufProtokoll(ordner, [begonnen, new Date().toISOString(), path.basename(ordner).replace('archiv', ''), 'Z1-Alpaca-ersetzen',
        'symbole=' + symbole.join('+'), 'dateien=' + bericht.dateien.length, 'abrufe=' + Z.abrufe, 'pid=' + process.pid].join('  '));
    });
  }

  /* ---------- Fortschritt nachfuehren ---------- */
  if (schreiben) {
    var F = fortschrittLesen(opt.fortschritt);
    symbole.forEach(function (sy) { if (F.vergleichSym) delete F.vergleichSym[sy]; });
    F.ersetzt = F.ersetzt || { laeufe: [], jeIv: {} };
    var jeIv = {};
    bericht.dateien.forEach(function (d) {
      if (!d.trenne) return;
      vergleichMerken(F, d.intervall, d.sym, d.trenne.neu);
      var e = jeIv[d.intervall] || (jeIv[d.intervall] = { gemeinsam: 0, ueber01Alt: 0, ueber01Neu: 0 });
      e.gemeinsam += d.gemeinsam; e.ueber01Alt += d.ueber01Alt; e.ueber01Neu += d.ueber01Neu;
    });
    Object.keys(jeIv).forEach(function (iv) {
      var z = F.ersetzt.jeIv[iv] || (F.ersetzt.jeIv[iv] = { gemeinsam: 0, ueber01Alt: 0, ueber01Neu: 0 });
      z.gemeinsam += jeIv[iv].gemeinsam; z.ueber01Alt += jeIv[iv].ueber01Alt; z.ueber01Neu += jeIv[iv].ueber01Neu;
    });
    F.ersetzt.laeufe.push({ am: new Date().toISOString(), symbole: symbole, sicherung: sicherungsZiel,
      dateien: bericht.dateien.map(function (d) { return { datei: d.datei, entfernt: d.entfernt, neu: d.neu, nachher: d.nachher }; }) });
    fortschrittSchreiben(F, opt.fortschritt);
    sag('\nFortschritt nachgefuehrt: vergleichSym fuer ' + symbole.join(', ') + ' neu, Korrektur der Intervall-Tabelle in "ersetzt" eingetragen.');
  }
  bericht.dateien.forEach(function (d) { delete d.trenne; });
  return bericht;
}

/* ---------- Pruefen: Aequivalenz Alpaca gegen Yahoo aus dem Fortschritt ---------- */
/** F optional (Test-Einspeisung); ohne Argument wird der echte Fortschritt gelesen.
 *  wurzel: Archivwurzel fuer die Skalenpruefung aus den Dateien. Ohne Angabe wird sie
 *  aus dem Ort des Fortschritts abgeleitet; bei eingespeistem F entfaellt sie, denn
 *  eine erfundene Fortschrittsdatei gegen echte Archivdateien zu halten waere eine
 *  Mischung aus zwei Wirklichkeiten. null schaltet sie ausdruecklich ab. */
function pruefen(F, wurzel) {
  var eingespeist = !!F;
  F = F || fortschrittLesen();
  if (wurzel === undefined) wurzel = eingespeist ? null : path.dirname(FORTSCHRITT);
  var zeilen = ['| Intervall | gemeinsame Stempel | Schluss median | Schluss max | ueber 0,1 % | Umsatz-Faktor median (n) | Urteil |', '|---|---|---|---|---|---|---|'];
  var alleOk = true, welche = 0, korrigiert = [];
  Object.keys(F.vergleich || {}).forEach(function (iv) {
    var v = F.vergleich[iv];
    var med = median(v.abw), max = v.abw.length ? Math.max.apply(null, v.abw) : null, fm = median(v.faktoren);
    /* Die Zaehler der ERSETZTEN Werte werden ausgetauscht, nicht die Stichprobe: der
     * Ersetzen-Lauf misst denselben Zeitraum zweimal (roh wie der Nachholer, und
     * korrigiert), und nur damit laesst sich der alte Beitrag exakt abziehen. Die
     * Spalten "Schluss median/max" stammen aus der gedeckelten Stichprobe und tragen
     * fuer die ersetzten Werte weiter die Zahlen von vorher - das steht unter der
     * Tabelle, statt dass hier eine korrigierte Zahl behauptet wird, die niemand
     * nachrechnen kann. */
    var k = F.ersetzt && F.ersetzt.jeIv ? F.ersetzt.jeIv[iv] : null;
    var ueber = v.ueber01 - (k ? k.ueber01Alt : 0) + (k ? k.ueber01Neu : 0);
    if (k) korrigiert.push(iv + ' ' + v.ueber01 + ' -> ' + ueber);
    var okS = med != null && med <= 0.001 && ueber <= 0.02 * v.gemeinsam, okU = fm != null && fm >= 0.8 && fm <= 1.25;
    welche++;
    if (!(okS && okU)) alleOk = false;
    zeilen.push('| ' + iv + ' | ' + v.gemeinsam + ' | ' + (med == null ? '–' : (med * 100).toFixed(4) + ' %') + ' | ' + (max == null ? '–' : (max * 100).toFixed(3) + ' %') +
      ' | ' + ueber + (k ? ' (roh ' + v.ueber01 + ')' : '') + ' | ' + (fm == null ? '–' : fm.toFixed(3)) + ' (' + v.faktoren.length + ') | ' + (okS && okU ? 'Quelle stimmt' : 'ABWEICHUNG') + ' |');
  });
  if (korrigiert.length) zeilen.push('', 'Zaehler "ueber 0,1 %" korrigiert um die ersetzten Werte (' +
    ((F.ersetzt.laeufe || []).map(function (l) { return l.symbole.join('+'); }).join(', ') || '?') + '): ' + korrigiert.join(', ') +
    '. Die Spalten Schluss median/max stammen aus der gedeckelten Stichprobe und tragen fuer diese Werte noch die Zahlen von vor der Ersetzung.');
  var erledigt = Object.keys(F.erledigt || {}).length;
  var summe = { geschrieben: 0, neu: 0, gemeinsam: 0, ausserhalb: 0, rasterVerlust: 0 };
  Object.keys(F.erledigt || {}).forEach(function (k) { var e = F.erledigt[k]; Object.keys(summe).forEach(function (f) { summe[f] += e[f] || 0; }); });
  /* Stoppregel aus wiki/archiv-zusammenfuehrung.md Paragraph 6 Punkt 2, Auflage 3: dasselbe
   * Kriterium wie die Probe (Median <= 0,1 %, <= 2 % der Kerzen ueber 0,1 %), aber je WERT
   * (Symbol) geurteilt statt je Intervall - ein Wert zaehlt als durchgefallen, sobald er in
   * IRGENDEINEM Intervall durchfaellt (alle seine gemeinsamen Stempel gepoolt). */
  /* ---------- Skalenpruefung aus den Archivdateien (03.09.2026) ----------
   * Die Ausreisserquote sagt "2,1 % der Kerzen weichen ab" und laesst offen, ob das
   * Rauschen ist oder ein Massstab. Diese Pruefung sagt es: sie misst je Wert und TAG
   * den Median des Verhaeltnisses Alpaca/Yahoo an den Quellengrenzen und nennt Wert,
   * Datum und Faktor. Ein Wert mit auch nur einem solchen Tag ist durchgefallen -
   * unabhaengig von der Ausreisserquote, denn ein halbierter Kurs bleibt ein halbierter
   * Kurs, auch wenn er nur ein Drittel der Reihe betrifft. */
  var skala = null, skalaText = '';
  if (wurzel) {
    try { skala = skalenPruefungDateien(wurzel); }
    catch (e) { skala = { fehler: ['Skalenpruefung nicht moeglich: ' + String(e && e.message || e)], abweichungen: [], durchgefallen: [], werte: 0, geprueft: 0, tageGewertet: 0, ohneGrenzpaare: [] }; }
    var sz = ['Skalenpruefung (aus den Archivdateien unter ' + wurzel + ', ohne Netz): ' + skala.geprueft + ' von ' + skala.werte +
      ' Werten mit Alpaca-Bereichen pruefbar, ' + skala.tageGewertet + ' Wert-Tage gewertet (je Tag mindestens ' + SKALEN_MIND_PAARE + ' Quellengrenzen).'];
    if (skala.abweichungen.length) {
      sz.push('SKALENABWEICHUNGEN (Tagesmedian Alpaca/Yahoo ausserhalb ' + (1 - SKALEN_BAND).toFixed(3) + '–' + (1 + SKALEN_BAND).toFixed(3) + '): ' + skala.abweichungen.length + ' Tage');
      sz.push('| Wert | Datum | Faktor Alpaca/Yahoo | Grenzpaare |', '|---|---|---|---|');
      skala.abweichungen.slice(0, 100).forEach(function (a) { sz.push('| ' + a.sym + ' | ' + a.datum + ' | ' + a.faktor.toFixed(5) + ' | ' + a.paare + ' |'); });
      if (skala.abweichungen.length > 100) sz.push('… und ' + (skala.abweichungen.length - 100) + ' weitere Tage');
      sz.push('Werte mit Skalenabweichung (durchgefallen, unabhaengig von der Ausreisserquote): ' + skala.durchgefallen.join(', '));
    } else {
      sz.push('Keine Skalenabweichung: jeder gewertete Tag liegt im Band ' + (1 - SKALEN_BAND).toFixed(3) + '–' + (1 + SKALEN_BAND).toFixed(3) + '.');
    }
    if (skala.ohneGrenzpaare.length) sz.push('Nicht pruefbar (keine Quellengrenze zwischen Alpaca und Yahoo): ' + skala.ohneGrenzpaare.length + ' Werte.');
    (skala.fehler || []).forEach(function (f) { sz.push('HINWEIS: ' + f); });
    skalaText = '\n\n' + sz.join('\n');
  }
  var skalaDurch = {};
  if (skala) skala.durchgefallen.forEach(function (s) { skalaDurch[s] = 1; });

  var symDurch = 0, symGesamt = 0, durchNamen = [];
  Object.keys(F.vergleichSym || {}).forEach(function (sym) {
    var v = F.vergleichSym[sym];
    if (!v.gemeinsam) return;
    symGesamt++;
    var med = median(v.abw);
    var okS = med != null && med <= 0.001 && v.ueber01 <= 0.02 * v.gemeinsam;
    if (!okS || skalaDurch[sym]) { symDurch++; durchNamen.push(sym); }
  });
  var symQuote = symGesamt ? symDurch / symGesamt : 0;
  var symZeile = 'Werte durchgefallen: ' + symDurch + ' von ' + symGesamt + ' (Kriterium wie Probe: Median <= 0,1 % und <= 2 % der Kerzen ueber 0,1 %' +
    (skala ? '; dazu: jede Skalenabweichung' : '') + ')' + (durchNamen.length ? ': ' + durchNamen.join(', ') : '');
  var stoppZeile = symGesamt === 0 ? 'Noch keine Werte verglichen.' :
    (symQuote > 0.10 ? 'STOPP: Vollsammlung nicht starten' : 'unter der Stoppregel (<= 10 % durchgefallen) - Vollsammlung darf starten.');
  return { text: 'Erledigte Aufgaben: ' + erledigt + ', Abrufe ' + (F.abrufe || 0) + ', Fehlschlaege ' + Object.keys(F.fehlschlaege || {}).length + '\n' +
    'Balken: gemeinsam mit Yahoo ' + summe.gemeinsam + ', neu ' + summe.neu + ', geschrieben ' + summe.geschrieben + ', ausserhalb des Zeitraums ' + summe.ausserhalb + ', vom Raster verworfen ' + summe.rasterVerlust + '\n\n' + zeilen.join('\n') +
    '\n\n' + (welche ? (alleOk ? 'Alle Intervalle: Quelle stimmt (Schluss <= 0,1 %, Umsatz-Faktor 0,8–1,25).' : 'MINDESTENS EIN INTERVALL WEICHT AB - Balken sind nicht dasselbe wie Yahoo.') : 'Noch kein Vergleich im Fortschritt.') +
    skalaText + '\n\n' + symZeile + '\n' + stoppZeile,
    skala: skala, ok: welche > 0 && alleOk && symQuote <= 0.10 && (!skala || skala.abweichungen.length === 0) };
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
  /* ---------- G: die Skalenpruefung findet einen erfundenen Split ----------
   * Eine Pruefung, die nur an echten Daten "nichts gefunden" sagt, hat nichts gezeigt.
   * Hier wird ein Wert GEBAUT, dessen Alpaca-Kerzen ab dem zweiten Tag halbiert sind -
   * die Pruefung muss genau diesen Tag mit Faktor 0,5 nennen und den ersten in Ruhe
   * lassen. Danach dasselbe ohne Halbierung: dann darf sie nichts finden. */
  console.log('Kontrolle G: Skalenpruefung - Positivkontrolle und Gegenprobe');
  function kunstReihe(faktorTag2) {
    var serie = [], jeKerze = [];
    [Date.parse('2026-03-02T14:30:00Z'), Date.parse('2026-03-03T14:30:00Z')].forEach(function (start, tag) {
      var f = tag === 1 ? faktorTag2 : 1;
      for (var i = 1; i < 20; i++) {
        var alpaca = i % 2 === 1;
        var s = alpaca ? f : 1;
        /* Kerzen beruehren sich: die Eroeffnung ist der Schluss der vorigen. Genau
         * darauf ruht die Messung - ohne diese Eigenschaft maesse sie die Bewegung. */
        var vor = 100 + (i - 1) * 0.1, jetzt = 100 + i * 0.1;
        serie.push([start + i * 300000, jetzt * s, 1000, jetzt * s, vor * s, vor * s]);
        jeKerze.push({ quelle: alpaca ? 'alpaca' : 'yahoo', abgeleitet: null });
      }
    });
    return { serie: serie, jeKerze: jeKerze };
  }
  var kG = kunstReihe(0.5);
  var gG = grenzVerhaeltnisse(kG.serie, kG.jeKerze, 300000);
  var sG = skalenTage(gG);
  pruefe(sG.abweichungen.length === 1 && sG.abweichungen[0].datum === '2026-03-03' && Math.abs(sG.abweichungen[0].faktor - 0.5) < 1e-9 && sG.gewertet === 2,
    'G: ein Kunstwert mit Faktor 0,5 ab dem 03.03. wird gefunden - mit Datum und Faktor, und der saubere Tag bleibt sauber',
    sG.abweichungen.map(function (a) { return a.datum + ' ' + a.faktor; }));
  var kG2 = kunstReihe(1);
  var sG2 = skalenTage(grenzVerhaeltnisse(kG2.serie, kG2.jeKerze, 300000));
  pruefe(sG2.abweichungen.length === 0 && sG2.gewertet === 2,
    'G: dieselbe Reihe ohne Halbierung wird nicht beanstandet - die Pruefung faerbt nicht alles rot', sG2.abweichungen.length);
  /* Und die Quellen der Kunstreihe halten quellenVerdichten stand - sonst pruefte G eine
   * Reihe, die es im Archiv gar nicht geben koennte. Sie hat 38 Kerzen und 37 Bereiche:
   * die letzte Kerze des ersten Tages und die erste des zweiten sind beide 'alpaca' und
   * werden zu EINEM Bereich - Bereiche sind ueber Stempel definiert, nicht ueber Tage. */
  var qG = KQ.quellenVerdichten(kG.serie, kG.jeKerze);
  pruefe(qG.length === kG.serie.length - 1 && qG.filter(function (b) { return b.quelle === 'alpaca'; }).length > 1 &&
    qG.filter(function (b) { return b.quelle === 'yahoo'; }).length > 1,
    'G: die Kunstreihe wechselt bei fast jeder Kerze die Quelle - genau die Lage, in der Grenzpaare entstehen', [kG.serie.length, qG.length]);

  /* ---------- H: Eichstufen und das Erben ---------- */
  console.log('Kontrolle H: Eichung - Stufen, Erben, und das Nein bei einem Stufenwechsel');
  var jeTagH = { '2026-06-02': { kurs: 2.00001, umsatz: 1.0001, n: 70 }, '2026-06-03': { kurs: 1.99998, umsatz: 0.9998, n: 70 },
                 '2026-06-05': { kurs: 1.00004, umsatz: 1.0002, n: 70 }, '2026-06-08': { kurs: 0.99997, umsatz: 1.0000, n: 70 } };
  var stH = eichStufen(jeTagH);
  pruefe(stH.length === 2 && Math.abs(stH[0].kursFaktor - 2) < 1e-4 && stH[0].umsatzFaktor === 1 && stH[1].kursFaktor === 1 &&
    stH[0].von === '2026-06-02' && stH[0].bis === '2026-06-03' && stH[1].von === '2026-06-05',
    'H: zwei Stufen (Faktor 2 und 1); ein Umsatzfaktor von 1,0001 bleibt glatt 1 - Rauschen wird nicht mitgerechnet',
    stH.map(function (s) { return s.von + '..' + s.bis + ' ' + s.kursFaktor.toFixed(5) + '/' + s.umsatzFaktor; }));
  pruefe(stufeFuer(stH, '2026-06-03').herkunft === 'gemessen' && stufeFuer(stH, '2026-05-29').herkunft === 'geerbt' &&
    stufeFuer(stH, '2026-05-29').stufe.kursFaktor === stH[0].kursFaktor && stufeFuer(stH, '2026-06-09').stufe.kursFaktor === 1,
    'H: ein Tag vor der ersten Stufe erbt nach vorn, einer nach der letzten nach hinten');
  pruefe(stufeFuer(stH, '2026-06-04').herkunft === 'unentscheidbar' && stufeFuer(stH, '2026-06-04').stufe === null,
    'H: ein Tag GENAU zwischen zwei verschiedenen Stufen ist unentscheidbar - dort wird nicht geraten, sondern abgebrochen');
  var kH = [1000, 50, 200, 51, 49, 49.5];
  pruefe(aufSkala(kH, 2, 1)[1] === 25 && aufSkala(kH, 2, 1)[3] === 25.5 && aufSkala(kH, 2, 1)[4] === 24.5 && aufSkala(kH, 2, 1)[5] === 24.75 &&
    aufSkala(kH, 2, 1)[2] === 200 && aufSkala(kH, 2, 1)[0] === 1000 && aufSkala(kH, 1, 1) === kH,
    'H: aufSkala() teilt alle VIER Kursfelder und laesst Stempel und Umsatz in Ruhe; Faktor 1 gibt dieselbe Kerze zurueck', aufSkala(kH, 2, 1));

  /* ---------- I: Ersetzen nimmt nur Alpaca heraus ---------- */
  console.log('Kontrolle I: alpacaAus() - nur die Alpaca-Kerzen, und die Quellen des Rests stimmen');
  var serieI = [], jkI = [];
  for (var iI = 0; iI < 10; iI++) { serieI.push([1000 + iI, 10 + iI, 5, 11, 9, 10]); jkI.push({ quelle: iI >= 3 && iI <= 6 ? 'alpaca' : 'yahoo', abgeleitet: null }); }
  var huelleI = { series: serieI, quellen: KQ.quellenVerdichten(serieI, jkI) };
  var aI = alpacaAus(huelleI);
  /* Der Rest traegt EINEN yahoo-Bereich, nicht zwei: quellenVerdichten fasst nach der
   * QUELLE zusammen, nicht nach Luecken - so wie ein yahoo-Bereich auch ueber Naechte
   * und Wochenenden laeuft. Das ist genau richtig, denn quellenAlt wird nur gebraucht,
   * um den VORHANDENEN Kerzen ihre Quelle zu geben; die Luecke traegt keine. */
  pruefe(aI.entfernt === 4 && aI.rest.length === 6 && aI.bereiche.length === 1 && aI.bereiche[0].von === 1003 && aI.bereiche[0].bis === 1006 &&
    aI.rest.every(function (k) { return k[0] < 1003 || k[0] > 1006; }) &&
    aI.restQuellen.length === 1 && aI.restQuellen[0].quelle === 'yahoo' && aI.ohneQuelle === 0,
    'I: vier Alpaca-Kerzen raus, sechs Yahoo-Kerzen unveraendert drin, der Bereich exakt getroffen, der Rest traegt nur noch yahoo',
    [aI.entfernt, aI.rest.length, aI.restQuellen.map(function (b) { return b.quelle; })]);
  /* Und die Gegenprobe zur Zeile darueber: die sechs Yahoo-Kerzen sind DIESELBEN
   * Objekte wie vorher - "nur alpaca raus" heisst auch "yahoo nicht angefasst". */
  pruefe(aI.rest.every(function (k, ix) { return k === serieI[ix < 3 ? ix : ix + 4]; }),
    'I: die Yahoo-Kerzen gehen unveraendert durch - Wert fuer Wert dieselbe Kerze');
  pruefe(inBereichen(1003, aI.bereiche) && inBereichen(1006, aI.bereiche) && !inBereichen(1002, aI.bereiche) && !inBereichen(1007, aI.bereiche),
    'I: der Bereich ist beidseitig einschliesslich - genau die entfernten Stempel werden neu geholt');

  console.log('Kontrolle F: Freigabe und Wachen');
  var fg = freigabe();
  console.log('  Freigabe der Probe: ' + (fg.da ? (fg.bestanden ? (fg.nachtrag ? 'BESTANDEN ueber Nachtrag-Freigabe (' + fg.erzeugt + ')' : 'BESTANDEN (' + fg.erzeugt + ')') : 'da, aber NICHT bestanden') : 'liegt nicht vor - Wilhelm muss die Probe erst fahren'));
  console.log('  R5: ' + (M.r5Behoben() ? 'behoben' : 'NICHT behoben - --holen wird verweigert'));
  console.log(fehler.length ? '\nKONTROLLE NICHT BESTANDEN: ' + fehler.length + ' Fehler' : '\nKontrolle bestanden (A–E, G–I).');
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
  if (process.argv.indexOf('--pruefen') >= 0) { var p = pruefen(undefined, arg('--wurzel', undefined)); sag(p.text); process.exit(p.ok ? 0 : 1); }
  /* --ersetze-alpaca braucht keine Store-Sicherung: es holt nicht nach, was der Store
   * verworfen hat, sondern ersetzt, was in der Datei schon als 'alpaca' steht. */
  if (process.argv.indexOf('--ersetze-alpaca') >= 0) {
    var wE = process.argv[2] && process.argv[2].charAt(0) !== '-' ? process.argv[2] : arg('--wurzel', path.dirname(FORTSCHRITT));
    var symE = arg('--symbole', null);
    var schreibenE = process.argv.indexOf('--schreiben') >= 0;
    if (!symE) { console.error('--ersetze-alpaca verlangt --symbole A,B'); process.exit(2); }
    if (!kontrolle()) { console.error('Ohne bestandene Kontrolle kein Lauf.'); process.exit(1); }
    var fgE = freigabe();
    if (!fgE.bestanden) { console.error('\nVERWEIGERT: keine bestandene Probe unter ' + FREIGABE + '.'); process.exit(1); }
    if (!M.r5Behoben()) { console.error('\nVERWEIGERT: rasterFilter() loescht auf 1m/5m/15m noch die volle Stunde mitten am Tag (R5).'); process.exit(1); }
    if (M.imSammelfenster()) { console.error('\nVERWEIGERT: 21:30–23:00 UTC ist das Sammelfenster der App.'); process.exit(1); }
    if (!S.vorhanden()) { console.error('\nUmgebungswerte fehlen (' + S.fehlend().join(', ') + '). In DEINEM Terminal setzen.'); process.exit(1); }
    sag('\nErsetzen der Alpaca-Bereiche in ' + wE + ' fuer ' + symE + (schreibenE ? '  — SCHREIBEN' : '  — Trockenlauf, es wird nichts geschrieben') + '\n');
    ersetzeAlpaca(wE, { symbole: symE.split(','), intervall: arg('--intervall', null), schreiben: schreibenE,
      sicherung: arg('--sicherung', null), store: arg('--store', null) })
      .then(function (b) {
        var summe = b.dateien.reduce(function (s, d) { return { entfernt: s.entfernt + (d.entfernt || 0), neu: s.neu + (d.neu || 0) }; }, { entfernt: 0, neu: 0 });
        sag('\nSumme: ' + b.dateien.length + ' Dateien, entfernt ' + summe.entfernt + ', neu ' + summe.neu + ', Abrufe ' + Z.abrufe);
        if (b.fehler.length) sag('Fehler: ' + b.fehler.join(' | '));
        var ziel = arg('--bericht', null);
        if (ziel) { M.atomarSchreiben(ziel, JSON.stringify(b, null, 1)); sag('Bericht: ' + ziel); }
        if (!schreibenE) sag('\nNur gezaehlt, nichts geschrieben. Mit --schreiben wird ersetzt (Sicherung laeuft vorher).');
        process.exit(b.fehler.length ? 1 : 0);
      }, function (e) { console.error('ABBRUCH: ' + S.verdecken(String(e && e.message || e))); process.exit(1); });
  } else {
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
}

module.exports = { kerzeAus: kerzeAus, regulaer: regulaer, imZeitraum: imZeitraum, trenne: trenne, abrufeFuer: abrufeFuer, handelstage: handelstage,
  plan: plan, pruefen: pruefen, freigabe: freigabe, vergleichMerken: vergleichMerken, kontrolle: kontrolle, hole: hole,
  grenzVerhaeltnisse: grenzVerhaeltnisse, skalenTage: skalenTage, skalenPruefungDateien: skalenPruefungDateien,
  alpacaAus: alpacaAus, inBereichen: inBereichen, eichStufen: eichStufen, stufeFuer: stufeFuer, aufSkala: aufSkala,
  sichern: sichern, ersetzeAlpaca: ersetzeAlpaca, etTag: etTag,
  SKALEN_BAND: SKALEN_BAND, SKALEN_MIND_PAARE: SKALEN_MIND_PAARE, UMSATZ_BAND: UMSATZ_BAND,
  FREIGABE: FREIGABE, FREIGABE_NACHTRAG: FREIGABE_NACHTRAG, RATE_JE_MIN: RATE_JE_MIN };

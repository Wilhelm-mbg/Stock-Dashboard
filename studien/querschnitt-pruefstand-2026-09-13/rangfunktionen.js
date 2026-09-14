'use strict';
/* RANGFUNKTIONEN - die drei Kontrollen und die Leck-Probe (VORREGISTRIERUNG §3, §2.8).
 *
 * Eine Rangfunktion bekommt (sicht, liste, tafel) und liefert eine Float64Array mit einem Rangwert je
 * Eintrag der Liste. Hoeherer Wert = weiter oben. NaN = das Papier faellt an diesem Tag heraus.
 *
 * Sie darf NUR ueber `sicht` auf die Tafel zugreifen. `sicht.zeile(sym, tag)` meldet jeden Zugriff auf
 * einen Tag NACH dem Signaltag - ausser die Sicht traegt den Orakel-Schluessel.
 *
 * Kandidatensignale stehen hier NICHT. Teil 1 hat keine.
 */
var K = require('./konfig.js');
var ST = require('./statistik.js');

/* ---------- (1) Orakel: die Rendite von morgen (§3.1) ---------- */
/** Fassung 1: bereinigte Rendite des AUSFUEHRUNGSTAGS t+1, Eroeffnung -> Schluss. */
function orakelTag(sicht, liste, T) {
  var aus = new Float64Array(liste.length), g = T.g;
  for (var i = 0; i < liste.length; i++) {
    var z = sicht.zeile(liste[i].sym, liste[i].naechsterTag);          /* braucht den Schluessel */
    aus[i] = (z >= 0) ? g.renditeOC[z] : NaN;
  }
  return aus;
}
orakelTag.$name = 'orakel-tag';
orakelTag.$orakel = true;

/** Fassung 2 (Kreuzprobe): bereinigte Rendite ueber die GANZE Halteperiode,
 *  Eroeffnung(Ausfuehrungstag) -> Eroeffnung(naechster Ausfuehrungstag). Faellt eine Reihe vorher aus
 *  (Delisting), traegt sie ihren letzten Kurs - sonst waere das Orakel gegen Tote blind. */
function orakelPeriode(sicht, liste, T, info) {
  var aus = new Float64Array(liste.length), g = T.g;
  for (var i = 0; i < liste.length; i++) {
    var z1 = sicht.zeile(liste[i].sym, info.a);
    var z2 = sicht.zeile(liste[i].sym, info.aEnde);
    if (z2 < 0) { var letzte = T.letzteZeile(liste[i].sym); if (letzte >= 0 && g.tag[letzte] > info.a && g.tag[letzte] < info.aEnde) z2 = letzte; }
    aus[i] = (z1 >= 0 && z2 >= 0 && g.bEroeffnung[z1] > 0 && g.bEroeffnung[z2] > 0) ? 100 * (g.bEroeffnung[z2] / g.bEroeffnung[z1] - 1) : NaN;
  }
  return aus;
}
orakelPeriode.$name = 'orakel-periode';
orakelPeriode.$orakel = true;

/* ---------- (2) Zufall: fester Generator, kein Kursbezug (§3.2) ---------- */
function zufallFabrik(saat) {
  function f(sicht, liste, T) {
    var aus = new Float64Array(liste.length);
    for (var i = 0; i < liste.length; i++) aus[i] = ST.mulberry32(ST.fnv(saat + '|' + T.symName[liste[i].sym] + '|' + sicht.tag))();
    return aus;
  }
  f.$name = 'zufall:' + saat;
  return f;
}

/* ---------- (3) Momentum 12-1 (§3.3) ---------- */
/** Schluss der 21. Panelzeile vor t geteilt durch die 252. - beides VOR t, kein Zugriff auf spaeter. */
function momentum12_1(sicht, liste, T) {
  var aus = new Float64Array(liste.length), g = T.g;
  for (var i = 0; i < liste.length; i++) {
    var z = liste[i].zeile;
    var zA = sicht.zurueck(z, K.MOM_UEBERSPRINGEN);
    var zB = sicht.zurueck(z, K.MOM_FENSTER);
    aus[i] = (zA >= 0 && zB >= 0 && g.bSchluss[zB] > 0 && g.bSchluss[zA] > 0) ? 100 * (g.bSchluss[zA] / g.bSchluss[zB] - 1) : NaN;
  }
  return aus;
}
momentum12_1.$name = 'momentum-12-1';

/* ---------- (4) Leck-Probe: benutzt absichtlich Daten von t+1 OHNE Schluessel (§2.8) ---------- */
function leckProbe(sicht, liste, T) {
  var aus = new Float64Array(liste.length), g = T.g;
  for (var i = 0; i < liste.length; i++) {
    var z = sicht.zeile(liste[i].sym, sicht.tag + 1);                  /* verboten - muss gemeldet werden */
    aus[i] = (z >= 0) ? g.renditeOC[z] : 0;
  }
  return aus;
}
leckProbe.$name = 'leck-probe';

/* ---------- (5) Gegenprobe zur Klinke: saubere Rangfunktion, darf NULL Verstoesse erzeugen ---------- */
function sauberProbe(sicht, liste, T) {
  var aus = new Float64Array(liste.length), g = T.g;
  for (var i = 0; i < liste.length; i++) {
    var z = sicht.zeile(liste[i].sym, sicht.tag);                       /* genau der Signaltag - erlaubt */
    aus[i] = (z >= 0) ? g.rendite[z] : NaN;
  }
  return aus;
}
sauberProbe.$name = 'sauber-probe';

/* =========================================================================================
 * TEIL 2 - die vier VORREGISTRIERTEN Kandidaten (VORREGISTRIERUNG-TEIL2.md §T2.3).
 *
 * Rangkonvention des Pruefrahmens: hoeherer Rangwert => Long-Dezil. Wo das UNTERE Ende gekauft wird,
 * traegt die Rangfunktion das Vorzeichen '-' in sich. Die Richtung steht in der Vorregistrierung, VOR
 * der Messung; das jeweils andere Ende ist Diagnose (Short-Dezil) und KEIN zweiter Test.
 *
 * Alle vier lesen ausschliesslich die Zeile an t und - ueber sicht.zurueck - Zeilen davor. Sie rufen
 * NIE sicht.zeile(sym, tg > t) und NIE K.gruende() (Warnung 1, §T2.5): der Grund fuer das Verschwinden
 * einer Reihe ist erst NACH dem Ereignis bekannt und waere ein Leck, das die Sperrklinke nicht faengt.
 * ========================================================================================= */

/** K1 - Kurzfrist-Umkehr: Rang nach der Rendite der letzten 5 Handelstage, gekauft wird das UNTERE Ende. */
function k1Umkehr(sicht, liste, T) {
  var aus = new Float64Array(liste.length), g = T.g;
  for (var i = 0; i < liste.length; i++) {
    var z = liste[i].zeile, zV = sicht.zurueck(z, K.K1_FENSTER);
    aus[i] = (zV >= 0 && g.bSchluss[zV] > 0 && g.bSchluss[z] > 0)
      ? -(100 * (g.bSchluss[z] / g.bSchluss[zV] - 1)) : NaN;
  }
  return aus;
}
k1Umkehr.$name = 'k1-kurzfrist-umkehr';
k1Umkehr.$kandidat = { nr: 1, ende: 'unten', groesse: 'Rendite der letzten 5 Handelstage' };

/** K2 - tiefe Volatilitaet: Rang nach der sd der letzten 60 Tagesrenditen, gekauft wird das UNTERE Ende.
 *  Stichproben-sd (Nenner n-1); alle 60 Renditen muessen vorhanden sein, sonst faellt das Papier aus. */
function k2TiefeVola(sicht, liste, T) {
  var aus = new Float64Array(liste.length), g = T.g, n = K.K2_FENSTER;
  for (var i = 0; i < liste.length; i++) {
    var z = liste[i].zeile, s = 0, q = 0, ok = true, k, zk, r;
    for (k = 0; k < n; k++) {
      zk = (k === 0) ? z : sicht.zurueck(z, k);
      if (zk < 0) { ok = false; break; }
      r = g.rendite[zk];
      if (!(r === r)) { ok = false; break; }
      s += r;
    }
    if (!ok) { aus[i] = NaN; continue; }
    var m = s / n;
    for (k = 0; k < n; k++) { zk = (k === 0) ? z : sicht.zurueck(z, k); r = g.rendite[zk] - m; q += r * r; }
    aus[i] = -Math.sqrt(q / (n - 1));
  }
  return aus;
}
k2TiefeVola.$name = 'k2-tiefe-volatilitaet';
k2TiefeVola.$kandidat = { nr: 2, ende: 'unten', groesse: 'sd der letzten 60 Tagesrenditen' };

/** K3 - Abstand zum 52-Wochen-Hoch: Schluss(t) / Maximum der letzten 250 Tagesschluesse, gekauft wird
 *  das OBERE Ende (nahe am Hoch). Gerechnet auf der BEREINIGTEN Reihe: ein Verhaeltnis aus zwei
 *  Rohkursen ueber 250 Tage truege den Split-Faktor mit (§T2.3, K3). Die Tafel fuehrt kein Tageshoch;
 *  "Hoch" ist hier das hoechste Tages-SCHLUSSniveau - eine andere Groesse als das Intraday-Hoch. */
function k3NaheHoch(sicht, liste, T) {
  var aus = new Float64Array(liste.length), g = T.g, n = K.K3_FENSTER;
  for (var i = 0; i < liste.length; i++) {
    var z = liste[i].zeile, c = g.bSchluss[z], max = c, ok = c > 0;
    for (var k = 1; k < n && ok; k++) {
      var zk = sicht.zurueck(z, k);
      if (zk < 0) { ok = false; break; }
      var v = g.bSchluss[zk];
      if (!(v > 0)) { ok = false; break; }
      if (v > max) max = v;
    }
    aus[i] = (ok && max > 0) ? c / max : NaN;
  }
  return aus;
}
k3NaheHoch.$name = 'k3-nahe-52w-hoch';
k3NaheHoch.$kandidat = { nr: 3, ende: 'oben', groesse: 'Schluss(t) / Maximum der 250 Tagesschluesse' };

/** K4 - Umsatzschock mit Richtung: Dollarumsatz(t) / Median(Dollarumsatz ueber t-60..t-1), multipliziert
 *  mit dem Vorzeichen der Tagesrendite an t. Gekauft wird das OBERE Ende (Umsatzschub am Aufwaertstag).
 *  Der Median laeuft ueber die Zeilen VOR t - sonst staende der Zaehler in seinem eigenen Nenner. */
function k4Umsatzschock(sicht, liste, T) {
  var aus = new Float64Array(liste.length), g = T.g, n = K.K4_FENSTER;
  var puffer = new Float64Array(n);
  for (var i = 0; i < liste.length; i++) {
    var z = liste[i].zeile, m = 0;
    for (var k = 1; k <= n; k++) {
      var zk = sicht.zurueck(z, k);
      if (zk < 0) break;
      var u = g.umsatz[zk];
      if (u === u && u >= 0) puffer[m++] = u;
    }
    if (m < K.K4_MIN_TAGE) { aus[i] = NaN; continue; }
    var feld = Array.prototype.slice.call(puffer.subarray(0, m)).sort(function (a, b) { return a - b; });
    var med = (m % 2) ? feld[(m - 1) / 2] : 0.5 * (feld[m / 2 - 1] + feld[m / 2]);
    var u0 = g.umsatz[z], r = g.rendite[z];
    if (!(med > 0) || !(u0 === u0) || !(u0 >= 0) || !(r === r)) { aus[i] = NaN; continue; }
    aus[i] = (u0 / med) * (r > 0 ? 1 : r < 0 ? -1 : 0);
  }
  return aus;
}
k4Umsatzschock.$name = 'k4-umsatzschock-richtung';
k4Umsatzschock.$kandidat = { nr: 4, ende: 'oben', groesse: 'Umsatz(t)/Median(60) x Vorzeichen der Tagesrendite' };

var KANDIDATEN = [k1Umkehr, k2TiefeVola, k3NaheHoch, k4Umsatzschock];

module.exports = { orakelTag: orakelTag, orakelPeriode: orakelPeriode, zufallFabrik: zufallFabrik,
  momentum12_1: momentum12_1, leckProbe: leckProbe, sauberProbe: sauberProbe,
  k1Umkehr: k1Umkehr, k2TiefeVola: k2TiefeVola, k3NaheHoch: k3NaheHoch, k4Umsatzschock: k4Umsatzschock,
  KANDIDATEN: KANDIDATEN };

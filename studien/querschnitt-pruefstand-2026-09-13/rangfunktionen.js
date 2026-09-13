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

module.exports = { orakelTag: orakelTag, orakelPeriode: orakelPeriode, zufallFabrik: zufallFabrik,
  momentum12_1: momentum12_1, leckProbe: leckProbe, sauberProbe: sauberProbe };

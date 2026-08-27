'use strict';
/* Tueftler, 27.08.2026 - taugt verschwundene.json als Ausschlussliste?
 *
 * VORGESCHICHTE UND EIGENE KORREKTUR. Am 26.08. habe ich AVB, EQR, WBS als
 * "belegt falsch delistet" gemeldet, weil sie im Ueberlebensarchiv frische Kerzen
 * haben. Heute Nacht hat der Gegencheck gezeigt, dass dieses Kriterium unsauber
 * ist: AVB traegt an sechs aufeinanderfolgenden Tagen den GLEICHEN Schluss bis auf
 * die 15. Stelle, EQR an fuenf. Das ist die bekannte Stempel-Kerze abgemeldeter
 * Reihen - eine frische Kerze ist also KEIN Beleg fuer Handel.
 *
 * Dieses Werkzeug ersetzt das Kriterium durch ein bewegungs- und umsatzbasiertes:
 *   lebendig  = in den letzten 10 Archivkerzen mindestens 3 VERSCHIEDENE Schluesse
 *               UND mindestens 3 Kerzen mit Umsatz > 0
 *   gestempelt= frische Kerzen, aber ohne Bewegung/Umsatz
 *   still     = keine frischen Kerzen
 * Die letzte Kerze wird hier BEWUSST NICHT abgeschnitten (#85): der Schnitt hatte
 * im ersten Anlauf genau die Reihen unsichtbar gemacht, deren einzige junge Kerze
 * die letzte ist (LBRDA/LBRDK). Stattdessen wird sie mitgezaehlt und als solche
 * ausgewiesen.
 *
 * Gezaehlt wird, nicht gedeutet. Es wird nichts veraendert.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');

var ARCHIV = process.env.ARCHIV1D || 'E:/Markt-Dashboard-Archiv/archiv1d';
var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive');
var FRISCH_AB = process.env.FRISCH_AB || '2026-08-14';   /* rund zwei Wochen vor Listenstand-Ende */
var TIEFE = 10;

function tag(ts) { return new Date(ts).toISOString().slice(0, 10); }

var vListe = JSON.parse(fs.readFileSync(path.join(DATEN, 'verschwundene.json'), 'utf8'));
var arten = JSON.parse(fs.readFileSync(path.join(DATEN, 'wertpapierarten.json'), 'utf8')).arten;

var archiv = {};
fs.readdirSync(ARCHIV).filter(function (f) { return f.indexOf('bars_1d_') === 0; })
  .forEach(function (f) { archiv[f.slice(8, -5)] = f; });

function befund(sym) {
  var j;
  try { j = JSON.parse(fs.readFileSync(path.join(ARCHIV, archiv[sym]), 'utf8')); } catch (e) { return null; }
  var b = j.bars || j.series || [];
  if (!b.length) return null;
  var letzte = tag(b[b.length - 1][0]);
  var schwanz = b.slice(-TIEFE);
  var kurse = {}, mitUmsatz = 0;
  for (var i = 0; i < schwanz.length; i++) {
    kurse[String(schwanz[i][1])] = 1;
    if ((schwanz[i][2] || 0) > 0) mitUmsatz++;
  }
  var verschiedene = Object.keys(kurse).length;
  var frisch = letzte >= FRISCH_AB;
  var lebendig = frisch && verschiedene >= 3 && mitUmsatz >= 3;
  return {
    sym: sym, letzteArchivkerze: letzte, kerzen: b.length,
    verschiedeneSchluesseInLetzten10: verschiedene,
    kerzenMitUmsatzInLetzten10: mitUmsatz,
    lage: !frisch ? 'still' : (lebendig ? 'lebendig' : 'gestempelt')
  };
}

var zahl = { gepruef: 0, nichtImArchiv: 0, still: 0, gestempelt: 0, lebendig: 0 };
var lebendige = [], gestempelte = [];
var eintraege = vListe.eintraege.filter(function (e) {
  var a = arten[e.sym] || arten[String(e.sym).replace(/-/g, '.')];
  return a === 'CS' || a === 'ADRC';
});
for (var i = 0; i < eintraege.length; i++) {
  var e = eintraege[i];
  if (!archiv[e.sym]) { zahl.nichtImArchiv++; continue; }
  var b = befund(e.sym);
  if (!b) { zahl.nichtImArchiv++; continue; }
  zahl.gepruef++;
  zahl[b.lage]++;
  b.delistetLaut = e.bis;
  if (b.lage === 'lebendig') lebendige.push(b);
  if (b.lage === 'gestempelt') gestempelte.push(b);
}

/* Positivkontrolle: das Kriterium MUSS auf unbestritten lebenden Reihen anschlagen,
 * sonst ist ein Nullbefund wertlos. Zehn Reihen, die in keiner Delisting-Liste stehen. */
var kontrolle = [];
var alleArchiv = Object.keys(archiv).sort();
var inListe = {};
vListe.eintraege.forEach(function (x) { inListe[x.sym] = 1; });
for (var k = 0; k < alleArchiv.length && kontrolle.length < 10; k++) {
  var s = alleArchiv[k];
  if (inListe[s]) continue;
  var a2 = arten[s] || arten[s.replace(/-/g, '.')];
  if (a2 !== 'CS' && a2 !== 'ADRC') continue;
  var bb = befund(s);
  if (bb) kontrolle.push(bb);
}

var out = {
  erzeugt: new Date().toISOString(),
  frage: 'Wie viele der als delistet gefuehrten Aktien haben im Ueberlebensarchiv eine LEBENDIGE Reihe?',
  kriterium: 'letzte Kerze >= ' + FRISCH_AB + ' UND >=3 verschiedene Schluesse UND >=3 Kerzen mit Umsatz in den letzten ' + TIEFE,
  korrekturHinweis: 'Ersetzt das Kriterium vom 26.08. ("hat frische Kerzen"), das Stempel-Kerzen fuer Handel hielt.',
  listenstand: vListe.stand,
  aktienartigInDerListe: eintraege.length,
  zaehlung: zahl,
  lebendige: lebendige.sort(function (a, b) { return a.sym < b.sym ? -1 : 1; }),
  gestempelte: gestempelte.sort(function (a, b) { return a.sym < b.sym ? -1 : 1; }),
  positivkontrolle: kontrolle
};
var ziel = path.join(__dirname, '..', 'daten', 'pruefung-delisting-liste-2026-08-27.json');
fs.writeFileSync(ziel, JSON.stringify(out, null, 1));
console.log(JSON.stringify({
  aktienartigInDerListe: out.aktienartigInDerListe, zaehlung: zahl,
  lebendige: lebendige, gestempelte: gestempelte,
  positivkontrolle: kontrolle.map(function (c) { return c.sym + ':' + c.lage + '(' + c.verschiedeneSchluesseInLetzten10 + '/' + c.kerzenMitUmsatzInLetzten10 + ')'; })
}, null, 1));
console.log('geschrieben: ' + ziel);

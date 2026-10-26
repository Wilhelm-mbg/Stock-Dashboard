'use strict';
/* ================= Steuerrechner des Momentum-Buchs (Auftrag Nr. 126, 26.10.2026) =================
 *
 * KOPIE AUS NR. 82, BITGLEICH. Quelle: studien/nach-steuern-2026-10-04/steuer.js (Auftrag Nr. 82, 04.10.2026, versiegelt - dort
 * nichts aendern). Kopiert sind WOERTLICH: MODELL, mit, topfNeu, topfStand, topfJahr, topfBuche, topfAbrechnen, vorabpauschale, fonds,
 * pa (START = 100.000 $ wie R.START des Rueckblicks Nr. 74). Warum eine Kopie: das Original laedt die Studien-Rechner Nr. 74/78 und
 * den Pruefstand mit fs - im Fenster der App geht das nicht, und studien/ liegt nicht im Paket (Zweitleser 16). Die Bindung haelt
 * test-momentum-umstellung.js: jede kopierte Funktion zeichengleich zum Original und dieselben Zahlen auf einem Kunstfall.
 *
 * Das Modell (REGEL.md Nr. 82): Steuersatz 26,375 % (Abgeltung + Soli, keine Kirchensteuer, kein Pauschbetrag); Aktien-Verlusttopf -
 * Verluste nur mit Aktiengewinnen verrechnet, Vortrag ueber den Jahreswechsel, Erstattung hoechstens bis zur im Jahr gezahlten Steuer;
 * Ausschuettungen netto (nicht ueber den Topf); Indexfonds thesaurierend mit Vorabpauschale (Basisertrag = Wert am Jahresanfang x
 * Basiszins x 0,7, Teilfreistellung 30 %) und Verkauf am Ende. Ein RECHENMODELL, keine Steuerberatung.
 * Alles Simulation mit virtuellem Kapital, keine Anlageberatung. */
(function (root) {

var START = 100000;   /* R.START (studien/massstab-rueckblick-2026-10-04/rueckblick.js) - Startsumme der Rueckblicke und des Buchs */
var QUELLE = 'studien/nach-steuern-2026-10-04/steuer.js (Nr. 82)';
/* ---- ab hier woertlich aus dem Original ---- */
var MODELL = {
  steuersatz: 0.26375,            /* 25 % plus 5,5 % Solidaritaetszuschlag, keine Kirchensteuer; Sparer-Pauschbetrag 0 */
  teilfreistellung: 0.30,         /* Aktienfonds: 30 % der Vorabpauschale und des Verkaufsgewinns bleiben steuerfrei */
  basisertragAnteil: 0.7,         /* Basisertrag = Wert am Jahresanfang x Basiszins x 0,7 */
  wiederanlage: 0.85,             /* SPY-Ausschuettung zu 85 % wieder angelegt (15 % Quellensteuer im Fonds) */
  kostenPa: 0.0007,               /* laufende Kosten 0,07 % im Jahr */
  handelstageJeJahr: 252,         /* je Handelstag Faktor (1 - 0,0007)^(1/252) */
  kleinstkaufGrenze: 0.05,        /* Zaehler "unter 5 % des Budgets" */
  /* Basiszins (amtlich, vom PM am 04.10.2026 nachgeschlagen). 2017: ANNAHME DES PM, NICHT NACHGESCHLAGEN (die Regelung gab es noch nicht). */
  basiszins: { 2017: 0.0059, 2018: 0.0087, 2019: 0.0052, 2020: 0.0007, 2021: -0.0045, 2022: -0.0005, 2023: 0.0255, 2024: 0.0229, 2025: 0.0253, 2026: 0.0320 },
};
function mit(basis, extra) { var o = {}; Object.keys(basis).forEach(function (k) { o[k] = basis[k]; }); Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); return o; }
function topfNeu(satz) { return { satz: satz, jahr: null, vortrag: 0, saldo: 0, gezahlt: 0, akt: null, jahre: [] }; }
function topfStand(t) { return t.vortrag + t.saldo; }
function topfJahr(t, jahr) {
  if (t.jahr === jahr) return;
  if (t.jahr !== null) {
    var stand = topfStand(t);
    t.akt.topfEnde = stand; t.akt.vortragEnde = stand < 0 ? stand : 0;
    t.vortrag = t.akt.vortragEnde;
  }
  t.jahr = jahr; t.saldo = 0; t.gezahlt = 0;
  t.akt = { jahr: jahr, vortragAnfang: t.vortrag, gewinne: 0, verluste: 0, belastet: 0, erstattet: 0, aktiensteuer: 0, ausschuettungBrutto: 0,
    ausschuettungSteuer: 0, topfEnde: t.vortrag, vortragEnde: t.vortrag };
  t.jahre.push(t.akt);
}
function topfBuche(t, gewinn) {
  t.saldo += gewinn;
  if (gewinn >= 0) t.akt.gewinne += gewinn; else t.akt.verluste -= gewinn;
  t.akt.topfEnde = topfStand(t); t.akt.vortragEnde = t.akt.topfEnde < 0 ? t.akt.topfEnde : 0;
}
function topfAbrechnen(t) {
  var soll = Math.max(0, topfStand(t)) * t.satz, diff = soll - t.gezahlt;
  t.gezahlt = soll; t.akt.aktiensteuer = soll;
  if (diff > 0) t.akt.belastet += diff; else t.akt.erstattet -= diff;
  return diff;
}
function vorabpauschale(wertAnfang, basiszins, wertzuwachs, zwoelftel, par) {
  par = par || MODELL;
  var basisertrag = basiszins > 0 ? wertAnfang * basiszins * par.basisertragAnteil * (zwoelftel == null ? 1 : zwoelftel) : 0;
  var vp = Math.max(0, Math.min(basisertrag, wertzuwachs)), steuerbar = vp * (1 - par.teilfreistellung);
  return { basisertrag: basisertrag, vorabpauschale: vp, steuerbar: steuerbar, steuer: steuerbar * par.steuersatz };
}
function fonds(reihe, start, par) {
  par = par || MODELL;
  var cTag = Math.pow(1 - par.kostenPa, 1 / par.handelstageJeJahr);
  var f = 1, kaufNav = reihe[0].eroeffnung, anteile = start / kaufNav, anteileKauf = anteile;
  var jahr = +reihe[0].datum.slice(0, 4), zwoelftel = (13 - (+reihe[0].datum.slice(5, 7))) / 12;
  var wertAnfang = start, navSchluss = NaN, vpJeAnteil = 0, jahre = [], vorabSteuer = 0;
  reihe.forEach(function (x, i) {
    var j = +x.datum.slice(0, 4);
    if (j !== jahr) {
      if (j !== jahr + 1) throw new Error('KLINKE: Fonds - Kalenderjahr uebersprungen vor ' + x.datum);
      var zins = par.basiszins[jahr];
      if (zins == null) throw new Error('KLINKE: kein Basiszins fuer ' + jahr);
      var wertEnde = anteile * navSchluss, v = vorabpauschale(wertAnfang, zins, wertEnde - wertAnfang, zwoelftel, par);
      var navAuf = x.eroeffnung * f, verkauft = v.steuer / navAuf;
      jahre.push({ jahr: jahr, basiszins: zins, zwoelftel: zwoelftel, wertAnfang: wertAnfang, wertEnde: wertEnde, wertzuwachs: wertEnde - wertAnfang, basisertrag: v.basisertrag,
        vorabpauschale: v.vorabpauschale, steuerbar: v.steuerbar, steuer: v.steuer, faellig: x.datum, anteileVorher: anteile, anteileVerkauft: verkauft });
      vpJeAnteil += v.vorabpauschale / anteile;
      anteile -= verkauft; vorabSteuer += v.steuer;
      jahr = j; zwoelftel = 1; wertAnfang = anteile * navAuf;
    }
    if (i > 0) (x.aus || []).forEach(function (a) { f *= 1 + par.wiederanlage * a / x.schluss; });
    f *= cTag;
    navSchluss = x.schluss * f;
  });
  var endA = anteile * navSchluss, kaufwert = anteile * kaufNav, vpAnteilig = vpJeAnteil * anteile, gewinn = endA - kaufwert - vpAnteilig;
  var steuerbar = Math.max(0, gewinn) * (1 - par.teilfreistellung), steuerEnde = steuerbar * par.steuersatz;
  return { endA: endA, endB: endA - steuerEnde, anteileKauf: anteileKauf, anteile: anteile, faktor: f, jahre: jahre, letztesJahrOhneVorabpauschale: jahr, vorabSteuer: vorabSteuer,
    endverkauf: { endwert: endA, kaufwert: kaufwert, vorabpauschalenAnteilig: vpAnteilig, gewinn: gewinn, steuerbar: steuerbar, steuer: steuerEnde }, gesamtB: vorabSteuer + steuerEnde };
}
function pa(ende, jahre) { return (Math.pow(ende / START, 1 / jahre) - 1) * 100; }
/* ---- Ende der woertlichen Kopie ---- */

var Steuer = { QUELLE: QUELLE, START: START, MODELL: MODELL, mit: mit, topfNeu: topfNeu, topfStand: topfStand, topfJahr: topfJahr, topfBuche: topfBuche,
  topfAbrechnen: topfAbrechnen, vorabpauschale: vorabpauschale, fonds: fonds, pa: pa,
  KOPIERT: ['MODELL', 'mit', 'topfNeu', 'topfStand', 'topfJahr', 'topfBuche', 'topfAbrechnen', 'vorabpauschale', 'fonds', 'pa'] };
if (typeof module !== 'undefined' && module.exports) { module.exports = Steuer; return; }
root.Steuer = Steuer;
})(typeof window !== 'undefined' ? window : globalThis);

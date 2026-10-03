'use strict';
/* AUSWERTEN der blinden Zaehlung (Auftrag Nr. 65): Zaehler, Hochrechnung, Signaltage, Haeufung, Placebo-Streuung, MDE80.
 * Liest roh/stichprobe-teil-*.json und roh/sperrliste.json, schreibt ergebnis.json. Rechnet KEINE Rendite echter Signale:
 * die Renditen kommen aus dem Topf der Zufallseinstiege (zaehlen.js), Reihentage mit echtem Signal sind dort nicht enthalten.
 * Statistik (naiv / Hansen-Hodrick / Bloecke) aus dem Pruefstand: studien/querschnitt-pruefstand-2026-09-13/statistik.js.
 * Aufruf: node studien/kapitulation-neu-2026-10-03/auswerten.js
 */
var fs = require('fs');
var path = require('path');
var REPO = path.resolve(__dirname, '..', '..');
var K = require(path.join(REPO, 'studien', 'vorregistrierung-2026-09-06-signale-minuten', 'konfig.js'));
var ST = require(path.join(REPO, 'studien', 'querschnitt-pruefstand-2026-09-13', 'statistik.js'));
var SAAT = 'kapitulation-2026-10-03', ROH = path.join(__dirname, 'roh');
var ALT_AB = '2023-09-26';                 // Beginn des Fensters, das das Protokoll vom 26.08.2026 gemessen hat
var Z80 = 1.959964 + 0.8416212;            // zAlpha + zPower80 wie messmaschine.js (Protokoll: verfahren)
var ALT = { v2SignaltageGesamt: 163, v2SignaltageBestaetigung: 98, sdBestaetigung: 5.117, sdGesamt: 6.130, effekt: 1.107, verzerrungJePaartag: -3.7815 };
var HUERDE = K.KLASSEN.map(function (k) { return { klasse: k.name, pp: k.huerde }; });

/* ---------- Einlesen ---------- */
var reihen = [], regime = null, archiv = null, bytes = 0, laufMs = 0, teile = 0;
fs.readdirSync(ROH).filter(function (f) { return /^stichprobe-teil-\d+-von-\d+\.json$/.test(f); }).forEach(function (f) {
  var j = JSON.parse(fs.readFileSync(path.join(ROH, f), 'utf8'));
  reihen = reihen.concat(j.reihen); if (j.regime) regime = j.regime; archiv = j.archiv; bytes += j.bytes; laufMs = Math.max(laufMs, j.ms.gesamt); teile++;
});
var kal = K.kalender().tage, nTage = kal.length;
var offen = regime.tage.split('').map(Number);
var VORLAUF_TAGE = 37;                      // 261 Stundenkerzen / 7 je Tag: davor kann keine Reihe ein Signal tragen
var N_H = { 1: archiv.lebend, 0: archiv.reihenAktien - archiv.lebend }, n_h = { 1: 0, 0: 0 };
reihen.forEach(function (r) { n_h[r.lebend]++; });
var W = { 1: N_H[1] / n_h[1], 0: N_H[0] / n_h[0] }, F = reihen.length / archiv.reihenAktien;
function klName(k) { return k < 0 ? 'unter5' : K.KLASSEN[k].name; }
function haupt(r) { return r.sig.filter(function (s) { return !s[4] && !s[5]; }); }   // ohne Sperrtage und Split-Fenster
function quantil(a, p) { if (!a.length) return null; var s = a.slice().sort(function (x, y) { return x - y; }); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; }
function rund(x, n) { var f = Math.pow(10, n == null ? 3 : n); return x == null || !isFinite(x) ? null : Math.round(x * f) / f; }

/* ---------- Gamma-Poisson: Signaltage des Universums aus ausgeduennten Tageszahlen ----------
 * k_d | lambda ~ Poisson(f lambda), lambda ~ Gamma(a, s). Angepasst an Mittel und NULL-ANTEIL der Tageszahlen (der Null-Anteil
 * ist die Groesse, auf die es ankommt). Tage mit k >= 1 sind sicher Signaltage; fuer Tage mit k = 0 gilt
 * P(K >= 1 | k = 0) = 1 - ((1 + s/f) / (1 + s))^(-a), s = Skala im Stichprobenmassstab. */
function gp(zahlen, f) {
  var D = zahlen.length, null0 = 0, su = 0; zahlen.forEach(function (k) { if (!k) null0++; su += k; });
  var m = su / D, p0 = null0 / D, aus = { tage: D, signaltageStichprobe: D - null0, mittel: m, nullAnteil: p0, a: null, s: null, pNachtrag: null, schaetzung: D - null0 };
  if (!su || !null0) return aus;
  var pN;
  if (p0 <= Math.exp(-m)) pN = 1 - Math.exp(-m * (1 - f) / f);                      // nicht klumpiger als Poisson
  else {
    var lo = 1e-9, hi = 1e9;
    for (var q = 0; q < 200; q++) { var s = Math.sqrt(lo * hi); if (-(m / s) * Math.log(1 + s) - Math.log(p0) < 0) lo = s; else hi = s; }
    aus.s = Math.sqrt(lo * hi); aus.a = m / aus.s; pN = 1 - Math.pow((1 + aus.s / f) / (1 + aus.s), -aus.a);
  }
  aus.pNachtrag = pN; aus.schaetzung = (D - null0) + null0 * pN;
  return aus;
}

/* ---------- Kennzahlen einer Reihenliste (auch fuer den Bootstrap) ---------- */
function tagesZahlen(liste, v2) {
  var z = new Int32Array(nTage);
  liste.forEach(function (r) { haupt(r).forEach(function (s) { if (!v2 || s[2]) z[s[0]]++; }); });
  return z;
}
function fenster(z, nurOffen, von, bis) {   // Tageszahlen der zulaessigen Tage eines Kalenderfensters
  var aus = [];
  for (var d = Math.max(VORLAUF_TAGE, 0); d < nTage; d++) { if (kal[d] < von || kal[d] >= bis) continue; if (nurOffen && !offen[d]) continue; aus.push(z[d]); }
  return aus;
}
function kennzahlen(liste, f) {
  var o = { v1: 0, v2: 0, v1Ver: 0, v2Ver: 0, v1Hoch: 0, v2Hoch: 0, v1VerHoch: 0, v2VerHoch: 0 };
  liste.forEach(function (r) { haupt(r).forEach(function (s) {
    o.v1++; o.v1Hoch += W[r.lebend]; if (!r.lebend) { o.v1Ver++; o.v1VerHoch += W[0]; }
    if (s[2]) { o.v2++; o.v2Hoch += W[r.lebend]; if (!r.lebend) { o.v2Ver++; o.v2VerHoch += W[0]; } }
  }); });
  o.anteilVerV1 = o.v1Hoch ? o.v1VerHoch / o.v1Hoch : null; o.anteilVerV2 = o.v2Hoch ? o.v2VerHoch / o.v2Hoch : null;
  var z1 = tagesZahlen(liste, false), z2 = tagesZahlen(liste, true);
  o.tageV1 = gp(fenster(z1, false, '0', '9'), f); o.tageV2 = gp(fenster(z2, true, '0', '9'), f);
  o.tageV2Unberuehrt = gp(fenster(z2, true, '0', ALT_AB), f); o.tageV2AltesFenster = gp(fenster(z2, true, ALT_AB, '9'), f);
  return o;
}
var punkt = kennzahlen(reihen, F);

/* Bootstrap ueber Reihen, je Schicht mit Zuruecklegen (1.000 Ziehungen, feste Saat). */
var rng = ST.mulberry32(ST.fnv(SAAT + '|bootstrap')), schicht = { 1: reihen.filter(function (r) { return r.lebend; }), 0: reihen.filter(function (r) { return !r.lebend; }) };
var boot = { v1Hoch: [], v2Hoch: [], anteilVerV1: [], anteilVerV2: [] };   // KEINE Signaltage: Ziehen mit Zuruecklegen verdoppelt Reihen und zaehlt Tage zu klein
for (var b = 0; b < 1000; b++) {
  var zug = []; [1, 0].forEach(function (h) { for (var q = 0; q < schicht[h].length; q++) zug.push(schicht[h][Math.floor(rng() * schicht[h].length)]); });
  var kz = kennzahlen(zug, F);
  boot.v1Hoch.push(kz.v1Hoch); boot.v2Hoch.push(kz.v2Hoch); boot.anteilVerV1.push(kz.anteilVerV1); boot.anteilVerV2.push(kz.anteilVerV2);
}
var band = {}; Object.keys(boot).forEach(function (k) { var a = boot[k].filter(function (x) { return x != null; }); band[k] = [rund(quantil(a, 0.025)), rund(quantil(a, 0.975))]; });

/* Pruefung des Modells an der Stichprobe selbst: aus einer zufaelligen HAELFTE der Reihen (f = 1/2) die Signaltage der ganzen
 * Stichprobe vorhersagen. Dazu die Anhaeufungskurve (Signaltage gegen Reihenzahl). */
function mische(a, r) { a = a.slice(); for (var q = a.length - 1; q > 0; q--) { var w = Math.floor(r() * (q + 1)); var t = a[q]; a[q] = a[w]; a[w] = t; } return a; }
var rng2 = ST.mulberry32(ST.fnv(SAAT + '|haelfte')), istV2 = punkt.tageV2.signaltageStichprobe, vorher = [], kurve = {};
for (b = 0; b < 100; b++) vorher.push(gp(fenster(tagesZahlen(mische(reihen, rng2).slice(0, reihen.length / 2), true), true, '0', '9'), 0.5).schaetzung);
[50, 100, 200, 300, 400].forEach(function (n) { var s = 0; for (var q = 0; q < 60; q++) s += gp(fenster(tagesZahlen(mische(reihen, rng2).slice(0, n), true), true, '0', '9'), 1).signaltageStichprobe; kurve[n] = rund(s / 60, 1); });
var modellprobe = { signaltageStichprobeIst: istV2, vorhersageAusHaelfteMittel: rund(vorher.reduce(function (x, y) { return x + y; }, 0) / vorher.length, 1),
  vorhersageP05: rund(quantil(vorher, 0.05), 1), vorhersageP95: rund(quantil(vorher, 0.95), 1), anhaeufungskurveV2: kurve };
modellprobe.istZuVorhersage = rund(istV2 / modellprobe.vorhersageAusHaelfteMittel);
/* Zweiter Anker im Universumsmassstab: das alte Protokoll fand im alten Fenster 163 V2-Signaltage (2.201 Ueberlebende, Yahoo-60m). */
var quoteAlt = ALT.v2SignaltageGesamt / punkt.tageV2AltesFenster.tage;
var signaltage = { unberuehrt: { untergrenzeStichprobe: punkt.tageV2Unberuehrt.signaltageStichprobe, modell: Math.round(punkt.tageV2Unberuehrt.schaetzung), kalibriertAmAltenProtokoll: Math.round(quoteAlt * punkt.tageV2Unberuehrt.tage), obergrenzeRegimeTage: punkt.tageV2Unberuehrt.tage },
  gesamt: { untergrenzeStichprobe: punkt.tageV2.signaltageStichprobe, modell: Math.round(punkt.tageV2.schaetzung), kalibriertAmAltenProtokoll: Math.round(quoteAlt * punkt.tageV2.tage), obergrenzeRegimeTage: punkt.tageV2.tage },
  altesFenster: { untergrenzeStichprobe: punkt.tageV2AltesFenster.signaltageStichprobe, modell: Math.round(punkt.tageV2AltesFenster.schaetzung), altesProtokoll: ALT.v2SignaltageGesamt, obergrenzeRegimeTage: punkt.tageV2AltesFenster.tage }, quoteAltesProtokoll: rund(quoteAlt) };

/* ---------- Tabellen je Jahr und Klasse ---------- */
function tabelle(v2) {
  var jeJahr = {}, jeKlasse = {}, tageKlasse = {};
  reihen.forEach(function (r) { haupt(r).forEach(function (s) {
    if (v2 && !s[2]) return;
    var j = kal[s[0]].slice(0, 4), k = klName(s[1]);
    var a = jeJahr[j] || (jeJahr[j] = { signale: 0, hoch: 0, aufVerschwundenen: 0, tage: {} }); a.signale++; a.hoch += W[r.lebend]; if (!r.lebend) a.aufVerschwundenen++; a.tage[s[0]] = 1;
    var c = jeKlasse[k] || (jeKlasse[k] = { signale: 0, hoch: 0, aufVerschwundenen: 0 }); c.signale++; c.hoch += W[r.lebend]; if (!r.lebend) c.aufVerschwundenen++;
    (tageKlasse[k] || (tageKlasse[k] = {}))[s[0]] = 1;
  }); });
  Object.keys(jeJahr).forEach(function (j) { var a = jeJahr[j]; a.signaltageStichprobe = Object.keys(a.tage).length; delete a.tage; a.hoch = Math.round(a.hoch);
    a.handelstage = kal.filter(function (t) { return t.slice(0, 4) === j; }).length; a.regimeOffeneTage = kal.filter(function (t, d) { return t.slice(0, 4) === j && offen[d]; }).length; });
  Object.keys(jeKlasse).forEach(function (k) { jeKlasse[k].hoch = Math.round(jeKlasse[k].hoch); jeKlasse[k].signaltageStichprobe = Object.keys(tageKlasse[k]).length; });
  return { jeJahr: jeJahr, jeKlasse: jeKlasse };
}
function haeufung(v2) {
  var z = Array.prototype.filter.call(tagesZahlen(reihen, v2), function (k) { return k > 0; }), su = z.reduce(function (x, y) { return x + y; }, 0);
  var s = z.slice().sort(function (x, y) { return y - x; }), top = Math.max(1, Math.round(0.05 * s.length)), st = 0; for (var q = 0; q < top; q++) st += s[q];
  return { signaltage: z.length, signale: su, median: quantil(z, 0.5), p95: quantil(z, 0.95), max: s[0], mittel: rund(su / z.length, 2), anteilSignaleInTop5ProzentTagen: rund(st / su), hochgerechnetJeTagFaktor: rund(1 / F, 2) };
}
var raender = { sperrtagMassnahme: 0, splitFenster: 0, ohneAusstiegVerschwunden: 0, ohneAusstiegArchivende: 0, v2OhneAusstiegVerschwunden: 0, klinke: 0, dateienAusgelassen: 0 };
reihen.forEach(function (r) {
  raender.klinke += r.klinke; raender.dateienAusgelassen += r.fehl.length;
  r.sig.forEach(function (s) { if (s[5]) raender.splitFenster++; else if (s[4]) raender.sperrtagMassnahme++; else if (!s[3]) { if (r.lebend) raender.ohneAusstiegArchivende++; else { raender.ohneAusstiegVerschwunden++; if (s[2]) raender.v2OhneAusstiegVerschwunden++; } } });
});

/* ---------- Placebo: Zufallseinstiege an den V2-Signaltagen der Stichprobe, gleiche Klasse, gleiche Haltedauer ---------- */
var topf = {};                                                    // ki -> Klasse -> [Pp]
reihen.forEach(function (r) { r.topf.forEach(function (e) { var t = topf[e[0]] || (topf[e[0]] = {}); (t[e[1]] || (t[e[1]] = [])).push(e[2] / 100); }); });
var sigTag = {};                                                  // ki -> Klasse -> n (V2, Hauptzahl)
reihen.forEach(function (r) { haupt(r).forEach(function (s) { if (!s[2]) return; var t = sigTag[s[0]] || (sigTag[s[0]] = {}); t[s[1]] = (t[s[1]] || 0) + 1; }); });
var tageSortiert = Object.keys(sigTag).map(Number).sort(function (x, y) { return x - y; });
function mittel(a) { var s = 0; for (var q = 0; q < a.length; q++) s += a[q]; return s / a.length; }
function placeboLauf(r) {
  var roh = [], ber = [], ohneTopf = 0, ersatz = 0;
  tageSortiert.forEach(function (d) {
    var T = topf[d], zx = 0, zy = 0, nx = 0, ny = 0;
    if (!T) { ohneTopf++; return; }
    Object.keys(sigTag[d]).forEach(function (k) {
      var n = sigTag[d][k], P = T[k];
      if (!P || !P.length) { P = [].concat.apply([], Object.keys(T).map(function (kk) { return T[kk]; })); ersatz++; }   // Klasse am Tag leer: ganzer Tagestopf
      var g = mische(P, r), m = Math.min(n, g.length), zug = g.slice(0, m), rest = g.slice(m), mz = mittel(zug);
      zx += n * mz; nx += n;
      if (rest.length) { zy += n * (mz - mittel(rest)); ny += n; }                                                     // gegen den NICHT gezogenen Rest des Tagestopfs
    });
    if (nx) roh.push({ t: d, x: zx / nx }); if (ny) ber.push({ t: d, x: zy / ny });
  });
  function mom(p) { var h = ST.momente(p, 4), bl = ST.momente(p, 5); return { n: h.n, sd: h.sd, seNaiv: h.seNaiv, seHH: h.seHH, seBlock: bl.seBlock, mittel: h.mittel }; }
  return { roh: mom(roh), bereinigt: mom(ber), ohneTopf: ohneTopf, ersatz: ersatz };
}
var laeufe = []; for (b = 0; b < 200; b++) laeufe.push(placeboLauf(ST.mulberry32(ST.fnv(SAAT + '|placebo|' + b))));
function med(art, feld) { return rund(quantil(laeufe.map(function (l) { return l[art][feld]; }).filter(function (x) { return x != null; }), 0.5), 4); }
function placeboZeile(art) {
  var z = { tage: med(art, 'n'), sd: med(art, 'sd'), seNaiv: med(art, 'seNaiv'), seHH: med(art, 'seHH'), seBlock: med(art, 'seBlock'), mittel: med(art, 'mittel'),
    hhOhneWert: laeufe.filter(function (l) { return l[art].seHH == null; }).length };
  z.seGilt = Math.max(z.seHH || 0, z.seBlock || 0, z.seNaiv); z.aufblaehung = rund((z.seGilt / z.seNaiv) * (z.seGilt / z.seNaiv), 3); z.mde80Stichprobentage = rund(Z80 * z.seGilt, 3);
  return z;
}
var placebo = { laeufe: laeufe.length, roh: placeboZeile('roh'), bereinigt: placeboZeile('bereinigt'), signaltageOhneTopf: laeufe[0].ohneTopf, klassenErsatzJeLauf: laeufe[0].ersatz };
/* Zerlegung: gemeinsamer Teil = Tagesmittel des ganzen Topfs an den Signaltagen; eigener Teil = Streuung im Tag und in der Klasse. */
var gem = [], q2 = 0, fg = 0;
tageSortiert.forEach(function (d) { var T = topf[d]; if (!T) return; var alle = []; Object.keys(T).forEach(function (k) { var m = mittel(T[k]); T[k].forEach(function (x) { q2 += (x - m) * (x - m); }); fg += T[k].length - 1; alle = alle.concat(T[k]); }); gem.push({ t: d, x: mittel(alle) }); });
var g4 = ST.momente(gem, 4), g5 = ST.momente(gem, 5);
placebo.zerlegung = { gemeinsamSd: rund(g4.sd, 3), gemeinsamSeNaiv: rund(g4.seNaiv, 4), gemeinsamSeHH: rund(g4.seHH, 4), gemeinsamSeBlock: rund(g5.seBlock, 4), eigenSdJeEinstieg: rund(Math.sqrt(q2 / Math.max(1, fg)), 3), topfEintraege: fg + gem.length };

/* ---------- Aufloesung: MDE80 und noetige Signaltage ---------- */
var wVer = punkt.anteilVerV2, effektNachVerzerrung = ALT.effekt + ALT.verzerrungJePaartag * wVer;
function zeile(name, sd, aufbl) {
  var o = { anker: name, sdJeSignaltag: rund(sd, 3), aufblaehung: aufbl, mde80: {}, noetigeSignaltage: {} };
  [['unberuehrtUntergrenze', signaltage.unberuehrt.untergrenzeStichprobe], ['unberuehrtModell', signaltage.unberuehrt.modell], ['unberuehrtKalibriert', signaltage.unberuehrt.kalibriertAmAltenProtokoll], ['unberuehrtObergrenze', signaltage.unberuehrt.obergrenzeRegimeTage], ['gesamtModell', signaltage.gesamt.modell], ['gesamtObergrenze', signaltage.gesamt.obergrenzeRegimeTage]].forEach(function (p) { o.mde80[p[0]] = rund(Z80 * sd * Math.sqrt(aufbl) / Math.sqrt(p[1]), 3); });
  [['behauptet_1_107', ALT.effekt], ['nachVerzerrung', effektNachVerzerrung], ['huerde_0_157', 0.1569], ['huerde_0_045', 0.0449]].forEach(function (p) { o.noetigeSignaltage[p[0]] = p[1] > 0 ? Math.round(Math.pow(Z80 * sd * Math.sqrt(aufbl) / p[1], 2)) : null; });
  return o;
}
var aufl = [zeile('Placebo roh (Stichprobenmassstab)', placebo.roh.sd, placebo.roh.aufblaehung), zeile('Placebo tagesbereinigt (Stichprobenmassstab)', placebo.bereinigt.sd, placebo.bereinigt.aufblaehung),
  zeile('gemeinsamer Teil allein (Untergrenze ohne Tagesbereinigung)', g4.sd, rund(Math.pow(Math.max(g4.seHH || 0, g5.seBlock || 0, g4.seNaiv) / g4.seNaiv, 2), 3)),
  zeile('altes Protokoll V2 Bestaetigung (echte Signale, Ueberlebende)', ALT.sdBestaetigung, placebo.roh.aufblaehung), zeile('altes Protokoll V2 gesamt', ALT.sdGesamt, placebo.roh.aufblaehung)];

/* Tor 1 (CLAUDE.md): Entdeckung >= 4 x Bestaetigungs-MDE, MDE der Maschine = 2 x se  =>  se <= Effekt / 8. */
var seTor1 = ALT.effekt / 8, liqTage = 0, liqOffen = 0, mitLiq = 0;
reihen.forEach(function (r) { liqTage += r.tageLiq; liqOffen += r.tageLiqOffen; if (r.tageLiq) mitLiq++; });
aufl.forEach(function (z) { z.tor1NoetigeSignaltage = Math.round(Math.pow(z.sdJeSignaltag * Math.sqrt(z.aufblaehung) / seTor1, 2)); });
var nMittel = punkt.v2Hoch / signaltage.gesamt.kalibriertAmAltenProtokoll;
var zusatz = { tor1SeNoetig: rund(seTor1, 4), signaleJeSignaltagUniversum: { beiModell: rund(punkt.v2Hoch / signaltage.gesamt.modell, 1), beiKalibriert: rund(nMittel, 1), altesProtokoll: rund(2567 / 163, 1) },
  eigenSdJeTagBeiMittlererHaeufung: rund(placebo.zerlegung.eigenSdJeEinstieg / Math.sqrt(nMittel), 3), effektNachVerzerrungBand: [rund(ALT.effekt + ALT.verzerrungJePaartag * band.anteilVerV2[1], 3), rund(ALT.effekt + ALT.verzerrungJePaartag * band.anteilVerV2[0], 3)],
  tAltesProtokoll: 2.14, tAltesProtokollNachAufblaehung: rund(2.14 / Math.sqrt(placebo.roh.aufblaehung), 2),
  belegung: { reihenMitLiquidenTagen: mitLiq, liquideReihentage: liqTage, davonRegimeOffen: liqOffen, v1JeLiquidemReihentag: rund(punkt.v1 / liqTage, 5), v2JeOffenemLiquidemReihentag: rund(punkt.v2 / liqOffen, 5) } };

/* ---------- Sperrliste (Nr. 41) ---------- */
var sperr = null;
try {
  var sj = JSON.parse(fs.readFileSync(path.join(ROH, 'sperrliste.json'), 'utf8')), saetze = [];
  sj.reihen.forEach(function (r) { r.split.forEach(function (e) { saetze.push({ reihe: r.reihe, lebend: r.lebend, ex: e.ex, art: e.art, faktor: e.faktor, inKopieAngewandt: e.inKopieAngewandt, sprungProzent: e.sprung == null ? null : rund(100 * e.sprung, 1), v1: e.v1, v2: e.v2 }); }); });
  var su3 = function (f) { var a = [0, 0, 0]; saetze.forEach(function (s) { for (var q = 0; q < 3; q++) a[q] += s[f][q]; }); return a; };
  sperr = { saetzeInListe: sj.splitSaetze, saetzeGezaehlt: saetze.length, reihen: sj.reihen.length, nichtImUniversum: sj.splitReihenNichtImUniversum, inKopieAngewandt: saetze.filter(function (s) { return s.inKopieAngewandt; }).length,
    falscherSprungAb50Prozent: saetze.filter(function (s) { return s.sprungProzent != null && s.sprungProzent <= -50; }).length, fensterErklaerung: '[vor: e-26..e-1, am/nach: e..e+26, Lesefenster: e+27..e+261] in 60m-Kerzen, e = erste Kerze am Ex-Tag',
    v1Signale: su3('v1'), v2Signale: su3('v2'), saetze: saetze };
} catch (e) { sperr = { fehler: e.message }; }

var aus = { kennung: 'kapitulation-neu-2026-10-03/ergebnis/v1', erstellt: new Date().toISOString(), blind: 'keine Rendite echter Signale gerechnet; Renditen nur aus Zufallseinstiegen (Topf)',
  stichprobe: { saat: SAAT, reihen: reihen.length, lebend: n_h[1], verschwunden: n_h[0], archiv: archiv, gewicht: { lebend: rund(W[1]), verschwunden: rund(W[0]) }, anteil: rund(F, 5), teile: teile, gelesenGB: rund(bytes / 1e9, 2), laufzeitSekunden: Math.round(laufMs / 1000),
    vollzaehlungGeschaetztMinuten: Math.round(laufMs / 60000 / F) },
  kalender: { handelstage: nTage, von: kal[0], bis: kal[nTage - 1], regimeOffeneTage: offen.reduce(function (x, y) { return x + y; }, 0), regimeOffenUnberuehrt: kal.filter(function (t, d) { return offen[d] && t < ALT_AB && d >= VORLAUF_TAGE; }).length,
    regimeOffenAltesFenster: kal.filter(function (t, d) { return offen[d] && t >= ALT_AB; }).length, altesFensterAb: ALT_AB, vorlaufTage: VORLAUF_TAGE },
  zaehler: punkt, band95: band, signaltageV2: signaltage, modellprobe: modellprobe, raender: raender, v1: tabelle(false), v2: tabelle(true), haeufungV1: haeufung(false), haeufungV2: haeufung(true),
  placebo: placebo, aufloesung: { z80: rund(Z80, 4), anteilVerschwundenV2: rund(wVer, 4), effektBehauptet: ALT.effekt, verzerrungJePaartag: ALT.verzerrungJePaartag, effektNachVerzerrung: rund(effektNachVerzerrung, 3), huerden: HUERDE, altesProtokoll: ALT, zeilen: aufl, zusatz: zusatz },
  sperrliste: sperr };
fs.writeFileSync(path.join(__dirname, 'ergebnis.json'), JSON.stringify(aus, null, 1));

/* ---------- Kurzausgabe ---------- */
function gpk(g) { return 'Stichprobe ' + g.signaltageStichprobe + ' von ' + g.tage + ' Tagen, Schaetzung Universum ' + rund(g.schaetzung, 0) + ' (pNachtrag ' + rund(g.pNachtrag, 3) + ')'; }
console.log('Stichprobe ' + reihen.length + ' (' + n_h[1] + ' lebend / ' + n_h[0] + ' verschwunden), ' + aus.stichprobe.gelesenGB + ' GB, ' + aus.stichprobe.laufzeitSekunden + ' s; Vollzaehlung ~' + aus.stichprobe.vollzaehlungGeschaetztMinuten + ' min');
console.log('V1 Signale ' + punkt.v1 + ' -> hoch ' + Math.round(punkt.v1Hoch) + ' ' + JSON.stringify(band.v1Hoch) + ', auf Verschwundenen ' + rund(punkt.anteilVerV1) + ' ' + JSON.stringify(band.anteilVerV1));
console.log('V2 Signale ' + punkt.v2 + ' -> hoch ' + Math.round(punkt.v2Hoch) + ' ' + JSON.stringify(band.v2Hoch) + ', auf Verschwundenen ' + rund(punkt.anteilVerV2) + ' ' + JSON.stringify(band.anteilVerV2));
console.log('Signaltage V1: ' + gpk(punkt.tageV1));
console.log('Signaltage V2: ' + JSON.stringify(signaltage));
console.log('Modellprobe ' + JSON.stringify(modellprobe));
console.log('Raender ' + JSON.stringify(raender));
console.log('Haeufung V2 ' + JSON.stringify(aus.haeufungV2) + '\nHaeufung V1 ' + JSON.stringify(aus.haeufungV1));
console.log('V2 je Jahr ' + JSON.stringify(aus.v2.jeJahr) + '\nV2 je Klasse ' + JSON.stringify(aus.v2.jeKlasse) + '\nV1 je Klasse ' + JSON.stringify(aus.v1.jeKlasse));
console.log('Placebo ' + JSON.stringify(placebo));
aufl.forEach(function (z) { console.log(JSON.stringify(z)); });
console.log('Zusatz ' + JSON.stringify(zusatz) + ' Tor1 ' + aufl.map(function (z) { return z.tor1NoetigeSignaltage; }).join('/'));
console.log('Effekt nach Verzerrung ' + rund(effektNachVerzerrung, 3) + ' Pp');
if (sperr && !sperr.fehler) console.log('Sperrliste: ' + sperr.saetzeGezaehlt + ' Saetze in ' + sperr.reihen + ' Reihen, in Kopie angewandt ' + sperr.inKopieAngewandt + ', Sprung <= -50 % ' + sperr.falscherSprungAb50Prozent + ', V1 ' + JSON.stringify(sperr.v1Signale) + ', V2 ' + JSON.stringify(sperr.v2Signale) + ', nicht im Universum ' + JSON.stringify(sperr.nichtImUniversum));
else console.log('Sperrliste: ' + JSON.stringify(sperr));

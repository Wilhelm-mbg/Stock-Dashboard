'use strict';
/* TEIL 2 §T2.2.5 - DIE DIVIDENDENLUECKE BEZIFFERN.
 *
 * Unsere Renditen enthalten keine Ausschuettungen (§1.4 Teil 1: das Archiv ist `adjustment=raw`, die
 * bereinigte Kopie wendet Splits und gemessene Abspaltungen an, ausdruecklich KEINE Dividenden). In der
 * Hauptgroesse Long-Dezil minus Universum kuerzt sich eine gleich grosse Ausschuettung heraus; uebrig
 * bleibt die DIFFERENZ der Dividendenrendite:
 *
 *     Ueberschuss_Kurs = Ueberschuss_Gesamtrendite - (Dividendenrendite_Dezil - Dividendenrendite_Universum)
 *
 * VERFAHREN (offengelegt, wie in der Vorregistrierung verlangt):
 * Quelle ist der Massnahmen-Bestand des Archivs (`K.ORTE.massnahmen()`, 8.348 Symboldateien, 43 MB) -
 * dieselben Saetze, aus denen das Panel Splits und Abspaltungen zieht. Die Bardividenden darin
 * (`_art = cash_dividends`, Feld `rate` in Dollar je Aktie, `ex_date`) werden beim Panelbau bewusst NICHT
 * angewandt; hier werden sie NUR GELESEN und je Halteperiode aufsummiert:
 *
 *   - Eine Position, die zur EROEFFNUNG des Ausfuehrungstags a gekauft und zur Eroeffnung von aEnde
 *     verkauft wird, erhaelt genau die Dividenden mit `Datum(a) < ex_date <= Datum(aEnde)`. An ihrem
 *     eigenen Ex-Tag faellt der Kurs zur Eroeffnung - wer an a kauft, bekommt die Dividende von a nicht;
 *     wer an aEnde verkauft, bekommt die von aEnde noch (er hielt ueber den Vorabendschluss).
 *   - Rendite je Papier = Summe der Saetze / ROHkurs zur Eroeffnung von a. Der Satz ist in den Dollar
 *     der DAMALIGEN Aktie notiert, also gehoert der ROHkurs in den Nenner, nicht der bereinigte
 *     (Nachtrag 3 Teil 1: roh = Dateikurs x faktor).
 *   - Portfoliorendite = Mittel ueber die Mitglieder (gleichgewichtet, wie das Portfolio selbst).
 *
 * GRENZEN, die mitberichtet werden: fehlende Symboldateien zaehlen als "keine Dividende" und ziehen die
 * Schaetzung nach unten; Sonderdividenden (`special`) sind enthalten; Stockdividenden sind NICHT
 * enthalten (sie sind eine Stueckzahlaenderung und stecken bereits in der Kursbereinigung).
 *
 * Aufruf:  node --max-old-space-size=6144 dividenden.js --aus <ordner> [--bericht <datei.json>]
 * NUR LESEN. Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var PR = require('./pruefstand.js');
var RF = require('./rangfunktionen.js');
var ST = require('./statistik.js');

var WURZEL = K.ORTE.massnahmen();
var CACHE = {}, ZAEHLER = { dateien: 0, fehlend: 0, saetze: 0 };
/** Bardividenden einer Reihe: [{ex, rate}], aufsteigend. Fehlt die Datei, ist die Liste leer (gezaehlt). */
function dividendenFuer(ordner) {
  var schl = String(ordner).replace(/~2$/, '');
  if (CACHE[schl]) return CACHE[schl];
  var aus = [];
  try {
    var j = JSON.parse(fs.readFileSync(path.join(WURZEL, schl + '.json'), 'utf8'));
    (j.saetze || []).forEach(function (s) {
      if (s._art !== 'cash_dividends') return;
      var ex = s.ex_date || s.process_date;
      var rate = +s.rate;
      if (!ex || !(rate > 0)) return;
      aus.push({ ex: ex, rate: rate });
    });
    aus.sort(function (a, b) { return a.ex < b.ex ? -1 : a.ex > b.ex ? 1 : 0; });
    ZAEHLER.dateien++; ZAEHLER.saetze += aus.length;
  } catch (e) { aus.fehlt = true; ZAEHLER.fehlend++; }
  CACHE[schl] = aus;
  return aus;
}

/** Dividendenrendite eines gleichgewichteten Korbes ueber (datumA, datumEnde], in Pp. */
function korbRendite(T, mitglieder, a, aEnde, z) {
  var g = T.g, dA = T.kal.tage[a], dE = T.kal.tage[aEnde], summe = 0, n = 0;
  mitglieder.forEach(function (sym) {
    var zl = T.zeileVon(sym, a);
    if (zl < 0) { z.ohneZeile++; return; }
    /* Rohkurs zur Eroeffnung von a: bEroeffnung x faktor, faktor = rohSchluss / bSchluss. */
    var faktor = (g.bSchluss[zl] > 0) ? g.rohSchluss[zl] / g.bSchluss[zl] : NaN;
    var preis = g.bEroeffnung[zl] * faktor;
    if (!(preis > 0)) { z.ohnePreis++; return; }
    var liste = dividendenFuer(T.stand.symbole[sym].ordner);
    if (liste.fehlt) z.ohneDatei++;
    var s = 0;
    for (var i = 0; i < liste.length; i++) {
      if (liste[i].ex > dA && liste[i].ex <= dE) { s += liste[i].rate; z.zahlungen++; }
    }
    if (s > 0) z.zahler++;
    summe += 100 * s / preis; n++;
  });
  return n ? summe / n : null;
}

function luecke(T, rangFn, freq) {
  var L = PR.lauf(T, rangFn, { freq: freq, empfindlichkeit: 'haupt' });
  var z = { ohneZeile: 0, ohnePreis: 0, ohneDatei: 0, zahlungen: 0, zahler: 0, mitglieder: 0 };
  var reihe = [];
  L.perioden.forEach(function (p) {
    z.mitglieder += p.long.mitglieder.length + p.uni.mitglieder.length;
    var dl = korbRendite(T, p.long.mitglieder, p.a, p.aEnde, z);
    var du = korbRendite(T, p.uni.mitglieder, p.a, p.aEnde, z);
    var dk = korbRendite(T, p.kurz.mitglieder, p.a, p.aEnde, z);
    if (dl == null || du == null) return;
    reihe.push({ monat: T.kal.tage[p.a].slice(0, 7), long: dl, uni: du, kurz: dk, luecke: dl - du });
  });
  function mm(f) { return ST.periodenMomente(reihe.map(function (x) { return x[f]; })); }
  var ml = mm('long'), mu = mm('uni'), mk = mm('kurz'), mg = mm('luecke');
  return { rang: rangFn.$name, freq: freq, n: reihe.length, verstoesse: L.verstoesse,
    longMittel: ml.mittel, uniMittel: mu.mittel, kurzMittel: mk.mittel,
    lueckeMittel: mg.mittel, lueckeSe: mg.seNaiv, lueckeT: mg.t,
    longJahr: ml.mittel == null ? null : ml.mittel * (freq === 'monat' ? 12 : 52),
    uniJahr: mu.mittel == null ? null : mu.mittel * (freq === 'monat' ? 12 : 52),
    zaehler: z, reihe: reihe };
}

function haupt() {
  var a = { aus: null, bericht: null };
  var av = process.argv.slice(2);
  for (var i = 0; i < av.length; i++) { if (av[i] === '--aus') a.aus = av[++i]; else if (av[i] === '--bericht') a.bericht = av[++i]; }
  if (!a.aus) { process.stderr.write('--aus <ordner> fehlt\n'); process.exit(2); }
  var berichtPfad = a.bericht || path.join(K.HIER, 'dividendenluecke.json');
  var sag = function (s) { process.stdout.write(s + '\n'); };
  if (!fs.existsSync(WURZEL)) { process.stderr.write('Massnahmen-Bestand nicht erreichbar: ' + WURZEL + '\n'); process.exit(3); }

  var T = PR.Tafel(a.aus);
  sag('Tafel: ' + T.g.n + ' Zeilen; Massnahmen aus ' + WURZEL);
  var B = { kennung: K.KONFIG_KENNUNG_TEIL2, stand: new Date().toISOString(), quelle: WURZEL,
    verfahren: 'Bardividenden (cash_dividends, Feld rate) je Halteperiode (Datum(a) < ex_date <= Datum(aEnde)), geteilt durch den ROHkurs zur Eroeffnung von a, gleichgewichtet ueber die Mitglieder.',
    grenzen: ['fehlende Symboldateien zaehlen als keine Dividende (Zahl ausgewiesen)',
      'Sonderdividenden enthalten, Stockdividenden nicht (die stecken in der Kursbereinigung)',
      'Kapitalgewichtung driftet innerhalb der Periode nicht - dieselbe Vereinfachung wie in §2.4'],
    laeufe: {} };
  function sichern() { fs.writeFileSync(berichtPfad + '.tmp', JSON.stringify(B, null, 1)); fs.renameSync(berichtPfad + '.tmp', berichtPfad); }
  sichern();

  var auftrag = [{ fn: RF.momentum12_1, freq: 'monat' }, { fn: RF.momentum12_1, freq: 'woche' }];
  RF.KANDIDATEN.forEach(function (fn) { K.FREQUENZEN.forEach(function (F) { auftrag.push({ fn: fn, freq: F.key }); }); });
  auftrag.forEach(function (A) {
    var r = luecke(T, A.fn, A.freq);
    B.laeufe[r.rang + '/' + r.freq] = r;
    sag(r.rang + '/' + r.freq + ': Dezil ' + r.longMittel.toFixed(4) + ' Pp, Universum ' + r.uniMittel.toFixed(4)
      + ' Pp => Luecke ' + r.lueckeMittel.toFixed(4) + ' Pp je Periode (se ' + r.lueckeSe.toFixed(4)
      + ', t ' + (r.lueckeT == null ? '-' : r.lueckeT.toFixed(2)) + '), n ' + r.n);
    sichern();
  });
  B.bestand = { gelesenDateien: ZAEHLER.dateien, fehlendeDateien: ZAEHLER.fehlend, gelesenSaetze: ZAEHLER.saetze };
  sichern();
  sag('Bestand: ' + ZAEHLER.dateien + ' Symboldateien gelesen, ' + ZAEHLER.fehlend + ' fehlten, ' + ZAEHLER.saetze + ' Bardividenden-Saetze');
  sag('Bericht: ' + berichtPfad);
}

if (require.main === module) haupt();
module.exports = { dividendenFuer: dividendenFuer, korbRendite: korbRendite };

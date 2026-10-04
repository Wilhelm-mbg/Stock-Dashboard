'use strict';
/* Die Ereignismenge der Messung = die der Machbarkeit (Auftrag §5.3): dieselben Schritte wie `rechnen.js` dort (M2 Zeit, M3 Zuordnung,
 * M4 Ueberraschung, M5 Reihe und Universum am Handelstag vor dem Einstieg), in derselben Reihenfolge - nichts zusaetzlich
 * ausgeschlossen, nichts ergaenzt. Zeit, Zuordnung, Ueberraschung und Ertragsrechnung werden aus dem Ordner der Machbarkeit GERUFEN.
 *
 * BLIND BIS ZUM SIEGEL: der Wert der Ueberraschung wird nur mitgegeben, wenn der Aufrufer `mitUeberraschung: true` setzt -
 * das tut allein lauf.js, und lauf.js startet nur nach dem Siegel (siegel.js). Ohne den Schalter traegt kein Ereignis ein Feld `u`.
 *
 * VERSCHLOSSENE JAHRE (Auftrag §1.2, §5.2): ein Ertrag wird nur fuer Ereignisse mit Einstiegstag im Messfenster gebildet. Ereignisse
 * davor tragen NIE einen Ertrag (Feld `abn` bleibt NaN) - auch nach dem Lauf nicht; sie liefern nur ihren Wert fuer die Vergleichsmenge.
 *
 * Dieses Modul schreibt nichts. Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var path = require('path');
var KF = require('./konfig.js');
var MK = require(path.join(KF.MACHBARKEIT, 'konfig.js'));
var Zt = require(path.join(KF.MACHBARKEIT, 'zeit.js'));
var ZU = require(path.join(KF.MACHBARKEIT, 'zuordnung.js'));
var UE = require(path.join(KF.MACHBARKEIT, 'ueberraschung.js'));
var RE = require(path.join(KF.MACHBARKEIT, 'rechnen.js'));          /* nur `ertraege` (Konvention `halte` des Pruefstands) */
var PS = require(path.join(MK.PRUEFSTAND, 'pruefstand.js'));

/** Schritt 1 (ohne Panel): Hauptmeldungen mit Einstiegstag. FT = Leser der Bilanz-Tafel, meld = Auszug, kal = Kalender des Pruefstands,
 *  symbole = `stand.symbole` des Panels (nur Namen und Referenzmerkmal). Rueckgabe { kandidaten, cikJeReihe }. */
function kandidatenAus(FT, meld, lesart, kal, symbole, opt) {
  opt = opt || {};
  var jeCik = {}, kandidaten = [];
  meld.forEach(function (m) { (jeCik[m.cik] = jeCik[m.cik] || []).push(m); });
  Object.keys(FT.meta.ciks).forEach(function (cik) {
    var ml = (jeCik[cik] || []).sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : a.t < b.t ? -1 : 1; });
    var syms = FT.meta.ciks[cik] || [], zeilen = syms.length ? FT.alleFilings(syms[0]) : [];
    var zu = ZU.ordneZu(zeilen, ml, { maxTageNachPeriode: MK.ZUORDNUNG_MAX_TAGE_NACH_PERIODE });
    ml.forEach(function (m, i) {
      var a = zu[i];
      if (m.f !== '8-K') return;
      if (a.art !== 'vor' || !a.haupt) return;
      var ny = Zt.nyZeit(m.t, lesart), E = ny ? Zt.einstiegstag(ny, kal, MK.HANDELSBEGINN_SEK) : -1;
      var u = UE.ausZeile(zeilen[a.zeile]);
      var k = { cik: +cik, a: m.a, t: m.t, E: E, hatUeberraschung: u.grund === 'ok' };
      if (opt.mitUeberraschung === true && u.grund === 'ok') k.u = u.wert;
      kandidaten.push(k);
    });
  });
  var cikJeReihe = symbole.map(function (s) { return s.referenz ? null : (FT.cikVon(s.reihe) || null); });
  return { kandidaten: kandidaten, cikJeReihe: cikJeReihe };
}

/** Schritt 2 (mit Panel): Reihe, Universum am Stichtag, Klasse - und der um das Klassen-Tagesmittel bereinigte Ertrag, aber NUR fuer
 *  Einstiegstage ab `opt.ertragAb` (Kalenderindex des ersten Fenstertags). opt.horizonte = [20, 60].
 *  Rueckgabe { ereignisse: [...alle Klassen], abn: [Float64Array je Horizont, Index wie ereignisse], zaehler }. */
function ereignisseAus(T, K0, opt) {
  var g = T.g, HOR = opt.horizonte, nH = HOR.length, ertragAb = opt.ertragAb;
  if (!(ertragAb >= 1)) throw new Error('ertragAb fehlt: ohne den ersten Fenstertag wird kein Ertrag gebildet');
  var segmente = {}, s, basis;
  for (s = 0; s < T.nSym; s++) { basis = T.symName[s].replace(/~\d+$/, ''); segmente[basis] = (segmente[basis] || 0) + 1; }
  var reihenVon = {}, getrennt = new Uint8Array(T.nSym);
  for (s = 0; s < T.nSym; s++) {
    if (segmente[T.symName[s].replace(/~\d+$/, '')] > 1) getrennt[s] = 1;
    if (T.stand.symbole[s].referenz) continue;
    var c = K0.cikJeReihe[s];
    if (!c) continue;
    (reihenVon[c] = reihenVon[c] || []).push(s);
  }
  var z = { kandidaten: K0.kandidaten.length, ohneEinstiegstag: 0, nachPanelEnde: 0, keineReihe: 0, ohneZeile: 0, mehrdeutig: 0, nichtImUniversum: 0,
    doppeltReiheTag: 0, imUniversum: 0, ohneUeberraschung: 0, mehrereLinien: 0 };
  var jeE = {};
  K0.kandidaten.forEach(function (k) {
    if (k.E < 0) { z.ohneEinstiegstag++; return; }
    if (k.E > T.maxTag) { z.nachPanelEnde++; return; }
    if (k.E < 1) { z.ohneEinstiegstag++; return; }
    var rl = reihenVon[k.cik] || [];
    if (!rl.length) { z.keineReihe++; return; }
    var mit = rl.filter(function (x) { return T.zeileVon(x, k.E) >= 0; });
    if (!mit.length) { z.ohneZeile++; return; }
    var klar = mit.filter(function (x) { return !getrennt[x]; });
    if (!klar.length) { z.mehrdeutig++; return; }
    (jeE[k.E] = jeE[k.E] || []).push({ k: k, klar: klar });
  });
  var ereignisse = [], gesehen = {}, puffer = new Float64Array(nH), abn = HOR.map(function () { return []; });
  var nK = 4;
  Object.keys(jeE).map(Number).sort(function (a, b) { return a - b; }).forEach(function (E) {
    var U = PS.universum(T, E - 1, { klassen: MK.KLASSEN_ALLE }), map = new Map();
    if (U.aTag !== E) throw new Error('Ausfuehrungstag ' + U.aTag + ' ungleich Einstiegstag ' + E);
    U.liste.forEach(function (e) { map.set(e.sym, e); });
    var heute = [];
    jeE[E].forEach(function (cc) {
      var k = cc.k, drin = cc.klar.filter(function (x) { return map.has(x); });
      if (!drin.length) { z.nichtImUniversum++; return; }
      if (drin.length > 1) {
        z.mehrereLinien++;
        drin.sort(function (x, y) { return g.umsatz[map.get(y).zeile] - g.umsatz[map.get(x).zeile]; });   /* die umsatzstaerkste Linie am Stichtag */
      }
      var e = map.get(drin[0]), key = drin[0] + '|' + E;
      if (gesehen[key]) { z.doppeltReiheTag++; return; }
      gesehen[key] = 1;
      z.imUniversum++;
      if (!k.hatUeberraschung) { z.ohneUeberraschung++; return; }
      var ev = { cik: k.cik, a: k.a, t: k.t, E: E, sym: drin[0], zeileE: e.naechste, klasse: e.klasse };
      if ('u' in k) ev.u = k.u;
      heute.push(ev);
    });
    if (!heute.length) return;
    var h, sum = null, cnt = null;
    if (E >= ertragAb) {                                         /* Ertraege NUR im Messfenster */
      sum = new Float64Array(nK * nH); cnt = new Int32Array(nK * nH);
      for (var m = 0; m < U.liste.length; m++) {
        var mem = U.liste[m];
        RE.ertraege(T, mem.naechste, E, HOR, puffer);
        for (h = 0; h < nH; h++) if (isFinite(puffer[h])) { sum[mem.klasse * nH + h] += puffer[h]; cnt[mem.klasse * nH + h]++; }
      }
    }
    heute.forEach(function (ev) {
      if (sum) {
        RE.ertraege(T, ev.zeileE, E, HOR, puffer);
        for (h = 0; h < nH; h++) {
          var ok = isFinite(puffer[h]) && cnt[ev.klasse * nH + h] > 0;
          abn[h].push(ok ? puffer[h] - sum[ev.klasse * nH + h] / cnt[ev.klasse * nH + h] : NaN);
        }
      } else for (h = 0; h < nH; h++) abn[h].push(NaN);
      ereignisse.push(ev);
    });
  });
  return { ereignisse: ereignisse, abn: abn.map(function (a) { return Float64Array.from(a); }), zaehler: z };
}

/** Auf die Hauptklassen beschraenken (die Klasse 5-50 ist nicht Teil der Messung). */
function nurHauptklassen(E) {
  var idx = [];
  E.ereignisse.forEach(function (e, i) { if (KF.KLASSEN_HAUPT.indexOf(e.klasse) !== -1) idx.push(i); });
  return { ereignisse: idx.map(function (i) { return E.ereignisse[i]; }),
    abn: E.abn.map(function (a) { return Float64Array.from(idx.map(function (i) { return a[i]; })); }), zaehler: E.zaehler };
}

module.exports = { kandidatenAus: kandidatenAus, ereignisseAus: ereignisseAus, nurHauptklassen: nurHauptklassen };

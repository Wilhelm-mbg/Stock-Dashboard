'use strict';
/* Gemeinsamer Unterbau fuer blind.js (vor dem Siegel, OHNE Ueberraschung) und lauf.js (der eine Lauf, nach dem Siegel).
 * Laden, Pruefsummen, Zuteilung, Stufe 1, Buch, Zufallslaeufe, Urteil. Schreibt nichts.
 * Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var KF = require('./konfig.js');
var EV = require('./ereignisse.js');
var ZE = require('./zehntel.js');
var GR = require('./groessen.js');
var BU = require('./buch.js');
var MK = require(path.join(KF.MACHBARKEIT, 'konfig.js'));
var AU = require(path.join(KF.MACHBARKEIT, 'aufloesung.js'));     /* nur zufallsquelle, phi, macht */

function sag(s) { process.stdout.write(new Date().toISOString() + ' ' + s + '\n'); }

function sha256(datei) {
  var h = crypto.createHash('sha256'), fd = fs.openSync(datei, 'r'), buf = Buffer.alloc(1 << 22), n;
  while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) h.update(buf.subarray(0, n));
  fs.closeSync(fd);
  return h.digest('hex');
}
function ordnerSumme(ordner, filter) {
  var dateien = fs.readdirSync(ordner).filter(filter).sort(), zeilen = dateien.map(function (f) { return f + ':' + sha256(path.join(ordner, f)); });
  return { dateien: dateien.length, gesamt: crypto.createHash('sha256').update(zeilen.join('\n')).digest('hex'), jeDatei: zeilen };
}
/** Pruefsummen der drei eingefrorenen Eingaben (SHA-256). */
function pruefsummen() {
  return {
    auszug: sha256(path.join(KF.MACHBARKEIT, 'meldungen-202.tsv')),
    tafel: ordnerSumme(MK.TAFEL, function (f) { return f === '_reihen.json' || /^tafel-\d{4}\.jsonl$/.test(f); }),
    panel: ordnerSumme(path.join(MK.PANEL_AUS, 'panel'), function (f) { return f === '_stand.json' || /^\d{4}\.bin$/.test(f); }),
  };
}

/** Alles laden. opt.mitUeberraschung === true gibt den Wert der Ueberraschung mit - nur lauf.js setzt das, nach dem Siegel. */
function lade(opt) {
  opt = opt || {};
  var PK = require(path.join(MK.PRUEFSTAND, 'konfig.js'));
  var PS = require(path.join(MK.PRUEFSTAND, 'pruefstand.js'));
  var F = require(path.join(MK.FUNDAMENTAL, 'fundamental-lesen.js'));
  var AZ = require(path.join(KF.MACHBARKEIT, 'auszug.js'));
  var RB = require(path.join(KF.RUECKBLICK, 'rueckblick.js'));
  var zp = JSON.parse(fs.readFileSync(path.join(KF.MACHBARKEIT, 'zeitpruefung.json'), 'utf8'));
  if (zp.lesart !== 'utc') throw new Error('Zeitpruefung: Lesart ist nicht utc - anhalten und melden');
  var meld = AZ.lies();
  var stand = JSON.parse(fs.readFileSync(path.join(MK.PANEL_AUS, 'panel', '_stand.json'), 'utf8'));
  var FT = F.oeffne(MK.TAFEL, { maxAlterTage: null }), tafelKennung = FT.kennung;
  sag('Meldungen ' + meld.length + ', Tafel ' + tafelKennung + ' (' + FT.zeilen + ' Zeilen)');
  var K0 = EV.kandidatenAus(FT, meld, zp.lesart, PK.kalender(), stand.symbole, { mitUeberraschung: opt.mitUeberraschung === true });
  FT = null; meld = null;
  var T = PS.Tafel(MK.PANEL_AUS), kal = T.kal;
  sag('Panel ' + T.stand.kennung + ': ' + T.g.n + ' Zeilen, letzter Tag ' + kal.tage[T.maxTag]);
  if (T.stand.kennung !== KF.PANEL_KENNUNG) throw new Error('ABBRUCH (Regel 5): Panel-Kennung ' + T.stand.kennung);
  if (tafelKennung !== KF.TAFEL_KENNUNG) throw new Error('ABBRUCH (Regel 5): Tafel-Kennung ' + tafelKennung);
  var Q = RB.vorbereiten(T), Mn = RB.Massnahmen(T, Q);
  var von = RB.tagAb(T, Q, KF.FENSTER_VON), bis = T.maxTag;
  if (String(kal.tage[von]) !== KF.FENSTER_VON) throw new Error('KLINKE: erster Fenstertag ist nicht der ' + KF.FENSTER_VON);
  if (String(kal.tage[bis]) !== KF.FENSTER_BIS) throw new Error('KLINKE: letzter Panel-Tag ist nicht der ' + KF.FENSTER_BIS);
  var alle = EV.ereignisseAus(T, K0, { horizonte: KF.HORIZONTE, ertragAb: von });
  var haupt = EV.nurHauptklassen(alle);
  sag('Ereignisse: alle Klassen ' + alle.ereignisse.length + ', Hauptklassen ' + haupt.ereignisse.length);
  return { T: T, Q: Q, RB: RB, PK: PK, von: von, bis: bis, alleKlassen: alle.ereignisse.length, ereignisse: haupt.ereignisse, abn: haupt.abn, zaehler: alle.zaehler,
    tafelKennung: tafelKennung, DIV: function (sym, d) { return RB.ausschuettungenAm(T, Q, Mn, sym, d); }, massnahmen: Mn };
}

/** Der Rechenkontext: Felder je Ereignis (Hauptklassen), ohne den Signalwert. */
function kontext(L) {
  var ev = L.ereignisse, n = ev.length, T = L.T;
  var tag = new Int32Array(n), kosten = new Float64Array(n), zeit = new Float64Array(n), imFenster = 0, vorFenster = 0;
  for (var i = 0; i < n; i++) {
    tag[i] = ev[i].E; kosten[i] = KF.KOSTEN_UMLAUF_PP[ev[i].klasse];
    var ms = Date.parse(ev[i].t);
    if (!isFinite(ms) || !isFinite(kosten[i])) throw new Error('Ereignis ohne Annahmezeit oder ohne Kostensatz');
    zeit[i] = Math.floor(ms / 1000);
    if (tag[i] >= L.von) imFenster++; else { vorFenster++; if (isFinite(L.abn[0][i]) || isFinite(L.abn[1][i])) throw new Error('BLINDHEIT: Ereignis vor dem Fenster traegt einen Ertrag'); }
  }
  var H = {};
  KF.HORIZONTE.forEach(function (h, k) { H[h] = { ev: { tag: tag, x: L.abn[k], kosten: kosten }, lag: h - 1, tagVon: L.von, tagBis: L.bis - h }; });
  return { n: n, tag: tag, zeit: zeit, kosten: kosten, ord: ZE.ordnung(tag), H: H, von: L.von, bis: L.bis, ereignisse: ev, T: T, Q: L.Q, DIV: L.DIV,
    spy: T.symIdx[KF.MASSSTAB], totalverlust: L.PK.TOTALVERLUST_GRUENDE, imFenster: imFenster, vorFenster: vorFenster };
}

function zuteilung(C, wert, grenzen) {
  return ZE.zuteilen(C.tag, wert, { abTag: C.von, fenster: KF.VERGLEICH_TAGE, mindestens: KF.VERGLEICH_MINDESTENS, anteil: KF.ANTEIL, ord: C.ord, grenzen: grenzen });
}
function stufe1(C, zt, h, opt) {
  var X = C.H[h], o = { lag: X.lag, tagVon: X.tagVon, tagBis: X.tagBis };
  if (opt) Object.keys(opt).forEach(function (k) { o[k] = opt[k]; });
  return GR.groessen(X.ev, zt, o);
}
function buchOpt(C, detail) {
  return { startTag: C.von, endTag: C.bis, start: KF.START, plaetze: KF.PLAETZE, halten: KF.HALTEN, kostenPp: KF.KOSTEN_UMLAUF_PP, spyBp: KF.SPY_KOSTEN_BP,
    totalverlust: C.totalverlust, spy: C.spy, detail: !!detail };
}
/** Das Buch fuer eine Zuteilung: gekauft werden kann nur das oberste Zehntel. `wert` ist der Signalwert (Reihenfolge bei gleicher Sekunde). */
function buch(C, zt, wert, detail) {
  var meldungen = [];
  for (var i = 0; i < C.n; i++) {
    if (zt[i] !== ZE.OBEN) continue;
    var e = C.ereignisse[i];
    meldungen.push({ E: e.E, sym: e.sym, cik: e.cik, klasse: e.klasse, zeit: C.zeit[i], wert: wert[i], name: C.T.symName[e.sym], a: e.a });
  }
  return BU.simuliere(C.T, C.Q, C.DIV, meldungen, buchOpt(C, detail));
}
function massstab(C) { return BU.massstab(C.T, C.Q, C.DIV, buchOpt(C)); }

function zufallswerte(n, r) {
  var rnd = AU.zufallsquelle(KF.ZUFALL_START + r), w = new Float64Array(n);
  for (var i = 0; i < n; i++) w[i] = rnd();
  return w;
}
/** Die 200 Zufallslaeufe: Zufallszahl an Stelle der Ueberraschung, dieselbe Zehntel-Regel; je Lauf Stufe 1 (H = 60, 20) und das Buch. */
function zufallslaeufe(C, opt) {
  var aus = { g: {}, buecher: [] };
  KF.HORIZONTE.forEach(function (h) { aus.g[h] = []; });
  for (var r = 0; r < KF.ZUFALL_LAEUFE; r++) {
    var w = zufallswerte(C.n, r), zt = zuteilung(C, w);
    KF.HORIZONTE.forEach(function (h) { aus.g[h].push(stufe1(C, zt, h)); });
    if (opt && opt.buecher) {
      var b = buch(C, zt, w, false);
      aus.buecher.push({ endwert: b.endwert, gekauft: b.zaehler.gekauft, verfallen: b.zaehler.verfallenPlaetzeVoll + b.zaehler.verfallenKeinSpy, top10Summe: b.top10Summe,
        abstand: b.abstand, plaetzeMittel: b.plaetzeMittel, aktienAnteilMittel: b.aktienAnteilMittel });
    }
    if (opt && opt.melde && (r + 1) % 50 === 0) sag('Zufallslauf ' + (r + 1) + ' von ' + KF.ZUFALL_LAEUFE);
  }
  return aus;
}

/** Placebo ohne Kursbezug (Entwurf §6): letzte Ziffer der Akzessionsnummer; 9 = oben, 0 = unten. Dieselbe Menge wie das Signal (zt >= -1). */
function placeboZuteilung(C, ztSignal) {
  var aus = new Int8Array(C.n);
  for (var i = 0; i < C.n; i++) {
    if (ztSignal[i] < -1) { aus[i] = ztSignal[i]; continue; }
    var m = /(\d)\D*$/.exec(String(C.ereignisse[i].a));
    if (!m) throw new Error('Akzessionsnummer ohne Ziffer');
    aus[i] = m[1] === '9' ? 1 : (m[1] === '0' ? -1 : 0);
  }
  return aus;
}

/** Positivkontrolle (Entwurf §6): ein eingepflanzter Abstand in Hoehe der MDE von A muss in mindestens 65 % der Zufallslaeufe t >= 2 erreichen. */
function positivkontrolle(laeufe, zf) {
  var m = KF.MDE_FAKTOR * Math.max(zf.zufall.A, zf.nwMittel.A), n = 0;
  laeufe.forEach(function (g) { if ((g.A + m) / Math.max(zf.zufall.A, g.nw.A) >= KF.POSITIV_T) n++; });
  return { eingepflanzt: m, anteil: n / laeufe.length, mindestens: KF.POSITIV_MINDESTENS, bestanden: n / laeufe.length >= KF.POSITIV_MINDESTENS };
}

/** Das Urteil der Stufe 1 (Entwurf §9 und §10, ohne die Bedingung zu 2017-2020; Auftrag §5.2). Eingabe nur Zahlen. */
function urteil(e) {
  var schranke = e.Bnetto + KF.SCHRANKE_Z * e.fehlerBnetto, abbruch = [];
  if (Math.abs(e.placeboTA) > KF.PLACEBO_ABBRUCH || Math.abs(e.placeboTBM) > KF.PLACEBO_ABBRUCH) abbruch.push('Placebo ausserhalb von +-3 eigenen Fehlern');
  if (e.positivAnteil < KF.POSITIV_MINDESTENS) abbruch.push('Positivkontrolle unter 65 %');
  (e.abbruch || []).forEach(function (a) { abbruch.push(a); });
  var tor = e.tA >= KF.TOR_T && e.tBnetto >= KF.TOR_T;
  var placeboOk = Math.abs(e.placeboTA) <= KF.PLACEBO_SOLL && Math.abs(e.placeboTBM) <= KF.PLACEBO_SOLL;
  var aus = { tor: tor, torA: e.tA >= KF.TOR_T, torBnetto: e.tBnetto >= KF.TOR_T, placeboBestanden: placeboOk, positivBestanden: e.positivAnteil >= KF.POSITIV_MINDESTENS,
    BMpositiv: e.BM > 0, obereSchrankeBnetto: schranke, abbruch: abbruch, grund: '' };
  if (abbruch.length) { aus.urteil = 'kein Urteil (Abbruch)'; aus.grund = abbruch.join('; '); return aus; }
  if (tor) {
    if (placeboOk && e.BM > 0) { aus.urteil = 'belegt'; aus.grund = 'Tor fuer A und B netto passiert, Placebo und Positivkontrolle bestanden, B - M > 0'; }
    else { aus.urteil = 'nicht entscheidbar'; aus.grund = 'Tor passiert, aber ' + (!placeboOk ? 'Placebo ausserhalb von +-2 eigenen Fehlern' : 'B - M nicht groesser als 0'); }
    return aus;
  }
  if (schranke < KF.SCHRANKE_NICHT_BELEGT_PP) { aus.urteil = 'nicht belegt'; aus.grund = 'Tor verfehlt und obere 95-%-Schranke von B netto unter 1 Pp'; }
  else { aus.urteil = 'nicht entscheidbar'; aus.grund = 'Tor verfehlt, obere 95-%-Schranke von B netto nicht unter 1 Pp'; }
  return aus;
}

function quantil(werte, p) { return ZE.perzentil(Float64Array.from(werte).sort(), p); }
function proJahr(endwert, jahre) { return (Math.pow(endwert / KF.START, 1 / jahre) - 1) * 100; }

module.exports = { sag: sag, sha256: sha256, pruefsummen: pruefsummen, lade: lade, kontext: kontext, zuteilung: zuteilung, stufe1: stufe1, buch: buch, buchOpt: buchOpt,
  massstab: massstab, zufallswerte: zufallswerte, zufallslaeufe: zufallslaeufe, placeboZuteilung: placeboZuteilung, positivkontrolle: positivkontrolle, urteil: urteil,
  quantil: quantil, proJahr: proJahr, AU: AU };

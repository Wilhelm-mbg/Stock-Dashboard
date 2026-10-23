'use strict';
/* TAFEL der tag-Form: Tageskerzen je Reihe aus einer von zwei Quellen, ohne Siegel gesperrt am Ende des EICHFENSTERS (K.EICHUNG.bis,
 * Nr. 121-2a; bis Nr. 121-1 die Holdout-Sperre SPERRE_AB) (FORM.md §3, §5).
 *   quelle 'panel'           - das Panel v2.3 des Pruefstands (Jahresbloecke; ohne Siegel werden die Jahre nach dem Eichfenster GAR NICHT
 *                              gelesen, wie studien/nachzuegler-2026-10/lesen.js). Hoch/Tief gibt es dort nicht (NaN).
 *   quelle 'trendkanal-tage' - die Tagesdateien der Trendkanal-Studie (E:/.../studien-zellen/trendkanal-tage-2026-09-09/tage-*),
 *                              gelesen mit deren eigenem Leser (M.ladeTage); ohne Siegel wird jede Reihe am letzten Tag des
 *                              Eichfensters abgeschnitten. Fuer die Kalibrierung gegen die Studie und fuer Regeln, die Hoch/Tief brauchen.
 * Reihe S = { reihe, n, tag (Kalenderindex), o, h, l, c, v, klasse (Int8, -1 ohne), mass (Uint8: 1 = Massnahmenfenster), lebend (0/1),
 *             gruppe ('uebernahme' | 'insolvenz' | 'sonstige' | null), nextPos } - die Form von kanaele.js (reiheAus);
 *             dazu roh (Float64, roher = unbereinigter Schluss; Nr. 113) nur, wo die Quelle ihn traegt - die Tafel meldet hatRoh.
 * Die Tafel meldet hatRoh (roh je Reihe vorhanden), hatMarkt (spy = bereinigte SPY-Reihe vorhanden) und hatDatum (Kalender tage je Index,
 * Nr. 117: sicht.datum(j) und die Monatsfunktionen) neben hochTief.
 * NUR LESEN. Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var SG = require('./siegel.js');

/* Panel: ende_grund der Gruende-Tafel (Nr. 109); Trendkanal-Tagesdateien: ende.art der Quelle (cash_mergers ...). */
var ABGANG_GRUPPEN = { uebernahme: 'uebernahme', 'fusion-aktientausch': 'uebernahme', 'spac-ende': 'uebernahme', insolvenz: 'insolvenz', 'zwangs-delisting': 'insolvenz',
  cash_mergers: 'uebernahme', stock_mergers: 'uebernahme', stock_and_cash_mergers: 'uebernahme' };
function gruppeVon(grund, lebend) { if (lebend) return null; return ABGANG_GRUPPEN[grund] || 'sonstige'; }

/** Klassen (Umsatzklassen mit Kassa-Huerde je Umlauf) aus der Trendkanal-/Minutenstudie - unveraendert. */
function klassen() { return require(path.join(K.TRENDKANAL_STUDIE, 'konfig.js')).KLASSEN; }

/** Kalender [von, bis] aus der Kalenderdatei des Archivs (konfig.json). */
function kalender(von, bis) {
  var j = JSON.parse(fs.readFileSync(K.dateiPruefen(K.KALENDER, 'Kalender'), 'utf8'));
  var tage = Object.keys(j.tage).filter(function (t) { return t >= von && t <= bis; }).sort();
  var idx = {}; tage.forEach(function (t, i) { idx[t] = i; });
  return { tage: tage, idx: idx };
}
/** Letzter Index im Eichfenster (tage <= K.EICHUNG.bis); fuer jeden Handelskalender derselbe wie bis Nr. 121-1 (tage < 2023-01-01). */
function sperrIndex(tage) { var s = -1; for (var i = 0; i < tage.length; i++) if (tage[i] <= K.EICHUNG.bis) s = i; return s; }
function sperrJahr() { return +K.EICHUNG.bis.slice(0, 4); }

/** Siegel 2 pruefen, wenn die Pruefzeit verlangt ist; sonst gesperrt - ausser opt.bisPanelende (Nr. 121-2a: Entdeckung neuer Kandidaten bis zum
 *  letzten Panel-Tag; die Lesesperre gilt nur noch als Eichfenster-Grenze fuer Kalibrierung, Kunsttests und --eichung). */
function siegelFuer(opt) {
  if (!opt.pruefzeit) return null;
  if (!opt.siegelPfad) throw SG.sperrFehler('Pruefzeit verlangt, aber kein Siegel (siegelPfad) genannt');
  return SG.pruefeSiegel(opt.repo || K.REPO, opt.siegelPfad);
}

/* ---------- Quelle 1: das Panel ---------- */
function ausPanel(opt) {
  var PR = require(path.join(K.PRUEFSTAND, 'paneldaten.js'));
  var KP = require(path.join(K.PRUEFSTAND, 'konfig.js'));
  var C = require(path.join(K.TRENDKANAL_STUDIE, 'kanaele.js'));
  var siegel = siegelFuer(opt), offen = !!siegel || !!opt.bisPanelende;
  var aus = opt.panel || K.PANEL, kennung = opt.panelKennung || K.PANEL_KENNUNG, ordner = path.join(aus, 'panel');
  K.ordnerPruefen(ordner, 5, 'Panel ' + aus);
  var stand = JSON.parse(fs.readFileSync(path.join(ordner, '_stand.json'), 'utf8'));
  if (stand.kennung !== kennung) throw new Error('Panelkennung ' + stand.kennung + ' statt ' + kennung);
  if (!Array.isArray(stand.tage) || !stand.tage.length || stand.letzterVollTagIdx == null) throw new Error('_stand.json ohne tage/letzterVollTagIdx');
  var tage = stand.tage, sperrIdx = sperrIndex(tage), nTage = tage.length;
  var jahre = stand.jahre.map(function (j) { return j.jahr; }).filter(function (j) { return offen || j <= sperrJahr(); }).sort(function (a, b) { return a - b; });
  var nSym = stand.symbole.length, sp = [];
  for (var s = 0; s < nSym; s++) sp.push({ tag: [], o: [], h: [], l: [], c: [], v: [], klasse: [], mass: [], roh: [] });
  jahre.forEach(function (j) {
    var b = PR.leseBlock(path.join(ordner, j + '.bin'), kennung);
    for (var q = 0; q < b.n; q++) {
      if (!offen && b.tag[q] > sperrIdx) throw SG.sperrFehler('Block enthaelt einen Tag nach dem Eichfenster ' + K.EICHUNG.bis + ' (' + tage[b.tag[q]] + ')');
      var r = sp[b.sym[q]], f = b.faktor[q] || 1, cs = b.rohSchluss[q] / f;
      r.tag.push(b.tag[q]); r.o.push(b.rohEroeffnung[q] / f); r.h.push(NaN); r.l.push(NaN); r.c.push(cs);
      r.v.push(cs > 0 ? (b.umsatzReg[q] + b.umsatzAuktion[q]) / cs : 0);
      r.klasse.push(b.klasse[q]); r.mass.push((b.marken[q] & KP.M_MASSNAHME_NAH) ? 1 : 0);
      r.roh.push(b.rohSchluss[q]);                                   /* Nr. 113: roher Schluss ohne Division (Preisfilter der Literatur) */
    }
  });
  var maxTag = offen ? stand.letzterVollTagIdx : Math.min(stand.letzterVollTagIdx, sperrIdx);
  var reihen = [], spy = null;
  stand.symbole.forEach(function (sym, s2) {
    var r = sp[s2]; if (!r.tag.length) return;
    var S = C.reiheAus(r, nTage);
    S.reihe = sym.reihe; S.klasse = Int8Array.from(r.klasse); S.mass = Uint8Array.from(r.mass); S.lebend = sym.lebend ? 1 : 0;
    S.roh = Float64Array.from(r.roh);
    S.gruppe = gruppeVon(sym.ende_grund, S.lebend); S.art = sym.art;
    if (sym.referenz) { if (sym.reihe === 'SPY') spy = S; return; }
    reihen.push(S);
  });
  sp = null;
  return { quelle: 'panel', hochTief: false, hatRoh: true, hatMarkt: !!spy, hatDatum: true, nTage: nTage, tage: tage, idx: stand.tage.reduce(function (m, t, i) { m[t] = i; return m; }, {}),
    reihen: reihen, spy: spy, sperrIdx: sperrIdx, maxTag: maxTag, gesperrt: !offen, siegel: siegel, klassen: klassen(), kennung: stand.kennung, jahreGelesen: jahre };
}

/* ---------- Quelle 2: die Tagesdateien der Trendkanal-Studie ---------- */
function ausTrendkanal(opt) {
  var M = require(path.join(K.TRENDKANAL_STUDIE, 'messen.js'));
  var C = require(path.join(K.TRENDKANAL_STUDIE, 'kanaele.js'));
  var KT = require(path.join(K.TRENDKANAL_STUDIE, 'konfig.js'));
  var siegel = siegelFuer(opt), offen = !!siegel || !!opt.bisPanelende;
  var ordner = opt.ordner || K.TRENDKANAL.ordner, summe = 0;
  ordner.forEach(function (o) { summe += K.ordnerPruefen(o, 1, 'Trendkanal-Tagesdateien'); });
  if (summe < K.TRENDKANAL.mindestDateien) throw new Error('DATENQUELLE LEER: Trendkanal-Tagesdateien ' + summe + ' < ' + K.TRENDKANAL.mindestDateien);
  var kal = kalender(K.TRENDKANAL.von, K.TRENDKANAL.bis), nTage = kal.tage.length;
  var F = JSON.parse(fs.readFileSync(path.join(ordner[0], '_fortschritt.json'), 'utf8'));
  if (F.nTage !== nTage) throw new Error('Kalender ' + nTage + ' Tage, Tagesdateien ' + F.nTage + ' - passt nicht');
  var T = M.ladeTage(ordner, 'c1', nTage, opt.nurReihen || null);
  if (!T.spy) throw new Error('DATENQUELLE: SPY.json fehlt in den Tagesdateien');
  var sperrIdx = sperrIndex(kal.tage);
  function fertig(S) {
    S.mass = new Uint8Array(S.n); for (var p = 0; p < S.n; p++) S.mass[p] = (S.flags[p] & KT.FLAG.massnahmen) ? 1 : 0;
    S.gruppe = gruppeVon(S.ende && S.ende.art, S.lebend);
    /* Nr. 113: ladeTage liefert in S.roh den ROHKURS-FAKTOR je Tag (tagesbalken.js, lesen.js rohFaktorFunktion), keinen Rohkurs - er traegt
     * Alpacas Massnahmen ungeprueft (Kreuzprobe 12.10.: 1.204 von 273.919 Tagen anders als der Panel-Faktor mit Split-Sperre). Kein roh hier
     * (hatRoh false); der Faktor bleibt unter rohFaktor erhalten, damit roh(j) ihn nicht als Kurs liest. */
    S.rohFaktor = S.roh || null; S.roh = null;
    if (offen) return S;
    var n = 0; while (n < S.n && S.tag[n] <= sperrIdx) n++;
    if (n === S.n) return S;
    var sp = { tag: [], o: [], h: [], l: [], c: [], v: [] };
    for (var q = 0; q < n; q++) { sp.tag.push(S.tag[q]); sp.o.push(S.o[q]); sp.h.push(S.h[q]); sp.l.push(S.l[q]); sp.c.push(S.c[q]); sp.v.push(S.v[q]); }
    var S2 = C.reiheAus(sp, nTage);
    S2.reihe = S.reihe; S2.klasse = S.klasse.slice(0, n); S2.mass = S.mass.slice(0, n); S2.lebend = S.lebend; S2.gruppe = S.gruppe; S2.art = S.art;
    return S2;
  }
  var reihen = T.reihen.map(fertig), spy = fertig(T.spy);
  var maxTag = nTage - 1; if (!offen) maxTag = Math.min(maxTag, sperrIdx);
  return { quelle: 'trendkanal-tage', hochTief: true, hatRoh: false, hatMarkt: !!spy, hatDatum: true, nTage: nTage, tage: kal.tage, idx: kal.idx, reihen: reihen, spy: spy, sperrIdx: sperrIdx,
    maxTag: maxTag, gesperrt: !offen, siegel: siegel, klassen: klassen(), kennung: F.kennung, dateien: T.dateien };
}

/** Tafel oeffnen. opt.quelle ('panel' | 'trendkanal-tage'), opt.pruefzeit, opt.siegelPfad, opt.repo, opt.nurReihen (nur Test/Trendkanal),
 *  opt.bisPanelende (Nr. 121-2a: ohne Siegel bis zum letzten Tag der Quelle - Kandidatenlaeufe; ohne das Feld gesperrt am Eichfenster). */
function oeffne(opt) {
  opt = opt || {};
  var frei = K.speicherFreiGb();
  if (!opt.ohneSpeicherpruefung && frei < K.SPEICHER_MIN_GB) throw new Error('SPEICHER: ' + frei.toFixed(1) + ' GB frei, unter ' + K.SPEICHER_MIN_GB + ' GB - warten');
  var q = opt.quelle || 'panel';
  if (q === 'panel') return ausPanel(opt);
  if (q === 'trendkanal-tage') return ausTrendkanal(opt);
  throw new Error('unbekannte Quelle ' + q);
}

/** NUR FUER TESTS: Tafel aus Kunstreihen { reihe, tag, o, h, l, c, v, klasse?, mass?, lebend?, gruppe?, roh? (Vorgabe = c) } ueber einen
 *  Kunstkalender. Die Reihe 'SPY' wird zur Marktreihe (spy, hatMarkt), wie bei den echten Quellen. */
function kunstTafel(reihenSpalten, tage, opt) {
  opt = opt || {};
  var C = require(path.join(K.TRENDKANAL_STUDIE, 'kanaele.js'));
  var nTage = tage.length, idx = {}; tage.forEach(function (t, i) { idx[t] = i; });
  var sperrIdx = sperrIndex(tage), offen = !!opt.offen;
  function bau(r) {
    var S = C.reiheAus(r, nTage);
    S.reihe = r.reihe; S.klasse = Int8Array.from(r.klasse || new Array(S.n).fill(3)); S.mass = Uint8Array.from(r.mass || new Array(S.n).fill(0));
    S.lebend = r.lebend == null ? 1 : r.lebend; S.gruppe = r.gruppe || null;
    S.roh = Float64Array.from(r.roh || r.c);
    return S;
  }
  var alle = reihenSpalten.map(bau), spy = null, reihen = [];
  alle.forEach(function (S) { if (S.reihe === 'SPY') spy = S; else reihen.push(S); });
  return { quelle: opt.quelle || 'kunst', hochTief: true, hatRoh: true, hatMarkt: !!spy, hatDatum: true, nTage: nTage, tage: tage, idx: idx, reihen: reihen, spy: spy, sperrIdx: sperrIdx,
    maxTag: offen ? nTage - 1 : Math.min(nTage - 1, sperrIdx), gesperrt: !offen, siegel: null, klassen: opt.klassen || klassen(), kennung: 'kunst' };
}

module.exports = { oeffne: oeffne, kunstTafel: kunstTafel, kalender: kalender, klassen: klassen, sperrIndex: sperrIndex, ABGANG_GRUPPEN: ABGANG_GRUPPEN };

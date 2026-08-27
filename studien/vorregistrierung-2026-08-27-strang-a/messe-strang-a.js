'use strict';
/* STRANG A — REFERENZMESSUNG AUSSER KONKURRENZ (momentum nicht ueberlappend).
 * Werkzeug zur VORREGISTRIERUNG.md in diesem Ordner (Commits 59440b1 + fec9720).
 *
 * JEDE Zahl aus diesem Werkzeug traegt die Beschriftung AUSSER KONKURRENZ - beide
 * Haelften der Historie sind gesehen, "bestaetigt" ist als Ausgang ausgeschlossen.
 *
 * Ablauf (Reihenfolge fest, §3): Wachhund -> W1 Kunstinjektion -> W2 kursblinder
 * Placebo -> der eine echte Lauf. W1 prueft die UEBERSCHUSS-ARITHMETIK, nicht die
 * Auswahl (Nachtrag 9b). Kontrolltopf ENTHAELT die gewaehlten 10 % (Nachtrag 9a);
 * die Rest-Fassung wird nachrichtlich ueber 1/(1-a_P) mitgedruckt, kein zweiter Test.
 *
 * Aufruf (empfohlen mit --max-old-space-size=4096):
 *   node messe-strang-a.js --waechter    W1+W2, schreibt waechter-<zeit>.json
 *   node messe-strang-a.js --referenz    verlangt gruenen Waechterstand DERSELBEN
 *                                        Ausfuehrung -> deshalb praktisch: --alles
 *   node messe-strang-a.js --alles       Wachhund -> W1 -> W2 -> Referenzlauf
 *
 * SPERREN (§7/Nachtrag 9): Dieses Werkzeug prueft nur Sperre 4 (Wachhund) selbst.
 * Sperre 1 (Wilhelms Datenfund-Vorrang) und den Rest pruefen Menschen - wer --alles
 * startet, bestaetigt damit, dass sie gefallen sind.
 */
var fs = require('fs'), path = require('path'), cp = require('child_process');

var REPO = 'C:/Users/Wilhe/Downloads/Stock-Dashboard';
var ARCHIV = process.env.MD_ARCHIV1D || 'E:/Markt-Dashboard-Archiv/archiv1d';
var HIER = __dirname;
var WP = require(REPO + '/studien/messmaschine/strategien/wertpapierart.js');

var RUECKBLICK = 231, LUECKE = 21, HALTEN = 63, ANTEIL = 0.10, MINDEST_WERTE = 100;
var SCHNITT = '2006-08-14';
var SEED = 20260827;
var SE_NW_PROTOKOLL = 0.011293;      /* Var 0, momentum-2026-08-26.json, Pp/100 */
var G_EICHUNG = 1.543;               /* Eichung 25.08., Bestaetigungshaelfte */
var STEMPEL = 'AUSSER KONKURRENZ - kein Beleg (Haelften verbrannt)';

function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }
function pp(x) { return x == null ? '-' : ((x >= 0 ? '+' : '') + (x * 100).toFixed(3)); }
function statistik(werte) {
  var n = werte.length; if (n < 3) return null;
  var m = 0; werte.forEach(function (x) { m += x; }); m /= n;
  var v = 0; werte.forEach(function (x) { v += (x - m) * (x - m); }); v /= (n - 1);
  var se = Math.sqrt(v / n);
  return { n: n, mittel: m, sd: Math.sqrt(v), se: se, t: se > 0 ? m / se : null };
}

function wachhundOk() {
  /* Nur archiv1d - dieses Werkzeug liest 60m nie; die globale Pruefung wuerde
   * waehrend eines 60m-Nachladelaufs grundlos sperren (Wachhund sperrt je Archiv). */
  var r = cp.spawnSync(process.execPath, [REPO + '/tools/archiv-wachhund.js', 'archiv1d'], { encoding: 'utf8', timeout: 300000 });
  console.log('[Wachhund archiv1d] Exit ' + r.status);
  if (r.stdout) console.log(r.stdout.trim().split('\n').slice(-3).join('\n'));
  if (r.status === 2) { console.error('ABBRUCH: Sperre (Exit 2).'); return false; }
  if (r.status !== 0) { console.error('ABBRUCH: Wachhund Exit ' + r.status + '.'); return false; }
  return true;
}

/* ---------- Laden: identisch zur Eichung (F1-Filter, WP.istAktie) ---------- */
function lade() {
  var dateien = fs.readdirSync(ARCHIV).filter(function (f) { return /^bars_1d_.+\.json$/.test(f); });
  var U = {}, zeitachse = {};
  dateien.forEach(function (f) {
    var sym = f.slice(8, -5);
    if (!WP.istAktie(sym)) return;
    var j; try { j = JSON.parse(fs.readFileSync(path.join(ARCHIV, f), 'utf8')); } catch (e) { return; }
    var b = j && j.series;
    if (!b || b.length < RUECKBLICK + LUECKE + HALTEN + 10) return;
    var maxKurs = 0, kaputt = false;
    for (var i = 0; i < b.length; i++) {
      var c = b[i][1];
      if (!(c > 0)) continue;
      if (c > maxKurs) maxKurs = c;
      if (i > 0 && b[i - 1][1] > 0) { var r = c / b[i - 1][1] - 1; if (r > 4 || r < -0.8) { kaputt = true; break; } }
    }
    if (kaputt || maxKurs > 100000) return;
    U[sym] = b;
    b.forEach(function (k) { zeitachse[k[0]] = 1; });
  });
  var TAGE = Object.keys(zeitachse).map(Number).sort(function (a, b) { return a - b; });
  var IDX = {};
  Object.keys(U).forEach(function (s) { var m = new Map(); U[s].forEach(function (k, i) { m.set(k[0], i); }); IDX[s] = m; });
  return { U: U, TAGE: TAGE, IDX: IDX, syms: Object.keys(U) };
}

/* ---------- Perioden einer Rasterlage; Mitglieder bleiben erhalten (fuer W1/W2) ---------- */
function laufe(D, phase) {
  var perioden = [];
  for (var t = 252 + phase; t + HALTEN < D.TAGE.length; t += HALTEN) {
    var ms = D.TAGE[t], msEnde = D.TAGE[t + HALTEN];
    var kandidaten = [];
    for (var si = 0; si < D.syms.length; si++) {
      var s = D.syms[si], b = D.U[s], im = D.IDX[s];
      var i = im.get(ms), iE = im.get(msEnde);
      if (i == null || iE == null) continue;
      var von = i - RUECKBLICK - LUECKE, bis = i - LUECKE;
      if (von < 0) continue;
      var a = b[von][1], m2 = b[bis][1], p0 = b[i][1], p1 = b[iE][1];
      if (!(a > 0) || !(m2 > 0) || !(p0 > 0) || !(p1 > 0)) continue;
      kandidaten.push({ sym: s, staerke: m2 / a - 1, folge: p1 / p0 - 1 });
    }
    if (kandidaten.length < MINDEST_WERTE) continue;
    kandidaten.sort(function (x, y) { return y.staerke - x.staerke; });
    var n = Math.max(1, Math.round(kandidaten.length * ANTEIL));
    var korb = kandidaten.slice(0, n);
    var mK = 0; korb.forEach(function (k) { mK += k.folge; }); mK /= korb.length;
    var mA = 0; kandidaten.forEach(function (k) { mA += k.folge; }); mA /= kandidaten.length;
    perioden.push({ tag: tagVon(ms), hf: tagVon(ms) < SCHNITT ? 'entdeckung' : 'bestaetigung',
                    nAlle: kandidaten.length, nKorb: korb.length, a: korb.length / kandidaten.length,
                    mKorb: mK, mAlle: mA, ueberschuss: mK - mA, kandidaten: kandidaten, korb: korb });
  }
  return perioden;
}

/* ---------- W1: Kunstinjektion (+2 Pp je Umlauf auf die GEWAEHLTEN; prueft Arithmetik) ---------- */
function w1(perioden) {
  var deltas = [], soll = [];
  perioden.forEach(function (p) {
    var dK = 0; p.korb.forEach(function (k) { dK += ((1 + k.folge) * 1.02 - 1) - k.folge; }); dK /= p.korb.length;
    var mKorbInj = p.mKorb + dK;
    var mAlleInj = p.mAlle + p.a * dK;              /* Topf enthaelt die Gewaehlten -> Verwaesserung a_P */
    deltas.push((mKorbInj - mAlleInj) - p.ueberschuss);
    soll.push(dK * (1 - p.a));
  });
  var dSt = statistik(deltas), sollWert = soll.reduce(function (x, y) { return x + y; }, 0) / soll.length;
  var verh = dSt.mittel / sollWert;
  var bestanden = verh >= 0.7 && verh <= 1.3 && dSt.mittel > 0;
  console.log('[W1 Kunstinjektion] Sollwert ' + pp(sollWert) + ' Pp  gemessen ' + pp(dSt.mittel) +
    '  Verhaeltnis ' + verh.toFixed(4) + '  -> ' + (bestanden ? 'BESTANDEN' : 'VERFEHLT'));
  console.log('  (W1 prueft die Ueberschuss-Arithmetik, NICHT die Auswahl - Nachtrag 9b.)');
  return { sollwert: sollWert, gemessen: dSt.mittel, verhaeltnis: verh, bestanden: bestanden };
}

/* ---------- W2: kursblinder Placebo (Zufallskorb gleicher Groesse, Erwartung 0) ---------- */
function w2(perioden) {
  var rnd = mulberry32(SEED);
  var werte = perioden.map(function (p) {
    var pool = p.kandidaten.slice();
    var korb = [];
    for (var k = 0; k < p.nKorb; k++) korb.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    var mK = 0; korb.forEach(function (x) { mK += x.folge; }); mK /= korb.length;
    return mK - p.mAlle;
  });
  var st = statistik(werte);
  var grenze = (1.959964 + 0.8416212) * st.se;
  var bestanden = Math.abs(st.mittel) < grenze;
  console.log('[W2 Placebo, kursblind] Mittel ' + pp(st.mittel) + ' Pp  se ' + pp(st.se) +
    '  Grenze ' + pp(grenze) + '  t ' + (st.t == null ? '-' : st.t.toFixed(2)) + '  -> ' + (bestanden ? 'BESTANDEN' : 'VERFEHLT'));
  return { mittel: st.mittel, se: st.se, t: st.t, grenze: grenze, bestanden: bestanden };
}

/* ---------- Der eine echte Lauf ---------- */
function referenz(D, waechter) {
  console.log('\n================ REFERENZLAUF — ' + STEMPEL + ' ================');
  var haupt = laufe(D, 0);
  function block(name, ps) {
    var st = statistik(ps.map(function (p) { return p.ueberschuss; }));
    if (!st) { console.log(name + ': zu wenige Perioden'); return null; }
    var d80 = (1.959964 + 0.8416212) * st.se;
    var rest = ps.map(function (p) { return p.ueberschuss / (1 - p.a); });
    var restM = rest.reduce(function (x, y) { return x + y; }, 0) / rest.length;
    console.log(name + '  [' + STEMPEL + ']');
    console.log('  Perioden ' + st.n + '   Ueberschuss ' + pp(st.mittel) + ' Pp   sd ' + pp(st.sd) +
      '   se ' + pp(st.se) + '   t ' + st.t.toFixed(2) + '   delta80 ' + pp(d80) + ' Pp');
    console.log('  nachrichtlich, gegen den Rest gerechnet (1/(1-a)): ' + pp(restM) + ' Pp  (kein zweiter Test)');
    return { n: st.n, mittel: st.mittel, sd: st.sd, se: st.se, t: st.t, delta80: d80, restMittel: restM };
  }
  var gesamt = block('GESAMT (Phase 0, volle Historie)', haupt);
  var entd = block('ENTDECKUNGSHAELFTE (< ' + SCHNITT + ')', haupt.filter(function (p) { return p.hf === 'entdeckung'; }));
  var best = block('BESTAETIGUNGSHAELFTE', haupt.filter(function (p) { return p.hf === 'bestaetigung'; }));

  /* Kettenabdruck (§2 + Nachtrag 9c): Bestaetigungshaelfte gegen se_NW und g */
  var kette = null;
  if (best) {
    var gHier = SE_NW_PROTOKOLL / best.se;
    var abw = Math.abs(gHier / G_EICHUNG - 1);
    kette = { seNwProtokoll: SE_NW_PROTOKOLL, seHier: best.se, gHier: gHier, gEichung: G_EICHUNG, abweichung: abw, ok: abw <= 0.05 };
    console.log('KETTENABDRUCK: g = se_NW(Protokoll)/se(hier, Bestaetigung) = ' + gHier.toFixed(3) +
      ' gegen Eichung ' + G_EICHUNG + '  Abweichung ' + (abw * 100).toFixed(1) + ' %  -> ' + (kette.ok ? 'passt (<=5 %)' : 'PASST NICHT - melden, nicht deuten'));
  }

  /* Streubild ueber alle 63 Lagen - beschreibend, keine Tests */
  var alle = [];
  for (var ph = 0; ph < HALTEN; ph++) {
    var st2 = statistik(laufe(D, ph).map(function (p) { return p.ueberschuss; }));
    if (st2) alle.push({ phase: ph, mittel: st2.mittel, t: st2.t, n: st2.n });
  }
  alle.sort(function (a, b) { return a.mittel - b.mittel; });
  var med = alle[Math.floor(alle.length / 2)];
  console.log('STREUBILD 63 LAGEN (keine Tests): Ueberschuss Min ' + pp(alle[0].mittel) + '  Median ' + pp(med.mittel) +
    '  Max ' + pp(alle[alle.length - 1].mittel) + ' Pp');

  var aus = { stempel: STEMPEL, gemessenAm: new Date().toISOString(), seed: SEED,
    anordnung: { rueckblick: RUECKBLICK, luecke: LUECKE, halten: HALTEN, anteil: ANTEIL, schnitt: SCHNITT, phase: 0, testsGesamt: 1,
      kontrolltopf: 'enthaelt die Gewaehlten (Nachtrag 9a)' },
    ueberlebensluecke: 'benannte Einschraenkung: >=12,7 % des Querschnitts fehlen, Richtung beschoenigend (26.08. gemessen); Punktschaetzer ist Obergrenze unbekannter Schaerfe',
    huerde: 'Regel F2=2c: Median Demo-Auktionskosten Aktien ueber >=20 Runden; bis dahin Anker 0,04/0,40 Pp nur BERICHTET',
    waechter: waechter, gesamt: gesamt, entdeckung: entd, bestaetigung: best, kette: kette,
    streubild: { min: alle[0], median: med, max: alle[alle.length - 1], lagen: alle.length } };
  fs.writeFileSync(HIER + '/referenz-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json', JSON.stringify(aus, null, 1));
  console.log('\nreferenz-<zeit>.json geschrieben. ' + STEMPEL + '.');
}

/* ---------------- Ablauf ---------------- */
var modus = process.argv.indexOf('--alles') >= 0 ? 'alles' : process.argv.indexOf('--referenz') >= 0 ? 'referenz' : 'waechter';
console.log('== messe-strang-a ==  Modus ' + modus + '  Archiv ' + ARCHIV + '  Seed ' + SEED);
/* Ohne Klassifizierung laesst istAktie ALLES durch - das Universum waere still
 * verdreifacht. Gemessen 27.08.: kein einziger Aufrufer prueft das; dieser hier tut es. */
if (!WP.klassifizierungDa()) { console.error('ABBRUCH: wertpapierarten.json fehlt oder unbrauchbar - Universum waere ungefiltert.'); process.exit(2); }
if (!wachhundOk()) process.exit(2);
console.log('Lade Universum ...');
var D = lade();
console.log(D.syms.length + ' Werte, ' + D.TAGE.length + ' Handelstage.');
var perioden = laufe(D, 0);
console.log('Phase 0: ' + perioden.length + ' Perioden (davon Bestaetigung ' + perioden.filter(function (p) { return p.hf === 'bestaetigung'; }).length + ').');

var W1 = w1(perioden), W2 = w2(perioden);
var waechter = { W1: W1, W2: W2, gemessenAm: new Date().toISOString() };
fs.writeFileSync(HIER + '/waechter-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json', JSON.stringify(waechter, null, 1));
if (!W1.bestanden || !W2.bestanden) { console.error('Waechter VERFEHLT - kein Referenzlauf.'); process.exit(3); }
if (modus === 'waechter') { console.log('Waechter gruen. Referenzlauf erst mit --alles/--referenz UND gefallenen Sperren (§7).'); process.exit(0); }
referenz(D, waechter);

'use strict';
/* MESSEN - alle 64 Konfigurationen, Regime-Variante, Placebo A/B, Topf, Delisting und Cent-Boden in EINEM Zug ueber
 * die Tagesdateien (VORREGISTRIERUNG §3-§7, §9, §11, §14).
 *
 *   node --max-old-space-size=4096 messen.js --aus <ordner> --tage <tageOrdner> [--tage <ordner2> ...]
 *                                             [--schluss c1|c2|c3] [--reihen A B C]
 *
 *   --aus      Ausgabeordner (relativ zu diesem Ordner): pilot-<n>/ fuer Proben, voll/ fuer den Vollauf. Nie derselbe
 *              Ordner fuer beides - ein Probelauf darf nie wie ein Befund aussehen. Enthaelt ein Tagesordner die Marke
 *              pilot=true oder werden --reihen gesetzt, traegt der Lauf pilot=true.
 *   --tage     Ordner mit tage/<REIHE>.json aus tagesbalken.js (mehrere bei --teil-Laeufen). SPY.json muss darunter sein.
 *   --schluss  Schluss-Kandidat (Standard: konfig.SCHLUSS_WAHL bzw. MD_TK_SCHLUSS).
 *
 * WAS AUF DIE PLATTE KOMMT: Summen je Zelle (konfig.js: Art x Konfiguration x Richtung x Ausstieg x Einstiegstag x
 * Klasse x lebend) - n, Summe dir*(rLong-Topf), Summe r, Summe dir*(rLong-rSPY), Delisting-n, Delisting-Summe,
 * Summe Dauer - als _zellen.bin, dazu Topf (Tag x Dauer x Klasse x lebend: n, Summe), Kurs-Zellen (Cent-Boden) und
 * _fortschritt.json mit Zaehlern. Zwei Durchgaenge im Speicher: erst der Topf und die zulaessigen Reihen je Tag, dann
 * die Signale (der Ueberschuss braucht den fertigen Topf, die Placebos die Listen).
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var C = require('./kanaele.js');
var Liquide = require(path.join(K.REPO, 'liquide.js'));

function argumente(argv) {
  var a = { aus: null, tage: [], schluss: K.SCHLUSS_WAHL, reihen: null };
  for (var i = 0; i < argv.length; i++) {
    var x = argv[i];
    if (x === '--aus') a.aus = argv[++i];
    else if (x === '--tage') a.tage.push(argv[++i]);
    else if (x === '--schluss') a.schluss = argv[++i];
    else if (x === '--reihen') { a.reihen = []; while (i + 1 < argv.length && argv[i + 1].slice(0, 2) !== '--') a.reihen.push(argv[++i]); }
  }
  return a;
}

/* ---------- Zufall (deterministisch je Konfiguration, Tag, Richtung) ---------- */
function fnv(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---------- Zellenspeicher ---------- */
function Speicher(nTage) {
  var z = K.zellenZahl(nTage), tz = K.topfZahl(nTage), kz = K.kursZahl(nTage);
  this.nTage = nTage;
  this.f = {}; var self = this;
  K.FELDER.forEach(function (name) { self.f[name] = new Float64Array(z); });
  this.tn = new Float64Array(tz); this.ts = new Float64Array(tz);
  this.kn = new Float64Array(kz); this.ks = new Float64Array(kz); this.kcb = new Float64Array(kz);
}
Speicher.prototype.felder = function () { var self = this; return K.FELDER.map(function (n) { return self.f[n]; }).concat([this.tn, this.ts, this.kn, this.ks, this.kcb]); };
Speicher.prototype.add = function (idx, dir, r, u, s, delist, dauer) {
  var f = this.f; f.n[idx]++; f.su[idx] += u; f.sr[idx] += dir * r; f.ss[idx] += s; f.sd[idx] += dauer;
  if (delist) { f.dn[idx]++; f.ds[idx] += dir * r; }
};
Speicher.prototype.schreibe = function (pfad, stand) {
  var teile = this.felder().map(function (a) { return Buffer.from(a.buffer, a.byteOffset, a.byteLength); });
  teile.push(Buffer.from(new Float64Array([stand || 0]).buffer));
  var tmp = pfad + '.tmp';
  fs.writeFileSync(tmp, Buffer.concat(teile));
  fs.renameSync(tmp, pfad);
};
Speicher.lade = function (pfad, nTage, stand) {
  var sp = new Speicher(nTage), buf = fs.readFileSync(pfad), off = 0;
  sp.felder().forEach(function (a) {
    if (off + a.byteLength > buf.length) throw new Error('_zellen.bin zu kurz - passt nicht zur Konfiguration');
    a.set(new Float64Array(buf.buffer.slice(buf.byteOffset + off, buf.byteOffset + off + a.byteLength))); off += a.byteLength;
  });
  if (buf.length - off !== 8) throw new Error('_zellen.bin ohne Stand-Schwanz - passt nicht zur Konfiguration');
  var gelesen = new Float64Array(buf.buffer.slice(buf.byteOffset + off, buf.byteOffset + off + 8))[0];
  if (stand != null && gelesen !== stand) throw new Error('_zellen.bin (Stand ' + gelesen + ') passt nicht zu _fortschritt.json (Stand ' + stand + ')');
  sp.stand = gelesen;
  return sp;
};

/* ---------- Tagesdateien laden ---------- */
/** Liest alle tage/<REIHE>.json der Ordner: { reihen: [S...], spy: S, pilot, quellen }. S traegt zusaetzlich reihe, lebend, klasse (Int8), flags, roh. */
function ladeTage(ordner, schluss, nTage, nurReihen) {
  var reihen = [], spy = null, pilot = false, dateien = 0, fremd = 0;
  ordner.forEach(function (o) {
    var fp = path.join(o, '_fortschritt.json');
    if (fs.existsSync(fp)) { var F = JSON.parse(fs.readFileSync(fp, 'utf8')); if (F.pilot) pilot = true; if (F.kennung !== K.KONFIG_KENNUNG) throw new Error('Tagesordner ' + o + ' traegt Kennung ' + F.kennung + ', erwartet ' + K.KONFIG_KENNUNG); }
    fs.readdirSync(o).forEach(function (name) {
      if (!/\.json$/.test(name) || name[0] === '_') return;
      var D = JSON.parse(fs.readFileSync(path.join(o, name), 'utf8'));
      if (D.kennung !== K.KONFIG_KENNUNG) { fremd++; return; }
      dateien++;
      if (nurReihen && D.reihe !== 'SPY' && nurReihen.indexOf(D.reihe) === -1) return;
      var S = reiheAusDatei(D, schluss, nTage);
      if (D.reihe === 'SPY') spy = S; else reihen.push(S);
    });
  });
  reihen.sort(function (a, b) { return a.reihe < b.reihe ? -1 : a.reihe > b.reihe ? 1 : 0; });
  return { reihen: reihen, spy: spy, pilot: pilot || !!nurReihen, dateien: dateien, fremd: fremd };
}
/** S aus einer Tagesdatei: Schluss = gewaehlter Kandidat, Klasse je Tag aus 20 Vortagen (Liquide.medianUmsatz), Flags, Rohfaktor. */
function reiheAusDatei(D, schluss, nTage) {
  if (!D[schluss]) throw new Error(D.reihe + ': Schluss-Kandidat ' + schluss + ' fehlt in der Tagesdatei');
  var S = C.reiheAus({ tag: D.tag, o: D.o, h: D.h, l: D.l, c: D[schluss], v: D.v }, nTage);
  S.reihe = D.reihe; S.lebend = D.lebend ? 1 : 0; S.gruppe = D.gruppe; S.art = D.art; S.ende = D.ende || null;
  S.flags = Uint8Array.from(D.flags); S.roh = Float64Array.from(D.roh); S.nReg = Int32Array.from(D.nReg);
  S.ausgelassen = D.ausgelassen || []; S.quelleJeJahr = D.quelleJeJahr || {};
  /* Umsatzklasse je Tag (§2): Median von C x V ueber die Balkentage d-20..d-1 - genau Liquide.medianUmsatz(ums, i-1, 20). */
  var ums = new Array(S.n);
  for (var i = 0; i < S.n; i++) ums[i] = [S.tag[i], S.c[i], S.v[i]];
  S.klasse = new Int8Array(S.n).fill(-1);
  for (var q = K.UMSATZ_FENSTER; q < S.n; q++) S.klasse[q] = K.klasseIndex(Liquide.medianUmsatz(ums, q - 1, K.UMSATZ_FENSTER));
  return S;
}

/* ---------- SPY: Regime und Marktertrag ---------- */
/** regime[tag] = 1 (SPY-Schluss > EMA200), 0 (<=), -1 (unbekannt: Vorlauf oder kein SPY-Tag). */
function regimeAus(spy, nTage) {
  var reg = new Int8Array(nTage).fill(-1), N = K.EMA_N, alpha = 2 / (N + 1), ema = NaN, summe = 0;
  for (var i = 0; i < spy.n; i++) {
    var c = spy.c[i];
    if (i < N) { summe += c; if (i === N - 1) ema = summe / N; continue; }
    if (i === N) reg[spy.tag[i]] = c > ema ? 1 : 0;           // erster Tag mit Regime: gegen den Startwert
    ema = ema + alpha * (c - ema);
    if (i > N) reg[spy.tag[i]] = c > ema ? 1 : 0;
  }
  /* Die EMA am Tag i entsteht aus Schluessen bis i; das Regime des Tages i vergleicht C_i mit der EMA bis i-1?
   * Registriert (§9): "SPY-Schluss am Signaltag i ueber der EMA200 der SPY-Tagesschluesse" - EMA einschliesslich i,
   * wie die App sie zeichnet. Oben ist es so: reg gesetzt NACH dem Update mit c. Der Sonderfall i === N nimmt den
   * Startwert (Mittel der ersten 200) als EMA "bis i-1" und ist als Naeherung der ersten Zelle unerheblich. */
  return reg;
}
/** SPY-Ertrag Long O[tagE] -> O am ersten SPY-Tag >= tagAus (bzw. C am letzten Tag, wenn dahinter); NaN ohne Kurs. */
function spyErtrag(spy, tagE, tagAus, delistTag) {
  var pe = spy.nextPos[tagE]; if (pe < 0 || spy.tag[pe] !== tagE) { pe = spy.nextPos[tagE]; if (pe < 0) return NaN; }
  var ein = spy.o[pe]; if (!(ein > 0)) return NaN;
  if (delistTag != null) { var pd = spy.nextPos[delistTag]; if (pd < 0) return NaN; return (spy.c[pd] - ein) / ein * 100; }
  var pa = spy.nextPos[tagAus]; if (pa < 0) return NaN;
  return (spy.o[pa] - ein) / ein * 100;
}

/* ---------- Der Lauf ---------- */
function protokoll(ordner, zeile) {
  var s = new Date().toISOString() + '  ' + zeile;
  console.log(s);
  try { fs.appendFileSync(path.join(ordner, '_lauf.log'), s + '\n'); } catch (e) { /* Log ist Komfort */ }
}
function leererZaehler() {
  return { reihenTageZulaessig: 0, reihenTageOhneKlasse: 0, reihenTageMassnahmen: 0, tageGewertetKlasse: [0, 0, 0, 0], c16fehltKlasse: [0, 0, 0, 0], oSpaetKlasse: [0, 0, 0, 0], k1Aufrufe: 0, k1Linien: 0, k1Ausgebaut: 0, k2Ausgebaut: 0,
    e1Kandidaten: 0, e1OhneBestaetigungstag: 0, e1Abgelehnt: 0, e2Kandidaten: 0, cooldown: 0, ohneKlasse: 0, ohneEinstieg: 0, einstiegMassnahmen: 0,
    signale: 0, regimeUeber: 0, regimeUnbekannt: 0, ohneHorizont: [0, 0, 0, 0], zensiert: [0, 0, 0, 0], delist: [0, 0, 0, 0], gebrochen: 0, gekappt: 0,
    placeboAGezogen: 0, placeboAOhnePartner: 0, placeboBGezogen: 0, placeboBOhnePartner: 0, spyFehlt: 0, topfFehlt: 0 };
}

/** Durchgang 1: Topf je (Tag, Dauer, Klasse, lebend) und zulaessige Reihen je Tag (gesamt und je Klasse). */
function topfUndListen(reihen, sp, nTage, Z) {
  var zul = new Array(nTage), zulK = new Array(nTage);
  for (var t = 0; t < nTage; t++) { zul[t] = []; zulK[t] = [[], [], [], []]; }
  reihen.forEach(function (S, ri) {
    for (var p = 0; p < S.n; p++) {
      var k = S.klasse[p];
      if (k < 0) { Z.reihenTageOhneKlasse++; continue; }
      if (S.flags[p] & K.FLAG.massnahmen) { Z.reihenTageMassnahmen++; continue; }
      Z.reihenTageZulaessig++; Z.tageGewertetKlasse[k]++;
      /* Nachtrag 2 Punkt 2: an wie vielen zulaessigen Wert-Tagen je Klasse fehlt die 16:00-Kerze (Schluss = 15:59-Rueckfall) bzw. die 09:30-Kerze */
      if (S.flags[p] & K.FLAG.c16fehlt) Z.c16fehltKlasse[k]++;
      if (S.flags[p] & K.FLAG.oSpaet) Z.oSpaetKlasse[k]++;
      var tag = S.tag[p];
      zul[tag].push(ri); zulK[tag][k].push(ri);
      for (var d = 1; d <= K.POT_MAX_DAUER; d++) {
        var e = C.ertragLong(S, p, C.festAusstieg(S, p, d), S.lebend);
        if (!e) break;                                              // zensiert: alle laengeren Dauern ebenso
        var idx = K.topfZelle(nTage, tag, d, k, S.lebend);
        sp.tn[idx]++; sp.ts[idx] += e.r;
        if (e.delist) { for (var d2 = d + 1; d2 <= K.POT_MAX_DAUER; d2++) { var idx2 = K.topfZelle(nTage, tag, d2, k, S.lebend); sp.tn[idx2]++; sp.ts[idx2] += e.r; } break; }
      }
    }
  });
  return { zul: zul, zulK: zulK };
}

/** Durchgang 2: Signale einer Reihe (alle Linien, Einstiege, Richtungen, Ausstiege), Placebos, Kurs-Zellen. */
function messeReihe(S, ri, ctx) {
  var nTage = ctx.nTage, sp = ctx.sp, Z = ctx.Z, reihen = ctx.reihen, spy = ctx.spy, regime = ctx.regime;
  var D3 = { 20: C.k3Reihe(S, 20), 55: C.k3Reihe(S, 55) };
  var letzt = {};                                                    // Cooldown je (Linie, Einstieg, Richtung): letzter Signaltag
  var stat = { signale: new Array(K.N_KONF * 2).fill(0), tage: S.n, zul: 0 };
  for (var i = 0; i < S.n; i++) {
    var k = S.klasse[i];
    if (k < 0 || (S.flags[i] & K.FLAG.massnahmen)) continue;      // kein Signaltag ohne Klasse oder im Massnahmenfenster
    if (i + 1 >= S.n) continue;                                    // kein Einstieg mehr moeglich
    stat.zul++;
    var ci = S.c[i], tagI = S.tag[i], reg = regime[tagI];
    for (var li = 0; li < K.N_L; li++) {
      var LIN = K.LINIEN[li], D = LIN.art === 'K3' ? D3[LIN.N] : null;
      var lin;
      if (LIN.art === 'K1') { Z.k1Aufrufe++; lin = C.k1Am(S, i); if (lin) { Z.k1Linien++; if (lin.ausgebaut) Z.k1Ausgebaut++; } }
      else { lin = C.linieAm(S, i, LIN, D); if (lin && LIN.art === 'K2' && lin.ausgebaut) Z.k2Ausgebaut++; }
      if (!lin || !lin.ausgebaut) continue;
      for (var ei = 0; ei < K.N_E; ei++) {
        var E = K.EINSTIEGE[ei], dir = ei === 0 ? C.e1Signal(lin, ci) : C.e2Signal(lin, ci);
        if (!dir) continue;
        if (ei === 0) Z.e1Kandidaten++; else Z.e2Kandidaten++;
        var dirIdx = dir > 0 ? 0 : 1, schl = li + '|' + ei + '|' + dirIdx;
        if (letzt[schl] != null && tagI - letzt[schl] < K.COOLDOWN_TAGE) { Z.cooldown++; continue; }
        if (ei === 0) {
          if (i + 1 >= S.n) { Z.e1OhneBestaetigungstag++; continue; }
          if (!C.e1Bestaetigt(lin, i, S.c[i + 1], dir, D)) { Z.e1Abgelehnt++; continue; }
        }
        var ePos = i + E.versatz;
        if (ePos >= S.n) { Z.ohneEinstieg++; continue; }
        if (S.flags[ePos] & K.FLAG.massnahmen) { Z.einstiegMassnahmen++; continue; }
        letzt[schl] = tagI;
        var konf = K.konfIndex(li, ei), tagE = S.tag[ePos];
        Z.signale++; stat.signale[konf * 2 + dirIdx]++;
        if (reg === 1) Z.regimeUeber++; else if (reg < 0) Z.regimeUnbekannt++;
        /* Cent-Boden (§11d): Einstiegskurs auf den damals gehandelten Preis zurueckgerechnet */
        var kurs = S.o[ePos] * S.roh[ePos], ki = K.kursZelle(nTage, konf, dirIdx, tagE, k, S.lebend);
        sp.kn[ki]++; sp.ks[ki] += kurs; if (K.ueberCentBoden(kurs, k)) sp.kcb[ki]++;
        var rng = mulberry32(fnv(konf + '|' + tagE + '|' + dirIdx));
        var dauern = [];
        for (var a = 0; a < K.N_A; a++) {
          var A = K.AUSSTIEGE[a], ausPos, gebrochen = false;
          if (A.h != null) ausPos = C.festAusstieg(S, ePos, A.h);
          else { var b = C.bruchAusstieg(S, i, ePos, dir, lin, D, A.max); ausPos = b.pos; gebrochen = b.gebrochen; if (ausPos >= 0) { if (gebrochen) Z.gebrochen++; else Z.gekappt++; } }
          var e = C.ertragLong(S, ePos, ausPos, S.lebend);
          if (!e) { Z.ohneHorizont[a]++; if (S.lebend) Z.zensiert[a]++; dauern.push(-1); continue; }
          if (e.delist) Z.delist[a]++;
          var dauer = Math.min(K.POT_MAX_DAUER, Math.max(1, e.dauer)); dauern.push(e.dauer);
          var ti = K.topfZelle(nTage, tagE, dauer, k, S.lebend), topf = sp.tn[ti] > 0 ? sp.ts[ti] / sp.tn[ti] : NaN;
          if (topf !== topf) { Z.topfFehlt++; continue; }
          var rs = spyErtrag(spy, tagE, tagE + e.dauer, e.delist ? S.tag[e.ausPos] : null);
          if (rs !== rs) Z.spyFehlt++;
          var u = dir * (e.r - topf), s = rs === rs ? dir * (e.r - rs) : 0;
          sp.add(K.zelle(nTage, 0, konf, dirIdx, a, tagE, k, S.lebend), dir, e.r, u, s, e.delist, e.dauer);
          if (reg === 1) sp.add(K.zelle(nTage, 1, konf, dirIdx, a, tagE, k, S.lebend), dir, e.r, u, s, e.delist, e.dauer);
        }
        /* Placebo A (§11a): zufaellige andere zulaessige Reihe desselben Einstiegstags, beliebige Klasse, zufaellige Richtung */
        var liste = ctx.zul[tagE], kandA = liste.length > 1 ? liste : null;
        if (!kandA) Z.placeboAOhnePartner++;
        else {
          var rA = ri; while (rA === ri) rA = liste[Math.floor(rng() * liste.length)];
          var dirA = rng() < 0.5 ? 1 : -1;
          Z.placeboAGezogen++;
          placebo(ctx, 2, konf, dirA, tagE, reihen[rA], dauern);
        }
        /* Placebo B (§11b): gleicher Tag, gleiche Klasse, anderer Wert, gleiche Richtung */
        var listeK = ctx.zulK[tagE][k], kandB = listeK.length > 1 ? listeK : null;
        if (!kandB) Z.placeboBOhnePartner++;
        else {
          var rB = ri; while (rB === ri) rB = listeK[Math.floor(rng() * listeK.length)];
          Z.placeboBGezogen++;
          placebo(ctx, 3, konf, dir, tagE, reihen[rB], dauern);
        }
      }
    }
  }
  return stat;
}
/** Ein Placebo-Trade auf Reihe P am Tag tagE mit den Ausstiegen des echten Trades (feste H; Kanalbruch: dessen Dauer). */
function placebo(ctx, art, konf, dir, tagE, P, dauern) {
  var nTage = ctx.nTage, sp = ctx.sp, pP = P.nextPos[tagE];
  if (pP < 0 || P.tag[pP] !== tagE) return;
  var k = P.klasse[pP], dirIdx = dir > 0 ? 0 : 1;
  for (var a = 0; a < K.N_A; a++) {
    var A = K.AUSSTIEGE[a], h = A.h != null ? A.h : dauern[a];
    if (!(h > 0)) continue;
    var e = C.ertragLong(P, pP, C.festAusstieg(P, pP, h), P.lebend);
    if (!e) continue;
    var dauer = Math.min(K.POT_MAX_DAUER, Math.max(1, e.dauer));
    var ti = K.topfZelle(nTage, tagE, dauer, k, P.lebend), topf = sp.tn[ti] > 0 ? sp.ts[ti] / sp.tn[ti] : NaN;
    if (topf !== topf) continue;
    var rs = spyErtrag(ctx.spy, tagE, tagE + e.dauer, e.delist ? P.tag[e.ausPos] : null);
    sp.add(K.zelle(nTage, art, konf, dirIdx, a, tagE, k, P.lebend), dir, e.r, dir * (e.r - topf), rs === rs ? dir * (e.r - rs) : 0, e.delist, e.dauer);
  }
}

function lauf(a) {
  if (!a.aus) { console.error('Pflichtargument --aus <ordner> fehlt.'); process.exit(2); }
  if (!a.tage.length) { console.error('Pflichtargument --tage <ordner> fehlt.'); process.exit(2); }
  if (K.SCHLUSS_KANDIDATEN.indexOf(a.schluss) === -1) { console.error('Unbekannter Schluss-Kandidat ' + a.schluss); process.exit(2); }
  var ordner = path.resolve(K.HIER, a.aus);
  fs.mkdirSync(ordner, { recursive: true });
  var kal = K.kalender(), nTage = kal.tage.length, t0 = Date.now();
  var T = ladeTage(a.tage.map(function (o) { return path.resolve(K.HIER, o); }), a.schluss, nTage, a.reihen);
  if (!T.spy) { console.error('SPY.json fehlt in den Tagesordnern - keine Marktreihe, Abbruch.'); process.exit(3); }
  var tLaden = Date.now() - t0;
  protokoll(ordner, 'START ' + K.KONFIG_KENNUNG + ' | ' + T.reihen.length + ' Reihen aus ' + T.dateien + ' Tagesdateien (' + T.fremd + ' fremde Kennung) | Schluss ' + a.schluss + ' | Tage ' + nTage + ' | Bestaetigung ab ' + kal.bestaetigungAb + (T.pilot ? ' | PILOT' : '') + ' | geladen in ' + tLaden + ' ms');
  var sp = new Speicher(nTage), Z = leererZaehler();
  var t1 = Date.now(), listen = topfUndListen(T.reihen, sp, nTage, Z), tTopf = Date.now() - t1;
  protokoll(ordner, 'TOPF ' + Z.reihenTageZulaessig + ' zulaessige Reihen-Tage (ohne Klasse ' + Z.reihenTageOhneKlasse + ', Massnahmen ' + Z.reihenTageMassnahmen + ') in ' + tTopf + ' ms');
  var regime = regimeAus(T.spy, nTage);
  var ctx = { nTage: nTage, sp: sp, Z: Z, reihen: T.reihen, spy: T.spy, regime: regime, zul: listen.zul, zulK: listen.zulK };
  var F = { kennung: K.KONFIG_KENNUNG, begonnen: new Date(t0).toISOString(), pilot: T.pilot, reihenArg: a.reihen, tageOrdner: a.tage, schluss: a.schluss, nTage: nTage, bestaetigungAb: kal.bestaetigungAb,
    reihen: T.reihen.length, dateien: T.dateien, signale: {}, ms: { laden: tLaden, topf: tTopf, messen: 0 }, zellenStand: 0, zaehler: Z, regimeTage: { ueber: 0, unter: 0, unbekannt: 0 } };
  for (var t = 0; t < nTage; t++) { if (regime[t] === 1) F.regimeTage.ueber++; else if (regime[t] === 0) F.regimeTage.unter++; else F.regimeTage.unbekannt++; }
  var t2 = Date.now();
  T.reihen.forEach(function (S, ri) {
    var tS = Date.now(), stat = messeReihe(S, ri, ctx);
    F.signale[S.reihe] = { lebend: S.lebend, gruppe: S.gruppe, art: S.art, ende: S.ende, tage: stat.tage, zul: stat.zul, sig: stat.signale, ausgelassen: S.ausgelassen.length, ms: Date.now() - tS };
    if ((ri + 1) % 200 === 0) protokoll(ordner, (ri + 1) + ' Reihen, ' + Z.signale + ' Signale, ' + Math.round((Date.now() - t2) / 1000) + ' s');
  });
  F.ms.messen = Date.now() - t2;
  F.zellenStand = 1;
  sp.schreibe(path.join(ordner, '_zellen.bin'), F.zellenStand);
  F.beendet = 'vollstaendig'; F.stand = new Date().toISOString();
  var tmp = path.join(ordner, '_fortschritt.json.tmp');
  fs.writeFileSync(tmp, JSON.stringify(F));
  fs.renameSync(tmp, path.join(ordner, '_fortschritt.json'));
  protokoll(ordner, 'ENDE ' + F.beendet + ' | ' + T.reihen.length + ' Reihen | ' + Z.signale + ' Signale (E1-Kandidaten ' + Z.e1Kandidaten + ', abgelehnt ' + Z.e1Abgelehnt + '; E2-Kandidaten ' + Z.e2Kandidaten + '; Cooldown ' + Z.cooldown + ') | K1 ' + Z.k1Linien + '/' + Z.k1Aufrufe + ' Linien, ' + Z.k1Ausgebaut + ' ausgebaut | laden ' + tLaden + ' ms, Topf ' + tTopf + ' ms, messen ' + F.ms.messen + ' ms');
  return F;
}

module.exports = { lauf: lauf, argumente: argumente, Speicher: Speicher, ladeTage: ladeTage, reiheAusDatei: reiheAusDatei, regimeAus: regimeAus, spyErtrag: spyErtrag,
  topfUndListen: topfUndListen, messeReihe: messeReihe, placebo: placebo, leererZaehler: leererZaehler, fnv: fnv, mulberry32: mulberry32 };
if (require.main === module) lauf(argumente(process.argv.slice(2)));

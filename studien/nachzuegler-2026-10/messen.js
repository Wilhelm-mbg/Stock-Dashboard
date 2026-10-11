'use strict';
/* MESSEN - Ereignisse (Regel "Ausloeser", Z7, Z8), Placebos (Z17), und je Einstiegstag die Beobachtungen aller 384 Konfigurationen
 * (Regel "Hypothesen", Z10-Z13, Z15) als Tageszellen. Kein Urteil hier - das rechnet auswerten.js.
 * Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var path = require('path');
var KN = require('./konfig.js');
var MK = require('./merkmale.js');
var VK = require('./verknuepfung.js');
var ST = require(path.join(KN.PRUEFSTAND, 'statistik.js'));

var H = KN.HALTEDAUERN, NH = H.length;
var GRUPPEN = ['uebernahme', 'insolvenz', 'sonstige'];
function gruppeVon(grund) { return GRUPPEN.indexOf(KN.ABGANG_GRUPPEN[grund] || 'sonstige'); }
function rng(schluessel) { return ST.mulberry32(ST.fnv(schluessel)); }

/** Zeitraum als Kalenderindizes: eMin (erster Einstiegstag), exitMax (letzter Ausstiegstag). */
function zeitraum(T, key) {
  var tage = T.kal.tage;
  if (key === 'entdeckung') {
    var bis = -1; for (var i = 0; i < tage.length; i++) if (tage[i] <= KN.ENTDECKUNG_BIS) bis = i;
    return { key: key, eMin: 0, exitMax: Math.min(bis, T.maxTag) };
  }
  if (key === 'pruefung') {
    if (T.gesperrt) throw new Error('Pruefzeit auf gesperrter Tafel - erst Siegel 2');
    var ab = tage.findIndex(function (t) { return t >= KN.PRUEFUNG_AB; });
    return { key: key, eMin: ab, exitMax: T.maxTag };
  }
  throw new Error('unbekannter Zeitraum ' + key);
}
function imZeitraum(Z, e) { return e >= Z.eMin && e <= Z.exitMax; }

/** Echte Ereignisse ueber die GANZE Tafel (die Sperrfrist laeuft ueber Zeitraumgrenzen), danach nach Einstiegstag zugeordnet.
 *  Rueckgabe: je Ausloeser x Richtung (Index a*2+r) { D: [], S: [] } und Zaehler. */
function ereignisse(T, C) {
  var nS = T.nSym, last = new Int32Array(KN.N_A * KN.N_R * nS).fill(-1000000), ev = [], z = { roh: 0, sperrfrist: 0 };
  for (var k = 0; k < KN.N_A * KN.N_R; k++) ev.push({ D: [], S: [] });
  for (var D = 0; D < T.maxTag; D++) {
    if (C.Z.aTag[D] < 0) continue;
    var basis = D * nS;
    for (var s = 0; s < nS; s++) {
      if (!C.Z.kl[basis + s]) continue;
      var rowD = vorzeile(T, C.Z.eRow[basis + s]), b = C.bits[rowD];
      if (!(b & 63)) continue;
      for (var a = 0; a < KN.N_A; a++) for (var r = 0; r < KN.N_R; r++) {
        if (!(b & MK.bit(a, r))) continue;
        z.roh++;
        var q = (a * KN.N_R + r) * nS + s;
        if (D - last[q] < KN.SPERRFRIST) { z.sperrfrist++; continue; }
        last[q] = D; ev[a * KN.N_R + r].D.push(D); ev[a * KN.N_R + r].S.push(s);
      }
    }
  }
  return { ev: ev, zaehler: z };
}
/** Zeile des Tages D einer zulaessigen Reihe = Zeile vor der Einstiegszeile (der Universumsfilter verlangt genau diese Folge). */
function vorzeile(T, eRow) { var s = T.g.sym[eRow]; return T.symZeilen[T.symStart[s] + T.posInReihe[eRow] - 1]; }

/** Nur die Ereignisse eines Zeitraums (nach Einstiegstag). */
function imZeitraumFiltern(T, C, E, Z) {
  return E.ev.map(function (x) {
    var D = [], S = [];
    for (var i = 0; i < x.D.length; i++) if (imZeitraum(Z, C.Z.aTag[x.D[i]])) { D.push(x.D[i]); S.push(x.S[i]); }
    return { D: D, S: S };
  });
}

/** Placebo (a): je echtem Ereignis ein Tag D' aus den echten Ereignistagen desselben Ausloesers, derselben Richtung, desselben
 *  Zeitraums; A bleibt und muss an D' zulaessig sein (Z17). */
function placeboA(T, C, ev, Z) {
  var nS = T.nSym, z = { gezogen: 0, verworfen: 0 };
  var aus = ev.map(function (x, k) {
    var R = rng('plA|' + k + '|' + Z.key), D = [], S = [];
    for (var i = 0; i < x.D.length; i++) {
      var ok = false;
      for (var t = 0; t < KN.PLACEBO_ZUEGE && !ok; t++) {
        var d = x.D[Math.floor(R() * x.D.length)];
        if (C.Z.kl[d * nS + x.S[i]]) { D.push(d); S.push(x.S[i]); ok = true; }
      }
      if (ok) z.gezogen++; else z.verworfen++;
    }
    return { D: D, S: S };
  });
  return { ev: aus, zaehler: z };
}
/** Placebo (c): jedes echte Ereignis 20 Handelstage spaeter; A muss dort zulaessig sein, der Einstieg im Zeitraum liegen (Z17). */
function placeboC(T, C, ev, Z) {
  var nS = T.nSym, z = { verschoben: 0, verworfen: 0 };
  var aus = ev.map(function (x) {
    var D = [], S = [];
    for (var i = 0; i < x.D.length; i++) {
      var d = x.D[i] + KN.VERSATZ_C;
      if (d < T.maxTag && C.Z.aTag[d] >= 0 && imZeitraum(Z, C.Z.aTag[d]) && C.Z.kl[d * nS + x.S[i]]) { D.push(d); S.push(x.S[i]); z.verschoben++; } else z.verworfen++;
    }
    return { D: D, S: S };
  });
  return { ev: aus, zaehler: z };
}

/* ---------- Tageszellen ---------- */
var FELDER = ['n', 'sb', 'sk', 'skk', 'sl', 'an', 'asb', 'bn', 'bsb', 'cn', 'csb', 'ln', 'lsb', 'lsk', 'lsl'];
function Zellen(nTage) {
  var z = { nTage: nTage };
  FELDER.forEach(function (f) { z[f] = new Float64Array(KN.KONFIGURATIONEN * nTage); });
  z.ex1n = new Float64Array(KN.KONFIGURATIONEN); z.ex1s = new Float64Array(KN.KONFIGURATIONEN);
  z.ex2n = new Float64Array(KN.KONFIGURATIONEN); z.ex2s = new Float64Array(KN.KONFIGURATIONEN);
  z.abn = new Float64Array(KN.KONFIGURATIONEN * 3); z.abs = new Float64Array(KN.KONFIGURATIONEN * 3); z.abs100 = new Float64Array(KN.KONFIGURATIONEN);
  z.aAbgang = new Float64Array(KN.KONFIGURATIONEN); z.plBohne = new Float64Array(KN.KONFIGURATIONEN);
  return z;
}

/**
 * Die Messung eines Zeitraums. listen = { echt, plA, plC } je ein ev-Array (Index a*2+r). opt.kombis: Set "a/r/v" (Vorgabe: alle).
 * Rueckgabe { zellen, zaehler }.
 */
function messe(T, C, listen, Z, opt) {
  opt = opt || {};
  var nS = T.nSym, nT = T.nTage, g = T.g, Zl = Zellen(nT);
  var arten = ['echt', 'plA', 'plC'];
  var proTag = new Map();
  arten.forEach(function (art, ai) {
    (listen[art] || []).forEach(function (x, k) {
      for (var i = 0; i < x.D.length; i++) {
        var l = proTag.get(x.D[i]); if (!l) { l = [[], [], []]; proTag.set(x.D[i], l); }
        l[ai].push(k * nS + x.S[i]);
      }
    });
  });
  var tage = Array.from(proTag.keys()).sort(function (a, b) { return a - b; });
  var zz = { tage: 0, ereignisse: [0, 0, 0], mitPartner: {}, partner: {}, topf: [0, 0, 0, 0], topfTage: 0, beobachtungen: [0, 0, 0], v2Stichtage: 0 };

  /* Tagesdaten */
  var rM = new Float64Array(NH * nS), ab = new Uint8Array(NH * nS), rAb = new Float64Array(NH * nS), rL = new Float64Array(NH * nS), cl = new Int8Array(nS).fill(-1);
  var S = new Float64Array(16), N = new Float64Array(16), SL = new Float64Array(16), NL = new Float64Array(16);
  var ES = new Float64Array(16), EN = new Float64Array(16), ESL = new Float64Array(16), ENL = new Float64Array(16);
  var imZ = new Uint8Array(NH);
  var v2Karte = new Map();
  /* V2-Sammler je B */
  var acc = { s1: new Float64Array(NH * nS), n1: new Float64Array(NH * nS), sT: new Float64Array(NH * nS), sRA: new Float64Array(NH * nS),
    nRA: new Float64Array(NH * nS), sKA: new Float64Array(NH * nS), sKKA: new Float64Array(NH * nS),
    sl1: new Float64Array(NH * nS), nl1: new Float64Array(NH * nS), sTL: new Float64Array(NH * nS), sRAL: new Float64Array(NH * nS), nRAL: new Float64Array(NH * nS) };
  var beruehrt = new Int32Array(nS), nBer = 0, istBer = new Uint8Array(nS), beitrag = new Array(nS);

  function zelle(art, kIdx, e, x, kosten, kassa, leihe) {
    var i = kIdx * nT + e;
    if (art === 0) { Zl.n[i]++; Zl.sb[i] += x; Zl.sk[i] += kosten; Zl.skk[i] += kassa; Zl.sl[i] += leihe; zz.beobachtungen[0]++; }
    else if (art === 1) { Zl.an[i]++; Zl.asb[i] += x; zz.beobachtungen[1]++; }
    else { Zl.cn[i]++; Zl.csb[i] += x; zz.beobachtungen[2]++; }
  }
  function zelleB(kIdx, e, x) { var i = kIdx * nT + e; Zl.bn[i]++; Zl.bsb[i] += x; }
  function zelleL(kIdx, e, x, kosten, leihe) { var i = kIdx * nT + e; Zl.ln[i]++; Zl.lsb[i] += x; Zl.lsk[i] += kosten; Zl.lsl[i] += leihe; }
  function leiheFaktor(hi) { return (H[hi] + 1) / KN.LEIHE_TAGE_JAHR; }
  /** Placebo (b): ein B' derselben Klasse mit gueltigem Ertrag bei hi, das `frei(B')` erfuellt. */
  function ziehe(R, liste, hi, frei) {
    for (var t = 0; t < KN.PLACEBO_ZUEGE; t++) {
      var b = liste[Math.floor(R() * liste.length)];
      var x = rM[hi * nS + b];
      if (x === x && frei(b)) return b;
    }
    return -1;
  }

  for (var ti = 0; ti < tage.length; ti++) {
    var D = tage[ti], e = C.Z.aTag[D], basis = D * nS;
    if (e < 0) continue;
    var hatH = false;
    for (var hi = 0; hi < NH; hi++) { imZ[hi] = (e >= Z.eMin && e + H[hi] <= Z.exitMax) ? 1 : 0; if (imZ[hi]) hatH = true; }
    if (!hatH) continue;
    zz.tage++;
    /* (1) Tagesdaten aller zulaessigen Aktien */
    S.fill(0); N.fill(0); SL.fill(0); NL.fill(0);
    var klassenListe = [[], [], [], []];
    for (var s = 0; s < nS; s++) {
      cl[s] = -1;
      var k0 = C.Z.kl[basis + s]; if (!k0) continue;
      var c = k0 - 1, re = C.Z.eRow[basis + s];
      cl[s] = c; klassenListe[c].push(s);
      var a0 = T.symStart[s], b0 = T.symStart[s + 1], q = a0 + T.posInReihe[re];
      var re1 = (q + 1 < b0 && g.tag[T.symZeilen[q + 1]] === e + 1) ? T.symZeilen[q + 1] : -1;
      for (var h2 = 0; h2 < NH; h2++) {
        var j = h2 * nS + s;
        rM[j] = NaN; ab[j] = 0; rAb[j] = NaN; rL[j] = NaN;
        if (!imZ[h2]) continue;
        var ziel = e + H[h2];
        while (q + 1 < b0 && g.tag[T.symZeilen[q + 1]] <= ziel) q++;
        var rx = T.symZeilen[q];
        if (q + 1 >= b0 && g.tag[rx] < ziel) { ab[j] = 1; rAb[j] = MK.ertrag(T, C.M, re, rx); continue; }
        var r0 = MK.ertrag(T, C.M, re, rx);
        rM[j] = r0;
        if (r0 === r0) { S[c * 4 + h2] += r0; N[c * 4 + h2]++; }
        if (H[h2] >= 1 && re1 >= 0 && g.tag[rx] >= e + 1) {
          var rl0 = MK.ertrag(T, C.M, re1, rx);
          rL[j] = rl0;
          if (rl0 === rl0) { SL[c * 4 + h2] += rl0; NL[c * 4 + h2]++; }
        }
      }
    }
    for (var c2 = 0; c2 < 4; c2++) zz.topf[c2] += N[c2 * 4];
    zz.topfTage++;

    var lst = proTag.get(D);
    for (var art = 0; art < 3; art++) {
      var codes = lst[art]; if (!codes.length) continue;
      /* nach Ausloeser x Richtung gruppieren */
      var jeAR = {};
      for (var ci = 0; ci < codes.length; ci++) { var kk = Math.floor(codes[ci] / nS); (jeAR[kk] = jeAR[kk] || []).push(codes[ci] - kk * nS); }
      Object.keys(jeAR).forEach(function (kStr) {
        var k = +kStr, a = Math.floor(k / KN.N_R), r = k % KN.N_R, dir = KN.RICHTUNGEN[r].dir, As = jeAR[kStr];
        zz.ereignisse[art] += As.length;
        for (var v = 0; v < KN.N_V; v++) {
          if (opt.kombis && !opt.kombis.has(a + '/' + r + '/' + v)) continue;
          if (v === 0) verarbeiteV1(art, a, r, dir, As);
          else verarbeiteV2(art, a, r, dir, As);
        }
      });
    }
  }
  return { zellen: Zl, zaehler: zz };

  /* ---------- V1: je SIC-Gruppe mit Ereignis ein Topf (Z11, Nachtrag N1) ---------- */
  function verarbeiteV1(art, a, r, dir, As) {
    var jeGruppe = new Map();
    for (var i = 0; i < As.length; i++) { var gid = C.V1.gruppeId[As[i]]; if (gid < 0) continue; var l = jeGruppe.get(gid); if (!l) { l = []; jeGruppe.set(gid, l); } l.push(As[i]); }
    var schl = art + '/' + a + '/' + r + '/0';
    zz.mitPartner[schl] = (zz.mitPartner[schl] || 0);
    var R = art === 0 ? rng('plB|' + a + '|' + r + '|0|' + D) : null;
    jeGruppe.forEach(function (ev, gid) {
      var mitglieder = C.V1.gruppen.get(C.V1.gruppenNamen[gid]), mem = [];
      for (var m = 0; m < mitglieder.length; m++) if (cl[mitglieder[m]] >= 0) mem.push(mitglieder[m]);
      ES.fill(0); EN.fill(0); ESL.fill(0); ENL.fill(0);
      for (var m2 = 0; m2 < mem.length; m2++) {
        var sm = mem[m2], cm = cl[sm];
        for (var h = 0; h < NH; h++) { var x = rM[h * nS + sm]; if (x === x) { ES[cm * 4 + h] += x; EN[cm * 4 + h]++; } var y = rL[h * nS + sm]; if (y === y) { ESL[cm * 4 + h] += y; ENL[cm * 4 + h]++; } }
      }
      /* H2-Summen der Ereignisse dieser Gruppe je Haltedauer (A der Klassen 2/3, gueltiger Ertrag), einmal je Gruppe */
      var G = { sRA: [0, 0, 0, 0], nRA: [0, 0, 0, 0], sKA: [0, 0, 0, 0], sKKA: [0, 0, 0, 0], sRL: [0, 0, 0, 0], nRL: [0, 0, 0, 0], sKL: [0, 0, 0, 0] };
      var evCik = new Map();
      for (var q0 = 0; q0 < ev.length; q0++) {
        var A0 = ev[q0], l0 = evCik.get(C.cik[A0]); if (!l0) { l0 = []; evCik.set(C.cik[A0], l0); } l0.push(A0);
        h2Beitrag(G, A0, 1);
        if (art === 0) for (var hA = 0; hA < NH; hA++) if (imZ[hA] && (cl[A0] === 2 || cl[A0] === 3) && ab[hA * nS + A0]) Zl.aAbgang[KN.konfIndex(a, r, 0, 1, hA, 0)]++;
      }
      var fremd = function (x) { return C.V1.gruppeId[x] !== gid; };
      var nPartner = 0;
      for (var bi = 0; bi < mem.length; bi++) {
        var B = mem[bi], cB = C.cik[B], gleich = evCik.get(cB);
        /* verknuepft mit mindestens einem Ereignis anderer CIK (Z3) */
        if (ev.length - (gleich ? gleich.length : 0) <= 0) continue;
        nPartner++;
        var Gb = G;
        if (gleich) { Gb = JSON.parse(JSON.stringify(G)); for (var gq = 0; gq < gleich.length; gq++) h2Beitrag(Gb, gleich[gq], -1); }
        var c = cl[B], eRowB = C.Z.eRow[D * nS + B], rowDB = vorzeile(T, eRowB);
        var ex1 = ((C.bits[rowDB] | C.bits[eRowB]) & MK.B_202) !== 0, ex2 = !ex1 && a < 2 && (C.bits[rowDB] & MK.bit(a, r)) !== 0;
        for (var h3 = 0; h3 < NH; h3++) {
          if (!imZ[h3]) continue;
          var j = h3 * nS + B, ci4 = c * 4 + h3;
          var topf = (N[ci4] - EN[ci4]) > 0 ? (S[ci4] - ES[ci4]) / (N[ci4] - EN[ci4]) : NaN;
          /* H2: Mittel r_A ueber die verknuepften Ereignisse mit A der Klassen 2/3 und gueltigem Ertrag */
          var sRA = Gb.sRA[h3], nRA = Gb.nRA[h3], sKA = Gb.sKA[h3], sKKA = Gb.sKKA[h3];
          var k1 = KN.konfIndex(a, r, 0, 0, h3, c), k2 = KN.konfIndex(a, r, 0, 1, h3, c);
          if (ex1 || ex2) {
            if (art === 0) { var xb = rM[j]; if (xb === xb && topf === topf) { if (ex1) { Zl.ex1n[k1]++; Zl.ex1s[k1] += dir * (xb - topf); } else { Zl.ex2n[k1]++; Zl.ex2s[k1] += dir * (xb - topf); } } }
            continue;
          }
          if (ab[j]) {
            if (art === 0 && topf === topf) abgang(k1, B, dir, rAb[j], topf);
            if (art === 0 && nRA) abgang(k2, B, dir, rAb[j], sRA / nRA);
            continue;
          }
          var xB = rM[j];
          if (!(xB === xB) || !(topf === topf)) continue;
          zelle(art, k1, e, dir * (xB - topf), KN.HUERDE[c], KN.HUERDE_KASSA[c], dir < 0 ? leiheFaktor(h3) : 0);
          if (nRA) zelle(art, k2, e, dir * (xB - sRA / nRA), KN.HUERDE[c] + sKA / nRA, KN.HUERDE_KASSA[c] + sKKA / nRA, leiheFaktor(h3));
          if (art !== 0) continue;
          /* Placebo (b): B' ausserhalb dieser SIC-Gruppe */
          var b2 = ziehe(R, klassenListe[c], h3, fremd);
          if (b2 >= 0) { zelleB(k1, e, dir * (rM[h3 * nS + b2] - topf)); if (nRA) zelleB(k2, e, dir * (rM[h3 * nS + b2] - sRA / nRA)); } else Zl.plBohne[k1]++;
          /* spaeter Einstieg (Z21 (1)) */
          var xl = rL[j];
          if (H[h3] >= 1 && xl === xl) {
            var nl = NL[ci4] - ENL[ci4], topfL = nl > 0 ? (SL[ci4] - ESL[ci4]) / nl : NaN;
            if (topfL === topfL) zelleL(k1, e, dir * (xl - topfL), KN.HUERDE[c], dir < 0 ? leiheFaktor(h3) : 0);
            if (Gb.nRL[h3]) zelleL(k2, e, dir * (xl - Gb.sRL[h3] / Gb.nRL[h3]), KN.HUERDE[c] + Gb.sKL[h3] / Gb.nRL[h3], leiheFaktor(h3));
          }
        }
      }
      zz.mitPartner[schl] += nPartner > 0 ? ev.length : 0;
      zz.partner[schl] = (zz.partner[schl] || 0) + nPartner * ev.length;
    });
  }

  /** Beitrag eines Ereignisses (A) zu den H2-Summen einer Gruppe, vz = +1 hinzu, -1 weg (gleiche CIK wie B). */
  function h2Beitrag(G0, A, vz) {
    var cA = cl[A]; if (cA !== 2 && cA !== 3) return;
    for (var h = 0; h < NH; h++) {
      var xa = rM[h * nS + A]; if (xa === xa) { G0.sRA[h] += vz * xa; G0.nRA[h] += vz; G0.sKA[h] += vz * KN.HUERDE[cA]; G0.sKKA[h] += vz * KN.HUERDE_KASSA[cA]; }
      var xl = rL[h * nS + A]; if (xl === xl) { G0.sRL[h] += vz * xl; G0.nRL[h] += vz; G0.sKL[h] += vz * KN.HUERDE[cA]; }
    }
  }

  function abgang(k, B, dir, rab, ref) {
    var gr = gruppeVon(T.endeGrund[B]);
    if (rab === rab) { Zl.abn[k * 3 + gr]++; Zl.abs[k * 3 + gr] += dir * (rab - ref); }
    if (gr === 1) Zl.abs100[k] += dir * (-100 - ref);
  }

  /* ---------- V2: je Ereignis ein Topf, B einmal je Tag (Z11, Z12) ---------- */
  function verarbeiteV2(art, a, r, dir, As) {
    var c0 = VK.stichtag(T.kal.tage, D);
    var karte = v2Karte.get(c0);
    if (!karte) { karte = C.v2(c0); v2Karte.clear(); v2Karte.set(c0, karte); zz.v2Stichtage++; }
    var top = karte.top, TOP = KN.V2_TOP, schl = art + '/' + a + '/' + r + '/1';
    zz.mitPartner[schl] = (zz.mitPartner[schl] || 0); zz.partner[schl] = (zz.partner[schl] || 0);
    nBer = 0;
    for (var i = 0; i < As.length; i++) {
      var A = As[i], cA = cl[A], links = [];
      for (var t = 0; t < TOP; t++) { var b = top[A * TOP + t]; if (b >= 0 && cl[b] >= 0) links.push(b); }
      if (!links.length) continue;
      zz.mitPartner[schl]++; zz.partner[schl] += links.length;
      if (art === 0 && (cA === 2 || cA === 3)) for (var hA = 0; hA < NH; hA++) if (imZ[hA] && ab[hA * nS + A]) Zl.aAbgang[KN.konfIndex(a, r, 1, 1, hA, 0)]++;
      /* Topf ohne A, seine Gattungen und alle Partner */
      ES.fill(0); EN.fill(0); ESL.fill(0); ENL.fill(0);
      var raus = [A].concat(C.geschwister[A] || [], links);
      for (var u = 0; u < raus.length; u++) {
        var sm = raus[u], cm = cl[sm]; if (cm < 0) continue;
        if (u > 0 && raus.indexOf(sm) < u) continue;
        for (var h = 0; h < NH; h++) { var x = rM[h * nS + sm]; if (x === x) { ES[cm * 4 + h] += x; EN[cm * 4 + h]++; } var y = rL[h * nS + sm]; if (y === y) { ESL[cm * 4 + h] += y; ENL[cm * 4 + h]++; } }
      }
      for (var li = 0; li < links.length; li++) {
        var B = links[li], c = cl[B], eRowB = C.Z.eRow[D * nS + B], rowDB = vorzeile(T, eRowB);
        var ex1 = ((C.bits[rowDB] | C.bits[eRowB]) & MK.B_202) !== 0, ex2 = !ex1 && a < 2 && (C.bits[rowDB] & MK.bit(a, r)) !== 0;
        for (var h3 = 0; h3 < NH; h3++) {
          if (!imZ[h3]) continue;
          var j = h3 * nS + B, ci4 = c * 4 + h3;
          var topf = (N[ci4] - EN[ci4]) > 0 ? (S[ci4] - ES[ci4]) / (N[ci4] - EN[ci4]) : NaN;
          var k1 = KN.konfIndex(a, r, 1, 0, h3, c), k2 = KN.konfIndex(a, r, 1, 1, h3, c);
          var xa = (cA === 2 || cA === 3) ? rM[h3 * nS + A] : NaN, aOk = xa === xa;
          if (ex1 || ex2) {
            if (art === 0) { var xb = rM[j]; if (xb === xb && topf === topf) { if (ex1) { Zl.ex1n[k1]++; Zl.ex1s[k1] += dir * (xb - topf); } else { Zl.ex2n[k1]++; Zl.ex2s[k1] += dir * (xb - topf); } } }
            continue;
          }
          if (ab[j]) {
            if (art === 0 && topf === topf) abgang(k1, B, dir, rAb[j], topf);
            if (art === 0 && aOk) abgang(k2, B, dir, rAb[j], xa);
            continue;
          }
          var xB = rM[j];
          if (!(xB === xB) || !(topf === topf)) continue;
          if (!istBer[B]) { istBer[B] = 1; beruehrt[nBer++] = B; beitrag[B] = []; }
          if (beitrag[B].indexOf(A) === -1) beitrag[B].push(A);
          acc.s1[j] += dir * (xB - topf); acc.n1[j]++; acc.sT[j] += topf;
          if (aOk) { acc.sRA[j] += xa; acc.nRA[j]++; acc.sKA[j] += KN.HUERDE[cA]; acc.sKKA[j] += KN.HUERDE_KASSA[cA]; }
          if (art === 0 && H[h3] >= 1) {
            var xl = rL[j];
            if (xl === xl) {
              var nl = NL[ci4] - ENL[ci4], topfL = nl > 0 ? (SL[ci4] - ESL[ci4]) / nl : NaN;
              if (topfL === topfL) { acc.sl1[j] += dir * (xl - topfL); acc.nl1[j]++; }
              var xal = (cA === 2 || cA === 3) ? rL[h3 * nS + A] : NaN;
              if (xal === xal) { acc.sRAL[j] += xal; acc.nRAL[j]++; }
            }
          }
        }
      }
    }
    /* Beobachtungen: B einmal je Tag */
    var R = art === 0 ? rng('plB|' + a + '|' + r + '|1|' + D) : null;
    for (var bi = 0; bi < nBer; bi++) {
      var B2 = beruehrt[bi], c3 = cl[B2], sperr = null;
      for (var h4 = 0; h4 < NH; h4++) {
        var j2 = h4 * nS + B2;
        if (acc.n1[j2] > 0) {
          var k1b = KN.konfIndex(a, r, 1, 0, h4, c3), k2b = KN.konfIndex(a, r, 1, 1, h4, c3);
          var x1 = acc.s1[j2] / acc.n1[j2], topfM = acc.sT[j2] / acc.n1[j2], hatH2 = acc.nRA[j2] > 0, mRA = hatH2 ? acc.sRA[j2] / acc.nRA[j2] : NaN;
          zelle(art, k1b, e, x1, KN.HUERDE[c3], KN.HUERDE_KASSA[c3], dir < 0 ? leiheFaktor(h4) : 0);
          if (hatH2) zelle(art, k2b, e, dir * (rM[j2] - mRA), KN.HUERDE[c3] + acc.sKA[j2] / acc.nRA[j2], KN.HUERDE_KASSA[c3] + acc.sKKA[j2] / acc.nRA[j2], leiheFaktor(h4));
          if (art === 0) {
            if (!sperr) {
              sperr = new Set([B2]);
              beitrag[B2].forEach(function (A3) { sperr.add(A3); (C.geschwister[A3] || []).forEach(function (x) { sperr.add(x); }); for (var t3 = 0; t3 < TOP; t3++) if (top[A3 * TOP + t3] >= 0) sperr.add(top[A3 * TOP + t3]); });
            }
            var sp = sperr;
            var b3 = ziehe(R, klassenListe[c3], h4, function (x) { return !sp.has(x); });
            if (b3 >= 0) { zelleB(k1b, e, dir * (rM[h4 * nS + b3] - topfM)); if (hatH2) zelleB(k2b, e, dir * (rM[h4 * nS + b3] - mRA)); } else Zl.plBohne[k1b]++;
            if (acc.nl1[j2] > 0) zelleL(k1b, e, acc.sl1[j2] / acc.nl1[j2], KN.HUERDE[c3], dir < 0 ? leiheFaktor(h4) : 0);
            if (acc.nRAL[j2] > 0 && rL[j2] === rL[j2]) zelleL(k2b, e, dir * (rL[j2] - acc.sRAL[j2] / acc.nRAL[j2]), KN.HUERDE[c3] + acc.sKA[j2] / Math.max(1, acc.nRA[j2]), leiheFaktor(h4));
          }
        }
        acc.s1[j2] = 0; acc.n1[j2] = 0; acc.sT[j2] = 0; acc.sRA[j2] = 0; acc.nRA[j2] = 0; acc.sKA[j2] = 0; acc.sKKA[j2] = 0;
        acc.sl1[j2] = 0; acc.nl1[j2] = 0; acc.sTL[j2] = 0; acc.sRAL[j2] = 0; acc.nRAL[j2] = 0;
      }
      istBer[B2] = 0; beitrag[B2] = null;
    }
    nBer = 0;
  }
}

/** Vorbereitung je Tafel: Ertragsfenster, Bits, CIK, Firmen, E3, V1, Zulaessigkeit, V2-Rechner (mit Ablage je Stichtag). */
function vorbereiten(T, quellen) {
  var ED = require('./edgar.js');
  var t0 = Date.now(), log = quellen.log || function () {};
  var nur = quellen.nur || null;
  var M = MK.kumuliert(T); log('kumuliert ' + (Date.now() - t0) + ' ms');
  var bits = new Uint8Array(T.g.n);
  MK.rohAusloeser(T, bits, nur); log('Rohausloeser ' + (Date.now() - t0) + ' ms');
  var ref = T.stand.symbole.map(function (r) { return !!r.referenz; });
  var CK = quellen.cik || ED.cikJeReihe(T.symName, ref);
  var cik = CK.cik;
  var F = quellen.firmen || ED.ladeFirmen(Array.from(new Set(Array.from(cik).filter(function (x) { return x > 0; }))), quellen.edgarOrdner);
  log('Firmen ' + F.zaehler.dateien + ' (' + (Date.now() - t0) + ' ms)');
  var e3z = MK.e3(T, M, bits, cik, F.firmen, T.schluss, nur); log('E3 ' + JSON.stringify(e3z));
  var V1 = VK.v1(T, cik, F.firmen);
  var Zu = MK.zulaessig(T, nur); log('zulaessig ' + JSON.stringify(Zu.zaehler) + ' (' + (Date.now() - t0) + ' ms)');
  var geschwister = new Array(T.nSym), jeCik = new Map();
  for (var s = 0; s < T.nSym; s++) if (cik[s]) { var l = jeCik.get(cik[s]) || []; l.push(s); jeCik.set(cik[s], l); }
  jeCik.forEach(function (l) { if (l.length > 1) l.forEach(function (s2) { geschwister[s2] = l.filter(function (x) { return x !== s2; }); }); });
  var ablage = new Map(), v2zeit = { n: 0, ms: 0 };
  function v2(c) {
    if (ablage.has(c)) return ablage.get(c);
    var t1 = Date.now(), k = VK.v2(T, c, cik, nur);
    v2zeit.n++; v2zeit.ms += Date.now() - t1;
    ablage.set(c, k);
    return k;
  }
  return { M: M, bits: bits, cik: cik, cikZaehler: CK.zaehler, firmen: F.firmen, firmenZaehler: F.zaehler, e3: e3z, V1: V1, Z: Zu,
    geschwister: geschwister, v2: v2, v2zeit: v2zeit, nur: nur };
}

module.exports = { zeitraum: zeitraum, ereignisse: ereignisse, imZeitraumFiltern: imZeitraumFiltern, placeboA: placeboA, placeboC: placeboC,
  messe: messe, vorbereiten: vorbereiten, Zellen: Zellen, FELDER: FELDER, GRUPPEN: GRUPPEN, vorzeile: vorzeile };

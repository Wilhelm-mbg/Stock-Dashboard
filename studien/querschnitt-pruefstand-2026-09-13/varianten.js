'use strict';
/* TEIL 3 - DIE VIER VARIANTEN als Ueberlagerung auf einem Lauf der Maschine (VORREGISTRIERUNG-TEIL3.md §T3.3).
 *
 * Die Maschine (pruefstand.js) waehlt das Dezil und liefert je Periode die Tagesstuecke des gehaltenen Korbs
 * (Eroeffnung->Schluss am Ausfuehrungstag, Schluss->Schluss dazwischen, Schluss->Eroeffnung am Periodenende),
 * die Mitglieder, die Endgewichte und die Kosten. Hier wird darauf NUR der EINSATZ e in [0, 1] gelegt:
 *   V0 e = 1 | V1 Regime-Schalter (SPY ueber EMA200, taeglich geprueft) | V2 Volatilitaetsbremse (monatlich)
 *   V3 beides. Der Rest ist Kasse zu null.
 *
 * Jede Einsatzaenderung ist ein Trade und wird mit der Kostenfunktion der Maschine (umschlagKosten) bepreist,
 * nur mit skalierten Gewichten - bei e = 1 kommt exakt die Kostenzahl der Maschine heraus (test-teil3 T3-P1).
 *
 * SPERRKLINKE der Ueberlagerung: Regime und V0-Tagesreihe werden nur ueber regimeAn()/v0An() gelesen; jeder
 * Zugriff auf einen Tag NACH dem Entscheidungstag wird gezaehlt und verweigert. Die praeparierten Faelle
 * (opt.leckRegime, opt.leckVol) lesen absichtlich t+1 - die Klinke muss anschlagen (T3-P4).
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var K = require('./konfig.js');
var PR = require('./pruefstand.js');
var ST = require('./statistik.js');

var VARIANTEN = [
  { key: 'v0', name: 'V0 Grundlinie', regime: false, bremse: false },
  { key: 'v1', name: 'V1 Regime-Schalter', regime: true, bremse: false },
  { key: 'v2', name: 'V2 Volatilitaetsbremse', regime: false, bremse: true },
  { key: 'v3', name: 'V3 Regime + Bremse', regime: true, bremse: true },
];

function skaliere(gewichte, e) { var o = {}; Object.keys(gewichte || {}).forEach(function (s) { o[s] = e * gewichte[s]; }); return o; }

/** Der geteilte Grenztag (§T3.3): am Tag d die Nacht (Schluss->Eroeffnung, aus rendite und renditeOC) und den
 *  Tag (Eroeffnung->Schluss) je Mitglied getrennt gemittelt - dieselbe Zerlegung, die halte() am Periodenende
 *  benutzt. Ausbuchungen (§3.6 Teil 1) fallen in die Nacht, am ersten Periodentag nach der letzten Zeile. */
function geteilterTag(T, p, d, totalverlust) {
  var g = T.g, N = p.long.N, sCo = 0, sOc = 0, unteilbar = 0;
  for (var i = 0; i < p.long.mitglieder.length; i++) {
    var sym = p.long.mitglieder[i], zl = T.zeileVon(sym, d);
    if (zl < 0) {
      var letzte = T.letzteZeile(sym);
      if (letzte >= 0 && g.tag[letzte] < d) {
        var buchungsTag = null;
        for (var q = 0; q < p.long.tage.length; q++) if (p.long.tage[q].tag > g.tag[letzte]) { buchungsTag = p.long.tage[q].tag; break; }
        if (buchungsTag === d) { var grund = T.endeGrund[sym]; sCo += (grund && totalverlust[grund]) ? -100 : 0; }
      }
      continue;
    }
    var cc = g.rendite[zl], oc = g.renditeOC[zl];
    if (cc === cc && oc === oc) { sCo += 100 * ((1 + cc / 100) / (1 + oc / 100) - 1); sOc += oc; }
    else if (cc === cc) { sCo += cc; unteilbar++; }
  }
  return { co: sCo / N, oc: sOc / N, unteilbar: unteilbar };
}

/** Stuecke desselben Kalendertags verketten, Kosten summieren - die Konvention der Maschine (bewerte/tagesreihe). */
function verketteTage(stuecke) {
  var idx = {}, liste = [];
  stuecke.forEach(function (s) {
    var e = idx[s.tag];
    if (!e) { e = idx[s.tag] = { tag: s.tag, faktor: 1, kosten: 0, einsatz: s.e }; liste.push(e); }
    e.faktor *= (1 + s.rs / 100); e.kosten += s.kosten; e.einsatz = s.e;
  });
  liste.sort(function (a, b) { return a.tag - b.tag; });
  liste.forEach(function (e) { e.brutto = 100 * (e.faktor - 1); e.netto = e.brutto - e.kosten; delete e.faktor; });
  return liste;
}

/**
 * Eine Variante fahren.  opt: { variante, regime (Tag -> 0/1, spyRegime der Maschine), v0Tage (Tagesreihe des
 * V0-Laufs, fuer V2/V3), huerdeFenster, leckRegime, leckVol }.
 */
function fahre(T, L, opt) {
  opt = opt || {};
  var V = VARIANTEN.filter(function (v) { return v.key === (opt.variante || 'v0'); })[0];
  if (!V) throw new Error('unbekannte Variante ' + opt.variante);
  var regime = opt.regime || {};
  var empf = K.EMPFINDLICHKEIT.filter(function (e) { return e.key === (L.empfindlichkeit || 'haupt'); })[0];
  var totalverlust = {}; empf.totalverlust.forEach(function (gr) { totalverlust[gr] = true; });
  var v0Tage = opt.v0Tage || null;

  /* ---------- Sperrklinke der Ueberlagerung ---------- */
  var verstoesse = 0, beispiele = [];
  function melde(was) { verstoesse++; if (beispiele.length < 5) beispiele.push(was); }
  function regimeAn(tag, erlaubtBis) {
    if (tag > erlaubtBis) { melde('Regime@' + (T.kal.tage[tag] || tag) + ' (erlaubt bis ' + T.kal.tage[erlaubtBis] + ')'); return undefined; }
    return regime[tag];
  }
  function v0An(pos, erlaubtBis) {
    if (pos < 0 || pos >= v0Tage.length) return NaN;
    if (v0Tage[pos].tag > erlaubtBis) { melde('V0-Tag@' + T.kal.tage[v0Tage[pos].tag] + ' (erlaubt bis ' + T.kal.tage[erlaubtBis] + ')'); return NaN; }
    return v0Tage[pos].brutto;
  }
  /* ---------- Volatilitaetsbremse am Signaltag t (§T3.3) ---------- */
  var anlauf = 0, fehlwert = 0;
  function bremse(t) {
    if (!v0Tage) throw new Error('V2/V3 brauchen die V0-Tagesreihe (opt.v0Tage)');
    var ende = -1, lo = 0, hi = v0Tage.length - 1;
    while (lo <= hi) { var m = (lo + hi) >> 1; if (v0Tage[m].tag <= t) { ende = m; lo = m + 1; } else hi = m - 1; }
    if (opt.leckVol && ende + 1 < v0Tage.length) ende++;              /* praeparierter Fall: zieht den Tag NACH t mit */
    var n = K.V2_VOL_FENSTER;
    if (ende - n + 1 < 0) { anlauf++; return { e: 1, sigma: null, anlauf: true }; }
    var w = new Float64Array(n), s = 0, ok = true;
    for (var i = 0; i < n; i++) { w[i] = v0An(ende - n + 1 + i, t); if (!(w[i] === w[i])) ok = false; s += w[i]; }
    if (!ok) { fehlwert++; return { e: 1, sigma: null, anlauf: false }; }
    var mw = s / n, q = 0; for (var j = 0; j < n; j++) q += (w[j] - mw) * (w[j] - mw);
    var sigma = Math.sqrt(q / (n - 1)) * Math.sqrt(K.HANDELSTAGE_JAHR);
    return { e: sigma > 0 ? Math.min(1, K.V2_VOL_ZIEL / sigma) : 1, sigma: sigma, anlauf: false };
  }

  /* ---------- Perioden durchlaufen ---------- */
  var P0 = L.perioden, stuecke = [], perioden = [], schaltungen = [];
  var regimeFehlt = 0, unteilbar = 0, grenzAbwMax = 0;
  var regimeKomp = 1, eCur = 0, altGewichte = {};                    /* vor der ersten Periode: nichts gehalten */
  for (var j = 0; j < P0.length; j++) {
    var p = P0[j], t = p.t, N = p.long.N, mitglieder = p.long.mitglieder;
    /* Entscheid am Signaltag t: Regime (V1/V3) und Bremse (V2/V3) */
    if (V.regime) { var rg = regimeAn(opt.leckRegime ? t + 1 : t, t); if (rg === undefined) regimeFehlt++; else regimeKomp = rg; }
    var br = V.bremse ? bremse(t) : { e: 1, sigma: null, anlauf: false };
    var eNeu = (V.regime ? regimeKomp : 1) * br.e;
    var wNeu = {}; mitglieder.forEach(function (s) { wNeu[s] = 1 / N; });
    var uk = PR.umschlagKosten(T, skaliere(altGewichte, eCur), skaliere(wNeu, eNeu), t, opt.huerdeFenster);
    var pr = { t: t, a: p.a, aEnde: p.aEnde, monat: T.kal.tage[p.a].slice(0, 7), jahr: +T.kal.tage[p.a].slice(0, 4),
      k: p.k, nUni: p.nUni, N: N, einsatz: eNeu, regime: V.regime ? regimeKomp : null, regimeSPY: regime[t] === undefined ? null : regime[t],
      sigma: br.sigma, bremseE: br.e, anlauf: !!br.anlauf, umschlag: uk.umschlag, kosten: uk.kosten,
      umschlagSchalt: 0, kostenSchalt: 0, schaltungen: 0, stueckeVon: stuecke.length };
    eCur = eNeu;
    var anstehend = null, tage = p.long.tage;
    for (var i = 0; i < tage.length; i++) {
      var x = tage[i], d = x.tag, typ = (d === p.a) ? 'oc' : (d === p.aEnde) ? 'co' : 'cc';
      if (anstehend) {
        /* Grenztag geteilt: die Nacht gehoert dem alten, der Tag dem neuen Einsatz (§T3.3) */
        var gt = geteilterTag(T, p, d, totalverlust);
        unteilbar += gt.unteilbar;
        var kontrolle = 100 * ((1 + gt.co / 100) * (1 + gt.oc / 100) - 1);
        if (Math.abs(kontrolle - x.r) > grenzAbwMax) grenzAbwMax = Math.abs(kontrolle - x.r);
        stuecke.push({ j: j, tag: d, typ: 'co', r: gt.co, e: eCur, rs: eCur * gt.co, kosten: 0 });
        eCur = anstehend.nach;
        stuecke.push({ j: j, tag: d, typ: 'oc', r: gt.oc, e: eCur, rs: eCur * gt.oc, kosten: anstehend.kosten });
        pr.umschlagSchalt += anstehend.umschlag; pr.kostenSchalt += anstehend.kosten; pr.schaltungen++;
        anstehend.wirkTag = d; schaltungen.push(anstehend); anstehend = null;
      } else {
        stuecke.push({ j: j, tag: d, typ: typ, r: x.r, e: eCur, rs: eCur * x.r, kosten: (i === 0) ? uk.kosten : 0 });
      }
      /* Taegliche Regimepruefung zum Schluss von d - fuer alle Tage VOR dem naechsten Signaltag (der ist der
       * vorletzte Tag der Periode; sein Entscheid ist der Umschichtungsentscheid der naechsten Periode). */
      if (V.regime && i < tage.length - 2) {
        var r2 = regimeAn(opt.leckRegime ? d + 1 : d, d);
        if (r2 === undefined) regimeFehlt++;
        else if (r2 !== regimeKomp) {
          regimeKomp = r2;
          var eN = regimeKomp * br.e;
          var wk = PR.umschlagKosten(T, skaliere(wNeu, eCur), skaliere(wNeu, eN), d, opt.huerdeFenster);
          anstehend = { j: j, monat: pr.monat, entscheidTag: d, wirkTag: null, von: eCur, nach: eN, regime: regimeKomp, umschlag: wk.umschlag, kosten: wk.kosten };
        }
      }
    }
    if (anstehend) throw new Error('Schaltung ohne Wirktag in Periode ' + pr.monat);
    pr.stueckeBis = stuecke.length;
    pr.einsatzEnde = eCur;
    perioden.push(pr);
    altGewichte = p.long.endGewichte;
  }

  /* ---------- Perioden- und Tagesreihe ---------- */
  perioden.forEach(function (pr) {
    var f = 1, ko = 0, eSum = 0, nT = 0, letzterTag = -1;
    for (var q = pr.stueckeVon; q < pr.stueckeBis; q++) {
      var s = stuecke[q]; f *= 1 + s.rs / 100; ko += s.kosten;
      if (s.tag !== letzterTag) { nT++; letzterTag = s.tag; }
    }
    for (var q2 = pr.stueckeVon; q2 < pr.stueckeBis; q2++) { var s2 = stuecke[q2]; if (q2 + 1 >= pr.stueckeBis || stuecke[q2 + 1].tag !== s2.tag) eSum += s2.e; }
    pr.brutto = 100 * (f - 1); pr.kostenGesamt = ko; pr.netto = pr.brutto - ko;
    pr.umschlagGesamt = pr.umschlag + pr.umschlagSchalt; pr.zeitImMarkt = nT ? eSum / nT : null;
    delete pr.stueckeVon; delete pr.stueckeBis;
  });
  var tage = verketteTage(stuecke);
  return { variante: V.key, name: V.name, tage: tage, perioden: perioden, schaltungen: schaltungen,
    verstoesse: verstoesse, beispiele: beispiele, ungueltig: verstoesse > 0,
    anlauf: anlauf, fehlwert: fehlwert, regimeFehlt: regimeFehlt, unteilbar: unteilbar, grenztagAbweichungMax: grenzAbwMax };
}

/** Vergleichsreihe aus der Maschine (key 'uni'): dieselben Stuecke, dieselben Kosten, e = 1. */
function reiheAusMaschine(T, L, key) {
  var stuecke = [], perioden = [];
  L.perioden.forEach(function (p, j) {
    var kost = p.kosten[key].kosten;
    p[key].tage.forEach(function (x, i) { stuecke.push({ j: j, tag: x.tag, rs: x.r, e: 1, kosten: i === 0 ? kost : 0 }); });
    perioden.push({ t: p.t, a: p.a, aEnde: p.aEnde, monat: T.kal.tage[p.a].slice(0, 7), jahr: +T.kal.tage[p.a].slice(0, 4),
      brutto: p[key].periode, kostenGesamt: kost, netto: p[key].periode - kost, umschlagGesamt: p.kosten[key].umschlag, einsatz: 1, zeitImMarkt: 1 });
  });
  return { variante: key, name: key === 'uni' ? 'Universum (gleichgewichtet)' : key, tage: verketteTage(stuecke), perioden: perioden };
}

/** SPY aus demselben Panel, gehalten Eroeffnung(a) -> Eroeffnung(aEnde) mit der Haltefunktion der Maschine, ohne Kosten. */
function spyReihe(T, L) {
  var s = T.symIdx['SPY'];
  if (s === undefined) throw new Error('SPY fehlt in der Symboltabelle');
  var stuecke = [], perioden = [], fehlt = [];
  L.perioden.forEach(function (p, j) {
    var zl = T.zeileVon(s, p.a);
    if (zl < 0 || !(T.g.bEroeffnung[zl] > 0)) { fehlt.push(T.kal.tage[p.a]); return; }
    var zz = { tote: 0, toteTotalverlust: 0, luecken: 0 };
    var h = PR.halte(T, [{ sym: s, naechste: zl }], p.a, p.aEnde, {}, zz);
    h.tage.forEach(function (x) { stuecke.push({ j: j, tag: x.tag, rs: x.r, e: 1, kosten: 0 }); });
    perioden.push({ t: p.t, a: p.a, aEnde: p.aEnde, monat: T.kal.tage[p.a].slice(0, 7), jahr: +T.kal.tage[p.a].slice(0, 4),
      brutto: h.periode, kostenGesamt: 0, netto: h.periode, umschlagGesamt: 0, einsatz: 1, zeitImMarkt: 1, luecken: zz.luecken });
  });
  if (fehlt.length) throw new Error('SPY ohne Eroeffnung am Ausfuehrungstag: ' + fehlt.slice(0, 5).join(', '));
  return { variante: 'spy', name: 'SPY (Kursreihe, ohne Kosten)', tage: verketteTage(stuecke), perioden: perioden };
}

/* =========================================================================================
 * Kennzahlen (§T3.4/§T3.5)
 * ========================================================================================= */
function monatsMomente(werte) {
  var w = werte.filter(function (x) { return x === x && x != null; });
  var m = ST.periodenMomente(w);
  return { n: m.n, mittel: m.mittel, sd: m.sd, se: m.seNaiv, t: m.t, mde: m.seNaiv == null ? null : K.MDE_FAKTOR * m.seNaiv };
}
/** Momente einer Tagesreihe mit Hansen-Hodrick bei Lag L; MDE hier in Pp je MONAT (se_Tag x Lag), damit die
 *  Spalte mit der Monatsreihe vergleichbar ist (Tagesmittel x Periodenlaenge ~ Periodenmittel). */
function tagesMomente(paare, lag) {
  var pp = paare.filter(function (x) { return x.x === x.x; });
  if (pp.length < 3) return null;
  var m = ST.momente(pp, lag);
  return { n: m.n, mittel: m.mittel, seNaiv: m.seNaiv, seHH: m.seHH, seNW: m.seNW, t: m.seHH > 0 ? m.mittel / m.seHH : null,
    mittelMonat: m.mittel * lag, seHHMonat: m.seHH == null ? null : m.seHH * lag,
    mdeMonat: m.seHH == null ? null : K.MDE_FAKTOR * m.seHH * lag,
    marke: (m.seHH > 0 && m.seNaiv > 0 && (m.seHH / m.seNaiv > K.SE_ABWEICHUNG_MARKE || m.seNaiv / m.seHH > K.SE_ABWEICHUNG_MARKE)) ? 'se-Spreizung' : null };
}
/** Tagesdifferenz zweier Reihen (inneres Join ueber den Kalendertag). */
function differenzTage(A, B, feld) {
  var idx = {}; B.forEach(function (x) { idx[x.tag] = x; });
  return A.filter(function (x) { return idx[x.tag]; }).map(function (x) { return { t: x.tag, x: x[feld] - idx[x.tag][feld] }; });
}
/** Maximaler Rueckgang des Kapitalstands aus Tagesrenditen (Spitze-zu-Tal, %), Kapitalstand 1 am Anfang. */
function maxRueckgang(tage, feld) {
  var nav = 1, spitze = 1, mdd = 0, spitzeTag = null, talTag = null, spitzeAktuell = null, ende = null;
  tage.forEach(function (x) {
    var r = x[feld]; if (!(r === r)) return;
    nav *= 1 + r / 100;
    if (nav > spitze) { spitze = nav; spitzeAktuell = x.tag; }
    var dd = 1 - nav / spitze;
    if (dd > mdd) { mdd = dd; talTag = x.tag; spitzeTag = spitzeAktuell; }
    ende = nav;
  });
  return { mdd: 100 * mdd, spitzeTag: spitzeTag, talTag: talTag, endstand: ende };
}
/** Schlechtestes Fenster von n aufeinanderfolgenden Monatsrenditen, verkettet (%). */
function schlechtestesFenster(werte, n) {
  if (werte.length < n) return { wert: null, von: null };
  var best = null, von = null;
  for (var i = 0; i + n <= werte.length; i++) {
    var f = 1; for (var k = 0; k < n; k++) f *= 1 + werte[i + k] / 100;
    var v = 100 * (f - 1);
    if (best === null || v < best) { best = v; von = i; }
  }
  return { wert: best, von: von };
}
/** Sharpe annualisiert aus Monatsrenditen, Kasse KASSE_ZINS. */
function sharpe(werte) {
  var m = ST.periodenMomente(werte);
  if (!(m.sd > 0)) return null;
  return ((m.mittel - K.KASSE_ZINS / 12) * 12) / (m.sd * Math.sqrt(12));
}
function zeitImMarkt(tage) {
  if (!tage.length) return { mittel: null, anteilInvestiert: null };
  var s = 0, n = 0; tage.forEach(function (x) { s += x.einsatz; if (x.einsatz > 0) n++; });
  return { mittel: s / tage.length, anteilInvestiert: n / tage.length };
}

module.exports = { VARIANTEN: VARIANTEN, fahre: fahre, geteilterTag: geteilterTag, verketteTage: verketteTage, skaliere: skaliere,
  reiheAusMaschine: reiheAusMaschine, spyReihe: spyReihe,
  monatsMomente: monatsMomente, tagesMomente: tagesMomente, differenzTage: differenzTage,
  maxRueckgang: maxRueckgang, schlechtestesFenster: schlechtestesFenster, sharpe: sharpe, zeitImMarkt: zeitImMarkt };

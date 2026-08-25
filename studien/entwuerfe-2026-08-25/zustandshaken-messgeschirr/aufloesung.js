'use strict';
/* Aufloesung fuer den Endpunkt "Strategie MIT Waechter minus Strategie OHNE Waechter".
 * Baut die A7-Kontrolle der Messmaschine (exportiert unter _intern) und rechnet
 * beide Tagesreihen sowie die GEPAARTE Differenz. Alles auf dem Live-Universum,
 * denn dort laeuft der Waechter. */
var fs = require('fs');
var path = require('path');
var Q = require('C:/Users/Wilhe/Downloads/Stock-Dashboard/quant.js');
var MM = require('C:/Users/Wilhe/Downloads/Stock-Dashboard/studien/messmaschine/messmaschine.js');

var ARCHIV = 'E:/Markt-Dashboard-Archiv/archiv60m';
var SIM = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
var syms = SIM.universum;
var pauseTag = {};
SIM.protokoll.forEach(function (p) { if (p.pauseAktiv) pauseTag[p.tag] = 1; });

var P = { ENTRY: 'rsi2seit', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 1.5,
          MINQ: 0, CHAN: false, MTF: false, TREND: false };
var H = 8, VORLAUF = 261, LESE = 261;

function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }
function sitzungsPosition(bars) {
  var p = new Int16Array(bars.length), letzter = null, k = 0;
  for (var i = 0; i < bars.length; i++) {
    var d = new Date(bars[i][0]);
    var tag = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
    if (tag !== letzter) { letzter = tag; k = 0; } else { k++; }
    p[i] = k;
  }
  return p;
}

var U = {};
syms.forEach(function (s) {
  var j = JSON.parse(fs.readFileSync(path.join(ARCHIV, 'bars_60m_' + s + '.json'), 'utf8'));
  U[s] = j.series;
});
var alleTage = {};
syms.forEach(function (s) { U[s].forEach(function (b) { alleTage[tagVon(b[0])] = 1; }); });
var tage = Object.keys(alleTage).sort();
var schnittTag = tage[Math.floor(tage.length * 0.5)];
console.log('Universum ' + syms.length + ' Werte, ' + tage.length + ' Handelstage, Schnitt ' + schnittTag);

var K = MM._intern.baueKontrolle(U, H, schnittTag, VORLAUF, null, P);

/* Signale mit Ueberschuss gegen die A7-Kontrolle - ohne Abklingzeit (wie die
 * Messmaschine) und ZUSAETZLICH mit Abklingzeit (wie der Waechter/live). */
function sammle(mitAbkling) {
  var eintraege = [];
  syms.forEach(function (sym) {
    var b = U[sym], POS = sitzungsPosition(b), cool = 0;
    for (var i = VORLAUF; i < b.length - H; i++) {
      var s = null;
      try { s = Q.einstiegSignal(b, i, P); } catch (e) { }
      if (!s || s.dir !== 'call') continue;
      if (mitAbkling) { if (b[i][0] - cool < 120 * 60000) continue; cool = b[i][0]; }
      var s0 = b[i][1], sH = b[i + H][1];
      if (!(s0 > 0) || !(sH > 0)) continue;
      var tag = tagVon(b[i][0]), hf = tag < schnittTag ? 'entdeckung' : 'bestaetigung';
      var erw = K.erwartung(sym, POS[i], hf, i - LESE - H, i + H - 1);
      if (erw == null) continue;
      eintraege.push({ tag: tag, hf: hf, wert: (sH / s0 - 1) - erw });
    }
  });
  return eintraege;
}

function tagesMittel(e) {
  var m = {};
  e.forEach(function (x) { (m[x.tag] = m[x.tag] || []).push(x.wert); });
  var t = Object.keys(m).sort();
  return { tage: t, mittel: t.map(function (k) { return m[k].reduce(function (a, b) { return a + b; }, 0) / m[k].length; }),
           n: t.map(function (k) { return m[k].length; }) };
}

var VERFAHREN = MM.VERFAHREN;
function statistik(werte) { return MM._intern.statistik(werte, H - 1); }

function bericht(name, tm) {
  var st = statistik(tm.mittel);
  var schwelle = MM._intern.bonferroniSchwelle(1);
  var d80 = st.se > 0 ? (schwelle + VERFAHREN.zPower80) * st.se : null;
  console.log(name + ': Tage ' + st.n +
    ' | Mittel ' + (st.mittel * 100).toFixed(4) + ' Pp' +
    ' | se ' + (st.se * 100).toFixed(4) + ' Pp' +
    ' | MDE ' + (st.mde * 100).toFixed(4) + ' Pp' +
    ' | delta80 ' + (d80 * 100).toFixed(4) + ' Pp' +
    ' | t ' + (st.t != null ? st.t.toFixed(2) : '-') +
    ' | sd ' + (st.sd * 100).toFixed(4) + ' Pp' +
    ' | UeberlappFaktor ' + st.ueberlappungsFaktor);
  return { st: st, d80: d80 };
}

['ohne Abklingzeit (Messmaschine)', 'mit Abklingzeit (Waechter/live)'].forEach(function (label, k) {
  var E = sammle(k === 1);
  console.log('\n===== ' + label + ' =====');
  console.log('Signale gesamt ' + E.length);
  var B = E.filter(function (x) { return x.hf === 'bestaetigung'; });
  console.log('Bestaetigungshaelfte: ' + B.length + ' Signale');

  var tmB = tagesMittel(B);
  bericht('  UNGATED (alle Signale)', tmB);

  /* GATED: Signale an Pausentagen entfallen. */
  var Bg = B.filter(function (x) { return !pauseTag[x.tag]; });
  var tmG = tagesMittel(Bg);
  bericht('  GATED   (Pausentage weg)', tmG);
  console.log('  entfernte Signale: ' + (B.length - Bg.length) + ' auf ' +
    (tmB.tage.length - tmG.tage.length) + ' Tagen');

  /* GEPAARTE DIFFERENZ je Handelstag: gated - ungated.
   * An Pausentagen wird nicht gehandelt -> Beitrag 0 statt x_t.
   * An allen anderen Tagen ist die Differenz exakt null. */
  var diff = tmB.tage.map(function (t, idx) { return pauseTag[t] ? -tmB.mittel[idx] : 0; });
  var stD = statistik(diff);
  var schwelle = MM._intern.bonferroniSchwelle(1);
  var d80D = stD.se > 0 ? (schwelle + VERFAHREN.zPower80) * stD.se : null;
  var nichtNull = diff.filter(function (x) { return x !== 0; }).length;
  console.log('  DIFFERENZ gated-ungated: Tage ' + stD.n + ' (davon ' + nichtNull + ' von null verschieden)' +
    ' | Mittel ' + (stD.mittel * 100).toFixed(4) + ' Pp' +
    ' | se ' + (stD.se * 100).toFixed(4) + ' Pp' +
    ' | MDE ' + (stD.mde * 100).toFixed(4) + ' Pp' +
    ' | delta80 ' + (d80D * 100).toFixed(4) + ' Pp' +
    ' | t ' + (stD.t != null ? stD.t.toFixed(2) : '-'));

  /* Was passierte an den Pausentagen wirklich? */
  var aufPause = B.filter(function (x) { return pauseTag[x.tag]; });
  if (aufPause.length) {
    var tmP = tagesMittel(aufPause);
    var stP = statistik(tmP.mittel);
    console.log('  NUR Pausentage: ' + aufPause.length + ' Signale auf ' + tmP.tage.length + ' Tagen' +
      ' | Mittel ' + (stP.mittel * 100).toFixed(4) + ' Pp' +
      ' | se ' + (stP.se != null ? (stP.se * 100).toFixed(4) : '-') + ' Pp' +
      ' | t ' + (stP.t != null ? stP.t.toFixed(2) : '-'));
  }
});

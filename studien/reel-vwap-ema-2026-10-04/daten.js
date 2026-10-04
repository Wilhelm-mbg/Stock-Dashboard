'use strict';
/* Auftrag Nr. 89 (Reel-Strategien, Teil 1) - Leser fuer die Minutenkerzen von QQQ, SPY, IWM.
 * Liest NUR (E: wird nie beschrieben). Eine Jahresdatei: series = [zeit, schluss, umsatz, hoch, tief, eroeffnung],
 * sitzungen = Bloecke {sitzung, von, bis}. Es zaehlen nur Kerzen in einem Block 'regulaer' und zwischen
 * 09:30 und 16:00 Ortszeit New York. Fester Schlusstag der Studie: 30.09.2026. */
var fs = require('fs');

var ARCHIV = 'E:/Markt-Dashboard-Archiv/alpaca1m';
var MASSNAHMEN = 'E:/Markt-Dashboard-Archiv/alpaca-massnahmen';
var WERTE = ['QQQ', 'SPY', 'IWM'];
var JAHRE = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
var ERSTER_TAG = '2016-01-04';
var SCHLUSSTAG = '2026-09-30';
var MIN_AUF = 570;   // 09:30
var MIN_ZU = 960;    // 16:00

var fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
});

/** Ortszeit New York eines Stempels: { datum: 'JJJJ-MM-TT', minute: Minuten seit Mitternacht }. */
function ortszeit(ms) {
  var teile = {};
  fmt.formatToParts(new Date(ms)).forEach(function (p) { teile[p.type] = p.value; });
  return { datum: teile.year + '-' + teile.month + '-' + teile.day, minute: Number(teile.hour) * 60 + Number(teile.minute) };
}

/** Baut die Rechenform aus einer Liste von Tagen: [{ datum, kerzen: [{ m, o, h, l, c, v }] }] (m = Minute des Tages).
 *  Rueckgabe: { n, o, h, l, c, v (Float64Array), min (Int16Array), tagA, tagE (Int32Array, Ende ausschliesslich),
 *  tagDatum (Texte), tagJahr (Zahlen) }. Wird vom Leser UND von den Kunsttagen der Tests benutzt. */
function ausTagen(tage) {
  var n = 0;
  tage.forEach(function (t) { n += t.kerzen.length; });
  var R = {
    n: n, o: new Float64Array(n), h: new Float64Array(n), l: new Float64Array(n), c: new Float64Array(n),
    v: new Float64Array(n), min: new Int16Array(n), tagA: new Int32Array(tage.length), tagE: new Int32Array(tage.length),
    tagDatum: [], tagJahr: []
  };
  var i = 0;
  tage.forEach(function (t, d) {
    R.tagA[d] = i;
    t.kerzen.forEach(function (k) {
      R.o[i] = k.o; R.h[i] = k.h; R.l[i] = k.l; R.c[i] = k.c; R.v[i] = k.v; R.min[i] = k.m; i++;
    });
    R.tagE[d] = i;
    R.tagDatum.push(t.datum);
    R.tagJahr.push(Number(t.datum.slice(0, 4)));
  });
  return R;
}

/** Liest die elf Jahresdateien eines Werts. Rueckgabe { reihe, zaehlung }.
 *  zaehlung fuehrt jeden stillen Verlust als Zahl (nichts wird ohne Zaehler verworfen). */
function ladeWert(sym) {
  var tage = [];
  var z = {
    wert: sym, dateien: 0, kerzenRoh: 0, kerzenRegulaer: 0, bloeckeRegulaer: 0,
    verworfen: { unsortiert: 0, nichtRegulaer: 0, ausserhalbUhrzeit: 0, ohneKurs: 0, vorErstemTag: 0, nachSchlusstag: 0 },
    blockUeberTagesgrenze: 0, leereBloecke: 0, umsatzNull: 0, hochTiefWiderspruch: 0
  };
  var letzt = -1;
  JAHRE.forEach(function (jahr) {
    var pfad = ARCHIV + '/' + sym + '/' + jahr + '.json';
    var j = JSON.parse(fs.readFileSync(pfad, 'utf8'));
    z.dateien++;
    var serie = j.series || [];
    z.kerzenRoh += serie.length;
    var reg = (j.sitzungen || []).filter(function (b) { return b.sitzung === 'regulaer'; });
    reg.sort(function (a, b) { return a.von - b.von; });
    var bi = 0, tag = null, tagBlock = -1;
    for (var i = 0; i < serie.length; i++) {
      var k = serie[i], t = k[0];
      if (!(t > letzt)) { z.verworfen.unsortiert++; continue; }
      while (bi < reg.length && reg[bi].bis < t) bi++;
      if (bi >= reg.length || t < reg[bi].von) { z.verworfen.nichtRegulaer++; letzt = t; continue; }
      letzt = t;
      if (bi !== tagBlock) {
        var ort = ortszeit(reg[bi].von), ortBis = ortszeit(reg[bi].bis);
        if (ort.datum !== ortBis.datum) z.blockUeberTagesgrenze++;
        tag = { datum: ort.datum, versatz: ort.minute * 60000 - (reg[bi].von % 86400000), kerzen: [] };
        tagBlock = bi;
        z.bloeckeRegulaer++;
        if (tag.datum < ERSTER_TAG) { tag.aus = 'vor'; } else if (tag.datum > SCHLUSSTAG) { tag.aus = 'nach'; } else tage.push(tag);
      }
      if (tag.aus === 'vor') { z.verworfen.vorErstemTag++; continue; }
      if (tag.aus === 'nach') { z.verworfen.nachSchlusstag++; continue; }
      var m = Math.round((((t % 86400000) + tag.versatz) % 86400000 + 86400000) % 86400000 / 60000);
      if (m < MIN_AUF || m >= MIN_ZU) { z.verworfen.ausserhalbUhrzeit++; continue; }
      if (!(k[1] > 0) || !(k[5] > 0) || !(k[3] > 0) || !(k[4] > 0)) { z.verworfen.ohneKurs++; continue; }
      if (!(k[2] > 0)) z.umsatzNull++;
      if (k[3] < k[4] || k[3] < k[1] || k[3] < k[5] || k[4] > k[1] || k[4] > k[5]) z.hochTiefWiderspruch++;
      tag.kerzen.push({ m: m, o: k[5], h: k[3], l: k[4], c: k[1], v: k[2] > 0 ? k[2] : 0 });
      z.kerzenRegulaer++;
    }
  });
  var mit = tage.filter(function (t) { return t.kerzen.length > 0; });
  z.leereBloecke = tage.length - mit.length;
  return { reihe: ausTagen(mit), zaehlung: z };
}

/** Kapitalmassnahmen eines Werts (roh, wie im Archiv abgelegt). */
function ladeMassnahmen(sym) {
  return JSON.parse(fs.readFileSync(MASSNAHMEN + '/' + sym + '.json', 'utf8'));
}

module.exports = {
  ARCHIV: ARCHIV, WERTE: WERTE, JAHRE: JAHRE, ERSTER_TAG: ERSTER_TAG, SCHLUSSTAG: SCHLUSSTAG, MIN_AUF: MIN_AUF, MIN_ZU: MIN_ZU,
  ortszeit: ortszeit, ausTagen: ausTagen, ladeWert: ladeWert, ladeMassnahmen: ladeMassnahmen
};

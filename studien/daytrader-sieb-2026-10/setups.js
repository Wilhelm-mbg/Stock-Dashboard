'use strict';
/* SETUPS des Daytrader-Siebs (Nr. 107, REGEL.md §3) - reine Funktionen, kein Netz, keine Datei.
 *
 * Kerze: [zeit, schluss, stueck, hoch, tief, eroeffnung] (Format 2 des Archivs), nur regulaere 1m-Kerzen
 * EINES Tages, aufsteigend. ctx = { auf (UTC-ms 09:30 ET), soll (Sitzungsminuten), vortag {schluss, hoch, tief},
 * spy (regulaere 1m-Kerzen SPY desselben Tages oder null) }.
 *
 * sig(k, i, ctx) -> +1 / -1 / 0 liest NUR k[0..i] und SPY-Kerzen mit zeit <= k[i][0] (test.js prueft das mit
 * vergifteten Kerzen nach i). Der Lauf nimmt je Wert und Tag die ERSTE Kerze mit Signal; Einstieg zur
 * Eroeffnung von k[i+1], Ausstieg nach `aus` (ausstieg()).
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */

function m(c, ctx) { return Math.round((c[0] - ctx.auf) / 60000); }
/** erste Kerze ihres Zeitfensters [a, b] (Minuten seit 09:30): nur Blick zurueck auf k[i-1]. */
function ersteIm(k, i, ctx, a, b) {
  var mi = m(k[i], ctx);
  if (mi < a || mi > b) return false;
  return i === 0 || m(k[i - 1], ctx) < a;
}
function eroeffnungDa(k, ctx) { return !!k[0] && m(k[0], ctx) === 0; }
/** letzte Kerze mit Minute <= b unter k[0..i] */
function letzteBis(k, i, ctx, b) { for (var j = i; j >= 0; j--) if (m(k[j], ctx) <= b) return k[j]; return null; }
function vz(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; }

var SETUPS = [
  {
    key: 'lueckenschluss', name: 'Schliessen der Eroeffnungsluecke (Gap-Fade)',
    quelle: 'verbreitete Praxis "Gap fill/Gap fade": kleine bis mittlere Luecken (0,5-3 %) gegen die Lueckenrichtung handeln, Ziel = Vortagesschluss',
    aus: { art: 'ziel' },
    sig: function (k, i, ctx) {
      if (i !== 0 || !eroeffnungDa(k, ctx)) return 0;
      var v = ctx.vortag.schluss, gap = k[0][5] / v - 1;
      if (Math.abs(gap) < 0.005 || Math.abs(gap) > 0.03) return 0;
      if (gap > 0 && k[0][4] > v) return -1;                 // Luecke nach oben, erste Minute hat den Vortagesschluss nicht beruehrt
      if (gap < 0 && k[0][3] < v) return 1;
      return 0;
    },
    ziel: function (k, i, ctx) { return ctx.vortag.schluss; },
  },
  {
    key: 'gapAndGo', name: 'Gap-and-Go (Lueckenfortsetzung)',
    quelle: 'verbreitete Praxis "Gap and Go": Luecke >= 2 %, die ersten fuenf Minuten laufen in Lueckenrichtung -> mit der Luecke bis Schluss',
    aus: { art: 'schluss' },
    sig: function (k, i, ctx) {
      if (!eroeffnungDa(k, ctx) || m(k[i], ctx) !== 4) return 0;
      var gap = k[0][5] / ctx.vortag.schluss - 1;
      if (gap >= 0.02 && k[i][1] > k[0][5]) return 1;
      if (gap <= -0.02 && k[i][1] < k[0][5]) return -1;
      return 0;
    },
  },
  {
    key: 'gao', name: 'Erste halbe Stunde sagt die letzte voraus',
    quelle: 'Gao, Han, Li, Zhou (2018), Market intraday momentum, JFE 129: Rendite Vortagesschluss->10:00 bestimmt die Richtung 15:30->16:00',
    aus: { art: 'schluss' },
    sig: function (k, i, ctx) {
      if (!ersteIm(k, i, ctx, 359, 360)) return 0;
      var c = letzteBis(k, i, ctx, 29);
      return c ? vz(c[1] / ctx.vortag.schluss - 1) : 0;
    },
  },
  {
    key: 'baltussen', name: 'Rest des Tages sagt die letzte halbe Stunde voraus',
    quelle: 'Baltussen, Da, Lammers, Martens (2021), Hedging demand and market intraday momentum, JFE 142: Rendite Vortagesschluss->15:30 bestimmt die Richtung 15:30->16:00',
    aus: { art: 'schluss' },
    sig: function (k, i, ctx) {
      if (!ersteIm(k, i, ctx, 359, 360)) return 0;
      return vz(k[i][1] / ctx.vortag.schluss - 1);
    },
  },
  {
    key: 'vortagesbruch', name: 'Bruch von Vortageshoch/-tief',
    quelle: 'verbreitete Praxis "Previous day high/low breakout": erster Schluss ueber dem Vortageshoch (unter dem Vortagestief) bis 15:00, Eroeffnung noch innerhalb -> mit dem Bruch bis Schluss',
    aus: { art: 'schluss' },
    sig: function (k, i, ctx) {
      if (!eroeffnungDa(k, ctx) || m(k[i], ctx) > 330) return 0;
      var o = k[0][5], v = ctx.vortag;
      if (o <= v.hoch && k[i][1] > v.hoch) return 1;
      if (o >= v.tief && k[i][1] < v.tief) return -1;
      return 0;
    },
  },
  {
    key: 'volumenspitze', name: 'Volumenspitze mit Fortsetzung',
    quelle: 'verbreitete Praxis "relative volume spike": Minutenvolumen >= 5x Mittel der 20 Vorminuten und Schluss jenseits ihres Hochs/Tiefs (Signalkerze beginnt 09:50-15:00) -> 30 Minuten mitlaufen',
    aus: { art: 'minuten', min: 30 },
    sig: function (k, i, ctx) {
      var mi = m(k[i], ctx);
      if (i < 20 || mi < 20 || mi > 330) return 0;
      var sv = 0, hi = -Infinity, lo = Infinity;
      for (var j = i - 20; j < i; j++) { sv += k[j][2]; if (k[j][3] > hi) hi = k[j][3]; if (k[j][4] < lo) lo = k[j][4]; }
      if (!(k[i][2] >= 5 * sv / 20)) return 0;
      if (k[i][1] > hi && k[i][1] > k[i][5]) return 1;
      if (k[i][1] < lo && k[i][1] < k[i][5]) return -1;
      return 0;
    },
  },
  {
    key: 'mittagsumkehr', name: 'Mittagsumkehr',
    quelle: 'verbreitete Praxis "lunchtime reversal": Vormittagsbewegung 09:30->12:00 >= 1 % wird ueber Mittag gegengehandelt, 120 Minuten',
    aus: { art: 'minuten', min: 120 },
    sig: function (k, i, ctx) {
      if (!eroeffnungDa(k, ctx) || !ersteIm(k, i, ctx, 149, 150)) return 0;
      var r = k[i][1] / k[0][5] - 1;
      return r >= 0.01 ? -1 : r <= -0.01 ? 1 : 0;
    },
  },
  {
    key: 'spyStaerke', name: 'Staerke/Schwaeche gegen SPY am Vormittag',
    quelle: 'verbreitete Praxis "relative strength vs. SPY": Wert 09:30->10:30 mindestens 1 Pp besser (schlechter) als SPY -> long (short) bis Schluss',
    aus: { art: 'schluss' },
    sig: function (k, i, ctx) {
      if (!ctx.spy || !ctx.spy.length || !eroeffnungDa(k, ctx) || !ersteIm(k, i, ctx, 59, 60)) return 0;
      var s = ctx.spy, s0 = s[0];
      if (m(s0, ctx) !== 0) return 0;
      var sc = null;                                         // nur der Zeitstempel einer spaeteren SPY-Kerze wird gelesen, nie ihr Kurs
      for (var j = 0; j < s.length && s[j][0] <= k[i][0]; j++) sc = s[j];
      if (!sc) return 0;
      var rs = (k[i][1] / k[0][5] - 1) - (sc[1] / s0[5] - 1);
      return rs >= 0.01 ? 1 : rs <= -0.01 ? -1 : 0;
    },
  },
  {
    key: 'zehnUhrUmkehr', name: 'Zehn-Uhr-Umkehr',
    quelle: 'verbreitete Praxis "10 o\'clock reversal": Eroeffnungsbewegung 09:30->10:00 >= 1 % wird gegengehandelt, 60 Minuten',
    aus: { art: 'minuten', min: 60 },
    sig: function (k, i, ctx) {
      if (!eroeffnungDa(k, ctx) || !ersteIm(k, i, ctx, 29, 30)) return 0;
      var r = k[i][1] / k[0][5] - 1;
      return r >= 0.01 ? -1 : r <= -0.01 ? 1 : 0;
    },
  },
];

/** Erste Signalkerze des Tages: {i, dir} oder null. Folgekerze muss existieren. */
function erstesSignal(S, k, ctx) {
  for (var i = 0; i < k.length - 1; i++) {
    var d = S.sig(k, i, ctx);
    if (d) return { i: i, dir: d };
  }
  return null;
}

/** Ein Handel: Einstieg Eroeffnung k[i+1], Ausstieg nach S.aus. Rueckgabe {ein, aus, mEin, mAus, r (Pp brutto)}. */
function handel(S, k, i, dir, ctx) {
  var e = i + 1, ein = k[e][5], mEin = m(k[e], ctx), last = k[k.length - 1];
  var aus = null, mAus = null;
  if (S.aus.art === 'minuten') {
    for (var j = e + 1; j < k.length; j++) if (m(k[j], ctx) >= mEin + S.aus.min) { aus = k[j][5]; mAus = m(k[j], ctx); break; }
  } else if (S.aus.art === 'ziel') {
    var z = S.ziel(k, i, ctx);
    for (var q = e; q < k.length - 1; q++) {
      if ((dir > 0 && k[q][3] >= z) || (dir < 0 && k[q][4] <= z)) { aus = k[q + 1][5]; mAus = m(k[q + 1], ctx); break; }
    }
  }
  if (aus == null) { aus = last[1]; mAus = ctx.soll; }        // bis Schluss: Schluss der letzten regulaeren Kerze
  return { ein: ein, aus: aus, mEin: mEin, mAus: mAus, r: dir * (aus - ein) / ein * 100 };
}

/** Placebo laut Auftragstext, NUR NACHRICHTLICH (REGEL §5): Mittel ueber `zuege` Zufallseinstiege desselben Tages,
 *  gleiche Haltedauer H, gleiche Richtung. Verzerrt: Fenster VOR dem Signal tragen die Signalbedingung (test.js,
 *  Zufallsweg: |t| bis 14 ohne jede Kante). */
function placebo(k, H, dir, ctx, z, zuege) {
  var s = 0, n = 0, last = k[k.length - 1], spanne = Math.max(1, ctx.soll - H);
  for (var d = 0; d < zuege; d++) {
    var mz = 1 + Math.floor(z() * spanne);
    if (mz > ctx.soll - 1) mz = ctx.soll - 1;
    var e = -1;
    for (var j = 0; j < k.length - 1; j++) if (m(k[j], ctx) >= mz) { e = j; break; }
    if (e < 0) continue;
    var ein = k[e][5], mE = m(k[e], ctx), aus = null;
    if (mE + H < ctx.soll) for (var q = e + 1; q < k.length; q++) if (m(k[q], ctx) >= mE + H) { aus = k[q][5]; break; }
    if (aus == null) aus = last[1];
    s += dir * (aus - ein) / ein * 100; n++;
  }
  return n ? s / n : null;
}

/** Ertrag eines Uhrzeit-Fensters an einem Tag: Einstieg Eroeffnung der ersten Kerze ab mEin, Ausstieg Eroeffnung
 *  der ersten Kerze ab mAus (mAus >= soll: Schluss der letzten Kerze). null, wenn der Tag das Fenster nicht hat. */
function fensterErtrag(k, ctx, mEin, mAus, dir) {
  var e = -1;
  for (var j = 0; j < k.length - 1; j++) if (m(k[j], ctx) >= mEin) { e = j; break; }
  if (e < 0) return null;
  var ein = k[e][5], aus = null;
  if (mAus < ctx.soll) for (var q = e + 1; q < k.length; q++) if (m(k[q], ctx) >= mAus) { aus = k[q][5]; break; }
  if (aus == null) aus = k[k.length - 1][1];
  return dir * (aus - ein) / ein * 100;
}
/** Placebo der REGEL (§5, Abweichung vom Auftrag): derselbe Wert, dieselbe Uhrzeit (Ein- und Ausstiegsminute),
 *  dieselbe Richtung, Mittel ueber die ANDEREN Tage derselben Phase. tage = [{k, ctx}], ohne = Index des Signaltags. */
function placeboUhrzeit(tage, ohne, mEin, mAus, dir) {
  var s = 0, n = 0;
  for (var d = 0; d < tage.length; d++) {
    if (d === ohne) continue;
    var r = fensterErtrag(tage[d].k, tage[d].ctx, mEin, mAus, dir);
    if (r != null) { s += r; n++; }
  }
  return n ? s / n : null;
}

module.exports = { SETUPS: SETUPS, erstesSignal: erstesSignal, handel: handel, placebo: placebo, placeboUhrzeit: placeboUhrzeit,
  fensterErtrag: fensterErtrag, minute: m };

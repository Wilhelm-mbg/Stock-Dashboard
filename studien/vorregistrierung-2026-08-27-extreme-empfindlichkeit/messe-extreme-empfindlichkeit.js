'use strict';
/* Extreme-Empfindlichkeit (Auftrag PM 27.08. abends): Verschieben die strittigen
 * Hoch/Tief-Tage (QS-Zensus: 3,05 % echte Widersprueche > 0,2 %, Tief 2x so oft)
 * das rsi2seit-mcp-Messergebnis? VORREGISTRIERUNG.md in diesem Ordner, Commit
 * da47a89 VOR diesem Bau. Anordnung nach dem Docht-Muster (gepaart, A/B):
 *
 * - Arm A = archiv60m unveraendert; Arm B = Kopie, in der je Reihe auf STRITTIGEN
 *   Tagen nur die Extremtraeger-Kerzen docht-neutralisiert sind:
 *     strittiges Hoch -> H := max(O, C) der Tages-Hoch-Kerze(n)
 *     strittiges Tief -> T := min(O, C) der Tages-Tief-Kerze(n)
 *   Strittig: |Tages-H/L aus 60m gegen archiv1d| > 0,2 % auf der Seite; Skalen-Tage
 *   (rH, rL, rC einheitlich +-1 % und |rC-1| > 1 %) ausgenommen (QS-Kriterium).
 * - Strategien: rsi2seit-mcp (einziger H/T-Leser im Messpfad: stopNiveau aus hoch,
 *   Stopp-Ausfuehrung gegen tief) und kapitulation (schlusskurs-blind) als
 *   NEGATIVKONTROLLE: |Delta| >= 1/4 delta80_A dort -> LAUF UNGUELTIG.
 * - Massstab wie Docht-Studie: tragender Urteilswechsel ODER |Delta| >= delta80_A.
 * - KEIN Kanten-Urteil, nichts am Original geaendert, Kopie im Scratch.
 *
 * Aufrufe:
 *   node messe-extreme-empfindlichkeit.js                       (alles)
 *   node messe-extreme-empfindlichkeit.js --einzel <key> <A|B>  (intern)
 *   node messe-extreme-empfindlichkeit.js --vergleich           (nur Auswertung)
 */
var fs = require('fs'), path = require('path'), cp = require('child_process');

var REPO = 'C:/Users/Wilhe/Downloads/Stock-Dashboard';
var ARCHIV60M = 'E:/Markt-Dashboard-Archiv/archiv60m';
var ARCHIV1D = 'E:/Markt-Dashboard-Archiv/archiv1d';
var SCRATCH = process.env.EXTREM_SCRATCH ||
  'C:/Users/Wilhe/AppData/Local/Temp/claude/C--Users-Wilhe-AppData-Local-Programs-markt-dashboard/2267001b-6289-4367-91ad-6ce34f2043ab/scratchpad/archiv60m-extreme-neutral';
var HIER = __dirname;
var SCHWELLE_STREIT = 0.002, SKALA_TOL = 0.01;

var STRATEGIEN = {
  'rsi2seit-mcp': REPO + '/studien/messmaschine/strategien/rsi2seit-mcp.js',
  'kapitulation': REPO + '/studien/messmaschine/strategien/kapitulation.js'
};

function tag(ts) { return new Date(ts).toISOString().slice(0, 10); }

function wachhundOk() {
  var r = cp.spawnSync(process.execPath, [REPO + '/tools/archiv-wachhund.js', 'archiv60m'], { encoding: 'utf8', timeout: 300000 });
  console.log('[Wachhund archiv60m] Exit ' + r.status);
  if (r.status !== 0) { console.error('ABBRUCH: Wachhund Exit ' + r.status); return false; }
  return true;
}

function baueKopieNeutralisiert() {
  if (!fs.existsSync(SCRATCH)) fs.mkdirSync(SCRATCH, { recursive: true });
  var dateien = fs.readdirSync(ARCHIV60M).filter(function (f) { return f.indexOf('bars_60m_') === 0 && f.slice(-5) === '.json'; });
  var Z = { reihen: 0, ohne1d: 0, tageVerglichen: 0, tageStrittigH: 0, tageStrittigT: 0, tageSkala: 0,
            kerzenHNeutral: 0, kerzenTNeutral: 0, jeReihe: {} };
  dateien.forEach(function (f, i) {
    var j = JSON.parse(fs.readFileSync(path.join(ARCHIV60M, f), 'utf8'));
    var sym = j.sym || f.slice(9, -5);
    Z.reihen++;
    var d1p = path.join(ARCHIV1D, 'bars_1d_' + sym + '.json');
    var tages = null;
    if (fs.existsSync(d1p)) {
      try {
        var j1 = JSON.parse(fs.readFileSync(d1p, 'utf8'));
        tages = {};
        (j1.bars || j1.series || []).forEach(function (z) {
          if (z[1] > 0) tages[tag(z[0])] = { h: z[3], l: z[4], c: z[1] };
        });
      } catch (e) { tages = null; }
    }
    if (!tages) { Z.ohne1d++; fs.writeFileSync(path.join(SCRATCH, f), JSON.stringify(j)); return; }

    /* 60m je Tag gruppieren (Indizes) */
    var proTag = {};
    j.series.forEach(function (z, k) { (proTag[tag(z[0])] || (proTag[tag(z[0])] = [])).push(k); });

    var neutralH = 0, neutralT = 0;
    Object.keys(proTag).forEach(function (T) {
      var d1 = tages[T]; if (!d1 || !(d1.h > 0) || !(d1.l > 0)) return;
      var idx = proTag[T];
      var h60 = -Infinity, l60 = Infinity, c60 = null;
      idx.forEach(function (k) {
        var z = j.series[k];
        if (z[3] > h60) h60 = z[3];
        if (z[4] > 0 && z[4] < l60) l60 = z[4];
        c60 = z[1];                                   /* letzte Kerze des Tages */
      });
      if (!(h60 > 0) || !(l60 < Infinity) || !(c60 > 0)) return;
      Z.tageVerglichen++;
      var rH = h60 / d1.h, rL = l60 / d1.l, rC = c60 / d1.c;
      /* Skalen-Tag (QS): Verhaeltnisse einheitlich und fern der 1 */
      if (Math.abs(rH - rC) <= SKALA_TOL && Math.abs(rL - rC) <= SKALA_TOL && Math.abs(rC - 1) > SKALA_TOL) { Z.tageSkala++; return; }
      var streitH = Math.abs(rH - 1) > SCHWELLE_STREIT;
      var streitT = Math.abs(rL - 1) > SCHWELLE_STREIT;
      if (!streitH && !streitT) return;
      if (streitH) {
        Z.tageStrittigH++;
        idx.forEach(function (k) {
          var z = j.series[k];
          if (z[3] === h60) { var o = z[5] > 0 ? z[5] : z[1]; var neu = Math.max(o, z[1]); if (neu < z[3]) { z[3] = neu; neutralH++; } }
        });
      }
      if (streitT) {
        Z.tageStrittigT++;
        idx.forEach(function (k) {
          var z = j.series[k];
          if (z[4] === l60) { var o2 = z[5] > 0 ? z[5] : z[1]; var neu2 = Math.min(o2, z[1]); if (neu2 > z[4]) { z[4] = neu2; neutralT++; } }
        });
      }
    });
    Z.kerzenHNeutral += neutralH; Z.kerzenTNeutral += neutralT;
    if (neutralH + neutralT > 0) Z.jeReihe[sym] = { h: neutralH, t: neutralT };
    fs.writeFileSync(path.join(SCRATCH, f), JSON.stringify(j));
    if ((i + 1) % 500 === 0) console.log('  Kopie: ' + (i + 1) + '/' + dateien.length);
  });
  fs.writeFileSync(HIER + '/strittige-zaehlung.json', JSON.stringify(Z, null, 1));
  console.log('[Kopie] ' + Z.reihen + ' Reihen (' + Z.ohne1d + ' ohne 1d unveraendert), ' + Z.tageVerglichen +
    ' Tage verglichen, strittig H ' + Z.tageStrittigH + ' / T ' + Z.tageStrittigT + ' (' +
    (100 * (Z.tageStrittigH + Z.tageStrittigT) / Math.max(1, Z.tageVerglichen)).toFixed(2) + ' % der Tage), Skala uebersprungen ' + Z.tageSkala +
    ', Kerzen neutralisiert H ' + Z.kerzenHNeutral + ' / T ' + Z.kerzenTNeutral);
  return Z;
}

function einzelLauf(key, arm) {
  process.env.STOCK_DASHBOARD_QUELLE = REPO;
  var M = require(REPO + '/studien/messmaschine/messmaschine.js');
  var S = require(STRATEGIEN[key]);
  var archiv = arm === 'A' ? ARCHIV60M : SCRATCH;
  console.log('[' + key + ' / Arm ' + arm + '] Archiv: ' + archiv + '  Maschine ' + M.VERFAHREN.version);
  var r = M.messe(S, archiv);
  if (r && r.verweigert) { console.error('VERWEIGERT: ' + r.grund); process.exit(4); }
  fs.writeFileSync(HIER + '/' + key + '-' + arm + '.json', JSON.stringify(r, null, 1));
  console.log('  bestesUrteil: ' + r.bestesUrteil + '  Placebo t ' + (r.placebo ? r.placebo.t.toFixed(3) : '-'));
}

function urteilVon(prot, i) {
  var e = (prot.entscheidungen || []).filter(function (x) { return x.regel === 'Urteil Variante ' + i; })[0];
  return e ? { urteil: e.ergebnis.urteil, delta80: e.ergebnis.delta80 } : null;
}
function pp(x) { return x == null ? '-' : ((x >= 0 ? '+' : '') + (x * 100).toFixed(4)); }

function vergleich() {
  var gesamt = { massstab: 'VORREGISTRIERUNG.md (da47a89): tragender Wechsel ODER |Delta| >= delta80_A; kapitulation Negativkontrolle < 1/4 delta80_A', strategien: {}, gemessenAm: new Date().toISOString() };
  Object.keys(STRATEGIEN).forEach(function (key) {
    var pa = HIER + '/' + key + '-A.json', pb = HIER + '/' + key + '-B.json';
    if (!fs.existsSync(pa) || !fs.existsSync(pb)) { console.log(key + ': Laeufe fehlen'); return; }
    var A = JSON.parse(fs.readFileSync(pa, 'utf8')), B = JSON.parse(fs.readFileSync(pb, 'utf8'));
    var schwelleA = (function () {
      var e = (A.entscheidungen || []).filter(function (x) { return x.regel === 'B4 Bonferroni'; })[0];
      return e ? e.ergebnis.schwelleT : 1.96;
    })();
    var wechsel = [], grosse = [], rand = [], zeilen = [], kontrolleVerletzt = [];
    A.ergebnisse.forEach(function (ea, i) {
      var eb = B.ergebnisse[i]; if (!eb) return;
      var ua = urteilVon(A, i), ub = urteilVon(B, i);
      var ba = ea.bestaetigung.ueberschuss, bb = eb.bestaetigung.ueberschuss;
      var d = (bb.tagesmittel != null && ba.tagesmittel != null) ? bb.tagesmittel - ba.tagesmittel : null;
      var g = d != null && ua && ua.delta80 != null && Math.abs(d) >= ua.delta80;
      var w = ua && ub && ua.urteil !== ub.urteil;
      var marge = null;
      if (w && ba.tagesmittel != null) {
        var bMDE = ba.mde != null ? Math.abs(Math.abs(ba.tagesmittel) - ba.mde) : Infinity;
        var seA = (ba.t && ba.tagesmittel) ? Math.abs(ba.tagesmittel / ba.t) : null;
        var bT = seA != null ? Math.abs(Math.abs(ba.t) - schwelleA) * seA : Infinity;
        marge = Math.min(bMDE, bT);
      }
      var tragend = w && (g || (marge != null && marge > 0.0001));
      if (tragend) wechsel.push(i); else if (w) rand.push(i);
      if (g) grosse.push(i);
      if (key === 'kapitulation' && d != null && ua && ua.delta80 != null && Math.abs(d) >= ua.delta80 / 4) kontrolleVerletzt.push(i);
      zeilen.push({ variante: i, urteilA: ua && ua.urteil, urteilB: ub && ub.urteil, wechselTragend: !!tragend,
        wechselRand: !!(w && !tragend), margeA: marge,
        tagesmittelA: ba.tagesmittel, tagesmittelB: bb.tagesmittel, delta: d, delta80A: ua && ua.delta80,
        tA: ba.t, tB: bb.t, signaleA: ba.signale, signaleB: bb.signale });
      console.log(key + ' Var' + i + ': ' + (ua && ua.urteil) + ' -> ' + (ub && ub.urteil) +
        (tragend ? '  *** URTEILSWECHSEL (tragend) ***' : (w ? '  (Randrauschen, Marge ' + pp(marge) + ' Pp)' : '')) +
        '   Ueberschuss ' + pp(ba.tagesmittel) + ' -> ' + pp(bb.tagesmittel) + '  Delta ' + pp(d) +
        ' (delta80_A ' + pp(ua && ua.delta80) + (g ? '  *** GROSS ***' : '') + ')' +
        '   Signale ' + ba.signale + ' -> ' + bb.signale);
    });
    var urteilStrategie;
    if (key === 'kapitulation') {
      urteilStrategie = kontrolleVerletzt.length ? 'NEGATIVKONTROLLE VERLETZT - LAUF UNGUELTIG' : 'Negativkontrolle bestanden';
    } else {
      urteilStrategie = (wechsel.length || grosse.length) ? 'verschiebt (tragend)' : 'verschiebt nicht messbar';
    }
    console.log('  => ' + key + ': ' + urteilStrategie + '\n');
    gesamt.strategien[key] = { urteil: urteilStrategie, zeilen: zeilen, tragendeWechsel: wechsel, grosseDeltas: grosse,
      randwechsel: rand, kontrolleVerletzt: kontrolleVerletzt };
  });
  fs.writeFileSync(HIER + '/vergleich.json', JSON.stringify(gesamt, null, 1));
  console.log('vergleich.json geschrieben. NICHTS am Original-Archiv geaendert.');
}

/* ================= Ablauf ================= */
var argEinzel = process.argv.indexOf('--einzel');
if (argEinzel >= 0) { einzelLauf(process.argv[argEinzel + 1], process.argv[argEinzel + 2]); process.exit(0); }
if (process.argv.indexOf('--vergleich') >= 0) { vergleich(); process.exit(0); }

if (!wachhundOk()) process.exit(2);
console.log('Baue neutralisierte Kopie (strittige Extreme) ...');
baueKopieNeutralisiert();
var folge = [];
Object.keys(STRATEGIEN).forEach(function (k) { folge.push([k, 'A'], [k, 'B']); });
for (var i = 0; i < folge.length; i++) {
  var r = cp.spawnSync(process.execPath, ['--max-old-space-size=6144', __filename, '--einzel', folge[i][0], folge[i][1]],
    { encoding: 'utf8', stdio: 'inherit', timeout: 3600000 });
  if (r.status !== 0) { console.error('ABBRUCH: Lauf ' + folge[i].join('/') + ' Exit ' + r.status); process.exit(3); }
}
vergleich();

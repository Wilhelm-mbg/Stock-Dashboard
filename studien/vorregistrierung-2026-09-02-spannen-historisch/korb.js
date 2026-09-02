'use strict';
/* ================= Zusatz A: der Momentum-Korb, nachgebaut =================
 *
 * Das Lauf-JSON der Studie vorregistrierung-2026-09-02-momentum-liquide fuehrt je Periode
 * nur `korbN` - WELCHE Werte im Korb lagen, steht nirgends. Fuer die Spannenfrage ("was
 * kostet eine Umschichtung wirklich?") braucht es die Namen, also wird der Korb aus dem
 * Archiv nachgebaut.
 *
 * DER NACHBAU IST NICHT ZU GLAUBEN, SONDERN ZU PRUEFEN. Er gilt nur, wenn er je Periode
 * EXAKT dasselbe korbN liefert wie lauf-2026-09-01-22-52.json. Das ist die Positivkontrolle
 * dieses Zusatzes (Registrierung §6, Zusatz A). Schlaegt sie fehl, entfaellt Zusatz A und
 * wird als entfallen berichtet - es wird NICHT mit einem anderen Korb weitergerechnet.
 *
 * Die Regel ist woertlich periode()/korbBilden() aus messen.js der Vorbildstudie:
 *   Rueckblick 231 Handelstage, Luecke 21, Halten 63, staerkste 10 %, Phase 0,
 *   Staerke = Schluss[i-21] / Schluss[i-231] - 1, Liquiditaetsfilter >= 100 Mio $ VOR der
 *   Rangbildung, Mindestzahl zulaessiger Werte 100.
 * Der Universumsrahmen dort ist archiv1d PLUS massive/tagesdaten (die Verschwundenen) -
 * wer nur archiv1d nimmt, bekommt einen anderen Korb, und genau das faengt die Kontrolle.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */

var fs = require('fs');
var path = require('path');
var St = require('./stichprobe.js');
var WP = require(path.join(__dirname, '..', 'messmaschine', 'strategien', 'wertpapierart.js'));

var VORBILD = path.join(__dirname, '..', 'vorregistrierung-2026-09-02-momentum-liquide',
                        'lauf-2026-09-01-22-52.json');

/* Woertlich aus dem Vorbild. Wer eine Zahl aendert, baut einen anderen Korb nach. */
var RUECKBLICK = 231, LUECKE = 21, HALTEN = 63, ANTEIL = 0.10, MINDEST_WERTE = 100;
var MERKMAL_START = RUECKBLICK;
var UMSATZ_MIN = 100000000;

function median(a) {
  var s = a.slice().sort(function (x, y) { return x - y; });
  return s.length ? s[s.length >> 1] : NaN;
}

/** Alle Reihen laden: archiv1d + massive/tagesdaten, nur CS/ADRC, wie im Vorbild. */
function ladeAlles() {
  var reihen = {}, zaehl = { archiv: 0, verschwunden: 0, keineAktie: 0, zuKurz: 0 };
  var dateien;
  try { dateien = fs.readdirSync(St.ARCHIV).filter(function (f) { return /^bars_1d_.+\.json$/.test(f); }); }
  catch (e) { dateien = []; }
  dateien.forEach(function (f) {
    var sym = f.slice(8, -5);
    if (!WP.istAktie(sym)) { zaehl.keineAktie++; return; }
    var R = St.reiheLesen(sym);
    if (!R || R.b.length < MERKMAL_START + 2) { zaehl.zuKurz++; return; }
    reihen[sym] = R; zaehl.archiv++;
  });
  var ordner = path.join(St.MASSIVE, 'tagesdaten');
  var vd;
  try { vd = fs.readdirSync(ordner).filter(function (f) { return f.slice(-5) === '.json'; }); }
  catch (e) { vd = []; }
  vd.forEach(function (f) {
    var sym = f.slice(0, -5);
    if (reihen[sym]) return;
    if (!WP.istAktie(sym)) { zaehl.keineAktie++; return; }
    var j; try { j = JSON.parse(fs.readFileSync(path.join(ordner, f), 'utf8')); } catch (e) { return; }
    var s = j && (j.series || j.bars);
    if (!Array.isArray(s) || s.length < MERKMAL_START + 2) { zaehl.zuKurz++; return; }
    var tage = [], bs = [];
    for (var i = 0; i < s.length; i++) {
      if (!s[i] || !(s[i][1] > 0)) continue;
      tage.push(new Date(s[i][0]).toISOString().slice(0, 10));
      bs.push(s[i]);
    }
    if (bs.length < MERKMAL_START + 2) { zaehl.zuKurz++; return; }
    reihen[sym] = { sym: sym, tage: tage, b: bs }; zaehl.verschwunden++;
  });
  return { reihen: reihen, zaehl: zaehl };
}

/** Der Korb an einem Umschichtungstag. Gibt {korb, n} oder null, wenn zu wenige Werte. */
function korbAm(reihen, startTag) {
  var kand = [];
  var syms = Object.keys(reihen);
  for (var si = 0; si < syms.length; si++) {
    var R = reihen[syms[si]];
    var i = R.tage.indexOf(startTag);
    if (i < 0) continue;                             /* der Wert handelte an diesem Tag nicht */
    var von = i - MERKMAL_START, bis = i - LUECKE;
    if (von < 0) continue;
    var a = R.b[von][1], m2 = R.b[bis][1], p0 = R.b[i][1];
    if (!(a > 0) || !(m2 > 0) || !(p0 > 0)) continue;
    var ums = [];
    for (var q = Math.max(0, i - 19); q <= i; q++) ums.push((R.b[q][1] || 0) * (R.b[q][2] || 0));
    var umsatz = median(ums);
    if (!(umsatz >= UMSATZ_MIN)) continue;
    kand.push({ sym: R.sym, staerke: m2 / a - 1, umsatz: umsatz });
  }
  if (kand.length < MINDEST_WERTE) return null;
  kand.sort(function (x, y) { return y.staerke - x.staerke; });
  var n = Math.max(1, Math.round(kand.length * ANTEIL));
  return { korb: kand.slice(0, n), n: kand.length };
}

/** Nachbau gegen das Lauf-JSON halten. Gibt {ok, perioden:[{tag, korbN, soll, korb}], abw} */
function pruefen(abJahr) {
  var vj = JSON.parse(fs.readFileSync(VORBILD, 'utf8'));
  var soll = vj.perioden.filter(function (P) { return P.tag >= (abJahr || 2016) + '-01-01'; });
  var L = ladeAlles();
  var out = [], abw = 0;
  for (var i = 0; i < soll.length; i++) {
    var K = korbAm(L.reihen, soll[i].tag);
    var korbN = K ? K.korb.length : 0;
    if (korbN !== soll[i].korbN) abw++;
    out.push({ tag: soll[i].tag, sollKorbN: soll[i].korbN, sollN: soll[i].n,
               korbN: korbN, n: K ? K.n : 0,
               korb: K ? K.korb.map(function (x) { return x.sym; }) : [] });
  }
  return { ok: abw === 0, abweichungen: abw, perioden: out, zaehl: L.zaehl };
}

module.exports = { pruefen: pruefen, korbAm: korbAm, ladeAlles: ladeAlles, VORBILD: VORBILD };

if (require.main === module) {
  var r = pruefen(2016);
  process.stdout.write('Reihen: ' + JSON.stringify(r.zaehl) + '\n');
  process.stdout.write('Perioden ab 2016: ' + r.perioden.length + '   Abweichungen im korbN: ' + r.abweichungen + '\n');
  r.perioden.slice(0, 8).forEach(function (P) {
    process.stdout.write('  ' + P.tag + '  soll korbN ' + P.sollKorbN + '/' + P.sollN +
                         '   hier ' + P.korbN + '/' + P.n + (P.korbN === P.sollKorbN ? '  ok' : '  ABWEICHUNG') + '\n');
  });
  process.stdout.write(r.ok ? '\nPositivkontrolle BESTANDEN - Zusatz A darf rechnen.\n'
                            : '\nPositivkontrolle VERFEHLT - Zusatz A entfaellt.\n');
}
